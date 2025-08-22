import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { BaseToolManager } from './base.js';
import { FleetManager } from '../rancher/fleet.js';

export class FleetTools extends BaseToolManager {
  private fleetManager: FleetManager;

  constructor(rancherManager: any) {
    super(rancherManager);
    
    // Get the first connected client for Fleet operations
    const connections = rancherManager.getAllConnections();
    const connection = connections[0];
    
    if (!connection) {
      // Create a mock client for testing purposes
      this.fleetManager = null as any;
      return;
    }
    
    this.fleetManager = new FleetManager(
      connection.client,
      rancherManager.getConfigManager(),
      rancherManager.getLogger()
    );
  }

  getTools(): Tool[] {
    return [
      // Bundle management tools
      {
        name: 'fleet_list_bundles',
        description: 'List all Fleet bundles across clusters',
        inputSchema: {
          type: 'object',
          properties: {
            clusterId: {
              type: 'string',
              description: 'Optional: Specific cluster ID to filter bundles'
            }
          }
        }
      },
      {
        name: 'fleet_get_bundle',
        description: 'Get details of a specific Fleet bundle',
        inputSchema: {
          type: 'object',
          properties: {
            bundleId: {
              type: 'string',
              description: 'Bundle ID'
            },
            clusterId: {
              type: 'string',
              description: 'Cluster ID where the bundle is located'
            }
          },
          required: ['bundleId', 'clusterId']
        }
      },
      {
        name: 'fleet_create_bundle',
        description: 'Create a new Fleet bundle',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Bundle name'
            },
            namespace: {
              type: 'string',
              description: 'Namespace for the bundle (default: fleet-default)'
            },
            clusterId: {
              type: 'string',
              description: 'Cluster ID where to create the bundle'
            },
            targets: {
              type: 'array',
              description: 'Target clusters for deployment',
              items: {
                type: 'object',
                properties: {
                  clusterId: { type: 'string' },
                  clusterName: { type: 'string' }
                }
              }
            },
            resources: {
              type: 'array',
              description: 'Kubernetes resources to deploy',
              items: {
                type: 'object',
                properties: {
                  apiVersion: { type: 'string' },
                  kind: { type: 'string' },
                  name: { type: 'string' },
                  namespace: { type: 'string' }
                }
              }
            }
          },
          required: ['name', 'clusterId']
        }
      },
      {
        name: 'fleet_update_bundle',
        description: 'Update an existing Fleet bundle',
        inputSchema: {
          type: 'object',
          properties: {
            bundleId: {
              type: 'string',
              description: 'Bundle ID to update'
            },
            clusterId: {
              type: 'string',
              description: 'Cluster ID where the bundle is located'
            },
            targets: {
              type: 'array',
              description: 'Updated target clusters'
            },
            resources: {
              type: 'array',
              description: 'Updated Kubernetes resources'
            }
          },
          required: ['bundleId', 'clusterId']
        }
      },
      {
        name: 'fleet_delete_bundle',
        description: 'Delete a Fleet bundle',
        inputSchema: {
          type: 'object',
          properties: {
            bundleId: {
              type: 'string',
              description: 'Bundle ID to delete'
            },
            clusterId: {
              type: 'string',
              description: 'Cluster ID where the bundle is located'
            }
          },
          required: ['bundleId', 'clusterId']
        }
      },
      {
        name: 'fleet_force_sync_bundle',
        description: 'Force sync a Fleet bundle',
        inputSchema: {
          type: 'object',
          properties: {
            bundleId: {
              type: 'string',
              description: 'Bundle ID to force sync'
            },
            clusterId: {
              type: 'string',
              description: 'Cluster ID where the bundle is located'
            }
          },
          required: ['bundleId', 'clusterId']
        }
      },

      // Git repository management tools
      {
        name: 'fleet_list_git_repos',
        description: 'List all Fleet Git repositories',
        inputSchema: {
          type: 'object',
          properties: {
            clusterId: {
              type: 'string',
              description: 'Optional: Specific cluster ID to filter repositories'
            }
          }
        }
      },
      {
        name: 'fleet_get_git_repo',
        description: 'Get details of a specific Fleet Git repository',
        inputSchema: {
          type: 'object',
          properties: {
            repoId: {
              type: 'string',
              description: 'Git repository ID'
            },
            clusterId: {
              type: 'string',
              description: 'Cluster ID where the repository is located'
            }
          },
          required: ['repoId', 'clusterId']
        }
      },
      {
        name: 'fleet_create_git_repo',
        description: 'Create a new Fleet Git repository',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Repository name'
            },
            namespace: {
              type: 'string',
              description: 'Namespace for the repository (default: fleet-default)'
            },
            clusterId: {
              type: 'string',
              description: 'Cluster ID where to create the repository'
            },
            repo: {
              type: 'string',
              description: 'Git repository URL'
            },
            branch: {
              type: 'string',
              description: 'Git branch (default: main)'
            },
            paths: {
              type: 'array',
              description: 'Paths within the repository to monitor',
              items: { type: 'string' }
            },
            targets: {
              type: 'array',
              description: 'Target clusters for deployment',
              items: {
                type: 'object',
                properties: {
                  clusterId: { type: 'string' },
                  clusterName: { type: 'string' }
                }
              }
            }
          },
          required: ['name', 'clusterId', 'repo']
        }
      },
      {
        name: 'fleet_update_git_repo',
        description: 'Update an existing Fleet Git repository',
        inputSchema: {
          type: 'object',
          properties: {
            repoId: {
              type: 'string',
              description: 'Git repository ID to update'
            },
            clusterId: {
              type: 'string',
              description: 'Cluster ID where the repository is located'
            },
            repo: {
              type: 'string',
              description: 'Updated Git repository URL'
            },
            branch: {
              type: 'string',
              description: 'Updated Git branch'
            },
            paths: {
              type: 'array',
              description: 'Updated paths to monitor'
            },
            targets: {
              type: 'array',
              description: 'Updated target clusters'
            }
          },
          required: ['repoId', 'clusterId']
        }
      },
      {
        name: 'fleet_delete_git_repo',
        description: 'Delete a Fleet Git repository',
        inputSchema: {
          type: 'object',
          properties: {
            repoId: {
              type: 'string',
              description: 'Git repository ID to delete'
            },
            clusterId: {
              type: 'string',
              description: 'Cluster ID where the repository is located'
            }
          },
          required: ['repoId', 'clusterId']
        }
      },

      // Fleet cluster management tools
      {
        name: 'fleet_list_clusters',
        description: 'List all Fleet clusters',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'fleet_get_cluster',
        description: 'Get details of a specific Fleet cluster',
        inputSchema: {
          type: 'object',
          properties: {
            clusterId: {
              type: 'string',
              description: 'Fleet cluster ID'
            }
          },
          required: ['clusterId']
        }
      },

      // Fleet workspace tools
      {
        name: 'fleet_list_workspaces',
        description: 'List all Fleet workspaces',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },

      // Deployment status and monitoring tools
      {
        name: 'fleet_get_deployment_status',
        description: 'Get deployment status of a Fleet bundle',
        inputSchema: {
          type: 'object',
          properties: {
            bundleId: {
              type: 'string',
              description: 'Bundle ID'
            },
            clusterId: {
              type: 'string',
              description: 'Cluster ID where the bundle is located'
            }
          },
          required: ['bundleId', 'clusterId']
        }
      },
      {
        name: 'fleet_get_logs',
        description: 'Get Fleet logs for a cluster',
        inputSchema: {
          type: 'object',
          properties: {
            clusterId: {
              type: 'string',
              description: 'Cluster ID'
            },
            namespace: {
              type: 'string',
              description: 'Optional: Specific namespace to filter logs'
            }
          },
          required: ['clusterId']
        }
      }
    ];
  }
}
