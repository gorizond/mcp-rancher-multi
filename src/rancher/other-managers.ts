import { RancherManager } from './manager';
import { RancherClient } from './client';

// User Manager
export class UserManager {
  private rancherManager: RancherManager;

  constructor(rancherManager: RancherManager) {
    this.rancherManager = rancherManager;
  }

  public async getUsers(serverName: string) {
    return this.rancherManager.executeOnServer(serverName, async (client: RancherClient) => {
      return await client.getUsers();
    });
  }

  public async getUser(serverName: string, userId: string) {
    return this.rancherManager.executeOnServer(serverName, async (client: RancherClient) => {
      return await client.getUser(userId);
    });
  }

  public async createUser(serverName: string, userData: any) {
    return this.rancherManager.executeOnServer(serverName, async (client: RancherClient) => {
      return await client.createUser(userData);
    });
  }

  public async deleteUser(serverName: string, userId: string) {
    return this.rancherManager.executeOnServer(serverName, async (client: RancherClient) => {
      return await client.deleteUser(userId);
    });
  }
}

// Monitoring Manager
export class MonitoringManager {
  private rancherManager: RancherManager;

  constructor(rancherManager: RancherManager) {
    this.rancherManager = rancherManager;
  }

  public async getMetrics(serverName: string, resourceType: string, resourceId: string) {
    return this.rancherManager.executeOnServer(serverName, async (client: RancherClient) => {
      return await client.getMetrics(resourceType, resourceId);
    });
  }

  public async getAlerts(serverName: string) {
    return this.rancherManager.executeOnServer(serverName, async (client: RancherClient) => {
      return await client.getAlerts();
    });
  }

  public async createAlert(serverName: string, alertData: any) {
    return this.rancherManager.executeOnServer(serverName, async (client: RancherClient) => {
      return await client.createAlert(alertData);
    });
  }
}

// Backup Manager
export class BackupManager {
  private rancherManager: RancherManager;

  constructor(rancherManager: RancherManager) {
    this.rancherManager = rancherManager;
  }

  public async createBackup(serverName: string, backupData: any) {
    return this.rancherManager.executeOnServer(serverName, async (client: RancherClient) => {
      return await client.createBackup(backupData);
    });
  }

  public async getBackups(serverName: string) {
    return this.rancherManager.executeOnServer(serverName, async (client: RancherClient) => {
      return await client.getBackups();
    });
  }

  public async restoreBackup(serverName: string, backupId: string, restoreData: any) {
    return this.rancherManager.executeOnServer(serverName, async (client: RancherClient) => {
      return await client.restoreBackup(backupId, restoreData);
    });
  }
}

// Node Manager
export class NodeManager {
  private rancherManager: RancherManager;

  constructor(rancherManager: RancherManager) {
    this.rancherManager = rancherManager;
  }

  public async getNodes(serverName: string, clusterId?: string) {
    return this.rancherManager.executeOnServer(serverName, async (client: RancherClient) => {
      return await client.getNodes(clusterId);
    });
  }

  public async getNode(serverName: string, nodeId: string) {
    return this.rancherManager.executeOnServer(serverName, async (client: RancherClient) => {
      return await client.getNode(nodeId);
    });
  }
}

// Storage Manager
export class StorageManager {
  private rancherManager: RancherManager;

  constructor(rancherManager: RancherManager) {
    this.rancherManager = rancherManager;
  }

  public async getStorageClasses(serverName: string, clusterId?: string) {
    return this.rancherManager.executeOnServer(serverName, async (client: RancherClient) => {
      return await client.getStorageClasses(clusterId);
    });
  }

  public async getPersistentVolumes(serverName: string, clusterId?: string) {
    return this.rancherManager.executeOnServer(serverName, async (client: RancherClient) => {
      return await client.getPersistentVolumes(clusterId);
    });
  }
}

// Network Manager
export class NetworkManager {
  private rancherManager: RancherManager;

  constructor(rancherManager: RancherManager) {
    this.rancherManager = rancherManager;
  }

  public async getServices(serverName: string, clusterId?: string) {
    return this.rancherManager.executeOnServer(serverName, async (client: RancherClient) => {
      return await client.getServices(clusterId);
    });
  }

  public async getIngresses(serverName: string, clusterId?: string) {
    return this.rancherManager.executeOnServer(serverName, async (client: RancherClient) => {
      return await client.getIngresses(clusterId);
    });
  }
}

// Security Manager
export class SecurityManager {
  private rancherManager: RancherManager;

  constructor(rancherManager: RancherManager) {
    this.rancherManager = rancherManager;
  }

  public async getRoles(serverName: string) {
    return this.rancherManager.executeOnServer(serverName, async (client: RancherClient) => {
      return await client.getRoles();
    });
  }

  public async getRoleBindings(serverName: string) {
    return this.rancherManager.executeOnServer(serverName, async (client: RancherClient) => {
      return await client.getRoleBindings();
    });
  }

  public async createRoleBinding(serverName: string, roleBindingData: any) {
    return this.rancherManager.executeOnServer(serverName, async (client: RancherClient) => {
      return await client.createRoleBinding(roleBindingData);
    });
  }
}

// Catalog Manager
export class CatalogManager {
  private rancherManager: RancherManager;

  constructor(rancherManager: RancherManager) {
    this.rancherManager = rancherManager;
  }

  public async getCatalogs(serverName: string) {
    return this.rancherManager.executeOnServer(serverName, async (client: RancherClient) => {
      return await client.getCatalogs();
    });
  }

  public async getCatalogTemplates(serverName: string, catalogId: string) {
    return this.rancherManager.executeOnServer(serverName, async (client: RancherClient) => {
      return await client.getCatalogTemplates(catalogId);
    });
  }
}

