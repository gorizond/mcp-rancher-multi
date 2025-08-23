import { RancherClient } from './client';
import { Logger } from '../utils/logger';
import { ConfigManager } from '../config/manager';

export interface FleetBundle {
  id: string;
  name: string;
  namespace: string;
  clusterId: string;
  state: string;
  targets: FleetTarget[];
  resources: FleetResource[];
  createdAt: string;
  updatedAt: string;
}

export interface FleetTarget {
  clusterId: string;
  clusterName: string;
  state: string;
  message?: string;
}

export interface FleetResource {
  apiVersion: string;
  kind: string;
  name: string;
  namespace: string;
  state: string;
}

export interface FleetGitRepo {
  id: string;
  name: string;
  namespace: string;
  repo: string;
  branch: string;
  paths: string[];
  targets: FleetTarget[];
  state: string;
  lastCommit: string;
  createdAt: string;
  updatedAt: string;
}

export interface FleetCluster {
  id: string;
  name: string;
  namespace: string;
  state: string;
  labels: Record<string, string>;
  fleetWorkspace: string;
  createdAt: string;
  updatedAt: string;
}

export class FleetManager {
  private client: RancherClient;
  private logger: Logger;
  private configManager: ConfigManager;

  constructor(client: RancherClient, configManager: ConfigManager, logger: Logger) {
    this.client = client;
    this.configManager = configManager;
    this.logger = logger;
  }

  // Add HTTP methods to RancherClient interface
  private async get(url: string): Promise<any> {
    try {
      return await this.client.request({ method: 'GET', url });
    } catch (error) {
      this.logger.error(`GET request failed for ${url}:`, error);
      throw error;
    }
  }

  private async post(url: string, data?: any): Promise<any> {
    try {
      return await this.client.request({ method: 'POST', url, data });
    } catch (error) {
      this.logger.error(`POST request failed for ${url}:`, error);
      throw error;
    }
  }

  private async put(url: string, data?: any): Promise<any> {
    try {
      return await this.client.request({ method: 'PUT', url, data });
    } catch (error) {
      this.logger.error(`PUT request failed for ${url}:`, error);
      throw error;
    }
  }

  private async delete(url: string): Promise<any> {
    try {
      return await this.client.request({ method: 'DELETE', url });
    } catch (error) {
      this.logger.error(`DELETE request failed for ${url}:`, error);
      throw error;
    }
  }

  /**
   * List all Fleet bundles across all clusters
   */
  async listBundles(clusterId?: string): Promise<FleetBundle[]> {
    try {
      if (clusterId) {
        // Try to get bundles from specific cluster
        try {
          const response = await this.get(`/v3/clusters/${clusterId}/fleet.cattle.io.bundles`);
          if (response.data && response.data.data) {
            return response.data.data.map((bundle: any) => this.mapBundle(bundle));
          }
          return [];
        } catch (error) {
          this.logger.warn(`Failed to get bundles for cluster ${clusterId}:`, error);
          return [];
        }
      } else {
        // Try to get bundles from global Fleet API
        try {
          const response = await this.get('/v3/fleet.cattle.io.bundles');
          if (response.data && response.data.data) {
            return response.data.data.map((bundle: any) => this.mapBundle(bundle));
          }
          return [];
        } catch (error) {
          this.logger.warn('Failed to get bundles from global Fleet API:', error);
          return [];
        }
      }
    } catch (error) {
      this.logger.error('Error listing Fleet bundles:', error);
      return [];
    }
  }

  /**
   * Get a specific Fleet bundle
   */
  async getBundle(bundleId: string, clusterId: string): Promise<FleetBundle> {
    try {
      const response = await this.get(`/v3/clusters/${clusterId}/fleet.cattle.io.bundles/${bundleId}`);
      return this.mapBundle(response.data);
    } catch (error) {
      this.logger.error(`Error getting Fleet bundle ${bundleId}:`, error);
      throw error;
    }
  }

  /**
   * Create a new Fleet bundle
   */
  async createBundle(bundle: Partial<FleetBundle>, clusterId: string): Promise<FleetBundle> {
    try {
      const response = await this.post(`/v3/clusters/${clusterId}/fleet.cattle.io.bundles`, {
        type: 'fleet.cattle.io.bundle',
        metadata: {
          name: bundle.name,
          namespace: bundle.namespace || 'fleet-default'
        },
        spec: {
          targets: bundle.targets || [],
          resources: bundle.resources || []
        }
      });
      return this.mapBundle(response.data);
    } catch (error) {
      this.logger.error('Error creating Fleet bundle:', error);
      throw error;
    }
  }

