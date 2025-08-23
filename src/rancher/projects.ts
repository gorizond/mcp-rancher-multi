import { RancherManager } from './manager';
import { RancherClient, RancherProject } from './client';

export class ProjectManager {
  private rancherManager: RancherManager;

  constructor(rancherManager: RancherManager) {
    this.rancherManager = rancherManager;
  }

  public async getProjects(serverName: string, clusterId?: string): Promise<RancherProject[]> {
    return this.rancherManager.executeOnServer(serverName, async (client: RancherClient) => {
      return await client.getProjects(clusterId);
    });
  }

  public async getProject(serverName: string, projectId: string): Promise<RancherProject> {
    return this.rancherManager.executeOnServer(serverName, async (client: RancherClient) => {
      return await client.getProject(projectId);
    });
  }

  public async createProject(serverName: string, projectData: any): Promise<RancherProject> {
    return this.rancherManager.executeOnServer(serverName, async (client: RancherClient) => {
      return await client.createProject(projectData);
    });
  }

  public async deleteProject(serverName: string, projectId: string): Promise<void> {
    return this.rancherManager.executeOnServer(serverName, async (client: RancherClient) => {
      return await client.deleteProject(projectId);
    });
  }
}
