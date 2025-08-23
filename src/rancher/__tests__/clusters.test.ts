import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ClusterManager } from '../clusters';
import { RancherManager } from '../manager';
import { RancherClient } from '../client';
import { Logger } from '../../utils/logger';

// Mock dependencies
jest.mock('../manager');
jest.mock('../../utils/logger');

describe('ClusterManager', () => {
  let clusterManager: ClusterManager;
  let mockRancherManager: any;
  let mockClient: any;
  let mockLogger: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock logger
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn()
    };

    // Create mock client
    mockClient = {
      getClusters: jest.fn(),
      getCluster: jest.fn(),
      createCluster: jest.fn(),
      deleteCluster: jest.fn(),
      request: jest.fn(),
      getMetrics: jest.fn(),
      getEvents: jest.fn(),
      getLogs: jest.fn(),
      getClusterKubeconfig: jest.fn()
    };

    // Create mock rancher manager
    mockRancherManager = {
      executeOnAllServers: jest.fn(),
      executeOnServer: jest.fn(),
      getLogger: jest.fn().mockReturnValue(mockLogger)
    };

    clusterManager = new ClusterManager(mockRancherManager);
  });

  describe('constructor', () => {
    it('should initialize with rancher manager and logger', () => {
      expect(clusterManager).toBeDefined();
      expect(mockRancherManager.getLogger).toHaveBeenCalled();
    });
  });

  describe('getAllClusters', () => {
    it('should get clusters from all servers', async () => {
      const mockClustersMap = new Map([
        ['server-1', [{ id: 'cluster-1', name: 'test-cluster-1' }]],
        ['server-2', [{ id: 'cluster-2', name: 'test-cluster-2' }]]
      ]);

      mockRancherManager.executeOnAllServers.mockResolvedValue(mockClustersMap);

      const result = await clusterManager.getAllClusters();

      expect(mockRancherManager.executeOnAllServers).toHaveBeenCalledWith(expect.any(Function));
      expect(result).toEqual(mockClustersMap);
    });

    it('should handle errors when getting clusters from all servers', async () => {
      mockRancherManager.executeOnAllServers.mockRejectedValue(new Error('Failed to connect to servers'));

      await expect(clusterManager.getAllClusters()).rejects.toThrow('Failed to connect to servers');
    });
  });

  describe('getClusters', () => {
    it('should get clusters from specific server', async () => {
      const mockClusters = [
        { id: 'cluster-1', name: 'test-cluster-1', state: 'active' },
        { id: 'cluster-2', name: 'test-cluster-2', state: 'active' }
      ];

      mockRancherManager.executeOnServer.mockImplementation(async (serverName: string, callback: Function) => {
        return await callback(mockClient);
      });

      mockClient.getClusters.mockResolvedValue(mockClusters);

      const result = await clusterManager.getClusters('test-server');

      expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
      expect(mockClient.getClusters).toHaveBeenCalled();
      expect(result).toEqual(mockClusters);
    });

    it('should handle server not found', async () => {
      mockRancherManager.executeOnServer.mockRejectedValue(new Error('Server not found'));

      await expect(clusterManager.getClusters('invalid-server')).rejects.toThrow('Server not found');
    });
  });

  describe('getCluster', () => {
    it('should get specific cluster', async () => {
      const mockCluster = {
        id: 'cluster-1',
        name: 'test-cluster',
        state: 'active',
        provider: 'aws',
        nodeCount: 3,
        cpu: 300,
        memory: 1024,
        created: '2024-01-01T00:00:00Z',
        updated: '2024-01-01T00:00:00Z'
      };

      mockRancherManager.executeOnServer.mockImplementation(async (serverName: string, callback: Function) => {
        return await callback(mockClient);
      });

      mockClient.getCluster.mockResolvedValue(mockCluster);

      const result = await clusterManager.getCluster('test-server', 'cluster-1');

      expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
      expect(mockClient.getCluster).toHaveBeenCalledWith('cluster-1');
      expect(result).toEqual(mockCluster);
    });

    it('should handle cluster not found', async () => {
      mockRancherManager.executeOnServer.mockImplementation(async (serverName: string, callback: Function) => {
        return await callback(mockClient);
      });

      mockClient.getCluster.mockRejectedValue(new Error('Cluster not found'));

      await expect(clusterManager.getCluster('test-server', 'non-existent')).rejects.toThrow('Cluster not found');
    });
  });

  describe('createCluster', () => {
    it('should create cluster successfully', async () => {
      const clusterData = {
        name: 'new-cluster',
        type: 'cluster',
        provider: 'aws',
        region: 'us-west-2',
        nodeCount: 3
      };

      const mockCreatedCluster = {
        id: 'new-cluster-id',
        ...clusterData,
        state: 'creating',
        cpu: 0,
        memory: 0,
        created: '2024-01-01T00:00:00Z',
        updated: '2024-01-01T00:00:00Z'
      };

      mockRancherManager.executeOnServer.mockImplementation(async (serverName: string, callback: Function) => {
        return await callback(mockClient);
      });

      mockClient.createCluster.mockResolvedValue(mockCreatedCluster);

      const result = await clusterManager.createCluster('test-server', clusterData);

      expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
      expect(mockClient.createCluster).toHaveBeenCalledWith(clusterData);
      expect(result).toEqual(mockCreatedCluster);
    });

    it('should handle creation errors', async () => {
      const clusterData = {
        name: 'invalid-cluster'
      };

      mockRancherManager.executeOnServer.mockImplementation(async (serverName: string, callback: Function) => {
        return await callback(mockClient);
      });

      mockClient.createCluster.mockRejectedValue(new Error('Invalid cluster configuration'));

      await expect(clusterManager.createCluster('test-server', clusterData)).rejects.toThrow('Invalid cluster configuration');
    });
  });

  describe('deleteCluster', () => {
    it('should delete cluster successfully', async () => {
      mockRancherManager.executeOnServer.mockImplementation(async (serverName: string, callback: Function) => {
        return await callback(mockClient);
      });

      mockClient.deleteCluster.mockResolvedValue(undefined);

      await clusterManager.deleteCluster('test-server', 'cluster-1');

      expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
      expect(mockClient.deleteCluster).toHaveBeenCalledWith('cluster-1');
    });

    it('should handle deletion errors', async () => {
      mockRancherManager.executeOnServer.mockImplementation(async (serverName: string, callback: Function) => {
        return await callback(mockClient);
      });

      mockClient.deleteCluster.mockRejectedValue(new Error('Failed to delete cluster'));

      await expect(clusterManager.deleteCluster('test-server', 'cluster-1')).rejects.toThrow('Failed to delete cluster');
    });
  });

  describe('getClusterStatus', () => {
    it('should get cluster status', async () => {
      const mockStatus = {
        state: 'active',
        ready: true,
        conditions: [
          { type: 'Ready', status: 'True' }
        ]
      };

      mockRancherManager.executeOnServer.mockImplementation(async (serverName: string, callback: Function) => {
        return await callback(mockClient);
      });

      const mockCluster = {
        id: 'cluster-1',
        name: 'test-cluster',
        state: 'active',
        provider: 'aws',
        nodeCount: 3,
        cpu: 6,
        memory: 12,
        created: '2024-01-01T00:00:00Z',
        updated: '2024-01-01T00:00:00Z'
      };

      mockClient.getCluster.mockResolvedValue(mockCluster);

      const result = await clusterManager.getClusterStatus('test-server', 'cluster-1');

      expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
      expect(result).toEqual(mockCluster);
    });

    it('should handle status request errors', async () => {
      mockRancherManager.executeOnServer.mockImplementation(async (serverName: string, callback: Function) => {
        return await callback(mockClient);
      });

      mockClient.getCluster.mockRejectedValue(new Error('Failed to get cluster status'));

      await expect(clusterManager.getClusterStatus('test-server', 'cluster-1')).rejects.toThrow('Failed to get cluster status');
    });
  });

  describe('getClusterMetrics', () => {
    it('should get cluster metrics', async () => {
      const mockMetrics = {
        cpu: {
          usage: 50,
          capacity: 100
        },
        memory: {
          usage: 60,
          capacity: 100
        },
        pods: {
          usage: 25,
          capacity: 50
        }
      };

      mockRancherManager.executeOnServer.mockImplementation(async (serverName: string, callback: Function) => {
        return await callback(mockClient);
      });

      mockClient.getMetrics.mockResolvedValue(mockMetrics);

      const result = await clusterManager.getClusterMetrics('test-server', 'cluster-1');

      expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
      expect(result).toEqual(mockMetrics);
    });
  });

  describe('getClusterEvents', () => {
    it('should get cluster events', async () => {
      const mockEvents = [
        {
          type: 'Normal',
          reason: 'ClusterReady',
          message: 'Cluster is ready',
          timestamp: '2024-01-01T00:00:00Z'
        },
        {
          type: 'Warning',
          reason: 'NodeNotReady',
          message: 'Node node-1 is not ready',
          timestamp: '2024-01-01T00:01:00Z'
        }
      ];

      mockRancherManager.executeOnServer.mockImplementation(async (serverName: string, callback: Function) => {
        return await callback(mockClient);
      });

      mockClient.getEvents.mockResolvedValue(mockEvents);

      const result = await clusterManager.getClusterEvents('test-server', 'cluster-1');

      expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
      expect(result).toEqual(mockEvents);
    });

    it('should handle events request with limit', async () => {
      const mockEvents = [
        {
          type: 'Normal',
          reason: 'ClusterReady',
          message: 'Cluster is ready',
          timestamp: '2024-01-01T00:00:00Z'
        }
      ];

      mockRancherManager.executeOnServer.mockImplementation(async (serverName: string, callback: Function) => {
        return await callback(mockClient);
      });

      mockClient.getEvents.mockResolvedValue(mockEvents);

      const result = await clusterManager.getClusterEvents('test-server', 'cluster-1');

      expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
      expect(result).toEqual(mockEvents);
    });
  });

  describe('getClusterLogs', () => {
    it('should get cluster logs', async () => {
      const mockLogs = 'Cluster log data\n2024-01-01 Cluster started\n2024-01-01 Node joined';

      mockRancherManager.executeOnServer.mockImplementation(async (serverName: string, callback: Function) => {
        return await callback(mockClient);
      });

      mockClient.getLogs.mockResolvedValue(mockLogs);

      const result = await clusterManager.getClusterLogs('test-server', 'cluster-1');

      expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
      expect(mockClient.getLogs).toHaveBeenCalledWith('cluster', 'cluster-1');
      expect(result).toBe(mockLogs);
    });
  });

  describe('updateClusterConfig', () => {
    it('should update cluster configuration', async () => {
      const config = {
        description: 'Updated cluster description',
        enableClusterAlerting: true
      };

      const mockUpdatedCluster = {
        id: 'cluster-1',
        name: 'test-cluster',
        ...config
      };

      mockRancherManager.executeOnServer.mockImplementation(async (serverName: string, callback: Function) => {
        return await callback(mockClient);
      });

      mockClient.request.mockResolvedValue(mockUpdatedCluster);

      const result = await clusterManager.updateClusterConfig('test-server', 'cluster-1', config);

      expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'PUT',
        url: '/v3/clusters/cluster-1',
        data: config
      });
      expect(result).toEqual(mockUpdatedCluster);
    });
  });

  describe('getClusterStats', () => {
    it('should get cluster statistics', async () => {
      const mockCluster = {
        id: 'cluster-1',
        name: 'test-cluster',
        state: 'active',
        provider: 'aws',
        nodeCount: 3,
        cpu: 6,
        memory: 12,
        created: '2024-01-01T00:00:00Z',
        updated: '2024-01-01T00:00:00Z'
      };

      const mockMetrics = {
        cpu: { usage: 50, capacity: 100 },
        memory: { usage: 60, capacity: 100 }
      };

      const mockEvents = [
        { type: 'Normal', reason: 'ClusterReady', timestamp: '2024-01-01T00:00:00Z' },
        { type: 'Warning', reason: 'NodeNotReady', timestamp: '2024-01-01T00:01:00Z' }
      ];

      const expectedStats = {
        cluster: mockCluster,
        metrics: mockMetrics,
        events: mockEvents.slice(0, 10),
        summary: {
          totalNodes: mockCluster.nodeCount,
          totalCPU: mockCluster.cpu,
          totalMemory: mockCluster.memory,
          state: mockCluster.state,
          provider: mockCluster.provider
        }
      };

      mockRancherManager.executeOnServer.mockImplementation(async (serverName: string, callback: Function) => {
        return await callback(mockClient);
      });

      mockClient.getCluster.mockResolvedValue(mockCluster);
      mockClient.getMetrics.mockResolvedValue(mockMetrics);
      mockClient.getEvents.mockResolvedValue(mockEvents);

      const result = await clusterManager.getClusterStats('test-server', 'cluster-1');

      expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
      expect(mockClient.getCluster).toHaveBeenCalledWith('cluster-1');
      expect(mockClient.getMetrics).toHaveBeenCalledWith('cluster', 'cluster-1');
      expect(mockClient.getEvents).toHaveBeenCalledWith({ clusterId: 'cluster-1' });
      expect(result).toEqual(expectedStats);
    });
  });

  describe('createClusterWithProvider', () => {
    it('should create cluster with provider', async () => {
      const name = 'test-cluster';
      const provider = 'aws';
      const config = { region: 'us-west-2', instanceType: 't3.medium' };

      const expectedClusterData = {
        name,
        type: 'cluster',
        provider,
        ...config
      };

      const mockCreatedCluster = {
        id: 'cluster-1',
        ...expectedClusterData,
        state: 'creating'
      };

      mockRancherManager.executeOnServer.mockImplementation(async (serverName: string, callback: Function) => {
        return await callback(mockClient);
      });

      mockClient.createCluster.mockResolvedValue(mockCreatedCluster);

      const result = await clusterManager.createClusterWithProvider('test-server', name, provider, config);

      expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
      expect(mockClient.createCluster).toHaveBeenCalledWith(expectedClusterData);
      expect(result).toEqual(mockCreatedCluster);
    });
  });

  describe('createAWSCluster', () => {
    it('should create AWS cluster', async () => {
      const name = 'aws-cluster';
      const region = 'us-west-2';
      const instanceType = 't3.medium';
      const nodeCount = 3;

      const expectedConfig = {
        amazonElasticContainerServiceConfig: {
          region,
          instanceType,
          nodeCount
        }
      };

      const expectedClusterData = {
        name,
        type: 'cluster',
        provider: 'amazonec2',
        ...expectedConfig
      };

      const mockCreatedCluster = {
        id: 'aws-cluster-1',
        ...expectedClusterData,
        state: 'creating'
      };

      mockRancherManager.executeOnServer.mockImplementation(async (serverName: string, callback: Function) => {
        return await callback(mockClient);
      });

      mockClient.createCluster.mockResolvedValue(mockCreatedCluster);

      const result = await clusterManager.createAWSCluster('test-server', name, region, instanceType, nodeCount);

      expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
      expect(mockClient.createCluster).toHaveBeenCalledWith(expectedClusterData);
      expect(result).toEqual(mockCreatedCluster);
    });
  });

  describe('createAzureCluster', () => {
    it('should create Azure cluster', async () => {
      const name = 'azure-cluster';
      const location = 'westus2';
      const vmSize = 'Standard_D2s_v3';
      const nodeCount = 3;

      const expectedConfig = {
        azureKubernetesServiceConfig: {
          location,
          vmSize,
          nodeCount
        }
      };

      const expectedClusterData = {
        name,
        type: 'cluster',
        provider: 'azure',
        ...expectedConfig
      };

      const mockCreatedCluster = {
        id: 'azure-cluster-1',
        ...expectedClusterData,
        state: 'creating'
      };

      mockRancherManager.executeOnServer.mockImplementation(async (serverName: string, callback: Function) => {
        return await callback(mockClient);
      });

      mockClient.createCluster.mockResolvedValue(mockCreatedCluster);

      const result = await clusterManager.createAzureCluster('test-server', name, location, vmSize, nodeCount);

      expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
      expect(mockClient.createCluster).toHaveBeenCalledWith(expectedClusterData);
      expect(result).toEqual(mockCreatedCluster);
    });
  });

  describe('createGCPCluster', () => {
    it('should create GCP cluster', async () => {
      const name = 'gcp-cluster';
      const zone = 'us-west1-a';
      const machineType = 'e2-medium';
      const nodeCount = 3;

      const expectedConfig = {
        googleKubernetesEngineConfig: {
          zone,
          machineType,
          nodeCount
        }
      };

      const expectedClusterData = {
        name,
        type: 'cluster',
        provider: 'gke',
        ...expectedConfig
      };

      const mockCreatedCluster = {
        id: 'gcp-cluster-1',
        ...expectedClusterData,
        state: 'creating'
      };

      mockRancherManager.executeOnServer.mockImplementation(async (serverName: string, callback: Function) => {
        return await callback(mockClient);
      });

      mockClient.createCluster.mockResolvedValue(mockCreatedCluster);

      const result = await clusterManager.createGCPCluster('test-server', name, zone, machineType, nodeCount);

      expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
      expect(mockClient.createCluster).toHaveBeenCalledWith(expectedClusterData);
      expect(result).toEqual(mockCreatedCluster);
    });
  });

  describe('createVSphereCluster', () => {
    it('should create vSphere cluster', async () => {
      const name = 'vsphere-cluster';
      const datacenter = 'Datacenter1';
      const datastore = 'datastore1';
      const nodeCount = 3;

      const expectedConfig = {
        vsphereConfig: {
          datacenter,
          datastore,
          nodeCount
        }
      };

      const expectedClusterData = {
        name,
        type: 'cluster',
        provider: 'vsphere',
        ...expectedConfig
      };

      const mockCreatedCluster = {
        id: 'vsphere-cluster-1',
        ...expectedClusterData,
        state: 'creating'
      };

      mockRancherManager.executeOnServer.mockImplementation(async (serverName: string, callback: Function) => {
        return await callback(mockClient);
      });

      mockClient.createCluster.mockResolvedValue(mockCreatedCluster);

      const result = await clusterManager.createVSphereCluster('test-server', name, datacenter, datastore, nodeCount);

      expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
      expect(mockClient.createCluster).toHaveBeenCalledWith(expectedClusterData);
      expect(result).toEqual(mockCreatedCluster);
    });
  });

  describe('getProviders', () => {
    it('should get cluster providers', async () => {
      const mockProviders = ['amazonec2', 'azure', 'gke', 'vsphere'];

      mockRancherManager.executeOnServer.mockImplementation(async (serverName: string, callback: Function) => {
        return await callback(mockClient);
      });

      mockClient.request.mockResolvedValue({ data: mockProviders });

      const result = await clusterManager.getProviders('test-server');

      expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'GET',
        url: '/v3/clusters/providers'
      });
      expect(result).toEqual(mockProviders);
    });

    it('should handle empty providers response', async () => {
      mockRancherManager.executeOnServer.mockImplementation(async (serverName: string, callback: Function) => {
        return await callback(mockClient);
      });

      mockClient.request.mockResolvedValue({});

      const result = await clusterManager.getProviders('test-server');

      expect(result).toEqual([]);
    });
  });

  describe('getClusterTemplates', () => {
    it('should get cluster templates', async () => {
      const mockTemplates = [
        { id: 'template-1', name: 'AWS Template', provider: 'amazonec2' },
        { id: 'template-2', name: 'Azure Template', provider: 'azure' }
      ];

      mockRancherManager.executeOnServer.mockImplementation(async (serverName: string, callback: Function) => {
        return await callback(mockClient);
      });

      mockClient.request.mockResolvedValue({ data: mockTemplates });

      const result = await clusterManager.getClusterTemplates('test-server');

      expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'GET',
        url: '/v3/clustertemplates'
      });
      expect(result).toEqual(mockTemplates);
    });

    it('should handle empty templates response', async () => {
      mockRancherManager.executeOnServer.mockImplementation(async (serverName: string, callback: Function) => {
        return await callback(mockClient);
      });

      mockClient.request.mockResolvedValue({});

      const result = await clusterManager.getClusterTemplates('test-server');

      expect(result).toEqual([]);
    });
  });

  describe('createClusterFromTemplate', () => {
    it('should create cluster from template', async () => {
      const templateId = 'template-1';
      const name = 'cluster-from-template';
      const config = { description: 'Cluster from template' };

      const expectedClusterData = {
        name,
        clusterTemplateId: templateId,
        ...config
      };

      const mockCreatedCluster = {
        id: 'cluster-from-template-1',
        ...expectedClusterData,
        state: 'creating'
      };

      mockRancherManager.executeOnServer.mockImplementation(async (serverName: string, callback: Function) => {
        return await callback(mockClient);
      });

      mockClient.request.mockResolvedValue(mockCreatedCluster);

      const result = await clusterManager.createClusterFromTemplate('test-server', templateId, name, config);

      expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
      expect(mockClient.request).toHaveBeenCalledWith({
        method: 'POST',
        url: '/v3/clusters',
        data: expectedClusterData
      });
      expect(result).toEqual(mockCreatedCluster);
    });
  });

  describe('getClusterKubeconfig', () => {
    it('should get cluster kubeconfig in yaml format', async () => {
      const mockKubeconfig = {
        clusterId: 'cluster-1',
        format: 'yaml',
        kubeconfig: 'apiVersion: v1\nkind: Config'
      };

      mockRancherManager.executeOnServer.mockImplementation(async (serverName: string, callback: Function) => {
        return await callback(mockClient);
      });

      mockClient.getClusterKubeconfig.mockResolvedValue(mockKubeconfig);

      const result = await clusterManager.getClusterKubeconfig('test-server', 'cluster-1', 'yaml');

      expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
      expect(mockClient.getClusterKubeconfig).toHaveBeenCalledWith('cluster-1', 'yaml');
      expect(result).toEqual(mockKubeconfig);
    });

    it('should get cluster kubeconfig with default format', async () => {
      const mockKubeconfig = {
        clusterId: 'cluster-1',
        format: 'yaml',
        kubeconfig: 'apiVersion: v1\nkind: Config'
      };

      mockRancherManager.executeOnServer.mockImplementation(async (serverName: string, callback: Function) => {
        return await callback(mockClient);
      });

      mockClient.getClusterKubeconfig.mockResolvedValue(mockKubeconfig);

      const result = await clusterManager.getClusterKubeconfig('test-server', 'cluster-1');

      expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
      expect(mockClient.getClusterKubeconfig).toHaveBeenCalledWith('cluster-1', 'yaml');
      expect(result).toEqual(mockKubeconfig);
    });
  });
});
