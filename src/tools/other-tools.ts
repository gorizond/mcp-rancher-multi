import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { BaseToolManager } from './base.js';

// Application Tools
export class ApplicationTools extends BaseToolManager {
  getTools(): Tool[] {
    return [
      {
        name: 'rancher_list_applications',
        description: 'Get list of applications',
        inputSchema: {
          type: 'object',
          properties: {
            serverName: { type: 'string', description: 'Server name' },
            projectId: { type: 'string', description: 'Project ID (optional)' }
          },
          required: ['serverName']
        }
      },
      {
        name: 'rancher_get_application',
        description: 'Get application information',
        inputSchema: {
          type: 'object',
          properties: {
            serverName: { type: 'string', description: 'Server name' },
            appId: { type: 'string', description: 'Application ID' }
          },
          required: ['serverName', 'appId']
        }
      },
      {
        name: 'rancher_create_application',
        description: 'Create application',
        inputSchema: {
          type: 'object',
          properties: {
            serverName: { type: 'string', description: 'Server name' },
            name: { type: 'string', description: 'Application name' },
            projectId: { type: 'string', description: 'Project ID' },
            templateId: { type: 'string', description: 'Template ID' },
            values: { type: 'object', description: 'Template values' }
          },
          required: ['serverName', 'name', 'projectId', 'templateId']
        }
      },
      {
        name: 'rancher_delete_application',
        description: 'Delete application',
        inputSchema: {
          type: 'object',
          properties: {
            serverName: { type: 'string', description: 'Server name' },
            appId: { type: 'string', description: 'Application ID' }
          },
          required: ['serverName', 'appId']
        }
      }
    ];
  }
}

// User Tools
export class UserTools extends BaseToolManager {
  getTools(): Tool[] {
    return [
      {
        name: 'rancher_list_users',
        description: 'Get list of users',
        inputSchema: {
          type: 'object',
          properties: {
            serverName: { type: 'string', description: 'Server name' }
          },
          required: ['serverName']
        }
      },
      {
        name: 'rancher_get_user',
        description: 'Get user information',
        inputSchema: {
          type: 'object',
          properties: {
            serverName: { type: 'string', description: 'Server name' },
            userId: { type: 'string', description: 'User ID' }
          },
          required: ['serverName', 'userId']
        }
      },
      {
        name: 'rancher_create_user',
        description: 'Create user',
        inputSchema: {
          type: 'object',
          properties: {
            serverName: { type: 'string', description: 'Server name' },
            username: { type: 'string', description: 'Username' },
            password: { type: 'string', description: 'Password' },
            name: { type: 'string', description: 'Full name' },
            email: { type: 'string', description: 'Email' }
          },
          required: ['serverName', 'username', 'password']
        }
      },
      {
        name: 'rancher_delete_user',
        description: 'Delete user',
        inputSchema: {
          type: 'object',
          properties: {
            serverName: { type: 'string', description: 'Server name' },
            userId: { type: 'string', description: 'User ID' }
          },
          required: ['serverName', 'userId']
        }
      }
    ];
  }
}

// Monitoring Tools
export class MonitoringTools extends BaseToolManager {
  getTools(): Tool[] {
    return [
      {
        name: 'rancher_get_metrics',
        description: 'Get resource metrics',
        inputSchema: {
          type: 'object',
          properties: {
            serverName: { type: 'string', description: 'Server name' },
            resourceType: { type: 'string', description: 'Resource type' },
            resourceId: { type: 'string', description: 'Resource ID' }
          },
          required: ['serverName', 'resourceType', 'resourceId']
        }
      },
      {
        name: 'rancher_list_alerts',
        description: 'Get list of alerts',
        inputSchema: {
          type: 'object',
          properties: {
            serverName: { type: 'string', description: 'Server name' }
          },
          required: ['serverName']
        }
      },
      {
        name: 'rancher_create_alert',
        description: 'Create alert',
        inputSchema: {
          type: 'object',
          properties: {
            serverName: { type: 'string', description: 'Server name' },
            name: { type: 'string', description: 'Alert name' },
            condition: { type: 'string', description: 'Condition' },
            severity: { type: 'string', description: 'Severity' }
          },
          required: ['serverName', 'name', 'condition']
        }
      }
    ];
  }
}

