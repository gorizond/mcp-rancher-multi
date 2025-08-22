import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { ConfigManager, RancherServerConfig } from '../config/manager.js';
import { Logger } from '../utils/logger.js';
import { RancherClient } from './client.js';
import { ClusterManager } from './clusters.js';
import { ProjectManager } from './projects.js';
import { ApplicationManager } from './applications.js';
import { 
  UserManager,
  MonitoringManager,
  BackupManager,
  NodeManager,
  StorageManager,
  NetworkManager,
  SecurityManager,
  CatalogManager,
  WorkloadManager,
  ConfigManager as RancherConfigManager,
  EventManager,
  LogManager,
  MetricManager,
  AlertManager,
  PolicyManager,
  QuotaManager,
  NamespaceManager
} from './other-managers.js';

export interface RancherConnection {
  name: string;
  client: RancherClient;
  config: RancherServerConfig;
  isConnected: boolean;
  lastPing?: Date;
}

export class RancherManager {
  private configManager: ConfigManager;
  private logger: Logger;
  private connections: Map<string, RancherConnection> = new Map();
  private managers: Map<string, any> = new Map();

  // Managers for various resources
  public clusters!: ClusterManager;
  public projects!: ProjectManager;
  public applications!: ApplicationManager;
  public users!: UserManager;
  public monitoring!: MonitoringManager;
  public backup!: BackupManager;
  public nodes!: NodeManager;
  public storage!: StorageManager;
  public network!: NetworkManager;
  public security!: SecurityManager;
  public catalog!: CatalogManager;
  public workloads!: WorkloadManager;
  public config!: RancherConfigManager;
  public events!: EventManager;
  public logs!: LogManager;
  public metrics!: MetricManager;
  public alerts!: AlertManager;
  public policies!: PolicyManager;
  public quotas!: QuotaManager;
  public namespaces!: NamespaceManager;

  constructor(configManager: ConfigManager, logger: Logger) {
    this.configManager = configManager;
    this.logger = logger;

    // Initialize managers
    this.initializeManagers();
  }

  private initializeManagers(): void {
    this.clusters = new ClusterManager(this);
    this.projects = new ProjectManager(this);
    this.applications = new ApplicationManager(this);
    this.users = new UserManager(this);
    this.monitoring = new MonitoringManager(this);
    this.backup = new BackupManager(this);
    this.nodes = new NodeManager(this);
    this.storage = new StorageManager(this);
    this.network = new NetworkManager(this);
    this.security = new SecurityManager(this);
    this.catalog = new CatalogManager(this);
    this.workloads = new WorkloadManager(this);
    this.config = new RancherConfigManager(this);
    this.events = new EventManager(this);
    this.logs = new LogManager(this);
    this.metrics = new MetricManager(this);
    this.alerts = new AlertManager(this);
    this.policies = new PolicyManager(this);
    this.quotas = new QuotaManager(this);
    this.namespaces = new NamespaceManager(this);

    // Save references to managers
    this.managers.set('clusters', this.clusters);
    this.managers.set('projects', this.projects);
    this.managers.set('applications', this.applications);
    this.managers.set('users', this.users);
    this.managers.set('monitoring', this.monitoring);
    this.managers.set('backup', this.backup);
    this.managers.set('nodes', this.nodes);
    this.managers.set('storage', this.storage);
    this.managers.set('network', this.network);
    this.managers.set('security', this.security);
    this.managers.set('catalog', this.catalog);
    this.managers.set('workloads', this.workloads);
    this.managers.set('config', this.config);
    this.managers.set('events', this.events);
    this.managers.set('logs', this.logs);
    this.managers.set('metrics', this.metrics);
    this.managers.set('alerts', this.alerts);
    this.managers.set('policies', this.policies);
    this.managers.set('quotas', this.quotas);
    this.managers.set('namespaces', this.namespaces);
  }

  public async initialize(): Promise<void> {
    this.logger.info('Initializing Rancher Manager');
    
    // Check configuration
    const validation = this.configManager.validateConfig();
    if (!validation.valid) {
      throw new Error(`Configuration errors: ${validation.errors.join(', ')}`);
    }

    // Connect to all servers
    await this.connectToAllServers();
    
    this.logger.info(`Rancher Manager initialized. Connected servers: ${this.connections.size}`);
  }

  private async connectToAllServers(): Promise<void> {
    const servers = this.configManager.getAllServers();
    
    for (const serverConfig of servers) {
      try {
        await this.connectToServer(serverConfig);
      } catch (error) {
        this.logger.error(`Error connecting to server ${serverConfig.name}:`, error);
      }
    }
  }

