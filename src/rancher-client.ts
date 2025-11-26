import { pickFields } from "./formatters.js";
import {
  RancherServerConfig,
  resolveToken,
  stripKeys,
  stripMetadataManagedFields,
} from "./utils.js";

export type K8sRawOptions = {
  clusterId: string;
  path: string;
  method?: string;
  body?: string;
  contentType?: string;
  accept?: string;
  limit?: number;
  autoContinue?: boolean;
  maxPages?: number;
  maxItems?: number;
  stripManagedFields?: boolean;
  stripKeys?: string[];
};

type ClusterListOptions = {
  summary?: boolean;
  summaryFields?: string[];
  stripKeys?: string[];
  limit?: number;
  autoContinue?: boolean;
  maxPages?: number;
  maxItems?: number;
  continueToken?: string;
};

const MAX_ERROR_BODY = 4000;

function truncateBody(body: string, maxLen = MAX_ERROR_BODY): string {
  if (!body) return "";
  if (body.length <= maxLen) return body;
  return `${body.slice(0, maxLen)}\n...truncated (${body.length - maxLen} more chars)`;
}

function normalizePath(path: string): string {
  return path.startsWith("/") ? path : `/${path}`;
}

function ensureLimit(path: string, limit?: number): string {
  if (!limit) return normalizePath(path);
  const url = new URL(normalizePath(path), "http://dummy");
  if (!url.searchParams.has("limit")) {
    url.searchParams.set("limit", String(limit));
  }
  return `${url.pathname}${url.search}`;
}

const DEFAULT_CLUSTER_FIELDS = ["id", "name"];

function isAbsoluteUrl(pathOrUrl: string): boolean {
  return /^https?:\/\//i.test(pathOrUrl);
}

function ensureLimitUrl(url: string, limit?: number): string {
  if (!limit) return url;
  const u = new URL(url);
  if (!u.searchParams.has("limit")) {
    u.searchParams.set("limit", String(limit));
  }
  return u.toString();
}

function stripContinueParam(path: string): string {
  const url = new URL(normalizePath(path), "http://dummy");
  url.searchParams.delete("continue");
  return `${url.pathname}${url.search}`;
}

