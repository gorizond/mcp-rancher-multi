import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { loadEnvFiles, loadConfigFromEnv, resolveToken, obfuscateConfig } from '../../src/utils.js';
import { config } from 'dotenv';
import { existsSync } from 'fs';
import { join } from 'path';

// Mock dotenv and fs modules
vi.mock('dotenv');
vi.mock('fs');
vi.mock('path');

const mockConfig = vi.mocked(config);
const mockExistsSync = vi.mocked(existsSync);
const mockJoin = vi.mocked(join);

describe('Environment utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset process.env - clear all RANCHER_* variables
    const envKeys = Object.keys(process.env);
    for (const key of envKeys) {
      if (key.startsWith('RANCHER_')) {
        delete process.env[key];
      }
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('loadEnvFiles', () => {
    it('should load .env.local if it exists', () => {
      mockExistsSync.mockReturnValue(true);
      mockJoin.mockReturnValue('/test/.env.local');

      loadEnvFiles();

      expect(mockExistsSync).toHaveBeenCalledWith('/test/.env.local');
      expect(mockConfig).toHaveBeenCalledWith({ path: '/test/.env.local' });
    });

    it('should load .env if it exists', () => {
      mockExistsSync
        .mockReturnValueOnce(false) // .env.local doesn't exist
        .mockReturnValueOnce(true); // .env exists
      mockJoin
        .mockReturnValueOnce('/test/.env.local')
        .mockReturnValueOnce('/test/.env');

      loadEnvFiles();

      expect(mockExistsSync).toHaveBeenCalledWith('/test/.env');
      expect(mockConfig).toHaveBeenCalledWith({ path: '/test/.env' });
    });

    it('should not load any files if they do not exist', () => {
      mockExistsSync.mockReturnValue(false);
      mockJoin.mockReturnValue('/test/.env');

      loadEnvFiles();

      expect(mockConfig).not.toHaveBeenCalled();
    });

    it('should load both files if they both exist', () => {
      mockExistsSync.mockReturnValue(true);
      mockJoin
        .mockReturnValueOnce('/test/.env.local')
        .mockReturnValueOnce('/test/.env');

      loadEnvFiles();

      expect(mockConfig).toHaveBeenCalledTimes(2);
      expect(mockConfig).toHaveBeenCalledWith({ path: '/test/.env.local' });
      expect(mockConfig).toHaveBeenCalledWith({ path: '/test/.env' });
    });
  });

  describe('resolveToken', () => {
    it('should resolve ${ENV:VAR} syntax', () => {
      process.env.TEST_TOKEN = 'test_value';
      
      const result = resolveToken('${ENV:TEST_TOKEN}');
      
      expect(result).toBe('test_value');
    });

    it('should return original token if no ENV syntax', () => {
      const result = resolveToken('plain_token');
      
      expect(result).toBe('plain_token');
    });

    it('should return empty string if ENV variable not found', () => {
      const result = resolveToken('${ENV:NONEXISTENT}');
      
      expect(result).toBe('');
    });

    it('should handle null/undefined input', () => {
      expect(resolveToken(null as any)).toBe(null);
      expect(resolveToken(undefined as any)).toBe(undefined);
    });
  });

  describe('loadConfigFromEnv', () => {
    it('should load configuration from RANCHER_SERVERS JSON', () => {
      const serversConfig = {
        prod: {
          id: 'prod',
          name: 'Rancher PROD',
          baseUrl: 'https://rancher.prod.example.com',
          token: '${ENV:PROD_TOKEN}'
        }
      };
      process.env.RANCHER_SERVERS = JSON.stringify(serversConfig);
      process.env.PROD_TOKEN = 'actual_token';

      const result = loadConfigFromEnv();

      expect(result).toEqual({
        prod: {
          id: 'prod',
          name: 'Rancher PROD',
          baseUrl: 'https://rancher.prod.example.com',
          token: '${ENV:PROD_TOKEN}'
        }
      });
    });

    it('should load configuration from individual environment variables', () => {
      process.env.RANCHER_SERVER_prod_NAME = 'Rancher PROD';
      process.env.RANCHER_SERVER_prod_BASEURL = 'https://rancher.prod.example.com';
      process.env.RANCHER_SERVER_prod_TOKEN = '${ENV:PROD_TOKEN}';
      process.env.RANCHER_SERVER_prod_INSECURESKIPTLSVERIFY = 'true';
      process.env.PROD_TOKEN = 'actual_token';

      const result = loadConfigFromEnv();

      expect(result).toEqual({
        prod: {
          id: 'prod',
          name: 'Rancher PROD',
          baseUrl: 'https://rancher.prod.example.com',
          token: '${ENV:PROD_TOKEN}',
          insecureSkipTlsVerify: true
        }
      });
    });

    it('should handle both JSON and individual variables', () => {
      const serversConfig = {
        prod: {
          id: 'prod',
          name: 'Rancher PROD JSON',
          baseUrl: 'https://rancher.prod.example.com',
          token: 'json_token'
        }
      };
      process.env.RANCHER_SERVERS = JSON.stringify(serversConfig);
      process.env.RANCHER_SERVER_lab_NAME = 'Rancher LAB';
      process.env.RANCHER_SERVER_lab_BASEURL = 'https://rancher.lab.example.com';
      process.env.RANCHER_SERVER_lab_TOKEN = 'lab_token';

      const result = loadConfigFromEnv();

      expect(result).toEqual({
        prod: {
          id: 'prod',
          name: 'Rancher PROD JSON',
          baseUrl: 'https://rancher.prod.example.com',
          token: 'json_token'
        },
        lab: {
          id: 'lab',
          name: 'Rancher LAB',
          baseUrl: 'https://rancher.lab.example.com',
          token: 'lab_token'
        }
      });
    });

    it('should handle invalid JSON gracefully', () => {
      // Clear all environment variables first
      delete process.env.RANCHER_SERVERS;
      delete process.env.RANCHER_SERVER_prod_NAME;
      delete process.env.RANCHER_SERVER_prod_BASEURL;
      delete process.env.RANCHER_SERVER_prod_TOKEN;
      delete process.env.RANCHER_SERVER_lab_NAME;
      delete process.env.RANCHER_SERVER_lab_BASEURL;
      delete process.env.RANCHER_SERVER_lab_TOKEN;
      
      process.env.RANCHER_SERVERS = 'invalid json';

      const result = loadConfigFromEnv();

      expect(result).toEqual({});
    });

    it('should handle case-insensitive property names', () => {
      process.env.RANCHER_SERVER_prod_NAME = 'Rancher PROD';
      process.env.RANCHER_SERVER_prod_baseurl = 'https://rancher.prod.example.com';
      process.env.RANCHER_SERVER_prod_TOKEN = 'token';
      process.env.RANCHER_SERVER_prod_insecureskiptlsverify = 'false';

      const result = loadConfigFromEnv();

      expect(result.prod).toEqual({
        id: 'prod',
        name: 'Rancher PROD',
        baseUrl: 'https://rancher.prod.example.com',
        token: 'token',
        insecureSkipTlsVerify: false
      });
    });

    describe('obfuscateConfig', () => {
      it('should obfuscate tokens in configuration', () => {
        const config = {
          prod: {
            id: 'prod',
            name: 'Rancher PROD',
            baseUrl: 'https://rancher.prod.example.com',
            token: 'secret_token_12345'
          },
          lab: {
            id: 'lab',
            name: 'Rancher LAB',
            baseUrl: 'https://rancher.lab.example.com',
            token: 'another_secret_67890'
          }
        };

        const result = obfuscateConfig(config);

        expect(result.prod.token).toBe('***2345');
        expect(result.lab.token).toBe('***7890');
        expect(result.prod.name).toBe('Rancher PROD');
        expect(result.prod.baseUrl).toBe('https://rancher.prod.example.com');
      });

      it('should handle empty or undefined tokens', () => {
        const config = {
          prod: {
            id: 'prod',
            name: 'Rancher PROD',
            baseUrl: 'https://rancher.prod.example.com',
            token: ''
          },
          lab: {
            id: 'lab',
            name: 'Rancher LAB',
            baseUrl: 'https://rancher.lab.example.com',
            token: undefined
          }
        };

        const result = obfuscateConfig(config);

        expect(result.prod.token).toBeUndefined();
        expect(result.lab.token).toBeUndefined();
      });

      it('should handle short tokens', () => {
        const config = {
          prod: {
            id: 'prod',
            name: 'Rancher PROD',
            baseUrl: 'https://rancher.prod.example.com',
            token: '123'
          }
        };

        const result = obfuscateConfig(config);

        expect(result.prod.token).toBe('***123');
      });
    });
  });
});
