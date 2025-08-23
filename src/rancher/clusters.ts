import { RancherManager } from './manager.js';
import { RancherClient, RancherCluster } from './client.js';
import { Logger } from '../utils/logger.js';

export class ClusterManager {
  private rancherManager: RancherManager;
  private logger: Logger;

  constructor(rancherManager: RancherManager) {
    this.rancherManager = rancherManager;
    this.logger = rancherManager.getLogger();
  }

  // Get all clusters from all servers
  public async getAllClusters(): Promise<Map<string, RancherCluster[]>> {
    return this.rancherManager.executeOnAllServers(async (client: RancherClient) => {
      return await client.getClusters();
    });
  }

  // Get clusters from specific server
  public async getClusters(serverName: string): Promise<RancherCluster[]> {
    return this.rancherManager.executeOnServer(serverName, async (client: RancherClient) => {
      return await client.getClusters();
    });
  }

  // Get specific cluster
  public async getCluster(serverName: string, clusterId: string): Promise<RancherCluster> {
    return this.rancherManager.executeOnServer(serverName, async (client: RancherClient) => {
      return await client.getCluster(clusterId);
    });
  }

  // Create cluster
  public async createCluster(serverName: string, clusterData: any): Promise<RancherCluster> {
    return this.rancherManager.executeOnServer(serverName, async (client: RancherClient) => {
      return await client.createCluster(clusterData);
    });
  }

  // Delete cluster
  public async deleteCluster(serverName: string, clusterId: string): Promise<void> {
    return this.rancherManager.executeOnServer(serverName, async (client: RancherClient) => {
      return await client.deleteCluster(clusterId);
    });
  }

  // Get cluster status
  public async getClusterStatus(serverName: string, clusterId: string): Promise<any> {
    return this.rancherManager.executeOnServer(serverName, async (client: RancherClient) => {
      const cluster = await client.getCluster(clusterId);
      return {
        id: cluster.id,
        name: cluster.name,
        state: cluster.state,
        provider: cluster.provider,
        nodeCount: cluster.nodeCount,
        cpu: cluster.cpu,
        memory: cluster.memory,
        created: cluster.created,
        updated: cluster.updated
      };
    });
  }

  // Get cluster metrics
  public async getClusterMetrics(serverName: string, clusterId: string): Promise<any> {
    return this.rancherManager.executeOnServer(serverName, async (client: RancherClient) => {
      return await client.getMetrics('cluster', clusterId);
    });
  }

  // Get cluster events
  public async getClusterEvents(serverName: string, clusterId: string): Promise<any[]> {
    return this.rancherManager.executeOnServer(serverName, async (client: RancherClient) => {
      return await client.getEvents({ clusterId });
    });
  }

  // Get cluster logs
  public async getClusterLogs(serverName: string, clusterId: string): Promise<string> {
    return this.rancherManager.executeOnServer(serverName, async (client: RancherClient) => {
      return await client.getLogs('cluster', clusterId);
    });
  }

  // Update cluster configuration
  public async updateClusterConfig(serverName: string, clusterId: string, config: any): Promise<RancherCluster> {
    return this.rancherManager.executeOnServer(serverName, async (client: RancherClient) => {
      return await client.request({
        method: 'PUT',
        url: `/v3/clusters/${clusterId}`,
        data: config
      });
    });
  }

  // Get cluster statistics
  public async getClusterStats(serverName: string, clusterId: string): Promise<any> {
    return this.rancherManager.executeOnServer(serverName, async (client: RancherClient) => {
      const [cluster, metrics, events] = await Promise.all([
        client.getCluster(clusterId),
        client.getMetrics('cluster', clusterId),
        client.getEvents({ clusterId })
      ]);

      return {
        cluster,
        metrics,
        events: events.slice(0, 10), // Last 10 events
        summary: {
          totalNodes: cluster.nodeCount,
          totalCPU: cluster.cpu,
          totalMemory: cluster.memory,
          state: cluster.state,
          provider: cluster.provider
        }
      };
    });
  }

  // Create cluster with provider
  public async createClusterWithProvider(
    serverName: string,
    name: string,
    provider: string,
    config: any
  ): Promise<RancherCluster> {
    const clusterData = {
      name,
      type: 'cluster',
      provider: provider,
      ...config
    };

    return this.createCluster(serverName, clusterData);
  }

  // Create AWS cluster
  public async createAWSCluster(
    serverName: string,
    name: string,
    region: string,
    instanceType: string,
    nodeCount: number
  ): Promise<RancherCluster> {
    const config = {
      amazonElasticContainerServiceConfig: {
        region,
        instanceType,
        nodeCount
      }
    };

    return this.createClusterWithProvider(serverName, name, 'amazonec2', config);
  }

  // Create Azure cluster
  public async createAzureCluster(
    serverName: string,
    name: string,
    location: string,
    vmSize: string,
    nodeCount: number
  ): Promise<RancherCluster> {
    const config = {
      azureKubernetesServiceConfig: {
        location,
        vmSize,
        nodeCount
      }
    };

    return this.createClusterWithProvider(serverName, name, 'azure', config);
  }

  // Create GCP cluster
  public async createGCPCluster(
    serverName: string,
    name: string,
    zone: string,
    machineType: string,
    nodeCount: number
  ): Promise<RancherCluster> {
    const config = {
      googleKubernetesEngineConfig: {
        zone,
        machineType,
        nodeCount
      }
    };

    return this.createClusterWithProvider(serverName, name, 'gke', config);
  }

  // Create vSphere cluster
  public async createVSphereCluster(
    serverName: string,
    name: string,
    datacenter: string,
    datastore: string,
    nodeCount: number
  ): Promise<RancherCluster> {
    const config = {
      vsphereConfig: {
        datacenter,
        datastore,
        nodeCount
      }
    };

    return this.createClusterWithProvider(serverName, name, 'vsphere', config);
  }

  // Get provider list
  public async getProviders(serverName: string): Promise<string[]> {
    return this.rancherManager.executeOnServer(serverName, async (client: RancherClient) => {
      const response = await client.request({
        method: 'GET',
        url: '/v3/clusters/providers'
      });
      return response.data || [];
    });
  }

  // Get cluster templates
  public async getClusterTemplates(serverName: string): Promise<any[]> {
    return this.rancherManager.executeOnServer(serverName, async (client: RancherClient) => {
      const response = await client.request({
        method: 'GET',
        url: '/v3/clustertemplates'
      });
      return response.data || [];
    });
  }

  // Create cluster from template
  public async createClusterFromTemplate(
    serverName: string,
    templateId: string,
    name: string,
    config: any
  ): Promise<RancherCluster> {
    return this.rancherManager.executeOnServer(serverName, async (client: RancherClient) => {
      const clusterData = {
        name,
        clusterTemplateId: templateId,
        ...config
      };

      return await client.request({
        method: 'POST',
        url: '/v3/clusters',
        data: clusterData
      });
    });
  }

  // Get cluster kubeconfig
  public async getClusterKubeconfig(
    serverName: string,
    clusterId: string,
    format: string = 'yaml'
  ): Promise<any> {
    return this.rancherManager.executeOnServer(serverName, async (client: RancherClient) => {
      return await client.getClusterKubeconfig(clusterId, format);
    });
  }
}
