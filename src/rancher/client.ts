import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { parse as parseYaml } from 'yaml';
import { RancherServerConfig } from '../config/manager.js';
import { Logger } from '../utils/logger.js';

export interface RancherApiResponse<T = any> {
  data: T;
  links?: any;
  actions?: any;
  pagination?: any;
}

export interface RancherCluster {
  id: string;
  name: string;
  state: string;
  provider: string;
  nodeCount: number;
  cpu: number;
  memory: number;
  created: string;
  updated: string;
}

export interface RancherProject {
  id: string;
  name: string;
  clusterId: string;
  state: string;
  created: string;
  updated: string;
}

export interface RancherNamespace {
  id: string;
  name: string;
  projectId: string;
  state: string;
  created: string;
  updated: string;
}

export interface RancherUser {
  id: string;
  username: string;
  name: string;
  email: string;
  enabled: boolean;
  created: string;
  updated: string;
}

export interface RancherApplication {
  id: string;
  name: string;
  projectId: string;
  state: string;
  version: string;
  created: string;
  updated: string;
}

export class RancherClient {
  private config: RancherServerConfig;
  private logger: Logger;
  private axiosInstance: AxiosInstance;
  private isInitialized: boolean = false;

  constructor(config: RancherServerConfig, logger: Logger) {
    this.config = config;
    this.logger = logger;
    this.axiosInstance = axios.create();
  }

