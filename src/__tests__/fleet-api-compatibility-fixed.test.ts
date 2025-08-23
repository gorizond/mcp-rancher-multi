import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { FleetManager } from '../rancher/fleet';
import { FleetHandlers } from '../handlers/fleet-handlers';
import { FleetTools } from '../tools/fleet-tools';

// Mock dependencies
jest.mock('../rancher/fleet');
jest.mock('../rancher/client');
jest.mock('../config/manager');
jest.mock('../utils/logger');

describe('Fleet API Compatibility Tests', () => {
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

  describe('API Response Format Compatibility', () => {
    let fleetHandlers: FleetHandlers;

    beforeEach(() => {
      fleetHandlers = new FleetHandlers(mockRancherManager);
    });

    describe('Bundle API Responses', () => {
      it('should maintain consistent response format for bundle operations', async () => {
        const mockBundle = {
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

        mockFleetManager.getBundle.mockResolvedValue(mockBundle);

        const result = await fleetHandlers.fleet_get_bundle({
          bundleId: 'bundle-1',
          clusterId: 'cluster-1'
        });

        // Verify consistent response structure
        expect(result).toHaveProperty('success');
        expect(result).toHaveProperty('data');
        expect(result.success).toBe(true);
        expect(result.data).toHaveProperty('id');
        expect(result.data).toHaveProperty('name');
        expect(result.data).toHaveProperty('state');
      });

      it('should handle empty bundle lists consistently', async () => {
        mockFleetManager.listBundles.mockResolvedValue([]);

        const result = await fleetHandlers.fleet_list_bundles({});

        expect(result).toHaveProperty('success');
        expect(result).toHaveProperty('data');
        expect(result.success).toBe(true);
        expect(result.data).toEqual([]);
      });

      it('should handle bundle creation response format', async () => {
        const newBundle = {
          id: 'bundle-1',
          name: 'new-bundle',
          state: 'Ready'
        };

        mockFleetManager.createBundle.mockResolvedValue(newBundle);

        const result = await fleetHandlers.fleet_create_bundle({
          name: 'new-bundle',
          clusterId: 'cluster-1',
          targets: [{ clusterId: 'cluster-1', clusterName: 'test-cluster' }],
          resources: []
        });

        expect(result).toHaveProperty('success');
        expect(result).toHaveProperty('data');
        expect(result.success).toBe(true);
        expect(result.data.id).toBe('bundle-1');
      });
    });

    describe('Git Repository API Responses', () => {
      it('should maintain consistent response format for repository operations', async () => {
        const mockRepo = {
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

        mockFleetManager.getGitRepo.mockResolvedValue(mockRepo);

        const result = await fleetHandlers.fleet_get_git_repo({
          repoId: 'repo-1',
          clusterId: 'cluster-1'
        });

        expect(result).toHaveProperty('success');
        expect(result).toHaveProperty('data');
        expect(result.success).toBe(true);
        expect(result.data).toHaveProperty('id');
        expect(result.data).toHaveProperty('name');
        expect(result.data).toHaveProperty('repo');
        expect(result.data).toHaveProperty('state');
      });

      it('should handle empty repository lists consistently', async () => {
        mockFleetManager.listGitRepos.mockResolvedValue([]);

        const result = await fleetHandlers.fleet_list_git_repos({});

        expect(result).toHaveProperty('success');
        expect(result).toHaveProperty('data');
        expect(result.success).toBe(true);
        expect(result.data).toEqual([]);
      });
    });

    describe('Cluster and Workspace API Responses', () => {
      it('should maintain consistent response format for cluster operations', async () => {
        const mockClusters = [
          { id: 'cluster-1', name: 'cluster-1', state: 'Active' },
          { id: 'cluster-2', name: 'cluster-2', state: 'Active' }
        ];

        mockFleetManager.listFleetClusters.mockResolvedValue(mockClusters);

        const result = await fleetHandlers.fleet_list_clusters();

        expect(result).toHaveProperty('success');
        expect(result).toHaveProperty('data');
        expect(result.success).toBe(true);
        expect(result.data).toHaveLength(2);
      });

      it('should maintain consistent response format for workspace operations', async () => {
        const mockWorkspaces = [
          { id: 'fleet-default', name: 'fleet-default', state: 'Active' },
          { id: 'fleet-system', name: 'fleet-system', state: 'Active' }
        ];

        mockFleetManager.getFleetWorkspaces.mockResolvedValue(mockWorkspaces);

        const result = await fleetHandlers.fleet_list_workspaces();

        expect(result).toHaveProperty('success');
        expect(result).toHaveProperty('data');
        expect(result.success).toBe(true);
        expect(result.data).toHaveLength(2);
      });
    });
  });

  describe('Error Response Format Compatibility', () => {
    let fleetHandlers: FleetHandlers;

    beforeEach(() => {
      fleetHandlers = new FleetHandlers(mockRancherManager);
    });

    describe('Consistent Error Response Structure', () => {
      it('should maintain consistent error response format', async () => {
        mockFleetManager.getBundle.mockRejectedValue(new Error('Bundle not found'));

        const result = await fleetHandlers.fleet_get_bundle({
          bundleId: 'nonexistent',
          clusterId: 'cluster-1'
        });

        expect(result).toHaveProperty('success');
        expect(result).toHaveProperty('error');
        expect(result).toHaveProperty('data');
        expect(result.success).toBe(false);
        expect(result.error).toContain('Bundle not found');
        expect(result.data).toBeNull();
      });

      it('should handle network errors consistently', async () => {
        const networkError = new Error('Network timeout');
        networkError.name = 'TimeoutError';
        mockFleetManager.listBundles.mockRejectedValue(networkError);

        const result = await fleetHandlers.fleet_list_bundles({});

        expect(result).toHaveProperty('success');
        expect(result).toHaveProperty('error');
        expect(result).toHaveProperty('data');
        expect(result.success).toBe(false);
        expect(result.error).toContain('Network timeout');
        expect(result.data).toEqual([]);
      });

      it('should handle validation errors consistently', async () => {
        // Simulate validation error by passing invalid arguments
        const result = await fleetHandlers.fleet_get_bundle({
          bundleId: '',
          clusterId: ''
        });

        expect(result).toHaveProperty('success');
        expect(result).toHaveProperty('error');
        expect(result).toHaveProperty('data');
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
        expect(result.data).toBeNull();
      });
    });
  });

  describe('Tool Schema Compatibility', () => {
    let fleetTools: FleetTools;

    beforeEach(() => {
      fleetTools = new FleetTools(mockRancherManager);
    });

    describe('Tool Input Schema Validation', () => {
      it('should have consistent schema structure for all tools', () => {
        const tools = fleetTools.getTools();

        tools.forEach(tool => {
          // Basic schema structure
          expect(tool.inputSchema).toHaveProperty('type');
          expect(tool.inputSchema.type).toBe('object');

          // Properties should be an object if present
          if (tool.inputSchema.properties) {
            expect(typeof tool.inputSchema.properties).toBe('object');
          }

          // Required should be an array if present
          if (tool.inputSchema.required) {
            expect(Array.isArray(tool.inputSchema.required)).toBe(true);
          }

          // Each property should have type and description
          if (tool.inputSchema.properties) {
            Object.values(tool.inputSchema.properties).forEach((prop: any) => {
              expect(prop).toHaveProperty('type');
              expect(prop).toHaveProperty('description');
            });
          }
        });
      });

      it('should have valid JSON schema for all tools', () => {
        const tools = fleetTools.getTools();

        tools.forEach(tool => {
          // Should be valid JSON
          expect(() => JSON.parse(JSON.stringify(tool.inputSchema))).not.toThrow();

          // Should be valid JSON Schema
          const schema = tool.inputSchema;
          expect(schema).toHaveProperty('type');
          expect(['object', 'array', 'string', 'number', 'boolean']).toContain(schema.type);
        });
      });

      it('should have consistent property naming conventions', () => {
        const tools = fleetTools.getTools();

        tools.forEach(tool => {
          if (tool.inputSchema.properties) {
            Object.keys(tool.inputSchema.properties).forEach(propName => {
              // Property names should be camelCase
              expect(propName).toMatch(/^[a-z][a-zA-Z0-9]*$/);
            });
          }
        });
      });
    });

    describe('Tool Method Compatibility', () => {
      it('should have consistent tool method signatures', () => {
        const tools = fleetTools.getTools();

        tools.forEach(tool => {
          expect(tool).toHaveProperty('name');
          expect(tool).toHaveProperty('description');
          expect(tool).toHaveProperty('inputSchema');

          // Tool names should follow consistent naming pattern
          expect(tool.name).toMatch(/^fleet_[a-z_]+$/);

          // Descriptions should be meaningful
          expect(tool.description).toBeTruthy();
          expect(tool.description?.length).toBeGreaterThan(10);
        });
      });

      it('should have all required Fleet tools', () => {
        const tools = fleetTools.getTools();
        const toolNames = tools.map(tool => tool.name);

        const expectedTools = [
          'fleet_list_bundles',
          'fleet_get_bundle',
          'fleet_create_bundle',
          'fleet_update_bundle',
          'fleet_delete_bundle',
          'fleet_force_sync_bundle',
          'fleet_list_git_repos',
          'fleet_get_git_repo',
          'fleet_create_git_repo',
          'fleet_update_git_repo',
          'fleet_delete_git_repo',
          'fleet_list_clusters',
          'fleet_list_workspaces',
          'fleet_get_deployment_status',
          'fleet_get_logs'
        ];

        expectedTools.forEach(expectedTool => {
          expect(toolNames).toContain(expectedTool);
        });
      });
    });
  });

  describe('Data Type Compatibility', () => {
    let fleetHandlers: FleetHandlers;

    beforeEach(() => {
      fleetHandlers = new FleetHandlers(mockRancherManager);
    });

    describe('Bundle Data Types', () => {
      it('should handle different bundle states correctly', async () => {
        const states = ['Ready', 'Pending', 'Error', 'Unknown'];
        
        for (const state of states) {
          const mockBundle = {
            id: `bundle-${state.toLowerCase()}`,
            name: `bundle-${state.toLowerCase()}`,
            state: state
          };

          mockFleetManager.getBundle.mockResolvedValue(mockBundle);

          const result = await fleetHandlers.fleet_get_bundle({
            bundleId: `bundle-${state.toLowerCase()}`,
            clusterId: 'cluster-1'
          });

          expect(result.success).toBe(true);
          expect(result.data.state).toBe(state);
        }
      });

      it('should handle bundle resources with different types', async () => {
        const resources = [
          { apiVersion: 'v1', kind: 'ConfigMap', name: 'config', namespace: 'default' },
          { apiVersion: 'apps/v1', kind: 'Deployment', name: 'app', namespace: 'default' },
          { apiVersion: 'v1', kind: 'Service', name: 'service', namespace: 'default' }
        ];

        const mockBundle = {
          id: 'bundle-1',
          name: 'test-bundle',
          state: 'Ready',
          resources: resources
        };

        mockFleetManager.getBundle.mockResolvedValue(mockBundle);

        const result = await fleetHandlers.fleet_get_bundle({
          bundleId: 'bundle-1',
          clusterId: 'cluster-1'
        });

        expect(result.success).toBe(true);
        expect(result.data.resources).toHaveLength(3);
        expect(result.data.resources[0].kind).toBe('ConfigMap');
        expect(result.data.resources[1].kind).toBe('Deployment');
        expect(result.data.resources[2].kind).toBe('Service');
      });
    });

    describe('Git Repository Data Types', () => {
      it('should handle different repository states correctly', async () => {
        const states = ['Ready', 'Pending', 'Error', 'Syncing'];
        
        for (const state of states) {
          const mockRepo = {
            id: `repo-${state.toLowerCase()}`,
            name: `repo-${state.toLowerCase()}`,
            repo: 'https://github.com/test/repo',
            state: state
          };

          mockFleetManager.getGitRepo.mockResolvedValue(mockRepo);

          const result = await fleetHandlers.fleet_get_git_repo({
            repoId: `repo-${state.toLowerCase()}`,
            clusterId: 'cluster-1'
          });

          expect(result.success).toBe(true);
          expect(result.data.state).toBe(state);
        }
      });

      it('should handle different Git branches and paths', async () => {
        const testCases = [
          { branch: 'main', paths: ['k8s'] },
          { branch: 'develop', paths: ['k8s', 'helm'] },
          { branch: 'feature/new-feature', paths: ['manifests'] }
        ];

        for (const testCase of testCases) {
          const mockRepo = {
            id: `repo-${testCase.branch}`,
            name: `repo-${testCase.branch}`,
            repo: 'https://github.com/test/repo',
            branch: testCase.branch,
            paths: testCase.paths,
            state: 'Ready'
          };

          mockFleetManager.getGitRepo.mockResolvedValue(mockRepo);

          const result = await fleetHandlers.fleet_get_git_repo({
            repoId: `repo-${testCase.branch}`,
            clusterId: 'cluster-1'
          });

          expect(result.success).toBe(true);
          expect(result.data.branch).toBe(testCase.branch);
          expect(result.data.paths).toEqual(testCase.paths);
        }
      });
    });
  });

  describe('Backward Compatibility', () => {
    let fleetHandlers: FleetHandlers;

    beforeEach(() => {
      fleetHandlers = new FleetHandlers(mockRancherManager);
    });

    describe('Legacy Response Format Support', () => {
      it('should support legacy bundle response format', async () => {
        // Simulate legacy response format with mapped data
        const legacyBundle = {
          id: 'legacy-bundle',
          name: 'legacy-bundle',
          namespace: 'fleet-default',
          state: 'Ready',
          targets: [{ clusterId: 'cluster-1' }]
        };

        mockFleetManager.getBundle.mockResolvedValue(legacyBundle);

        const result = await fleetHandlers.fleet_get_bundle({
          bundleId: 'legacy-bundle',
          clusterId: 'cluster-1'
        });

        expect(result.success).toBe(true);
        expect(result.data).toHaveProperty('id');
        expect(result.data).toHaveProperty('name');
        expect(result.data).toHaveProperty('state');
      });

      it('should support legacy repository response format', async () => {
        // Simulate legacy response format with mapped data
        const legacyRepo = {
          id: 'legacy-repo',
          name: 'legacy-repo',
          namespace: 'fleet-default',
          repo: 'https://github.com/test/repo',
          branch: 'main',
          state: 'Ready'
        };

        mockFleetManager.getGitRepo.mockResolvedValue(legacyRepo);

        const result = await fleetHandlers.fleet_get_git_repo({
          repoId: 'legacy-repo',
          clusterId: 'cluster-1'
        });

        expect(result.success).toBe(true);
        expect(result.data).toHaveProperty('id');
        expect(result.data).toHaveProperty('name');
        expect(result.data).toHaveProperty('repo');
        expect(result.data).toHaveProperty('state');
      });
    });
  });
});
