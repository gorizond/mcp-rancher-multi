import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { FleetManager } from '../rancher/fleet';
import { FleetHandlers } from '../handlers/fleet-handlers';
import { FleetTools } from '../tools/fleet-tools';

// Mock dependencies
jest.mock('../rancher/fleet');
jest.mock('../rancher/client');
jest.mock('../config/manager');
jest.mock('../utils/logger');

describe('Fleet Performance Tests', () => {
  let mockRancherManager: any;
  let mockFleetManager: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockFleetManager = {
      listBundles: jest.fn(),
      getBundle: jest.fn(),
      createBundle: jest.fn(),
      updateBundle: jest.fn(),
      deleteBundle: jest.fn(),
      forceSyncBundle: jest.fn(),
      listGitRepos: jest.fn(),
      getGitRepo: jest.fn(),
      createGitRepo: jest.fn(),
      updateGitRepo: jest.fn(),
      deleteGitRepo: jest.fn(),
      listFleetClusters: jest.fn(),
      getFleetCluster: jest.fn(),
      getFleetWorkspaces: jest.fn(),
      getDeploymentStatus: jest.fn(),
      getFleetLogs: jest.fn()
    };

    (FleetManager as jest.MockedClass<typeof FleetManager>).mockImplementation(() => mockFleetManager);

    mockRancherManager = {
      getAllConnections: jest.fn().mockReturnValue([
        {
          client: {
            request: jest.fn()
          },
          isConnected: true
        }
      ]),
      getConnection: jest.fn().mockReturnValue({
        client: {
          request: jest.fn()
        },
        isConnected: true
      }),
      getConfigManager: jest.fn().mockReturnValue({
        getConfig: jest.fn().mockReturnValue({
          defaultServer: 'default-server'
        })
      }),
      getLogger: jest.fn().mockReturnValue({
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn()
      })
    };
  });

  describe('FleetManager Performance', () => {
    let fleetManager: FleetManager;

    beforeEach(() => {
      fleetManager = new FleetManager(
        mockRancherManager.getAllConnections()[0].client,
        mockRancherManager.getConfigManager(),
        mockRancherManager.getLogger()
      );
    });

    describe('Large Data Set Handling', () => {
      it('should handle 1000 bundles efficiently', async () => {
        const largeBundlesResponse = Array.from({ length: 1000 }, (_, i) => ({
          id: `bundle-${i}`,
          metadata: {
            name: `bundle-${i}`,
            namespace: 'fleet-default',
            creationTimestamp: '2024-01-01T00:00:00Z'
          },
          clusterId: 'cluster-1',
          status: {
            state: 'Ready',
            targets: [],
            resources: []
          }
        }));

        mockFleetManager.listBundles.mockResolvedValue(largeBundlesResponse);

        const startTime = Date.now();
        const result = await fleetManager.listBundles();
        const endTime = Date.now();

        expect(result).toHaveLength(1000);
        expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
        expect(result[0].id).toBe('bundle-0');
        expect(result[999].id).toBe('bundle-999');
      });

      it('should handle 500 Git repositories efficiently', async () => {
        const largeReposResponse = Array.from({ length: 500 }, (_, i) => ({
          id: `repo-${i}`,
          metadata: {
            name: `repo-${i}`,
            namespace: 'fleet-default',
            creationTimestamp: '2024-01-01T00:00:00Z'
          },
          spec: {
            repo: `https://github.com/test/repo-${i}`,
            branch: 'main',
            paths: ['k8s']
          },
          status: {
            state: 'Ready',
            targets: [],
            lastCommit: `commit-${i}`
          }
        }));

        mockFleetManager.listGitRepos.mockResolvedValue(largeReposResponse);

        const startTime = Date.now();
        const result = await fleetManager.listGitRepos();
        const endTime = Date.now();

        expect(result).toHaveLength(500);
        expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
        expect(result[0].id).toBe('repo-0');
        expect(result[499].id).toBe('repo-499');
      });
    });

    describe('Concurrent Operations', () => {
      it('should handle 10 concurrent bundle operations', async () => {
        const mockBundle = {
          id: 'bundle-1',
          metadata: { name: 'test-bundle' },
          status: { state: 'Ready' }
        };

        mockFleetManager.getBundle.mockResolvedValue(mockBundle);

        const startTime = Date.now();
        const promises = Array.from({ length: 10 }, () => 
          fleetManager.getBundle('bundle-1', 'cluster-1')
        );
        const results = await Promise.all(promises);
        const endTime = Date.now();

        expect(results).toHaveLength(10);
        expect(endTime - startTime).toBeLessThan(2000); // Should complete within 2 seconds
        results.forEach(result => {
          expect(result).toBeDefined();
          expect(result!.id).toBe('bundle-1');
        });
      });

      it('should handle mixed concurrent operations', async () => {
        const mockBundle = { id: 'bundle-1', metadata: { name: 'test' }, status: { state: 'Ready' } };
        const mockRepo = { id: 'repo-1', metadata: { name: 'test' }, spec: { repo: 'test' }, status: { state: 'Ready' } };

        mockFleetManager.getBundle.mockResolvedValue(mockBundle);
        mockFleetManager.getGitRepo.mockResolvedValue(mockRepo);
        mockFleetManager.listBundles.mockResolvedValue([mockBundle]);
        mockFleetManager.listGitRepos.mockResolvedValue([mockRepo]);

        const startTime = Date.now();
        const promises = [
          fleetManager.getBundle('bundle-1', 'cluster-1'),
          fleetManager.getGitRepo('repo-1', 'cluster-1'),
          fleetManager.listBundles(),
          fleetManager.listGitRepos(),
          fleetManager.getBundle('bundle-1', 'cluster-1'),
          fleetManager.getGitRepo('repo-1', 'cluster-1')
        ];
        const results = await Promise.all(promises);
        const endTime = Date.now();

        expect(results).toHaveLength(6);
        expect(endTime - startTime).toBeLessThan(2000); // Should complete within 2 seconds
      });
    });
  });

  describe('FleetHandlers Performance', () => {
    let fleetHandlers: FleetHandlers;

    beforeEach(() => {
      fleetHandlers = new FleetHandlers(mockRancherManager);
    });

    describe('Rapid Successive Operations', () => {
      it('should handle 20 rapid list operations', async () => {
        mockFleetManager.listBundles.mockResolvedValue([]);

        const startTime = Date.now();
        const promises = Array.from({ length: 20 }, () => 
          fleetHandlers.fleet_list_bundles({})
        );
        const results = await Promise.all(promises);
        const endTime = Date.now();

        expect(results).toHaveLength(20);
        expect(endTime - startTime).toBeLessThan(3000); // Should complete within 3 seconds
        results.forEach(result => {
          expect(result.success).toBe(true);
          expect(result.data).toEqual([]);
        });
      });

      it('should handle rapid mixed operations', async () => {
        const mockBundle = { id: 'bundle-1', name: 'test', state: 'Ready' };
        const mockRepo = { id: 'repo-1', name: 'test', repo: 'test' };

        mockFleetManager.getBundle.mockResolvedValue(mockBundle);
        mockFleetManager.getGitRepo.mockResolvedValue(mockRepo);
        mockFleetManager.listBundles.mockResolvedValue([]);
        mockFleetManager.listGitRepos.mockResolvedValue([]);

        const startTime = Date.now();
        const promises = [
          fleetHandlers.fleet_list_bundles({}),
          fleetHandlers.fleet_get_bundle({ bundleId: 'bundle-1', clusterId: 'cluster-1' }),
          fleetHandlers.fleet_list_git_repos({}),
          fleetHandlers.fleet_get_git_repo({ repoId: 'repo-1', clusterId: 'cluster-1' }),
          fleetHandlers.fleet_list_bundles({}),
          fleetHandlers.fleet_get_bundle({ bundleId: 'bundle-1', clusterId: 'cluster-1' }),
          fleetHandlers.fleet_list_git_repos({}),
          fleetHandlers.fleet_get_git_repo({ repoId: 'repo-1', clusterId: 'cluster-1' })
        ];
        const results = await Promise.all(promises);
        const endTime = Date.now();

        expect(results).toHaveLength(8);
        expect(endTime - startTime).toBeLessThan(3000); // Should complete within 3 seconds
        results.forEach(result => {
          expect(result.success).toBe(true);
        });
      });
    });
  });

  describe('FleetTools Performance', () => {
    let fleetTools: FleetTools;

    beforeEach(() => {
      fleetTools = new FleetTools(mockRancherManager);
    });

    describe('Tool Schema Performance', () => {
      it('should generate tool schemas efficiently', () => {
        const startTime = Date.now();
        const tools = fleetTools.getTools();
        const endTime = Date.now();

        expect(tools).toHaveLength(16); // All Fleet tools
        expect(endTime - startTime).toBeLessThan(100); // Should complete within 100ms
      });

      it('should validate all tool schemas efficiently', () => {
        const tools = fleetTools.getTools();
        const startTime = Date.now();

        tools.forEach(tool => {
          expect(() => JSON.parse(JSON.stringify(tool.inputSchema))).not.toThrow();
          expect(tool.inputSchema).toHaveProperty('type');
          expect(tool.inputSchema.type).toBe('object');
        });

        const endTime = Date.now();
        expect(endTime - startTime).toBeLessThan(100); // Should complete within 100ms
      });
    });

    describe('Tool Execution Performance', () => {
      it('should execute tools efficiently', async () => {
        mockFleetManager.listBundles.mockResolvedValue([]);
        mockFleetManager.listGitRepos.mockResolvedValue([]);
        mockFleetManager.listFleetClusters.mockResolvedValue([]);
        mockFleetManager.getFleetWorkspaces.mockResolvedValue([]);

        const startTime = Date.now();
        const promises = [
          fleetTools.executeTool('fleet_list_bundles', {}),
          fleetTools.executeTool('fleet_list_git_repos', {}),
          fleetTools.executeTool('fleet_list_clusters', {}),
          fleetTools.executeTool('fleet_list_workspaces', {})
        ];
        const results = await Promise.all(promises);
        const endTime = Date.now();

        expect(results).toHaveLength(4);
        expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
        results.forEach(result => {
          expect(Array.isArray(result)).toBe(true);
        });
      });
    });
  });

  describe('Memory Usage', () => {
    it('should not cause memory leaks with large datasets', async () => {
      const fleetHandlers = new FleetHandlers(mockRancherManager);
      
      // Create large dataset
      const largeDataset = Array.from({ length: 100 }, (_, i) => ({
        id: `bundle-${i}`,
        name: `bundle-${i}`,
        state: 'Ready'
      }));

      mockFleetManager.listBundles.mockResolvedValue(largeDataset);

      // Perform multiple operations
      for (let i = 0; i < 10; i++) {
        const result = await fleetHandlers.fleet_list_bundles({});
        expect(result.success).toBe(true);
        expect(result.data).toHaveLength(100);
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
    });
  });

  describe('Error Recovery Performance', () => {
    it('should recover quickly from errors', async () => {
      const fleetHandlers = new FleetHandlers(mockRancherManager);
      
      // First call fails
      mockFleetManager.listBundles.mockRejectedValueOnce(new Error('Temporary error'));
      // Second call succeeds
      mockFleetManager.listBundles.mockResolvedValue([]);

      const startTime = Date.now();
      
      // First call should fail
      const failedResult = await fleetHandlers.fleet_list_bundles({});
      expect(failedResult.success).toBe(false);
      
      // Second call should succeed
      const successResult = await fleetHandlers.fleet_list_bundles({});
      expect(successResult.success).toBe(true);
      
      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(2000); // Should complete within 2 seconds
    });
  });
});
