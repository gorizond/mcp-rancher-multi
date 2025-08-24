// mcp-rancher-multi — MCP server for Rancher (multi-server) + Fleet GitOps tools
// License: MIT

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// ---- ENV-based configuration ----
export type RancherServerConfig = {
  id: string;                 // short id (e.g. "prod", "lab")
  name?: string;              // human friendly name
  baseUrl: string;            // https://rancher.example.com
  token: string;              // API token; supports ${ENV:NAME}
  insecureSkipTlsVerify?: boolean;
  caCertPemBase64?: string;   // optional custom CA (base64 PEM)
};

function resolveToken(tok: string): string {
  const m = tok?.match(/^\$\{ENV:([A-Za-z_][A-Za-z0-9_]*)\}$/);
  if (m) return process.env[m[1]] || "";
  return tok;
}

function loadConfigFromEnv(): Record<string, RancherServerConfig> {
  const config: Record<string, RancherServerConfig> = {};
  
  // Look for RANCHER_SERVERS environment variable
  const serversEnv = process.env.RANCHER_SERVERS;
  if (serversEnv) {
    try {
      const servers = JSON.parse(serversEnv);
      for (const [id, serverConfig] of Object.entries(servers)) {
        config[id] = serverConfig as RancherServerConfig;
      }
    } catch (e) {
      console.warn("Cannot parse RANCHER_SERVERS JSON:", e);
    }
  }
  
  // Look for individual server configurations
  // Format: RANCHER_SERVER_<ID>_<PROPERTY>
  const envVars = Object.keys(process.env);
  const serverPattern = /^RANCHER_SERVER_([A-Za-z0-9_]+)_(.+)$/;
  
  for (const envVar of envVars) {
    const match = envVar.match(serverPattern);
    if (match) {
      const [, serverId, property] = match;
      const propertyLower = property.toLowerCase();
      
             if (!config[serverId]) {
         config[serverId] = { 
           id: serverId,
           baseUrl: '', // Will be set below
           token: '' // Will be set below
         };
       }
      
      const value = process.env[envVar];
      if (value !== undefined) {
        switch (propertyLower) {
          case 'name':
            config[serverId].name = value;
            break;
          case 'baseurl':
            config[serverId].baseUrl = value;
            break;
          case 'token':
            config[serverId].token = value;
            break;
          case 'insecureskiptlsverify':
            config[serverId].insecureSkipTlsVerify = value.toLowerCase() === 'true';
            break;
          case 'cacertpembase64':
            config[serverId].caCertPemBase64 = value;
            break;
        }
      }
    }
  }
  
  return config;
}

const STORE = loadConfigFromEnv();

// ---- Minimal Rancher client (v3 + k8s proxy) ----
class RancherClient {
  baseUrl: string;
  token: string;
  insecure: boolean;
  caCertPemBase64?: string;

  constructor(cfg: RancherServerConfig) {
    this.baseUrl = cfg.baseUrl.replace(/\/$/, "");
    this.token = resolveToken(cfg.token);
    this.insecure = !!cfg.insecureSkipTlsVerify;
    this.caCertPemBase64 = cfg.caCertPemBase64;
  }

  private headers(extra?: Record<string, string>): HeadersInit {
    const h: Record<string, string> = {
      "Authorization": `Bearer ${this.token}`,
      "Accept": "application/json",
      ...extra,
    };
    return h;
  }

