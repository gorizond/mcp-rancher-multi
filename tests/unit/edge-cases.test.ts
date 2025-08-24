import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { RancherClient } from '../../src/rancher-client.js';
import { resolveToken, loadConfigFromEnv, obfuscateConfig, saveStore, loadStore } from '../../src/utils.js';
import { RancherServerConfig } from '../../src/utils.js';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

// Mock fetch globally
global.fetch = vi.fn();

describe('Edge Cases and Boundary Conditions', () => {
  let tempFile: string;
  let mockFetch: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch = fetch as any;
    tempFile = path.join(os.tmpdir(), `edge-case-test-${Date.now()}.json`);
  });

  afterEach(() => {
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
    }
    vi.restoreAllMocks();
  });

  describe('RancherClient Edge Cases', () => {
    it('should handle very long URLs', () => {
      const longUrl = 'https://' + 'a'.repeat(1000) + '.com';
      const config: RancherServerConfig = {
        id: 'test',
        baseUrl: longUrl,
        token: 'test-token'
      };

      const client = new RancherClient(config);
      expect(client.baseUrl).toBe(longUrl);
    });

    it('should handle very long tokens', () => {
      const longToken = 'token-' + 'a'.repeat(1000);
      const config: RancherServerConfig = {
        id: 'test',
        baseUrl: 'https://test.com',
        token: longToken
      };

      const client = new RancherClient(config);
      expect(client.token).toBe(longToken);
    });

    it('should handle empty baseUrl', () => {
      const config: RancherServerConfig = {
        id: 'test',
        baseUrl: '',
        token: 'test-token'
      };

      const client = new RancherClient(config);
      expect(client.baseUrl).toBe('');
    });

    it('should handle baseUrl with multiple trailing slashes', () => {
      const config: RancherServerConfig = {
        id: 'test',
        baseUrl: 'https://test.com////',
        token: 'test-token'
      };

      const client = new RancherClient(config);
      // The code only removes one trailing slash, not multiple
      expect(client.baseUrl).toBe('https://test.com///');
    });

    it('should handle special characters in clusterId', async () => {
      const config: RancherServerConfig = {
        id: 'test',
        baseUrl: 'https://test.com',
        token: 'test-token'
      };

      const client = new RancherClient(config);
      const specialChars = ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')', ' ', '\t', '\n'];

      for (const char of specialChars) {
        const clusterId = `cluster${char}test`;
        const expectedEncoded = encodeURIComponent(clusterId);
        
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ data: [] })
        });

        await client.listNodes(clusterId);
        
        const lastCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
        expect(lastCall[0]).toContain(expectedEncoded);
      }
    });

    it('should handle very large response data', async () => {
      const largeData = {
        data: Array.from({ length: 10000 }, (_, i) => ({
          id: `cluster${i}`,
          name: `Cluster ${i}`,
          state: 'active'
        }))
      };

      const config: RancherServerConfig = {
        id: 'test',
        baseUrl: 'https://test.com',
        token: 'test-token'
      };

      const client = new RancherClient(config);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(largeData)
      });

      const result = await client.listClusters();
      expect(result).toHaveLength(10000);
      expect(result[0].id).toBe('cluster0');
      expect(result[9999].id).toBe('cluster9999');
    });

    it('should handle obfuscation with unicode tokens', () => {
      const unicodeToken = 'token-🎉';
      const config = {
        'server1': {
          id: 'server1',
          name: 'Test Server',
          baseUrl: 'https://test.local',
          token: unicodeToken
        }
      };

      const obfuscated = obfuscateConfig(config);
      // The obfuscation takes the last 4 UTF-16 code units
      expect(obfuscated.server1.token).toBe('***n-🎉');
    });

    it('should handle memory pressure with large configurations', () => {
      const largeConfig = {};
      
      // Create a large configuration object
      for (let i = 0; i < 10000; i++) {
        largeConfig[`server${i}`] = {
          id: `server${i}`,
          name: `Server ${i}`,
          baseUrl: `https://server${i}.com`,
          token: `token${i}`,
          description: 'A'.repeat(100)
        };
      }

      const obfuscated = obfuscateConfig(largeConfig);
      expect(Object.keys(obfuscated)).toHaveLength(10000);
      
      // Verify obfuscation worked - token0 becomes ken0 (last 4 chars)
      expect(obfuscated.server0.token).toBe('***ken0');
      expect(obfuscated.server9999.token).toBe('***9999');
    });
  });

  describe('Utils Edge Cases', () => {
    it('should handle very long environment variable names', () => {
      const longName = 'A'.repeat(1000);
      process.env[`RANCHER_SERVER_test_${longName}`] = 'test-value';
      process.env.RANCHER_SERVER_test_BASEURL = 'https://test.com';

      const result = loadConfigFromEnv();
      expect(result.test).toBeDefined();
      expect(result.test.baseUrl).toBe('https://test.com');

      delete process.env[`RANCHER_SERVER_test_${longName}`];
      delete process.env.RANCHER_SERVER_test_BASEURL;
    });

    it('should handle very large JSON in RANCHER_SERVERS', () => {
      const largeConfig = {};
      
      // Create 1000 servers directly in the config object
      for (let i = 0; i < 1000; i++) {
        largeConfig[`server${i}`] = {
          id: `server${i}`,
          name: `Server ${i}`,
          baseUrl: `https://server${i}.com`,
          token: `token${i}`
        };
      }

      process.env.RANCHER_SERVERS = JSON.stringify(largeConfig);
      const result = loadConfigFromEnv();
      expect(Object.keys(result)).toHaveLength(1000);

      delete process.env.RANCHER_SERVERS;
    });

    it('should handle malformed environment variable patterns', () => {
      const malformedPatterns = [
        '${ENV}',
        '${ENV:}',
        '${ENV:test',
        'ENV:test}',
        '${}',
        '${ENV:test:extra}',
        '${ENV:test}extra',
        '${ENV:test}${ENV:other}'
      ];

      for (const pattern of malformedPatterns) {
        const result = resolveToken(pattern);
        expect(result).toBe(pattern);
      }
    });

    it('should handle very large files', () => {
      const largeData = {
        servers: {}
      };
      
      // Create 5000 servers
      for (let i = 0; i < 5000; i++) {
        largeData.servers[`server${i}`] = {
          id: `server${i}`,
          name: `Server ${i}`,
          baseUrl: `https://server${i}.com`,
          token: `token${i}`,
          description: 'A'.repeat(1000) // Large description
        };
      }

      saveStore(largeData, tempFile);
      const result = loadStore(tempFile);
      expect(Object.keys(result.servers)).toHaveLength(5000);
    });

    it('should handle obfuscation with very long tokens', () => {
      const longToken = 'token-' + 'a'.repeat(1000);
      const config = {
        'server1': {
          id: 'server1',
          name: 'Test Server',
          baseUrl: 'https://test.local',
          token: longToken
        }
      };

      const obfuscated = obfuscateConfig(config);
      expect(obfuscated.server1.token).toBe('***' + longToken.slice(-4));
    });
  });

  describe('Network Edge Cases', () => {
    it('should handle very slow responses', async () => {
      const config: RancherServerConfig = {
        id: 'test',
        baseUrl: 'https://test.com',
        token: 'test-token'
      };

      const client = new RancherClient(config);

      // Simulate slow response
      mockFetch.mockImplementationOnce(() => 
        new Promise(resolve => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: () => Promise.resolve({ data: [] })
            });
          }, 100);
        })
      );

      const startTime = Date.now();
      await client.listClusters();
      const endTime = Date.now();

      expect(endTime - startTime).toBeGreaterThan(90);
    });

    it('should handle response with very large headers', async () => {
      const config: RancherServerConfig = {
        id: 'test',
        baseUrl: 'https://test.com',
        token: 'test-token'
      };

      const client = new RancherClient(config);

      const largeHeaders = new Map();
      for (let i = 0; i < 1000; i++) {
        largeHeaders.set(`header-${i}`, 'A'.repeat(100));
      }
      largeHeaders.set('content-type', 'application/json');

      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: largeHeaders,
        json: () => Promise.resolve({ items: [] })
      });

      const result = await client.listNamespaces('cluster1');
      expect(result).toEqual([]);
    });

    it('should handle response with malformed content-type', async () => {
      const config: RancherServerConfig = {
        id: 'test',
        baseUrl: 'https://test.com',
        token: 'test-token'
      };

      const client = new RancherClient(config);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        headers: new Map([['content-type', 'invalid/content-type']]),
        text: () => Promise.resolve('plain text response')
      });

      const result = await client.k8s('cluster1', '/api/v1/pods');
      expect(result).toBe('plain text response');
    });
  });

  describe('File System Edge Cases', () => {
    it('should handle very long file paths', () => {
      const longPath = path.join(os.tmpdir(), 'a'.repeat(100), 'b'.repeat(100), 'servers.json');
      const testData = { test: 'data' };

      saveStore(testData, longPath);
      const result = loadStore(longPath);
      expect(result).toEqual(testData);

      // Cleanup
      fs.unlinkSync(longPath);
      fs.rmdirSync(path.dirname(longPath));
      fs.rmdirSync(path.dirname(path.dirname(longPath)));
    });

    it('should handle files with very large content', () => {
      const largeContent = {
        data: 'A'.repeat(1000000) // 1MB of data
      };

      saveStore(largeContent, tempFile);
      const result = loadStore(tempFile);
      expect(result).toEqual(largeContent);
    });

    it('should handle concurrent file access', async () => {
      const testData = { test: 'data' };
      const promises = [];

      // Create multiple concurrent save operations
      for (let i = 0; i < 10; i++) {
        const filePath = path.join(os.tmpdir(), `concurrent-test-${i}-${Date.now()}.json`);
        promises.push(
          new Promise<void>((resolve) => {
            saveStore({ ...testData, index: i }, filePath);
            const result = loadStore(filePath);
            expect(result.index).toBe(i);
            fs.unlinkSync(filePath);
            resolve();
          })
        );
      }

      await Promise.all(promises);
    });
  });

  describe('Memory and Performance Edge Cases', () => {
    it('should handle rapid environment variable changes', () => {
      const results = [];

      for (let i = 0; i < 100; i++) {
        process.env.RANCHER_SERVER_test_BASEURL = `https://server${i}.com`;
        process.env.RANCHER_SERVER_test_TOKEN = `token${i}`;
        
        const result = loadConfigFromEnv();
        results.push(result.test.baseUrl);
      }

      expect(results[99]).toBe('https://server99.com');
      
      // Cleanup
      delete process.env.RANCHER_SERVER_test_BASEURL;
      delete process.env.RANCHER_SERVER_test_TOKEN;
    });
  });
});
