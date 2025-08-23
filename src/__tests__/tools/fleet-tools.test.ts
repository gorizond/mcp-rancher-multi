import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { FleetTools } from '../../tools/fleet-tools';
import { FleetManager } from '../../rancher/fleet';

// Mock the FleetManager
jest.mock('../../rancher/fleet');

describe('FleetTools', () => {
  let fleetTools: FleetTools;
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

    fleetTools = new FleetTools(mockRancherManager);
  });

  describe('Initialization', () => {
    it('should initialize FleetManager when connections are available', async () => {
      const result = await fleetTools.executeTool('fleet_list_bundles', { clusterId: 'test-cluster' });
      
      expect(FleetManager).toHaveBeenCalledWith(
        mockRancherManager.getConnection().client,
        mockRancherManager.getConfigManager(),
        mockRancherManager.getLogger()
      );
    });

    it('should handle missing connections gracefully', () => {
      mockRancherManager.getConnection.mockReturnValue(null);
      const toolsWithoutConnections = new FleetTools(mockRancherManager);
      
      expect(toolsWithoutConnections.getTools()).toBeDefined();
      expect(toolsWithoutConnections.getTools().length).toBeGreaterThan(0);
    });

    it('should handle initialization errors gracefully', () => {
      mockRancherManager.getConnection.mockReturnValue({
        isConnected: false
      });
      const toolsWithError = new FleetTools(mockRancherManager);
      expect(toolsWithError.getTools()).toBeDefined();
    });
  });

  describe('getTools', () => {
    it('should return all Fleet tools', () => {
      const tools = fleetTools.getTools();
      
      expect(tools).toBeDefined();
      expect(Array.isArray(tools)).toBe(true);
      expect(tools.length).toBeGreaterThan(0);

      // Check for specific Fleet tools
      const toolNames = tools.map(tool => tool.name);
      
      expect(toolNames).toContain('fleet_list_bundles');
      expect(toolNames).toContain('fleet_get_bundle');
      expect(toolNames).toContain('fleet_create_bundle');
      expect(toolNames).toContain('fleet_update_bundle');
      expect(toolNames).toContain('fleet_delete_bundle');
      expect(toolNames).toContain('fleet_force_sync_bundle');
      expect(toolNames).toContain('fleet_list_git_repos');
      expect(toolNames).toContain('fleet_get_git_repo');
      expect(toolNames).toContain('fleet_create_git_repo');
      expect(toolNames).toContain('fleet_update_git_repo');
      expect(toolNames).toContain('fleet_delete_git_repo');
      expect(toolNames).toContain('fleet_list_clusters');
      expect(toolNames).toContain('fleet_get_cluster');
      expect(toolNames).toContain('fleet_list_workspaces');
      expect(toolNames).toContain('fleet_get_deployment_status');
      expect(toolNames).toContain('fleet_get_logs');
    });

    it('should have correct schema for fleet_list_bundles', () => {
      const tools = fleetTools.getTools();
      const listBundlesTool = tools.find(tool => tool.name === 'fleet_list_bundles');
      
      expect(listBundlesTool).toBeDefined();
      expect(listBundlesTool?.inputSchema).toEqual({
        type: 'object',
        properties: {
          clusterId: {
            type: 'string',
            description: 'Optional: Specific cluster ID to filter bundles'
          },
          serverName: {
            type: 'string',
            description: 'Optional: Rancher server name to connect to (uses default if not specified)'
          }
        }
      });
    });

    it('should have correct schema for fleet_create_bundle', () => {
      const tools = fleetTools.getTools();
      const createBundleTool = tools.find(tool => tool.name === 'fleet_create_bundle');
      
      expect(createBundleTool).toBeDefined();
      expect(createBundleTool?.inputSchema.properties).toHaveProperty('name');
      expect(createBundleTool?.inputSchema.properties).toHaveProperty('clusterId');
      expect(createBundleTool?.inputSchema.required).toContain('name');
      expect(createBundleTool?.inputSchema.required).toContain('clusterId');
    });

    it('should have correct schema for fleet_create_git_repo', () => {
      const tools = fleetTools.getTools();
      const createGitRepoTool = tools.find(tool => tool.name === 'fleet_create_git_repo');
      
      expect(createGitRepoTool).toBeDefined();
      expect(createGitRepoTool?.inputSchema.properties).toHaveProperty('name');
      expect(createGitRepoTool?.inputSchema.properties).toHaveProperty('clusterId');
      expect(createGitRepoTool?.inputSchema.properties).toHaveProperty('repo');
      expect(createGitRepoTool?.inputSchema.required).toContain('name');
      expect(createGitRepoTool?.inputSchema.required).toContain('clusterId');
      expect(createGitRepoTool?.inputSchema.required).toContain('repo');
    });
  });

  describe('executeTool', () => {
    it('should execute fleet_list_bundles successfully', async () => {
      const mockBundles = [
        { id: 'bundle1', name: 'test-bundle', state: 'active' }
      ];
      mockFleetManager.listBundles.mockResolvedValue(mockBundles);

      const result = await fleetTools.executeTool('fleet_list_bundles', { clusterId: 'test-cluster' });
      
      expect(mockFleetManager.listBundles).toHaveBeenCalledWith('test-cluster');
      expect(result).toEqual(mockBundles);
    });

    it('should execute fleet_get_bundle successfully', async () => {
      const mockBundle = { id: 'bundle1', name: 'test-bundle', state: 'active' };
      mockFleetManager.getBundle.mockResolvedValue(mockBundle);

      const result = await fleetTools.executeTool('fleet_get_bundle', { 
        bundleId: 'bundle1', 
        clusterId: 'test-cluster' 
      });
      
      expect(mockFleetManager.getBundle).toHaveBeenCalledWith('bundle1', 'test-cluster');
      expect(result).toEqual(mockBundle);
    });

    it('should execute fleet_create_bundle successfully', async () => {
      const mockBundle = { id: 'bundle1', name: 'test-bundle', state: 'active' };
      mockFleetManager.createBundle.mockResolvedValue(mockBundle);

      const bundleData = {
        name: 'test-bundle',
        namespace: 'fleet-default',
        clusterId: 'test-cluster',
        targets: [],
        resources: []
      };

      const result = await fleetTools.executeTool('fleet_create_bundle', bundleData);
      
      expect(mockFleetManager.createBundle).toHaveBeenCalledWith(bundleData, 'test-cluster');
      expect(result).toEqual(mockBundle);
    });

    it('should execute fleet_list_git_repos successfully', async () => {
      const mockRepos = [
        { id: 'repo1', name: 'test-repo', repo: 'https://github.com/test/repo' }
      ];
      mockFleetManager.listGitRepos.mockResolvedValue(mockRepos);

      const result = await fleetTools.executeTool('fleet_list_git_repos', { clusterId: 'test-cluster' });
      
      expect(mockFleetManager.listGitRepos).toHaveBeenCalledWith('test-cluster');
      expect(result).toEqual(mockRepos);
    });

    it('should execute fleet_list_clusters successfully', async () => {
      const mockClusters = [
        { id: 'cluster1', name: 'test-cluster', state: 'active' }
      ];
      mockFleetManager.listFleetClusters.mockResolvedValue(mockClusters);

      const result = await fleetTools.executeTool('fleet_list_clusters', {});
      
      expect(mockFleetManager.listFleetClusters).toHaveBeenCalled();
      expect(result).toEqual(mockClusters);
    });

    it('should execute fleet_list_workspaces successfully', async () => {
      const mockWorkspaces = [
        { id: 'workspace1', name: 'fleet-default', state: 'active' }
      ];
      mockFleetManager.getFleetWorkspaces.mockResolvedValue(mockWorkspaces);

      const result = await fleetTools.executeTool('fleet_list_workspaces', {});
      
      expect(mockFleetManager.getFleetWorkspaces).toHaveBeenCalled();
      expect(result).toEqual(mockWorkspaces);
    });

    it('should handle errors gracefully', async () => {
      mockFleetManager.listBundles.mockRejectedValue(new Error('API Error'));

      await expect(fleetTools.executeTool('fleet_list_bundles', { clusterId: 'test-cluster' }))
        .rejects.toThrow('API Error');
    });

    it('should throw error for unknown tool', async () => {
      await expect(fleetTools.executeTool('unknown_tool', {}))
        .rejects.toThrow('Unknown tool: unknown_tool');
    });

    it('should throw error when FleetManager is not initialized', async () => {
      // Create FleetTools without connections
      mockRancherManager.getConnection.mockReturnValue(null);
      const toolsWithoutConnections = new FleetTools(mockRancherManager);

      await expect(toolsWithoutConnections.executeTool('fleet_list_bundles', {}))
        .rejects.toThrow('No connection found for server');
    });
  });

  describe('Error handling', () => {
    it('should handle FleetManager initialization failure', () => {
      mockRancherManager.getConnection.mockReturnValue({
        isConnected: false
      });

      const toolsWithError = new FleetTools(mockRancherManager);
      expect(toolsWithError.getTools()).toBeDefined();
    });

    it('should handle missing connections gracefully', () => {
      mockRancherManager.getConnection.mockReturnValue(null);
      
      const toolsWithoutConnections = new FleetTools(mockRancherManager);
      expect(toolsWithoutConnections.getTools()).toBeDefined();
    });
  });

  describe('Tool schemas', () => {
    it('should have correct required fields for bundle operations', () => {
      const tools = fleetTools.getTools();
      
      const getBundleTool = tools.find(tool => tool.name === 'fleet_get_bundle');
      expect(getBundleTool?.inputSchema.required).toContain('bundleId');
      expect(getBundleTool?.inputSchema.required).toContain('clusterId');
      
      const deleteBundleTool = tools.find(tool => tool.name === 'fleet_delete_bundle');
      expect(deleteBundleTool?.inputSchema.required).toContain('bundleId');
      expect(deleteBundleTool?.inputSchema.required).toContain('clusterId');
    });

    it('should have correct required fields for Git repo operations', () => {
      const tools = fleetTools.getTools();
      
      const getGitRepoTool = tools.find(tool => tool.name === 'fleet_get_git_repo');
      expect(getGitRepoTool?.inputSchema.required).toContain('repoId');
      expect(getGitRepoTool?.inputSchema.required).toContain('clusterId');
      
      const createGitRepoTool = tools.find(tool => tool.name === 'fleet_create_git_repo');
      expect(createGitRepoTool?.inputSchema.required).toContain('name');
      expect(createGitRepoTool?.inputSchema.required).toContain('clusterId');
      expect(createGitRepoTool?.inputSchema.required).toContain('repo');
    });

    it('should have correct required fields for cluster operations', () => {
      const tools = fleetTools.getTools();
      
      const getClusterTool = tools.find(tool => tool.name === 'fleet_get_cluster');
      expect(getClusterTool?.inputSchema.required).toContain('clusterId');
    });

    it('should have correct required fields for deployment status', () => {
      const tools = fleetTools.getTools();
      
      const deploymentStatusTool = tools.find(tool => tool.name === 'fleet_get_deployment_status');
      expect(deploymentStatusTool?.inputSchema.required).toContain('bundleId');
      expect(deploymentStatusTool?.inputSchema.required).toContain('clusterId');
    });

    it('should have correct required fields for logs', () => {
      const tools = fleetTools.getTools();
      
      const logsTool = tools.find(tool => tool.name === 'fleet_get_logs');
      expect(logsTool?.inputSchema.required).toContain('clusterId');
      expect(logsTool?.inputSchema.properties).toHaveProperty('namespace');
    });
  });
});
