import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { FleetTools } from '../../tools/fleet-tools';
import { FleetManager } from '../../rancher/fleet';

// Mock the FleetManager
jest.mock('../../rancher/fleet');

describe('FleetTools', () => {
  let fleetTools: FleetTools;
  let mockRancherManager: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock rancher manager
    mockRancherManager = {
      getAllConnections: jest.fn().mockReturnValue([
        {
          client: {
            request: jest.fn()
          }
        }
      ]),
      getConfigManager: jest.fn().mockReturnValue({}),
      getLogger: jest.fn().mockReturnValue({
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn()
      })
    };

    fleetTools = new FleetTools(mockRancherManager);
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

  describe('tool execution', () => {
    it('should handle fleet_list_bundles', async () => {
      const tools = fleetTools.getTools();
      const listBundlesTool = tools.find(tool => tool.name === 'fleet_list_bundles');
      
      expect(listBundlesTool).toBeDefined();
      expect(listBundlesTool).toHaveProperty('name');
      expect(listBundlesTool).toHaveProperty('description');
      expect(listBundlesTool).toHaveProperty('inputSchema');
    });

    it('should handle fleet_get_bundle', async () => {
      const tools = fleetTools.getTools();
      const getBundleTool = tools.find(tool => tool.name === 'fleet_get_bundle');
      
      expect(getBundleTool).toBeDefined();
      expect(getBundleTool?.inputSchema.required).toContain('bundleId');
      expect(getBundleTool?.inputSchema.required).toContain('clusterId');
    });

    it('should handle fleet_force_sync_bundle', async () => {
      const tools = fleetTools.getTools();
      const forceSyncTool = tools.find(tool => tool.name === 'fleet_force_sync_bundle');
      
      expect(forceSyncTool).toBeDefined();
      expect(forceSyncTool?.inputSchema.required).toContain('bundleId');
      expect(forceSyncTool?.inputSchema.required).toContain('clusterId');
    });
  });
});
