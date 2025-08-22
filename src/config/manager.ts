import dotenv from 'dotenv';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export interface RancherServerConfig {
  name: string;
  url: string;
  token: string;
  username?: string;
  password?: string;
  insecure?: boolean;
  timeout?: number;
  retries?: number;
}

export interface GlobalConfig {
  logLevel: string;
  defaultServer: string;
  servers: Map<string, RancherServerConfig>;
  cacheTimeout: number;
  maxConcurrentRequests: number;
  requestTimeout: number;
  enableFileLogging: boolean;
  logDirectory: string;
}

export class ConfigManager {
  private config!: GlobalConfig;
  private configPath: string;

  constructor() {
    this.configPath = join(process.cwd(), '.env');
    this.loadConfig();
  }

  private loadConfig(): void {
    // Load environment variables
    if (existsSync(this.configPath)) {
      dotenv.config({ path: this.configPath });
    }

    // Initialize default configuration
    this.config = {
      logLevel: process.env.LOG_LEVEL || 'info',
      defaultServer: process.env.DEFAULT_RANCHER_SERVER || 'default',
      servers: new Map(),
      cacheTimeout: parseInt(process.env.CACHE_TIMEOUT || '300000'), // 5 minutes
      maxConcurrentRequests: parseInt(process.env.MAX_CONCURRENT_REQUESTS || '10'),
      requestTimeout: parseInt(process.env.REQUEST_TIMEOUT || '30000'), // 30 seconds
      enableFileLogging: process.env.ENABLE_FILE_LOGGING === 'true', // Default to false
      logDirectory: process.env.LOG_DIRECTORY || 'logs',
    };

    // Load server configurations
    this.loadServerConfigs();
  }

  private loadServerConfigs(): void {
    // Main server
    if (process.env.RANCHER_URL && process.env.RANCHER_TOKEN) {
      const serverName = process.env.RANCHER_NAME || 'default';
      this.config.servers.set(serverName, {
        name: serverName,
        url: process.env.RANCHER_URL,
        token: process.env.RANCHER_TOKEN,
        username: process.env.RANCHER_USERNAME,
        password: process.env.RANCHER_PASSWORD,
        insecure: process.env.RANCHER_INSECURE === 'true',
        timeout: parseInt(process.env.RANCHER_TIMEOUT || '30000'),
        retries: parseInt(process.env.RANCHER_RETRIES || '3'),
      });
    }

    // Additional servers (up to 10)
    for (let i = 2; i <= 10; i++) {
      const urlKey = `RANCHER_SERVER_${i}_URL`;
      const tokenKey = `RANCHER_SERVER_${i}_TOKEN`;
      const nameKey = `RANCHER_SERVER_${i}_NAME`;

      if (process.env[urlKey] && process.env[tokenKey]) {
        const serverName = process.env[nameKey] || `server-${i}`;
        this.config.servers.set(serverName, {
          name: serverName,
          url: process.env[urlKey]!,
          token: process.env[tokenKey]!,
          username: process.env[`RANCHER_SERVER_${i}_USERNAME`],
          password: process.env[`RANCHER_SERVER_${i}_PASSWORD`],
          insecure: process.env[`RANCHER_SERVER_${i}_INSECURE`] === 'true',
          timeout: parseInt(process.env[`RANCHER_SERVER_${i}_TIMEOUT`] || '30000'),
          retries: parseInt(process.env[`RANCHER_SERVER_${i}_RETRIES`] || '3'),
        });
      }
    }

    // Load configuration from config.json if it exists
    this.loadConfigFile();
  }

  private loadConfigFile(): void {
    const configFilePath = join(process.cwd(), 'config.json');
    if (existsSync(configFilePath)) {
      try {
        const configData = JSON.parse(readFileSync(configFilePath, 'utf8'));
        
        // Update global settings
        if (configData.logLevel) this.config.logLevel = configData.logLevel;
        if (configData.defaultServer) this.config.defaultServer = configData.defaultServer;
        if (configData.cacheTimeout) this.config.cacheTimeout = configData.cacheTimeout;
        if (configData.maxConcurrentRequests) this.config.maxConcurrentRequests = configData.maxConcurrentRequests;
        if (configData.requestTimeout) this.config.requestTimeout = configData.requestTimeout;

        // Add servers from file
        if (configData.servers && Array.isArray(configData.servers)) {
          for (const serverConfig of configData.servers) {
            if (serverConfig.name && serverConfig.url && serverConfig.token) {
              this.config.servers.set(serverConfig.name, {
                name: serverConfig.name,
                url: serverConfig.url,
                token: serverConfig.token,
                username: serverConfig.username,
                password: serverConfig.password,
                insecure: serverConfig.insecure || false,
                timeout: serverConfig.timeout || 30000,
                retries: serverConfig.retries || 3,
              });
            }
          }
        }
      } catch (error) {
        console.warn('Error loading config.json:', error);
      }
    }
  }

  public getConfig(): GlobalConfig {
    return this.config;
  }

  public getServerConfig(serverName?: string): RancherServerConfig | null {
    const name = serverName || this.config.defaultServer;
    return this.config.servers.get(name) || null;
  }

  public getAllServers(): RancherServerConfig[] {
    return Array.from(this.config.servers.values());
  }

  public getServerNames(): string[] {
    return Array.from(this.config.servers.keys());
  }

  public addServer(config: RancherServerConfig): void {
    this.config.servers.set(config.name, config);
  }

  public removeServer(serverName: string): boolean {
    return this.config.servers.delete(serverName);
  }

  public updateServer(serverName: string, config: Partial<RancherServerConfig>): boolean {
    const existing = this.config.servers.get(serverName);
    if (!existing) return false;

    this.config.servers.set(serverName, { ...existing, ...config });
    return true;
  }

  public getLogLevel(): string {
    return this.config.logLevel;
  }

  public getCacheTimeout(): number {
    return this.config.cacheTimeout;
  }

  public getMaxConcurrentRequests(): number {
    return this.config.maxConcurrentRequests;
  }

  public getRequestTimeout(): number {
    return this.config.requestTimeout;
  }

  public getEnableFileLogging(): boolean {
    return this.config.enableFileLogging;
  }

  public getLogDirectory(): string {
    return this.config.logDirectory;
  }

  public validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (this.config.servers.size === 0) {
      errors.push('No Rancher servers configured');
    }

    for (const [name, server] of this.config.servers) {
      if (!server.url) {
        errors.push(`Server ${name}: missing URL`);
      }
      if (!server.token && (!server.username || !server.password)) {
        errors.push(`Server ${name}: missing token or credentials`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
