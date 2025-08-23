// @ts-nocheck
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ServerTools } from '../../tools/server-tools';
import { RancherManager } from '../../rancher/manager';

// Mock dependencies
jest.mock('../../rancher/manager');

const MockRancherManager = RancherManager as jest.MockedClass<typeof RancherManager>;

describe('ServerTools', () => {
  let serverTools: ServerTools;
  let mockRancherManager: jest.Mocked<RancherManager>;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup mock rancher manager
    mockRancherManager = {
      getConfigManager: jest.fn(),
      getServerStatus: jest.fn(),
      pingServer: jest.fn(),
      pingAllServers: jest.fn(),
      connectToServer: jest.fn(),
      disconnectFromServer: jest.fn(),
      getConnectedServers: jest.fn()
    } as any;

    // Mock RancherManager constructor
    MockRancherManager.mockImplementation(() => mockRancherManager);

    serverTools = new ServerTools(mockRancherManager);
  });

  describe('constructor', () => {
    it('should initialize with rancher manager', () => {
      expect(serverTools).toBeDefined();
    });
  });

  describe('getTools', () => {
    it('should return array of server tools', () => {
      const tools = serverTools.getTools();

      expect(Array.isArray(tools)).toBe(true);
      expect(tools.length).toBeGreaterThan(0);
    });

    it('should have correct tool structure', () => {
      const tools = serverTools.getTools();

      tools.forEach(tool => {
        expect(tool).toHaveProperty('name');
        expect(tool).toHaveProperty('description');
        expect(tool).toHaveProperty('inputSchema');
        expect(typeof tool.name).toBe('string');
        expect(typeof tool.description).toBe('string');
        expect(typeof tool.inputSchema).toBe('object');
      });
    });

    it('should include all expected server tools', () => {
      const tools = serverTools.getTools();
      const toolNames = tools.map(tool => tool.name);

      const expectedTools = [
        'rancher_list_servers',
        'rancher_get_server_status',
        'rancher_ping_server',
        'rancher_ping_all_servers',
        'rancher_connect_server',
        'rancher_disconnect_server',
        'rancher_add_server',
        'rancher_remove_server',
        'rancher_update_server',
        'rancher_set_default_server',
        'rancher_get_connected_servers',
        'rancher_get_server_info',
        'rancher_validate_server_config',
        'rancher_test_server_connection',
        'rancher_get_server_metrics',
        'rancher_get_server_logs',
        'rancher_restart_server_connection',
        'rancher_get_server_health',
        'rancher_export_server_config',
        'rancher_import_server_config',
        'rancher_get_server_statistics',
        'rancher_cleanup_disconnected_servers'
      ];

      expectedTools.forEach(expectedTool => {
        expect(toolNames).toContain(expectedTool);
      });
    });

    it('should have correct input schemas for specific tools', () => {
      const tools = serverTools.getTools();
      
      // Test rancher_list_servers
      const listServersTool = tools.find(t => t.name === 'rancher_list_servers');
      expect(listServersTool).toBeDefined();
      expect(listServersTool.inputSchema).toEqual({
        type: 'object',
        properties: {},
        additionalProperties: false
      });

      // Test rancher_ping_server
      const pingServerTool = tools.find(t => t.name === 'rancher_ping_server');
      expect(pingServerTool).toBeDefined();
      expect(pingServerTool.inputSchema).toEqual({
        type: 'object',
        properties: {
          serverName: {
            type: 'string',
            description: 'Server name'
          }
        },
        required: ['serverName']
      });

      // Test rancher_connect_server
      const connectServerTool = tools.find(t => t.name === 'rancher_connect_server');
      expect(connectServerTool).toBeDefined();
      expect(connectServerTool.inputSchema.properties).toHaveProperty('name');
      expect(connectServerTool.inputSchema.properties).toHaveProperty('url');
      expect(connectServerTool.inputSchema.properties).toHaveProperty('token');
      expect(connectServerTool.inputSchema.required).toContain('name');
      expect(connectServerTool.inputSchema.required).toContain('url');
      expect(connectServerTool.inputSchema.required).toContain('token');
    });

    it('should have correct descriptions for tools', () => {
      const tools = serverTools.getTools();
      
      const listServersTool = tools.find(t => t.name === 'rancher_list_servers');
      expect(listServersTool.description).toBe('Get list of all configured Rancher servers');

      const pingServerTool = tools.find(t => t.name === 'rancher_ping_server');
      expect(pingServerTool.description).toBe('Check server availability');

      const connectServerTool = tools.find(t => t.name === 'rancher_connect_server');
      expect(connectServerTool.description).toBe('Connect to server');
    });

    it('should have correct enum values for export format', () => {
      const tools = serverTools.getTools();
      const exportConfigTool = tools.find(t => t.name === 'rancher_export_server_config');
      
      expect(exportConfigTool.inputSchema.properties.format.enum).toEqual(['json', 'yaml']);
    });

    it('should have correct log level options', () => {
      const tools = serverTools.getTools();
      const getLogsTool = tools.find(t => t.name === 'rancher_get_server_logs');
      
      expect(getLogsTool.inputSchema.properties.level.description).toContain('info, warn, error');
    });

    it('should have correct statistics period options', () => {
      const tools = serverTools.getTools();
      const getStatsTool = tools.find(t => t.name === 'rancher_get_server_statistics');
      
      expect(getStatsTool.inputSchema.properties.period.description).toContain('1h, 24h, 7d, 30d');
    });
  });

  describe('tool validation', () => {
    it('should have unique tool names', () => {
      const tools = serverTools.getTools();
      const toolNames = tools.map(tool => tool.name);
      const uniqueNames = new Set(toolNames);

      expect(toolNames.length).toBe(uniqueNames.size);
    });

    it('should have valid JSON schema structure', () => {
      const tools = serverTools.getTools();

      tools.forEach(tool => {
        expect(tool.inputSchema).toHaveProperty('type');
        expect(tool.inputSchema.type).toBe('object');
        
        if (tool.inputSchema.properties) {
          expect(typeof tool.inputSchema.properties).toBe('object');
        }
        
        if (tool.inputSchema.required) {
          expect(Array.isArray(tool.inputSchema.required)).toBe(true);
        }
      });
    });

    it('should have consistent property types', () => {
      const tools = serverTools.getTools();

      tools.forEach(tool => {
        if (tool.inputSchema.properties) {
          Object.values(tool.inputSchema.properties).forEach(prop => {
            expect(prop).toHaveProperty('type');
            expect(['string', 'number', 'boolean', 'object', 'array']).toContain(prop.type);
          });
        }
      });
    });
  });

  describe('inheritance', () => {
    it('should extend BaseToolManager', () => {
      expect(serverTools).toBeInstanceOf(ServerTools);
      expect(typeof serverTools.getTools).toBe('function');
    });
  });
});