// Backup Tools
export class BackupTools extends BaseToolManager {
  getTools(): Tool[] {
    return [
      {
        name: 'rancher_create_backup',
        description: 'Create backup',
        inputSchema: {
          type: 'object',
          properties: {
            serverName: { type: 'string', description: 'Server name' },
            name: { type: 'string', description: 'Backup name' },
            clusterId: { type: 'string', description: 'Cluster ID' }
          },
          required: ['serverName', 'name', 'clusterId']
        }
      },
      {
        name: 'rancher_list_backups',
        description: 'Get list of backups',
        inputSchema: {
          type: 'object',
          properties: {
            serverName: { type: 'string', description: 'Server name' }
          },
          required: ['serverName']
        }
      },
      {
        name: 'rancher_restore_backup',
        description: 'Restore from backup',
        inputSchema: {
          type: 'object',
          properties: {
            serverName: { type: 'string', description: 'Server name' },
            backupId: { type: 'string', description: 'Backup ID' },
            clusterId: { type: 'string', description: 'Target cluster ID for restoration' }
          },
          required: ['serverName', 'backupId', 'clusterId']
        }
      }
    ];
  }
}

// Node Tools
export class NodeTools extends BaseToolManager {
  getTools(): Tool[] {
    return [
      {
        name: 'rancher_list_nodes',
        description: 'Get list of nodes',
        inputSchema: {
          type: 'object',
          properties: {
            serverName: { type: 'string', description: 'Server name' },
            clusterId: { type: 'string', description: 'Cluster ID (optional)' }
          },
          required: ['serverName']
        }
      },
      {
        name: 'rancher_get_node',
        description: 'Get node information',
        inputSchema: {
          type: 'object',
          properties: {
            serverName: { type: 'string', description: 'Server name' },
            nodeId: { type: 'string', description: 'Node ID' }
          },
          required: ['serverName', 'nodeId']
        }
      }
    ];
  }
}

// Storage Tools
export class StorageTools extends BaseToolManager {
  getTools(): Tool[] {
    return [
      {
        name: 'rancher_list_storage_classes',
        description: 'Get list of storage classes',
        inputSchema: {
          type: 'object',
          properties: {
            serverName: { type: 'string', description: 'Server name' },
            clusterId: { type: 'string', description: 'Cluster ID (optional)' }
          },
          required: ['serverName']
        }
      },
      {
        name: 'rancher_list_persistent_volumes',
        description: 'Get list of persistent volumes',
        inputSchema: {
          type: 'object',
          properties: {
            serverName: { type: 'string', description: 'Server name' },
            clusterId: { type: 'string', description: 'Cluster ID (optional)' }
          },
          required: ['serverName']
        }
      }
    ];
  }
}

// Network Tools
export class NetworkTools extends BaseToolManager {
  getTools(): Tool[] {
    return [
      {
        name: 'rancher_list_services',
        description: 'Get list of services',
        inputSchema: {
          type: 'object',
          properties: {
            serverName: { type: 'string', description: 'Server name' },
            clusterId: { type: 'string', description: 'Cluster ID (optional)' }
          },
          required: ['serverName']
        }
      },
      {
        name: 'rancher_list_ingresses',
        description: 'Get list of ingresses',
        inputSchema: {
          type: 'object',
          properties: {
            serverName: { type: 'string', description: 'Server name' },
            clusterId: { type: 'string', description: 'Cluster ID (optional)' }
          },
          required: ['serverName']
        }
      }
    ];
  }
}

// Security Tools
export class SecurityTools extends BaseToolManager {
  getTools(): Tool[] {
    return [
      {
        name: 'rancher_list_roles',
        description: 'Get list of roles',
        inputSchema: {
          type: 'object',
          properties: {
            serverName: { type: 'string', description: 'Server name' }
          },
          required: ['serverName']
        }
      },
      {
        name: 'rancher_list_role_bindings',
        description: 'Get list of role bindings',
        inputSchema: {
          type: 'object',
          properties: {
            serverName: { type: 'string', description: 'Server name' }
          },
          required: ['serverName']
        }
      },
      {
        name: 'rancher_create_role_binding',
        description: 'Create role binding',
        inputSchema: {
          type: 'object',
          properties: {
            serverName: { type: 'string', description: 'Server name' },
            name: { type: 'string', description: 'Binding name' },
            roleId: { type: 'string', description: 'Role ID' },
            userId: { type: 'string', description: 'User ID' }
          },
          required: ['serverName', 'name', 'roleId', 'userId']
        }
      }
    ];
  }
}

