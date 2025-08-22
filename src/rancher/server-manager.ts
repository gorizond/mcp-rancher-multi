import { RancherManager } from './manager.js';
import { RancherServerConfig } from '../config/manager.js';
import { Logger } from '../utils/logger.js';

export class ServerManager {
  private rancherManager: RancherManager;
  private logger: Logger;

  constructor(rancherManager: RancherManager) {
    this.rancherManager = rancherManager;
    this.logger = rancherManager.getLogger();
  }

  // Get list of all servers
  public getServerNames(): string[] {
    return this.rancherManager.getConfigManager().getServerNames();
  }

  // Get server configuration
  public getServerConfig(serverName: string): RancherServerConfig | null {
    return this.rancherManager.getConfigManager().getServerConfig(serverName);
  }

  // Get server status
  public async getServerStatus(serverName?: string): Promise<any> {
    if (serverName) {
      const connection = this.rancherManager.getConnection(serverName);
      if (!connection) {
        return { error: `Server ${serverName} not found` };
      }

      try {
        const serverStatus = await connection.client.getServerStatus();
        return {
          name: serverName,
          isConnected: connection.isConnected,
          lastPing: connection.lastPing,
          status: serverStatus
        };
      } catch (error) {
        return {
          name: serverName,
          isConnected: false,
          error: (error as Error).message,
          lastPing: connection.lastPing
        };
      }
    } else {
      return await this.rancherManager.getServerStatus();
    }
  }

  // Check server availability
  public async pingServer(serverName: string): Promise<boolean> {
    return await this.rancherManager.pingServer(serverName);
  }

  // Check availability of all servers
  public async pingAllServers(): Promise<Map<string, boolean>> {
    return await this.rancherManager.pingAllServers();
  }

  // Connect to server
  public async connectToServer(serverConfig: RancherServerConfig): Promise<any> {
    try {
      const connection = await this.rancherManager.connectToServer(serverConfig);
      return {
        success: true,
        serverName: connection.name,
        message: `Successfully connected to server ${connection.name}`
      };
          } catch (error) {
        return {
          success: false,
          serverName: serverConfig.name,
          error: (error as Error).message
        };
      }
  }

  // Disconnect from server
  public async disconnectFromServer(serverName: string): Promise<any> {
    try {
      await this.rancherManager.disconnectFromServer(serverName);
      return {
        success: true,
        serverName,
        message: `Successfully disconnected from server ${serverName}`
      };
    } catch (error) {
      return {
        success: false,
        serverName,
        error: (error as Error).message
      };
    }
  }

  // Add server to configuration
  public addServer(serverConfig: RancherServerConfig): boolean {
    try {
      this.rancherManager.getConfigManager().addServer(serverConfig);
      this.logger.info(`Server ${serverConfig.name} added to configuration`);
      return true;
    } catch (error) {
      this.logger.error(`Error adding server ${serverConfig.name}:`, error);
      return false;
    }
  }

  // Remove server from configuration
  public removeServer(serverName: string): boolean {
    try {
      // First disconnect from server
      const connection = this.rancherManager.getConnection(serverName);
      if (connection && connection.isConnected) {
        this.rancherManager.disconnectFromServer(serverName);
      }

      // Remove from configuration
      const removed = this.rancherManager.getConfigManager().removeServer(serverName);
      if (removed) {
        this.logger.info(`Server ${serverName} removed from configuration`);
      }
      return removed;
    } catch (error) {
      this.logger.error(`Error removing server ${serverName}:`, error);
      return false;
    }
  }

  // Update server configuration
  public updateServer(serverName: string, config: Partial<RancherServerConfig>): boolean {
    try {
      const updated = this.rancherManager.getConfigManager().updateServer(serverName, config);
      if (updated) {
        this.logger.info(`Server ${serverName} configuration updated`);
      }
      return updated;
    } catch (error) {
      this.logger.error(`Error updating server ${serverName}:`, error);
      return false;
    }
  }

