import { FleetManager } from '../rancher/fleet.js';
import { RancherManager } from '../rancher/manager.js';

export class FleetHandlers {
  private fleetManager: FleetManager;

  constructor(rancherManager: RancherManager) {
    // Get the first connected client for Fleet operations
    const connections = rancherManager.getAllConnections();
    const connection = connections[0];
    
    if (!connection) {
      throw new Error('No connected Rancher servers available for Fleet operations');
    }
    
    this.fleetManager = new FleetManager(
      connection.client,
      rancherManager.getConfigManager(),
      rancherManager.getLogger()
    );
  }

  // Bundle management handlers
  async fleet_list_bundles(args: any): Promise<any> {
    const { clusterId } = args;
    return await this.fleetManager.listBundles(clusterId);
  }

  async fleet_get_bundle(args: any): Promise<any> {
    const { bundleId, clusterId } = args;
    return await this.fleetManager.getBundle(bundleId, clusterId);
  }

  async fleet_create_bundle(args: any): Promise<any> {
    const { name, namespace, clusterId, targets, resources } = args;
    return await this.fleetManager.createBundle({
      name,
      namespace,
      targets,
      resources
    }, clusterId);
  }

  async fleet_update_bundle(args: any): Promise<any> {
    const { bundleId, clusterId, targets, resources } = args;
    return await this.fleetManager.updateBundle(bundleId, clusterId, {
      targets,
      resources
    });
  }

  async fleet_delete_bundle(args: any): Promise<any> {
    const { bundleId, clusterId } = args;
    await this.fleetManager.deleteBundle(bundleId, clusterId);
    return { success: true, message: `Bundle ${bundleId} deleted successfully` };
  }

  async fleet_force_sync_bundle(args: any): Promise<any> {
    const { bundleId, clusterId } = args;
    await this.fleetManager.forceSyncBundle(bundleId, clusterId);
    return { success: true, message: `Bundle ${bundleId} force sync initiated` };
  }

  // Git repository management handlers
  async fleet_list_git_repos(args: any): Promise<any> {
    const { clusterId } = args;
    return await this.fleetManager.listGitRepos(clusterId);
  }

  async fleet_get_git_repo(args: any): Promise<any> {
    const { repoId, clusterId } = args;
    return await this.fleetManager.getGitRepo(repoId, clusterId);
  }

  async fleet_create_git_repo(args: any): Promise<any> {
    const { name, namespace, clusterId, repo, branch, paths, targets } = args;
    return await this.fleetManager.createGitRepo({
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
    return await this.fleetManager.updateGitRepo(repoId, clusterId, {
      repo,
      branch,
      paths,
      targets
    });
  }

  async fleet_delete_git_repo(args: any): Promise<any> {
    const { repoId, clusterId } = args;
    await this.fleetManager.deleteGitRepo(repoId, clusterId);
    return { success: true, message: `Git repository ${repoId} deleted successfully` };
  }

  // Fleet cluster management handlers
  async fleet_list_clusters(args: any): Promise<any> {
    return await this.fleetManager.listFleetClusters();
  }

  async fleet_get_cluster(args: any): Promise<any> {
    const { clusterId } = args;
    return await this.fleetManager.getFleetCluster(clusterId);
  }

  // Fleet workspace handlers
  async fleet_list_workspaces(args: any): Promise<any> {
    return await this.fleetManager.getFleetWorkspaces();
  }

  // Deployment status and monitoring handlers
  async fleet_get_deployment_status(args: any): Promise<any> {
    const { bundleId, clusterId } = args;
    return await this.fleetManager.getDeploymentStatus(bundleId, clusterId);
  }

  async fleet_get_logs(args: any): Promise<any> {
    const { clusterId, namespace } = args;
    return await this.fleetManager.getFleetLogs(clusterId, namespace);
  }
}