  /**
   * Update a Fleet bundle
   */
  async updateBundle(bundleId: string, clusterId: string, updates: Partial<FleetBundle>): Promise<FleetBundle> {
    try {
      const response = await this.put(`/v3/clusters/${clusterId}/fleet.cattle.io.bundles/${bundleId}`, {
        ...updates,
        type: 'fleet.cattle.io.bundle'
      });
      return this.mapBundle(response.data);
    } catch (error) {
      this.logger.error(`Error updating Fleet bundle ${bundleId}:`, error);
      throw error;
    }
  }

  /**
   * Delete a Fleet bundle
   */
  async deleteBundle(bundleId: string, clusterId: string): Promise<void> {
    try {
      await this.delete(`/v3/clusters/${clusterId}/fleet.cattle.io.bundles/${bundleId}`);
      this.logger.info(`Deleted Fleet bundle ${bundleId}`);
    } catch (error) {
      this.logger.error(`Error deleting Fleet bundle ${bundleId}:`, error);
      throw error;
    }
  }

  /**
   * List all Fleet Git repositories
   */
  async listGitRepos(clusterId?: string): Promise<FleetGitRepo[]> {
    try {
      if (clusterId) {
        // Try to get Git repos from specific cluster
        try {
          const response = await this.get(`/v3/clusters/${clusterId}/fleet.cattle.io.gitrepos`);
          if (response.data && response.data.data) {
            return response.data.data.map((repo: any) => this.mapGitRepo(repo));
          }
          return [];
        } catch (error) {
          this.logger.warn(`Failed to get Git repos for cluster ${clusterId}:`, error);
          return [];
        }
      } else {
        // Try to get Git repos from global Fleet API
        try {
          const response = await this.get('/v3/fleet.cattle.io.gitrepos');
          if (response.data && response.data.data) {
            return response.data.data.map((repo: any) => this.mapGitRepo(repo));
          }
          return [];
        } catch (error) {
          this.logger.warn('Failed to get Git repos from global Fleet API:', error);
          return [];
        }
      }
    } catch (error) {
      this.logger.error('Error listing Fleet Git repositories:', error);
      return [];
    }
  }

  /**
   * Get a specific Fleet Git repository
   */
  async getGitRepo(repoId: string, clusterId: string): Promise<FleetGitRepo> {
    try {
      const response = await this.get(`/v3/clusters/${clusterId}/fleet.cattle.io.gitrepos/${repoId}`);
      return this.mapGitRepo(response.data);
    } catch (error) {
      this.logger.error(`Error getting Fleet Git repo ${repoId}:`, error);
      throw error;
    }
  }

  /**
   * Create a new Fleet Git repository
   */
  async createGitRepo(repo: Partial<FleetGitRepo>, clusterId: string): Promise<FleetGitRepo> {
    try {
      const response = await this.post(`/v3/clusters/${clusterId}/fleet.cattle.io.gitrepos`, {
        type: 'fleet.cattle.io.gitrepo',
        metadata: {
          name: repo.name,
          namespace: repo.namespace || 'fleet-default'
        },
        spec: {
          repo: repo.repo,
          branch: repo.branch || 'main',
          paths: repo.paths || [],
          targets: repo.targets || []
        }
      });
      return this.mapGitRepo(response.data);
    } catch (error) {
      this.logger.error('Error creating Fleet Git repository:', error);
      throw error;
    }
  }

  /**
   * Update a Fleet Git repository
   */
  async updateGitRepo(repoId: string, clusterId: string, updates: Partial<FleetGitRepo>): Promise<FleetGitRepo> {
    try {
      const response = await this.put(`/v3/clusters/${clusterId}/fleet.cattle.io.gitrepos/${repoId}`, {
        ...updates,
        type: 'fleet.cattle.io.gitrepo'
      });
      return this.mapGitRepo(response.data);
    } catch (error) {
      this.logger.error(`Error updating Fleet Git repo ${repoId}:`, error);
      throw error;
    }
  }

