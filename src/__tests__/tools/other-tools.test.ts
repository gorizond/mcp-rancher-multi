import { describe, test, expect, beforeEach } from '@jest/globals';
import {
  ApplicationTools,
  UserTools,
  MonitoringTools,
  BackupTools,
  NodeTools,
  StorageTools,
  NetworkTools,
  SecurityTools,
  CatalogTools,
  WorkloadTools,
  ConfigTools,
  EventTools,
  LogTools,
  MetricTools,
  AlertTools,
  PolicyTools,
  QuotaTools,
  NamespaceTools
} from '../../tools/other-tools';
import { BaseToolManager } from '../../tools/base';

// Mock BaseToolManager
const mockRancherManager = {
  getLogger: jest.fn().mockReturnValue({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }),
  getConfigManager: jest.fn().mockReturnValue({
    getServerNames: jest.fn().mockReturnValue(['server1', 'server2']),
    validateConfig: jest.fn().mockReturnValue({ valid: true, errors: [] })
  }),
  executeOnServer: jest.fn().mockResolvedValue('server result'),
  executeOnAllServers: jest.fn().mockResolvedValue(new Map([
    ['server1', 'result1'],
    ['server2', 'result2']
  ]))
};

describe('Other Tools', () => {
  describe('ApplicationTools', () => {
    let applicationTools: ApplicationTools;

    beforeEach(() => {
      applicationTools = new ApplicationTools(mockRancherManager as any);
    });

    test('should create ApplicationTools instance', () => {
      expect(applicationTools).toBeInstanceOf(ApplicationTools);
    });

    test('should return application tools', () => {
      const tools = applicationTools.getTools();
      expect(tools).toHaveLength(4);
      
      const toolNames = tools.map(tool => tool.name);
      expect(toolNames).toContain('rancher_list_applications');
      expect(toolNames).toContain('rancher_get_application');
      expect(toolNames).toContain('rancher_create_application');
      expect(toolNames).toContain('rancher_delete_application');
    });

    test('should have correct input schemas for application tools', () => {
      const tools = applicationTools.getTools();
      
      const listAppsTool = tools.find(t => t.name === 'rancher_list_applications');
      expect(listAppsTool?.inputSchema.properties).toHaveProperty('serverName');
      expect(listAppsTool?.inputSchema.properties).toHaveProperty('projectId');
      expect(listAppsTool?.inputSchema.required).toContain('serverName');
      
      const getAppTool = tools.find(t => t.name === 'rancher_get_application');
      expect(getAppTool?.inputSchema.properties).toHaveProperty('serverName');
      expect(getAppTool?.inputSchema.properties).toHaveProperty('appId');
      expect(getAppTool?.inputSchema.required).toContain('serverName');
      expect(getAppTool?.inputSchema.required).toContain('appId');
    });
  });

  describe('UserTools', () => {
    let userTools: UserTools;

    beforeEach(() => {
      userTools = new UserTools(mockRancherManager as any);
    });

    test('should create UserTools instance', () => {
      expect(userTools).toBeInstanceOf(UserTools);
    });

    test('should return user tools', () => {
      const tools = userTools.getTools();
      expect(tools).toHaveLength(4);
      
      const toolNames = tools.map(tool => tool.name);
      expect(toolNames).toContain('rancher_list_users');
      expect(toolNames).toContain('rancher_get_user');
      expect(toolNames).toContain('rancher_create_user');
      expect(toolNames).toContain('rancher_delete_user');
    });

    test('should have correct input schemas for user tools', () => {
      const tools = userTools.getTools();
      
      const createUserTool = tools.find(t => t.name === 'rancher_create_user');
      expect(createUserTool?.inputSchema.properties).toHaveProperty('serverName');
      expect(createUserTool?.inputSchema.properties).toHaveProperty('username');
      expect(createUserTool?.inputSchema.properties).toHaveProperty('password');
      expect(createUserTool?.inputSchema.properties).toHaveProperty('name');
      expect(createUserTool?.inputSchema.properties).toHaveProperty('email');
      expect(createUserTool?.inputSchema.required).toContain('serverName');
      expect(createUserTool?.inputSchema.required).toContain('username');
      expect(createUserTool?.inputSchema.required).toContain('password');
    });
  });

  describe('MonitoringTools', () => {
    let monitoringTools: MonitoringTools;

    beforeEach(() => {
      monitoringTools = new MonitoringTools(mockRancherManager as any);
    });

    test('should create MonitoringTools instance', () => {
      expect(monitoringTools).toBeInstanceOf(MonitoringTools);
    });

    test('should return monitoring tools', () => {
      const tools = monitoringTools.getTools();
      expect(tools).toHaveLength(3);
      
      const toolNames = tools.map(tool => tool.name);
      expect(toolNames).toContain('rancher_get_metrics');
      expect(toolNames).toContain('rancher_list_alerts');
      expect(toolNames).toContain('rancher_create_alert');
    });

    test('should have correct input schemas for monitoring tools', () => {
      const tools = monitoringTools.getTools();
      
      const getMetricsTool = tools.find(t => t.name === 'rancher_get_metrics');
      expect(getMetricsTool?.inputSchema.properties).toHaveProperty('serverName');
      expect(getMetricsTool?.inputSchema.properties).toHaveProperty('resourceType');
      expect(getMetricsTool?.inputSchema.properties).toHaveProperty('resourceId');
      expect(getMetricsTool?.inputSchema.required).toContain('serverName');
      expect(getMetricsTool?.inputSchema.required).toContain('resourceType');
      expect(getMetricsTool?.inputSchema.required).toContain('resourceId');
    });
  });

  describe('BackupTools', () => {
    let backupTools: BackupTools;

    beforeEach(() => {
      backupTools = new BackupTools(mockRancherManager as any);
    });

    test('should create BackupTools instance', () => {
      expect(backupTools).toBeInstanceOf(BackupTools);
    });

    test('should return backup tools', () => {
      const tools = backupTools.getTools();
      expect(tools).toHaveLength(3);
      
      const toolNames = tools.map(tool => tool.name);
      expect(toolNames).toContain('rancher_create_backup');
      expect(toolNames).toContain('rancher_list_backups');
      expect(toolNames).toContain('rancher_restore_backup');
    });

    test('should have correct input schemas for backup tools', () => {
      const tools = backupTools.getTools();
      
      const createBackupTool = tools.find(t => t.name === 'rancher_create_backup');
      expect(createBackupTool?.inputSchema.properties).toHaveProperty('serverName');
      expect(createBackupTool?.inputSchema.properties).toHaveProperty('name');
      expect(createBackupTool?.inputSchema.properties).toHaveProperty('clusterId');
      expect(createBackupTool?.inputSchema.required).toContain('serverName');
      expect(createBackupTool?.inputSchema.required).toContain('name');
      expect(createBackupTool?.inputSchema.required).toContain('clusterId');
    });
  });

  describe('NodeTools', () => {
    let nodeTools: NodeTools;

    beforeEach(() => {
      nodeTools = new NodeTools(mockRancherManager as any);
    });

    test('should create NodeTools instance', () => {
      expect(nodeTools).toBeInstanceOf(NodeTools);
    });

    test('should return node tools', () => {
      const tools = nodeTools.getTools();
      expect(tools).toHaveLength(2);
      
      const toolNames = tools.map(tool => tool.name);
      expect(toolNames).toContain('rancher_list_nodes');
      expect(toolNames).toContain('rancher_get_node');
    });

    test('should have correct input schemas for node tools', () => {
      const tools = nodeTools.getTools();
      
      const listNodesTool = tools.find(t => t.name === 'rancher_list_nodes');
      expect(listNodesTool?.inputSchema.properties).toHaveProperty('serverName');
      expect(listNodesTool?.inputSchema.properties).toHaveProperty('clusterId');
      expect(listNodesTool?.inputSchema.required).toContain('serverName');
      
      const getNodeTool = tools.find(t => t.name === 'rancher_get_node');
      expect(getNodeTool?.inputSchema.properties).toHaveProperty('serverName');
      expect(getNodeTool?.inputSchema.properties).toHaveProperty('nodeId');
      expect(getNodeTool?.inputSchema.required).toContain('serverName');
      expect(getNodeTool?.inputSchema.required).toContain('nodeId');
    });
  });

  describe('StorageTools', () => {
    let storageTools: StorageTools;

    beforeEach(() => {
      storageTools = new StorageTools(mockRancherManager as any);
    });

    test('should create StorageTools instance', () => {
      expect(storageTools).toBeInstanceOf(StorageTools);
    });

    test('should return storage tools', () => {
      const tools = storageTools.getTools();
      expect(tools).toHaveLength(2);
      
      const toolNames = tools.map(tool => tool.name);
      expect(toolNames).toContain('rancher_list_storage_classes');
      expect(toolNames).toContain('rancher_list_persistent_volumes');
    });

    test('should have correct input schemas for storage tools', () => {
      const tools = storageTools.getTools();
      
      const listStorageClassesTool = tools.find(t => t.name === 'rancher_list_storage_classes');
      expect(listStorageClassesTool?.inputSchema.properties).toHaveProperty('serverName');
      expect(listStorageClassesTool?.inputSchema.properties).toHaveProperty('clusterId');
      expect(listStorageClassesTool?.inputSchema.required).toContain('serverName');
    });
  });

  describe('NetworkTools', () => {
    let networkTools: NetworkTools;

    beforeEach(() => {
      networkTools = new NetworkTools(mockRancherManager as any);
    });

    test('should create NetworkTools instance', () => {
      expect(networkTools).toBeInstanceOf(NetworkTools);
    });

    test('should return network tools', () => {
      const tools = networkTools.getTools();
      expect(tools).toHaveLength(2);
      
      const toolNames = tools.map(tool => tool.name);
      expect(toolNames).toContain('rancher_list_services');
      expect(toolNames).toContain('rancher_list_ingresses');
    });

    test('should have correct input schemas for network tools', () => {
      const tools = networkTools.getTools();
      
      const listServicesTool = tools.find(t => t.name === 'rancher_list_services');
      expect(listServicesTool?.inputSchema.properties).toHaveProperty('serverName');
      expect(listServicesTool?.inputSchema.properties).toHaveProperty('clusterId');
      expect(listServicesTool?.inputSchema.required).toContain('serverName');
    });
  });

  describe('SecurityTools', () => {
    let securityTools: SecurityTools;

    beforeEach(() => {
      securityTools = new SecurityTools(mockRancherManager as any);
    });

    test('should create SecurityTools instance', () => {
      expect(securityTools).toBeInstanceOf(SecurityTools);
    });

    test('should return security tools', () => {
      const tools = securityTools.getTools();
      expect(tools).toHaveLength(3);
      
      const toolNames = tools.map(tool => tool.name);
      expect(toolNames).toContain('rancher_list_roles');
      expect(toolNames).toContain('rancher_list_role_bindings');
      expect(toolNames).toContain('rancher_create_role_binding');
    });

    test('should have correct input schemas for security tools', () => {
      const tools = securityTools.getTools();
      
      const createRoleBindingTool = tools.find(t => t.name === 'rancher_create_role_binding');
      expect(createRoleBindingTool?.inputSchema.properties).toHaveProperty('serverName');
      expect(createRoleBindingTool?.inputSchema.properties).toHaveProperty('name');
      expect(createRoleBindingTool?.inputSchema.properties).toHaveProperty('roleId');
      expect(createRoleBindingTool?.inputSchema.properties).toHaveProperty('userId');
      expect(createRoleBindingTool?.inputSchema.required).toContain('serverName');
      expect(createRoleBindingTool?.inputSchema.required).toContain('name');
      expect(createRoleBindingTool?.inputSchema.required).toContain('roleId');
      expect(createRoleBindingTool?.inputSchema.required).toContain('userId');
    });
  });

  describe('CatalogTools', () => {
    let catalogTools: CatalogTools;

    beforeEach(() => {
      catalogTools = new CatalogTools(mockRancherManager as any);
    });

    test('should create CatalogTools instance', () => {
      expect(catalogTools).toBeInstanceOf(CatalogTools);
    });

    test('should return catalog tools', () => {
      const tools = catalogTools.getTools();
      expect(tools).toHaveLength(2);
      
      const toolNames = tools.map(tool => tool.name);
      expect(toolNames).toContain('rancher_list_catalogs');
      expect(toolNames).toContain('rancher_get_catalog_templates');
    });

    test('should have correct input schemas for catalog tools', () => {
      const tools = catalogTools.getTools();
      
      const getCatalogTemplatesTool = tools.find(t => t.name === 'rancher_get_catalog_templates');
      expect(getCatalogTemplatesTool?.inputSchema.properties).toHaveProperty('serverName');
      expect(getCatalogTemplatesTool?.inputSchema.properties).toHaveProperty('catalogId');
      expect(getCatalogTemplatesTool?.inputSchema.required).toContain('serverName');
      expect(getCatalogTemplatesTool?.inputSchema.required).toContain('catalogId');
    });
  });

  describe('WorkloadTools', () => {
    let workloadTools: WorkloadTools;

    beforeEach(() => {
      workloadTools = new WorkloadTools(mockRancherManager as any);
    });

    test('should create WorkloadTools instance', () => {
      expect(workloadTools).toBeInstanceOf(WorkloadTools);
    });

    test('should return workload tools', () => {
      const tools = workloadTools.getTools();
      expect(tools).toHaveLength(5);
      
      const toolNames = tools.map(tool => tool.name);
      expect(toolNames).toContain('rancher_list_workloads');
      expect(toolNames).toContain('rancher_get_workload');
      expect(toolNames).toContain('rancher_create_workload');
      expect(toolNames).toContain('rancher_update_workload');
      expect(toolNames).toContain('rancher_delete_workload');
    });

    test('should have correct input schemas for workload tools', () => {
      const tools = workloadTools.getTools();
      
      const createWorkloadTool = tools.find(t => t.name === 'rancher_create_workload');
      expect(createWorkloadTool?.inputSchema.properties).toHaveProperty('serverName');
      expect(createWorkloadTool?.inputSchema.properties).toHaveProperty('name');
      expect(createWorkloadTool?.inputSchema.properties).toHaveProperty('projectId');
      expect(createWorkloadTool?.inputSchema.properties).toHaveProperty('type');
      expect(createWorkloadTool?.inputSchema.properties).toHaveProperty('containers');
      expect(createWorkloadTool?.inputSchema.required).toContain('serverName');
      expect(createWorkloadTool?.inputSchema.required).toContain('name');
      expect(createWorkloadTool?.inputSchema.required).toContain('projectId');
      expect(createWorkloadTool?.inputSchema.required).toContain('type');
    });
  });

  describe('ConfigTools', () => {
    let configTools: ConfigTools;

    beforeEach(() => {
      configTools = new ConfigTools(mockRancherManager as any);
    });

    test('should create ConfigTools instance', () => {
      expect(configTools).toBeInstanceOf(ConfigTools);
    });

    test('should return config tools', () => {
      const tools = configTools.getTools();
      expect(tools).toHaveLength(2);
      
      const toolNames = tools.map(tool => tool.name);
      expect(toolNames).toContain('rancher_get_settings');
      expect(toolNames).toContain('rancher_update_setting');
    });

    test('should have correct input schemas for config tools', () => {
      const tools = configTools.getTools();
      
      const updateSettingTool = tools.find(t => t.name === 'rancher_update_setting');
      expect(updateSettingTool?.inputSchema.properties).toHaveProperty('serverName');
      expect(updateSettingTool?.inputSchema.properties).toHaveProperty('settingId');
      expect(updateSettingTool?.inputSchema.properties).toHaveProperty('value');
      expect(updateSettingTool?.inputSchema.required).toContain('serverName');
      expect(updateSettingTool?.inputSchema.required).toContain('settingId');
      expect(updateSettingTool?.inputSchema.required).toContain('value');
    });
  });

  describe('EventTools', () => {
    let eventTools: EventTools;

    beforeEach(() => {
      eventTools = new EventTools(mockRancherManager as any);
    });

    test('should create EventTools instance', () => {
      expect(eventTools).toBeInstanceOf(EventTools);
    });

    test('should return event tools', () => {
      const tools = eventTools.getTools();
      expect(tools).toHaveLength(1);
      
      const toolNames = tools.map(tool => tool.name);
      expect(toolNames).toContain('rancher_get_events');
    });

    test('should have correct input schemas for event tools', () => {
      const tools = eventTools.getTools();
      
      const getEventsTool = tools.find(t => t.name === 'rancher_get_events');
      expect(getEventsTool?.inputSchema.properties).toHaveProperty('serverName');
      expect(getEventsTool?.inputSchema.properties).toHaveProperty('filters');
      expect(getEventsTool?.inputSchema.required).toContain('serverName');
    });
  });

  describe('LogTools', () => {
    let logTools: LogTools;

    beforeEach(() => {
      logTools = new LogTools(mockRancherManager as any);
    });

    test('should create LogTools instance', () => {
      expect(logTools).toBeInstanceOf(LogTools);
    });

    test('should return log tools', () => {
      const tools = logTools.getTools();
      expect(tools).toHaveLength(1);
      
      const toolNames = tools.map(tool => tool.name);
      expect(toolNames).toContain('rancher_get_logs');
    });

    test('should have correct input schemas for log tools', () => {
      const tools = logTools.getTools();
      
      const getLogsTool = tools.find(t => t.name === 'rancher_get_logs');
      expect(getLogsTool?.inputSchema.properties).toHaveProperty('serverName');
      expect(getLogsTool?.inputSchema.properties).toHaveProperty('resourceType');
      expect(getLogsTool?.inputSchema.properties).toHaveProperty('resourceId');
      expect(getLogsTool?.inputSchema.properties).toHaveProperty('lines');
      expect(getLogsTool?.inputSchema.required).toContain('serverName');
      expect(getLogsTool?.inputSchema.required).toContain('resourceType');
      expect(getLogsTool?.inputSchema.required).toContain('resourceId');
    });
  });

  describe('MetricTools', () => {
    let metricTools: MetricTools;

    beforeEach(() => {
      metricTools = new MetricTools(mockRancherManager as any);
    });

    test('should create MetricTools instance', () => {
      expect(metricTools).toBeInstanceOf(MetricTools);
    });

    test('should return metric tools', () => {
      const tools = metricTools.getTools();
      expect(tools).toHaveLength(1);
      
      const toolNames = tools.map(tool => tool.name);
      expect(toolNames).toContain('rancher_get_metrics');
    });

    test('should have correct input schemas for metric tools', () => {
      const tools = metricTools.getTools();
      
      const getMetricsTool = tools.find(t => t.name === 'rancher_get_metrics');
      expect(getMetricsTool?.inputSchema.properties).toHaveProperty('serverName');
      expect(getMetricsTool?.inputSchema.properties).toHaveProperty('resourceType');
      expect(getMetricsTool?.inputSchema.properties).toHaveProperty('resourceId');
      expect(getMetricsTool?.inputSchema.required).toContain('serverName');
      expect(getMetricsTool?.inputSchema.required).toContain('resourceType');
      expect(getMetricsTool?.inputSchema.required).toContain('resourceId');
    });
  });

  describe('AlertTools', () => {
    let alertTools: AlertTools;

    beforeEach(() => {
      alertTools = new AlertTools(mockRancherManager as any);
    });

    test('should create AlertTools instance', () => {
      expect(alertTools).toBeInstanceOf(AlertTools);
    });

    test('should return alert tools', () => {
      const tools = alertTools.getTools();
      expect(tools).toHaveLength(2);
      
      const toolNames = tools.map(tool => tool.name);
      expect(toolNames).toContain('rancher_list_alerts');
      expect(toolNames).toContain('rancher_create_alert');
    });

    test('should have correct input schemas for alert tools', () => {
      const tools = alertTools.getTools();
      
      const createAlertTool = tools.find(t => t.name === 'rancher_create_alert');
      expect(createAlertTool?.inputSchema.properties).toHaveProperty('serverName');
      expect(createAlertTool?.inputSchema.properties).toHaveProperty('name');
      expect(createAlertTool?.inputSchema.properties).toHaveProperty('condition');
      expect(createAlertTool?.inputSchema.properties).toHaveProperty('severity');
      expect(createAlertTool?.inputSchema.required).toContain('serverName');
      expect(createAlertTool?.inputSchema.required).toContain('name');
      expect(createAlertTool?.inputSchema.required).toContain('condition');
    });
  });

  describe('PolicyTools', () => {
    let policyTools: PolicyTools;

    beforeEach(() => {
      policyTools = new PolicyTools(mockRancherManager as any);
    });

    test('should create PolicyTools instance', () => {
      expect(policyTools).toBeInstanceOf(PolicyTools);
    });

    test('should return policy tools', () => {
      const tools = policyTools.getTools();
      expect(tools).toHaveLength(2);
      
      const toolNames = tools.map(tool => tool.name);
      expect(toolNames).toContain('rancher_list_policies');
      expect(toolNames).toContain('rancher_create_policy');
    });

    test('should have correct input schemas for policy tools', () => {
      const tools = policyTools.getTools();
      
      const createPolicyTool = tools.find(t => t.name === 'rancher_create_policy');
      expect(createPolicyTool?.inputSchema.properties).toHaveProperty('serverName');
      expect(createPolicyTool?.inputSchema.properties).toHaveProperty('name');
      expect(createPolicyTool?.inputSchema.properties).toHaveProperty('rules');
      expect(createPolicyTool?.inputSchema.required).toContain('serverName');
      expect(createPolicyTool?.inputSchema.required).toContain('name');
      expect(createPolicyTool?.inputSchema.required).toContain('rules');
    });
  });

  describe('QuotaTools', () => {
    let quotaTools: QuotaTools;

    beforeEach(() => {
      quotaTools = new QuotaTools(mockRancherManager as any);
    });

    test('should create QuotaTools instance', () => {
      expect(quotaTools).toBeInstanceOf(QuotaTools);
    });

    test('should return quota tools', () => {
      const tools = quotaTools.getTools();
      expect(tools).toHaveLength(2);
      
      const toolNames = tools.map(tool => tool.name);
      expect(toolNames).toContain('rancher_list_quotas');
      expect(toolNames).toContain('rancher_create_quota');
    });

    test('should have correct input schemas for quota tools', () => {
      const tools = quotaTools.getTools();
      
      const createQuotaTool = tools.find(t => t.name === 'rancher_create_quota');
      expect(createQuotaTool?.inputSchema.properties).toHaveProperty('serverName');
      expect(createQuotaTool?.inputSchema.properties).toHaveProperty('name');
      expect(createQuotaTool?.inputSchema.properties).toHaveProperty('projectId');
      expect(createQuotaTool?.inputSchema.properties).toHaveProperty('limits');
      expect(createQuotaTool?.inputSchema.required).toContain('serverName');
      expect(createQuotaTool?.inputSchema.required).toContain('name');
      expect(createQuotaTool?.inputSchema.required).toContain('projectId');
      expect(createQuotaTool?.inputSchema.required).toContain('limits');
    });
  });

  describe('NamespaceTools', () => {
    let namespaceTools: NamespaceTools;

    beforeEach(() => {
      namespaceTools = new NamespaceTools(mockRancherManager as any);
    });

    test('should create NamespaceTools instance', () => {
      expect(namespaceTools).toBeInstanceOf(NamespaceTools);
    });

    test('should return namespace tools', () => {
      const tools = namespaceTools.getTools();
      expect(tools).toHaveLength(4);
      
      const toolNames = tools.map(tool => tool.name);
      expect(toolNames).toContain('rancher_list_namespaces');
      expect(toolNames).toContain('rancher_get_namespace');
      expect(toolNames).toContain('rancher_create_namespace');
      expect(toolNames).toContain('rancher_delete_namespace');
    });

    test('should have correct input schemas for namespace tools', () => {
      const tools = namespaceTools.getTools();
      
      const createNamespaceTool = tools.find(t => t.name === 'rancher_create_namespace');
      expect(createNamespaceTool?.inputSchema.properties).toHaveProperty('serverName');
      expect(createNamespaceTool?.inputSchema.properties).toHaveProperty('name');
      expect(createNamespaceTool?.inputSchema.properties).toHaveProperty('projectId');
      expect(createNamespaceTool?.inputSchema.required).toContain('serverName');
      expect(createNamespaceTool?.inputSchema.required).toContain('name');
      expect(createNamespaceTool?.inputSchema.required).toContain('projectId');
    });
  });

  describe('Tool inheritance', () => {
    test('all tool classes should extend BaseToolManager', () => {
      const toolClasses = [
        ApplicationTools,
        UserTools,
        MonitoringTools,
        BackupTools,
        NodeTools,
        StorageTools,
        NetworkTools,
        SecurityTools,
        CatalogTools,
        WorkloadTools,
        ConfigTools,
        EventTools,
        LogTools,
        MetricTools,
        AlertTools,
        PolicyTools,
        QuotaTools,
        NamespaceTools
      ];

      toolClasses.forEach(ToolClass => {
        const instance = new ToolClass(mockRancherManager as any);
        expect(instance).toBeInstanceOf(BaseToolManager);
      });
    });

    test('all tool classes should have getTools method', () => {
      const toolClasses = [
        ApplicationTools,
        UserTools,
        MonitoringTools,
        BackupTools,
        NodeTools,
        StorageTools,
        NetworkTools,
        SecurityTools,
        CatalogTools,
        WorkloadTools,
        ConfigTools,
        EventTools,
        LogTools,
        MetricTools,
        AlertTools,
        PolicyTools,
        QuotaTools,
        NamespaceTools
      ];

      toolClasses.forEach(ToolClass => {
        const instance = new ToolClass(mockRancherManager as any);
        expect(typeof instance.getTools).toBe('function');
        expect(Array.isArray(instance.getTools())).toBe(true);
      });
    });
  });
});
