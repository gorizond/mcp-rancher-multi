import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { BaseToolManager } from '../../tools/base';
import { Tool } from '@modelcontextprotocol/sdk/types.js';

// Mock RancherManager
const mockRancherManager = {
  clusters: {},
  projects: {},
  applications: {},
  users: {},
  monitoring: {},
  backup: {},
  nodes: {},
  storage: {},
  network: {},
  security: {},
  catalog: {},
  workloads: {},
  config: {},
  events: {},
  logs: {},
  metrics: {},
  alerts: {},
  policies: {},
  quotas: {},
  namespaces: {},
  fleet: {},
  getLogger: jest.fn().mockReturnValue({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }),
  getConfigManager: jest.fn().mockReturnValue({
    getServerNames: jest.fn().mockReturnValue(['server1', 'server2']),
    validateConfig: jest.fn().mockReturnValue({ valid: true, errors: [] })
  }),
  executeOnServer: jest.fn() as jest.MockedFunction<any>,
  executeOnAllServers: jest.fn() as jest.MockedFunction<any>
};

describe('BaseToolManager', () => {
  let baseToolManager: BaseToolManager;
  let mockTools: Tool[];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock return values
    mockRancherManager.executeOnServer.mockResolvedValue('server result');
    mockRancherManager.executeOnAllServers.mockResolvedValue(new Map([
      ['server1', 'result1'],
      ['server2', 'result2']
    ]));
    
    mockTools = [
      {
        name: 'test-tool',
        description: 'Test tool',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      }
    ];

    baseToolManager = new (class extends BaseToolManager {
      getTools() {
        return mockTools;
      }
    })(mockRancherManager as any);
  });

  describe('constructor', () => {
    test('should create base tool manager instance', () => {
      expect(baseToolManager).toBeInstanceOf(BaseToolManager);
    });

    test('should have rancher manager', () => {
      expect(baseToolManager).toHaveProperty('rancherManager');
    });

    test('should store rancher manager reference', () => {
      expect((baseToolManager as any).rancherManager).toBe(mockRancherManager);
    });
  });

  describe('getTools', () => {
    test('should return tools from concrete implementation', () => {
      const tools = baseToolManager.getTools();
      expect(tools).toEqual(mockTools);
      expect(tools).toHaveLength(1);
      expect(tools[0].name).toBe('test-tool');
    });
  });

  describe('getLogger', () => {
    test('should get logger from rancher manager', () => {
      const logger = (baseToolManager as any).getLogger();
      
      expect(mockRancherManager.getLogger).toHaveBeenCalledTimes(1);
      expect(logger).toBeDefined();
      expect(logger.info).toBeDefined();
      expect(logger.error).toBeDefined();
    });
  });

  describe('getConfigManager', () => {
    test('should get config manager from rancher manager', () => {
      const configManager = (baseToolManager as any).getConfigManager();
      
      expect(mockRancherManager.getConfigManager).toHaveBeenCalledTimes(1);
      expect(configManager).toBeDefined();
      expect(configManager.getServerNames).toBeDefined();
      expect(configManager.validateConfig).toBeDefined();
    });
  });

  describe('executeOnServer', () => {
    test('should execute operation on specific server', async () => {
      const serverName = 'test-server';
      const mockOperation = () => Promise.resolve('operation result');
      
      const result = await (baseToolManager as any).executeOnServer(serverName, mockOperation);
      
      expect(mockRancherManager.executeOnServer).toHaveBeenCalledTimes(1);
      expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith(serverName, mockOperation);
      expect(result).toBe('server result');
    });

    test('should propagate errors from execute on server', async () => {
      const serverName = 'test-server';
      const mockOperation = () => Promise.resolve('operation result');
      const error = new Error('Server error');
      
      mockRancherManager.executeOnServer.mockRejectedValueOnce(error);
      
      await expect((baseToolManager as any).executeOnServer(serverName, mockOperation))
        .rejects.toThrow('Server error');
    });
  });

  describe('executeOnAllServers', () => {
    test('should execute operation on all servers', async () => {
      const mockOperation = () => Promise.resolve('operation result');
      
      const result = await (baseToolManager as any).executeOnAllServers(mockOperation);
      
      expect(mockRancherManager.executeOnAllServers).toHaveBeenCalledTimes(1);
      expect(mockRancherManager.executeOnAllServers).toHaveBeenCalledWith(mockOperation);
      expect(result).toBeInstanceOf(Map);
      expect(result.get('server1')).toBe('result1');
      expect(result.get('server2')).toBe('result2');
    });

    test('should propagate errors from execute on all servers', async () => {
      const mockOperation = () => Promise.resolve('operation result');
      const error = new Error('All servers error');
      
      mockRancherManager.executeOnAllServers.mockRejectedValueOnce(error);
      
      await expect((baseToolManager as any).executeOnAllServers(mockOperation))
        .rejects.toThrow('All servers error');
    });
  });
});
