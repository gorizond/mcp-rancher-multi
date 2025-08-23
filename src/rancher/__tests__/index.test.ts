import { describe, it, expect } from '@jest/globals';
import * as RancherExports from '../index';

describe('Rancher Index Exports', () => {
  it('should export RancherManager', () => {
    expect(RancherExports.RancherManager).toBeDefined();
  });

  it('should export RancherClient', () => {
    expect(RancherExports.RancherClient).toBeDefined();
  });

  it('should export ClusterManager', () => {
    expect(RancherExports.ClusterManager).toBeDefined();
  });

  it('should export ProjectManager', () => {
    expect(RancherExports.ProjectManager).toBeDefined();
  });

  it('should export ApplicationManager', () => {
    expect(RancherExports.ApplicationManager).toBeDefined();
  });

  it('should export UserManager', () => {
    expect(RancherExports.UserManager).toBeDefined();
  });

  it('should export MonitoringManager', () => {
    expect(RancherExports.MonitoringManager).toBeDefined();
  });

  it('should export BackupManager', () => {
    expect(RancherExports.BackupManager).toBeDefined();
  });

  it('should export NodeManager', () => {
    expect(RancherExports.NodeManager).toBeDefined();
  });

  it('should export StorageManager', () => {
    expect(RancherExports.StorageManager).toBeDefined();
  });

  it('should export NetworkManager', () => {
    expect(RancherExports.NetworkManager).toBeDefined();
  });

  it('should export SecurityManager', () => {
    expect(RancherExports.SecurityManager).toBeDefined();
  });

  it('should export CatalogManager', () => {
    expect(RancherExports.CatalogManager).toBeDefined();
  });

  it('should export WorkloadManager', () => {
    expect(RancherExports.WorkloadManager).toBeDefined();
  });

  it('should export ConfigManager', () => {
    expect(RancherExports.ConfigManager).toBeDefined();
  });

  it('should export EventManager', () => {
    expect(RancherExports.EventManager).toBeDefined();
  });

  it('should export LogManager', () => {
    expect(RancherExports.LogManager).toBeDefined();
  });

  it('should export MetricManager', () => {
    expect(RancherExports.MetricManager).toBeDefined();
  });

  it('should export AlertManager', () => {
    expect(RancherExports.AlertManager).toBeDefined();
  });

  it('should export PolicyManager', () => {
    expect(RancherExports.PolicyManager).toBeDefined();
  });

  it('should export QuotaManager', () => {
    expect(RancherExports.QuotaManager).toBeDefined();
  });

  it('should export NamespaceManager', () => {
    expect(RancherExports.NamespaceManager).toBeDefined();
  });

  it('should export all expected managers', () => {
    const expectedExports = [
      'RancherManager',
      'RancherClient',
      'ClusterManager',
      'ProjectManager',
      'ApplicationManager',
      'UserManager',
      'MonitoringManager',
      'BackupManager',
      'NodeManager',
      'StorageManager',
      'NetworkManager',
      'SecurityManager',
      'CatalogManager',
      'WorkloadManager',
      'ConfigManager',
      'EventManager',
      'LogManager',
      'MetricManager',
      'AlertManager',
      'PolicyManager',
      'QuotaManager',
      'NamespaceManager'
    ];

    expectedExports.forEach(exportName => {
      expect(RancherExports[exportName as keyof typeof RancherExports]).toBeDefined();
    });
  });
});
