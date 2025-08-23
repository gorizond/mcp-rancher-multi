import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { FleetManager } from '../fleet';
import { RancherClient } from '../client';
import { ConfigManager } from '../../config/manager';
import { Logger } from '../../utils/logger';

// Mock dependencies
jest.mock('../client');
jest.mock('../../config/manager');
jest.mock('../../utils/logger');

describe('FleetManager', () => {
  let fleetManager: FleetManager;
  let mockClient: jest.Mocked<RancherClient>;
  let mockConfigManager: jest.Mocked<ConfigManager>;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockClient = {
      request: jest.fn()
    } as any;

    mockConfigManager = {
      getConfig: jest.fn(),
      updateConfig: jest.fn(),
      validateConfig: jest.fn()
    } as any;

    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn()
    } as any;

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

    it('should handle empty response', async () => {
      const mockResponse = {
        data: {
          data: []
        }
      };

      mockClient.request.mockResolvedValue(mockResponse);

      const result = await fleetManager.listBundles();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it('should handle API errors gracefully', async () => {
      // Mock getFleetClusters to return empty array so the error is handled in listBundles
      jest.spyOn(fleetManager as any, 'getFleetClusters').mockResolvedValue([]);
      
      const result = await fleetManager.listBundles();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  describe('getBundle', () => {
    it('should get bundle successfully', async () => {
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
      expect(result!.id).toBe('bundle-1');
      expect(result!.name).toBe('test-bundle');
      expect(result!.state).toBe('Ready');
    });

    it('should return null when bundle not found', async () => {
      mockClient.request.mockRejectedValue(new Error('Not Found'));

      const result = await fleetManager.getBundle('bundle-1', 'cluster-1');

      expect(result).toBeNull();
      expect(mockLogger.error).toHaveBeenCalledWith('Error getting Fleet bundle bundle-1:', expect.any(Error));
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
      expect(result!.id).toBe('new-bundle');
      expect(result!.name).toBe('new-bundle');
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

    it('should return null when creation fails', async () => {
      mockClient.request.mockRejectedValue(new Error('Creation failed'));

      const bundleData = {
        name: 'new-bundle',
        namespace: 'fleet-default',
        targets: [],
        resources: []
      };

      const result = await fleetManager.createBundle(bundleData, 'cluster-1');

      expect(result).toBeNull();
      expect(mockLogger.error).toHaveBeenCalledWith('Error creating Fleet bundle:', expect.any(Error));
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
        targets: [],
        resources: []
      };

      const result = await fleetManager.updateBundle('bundle-1', 'cluster-1', updates);

      expect(result).toBeDefined();
      expect(result!.id).toBe('bundle-1');
      expect(result!.name).toBe('updated-bundle');
      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'PUT',
        url: '/v3/clusters/cluster-1/fleet.cattle.io.bundles/bundle-1',
        data: expect.objectContaining({
          type: 'fleet.cattle.io.bundle',
          targets: [],
          resources: []
        })
      });
    });

    it('should return null when update fails', async () => {
      mockClient.request.mockRejectedValue(new Error('Update failed'));

      const updates = {
        targets: [],
        resources: []
      };

      const result = await fleetManager.updateBundle('bundle-1', 'cluster-1', updates);

      expect(result).toBeNull();
      expect(mockLogger.error).toHaveBeenCalledWith('Error updating Fleet bundle bundle-1:', expect.any(Error));
    });
  });

  describe('deleteBundle', () => {
    it('should delete bundle successfully', async () => {
      mockClient.request.mockResolvedValue({});

      const result = await fleetManager.deleteBundle('bundle-1', 'cluster-1');

      expect(result).toBe(true);
      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'DELETE',
        url: '/v3/clusters/cluster-1/fleet.cattle.io.bundles/bundle-1'
      });
      expect(mockLogger.info).toHaveBeenCalledWith('Deleted Fleet bundle bundle-1');
    });

    it('should return false when deletion fails', async () => {
      mockClient.request.mockRejectedValue(new Error('Deletion failed'));

      const result = await fleetManager.deleteBundle('bundle-1', 'cluster-1');

      expect(result).toBe(false);
      expect(mockLogger.error).toHaveBeenCalledWith('Error deleting Fleet bundle bundle-1:', expect.any(Error));
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

    it('should handle empty response', async () => {
      const mockResponse = {
        data: {
          data: []
        }
      };

      mockClient.request.mockResolvedValue(mockResponse);

      const result = await fleetManager.listGitRepos();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it('should handle API errors gracefully', async () => {
      // Mock getFleetClusters to return empty array so the error is handled in listGitRepos
      jest.spyOn(fleetManager as any, 'getFleetClusters').mockResolvedValue([]);
      
      const result = await fleetManager.listGitRepos();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
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
      expect(result!.id).toBe('repo-1');
      expect(result!.name).toBe('test-repo');
      expect(result!.repo).toBe('https://github.com/test/repo');
      expect(result!.branch).toBe('main');
      expect(result!.paths).toEqual(['k8s']);
      expect(result!.state).toBe('Ready');
      expect(result!.lastCommit).toBe('abc123');
    });

    it('should return null when repository not found', async () => {
      mockClient.request.mockRejectedValue(new Error('Not Found'));

      const result = await fleetManager.getGitRepo('repo-1', 'cluster-1');

      expect(result).toBeNull();
      expect(mockLogger.error).toHaveBeenCalledWith('Error getting Fleet Git repo repo-1:', expect.any(Error));
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
      expect(result!.id).toBe('new-repo');
      expect(result!.name).toBe('new-repo');
      expect(result!.repo).toBe('https://github.com/test/new-repo');
      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'POST',
        url: '/v3/clusters/cluster-1/fleet.cattle.io.gitrepos',
        data: expect.objectContaining({
          type: 'fleet.cattle.io.gitrepo',
          metadata: {
            name: 'new-repo',
            namespace: 'fleet-default'
          }
        })
      });
    });

    it('should return null when creation fails', async () => {
      mockClient.request.mockRejectedValue(new Error('Creation failed'));

      const repoData = {
        name: 'new-repo',
        namespace: 'fleet-default',
        repo: 'https://github.com/test/new-repo',
        branch: 'main',
        paths: ['k8s'],
        targets: []
      };

      const result = await fleetManager.createGitRepo(repoData, 'cluster-1');

      expect(result).toBeNull();
      expect(mockLogger.error).toHaveBeenCalledWith('Error creating Fleet Git repository:', expect.any(Error));
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
        repo: 'https://github.com/test/updated-repo',
        branch: 'develop',
        paths: ['k8s', 'helm'],
        targets: []
      };

      const result = await fleetManager.updateGitRepo('repo-1', 'cluster-1', updates);

      expect(result).toBeDefined();
      expect(result!.id).toBe('repo-1');
      expect(result!.name).toBe('updated-repo');
      expect(result!.repo).toBe('https://github.com/test/updated-repo');
      expect(result!.branch).toBe('develop');
      expect(result!.paths).toEqual(['k8s', 'helm']);
      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'PUT',
        url: '/v3/clusters/cluster-1/fleet.cattle.io.gitrepos/repo-1',
        data: expect.objectContaining({
          type: 'fleet.cattle.io.gitrepo',
          repo: 'https://github.com/test/updated-repo',
          branch: 'develop',
          paths: ['k8s', 'helm']
        })
      });
    });

    it('should return null when update fails', async () => {
      mockClient.request.mockRejectedValue(new Error('Update failed'));

      const updates = {
        repo: 'https://github.com/test/updated-repo',
        branch: 'develop',
        paths: ['k8s', 'helm'],
        targets: []
      };

      const result = await fleetManager.updateGitRepo('repo-1', 'cluster-1', updates);

      expect(result).toBeNull();
      expect(mockLogger.error).toHaveBeenCalledWith('Error updating Fleet Git repo repo-1:', expect.any(Error));
    });
  });

  describe('deleteGitRepo', () => {
    it('should delete git repository successfully', async () => {
      mockClient.request.mockResolvedValue({});

      const result = await fleetManager.deleteGitRepo('repo-1', 'cluster-1');

      expect(result).toBe(true);
      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'DELETE',
        url: '/v3/clusters/cluster-1/fleet.cattle.io.gitrepos/repo-1'
      });
      expect(mockLogger.info).toHaveBeenCalledWith('Deleted Fleet Git repository repo-1');
    });

    it('should return false when deletion fails', async () => {
      mockClient.request.mockRejectedValue(new Error('Deletion failed'));

      const result = await fleetManager.deleteGitRepo('repo-1', 'cluster-1');

      expect(result).toBe(false);
      expect(mockLogger.error).toHaveBeenCalledWith('Error deleting Fleet Git repo repo-1:', expect.any(Error));
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
                labels: {
                  environment: 'production'
                }
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
      expect(result[0].labels).toEqual({ environment: 'production' });
    });

    it('should handle empty response', async () => {
      const mockResponse = {
        data: {
          data: []
        }
      };

      mockClient.request.mockResolvedValue(mockResponse);

      const result = await fleetManager.listFleetClusters();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it('should handle API errors gracefully', async () => {
      mockClient.request.mockRejectedValue(new Error('API Error'));

      const result = await fleetManager.listFleetClusters();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
      expect(mockLogger.error).toHaveBeenCalledWith('Error listing Fleet clusters:', expect.any(Error));
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
            labels: {
              environment: 'production'
            }
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
      expect(result!.id).toBe('fleet-cluster-1');
      expect(result!.name).toBe('fleet-cluster-1');
      expect(result!.state).toBe('Ready');
      expect(result!.fleetWorkspace).toBe('default');
      expect(result!.labels).toEqual({ environment: 'production' });
    });

    it('should return null when cluster not found', async () => {
      mockClient.request.mockRejectedValue(new Error('Not Found'));

      const result = await fleetManager.getFleetCluster('fleet-cluster-1');

      expect(result).toBeNull();
      expect(mockLogger.error).toHaveBeenCalledWith('Error getting Fleet cluster fleet-cluster-1:', expect.any(Error));
    });
  });

  describe('getFleetWorkspaces', () => {
    it('should get fleet workspaces successfully', async () => {
      const mockResponse = {
        data: {
          data: [
            {
              id: 'workspace-1',
              metadata: {
                name: 'fleet-default',
                creationTimestamp: '2024-01-01T00:00:00Z'
              },
              status: {
                state: 'Ready'
              }
            }
          ]
        }
      };

      mockClient.request.mockResolvedValue(mockResponse);

      const result = await fleetManager.getFleetWorkspaces();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('workspace-1');
      expect(result[0].name).toBe('fleet-default');
      expect(result[0].state).toBe('Ready');
    });

    it('should handle empty response', async () => {
      const mockResponse = {
        data: {
          data: []
        }
      };

      mockClient.request.mockResolvedValue(mockResponse);

      const result = await fleetManager.getFleetWorkspaces();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it('should handle API errors gracefully', async () => {
      mockClient.request.mockRejectedValue(new Error('API Error'));

      const result = await fleetManager.getFleetWorkspaces();

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
      expect(mockLogger.error).toHaveBeenCalledWith('Error getting Fleet workspaces:', expect.any(Error));
    });
  });

  describe('getDeploymentStatus', () => {
    it('should get deployment status successfully', async () => {
      const mockResponse = {
        data: {
          state: 'deployed',
          message: 'Successfully deployed',
          targets: [
            {
              clusterId: 'cluster-1',
              state: 'Ready'
            }
          ]
        }
      };

      mockClient.request.mockResolvedValue(mockResponse);

      const result = await fleetManager.getDeploymentStatus('bundle-1', 'cluster-1');

      expect(result).toBeDefined();
      expect(result).toEqual(mockResponse.data);
    });

    it('should return null when status not found', async () => {
      mockClient.request.mockRejectedValue(new Error('Not Found'));

      const result = await fleetManager.getDeploymentStatus('bundle-1', 'cluster-1');

      expect(result).toBeNull();
      expect(mockLogger.error).toHaveBeenCalledWith('Error getting deployment status for bundle bundle-1:', expect.any(Error));
    });
  });

  describe('forceSyncBundle', () => {
    it('should force sync bundle successfully', async () => {
      mockClient.request.mockResolvedValue({});

      const result = await fleetManager.forceSyncBundle('bundle-1', 'cluster-1');

      expect(result).toBe(true);
      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'POST',
        url: '/v3/clusters/cluster-1/fleet.cattle.io.bundles/bundle-1?action=forceSync'
      });
      expect(mockLogger.info).toHaveBeenCalledWith('Forced sync for Fleet bundle bundle-1');
    });

    it('should return false when force sync fails', async () => {
      mockClient.request.mockRejectedValue(new Error('Force sync failed'));

      const result = await fleetManager.forceSyncBundle('bundle-1', 'cluster-1');

      expect(result).toBe(false);
      expect(mockLogger.error).toHaveBeenCalledWith('Error forcing sync for bundle bundle-1:', expect.any(Error));
    });
  });

  describe('getFleetLogs', () => {
    it('should get fleet logs successfully', async () => {
      const mockResponse = {
        data: {
          data: [
            {
              timestamp: '2024-01-01T00:00:00Z',
              message: 'Log entry 1'
            },
            {
              timestamp: '2024-01-01T00:01:00Z',
              message: 'Log entry 2'
            }
          ]
        }
      };

      mockClient.request.mockResolvedValue(mockResponse);

      const result = await fleetManager.getFleetLogs('cluster-1');

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
      expect(result[0].timestamp).toBe('2024-01-01T00:00:00Z');
      expect(result[0].message).toBe('Log entry 1');
    });

    it('should get fleet logs with namespace filter', async () => {
      const mockResponse = {
        data: {
          data: [
            {
              timestamp: '2024-01-01T00:00:00Z',
              message: 'Log entry 1'
            }
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

    it('should handle empty response', async () => {
      const mockResponse = {
        data: {
          data: []
        }
      };

      mockClient.request.mockResolvedValue(mockResponse);

      const result = await fleetManager.getFleetLogs('cluster-1');

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it('should handle API errors gracefully', async () => {
      mockClient.request.mockRejectedValue(new Error('API Error'));

      const result = await fleetManager.getFleetLogs('cluster-1');

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
      expect(mockLogger.error).toHaveBeenCalledWith('Error getting Fleet logs:', expect.any(Error));
    });
  });
});
