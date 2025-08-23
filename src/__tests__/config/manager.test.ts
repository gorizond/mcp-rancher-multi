import { describe, test, expect, beforeEach, jest } from '@jest/globals';
import { ConfigManager, RancherServerConfig } from '../../config/manager';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Mock fs module
jest.mock('fs');
jest.mock('path');

const mockExistsSync = existsSync as jest.MockedFunction<typeof existsSync>;
const mockReadFileSync = readFileSync as jest.MockedFunction<typeof readFileSync>;
const mockJoin = join as jest.MockedFunction<typeof join>;

describe('ConfigManager', () => {
  let configManager: ConfigManager;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };
    
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock path.join to return predictable paths
    mockJoin.mockImplementation((...args) => args.join('/'));
    
    // Mock fs.existsSync to return false by default
    mockExistsSync.mockReturnValue(false);
    
    // Clear environment variables
    delete process.env.RANCHER_URL;
    delete process.env.RANCHER_TOKEN;
    delete process.env.RANCHER_NAME;
    delete process.env.LOG_LEVEL;
    delete process.env.DEFAULT_RANCHER_SERVER;
    delete process.env.CACHE_TIMEOUT;
    delete process.env.MAX_CONCURRENT_REQUESTS;
    delete process.env.REQUEST_TIMEOUT;
    delete process.env.ENABLE_FILE_LOGGING;
    delete process.env.LOG_DIRECTORY;
    
    configManager = new ConfigManager();
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('constructor and initialization', () => {
    test('should create config manager instance', () => {
      expect(configManager).toBeInstanceOf(ConfigManager);
    });

    test('should have default configuration', () => {
      const config = configManager.getConfig();
      expect(config).toBeDefined();
      expect(config.logLevel).toBe('info');
      expect(config.defaultServer).toBe('default');
      expect(config.cacheTimeout).toBe(300000);
      expect(config.maxConcurrentRequests).toBe(10);
      expect(config.requestTimeout).toBe(30000);
      expect(config.enableFileLogging).toBe(false);
      expect(config.logDirectory).toBe('logs');
      expect(config.servers).toBeInstanceOf(Map);
    });

    test('should load configuration from environment variables', () => {
      // Set environment variables
      process.env.LOG_LEVEL = 'debug';
      process.env.DEFAULT_RANCHER_SERVER = 'test-server';
      process.env.CACHE_TIMEOUT = '600000';
      process.env.MAX_CONCURRENT_REQUESTS = '20';
      process.env.REQUEST_TIMEOUT = '60000';
      process.env.ENABLE_FILE_LOGGING = 'true';
      process.env.LOG_DIRECTORY = '/var/logs';

      const newConfigManager = new ConfigManager();
      const config = newConfigManager.getConfig();

      expect(config.logLevel).toBe('debug');
      expect(config.defaultServer).toBe('test-server');
      expect(config.cacheTimeout).toBe(600000);
      expect(config.maxConcurrentRequests).toBe(20);
      expect(config.requestTimeout).toBe(60000);
      expect(config.enableFileLogging).toBe(true);
      expect(config.logDirectory).toBe('/var/logs');
    });

    test('should load main server from environment variables', () => {
      process.env.RANCHER_URL = 'https://rancher.example.com';
      process.env.RANCHER_TOKEN = 'test-token';
      process.env.RANCHER_NAME = 'main-server';
      process.env.RANCHER_USERNAME = 'admin';
      process.env.RANCHER_PASSWORD = 'password';
      process.env.RANCHER_INSECURE = 'true';
      process.env.RANCHER_TIMEOUT = '45000';
      process.env.RANCHER_RETRIES = '5';

      const newConfigManager = new ConfigManager();
      const serverConfig = newConfigManager.getServerConfig('main-server');

      expect(serverConfig).toBeDefined();
      expect(serverConfig?.url).toBe('https://rancher.example.com');
      expect(serverConfig?.token).toBe('test-token');
      expect(serverConfig?.name).toBe('main-server');
      expect(serverConfig?.username).toBe('admin');
      expect(serverConfig?.password).toBe('password');
      expect(serverConfig?.insecure).toBe(true);
      expect(serverConfig?.timeout).toBe(45000);
      expect(serverConfig?.retries).toBe(5);
    });

    test('should load additional servers from environment variables', () => {
      process.env.RANCHER_SERVER_2_URL = 'https://rancher2.example.com';
      process.env.RANCHER_SERVER_2_TOKEN = 'token2';
      process.env.RANCHER_SERVER_2_NAME = 'server2';
      process.env.RANCHER_SERVER_2_USERNAME = 'user2';
      process.env.RANCHER_SERVER_2_PASSWORD = 'pass2';
      process.env.RANCHER_SERVER_2_INSECURE = 'false';
      process.env.RANCHER_SERVER_2_TIMEOUT = '60000';
      process.env.RANCHER_SERVER_2_RETRIES = '3';

      const newConfigManager = new ConfigManager();
      const serverConfig = newConfigManager.getServerConfig('server2');

      expect(serverConfig).toBeDefined();
      expect(serverConfig?.url).toBe('https://rancher2.example.com');
      expect(serverConfig?.token).toBe('token2');
      expect(serverConfig?.name).toBe('server2');
      expect(serverConfig?.username).toBe('user2');
      expect(serverConfig?.password).toBe('pass2');
      expect(serverConfig?.insecure).toBe(false);
      expect(serverConfig?.timeout).toBe(60000);
      expect(serverConfig?.retries).toBe(3);
    });

    test('should load configuration from config.json file', () => {
      const mockConfigData = {
        logLevel: 'warn',
        defaultServer: 'file-server',
        cacheTimeout: 900000,
        maxConcurrentRequests: 15,
        requestTimeout: 45000,
        servers: [
          {
            name: 'file-server',
            url: 'https://rancher-file.example.com',
            token: 'file-token',
            username: 'file-user',
            password: 'file-pass',
            insecure: true,
            timeout: 60000,
            retries: 5
          }
        ]
      };

             mockExistsSync.mockImplementation((path: any) => {
         return String(path).includes('config.json');
       });
       mockReadFileSync.mockReturnValue(JSON.stringify(mockConfigData));

      const newConfigManager = new ConfigManager();
      const config = newConfigManager.getConfig();
      const serverConfig = newConfigManager.getServerConfig('file-server');

      expect(config.logLevel).toBe('warn');
      expect(config.defaultServer).toBe('file-server');
      expect(config.cacheTimeout).toBe(900000);
      expect(config.maxConcurrentRequests).toBe(15);
      expect(config.requestTimeout).toBe(45000);
      expect(serverConfig).toBeDefined();
      expect(serverConfig?.url).toBe('https://rancher-file.example.com');
      expect(serverConfig?.token).toBe('file-token');
    });

    test('should handle invalid config.json file', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

             mockExistsSync.mockImplementation((path: any) => {
         return String(path).includes('config.json');
       });
       mockReadFileSync.mockImplementation((path: any) => {
         throw new Error('Invalid JSON');
       });

      expect(() => new ConfigManager()).not.toThrow();
      expect(consoleSpy).toHaveBeenCalledWith('Error loading config.json:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('server management', () => {
    test('should get server configuration by name', () => {
      const serverConfig: RancherServerConfig = {
        name: 'test-server',
        url: 'https://test.example.com',
        token: 'test-token'
      };

      configManager.addServer(serverConfig);
      const retrieved = configManager.getServerConfig('test-server');

      expect(retrieved).toEqual(serverConfig);
    });

    test('should return null for non-existent server', () => {
      const retrieved = configManager.getServerConfig('non-existent');
      expect(retrieved).toBeNull();
    });

    test('should get default server configuration', () => {
      const serverConfig: RancherServerConfig = {
        name: 'default',
        url: 'https://default.example.com',
        token: 'default-token'
      };

      configManager.addServer(serverConfig);
      const retrieved = configManager.getServerConfig();

      expect(retrieved).toEqual(serverConfig);
    });

    test('should get all servers', () => {
      const server1: RancherServerConfig = {
        name: 'server1',
        url: 'https://server1.example.com',
        token: 'token1'
      };
      const server2: RancherServerConfig = {
        name: 'server2',
        url: 'https://server2.example.com',
        token: 'token2'
      };

      configManager.addServer(server1);
      configManager.addServer(server2);

      const servers = configManager.getAllServers();
      expect(servers).toHaveLength(2);
      expect(servers).toContainEqual(server1);
      expect(servers).toContainEqual(server2);
    });

    test('should get server names', () => {
      const server1: RancherServerConfig = {
        name: 'server1',
        url: 'https://server1.example.com',
        token: 'token1'
      };
      const server2: RancherServerConfig = {
        name: 'server2',
        url: 'https://server2.example.com',
        token: 'token2'
      };

      configManager.addServer(server1);
      configManager.addServer(server2);

      const serverNames = configManager.getServerNames();
      expect(serverNames).toHaveLength(2);
      expect(serverNames).toContain('server1');
      expect(serverNames).toContain('server2');
    });

    test('should add server', () => {
      const serverConfig: RancherServerConfig = {
        name: 'new-server',
        url: 'https://new.example.com',
        token: 'new-token'
      };

      configManager.addServer(serverConfig);
      const retrieved = configManager.getServerConfig('new-server');

      expect(retrieved).toEqual(serverConfig);
    });

    test('should remove server', () => {
      const serverConfig: RancherServerConfig = {
        name: 'to-remove',
        url: 'https://remove.example.com',
        token: 'remove-token'
      };

      configManager.addServer(serverConfig);
      expect(configManager.getServerConfig('to-remove')).toBeDefined();

      const removed = configManager.removeServer('to-remove');
      expect(removed).toBe(true);
      expect(configManager.getServerConfig('to-remove')).toBeNull();
    });

    test('should return false when removing non-existent server', () => {
      const removed = configManager.removeServer('non-existent');
      expect(removed).toBe(false);
    });

    test('should update server configuration', () => {
      const serverConfig: RancherServerConfig = {
        name: 'to-update',
        url: 'https://update.example.com',
        token: 'old-token'
      };

      configManager.addServer(serverConfig);

      const updated = configManager.updateServer('to-update', {
        token: 'new-token',
        timeout: 60000
      });

      expect(updated).toBe(true);
      const retrieved = configManager.getServerConfig('to-update');
      expect(retrieved?.token).toBe('new-token');
      expect(retrieved?.timeout).toBe(60000);
      expect(retrieved?.url).toBe('https://update.example.com'); // Should preserve existing values
    });

    test('should return false when updating non-existent server', () => {
      const updated = configManager.updateServer('non-existent', {
        token: 'new-token'
      });
      expect(updated).toBe(false);
    });
  });

  describe('configuration getters', () => {
    test('should get log level', () => {
      expect(configManager.getLogLevel()).toBe('info');
    });

    test('should get cache timeout', () => {
      expect(configManager.getCacheTimeout()).toBe(300000);
    });

    test('should get max concurrent requests', () => {
      expect(configManager.getMaxConcurrentRequests()).toBe(10);
    });

    test('should get request timeout', () => {
      expect(configManager.getRequestTimeout()).toBe(30000);
    });

    test('should get enable file logging', () => {
      expect(configManager.getEnableFileLogging()).toBe(false);
    });

    test('should get log directory', () => {
      expect(configManager.getLogDirectory()).toBe('logs');
    });
  });

  describe('configuration validation', () => {
    test('should validate empty configuration', () => {
      const result = configManager.validateConfig();
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('No Rancher servers configured');
    });

    test('should validate valid configuration', () => {
      const serverConfig: RancherServerConfig = {
        name: 'valid-server',
        url: 'https://valid.example.com',
        token: 'valid-token'
      };

      configManager.addServer(serverConfig);
      const result = configManager.validateConfig();

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should validate server with missing URL', () => {
      const serverConfig: RancherServerConfig = {
        name: 'invalid-server',
        url: '',
        token: 'valid-token'
      };

      configManager.addServer(serverConfig);
      const result = configManager.validateConfig();

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Server invalid-server: missing URL');
    });

    test('should validate server with missing token and credentials', () => {
      const serverConfig: RancherServerConfig = {
        name: 'invalid-server',
        url: 'https://invalid.example.com',
        token: ''
      };

      configManager.addServer(serverConfig);
      const result = configManager.validateConfig();

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Server invalid-server: missing token or credentials');
    });

    test('should validate server with username/password but no token', () => {
      const serverConfig: RancherServerConfig = {
        name: 'valid-server',
        url: 'https://valid.example.com',
        token: '',
        username: 'user',
        password: 'pass'
      };

      configManager.addServer(serverConfig);
      const result = configManager.validateConfig();

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should validate multiple servers with errors', () => {
      const server1: RancherServerConfig = {
        name: 'server1',
        url: '',
        token: 'token1'
      };
      const server2: RancherServerConfig = {
        name: 'server2',
        url: 'https://server2.example.com',
        token: ''
      };

      configManager.addServer(server1);
      configManager.addServer(server2);
      const result = configManager.validateConfig();

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errors).toContain('Server server1: missing URL');
      expect(result.errors).toContain('Server server2: missing token or credentials');
    });
  });
});
