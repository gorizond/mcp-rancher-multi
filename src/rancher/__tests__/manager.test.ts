// @ts-nocheck
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { RancherManager, RancherConnection } from '../manager';
import { ConfigManager } from '../../config/manager';
import { Logger } from '../../utils/logger';
import { RancherClient } from '../client';

// Mock dependencies
jest.mock('../../config/manager');
jest.mock('../../utils/logger');
jest.mock('../client');
jest.mock('../clusters');
jest.mock('../projects');
jest.mock('../applications');
jest.mock('../other-managers');

describe('RancherManager', () => {
  let rancherManager: RancherManager;
  let mockConfigManager: any;
  let mockLogger: any;
  let mockRancherClient: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock config manager
    mockConfigManager = {
      validateConfig: jest.fn().mockReturnValue({ valid: true, errors: [] }),
      getAllServers: jest.fn().mockReturnValue([
        { name: 'server-1', url: 'https://rancher1.com', token: 'token1' },
        { name: 'server-2', url: 'https://rancher2.com', token: 'token2' }
      ]),
      getConfig: jest.fn().mockReturnValue({ defaultServer: 'server-1' })
    };

    // Create mock logger
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      logRancherOperation: jest.fn(),
      logRancherError: jest.fn()
    };

    // Create mock rancher client
    mockRancherClient = {
      initialize: jest.fn().mockResolvedValue(undefined),
      disconnect: jest.fn().mockResolvedValue(undefined),
      ping: jest.fn().mockResolvedValue(true),
      getServerStatus: jest.fn().mockResolvedValue({ status: 'healthy' })
    };

    // Mock RancherClient constructor
    (RancherClient as jest.MockedClass<typeof RancherClient>).mockImplementation(() => mockRancherClient);

    rancherManager = new RancherManager(mockConfigManager, mockLogger);
  });

  describe('constructor', () => {
    it('should initialize with config manager and logger', () => {
      expect(rancherManager).toBeDefined();
      expect(rancherManager.getConfigManager()).toBe(mockConfigManager);
      expect(rancherManager.getLogger()).toBe(mockLogger);
    });

    it('should initialize all managers', () => {
      expect(rancherManager.clusters).toBeDefined();
      expect(rancherManager.projects).toBeDefined();
      expect(rancherManager.applications).toBeDefined();
      expect(rancherManager.users).toBeDefined();
      expect(rancherManager.monitoring).toBeDefined();
      expect(rancherManager.backup).toBeDefined();
      expect(rancherManager.nodes).toBeDefined();
      expect(rancherManager.storage).toBeDefined();
      expect(rancherManager.network).toBeDefined();
      expect(rancherManager.security).toBeDefined();
      expect(rancherManager.catalog).toBeDefined();
      expect(rancherManager.workloads).toBeDefined();
      expect(rancherManager.config).toBeDefined();
      expect(rancherManager.events).toBeDefined();
      expect(rancherManager.logs).toBeDefined();
      expect(rancherManager.metrics).toBeDefined();
      expect(rancherManager.alerts).toBeDefined();
      expect(rancherManager.policies).toBeDefined();
      expect(rancherManager.quotas).toBeDefined();
      expect(rancherManager.namespaces).toBeDefined();
    });
  });

  describe('initialize', () => {
    it('should initialize successfully with valid config', async () => {
      await rancherManager.initialize();

      expect(mockConfigManager.validateConfig).toHaveBeenCalled();
      expect(mockConfigManager.getAllServers).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith('Initializing Rancher Manager');
      expect(mockLogger.info).toHaveBeenCalledWith('Rancher Manager initialized. Connected servers: 2');
    });

    it('should throw error with invalid config', async () => {
      mockConfigManager.validateConfig.mockReturnValue({ 
        valid: false, 
        errors: ['Invalid server configuration'] 
      });

      await expect(rancherManager.initialize()).rejects.toThrow('Configuration errors: Invalid server configuration');
    });

    it('should handle connection errors gracefully', async () => {
      mockRancherClient.initialize.mockRejectedValue(new Error('Connection failed'));

      await rancherManager.initialize();

      expect(mockLogger.error).toHaveBeenCalledWith('Error connecting to server server-1:', expect.any(Error));
      expect(mockLogger.error).toHaveBeenCalledWith('Error connecting to server server-2:', expect.any(Error));
    });
  });

  describe('connectToServer', () => {
    it('should connect to server successfully', async () => {
      const serverConfig = { name: 'test-server', url: 'https://test.com', token: 'test-token' };

      const connection = await rancherManager.connectToServer(serverConfig);

      expect(RancherClient).toHaveBeenCalledWith(serverConfig, mockLogger);
      expect(mockRancherClient.initialize).toHaveBeenCalled();
      expect(connection.name).toBe('test-server');
      expect(connection.isConnected).toBe(true);
      expect(connection.lastPing).toBeInstanceOf(Date);
      expect(mockLogger.logRancherOperation).toHaveBeenCalledWith('connect', 'test-server', {
        url: 'https://test.com',
        status: 'connected'
      });
    });

    it('should handle connection failure', async () => {
      const serverConfig = { name: 'test-server', url: 'https://test.com', token: 'test-token' };
      mockRancherClient.initialize.mockRejectedValue(new Error('Connection failed'));

      await expect(rancherManager.connectToServer(serverConfig)).rejects.toThrow('Connection failed');
      expect(mockLogger.logRancherError).toHaveBeenCalledWith('connect', 'test-server', expect.any(Error));
    });
  });

  describe('disconnectFromServer', () => {
    it('should disconnect from server successfully', async () => {
      // First connect to a server
      const serverConfig = { name: 'test-server', url: 'https://test.com', token: 'test-token' };
      await rancherManager.connectToServer(serverConfig);

      // Then disconnect
      await rancherManager.disconnectFromServer('test-server');

      expect(mockRancherClient.disconnect).toHaveBeenCalled();
      expect(mockLogger.logRancherOperation).toHaveBeenCalledWith('disconnect', 'test-server');
    });

    it('should throw error when server not found', async () => {
      await expect(rancherManager.disconnectFromServer('non-existent')).rejects.toThrow(
        'Connection to server non-existent not found'
      );
    });

    it('should handle disconnect failure', async () => {
      // First connect to a server
      const serverConfig = { name: 'test-server', url: 'https://test.com', token: 'test-token' };
      await rancherManager.connectToServer(serverConfig);

      // Mock disconnect failure
      mockRancherClient.disconnect.mockRejectedValue(new Error('Disconnect failed'));

      await expect(rancherManager.disconnectFromServer('test-server')).rejects.toThrow('Disconnect failed');
      expect(mockLogger.logRancherError).toHaveBeenCalledWith('disconnect', 'test-server', expect.any(Error));
    });
  });

  describe('getConnection', () => {
    it('should return connection for specified server', async () => {
      const serverConfig = { name: 'test-server', url: 'https://test.com', token: 'test-token' };
      await rancherManager.connectToServer(serverConfig);

      const connection = rancherManager.getConnection('test-server');
      expect(connection).toBeDefined();
      expect(connection?.name).toBe('test-server');
    });

    it('should return default server connection when no server specified', async () => {
      const serverConfig = { name: 'server-1', url: 'https://test.com', token: 'test-token' };
      await rancherManager.connectToServer(serverConfig);

      const connection = rancherManager.getConnection();
      expect(connection).toBeDefined();
      expect(connection?.name).toBe('server-1');
    });

    it('should return null for non-existent server', () => {
      const connection = rancherManager.getConnection('non-existent');
      expect(connection).toBeNull();
    });
  });

  describe('getAllConnections', () => {
    it('should return all connections', async () => {
      const server1Config = { name: 'server-1', url: 'https://test1.com', token: 'token1' };
      const server2Config = { name: 'server-2', url: 'https://test2.com', token: 'token2' };

      await rancherManager.connectToServer(server1Config);
      await rancherManager.connectToServer(server2Config);

      const connections = rancherManager.getAllConnections();
      expect(connections).toHaveLength(2);
      expect(connections.map(c => c.name)).toEqual(['server-1', 'server-2']);
    });

    it('should return empty array when no connections', () => {
      const connections = rancherManager.getAllConnections();
      expect(connections).toEqual([]);
    });
  });

  describe('getConnectedServers', () => {
    it('should return only connected servers', async () => {
      const server1Config = { name: 'server-1', url: 'https://test1.com', token: 'token1' };
      const server2Config = { name: 'server-2', url: 'https://test2.com', token: 'token2' };

      await rancherManager.connectToServer(server1Config);
      await rancherManager.connectToServer(server2Config);

      // Simulate one server being disconnected
      const connection = rancherManager.getConnection('server-2');
      if (connection) {
        connection.isConnected = false;
      }

      const connectedServers = rancherManager.getConnectedServers();
      expect(connectedServers).toEqual(['server-1']);
    });
  });

  describe('pingServer', () => {
    it('should ping server successfully', async () => {
      const serverConfig = { name: 'test-server', url: 'https://test.com', token: 'test-token' };
      await rancherManager.connectToServer(serverConfig);

      const isAlive = await rancherManager.pingServer('test-server');

      expect(mockRancherClient.ping).toHaveBeenCalled();
      expect(isAlive).toBe(true);
    });

    it('should return false for non-existent server', async () => {
      const isAlive = await rancherManager.pingServer('non-existent');
      expect(isAlive).toBe(false);
    });

    it('should handle ping failure', async () => {
      const serverConfig = { name: 'test-server', url: 'https://test.com', token: 'test-token' };
      await rancherManager.connectToServer(serverConfig);

      mockRancherClient.ping.mockRejectedValue(new Error('Ping failed'));

      const isAlive = await rancherManager.pingServer('test-server');

      expect(isAlive).toBe(false);
      expect(mockLogger.logRancherError).toHaveBeenCalledWith('ping', 'test-server', expect.any(Error));
    });
  });

  describe('pingAllServers', () => {
    it('should ping all servers', async () => {
      const server1Config = { name: 'server-1', url: 'https://test1.com', token: 'token1' };
      const server2Config = { name: 'server-2', url: 'https://test2.com', token: 'token2' };

      await rancherManager.connectToServer(server1Config);
      await rancherManager.connectToServer(server2Config);

      const results = await rancherManager.pingAllServers();

      expect(results).toBeInstanceOf(Map);
      expect(results.get('server-1')).toBe(true);
      expect(results.get('server-2')).toBe(true);
    });
  });

  describe('getManager', () => {
    it('should return manager by name', () => {
      const clustersManager = rancherManager.getManager('clusters');
      expect(clustersManager).toBe(rancherManager.clusters);
    });

    it('should return undefined for non-existent manager', () => {
      const manager = rancherManager.getManager('non-existent');
      expect(manager).toBeUndefined();
    });
  });

  describe('executeOnServer', () => {
    it('should execute operation on server', async () => {
      const serverConfig = { name: 'test-server', url: 'https://test.com', token: 'test-token' };
      await rancherManager.connectToServer(serverConfig);

      const operation = jest.fn().mockResolvedValue('test-result');

      const result = await rancherManager.executeOnServer('test-server', operation);

      expect(operation).toHaveBeenCalledWith(mockRancherClient);
      expect(result).toBe('test-result');
    });

    it('should throw error when server not connected', async () => {
      const operation = jest.fn();

      await expect(rancherManager.executeOnServer('non-existent', operation)).rejects.toThrow(
        'Server non-existent is not connected'
      );
    });

    it('should handle operation failure', async () => {
      const serverConfig = { name: 'test-server', url: 'https://test.com', token: 'test-token' };
      await rancherManager.connectToServer(serverConfig);

      const operation = jest.fn().mockRejectedValue(new Error('Operation failed'));

      await expect(rancherManager.executeOnServer('test-server', operation)).rejects.toThrow('Operation failed');
      expect(mockLogger.logRancherError).toHaveBeenCalledWith('executeOnServer', 'test-server', expect.any(Error));
    });
  });

  describe('executeOnAllServers', () => {
    it('should execute operation on all connected servers', async () => {
      const server1Config = { name: 'server-1', url: 'https://test1.com', token: 'token1' };
      const server2Config = { name: 'server-2', url: 'https://test2.com', token: 'token2' };

      await rancherManager.connectToServer(server1Config);
      await rancherManager.connectToServer(server2Config);

      const operation = jest.fn().mockResolvedValue('test-result');

      const results = await rancherManager.executeOnAllServers(operation);

      expect(results).toBeInstanceOf(Map);
      expect(results.get('server-1')).toBe('test-result');
      expect(results.get('server-2')).toBe('test-result');
      expect(operation).toHaveBeenCalledTimes(2);
    });

    it('should handle operation failure on some servers', async () => {
      const server1Config = { name: 'server-1', url: 'https://test1.com', token: 'token1' };
      const server2Config = { name: 'server-2', url: 'https://test2.com', token: 'token2' };

      await rancherManager.connectToServer(server1Config);
      await rancherManager.connectToServer(server2Config);

      const operation = jest.fn()
        .mockResolvedValueOnce('success')
        .mockRejectedValueOnce(new Error('Operation failed'));

      const results = await rancherManager.executeOnAllServers(operation);

      expect(results.get('server-1')).toBe('success');
      expect(results.has('server-2')).toBe(false);
      expect(mockLogger.logRancherError).toHaveBeenCalledWith('executeOnAllServers', 'server-2', expect.any(Error));
    });
  });

  describe('getServerStatus', () => {
    it('should get status for all servers', async () => {
      const server1Config = { name: 'server-1', url: 'https://test1.com', token: 'token1' };
      const server2Config = { name: 'server-2', url: 'https://test2.com', token: 'token2' };

      await rancherManager.connectToServer(server1Config);
      await rancherManager.connectToServer(server2Config);

      const status = await rancherManager.getServerStatus();

      expect(status).toBeInstanceOf(Map);
      expect(status.get('server-1')).toEqual({
        status: 'healthy',
        isConnected: true,
        lastPing: expect.any(Date)
      });
      expect(status.get('server-2')).toEqual({
        status: 'healthy',
        isConnected: true,
        lastPing: expect.any(Date)
      });
    });

    it('should handle status request failure', async () => {
      const serverConfig = { name: 'test-server', url: 'https://test.com', token: 'test-token' };
      await rancherManager.connectToServer(serverConfig);

      mockRancherClient.getServerStatus.mockRejectedValue(new Error('Status request failed'));

      const status = await rancherManager.getServerStatus();

      expect(status.get('test-server')).toEqual({
        isConnected: false,
        error: 'Status request failed',
        lastPing: expect.any(Date)
      });
    });
  });

  describe('cleanup', () => {
    it('should cleanup all connections', async () => {
      const server1Config = { name: 'server-1', url: 'https://test1.com', token: 'token1' };
      const server2Config = { name: 'server-2', url: 'https://test2.com', token: 'token2' };

      await rancherManager.connectToServer(server1Config);
      await rancherManager.connectToServer(server2Config);

      await rancherManager.cleanup();

      expect(mockLogger.info).toHaveBeenCalledWith('Cleaning up Rancher Manager');
      expect(mockRancherClient.disconnect).toHaveBeenCalledTimes(2);
    });

    it('should handle cleanup errors gracefully', async () => {
      const serverConfig = { name: 'test-server', url: 'https://test.com', token: 'test-token' };
      await rancherManager.connectToServer(serverConfig);

      mockRancherClient.disconnect.mockRejectedValue(new Error('Disconnect failed'));

      await rancherManager.cleanup();

      expect(mockLogger.error).toHaveBeenCalledWith('Error disconnecting from server test-server:', expect.any(Error));
    });
  });
});
