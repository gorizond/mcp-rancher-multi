// @ts-nocheck
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ToolHandlers } from '../../handlers/tool-handlers';
import { RancherManager } from '../../rancher/manager';
import { FleetHandlers } from '../../handlers/fleet-handlers';

// Mock dependencies
jest.mock('../../rancher/manager');
jest.mock('../../handlers/fleet-handlers');

// Mock server-manager with a simpler approach
const mockServerManagerInstance = {
  getServerStatus: jest.fn(),
  pingServer: jest.fn(),
  pingAllServers: jest.fn(),
  connectToServer: jest.fn(),
  disconnectFromServer: jest.fn(),
  addServer: jest.fn(),
  removeServer: jest.fn(),
  updateServer: jest.fn(),
  setDefaultServer: jest.fn(),
  getConnectedServers: jest.fn(),
  getServerInfo: jest.fn(),
  validateServerConfig: jest.fn(),
  testServerConnection: jest.fn(),
  getServerMetrics: jest.fn(),
  getServerLogs: jest.fn(),
  restartServerConnection: jest.fn(),
  getServerHealth: jest.fn(),
  exportServerConfig: jest.fn(),
  importServerConfig: jest.fn(),
  getServerStatistics: jest.fn(),
  cleanupDisconnectedServers: jest.fn()
};

jest.mock('../../rancher/server-manager', () => ({
  ServerManager: jest.fn(() => mockServerManagerInstance)
}));

