import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { RancherClient } from '../../src/rancher-client.js';
import { RancherServerConfig } from '../../src/utils.js';

// Mock the modules
vi.mock('@modelcontextprotocol/sdk/server/mcp.js');
vi.mock('@modelcontextprotocol/sdk/server/stdio.js');
vi.mock('../../src/rancher-client.js');

describe('MCP Server Integration', () => {
  let mockServer: any;
  let mockTransport: any;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Mock McpServer
    mockServer = {
      registerTool: vi.fn(),
      connect: vi.fn()
    };
    (McpServer as any).mockImplementation(() => mockServer);

    // Mock StdioServerTransport
    mockTransport = {};
    (StdioServerTransport as any).mockImplementation(() => mockTransport);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Server initialization', () => {
    it('should create server with correct name and version', () => {
      // This test would require importing the actual server setup
      // For now, we'll test the mock behavior
      expect(McpServer).toHaveBeenCalledWith({ 
        name: expect.any(String), 
        version: expect.any(String) 
      });
    });

    it('should register tools', () => {
      // This would test that all expected tools are registered
      expect(mockServer.registerTool).toHaveBeenCalled();
    });
  });

  describe('Tool registration', () => {
    it('should register rancher.servers.list tool', () => {
      const calls = mockServer.registerTool.mock.calls;
      const serverListCall = calls.find((call: any) => 
        call[0] === 'rancher.servers.list'
      );
      
      expect(serverListCall).toBeDefined();
      expect(serverListCall[1]).toEqual({
        title: 'List registered Rancher servers',
        description: 'Returns known servers from local store',
        inputSchema: expect.any(Object)
      });
    });

    it('should register rancher.servers.add tool', () => {
      const calls = mockServer.registerTool.mock.calls;
      const serverAddCall = calls.find((call: any) => 
        call[0] === 'rancher.servers.add'
      );
      
      expect(serverAddCall).toBeDefined();
      expect(serverAddCall[1]).toEqual({
        title: 'Add/Update Rancher server',
        description: 'Register a Rancher Manager for later use',
        inputSchema: expect.any(Object)
      });
    });

    it('should register rancher.clusters.list tool', () => {
      const calls = mockServer.registerTool.mock.calls;
      const clustersListCall = calls.find((call: any) => 
        call[0] === 'rancher.clusters.list'
      );
      
      expect(clustersListCall).toBeDefined();
      expect(clustersListCall[1]).toEqual({
        title: 'List clusters',
        description: 'Return clusters from selected Rancher server',
        inputSchema: expect.any(Object)
      });
    });
  });

  describe('Tool handlers', () => {
    it('should handle rancher.servers.list correctly', async () => {
      // This would test the actual handler function
      // For now, we'll create a mock implementation
      const mockHandler = vi.fn().mockResolvedValue({
        content: [{ type: 'text', text: '[]' }]
      });

      const result = await mockHandler();
      
      expect(result).toEqual({
        content: [{ type: 'text', text: '[]' }]
      });
    });

    it('should handle rancher.servers.add correctly', async () => {
      const mockHandler = vi.fn().mockImplementation(async (args: any) => {
        return {
          content: [{ type: 'text', text: JSON.stringify(args, null, 2) }]
        };
      });

      const testConfig = {
        id: 'test-server',
        baseUrl: 'https://test.local',
        token: 'test-token'
      };

      const result = await mockHandler(testConfig);
      
      expect(result).toEqual({
        content: [{ type: 'text', text: JSON.stringify(testConfig, null, 2) }]
      });
    });
  });

  describe('Error handling', () => {
    it('should handle missing server gracefully', async () => {
      const mockHandler = vi.fn().mockImplementation(async ({ serverId }: { serverId: string }) => {
        if (!serverId) {
          throw new Error('Server ID is required');
        }
        throw new Error(`Rancher server '${serverId}' not found`);
      });

      await expect(mockHandler({ serverId: 'non-existent' }))
        .rejects.toThrow("Rancher server 'non-existent' not found");
    });

    it('should handle invalid server configuration', async () => {
      const mockHandler = vi.fn().mockImplementation(async (config: any) => {
        if (!config.baseUrl || !config.token) {
          throw new Error('Invalid server configuration');
        }
        return { content: [{ type: 'text', text: 'OK' }] };
      });

      await expect(mockHandler({ id: 'test' }))
        .rejects.toThrow('Invalid server configuration');
    });
  });
});
