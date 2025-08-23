import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { resolveToken, loadStore, saveStore, RancherServerConfig } from '../../src/utils.js';
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
      const testDir = path.join(os.tmpdir(), 'test-dir');
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
  });
});