  private async requestJSON<T>(url: string, init?: RequestInit): Promise<T> {
    const res = await fetch(url, {
      ...init,
      headers: this.headers(init?.headers as Record<string, string> | undefined),
    } as RequestInit);
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status} ${res.statusText} — ${url}
${text}`);
    }
    return (await res.json()) as T;
  }

  async listClusters() {
    type Cluster = { id: string; name?: string; state?: string; provider?: string; [k: string]: any };
    type Result = { data: Cluster[] };
    const url = `${this.baseUrl}/v3/clusters`;
    const res = await this.requestJSON<Result>(url);
    return res.data;
  }

  async listNodes(clusterId?: string) {
    type Node = { id: string; nodeName?: string; clusterId?: string; state?: string; [k: string]: any };
    type Result = { data: Node[] };
    const p = clusterId ? `?clusterId=${encodeURIComponent(clusterId)}` : "";
    const url = `${this.baseUrl}/v3/nodes${p}`;
    const res = await this.requestJSON<Result>(url);
    return res.data;
  }

  async listProjects(clusterId: string) {
    type Project = { id: string; name?: string; clusterId?: string; [k: string]: any };
    type Result = { data: Project[] };
    const url = `${this.baseUrl}/v3/projects?clusterId=${encodeURIComponent(clusterId)}`;
    const res = await this.requestJSON<Result>(url);
    return res.data;
  }

  async generateKubeconfig(clusterId: string) {
    type KubeResp = { config: string };
    const url = `${this.baseUrl}/v3/clusters/${encodeURIComponent(clusterId)}?action=generateKubeconfig`;
    const res = await this.requestJSON<KubeResp>(url, { method: "POST", headers: { "content-type": "application/json" } });
    return res.config;
  }

  async k8s(clusterId: string, k8sPath: string, init?: RequestInit) {
    const pathClean = k8sPath.startsWith("/") ? k8sPath : `/${k8sPath}`;
    const url = `${this.baseUrl}/k8s/clusters/${encodeURIComponent(clusterId)}${pathClean}`;
    const res = await fetch(url, {
      ...init,
      headers: this.headers({ "Accept": "application/json", ...(init?.headers as any) }),
    } as RequestInit);
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`K8s proxy HTTP ${res.status} ${res.statusText} — ${url}
${text}`);
    }
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) return res.json();
    return res.text();
  }

  async listNamespaces(clusterId: string) {
    const out = await this.k8s(clusterId, "/api/v1/namespaces");
    return (out as any)?.items ?? out;
  }
}

// ---- MCP server ----
const server = new McpServer({ name: "mcp-rancher-multi", version: "0.3.0" });

function getClient(serverId: string) {
  const cfg = STORE[serverId];
  if (!cfg) throw new Error(`Rancher server '${serverId}' not found`);
  return new RancherClient(cfg);
}

// ---- Tools: manage Rancher servers ----
server.registerTool(
  "rancher.servers.list",
  {
    title: "List registered Rancher servers",
    description: "Returns known servers from local store",
    inputSchema: z.object({}).shape
  },
  async () => ({ content: [{ type: "text", text: JSON.stringify(Object.values(STORE), null, 2) }] })
);

server.registerTool(
  "rancher.servers.add",
  {
    title: "Add/Update Rancher server (runtime only)",
    description: "Register a Rancher Manager for current session (not persisted)",
    inputSchema: z.object({
      id: z.string(),
      baseUrl: z.string().url(),
      token: z.string(),
      name: z.string().optional(),
      insecureSkipTlsVerify: z.boolean().optional(),
      caCertPemBase64: z.string().optional(),
    }).shape
  },
  async (args: any) => {
    const cfg: RancherServerConfig = { ...args } as any;
    STORE[cfg.id] = cfg;
    return { content: [{ type: "text", text: JSON.stringify(cfg, null, 2) }] };
  }
);

server.registerTool(
  "rancher.servers.remove",
  {
    title: "Remove Rancher server (runtime only)",
    description: "Deletes a server from current session (not persisted)",
    inputSchema: z.object({ id: z.string() }).shape
  },
  async ({ id }: { id: string }) => {
    if (!STORE[id]) throw new Error(`Server '${id}' not found`);
    const removed = STORE[id];
    delete STORE[id];
    return { content: [{ type: "text", text: JSON.stringify(removed, null, 2) }] };
  }
);

// ---- Tools: clusters / nodes / projects ----
server.registerTool(
  "rancher.clusters.list",
  {
    title: "List clusters",
    description: "Return clusters from selected Rancher server",
    inputSchema: z.object({ serverId: z.string() }).shape
  },
  async ({ serverId }: { serverId: string }) => {
    const client = getClient(serverId);
    const data = await client.listClusters();
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

server.registerTool(
  "rancher.clusters.kubeconfig",
  {
    title: "Generate kubeconfig for a cluster",
    description: "POST /v3/clusters/{id}?action=generateKubeconfig",
    inputSchema: z.object({ serverId: z.string(), clusterId: z.string() }).shape
  },
  async ({ serverId, clusterId }: { serverId: string; clusterId: string }) => {
    const client = getClient(serverId);
    const kubeconfig = await client.generateKubeconfig(clusterId);
    return { content: [{ type: "text", text: kubeconfig }] };
  }
);

server.registerTool(
  "rancher.nodes.list",
  {
    title: "List nodes",
    description: "Return nodes (v3/nodes)",
    inputSchema: z.object({ serverId: z.string(), clusterId: z.string().optional() }).shape
  },
  async ({ serverId, clusterId }: { serverId: string; clusterId?: string }) => {
    const client = getClient(serverId);
    const data = await client.listNodes(clusterId);
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

server.registerTool(
  "rancher.projects.list",
  {
    title: "List projects",
    description: "Return projects in cluster (v3/projects)",
    inputSchema: z.object({ serverId: z.string(), clusterId: z.string() }).shape
  },
  async ({ serverId, clusterId }: { serverId: string; clusterId: string }) => {
    const client = getClient(serverId);
    const data = await client.listProjects(clusterId);
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

// ---- Tools: Kubernetes via Rancher proxy ----
server.registerTool(
  "k8s.namespaces.list",
  {
    title: "K8s: list namespaces",
    description: "GET /api/v1/namespaces via Rancher proxy",
    inputSchema: z.object({ serverId: z.string(), clusterId: z.string() }).shape
  },
  async ({ serverId, clusterId }: { serverId: string; clusterId: string }) => {
    const client = getClient(serverId);
    const data = await client.listNamespaces(clusterId);
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

server.registerTool(
  "k8s.raw",
  {
    title: "K8s: raw HTTP via Rancher proxy",
    description: "Arbitrary request to /api or /apis (DANGEROUS) — use carefully",
    inputSchema: z.object({
      serverId: z.string(),
      clusterId: z.string(),
      path: z.string().describe("E.g. /api/v1/pods?limit=50"),
      method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]).default("GET"),
      body: z.string().optional(),
      contentType: z.string().optional().default("application/json")
    }).shape
  },
  async ({ serverId, clusterId, path: p, method, body, contentType }: any) => {
    const client = getClient(serverId);
    const init: RequestInit = { method, headers: { "content-type": contentType || "application/json" } };
    if (body) (init as any).body = body;
    const res = await client.k8s(clusterId, p, init);
    const text = typeof res === "string" ? res : JSON.stringify(res, null, 2);
    return { content: [{ type: "text", text }] };
  }
);

// ---- Tools: Health & kubeconfig merge ----
server.registerTool(
  "rancher.health",
  {
    title: "Rancher health",
    description: "Check /v3 endpoint",
    inputSchema: z.object({ serverId: z.string() }).shape
  },
  async ({ serverId }: { serverId: string }) => {
    const cfg = STORE[serverId];
    if (!cfg) throw new Error(`Server '${serverId}' not found`);
    const res = await fetch(`${cfg.baseUrl.replace(/\/$/, "")}/v3`, { headers: { Authorization: `Bearer ${resolveToken(cfg.token)}` } });
    return { content: [{ type: "text", text: `HTTP ${res.status} ${res.statusText}` }] };
  }
);

server.registerTool(
  "rancher.kubeconfigs.merge",
  {
    title: "Kubeconfig: merge multiple clusters",
    description: "Concatenate generated kubeconfigs for a list of clusterIds",
    inputSchema: z.object({ serverId: z.string(), clusterIds: z.array(z.string()).nonempty() }).shape
  },
  async ({ serverId, clusterIds }: { serverId: string; clusterIds: string[] }) => {
    const client = getClient(serverId);
    const parts = await Promise.all(clusterIds.map((id: string) => client.generateKubeconfig(id)));
    const merged = parts.map((cfg, i) => `# --- kubeconfig #${i+1} for ${clusterIds[i]} ---\n${cfg}\n`).join("\n");
    return { content: [{ type: "text", text: merged }] };
  }
);

