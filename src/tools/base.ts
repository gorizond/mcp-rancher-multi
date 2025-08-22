import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { RancherManager } from '../rancher/manager.js';

export abstract class BaseToolManager {
  protected rancherManager: RancherManager;

  constructor(rancherManager: RancherManager) {
    this.rancherManager = rancherManager;
  }

  abstract getTools(): Tool[];

  protected getLogger() {
    return this.rancherManager.getLogger();
  }

  protected getConfigManager() {
    return this.rancherManager.getConfigManager();
  }

  protected async executeOnServer<T>(
    serverName: string,
    operation: (client: any) => Promise<T>
  ): Promise<T> {
    return this.rancherManager.executeOnServer(serverName, operation);
  }

  protected async executeOnAllServers<T>(
    operation: (client: any, serverName: string) => Promise<T>
  ): Promise<Map<string, T>> {
    return this.rancherManager.executeOnAllServers(operation);
  }
}
