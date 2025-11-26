import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { RancherClient } from "../../src/rancher-client.js";
import {
  loadConfigFromEnv,
  obfuscateConfig,
  saveStore,
  loadStore,
} from "../../src/utils.js";
import { RancherServerConfig } from "../../src/utils.js";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

// Mock fetch globally
global.fetch = vi.fn();

describe("Integration Tests", () => {
  let tempFile: string;
  let mockFetch: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch = fetch as any;
    tempFile = path.join(os.tmpdir(), `integration-test-${Date.now()}.json`);
  });

  afterEach(() => {
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
    }
    vi.restoreAllMocks();
  });

  describe("Configuration Flow", () => {
    it("should load config from env and create client", () => {
      // Setup environment
      process.env.RANCHER_SERVER_test_BASEURL = "https://test.rancher.com";
      process.env.RANCHER_SERVER_test_TOKEN = "test-token";
      process.env.RANCHER_SERVER_test_NAME = "Test Server";

      // Load configuration
      const config = loadConfigFromEnv();
      expect(config.test).toBeDefined();
      expect(config.test.baseUrl).toBe("https://test.rancher.com");
      expect(config.test.token).toBe("test-token");

      // Create client
      const client = new RancherClient(config.test);
      expect(client.baseUrl).toBe("https://test.rancher.com");
      expect(client.token).toBe("test-token");

      // Cleanup
      delete process.env.RANCHER_SERVER_test_BASEURL;
      delete process.env.RANCHER_SERVER_test_TOKEN;
      delete process.env.RANCHER_SERVER_test_NAME;
    });

    it("should save and load configuration from file", () => {
      const testConfig: Record<string, RancherServerConfig> = {
        server1: {
          id: "server1",
          name: "Test Server 1",
          baseUrl: "https://server1.local",
          token: "token1",
        },
        server2: {
          id: "server2",
          name: "Test Server 2",
          baseUrl: "https://server2.local",
          token: "token2",
        },
      };

      // Save configuration
      saveStore(testConfig, tempFile);
      expect(fs.existsSync(tempFile)).toBe(true);

      // Load configuration
      const loadedConfig = loadStore(tempFile);
      expect(loadedConfig).toEqual(testConfig);

      // Create clients from loaded config
      const client1 = new RancherClient(loadedConfig.server1);
      const client2 = new RancherClient(loadedConfig.server2);

      expect(client1.baseUrl).toBe("https://server1.local");
      expect(client2.baseUrl).toBe("https://server2.local");
    });

    it("should obfuscate config for safe logging", () => {
      const testConfig: Record<string, RancherServerConfig> = {
        server1: {
          id: "server1",
          name: "Test Server 1",
          baseUrl: "https://server1.local",
          token: "secret-token-12345",
        },
      };

      const obfuscated = obfuscateConfig(testConfig);
      expect(obfuscated.server1.token).toBe("***2345");
      expect(obfuscated.server1.name).toBe("Test Server 1");
      expect(obfuscated.server1.baseUrl).toBe("https://server1.local");
    });
  });

  describe("Client Operations", () => {
    let client: RancherClient;
    let mockConfig: RancherServerConfig;

    beforeEach(() => {
      mockConfig = {
        id: "test-server",
        baseUrl: "https://test.rancher.com",
        token: "test-token",
        name: "Test Server",
      };
      client = new RancherClient(mockConfig);
    });

    it("should handle complete cluster listing workflow", async () => {
      const mockClusters = {
        data: [
          { id: "cluster1", name: "Test Cluster 1", state: "active" },
          { id: "cluster2", name: "Test Cluster 2", state: "active" },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockClusters),
      });

      const clusters = await client.listClusters();
      expect(clusters).toEqual([
        { id: "cluster1", name: "Test Cluster 1" },
        { id: "cluster2", name: "Test Cluster 2" },
      ]);
      expect(mockFetch).toHaveBeenCalledWith(
        "https://test.rancher.com/v3/clusters",
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer test-token",
            Accept: "application/json",
          }),
        }),
      );
    });

    it("should handle complete node listing workflow", async () => {
      const mockNodes = {
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
        json: () => Promise.resolve(mockNodes),
      });

      const nodes = await client.listNodes("cluster1");
      expect(nodes).toEqual(mockNodes.data);
      expect(mockFetch).toHaveBeenCalledWith(
        "https://test.rancher.com/v3/nodes?clusterId=cluster1",
        expect.any(Object),
      );
    });

    it("should handle complete kubeconfig generation workflow", async () => {
      const mockKubeconfig = {
        config: "apiVersion: v1\nkind: Config\nclusters:\n- name: test-cluster",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockKubeconfig),
      });

      const kubeconfig = await client.generateKubeconfig("cluster1");
      expect(kubeconfig).toBe(mockKubeconfig.config);
      expect(mockFetch).toHaveBeenCalledWith(
        "https://test.rancher.com/v3/clusters/cluster1?action=generateKubeconfig",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "content-type": "application/json",
          }),
        }),
      );
    });

    it("should handle complete namespace listing workflow", async () => {
      const mockNamespaces = {
        items: [
          { metadata: { name: "default" } },
          { metadata: { name: "kube-system" } },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Map([["content-type", "application/json"]]),
        json: () => Promise.resolve(mockNamespaces),
      });

      const namespaces = await client.listNamespaces("cluster1");
      expect(namespaces).toEqual(mockNamespaces.items);
      expect(mockFetch).toHaveBeenCalledWith(
        "https://test.rancher.com/k8s/clusters/cluster1/api/v1/namespaces",
        expect.any(Object),
      );
    });
  });

  describe("Error Handling Integration", () => {
    let client: RancherClient;
    let mockConfig: RancherServerConfig;

    beforeEach(() => {
      mockConfig = {
        id: "test-server",
        baseUrl: "https://test.rancher.com",
        token: "test-token",
        name: "Test Server",
      };
      client = new RancherClient(mockConfig);
    });

    it("should handle network errors gracefully", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      await expect(client.listClusters()).rejects.toThrow("Network error");
    });

    it("should handle HTTP errors gracefully", async () => {
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

    it("should handle malformed responses gracefully", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.reject(new Error("Invalid JSON")),
      });

      await expect(client.listClusters()).rejects.toThrow("Invalid JSON");
    });
  });

  describe("Environment Variable Integration", () => {
    beforeEach(() => {
      // Clear environment variables
      delete process.env.RANCHER_SERVERS;
      delete process.env.RANCHER_SERVER_test_BASEURL;
      delete process.env.RANCHER_SERVER_test_TOKEN;
    });

    afterEach(() => {
      // Cleanup
      delete process.env.RANCHER_SERVERS;
      delete process.env.RANCHER_SERVER_test_BASEURL;
      delete process.env.RANCHER_SERVER_test_TOKEN;
    });

    it("should handle environment variable resolution in tokens", () => {
      process.env.SECRET_TOKEN = "secret-value";
      process.env.RANCHER_SERVER_test_TOKEN = "${ENV:SECRET_TOKEN}";
      process.env.RANCHER_SERVER_test_BASEURL = "https://test.local";

      const config = loadConfigFromEnv();
      const client = new RancherClient(config.test);

      expect(client.token).toBe("secret-value");
    });

    it("should handle missing environment variables gracefully", () => {
      process.env.RANCHER_SERVER_test_TOKEN = "${ENV:NONEXISTENT}";
      process.env.RANCHER_SERVER_test_BASEURL = "https://test.local";

      const config = loadConfigFromEnv();
      const client = new RancherClient(config.test);

      expect(client.token).toBe("");
    });

    it("should handle mixed configuration sources", () => {
      // Set some values via individual env vars
      process.env.RANCHER_SERVER_server1_BASEURL = "https://server1.local";
      process.env.RANCHER_SERVER_server1_TOKEN = "token1";

      // Set some values via RANCHER_SERVERS
      const serversConfig = {
        server2: {
          id: "server2",
          name: "Server 2",
          baseUrl: "https://server2.local",
          token: "token2",
        },
      };
      process.env.RANCHER_SERVERS = JSON.stringify(serversConfig);

      const config = loadConfigFromEnv();

      expect(config.server1).toBeDefined();
      expect(config.server1.baseUrl).toBe("https://server1.local");
      expect(config.server2).toBeDefined();
      expect(config.server2.baseUrl).toBe("https://server2.local");
    });
  });

  describe("File System Integration", () => {
    it("should handle complete save-load cycle with complex data", () => {
      const complexConfig: Record<string, RancherServerConfig> = {
        "prod-server": {
          id: "prod-server",
          name: "Production Server",
          baseUrl: "https://prod.rancher.com",
          token: "prod-token-12345",
          insecureSkipTlsVerify: false,
          caCertPemBase64: "prod-cert-base64",
        },
        "dev-server": {
          id: "dev-server",
          name: "Development Server",
          baseUrl: "https://dev.rancher.com",
          token: "dev-token-67890",
          insecureSkipTlsVerify: true,
        },
      };

      // Save configuration
      saveStore(complexConfig, tempFile);

      // Load configuration
      const loadedConfig = loadStore(tempFile);

      // Verify all properties are preserved
      expect(loadedConfig["prod-server"]).toEqual(complexConfig["prod-server"]);
      expect(loadedConfig["dev-server"]).toEqual(complexConfig["dev-server"]);

      // Create clients and verify they work
      const prodClient = new RancherClient(loadedConfig["prod-server"]);
      const devClient = new RancherClient(loadedConfig["dev-server"]);

      expect(prodClient.baseUrl).toBe("https://prod.rancher.com");
      expect(prodClient.insecure).toBe(false);
      expect(devClient.baseUrl).toBe("https://dev.rancher.com");
      expect(devClient.insecure).toBe(true);
    });

    it("should handle file system errors gracefully", () => {
      // Test with non-existent directory
      const nonExistentPath = "/non/existent/path/servers.json";
      const result = loadStore(nonExistentPath);
      expect(result).toEqual({});
    });
  });
});
