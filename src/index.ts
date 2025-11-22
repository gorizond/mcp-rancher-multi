// mcp-rancher-multi — MCP server for Rancher (multi-server) + Fleet GitOps tools
// License: MIT

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { loadEnvFiles, loadConfigFromEnv, resolveToken, obfuscateConfig, stripMetadataManagedFields, type RancherServerConfig } from "./utils.js";
import { RancherClient, type K8sRawOptions } from "./rancher-client.js";

// ---- Load .env files first ----
loadEnvFiles();

// ---- Load configuration from environment ----
const STORE = loadConfigFromEnv();

// ---- MCP server ----
const server = new McpServer({ name: "mcp-rancher-multi", version: "0.3.0" });

const toJsonText = (data: any, strip = true) => JSON.stringify(strip ? stripMetadataManagedFields(data) : data, null, 2);

const buildPath = (path: string, params: Record<string, string | undefined>) => {
  const url = new URL(path.startsWith('/') ? `http://dummy${path}` : `http://dummy/${path}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') url.searchParams.set(key, value);
  }
  return `${url.pathname}${url.search}`;
};

function getClient(serverId: string) {
  const cfg = STORE[serverId];
  if (!cfg) throw new Error(`Rancher server '${serverId}' not found`);
  return new RancherClient(cfg);
}

// ---- Tools: manage Rancher servers ----
server.registerTool(
  "rancher_servers_list",
  {
    title: "List registered Rancher servers",
    description: "Returns known servers from local store",
    inputSchema: z.object({}).shape
  },
  async () => ({ content: [{ type: "text", text: toJsonText(Object.values(obfuscateConfig(STORE))) }] })
);

server.registerTool(
  "rancher_servers_add",
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
    return { content: [{ type: "text", text: toJsonText(obfuscateConfig({ [cfg.id]: cfg })[cfg.id]) }] };
  }
);

server.registerTool(
  "rancher_servers_remove",
  {
    title: "Remove Rancher server (runtime only)",
    description: "Deletes a server from current session (not persisted)",
    inputSchema: z.object({ id: z.string() }).shape
  },
  async ({ id }: { id: string }) => {
    if (!STORE[id]) throw new Error(`Server '${id}' not found`);
    const removed = STORE[id];
    delete STORE[id];
    return { content: [{ type: "text", text: toJsonText(obfuscateConfig({ [id]: removed })[id]) }] };
  }
);

// ---- Tools: clusters / nodes / projects ----
server.registerTool(
  "rancher_clusters_list",
  {
    title: "List clusters",
    description: "Return clusters from selected Rancher server",
    inputSchema: z.object({
      serverId: z.string(),
      summary: z.boolean().default(false),
      stripKeys: z.array(z.string()).optional()
    }).shape
  },
  async ({ serverId, summary, stripKeys }: { serverId: string; summary?: boolean; stripKeys?: string[] }) => {
    const client = getClient(serverId);
    const data = await client.listClusters({ summary, stripKeys });
    return { content: [{ type: "text", text: toJsonText(data, true) }] };
  }
);

server.registerTool(
  "rancher_cluster_get",
  {
    title: "Get cluster",
    description: "Return a single cluster by id",
    inputSchema: z.object({
      serverId: z.string(),
      clusterId: z.string(),
      summary: z.boolean().default(false),
      stripKeys: z.array(z.string()).optional()
    }).shape
  },
  async ({ serverId, clusterId, summary, stripKeys }: { serverId: string; clusterId: string; summary?: boolean; stripKeys?: string[] }) => {
    const client = getClient(serverId);
    const data = await client.getCluster(clusterId, { summary, stripKeys });
    return { content: [{ type: "text", text: toJsonText(data) }] };
  }
);

server.registerTool(
  "rancher_clusters_kubeconfig",
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
  "rancher_nodes_list",
  {
    title: "List nodes",
    description: "Return nodes (v3/nodes)",
    inputSchema: z.object({ serverId: z.string(), clusterId: z.string().optional() }).shape
  },
  async ({ serverId, clusterId }: { serverId: string; clusterId?: string }) => {
    const client = getClient(serverId);
    const data = await client.listNodes(clusterId);
    return { content: [{ type: "text", text: toJsonText(data) }] };
  }
);

server.registerTool(
  "rancher_projects_list",
  {
    title: "List projects",
    description: "Return projects in cluster (v3/projects)",
    inputSchema: z.object({ serverId: z.string(), clusterId: z.string() }).shape
  },
  async ({ serverId, clusterId }: { serverId: string; clusterId: string }) => {
    const client = getClient(serverId);
    const data = await client.listProjects(clusterId);
    return { content: [{ type: "text", text: toJsonText(data) }] };
  }
);

// ---- Tools: Kubernetes via Rancher proxy ----
server.registerTool(
  "k8s_namespaces_list",
  {
    title: "K8s: list namespaces",
    description: "GET /api/v1/namespaces via Rancher proxy",
    inputSchema: z.object({ serverId: z.string(), clusterId: z.string() }).shape
  },
  async ({ serverId, clusterId }: { serverId: string; clusterId: string }) => {
    const client = getClient(serverId);
    const data = await client.listNamespaces(clusterId);
    return { content: [{ type: "text", text: toJsonText(data) }] };
  }
);

server.registerTool(
  "k8s_raw",
  {
    title: "K8s: raw HTTP via Rancher proxy",
    description: "Arbitrary request to /api or /apis (DANGEROUS) — use carefully",
    inputSchema: z.object({
      serverId: z.string(),
      clusterId: z.string(),
      path: z.string().describe("E.g. /api/v1/pods?limit=50"),
      method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]).default("GET"),
      body: z.string().optional(),
      contentType: z.string().optional().default("application/json"),
      accept: z.string().optional(),
      limit: z.number().int().positive().optional(),
      autoContinue: z.boolean().default(false),
      maxPages: z.number().int().positive().optional(),
      maxItems: z.number().int().positive().optional(),
      stripManagedFields: z.boolean().default(true),
      stripKeys: z.array(z.string()).optional()
    }).shape
  },
  async ({ serverId, clusterId, path: p, method, body, contentType, accept, limit, autoContinue, maxPages, maxItems, stripManagedFields, stripKeys }: any) => {
    const client = getClient(serverId);
    const res = await client.k8sRaw({
      clusterId,
      path: p,
      method,
      body,
      contentType,
      accept,
      limit,
      autoContinue,
      maxPages,
      maxItems,
      stripManagedFields,
      stripKeys
    });
    const text = typeof res === "string" ? res : toJsonText(res, stripManagedFields);
    return { content: [{ type: "text", text }] };
  }
);

// ---- Tools: Health & kubeconfig merge ----
server.registerTool(
  "rancher_health",
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
  "rancher_kubeconfigs_merge",
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
async function fleetApi(serverId: string, path: string, init?: RequestInit, clusterId = 'local', rawOptions?: Partial<K8sRawOptions>) {
  const client = getClient(serverId);
  const clean = path.startsWith('/') ? path : `/${path}`;
  if (rawOptions) {
    return client.k8sRaw({
      clusterId,
      path: clean,
      method: rawOptions.method || 'GET',
      body: rawOptions.body,
      contentType: rawOptions.contentType,
      accept: rawOptions.accept,
      limit: rawOptions.limit,
      autoContinue: rawOptions.autoContinue,
      maxPages: rawOptions.maxPages,
      maxItems: rawOptions.maxItems,
      stripManagedFields: rawOptions.stripManagedFields,
      stripKeys: rawOptions.stripKeys
    });
  }
  return client.k8s(clusterId, clean, init);
}

server.registerTool(
  "fleet_gitrepos_list",
  {
    title: "Fleet: list GitRepos",
    description: "GET /apis/fleet.cattle.io/v1alpha1/namespaces/{ns}/gitrepos",
    inputSchema: z.object({
      serverId: z.string(),
      namespace: z.string().default('fleet-default'),
      clusterId: z.string().default('local'),
      limit: z.number().int().positive().optional(),
      autoContinue: z.boolean().default(true),
      maxPages: z.number().int().positive().optional(),
      maxItems: z.number().int().positive().optional(),
      accept: z.string().optional(),
      stripManagedFields: z.boolean().default(true),
      stripKeys: z.array(z.string()).optional(),
      continueToken: z.string().optional()
    }).shape
  },
  async ({ serverId, namespace, clusterId, limit, autoContinue, maxPages, maxItems, accept, stripManagedFields, stripKeys, continueToken }: any) => {
    const path = buildPath(`/apis/fleet.cattle.io/v1alpha1/namespaces/${namespace}/gitrepos`, { continue: continueToken });
    const data = await fleetApi(serverId, path, undefined, clusterId, {
      method: 'GET',
      limit,
      autoContinue,
      maxPages,
      maxItems,
      accept,
      stripManagedFields,
      stripKeys
    });
    return { content: [{ type: 'text', text: toJsonText(data, stripManagedFields) }] };
  }
);

server.registerTool(
  "fleet_gitrepos_get",
  {
    title: "Fleet: get GitRepo",
    description: "GET /apis/fleet.cattle.io/v1alpha1/namespaces/{ns}/gitrepos/{name}",
    inputSchema: z.object({ serverId: z.string(), namespace: z.string(), name: z.string(), clusterId: z.string().default('local') }).shape
  },
  async ({ serverId, namespace, name, clusterId }: any) => {
    const data = await fleetApi(serverId, `/apis/fleet.cattle.io/v1alpha1/namespaces/${namespace}/gitrepos/${name}`, undefined, clusterId);
    return { content: [{ type: 'text', text: toJsonText(data) }] };
  }
);

server.registerTool(
  "fleet_gitrepos_create",
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
    return { content: [{ type: 'text', text: toJsonText(res) }] };
  }
);

server.registerTool(
  "fleet_gitrepos_apply",
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
    const text = typeof res === 'string' ? res : toJsonText(res);
    return { content: [{ type: 'text', text }] };
  }
);

server.registerTool(
  "fleet_gitrepos_redeploy",
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
    return { content: [{ type: 'text', text: toJsonText(res) }] };
  }
);

server.registerTool(
  "fleet_bdeploys_list",
  {
    title: "Fleet: list BundleDeployments",
    description: "GET /apis/fleet.cattle.io/v1alpha1/bundledeployments (optional labelSelector)",
    inputSchema: z.object({
      serverId: z.string(),
      labelSelector: z.string().optional(),
      clusterId: z.string().default('local'),
      limit: z.number().int().positive().optional(),
      autoContinue: z.boolean().default(true),
      maxPages: z.number().int().positive().optional(),
      maxItems: z.number().int().positive().optional(),
      accept: z.string().optional(),
      stripManagedFields: z.boolean().default(true),
      stripKeys: z.array(z.string()).optional(),
      continueToken: z.string().optional()
    }).shape
  },
  async ({ serverId, labelSelector, clusterId, limit, autoContinue, maxPages, maxItems, accept, stripManagedFields, stripKeys, continueToken }: any) => {
    const path = buildPath(`/apis/fleet.cattle.io/v1alpha1/bundledeployments`, {
      labelSelector,
      continue: continueToken
    });
    const data = await fleetApi(serverId, path, undefined, clusterId, {
      method: 'GET',
      limit,
      autoContinue,
      maxPages,
      maxItems,
      accept,
      stripManagedFields,
      stripKeys
    });
    return { content: [{ type: 'text', text: toJsonText(data, stripManagedFields) }] };
  }
);

server.registerTool(
  "fleet_status_summary",
  {
    title: "Fleet: status summary",
    description: "Aggregate Ready/NonReady from BundleDeployments and link to GitRepos",
    inputSchema: z.object({
      serverId: z.string(),
      namespace: z.string().default('fleet-default'),
      clusterId: z.string().default('local'),
      limit: z.number().int().positive().optional(),
      autoContinue: z.boolean().default(true),
      maxPages: z.number().int().positive().optional(),
      maxItems: z.number().int().positive().optional(),
      accept: z.string().optional(),
      stripManagedFields: z.boolean().default(true),
      stripKeys: z.array(z.string()).optional(),
      continueGitRepos: z.string().optional(),
      continueBundleDeployments: z.string().optional()
    }).shape
  },
  async ({ serverId, namespace, clusterId, limit, autoContinue, maxPages, maxItems, accept, stripManagedFields, stripKeys, continueGitRepos, continueBundleDeployments }: any) => {
    const [repos, bds] = await Promise.all([
      fleetApi(serverId, buildPath(`/apis/fleet.cattle.io/v1alpha1/namespaces/${namespace}/gitrepos`, { continue: continueGitRepos }), undefined, clusterId, {
        method: 'GET',
        limit,
        autoContinue,
        maxPages,
        maxItems,
        accept,
        stripManagedFields,
        stripKeys
      }),
      fleetApi(serverId, buildPath(`/apis/fleet.cattle.io/v1alpha1/bundledeployments`, { continue: continueBundleDeployments }), undefined, clusterId, {
        method: 'GET',
        limit,
        autoContinue,
        maxPages,
        maxItems,
        accept,
        stripManagedFields,
        stripKeys
      })
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

    return { content: [{ type: 'text', text: toJsonText(out, stripManagedFields) }] };
  }
);

// ---- Start server ----
const transport = new StdioServerTransport();
await server.connect(transport);
console.error(`[mcp-rancher-multi] started. Store: ${JSON.stringify(obfuscateConfig(STORE), null, 2)}`);
