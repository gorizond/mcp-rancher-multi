// @ts-nocheck
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ServerManager } from '../server-manager';
import { RancherManager } from '../manager';
import { RancherServerConfig } from '../../config/manager';
import { Logger } from '../../utils/logger';

// Mock dependencies
jest.mock('../manager');
jest.mock('../../config/manager');
jest.mock('../../utils/logger');

const MockRancherManager = RancherManager as jest.MockedClass<typeof RancherManager>;

describe('ServerManager', () => {
  let serverManager: ServerManager;
  let mockRancherManager: jest.Mocked<RancherManager>;
  let mockLogger: jest.Mocked<Logger>;
  let mockConfigManager: any;
  let mockConnection: any;
  let mockClient: any;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup mock logger
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      setLevel: jest.fn(),
      getLevel: jest.fn().mockReturnValue('info')
    } as any;

    // Setup mock config manager
    mockConfigManager = {
      getServerNames: jest.fn().mockReturnValue(['server-1', 'server-2']),
      getServerConfig: jest.fn().mockReturnValue({
        name: 'test-server',
        url: 'https://test.com',
        token: 'test-token'
      }),
      addServer: jest.fn(),
      removeServer: jest.fn().mockReturnValue(true),
      updateServer: jest.fn().mockReturnValue(true),
      getConfig: jest.fn().mockReturnValue({ 
        defaultServer: 'server-1',
        servers: new Map([
          ['server-1', { name: 'server-1', url: 'https://server1.com', token: 'token1' }],
          ['server-2', { name: 'server-2', url: 'https://server2.com', token: 'token2' }]
        ])
      }),
      validateConfig: jest.fn().mockReturnValue({ valid: true, errors: [] })
    };

    // Setup mock client
    mockClient = {
      getServerStatus: jest.fn().mockResolvedValue({ status: 'healthy', version: '2.6.0' }),
      ping: jest.fn().mockResolvedValue(true)
    };

    // Setup mock connection
    mockConnection = {
      name: 'test-server',
      config: { name: 'test-server', url: 'https://test.com', token: 'test-token' },
      client: mockClient,
      isConnected: true,
      lastPing: new Date()
    };

    // Setup mock rancher manager
    mockRancherManager = {
      getLogger: jest.fn().mockReturnValue(mockLogger),
      getConfigManager: jest.fn().mockReturnValue(mockConfigManager),
      getConnection: jest.fn().mockReturnValue(mockConnection),
      getConnectedServers: jest.fn().mockReturnValue(['server-1']),
      pingServer: jest.fn().mockResolvedValue(true),
      pingAllServers: jest.fn().mockResolvedValue(new Map([['server-1', true], ['server-2', false]])),
      connectToServer: jest.fn().mockResolvedValue(mockConnection),
      disconnectFromServer: jest.fn().mockResolvedValue(undefined),
      getServerStatus: jest.fn().mockResolvedValue(new Map([['server-1', { status: 'healthy' }]]))
    } as any;

    // Mock RancherManager constructor
    MockRancherManager.mockImplementation(() => mockRancherManager);

    serverManager = new ServerManager(mockRancherManager);
  });

  describe('constructor', () => {
    it('should initialize with rancher manager', () => {
      expect(serverManager).toBeDefined();
    });
  });

  describe('getServerNames', () => {
    it('should return server names from config manager', () => {
      const result = serverManager.getServerNames();

      expect(result).toEqual(['server-1', 'server-2']);
      expect(mockRancherManager.getConfigManager).toHaveBeenCalled();
      expect(mockConfigManager.getServerNames).toHaveBeenCalled();
    });
  });

  describe('getServerConfig', () => {
    it('should return server configuration', () => {
      const result = serverManager.getServerConfig('test-server');

      expect(result).toEqual({
        name: 'test-server',
        url: 'https://test.com',
        token: 'test-token'
      });
      expect(mockRancherManager.getConfigManager).toHaveBeenCalled();
      expect(mockConfigManager.getServerConfig).toHaveBeenCalledWith('test-server');
    });

    it('should return null for non-existent server', () => {
      mockConfigManager.getServerConfig.mockReturnValue(null);

      const result = serverManager.getServerConfig('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('getServerStatus', () => {
    it('should get status for specific server', async () => {
      const result = await serverManager.getServerStatus('test-server');

      expect(result).toEqual({
        name: 'test-server',
        isConnected: true,
        lastPing: expect.any(Date),
        status: { status: 'healthy', version: '2.6.0' }
      });
      expect(mockRancherManager.getConnection).toHaveBeenCalledWith('test-server');
      expect(mockClient.getServerStatus).toHaveBeenCalled();
    });

    it('should handle server not found', async () => {
      mockRancherManager.getConnection.mockReturnValue(null);

      const result = await serverManager.getServerStatus('non-existent');

      expect(result).toEqual({
        error: 'Server non-existent not found'
      });
    });

    it('should handle server status error', async () => {
      mockClient.getServerStatus.mockRejectedValue(new Error('Status failed'));

      const result = await serverManager.getServerStatus('test-server');

      expect(result).toEqual({
        name: 'test-server',
        isConnected: false,
        error: 'Status failed',
        lastPing: expect.any(Date)
      });
    });

    it('should get status for all servers when no server specified', async () => {
      const result = await serverManager.getServerStatus();

      expect(result).toBeInstanceOf(Map);
      expect(mockRancherManager.getServerStatus).toHaveBeenCalled();
    });
  });

  describe('pingServer', () => {
    it('should ping specific server', async () => {
      const result = await serverManager.pingServer('test-server');

      expect(result).toBe(true);
      expect(mockRancherManager.pingServer).toHaveBeenCalledWith('test-server');
    });
  });

  describe('pingAllServers', () => {
    it('should ping all servers', async () => {
      const result = await serverManager.pingAllServers();

      expect(result).toBeInstanceOf(Map);
      expect(result.get('server-1')).toBe(true);
      expect(result.get('server-2')).toBe(false);
      expect(mockRancherManager.pingAllServers).toHaveBeenCalled();
    });
  });

  describe('connectToServer', () => {
    it('should connect to server successfully', async () => {
      const serverConfig: RancherServerConfig = {
        name: 'test-server',
        url: 'https://test.com',
        token: 'test-token'
      };

      const result = await serverManager.connectToServer(serverConfig);

      expect(result).toEqual({
        success: true,
        serverName: 'test-server',
        message: 'Successfully connected to server test-server'
      });
      expect(mockRancherManager.connectToServer).toHaveBeenCalledWith(serverConfig);
    });

    it('should handle connection failure', async () => {
      const serverConfig: RancherServerConfig = {
        name: 'test-server',
        url: 'https://test.com',
        token: 'test-token'
      };

      mockRancherManager.connectToServer.mockRejectedValue(new Error('Connection failed'));

      const result = await serverManager.connectToServer(serverConfig);

      expect(result).toEqual({
        success: false,
        serverName: 'test-server',
        error: 'Connection failed'
      });
    });
  });

  describe('disconnectFromServer', () => {
    it('should disconnect from server successfully', async () => {
      const result = await serverManager.disconnectFromServer('test-server');

      expect(result).toEqual({
        success: true,
        serverName: 'test-server',
        message: 'Successfully disconnected from server test-server'
      });
      expect(mockRancherManager.disconnectFromServer).toHaveBeenCalledWith('test-server');
    });

    it('should handle disconnection failure', async () => {
      mockRancherManager.disconnectFromServer.mockRejectedValue(new Error('Disconnect failed'));

      const result = await serverManager.disconnectFromServer('test-server');

      expect(result).toEqual({
        success: false,
        serverName: 'test-server',
        error: 'Disconnect failed'
      });
    });
  });

  describe('addServer', () => {
    it('should add server successfully', () => {
      const serverConfig: RancherServerConfig = {
        name: 'new-server',
        url: 'https://new.com',
        token: 'new-token'
      };

      const result = serverManager.addServer(serverConfig);

      expect(result).toBe(true);
      expect(mockRancherManager.getConfigManager).toHaveBeenCalled();
      expect(mockConfigManager.addServer).toHaveBeenCalledWith(serverConfig);
      expect(mockLogger.info).toHaveBeenCalledWith('Server new-server added to configuration');
    });

    it('should handle add server error', () => {
      const serverConfig: RancherServerConfig = {
        name: 'new-server',
        url: 'https://new.com',
        token: 'new-token'
      };

      mockConfigManager.addServer.mockImplementation(() => {
        throw new Error('Add failed');
      });

      const result = serverManager.addServer(serverConfig);

      expect(result).toBe(false);
      expect(mockLogger.error).toHaveBeenCalledWith('Error adding server new-server:', expect.any(Error));
    });
  });

  describe('removeServer', () => {
    it('should remove server successfully', () => {
      const result = serverManager.removeServer('test-server');

      expect(result).toBe(true);
      expect(mockRancherManager.getConnection).toHaveBeenCalledWith('test-server');
      expect(mockRancherManager.getConfigManager).toHaveBeenCalled();
      expect(mockConfigManager.removeServer).toHaveBeenCalledWith('test-server');
      expect(mockLogger.info).toHaveBeenCalledWith('Server test-server removed from configuration');
    });

    it('should disconnect before removing if connected', () => {
      mockConnection.isConnected = true;

      serverManager.removeServer('test-server');

      expect(mockRancherManager.disconnectFromServer).toHaveBeenCalledWith('test-server');
    });

    it('should handle remove server error', () => {
      mockConfigManager.removeServer.mockImplementation(() => {
        throw new Error('Remove failed');
      });

      const result = serverManager.removeServer('test-server');

      expect(result).toBe(false);
      expect(mockLogger.error).toHaveBeenCalledWith('Error removing server test-server:', expect.any(Error));
    });
  });

  describe('updateServer', () => {
    it('should update server successfully', () => {
      const config = { url: 'https://updated.com' };

      const result = serverManager.updateServer('test-server', config);

      expect(result).toBe(true);
      expect(mockRancherManager.getConfigManager).toHaveBeenCalled();
      expect(mockConfigManager.updateServer).toHaveBeenCalledWith('test-server', config);
      expect(mockLogger.info).toHaveBeenCalledWith('Server test-server configuration updated');
    });

    it('should handle update server error', () => {
      const config = { url: 'https://updated.com' };

      mockConfigManager.updateServer.mockImplementation(() => {
        throw new Error('Update failed');
      });

      const result = serverManager.updateServer('test-server', config);

      expect(result).toBe(false);
      expect(mockLogger.error).toHaveBeenCalledWith('Error updating server test-server:', expect.any(Error));
    });
  });

  describe('setDefaultServer', () => {
    it('should set default server successfully', () => {
      const result = serverManager.setDefaultServer('test-server');

      expect(result).toBe(true);
      expect(mockRancherManager.getConfigManager).toHaveBeenCalled();
      expect(mockConfigManager.getConfig).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith('Server test-server set as default server');
    });

    it('should handle set default server error', () => {
      mockConfigManager.getConfig.mockImplementation(() => {
        throw new Error('Get config failed');
      });

      const result = serverManager.setDefaultServer('test-server');

      expect(result).toBe(false);
      expect(mockLogger.error).toHaveBeenCalledWith('Error setting default server test-server:', expect.any(Error));
    });
  });

  describe('getConnectedServers', () => {
    it('should return connected servers', () => {
      const result = serverManager.getConnectedServers();

      expect(result).toEqual(['server-1']);
      expect(mockRancherManager.getConnectedServers).toHaveBeenCalled();
    });
  });

  describe('getServerInfo', () => {
    it('should get server information', async () => {
      const result = await serverManager.getServerInfo('test-server');

      expect(result).toEqual({
        name: 'test-server',
        config: { name: 'test-server', url: 'https://test.com', token: 'test-token' },
        isConnected: true,
        lastPing: expect.any(Date),
        status: { status: 'healthy', version: '2.6.0' }
      });
    });

    it('should handle server not found', async () => {
      mockRancherManager.getConnection.mockReturnValue(null);

      const result = await serverManager.getServerInfo('non-existent');

      expect(result).toEqual({
        error: 'Server non-existent not found'
      });
    });

    it('should handle server info error', async () => {
      mockClient.getServerStatus.mockRejectedValue(new Error('Info failed'));

      const result = await serverManager.getServerInfo('test-server');

      expect(result).toEqual({
        name: 'test-server',
        config: { name: 'test-server', url: 'https://test.com', token: 'test-token' },
        isConnected: false,
        error: 'Info failed',
        lastPing: expect.any(Date)
      });
    });
  });

  describe('validateServerConfig', () => {
    it('should validate specific server config', () => {
      const result = serverManager.validateServerConfig('test-server');

      expect(result).toEqual({
        valid: true,
        errors: [],
        serverName: 'test-server'
      });
      expect(mockConfigManager.getServerConfig).toHaveBeenCalledWith('test-server');
    });

    it('should handle missing server', () => {
      mockConfigManager.getServerConfig.mockReturnValue(null);

      const result = serverManager.validateServerConfig('non-existent');

      expect(result).toEqual({
        valid: false,
        errors: ['Server non-existent not found']
      });
    });

    it('should validate all servers when no server specified', () => {
      const result = serverManager.validateServerConfig();

      expect(result).toEqual({ valid: true, errors: [] });
      expect(mockRancherManager.getConfigManager).toHaveBeenCalled();
      expect(mockConfigManager.validateConfig).toHaveBeenCalled();
    });
  });

  describe('testServerConnection', () => {
    it('should test server connection successfully', async () => {
      const result = await serverManager.testServerConnection('test-server');

      expect(result).toEqual({
        success: true,
        isConnected: true,
        status: { status: 'healthy', version: '2.6.0' },
        responseTime: expect.any(Number)
      });
    });

    it('should handle server not found', async () => {
      mockRancherManager.getConnection.mockReturnValue(null);

      const result = await serverManager.testServerConnection('non-existent');

      expect(result).toEqual({
        success: false,
        error: 'Server non-existent not found'
      });
    });

    it('should handle connection test error', async () => {
      mockClient.getServerStatus.mockRejectedValue(new Error('Test failed'));

      const result = await serverManager.testServerConnection('test-server');

      expect(result).toEqual({
        success: false,
        error: 'Test failed'
      });
    });
  });

  describe('getServerMetrics', () => {
    it('should get server metrics', async () => {
      const result = await serverManager.getServerMetrics('test-server');

      expect(result).toEqual({
        name: 'test-server',
        isConnected: true,
        lastPing: expect.any(Date),
        uptime: 'unknown',
        version: '2.6.0',
        resources: {},
        performance: {
          responseTime: expect.any(Number)
        }
      });
    });

    it('should handle server not found', async () => {
      mockRancherManager.getConnection.mockReturnValue(null);

      const result = await serverManager.getServerMetrics('non-existent');

      expect(result).toEqual({
        error: 'Server non-existent not found'
      });
    });

    it('should handle metrics error', async () => {
      mockClient.getServerStatus.mockRejectedValue(new Error('Metrics failed'));

      const result = await serverManager.getServerMetrics('test-server');

      expect(result).toEqual({
        name: 'test-server',
        error: 'Metrics failed'
      });
    });
  });

  describe('getServerLogs', () => {
    it('should get server logs', async () => {
      const options = { lines: 100 };
      const result = await serverManager.getServerLogs('test-server', options);

      expect(result).toEqual({
        name: 'test-server',
        logs: 'Server test-server logs (function in development)',
        options
      });
    });

    it('should handle server not found', async () => {
      mockRancherManager.getConnection.mockReturnValue(null);

      const result = await serverManager.getServerLogs('non-existent');

      expect(result).toEqual({
        error: 'Server non-existent not found'
      });
    });
  });

  describe('restartServerConnection', () => {
    it('should restart server connection successfully', async () => {
      const result = await serverManager.restartServerConnection('test-server');

      expect(result).toEqual({
        success: true,
        serverName: 'test-server',
        message: 'Successfully connected to server test-server'
      });
      expect(mockRancherManager.disconnectFromServer).toHaveBeenCalledWith('test-server');
      expect(mockRancherManager.connectToServer).toHaveBeenCalled();
    });

    it('should handle server not found in config', async () => {
      mockConfigManager.getServerConfig.mockReturnValue(null);

      const result = await serverManager.restartServerConnection('non-existent');

      expect(result).toEqual({
        success: false,
        error: 'Server non-existent not found in configuration'
      });
    });


  });

  describe('getServerHealth', () => {
    it('should get healthy server status', async () => {
      const result = await serverManager.getServerHealth('test-server');

      expect(result).toEqual({
        name: 'test-server',
        health: 'healthy',
        isConnected: true,
        lastPing: expect.any(Date),
        details: { status: 'healthy', version: '2.6.0' }
      });
    });

    it('should handle server not found', async () => {
      mockRancherManager.getConnection.mockReturnValue(null);

      const result = await serverManager.getServerHealth('non-existent');

      expect(result).toEqual({
        health: 'unknown',
        error: 'Server non-existent not found'
      });
    });

    it('should handle health check error', async () => {
      mockClient.getServerStatus.mockRejectedValue(new Error('Health failed'));

      const result = await serverManager.getServerHealth('test-server');

      expect(result).toEqual({
        name: 'test-server',
        health: 'unhealthy',
        error: 'Health failed'
      });
    });
  });

  describe('exportServerConfig', () => {
    it('should export server configuration in JSON format', () => {
      const result = serverManager.exportServerConfig('json', false);

      expect(result).toEqual({
        format: 'json',
        data: {
          logLevel: undefined,
          defaultServer: 'server-1',
          cacheTimeout: undefined,
          maxConcurrentRequests: undefined,
          requestTimeout: undefined,
          servers: [
            {
              name: 'server-1',
              url: 'https://server1.com',
              insecure: undefined,
              timeout: undefined,
              retries: undefined,
              token: '***'
            },
            {
              name: 'server-2',
              url: 'https://server2.com',
              insecure: undefined,
              timeout: undefined,
              retries: undefined,
              token: '***'
            }
          ]
        }
      });
    });

    it('should export server configuration in YAML format', () => {
      const result = serverManager.exportServerConfig('yaml', false);

      expect(result).toEqual({
        format: 'yaml',
        data: expect.any(Object)
      });
    });
  });

  describe('importServerConfig', () => {
    it('should import server configuration successfully', () => {
      const config = {
        servers: [
          { name: 'server-1', url: 'https://server1.com', token: 'token1' },
          { name: 'server-2', url: 'https://server2.com', token: 'token2' }
        ]
      };

      const result = serverManager.importServerConfig(config, false);

      expect(result).toEqual({
        success: true,
        message: 'Configuration successfully imported'
      });
    });


  });

  describe('getServerStatistics', () => {
    it('should get server statistics', async () => {
      const result = await serverManager.getServerStatistics('24h');

      expect(result).toEqual({
        period: '24h',
        totalServers: 2,
        connectedServers: 2,
        statistics: {
          'server-1': {
            isConnected: true,
            lastPing: expect.any(Date),
            uptime: expect.any(Number)
          },
          'server-2': {
            isConnected: true,
            lastPing: expect.any(Date),
            uptime: expect.any(Number)
          }
        }
      });
    });
  });

  describe('cleanupDisconnectedServers', () => {
    it('should cleanup disconnected servers', async () => {
      mockRancherManager.getConnection.mockReturnValue(null);

      const result = await serverManager.cleanupDisconnectedServers(false);

      expect(result).toEqual({
        cleaned: ['server-1', 'server-2'],
        errors: [],
        totalCleaned: 2,
        totalErrors: 0
      });
    });

    it('should force cleanup when force is true', async () => {
      mockRancherManager.getConnection.mockReturnValue(null);

      const result = await serverManager.cleanupDisconnectedServers(true);

      expect(result).toEqual({
        cleaned: ['server-1', 'server-2'],
        errors: [],
        totalCleaned: 2,
        totalErrors: 0
      });
    });
  });
});