// ---- Tools: Fleet (GitOps) on Rancher local cluster by default ----
async function fleetApi(serverId: string, path: string, init?: RequestInit, clusterId = 'local') {
  const client = getClient(serverId);
  const clean = path.startsWith('/') ? path : `/${path}`;
  return client.k8s(clusterId, clean, init);
}

server.registerTool(
  "fleet.gitrepos.list",
  {
    title: "Fleet: list GitRepos",
    description: "GET /apis/fleet.cattle.io/v1alpha1/namespaces/{ns}/gitrepos",
    inputSchema: z.object({ serverId: z.string(), namespace: z.string().default('fleet-default'), clusterId: z.string().default('local') }).shape
  },
  async ({ serverId, namespace, clusterId }: any) => {
    const data = await fleetApi(serverId, `/apis/fleet.cattle.io/v1alpha1/namespaces/${namespace}/gitrepos`, undefined, clusterId);
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  }
);

server.registerTool(
  "fleet.gitrepos.get",
  {
    title: "Fleet: get GitRepo",
    description: "GET /apis/fleet.cattle.io/v1alpha1/namespaces/{ns}/gitrepos/{name}",
    inputSchema: z.object({ serverId: z.string(), namespace: z.string(), name: z.string(), clusterId: z.string().default('local') }).shape
  },
  async ({ serverId, namespace, name, clusterId }: any) => {
    const data = await fleetApi(serverId, `/apis/fleet.cattle.io/v1alpha1/namespaces/${namespace}/gitrepos/${name}`, undefined, clusterId);
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  }
);

