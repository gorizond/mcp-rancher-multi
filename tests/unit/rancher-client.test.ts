import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RancherClient } from '../../src/rancher-client.js';
import { RancherServerConfig } from '../../src/utils.js';

// Mock fetch globally
global.fetch = vi.fn();

describe('RancherClient', () => {
  let client: RancherClient;
  let mockConfig: RancherServerConfig;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockConfig = {
      id: 'test-server',
      name: 'Test Server',
      baseUrl: 'https://rancher.test.local',
      token: 'test-token-123',
      insecureSkipTlsVerify: true
    };
    
    client = new RancherClient(mockConfig);
  });

  describe('constructor', () => {
    it('should initialize with correct properties', () => {
      expect(client.baseUrl).toBe('https://rancher.test.local');
      expect(client.token).toBe('test-token-123');
      expect(client.insecure).toBe(true);
    });

    it('should remove trailing slash from baseUrl', () => {
      const configWithSlash = { ...mockConfig, baseUrl: 'https://rancher.test.local/' };
      const clientWithSlash = new RancherClient(configWithSlash);
      expect(clientWithSlash.baseUrl).toBe('https://rancher.test.local');
    });

    it('should resolve environment variable tokens', () => {
      process.env.TEST_ENV_TOKEN = 'env-token-value';
      const configWithEnv = { ...mockConfig, token: '${ENV:TEST_ENV_TOKEN}' };
      const clientWithEnv = new RancherClient(configWithEnv);
      expect(clientWithEnv.token).toBe('env-token-value');
    });
  });

  describe('listClusters', () => {
    it('should fetch clusters successfully', async () => {
      const mockResponse = {
        data: [
          { id: 'cluster-1', name: 'test-cluster-1', state: 'active' },
          { id: 'cluster-2', name: 'test-cluster-2', state: 'active' }
        ]
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await client.listClusters();

      expect(fetch).toHaveBeenCalledWith(
        'https://rancher.test.local/v3/clusters',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token-123',
            'Accept': 'application/json'
          })
        })
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('should throw error on HTTP error', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: () => Promise.resolve('Unauthorized')
      });

      await expect(client.listClusters()).rejects.toThrow('HTTP 401 Unauthorized');
    });
  });

  describe('listNodes', () => {
    it('should fetch nodes without cluster filter', async () => {
      const mockResponse = {
        data: [
          { id: 'node-1', nodeName: 'test-node-1', state: 'active' }
        ]
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await client.listNodes();

      expect(fetch).toHaveBeenCalledWith(
        'https://rancher.test.local/v3/nodes',
        expect.any(Object)
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('should fetch nodes with cluster filter', async () => {
      const mockResponse = {
        data: [
          { id: 'node-1', nodeName: 'test-node-1', clusterId: 'cluster-1', state: 'active' }
        ]
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await client.listNodes('cluster-1');

      expect(fetch).toHaveBeenCalledWith(
        'https://rancher.test.local/v3/nodes?clusterId=cluster-1',
        expect.any(Object)
      );
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('listProjects', () => {
    it('should fetch projects for cluster', async () => {
      const mockResponse = {
        data: [
          { id: 'project-1', name: 'test-project-1', clusterId: 'cluster-1' }
        ]
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await client.listProjects('cluster-1');

      expect(fetch).toHaveBeenCalledWith(
        'https://rancher.test.local/v3/projects?clusterId=cluster-1',
        expect.any(Object)
      );
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('generateKubeconfig', () => {
    it('should generate kubeconfig for cluster', async () => {
      const mockResponse = {
        config: 'apiVersion: v1\nkind: Config\nclusters:\n- name: test-cluster'
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await client.generateKubeconfig('cluster-1');

      expect(fetch).toHaveBeenCalledWith(
        'https://rancher.test.local/v3/clusters/cluster-1?action=generateKubeconfig',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'content-type': 'application/json'
          })
        })
      );
      expect(result).toBe(mockResponse.config);
    });
  });

  describe('k8s', () => {
    it('should make k8s proxy request', async () => {
      const mockResponse = {
        items: [
          { metadata: { name: 'default' } },
          { metadata: { name: 'kube-system' } }
        ]
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        headers: new Map([['content-type', 'application/json']]),
        json: () => Promise.resolve(mockResponse)
      });

      const result = await client.k8s('cluster-1', '/api/v1/namespaces');

      expect(fetch).toHaveBeenCalledWith(
        'https://rancher.test.local/k8s/clusters/cluster-1/api/v1/namespaces',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Accept': 'application/json'
          })
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle text response', async () => {
      const mockResponse = 'plain text response';

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        headers: new Map([['content-type', 'text/plain']]),
        text: () => Promise.resolve(mockResponse)
      });

      const result = await client.k8s('cluster-1', '/api/v1/namespaces');

      expect(result).toBe(mockResponse);
    });

    it('should throw error on k8s proxy error', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        text: () => Promise.resolve('Namespace not found')
      });

      await expect(client.k8s('cluster-1', '/api/v1/namespaces')).rejects.toThrow('K8s proxy HTTP 404 Not Found');
    });
  });

  describe('listNamespaces', () => {
    it('should list namespaces', async () => {
      const mockResponse = {
        items: [
          { metadata: { name: 'default' } },
          { metadata: { name: 'kube-system' } }
        ]
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        headers: new Map([['content-type', 'application/json']]),
        json: () => Promise.resolve(mockResponse)
      });

      const result = await client.listNamespaces('cluster-1');

      expect(result).toEqual(mockResponse.items);
    });

    it('should handle response without items property', async () => {
      const mockResponse = [
        { metadata: { name: 'default' } },
        { metadata: { name: 'kube-system' } }
      ];

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        headers: new Map([['content-type', 'application/json']]),
        json: () => Promise.resolve(mockResponse)
      });

      const result = await client.listNamespaces('cluster-1');

      expect(result).toEqual(mockResponse);
    });
  });
});
