import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { FleetHandlers } from '../../handlers/fleet-handlers';
import { FleetManager } from '../../rancher/fleet';

// Mock the FleetManager
jest.mock('../../rancher/fleet');

describe('FleetHandlers', () => {
  let fleetHandlers: FleetHandlers;
  let mockRancherManager: any;
  let mockFleetManager: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock FleetManager
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

    // Mock FleetManager constructor
    (FleetManager as jest.MockedClass<typeof FleetManager>).mockImplementation(() => mockFleetManager);

    // Create mock rancher manager
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
        error: jest.fn()
      })
    };

    fleetHandlers = new FleetHandlers(mockRancherManager);
  });

  describe('Initialization', () => {
    it('should initialize FleetManager when connections are available', async () => {
      const result = await fleetHandlers.fleet_list_bundles({ clusterId: 'test-cluster' });
      
      expect(FleetManager).toHaveBeenCalledWith(
        mockRancherManager.getConnection().client,
        mockRancherManager.getConfigManager(),
        mockRancherManager.getLogger()
      );
    });

    it('should handle missing connections gracefully', async () => {
      mockRancherManager.getConnection.mockReturnValue(null);
      
      const result = await fleetHandlers.fleet_list_bundles({ clusterId: 'test-cluster' });
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('No connection found for server');
    });

    it('should handle initialization errors gracefully', async () => {
      mockRancherManager.getConnection.mockReturnValue({
        isConnected: false
      });
      
      const result = await fleetHandlers.fleet_list_bundles({ clusterId: 'test-cluster' });
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('is not connected');
    });
  });

  describe('Bundle Management', () => {
    describe('fleet_list_bundles', () => {
      it('should return bundles successfully', async () => {
        const mockBundles = [
          { id: 'bundle1', name: 'test-bundle', state: 'active' }
        ];
        mockFleetManager.listBundles.mockResolvedValue(mockBundles);

        const result = await fleetHandlers.fleet_list_bundles({ clusterId: 'test-cluster' });
        
        expect(result).toEqual({
          success: true,
          data: mockBundles,
          count: 1
        });
        expect(mockFleetManager.listBundles).toHaveBeenCalledWith('test-cluster');
      });

      it('should handle errors gracefully', async () => {
        mockFleetManager.listBundles.mockRejectedValue(new Error('API Error'));

        const result = await fleetHandlers.fleet_list_bundles({ clusterId: 'test-cluster' });
        
        expect(result).toEqual({
          success: false,
          error: 'API Error',
          data: [],
          count: 0
        });
      });

      it('should handle missing FleetManager', async () => {
        mockRancherManager.getConnection.mockReturnValue(null);

        const result = await fleetHandlers.fleet_list_bundles({ clusterId: 'test-cluster' });
        
        expect(result.success).toBe(false);
        expect(result.error).toContain('No connection found for server');
      });
    });

    describe('fleet_get_bundle', () => {
      it('should return bundle successfully', async () => {
        const mockBundle = { id: 'bundle1', name: 'test-bundle', state: 'active' };
        mockFleetManager.getBundle.mockResolvedValue(mockBundle);

        const result = await fleetHandlers.fleet_get_bundle({ 
          bundleId: 'bundle1', 
          clusterId: 'test-cluster' 
        });
        
        expect(result).toEqual({
          success: true,
          data: mockBundle
        });
        expect(mockFleetManager.getBundle).toHaveBeenCalledWith('bundle1', 'test-cluster');
      });

      it('should handle bundle not found', async () => {
        mockFleetManager.getBundle.mockResolvedValue(null);

        const result = await fleetHandlers.fleet_get_bundle({ 
          bundleId: 'bundle1', 
          clusterId: 'test-cluster' 
        });
        
        expect(result).toEqual({
          success: false,
          error: 'Bundle bundle1 not found in cluster test-cluster',
          data: null
        });
      });
    });

    describe('fleet_create_bundle', () => {
      it('should create bundle successfully', async () => {
        const mockBundle = { id: 'bundle1', name: 'test-bundle', state: 'active' };
        mockFleetManager.createBundle.mockResolvedValue(mockBundle);

        const result = await fleetHandlers.fleet_create_bundle({
          name: 'test-bundle',
          namespace: 'fleet-default',
          clusterId: 'test-cluster',
          targets: [],
          resources: []
        });
        
        expect(result).toEqual({
          success: true,
          data: mockBundle,
          message: 'Bundle test-bundle created successfully'
        });
      });

      it('should handle creation failure', async () => {
        mockFleetManager.createBundle.mockResolvedValue(null);

        const result = await fleetHandlers.fleet_create_bundle({
          name: 'test-bundle',
          clusterId: 'test-cluster'
        });
        
        expect(result).toEqual({
          success: false,
          error: 'Failed to create bundle',
          data: null
        });
      });
    });

    describe('fleet_delete_bundle', () => {
      it('should delete bundle successfully', async () => {
        mockFleetManager.deleteBundle.mockResolvedValue(true);

        const result = await fleetHandlers.fleet_delete_bundle({
          bundleId: 'bundle1',
          clusterId: 'test-cluster'
        });
        
        expect(result).toEqual({
          success: true,
          message: 'Bundle bundle1 deleted successfully'
        });
      });

      it('should handle deletion failure', async () => {
        mockFleetManager.deleteBundle.mockResolvedValue(false);

        const result = await fleetHandlers.fleet_delete_bundle({
          bundleId: 'bundle1',
          clusterId: 'test-cluster'
        });
        
        expect(result).toEqual({
          success: false,
          error: 'Failed to delete bundle bundle1',
          message: 'Bundle bundle1 could not be deleted'
        });
      });
    });
  });

  describe('Git Repository Management', () => {
    describe('fleet_list_git_repos', () => {
      it('should return Git repositories successfully', async () => {
        const mockRepos = [
          { id: 'repo1', name: 'test-repo', repo: 'https://github.com/test/repo' }
        ];
        mockFleetManager.listGitRepos.mockResolvedValue(mockRepos);

        const result = await fleetHandlers.fleet_list_git_repos({ clusterId: 'test-cluster' });
        
        expect(result).toEqual({
          success: true,
          data: mockRepos,
          count: 1
        });
      });
    });

    describe('fleet_get_git_repo', () => {
      it('should return Git repository successfully', async () => {
        const mockRepo = { id: 'repo1', name: 'test-repo', repo: 'https://github.com/test/repo' };
        mockFleetManager.getGitRepo.mockResolvedValue(mockRepo);

        const result = await fleetHandlers.fleet_get_git_repo({
          repoId: 'repo1',
          clusterId: 'test-cluster'
        });
        
        expect(result).toEqual({
          success: true,
          data: mockRepo
        });
      });

      it('should handle repository not found', async () => {
        mockFleetManager.getGitRepo.mockResolvedValue(null);

        const result = await fleetHandlers.fleet_get_git_repo({
          repoId: 'repo1',
          clusterId: 'test-cluster'
        });
        
        expect(result).toEqual({
          success: false,
          error: 'Git repository repo1 not found in cluster test-cluster',
          data: null
        });
      });
    });

    describe('fleet_create_git_repo', () => {
      it('should create Git repository successfully', async () => {
        const mockRepo = { id: 'repo1', name: 'test-repo', repo: 'https://github.com/test/repo' };
        mockFleetManager.createGitRepo.mockResolvedValue(mockRepo);

        const result = await fleetHandlers.fleet_create_git_repo({
          name: 'test-repo',
          clusterId: 'test-cluster',
          repo: 'https://github.com/test/repo'
        });
        
        expect(result).toEqual({
          success: true,
          data: mockRepo,
          message: 'Git repository test-repo created successfully'
        });
      });
    });
  });

  describe('Cluster Management', () => {
    describe('fleet_list_clusters', () => {
      it('should return Fleet clusters successfully', async () => {
        const mockClusters = [
          { id: 'cluster1', name: 'test-cluster', state: 'active' }
        ];
        mockFleetManager.listFleetClusters.mockResolvedValue(mockClusters);

        const result = await fleetHandlers.fleet_list_clusters();
        
        expect(result).toEqual({
          success: true,
          data: mockClusters,
          count: 1
        });
      });
    });

    describe('fleet_get_cluster', () => {
      it('should return Fleet cluster successfully', async () => {
        const mockCluster = { id: 'cluster1', name: 'test-cluster', state: 'active' };
        mockFleetManager.getFleetCluster.mockResolvedValue(mockCluster);

        const result = await fleetHandlers.fleet_get_cluster({ clusterId: 'cluster1' });
        
        expect(result).toEqual({
          success: true,
          data: mockCluster
        });
      });

      it('should handle cluster not found', async () => {
        mockFleetManager.getFleetCluster.mockResolvedValue(null);

        const result = await fleetHandlers.fleet_get_cluster({ clusterId: 'cluster1' });
        
        expect(result).toEqual({
          success: false,
          error: 'Fleet cluster cluster1 not found',
          data: null
        });
      });
    });
  });

  describe('Workspace Management', () => {
    describe('fleet_list_workspaces', () => {
      it('should return Fleet workspaces successfully', async () => {
        const mockWorkspaces = [
          { id: 'workspace1', name: 'fleet-default', state: 'active' }
        ];
        mockFleetManager.getFleetWorkspaces.mockResolvedValue(mockWorkspaces);

        const result = await fleetHandlers.fleet_list_workspaces();
        
        expect(result).toEqual({
          success: true,
          data: mockWorkspaces,
          count: 1
        });
      });
    });
  });

  describe('Deployment Status and Monitoring', () => {
    describe('fleet_get_deployment_status', () => {
      it('should return deployment status successfully', async () => {
        const mockStatus = { state: 'deployed', message: 'Successfully deployed' };
        mockFleetManager.getDeploymentStatus.mockResolvedValue(mockStatus);

        const result = await fleetHandlers.fleet_get_deployment_status({
          bundleId: 'bundle1',
          clusterId: 'test-cluster'
        });
        
        expect(result).toEqual({
          success: true,
          data: mockStatus
        });
      });

      it('should handle status not found', async () => {
        mockFleetManager.getDeploymentStatus.mockResolvedValue(null);

        const result = await fleetHandlers.fleet_get_deployment_status({
          bundleId: 'bundle1',
          clusterId: 'test-cluster'
        });
        
        expect(result).toEqual({
          success: false,
          error: 'Deployment status not found for bundle bundle1',
          data: null
        });
      });
    });

    describe('fleet_get_logs', () => {
      it('should return Fleet logs successfully', async () => {
        const mockLogs = [
          { timestamp: '2023-01-01T00:00:00Z', message: 'Log entry 1' }
        ];
        mockFleetManager.getFleetLogs.mockResolvedValue(mockLogs);

        const result = await fleetHandlers.fleet_get_logs({
          clusterId: 'test-cluster',
          namespace: 'fleet-default'
        });
        
        expect(result).toEqual({
          success: true,
          data: mockLogs,
          count: 1
        });
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle all errors consistently', async () => {
      const testCases = [
        {
          method: 'fleet_list_bundles',
          args: { clusterId: 'test-cluster' },
          mockMethod: 'listBundles',
          mockError: new Error('Network error')
        },
        {
          method: 'fleet_get_bundle',
          args: { bundleId: 'bundle1', clusterId: 'test-cluster' },
          mockMethod: 'getBundle',
          mockError: new Error('Bundle not found')
        },
        {
          method: 'fleet_list_git_repos',
          args: { clusterId: 'test-cluster' },
          mockMethod: 'listGitRepos',
          mockError: new Error('API error')
        }
      ];

      for (const testCase of testCases) {
        mockFleetManager[testCase.mockMethod].mockRejectedValue(testCase.mockError);

        const result = await (fleetHandlers as any)[testCase.method](testCase.args);
        
        expect(result.success).toBe(false);
        expect(result.error).toBe(testCase.mockError.message);
        expect(result.data).toBeDefined();
      }
    });
  });
});
