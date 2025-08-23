import { FleetManager } from '../rancher/fleet';
import { RancherManager } from '../rancher/manager';

export class FleetHandlers {
  private rancherManager: RancherManager;
  private fleetManagers: Map<string, FleetManager> = new Map();

  constructor(rancherManager: RancherManager) {
    this.rancherManager = rancherManager;
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

    // Check if we already have a FleetManager for this server
    if (this.fleetManagers.has(serverName)) {
      const fleetManager = this.fleetManagers.get(serverName)!;
      return fleetManager;
    }

    // Get connection for the specific server
    const connection = this.rancherManager.getConnection(serverName);
    if (!connection) {
      throw new Error(`No connection found for server: ${serverName}`);
    }

    if (!connection.isConnected) {
      throw new Error(`Server ${serverName} is not connected`);
    }

    // Create new FleetManager for this server
    const fleetManager = new FleetManager(
      connection.client,
      this.rancherManager.getConfigManager(),
      this.rancherManager.getLogger()
    );

    // Cache the FleetManager
    this.fleetManagers.set(serverName, fleetManager);
    
    return fleetManager;
  }

  // Bundle management handlers
  async fleet_list_bundles(args: any): Promise<any> {
    try {
      const { clusterId, serverName } = args;
      const fleetManager = this.getFleetManager(serverName);
      const bundles = await fleetManager.listBundles(clusterId);
      return {
        success: true,
        data: bundles,
        count: bundles.length
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: [],
        count: 0
      };
    }
  }

  async fleet_get_bundle(args: any): Promise<any> {
    try {
      const { bundleId, clusterId, serverName } = args;
      const fleetManager = this.getFleetManager(serverName);
      const bundle = await fleetManager.getBundle(bundleId, clusterId);
      
      if (!bundle) {
        return {
          success: false,
          error: `Bundle ${bundleId} not found in cluster ${clusterId}`,
          data: null
        };
      }
      
      return {
        success: true,
        data: bundle
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: null
      };
    }
  }

  async fleet_create_bundle(args: any): Promise<any> {
    try {
      const { name, namespace, clusterId, targets, resources, serverName } = args;
      const fleetManager = this.getFleetManager(serverName);
      const bundle = await fleetManager.createBundle({
        name,
        namespace,
        targets,
        resources
      }, clusterId);
      
      if (!bundle) {
        return {
          success: false,
          error: 'Failed to create bundle',
          data: null
        };
      }
      
      return {
        success: true,
        data: bundle,
        message: `Bundle ${name} created successfully`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: null
      };
    }
  }

  async fleet_update_bundle(args: any): Promise<any> {
    try {
      const { bundleId, clusterId, targets, resources, serverName } = args;
      const fleetManager = this.getFleetManager(serverName);
      const bundle = await fleetManager.updateBundle(bundleId, clusterId, {
        targets,
        resources
      });
      
      if (!bundle) {
        return {
          success: false,
          error: `Failed to update bundle ${bundleId}`,
          data: null
        };
      }
      
      return {
        success: true,
        data: bundle,
        message: `Bundle ${bundleId} updated successfully`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: null
      };
    }
  }

  async fleet_delete_bundle(args: any): Promise<any> {
    try {
      const { bundleId, clusterId, serverName } = args;
      const fleetManager = this.getFleetManager(serverName);
      const success = await fleetManager.deleteBundle(bundleId, clusterId);
      
      if (!success) {
        return {
          success: false,
          error: `Failed to delete bundle ${bundleId}`,
          message: `Bundle ${bundleId} could not be deleted`
        };
      }
      
      return {
        success: true,
        message: `Bundle ${bundleId} deleted successfully`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: `Failed to delete bundle ${args.bundleId}`
      };
    }
  }

  async fleet_force_sync_bundle(args: any): Promise<any> {
    try {
      const { bundleId, clusterId, serverName } = args;
      const fleetManager = this.getFleetManager(serverName);
      const success = await fleetManager.forceSyncBundle(bundleId, clusterId);
      
      if (!success) {
        return {
          success: false,
          error: `Failed to force sync bundle ${bundleId}`,
          message: `Bundle ${bundleId} could not be force synced`
        };
      }
      
      return {
        success: true,
        message: `Bundle ${bundleId} force sync initiated successfully`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: `Failed to force sync bundle ${args.bundleId}`
      };
    }
  }

  // Git repository management handlers
  async fleet_list_git_repos(args: any): Promise<any> {
    try {
      const { clusterId, serverName } = args;
      const fleetManager = this.getFleetManager(serverName);
      const repos = await fleetManager.listGitRepos(clusterId);
      return {
        success: true,
        data: repos,
        count: repos.length
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: [],
        count: 0
      };
    }
  }

