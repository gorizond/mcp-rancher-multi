import { RancherServerConfig, resolveToken } from './utils.js';

// Minimal Rancher client (v3 + k8s proxy)
export class RancherClient {
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