function withContinue(path: string, token?: string): string {
  if (!token) return normalizePath(path);
  const url = new URL(normalizePath(path), "http://dummy");
  url.searchParams.set("continue", token);
  return `${url.pathname}${url.search}`;
}

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

  private toAbsoluteRancherUrl(pathOrUrl: string): string {
    if (isAbsoluteUrl(pathOrUrl)) return pathOrUrl;
    const clean = normalizePath(pathOrUrl);
    return `${this.baseUrl}${clean}`;
  }

  private headers(extra?: Record<string, string>): HeadersInit {
    const h: Record<string, string> = {
      Authorization: `Bearer ${this.token}`,
      Accept: "application/json",
      ...extra,
    };
    return h;
  }

  private async requestJSON<T>(url: string, init?: RequestInit): Promise<T> {
    const res = await fetch(url, {
      ...init,
      headers: this.headers(
        init?.headers as Record<string, string> | undefined,
      ),
    } as RequestInit);
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status} ${res.statusText} — ${url}
${truncateBody(text)}`);
    }
    return (await res.json()) as T;
  }

  async listClusters(options: ClusterListOptions = {}) {
    const {
      summary = true,
      summaryFields,
      stripKeys: keysToStrip = [],
      limit,
      autoContinue = false,
      maxPages,
      maxItems,
      continueToken,
    } = options;

    type Cluster = {
      id: string;
      name?: string;
      state?: string;
      provider?: string;
      [k: string]: any;
    };
    type Result = { data: Cluster[]; pagination?: { next?: string } };

    const startPath = continueToken || "/v3/clusters";
    const initialUrl = ensureLimitUrl(
      this.toAbsoluteRancherUrl(startPath),
      limit,
    );

    if (autoContinue) {
      return this.paginateClusterList(initialUrl, {
        summary,
        summaryFields,
        stripKeys: keysToStrip,
        maxItems,
        maxPages,
      });
    }

    const res = await this.requestJSON<Result>(initialUrl);
    const page = this.sanitizeClusterPage(res, {
      summary,
      summaryFields,
      stripKeys: keysToStrip,
    });
    return page.data;
  }

  async listNodes(clusterId?: string) {
    type Node = {
      id: string;
      nodeName?: string;
      clusterId?: string;
      state?: string;
      [k: string]: any;
    };
    type Result = { data: Node[] };
    const p = clusterId ? `?clusterId=${encodeURIComponent(clusterId)}` : "";
    const url = `${this.baseUrl}/v3/nodes${p}`;
    const res = await this.requestJSON<Result>(url);
    return res.data;
  }

  async getCluster(id: string, options: ClusterListOptions = {}) {
    const { summary = false, stripKeys: keysToStrip = [] } = options;
    type Cluster = {
      id: string;
      name?: string;
      state?: string;
      provider?: string;
      [k: string]: any;
    };
    const url = `${this.baseUrl}/v3/clusters/${encodeURIComponent(id)}`;
    const res = await this.requestJSON<Cluster>(url);
    return this.sanitizeCluster(res, { summary, stripKeys: keysToStrip });
  }

  async listProjects(clusterId: string) {
    type Project = {
      id: string;
      name?: string;
      clusterId?: string;
      [k: string]: any;
    };
    type Result = { data: Project[] };
    const url = `${this.baseUrl}/v3/projects?clusterId=${encodeURIComponent(clusterId)}`;
    const res = await this.requestJSON<Result>(url);
    return res.data;
  }

  async generateKubeconfig(clusterId: string) {
    type KubeResp = { config: string };
    const url = `${this.baseUrl}/v3/clusters/${encodeURIComponent(clusterId)}?action=generateKubeconfig`;
    const res = await this.requestJSON<KubeResp>(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
    });
    return res.config;
  }

  async k8s(clusterId: string, k8sPath: string, init?: RequestInit) {
    const pathClean = k8sPath.startsWith("/") ? k8sPath : `/${k8sPath}`;
    const url = `${this.baseUrl}/k8s/clusters/${encodeURIComponent(clusterId)}${pathClean}`;
    const res = await fetch(url, {
      ...init,
      headers: this.headers({
        Accept: "application/json",
        ...(init?.headers as any),
      }),
    } as RequestInit);
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`K8s proxy HTTP ${res.status} ${res.statusText} — ${url}
${truncateBody(text)}`);
    }
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) return res.json();
    return res.text();
  }

  async k8sRaw(options: K8sRawOptions) {
    const {
      clusterId,
      path,
      method = "GET",
      body,
      contentType = "application/json",
      accept,
      limit,
      autoContinue = false,
      maxPages,
      maxItems,
      stripManagedFields = true,
      stripKeys: keysToStrip = [],
    } = options;

    const headers: Record<string, string> = {
      Accept: accept || "application/json",
    };

    const methodUpper = method.toUpperCase();
    const hasBody = body !== undefined && body !== null && body !== "";
    if (methodUpper !== "GET" || hasBody) {
      headers["content-type"] = contentType || "application/json";
    }

    const init: RequestInit = { method: methodUpper, headers };
    if (hasBody) init.body = body;

    const pathWithLimit = ensureLimit(path, limit);

    if (methodUpper === "GET" && autoContinue) {
      return this.paginateK8sList(clusterId, pathWithLimit, init, {
        maxPages,
        maxItems,
        stripManagedFields,
        stripKeys: keysToStrip,
      });
    }

    const res = await this.k8s(clusterId, pathWithLimit, init);
    return this.sanitizeResult(res, {
      stripManagedFields,
      stripKeys: keysToStrip,
    });
  }

  private async paginateK8sList(
    clusterId: string,
    path: string,
    init: RequestInit,
    opts: {
      maxPages?: number;
      maxItems?: number;
      stripManagedFields?: boolean;
      stripKeys?: string[];
    },
  ) {
    const {
      maxPages,
      maxItems,
      stripManagedFields = true,
      stripKeys: keysToStrip = [],
    } = opts;
    const basePath = stripContinueParam(path);
    let nextPath = path;
    let pages = 0;
    let items: any[] = [];
    let firstPage: any = null;
    let lastMetadata: any = null;
    let nextContinue: string | undefined;

    while (true) {
      const page = await this.k8s(clusterId, nextPath, init);
      if (!page || typeof page !== "object" || !("items" in (page as any))) {
        return this.sanitizeResult(page, {
          stripManagedFields,
          stripKeys: keysToStrip,
        });
      }

      if (!firstPage) firstPage = page;
      pages += 1;
      const pageItems = Array.isArray((page as any).items)
        ? (page as any).items
        : [];
      const remaining =
        typeof maxItems === "number"
          ? Math.max(maxItems - items.length, 0)
          : undefined;
      const toAdd =
        typeof remaining === "number"
          ? pageItems.slice(0, remaining)
          : pageItems;
      items.push(...toAdd);
      lastMetadata = (page as any).metadata;
      nextContinue = (page as any)?.metadata?.continue;

      const hitMaxItems =
        typeof maxItems === "number" && items.length >= maxItems;
      const hitMaxPages = typeof maxPages === "number" && pages >= maxPages;
      if (!nextContinue || hitMaxItems || hitMaxPages || toAdd.length === 0)
        break;

      nextPath = withContinue(basePath, nextContinue);
    }

    const result = {
      ...(firstPage && typeof firstPage === "object" ? firstPage : {}),
      items,
      metadata: {
        ...(lastMetadata && typeof lastMetadata === "object"
          ? lastMetadata
          : {}),
        continue: nextContinue,
      },
      pageInfo: {
        pages,
        itemsCollected: items.length,
        maxPages: maxPages ?? null,
        maxItems: maxItems ?? null,
      },
    };

    return this.sanitizeResult(result, {
      stripManagedFields,
      stripKeys: keysToStrip,
    });
  }

  private sanitizeClusterPage(
    res: { data?: any[]; pagination?: any },
    opts: ClusterListOptions,
  ) {
    const items = Array.isArray(res?.data) ? res.data : [];
    const sanitized = items.map((c) =>
      this.sanitizeCluster({ ...(c || {}) }, opts),
    );
    return { data: sanitized, pagination: res?.pagination };
  }

  private async paginateClusterList(
    url: string,
    opts: {
      summary: boolean;
      summaryFields?: string[];
      stripKeys: string[];
      maxPages?: number;
      maxItems?: number;
    },
  ) {
    let nextUrl: string | undefined = url;
    let pages = 0;
    let items: any[] = [];
    let lastPagination: any;
    let nextToken: string | undefined;

    while (nextUrl) {
      const res = await this.requestJSON<any>(nextUrl);
      const page = this.sanitizeClusterPage(res, opts);
      const remaining =
        typeof opts.maxItems === "number"
          ? Math.max(opts.maxItems - items.length, 0)
          : undefined;
      const toAdd =
        typeof remaining === "number"
          ? page.data.slice(0, remaining)
          : page.data;
      items.push(...toAdd);
      pages += 1;
      lastPagination = page.pagination;
      nextToken = page.pagination?.next;

      const hitMaxItems =
        typeof opts.maxItems === "number" && items.length >= opts.maxItems;
      const hitMaxPages =
        typeof opts.maxPages === "number" && pages >= opts.maxPages;
      const exhausted =
        !nextToken || hitMaxItems || hitMaxPages || toAdd.length === 0;
      if (exhausted) break;

      nextUrl = nextToken
        ? isAbsoluteUrl(nextToken)
          ? nextToken
          : this.toAbsoluteRancherUrl(nextToken)
        : undefined;
    }

    return {
      data: items,
      pagination: lastPagination
        ? { ...lastPagination, next: nextToken }
        : { next: nextToken },
      pageInfo: {
        pages,
        itemsCollected: items.length,
        maxPages: opts.maxPages ?? null,
        maxItems: opts.maxItems ?? null,
      },
    };
  }

  private sanitizeResult<T>(
    value: T,
    opts: { stripManagedFields?: boolean; stripKeys?: string[] },
  ) {
    const { stripManagedFields = true, stripKeys: keysToStrip = [] } = opts;
    if (stripManagedFields) stripMetadataManagedFields(value as any);
    if (keysToStrip.length) stripKeys(value as any, keysToStrip);
    return value;
  }

  private sanitizeCluster(cluster: any, opts: ClusterListOptions) {
    const {
      summary = false,
      summaryFields,
      stripKeys: keysToStrip = [],
    } = opts;
    if (keysToStrip.length) stripKeys(cluster, keysToStrip);
    if (!summary) return cluster;

    const workspace =
      cluster?.fleetWorkspaceName ||
      cluster?.annotations?.["fleet.cattle.io/workspace-name"] ||
      cluster?.labels?.["fleet.cattle.io/workspace-name"] ||
      cluster?.annotations?.[
        "management.cattle.io/cluster-template-workspace-name"
      ];

    const fleetStatus = cluster?.status?.fleet || {
      agent: cluster?.annotations?.["fleet.cattle.io/agent-state"],
      clusterNamespace:
        cluster?.annotations?.["fleet.cattle.io/cluster-namespace"],
    };

    const summaryValue = {
      id: cluster?.id,
      name: cluster?.name,
      state: cluster?.state,
      provider: cluster?.provider || cluster?.driver,
      created: cluster?.created,
      workspace,
      fleet: fleetStatus,
      kubeVersion: cluster?.kubernetesVersion,
      agentImage: cluster?.agentImage,
      ready: cluster?.ready,
      transitioning: cluster?.transitioning,
      transitioningMessage: cluster?.transitioningMessage,
    };

    const fieldsToPick =
      summaryFields && summaryFields.length
        ? summaryFields
        : DEFAULT_CLUSTER_FIELDS;
    return pickFields(summaryValue, fieldsToPick);
  }

  async listNamespaces(clusterId: string) {
    const out = await this.k8s(clusterId, "/api/v1/namespaces");
    return (out as any)?.items ?? out;
  }
}
