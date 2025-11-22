import { config } from 'dotenv';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export type RancherServerConfig = {
  id: string;                 // short id (e.g. "prod", "lab")
  name?: string;              // human friendly name
  baseUrl: string;            // https://rancher.example.com
  token: string;              // API token; supports ${ENV:NAME}
  insecureSkipTlsVerify?: boolean;
  caCertPemBase64?: string;   // optional custom CA (base64 PEM)
};

/**
 * Load environment variables from .env file
 * Supports multiple .env files in order of priority:
 * 1. .env.local (highest priority)
 * 2. .env
 */
export function loadEnvFiles(): void {
  const envFiles = ['.env.local', '.env'];
  const cwd = process.cwd();
  
  for (const envFile of envFiles) {
    const envPath = join(cwd, envFile);
    if (existsSync(envPath)) {
      console.error(`[mcp-rancher-multi] Loading environment from ${envFile}`);
      config({ path: envPath });
    }
  }
}

/**
 * Resolve token value, supporting ${ENV:NAME} syntax
 */
export function resolveToken(tok: string): string {
  const m = tok?.match(/^\$\{ENV:([A-Za-z_][A-Za-z0-9_]*)\}$/);
  if (m) return process.env[m[1]] || "";
  return tok;
}

/**
 * Obfuscate sensitive data like tokens for safe logging
 */
export function obfuscateConfig(config: Record<string, RancherServerConfig>): Record<string, any> {
  const obfuscated: Record<string, any> = {};
  
  for (const [id, serverConfig] of Object.entries(config)) {
    obfuscated[id] = {
      ...serverConfig,
      token: serverConfig.token ? '***' + serverConfig.token.slice(-4) : undefined
    };
  }
  
  return obfuscated;
}

/**
 * Remove Kubernetes metadata.managedFields recursively.
 */
export function stripMetadataManagedFields<T>(value: T): T {
  const seen = new WeakSet();

  const walk = (node: any) => {
    if (!node || typeof node !== 'object') return;
    if (seen.has(node)) return;
    seen.add(node);

    if (Array.isArray(node)) {
      for (const item of node) {
        walk(item);
      }
      return;
    }

    if (node.metadata && typeof node.metadata === 'object') {
      if ('managedFields' in node.metadata) {
        delete node.metadata.managedFields;
      }
      walk(node.metadata);
    }

    for (const key of Object.keys(node)) {
      if (key === 'metadata') continue;
      walk(node[key]);
    }
  };

  walk(value as any);
  return value;
}

/**
 * Remove specific keys recursively from any object/array tree.
 */
export function stripKeys<T>(value: T, keys: string[]): T {
  const keySet = new Set(keys.filter(Boolean));
  if (!keySet.size) return value;

  const seen = new WeakSet();

  const walk = (node: any) => {
    if (!node || typeof node !== 'object') return;
    if (seen.has(node)) return;
    seen.add(node);

    if (Array.isArray(node)) {
      for (const item of node) walk(item);
      return;
    }

    for (const key of Object.keys(node)) {
      if (keySet.has(key)) {
        delete node[key];
        continue;
      }
      walk(node[key]);
    }
  };

  walk(value as any);
  return value;
}

/**
 * Load Rancher server configuration from environment variables
 */
export function loadConfigFromEnv(): Record<string, RancherServerConfig> {
  const config: Record<string, RancherServerConfig> = {};
  
  // Look for RANCHER_SERVERS environment variable
  const serversEnv = process.env.RANCHER_SERVERS;
  if (serversEnv) {
    try {
      const servers = JSON.parse(serversEnv);
      for (const [id, serverConfig] of Object.entries(servers)) {
        config[id] = serverConfig as RancherServerConfig;
      }
    } catch (e) {
      console.warn("Cannot parse RANCHER_SERVERS JSON:", e);
    }
  }
  
  // Look for individual server configurations
  // Format: RANCHER_SERVER_<ID>_<PROPERTY>
  const envVars = Object.keys(process.env);
  const serverPattern = /^RANCHER_SERVER_([A-Za-z0-9_]+)_(.+)$/;
  
  for (const envVar of envVars) {
    const match = envVar.match(serverPattern);
    if (match) {
      const [, serverId, property] = match;
      const propertyLower = property.toLowerCase();
      
      if (!config[serverId]) {
        config[serverId] = { 
          id: serverId,
          baseUrl: '', // Will be set below
          token: '' // Will be set below
        };
      }
      
      const value = process.env[envVar];
      if (value !== undefined) {
        switch (propertyLower) {
          case 'name':
            config[serverId].name = value;
            break;
          case 'baseurl':
            config[serverId].baseUrl = value;
            break;
          case 'token':
            config[serverId].token = value;
            break;
          case 'insecureskiptlsverify':
            config[serverId].insecureSkipTlsVerify = value.toLowerCase() === 'true';
            break;
          case 'cacertpembase64':
            config[serverId].caCertPemBase64 = value;
            break;
        }
      }
    }
  }
  
  return config;
}

export function loadStore(file: string): Record<string, RancherServerConfig> {
  try {
    const fs = require('node:fs');
    if (!fs.existsSync(file)) return {};
    const raw = fs.readFileSync(file, "utf-8");
    const parsed = JSON.parse(raw);
    return parsed || {};
  } catch (e) {
    console.warn("Cannot read store:", e);
    return {};
  }
}

export function saveStore(data: Record<string, RancherServerConfig>, file: string) {
  const fs = require('node:fs');
  const path = require('node:path');
  
  // Create directory if it doesn't exist
  const dir = path.dirname(file);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}
