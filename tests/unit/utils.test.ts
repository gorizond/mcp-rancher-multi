import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { resolveToken, loadStore, saveStore, obfuscateConfig, loadConfigFromEnv, RancherServerConfig } from '../../src/utils.js';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

describe('Utils', () => {
  let tempFile: string;

  beforeEach(() => {
    tempFile = path.join(os.tmpdir(), `test-servers-${Date.now()}.json`);
  });

  afterEach(() => {
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
    }
  });

  describe('resolveToken', () => {
    it('should return token as-is when no environment variable pattern', () => {
      expect(resolveToken('simple-token')).toBe('simple-token');
      expect(resolveToken('')).toBe('');
    });

    it('should resolve environment variable pattern', () => {
      process.env.TEST_TOKEN = 'env-token-value';
      expect(resolveToken('${ENV:TEST_TOKEN}')).toBe('env-token-value');
    });

    it('should return empty string when environment variable not found', () => {
      expect(resolveToken('${ENV:NONEXISTENT_TOKEN}')).toBe('');
    });

    it('should handle invalid environment variable names', () => {
      expect(resolveToken('${ENV:123invalid}')).toBe('${ENV:123invalid}');
      expect(resolveToken('${ENV:}')).toBe('${ENV:}');
    });

    it('should handle malformed environment variable pattern', () => {
      expect(resolveToken('${ENV}')).toBe('${ENV}');
      expect(resolveToken('${ENV:}')).toBe('${ENV:}');
      expect(resolveToken('${ENV:test')).toBe('${ENV:test');
      expect(resolveToken('ENV:test}')).toBe('ENV:test}');
    });

    it('should handle special characters in environment variable names', () => {
      process.env.TEST_TOKEN_SPECIAL = 'special-value';
      expect(resolveToken('${ENV:TEST_TOKEN_SPECIAL}')).toBe('special-value');
    });
  });

  describe('obfuscateConfig', () => {
    it('should obfuscate tokens in config', () => {
      const config = {
        'server1': {
          id: 'server1',
          name: 'Test Server 1',
          baseUrl: 'https://test1.local',
          token: 'token-abc123def456'
        },
        'server2': {
          id: 'server2',
          name: 'Test Server 2',
          baseUrl: 'https://test2.local',
          token: 'token-xyz789'
        }
      };

      const obfuscated = obfuscateConfig(config);

      expect(obfuscated.server1.token).toBe('***f456');
      expect(obfuscated.server2.token).toBe('***z789');
      expect(obfuscated.server1.name).toBe('Test Server 1');
      expect(obfuscated.server2.baseUrl).toBe('https://test2.local');
    });

    it('should handle empty token', () => {
      const config = {
        'server1': {
          id: 'server1',
          name: 'Test Server',
          baseUrl: 'https://test.local',
          token: ''
        }
      };

      const obfuscated = obfuscateConfig(config);
      expect(obfuscated.server1.token).toBeUndefined();
    });

    it('should handle undefined token', () => {
      const config = {
        'server1': {
          id: 'server1',
          name: 'Test Server',
          baseUrl: 'https://test.local',
          token: undefined
        }
      };

      const obfuscated = obfuscateConfig(config);
      expect(obfuscated.server1.token).toBeUndefined();
    });

    it('should handle null token', () => {
      const config = {
        'server1': {
          id: 'server1',
          name: 'Test Server',
          baseUrl: 'https://test.local',
          token: null as any
        }
      };

      const obfuscated = obfuscateConfig(config);
      expect(obfuscated.server1.token).toBeUndefined();
    });

    it('should handle short token', () => {
      const config = {
        'server1': {
          id: 'server1',
          name: 'Test Server',
          baseUrl: 'https://test.local',
          token: 'abc'
        }
      };

      const obfuscated = obfuscateConfig(config);
      expect(obfuscated.server1.token).toBe('***abc');
    });

    it('should handle empty config object', () => {
      const config = {};
      const obfuscated = obfuscateConfig(config);
      expect(obfuscated).toEqual({});
    });

    it('should handle token with exactly 4 characters', () => {
      const config = {
        'server1': {
          id: 'server1',
          name: 'Test Server',
          baseUrl: 'https://test.local',
          token: 'abcd'
        }
      };

      const obfuscated = obfuscateConfig(config);
      expect(obfuscated.server1.token).toBe('***abcd');
    });

    it('should handle token with less than 4 characters', () => {
      const config = {
        'server1': {
          id: 'server1',
          name: 'Test Server',
          baseUrl: 'https://test.local',
          token: 'abc'
        }
      };

      const obfuscated = obfuscateConfig(config);
      expect(obfuscated.server1.token).toBe('***abc');
    });
  });

  describe('loadConfigFromEnv', () => {
    beforeEach(() => {
      // Clear environment variables before each test
      delete process.env.RANCHER_SERVERS;
      delete process.env.RANCHER_SERVER_test_BASEURL;
      delete process.env.RANCHER_SERVER_test_TOKEN;
      delete process.env.RANCHER_SERVER_test_NAME;
      delete process.env.RANCHER_SERVER_test_INSECURESKIPTLSVERIFY;
      delete process.env.RANCHER_SERVER_test_CACERTPEMBASE64;
    });

    it('should load configuration from RANCHER_SERVERS environment variable', () => {
      const serversConfig = {
        'server1': {
          id: 'server1',
          name: 'Test Server 1',
          baseUrl: 'https://test1.local',
          token: 'token1'
        },
        'server2': {
          id: 'server2',
          name: 'Test Server 2',
          baseUrl: 'https://test2.local',
          token: 'token2'
        }
      };

      process.env.RANCHER_SERVERS = JSON.stringify(serversConfig);
      const result = loadConfigFromEnv();

      expect(result).toEqual(serversConfig);
    });

    it('should load configuration from individual environment variables', () => {
      process.env.RANCHER_SERVER_test_BASEURL = 'https://test.local';
      process.env.RANCHER_SERVER_test_TOKEN = 'test-token';
      process.env.RANCHER_SERVER_test_NAME = 'Test Server';
      process.env.RANCHER_SERVER_test_INSECURESKIPTLSVERIFY = 'true';
      process.env.RANCHER_SERVER_test_CACERTPEMBASE64 = 'base64-cert';

      const result = loadConfigFromEnv();

      expect(result.test).toEqual({
        id: 'test',
        baseUrl: 'https://test.local',
        token: 'test-token',
        name: 'Test Server',
        insecureSkipTlsVerify: true,
        caCertPemBase64: 'base64-cert'
      });
    });

    it('should handle case-insensitive property names', () => {
      process.env.RANCHER_SERVER_test_BASEURL = 'https://test.local';
      process.env.RANCHER_SERVER_test_TOKEN = 'test-token';
      process.env.RANCHER_SERVER_test_NAME = 'Test Server';
      process.env.RANCHER_SERVER_test_INSECURESKIPTLSVERIFY = 'false';
      process.env.RANCHER_SERVER_test_CACERTPEMBASE64 = 'base64-cert';

      const result = loadConfigFromEnv();

      expect(result.test.insecureSkipTlsVerify).toBe(false);
    });

    it('should handle boolean values for insecureSkipTlsVerify', () => {
      process.env.RANCHER_SERVER_test_INSECURESKIPTLSVERIFY = 'true';
      const result1 = loadConfigFromEnv();
      expect(result1.test.insecureSkipTlsVerify).toBe(true);

      delete process.env.RANCHER_SERVER_test_INSECURESKIPTLSVERIFY;
      process.env.RANCHER_SERVER_test_INSECURESKIPTLSVERIFY = 'false';
      const result2 = loadConfigFromEnv();
      expect(result2.test.insecureSkipTlsVerify).toBe(false);

      delete process.env.RANCHER_SERVER_test_INSECURESKIPTLSVERIFY;
      process.env.RANCHER_SERVER_test_INSECURESKIPTLSVERIFY = 'TRUE';
      const result3 = loadConfigFromEnv();
      expect(result3.test.insecureSkipTlsVerify).toBe(true);
    });

    it('should handle invalid JSON in RANCHER_SERVERS', () => {
      process.env.RANCHER_SERVERS = 'invalid json';
      const result = loadConfigFromEnv();
      expect(result).toEqual({});
    });

    it('should handle empty RANCHER_SERVERS', () => {
      process.env.RANCHER_SERVERS = '';
      const result = loadConfigFromEnv();
      expect(result).toEqual({});
    });

    it('should handle undefined environment variable values', () => {
      // Set environment variables to undefined by deleting them
      delete process.env.RANCHER_SERVER_test_BASEURL;
      delete process.env.RANCHER_SERVER_test_TOKEN;

      const result = loadConfigFromEnv();
      // When no environment variables are set, no config should be created
      expect(result.test).toBeUndefined();
    });

    it('should handle server IDs with underscores', () => {
      process.env.RANCHER_SERVER_test_server_BASEURL = 'https://test.local';
      process.env.RANCHER_SERVER_test_server_TOKEN = 'test-token';

      const result = loadConfigFromEnv();
      expect(result['test_server']).toBeDefined();
      expect(result['test_server'].baseUrl).toBe('https://test.local');
      expect(result['test_server'].token).toBe('test-token');
    });

    it('should handle unknown property names', () => {
      process.env.RANCHER_SERVER_test_UNKNOWN = 'unknown-value';
      process.env.RANCHER_SERVER_test_BASEURL = 'https://test.local';

      const result = loadConfigFromEnv();
      expect(result.test.baseUrl).toBe('https://test.local');
      // Unknown properties should be ignored
      expect(result.test).not.toHaveProperty('unknown');
    });
  });

  describe('loadStore', () => {
    it('should return empty object for non-existent file', () => {
      const result = loadStore('/non/existent/file.json');
      expect(result).toEqual({});
    });

    it('should load valid JSON file', () => {
      const testData = {
        'test-server': {
          id: 'test-server',
          name: 'Test Server',
          baseUrl: 'https://test.local',
          token: 'test-token'
        }
      };
      
      fs.writeFileSync(tempFile, JSON.stringify(testData));
      const result = loadStore(tempFile);
      expect(result).toEqual(testData);
    });

    it('should handle invalid JSON file', () => {
      fs.writeFileSync(tempFile, 'invalid json content');
      const result = loadStore(tempFile);
      expect(result).toEqual({});
    });

    it('should handle empty file', () => {
      fs.writeFileSync(tempFile, '');
      const result = loadStore(tempFile);
      expect(result).toEqual({});
    });

    it('should handle null JSON content', () => {
      fs.writeFileSync(tempFile, 'null');
      const result = loadStore(tempFile);
      expect(result).toEqual({});
    });

    it('should handle JSON with null value', () => {
      fs.writeFileSync(tempFile, JSON.stringify(null));
      const result = loadStore(tempFile);
      expect(result).toEqual({});
    });

    it('should handle file read errors', () => {
      // Mock fs to throw an error
      const originalRequire = require;
      const mockFs = {
        existsSync: () => true,
        readFileSync: () => { throw new Error('Read error'); }
      };
      
      vi.doMock('node:fs', () => mockFs);
      
      const result = loadStore(tempFile);
      expect(result).toEqual({});
      
      vi.doMock('node:fs', () => originalRequire('node:fs'));
    });

    it('should handle file that does not exist', () => {
      const result = loadStore('/path/to/nonexistent/file.json');
      expect(result).toEqual({});
    });
  });

  describe('saveStore', () => {
    it('should save data to file', () => {
      const testData: Record<string, RancherServerConfig> = {
        'test-server': {
          id: 'test-server',
          name: 'Test Server',
          baseUrl: 'https://test.local',
          token: 'test-token'
        }
      };

      saveStore(testData, tempFile);
      
      expect(fs.existsSync(tempFile)).toBe(true);
      const savedData = JSON.parse(fs.readFileSync(tempFile, 'utf-8'));
      expect(savedData).toEqual(testData);
    });

    it('should create directory if it does not exist', () => {
      const testDir = path.join(os.tmpdir(), `test-dir-${Date.now()}`);
      const testFile = path.join(testDir, 'servers.json');
      
      const testData: Record<string, RancherServerConfig> = {
        'test-server': {
          id: 'test-server',
          baseUrl: 'https://test.local',
          token: 'test-token'
        }
      };

      saveStore(testData, testFile);
      
      expect(fs.existsSync(testFile)).toBe(true);
      const savedData = JSON.parse(fs.readFileSync(testFile, 'utf-8'));
      expect(savedData).toEqual(testData);
      
      // Cleanup
      fs.unlinkSync(testFile);
      fs.rmdirSync(testDir);
    });

    it('should handle nested directory creation', () => {
      const testDir = path.join(os.tmpdir(), `test-dir-${Date.now()}`, 'nested', 'deep');
      const testFile = path.join(testDir, 'servers.json');
      
      const testData: Record<string, RancherServerConfig> = {
        'test-server': {
          id: 'test-server',
          baseUrl: 'https://test.local',
          token: 'test-token'
        }
      };

      saveStore(testData, testFile);
      
      expect(fs.existsSync(testFile)).toBe(true);
      const savedData = JSON.parse(fs.readFileSync(testFile, 'utf-8'));
      expect(savedData).toEqual(testData);
      
      // Cleanup - remove files and directories in reverse order
      fs.unlinkSync(testFile);
      fs.rmdirSync(testDir);
      fs.rmdirSync(path.dirname(testDir));
      fs.rmdirSync(path.dirname(path.dirname(testDir)));
    });

    it('should format JSON with proper indentation', () => {
      const testData: Record<string, RancherServerConfig> = {
        'test-server': {
          id: 'test-server',
          name: 'Test Server',
          baseUrl: 'https://test.local',
          token: 'test-token'
        }
      };

      saveStore(testData, tempFile);
      
      const savedContent = fs.readFileSync(tempFile, 'utf-8');
      const lines = savedContent.split('\n');
      
      // Should have proper indentation (2 spaces)
      expect(lines[1]).toMatch(/^\s{2}/);
      expect(lines[2]).toMatch(/^\s{4}/);
    });

    it('should handle empty data object', () => {
      const testData: Record<string, RancherServerConfig> = {};
      saveStore(testData, tempFile);
      
      expect(fs.existsSync(tempFile)).toBe(true);
      const savedData = JSON.parse(fs.readFileSync(tempFile, 'utf-8'));
      expect(savedData).toEqual({});
    });

    it('should handle complex nested data', () => {
      const testData: Record<string, RancherServerConfig> = {
        'server1': {
          id: 'server1',
          name: 'Server 1',
          baseUrl: 'https://server1.local',
          token: 'token1',
          insecureSkipTlsVerify: true,
          caCertPemBase64: 'cert1'
        },
        'server2': {
          id: 'server2',
          name: 'Server 2',
          baseUrl: 'https://server2.local',
          token: 'token2',
          insecureSkipTlsVerify: false
        }
      };

      saveStore(testData, tempFile);
      
      const savedData = JSON.parse(fs.readFileSync(tempFile, 'utf-8'));
      expect(savedData).toEqual(testData);
    });
  });
});