server.registerTool(
  "fleet.gitrepos.create",
  {
    title: "Fleet: create GitRepo",
    description: "POST a GitRepo manifest (JSON)",
    inputSchema: z.object({
      serverId: z.string(),
      clusterId: z.string().default('local'),
      namespace: z.string().default('fleet-default'),
      body: z.string().describe('GitRepo JSON manifest')
    }).shape
  },
  async ({ serverId, clusterId, namespace, body }: any) => {
    const res = await fleetApi(serverId, `/apis/fleet.cattle.io/v1alpha1/namespaces/${namespace}/gitrepos`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body
    }, clusterId);
    return { content: [{ type: 'text', text: JSON.stringify(res, null, 2) }] };
  }
);

server.registerTool(
  "fleet.gitrepos.apply",
  {
    title: "Fleet: apply GitRepo (Server-Side Apply)",
    description: "PATCH application/apply-patch+yaml to GitRepo (idempotent)",
    inputSchema: z.object({
      serverId: z.string(),
      namespace: z.string().default('fleet-default'),
      name: z.string(),
      manifestYaml: z.string().describe('Full GitRepo manifest: apiVersion/kind/metadata/spec'),
      fieldManager: z.string().default('mcp-rancher-multi'),
      clusterId: z.string().default('local')
    }).shape
  },
  async ({ serverId, namespace, name, manifestYaml, fieldManager, clusterId }: any) => {
    const params = new URLSearchParams({ fieldManager, force: 'true' });
    const res = await fleetApi(
      serverId,
      `/apis/fleet.cattle.io/v1alpha1/namespaces/${namespace}/gitrepos/${name}?${params.toString()}`,
      { method: 'PATCH', headers: { 'content-type': 'application/apply-patch+yaml' }, body: manifestYaml },
      clusterId
    );
    const text = typeof res === 'string' ? res : JSON.stringify(res, null, 2);
    return { content: [{ type: 'text', text }] };
  }
);

