import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { FleetManager } from '../fleet';

describe('FleetManager', () => {
  let fleetManager: FleetManager;
  let mockClient: any;
  let mockConfigManager: any;
  let mockLogger: any;

  beforeEach(() => {
    // Create mocks
    mockClient = {
      request: jest.fn()
    };

    mockConfigManager = {
      getConfig: jest.fn().mockReturnValue({})
    };

    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn()
    };

    fleetManager = new FleetManager(mockClient, mockConfigManager, mockLogger);
  });

  describe('listBundles', () => {
    it('should list bundles successfully', async () => {
      const mockResponse = {
        data: {
          data: [
            {
              id: 'bundle-1',
              metadata: {
                name: 'test-bundle',
                namespace: 'fleet-default',
                creationTimestamp: '2024-01-01T00:00:00Z'
              },
              clusterId: 'cluster-1',
              status: {
                state: 'Ready',
                targets: [],
                resources: []
              }
            }
          ]
        }
      };

      mockClient.request.mockResolvedValue(mockResponse);

      const result = await fleetManager.listBundles();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('bundle-1');
      expect(result[0].name).toBe('test-bundle');
      expect(result[0].state).toBe('Ready');
    });

    it('should handle errors gracefully', async () => {
      mockClient.request.mockRejectedValue(new Error('API Error'));

      // Mock getFleetClusters to return a cluster so the error is thrown when calling the API
      jest.spyOn(fleetManager as any, 'getFleetClusters').mockResolvedValue(['cluster-1']);

      const result = await fleetManager.listBundles();
      expect(result).toEqual([]);
      expect(mockLogger.warn).toHaveBeenCalled();
    });
  });

  describe('getBundle', () => {
    it('should get bundle by id successfully', async () => {
      const mockResponse = {
        data: {
          id: 'bundle-1',
          metadata: {
            name: 'test-bundle',
            namespace: 'fleet-default',
            creationTimestamp: '2024-01-01T00:00:00Z'
          },
          clusterId: 'cluster-1',
          status: {
            state: 'Ready',
            targets: [],
            resources: []
          }
        }
      };

      mockClient.request.mockResolvedValue(mockResponse);

      const result = await fleetManager.getBundle('bundle-1', 'cluster-1');

      expect(result).toBeDefined();
      expect(result.id).toBe('bundle-1');
      expect(result.name).toBe('test-bundle');
      expect(result.state).toBe('Ready');
    });
  });

  describe('createBundle', () => {
    it('should create bundle successfully', async () => {
      const mockResponse = {
        data: {
          id: 'new-bundle',
          metadata: {
            name: 'new-bundle',
            namespace: 'fleet-default',
            creationTimestamp: '2024-01-01T00:00:00Z'
          },
          clusterId: 'cluster-1',
          status: {
            state: 'Pending',
            targets: [],
            resources: []
          }
        }
      };

      mockClient.request.mockResolvedValue(mockResponse);

      const bundleData = {
        name: 'new-bundle',
        namespace: 'fleet-default',
        targets: [],
        resources: []
      };

      const result = await fleetManager.createBundle(bundleData, 'cluster-1');

      expect(result).toBeDefined();
      expect(result.id).toBe('new-bundle');
      expect(result.name).toBe('new-bundle');
      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'POST',
        url: '/v3/clusters/cluster-1/fleet.cattle.io.bundles',
        data: expect.objectContaining({
          type: 'fleet.cattle.io.bundle',
          metadata: {
            name: 'new-bundle',
            namespace: 'fleet-default'
          }
        })
      });
    });
  });

  describe('listGitRepos', () => {
    it('should list git repositories successfully', async () => {
      const mockResponse = {
        data: {
          data: [
            {
              id: 'repo-1',
              metadata: {
                name: 'test-repo',
                namespace: 'fleet-default',
                creationTimestamp: '2024-01-01T00:00:00Z'
              },
              spec: {
                repo: 'https://github.com/test/repo',
                branch: 'main',
                paths: ['k8s']
              },
              status: {
                state: 'Ready',
                targets: [],
                lastCommit: 'abc123'
              }
            }
          ]
        }
      };

      mockClient.request.mockResolvedValue(mockResponse);

      const result = await fleetManager.listGitRepos();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('repo-1');
      expect(result[0].name).toBe('test-repo');
      expect(result[0].repo).toBe('https://github.com/test/repo');
      expect(result[0].branch).toBe('main');
    });
  });

  describe('createGitRepo', () => {
    it('should create git repository successfully', async () => {
      const mockResponse = {
        data: {
          id: 'new-repo',
          metadata: {
            name: 'new-repo',
            namespace: 'fleet-default',
            creationTimestamp: '2024-01-01T00:00:00Z'
          },
          spec: {
            repo: 'https://github.com/test/new-repo',
            branch: 'main',
            paths: ['k8s']
          },
          status: {
            state: 'Pending',
            targets: [],
            lastCommit: null
          }
        }
      };

      mockClient.request.mockResolvedValue(mockResponse);

      const repoData = {
        name: 'new-repo',
        namespace: 'fleet-default',
        repo: 'https://github.com/test/new-repo',
        branch: 'main',
        paths: ['k8s'],
        targets: []
      };

      const result = await fleetManager.createGitRepo(repoData, 'cluster-1');

      expect(result).toBeDefined();
      expect(result.id).toBe('new-repo');
      expect(result.name).toBe('new-repo');
      expect(result.repo).toBe('https://github.com/test/new-repo');
      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'POST',
        url: '/v3/clusters/cluster-1/fleet.cattle.io.gitrepos',
        data: expect.objectContaining({
          type: 'fleet.cattle.io.gitrepo',
          metadata: {
            name: 'new-repo',
            namespace: 'fleet-default'
          },
          spec: {
            repo: 'https://github.com/test/new-repo',
            branch: 'main',
            paths: ['k8s'],
            targets: []
          }
        })
      });
    });
  });

  describe('listFleetClusters', () => {
    it('should list fleet clusters successfully', async () => {
      const mockResponse = {
        data: {
          data: [
            {
              id: 'fleet-cluster-1',
              metadata: {
                name: 'fleet-cluster-1',
                namespace: 'fleet-default',
                creationTimestamp: '2024-01-01T00:00:00Z',
                labels: { environment: 'production' }
              },
              spec: {
                fleetWorkspace: 'default'
              },
              status: {
                state: 'Ready'
              }
            }
          ]
        }
      };

      mockClient.request.mockResolvedValue(mockResponse);

      const result = await fleetManager.listFleetClusters();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('fleet-cluster-1');
      expect(result[0].name).toBe('fleet-cluster-1');
      expect(result[0].state).toBe('Ready');
      expect(result[0].fleetWorkspace).toBe('default');
    });
  });

  describe('forceSyncBundle', () => {
    it('should force sync bundle successfully', async () => {
      mockClient.request.mockResolvedValue({});

      await fleetManager.forceSyncBundle('bundle-1', 'cluster-1');

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'POST',
        url: '/v3/clusters/cluster-1/fleet.cattle.io.bundles/bundle-1?action=forceSync'
      });
      expect(mockLogger.info).toHaveBeenCalledWith('Forced sync for Fleet bundle bundle-1');
    });
  });

  describe('getDeploymentStatus', () => {
    it('should get deployment status successfully', async () => {
      const mockResponse = {
        data: {
          state: 'Ready',
          targets: [
            {
              clusterId: 'cluster-1',
              clusterName: 'test-cluster',
              state: 'Ready'
            }
          ]
        }
      };

      mockClient.request.mockResolvedValue(mockResponse);

      const result = await fleetManager.getDeploymentStatus('bundle-1', 'cluster-1');

      expect(result).toBeDefined();
      expect(result.state).toBe('Ready');
      expect(result.targets).toBeDefined();
      expect(result.targets.length).toBe(1);
    });

    it('should handle deployment status errors', async () => {
      mockClient.request.mockRejectedValue(new Error('Failed to get deployment status'));

      await expect(fleetManager.getDeploymentStatus('bundle-1', 'cluster-1'))
        .rejects.toThrow('Failed to get deployment status');
      expect(mockLogger.error).toHaveBeenCalledWith('Error getting deployment status for bundle bundle-1:', expect.any(Error));
    });
  });

  describe('updateBundle', () => {
    it('should update bundle successfully', async () => {
      const mockResponse = {
        data: {
          id: 'bundle-1',
          metadata: {
            name: 'updated-bundle',
            namespace: 'fleet-default',
            creationTimestamp: '2024-01-01T00:00:00Z'
          },
          clusterId: 'cluster-1',
          status: {
            state: 'Ready',
            targets: [],
            resources: []
          }
        }
      };

      mockClient.request.mockResolvedValue(mockResponse);

      const updates = {
        name: 'updated-bundle',
        targets: [{ clusterId: 'cluster-1', clusterName: 'test-cluster', state: 'Ready' }]
      };

      const result = await fleetManager.updateBundle('bundle-1', 'cluster-1', updates);

      expect(result).toBeDefined();
      expect(result.id).toBe('bundle-1');
      expect(result.name).toBe('updated-bundle');
      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'PUT',
        url: '/v3/clusters/cluster-1/fleet.cattle.io.bundles/bundle-1',
        data: expect.objectContaining({
          ...updates,
          type: 'fleet.cattle.io.bundle'
        })
      });
    });

    it('should handle update bundle errors', async () => {
      mockClient.request.mockRejectedValue(new Error('Failed to update bundle'));

      await expect(fleetManager.updateBundle('bundle-1', 'cluster-1', {}))
        .rejects.toThrow('Failed to update bundle');
      expect(mockLogger.error).toHaveBeenCalledWith('Error updating Fleet bundle bundle-1:', expect.any(Error));
    });
  });

  describe('deleteBundle', () => {
    it('should delete bundle successfully', async () => {
      mockClient.request.mockResolvedValue({});

      await fleetManager.deleteBundle('bundle-1', 'cluster-1');

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'DELETE',
        url: '/v3/clusters/cluster-1/fleet.cattle.io.bundles/bundle-1'
      });
      expect(mockLogger.info).toHaveBeenCalledWith('Deleted Fleet bundle bundle-1');
    });

    it('should handle delete bundle errors', async () => {
      mockClient.request.mockRejectedValue(new Error('Failed to delete bundle'));

      await expect(fleetManager.deleteBundle('bundle-1', 'cluster-1'))
        .rejects.toThrow('Failed to delete bundle');
      expect(mockLogger.error).toHaveBeenCalledWith('Error deleting Fleet bundle bundle-1:', expect.any(Error));
    });
  });

  describe('getGitRepo', () => {
    it('should get git repository successfully', async () => {
      const mockResponse = {
        data: {
          id: 'repo-1',
          metadata: {
            name: 'test-repo',
            namespace: 'fleet-default',
            creationTimestamp: '2024-01-01T00:00:00Z'
          },
          spec: {
            repo: 'https://github.com/test/repo',
            branch: 'main',
            paths: ['k8s']
          },
          status: {
            state: 'Ready',
            targets: [],
            lastCommit: 'abc123'
          }
        }
      };

      mockClient.request.mockResolvedValue(mockResponse);

      const result = await fleetManager.getGitRepo('repo-1', 'cluster-1');

      expect(result).toBeDefined();
      expect(result.id).toBe('repo-1');
      expect(result.name).toBe('test-repo');
      expect(result.repo).toBe('https://github.com/test/repo');
      expect(result.branch).toBe('main');
      expect(result.paths).toEqual(['k8s']);
      expect(result.state).toBe('Ready');
      expect(result.lastCommit).toBe('abc123');
    });

    it('should handle get git repo errors', async () => {
      mockClient.request.mockRejectedValue(new Error('Failed to get git repo'));

      await expect(fleetManager.getGitRepo('repo-1', 'cluster-1'))
        .rejects.toThrow('Failed to get git repo');
      expect(mockLogger.error).toHaveBeenCalledWith('Error getting Fleet Git repo repo-1:', expect.any(Error));
    });
  });

  describe('updateGitRepo', () => {
    it('should update git repository successfully', async () => {
      const mockResponse = {
        data: {
          id: 'repo-1',
          metadata: {
            name: 'updated-repo',
            namespace: 'fleet-default',
            creationTimestamp: '2024-01-01T00:00:00Z'
          },
          spec: {
            repo: 'https://github.com/test/updated-repo',
            branch: 'develop',
            paths: ['k8s', 'helm']
          },
          status: {
            state: 'Ready',
            targets: [],
            lastCommit: 'def456'
          }
        }
      };

      mockClient.request.mockResolvedValue(mockResponse);

      const updates = {
        name: 'updated-repo',
        repo: 'https://github.com/test/updated-repo',
        branch: 'develop',
        paths: ['k8s', 'helm']
      };

      const result = await fleetManager.updateGitRepo('repo-1', 'cluster-1', updates);

      expect(result).toBeDefined();
      expect(result.id).toBe('repo-1');
      expect(result.name).toBe('updated-repo');
      expect(result.repo).toBe('https://github.com/test/updated-repo');
      expect(result.branch).toBe('develop');
      expect(result.paths).toEqual(['k8s', 'helm']);
      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'PUT',
        url: '/v3/clusters/cluster-1/fleet.cattle.io.gitrepos/repo-1',
        data: expect.objectContaining({
          ...updates,
          type: 'fleet.cattle.io.gitrepo'
        })
      });
    });

    it('should handle update git repo errors', async () => {
      mockClient.request.mockRejectedValue(new Error('Failed to update git repo'));

      await expect(fleetManager.updateGitRepo('repo-1', 'cluster-1', {}))
        .rejects.toThrow('Failed to update git repo');
      expect(mockLogger.error).toHaveBeenCalledWith('Error updating Fleet Git repo repo-1:', expect.any(Error));
    });
  });

  describe('deleteGitRepo', () => {
    it('should delete git repository successfully', async () => {
      mockClient.request.mockResolvedValue({});

      await fleetManager.deleteGitRepo('repo-1', 'cluster-1');

      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'DELETE',
        url: '/v3/clusters/cluster-1/fleet.cattle.io.gitrepos/repo-1'
      });
      expect(mockLogger.info).toHaveBeenCalledWith('Deleted Fleet Git repository repo-1');
    });

    it('should handle delete git repo errors', async () => {
      mockClient.request.mockRejectedValue(new Error('Failed to delete git repo'));

      await expect(fleetManager.deleteGitRepo('repo-1', 'cluster-1'))
        .rejects.toThrow('Failed to delete git repo');
      expect(mockLogger.error).toHaveBeenCalledWith('Error deleting Fleet Git repo repo-1:', expect.any(Error));
    });
  });

  describe('getFleetCluster', () => {
    it('should get fleet cluster successfully', async () => {
      const mockResponse = {
        data: {
          id: 'fleet-cluster-1',
          metadata: {
            name: 'fleet-cluster-1',
            namespace: 'fleet-default',
            creationTimestamp: '2024-01-01T00:00:00Z',
            labels: { environment: 'production' }
          },
          spec: {
            fleetWorkspace: 'default'
          },
          status: {
            state: 'Ready'
          }
        }
      };

      mockClient.request.mockResolvedValue(mockResponse);

      const result = await fleetManager.getFleetCluster('fleet-cluster-1');

      expect(result).toBeDefined();
      expect(result.id).toBe('fleet-cluster-1');
      expect(result.name).toBe('fleet-cluster-1');
      expect(result.state).toBe('Ready');
      expect(result.fleetWorkspace).toBe('default');
      expect(result.labels).toEqual({ environment: 'production' });
    });

    it('should handle get fleet cluster errors', async () => {
      mockClient.request.mockRejectedValue(new Error('Failed to get fleet cluster'));

      await expect(fleetManager.getFleetCluster('fleet-cluster-1'))
        .rejects.toThrow('Failed to get fleet cluster');
      expect(mockLogger.error).toHaveBeenCalledWith('Error getting Fleet cluster fleet-cluster-1:', expect.any(Error));
    });
  });

  describe('getFleetWorkspaces', () => {
    it('should get fleet workspaces successfully', async () => {
      const mockResponse = {
        data: {
          data: [
            { id: 'workspace-1', name: 'default' },
            { id: 'workspace-2', name: 'production' }
          ]
        }
      };

      mockClient.request.mockResolvedValue(mockResponse);

      const result = await fleetManager.getFleetWorkspaces();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
      expect(result[0]).toEqual({ id: 'workspace-1', name: 'default' });
      expect(result[1]).toEqual({ id: 'workspace-2', name: 'production' });
    });

    it('should handle empty workspaces response', async () => {
      const mockResponse = {};

      mockClient.request.mockResolvedValue(mockResponse);

      const result = await fleetManager.getFleetWorkspaces();

      expect(result).toEqual([]);
    });

    it('should handle get fleet workspaces errors', async () => {
      mockClient.request.mockRejectedValue(new Error('Failed to get fleet workspaces'));

      await expect(fleetManager.getFleetWorkspaces())
        .rejects.toThrow('Failed to get fleet workspaces');
      expect(mockLogger.error).toHaveBeenCalledWith('Error getting Fleet workspaces:', expect.any(Error));
    });
  });

  describe('getFleetLogs', () => {
    it('should get fleet logs successfully', async () => {
      const mockResponse = {
        data: {
          data: [
            { id: 'log-1', message: 'Bundle deployed successfully' },
            { id: 'log-2', message: 'Git repo synced' }
          ]
        }
      };

      mockClient.request.mockResolvedValue(mockResponse);

      const result = await fleetManager.getFleetLogs('cluster-1');

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
      expect(result[0]).toEqual({ id: 'log-1', message: 'Bundle deployed successfully' });
      expect(result[1]).toEqual({ id: 'log-2', message: 'Git repo synced' });
    });

    it('should get fleet logs with namespace', async () => {
      const mockResponse = {
        data: {
          data: [
            { id: 'log-1', message: 'Bundle deployed successfully', namespace: 'fleet-default' }
          ]
        }
      };

      mockClient.request.mockResolvedValue(mockResponse);

      const result = await fleetManager.getFleetLogs('cluster-1', 'fleet-default');

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'GET',
        url: '/v3/clusters/cluster-1/fleet.cattle.io.bundles?namespace=fleet-default'
      });
    });

    it('should handle empty logs response', async () => {
      const mockResponse = {};

      mockClient.request.mockResolvedValue(mockResponse);

      const result = await fleetManager.getFleetLogs('cluster-1');

      expect(result).toEqual([]);
    });

    it('should handle get fleet logs errors', async () => {
      mockClient.request.mockRejectedValue(new Error('Failed to get fleet logs'));

      await expect(fleetManager.getFleetLogs('cluster-1'))
        .rejects.toThrow('Failed to get fleet logs');
      expect(mockLogger.error).toHaveBeenCalledWith('Error getting Fleet logs:', expect.any(Error));
    });
  });

  describe('listBundles with specific clusterId', () => {
    it('should list bundles for specific cluster', async () => {
      const mockResponse = {
        data: {
          data: [
            {
              id: 'bundle-1',
              metadata: {
                name: 'test-bundle',
                namespace: 'fleet-default',
                creationTimestamp: '2024-01-01T00:00:00Z'
              },
              clusterId: 'cluster-1',
              status: {
                state: 'Ready',
                targets: [],
                resources: []
              }
            }
          ]
        }
      };

      mockClient.request.mockResolvedValue(mockResponse);

      const result = await fleetManager.listBundles('cluster-1');

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('bundle-1');
      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'GET',
        url: '/v3/clusters/cluster-1/fleet.cattle.io.bundles'
      });
    });
  });

  describe('listGitRepos with specific clusterId', () => {
    it('should list git repos for specific cluster', async () => {
      const mockResponse = {
        data: {
          data: [
            {
              id: 'repo-1',
              metadata: {
                name: 'test-repo',
                namespace: 'fleet-default',
                creationTimestamp: '2024-01-01T00:00:00Z'
              },
              spec: {
                repo: 'https://github.com/test/repo',
                branch: 'main',
                paths: ['k8s']
              },
              status: {
                state: 'Ready',
                targets: [],
                lastCommit: 'abc123'
              }
            }
          ]
        }
      };

      mockClient.request.mockResolvedValue(mockResponse);

      const result = await fleetManager.listGitRepos('cluster-1');

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('repo-1');
      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'GET',
        url: '/v3/clusters/cluster-1/fleet.cattle.io.gitrepos'
      });
    });
  });

  describe('forceSyncBundle errors', () => {
    it('should handle force sync bundle errors', async () => {
      mockClient.request.mockRejectedValue(new Error('Failed to force sync bundle'));

      await expect(fleetManager.forceSyncBundle('bundle-1', 'cluster-1'))
        .rejects.toThrow('Failed to force sync bundle');
      expect(mockLogger.error).toHaveBeenCalledWith('Error forcing sync for bundle bundle-1:', expect.any(Error));
    });
  });

  describe('listFleetClusters errors', () => {
    it('should handle list fleet clusters errors', async () => {
      mockClient.request.mockRejectedValue(new Error('Failed to list fleet clusters'));

      await expect(fleetManager.listFleetClusters())
        .rejects.toThrow('Failed to list fleet clusters');
      expect(mockLogger.error).toHaveBeenCalledWith('Error listing Fleet clusters:', expect.any(Error));
    });

    it('should handle empty fleet clusters response', async () => {
      const mockResponse = {};

      mockClient.request.mockResolvedValue(mockResponse);

      const result = await fleetManager.listFleetClusters();

      expect(result).toEqual([]);
    });
  });

  describe('getBundle errors', () => {
    it('should handle get bundle errors', async () => {
      mockClient.request.mockRejectedValue(new Error('Failed to get bundle'));

      await expect(fleetManager.getBundle('bundle-1', 'cluster-1'))
        .rejects.toThrow('Failed to get bundle');
      expect(mockLogger.error).toHaveBeenCalledWith('Error getting Fleet bundle bundle-1:', expect.any(Error));
    });
  });

  describe('createBundle errors', () => {
    it('should handle create bundle errors', async () => {
      mockClient.request.mockRejectedValue(new Error('Failed to create bundle'));

      await expect(fleetManager.createBundle({ name: 'test' }, 'cluster-1'))
        .rejects.toThrow('Failed to create bundle');
      expect(mockLogger.error).toHaveBeenCalledWith('Error creating Fleet bundle:', expect.any(Error));
    });
  });

  describe('listGitRepos errors', () => {
    it('should handle list git repos errors', async () => {
      mockClient.request.mockRejectedValue(new Error('Failed to list git repos'));

      // Mock getFleetClusters to return a cluster so the error is thrown when calling the API
      jest.spyOn(fleetManager as any, 'getFleetClusters').mockResolvedValue(['cluster-1']);

      const result = await fleetManager.listGitRepos();
      expect(result).toEqual([]);
      expect(mockLogger.warn).toHaveBeenCalled();
    });
  });

  describe('createGitRepo errors', () => {
    it('should handle create git repo errors', async () => {
      mockClient.request.mockRejectedValue(new Error('Failed to create git repo'));

      await expect(fleetManager.createGitRepo({ name: 'test', repo: 'https://github.com/test/repo' }, 'cluster-1'))
        .rejects.toThrow('Failed to create git repo');
      expect(mockLogger.error).toHaveBeenCalledWith('Error creating Fleet Git repository:', expect.any(Error));
    });
  });

  describe('getFleetClusters private method', () => {
    it('should return cluster IDs from fleet clusters', async () => {
      const mockFleetClusters = [
        { 
          id: 'cluster-1', 
          name: 'cluster-1',
          namespace: 'fleet-default',
          state: 'Ready',
          labels: {},
          fleetWorkspace: 'default',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        },
        { 
          id: 'cluster-2', 
          name: 'cluster-2',
          namespace: 'fleet-default',
          state: 'Ready',
          labels: {},
          fleetWorkspace: 'default',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        }
      ];

      jest.spyOn(fleetManager, 'listFleetClusters').mockResolvedValue(mockFleetClusters);

      const result = await (fleetManager as any).getFleetClusters();

      expect(result).toEqual(['cluster-1', 'cluster-2']);
    });

    it('should handle errors in getFleetClusters and return empty array', async () => {
      jest.spyOn(fleetManager, 'listFleetClusters').mockRejectedValue(new Error('Failed to get fleet clusters'));

      const result = await (fleetManager as any).getFleetClusters();

      expect(result).toEqual([]);
      expect(mockLogger.error).toHaveBeenCalledWith('Error getting Fleet clusters:', expect.any(Error));
    });
  });

  describe('mapping methods', () => {
    it('should map bundle data correctly', () => {
      const bundleData = {
        id: 'bundle-1',
        metadata: {
          name: 'test-bundle',
          namespace: 'fleet-default',
          creationTimestamp: '2024-01-01T00:00:00Z',
          annotations: {
            'cattle.io/timestamp': '2024-01-01T01:00:00Z'
          }
        },
        clusterId: 'cluster-1',
        status: {
          state: 'Ready',
          targets: [{ clusterId: 'cluster-1', clusterName: 'test-cluster', state: 'Ready' }],
          resources: [{ apiVersion: 'v1', kind: 'ConfigMap', name: 'test-config', namespace: 'default', state: 'Ready' }]
        }
      };

      const result = (fleetManager as any).mapBundle(bundleData);

      expect(result).toEqual({
        id: 'bundle-1',
        name: 'test-bundle',
        namespace: 'fleet-default',
        clusterId: 'cluster-1',
        state: 'Ready',
        targets: [{ clusterId: 'cluster-1', clusterName: 'test-cluster', state: 'Ready' }],
        resources: [{ apiVersion: 'v1', kind: 'ConfigMap', name: 'test-config', namespace: 'default', state: 'Ready' }],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T01:00:00Z'
      });
    });

    it('should map git repo data correctly', () => {
      const gitRepoData = {
        id: 'repo-1',
        metadata: {
          name: 'test-repo',
          namespace: 'fleet-default',
          creationTimestamp: '2024-01-01T00:00:00Z',
          annotations: {
            'cattle.io/timestamp': '2024-01-01T01:00:00Z'
          }
        },
        spec: {
          repo: 'https://github.com/test/repo',
          branch: 'main',
          paths: ['k8s']
        },
        status: {
          state: 'Ready',
          targets: [{ clusterId: 'cluster-1', clusterName: 'test-cluster', state: 'Ready' }],
          lastCommit: 'abc123'
        }
      };

      const result = (fleetManager as any).mapGitRepo(gitRepoData);

      expect(result).toEqual({
        id: 'repo-1',
        name: 'test-repo',
        namespace: 'fleet-default',
        repo: 'https://github.com/test/repo',
        branch: 'main',
        paths: ['k8s'],
        targets: [{ clusterId: 'cluster-1', clusterName: 'test-cluster', state: 'Ready' }],
        state: 'Ready',
        lastCommit: 'abc123',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T01:00:00Z'
      });
    });

    it('should map fleet cluster data correctly', () => {
      const fleetClusterData = {
        id: 'fleet-cluster-1',
        metadata: {
          name: 'fleet-cluster-1',
          namespace: 'fleet-default',
          creationTimestamp: '2024-01-01T00:00:00Z',
          annotations: {
            'cattle.io/timestamp': '2024-01-01T01:00:00Z'
          },
          labels: { environment: 'production' }
        },
        spec: {
          fleetWorkspace: 'default'
        },
        status: {
          state: 'Ready'
        }
      };

      const result = (fleetManager as any).mapFleetCluster(fleetClusterData);

      expect(result).toEqual({
        id: 'fleet-cluster-1',
        name: 'fleet-cluster-1',
        namespace: 'fleet-default',
        state: 'Ready',
        labels: { environment: 'production' },
        fleetWorkspace: 'default',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T01:00:00Z'
      });
    });

    it('should handle missing optional fields in mapping', () => {
      const bundleData = {
        id: 'bundle-1',
        metadata: {
          name: 'test-bundle'
        },
        clusterId: 'cluster-1'
      };

      const result = (fleetManager as any).mapBundle(bundleData);

      expect(result).toEqual({
        id: 'bundle-1',
        name: 'test-bundle',
        namespace: undefined,
        clusterId: 'cluster-1',
        state: 'unknown',
        targets: [],
        resources: [],
        createdAt: undefined,
        updatedAt: undefined
      });
    });
  });
});
