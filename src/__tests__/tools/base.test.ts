import { describe, test, expect, beforeEach } from '@jest/globals';
import { BaseToolManager } from '../../tools/base';

// Mock RancherManager
const mockRancherManager = {
  clusters: {},
  projects: {},
  applications: {},
  users: {},
  monitoring: {},
  backup: {},
  nodes: {},
  storage: {},
  network: {},
  security: {},
  catalog: {},
  workloads: {},
  config: {},
  events: {},
  logs: {},
  metrics: {},
  alerts: {},
  policies: {},
  quotas: {},
  namespaces: {},
  fleet: {}
};

describe('BaseToolManager', () => {
  let baseToolManager: BaseToolManager;

  beforeEach(() => {
    baseToolManager = new (class extends BaseToolManager {
      getTools() {
        return [];
      }
    })(mockRancherManager as any);
  });

  test('should create base tool manager instance', () => {
    expect(baseToolManager).toBeInstanceOf(BaseToolManager);
  });

  test('should have rancher manager', () => {
    expect(baseToolManager).toHaveProperty('rancherManager');
  });
});