  /**
   * Delete a Fleet Git repository
   */
  async deleteGitRepo(repoId: string, clusterId: string): Promise<void> {
    try {
      await this.delete(`/v3/clusters/${clusterId}/fleet.cattle.io.gitrepos/${repoId}`);
      this.logger.info(`Deleted Fleet Git repository ${repoId}`);
    } catch (error) {
      this.logger.error(`Error deleting Fleet Git repo ${repoId}:`, error);
      throw error;
    }
  }

  /**
   * List all Fleet clusters
   */
  async listFleetClusters(): Promise<FleetCluster[]> {
    try {
      const response = await this.get('/v3/fleet.cattle.io.clusters');
      if (response.data && response.data.data) {
        return response.data.data.map((cluster: any) => this.mapFleetCluster(cluster));
      }
      return [];
    } catch (error) {
      this.logger.error('Error listing Fleet clusters:', error);
      return [];
    }
  }

  /**
   * Get a specific Fleet cluster
   */
  async getFleetCluster(clusterId: string): Promise<FleetCluster> {
    try {
      const response = await this.get(`/v3/fleet.cattle.io.clusters/${clusterId}`);
      return this.mapFleetCluster(response.data);
    } catch (error) {
      this.logger.error(`Error getting Fleet cluster ${clusterId}:`, error);
      throw error;
    }
  }

  /**
   * Get Fleet workspace information
   */
  async getFleetWorkspaces(): Promise<any[]> {
    try {
      const response = await this.get('/v3/fleet.cattle.io.workspaces');
      return response.data?.data || [];
    } catch (error) {
      this.logger.error('Error getting Fleet workspaces:', error);
      return [];
    }
  }

  /**
   * Get Fleet deployment status
   */
  async getDeploymentStatus(bundleId: string, clusterId: string): Promise<any> {
    try {
      const response = await this.get(`/v3/clusters/${clusterId}/fleet.cattle.io.bundles/${bundleId}/status`);
      return response.data;
    } catch (error) {
      this.logger.error(`Error getting deployment status for bundle ${bundleId}:`, error);
      throw error;
    }
  }

  /**
   * Force sync a Fleet bundle
   */
  async forceSyncBundle(bundleId: string, clusterId: string): Promise<void> {
    try {
      await this.post(`/v3/clusters/${clusterId}/fleet.cattle.io.bundles/${bundleId}?action=forceSync`);
      this.logger.info(`Forced sync for Fleet bundle ${bundleId}`);
    } catch (error) {
      this.logger.error(`Error forcing sync for bundle ${bundleId}:`, error);
      throw error;
    }
  }

  /**
   * Get Fleet logs
   */
  async getFleetLogs(clusterId: string, namespace?: string): Promise<any[]> {
    try {
      const url = namespace 
        ? `/v3/clusters/${clusterId}/fleet.cattle.io.bundles?namespace=${namespace}`
        : `/v3/clusters/${clusterId}/fleet.cattle.io.bundles`;
      
      const response = await this.get(url);
      return response.data?.data || [];
    } catch (error) {
      this.logger.error('Error getting Fleet logs:', error);
      return [];
    }
  }

  private mapBundle(data: any): FleetBundle {
    return {
      id: data.id,
      name: data.metadata?.name,
      namespace: data.metadata?.namespace,
      clusterId: data.clusterId,
      state: data.status?.state || 'unknown',
      targets: data.status?.targets || [],
      resources: data.status?.resources || [],
      createdAt: data.metadata?.creationTimestamp,
      updatedAt: data.metadata?.annotations?.['cattle.io/timestamp']
    };
  }

  private mapGitRepo(data: any): FleetGitRepo {
    return {
      id: data.id,
      name: data.metadata?.name,
      namespace: data.metadata?.namespace,
      repo: data.spec?.repo,
      branch: data.spec?.branch,
      paths: data.spec?.paths || [],
      targets: data.status?.targets || [],
      state: data.status?.state || 'unknown',
      lastCommit: data.status?.lastCommit,
      createdAt: data.metadata?.creationTimestamp,
      updatedAt: data.metadata?.annotations?.['cattle.io/timestamp']
    };
  }

  private mapFleetCluster(data: any): FleetCluster {
    return {
      id: data.id,
      name: data.metadata?.name,
      namespace: data.metadata?.namespace,
      state: data.status?.state || 'unknown',
      labels: data.metadata?.labels || {},
      fleetWorkspace: data.spec?.fleetWorkspace,
      createdAt: data.metadata?.creationTimestamp,
      updatedAt: data.metadata?.annotations?.['cattle.io/timestamp']
    };
  }
}


