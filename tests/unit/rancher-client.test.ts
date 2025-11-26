import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { RancherClient } from "../../src/rancher-client.js";
import { RancherServerConfig } from "../../src/utils.js";

// Mock fetch globally
global.fetch = vi.fn();

describe("RancherClient", () => {
  let client: RancherClient;
  let mockFetch: any;

  const mockConfig: RancherServerConfig = {
    id: "test-server",
    baseUrl: "https://test.rancher.com",
    token: "test-token",
    name: "Test Server",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch = fetch as any;
    client = new RancherClient(mockConfig);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("constructor", () => {
    it("should initialize with correct configuration", () => {
      expect(client.baseUrl).toBe("https://test.rancher.com");
      expect(client.token).toBe("test-token");
      expect(client.insecure).toBe(false);
      expect(client.caCertPemBase64).toBeUndefined();
    });

    it("should remove trailing slash from baseUrl", () => {
      const configWithSlash: RancherServerConfig = {
        ...mockConfig,
        baseUrl: "https://test.rancher.com/",
      };
      const clientWithSlash = new RancherClient(configWithSlash);
      expect(clientWithSlash.baseUrl).toBe("https://test.rancher.com");
    });

    it("should handle insecure configuration", () => {
      const insecureConfig: RancherServerConfig = {
        ...mockConfig,
        insecureSkipTlsVerify: true,
      };
      const insecureClient = new RancherClient(insecureConfig);
      expect(insecureClient.insecure).toBe(true);
    });

    it("should handle caCertPemBase64 configuration", () => {
      const certConfig: RancherServerConfig = {
        ...mockConfig,
        caCertPemBase64: "base64-cert-data",
      };
      const certClient = new RancherClient(certConfig);
      expect(certClient.caCertPemBase64).toBe("base64-cert-data");
    });

    it("should resolve token with environment variable pattern", () => {
      process.env.TEST_TOKEN = "env-token-value";
      const envConfig: RancherServerConfig = {
        ...mockConfig,
        token: "${ENV:TEST_TOKEN}",
      };
      const envClient = new RancherClient(envConfig);
      expect(envClient.token).toBe("env-token-value");
    });
  });

  describe("listClusters", () => {
    it("should return minimal fields by default", async () => {
      const mockResponse = {
        data: [
          { id: "cluster1", name: "Test Cluster 1", state: "active" },
          { id: "cluster2", name: "Test Cluster 2", state: "active" },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await client.listClusters();

      expect(result).toEqual([
        { id: "cluster1", name: "Test Cluster 1" },
        { id: "cluster2", name: "Test Cluster 2" },
      ]);
    });

    it("should fetch clusters with full data when summary is disabled", async () => {
      const mockResponse = {
        data: [
          { id: "cluster1", name: "Test Cluster 1", state: "active" },
          { id: "cluster2", name: "Test Cluster 2", state: "active" },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await client.listClusters({ summary: false });

      expect(mockFetch).toHaveBeenCalledWith(
        "https://test.rancher.com/v3/clusters",
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer test-token",
            Accept: "application/json",
          }),
        }),
      );
      expect(result).toEqual(mockResponse.data);
    });

    it("should handle HTTP error", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        text: () => Promise.resolve("Unauthorized access"),
      });

      await expect(client.listClusters()).rejects.toThrow(
        "HTTP 401 Unauthorized",
      );
    });

    it("should handle network error", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      await expect(client.listClusters()).rejects.toThrow("Network error");
    });

    it("should return compact summary with selected fields", async () => {
      const mockResponse = {
        data: [
          {
            id: "c1",
            name: "Cluster One",
            state: "active",
            provider: "rke2",
            annotations: { "fleet.cattle.io/workspace-name": "ws1" },
            status: { fleet: { ready: true } },
            extra: { big: "value" },
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result: any = await client.listClusters({
        summary: true,
        summaryFields: [
          "id",
          "name",
          "state",
          "provider",
          "workspace",
          "fleet",
        ],
      });

      expect(result).toEqual([
        expect.objectContaining({
          id: "c1",
          name: "Cluster One",
          state: "active",
          provider: "rke2",
          workspace: "ws1",
          fleet: { ready: true },
        }),
      ]);
      expect(result[0].extra).toBeUndefined();
    });

    it("should strip specified keys before returning", async () => {
      const mockResponse = {
        data: [
          {
            id: "c1",
            name: "Cluster One",
            state: "active",
            links: {},
            actions: { restart: true },
            heavy: { data: "x" },
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result: any = await client.listClusters({
        summary: false,
        stripKeys: ["links", "actions"],
      });

      expect(result[0].links).toBeUndefined();
      expect(result[0].actions).toBeUndefined();
      expect(result[0].heavy).toBeDefined();
    });

    it("should paginate clusters when autoContinue is enabled", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              data: [{ id: "c1", name: "one" }],
              pagination: { next: "/v3/clusters?page=2" },
            }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              data: [{ id: "c2", name: "two" }],
              pagination: { next: null },
            }),
        });

      const result: any = await client.listClusters({
        autoContinue: true,
        summary: true,
      });

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockFetch.mock.calls[1][0]).toBe(
        "https://test.rancher.com/v3/clusters?page=2",
      );
      expect(result.data.map((c: any) => c.id)).toEqual(["c1", "c2"]);
      expect(result.pageInfo.pages).toBe(2);
      expect(result.pagination.next).toBeNull();
    });
  });

  describe("listNodes", () => {
    it("should fetch nodes without clusterId", async () => {
      const mockResponse = {
        data: [
          { id: "node1", nodeName: "test-node-1", state: "active" },
          { id: "node2", nodeName: "test-node-2", state: "active" },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await client.listNodes();

      expect(mockFetch).toHaveBeenCalledWith(
        "https://test.rancher.com/v3/nodes",
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer test-token",
            Accept: "application/json",
          }),
        }),
      );
      expect(result).toEqual(mockResponse.data);
    });

    it("should fetch nodes with clusterId", async () => {
      const mockResponse = {
        data: [
          {
            id: "node1",
            nodeName: "test-node-1",
            clusterId: "cluster1",
            state: "active",
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await client.listNodes("cluster1");

      expect(mockFetch).toHaveBeenCalledWith(
        "https://test.rancher.com/v3/nodes?clusterId=cluster1",
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer test-token",
            Accept: "application/json",
          }),
        }),
      );
      expect(result).toEqual(mockResponse.data);
    });

    it("should handle special characters in clusterId", async () => {
      const mockResponse = { data: [] };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await client.listNodes("cluster/with/special/chars");

      expect(mockFetch).toHaveBeenCalledWith(
        "https://test.rancher.com/v3/nodes?clusterId=cluster%2Fwith%2Fspecial%2Fchars",
        expect.any(Object),
      );
    });
  });

  describe("listProjects", () => {
    it("should fetch projects successfully", async () => {
      const mockResponse = {
        data: [
          { id: "project1", name: "Test Project 1", clusterId: "cluster1" },
          { id: "project2", name: "Test Project 2", clusterId: "cluster1" },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await client.listProjects("cluster1");

      expect(mockFetch).toHaveBeenCalledWith(
        "https://test.rancher.com/v3/projects?clusterId=cluster1",
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer test-token",
            Accept: "application/json",
          }),
        }),
      );
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe("generateKubeconfig", () => {
    it("should generate kubeconfig successfully", async () => {
      const mockResponse = {
        config: "apiVersion: v1\nkind: Config\nclusters:\n- name: test-cluster",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await client.generateKubeconfig("cluster1");

      expect(mockFetch).toHaveBeenCalledWith(
        "https://test.rancher.com/v3/clusters/cluster1?action=generateKubeconfig",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "Bearer test-token",
            Accept: "application/json",
            "content-type": "application/json",
          }),
        }),
      );
      expect(result).toBe(mockResponse.config);
    });
  });

  describe("k8s", () => {
    it("should make k8s request with leading slash", async () => {
      const mockResponse = { items: [] };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Map([["content-type", "application/json"]]),
        json: () => Promise.resolve(mockResponse),
      });

      const result = await client.k8s("cluster1", "/api/v1/pods");

      expect(mockFetch).toHaveBeenCalledWith(
        "https://test.rancher.com/k8s/clusters/cluster1/api/v1/pods",
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer test-token",
            Accept: "application/json",
          }),
        }),
      );
      expect(result).toEqual(mockResponse);
    });

    it("should make k8s request without leading slash", async () => {
      const mockResponse = { items: [] };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Map([["content-type", "application/json"]]),
        json: () => Promise.resolve(mockResponse),
      });

      const result = await client.k8s("cluster1", "api/v1/pods");

      expect(mockFetch).toHaveBeenCalledWith(
        "https://test.rancher.com/k8s/clusters/cluster1/api/v1/pods",
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer test-token",
            Accept: "application/json",
          }),
        }),
      );
      expect(result).toEqual(mockResponse);
    });

    it("should handle text response", async () => {
      const mockResponse = "plain text response";

      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Map([["content-type", "text/plain"]]),
        text: () => Promise.resolve(mockResponse),
      });

      const result = await client.k8s("cluster1", "/api/v1/pods");

      expect(result).toBe(mockResponse);
    });

    it("should handle missing content-type header", async () => {
      const mockResponse = "response without content-type";

      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Map(),
        text: () => Promise.resolve(mockResponse),
      });

      const result = await client.k8s("cluster1", "/api/v1/pods");

      expect(result).toBe(mockResponse);
    });

    it("should handle HTTP error in k8s request", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: "Not Found",
        text: () => Promise.resolve("Resource not found"),
      });

      await expect(client.k8s("cluster1", "/api/v1/pods")).rejects.toThrow(
        "K8s proxy HTTP 404 Not Found",
      );
    });
  });

  describe("k8sRaw", () => {
    it("should append limit when missing and strip managedFields", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Map([["content-type", "application/json"]]),
        json: () =>
          Promise.resolve({
            items: [
              { metadata: { name: "p1", managedFields: [{ manager: "m" }] } },
            ],
            metadata: { managedFields: [{ manager: "meta" }] },
          }),
      });

      const result: any = await client.k8sRaw({
        clusterId: "c1",
        path: "/api/v1/pods",
        method: "GET",
        limit: 5,
      });

      const calledUrl = mockFetch.mock.calls[0][0];
      const headers = mockFetch.mock.calls[0][1].headers;
      expect(calledUrl).toContain("/api/v1/pods?limit=5");
      expect(headers["content-type"]).toBeUndefined();
      expect(result.items[0].metadata.managedFields).toBeUndefined();
      expect(result.metadata.managedFields).toBeUndefined();
    });

    it("should auto-continue across pages and collect items", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          headers: new Map([["content-type", "application/json"]]),
          json: () =>
            Promise.resolve({
              kind: "PodList",
              metadata: {
                continue: "token-123",
                managedFields: [{ manager: "page1" }],
              },
              items: [
                {
                  metadata: { name: "p1", managedFields: [{ manager: "m1" }] },
                },
              ],
            }),
        })
        .mockResolvedValueOnce({
          ok: true,
          headers: new Map([["content-type", "application/json"]]),
          json: () =>
            Promise.resolve({
              kind: "PodList",
              metadata: { resourceVersion: "2" },
              items: [{ metadata: { name: "p2" } }],
            }),
        });

      const result: any = await client.k8sRaw({
        clusterId: "c1",
        path: "/api/v1/pods",
        method: "GET",
        autoContinue: true,
        limit: 1,
      });

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockFetch.mock.calls[1][0]).toContain("continue=token-123");
      expect(result.items.map((i: any) => i.metadata.name)).toEqual([
        "p1",
        "p2",
      ]);
      expect(result.pageInfo.pages).toBe(2);
      expect(result.pageInfo.itemsCollected).toBe(2);
      expect(result.metadata.continue).toBeUndefined();
    });

    it("should stop at maxItems and return continue token", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Map([["content-type", "application/json"]]),
        json: () =>
          Promise.resolve({
            metadata: { continue: "next-token" },
            items: [{ metadata: { name: "p1" } }, { metadata: { name: "p2" } }],
          }),
      });

      const result: any = await client.k8sRaw({
        clusterId: "c1",
        path: "/api/v1/pods",
        method: "GET",
        autoContinue: true,
        maxItems: 1,
        limit: 2,
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(result.items).toHaveLength(1);
      expect(result.metadata.continue).toBe("next-token");
    });

    it("should honor custom Accept header", async () => {
      const accept =
        "application/json;as=PartialObjectMetadataList;v=v1;g=meta.k8s.io";
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Map([["content-type", "application/json"]]),
        json: () => Promise.resolve({ items: [] }),
      });

      await client.k8sRaw({
        clusterId: "c1",
        path: "/api/v1/pods",
        method: "GET",
        accept,
      });

      const headers = mockFetch.mock.calls[0][1].headers;
      expect(headers.Accept).toBe(accept);
      expect(headers["content-type"]).toBeUndefined();
    });

    it("should strip specified keys to compact responses", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Map([["content-type", "application/json"]]),
        json: () =>
          Promise.resolve({
            items: [
              {
                metadata: { name: "cfg1" },
                data: { big: "AAA" },
                spec: { inner: { data: "BBB", keep: "ok" } },
              },
            ],
            binaryData: { huge: "CCC" },
            data: { root: "DDD" },
          }),
      });

      const result: any = await client.k8sRaw({
        clusterId: "c1",
        path: "/api/v1/configmaps",
        method: "GET",
        stripKeys: ["data", "binaryData"],
      });

      expect(result.items[0].data).toBeUndefined();
      expect(result.items[0].spec.inner.data).toBeUndefined();
      expect(result.items[0].spec.inner.keep).toBe("ok");
      expect(result.binaryData).toBeUndefined();
      expect(result.data).toBeUndefined();
    });
  });

  describe("listNamespaces", () => {
    it("should list namespaces with items property", async () => {
      const mockResponse = {
        items: [
          { metadata: { name: "default" } },
          { metadata: { name: "kube-system" } },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Map([["content-type", "application/json"]]),
        json: () => Promise.resolve(mockResponse),
      });

      const result = await client.listNamespaces("cluster1");

      expect(mockFetch).toHaveBeenCalledWith(
        "https://test.rancher.com/k8s/clusters/cluster1/api/v1/namespaces",
        expect.any(Object),
      );
      expect(result).toEqual(mockResponse.items);
    });

    it("should list namespaces without items property", async () => {
      const mockResponse = [
        { metadata: { name: "default" } },
        { metadata: { name: "kube-system" } },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Map([["content-type", "application/json"]]),
        json: () => Promise.resolve(mockResponse),
      });

      const result = await client.listNamespaces("cluster1");

      expect(result).toEqual(mockResponse);
    });

    it("should handle null response", async () => {
      const mockResponse = null;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Map([["content-type", "application/json"]]),
        json: () => Promise.resolve(mockResponse),
      });

      const result = await client.listNamespaces("cluster1");

      expect(result).toBeNull();
    });
  });

  describe("headers", () => {
    it("should include extra headers", async () => {
      const mockResponse = { data: [] };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await client.listClusters();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer test-token",
            Accept: "application/json",
          }),
        }),
      );
    });
  });
});
