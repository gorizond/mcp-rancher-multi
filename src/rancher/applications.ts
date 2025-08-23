import { RancherManager } from './manager';
import { RancherClient, RancherApplication } from './client';

export class ApplicationManager {
  private rancherManager: RancherManager;

  constructor(rancherManager: RancherManager) {
    this.rancherManager = rancherManager;
  }

  public async getApplications(serverName: string, projectId?: string): Promise<RancherApplication[]> {
    return this.rancherManager.executeOnServer(serverName, async (client: RancherClient) => {
      return await client.getApplications(projectId);
    });
  }

  public async getApplication(serverName: string, appId: string): Promise<RancherApplication> {
    return this.rancherManager.executeOnServer(serverName, async (client: RancherClient) => {
      return await client.getApplication(appId);
    });
  }

  public async createApplication(serverName: string, appData: any): Promise<RancherApplication> {
    return this.rancherManager.executeOnServer(serverName, async (client: RancherClient) => {
      return await client.createApplication(appData);
    });
  }

  public async deleteApplication(serverName: string, appId: string): Promise<void> {
    return this.rancherManager.executeOnServer(serverName, async (client: RancherClient) => {
      return await client.deleteApplication(appId);
    });
  }
}
