import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { BaseToolManager } from './base';
import { FleetManager } from '../rancher/fleet';

export class FleetTools extends BaseToolManager {
  constructor(rancherManager: any) {
    super(rancherManager);
  }

  private addServerNameToSchema(baseSchema: any): any {
    return {
      ...baseSchema,
      properties: {
        ...baseSchema.properties,
        serverName: {
          type: 'string',
          description: 'Optional: Rancher server name to connect to (uses default if not specified)'
        }
      }
    };
  }

  getTools(): Tool[] {
    const baseTools = [
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

    // Add serverName parameter to all tools that don't already have it
    return baseTools.map(tool => ({
      ...tool,
      inputSchema: (tool.inputSchema.properties as any)?.serverName ? 
        tool.inputSchema : 
        this.addServerNameToSchema(tool.inputSchema)
    }));
  }

  // Add execution methods for testing
  async executeTool(toolName: string, args: any): Promise<any> {
    try {
      const fleetManager = this.getFleetManager(args.serverName);
      
      switch (toolName) {
        case 'fleet_list_bundles':
          return await fleetManager.listBundles(args.clusterId);
        case 'fleet_get_bundle':
          return await fleetManager.getBundle(args.bundleId, args.clusterId);
        case 'fleet_create_bundle':
          return await fleetManager.createBundle(args, args.clusterId);
        case 'fleet_update_bundle':
          return await fleetManager.updateBundle(args.bundleId, args.clusterId, args);
        case 'fleet_delete_bundle':
          return await fleetManager.deleteBundle(args.bundleId, args.clusterId);
        case 'fleet_force_sync_bundle':
          return await fleetManager.forceSyncBundle(args.bundleId, args.clusterId);
        case 'fleet_list_git_repos':
          return await fleetManager.listGitRepos(args.clusterId);
        case 'fleet_get_git_repo':
          return await fleetManager.getGitRepo(args.repoId, args.clusterId);
        case 'fleet_create_git_repo':
          return await fleetManager.createGitRepo(args, args.clusterId);
        case 'fleet_update_git_repo':
          return await fleetManager.updateGitRepo(args.repoId, args.clusterId, args);
        case 'fleet_delete_git_repo':
          return await fleetManager.deleteGitRepo(args.repoId, args.clusterId);
        case 'fleet_list_clusters':
          return await fleetManager.listFleetClusters();
        case 'fleet_get_cluster':
          return await fleetManager.getFleetCluster(args.clusterId);
        case 'fleet_list_workspaces':
          return await fleetManager.getFleetWorkspaces();
        case 'fleet_get_deployment_status':
          return await fleetManager.getDeploymentStatus(args.bundleId, args.clusterId);
        case 'fleet_get_logs':
          return await fleetManager.getFleetLogs(args.clusterId, args.namespace);
        default:
          throw new Error(`Unknown tool: ${toolName}`);
      }
    } catch (error) {
      this.rancherManager.getLogger().error(`Error executing tool ${toolName}:`, error);
      throw error;
    }
  }

  private getFleetManager(serverName?: string): FleetManager {
    // If no serverName provided, use default server
    if (!serverName) {
      const defaultServer = this.rancherManager.getConfigManager().getConfig().defaultServer;
      if (!defaultServer) {
        throw new Error('No default server configured and no serverName provided');
      }
      serverName = defaultServer;
    }

    // Get connection for the specific server
    const connection = this.rancherManager.getConnection(serverName);
    if (!connection) {
      throw new Error(`No connection found for server: ${serverName}`);
    }

    if (!connection.isConnected) {
      throw new Error(`Server ${serverName} is not connected`);
    }

    // Create new FleetManager for this server (no caching for tools)
    return new FleetManager(
      connection.client,
      this.rancherManager.getConfigManager(),
      this.rancherManager.getLogger()
    );
  }
}
