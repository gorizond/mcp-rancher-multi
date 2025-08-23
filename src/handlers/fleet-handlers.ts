import { FleetManager } from '../rancher/fleet';
import { RancherManager } from '../rancher/manager';

export class FleetHandlers {
  private rancherManager: RancherManager;

  constructor(rancherManager: RancherManager) {
    this.rancherManager = rancherManager;
  }

  private async getFleetManager(clusterId?: string): Promise<FleetManager> {
    const connections = this.rancherManager.getAllConnections();
    
    if (connections.length === 0) {
      throw new Error('No connected Rancher servers available for Fleet operations');
    }

    // If clusterId is provided, find the connection that has this cluster
    if (clusterId) {
      for (const connection of connections) {
        try {
          const clusters = await this.rancherManager.clusters.getClusters(connection.name);
          const cluster = clusters.find((c: any) => c.id === clusterId);
          if (cluster) {
            return new FleetManager(
              connection.client,
              this.rancherManager.getConfigManager(),
              this.rancherManager.getLogger()
            );
          }
        } catch (error) {
          // Continue to next connection
        }
      }
      throw new Error(`Cluster ${clusterId} not found in any connected server`);
    }

    // Use the first connected client if no specific cluster is requested
    const connection = connections[0];
    return new FleetManager(
      connection.client,
      this.rancherManager.getConfigManager(),
      this.rancherManager.getLogger()
    );
  }

  // Bundle management handlers
  async fleet_list_bundles(args: any): Promise<any> {
    const { clusterId } = args;
    const fleetManager = await this.getFleetManager(clusterId);
    return await fleetManager.listBundles(clusterId);
  }

  async fleet_get_bundle(args: any): Promise<any> {
    const { bundleId, clusterId } = args;
    const fleetManager = await this.getFleetManager(clusterId);
    return await fleetManager.getBundle(bundleId, clusterId);
  }

  async fleet_create_bundle(args: any): Promise<any> {
    const { name, namespace, clusterId, targets, resources } = args;
    const fleetManager = await this.getFleetManager(clusterId);
    return await fleetManager.createBundle({
      name,
      namespace,
      targets,
      resources
    }, clusterId);
  }

  async fleet_update_bundle(args: any): Promise<any> {
    const { bundleId, clusterId, targets, resources } = args;
    const fleetManager = await this.getFleetManager(clusterId);
    return await fleetManager.updateBundle(bundleId, clusterId, {
      targets,
      resources
    });
  }

  async fleet_delete_bundle(args: any): Promise<any> {
    const { bundleId, clusterId } = args;
    const fleetManager = await this.getFleetManager(clusterId);
    await fleetManager.deleteBundle(bundleId, clusterId);
    return { success: true, message: `Bundle ${bundleId} deleted successfully` };
  }

  async fleet_force_sync_bundle(args: any): Promise<any> {
    const { bundleId, clusterId } = args;
    const fleetManager = await this.getFleetManager(clusterId);
    await fleetManager.forceSyncBundle(bundleId, clusterId);
    return { success: true, message: `Bundle ${bundleId} force sync initiated` };
  }

  // Git repository management handlers
  async fleet_list_git_repos(args: any): Promise<any> {
    const { clusterId } = args;
    const fleetManager = await this.getFleetManager(clusterId);
    return await fleetManager.listGitRepos(clusterId);
  }

  async fleet_get_git_repo(args: any): Promise<any> {
    const { repoId, clusterId } = args;
    const fleetManager = await this.getFleetManager(clusterId);
    return await fleetManager.getGitRepo(repoId, clusterId);
  }

  async fleet_create_git_repo(args: any): Promise<any> {
    const { name, namespace, clusterId, repo, branch, paths, targets } = args;
    const fleetManager = await this.getFleetManager(clusterId);
    return await fleetManager.createGitRepo({
      name,
      namespace,
      repo,
      branch,
      paths,
      targets
    }, clusterId);
  }

  async fleet_update_git_repo(args: any): Promise<any> {
    const { repoId, clusterId, repo, branch, paths, targets } = args;
    const fleetManager = await this.getFleetManager(clusterId);
    return await fleetManager.updateGitRepo(repoId, clusterId, {
      repo,
      branch,
      paths,
      targets
    });
  }

  async fleet_delete_git_repo(args: any): Promise<any> {
    const { repoId, clusterId } = args;
    const fleetManager = await this.getFleetManager(clusterId);
    await fleetManager.deleteGitRepo(repoId, clusterId);
    return { success: true, message: `Git repository ${repoId} deleted successfully` };
  }

  // Fleet cluster management handlers
  async fleet_list_clusters(): Promise<any> {
    const fleetManager = await this.getFleetManager();
    return await fleetManager.listFleetClusters();
  }

  async fleet_get_cluster(args: any): Promise<any> {
    const { clusterId } = args;
    const fleetManager = await this.getFleetManager(clusterId);
    return await fleetManager.getFleetCluster(clusterId);
  }

  // Fleet workspace handlers
  async fleet_list_workspaces(): Promise<any> {
    const fleetManager = await this.getFleetManager();
    return await fleetManager.getFleetWorkspaces();
  }

  // Deployment status and monitoring handlers
  async fleet_get_deployment_status(args: any): Promise<any> {
    const { bundleId, clusterId } = args;
    const fleetManager = await this.getFleetManager(clusterId);
    return await fleetManager.getDeploymentStatus(bundleId, clusterId);
  }

  async fleet_get_logs(args: any): Promise<any> {
    const { clusterId, namespace } = args;
    const fleetManager = await this.getFleetManager(clusterId);
    return await fleetManager.getFleetLogs(clusterId, namespace);
  }
}
