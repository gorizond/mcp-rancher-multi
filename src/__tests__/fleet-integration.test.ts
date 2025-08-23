import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { FleetManager } from '../rancher/fleet';
import { FleetHandlers } from '../handlers/fleet-handlers';
import { FleetTools } from '../tools/fleet-tools';

// Mock dependencies
jest.mock('../rancher/fleet');
jest.mock('../rancher/client');
jest.mock('../config/manager');
jest.mock('../utils/logger');

describe('Fleet Integration Tests', () => {
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

  describe('Complete Workflow Scenarios', () => {
    let fleetHandlers: FleetHandlers;

    beforeEach(() => {
      fleetHandlers = new FleetHandlers(mockRancherManager);
    });

    describe('Bundle Lifecycle Management', () => {
      it('should complete full bundle lifecycle', async () => {
        // Setup initial state
        mockFleetManager.listBundles.mockResolvedValue([]);
        mockFleetManager.listFleetClusters.mockResolvedValue([
          { id: 'cluster-1', name: 'test-cluster' }
        ]);

        // Step 1: List existing bundles
        const initialBundles = await fleetHandlers.fleet_list_bundles({});
        expect(initialBundles.success).toBe(true);
        expect(initialBundles.data).toEqual([]);

        // Step 2: Create a new bundle
        const newBundle = {
          id: 'bundle-1',
          name: 'test-bundle',
          namespace: 'fleet-default',
          clusterId: 'cluster-1',
          state: 'Ready',
          targets: [{ clusterId: 'cluster-1', clusterName: 'test-cluster' }],
          resources: [
            {
              apiVersion: 'v1',
              kind: 'ConfigMap',
              name: 'test-config',
              namespace: 'default'
            }
          ]
        };

        mockFleetManager.createBundle.mockResolvedValue(newBundle);
        const createdBundle = await fleetHandlers.fleet_create_bundle({
          name: 'test-bundle',
          clusterId: 'cluster-1',
          namespace: 'fleet-default',
          targets: [{ clusterId: 'cluster-1', clusterName: 'test-cluster' }],
          resources: [
            {
              apiVersion: 'v1',
              kind: 'ConfigMap',
              name: 'test-config',
              namespace: 'default'
            }
          ]
        });

        expect(createdBundle.success).toBe(true);
        expect(createdBundle.data.id).toBe('bundle-1');

        // Step 3: Get the created bundle
        mockFleetManager.getBundle.mockResolvedValue(newBundle);
        const retrievedBundle = await fleetHandlers.fleet_get_bundle({
          bundleId: 'bundle-1',
          clusterId: 'cluster-1'
        });

        expect(retrievedBundle.success).toBe(true);
        expect(retrievedBundle.data.id).toBe('bundle-1');

        // Step 4: Update the bundle
        const updatedBundle = { ...newBundle, name: 'updated-bundle' };
        mockFleetManager.updateBundle.mockResolvedValue(updatedBundle);
        const updateResult = await fleetHandlers.fleet_update_bundle({
          bundleId: 'bundle-1',
          clusterId: 'cluster-1',
          resources: [
            {
              apiVersion: 'v1',
              kind: 'ConfigMap',
              name: 'updated-config',
              namespace: 'default'
            }
          ]
        });

        expect(updateResult.success).toBe(true);
        expect(updateResult.data.name).toBe('updated-bundle');

        // Step 5: Force sync the bundle
        mockFleetManager.forceSyncBundle.mockResolvedValue(true);
        const syncResult = await fleetHandlers.fleet_force_sync_bundle({
          bundleId: 'bundle-1',
          clusterId: 'cluster-1'
        });

        expect(syncResult.success).toBe(true);

        // Step 6: Get deployment status
        const deploymentStatus = {
          state: 'Ready',
          targets: [{ clusterId: 'cluster-1', state: 'Ready' }]
        };
        mockFleetManager.getDeploymentStatus.mockResolvedValue(deploymentStatus);
        const statusResult = await fleetHandlers.fleet_get_deployment_status({
          bundleId: 'bundle-1',
          clusterId: 'cluster-1'
        });

        expect(statusResult.success).toBe(true);
        expect(statusResult.data.state).toBe('Ready');

        // Step 7: Delete the bundle
        mockFleetManager.deleteBundle.mockResolvedValue(true);
        const deleteResult = await fleetHandlers.fleet_delete_bundle({
          bundleId: 'bundle-1',
          clusterId: 'cluster-1'
        });

        expect(deleteResult.success).toBe(true);

        // Step 8: Verify bundle is deleted
        mockFleetManager.listBundles.mockResolvedValue([]);
        const finalBundles = await fleetHandlers.fleet_list_bundles({});
        expect(finalBundles.success).toBe(true);
        expect(finalBundles.data).toEqual([]);
      });
    });

    describe('Git Repository Lifecycle Management', () => {
      it('should complete full Git repository lifecycle', async () => {
        // Setup initial state
        mockFleetManager.listGitRepos.mockResolvedValue([]);
        mockFleetManager.listFleetClusters.mockResolvedValue([
          { id: 'cluster-1', name: 'test-cluster' }
        ]);

        // Step 1: List existing repositories
        const initialRepos = await fleetHandlers.fleet_list_git_repos({});
        expect(initialRepos.success).toBe(true);
        expect(initialRepos.data).toEqual([]);

        // Step 2: Create a new repository
        const newRepo = {
          id: 'repo-1',
          name: 'test-repo',
          namespace: 'fleet-default',
          repo: 'https://github.com/test/repo',
          branch: 'main',
          paths: ['k8s'],
          state: 'Ready',
          targets: [{ clusterId: 'cluster-1', clusterName: 'test-cluster' }],
          lastCommit: 'abc123'
        };

        mockFleetManager.createGitRepo.mockResolvedValue(newRepo);
        const createdRepo = await fleetHandlers.fleet_create_git_repo({
          name: 'test-repo',
          clusterId: 'cluster-1',
          repo: 'https://github.com/test/repo',
          branch: 'main',
          paths: ['k8s'],
          targets: [{ clusterId: 'cluster-1', clusterName: 'test-cluster' }]
        });

        expect(createdRepo.success).toBe(true);
        expect(createdRepo.data.id).toBe('repo-1');

        // Step 3: Get the created repository
        mockFleetManager.getGitRepo.mockResolvedValue(newRepo);
        const retrievedRepo = await fleetHandlers.fleet_get_git_repo({
          repoId: 'repo-1',
          clusterId: 'cluster-1'
        });

        expect(retrievedRepo.success).toBe(true);
        expect(retrievedRepo.data.id).toBe('repo-1');

        // Step 4: Update the repository
        const updatedRepo = { ...newRepo, branch: 'develop', paths: ['k8s', 'helm'] };
        mockFleetManager.updateGitRepo.mockResolvedValue(updatedRepo);
        const updateResult = await fleetHandlers.fleet_update_git_repo({
          repoId: 'repo-1',
          clusterId: 'cluster-1',
          branch: 'develop',
          paths: ['k8s', 'helm']
        });

        expect(updateResult.success).toBe(true);
        expect(updateResult.data.branch).toBe('develop');

        // Step 5: Delete the repository
        mockFleetManager.deleteGitRepo.mockResolvedValue(true);
        const deleteResult = await fleetHandlers.fleet_delete_git_repo({
          repoId: 'repo-1',
          clusterId: 'cluster-1'
        });

        expect(deleteResult.success).toBe(true);

        // Step 6: Verify repository is deleted
        mockFleetManager.listGitRepos.mockResolvedValue([]);
        const finalRepos = await fleetHandlers.fleet_list_git_repos({});
        expect(finalRepos.success).toBe(true);
        expect(finalRepos.data).toEqual([]);
      });
    });

    describe('Multi-Cluster Operations', () => {
      it('should handle operations across multiple clusters', async () => {
        // Setup multiple clusters
        const clusters = [
          { id: 'cluster-1', name: 'cluster-1' },
          { id: 'cluster-2', name: 'cluster-2' },
          { id: 'cluster-3', name: 'cluster-3' }
        ];

        mockFleetManager.listFleetClusters.mockResolvedValue(clusters);

        // List clusters
        const clusterList = await fleetHandlers.fleet_list_clusters();
        expect(clusterList.success).toBe(true);
        expect(clusterList.data).toHaveLength(3);

        // Create bundles across multiple clusters
        const bundlePromises = clusters.map((cluster, index) => {
          const bundle = {
            id: `bundle-${index + 1}`,
            name: `bundle-${index + 1}`,
            clusterId: cluster.id,
            state: 'Ready'
          };
          mockFleetManager.createBundle.mockResolvedValueOnce(bundle);
          
          return fleetHandlers.fleet_create_bundle({
            name: `bundle-${index + 1}`,
            clusterId: cluster.id,
            targets: [{ clusterId: cluster.id, clusterName: cluster.name }],
            resources: []
          });
        });

        const createdBundles = await Promise.all(bundlePromises);
        createdBundles.forEach((result, index) => {
          expect(result.success).toBe(true);
          expect(result.data.id).toBe(`bundle-${index + 1}`);
        });

        // List bundles across all clusters
        const allBundles = [
          { id: 'bundle-1', name: 'bundle-1', clusterId: 'cluster-1', state: 'Ready' },
          { id: 'bundle-2', name: 'bundle-2', clusterId: 'cluster-2', state: 'Ready' },
          { id: 'bundle-3', name: 'bundle-3', clusterId: 'cluster-3', state: 'Ready' }
        ];
        mockFleetManager.listBundles.mockResolvedValue(allBundles);

        const bundleList = await fleetHandlers.fleet_list_bundles({});
        expect(bundleList.success).toBe(true);
        expect(bundleList.data).toHaveLength(3);
      });
    });

    describe('Workspace Management', () => {
      it('should handle workspace operations', async () => {
        const workspaces = [
          { id: 'fleet-default', name: 'fleet-default', state: 'Active' },
          { id: 'fleet-system', name: 'fleet-system', state: 'Active' },
          { id: 'custom-workspace', name: 'custom-workspace', state: 'Active' }
        ];

        mockFleetManager.getFleetWorkspaces.mockResolvedValue(workspaces);

        const workspaceList = await fleetHandlers.fleet_list_workspaces();
        expect(workspaceList.success).toBe(true);
        expect(workspaceList.data).toHaveLength(3);
        expect(workspaceList.data[0].id).toBe('fleet-default');
      });
    });

    describe('Logging and Monitoring', () => {
      it('should handle logging operations', async () => {
        const mockLogs = [
          '2024-01-01T00:00:00Z INFO: Bundle deployment started',
          '2024-01-01T00:00:01Z INFO: Bundle deployment completed',
          '2024-01-01T00:00:02Z INFO: Git repository sync successful'
        ];

        mockFleetManager.getFleetLogs.mockResolvedValue(mockLogs);

        const logs = await fleetHandlers.fleet_get_logs({
          clusterId: 'cluster-1'
        });

        expect(logs.success).toBe(true);
        expect(logs.data).toHaveLength(3);
        expect(logs.data[0]).toContain('Bundle deployment started');
      });
    });
  });

  describe('Error Handling Integration', () => {
    let fleetHandlers: FleetHandlers;

    beforeEach(() => {
      fleetHandlers = new FleetHandlers(mockRancherManager);
    });

    describe('Graceful Degradation', () => {
      it('should handle partial failures gracefully', async () => {
        // Setup mixed success/failure scenario
        mockFleetManager.listBundles.mockResolvedValue([]);
        mockFleetManager.listGitRepos.mockRejectedValue(new Error('Git repos unavailable'));
        mockFleetManager.listFleetClusters.mockResolvedValue([]);

        // These should succeed
        const bundles = await fleetHandlers.fleet_list_bundles({});
        const clusters = await fleetHandlers.fleet_list_clusters();

        expect(bundles.success).toBe(true);
        expect(clusters.success).toBe(true);

        // This should fail gracefully
        const repos = await fleetHandlers.fleet_list_git_repos({});
        expect(repos.success).toBe(false);
        expect(repos.error).toContain('Git repos unavailable');
      });

      it('should handle network timeouts gracefully', async () => {
        const timeoutError = new Error('Request timeout');
        timeoutError.name = 'TimeoutError';
        
        mockFleetManager.listBundles.mockRejectedValue(timeoutError);

        const result = await fleetHandlers.fleet_list_bundles({});
        expect(result.success).toBe(false);
        expect(result.error).toContain('Request timeout');
      });
    });

    describe('Recovery Scenarios', () => {
      it('should recover from temporary failures', async () => {
        // First call fails
        mockFleetManager.getBundle.mockRejectedValueOnce(new Error('Temporary error'));
        // Second call succeeds
        const mockBundle = { id: 'bundle-1', name: 'test', state: 'Ready' };
        mockFleetManager.getBundle.mockResolvedValueOnce(mockBundle);

        // First attempt should fail
        const failedResult = await fleetHandlers.fleet_get_bundle({
          bundleId: 'bundle-1',
          clusterId: 'cluster-1'
        });
        expect(failedResult.success).toBe(false);

        // Second attempt should succeed
        const successResult = await fleetHandlers.fleet_get_bundle({
          bundleId: 'bundle-1',
          clusterId: 'cluster-1'
        });
        expect(successResult.success).toBe(true);
        expect(successResult.data.id).toBe('bundle-1');
      });
    });
  });

  describe('Tool Integration', () => {
    let fleetTools: FleetTools;

    beforeEach(() => {
      fleetTools = new FleetTools(mockRancherManager);
    });

    describe('Tool Execution Flow', () => {
      it('should execute tools through FleetTools correctly', async () => {
        const mockBundle = { id: 'bundle-1', name: 'test', state: 'Ready' };
        mockFleetManager.getBundle.mockResolvedValue(mockBundle);

        const result = await fleetTools.executeTool('fleet_get_bundle', {
          bundleId: 'bundle-1',
          clusterId: 'cluster-1'
        });

        expect(result).toBeDefined();
        expect(result.id).toBe('bundle-1');
      });

      it('should handle tool execution errors', async () => {
        mockFleetManager.getBundle.mockRejectedValue(new Error('Bundle not found'));

        await expect(
          fleetTools.executeTool('fleet_get_bundle', {
            bundleId: 'nonexistent',
            clusterId: 'cluster-1'
          })
        ).rejects.toThrow('Bundle not found');
      });
    });

    describe('Tool Schema Validation', () => {
      it('should have valid schemas for all tools', () => {
        const tools = fleetTools.getTools();
        
        tools.forEach(tool => {
          expect(tool.inputSchema).toHaveProperty('type');
          expect(tool.inputSchema.type).toBe('object');
          
          if (tool.inputSchema.required) {
            expect(Array.isArray(tool.inputSchema.required)).toBe(true);
          }
          
          if (tool.inputSchema.properties) {
            expect(typeof tool.inputSchema.properties).toBe('object');
          }
        });
      });
    });
  });
});