  public async initialize(): Promise<void> {
    this.logger.info(`Initializing Rancher client for ${this.config.name}`);
    
    // Configure axios
    this.axiosInstance.defaults.baseURL = this.config.url;
    this.axiosInstance.defaults.timeout = this.config.timeout || 30000;
    
    // Configure authorization headers
    if (this.config.token) {
      this.axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${this.config.token}`;
    } else if (this.config.username && this.config.password) {
      // If no token but login/password exists, get token
      await this.authenticate();
    }
    
    // Configure interceptors
    this.setupInterceptors();
    
    // Check connection
    await this.ping();
    
    this.isInitialized = true;
    this.logger.info(`Rancher client ${this.config.name} initialized`);
  }

  private async authenticate(): Promise<void> {
    try {
      const response = await axios.post(`${this.config.url}/v3-public/localProviders/local?action=login`, {
        username: this.config.username,
        password: this.config.password
      });
      
      if (response.data.token) {
        this.axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      }
    } catch (error) {
      throw new Error(`Authentication error: ${error}`);
    }
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      (config) => {
        this.logger.debug(`Rancher API request: ${config.method?.toUpperCase()} ${config.url}`, {
          server: this.config.name,
          params: config.params
        });
        return config;
      },
      (error) => {
        this.logger.error('Rancher API request error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response) => {
        this.logger.debug(`Rancher API response: ${response.status} ${response.config.url}`, {
          server: this.config.name,
          status: response.status
        });
        return response;
      },
      (error) => {
        this.logger.error('Rancher API response error:', {
          server: this.config.name,
          error: error.message,
          status: error.response?.status,
          url: error.config?.url
        });
        return Promise.reject(error);
      }
    );
  }

  public async ping(): Promise<boolean> {
    try {
      const response = await this.axiosInstance.get('/v3/settings/server-version');
      return response.status === 200;
    } catch {
      return false;
    }
  }

  public async getServerStatus(): Promise<any> {
    try {
      const [versionResponse, settingsResponse] = await Promise.all([
        this.axiosInstance.get('/v3/settings/server-version'),
        this.axiosInstance.get('/v3/settings')
      ]);

      return {
        version: versionResponse.data.value,
        settings: settingsResponse.data,
        status: 'healthy'
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: (error as Error).message
      };
    }
  }

  // Methods for working with clusters
  public async getClusters(): Promise<RancherCluster[]> {
    const response = await this.axiosInstance.get<RancherApiResponse<RancherCluster[]>>('/v3/clusters');
    return response.data.data;
  }

  public async getCluster(clusterId: string): Promise<RancherCluster> {
    const response = await this.axiosInstance.get<RancherApiResponse<RancherCluster>>(`/v3/clusters/${clusterId}`);
    return response.data.data;
  }

  public async createCluster(clusterData: any): Promise<RancherCluster> {
    const response = await this.axiosInstance.post<RancherApiResponse<RancherCluster>>('/v3/clusters', clusterData);
    return response.data.data;
  }

  public async deleteCluster(clusterId: string): Promise<void> {
    await this.axiosInstance.delete(`/v3/clusters/${clusterId}`);
  }

  public async getClusterKubeconfig(clusterId: string, format: string = 'yaml'): Promise<any> {
    try {
      this.logger.info(`Generating kubeconfig for cluster ${clusterId} in format ${format}`);
      
      // Generate kubeconfig using Rancher API action
      const response = await this.axiosInstance.post(`/v3/clusters/${clusterId}?action=generateKubeconfig`, {}, {
        headers: {
          'Accept': format === 'json' ? 'application/json' : 'application/yaml',
          'Content-Type': 'application/json'
        }
      });

      this.logger.info(`Kubeconfig response received for cluster ${clusterId}`);
      this.logger.debug(`Response data:`, response.data);

      const kubeconfig = response.data.config;

      if (!kubeconfig) {
        this.logger.error(`No kubeconfig found in response for cluster ${clusterId}`);
        throw new Error('No kubeconfig found in response');
      }

      this.logger.info(`Kubeconfig generated successfully for cluster ${clusterId}`);

      if (format === 'json') {
        // Parse YAML to JSON if requested
        return {
          clusterId,
          format: 'json',
          kubeconfig: parseYaml(kubeconfig),
          raw: kubeconfig
        };
      } else if (format === 'raw') {
        return {
          clusterId,
          format: 'raw',
          kubeconfig: kubeconfig
        };
      } else {
        // Default YAML format
        return {
          clusterId,
          format: 'yaml',
          kubeconfig: kubeconfig
        };
      }
    } catch (error) {
      this.logger.error(`Failed to get kubeconfig for cluster ${clusterId}:`, error);
      throw new Error(`Failed to get kubeconfig: ${(error as Error).message}`);
    }
  }

  // Methods for working with projects
  public async getProjects(clusterId?: string): Promise<RancherProject[]> {
    const params = clusterId ? { clusterId } : {};
    const response = await this.axiosInstance.get<RancherApiResponse<RancherProject[]>>('/v3/projects', { params });
    return response.data.data;
  }

  public async getProject(projectId: string): Promise<RancherProject> {
    const response = await this.axiosInstance.get<RancherApiResponse<RancherProject>>(`/v3/projects/${projectId}`);
    return response.data.data;
  }

  public async createProject(projectData: any): Promise<RancherProject> {
    const response = await this.axiosInstance.post<RancherApiResponse<RancherProject>>('/v3/projects', projectData);
    return response.data.data;
  }

  public async deleteProject(projectId: string): Promise<void> {
    await this.axiosInstance.delete(`/v3/projects/${projectId}`);
  }

  // Methods for working with namespaces
  public async getNamespaces(projectId?: string): Promise<RancherNamespace[]> {
    const params = projectId ? { projectId } : {};
    const response = await this.axiosInstance.get<RancherApiResponse<RancherNamespace[]>>('/v3/namespaces', { params });
    return response.data.data;
  }

  public async getNamespace(namespaceId: string): Promise<RancherNamespace> {
    const response = await this.axiosInstance.get<RancherApiResponse<RancherNamespace>>(`/v3/namespaces/${namespaceId}`);
    return response.data.data;
  }

  public async createNamespace(namespaceData: any): Promise<RancherNamespace> {
    const response = await this.axiosInstance.post<RancherApiResponse<RancherNamespace>>('/v3/namespaces', namespaceData);
    return response.data.data;
  }

  public async deleteNamespace(namespaceId: string): Promise<void> {
    await this.axiosInstance.delete(`/v3/namespaces/${namespaceId}`);
  }

  // Methods for working with users
  public async getUsers(): Promise<RancherUser[]> {
    const response = await this.axiosInstance.get<RancherApiResponse<RancherUser[]>>('/v3/users');
    return response.data.data;
  }

  public async getUser(userId: string): Promise<RancherUser> {
    const response = await this.axiosInstance.get<RancherApiResponse<RancherUser>>(`/v3/users/${userId}`);
    return response.data.data;
  }

  public async createUser(userData: any): Promise<RancherUser> {
    const response = await this.axiosInstance.post<RancherApiResponse<RancherUser>>('/v3/users', userData);
    return response.data.data;
  }

  public async deleteUser(userId: string): Promise<void> {
    await this.axiosInstance.delete(`/v3/users/${userId}`);
  }

  // Methods for working with applications
  public async getApplications(projectId?: string): Promise<RancherApplication[]> {
    const params = projectId ? { projectId } : {};
    const response = await this.axiosInstance.get<RancherApiResponse<RancherApplication[]>>('/v3/apps', { params });
    return response.data.data;
  }

  public async getApplication(appId: string): Promise<RancherApplication> {
    const response = await this.axiosInstance.get<RancherApiResponse<RancherApplication>>(`/v3/apps/${appId}`);
    return response.data.data;
  }

  public async createApplication(appData: any): Promise<RancherApplication> {
    const response = await this.axiosInstance.post<RancherApiResponse<RancherApplication>>('/v3/apps', appData);
    return response.data.data;
  }

  public async deleteApplication(appId: string): Promise<void> {
    await this.axiosInstance.delete(`/v3/apps/${appId}`);
  }

  // Universal method for executing requests
  public async request<T = any>(config: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.request<T>(config);
    return response.data;
  }

  // Methods for working with catalogs
  public async getCatalogs(): Promise<any[]> {
    const response = await this.axiosInstance.get<RancherApiResponse<any[]>>('/v3/catalogs');
    return response.data.data;
  }

  public async getCatalogTemplates(catalogId: string): Promise<any[]> {
    const response = await this.axiosInstance.get<RancherApiResponse<any[]>>(`/v3/catalogs/${catalogId}/templates`);
    return response.data.data;
  }

  // Methods for working with events
  public async getEvents(filters?: any): Promise<any[]> {
    const params = filters || {};
    const response = await this.axiosInstance.get<RancherApiResponse<any[]>>('/v3/events', { params });
    return response.data.data;
  }

  // Methods for working with logs
  public async getLogs(resourceType: string, resourceId: string, options?: any): Promise<string> {
    const params = { ...options, resourceType, resourceId };
    const response = await this.axiosInstance.get('/v3/logs', { params });
    return response.data;
  }

  // Methods for working with metrics
  public async getMetrics(resourceType: string, resourceId: string, options?: any): Promise<any> {
    const params = { ...options, resourceType, resourceId };
    const response = await this.axiosInstance.get('/v3/metrics', { params });
    return response.data;
  }

  // Methods for working with alerts
  public async getAlerts(): Promise<any[]> {
    const response = await this.axiosInstance.get<RancherApiResponse<any[]>>('/v3/alerts');
    return response.data.data;
  }

  public async createAlert(alertData: any): Promise<any> {
    const response = await this.axiosInstance.post<RancherApiResponse<any>>('/v3/alerts', alertData);
    return response.data;
  }

  // Methods for working with policies
  public async getPolicies(): Promise<any[]> {
    const response = await this.axiosInstance.get<RancherApiResponse<any[]>>('/v3/policies');
    return response.data.data;
  }

  public async createPolicy(policyData: any): Promise<any> {
    const response = await this.axiosInstance.post<RancherApiResponse<any>>('/v3/policies', policyData);
    return response.data;
  }

  // Methods for working with quotas
  public async getQuotas(projectId?: string): Promise<any[]> {
    const params = projectId ? { projectId } : {};
    const response = await this.axiosInstance.get<RancherApiResponse<any[]>>('/v3/quotas', { params });
    return response.data.data;
  }

  public async createQuota(quotaData: any): Promise<any> {
    const response = await this.axiosInstance.post<RancherApiResponse<any>>('/v3/quotas', quotaData);
    return response.data;
  }

  // Methods for working with backups
  public async createBackup(backupData: any): Promise<any> {
    const response = await this.axiosInstance.post<RancherApiResponse<any>>('/v3/backups', backupData);
    return response.data;
  }

  public async getBackups(): Promise<any[]> {
    const response = await this.axiosInstance.get<RancherApiResponse<any[]>>('/v3/backups');
    return response.data.data;
  }

  public async restoreBackup(backupId: string, restoreData: any): Promise<any> {
    const response = await this.axiosInstance.post<RancherApiResponse<any>>(`/v3/backups/${backupId}?action=restore`, restoreData);
    return response.data;
  }

  // Methods for working with nodes
  public async getNodes(clusterId?: string): Promise<any[]> {
    const params = clusterId ? { clusterId } : {};
    const response = await this.axiosInstance.get<RancherApiResponse<any[]>>('/v3/nodes', { params });
    return response.data.data;
  }

  public async getNode(nodeId: string): Promise<any> {
    const response = await this.axiosInstance.get<RancherApiResponse<any>>(`/v3/nodes/${nodeId}`);
    return response.data;
  }

  // Methods for working with storage
  public async getStorageClasses(clusterId?: string): Promise<any[]> {
    const params = clusterId ? { clusterId } : {};
    const response = await this.axiosInstance.get<RancherApiResponse<any[]>>('/v3/storageclasses', { params });
    return response.data.data;
  }

  public async getPersistentVolumes(clusterId?: string): Promise<any[]> {
    const params = clusterId ? { clusterId } : {};
    const response = await this.axiosInstance.get<RancherApiResponse<any[]>>('/v3/persistentvolumes', { params });
    return response.data.data;
  }

  // Methods for working with network
  public async getServices(clusterId?: string): Promise<any[]> {
    const params = clusterId ? { clusterId } : {};
    const response = await this.axiosInstance.get<RancherApiResponse<any[]>>('/v3/services', { params });
    return response.data.data;
  }

  public async getIngresses(clusterId?: string): Promise<any[]> {
    const params = clusterId ? { clusterId } : {};
    const response = await this.axiosInstance.get<RancherApiResponse<any[]>>('/v3/ingresses', { params });
    return response.data.data;
  }

  // Methods for working with security
  public async getRoles(): Promise<any[]> {
    const response = await this.axiosInstance.get<RancherApiResponse<any[]>>('/v3/roles');
    return response.data.data;
  }

  public async getRoleBindings(): Promise<any[]> {
    const response = await this.axiosInstance.get<RancherApiResponse<any[]>>('/v3/rolebindings');
    return response.data.data;
  }

  public async createRoleBinding(roleBindingData: any): Promise<any> {
    const response = await this.axiosInstance.post<RancherApiResponse<any>>('/v3/rolebindings', roleBindingData);
    return response.data;
  }

  // Methods for working with workloads
  public async getWorkloads(projectId?: string): Promise<any[]> {
    const params = projectId ? { projectId } : {};
    const response = await this.axiosInstance.get<RancherApiResponse<any[]>>('/v3/workloads', { params });
    return response.data.data;
  }

  public async getWorkload(workloadId: string): Promise<any> {
    const response = await this.axiosInstance.get<RancherApiResponse<any>>(`/v3/workloads/${workloadId}`);
    return response.data;
  }

  public async createWorkload(workloadData: any): Promise<any> {
    const response = await this.axiosInstance.post<RancherApiResponse<any>>('/v3/workloads', workloadData);
    return response.data;
  }

  public async updateWorkload(workloadId: string, workloadData: any): Promise<any> {
    const response = await this.axiosInstance.put<RancherApiResponse<any>>(`/v3/workloads/${workloadId}`, workloadData);
    return response.data;
  }

  public async deleteWorkload(workloadId: string): Promise<void> {
    await this.axiosInstance.delete(`/v3/workloads/${workloadId}`);
  }

  // Methods for working with configuration
  public async getSettings(): Promise<any[]> {
    const response = await this.axiosInstance.get<RancherApiResponse<any[]>>('/v3/settings');
    return response.data.data;
  }

  public async updateSetting(settingId: string, value: any): Promise<any> {
    const response = await this.axiosInstance.put<RancherApiResponse<any>>(`/v3/settings/${settingId}`, { value });
    return response.data;
  }

  public async disconnect(): Promise<void> {
    this.isInitialized = false;
    this.logger.info(`Rancher client ${this.config.name} disconnected`);
  }

  public getConfig(): RancherServerConfig {
    return this.config;
  }

  public isConnected(): boolean {
    return this.isInitialized;
  }
}