// Catalog Tools
export class CatalogTools extends BaseToolManager {
  getTools(): Tool[] {
    return [
      {
        name: 'rancher_list_catalogs',
        description: 'Get list of catalogs',
        inputSchema: {
          type: 'object',
          properties: {
            serverName: { type: 'string', description: 'Server name' }
          },
          required: ['serverName']
        }
      },
      {
        name: 'rancher_get_catalog_templates',
        description: 'Get catalog templates',
        inputSchema: {
          type: 'object',
          properties: {
            serverName: { type: 'string', description: 'Server name' },
            catalogId: { type: 'string', description: 'Catalog ID' }
          },
          required: ['serverName', 'catalogId']
        }
      }
    ];
  }
}

// Workload Tools
export class WorkloadTools extends BaseToolManager {
  getTools(): Tool[] {
    return [
      {
        name: 'rancher_list_workloads',
        description: 'Get list of workloads',
        inputSchema: {
          type: 'object',
          properties: {
            serverName: { type: 'string', description: 'Server name' },
            projectId: { type: 'string', description: 'Project ID (optional)' }
          },
          required: ['serverName']
        }
      },
      {
        name: 'rancher_get_workload',
        description: 'Get workload information',
        inputSchema: {
          type: 'object',
          properties: {
            serverName: { type: 'string', description: 'Server name' },
            workloadId: { type: 'string', description: 'Workload ID' }
          },
          required: ['serverName', 'workloadId']
        }
      },
      {
        name: 'rancher_create_workload',
        description: 'Create workload',
        inputSchema: {
          type: 'object',
          properties: {
            serverName: { type: 'string', description: 'Server name' },
            name: { type: 'string', description: 'Workload name' },
            projectId: { type: 'string', description: 'Project ID' },
            type: { type: 'string', description: 'Workload type' },
            containers: { type: 'array', description: 'Containers' }
          },
          required: ['serverName', 'name', 'projectId', 'type']
        }
      },
      {
        name: 'rancher_update_workload',
        description: 'Update workload',
        inputSchema: {
          type: 'object',
          properties: {
            serverName: { type: 'string', description: 'Server name' },
            workloadId: { type: 'string', description: 'Workload ID' },
            data: { type: 'object', description: 'New data' }
          },
          required: ['serverName', 'workloadId', 'data']
        }
      },
      {
        name: 'rancher_delete_workload',
        description: 'Delete workload',
        inputSchema: {
          type: 'object',
          properties: {
            serverName: { type: 'string', description: 'Server name' },
            workloadId: { type: 'string', description: 'Workload ID' }
          },
          required: ['serverName', 'workloadId']
        }
      }
    ];
  }
}

// Config Tools
export class ConfigTools extends BaseToolManager {
  getTools(): Tool[] {
    return [
      {
        name: 'rancher_get_settings',
        description: 'Get server settings',
        inputSchema: {
          type: 'object',
          properties: {
            serverName: { type: 'string', description: 'Server name' }
          },
          required: ['serverName']
        }
      },
      {
        name: 'rancher_update_setting',
        description: 'Update setting',
        inputSchema: {
          type: 'object',
          properties: {
            serverName: { type: 'string', description: 'Server name' },
            settingId: { type: 'string', description: 'Setting ID' },
            value: { type: 'string', description: 'New value' }
          },
          required: ['serverName', 'settingId', 'value']
        }
      }
    ];
  }
}

// Event Tools
export class EventTools extends BaseToolManager {
  getTools(): Tool[] {
    return [
      {
        name: 'rancher_get_events',
        description: 'Get events',
        inputSchema: {
          type: 'object',
          properties: {
            serverName: { type: 'string', description: 'Server name' },
            filters: { type: 'object', description: 'Event filters' }
          },
          required: ['serverName']
        }
      }
    ];
  }
}

// Log Tools
export class LogTools extends BaseToolManager {
  getTools(): Tool[] {
    return [
      {
        name: 'rancher_get_logs',
        description: 'Get resource logs',
        inputSchema: {
          type: 'object',
          properties: {
            serverName: { type: 'string', description: 'Server name' },
            resourceType: { type: 'string', description: 'Resource type' },
            resourceId: { type: 'string', description: 'Resource ID' },
            lines: { type: 'number', description: 'Number of lines' }
          },
          required: ['serverName', 'resourceType', 'resourceId']
        }
      }
    ];
  }
}