// Workload Manager
export class WorkloadManager {
  private rancherManager: RancherManager;

  constructor(rancherManager: RancherManager) {
    this.rancherManager = rancherManager;
  }

  public async getWorkloads(serverName: string, projectId?: string) {
    return this.rancherManager.executeOnServer(serverName, async (client: RancherClient) => {
      return await client.getWorkloads(projectId);
    });
  }

  public async getWorkload(serverName: string, workloadId: string) {
    return this.rancherManager.executeOnServer(serverName, async (client: RancherClient) => {
      return await client.getWorkload(workloadId);
    });
  }

  public async createWorkload(serverName: string, workloadData: any) {
    return this.rancherManager.executeOnServer(serverName, async (client: RancherClient) => {
      return await client.createWorkload(workloadData);
    });
  }

  public async updateWorkload(serverName: string, workloadId: string, workloadData: any) {
    return this.rancherManager.executeOnServer(serverName, async (client: RancherClient) => {
      return await client.updateWorkload(workloadId, workloadData);
    });
  }

  public async deleteWorkload(serverName: string, workloadId: string) {
    return this.rancherManager.executeOnServer(serverName, async (client: RancherClient) => {
      return await client.deleteWorkload(workloadId);
    });
  }
}

// Config Manager
export class ConfigManager {
  private rancherManager: RancherManager;

  constructor(rancherManager: RancherManager) {
    this.rancherManager = rancherManager;
  }

  public async getSettings(serverName: string) {
    return this.rancherManager.executeOnServer(serverName, async (client: RancherClient) => {
      return await client.getSettings();
    });
  }

  public async updateSetting(serverName: string, settingId: string, value: any) {
    return this.rancherManager.executeOnServer(serverName, async (client: RancherClient) => {
      return await client.updateSetting(settingId, value);
    });
  }
}

// Event Manager
export class EventManager {
  private rancherManager: RancherManager;

  constructor(rancherManager: RancherManager) {
    this.rancherManager = rancherManager;
  }

  public async getEvents(serverName: string, filters?: any) {
    return this.rancherManager.executeOnServer(serverName, async (client: RancherClient) => {
      return await client.getEvents(filters);
    });
  }
}

// Log Manager
export class LogManager {
  private rancherManager: RancherManager;

  constructor(rancherManager: RancherManager) {
    this.rancherManager = rancherManager;
  }

  public async getLogs(serverName: string, resourceType: string, resourceId: string, options?: any) {
    return this.rancherManager.executeOnServer(serverName, async (client: RancherClient) => {
      return await client.getLogs(resourceType, resourceId, options);
    });
  }
}

// Metric Manager
export class MetricManager {
  private rancherManager: RancherManager;

  constructor(rancherManager: RancherManager) {
    this.rancherManager = rancherManager;
  }

  public async getMetrics(serverName: string, resourceType: string, resourceId: string, options?: any) {
    return this.rancherManager.executeOnServer(serverName, async (client: RancherClient) => {
      return await client.getMetrics(resourceType, resourceId, options);
    });
  }
}

// Alert Manager
export class AlertManager {
  private rancherManager: RancherManager;

  constructor(rancherManager: RancherManager) {
    this.rancherManager = rancherManager;
  }

  public async getAlerts(serverName: string) {
    return this.rancherManager.executeOnServer(serverName, async (client: RancherClient) => {
      return await client.getAlerts();
    });
  }

  public async createAlert(serverName: string, alertData: any) {
    return this.rancherManager.executeOnServer(serverName, async (client: RancherClient) => {
      return await client.createAlert(alertData);
    });
  }
}

// Policy Manager
export class PolicyManager {
  private rancherManager: RancherManager;

  constructor(rancherManager: RancherManager) {
    this.rancherManager = rancherManager;
  }

  public async getPolicies(serverName: string) {
    return this.rancherManager.executeOnServer(serverName, async (client: RancherClient) => {
      return await client.getPolicies();
    });
  }

  public async createPolicy(serverName: string, policyData: any) {
    return this.rancherManager.executeOnServer(serverName, async (client: RancherClient) => {
      return await client.createPolicy(policyData);
    });
  }
}

// Quota Manager
export class QuotaManager {
  private rancherManager: RancherManager;

  constructor(rancherManager: RancherManager) {
    this.rancherManager = rancherManager;
  }

  public async getQuotas(serverName: string, projectId?: string) {
    return this.rancherManager.executeOnServer(serverName, async (client: RancherClient) => {
      return await client.getQuotas(projectId);
    });
  }

  public async createQuota(serverName: string, quotaData: any) {
    return this.rancherManager.executeOnServer(serverName, async (client: RancherClient) => {
      return await client.createQuota(quotaData);
    });
  }
}

// Namespace Manager
export class NamespaceManager {
  private rancherManager: RancherManager;

  constructor(rancherManager: RancherManager) {
    this.rancherManager = rancherManager;
  }

  public async getNamespaces(serverName: string, projectId?: string) {
    return this.rancherManager.executeOnServer(serverName, async (client: RancherClient) => {
      return await client.getNamespaces(projectId);
    });
  }

  public async getNamespace(serverName: string, namespaceId: string) {
    return this.rancherManager.executeOnServer(serverName, async (client: RancherClient) => {
      return await client.getNamespace(namespaceId);
    });
  }

  public async createNamespace(serverName: string, namespaceData: any) {
    return this.rancherManager.executeOnServer(serverName, async (client: RancherClient) => {
      return await client.createNamespace(namespaceData);
    });
  }

  public async deleteNamespace(serverName: string, namespaceId: string) {
    return this.rancherManager.executeOnServer(serverName, async (client: RancherClient) => {
      return await client.deleteNamespace(namespaceId);
    });
  }
}
