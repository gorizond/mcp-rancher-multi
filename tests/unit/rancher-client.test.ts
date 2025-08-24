import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { RancherClient } from '../../src/rancher-client.js';
import { RancherServerConfig } from '../../src/utils.js';

// Mock fetch globally
global.fetch = vi.fn();

describe('RancherClient', () => {
  let client: RancherClient;
  let mockFetch: any;

  const mockConfig: RancherServerConfig = {
    id: 'test-server',
    baseUrl: 'https://test.rancher.com',
    token: 'test-token',
    name: 'Test Server'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch = fetch as any;
    client = new RancherClient(mockConfig);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with correct configuration', () => {
      expect(client.baseUrl).toBe('https://test.rancher.com');
      expect(client.token).toBe('test-token');
      expect(client.insecure).toBe(false);
      expect(client.caCertPemBase64).toBeUndefined();
    });

    it('should remove trailing slash from baseUrl', () => {
      const configWithSlash: RancherServerConfig = {
        ...mockConfig,
        baseUrl: 'https://test.rancher.com/'
      };
      const clientWithSlash = new RancherClient(configWithSlash);
      expect(clientWithSlash.baseUrl).toBe('https://test.rancher.com');
    });

    it('should handle insecure configuration', () => {
      const insecureConfig: RancherServerConfig = {
        ...mockConfig,
        insecureSkipTlsVerify: true
      };
      const insecureClient = new RancherClient(insecureConfig);
      expect(insecureClient.insecure).toBe(true);
    });

    it('should handle caCertPemBase64 configuration', () => {
      const certConfig: RancherServerConfig = {
        ...mockConfig,
        caCertPemBase64: 'base64-cert-data'
      };
      const certClient = new RancherClient(certConfig);
      expect(certClient.caCertPemBase64).toBe('base64-cert-data');
    });

    it('should resolve token with environment variable pattern', () => {
      process.env.TEST_TOKEN = 'env-token-value';
      const envConfig: RancherServerConfig = {
        ...mockConfig,
        token: '${ENV:TEST_TOKEN}'
      };
      const envClient = new RancherClient(envConfig);
      expect(envClient.token).toBe('env-token-value');
    });
  });

  describe('listClusters', () => {
    it('should fetch clusters successfully', async () => {
      const mockResponse = {
        data: [
          { id: 'cluster1', name: 'Test Cluster 1', state: 'active' },
          { id: 'cluster2', name: 'Test Cluster 2', state: 'active' }
        ]
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await client.listClusters();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test.rancher.com/v3/clusters',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token',
            'Accept': 'application/json'
          })
        })
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle HTTP error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: () => Promise.resolve('Unauthorized access')
      });

      await expect(client.listClusters()).rejects.toThrow('HTTP 401 Unauthorized');
    });

    it('should handle network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(client.listClusters()).rejects.toThrow('Network error');
    });
  });

  describe('listNodes', () => {
    it('should fetch nodes without clusterId', async () => {
      const mockResponse = {
        data: [
          { id: 'node1', nodeName: 'test-node-1', state: 'active' },
          { id: 'node2', nodeName: 'test-node-2', state: 'active' }
        ]
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await client.listNodes();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test.rancher.com/v3/nodes',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token',
            'Accept': 'application/json'
          })
        })
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('should fetch nodes with clusterId', async () => {
      const mockResponse = {
        data: [
          { id: 'node1', nodeName: 'test-node-1', clusterId: 'cluster1', state: 'active' }
        ]
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await client.listNodes('cluster1');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test.rancher.com/v3/nodes?clusterId=cluster1',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token',
            'Accept': 'application/json'
          })
        })
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle special characters in clusterId', async () => {
      const mockResponse = { data: [] };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      await client.listNodes('cluster/with/special/chars');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test.rancher.com/v3/nodes?clusterId=cluster%2Fwith%2Fspecial%2Fchars',
        expect.any(Object)
      );
    });
  });

  describe('listProjects', () => {
    it('should fetch projects successfully', async () => {
      const mockResponse = {
        data: [
          { id: 'project1', name: 'Test Project 1', clusterId: 'cluster1' },
          { id: 'project2', name: 'Test Project 2', clusterId: 'cluster1' }
        ]
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await client.listProjects('cluster1');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test.rancher.com/v3/projects?clusterId=cluster1',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token',
            'Accept': 'application/json'
          })
        })
      );
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('generateKubeconfig', () => {
    it('should generate kubeconfig successfully', async () => {
      const mockResponse = {
        config: 'apiVersion: v1\nkind: Config\nclusters:\n- name: test-cluster'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await client.generateKubeconfig('cluster1');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test.rancher.com/v3/clusters/cluster1?action=generateKubeconfig',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token',
            'Accept': 'application/json',
            'content-type': 'application/json'
          })
        })
      );
      expect(result).toBe(mockResponse.config);
    });
  });

  describe('k8s', () => {
    it('should make k8s request with leading slash', async () => {
      const mockResponse = { items: [] };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Map([['content-type', 'application/json']]),
        json: () => Promise.resolve(mockResponse)
      });

      const result = await client.k8s('cluster1', '/api/v1/pods');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test.rancher.com/k8s/clusters/cluster1/api/v1/pods',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token',
            'Accept': 'application/json'
          })
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should make k8s request without leading slash', async () => {
      const mockResponse = { items: [] };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Map([['content-type', 'application/json']]),
        json: () => Promise.resolve(mockResponse)
      });

      const result = await client.k8s('cluster1', 'api/v1/pods');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test.rancher.com/k8s/clusters/cluster1/api/v1/pods',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token',
            'Accept': 'application/json'
          })
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle text response', async () => {
      const mockResponse = 'plain text response';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Map([['content-type', 'text/plain']]),
        text: () => Promise.resolve(mockResponse)
      });

      const result = await client.k8s('cluster1', '/api/v1/pods');

      expect(result).toBe(mockResponse);
    });

    it('should handle missing content-type header', async () => {
      const mockResponse = 'response without content-type';

      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Map(),
        text: () => Promise.resolve(mockResponse)
      });

      const result = await client.k8s('cluster1', '/api/v1/pods');

      expect(result).toBe(mockResponse);
    });

    it('should handle HTTP error in k8s request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        text: () => Promise.resolve('Resource not found')
      });

      await expect(client.k8s('cluster1', '/api/v1/pods')).rejects.toThrow('K8s proxy HTTP 404 Not Found');
    });
  });

  describe('listNamespaces', () => {
    it('should list namespaces with items property', async () => {
      const mockResponse = {
        items: [
          { metadata: { name: 'default' } },
          { metadata: { name: 'kube-system' } }
        ]
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Map([['content-type', 'application/json']]),
        json: () => Promise.resolve(mockResponse)
      });

      const result = await client.listNamespaces('cluster1');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test.rancher.com/k8s/clusters/cluster1/api/v1/namespaces',
        expect.any(Object)
      );
      expect(result).toEqual(mockResponse.items);
    });

    it('should list namespaces without items property', async () => {
      const mockResponse = [
        { metadata: { name: 'default' } },
        { metadata: { name: 'kube-system' } }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Map([['content-type', 'application/json']]),
        json: () => Promise.resolve(mockResponse)
      });

      const result = await client.listNamespaces('cluster1');

      expect(result).toEqual(mockResponse);
    });

    it('should handle null response', async () => {
      const mockResponse = null;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Map([['content-type', 'application/json']]),
        json: () => Promise.resolve(mockResponse)
      });

      const result = await client.listNamespaces('cluster1');

      expect(result).toBeNull();
    });
  });

  describe('headers', () => {
    it('should include extra headers', async () => {
      const mockResponse = { data: [] };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      await client.listClusters();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token',
            'Accept': 'application/json'
          })
        })
      );
    });
  });
});
