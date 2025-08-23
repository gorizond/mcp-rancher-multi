import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RancherClient } from '../../src/rancher-client.js';
import { RancherServerConfig } from '../../src/utils.js';

// Mock fetch globally
global.fetch = vi.fn();

describe('Fleet Integration', () => {
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

  describe('GitRepo operations', () => {
    it('should list GitRepos', async () => {
      const mockResponse = {
        items: [
          {
            metadata: {
              name: 'test-repo',
              namespace: 'fleet-default'
            },
            spec: {
              repo: 'https://github.com/test/repo',
              branch: 'main',
              paths: ['k8s/']
            }
          }
        ]
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        headers: new Map([['content-type', 'application/json']]),
        json: () => Promise.resolve(mockResponse)
      });

      const result = await client.k8s('local', '/apis/fleet.cattle.io/v1alpha1/namespaces/fleet-default/gitrepos');

      expect(fetch).toHaveBeenCalledWith(
        'https://rancher.test.local/k8s/clusters/local/apis/fleet.cattle.io/v1alpha1/namespaces/fleet-default/gitrepos',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Accept': 'application/json'
          })
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should get specific GitRepo', async () => {
      const mockResponse = {
        metadata: {
          name: 'test-repo',
          namespace: 'fleet-default'
        },
        spec: {
          repo: 'https://github.com/test/repo',
          branch: 'main'
        },
        status: {
          conditions: [
            {
              type: 'Ready',
              status: 'True'
            }
          ]
        }
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        headers: new Map([['content-type', 'application/json']]),
        json: () => Promise.resolve(mockResponse)
      });

      const result = await client.k8s('local', '/apis/fleet.cattle.io/v1alpha1/namespaces/fleet-default/gitrepos/test-repo');

      expect(fetch).toHaveBeenCalledWith(
        'https://rancher.test.local/k8s/clusters/local/apis/fleet.cattle.io/v1alpha1/namespaces/fleet-default/gitrepos/test-repo',
        expect.any(Object)
      );
      expect(result).toEqual(mockResponse);
    });

    it('should create GitRepo', async () => {
      const gitRepoManifest = {
        apiVersion: 'fleet.cattle.io/v1alpha1',
        kind: 'GitRepo',
        metadata: {
          name: 'new-repo',
          namespace: 'fleet-default'
        },
        spec: {
          repo: 'https://github.com/test/new-repo',
          branch: 'main',
          paths: ['k8s/']
        }
      };

      const mockResponse = {
        ...gitRepoManifest,
        metadata: {
          ...gitRepoManifest.metadata,
          uid: 'test-uid',
          creationTimestamp: '2024-01-01T00:00:00Z'
        }
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        headers: new Map([['content-type', 'application/json']]),
        json: () => Promise.resolve(mockResponse)
      });

      const result = await client.k8s('local', '/apis/fleet.cattle.io/v1alpha1/namespaces/fleet-default/gitrepos', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(gitRepoManifest)
      });

      expect(fetch).toHaveBeenCalledWith(
        'https://rancher.test.local/k8s/clusters/local/apis/fleet.cattle.io/v1alpha1/namespaces/fleet-default/gitrepos',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'content-type': 'application/json'
          }),
          body: JSON.stringify(gitRepoManifest)
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should apply GitRepo with Server-Side Apply', async () => {
      const gitRepoYaml = `apiVersion: fleet.cattle.io/v1alpha1
kind: GitRepo
metadata:
  name: test-repo
  namespace: fleet-default
spec:
  repo: https://github.com/test/repo
  branch: main
  paths:
  - k8s/`;

      const mockResponse = {
        metadata: {
          name: 'test-repo',
          namespace: 'fleet-default',
          uid: 'test-uid'
        },
        spec: {
          repo: 'https://github.com/test/repo',
          branch: 'main',
          paths: ['k8s/']
        }
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        headers: new Map([['content-type', 'application/json']]),
        json: () => Promise.resolve(mockResponse)
      });

      const params = new URLSearchParams({ 
        fieldManager: 'mcp-rancher-multi', 
        force: 'true' 
      });

      const result = await client.k8s(
        'local',
        `/apis/fleet.cattle.io/v1alpha1/namespaces/fleet-default/gitrepos/test-repo?${params.toString()}`,
        {
          method: 'PATCH',
          headers: { 'content-type': 'application/apply-patch+yaml' },
          body: gitRepoYaml
        }
      );

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('https://rancher.test.local/k8s/clusters/local/apis/fleet.cattle.io/v1alpha1/namespaces/fleet-default/gitrepos/test-repo'),
        expect.objectContaining({
          method: 'PATCH',
          headers: expect.objectContaining({
            'content-type': 'application/apply-patch+yaml'
          }),
          body: gitRepoYaml
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should force redeploy GitRepo', async () => {
      const mockResponse = {
        metadata: {
          name: 'test-repo',
          namespace: 'fleet-default',
          annotations: {
            'fleet.cattle.io/redeployHash': 'abc123'
          }
        }
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        headers: new Map([['content-type', 'application/json']]),
        json: () => Promise.resolve(mockResponse)
      });

      const body = JSON.stringify({
        metadata: {
          annotations: {
            'fleet.cattle.io/redeployHash': expect.any(String)
          }
        }
      });

      const result = await client.k8s(
        'local',
        '/apis/fleet.cattle.io/v1alpha1/namespaces/fleet-default/gitrepos/test-repo',
        {
          method: 'PATCH',
          headers: { 'content-type': 'application/merge-patch+json' },
          body
        }
      );

      expect(fetch).toHaveBeenCalledWith(
        'https://rancher.test.local/k8s/clusters/local/apis/fleet.cattle.io/v1alpha1/namespaces/fleet-default/gitrepos/test-repo',
        expect.objectContaining({
          method: 'PATCH',
          headers: expect.objectContaining({
            'content-type': 'application/merge-patch+json'
          }),
          body: expect.stringContaining('fleet.cattle.io/redeployHash')
        })
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('BundleDeployment operations', () => {
    it('should list BundleDeployments', async () => {
      const mockResponse = {
        items: [
          {
            metadata: {
              name: 'test-repo-bundle-1',
              namespace: 'fleet-default'
            },
            status: {
              summary: {
                ready: 2,
                nonReady: 0,
                total: 2
              },
              ready: true,
              desiredReady: 2
            }
          }
        ]
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        headers: new Map([['content-type', 'application/json']]),
        json: () => Promise.resolve(mockResponse)
      });

      const result = await client.k8s('local', '/apis/fleet.cattle.io/v1alpha1/bundledeployments');

      expect(fetch).toHaveBeenCalledWith(
        'https://rancher.test.local/k8s/clusters/local/apis/fleet.cattle.io/v1alpha1/bundledeployments',
        expect.any(Object)
      );
      expect(result).toEqual(mockResponse);
    });

    it('should list BundleDeployments with label selector', async () => {
      const mockResponse = {
        items: [
          {
            metadata: {
              name: 'test-repo-bundle-1',
              namespace: 'fleet-default',
              labels: {
                'fleet.cattle.io/repo-name': 'test-repo'
              }
            }
          }
        ]
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        headers: new Map([['content-type', 'application/json']]),
        json: () => Promise.resolve(mockResponse)
      });

      const result = await client.k8s(
        'local', 
        '/apis/fleet.cattle.io/v1alpha1/bundledeployments?labelSelector=fleet.cattle.io%2Frepo-name%3Dtest-repo'
      );

      expect(fetch).toHaveBeenCalledWith(
        'https://rancher.test.local/k8s/clusters/local/apis/fleet.cattle.io/v1alpha1/bundledeployments?labelSelector=fleet.cattle.io%2Frepo-name%3Dtest-repo',
        expect.any(Object)
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Status summary', () => {
    it('should aggregate status from GitRepos and BundleDeployments', async () => {
      const gitReposResponse = {
        items: [
          {
            metadata: {
              name: 'test-repo',
              namespace: 'fleet-default'
            },
            spec: {
              repo: 'https://github.com/test/repo',
              branch: 'main',
              paths: ['k8s/'],
              paused: false
            },
            status: {
              conditions: [
                {
                  type: 'Ready',
                  status: 'True'
                }
              ]
            }
          }
        ]
      };

      const bundleDeploymentsResponse = {
        items: [
          {
            metadata: {
              name: 'test-repo-bundle-1',
              namespace: 'fleet-default'
            },
            status: {
              summary: {
                ready: 2,
                nonReady: 0,
                total: 2
              },
              ready: true,
              nonReady: 0,
              desiredReady: 2,
              display: {
                readyBundleDeployments: '2/2'
              }
            }
          }
        ]
      };

      (fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          headers: new Map([['content-type', 'application/json']]),
          json: () => Promise.resolve(gitReposResponse)
        })
        .mockResolvedValueOnce({
          ok: true,
          headers: new Map([['content-type', 'application/json']]),
          json: () => Promise.resolve(bundleDeploymentsResponse)
        });

      // This would be the actual implementation logic
      const [repos, bds] = await Promise.all([
        client.k8s('local', '/apis/fleet.cattle.io/v1alpha1/namespaces/fleet-default/gitrepos'),
        client.k8s('local', '/apis/fleet.cattle.io/v1alpha1/bundledeployments')
      ]);

      const summary = {
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

      expect(summary.gitrepos).toHaveLength(1);
      expect(summary.bundleDeployments).toHaveLength(1);
      expect(summary.gitrepos[0].name).toBe('test-repo');
      expect(summary.bundleDeployments[0].ready).toBe(true);
    });
  });
});
