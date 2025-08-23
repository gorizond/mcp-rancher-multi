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
  ConfigManager,
  EventManager,
  LogManager,
  MetricManager,
  AlertManager,
  PolicyManager,
  QuotaManager,
  NamespaceManager
} from '../other-managers';
import { RancherManager } from '../manager';
import { RancherClient } from '../client';

// Mock RancherManager and RancherClient
jest.mock('../manager');
jest.mock('../client');

const MockRancherManager = RancherManager as jest.MockedClass<typeof RancherManager>;
const MockRancherClient = RancherClient as jest.MockedClass<typeof RancherClient>;

describe('Other Managers', () => {
  let mockRancherManager: jest.Mocked<RancherManager>;
  let mockRancherClient: jest.Mocked<RancherClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockRancherClient = {
      getUsers: jest.fn(),
      getUser: jest.fn(),
      createUser: jest.fn(),
      deleteUser: jest.fn(),
      getMetrics: jest.fn(),
      getAlerts: jest.fn(),
      createAlert: jest.fn(),
      createBackup: jest.fn(),
      getBackups: jest.fn(),
      restoreBackup: jest.fn(),
      getNodes: jest.fn(),
      getNode: jest.fn(),
      getStorageClasses: jest.fn(),
      getPersistentVolumes: jest.fn(),
      getServices: jest.fn(),
      getIngresses: jest.fn(),
      getRoles: jest.fn(),
      getRoleBindings: jest.fn(),
      createRoleBinding: jest.fn(),
      getCatalogs: jest.fn(),
      getCatalogTemplates: jest.fn(),
      getWorkloads: jest.fn(),
      getWorkload: jest.fn(),
      createWorkload: jest.fn(),
      updateWorkload: jest.fn(),
      deleteWorkload: jest.fn(),
      getSettings: jest.fn(),
      updateSetting: jest.fn(),
      getEvents: jest.fn(),
      getLogs: jest.fn(),
      getPolicies: jest.fn(),
      createPolicy: jest.fn(),
      getQuotas: jest.fn(),
      createQuota: jest.fn(),
      getNamespaces: jest.fn(),
      getNamespace: jest.fn(),
      createNamespace: jest.fn(),
      deleteNamespace: jest.fn(),
    } as any;

    mockRancherManager = {
      executeOnServer: jest.fn(),
    } as any;

    MockRancherManager.mockImplementation(() => mockRancherManager);
  });

  describe('UserManager', () => {
    let userManager: UserManager;

    beforeEach(() => {
      userManager = new UserManager(mockRancherManager);
    });

    it('should get users', async () => {
      const mockUsers = [{ id: '1', name: 'user1' }];
      mockRancherManager.executeOnServer.mockResolvedValue(mockUsers);

      const result = await userManager.getUsers('test-server');

      expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
      expect(result).toEqual(mockUsers);
    });

    it('should get user by id', async () => {
      const mockUser = { id: '1', name: 'user1' };
      mockRancherManager.executeOnServer.mockResolvedValue(mockUser);

      const result = await userManager.getUser('test-server', '1');

      expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
      expect(result).toEqual(mockUser);
    });

    it('should create user', async () => {
      const userData = { name: 'newuser', email: 'test@example.com' };
      const mockCreatedUser = { id: '2', ...userData };
      mockRancherManager.executeOnServer.mockResolvedValue(mockCreatedUser);

      const result = await userManager.createUser('test-server', userData);

      expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
      expect(result).toEqual(mockCreatedUser);
    });

    it('should delete user', async () => {
      mockRancherManager.executeOnServer.mockResolvedValue({ success: true });

      const result = await userManager.deleteUser('test-server', '1');

      expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
      expect(result).toEqual({ success: true });
    });
  });

  describe('MonitoringManager', () => {
    let monitoringManager: MonitoringManager;

    beforeEach(() => {
      monitoringManager = new MonitoringManager(mockRancherManager);
    });

    it('should get metrics', async () => {
      const mockMetrics = { cpu: 50, memory: 80 };
      mockRancherManager.executeOnServer.mockResolvedValue(mockMetrics);

      const result = await monitoringManager.getMetrics('test-server', 'cluster', 'cluster-1');

      expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
      expect(result).toEqual(mockMetrics);
    });

    it('should get alerts', async () => {
      const mockAlerts = [{ id: '1', severity: 'warning' }];
      mockRancherManager.executeOnServer.mockResolvedValue(mockAlerts);

      const result = await monitoringManager.getAlerts('test-server');

      expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
      expect(result).toEqual(mockAlerts);
    });

    it('should create alert', async () => {
      const alertData = { name: 'test-alert', severity: 'critical' };
      const mockCreatedAlert = { id: '1', ...alertData };
      mockRancherManager.executeOnServer.mockResolvedValue(mockCreatedAlert);

      const result = await monitoringManager.createAlert('test-server', alertData);

      expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
      expect(result).toEqual(mockCreatedAlert);
    });
  });

  describe('BackupManager', () => {
    let backupManager: BackupManager;

    beforeEach(() => {
      backupManager = new BackupManager(mockRancherManager);
    });

    it('should create backup', async () => {
      const backupData = { name: 'backup-1', clusterId: 'cluster-1' };
      const mockCreatedBackup = { id: '1', ...backupData };
      mockRancherManager.executeOnServer.mockResolvedValue(mockCreatedBackup);

      const result = await backupManager.createBackup('test-server', backupData);

      expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
      expect(result).toEqual(mockCreatedBackup);
    });

    it('should get backups', async () => {
      const mockBackups = [{ id: '1', name: 'backup-1' }];
      mockRancherManager.executeOnServer.mockResolvedValue(mockBackups);

      const result = await backupManager.getBackups('test-server');

      expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
      expect(result).toEqual(mockBackups);
    });

    it('should restore backup', async () => {
      const restoreData = { clusterId: 'cluster-1' };
      mockRancherManager.executeOnServer.mockResolvedValue({ success: true });

      const result = await backupManager.restoreBackup('test-server', 'backup-1', restoreData);

      expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
      expect(result).toEqual({ success: true });
    });
  });

  describe('NodeManager', () => {
    let nodeManager: NodeManager;

    beforeEach(() => {
      nodeManager = new NodeManager(mockRancherManager);
    });

    it('should get nodes', async () => {
      const mockNodes = [{ id: '1', name: 'node-1' }];
      mockRancherManager.executeOnServer.mockResolvedValue(mockNodes);

      const result = await nodeManager.getNodes('test-server');

      expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
      expect(result).toEqual(mockNodes);
    });

    it('should get nodes with cluster id', async () => {
      const mockNodes = [{ id: '1', name: 'node-1' }];
      mockRancherManager.executeOnServer.mockResolvedValue(mockNodes);

      const result = await nodeManager.getNodes('test-server', 'cluster-1');

      expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
      expect(result).toEqual(mockNodes);
    });

    it('should get node by id', async () => {
      const mockNode = { id: '1', name: 'node-1' };
      mockRancherManager.executeOnServer.mockResolvedValue(mockNode);

      const result = await nodeManager.getNode('test-server', '1');

      expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
      expect(result).toEqual(mockNode);
    });
  });

  describe('StorageManager', () => {
    let storageManager: StorageManager;

    beforeEach(() => {
      storageManager = new StorageManager(mockRancherManager);
    });

    it('should get storage classes', async () => {
      const mockStorageClasses = [{ id: '1', name: 'fast-ssd' }];
      mockRancherManager.executeOnServer.mockResolvedValue(mockStorageClasses);

      const result = await storageManager.getStorageClasses('test-server');

      expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
      expect(result).toEqual(mockStorageClasses);
    });

    it('should get storage classes with cluster id', async () => {
      const mockStorageClasses = [{ id: '1', name: 'fast-ssd' }];
      mockRancherManager.executeOnServer.mockResolvedValue(mockStorageClasses);

      const result = await storageManager.getStorageClasses('test-server', 'cluster-1');

      expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
      expect(result).toEqual(mockStorageClasses);
    });

    it('should get persistent volumes', async () => {
      const mockVolumes = [{ id: '1', name: 'pv-1' }];
      mockRancherManager.executeOnServer.mockResolvedValue(mockVolumes);

      const result = await storageManager.getPersistentVolumes('test-server');

      expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
      expect(result).toEqual(mockVolumes);
    });
  });

  describe('NetworkManager', () => {
    let networkManager: NetworkManager;

    beforeEach(() => {
      networkManager = new NetworkManager(mockRancherManager);
    });

    it('should get services', async () => {
      const mockServices = [{ id: '1', name: 'service-1' }];
      mockRancherManager.executeOnServer.mockResolvedValue(mockServices);

      const result = await networkManager.getServices('test-server');

      expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
      expect(result).toEqual(mockServices);
    });

    it('should get ingresses', async () => {
      const mockIngresses = [{ id: '1', name: 'ingress-1' }];
      mockRancherManager.executeOnServer.mockResolvedValue(mockIngresses);

      const result = await networkManager.getIngresses('test-server');

      expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
      expect(result).toEqual(mockIngresses);
    });
  });

  describe('SecurityManager', () => {
    let securityManager: SecurityManager;

    beforeEach(() => {
      securityManager = new SecurityManager(mockRancherManager);
    });

    it('should get roles', async () => {
      const mockRoles = [{ id: '1', name: 'admin' }];
      mockRancherManager.executeOnServer.mockResolvedValue(mockRoles);

      const result = await securityManager.getRoles('test-server');

      expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
      expect(result).toEqual(mockRoles);
    });

    it('should get role bindings', async () => {
      const mockRoleBindings = [{ id: '1', roleId: 'admin', userId: 'user-1' }];
      mockRancherManager.executeOnServer.mockResolvedValue(mockRoleBindings);

      const result = await securityManager.getRoleBindings('test-server');

      expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
      expect(result).toEqual(mockRoleBindings);
    });

    it('should create role binding', async () => {
      const roleBindingData = { roleId: 'admin', userId: 'user-1' };
      const mockCreatedBinding = { id: '1', ...roleBindingData };
      mockRancherManager.executeOnServer.mockResolvedValue(mockCreatedBinding);

      const result = await securityManager.createRoleBinding('test-server', roleBindingData);

      expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
      expect(result).toEqual(mockCreatedBinding);
    });
  });

  describe('CatalogManager', () => {
    let catalogManager: CatalogManager;

    beforeEach(() => {
      catalogManager = new CatalogManager(mockRancherManager);
    });

    it('should get catalogs', async () => {
      const mockCatalogs = [{ id: '1', name: 'library' }];
      mockRancherManager.executeOnServer.mockResolvedValue(mockCatalogs);

      const result = await catalogManager.getCatalogs('test-server');

      expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
      expect(result).toEqual(mockCatalogs);
    });

    it('should get catalog templates', async () => {
      const mockTemplates = [{ id: '1', name: 'nginx' }];
      mockRancherManager.executeOnServer.mockResolvedValue(mockTemplates);

      const result = await catalogManager.getCatalogTemplates('test-server', 'catalog-1');

      expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
      expect(result).toEqual(mockTemplates);
    });
  });

  describe('WorkloadManager', () => {
    let workloadManager: WorkloadManager;

    beforeEach(() => {
      workloadManager = new WorkloadManager(mockRancherManager);
    });

    it('should get workloads', async () => {
      const mockWorkloads = [{ id: '1', name: 'workload-1' }];
      mockRancherManager.executeOnServer.mockResolvedValue(mockWorkloads);

      const result = await workloadManager.getWorkloads('test-server');

      expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
      expect(result).toEqual(mockWorkloads);
    });

    it('should get workload by id', async () => {
      const mockWorkload = { id: '1', name: 'workload-1' };
      mockRancherManager.executeOnServer.mockResolvedValue(mockWorkload);

      const result = await workloadManager.getWorkload('test-server', '1');

      expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
      expect(result).toEqual(mockWorkload);
    });

    it('should create workload', async () => {
      const workloadData = { name: 'new-workload', replicas: 3 };
      const mockCreatedWorkload = { id: '2', ...workloadData };
      mockRancherManager.executeOnServer.mockResolvedValue(mockCreatedWorkload);

      const result = await workloadManager.createWorkload('test-server', workloadData);

      expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
      expect(result).toEqual(mockCreatedWorkload);
    });

    it('should update workload', async () => {
      const workloadData = { replicas: 5 };
      const mockUpdatedWorkload = { id: '1', name: 'workload-1', ...workloadData };
      mockRancherManager.executeOnServer.mockResolvedValue(mockUpdatedWorkload);

      const result = await workloadManager.updateWorkload('test-server', '1', workloadData);

      expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
      expect(result).toEqual(mockUpdatedWorkload);
    });

    it('should delete workload', async () => {
      mockRancherManager.executeOnServer.mockResolvedValue({ success: true });

      const result = await workloadManager.deleteWorkload('test-server', '1');

      expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
      expect(result).toEqual({ success: true });
    });
  });

  describe('ConfigManager', () => {
    let configManager: ConfigManager;

    beforeEach(() => {
      configManager = new ConfigManager(mockRancherManager);
    });

    it('should get settings', async () => {
      const mockSettings = [{ id: '1', name: 'setting-1', value: 'value-1' }];
      mockRancherManager.executeOnServer.mockResolvedValue(mockSettings);

      const result = await configManager.getSettings('test-server');

      expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
      expect(result).toEqual(mockSettings);
    });

    it('should update setting', async () => {
      const mockUpdatedSetting = { id: '1', name: 'setting-1', value: 'new-value' };
      mockRancherManager.executeOnServer.mockResolvedValue(mockUpdatedSetting);

      const result = await configManager.updateSetting('test-server', '1', 'new-value');

      expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
      expect(result).toEqual(mockUpdatedSetting);
    });
  });

  describe('EventManager', () => {
    let eventManager: EventManager;

    beforeEach(() => {
      eventManager = new EventManager(mockRancherManager);
    });

    it('should get events', async () => {
      const mockEvents = [{ id: '1', type: 'warning', message: 'test event' }];
      mockRancherManager.executeOnServer.mockResolvedValue(mockEvents);

      const result = await eventManager.getEvents('test-server');

      expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
      expect(result).toEqual(mockEvents);
    });

    it('should get events with filters', async () => {
      const filters = { type: 'warning' };
      const mockEvents = [{ id: '1', type: 'warning', message: 'test event' }];
      mockRancherManager.executeOnServer.mockResolvedValue(mockEvents);

      const result = await eventManager.getEvents('test-server', filters);

      expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
      expect(result).toEqual(mockEvents);
    });
  });

  describe('LogManager', () => {
    let logManager: LogManager;

    beforeEach(() => {
      logManager = new LogManager(mockRancherManager);
    });

    it('should get logs', async () => {
      const mockLogs = ['log line 1', 'log line 2'];
      mockRancherManager.executeOnServer.mockResolvedValue(mockLogs);

      const result = await logManager.getLogs('test-server', 'pod', 'pod-1');

      expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
      expect(result).toEqual(mockLogs);
    });

    it('should get logs with options', async () => {
      const options = { lines: 100, follow: false };
      const mockLogs = ['log line 1', 'log line 2'];
      mockRancherManager.executeOnServer.mockResolvedValue(mockLogs);

      const result = await logManager.getLogs('test-server', 'pod', 'pod-1', options);

      expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
      expect(result).toEqual(mockLogs);
    });
  });

  describe('MetricManager', () => {
    let metricManager: MetricManager;

    beforeEach(() => {
      metricManager = new MetricManager(mockRancherManager);
    });

    it('should get metrics', async () => {
      const mockMetrics = { cpu: 50, memory: 80 };
      mockRancherManager.executeOnServer.mockResolvedValue(mockMetrics);

      const result = await metricManager.getMetrics('test-server', 'cluster', 'cluster-1');

      expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
      expect(result).toEqual(mockMetrics);
    });

    it('should get metrics with options', async () => {
      const options = { period: '1h' };
      const mockMetrics = { cpu: 50, memory: 80 };
      mockRancherManager.executeOnServer.mockResolvedValue(mockMetrics);

      const result = await metricManager.getMetrics('test-server', 'cluster', 'cluster-1', options);

      expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
      expect(result).toEqual(mockMetrics);
    });
  });

  describe('AlertManager', () => {
    let alertManager: AlertManager;

    beforeEach(() => {
      alertManager = new AlertManager(mockRancherManager);
    });

    it('should get alerts', async () => {
      const mockAlerts = [{ id: '1', severity: 'warning' }];
      mockRancherManager.executeOnServer.mockResolvedValue(mockAlerts);

      const result = await alertManager.getAlerts('test-server');

      expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
      expect(result).toEqual(mockAlerts);
    });

    it('should create alert', async () => {
      const alertData = { name: 'test-alert', severity: 'critical' };
      const mockCreatedAlert = { id: '1', ...alertData };
      mockRancherManager.executeOnServer.mockResolvedValue(mockCreatedAlert);

      const result = await alertManager.createAlert('test-server', alertData);

      expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
      expect(result).toEqual(mockCreatedAlert);
    });
  });

  describe('PolicyManager', () => {
    let policyManager: PolicyManager;

    beforeEach(() => {
      policyManager = new PolicyManager(mockRancherManager);
    });

    it('should get policies', async () => {
      const mockPolicies = [{ id: '1', name: 'policy-1' }];
      mockRancherManager.executeOnServer.mockResolvedValue(mockPolicies);

      const result = await policyManager.getPolicies('test-server');

      expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
      expect(result).toEqual(mockPolicies);
    });

    it('should create policy', async () => {
      const policyData = { name: 'new-policy', rules: [] };
      const mockCreatedPolicy = { id: '2', ...policyData };
      mockRancherManager.executeOnServer.mockResolvedValue(mockCreatedPolicy);

      const result = await policyManager.createPolicy('test-server', policyData);

      expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
      expect(result).toEqual(mockCreatedPolicy);
    });
  });

  describe('QuotaManager', () => {
    let quotaManager: QuotaManager;

    beforeEach(() => {
      quotaManager = new QuotaManager(mockRancherManager);
    });

    it('should get quotas', async () => {
      const mockQuotas = [{ id: '1', name: 'quota-1' }];
      mockRancherManager.executeOnServer.mockResolvedValue(mockQuotas);

      const result = await quotaManager.getQuotas('test-server');

      expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
      expect(result).toEqual(mockQuotas);
    });

    it('should get quotas with project id', async () => {
      const mockQuotas = [{ id: '1', name: 'quota-1' }];
      mockRancherManager.executeOnServer.mockResolvedValue(mockQuotas);

      const result = await quotaManager.getQuotas('test-server', 'project-1');

      expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
      expect(result).toEqual(mockQuotas);
    });

    it('should create quota', async () => {
      const quotaData = { name: 'new-quota', limits: { cpu: '4', memory: '8Gi' } };
      const mockCreatedQuota = { id: '2', ...quotaData };
      mockRancherManager.executeOnServer.mockResolvedValue(mockCreatedQuota);

      const result = await quotaManager.createQuota('test-server', quotaData);

      expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
      expect(result).toEqual(mockCreatedQuota);
    });
  });

  describe('NamespaceManager', () => {
    let namespaceManager: NamespaceManager;

    beforeEach(() => {
      namespaceManager = new NamespaceManager(mockRancherManager);
    });

    it('should get namespaces', async () => {
      const mockNamespaces = [{ id: '1', name: 'default' }];
      mockRancherManager.executeOnServer.mockResolvedValue(mockNamespaces);

      const result = await namespaceManager.getNamespaces('test-server');

      expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
      expect(result).toEqual(mockNamespaces);
    });

    it('should get namespace by id', async () => {
      const mockNamespace = { id: '1', name: 'default' };
      mockRancherManager.executeOnServer.mockResolvedValue(mockNamespace);

      const result = await namespaceManager.getNamespace('test-server', '1');

      expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
      expect(result).toEqual(mockNamespace);
    });

    it('should create namespace', async () => {
      const namespaceData = { name: 'new-namespace' };
      const mockCreatedNamespace = { id: '2', ...namespaceData };
      mockRancherManager.executeOnServer.mockResolvedValue(mockCreatedNamespace);

      const result = await namespaceManager.createNamespace('test-server', namespaceData);

      expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
      expect(result).toEqual(mockCreatedNamespace);
    });

    it('should delete namespace', async () => {
      mockRancherManager.executeOnServer.mockResolvedValue({ success: true });

      const result = await namespaceManager.deleteNamespace('test-server', '1');

      expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
      expect(result).toEqual({ success: true });
    });
  });

  describe('Callback execution verification', () => {
    let userManager: UserManager;
    let monitoringManager: MonitoringManager;
    let backupManager: BackupManager;
    let nodeManager: NodeManager;
    let storageManager: StorageManager;
    let networkManager: NetworkManager;
    let securityManager: SecurityManager;
    let catalogManager: CatalogManager;
    let workloadManager: WorkloadManager;
    let configManager: ConfigManager;
    let eventManager: EventManager;
    let logManager: LogManager;
    let metricManager: MetricManager;
    let alertManager: AlertManager;
    let policyManager: PolicyManager;
    let quotaManager: QuotaManager;
    let namespaceManager: NamespaceManager;

    beforeEach(() => {
      userManager = new UserManager(mockRancherManager);
      monitoringManager = new MonitoringManager(mockRancherManager);
      backupManager = new BackupManager(mockRancherManager);
      nodeManager = new NodeManager(mockRancherManager);
      storageManager = new StorageManager(mockRancherManager);
      networkManager = new NetworkManager(mockRancherManager);
      securityManager = new SecurityManager(mockRancherManager);
      catalogManager = new CatalogManager(mockRancherManager);
      workloadManager = new WorkloadManager(mockRancherManager);
      configManager = new ConfigManager(mockRancherManager);
      eventManager = new EventManager(mockRancherManager);
      logManager = new LogManager(mockRancherManager);
      metricManager = new MetricManager(mockRancherManager);
      alertManager = new AlertManager(mockRancherManager);
      policyManager = new PolicyManager(mockRancherManager);
      quotaManager = new QuotaManager(mockRancherManager);
      namespaceManager = new NamespaceManager(mockRancherManager);
    });

    it('should execute callback with correct client for UserManager', async () => {
      const mockUsers = [{ 
        id: '1', 
        name: 'user1',
        username: 'user1',
        email: 'user1@example.com',
        enabled: true,
        created: '2024-01-01T00:00:00Z',
        updated: '2024-01-01T00:00:00Z'
      }];
      mockRancherClient.getUsers.mockResolvedValue(mockUsers);
      mockRancherManager.executeOnServer.mockImplementation(async (serverName, callback) => {
        return await callback(mockRancherClient);
      });

      const result = await userManager.getUsers('test-server');

      expect(mockRancherClient.getUsers).toHaveBeenCalled();
      expect(result).toEqual(mockUsers);
    });

    it('should execute callback with correct client for MonitoringManager', async () => {
      const mockMetrics = { cpu: 50, memory: 80 };
      mockRancherClient.getMetrics.mockResolvedValue(mockMetrics);
      mockRancherManager.executeOnServer.mockImplementation(async (serverName, callback) => {
        return await callback(mockRancherClient);
      });

      const result = await monitoringManager.getMetrics('test-server', 'cluster', 'cluster-1');

      expect(mockRancherClient.getMetrics).toHaveBeenCalledWith('cluster', 'cluster-1');
      expect(result).toEqual(mockMetrics);
    });

    it('should execute callback with correct client for BackupManager', async () => {
      const mockBackup = { id: '1', name: 'backup-1' };
      mockRancherClient.createBackup.mockResolvedValue(mockBackup);
      mockRancherManager.executeOnServer.mockImplementation(async (serverName, callback) => {
        return await callback(mockRancherClient);
      });

      const backupData = { name: 'backup-1', clusterId: 'cluster-1' };
      const result = await backupManager.createBackup('test-server', backupData);

      expect(mockRancherClient.createBackup).toHaveBeenCalledWith(backupData);
      expect(result).toEqual(mockBackup);
    });

    it('should execute callback with correct client for NodeManager', async () => {
      const mockNodes = [{ id: '1', name: 'node-1' }];
      mockRancherClient.getNodes.mockResolvedValue(mockNodes);
      mockRancherManager.executeOnServer.mockImplementation(async (serverName, callback) => {
        return await callback(mockRancherClient);
      });

      const result = await nodeManager.getNodes('test-server', 'cluster-1');

      expect(mockRancherClient.getNodes).toHaveBeenCalledWith('cluster-1');
      expect(result).toEqual(mockNodes);
    });

    it('should execute callback with correct client for StorageManager', async () => {
      const mockStorageClasses = [{ id: '1', name: 'fast-ssd' }];
      mockRancherClient.getStorageClasses.mockResolvedValue(mockStorageClasses);
      mockRancherManager.executeOnServer.mockImplementation(async (serverName, callback) => {
        return await callback(mockRancherClient);
      });

      const result = await storageManager.getStorageClasses('test-server', 'cluster-1');

      expect(mockRancherClient.getStorageClasses).toHaveBeenCalledWith('cluster-1');
      expect(result).toEqual(mockStorageClasses);
    });

    it('should execute callback with correct client for NetworkManager', async () => {
      const mockServices = [{ id: '1', name: 'service-1' }];
      mockRancherClient.getServices.mockResolvedValue(mockServices);
      mockRancherManager.executeOnServer.mockImplementation(async (serverName, callback) => {
        return await callback(mockRancherClient);
      });

      const result = await networkManager.getServices('test-server', 'cluster-1');

      expect(mockRancherClient.getServices).toHaveBeenCalledWith('cluster-1');
      expect(result).toEqual(mockServices);
    });

    it('should execute callback with correct client for SecurityManager', async () => {
      const mockRoles = [{ id: '1', name: 'admin' }];
      mockRancherClient.getRoles.mockResolvedValue(mockRoles);
      mockRancherManager.executeOnServer.mockImplementation(async (serverName, callback) => {
        return await callback(mockRancherClient);
      });

      const result = await securityManager.getRoles('test-server');

      expect(mockRancherClient.getRoles).toHaveBeenCalled();
      expect(result).toEqual(mockRoles);
    });

    it('should execute callback with correct client for CatalogManager', async () => {
      const mockTemplates = [{ id: '1', name: 'nginx' }];
      mockRancherClient.getCatalogTemplates.mockResolvedValue(mockTemplates);
      mockRancherManager.executeOnServer.mockImplementation(async (serverName, callback) => {
        return await callback(mockRancherClient);
      });

      const result = await catalogManager.getCatalogTemplates('test-server', 'catalog-1');

      expect(mockRancherClient.getCatalogTemplates).toHaveBeenCalledWith('catalog-1');
      expect(result).toEqual(mockTemplates);
    });

    it('should execute callback with correct client for WorkloadManager', async () => {
      const mockWorkloads = [{ id: '1', name: 'workload-1' }];
      mockRancherClient.getWorkloads.mockResolvedValue(mockWorkloads);
      mockRancherManager.executeOnServer.mockImplementation(async (serverName, callback) => {
        return await callback(mockRancherClient);
      });

      const result = await workloadManager.getWorkloads('test-server', 'project-1');

      expect(mockRancherClient.getWorkloads).toHaveBeenCalledWith('project-1');
      expect(result).toEqual(mockWorkloads);
    });

    it('should execute callback with correct client for ConfigManager', async () => {
      const mockSettings = [{ id: '1', name: 'setting-1', value: 'value-1' }];
      mockRancherClient.getSettings.mockResolvedValue(mockSettings);
      mockRancherManager.executeOnServer.mockImplementation(async (serverName, callback) => {
        return await callback(mockRancherClient);
      });

      const result = await configManager.getSettings('test-server');

      expect(mockRancherClient.getSettings).toHaveBeenCalled();
      expect(result).toEqual(mockSettings);
    });

    it('should execute callback with correct client for EventManager', async () => {
      const mockEvents = [{ id: '1', type: 'warning', message: 'test event' }];
      mockRancherClient.getEvents.mockResolvedValue(mockEvents);
      mockRancherManager.executeOnServer.mockImplementation(async (serverName, callback) => {
        return await callback(mockRancherClient);
      });

      const filters = { type: 'warning' };
      const result = await eventManager.getEvents('test-server', filters);

      expect(mockRancherClient.getEvents).toHaveBeenCalledWith(filters);
      expect(result).toEqual(mockEvents);
    });

    it('should execute callback with correct client for LogManager', async () => {
      const mockLogs = 'log line 1\nlog line 2';
      mockRancherClient.getLogs.mockResolvedValue(mockLogs);
      mockRancherManager.executeOnServer.mockImplementation(async (serverName, callback) => {
        return await callback(mockRancherClient);
      });

      const options = { lines: 100, follow: false };
      const result = await logManager.getLogs('test-server', 'pod', 'pod-1', options);

      expect(mockRancherClient.getLogs).toHaveBeenCalledWith('pod', 'pod-1', options);
      expect(result).toEqual(mockLogs);
    });

    it('should execute callback with correct client for MetricManager', async () => {
      const mockMetrics = { cpu: 50, memory: 80 };
      mockRancherClient.getMetrics.mockResolvedValue(mockMetrics);
      mockRancherManager.executeOnServer.mockImplementation(async (serverName, callback) => {
        return await callback(mockRancherClient);
      });

      const options = { period: '1h' };
      const result = await metricManager.getMetrics('test-server', 'cluster', 'cluster-1', options);

      expect(mockRancherClient.getMetrics).toHaveBeenCalledWith('cluster', 'cluster-1', options);
      expect(result).toEqual(mockMetrics);
    });

    it('should execute callback with correct client for AlertManager', async () => {
      const mockAlerts = [{ id: '1', severity: 'warning' }];
      mockRancherClient.getAlerts.mockResolvedValue(mockAlerts);
      mockRancherManager.executeOnServer.mockImplementation(async (serverName, callback) => {
        return await callback(mockRancherClient);
      });

      const result = await alertManager.getAlerts('test-server');

      expect(mockRancherClient.getAlerts).toHaveBeenCalled();
      expect(result).toEqual(mockAlerts);
    });

    it('should execute callback with correct client for PolicyManager', async () => {
      const mockPolicies = [{ id: '1', name: 'policy-1' }];
      mockRancherClient.getPolicies.mockResolvedValue(mockPolicies);
      mockRancherManager.executeOnServer.mockImplementation(async (serverName, callback) => {
        return await callback(mockRancherClient);
      });

      const result = await policyManager.getPolicies('test-server');

      expect(mockRancherClient.getPolicies).toHaveBeenCalled();
      expect(result).toEqual(mockPolicies);
    });

    it('should execute callback with correct client for QuotaManager', async () => {
      const mockQuotas = [{ id: '1', name: 'quota-1' }];
      mockRancherClient.getQuotas.mockResolvedValue(mockQuotas);
      mockRancherManager.executeOnServer.mockImplementation(async (serverName, callback) => {
        return await callback(mockRancherClient);
      });

      const result = await quotaManager.getQuotas('test-server', 'project-1');

      expect(mockRancherClient.getQuotas).toHaveBeenCalledWith('project-1');
      expect(result).toEqual(mockQuotas);
    });

    it('should execute callback with correct client for NamespaceManager', async () => {
      const mockNamespaces = [{ 
        id: '1', 
        name: 'default',
        projectId: 'project-1',
        state: 'Active',
        created: '2024-01-01T00:00:00Z',
        updated: '2024-01-01T00:00:00Z'
      }];
      mockRancherClient.getNamespaces.mockResolvedValue(mockNamespaces);
      mockRancherManager.executeOnServer.mockImplementation(async (serverName, callback) => {
        return await callback(mockRancherClient);
      });

      const result = await namespaceManager.getNamespaces('test-server', 'project-1');

      expect(mockRancherClient.getNamespaces).toHaveBeenCalledWith('project-1');
      expect(result).toEqual(mockNamespaces);
    });
  });

  describe('Error handling', () => {
    let userManager: UserManager;

    beforeEach(() => {
      userManager = new UserManager(mockRancherManager);
    });

    it('should propagate errors from executeOnServer', async () => {
      const error = new Error('Server error');
      mockRancherManager.executeOnServer.mockRejectedValue(error);

      await expect(userManager.getUsers('test-server')).rejects.toThrow('Server error');
    });

    it('should propagate errors from client methods', async () => {
      const error = new Error('Client error');
      mockRancherClient.getUsers.mockRejectedValue(error);
      mockRancherManager.executeOnServer.mockImplementation(async (serverName, callback) => {
        return await callback(mockRancherClient);
      });

      await expect(userManager.getUsers('test-server')).rejects.toThrow('Client error');
    });
  });

  describe('Constructor validation', () => {
    it('should create managers with RancherManager dependency', () => {
      expect(() => new UserManager(mockRancherManager)).not.toThrow();
      expect(() => new MonitoringManager(mockRancherManager)).not.toThrow();
      expect(() => new BackupManager(mockRancherManager)).not.toThrow();
      expect(() => new NodeManager(mockRancherManager)).not.toThrow();
      expect(() => new StorageManager(mockRancherManager)).not.toThrow();
      expect(() => new NetworkManager(mockRancherManager)).not.toThrow();
      expect(() => new SecurityManager(mockRancherManager)).not.toThrow();
      expect(() => new CatalogManager(mockRancherManager)).not.toThrow();
      expect(() => new WorkloadManager(mockRancherManager)).not.toThrow();
      expect(() => new ConfigManager(mockRancherManager)).not.toThrow();
      expect(() => new EventManager(mockRancherManager)).not.toThrow();
      expect(() => new LogManager(mockRancherManager)).not.toThrow();
      expect(() => new MetricManager(mockRancherManager)).not.toThrow();
      expect(() => new AlertManager(mockRancherManager)).not.toThrow();
      expect(() => new PolicyManager(mockRancherManager)).not.toThrow();
      expect(() => new QuotaManager(mockRancherManager)).not.toThrow();
      expect(() => new NamespaceManager(mockRancherManager)).not.toThrow();
    });
  });

  describe('Additional edge cases and scenarios', () => {
    let userManager: UserManager;
    let monitoringManager: MonitoringManager;
    let backupManager: BackupManager;
    let nodeManager: NodeManager;
    let storageManager: StorageManager;
    let networkManager: NetworkManager;
    let securityManager: SecurityManager;
    let catalogManager: CatalogManager;
    let workloadManager: WorkloadManager;
    let configManager: ConfigManager;
    let eventManager: EventManager;
    let logManager: LogManager;
    let metricManager: MetricManager;
    let alertManager: AlertManager;
    let policyManager: PolicyManager;
    let quotaManager: QuotaManager;
    let namespaceManager: NamespaceManager;

    beforeEach(() => {
      userManager = new UserManager(mockRancherManager);
      monitoringManager = new MonitoringManager(mockRancherManager);
      backupManager = new BackupManager(mockRancherManager);
      nodeManager = new NodeManager(mockRancherManager);
      storageManager = new StorageManager(mockRancherManager);
      networkManager = new NetworkManager(mockRancherManager);
      securityManager = new SecurityManager(mockRancherManager);
      catalogManager = new CatalogManager(mockRancherManager);
      workloadManager = new WorkloadManager(mockRancherManager);
      configManager = new ConfigManager(mockRancherManager);
      eventManager = new EventManager(mockRancherManager);
      logManager = new LogManager(mockRancherManager);
      metricManager = new MetricManager(mockRancherManager);
      alertManager = new AlertManager(mockRancherManager);
      policyManager = new PolicyManager(mockRancherManager);
      quotaManager = new QuotaManager(mockRancherManager);
      namespaceManager = new NamespaceManager(mockRancherManager);
    });

    describe('UserManager additional tests', () => {
      it('should handle empty user data', async () => {
        const emptyUserData = {};
        mockRancherManager.executeOnServer.mockResolvedValue({ id: 'new-user' });

        const result = await userManager.createUser('test-server', emptyUserData);

        expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
        expect(result).toEqual({ id: 'new-user' });
      });

      it('should handle user deletion with non-existent user', async () => {
        mockRancherManager.executeOnServer.mockResolvedValue({ success: false, error: 'User not found' });

        const result = await userManager.deleteUser('test-server', 'non-existent');

        expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
        expect(result).toEqual({ success: false, error: 'User not found' });
      });
    });

    describe('MonitoringManager additional tests', () => {
      it('should handle metrics with complex resource types', async () => {
        const complexMetrics = { cpu: { usage: 50, limit: 100 }, memory: { usage: 80, limit: 128 } };
        mockRancherManager.executeOnServer.mockResolvedValue(complexMetrics);

        const result = await monitoringManager.getMetrics('test-server', 'complex-resource', 'resource-id');

        expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
        expect(result).toEqual(complexMetrics);
      });

      it('should handle alert creation with minimal data', async () => {
        const minimalAlertData = { name: 'minimal-alert' };
        mockRancherManager.executeOnServer.mockResolvedValue({ id: 'alert-1', ...minimalAlertData });

        const result = await monitoringManager.createAlert('test-server', minimalAlertData);

        expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
        expect(result).toEqual({ id: 'alert-1', ...minimalAlertData });
      });
    });

    describe('BackupManager additional tests', () => {
      it('should handle backup restoration with complex data', async () => {
        const complexRestoreData = { 
          clusterId: 'cluster-1', 
          options: { preserveVolumes: true, includeSecrets: false } 
        };
        mockRancherManager.executeOnServer.mockResolvedValue({ success: true, restoreId: 'restore-1' });

        const result = await backupManager.restoreBackup('test-server', 'backup-1', complexRestoreData);

        expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
        expect(result).toEqual({ success: true, restoreId: 'restore-1' });
      });

      it('should handle backup creation with minimal data', async () => {
        const minimalBackupData = { name: 'minimal-backup' };
        mockRancherManager.executeOnServer.mockResolvedValue({ id: 'backup-1', ...minimalBackupData });

        const result = await backupManager.createBackup('test-server', minimalBackupData);

        expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
        expect(result).toEqual({ id: 'backup-1', ...minimalBackupData });
      });
    });

    describe('NodeManager additional tests', () => {
      it('should handle node retrieval with complex node data', async () => {
        const complexNode = {
          id: 'node-1',
          name: 'worker-node-1',
          status: 'Ready',
          capacity: { cpu: '4', memory: '8Gi' },
          allocatable: { cpu: '3.5', memory: '7Gi' }
        };
        mockRancherManager.executeOnServer.mockResolvedValue(complexNode);

        const result = await nodeManager.getNode('test-server', 'node-1');

        expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
        expect(result).toEqual(complexNode);
      });
    });

    describe('StorageManager additional tests', () => {
      it('should handle storage classes with complex configuration', async () => {
        const complexStorageClasses = [{
          id: 'storage-1',
          name: 'fast-ssd',
          provisioner: 'kubernetes.io/aws-ebs',
          parameters: { type: 'gp3', iops: '3000' }
        }];
        mockRancherManager.executeOnServer.mockResolvedValue(complexStorageClasses);

        const result = await storageManager.getStorageClasses('test-server', 'cluster-1');

        expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
        expect(result).toEqual(complexStorageClasses);
      });

      it('should handle persistent volumes with complex data', async () => {
        const complexVolumes = [{
          id: 'pv-1',
          name: 'persistent-volume-1',
          capacity: '100Gi',
          accessModes: ['ReadWriteOnce'],
          status: 'Bound'
        }];
        mockRancherManager.executeOnServer.mockResolvedValue(complexVolumes);

        const result = await storageManager.getPersistentVolumes('test-server', 'cluster-1');

        expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
        expect(result).toEqual(complexVolumes);
      });
    });

    describe('NetworkManager additional tests', () => {
      it('should handle services with complex configuration', async () => {
        const complexServices = [{
          id: 'service-1',
          name: 'web-service',
          type: 'LoadBalancer',
          ports: [{ port: 80, targetPort: 8080 }],
          selector: { app: 'web' }
        }];
        mockRancherManager.executeOnServer.mockResolvedValue(complexServices);

        const result = await networkManager.getServices('test-server', 'cluster-1');

        expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
        expect(result).toEqual(complexServices);
      });

      it('should handle ingresses with complex rules', async () => {
        const complexIngresses = [{
          id: 'ingress-1',
          name: 'web-ingress',
          rules: [{
            host: 'example.com',
            http: { paths: [{ path: '/', backend: { serviceName: 'web-service', servicePort: 80 } }] }
          }]
        }];
        mockRancherManager.executeOnServer.mockResolvedValue(complexIngresses);

        const result = await networkManager.getIngresses('test-server', 'cluster-1');

        expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
        expect(result).toEqual(complexIngresses);
      });
    });

    describe('SecurityManager additional tests', () => {
      it('should handle role binding creation with complex data', async () => {
        const complexRoleBindingData = {
          name: 'admin-binding',
          roleId: 'admin-role',
          userId: 'user-1',
          namespace: 'default',
          subjects: [{ kind: 'User', name: 'user-1' }]
        };
        mockRancherManager.executeOnServer.mockResolvedValue({ id: 'binding-1', ...complexRoleBindingData });

        const result = await securityManager.createRoleBinding('test-server', complexRoleBindingData);

        expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
        expect(result).toEqual({ id: 'binding-1', ...complexRoleBindingData });
      });
    });

    describe('CatalogManager additional tests', () => {
      it('should handle catalog templates with complex structure', async () => {
        const complexTemplates = [{
          id: 'template-1',
          name: 'wordpress',
          version: '1.0.0',
          description: 'WordPress application',
          categories: ['CMS', 'Web'],
          maintainer: 'WordPress Team'
        }];
        mockRancherManager.executeOnServer.mockResolvedValue(complexTemplates);

        const result = await catalogManager.getCatalogTemplates('test-server', 'catalog-1');

        expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
        expect(result).toEqual(complexTemplates);
      });
    });

    describe('WorkloadManager additional tests', () => {
      it('should handle workload creation with complex configuration', async () => {
        const complexWorkloadData = {
          name: 'complex-workload',
          type: 'deployment',
          replicas: 3,
          containers: [{
            name: 'app',
            image: 'nginx:latest',
            ports: [{ containerPort: 80 }],
            resources: { requests: { cpu: '100m', memory: '128Mi' } }
          }]
        };
        mockRancherManager.executeOnServer.mockResolvedValue({ id: 'workload-1', ...complexWorkloadData });

        const result = await workloadManager.createWorkload('test-server', complexWorkloadData);

        expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
        expect(result).toEqual({ id: 'workload-1', ...complexWorkloadData });
      });

      it('should handle workload update with partial data', async () => {
        const partialWorkloadData = { replicas: 5 };
        mockRancherManager.executeOnServer.mockResolvedValue({ id: 'workload-1', replicas: 5 });

        const result = await workloadManager.updateWorkload('test-server', 'workload-1', partialWorkloadData);

        expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
        expect(result).toEqual({ id: 'workload-1', replicas: 5 });
      });
    });

    describe('ConfigManager additional tests', () => {
      it('should handle setting update with complex value', async () => {
        const complexValue = { enabled: true, timeout: 30000, retries: 3 };
        mockRancherManager.executeOnServer.mockResolvedValue({ id: 'setting-1', value: complexValue });

        const result = await configManager.updateSetting('test-server', 'setting-1', complexValue);

        expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
        expect(result).toEqual({ id: 'setting-1', value: complexValue });
      });
    });

    describe('EventManager additional tests', () => {
      it('should handle events with complex filters', async () => {
        const complexFilters = {
          type: 'warning',
          namespace: 'default',
          resourceType: 'pod',
          timeRange: { start: '2024-01-01T00:00:00Z', end: '2024-01-02T00:00:00Z' }
        };
        const complexEvents = [{
          id: 'event-1',
          type: 'warning',
          reason: 'FailedScheduling',
          message: 'Pod could not be scheduled',
          timestamp: '2024-01-01T12:00:00Z'
        }];
        mockRancherManager.executeOnServer.mockResolvedValue(complexEvents);

        const result = await eventManager.getEvents('test-server', complexFilters);

        expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
        expect(result).toEqual(complexEvents);
      });
    });

    describe('LogManager additional tests', () => {
      it('should handle logs with complex options', async () => {
        const complexOptions = {
          lines: 1000,
          follow: false,
          timestamps: true,
          previous: false,
          container: 'app-container'
        };
        const complexLogs = '2024-01-01T12:00:00Z [INFO] Application started\n2024-01-01T12:01:00Z [INFO] Request processed';
        mockRancherManager.executeOnServer.mockResolvedValue(complexLogs);

        const result = await logManager.getLogs('test-server', 'pod', 'pod-1', complexOptions);

        expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
        expect(result).toEqual(complexLogs);
      });
    });

    describe('MetricManager additional tests', () => {
      it('should handle metrics with complex options', async () => {
        const complexOptions = {
          period: '1h',
          step: '5m',
          start: '2024-01-01T00:00:00Z',
          end: '2024-01-01T23:59:59Z'
        };
        const complexMetrics = {
          cpu: { usage: [50, 60, 55], timestamps: ['2024-01-01T00:00:00Z', '2024-01-01T00:05:00Z', '2024-01-01T00:10:00Z'] },
          memory: { usage: [80, 85, 82], timestamps: ['2024-01-01T00:00:00Z', '2024-01-01T00:05:00Z', '2024-01-01T00:10:00Z'] }
        };
        mockRancherManager.executeOnServer.mockResolvedValue(complexMetrics);

        const result = await metricManager.getMetrics('test-server', 'cluster', 'cluster-1', complexOptions);

        expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
        expect(result).toEqual(complexMetrics);
      });
    });

    describe('AlertManager additional tests', () => {
      it('should handle alert creation with complex data', async () => {
        const complexAlertData = {
          name: 'complex-alert',
          condition: 'cpu_usage > 80',
          severity: 'critical',
          description: 'High CPU usage detected',
          labels: { environment: 'production', team: 'platform' }
        };
        mockRancherManager.executeOnServer.mockResolvedValue({ id: 'alert-1', ...complexAlertData });

        const result = await alertManager.createAlert('test-server', complexAlertData);

        expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
        expect(result).toEqual({ id: 'alert-1', ...complexAlertData });
      });
    });

    describe('PolicyManager additional tests', () => {
      it('should handle policy creation with complex rules', async () => {
        const complexPolicyData = {
          name: 'security-policy',
          rules: [
            { apiGroups: ['*'], resources: ['pods'], verbs: ['get', 'list'] },
            { apiGroups: ['*'], resources: ['secrets'], verbs: ['get'], resourceNames: ['default-token-*'] }
          ]
        };
        mockRancherManager.executeOnServer.mockResolvedValue({ id: 'policy-1', ...complexPolicyData });

        const result = await policyManager.createPolicy('test-server', complexPolicyData);

        expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
        expect(result).toEqual({ id: 'policy-1', ...complexPolicyData });
      });
    });

    describe('QuotaManager additional tests', () => {
      it('should handle quota creation with complex limits', async () => {
        const complexQuotaData = {
          name: 'project-quota',
          limits: {
            requests: { cpu: '4', memory: '8Gi', persistentvolumeclaims: '10' },
            limits: { cpu: '8', memory: '16Gi' }
          }
        };
        mockRancherManager.executeOnServer.mockResolvedValue({ id: 'quota-1', ...complexQuotaData });

        const result = await quotaManager.createQuota('test-server', complexQuotaData);

        expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
        expect(result).toEqual({ id: 'quota-1', ...complexQuotaData });
      });
    });

    describe('NamespaceManager additional tests', () => {
      it('should handle namespace creation with complex data', async () => {
        const complexNamespaceData = {
          name: 'complex-namespace',
          labels: { environment: 'production', team: 'platform' },
          annotations: { 'description': 'Production namespace for platform team' }
        };
        mockRancherManager.executeOnServer.mockResolvedValue({ id: 'namespace-1', ...complexNamespaceData });

        const result = await namespaceManager.createNamespace('test-server', complexNamespaceData);

        expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
        expect(result).toEqual({ id: 'namespace-1', ...complexNamespaceData });
      });

      it('should handle namespace deletion with confirmation', async () => {
        mockRancherManager.executeOnServer.mockResolvedValue({ success: true, message: 'Namespace deleted successfully' });

        const result = await namespaceManager.deleteNamespace('test-server', 'namespace-1');

        expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
        expect(result).toEqual({ success: true, message: 'Namespace deleted successfully' });
      });
    });
  });

  describe('Manager instance validation', () => {
    it('should validate that all managers are properly instantiated', () => {
      const managers = [
        new UserManager(mockRancherManager),
        new MonitoringManager(mockRancherManager),
        new BackupManager(mockRancherManager),
        new NodeManager(mockRancherManager),
        new StorageManager(mockRancherManager),
        new NetworkManager(mockRancherManager),
        new SecurityManager(mockRancherManager),
        new CatalogManager(mockRancherManager),
        new WorkloadManager(mockRancherManager),
        new ConfigManager(mockRancherManager),
        new EventManager(mockRancherManager),
        new LogManager(mockRancherManager),
        new MetricManager(mockRancherManager),
        new AlertManager(mockRancherManager),
        new PolicyManager(mockRancherManager),
        new QuotaManager(mockRancherManager),
        new NamespaceManager(mockRancherManager)
      ];

      managers.forEach(manager => {
        expect(manager).toBeDefined();
        expect(typeof manager).toBe('object');
      });
    });
  });

  describe('Additional method coverage tests', () => {
    let userManager: UserManager;
    let monitoringManager: MonitoringManager;
    let backupManager: BackupManager;
    let nodeManager: NodeManager;
    let storageManager: StorageManager;
    let networkManager: NetworkManager;
    let securityManager: SecurityManager;
    let catalogManager: CatalogManager;
    let workloadManager: WorkloadManager;
    let configManager: ConfigManager;
    let eventManager: EventManager;
    let logManager: LogManager;
    let metricManager: MetricManager;
    let alertManager: AlertManager;
    let policyManager: PolicyManager;
    let quotaManager: QuotaManager;
    let namespaceManager: NamespaceManager;

    beforeEach(() => {
      userManager = new UserManager(mockRancherManager);
      monitoringManager = new MonitoringManager(mockRancherManager);
      backupManager = new BackupManager(mockRancherManager);
      nodeManager = new NodeManager(mockRancherManager);
      storageManager = new StorageManager(mockRancherManager);
      networkManager = new NetworkManager(mockRancherManager);
      securityManager = new SecurityManager(mockRancherManager);
      catalogManager = new CatalogManager(mockRancherManager);
      workloadManager = new WorkloadManager(mockRancherManager);
      configManager = new ConfigManager(mockRancherManager);
      eventManager = new EventManager(mockRancherManager);
      logManager = new LogManager(mockRancherManager);
      metricManager = new MetricManager(mockRancherManager);
      alertManager = new AlertManager(mockRancherManager);
      policyManager = new PolicyManager(mockRancherManager);
      quotaManager = new QuotaManager(mockRancherManager);
      namespaceManager = new NamespaceManager(mockRancherManager);
    });

    describe('UserManager method coverage', () => {
      it('should handle getUser with complex user data', async () => {
        const complexUser = {
          id: 'user-1',
          name: 'John Doe',
          username: 'johndoe',
          email: 'john@example.com',
          enabled: true,
          created: '2024-01-01T00:00:00Z',
          updated: '2024-01-01T00:00:00Z',
          roles: ['admin', 'user'],
          groups: ['developers', 'admins']
        };
        mockRancherManager.executeOnServer.mockResolvedValue(complexUser);

        const result = await userManager.getUser('test-server', 'user-1');

        expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
        expect(result).toEqual(complexUser);
      });

      it('should handle createUser with full user data', async () => {
        const fullUserData = {
          name: 'Jane Doe',
          username: 'janedoe',
          password: 'securepassword',
          email: 'jane@example.com',
          enabled: true,
          roles: ['user'],
          groups: ['developers']
        };
        mockRancherManager.executeOnServer.mockResolvedValue({ id: 'user-2', ...fullUserData });

        const result = await userManager.createUser('test-server', fullUserData);

        expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
        expect(result).toEqual({ id: 'user-2', ...fullUserData });
      });
    });

    describe('MonitoringManager method coverage', () => {
      it('should handle getMetrics with different resource types', async () => {
        const nodeMetrics = { cpu: 25, memory: 60, disk: 40 };
        mockRancherManager.executeOnServer.mockResolvedValue(nodeMetrics);

        const result = await monitoringManager.getMetrics('test-server', 'node', 'node-1');

        expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
        expect(result).toEqual(nodeMetrics);
      });

      it('should handle getAlerts with different alert types', async () => {
        const criticalAlerts = [
          { id: 'alert-1', severity: 'critical', message: 'High CPU usage' },
          { id: 'alert-2', severity: 'critical', message: 'Memory pressure' }
        ];
        mockRancherManager.executeOnServer.mockResolvedValue(criticalAlerts);

        const result = await monitoringManager.getAlerts('test-server');

        expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
        expect(result).toEqual(criticalAlerts);
      });
    });

    describe('BackupManager method coverage', () => {
      it('should handle getBackups with backup status', async () => {
        const backupsWithStatus = [
          { id: 'backup-1', name: 'backup-1', status: 'completed', size: '1GB' },
          { id: 'backup-2', name: 'backup-2', status: 'in-progress', size: '500MB' }
        ];
        mockRancherManager.executeOnServer.mockResolvedValue(backupsWithStatus);

        const result = await backupManager.getBackups('test-server');

        expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
        expect(result).toEqual(backupsWithStatus);
      });
    });

    describe('NodeManager method coverage', () => {
      it('should handle getNodes without clusterId', async () => {
        const allNodes = [
          { id: 'node-1', name: 'worker-1', status: 'Ready' },
          { id: 'node-2', name: 'worker-2', status: 'Ready' }
        ];
        mockRancherManager.executeOnServer.mockResolvedValue(allNodes);

        const result = await nodeManager.getNodes('test-server');

        expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
        expect(result).toEqual(allNodes);
      });
    });

    describe('StorageManager method coverage', () => {
      it('should handle getStorageClasses without clusterId', async () => {
        const defaultStorageClasses = [
          { id: 'default', name: 'default', provisioner: 'kubernetes.io/aws-ebs' }
        ];
        mockRancherManager.executeOnServer.mockResolvedValue(defaultStorageClasses);

        const result = await storageManager.getStorageClasses('test-server');

        expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
        expect(result).toEqual(defaultStorageClasses);
      });

      it('should handle getPersistentVolumes without clusterId', async () => {
        const allVolumes = [
          { id: 'pv-1', name: 'volume-1', status: 'Bound' },
          { id: 'pv-2', name: 'volume-2', status: 'Available' }
        ];
        mockRancherManager.executeOnServer.mockResolvedValue(allVolumes);

        const result = await storageManager.getPersistentVolumes('test-server');

        expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
        expect(result).toEqual(allVolumes);
      });
    });

    describe('NetworkManager method coverage', () => {
      it('should handle getServices without clusterId', async () => {
        const allServices = [
          { id: 'svc-1', name: 'kubernetes', type: 'ClusterIP' },
          { id: 'svc-2', name: 'kube-dns', type: 'ClusterIP' }
        ];
        mockRancherManager.executeOnServer.mockResolvedValue(allServices);

        const result = await networkManager.getServices('test-server');

        expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
        expect(result).toEqual(allServices);
      });

      it('should handle getIngresses without clusterId', async () => {
        const allIngresses = [
          { id: 'ing-1', name: 'web-ingress', rules: [] },
          { id: 'ing-2', name: 'api-ingress', rules: [] }
        ];
        mockRancherManager.executeOnServer.mockResolvedValue(allIngresses);

        const result = await networkManager.getIngresses('test-server');

        expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
        expect(result).toEqual(allIngresses);
      });
    });

    describe('SecurityManager method coverage', () => {
      it('should handle getRoles with role details', async () => {
        const rolesWithDetails = [
          { id: 'admin', name: 'Administrator', rules: [{ apiGroups: ['*'], resources: ['*'], verbs: ['*'] }] },
          { id: 'user', name: 'User', rules: [{ apiGroups: ['*'], resources: ['pods'], verbs: ['get', 'list'] }] }
        ];
        mockRancherManager.executeOnServer.mockResolvedValue(rolesWithDetails);

        const result = await securityManager.getRoles('test-server');

        expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
        expect(result).toEqual(rolesWithDetails);
      });

      it('should handle getRoleBindings with binding details', async () => {
        const bindingsWithDetails = [
          { id: 'binding-1', roleId: 'admin', userId: 'user-1', namespace: 'default' },
          { id: 'binding-2', roleId: 'user', userId: 'user-2', namespace: 'kube-system' }
        ];
        mockRancherManager.executeOnServer.mockResolvedValue(bindingsWithDetails);

        const result = await securityManager.getRoleBindings('test-server');

        expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
        expect(result).toEqual(bindingsWithDetails);
      });
    });

    describe('CatalogManager method coverage', () => {
      it('should handle getCatalogs with catalog details', async () => {
        const catalogsWithDetails = [
          { id: 'library', name: 'Library', url: 'https://charts.helm.sh/stable' },
          { id: 'custom', name: 'Custom', url: 'https://custom.charts.com' }
        ];
        mockRancherManager.executeOnServer.mockResolvedValue(catalogsWithDetails);

        const result = await catalogManager.getCatalogs('test-server');

        expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
        expect(result).toEqual(catalogsWithDetails);
      });
    });

    describe('WorkloadManager method coverage', () => {
      it('should handle getWorkloads without projectId', async () => {
        const allWorkloads = [
          { id: 'workload-1', name: 'nginx', type: 'deployment' },
          { id: 'workload-2', name: 'redis', type: 'statefulset' }
        ];
        mockRancherManager.executeOnServer.mockResolvedValue(allWorkloads);

        const result = await workloadManager.getWorkloads('test-server');

        expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
        expect(result).toEqual(allWorkloads);
      });
    });

    describe('ConfigManager method coverage', () => {
      it('should handle getSettings with setting details', async () => {
        const settingsWithDetails = [
          { id: 'setting-1', name: 'api.version', value: 'v1', type: 'string' },
          { id: 'setting-2', name: 'auth.token.min', value: '1000', type: 'number' }
        ];
        mockRancherManager.executeOnServer.mockResolvedValue(settingsWithDetails);

        const result = await configManager.getSettings('test-server');

        expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
        expect(result).toEqual(settingsWithDetails);
      });
    });

    describe('EventManager method coverage', () => {
      it('should handle getEvents without filters', async () => {
        const allEvents = [
          { id: 'event-1', type: 'Normal', reason: 'Scheduled', message: 'Pod scheduled' },
          { id: 'event-2', type: 'Warning', reason: 'FailedScheduling', message: 'Pod could not be scheduled' }
        ];
        mockRancherManager.executeOnServer.mockResolvedValue(allEvents);

        const result = await eventManager.getEvents('test-server');

        expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
        expect(result).toEqual(allEvents);
      });
    });

    describe('LogManager method coverage', () => {
      it('should handle getLogs without options', async () => {
        const defaultLogs = '2024-01-01T12:00:00Z [INFO] Application started';
        mockRancherManager.executeOnServer.mockResolvedValue(defaultLogs);

        const result = await logManager.getLogs('test-server', 'pod', 'pod-1');

        expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
        expect(result).toEqual(defaultLogs);
      });
    });

    describe('MetricManager method coverage', () => {
      it('should handle getMetrics without options', async () => {
        const defaultMetrics = { cpu: 50, memory: 80 };
        mockRancherManager.executeOnServer.mockResolvedValue(defaultMetrics);

        const result = await metricManager.getMetrics('test-server', 'cluster', 'cluster-1');

        expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
        expect(result).toEqual(defaultMetrics);
      });
    });

    describe('AlertManager method coverage', () => {
      it('should handle getAlerts with different alert states', async () => {
        const alertsWithStates = [
          { id: 'alert-1', severity: 'critical', state: 'firing' },
          { id: 'alert-2', severity: 'warning', state: 'resolved' }
        ];
        mockRancherManager.executeOnServer.mockResolvedValue(alertsWithStates);

        const result = await alertManager.getAlerts('test-server');

        expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
        expect(result).toEqual(alertsWithStates);
      });
    });

    describe('PolicyManager method coverage', () => {
      it('should handle getPolicies with policy details', async () => {
        const policiesWithDetails = [
          { id: 'policy-1', name: 'Security Policy', rules: [] },
          { id: 'policy-2', name: 'Resource Policy', rules: [] }
        ];
        mockRancherManager.executeOnServer.mockResolvedValue(policiesWithDetails);

        const result = await policyManager.getPolicies('test-server');

        expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
        expect(result).toEqual(policiesWithDetails);
      });
    });

    describe('QuotaManager method coverage', () => {
      it('should handle getQuotas without projectId', async () => {
        const allQuotas = [
          { id: 'quota-1', name: 'default-quota', limits: {} },
          { id: 'quota-2', name: 'project-quota', limits: {} }
        ];
        mockRancherManager.executeOnServer.mockResolvedValue(allQuotas);

        const result = await quotaManager.getQuotas('test-server');

        expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
        expect(result).toEqual(allQuotas);
      });
    });

    describe('NamespaceManager method coverage', () => {
      it('should handle getNamespaces without projectId', async () => {
        const allNamespaces = [
          { id: 'default', name: 'default', projectId: 'project-1', state: 'Active' },
          { id: 'kube-system', name: 'kube-system', projectId: 'project-2', state: 'Active' }
        ];
        mockRancherManager.executeOnServer.mockResolvedValue(allNamespaces);

        const result = await namespaceManager.getNamespaces('test-server');

        expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
        expect(result).toEqual(allNamespaces);
      });
    });
  });

  describe('Edge cases and error scenarios', () => {
    let userManager: UserManager;
    let monitoringManager: MonitoringManager;
    let backupManager: BackupManager;
    let nodeManager: NodeManager;
    let storageManager: StorageManager;
    let networkManager: NetworkManager;
    let securityManager: SecurityManager;
    let catalogManager: CatalogManager;
    let workloadManager: WorkloadManager;
    let configManager: ConfigManager;
    let eventManager: EventManager;
    let logManager: LogManager;
    let metricManager: MetricManager;
    let alertManager: AlertManager;
    let policyManager: PolicyManager;
    let quotaManager: QuotaManager;
    let namespaceManager: NamespaceManager;

    beforeEach(() => {
      userManager = new UserManager(mockRancherManager);
      monitoringManager = new MonitoringManager(mockRancherManager);
      backupManager = new BackupManager(mockRancherManager);
      nodeManager = new NodeManager(mockRancherManager);
      storageManager = new StorageManager(mockRancherManager);
      networkManager = new NetworkManager(mockRancherManager);
      securityManager = new SecurityManager(mockRancherManager);
      catalogManager = new CatalogManager(mockRancherManager);
      workloadManager = new WorkloadManager(mockRancherManager);
      configManager = new ConfigManager(mockRancherManager);
      eventManager = new EventManager(mockRancherManager);
      logManager = new LogManager(mockRancherManager);
      metricManager = new MetricManager(mockRancherManager);
      alertManager = new AlertManager(mockRancherManager);
      policyManager = new PolicyManager(mockRancherManager);
      quotaManager = new QuotaManager(mockRancherManager);
      namespaceManager = new NamespaceManager(mockRancherManager);
    });

    describe('UserManager edge cases', () => {
      it('should handle getUser with null response', async () => {
        mockRancherManager.executeOnServer.mockResolvedValue(null);

        const result = await userManager.getUser('test-server', 'non-existent');

        expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
        expect(result).toBeNull();
      });

      it('should handle createUser with undefined data', async () => {
        mockRancherManager.executeOnServer.mockResolvedValue({ id: 'user-1' });

        const result = await userManager.createUser('test-server', undefined as any);

        expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
        expect(result).toEqual({ id: 'user-1' });
      });
    });

    describe('MonitoringManager edge cases', () => {
      it('should handle getMetrics with empty resource type', async () => {
        mockRancherManager.executeOnServer.mockResolvedValue({});

        const result = await monitoringManager.getMetrics('test-server', '', 'resource-id');

        expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
        expect(result).toEqual({});
      });

      it('should handle createAlert with null data', async () => {
        mockRancherManager.executeOnServer.mockResolvedValue({ id: 'alert-1' });

        const result = await monitoringManager.createAlert('test-server', null as any);

        expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
        expect(result).toEqual({ id: 'alert-1' });
      });
    });

    describe('BackupManager edge cases', () => {
      it('should handle createBackup with empty backup data', async () => {
        mockRancherManager.executeOnServer.mockResolvedValue({ id: 'backup-1' });

        const result = await backupManager.createBackup('test-server', {});

        expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
        expect(result).toEqual({ id: 'backup-1' });
      });

      it('should handle restoreBackup with null restore data', async () => {
        mockRancherManager.executeOnServer.mockResolvedValue({ success: true });

        const result = await backupManager.restoreBackup('test-server', 'backup-1', null as any);

        expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
        expect(result).toEqual({ success: true });
      });
    });

    describe('NodeManager edge cases', () => {
      it('should handle getNodes with undefined clusterId', async () => {
        mockRancherManager.executeOnServer.mockResolvedValue([]);

        const result = await nodeManager.getNodes('test-server', undefined);

        expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
        expect(result).toEqual([]);
      });
    });

    describe('StorageManager edge cases', () => {
      it('should handle getStorageClasses with undefined clusterId', async () => {
        mockRancherManager.executeOnServer.mockResolvedValue([]);

        const result = await storageManager.getStorageClasses('test-server', undefined);

        expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
        expect(result).toEqual([]);
      });

      it('should handle getPersistentVolumes with undefined clusterId', async () => {
        mockRancherManager.executeOnServer.mockResolvedValue([]);

        const result = await storageManager.getPersistentVolumes('test-server', undefined);

        expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
        expect(result).toEqual([]);
      });
    });

    describe('NetworkManager edge cases', () => {
      it('should handle getServices with undefined clusterId', async () => {
        mockRancherManager.executeOnServer.mockResolvedValue([]);

        const result = await networkManager.getServices('test-server', undefined);

        expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
        expect(result).toEqual([]);
      });

      it('should handle getIngresses with undefined clusterId', async () => {
        mockRancherManager.executeOnServer.mockResolvedValue([]);

        const result = await networkManager.getIngresses('test-server', undefined);

        expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
        expect(result).toEqual([]);
      });
    });

    describe('SecurityManager edge cases', () => {
      it('should handle createRoleBinding with empty data', async () => {
        mockRancherManager.executeOnServer.mockResolvedValue({ id: 'binding-1' });

        const result = await securityManager.createRoleBinding('test-server', {});

        expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
        expect(result).toEqual({ id: 'binding-1' });
      });
    });

    describe('CatalogManager edge cases', () => {
      it('should handle getCatalogTemplates with empty catalog id', async () => {
        mockRancherManager.executeOnServer.mockResolvedValue([]);

        const result = await catalogManager.getCatalogTemplates('test-server', '');

        expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
        expect(result).toEqual([]);
      });
    });

    describe('WorkloadManager edge cases', () => {
      it('should handle getWorkloads with undefined projectId', async () => {
        mockRancherManager.executeOnServer.mockResolvedValue([]);

        const result = await workloadManager.getWorkloads('test-server', undefined);

        expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
        expect(result).toEqual([]);
      });

      it('should handle updateWorkload with null workload data', async () => {
        mockRancherManager.executeOnServer.mockResolvedValue({ id: 'workload-1' });

        const result = await workloadManager.updateWorkload('test-server', 'workload-1', null as any);

        expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
        expect(result).toEqual({ id: 'workload-1' });
      });
    });

    describe('ConfigManager edge cases', () => {
      it('should handle updateSetting with null value', async () => {
        mockRancherManager.executeOnServer.mockResolvedValue({ id: 'setting-1', value: null });

        const result = await configManager.updateSetting('test-server', 'setting-1', null);

        expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
        expect(result).toEqual({ id: 'setting-1', value: null });
      });
    });

    describe('EventManager edge cases', () => {
      it('should handle getEvents with null filters', async () => {
        mockRancherManager.executeOnServer.mockResolvedValue([]);

        const result = await eventManager.getEvents('test-server', null);

        expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
        expect(result).toEqual([]);
      });
    });

    describe('LogManager edge cases', () => {
      it('should handle getLogs with null options', async () => {
        mockRancherManager.executeOnServer.mockResolvedValue('');

        const result = await logManager.getLogs('test-server', 'pod', 'pod-1', null);

        expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
        expect(result).toEqual('');
      });
    });

    describe('MetricManager edge cases', () => {
      it('should handle getMetrics with null options', async () => {
        mockRancherManager.executeOnServer.mockResolvedValue({});

        const result = await metricManager.getMetrics('test-server', 'cluster', 'cluster-1', null);

        expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
        expect(result).toEqual({});
      });
    });

    describe('AlertManager edge cases', () => {
      it('should handle createAlert with undefined data', async () => {
        mockRancherManager.executeOnServer.mockResolvedValue({ id: 'alert-1' });

        const result = await alertManager.createAlert('test-server', undefined as any);

        expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
        expect(result).toEqual({ id: 'alert-1' });
      });
    });

    describe('PolicyManager edge cases', () => {
      it('should handle createPolicy with empty policy data', async () => {
        mockRancherManager.executeOnServer.mockResolvedValue({ id: 'policy-1' });

        const result = await policyManager.createPolicy('test-server', {});

        expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
        expect(result).toEqual({ id: 'policy-1' });
      });
    });

    describe('QuotaManager edge cases', () => {
      it('should handle getQuotas with undefined projectId', async () => {
        mockRancherManager.executeOnServer.mockResolvedValue([]);

        const result = await quotaManager.getQuotas('test-server', undefined);

        expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
        expect(result).toEqual([]);
      });

      it('should handle createQuota with null quota data', async () => {
        mockRancherManager.executeOnServer.mockResolvedValue({ id: 'quota-1' });

        const result = await quotaManager.createQuota('test-server', null as any);

        expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
        expect(result).toEqual({ id: 'quota-1' });
      });
    });

    describe('NamespaceManager edge cases', () => {
      it('should handle getNamespaces with undefined projectId', async () => {
        mockRancherManager.executeOnServer.mockResolvedValue([]);

        const result = await namespaceManager.getNamespaces('test-server', undefined);

        expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
        expect(result).toEqual([]);
      });

      it('should handle createNamespace with empty namespace data', async () => {
        mockRancherManager.executeOnServer.mockResolvedValue({ id: 'namespace-1' });

        const result = await namespaceManager.createNamespace('test-server', {});

        expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
        expect(result).toEqual({ id: 'namespace-1' });
      });
    });
  });
});
