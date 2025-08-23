import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { BaseToolManager } from './base';

export class ClusterTools extends BaseToolManager {
  getTools(): Tool[] {
    return [
      {
        name: 'rancher_list_clusters',
        description: 'Get list of all clusters from all Rancher servers',
        inputSchema: {
          type: 'object',
          properties: {
            serverName: {
              type: 'string',
              description: 'Specific server name (optional)'
            }
          }
        }
      },
      {
        name: 'rancher_get_cluster',
        description: 'Get information about specific cluster',
        inputSchema: {
          type: 'object',
          properties: {
            serverName: {
              type: 'string',
              description: 'Server name'
            },
            clusterId: {
              type: 'string',
              description: 'Cluster ID'
            }
          },
          required: ['serverName', 'clusterId']
        }
      },
      {
        name: 'rancher_create_cluster',
        description: 'Create new cluster',
        inputSchema: {
          type: 'object',
          properties: {
            serverName: {
              type: 'string',
              description: 'Server name'
            },
            name: {
              type: 'string',
              description: 'Cluster name'
            },
            provider: {
              type: 'string',
              description: 'Provider (aws, azure, gcp, vsphere, custom)'
            },
            config: {
              type: 'object',
              description: 'Cluster configuration'
            }
          },
          required: ['serverName', 'name', 'provider']
        }
      },
      {
        name: 'rancher_delete_cluster',
        description: 'Delete cluster',
        inputSchema: {
          type: 'object',
          properties: {
            serverName: {
              type: 'string',
              description: 'Server name'
            },
            clusterId: {
              type: 'string',
              description: 'Cluster ID'
            }
          },
          required: ['serverName', 'clusterId']
        }
      },
      {
        name: 'rancher_get_cluster_status',
        description: 'Get cluster status',
        inputSchema: {
          type: 'object',
          properties: {
            serverName: {
              type: 'string',
              description: 'Server name'
            },
            clusterId: {
              type: 'string',
              description: 'Cluster ID'
            }
          },
          required: ['serverName', 'clusterId']
        }
      },
      {
        name: 'rancher_get_cluster_metrics',
        description: 'Get cluster metrics',
        inputSchema: {
          type: 'object',
          properties: {
            serverName: {
              type: 'string',
              description: 'Server name'
            },
            clusterId: {
              type: 'string',
              description: 'Cluster ID'
            }
          },
          required: ['serverName', 'clusterId']
        }
      },
      {
        name: 'rancher_get_cluster_events',
        description: 'Get cluster events',
        inputSchema: {
          type: 'object',
          properties: {
            serverName: {
              type: 'string',
              description: 'Server name'
            },
            clusterId: {
              type: 'string',
              description: 'Cluster ID'
            },
            limit: {
              type: 'number',
              description: 'Number of events (default 50)'
            }
          },
          required: ['serverName', 'clusterId']
        }
      },
      {
        name: 'rancher_get_cluster_logs',
        description: 'Get cluster logs',
        inputSchema: {
          type: 'object',
          properties: {
            serverName: {
              type: 'string',
              description: 'Server name'
            },
            clusterId: {
              type: 'string',
              description: 'Cluster ID'
            },
            lines: {
              type: 'number',
              description: 'Number of log lines'
            }
          },
          required: ['serverName', 'clusterId']
        }
      },
      {
        name: 'rancher_create_aws_cluster',
        description: 'Create AWS cluster',
        inputSchema: {
          type: 'object',
          properties: {
            serverName: {
              type: 'string',
              description: 'Server name'
            },
            name: {
              type: 'string',
              description: 'Cluster name'
            },
            region: {
              type: 'string',
              description: 'AWS region'
            },
            instanceType: {
              type: 'string',
              description: 'Instance type'
            },
            nodeCount: {
              type: 'number',
              description: 'Number of nodes'
            }
          },
          required: ['serverName', 'name', 'region', 'instanceType', 'nodeCount']
        }
      },
      {
        name: 'rancher_create_azure_cluster',
        description: 'Create Azure cluster',
        inputSchema: {
          type: 'object',
          properties: {
            serverName: {
              type: 'string',
              description: 'Server name'
            },
            name: {
              type: 'string',
              description: 'Cluster name'
            },
            location: {
              type: 'string',
              description: 'Azure location'
            },
            vmSize: {
              type: 'string',
              description: 'VM size'
            },
            nodeCount: {
              type: 'number',
              description: 'Number of nodes'
            }
          },
          required: ['serverName', 'name', 'location', 'vmSize', 'nodeCount']
        }
      },
      {
        name: 'rancher_create_gcp_cluster',
        description: 'Create GCP cluster',
        inputSchema: {
          type: 'object',
          properties: {
            serverName: {
              type: 'string',
              description: 'Server name'
            },
            name: {
              type: 'string',
              description: 'Cluster name'
            },
            zone: {
              type: 'string',
              description: 'GCP zone'
            },
            machineType: {
              type: 'string',
              description: 'Machine type'
            },
            nodeCount: {
              type: 'number',
              description: 'Number of nodes'
            }
          },
          required: ['serverName', 'name', 'zone', 'machineType', 'nodeCount']
        }
      },
      {
        name: 'rancher_create_vsphere_cluster',
        description: 'Create vSphere cluster',
        inputSchema: {
          type: 'object',
          properties: {
            serverName: {
              type: 'string',
              description: 'Server name'
            },
            name: {
              type: 'string',
              description: 'Cluster name'
            },
            datacenter: {
              type: 'string',
              description: 'Datacenter'
            },
            datastore: {
              type: 'string',
              description: 'Datastore'
            },
            nodeCount: {
              type: 'number',
              description: 'Number of nodes'
            }
          },
          required: ['serverName', 'name', 'datacenter', 'datastore', 'nodeCount']
        }
      },
      {
        name: 'rancher_get_cluster_providers',
        description: 'Get list of available providers',
        inputSchema: {
          type: 'object',
          properties: {
            serverName: {
              type: 'string',
              description: 'Server name'
            }
          },
          required: ['serverName']
        }
      },
      {
        name: 'rancher_get_cluster_templates',
        description: 'Get cluster templates',
        inputSchema: {
          type: 'object',
          properties: {
            serverName: {
              type: 'string',
              description: 'Server name'
            }
          },
          required: ['serverName']
        }
      },
      {
        name: 'rancher_create_cluster_from_template',
        description: 'Create cluster from template',
        inputSchema: {
          type: 'object',
          properties: {
            serverName: {
              type: 'string',
              description: 'Server name'
            },
            templateId: {
              type: 'string',
              description: 'Template ID'
            },
            name: {
              type: 'string',
              description: 'Cluster name'
            },
            config: {
              type: 'object',
              description: 'Additional configuration'
            }
          },
          required: ['serverName', 'templateId', 'name']
        }
      },
      {
        name: 'rancher_update_cluster_config',
        description: 'Update cluster configuration',
        inputSchema: {
          type: 'object',
          properties: {
            serverName: {
              type: 'string',
              description: 'Server name'
            },
            clusterId: {
              type: 'string',
              description: 'Cluster ID'
            },
            config: {
              type: 'object',
              description: 'New configuration'
            }
          },
          required: ['serverName', 'clusterId', 'config']
        }
      },
      {
        name: 'rancher_get_cluster_stats',
        description: 'Get complete cluster statistics',
        inputSchema: {
          type: 'object',
          properties: {
            serverName: {
              type: 'string',
              description: 'Server name'
            },
            clusterId: {
              type: 'string',
              description: 'Cluster ID'
            }
          },
          required: ['serverName', 'clusterId']
        }
      },
      {
        name: 'rancher_get_cluster_kubeconfig',
        description: 'Get kubeconfig for a specific cluster',
        inputSchema: {
          type: 'object',
          properties: {
            serverName: {
              type: 'string',
              description: 'Server name'
            },
            clusterId: {
              type: 'string',
              description: 'Cluster ID'
            },
            format: {
              type: 'string',
              description: 'Output format (yaml, json, raw)',
              enum: ['yaml', 'json', 'raw'],
              default: 'yaml'
            }
          },
          required: ['serverName', 'clusterId']
        }
      }
    ];
  }
}