describe('ToolHandlers', () => {
  let toolHandlers: ToolHandlers;
  let mockRancherManager: any;
  let mockFleetHandlers: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup mock server manager methods
    mockServerManagerInstance.getServerStatus.mockResolvedValue({ status: 'healthy' });
    mockServerManagerInstance.pingServer.mockResolvedValue(true);
    mockServerManagerInstance.pingAllServers.mockResolvedValue(new Map([['test-server', true]]));
    mockServerManagerInstance.connectToServer.mockResolvedValue({ success: true });
    mockServerManagerInstance.disconnectFromServer.mockResolvedValue({ success: true });
    mockServerManagerInstance.addServer.mockReturnValue(true);
    mockServerManagerInstance.removeServer.mockReturnValue(true);
    mockServerManagerInstance.updateServer.mockReturnValue(true);
    mockServerManagerInstance.setDefaultServer.mockReturnValue(true);
    mockServerManagerInstance.getConnectedServers.mockReturnValue(['test-server']);
    mockServerManagerInstance.getServerInfo.mockResolvedValue({ name: 'test-server', url: 'http://test' });
    mockServerManagerInstance.validateServerConfig.mockReturnValue({ valid: true });
    mockServerManagerInstance.testServerConnection.mockResolvedValue({ success: true });
    mockServerManagerInstance.getServerMetrics.mockResolvedValue({ cpu: 50, memory: 60 });
    mockServerManagerInstance.getServerLogs.mockResolvedValue(['log1', 'log2']);
    mockServerManagerInstance.restartServerConnection.mockResolvedValue({ success: true });
    mockServerManagerInstance.getServerHealth.mockResolvedValue({ status: 'healthy' });
    mockServerManagerInstance.exportServerConfig.mockReturnValue({ config: {} });
    mockServerManagerInstance.importServerConfig.mockReturnValue({ success: true });
    mockServerManagerInstance.getServerStatistics.mockResolvedValue({ requests: 100 });
    mockServerManagerInstance.cleanupDisconnectedServers.mockResolvedValue({ cleaned: 2 });

    // Create mock fleet handlers
    mockFleetHandlers = {
      fleet_list_bundles: jest.fn(),
      fleet_get_bundle: jest.fn(),
      fleet_create_bundle: jest.fn(),
      fleet_update_bundle: jest.fn(),
      fleet_delete_bundle: jest.fn(),
      fleet_force_sync_bundle: jest.fn(),
      fleet_list_git_repos: jest.fn(),
      fleet_get_git_repo: jest.fn(),
      fleet_create_git_repo: jest.fn(),
      fleet_update_git_repo: jest.fn(),
      fleet_delete_git_repo: jest.fn(),
      fleet_list_clusters: jest.fn(),
      fleet_get_cluster: jest.fn(),
      fleet_list_workspaces: jest.fn(),
      fleet_get_deployment_status: jest.fn(),
      fleet_get_logs: jest.fn()
    };

    // Mock FleetHandlers constructor
    (FleetHandlers as jest.MockedClass<typeof FleetHandlers>).mockImplementation(() => mockFleetHandlers);

    // Create mock rancher manager
    mockRancherManager = {
      clusters: {
        getClusters: jest.fn(),
        getAllClusters: jest.fn(),
        getCluster: jest.fn(),
        createCluster: jest.fn(),
        deleteCluster: jest.fn(),
        getClusterStatus: jest.fn(),
        getClusterMetrics: jest.fn(),
        getClusterEvents: jest.fn(),
        getClusterLogs: jest.fn(),
        createAWSCluster: jest.fn(),
        createAzureCluster: jest.fn(),
        createGCPCluster: jest.fn(),
        createVSphereCluster: jest.fn(),
        getProviders: jest.fn(),
        getClusterTemplates: jest.fn(),
        createClusterFromTemplate: jest.fn(),
        updateClusterConfig: jest.fn(),
        getClusterStats: jest.fn(),
        getClusterKubeconfig: jest.fn()
      },
      projects: {
        getProjects: jest.fn(),
        getAllProjects: jest.fn(),
        getProject: jest.fn(),
        createProject: jest.fn(),
        deleteProject: jest.fn()
      },
      applications: {
        getApplications: jest.fn(),
        getAllApplications: jest.fn(),
        getApplication: jest.fn(),
        createApplication: jest.fn(),
        deleteApplication: jest.fn()
      },
      users: {
        getUsers: jest.fn(),
        getUser: jest.fn(),
        createUser: jest.fn(),
        deleteUser: jest.fn()
      },
      monitoring: {
        getMetrics: jest.fn(),
        getAlerts: jest.fn(),
        createAlert: jest.fn()
      },
      backup: {
        createBackup: jest.fn(),
        getBackups: jest.fn(),
        restoreBackup: jest.fn()
      },
      nodes: {
        getNodes: jest.fn(),
        getNode: jest.fn()
      },
      storage: {
        getStorageClasses: jest.fn(),
        getPersistentVolumes: jest.fn()
      },
      network: {
        getServices: jest.fn(),
        getIngresses: jest.fn()
      },
      security: {
        getRoles: jest.fn(),
        getRoleBindings: jest.fn(),
        createRoleBinding: jest.fn()
      },
      catalog: {
        getCatalogs: jest.fn(),
        getCatalogTemplates: jest.fn()
      },
      workloads: {
        getWorkloads: jest.fn(),
        getWorkload: jest.fn(),
        createWorkload: jest.fn(),
        updateWorkload: jest.fn(),
        deleteWorkload: jest.fn()
      },
      config: {
        getSettings: jest.fn(),
        updateSetting: jest.fn()
      },
      events: {
        getEvents: jest.fn()
      },
      logs: {
        getLogs: jest.fn()
      },
      policies: {
        getPolicies: jest.fn(),
        createPolicy: jest.fn()
      },
      quotas: {
        getQuotas: jest.fn(),
        createQuota: jest.fn()
      },
      namespaces: {
        getNamespaces: jest.fn(),
        getNamespace: jest.fn(),
        createNamespace: jest.fn(),
        deleteNamespace: jest.fn()
      },
      servers: {
        listServers: jest.fn(),
        getServerStatus: jest.fn(),
        pingServer: jest.fn(),
        connectServer: jest.fn(),
        disconnectServer: jest.fn(),
        addServer: jest.fn(),
        removeServer: jest.fn(),
        updateServer: jest.fn()
      },
      getConfigManager: jest.fn().mockReturnValue({
        getServerNames: jest.fn().mockReturnValue(['test-server', 'test-server-2']),
        validateConfig: jest.fn().mockReturnValue({ valid: true, errors: [] }),
        getLogLevel: jest.fn().mockReturnValue('info'),
        getEnableFileLogging: jest.fn().mockReturnValue(true),
        getLogDirectory: jest.fn().mockReturnValue('/logs')
      }),
      configManager: {
        getServerNames: jest.fn().mockReturnValue(['test-server', 'test-server-2']),
        validateConfig: jest.fn().mockReturnValue({ valid: true, errors: [] }),
        getLogLevel: jest.fn().mockReturnValue('info'),
        getEnableFileLogging: jest.fn().mockReturnValue(true),
        getLogDirectory: jest.fn().mockReturnValue('/logs')
      }
    };

    toolHandlers = new ToolHandlers(mockRancherManager);
  });

  describe('constructor', () => {
    it('should initialize with rancher manager and fleet handlers', () => {
      expect(FleetHandlers).toHaveBeenCalledWith(mockRancherManager);
    });
  });

  describe('Cluster handlers', () => {
    it('should list clusters for specific server', async () => {
      const mockClusters = [{ id: 'cluster-1', name: 'test-cluster' }];
      mockRancherManager.clusters.getClusters.mockResolvedValue(mockClusters);

      const result = await toolHandlers.rancher_list_clusters({ serverName: 'test-server' });

      expect(mockRancherManager.clusters.getClusters).toHaveBeenCalledWith('test-server');
      expect(result).toEqual({
        clusters: mockClusters,
        server: 'test-server'
      });
    });

    it('should list all clusters when no server specified', async () => {
      const mockAllClusters = [
        { id: 'cluster-1', name: 'test-cluster-1', server: 'server-1' },
        { id: 'cluster-2', name: 'test-cluster-2', server: 'server-2' }
      ];
      mockRancherManager.clusters.getAllClusters.mockResolvedValue(mockAllClusters);

      const result = await toolHandlers.rancher_list_clusters({});

      expect(mockRancherManager.clusters.getAllClusters).toHaveBeenCalled();
      expect(result).toEqual({
        clusters: mockAllClusters
      });
    });

    it('should get cluster', async () => {
      const mockCluster = { id: 'cluster-1', name: 'test-cluster' };
      mockRancherManager.clusters.getCluster.mockResolvedValue(mockCluster);

      const result = await toolHandlers.rancher_get_cluster({
        serverName: 'test-server',
        clusterId: 'cluster-1'
      });

      expect(mockRancherManager.clusters.getCluster).toHaveBeenCalledWith('test-server', 'cluster-1');
      expect(result).toEqual(mockCluster);
    });

    it('should create cluster', async () => {
      const mockCluster = { id: 'new-cluster', name: 'new-cluster' };
      mockRancherManager.clusters.createCluster.mockResolvedValue(mockCluster);

      const args = {
        serverName: 'test-server',
        name: 'new-cluster',
        provider: 'aws',
        config: {
          region: 'us-west-2',
          instanceType: 't3.medium'
        }
      };

      const result = await toolHandlers.rancher_create_cluster(args);

      expect(mockRancherManager.clusters.createCluster).toHaveBeenCalledWith('test-server', {
        name: 'new-cluster',
        type: 'cluster',
        provider: 'aws',
        region: 'us-west-2',
        instanceType: 't3.medium'
      });
      expect(result).toEqual(mockCluster);
    });

    it('should delete cluster', async () => {
      const mockResult = { success: true };
      mockRancherManager.clusters.deleteCluster.mockResolvedValue(mockResult);

      const result = await toolHandlers.rancher_delete_cluster({
        serverName: 'test-server',
        clusterId: 'cluster-1'
      });

      expect(mockRancherManager.clusters.deleteCluster).toHaveBeenCalledWith('test-server', 'cluster-1');
      expect(result).toEqual(mockResult);
    });

    it('should get cluster status', async () => {
      const mockStatus = { state: 'active', ready: true };
      mockRancherManager.clusters.getClusterStatus.mockResolvedValue(mockStatus);

      const result = await toolHandlers.rancher_get_cluster_status({
        serverName: 'test-server',
        clusterId: 'cluster-1'
      });

      expect(mockRancherManager.clusters.getClusterStatus).toHaveBeenCalledWith('test-server', 'cluster-1');
      expect(result).toEqual(mockStatus);
    });

    it('should get cluster metrics', async () => {
      const mockMetrics = { cpu: 50, memory: 60 };
      mockRancherManager.clusters.getClusterMetrics.mockResolvedValue(mockMetrics);

      const result = await toolHandlers.rancher_get_cluster_metrics({
        serverName: 'test-server',
        clusterId: 'cluster-1'
      });

      expect(mockRancherManager.clusters.getClusterMetrics).toHaveBeenCalledWith('test-server', 'cluster-1');
      expect(result).toEqual(mockMetrics);
    });

    it('should get cluster events', async () => {
      const mockEvents = [{ type: 'Normal', message: 'Cluster ready' }];
      mockRancherManager.clusters.getClusterEvents.mockResolvedValue(mockEvents);

      const result = await toolHandlers.rancher_get_cluster_events({
        serverName: 'test-server',
        clusterId: 'cluster-1'
      });

      expect(mockRancherManager.clusters.getClusterEvents).toHaveBeenCalledWith('test-server', 'cluster-1');
      expect(result).toEqual(mockEvents);
    });

    it('should get cluster logs', async () => {
      const mockLogs = ['log1', 'log2'];
      mockRancherManager.clusters.getClusterLogs.mockResolvedValue(mockLogs);

      const result = await toolHandlers.rancher_get_cluster_logs({
        serverName: 'test-server',
        clusterId: 'cluster-1'
      });

      expect(mockRancherManager.clusters.getClusterLogs).toHaveBeenCalledWith('test-server', 'cluster-1');
      expect(result).toEqual(mockLogs);
    });

    it('should create AWS cluster', async () => {
      const mockCluster = { id: 'aws-cluster', name: 'aws-cluster' };
      mockRancherManager.clusters.createAWSCluster.mockResolvedValue(mockCluster);

      const result = await toolHandlers.rancher_create_aws_cluster({
        serverName: 'test-server',
        name: 'aws-cluster',
        region: 'us-west-2',
        instanceType: 't3.medium',
        nodeCount: 3
      });

      expect(mockRancherManager.clusters.createAWSCluster).toHaveBeenCalledWith(
        'test-server',
        'aws-cluster',
        'us-west-2',
        't3.medium',
        3
      );
      expect(result).toEqual(mockCluster);
    });

    it('should create Azure cluster', async () => {
      const mockCluster = { id: 'azure-cluster', name: 'azure-cluster' };
      mockRancherManager.clusters.createAzureCluster.mockResolvedValue(mockCluster);

      const result = await toolHandlers.rancher_create_azure_cluster({
        serverName: 'test-server',
        name: 'azure-cluster',
        location: 'eastus',
        vmSize: 'Standard_D2s_v3',
        nodeCount: 3
      });

      expect(mockRancherManager.clusters.createAzureCluster).toHaveBeenCalledWith(
        'test-server',
        'azure-cluster',
        'eastus',
        'Standard_D2s_v3',
        3
      );
      expect(result).toEqual(mockCluster);
    });

    it('should create GCP cluster', async () => {
      const mockCluster = { id: 'gcp-cluster', name: 'gcp-cluster' };
      mockRancherManager.clusters.createGCPCluster.mockResolvedValue(mockCluster);

      const result = await toolHandlers.rancher_create_gcp_cluster({
        serverName: 'test-server',
        name: 'gcp-cluster',
        zone: 'us-central1-a',
        machineType: 'n1-standard-2',
        nodeCount: 3
      });

      expect(mockRancherManager.clusters.createGCPCluster).toHaveBeenCalledWith(
        'test-server',
        'gcp-cluster',
        'us-central1-a',
        'n1-standard-2',
        3
      );
      expect(result).toEqual(mockCluster);
    });

    it('should create vSphere cluster', async () => {
      const mockCluster = { id: 'vsphere-cluster', name: 'vsphere-cluster' };
      mockRancherManager.clusters.createVSphereCluster.mockResolvedValue(mockCluster);

      const result = await toolHandlers.rancher_create_vsphere_cluster({
        serverName: 'test-server',
        name: 'vsphere-cluster',
        datacenter: 'dc1',
        datastore: 'ds1',
        nodeCount: 3
      });

      expect(mockRancherManager.clusters.createVSphereCluster).toHaveBeenCalledWith(
        'test-server',
        'vsphere-cluster',
        'dc1',
        'ds1',
        3
      );
      expect(result).toEqual(mockCluster);
    });

    it('should get cluster providers', async () => {
      const mockProviders = ['aws', 'azure', 'gcp'];
      mockRancherManager.clusters.getProviders.mockResolvedValue(mockProviders);

      const result = await toolHandlers.rancher_get_cluster_providers({
        serverName: 'test-server'
      });

      expect(mockRancherManager.clusters.getProviders).toHaveBeenCalledWith('test-server');
      expect(result).toEqual(mockProviders);
    });

    it('should get cluster templates', async () => {
      const mockTemplates = [{ id: 'template-1', name: 'template-1' }];
      mockRancherManager.clusters.getClusterTemplates.mockResolvedValue(mockTemplates);

      const result = await toolHandlers.rancher_get_cluster_templates({
        serverName: 'test-server'
      });

      expect(mockRancherManager.clusters.getClusterTemplates).toHaveBeenCalledWith('test-server');
      expect(result).toEqual(mockTemplates);
    });

    it('should create cluster from template', async () => {
      const mockCluster = { id: 'template-cluster', name: 'template-cluster' };
      mockRancherManager.clusters.createClusterFromTemplate.mockResolvedValue(mockCluster);

      const result = await toolHandlers.rancher_create_cluster_from_template({
        serverName: 'test-server',
        templateId: 'template-1',
        name: 'template-cluster',
        config: { region: 'us-west-2' }
      });

      expect(mockRancherManager.clusters.createClusterFromTemplate).toHaveBeenCalledWith(
        'test-server',
        'template-1',
        'template-cluster',
        { region: 'us-west-2' }
      );
      expect(result).toEqual(mockCluster);
    });

    it('should update cluster config', async () => {
      const mockResult = { success: true };
      mockRancherManager.clusters.updateClusterConfig.mockResolvedValue(mockResult);

      const result = await toolHandlers.rancher_update_cluster_config({
        serverName: 'test-server',
        clusterId: 'cluster-1',
        config: { region: 'us-east-1' }
      });

      expect(mockRancherManager.clusters.updateClusterConfig).toHaveBeenCalledWith(
        'test-server',
        'cluster-1',
        { region: 'us-east-1' }
      );
      expect(result).toEqual(mockResult);
    });

    it('should get cluster stats', async () => {
      const mockStats = { nodes: 3, pods: 10 };
      mockRancherManager.clusters.getClusterStats.mockResolvedValue(mockStats);

      const result = await toolHandlers.rancher_get_cluster_stats({
        serverName: 'test-server',
        clusterId: 'cluster-1'
      });

      expect(mockRancherManager.clusters.getClusterStats).toHaveBeenCalledWith('test-server', 'cluster-1');
      expect(result).toEqual(mockStats);
    });

    it('should get cluster kubeconfig', async () => {
      const mockKubeconfig = 'apiVersion: v1\nkind: Config';
      mockRancherManager.clusters.getClusterKubeconfig.mockResolvedValue(mockKubeconfig);

      const result = await toolHandlers.rancher_get_cluster_kubeconfig({
        serverName: 'test-server',
        clusterId: 'cluster-1',
        format: 'yaml'
      });

      expect(mockRancherManager.clusters.getClusterKubeconfig).toHaveBeenCalledWith(
        'test-server',
        'cluster-1',
        'yaml'
      );
      expect(result).toEqual(mockKubeconfig);
    });
  });

  describe('Project handlers', () => {
    it('should list projects for specific cluster', async () => {
      const mockProjects = [{ id: 'project-1', name: 'test-project' }];
      mockRancherManager.projects.getProjects.mockResolvedValue(mockProjects);

      const result = await toolHandlers.rancher_list_projects({
        serverName: 'test-server',
        clusterId: 'cluster-1'
      });

      expect(mockRancherManager.projects.getProjects).toHaveBeenCalledWith('test-server', 'cluster-1');
      expect(result).toEqual(mockProjects);
    });

    it('should list all projects when no cluster specified', async () => {
      const mockAllProjects = [{ id: 'project-1', name: 'test-project' }];
      mockRancherManager.projects.getProjects.mockResolvedValue(mockAllProjects);

      const result = await toolHandlers.rancher_list_projects({
        serverName: 'test-server'
      });

      expect(mockRancherManager.projects.getProjects).toHaveBeenCalledWith('test-server', undefined);
      expect(result).toEqual(mockAllProjects);
    });

    it('should get project', async () => {
      const mockProject = { id: 'project-1', name: 'test-project' };
      mockRancherManager.projects.getProject.mockResolvedValue(mockProject);

      const result = await toolHandlers.rancher_get_project({
        serverName: 'test-server',
        projectId: 'project-1'
      });

      expect(mockRancherManager.projects.getProject).toHaveBeenCalledWith('test-server', 'project-1');
      expect(result).toEqual(mockProject);
    });

    it('should create project', async () => {
      const mockProject = { id: 'new-project', name: 'new-project' };
      mockRancherManager.projects.createProject.mockResolvedValue(mockProject);

      const args = {
        serverName: 'test-server',
        name: 'new-project',
        clusterId: 'cluster-1',
        description: 'Test project'
      };

      const result = await toolHandlers.rancher_create_project(args);

      expect(mockRancherManager.projects.createProject).toHaveBeenCalledWith('test-server', {
        name: 'new-project',
        clusterId: 'cluster-1',
        description: 'Test project'
      });
      expect(result).toEqual(mockProject);
    });

    it('should delete project', async () => {
      const mockResult = { success: true };
      mockRancherManager.projects.deleteProject.mockResolvedValue(mockResult);

      const result = await toolHandlers.rancher_delete_project({
        serverName: 'test-server',
        projectId: 'project-1'
      });

      expect(mockRancherManager.projects.deleteProject).toHaveBeenCalledWith('test-server', 'project-1');
      expect(result).toEqual(mockResult);
    });
  });

  describe('Application handlers', () => {
    it('should list applications', async () => {
      const mockApplications = [{ id: 'app-1', name: 'test-app' }];
      mockRancherManager.applications.getApplications.mockResolvedValue(mockApplications);

      const result = await toolHandlers.rancher_list_applications({
        serverName: 'test-server',
        projectId: 'project-1'
      });

      expect(mockRancherManager.applications.getApplications).toHaveBeenCalledWith('test-server', 'project-1');
      expect(result).toEqual(mockApplications);
    });

    it('should get application', async () => {
      const mockApplication = { id: 'app-1', name: 'test-app' };
      mockRancherManager.applications.getApplication.mockResolvedValue(mockApplication);

      const result = await toolHandlers.rancher_get_application({
        serverName: 'test-server',
        appId: 'app-1'
      });

      expect(mockRancherManager.applications.getApplication).toHaveBeenCalledWith('test-server', 'app-1');
      expect(result).toEqual(mockApplication);
    });

    it('should create application', async () => {
      const mockApplication = { id: 'new-app', name: 'new-app' };
      mockRancherManager.applications.createApplication.mockResolvedValue(mockApplication);

      const args = {
        serverName: 'test-server',
        name: 'new-app',
        projectId: 'project-1',
        templateId: 'template-1',
        values: { replicas: 3 }
      };

      const result = await toolHandlers.rancher_create_application(args);

      expect(mockRancherManager.applications.createApplication).toHaveBeenCalledWith('test-server', {
        name: 'new-app',
        projectId: 'project-1',
        templateId: 'template-1',
        values: { replicas: 3 }
      });
      expect(result).toEqual(mockApplication);
    });

    it('should delete application', async () => {
      const mockResult = { success: true };
      mockRancherManager.applications.deleteApplication.mockResolvedValue(mockResult);

      const result = await toolHandlers.rancher_delete_application({
        serverName: 'test-server',
        appId: 'app-1'
      });

      expect(mockRancherManager.applications.deleteApplication).toHaveBeenCalledWith('test-server', 'app-1');
      expect(result).toEqual(mockResult);
    });
  });

  describe('Server handlers', () => {
    it('should list servers', async () => {
      const mockServers = [{ name: 'server-1', status: 'connected' }];
      mockRancherManager.servers.listServers.mockResolvedValue(mockServers);

      const result = await toolHandlers.rancher_list_servers();

      expect(mockRancherManager.getConfigManager).toHaveBeenCalled();
      expect(result).toEqual({ servers: ['test-server', 'test-server-2'] });
    });

    it('should get server status', async () => {
      const result = await toolHandlers.rancher_get_server_status({
        serverName: 'server-1'
      });

      expect(mockServerManagerInstance.getServerStatus).toHaveBeenCalledWith('server-1');
      expect(result).toEqual({ status: 'healthy' });
    });

    it('should ping server', async () => {
      const result = await toolHandlers.rancher_ping_server({
        serverName: 'server-1'
      });

      expect(mockServerManagerInstance.pingServer).toHaveBeenCalledWith('server-1');
      expect(result).toEqual({ serverName: 'server-1', isAlive: true });
    });

    it('should ping all servers', async () => {
      const result = await toolHandlers.rancher_ping_all_servers();

      expect(mockServerManagerInstance.pingAllServers).toHaveBeenCalled();
      expect(result).toEqual({ results: { 'test-server': true } });
    });

    it('should connect server', async () => {
      const args = {
        name: 'new-server',
        url: 'https://rancher.example.com',
        token: 'test-token',
        insecure: false
      };

      const result = await toolHandlers.rancher_connect_server(args);

      expect(mockServerManagerInstance.connectToServer).toHaveBeenCalledWith(args);
      expect(result).toEqual({ success: true });
    });

    it('should disconnect server', async () => {
      const result = await toolHandlers.rancher_disconnect_server({
        serverName: 'server-1'
      });

      expect(mockServerManagerInstance.disconnectFromServer).toHaveBeenCalledWith('server-1');
      expect(result).toEqual({ success: true });
    });

    it('should add server', async () => {
      const args = {
        name: 'new-server',
        url: 'https://rancher.example.com',
        token: 'test-token'
      };

      const result = await toolHandlers.rancher_add_server(args);

      expect(mockServerManagerInstance.addServer).toHaveBeenCalledWith(args);
      expect(result).toEqual({ success: true, serverName: 'new-server' });
    });

    it('should remove server', async () => {
      const result = await toolHandlers.rancher_remove_server({
        serverName: 'server-1'
      });

      expect(mockServerManagerInstance.removeServer).toHaveBeenCalledWith('server-1');
      expect(result).toEqual({ success: true, serverName: 'server-1' });
    });

    it('should update server', async () => {
      const args = {
        serverName: 'server-1',
        url: 'https://new-rancher.example.com',
        token: 'new-token'
      };

      const result = await toolHandlers.rancher_update_server(args);

      expect(mockServerManagerInstance.updateServer).toHaveBeenCalledWith('server-1', {
        url: 'https://new-rancher.example.com',
        token: 'new-token'
      });
      expect(result).toEqual({ success: true, serverName: 'server-1' });
    });

    it('should set default server', async () => {
      const result = await toolHandlers.rancher_set_default_server({
        serverName: 'server-1'
      });

      expect(mockServerManagerInstance.setDefaultServer).toHaveBeenCalledWith('server-1');
      expect(result).toEqual({ success: true, serverName: 'server-1' });
    });

    it('should get connected servers', async () => {
      const result = await toolHandlers.rancher_get_connected_servers();

      expect(mockServerManagerInstance.getConnectedServers).toHaveBeenCalled();
      expect(result).toEqual({ connectedServers: ['test-server'] });
    });

    it('should get server info', async () => {
      const result = await toolHandlers.rancher_get_server_info({
        serverName: 'server-1'
      });

      expect(mockServerManagerInstance.getServerInfo).toHaveBeenCalledWith('server-1');
      expect(result).toEqual({ name: 'test-server', url: 'http://test' });
    });

    it('should validate server config', async () => {
      const result = await toolHandlers.rancher_validate_server_config({
        serverName: 'server-1'
      });

      expect(mockServerManagerInstance.validateServerConfig).toHaveBeenCalledWith('server-1');
      expect(result).toEqual({ valid: true });
    });

    it('should test server connection', async () => {
      const result = await toolHandlers.rancher_test_server_connection({
        serverName: 'server-1'
      });

      expect(mockServerManagerInstance.testServerConnection).toHaveBeenCalledWith('server-1');
      expect(result).toEqual({ success: true });
    });

    it('should get server metrics', async () => {
      const result = await toolHandlers.rancher_get_server_metrics({
        serverName: 'server-1'
      });

      expect(mockServerManagerInstance.getServerMetrics).toHaveBeenCalledWith('server-1');
      expect(result).toEqual({ cpu: 50, memory: 60 });
    });

    it('should get server logs', async () => {
      const result = await toolHandlers.rancher_get_server_logs({
        serverName: 'server-1',
        lines: 100,
        level: 'info'
      });

      expect(mockServerManagerInstance.getServerLogs).toHaveBeenCalledWith('server-1', {
        lines: 100,
        level: 'info'
      });
      expect(result).toEqual(['log1', 'log2']);
    });

    it('should restart server connection', async () => {
      const result = await toolHandlers.rancher_restart_server_connection({
        serverName: 'server-1'
      });

      expect(mockServerManagerInstance.restartServerConnection).toHaveBeenCalledWith('server-1');
      expect(result).toEqual({ success: true });
    });

    it('should get server health', async () => {
      const result = await toolHandlers.rancher_get_server_health({
        serverName: 'server-1'
      });

      expect(mockServerManagerInstance.getServerHealth).toHaveBeenCalledWith('server-1');
      expect(result).toEqual({ status: 'healthy' });
    });

    it('should export server config', async () => {
      const result = await toolHandlers.rancher_export_server_config({
        format: 'json',
        includePasswords: false
      });

      expect(mockServerManagerInstance.exportServerConfig).toHaveBeenCalledWith('json', false);
      expect(result).toEqual({ config: {} });
    });

    it('should import server config', async () => {
      const result = await toolHandlers.rancher_import_server_config({
        config: { servers: [] },
        overwrite: false
      });

      expect(mockServerManagerInstance.importServerConfig).toHaveBeenCalledWith({ servers: [] }, false);
      expect(result).toEqual({ success: true });
    });

    it('should get server statistics', async () => {
      const result = await toolHandlers.rancher_get_server_statistics({
        period: '24h'
      });

      expect(mockServerManagerInstance.getServerStatistics).toHaveBeenCalledWith('24h');
      expect(result).toEqual({ requests: 100 });
    });

    it('should cleanup disconnected servers', async () => {
      const result = await toolHandlers.rancher_cleanup_disconnected_servers({
        force: false
      });

      expect(mockServerManagerInstance.cleanupDisconnectedServers).toHaveBeenCalledWith(false);
      expect(result).toEqual({ cleaned: 2 });
    });
  });

  describe('User handlers', () => {
    it('should list users', async () => {
      const mockUsers = [{ id: 'user-1', username: 'test-user' }];
      mockRancherManager.users.getUsers.mockResolvedValue(mockUsers);

      const result = await toolHandlers.rancher_list_users({
        serverName: 'test-server'
      });

      expect(mockRancherManager.users.getUsers).toHaveBeenCalledWith('test-server');
      expect(result).toEqual(mockUsers);
    });

    it('should get user', async () => {
      const mockUser = { id: 'user-1', username: 'test-user' };
      mockRancherManager.users.getUser.mockResolvedValue(mockUser);

      const result = await toolHandlers.rancher_get_user({
        serverName: 'test-server',
        userId: 'user-1'
      });

      expect(mockRancherManager.users.getUser).toHaveBeenCalledWith('test-server', 'user-1');
      expect(result).toEqual(mockUser);
    });

    it('should create user', async () => {
      const mockUser = { id: 'new-user', username: 'new-user' };
      mockRancherManager.users.createUser.mockResolvedValue(mockUser);

      const args = {
        serverName: 'test-server',
        username: 'new-user',
        password: 'password123',
        name: 'New User',
        email: 'new@example.com'
      };

      const result = await toolHandlers.rancher_create_user(args);

      expect(mockRancherManager.users.createUser).toHaveBeenCalledWith('test-server', {
        username: 'new-user',
        password: 'password123',
        name: 'New User',
        email: 'new@example.com'
      });
      expect(result).toEqual(mockUser);
    });

    it('should delete user', async () => {
      const mockResult = { success: true };
      mockRancherManager.users.deleteUser.mockResolvedValue(mockResult);

      const result = await toolHandlers.rancher_delete_user({
        serverName: 'test-server',
        userId: 'user-1'
      });

      expect(mockRancherManager.users.deleteUser).toHaveBeenCalledWith('test-server', 'user-1');
      expect(result).toEqual(mockResult);
    });
  });

  describe('Monitoring handlers', () => {
    it('should get metrics', async () => {
      const mockMetrics = { cpu: 50, memory: 60 };
      mockRancherManager.monitoring.getMetrics.mockResolvedValue(mockMetrics);

      const result = await toolHandlers.rancher_get_metrics({
        serverName: 'test-server',
        resourceType: 'cluster',
        resourceId: 'cluster-1'
      });

      expect(mockRancherManager.monitoring.getMetrics).toHaveBeenCalledWith(
        'test-server',
        'cluster',
        'cluster-1'
      );
      expect(result).toEqual(mockMetrics);
    });

    it('should list alerts', async () => {
      const mockAlerts = [{ id: 'alert-1', name: 'High CPU' }];
      mockRancherManager.monitoring.getAlerts.mockResolvedValue(mockAlerts);

      const result = await toolHandlers.rancher_list_alerts({
        serverName: 'test-server'
      });

      expect(mockRancherManager.monitoring.getAlerts).toHaveBeenCalledWith('test-server');
      expect(result).toEqual(mockAlerts);
    });

    it('should create alert', async () => {
      const mockAlert = { id: 'new-alert', name: 'New Alert' };
      mockRancherManager.monitoring.createAlert.mockResolvedValue(mockAlert);

      const args = {
        serverName: 'test-server',
        name: 'New Alert',
        condition: 'cpu > 80',
        severity: 'warning'
      };

      const result = await toolHandlers.rancher_create_alert(args);

      expect(mockRancherManager.monitoring.createAlert).toHaveBeenCalledWith('test-server', {
        name: 'New Alert',
        condition: 'cpu > 80',
        severity: 'warning'
      });
      expect(result).toEqual(mockAlert);
    });
  });

  describe('Backup handlers', () => {
    it('should create backup', async () => {
      const mockBackup = { id: 'backup-1', name: 'backup-1' };
      mockRancherManager.backup.createBackup.mockResolvedValue(mockBackup);

      const args = {
        serverName: 'test-server',
        name: 'backup-1',
        clusterId: 'cluster-1'
      };

      const result = await toolHandlers.rancher_create_backup(args);

      expect(mockRancherManager.backup.createBackup).toHaveBeenCalledWith('test-server', {
        name: 'backup-1',
        clusterId: 'cluster-1'
      });
      expect(result).toEqual(mockBackup);
    });

    it('should list backups', async () => {
      const mockBackups = [{ id: 'backup-1', name: 'backup-1' }];
      mockRancherManager.backup.getBackups.mockResolvedValue(mockBackups);

      const result = await toolHandlers.rancher_list_backups({
        serverName: 'test-server'
      });

      expect(mockRancherManager.backup.getBackups).toHaveBeenCalledWith('test-server');
      expect(result).toEqual(mockBackups);
    });

    it('should restore backup', async () => {
      const mockResult = { success: true };
      mockRancherManager.backup.restoreBackup.mockResolvedValue(mockResult);

      const args = {
        serverName: 'test-server',
        backupId: 'backup-1',
        clusterId: 'cluster-1'
      };

      const result = await toolHandlers.rancher_restore_backup(args);

      expect(mockRancherManager.backup.restoreBackup).toHaveBeenCalledWith(
        'test-server',
        'backup-1',
        { clusterId: 'cluster-1' }
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('Node handlers', () => {
    it('should list nodes', async () => {
      const mockNodes = [{ id: 'node-1', name: 'node-1' }];
      mockRancherManager.nodes.getNodes.mockResolvedValue(mockNodes);

      const result = await toolHandlers.rancher_list_nodes({
        serverName: 'test-server',
        clusterId: 'cluster-1'
      });

      expect(mockRancherManager.nodes.getNodes).toHaveBeenCalledWith('test-server', 'cluster-1');
      expect(result).toEqual(mockNodes);
    });

    it('should get node', async () => {
      const mockNode = { id: 'node-1', name: 'node-1' };
      mockRancherManager.nodes.getNode.mockResolvedValue(mockNode);

      const result = await toolHandlers.rancher_get_node({
        serverName: 'test-server',
        nodeId: 'node-1'
      });

      expect(mockRancherManager.nodes.getNode).toHaveBeenCalledWith('test-server', 'node-1');
      expect(result).toEqual(mockNode);
    });
  });

  describe('Storage handlers', () => {
    it('should list storage classes', async () => {
      const mockStorageClasses = [{ id: 'sc-1', name: 'fast-ssd' }];
      mockRancherManager.storage.getStorageClasses.mockResolvedValue(mockStorageClasses);

      const result = await toolHandlers.rancher_list_storage_classes({
        serverName: 'test-server',
        clusterId: 'cluster-1'
      });

      expect(mockRancherManager.storage.getStorageClasses).toHaveBeenCalledWith('test-server', 'cluster-1');
      expect(result).toEqual(mockStorageClasses);
    });

    it('should list persistent volumes', async () => {
      const mockPVs = [{ id: 'pv-1', name: 'pv-1' }];
      mockRancherManager.storage.getPersistentVolumes.mockResolvedValue(mockPVs);

      const result = await toolHandlers.rancher_list_persistent_volumes({
        serverName: 'test-server',
        clusterId: 'cluster-1'
      });

      expect(mockRancherManager.storage.getPersistentVolumes).toHaveBeenCalledWith('test-server', 'cluster-1');
      expect(result).toEqual(mockPVs);
    });
  });

  describe('Network handlers', () => {
    it('should list services', async () => {
      const mockServices = [{ id: 'svc-1', name: 'service-1' }];
      mockRancherManager.network.getServices.mockResolvedValue(mockServices);

      const result = await toolHandlers.rancher_list_services({
        serverName: 'test-server',
        clusterId: 'cluster-1'
      });

      expect(mockRancherManager.network.getServices).toHaveBeenCalledWith('test-server', 'cluster-1');
      expect(result).toEqual(mockServices);
    });

    it('should list ingresses', async () => {
      const mockIngresses = [{ id: 'ing-1', name: 'ingress-1' }];
      mockRancherManager.network.getIngresses.mockResolvedValue(mockIngresses);

      const result = await toolHandlers.rancher_list_ingresses({
        serverName: 'test-server',
        clusterId: 'cluster-1'
      });

      expect(mockRancherManager.network.getIngresses).toHaveBeenCalledWith('test-server', 'cluster-1');
      expect(result).toEqual(mockIngresses);
    });
  });

  describe('Security handlers', () => {
    it('should list roles', async () => {
      const mockRoles = [{ id: 'role-1', name: 'admin' }];
      mockRancherManager.security.getRoles.mockResolvedValue(mockRoles);

      const result = await toolHandlers.rancher_list_roles({
        serverName: 'test-server'
      });

      expect(mockRancherManager.security.getRoles).toHaveBeenCalledWith('test-server');
      expect(result).toEqual(mockRoles);
    });

    it('should list role bindings', async () => {
      const mockRoleBindings = [{ id: 'rb-1', name: 'admin-binding' }];
      mockRancherManager.security.getRoleBindings.mockResolvedValue(mockRoleBindings);

      const result = await toolHandlers.rancher_list_role_bindings({
        serverName: 'test-server'
      });

      expect(mockRancherManager.security.getRoleBindings).toHaveBeenCalledWith('test-server');
      expect(result).toEqual(mockRoleBindings);
    });

    it('should create role binding', async () => {
      const mockRoleBinding = { id: 'new-rb', name: 'new-binding' };
      mockRancherManager.security.createRoleBinding.mockResolvedValue(mockRoleBinding);

      const args = {
        serverName: 'test-server',
        name: 'new-binding',
        roleId: 'role-1',
        userId: 'user-1'
      };

      const result = await toolHandlers.rancher_create_role_binding(args);

      expect(mockRancherManager.security.createRoleBinding).toHaveBeenCalledWith('test-server', {
        name: 'new-binding',
        roleId: 'role-1',
        userId: 'user-1'
      });
      expect(result).toEqual(mockRoleBinding);
    });
  });

  describe('Catalog handlers', () => {
    it('should list catalogs', async () => {
      const mockCatalogs = [{ id: 'cat-1', name: 'catalog-1' }];
      mockRancherManager.catalog.getCatalogs.mockResolvedValue(mockCatalogs);

      const result = await toolHandlers.rancher_list_catalogs({
        serverName: 'test-server'
      });

      expect(mockRancherManager.catalog.getCatalogs).toHaveBeenCalledWith('test-server');
      expect(result).toEqual(mockCatalogs);
    });

    it('should get catalog templates', async () => {
      const mockTemplates = [{ id: 'template-1', name: 'template-1' }];
      mockRancherManager.catalog.getCatalogTemplates.mockResolvedValue(mockTemplates);

      const result = await toolHandlers.rancher_get_catalog_templates({
        serverName: 'test-server',
        catalogId: 'cat-1'
      });

      expect(mockRancherManager.catalog.getCatalogTemplates).toHaveBeenCalledWith('test-server', 'cat-1');
      expect(result).toEqual(mockTemplates);
    });
  });

  describe('Workload handlers', () => {
    it('should list workloads', async () => {
      const mockWorkloads = [{ id: 'workload-1', name: 'workload-1' }];
      mockRancherManager.workloads.getWorkloads.mockResolvedValue(mockWorkloads);

      const result = await toolHandlers.rancher_list_workloads({
        serverName: 'test-server',
        projectId: 'project-1'
      });

      expect(mockRancherManager.workloads.getWorkloads).toHaveBeenCalledWith('test-server', 'project-1');
      expect(result).toEqual(mockWorkloads);
    });

    it('should get workload', async () => {
      const mockWorkload = { id: 'workload-1', name: 'workload-1' };
      mockRancherManager.workloads.getWorkload.mockResolvedValue(mockWorkload);

      const result = await toolHandlers.rancher_get_workload({
        serverName: 'test-server',
        workloadId: 'workload-1'
      });

      expect(mockRancherManager.workloads.getWorkload).toHaveBeenCalledWith('test-server', 'workload-1');
      expect(result).toEqual(mockWorkload);
    });

    it('should create workload', async () => {
      const mockWorkload = { id: 'new-workload', name: 'new-workload' };
      mockRancherManager.workloads.createWorkload.mockResolvedValue(mockWorkload);

      const args = {
        serverName: 'test-server',
        name: 'new-workload',
        projectId: 'project-1',
        type: 'deployment',
        containers: [{ name: 'container-1', image: 'nginx' }]
      };

      const result = await toolHandlers.rancher_create_workload(args);

      expect(mockRancherManager.workloads.createWorkload).toHaveBeenCalledWith('test-server', {
        name: 'new-workload',
        projectId: 'project-1',
        type: 'deployment',
        containers: [{ name: 'container-1', image: 'nginx' }]
      });
      expect(result).toEqual(mockWorkload);
    });

    it('should update workload', async () => {
      const mockResult = { success: true };
      mockRancherManager.workloads.updateWorkload.mockResolvedValue(mockResult);

      const result = await toolHandlers.rancher_update_workload({
        serverName: 'test-server',
        workloadId: 'workload-1',
        data: { replicas: 3 }
      });

      expect(mockRancherManager.workloads.updateWorkload).toHaveBeenCalledWith(
        'test-server',
        'workload-1',
        { replicas: 3 }
      );
      expect(result).toEqual(mockResult);
    });

    it('should delete workload', async () => {
      const mockResult = { success: true };
      mockRancherManager.workloads.deleteWorkload.mockResolvedValue(mockResult);

      const result = await toolHandlers.rancher_delete_workload({
        serverName: 'test-server',
        workloadId: 'workload-1'
      });

      expect(mockRancherManager.workloads.deleteWorkload).toHaveBeenCalledWith('test-server', 'workload-1');
      expect(result).toEqual(mockResult);
    });
  });

  describe('Configuration handlers', () => {
    it('should get settings', async () => {
      const mockSettings = { setting1: 'value1' };
      mockRancherManager.config.getSettings.mockResolvedValue(mockSettings);

      const result = await toolHandlers.rancher_get_settings({
        serverName: 'test-server'
      });

      expect(mockRancherManager.config.getSettings).toHaveBeenCalledWith('test-server');
      expect(result).toEqual(mockSettings);
    });

    it('should update setting', async () => {
      const mockResult = { success: true };
      mockRancherManager.config.updateSetting.mockResolvedValue(mockResult);

      const result = await toolHandlers.rancher_update_setting({
        serverName: 'test-server',
        settingId: 'setting-1',
        value: 'new-value'
      });

      expect(mockRancherManager.config.updateSetting).toHaveBeenCalledWith(
        'test-server',
        'setting-1',
        'new-value'
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('Event handlers', () => {
    it('should get events', async () => {
      const mockEvents = [{ id: 'event-1', type: 'Normal' }];
      mockRancherManager.events.getEvents.mockResolvedValue(mockEvents);

      const result = await toolHandlers.rancher_get_events({
        serverName: 'test-server',
        filters: { type: 'Normal' }
      });

      expect(mockRancherManager.events.getEvents).toHaveBeenCalledWith('test-server', { type: 'Normal' });
      expect(result).toEqual(mockEvents);
    });
  });

  describe('Log handlers', () => {
    it('should get logs', async () => {
      const mockLogs = ['log1', 'log2'];
      mockRancherManager.logs.getLogs.mockResolvedValue(mockLogs);

      const result = await toolHandlers.rancher_get_logs({
        serverName: 'test-server',
        resourceType: 'pod',
        resourceId: 'pod-1',
        lines: 100
      });

      expect(mockRancherManager.logs.getLogs).toHaveBeenCalledWith(
        'test-server',
        'pod',
        'pod-1',
        { lines: 100 }
      );
      expect(result).toEqual(mockLogs);
    });
  });

  describe('Policy handlers', () => {
    it('should list policies', async () => {
      const mockPolicies = [{ id: 'policy-1', name: 'policy-1' }];
      mockRancherManager.policies.getPolicies.mockResolvedValue(mockPolicies);

      const result = await toolHandlers.rancher_list_policies({
        serverName: 'test-server'
      });

      expect(mockRancherManager.policies.getPolicies).toHaveBeenCalledWith('test-server');
      expect(result).toEqual(mockPolicies);
    });

    it('should create policy', async () => {
      const mockPolicy = { id: 'new-policy', name: 'new-policy' };
      mockRancherManager.policies.createPolicy.mockResolvedValue(mockPolicy);

      const args = {
        serverName: 'test-server',
        name: 'new-policy',
        rules: [{ rule: 'allow-all' }]
      };

      const result = await toolHandlers.rancher_create_policy(args);

      expect(mockRancherManager.policies.createPolicy).toHaveBeenCalledWith('test-server', {
        name: 'new-policy',
        rules: [{ rule: 'allow-all' }]
      });
      expect(result).toEqual(mockPolicy);
    });
  });

  describe('Quota handlers', () => {
    it('should list quotas', async () => {
      const mockQuotas = [{ id: 'quota-1', name: 'quota-1' }];
      mockRancherManager.quotas.getQuotas.mockResolvedValue(mockQuotas);

      const result = await toolHandlers.rancher_list_quotas({
        serverName: 'test-server',
        projectId: 'project-1'
      });

      expect(mockRancherManager.quotas.getQuotas).toHaveBeenCalledWith('test-server', 'project-1');
      expect(result).toEqual(mockQuotas);
    });

    it('should create quota', async () => {
      const mockQuota = { id: 'new-quota', name: 'new-quota' };
      mockRancherManager.quotas.createQuota.mockResolvedValue(mockQuota);

      const args = {
        serverName: 'test-server',
        name: 'new-quota',
        projectId: 'project-1',
        limits: { cpu: '4', memory: '8Gi' }
      };

      const result = await toolHandlers.rancher_create_quota(args);

      expect(mockRancherManager.quotas.createQuota).toHaveBeenCalledWith('test-server', {
        name: 'new-quota',
        projectId: 'project-1',
        limits: { cpu: '4', memory: '8Gi' }
      });
      expect(result).toEqual(mockQuota);
    });
  });

  describe('Namespace handlers', () => {
    it('should list namespaces', async () => {
      const mockNamespaces = [{ id: 'ns-1', name: 'namespace-1' }];
      mockRancherManager.namespaces.getNamespaces.mockResolvedValue(mockNamespaces);

      const result = await toolHandlers.rancher_list_namespaces({
        serverName: 'test-server',
        projectId: 'project-1'
      });

      expect(mockRancherManager.namespaces.getNamespaces).toHaveBeenCalledWith('test-server', 'project-1');
      expect(result).toEqual(mockNamespaces);
    });

    it('should get namespace', async () => {
      const mockNamespace = { id: 'ns-1', name: 'namespace-1' };
      mockRancherManager.namespaces.getNamespace.mockResolvedValue(mockNamespace);

      const result = await toolHandlers.rancher_get_namespace({
        serverName: 'test-server',
        namespaceId: 'ns-1'
      });

      expect(mockRancherManager.namespaces.getNamespace).toHaveBeenCalledWith('test-server', 'ns-1');
      expect(result).toEqual(mockNamespace);
    });

    it('should create namespace', async () => {
      const mockNamespace = { id: 'new-ns', name: 'new-namespace' };
      mockRancherManager.namespaces.createNamespace.mockResolvedValue(mockNamespace);

      const args = {
        serverName: 'test-server',
        name: 'new-namespace',
        projectId: 'project-1'
      };

      const result = await toolHandlers.rancher_create_namespace(args);

      expect(mockRancherManager.namespaces.createNamespace).toHaveBeenCalledWith('test-server', {
        name: 'new-namespace',
        projectId: 'project-1'
      });
      expect(result).toEqual(mockNamespace);
    });

    it('should delete namespace', async () => {
      const mockResult = { success: true };
      mockRancherManager.namespaces.deleteNamespace.mockResolvedValue(mockResult);

      const result = await toolHandlers.rancher_delete_namespace({
        serverName: 'test-server',
        namespaceId: 'ns-1'
      });

      expect(mockRancherManager.namespaces.deleteNamespace).toHaveBeenCalledWith('test-server', 'ns-1');
      expect(result).toEqual(mockResult);
    });
  });

  describe('Utility handlers', () => {
    it('should get system info', async () => {
      const result = await toolHandlers.rancher_get_system_info();

      expect(result).toHaveProperty('platform');
      expect(result).toHaveProperty('arch');
      expect(result).toHaveProperty('nodeVersion');
      expect(result).toHaveProperty('memoryUsage');
      expect(result).toHaveProperty('uptime');
      expect(result).toHaveProperty('pid');
      expect(result).toHaveProperty('cwd');
      expect(result).toHaveProperty('env');
    });

    it('should get version', async () => {
      const result = await toolHandlers.rancher_get_version();

      expect(result).toEqual({
        version: '1.0.0',
        name: 'rancher-multi-server',
        description: 'MCP Rancher Multi-Server'
      });
    });

    it('should get health status', async () => {
      const result = await toolHandlers.rancher_get_health_status();

      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('configValid');
      expect(result).toHaveProperty('configErrors');
      expect(result).toHaveProperty('servers');
      expect(result).toHaveProperty('logLevel');
      expect(result).toHaveProperty('enableFileLogging');
      expect(result).toHaveProperty('logDirectory');
    });

    it('should get statistics', async () => {
      const result = await toolHandlers.rancher_get_statistics({
        period: '24h'
      });

      expect(result).toHaveProperty('period');
      expect(result).toHaveProperty('totalRequests');
      expect(result).toHaveProperty('successfulRequests');
      expect(result).toHaveProperty('failedRequests');
      expect(result).toHaveProperty('averageResponseTime');
      expect(result).toHaveProperty('timestamp');
    });

    it('should clear cache', async () => {
      const result = await toolHandlers.rancher_clear_cache({
        cacheType: 'all'
      });

      expect(result).toEqual({
        success: true,
        clearedCache: 'all',
        timestamp: expect.any(String)
      });
    });

    it('should reload config', async () => {
      const result = await toolHandlers.rancher_reload_config();

      expect(result).toEqual({
        success: true,
        message: 'Configuration reloaded',
        timestamp: expect.any(String)
      });
    });

    it('should get MCP server logs', async () => {
      const result = await toolHandlers.rancher_get_mcp_server_logs({
        level: 'info',
        lines: 100,
        filter: 'error'
      });

      expect(result).toEqual({
        level: 'info',
        lines: 100,
        filter: 'error',
        logs: 'MCP server logs for level info, 100 lines, filtered by: error',
        timestamp: expect.any(String)
      });
    });

    it('should rotate logs', async () => {
      const result = await toolHandlers.rancher_rotate_logs({
        keepDays: 30
      });

      expect(result).toEqual({
        success: true,
        keepDays: 30,
        message: 'Logs rotated, keeping 30 days',
        timestamp: expect.any(String)
      });
    });

    it('should cleanup old data', async () => {
      const result = await toolHandlers.rancher_cleanup_data({
        olderThan: '30d',
        dataType: 'logs'
      });

      expect(result).toEqual({
        success: true,
        olderThan: '30d',
        dataType: 'logs',
        message: 'Cleaned up logs older than 30d',
        timestamp: expect.any(String)
      });
    });

    it('should get usage report', async () => {
      const result = await toolHandlers.rancher_get_usage_report({
        period: '24h',
        format: 'json'
      });

      expect(result).toEqual({
        period: '24h',
        format: 'json',
        report: 'Usage report for 24h in json format',
        timestamp: expect.any(String)
      });
    });

    it('should set log level', async () => {
      const result = await toolHandlers.rancher_set_log_level({
        level: 'debug'
      });

      expect(result).toEqual({
        success: true,
        previousLevel: 'info',
        newLevel: 'debug',
        message: 'Log level changed to debug',
        timestamp: expect.any(String)
      });
    });

    it('should configure logging', async () => {
      const result = await toolHandlers.rancher_configure_logging({
        enableFileLogging: true,
        logDirectory: '/new-logs',
        logLevel: 'debug'
      });

      expect(result).toEqual({
        success: true,
        changes: {
          enableFileLogging: true,
          logDirectory: '/new-logs',
          logLevel: 'debug'
        },
        message: 'Logging configuration updated',
        timestamp: expect.any(String),
        currentConfig: {
          enableFileLogging: true,
          logDirectory: '/logs',
          logLevel: 'info'
        }
      });
    });

    it('should get available commands', async () => {
      const result = await toolHandlers.rancher_get_available_commands({
        category: 'server'
      });

      expect(result).toEqual({
        category: 'server',
        commands: 'Available commands for server',
        timestamp: expect.any(String)
      });
    });

    it('should get command help', async () => {
      const result = await toolHandlers.rancher_get_command_help({
        command: 'rancher_list_servers'
      });

      expect(result).toEqual({
        command: 'rancher_list_servers',
        help: 'Help for command: rancher_list_servers',
        timestamp: expect.any(String)
      });
    });

    it('should execute batch commands', async () => {
      const result = await toolHandlers.rancher_execute_batch({
        commands: [
          { name: 'command1', args: {} },
          { name: 'command2', args: {} }
        ],
        stopOnError: false
      });

      expect(result).toEqual({
        commands: [
          {
            command: 'command1',
            success: true,
            result: 'Executed command1'
          },
          {
            command: 'command2',
            success: true,
            result: 'Executed command2'
          }
        ],
        stopOnError: false,
        timestamp: expect.any(String)
      });
    });
  });

  describe('Fleet handlers', () => {
    it('should list bundles', async () => {
      const mockBundles = [{ id: 'bundle-1', name: 'bundle-1' }];
      mockFleetHandlers.fleet_list_bundles.mockResolvedValue(mockBundles);

      const result = await toolHandlers.fleet_list_bundles({
        clusterId: 'cluster-1'
      });

      expect(mockFleetHandlers.fleet_list_bundles).toHaveBeenCalledWith({
        clusterId: 'cluster-1'
      });
      expect(result).toEqual(mockBundles);
    });

    it('should get bundle', async () => {
      const mockBundle = { id: 'bundle-1', name: 'bundle-1' };
      mockFleetHandlers.fleet_get_bundle.mockResolvedValue(mockBundle);

      const result = await toolHandlers.fleet_get_bundle({
        bundleId: 'bundle-1',
        clusterId: 'cluster-1'
      });

      expect(mockFleetHandlers.fleet_get_bundle).toHaveBeenCalledWith({
        bundleId: 'bundle-1',
        clusterId: 'cluster-1'
      });
      expect(result).toEqual(mockBundle);
    });

    it('should create bundle', async () => {
      const mockBundle = { id: 'new-bundle', name: 'new-bundle' };
      mockFleetHandlers.fleet_create_bundle.mockResolvedValue(mockBundle);

      const result = await toolHandlers.fleet_create_bundle({
        name: 'new-bundle',
        clusterId: 'cluster-1'
      });

      expect(mockFleetHandlers.fleet_create_bundle).toHaveBeenCalledWith({
        name: 'new-bundle',
        clusterId: 'cluster-1'
      });
      expect(result).toEqual(mockBundle);
    });

    it('should update bundle', async () => {
      const mockBundle = { id: 'bundle-1', name: 'updated-bundle' };
      mockFleetHandlers.fleet_update_bundle.mockResolvedValue(mockBundle);

      const result = await toolHandlers.fleet_update_bundle({
        bundleId: 'bundle-1',
        clusterId: 'cluster-1'
      });

      expect(mockFleetHandlers.fleet_update_bundle).toHaveBeenCalledWith({
        bundleId: 'bundle-1',
        clusterId: 'cluster-1'
      });
      expect(result).toEqual(mockBundle);
    });

    it('should delete bundle', async () => {
      const mockResult = { success: true };
      mockFleetHandlers.fleet_delete_bundle.mockResolvedValue(mockResult);

      const result = await toolHandlers.fleet_delete_bundle({
        bundleId: 'bundle-1',
        clusterId: 'cluster-1'
      });

      expect(mockFleetHandlers.fleet_delete_bundle).toHaveBeenCalledWith({
        bundleId: 'bundle-1',
        clusterId: 'cluster-1'
      });
      expect(result).toEqual(mockResult);
    });

    it('should force sync bundle', async () => {
      const mockResult = { success: true };
      mockFleetHandlers.fleet_force_sync_bundle.mockResolvedValue(mockResult);

      const result = await toolHandlers.fleet_force_sync_bundle({
        bundleId: 'bundle-1',
        clusterId: 'cluster-1'
      });

      expect(mockFleetHandlers.fleet_force_sync_bundle).toHaveBeenCalledWith({
        bundleId: 'bundle-1',
        clusterId: 'cluster-1'
      });
      expect(result).toEqual(mockResult);
    });

    it('should list git repos', async () => {
      const mockRepos = [{ id: 'repo-1', name: 'repo-1' }];
      mockFleetHandlers.fleet_list_git_repos.mockResolvedValue(mockRepos);

      const result = await toolHandlers.fleet_list_git_repos({
        clusterId: 'cluster-1'
      });

      expect(mockFleetHandlers.fleet_list_git_repos).toHaveBeenCalledWith({
        clusterId: 'cluster-1'
      });
      expect(result).toEqual(mockRepos);
    });

    it('should get git repo', async () => {
      const mockRepo = { id: 'repo-1', name: 'repo-1' };
      mockFleetHandlers.fleet_get_git_repo.mockResolvedValue(mockRepo);

      const result = await toolHandlers.fleet_get_git_repo({
        repoId: 'repo-1',
        clusterId: 'cluster-1'
      });

      expect(mockFleetHandlers.fleet_get_git_repo).toHaveBeenCalledWith({
        repoId: 'repo-1',
        clusterId: 'cluster-1'
      });
      expect(result).toEqual(mockRepo);
    });

    it('should create git repo', async () => {
      const mockRepo = { id: 'new-repo', name: 'new-repo' };
      mockFleetHandlers.fleet_create_git_repo.mockResolvedValue(mockRepo);

      const result = await toolHandlers.fleet_create_git_repo({
        name: 'new-repo',
        clusterId: 'cluster-1',
        repo: 'https://github.com/example/repo'
      });

      expect(mockFleetHandlers.fleet_create_git_repo).toHaveBeenCalledWith({
        name: 'new-repo',
        clusterId: 'cluster-1',
        repo: 'https://github.com/example/repo'
      });
      expect(result).toEqual(mockRepo);
    });

    it('should update git repo', async () => {
      const mockRepo = { id: 'repo-1', name: 'updated-repo' };
      mockFleetHandlers.fleet_update_git_repo.mockResolvedValue(mockRepo);

      const result = await toolHandlers.fleet_update_git_repo({
        repoId: 'repo-1',
        clusterId: 'cluster-1'
      });

      expect(mockFleetHandlers.fleet_update_git_repo).toHaveBeenCalledWith({
        repoId: 'repo-1',
        clusterId: 'cluster-1'
      });
      expect(result).toEqual(mockRepo);
    });

    it('should delete git repo', async () => {
      const mockResult = { success: true };
      mockFleetHandlers.fleet_delete_git_repo.mockResolvedValue(mockResult);

      const result = await toolHandlers.fleet_delete_git_repo({
        repoId: 'repo-1',
        clusterId: 'cluster-1'
      });

      expect(mockFleetHandlers.fleet_delete_git_repo).toHaveBeenCalledWith({
        repoId: 'repo-1',
        clusterId: 'cluster-1'
      });
      expect(result).toEqual(mockResult);
    });

    it('should list clusters', async () => {
      const mockClusters = [{ id: 'cluster-1', name: 'cluster-1' }];
      mockFleetHandlers.fleet_list_clusters.mockResolvedValue(mockClusters);

      const result = await toolHandlers.fleet_list_clusters();

      expect(mockFleetHandlers.fleet_list_clusters).toHaveBeenCalled();
      expect(result).toEqual(mockClusters);
    });

    it('should get cluster', async () => {
      const mockCluster = { id: 'cluster-1', name: 'cluster-1' };
      mockFleetHandlers.fleet_get_cluster.mockResolvedValue(mockCluster);

      const result = await toolHandlers.fleet_get_cluster({
        clusterId: 'cluster-1'
      });

      expect(mockFleetHandlers.fleet_get_cluster).toHaveBeenCalledWith({
        clusterId: 'cluster-1'
      });
      expect(result).toEqual(mockCluster);
    });

    it('should list workspaces', async () => {
      const mockWorkspaces = [{ id: 'ws-1', name: 'workspace-1' }];
      mockFleetHandlers.fleet_list_workspaces.mockResolvedValue(mockWorkspaces);

      const result = await toolHandlers.fleet_list_workspaces();

      expect(mockFleetHandlers.fleet_list_workspaces).toHaveBeenCalled();
      expect(result).toEqual(mockWorkspaces);
    });

    it('should get deployment status', async () => {
      const mockStatus = { status: 'deployed' };
      mockFleetHandlers.fleet_get_deployment_status.mockResolvedValue(mockStatus);

      const result = await toolHandlers.fleet_get_deployment_status({
        bundleId: 'bundle-1',
        clusterId: 'cluster-1'
      });

      expect(mockFleetHandlers.fleet_get_deployment_status).toHaveBeenCalledWith({
        bundleId: 'bundle-1',
        clusterId: 'cluster-1'
      });
      expect(result).toEqual(mockStatus);
    });

    it('should get logs', async () => {
      const mockLogs = ['log1', 'log2'];
      mockFleetHandlers.fleet_get_logs.mockResolvedValue(mockLogs);

      const result = await toolHandlers.fleet_get_logs({
        clusterId: 'cluster-1',
        namespace: 'fleet-default'
      });

      expect(mockFleetHandlers.fleet_get_logs).toHaveBeenCalledWith({
        clusterId: 'cluster-1',
        namespace: 'fleet-default'
      });
      expect(result).toEqual(mockLogs);
    });
  });

  describe('Unknown tool handler', () => {
    it('should handle unknown tool', async () => {
      const result = await toolHandlers.unknown_tool();

      expect(result).toEqual({
        error: 'Tool not found',
        message: 'Handler for this tool is not implemented'
      });
    });
  });
});