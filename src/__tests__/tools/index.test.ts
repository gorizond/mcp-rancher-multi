import { describe, it, expect } from '@jest/globals';
import * as ToolsExports from '../../tools/index';

describe('Tools Index Exports', () => {
  it('should export ClusterTools', () => {
    expect(ToolsExports.ClusterTools).toBeDefined();
  });

  it('should export ProjectTools', () => {
    expect(ToolsExports.ProjectTools).toBeDefined();
  });

  it('should export FleetTools', () => {
    expect(ToolsExports.FleetTools).toBeDefined();
  });

  it('should export ApplicationTools', () => {
    expect(ToolsExports.ApplicationTools).toBeDefined();
  });

  it('should export UserTools', () => {
    expect(ToolsExports.UserTools).toBeDefined();
  });

  it('should export MonitoringTools', () => {
    expect(ToolsExports.MonitoringTools).toBeDefined();
  });

  it('should export BackupTools', () => {
    expect(ToolsExports.BackupTools).toBeDefined();
  });

  it('should export NodeTools', () => {
    expect(ToolsExports.NodeTools).toBeDefined();
  });

  it('should export StorageTools', () => {
    expect(ToolsExports.StorageTools).toBeDefined();
  });

  it('should export NetworkTools', () => {
    expect(ToolsExports.NetworkTools).toBeDefined();
  });

  it('should export SecurityTools', () => {
    expect(ToolsExports.SecurityTools).toBeDefined();
  });

  it('should export CatalogTools', () => {
    expect(ToolsExports.CatalogTools).toBeDefined();
  });

  it('should export WorkloadTools', () => {
    expect(ToolsExports.WorkloadTools).toBeDefined();
  });

  it('should export ConfigTools', () => {
    expect(ToolsExports.ConfigTools).toBeDefined();
  });

  it('should export EventTools', () => {
    expect(ToolsExports.EventTools).toBeDefined();
  });

  it('should export LogTools', () => {
    expect(ToolsExports.LogTools).toBeDefined();
  });

  it('should export MetricTools', () => {
    expect(ToolsExports.MetricTools).toBeDefined();
  });

  it('should export AlertTools', () => {
    expect(ToolsExports.AlertTools).toBeDefined();
  });

  it('should export PolicyTools', () => {
    expect(ToolsExports.PolicyTools).toBeDefined();
  });

  it('should export QuotaTools', () => {
    expect(ToolsExports.QuotaTools).toBeDefined();
  });

  it('should export NamespaceTools', () => {
    expect(ToolsExports.NamespaceTools).toBeDefined();
  });

  it('should export all expected tools', () => {
    const expectedExports = [
      'ClusterTools',
      'ProjectTools',
      'FleetTools',
      'ApplicationTools',
      'UserTools',
      'MonitoringTools',
      'BackupTools',
      'NodeTools',
      'StorageTools',
      'NetworkTools',
      'SecurityTools',
      'CatalogTools',
      'WorkloadTools',
      'ConfigTools',
      'EventTools',
      'LogTools',
      'MetricTools',
      'AlertTools',
      'PolicyTools',
      'QuotaTools',
      'NamespaceTools'
    ];

    expectedExports.forEach(exportName => {
      expect(ToolsExports[exportName as keyof typeof ToolsExports]).toBeDefined();
    });
  });
});