  async fleet_get_git_repo(args: any): Promise<any> {
    try {
      const { repoId, clusterId, serverName } = args;
      const fleetManager = this.getFleetManager(serverName);
      const repo = await fleetManager.getGitRepo(repoId, clusterId);
      
      if (!repo) {
        return {
          success: false,
          error: `Git repository ${repoId} not found in cluster ${clusterId}`,
          data: null
        };
      }
      
      return {
        success: true,
        data: repo
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: null
      };
    }
  }

  async fleet_create_git_repo(args: any): Promise<any> {
    try {
      const { name, namespace, clusterId, repo, branch, paths, targets, serverName } = args;
      const fleetManager = this.getFleetManager(serverName);
      const gitRepo = await fleetManager.createGitRepo({
        name,
        namespace,
        repo,
        branch,
        paths,
        targets
      }, clusterId);
      
      if (!gitRepo) {
        return {
          success: false,
          error: 'Failed to create Git repository',
          data: null
        };
      }
      
      return {
        success: true,
        data: gitRepo,
        message: `Git repository ${name} created successfully`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: null
      };
    }
  }

  async fleet_update_git_repo(args: any): Promise<any> {
    try {
      const { repoId, clusterId, repo, branch, paths, targets, serverName } = args;
      const fleetManager = this.getFleetManager(serverName);
      const gitRepo = await fleetManager.updateGitRepo(repoId, clusterId, {
        repo,
        branch,
        paths,
        targets
      });
      
      if (!gitRepo) {
        return {
          success: false,
          error: `Failed to update Git repository ${repoId}`,
          data: null
        };
      }
      
      return {
        success: true,
        data: gitRepo,
        message: `Git repository ${repoId} updated successfully`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: null
      };
    }
  }

  async fleet_delete_git_repo(args: any): Promise<any> {
    try {
      const { repoId, clusterId, serverName } = args;
      const fleetManager = this.getFleetManager(serverName);
      const success = await fleetManager.deleteGitRepo(repoId, clusterId);
      
      if (!success) {
        return {
          success: false,
          error: `Failed to delete Git repository ${repoId}`,
          message: `Git repository ${repoId} could not be deleted`
        };
      }
      
      return {
        success: true,
        message: `Git repository ${repoId} deleted successfully`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: `Failed to delete Git repository ${args.repoId}`
      };
    }
  }

  // Fleet cluster management handlers
  async fleet_list_clusters(args: any = {}): Promise<any> {
    try {
      const { serverName } = args;
      const fleetManager = this.getFleetManager(serverName);
      const clusters = await fleetManager.listFleetClusters();
      return {
        success: true,
        data: clusters,
        count: clusters.length
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: [],
        count: 0
      };
    }
  }

  async fleet_get_cluster(args: any): Promise<any> {
    try {
      const { clusterId, serverName } = args;
      const fleetManager = this.getFleetManager(serverName);
      const cluster = await fleetManager.getFleetCluster(clusterId);
      
      if (!cluster) {
        return {
          success: false,
          error: `Fleet cluster ${clusterId} not found`,
          data: null
        };
      }
      
      return {
        success: true,
        data: cluster
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: null
      };
    }
  }

  // Fleet workspace handlers
  async fleet_list_workspaces(args: any = {}): Promise<any> {
    try {
      const { serverName } = args;
      const fleetManager = this.getFleetManager(serverName);
      const workspaces = await fleetManager.getFleetWorkspaces();
      return {
        success: true,
        data: workspaces,
        count: workspaces.length
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: [],
        count: 0
      };
    }
  }

  // Deployment status and monitoring handlers
  async fleet_get_deployment_status(args: any): Promise<any> {
    try {
      const { bundleId, clusterId, serverName } = args;
      const fleetManager = this.getFleetManager(serverName);
      const status = await fleetManager.getDeploymentStatus(bundleId, clusterId);
      
      if (!status) {
        return {
          success: false,
          error: `Deployment status not found for bundle ${bundleId}`,
          data: null
        };
      }
      
      return {
        success: true,
        data: status
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: null
      };
    }
  }

  async fleet_get_logs(args: any): Promise<any> {
    try {
      const { clusterId, namespace, serverName } = args;
      const fleetManager = this.getFleetManager(serverName);
      const logs = await fleetManager.getFleetLogs(clusterId, namespace);
      return {
        success: true,
        data: logs,
        count: logs.length
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        data: [],
        count: 0
      };
    }
  }
}