  // Set default server
  public setDefaultServer(serverName: string): boolean {
    try {
      const configManager = this.rancherManager.getConfigManager();
      const config = configManager.getConfig();
      config.defaultServer = serverName;
      this.logger.info(`Server ${serverName} set as default server`);
      return true;
    } catch (error) {
      this.logger.error(`Error setting default server ${serverName}:`, error);
      return false;
    }
  }

  // Get connected servers
  public getConnectedServers(): string[] {
    return this.rancherManager.getConnectedServers();
  }

  // Get server information
  public async getServerInfo(serverName: string): Promise<any> {
    const connection = this.rancherManager.getConnection(serverName);
    if (!connection) {
      return { error: `Server ${serverName} not found` };
    }

    try {
      const serverStatus = await connection.client.getServerStatus();
      return {
        name: serverName,
        config: connection.config,
        isConnected: connection.isConnected,
        lastPing: connection.lastPing,
        status: serverStatus
      };
    } catch (error) {
      return {
        name: serverName,
        config: connection.config,
        isConnected: false,
        error: (error as Error).message,
        lastPing: connection.lastPing
      };
    }
  }

  // Validate server configuration
  public validateServerConfig(serverName?: string): any {
    if (serverName) {
      const config = this.getServerConfig(serverName);
      if (!config) {
        return { valid: false, errors: [`Server ${serverName} not found`] };
      }

      const errors: string[] = [];
      if (!config.url) errors.push('Missing URL');
      if (!config.token && (!config.username || !config.password)) {
        errors.push('Missing token or credentials');
      }

      return {
        valid: errors.length === 0,
        errors,
        serverName
      };
    } else {
      return this.rancherManager.getConfigManager().validateConfig();
    }
  }