server.registerTool(
  "fleet.gitrepos.redeploy",
  {
    title: "Fleet: force redeploy GitRepo",
    description: "PATCH merge-patch: set metadata.annotations['fleet.cattle.io/redeployHash']",
    inputSchema: z.object({ serverId: z.string(), namespace: z.string().default('fleet-default'), name: z.string(), clusterId: z.string().default('local') }).shape
  },
  async ({ serverId, namespace, name, clusterId }: any) => {
    const hash = Math.random().toString(36).slice(2);
    const body = JSON.stringify({ metadata: { annotations: { 'fleet.cattle.io/redeployHash': hash } } });
    const res = await fleetApi(
      serverId,
      `/apis/fleet.cattle.io/v1alpha1/namespaces/${namespace}/gitrepos/${name}`,
      { method: 'PATCH', headers: { 'content-type': 'application/merge-patch+json' }, body },
      clusterId
    );
    return { content: [{ type: 'text', text: JSON.stringify(res, null, 2) }] };
  }
);

server.registerTool(
  "fleet.bdeploys.list",
  {
    title: "Fleet: list BundleDeployments",
    description: "GET /apis/fleet.cattle.io/v1alpha1/bundledeployments (optional labelSelector)",
    inputSchema: z.object({ serverId: z.string(), labelSelector: z.string().optional(), clusterId: z.string().default('local') }).shape
  },
  async ({ serverId, labelSelector, clusterId }: any) => {
    const qs = labelSelector ? `?labelSelector=${encodeURIComponent(labelSelector)}` : '';
    const data = await fleetApi(serverId, `/apis/fleet.cattle.io/v1alpha1/bundledeployments${qs}`, undefined, clusterId);
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  }
);

server.registerTool(
  "fleet.status.summary",
  {
    title: "Fleet: status summary",
    description: "Aggregate Ready/NonReady from BundleDeployments and link to GitRepos",
    inputSchema: z.object({ serverId: z.string(), namespace: z.string().default('fleet-default'), clusterId: z.string().default('local') }).shape
  },
  async ({ serverId, namespace, clusterId }: any) => {
    const [repos, bds] = await Promise.all([
      fleetApi(serverId, `/apis/fleet.cattle.io/v1alpha1/namespaces/${namespace}/gitrepos`, undefined, clusterId),
      fleetApi(serverId, `/apis/fleet.cattle.io/v1alpha1/bundledeployments`, undefined, clusterId)
    ]);

    const out = {
      gitrepos: (repos as any)?.items?.map((r: any) => ({
        name: r?.metadata?.name,
        namespace: r?.metadata?.namespace,
        repo: r?.spec?.repo,
        branch: r?.spec?.branch,
        paths: r?.spec?.paths,
        paused: r?.spec?.paused || false,
        conditions: r?.status?.conditions || []
      })) || [],
      bundleDeployments: (bds as any)?.items?.map((bd: any) => ({
        name: bd?.metadata?.name,
        namespace: bd?.metadata?.namespace,
        summary: bd?.status?.summary,
        ready: bd?.status?.ready,
        nonReady: bd?.status?.nonReady,
        desiredReady: bd?.status?.desiredReady,
        display: bd?.status?.display
      })) || []
    };

    return { content: [{ type: 'text', text: JSON.stringify(out, null, 2) }] };
  }
);

// ---- Start server ----
const transport = new StdioServerTransport();
await server.connect(transport);
console.error(`[mcp-rancher-multi] started. Store: ${JSON.stringify(STORE, null, 2)}`);