  public async connectToServer(serverConfig: RancherServerConfig): Promise<RancherConnection> {
    this.logger.info(`Connecting to server: ${serverConfig.name}`);
    
    try {
      const client = new RancherClient(serverConfig, this.logger);
      await client.initialize();
      
      const connection: RancherConnection = {
        name: serverConfig.name,
        client,
        config: serverConfig,
        isConnected: true,
        lastPing: new Date()
      };
      
      this.connections.set(serverConfig.name, connection);
      
      this.logger.logRancherOperation('connect', serverConfig.name, {
        url: serverConfig.url,
        status: 'connected'
      });
      
      return connection;
    } catch (error) {
      this.logger.logRancherError('connect', serverConfig.name, error);
      throw error;
    }
  }

  public async disconnectFromServer(serverName: string): Promise<void> {
    const connection = this.connections.get(serverName);
    if (!connection) {
      throw new Error(`Connection to server ${serverName} not found`);
    }
    
    try {
      await connection.client.disconnect();
      connection.isConnected = false;
      this.connections.delete(serverName);
      
      this.logger.logRancherOperation('disconnect', serverName);
    } catch (error) {
      this.logger.logRancherError('disconnect', serverName, error);
      throw error;
    }
  }

  public getConnection(serverName?: string): RancherConnection | null {
    const name = serverName || this.configManager.getConfig().defaultServer;
    return this.connections.get(name) || null;
  }

  public getAllConnections(): RancherConnection[] {
    return Array.from(this.connections.values());
  }

  public getConnectedServers(): string[] {
    return Array.from(this.connections.values())
      .filter(conn => conn.isConnected)
      .map(conn => conn.name);
  }

  public async pingServer(serverName: string): Promise<boolean> {
    const connection = this.connections.get(serverName);
    if (!connection) {
      return false;
    }
    
    try {
      const isAlive = await connection.client.ping();
      connection.lastPing = new Date();
      connection.isConnected = isAlive;
      
      if (!isAlive) {
        this.logger.warn(`Server ${serverName} is not responding`);
      }
      
      return isAlive;
    } catch (error) {
      connection.isConnected = false;
      this.logger.logRancherError('ping', serverName, error);
      return false;
    }
  }

  public async pingAllServers(): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>();
    
    for (const [serverName, connection] of this.connections) {
      const isAlive = await this.pingServer(serverName);
      results.set(serverName, isAlive);
    }
    
    return results;
  }

  public getManager(managerName: string): any {
    return this.managers.get(managerName);
  }

  public async executeOnAllServers<T>(
    operation: (client: RancherClient, serverName: string) => Promise<T>
  ): Promise<Map<string, T>> {
    const results = new Map<string, T>();
    
    for (const [serverName, connection] of this.connections) {
      if (connection.isConnected) {
        try {
          const result = await operation(connection.client, serverName);
          results.set(serverName, result);
        } catch (error) {
          this.logger.logRancherError('executeOnAllServers', serverName, error);
        }
      }
    }
    
    return results;
  }

  public async executeOnServer<T>(
    serverName: string,
    operation: (client: RancherClient) => Promise<T>
  ): Promise<T> {
    const connection = this.getConnection(serverName);
    if (!connection || !connection.isConnected) {
      throw new Error(`Server ${serverName} is not connected`);
    }
    
    try {
      return await operation(connection.client);
    } catch (error) {
      this.logger.logRancherError('executeOnServer', serverName, error);
      throw error;
    }
  }

  public getConfigManager(): ConfigManager {
    return this.configManager;
  }

  public getLogger(): Logger {
    return this.logger;
  }

  public async getServerStatus(): Promise<Map<string, any>> {
    const status = new Map<string, any>();
    
    for (const [serverName, connection] of this.connections) {
      try {
        const serverStatus = await connection.client.getServerStatus();
        status.set(serverName, {
          ...serverStatus,
          isConnected: connection.isConnected,
          lastPing: connection.lastPing
        });
      } catch (error) {
        status.set(serverName, {
          isConnected: false,
          error: (error as Error).message,
          lastPing: connection.lastPing
        });
      }
    }
    
    return status;
  }

  public async cleanup(): Promise<void> {
    this.logger.info('Cleaning up Rancher Manager');
    
    for (const [serverName, connection] of this.connections) {
      try {
        await this.disconnectFromServer(serverName);
      } catch (error) {
        this.logger.error(`Error disconnecting from server ${serverName}:`, error);
      }
    }
    
    this.connections.clear();
  }
}