  // Test server connection
  public async testServerConnection(serverName: string): Promise<any> {
    const connection = this.rancherManager.getConnection(serverName);
    if (!connection) {
      return { success: false, error: `Server ${serverName} not found` };
    }

    try {
      const isAlive = await this.pingServer(serverName);
      const serverStatus = await connection.client.getServerStatus();
      
      return {
        success: true,
        isConnected: isAlive,
        status: serverStatus,
        responseTime: new Date().getTime() - connection.lastPing!.getTime()
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  // Get server metrics
  public async getServerMetrics(serverName: string): Promise<any> {
    const connection = this.rancherManager.getConnection(serverName);
    if (!connection) {
      return { error: `Server ${serverName} not found` };
    }

    try {
      // Here you can add collection of various metrics
      const serverStatus = await connection.client.getServerStatus();
      const isAlive = await this.pingServer(serverName);
      
      return {
        name: serverName,
        isConnected: isAlive,
        lastPing: connection.lastPing,
        uptime: serverStatus.uptime || 'unknown',
        version: serverStatus.version || 'unknown',
        resources: serverStatus.resources || {},
        performance: {
          responseTime: new Date().getTime() - connection.lastPing!.getTime()
        }
      };
    } catch (error) {
      return {
        name: serverName,
        error: (error as Error).message
      };
    }
  }

  // Get server logs
  public async getServerLogs(serverName: string, options?: any): Promise<any> {
    const connection = this.rancherManager.getConnection(serverName);
    if (!connection) {
      return { error: `Server ${serverName} not found` };
    }

    try {
      // Here you can add getting server logs
      return {
        name: serverName,
        logs: `Server ${serverName} logs (function in development)`,
        options
      };
    } catch (error) {
      return {
        name: serverName,
        error: (error as Error).message
      };
    }
  }

  // Restart server connection
  public async restartServerConnection(serverName: string): Promise<any> {
    try {
      // Disconnect from server
      await this.disconnectFromServer(serverName);
      
      // Get configuration
      const config = this.getServerConfig(serverName);
      if (!config) {
        return { success: false, error: `Server ${serverName} not found in configuration` };
      }

      // Reconnect
      const result = await this.connectToServer(config);
      return result;
    } catch (error) {
      return {
        success: false,
        serverName,
        error: (error as Error).message
      };
    }
  }

  // Get server health status
  public async getServerHealth(serverName: string): Promise<any> {
    const connection = this.rancherManager.getConnection(serverName);
    if (!connection) {
      return { health: 'unknown', error: `Server ${serverName} not found` };
    }

    try {
      const isAlive = await this.pingServer(serverName);
      const serverStatus = await connection.client.getServerStatus();
      
      let health = 'unknown';
      if (isAlive && serverStatus.status === 'healthy') {
        health = 'healthy';
      } else if (isAlive) {
        health = 'degraded';
      } else {
        health = 'unhealthy';
      }

      return {
        name: serverName,
        health,
        isConnected: isAlive,
        lastPing: connection.lastPing,
        details: serverStatus
      };
    } catch (error) {
      return {
        name: serverName,
        health: 'unhealthy',
        error: (error as Error).message
      };
    }
  }

  // Export server configuration
  public exportServerConfig(format: string = 'json', includePasswords: boolean = false): any {
    const configManager = this.rancherManager.getConfigManager();
    const config = configManager.getConfig();
    
    const exportData = {
      logLevel: config.logLevel,
      defaultServer: config.defaultServer,
      cacheTimeout: config.cacheTimeout,
      maxConcurrentRequests: config.maxConcurrentRequests,
      requestTimeout: config.requestTimeout,
      servers: Array.from(config.servers.values()).map(server => {
        const serverConfig: any = {
          name: server.name,
          url: server.url,
          insecure: server.insecure,
          timeout: server.timeout,
          retries: server.retries
        };

        if (includePasswords) {
          if (server.token) serverConfig.token = server.token;
          if (server.username) serverConfig.username = server.username;
          if (server.password) serverConfig.password = server.password;
        } else {
          if (server.token) serverConfig.token = '***';
          if (server.username) serverConfig.username = server.username;
          if (server.password) serverConfig.password = '***';
        }

        return serverConfig;
      })
    };

    if (format === 'yaml') {
      // Here you can add conversion to YAML
      return { format: 'yaml', data: exportData };
    }

    return { format: 'json', data: exportData };
  }

  // Import server configuration
  public importServerConfig(config: any, overwrite: boolean = false): any {
    try {
      const configManager = this.rancherManager.getConfigManager();
      
      if (config.servers && Array.isArray(config.servers)) {
        for (const serverConfig of config.servers) {
          if (serverConfig.name && serverConfig.url) {
            if (overwrite || !configManager.getServerConfig(serverConfig.name)) {
              configManager.addServer(serverConfig);
            }
          }
        }
      }

      return {
        success: true,
        message: 'Configuration successfully imported'
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  // Get server usage statistics
  public async getServerStatistics(period: string = '24h'): Promise<any> {
    const servers = this.getServerNames();
    const statistics: any = {};

    for (const serverName of servers) {
      const connection = this.rancherManager.getConnection(serverName);
      if (connection) {
        statistics[serverName] = {
          isConnected: connection.isConnected,
          lastPing: connection.lastPing,
          uptime: connection.lastPing ? 
            Math.floor((Date.now() - connection.lastPing.getTime()) / 1000) : 0
        };
      } else {
        statistics[serverName] = {
          isConnected: false,
          lastPing: null,
          uptime: 0
        };
      }
    }

    return {
      period,
      totalServers: servers.length,
      connectedServers: Object.values(statistics).filter((s: any) => s.isConnected).length,
      statistics
    };
  }

  // Clean up disconnected servers
  public async cleanupDisconnectedServers(force: boolean = false): Promise<any> {
    const servers = this.getServerNames();
    const cleaned: string[] = [];
    const errors: string[] = [];

    for (const serverName of servers) {
      const connection = this.rancherManager.getConnection(serverName);
      if (!connection || !connection.isConnected) {
        try {
          if (force || !connection) {
            this.removeServer(serverName);
            cleaned.push(serverName);
          }
        } catch (error) {
          errors.push(`${serverName}: ${(error as Error).message}`);
        }
      }
    }

    return {
      cleaned,
      errors,
      totalCleaned: cleaned.length,
      totalErrors: errors.length
    };
  }
}