// Metric Tools
export class MetricTools extends BaseToolManager {
  getTools(): Tool[] {
    return [
      {
        name: 'rancher_get_metrics',
        description: 'Get metrics',
        inputSchema: {
          type: 'object',
          properties: {
            serverName: { type: 'string', description: 'Server name' },
            resourceType: { type: 'string', description: 'Resource type' },
            resourceId: { type: 'string', description: 'Resource ID' }
          },
          required: ['serverName', 'resourceType', 'resourceId']
        }
      }
    ];
  }
}

// Alert Tools
export class AlertTools extends BaseToolManager {
  getTools(): Tool[] {
    return [
      {
        name: 'rancher_list_alerts',
        description: 'Get list of alerts',
        inputSchema: {
          type: 'object',
          properties: {
            serverName: { type: 'string', description: 'Server name' }
          },
          required: ['serverName']
        }
      },
      {
        name: 'rancher_create_alert',
        description: 'Create alert',
        inputSchema: {
          type: 'object',
          properties: {
            serverName: { type: 'string', description: 'Server name' },
            name: { type: 'string', description: 'Alert name' },
            condition: { type: 'string', description: 'Condition' },
            severity: { type: 'string', description: 'Severity' }
          },
          required: ['serverName', 'name', 'condition']
        }
      }
    ];
  }
}

// Policy Tools
export class PolicyTools extends BaseToolManager {
  getTools(): Tool[] {
    return [
      {
        name: 'rancher_list_policies',
        description: 'Get list of policies',
        inputSchema: {
          type: 'object',
          properties: {
            serverName: { type: 'string', description: 'Server name' }
          },
          required: ['serverName']
        }
      },
      {
        name: 'rancher_create_policy',
        description: 'Create policy',
        inputSchema: {
          type: 'object',
          properties: {
            serverName: { type: 'string', description: 'Server name' },
            name: { type: 'string', description: 'Policy name' },
            rules: { type: 'array', description: 'Policy rules' }
          },
          required: ['serverName', 'name', 'rules']
        }
      }
    ];
  }
}

// Quota Tools
export class QuotaTools extends BaseToolManager {
  getTools(): Tool[] {
    return [
      {
        name: 'rancher_list_quotas',
        description: 'Get list of quotas',
        inputSchema: {
          type: 'object',
          properties: {
            serverName: { type: 'string', description: 'Server name' },
            projectId: { type: 'string', description: 'Project ID (optional)' }
          },
          required: ['serverName']
        }
      },
      {
        name: 'rancher_create_quota',
        description: 'Create quota',
        inputSchema: {
          type: 'object',
          properties: {
            serverName: { type: 'string', description: 'Server name' },
            name: { type: 'string', description: 'Quota name' },
            projectId: { type: 'string', description: 'Project ID' },
            limits: { type: 'object', description: 'Resource limits' }
          },
          required: ['serverName', 'name', 'projectId', 'limits']
        }
      }
    ];
  }
}

// Namespace Tools
export class NamespaceTools extends BaseToolManager {
  getTools(): Tool[] {
    return [
      {
        name: 'rancher_list_namespaces',
        description: 'Get list of namespaces',
        inputSchema: {
          type: 'object',
          properties: {
            serverName: { type: 'string', description: 'Server name' },
            projectId: { type: 'string', description: 'Project ID (optional)' }
          },
          required: ['serverName']
        }
      },
      {
        name: 'rancher_get_namespace',
        description: 'Get namespace information',
        inputSchema: {
          type: 'object',
          properties: {
            serverName: { type: 'string', description: 'Server name' },
            namespaceId: { type: 'string', description: 'Namespace ID' }
          },
          required: ['serverName', 'namespaceId']
        }
      },
      {
        name: 'rancher_create_namespace',
        description: 'Create namespace',
        inputSchema: {
          type: 'object',
          properties: {
            serverName: { type: 'string', description: 'Server name' },
            name: { type: 'string', description: 'Namespace name' },
            projectId: { type: 'string', description: 'Project ID' }
          },
          required: ['serverName', 'name', 'projectId']
        }
      },
      {
        name: 'rancher_delete_namespace',
        description: 'Delete namespace',
        inputSchema: {
          type: 'object',
          properties: {
            serverName: { type: 'string', description: 'Server name' },
            namespaceId: { type: 'string', description: 'Namespace ID' }
          },
          required: ['serverName', 'namespaceId']
        }
      }
    ];
  }
}
