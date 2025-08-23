import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { FleetHandlers } from '../../handlers/fleet-handlers';
import { FleetManager } from '../../rancher/fleet';

// Mock dependencies
jest.mock('../../rancher/fleet');
jest.mock('../../rancher/manager');

describe('FleetHandlers', () => {
  let fleetHandlers: FleetHandlers;
  let mockRancherManager: any;
  let mockFleetManager: any;
  let mockClient: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock client
    mockClient = {
      request: jest.fn()
    };

    // Create mock fleet manager
    mockFleetManager = {
      listBundles: jest.fn(),
      getBundle: jest.fn(),
      createBundle: jest.fn(),
      updateBundle: jest.fn(),
      deleteBundle: jest.fn(),
      forceSyncBundle: jest.fn(),
      listGitRepos: jest.fn(),
      getGitRepo: jest.fn(),
      createGitRepo: jest.fn(),
      updateGitRepo: jest.fn(),
      deleteGitRepo: jest.fn(),
      listFleetClusters: jest.fn(),
      getFleetCluster: jest.fn(),
      getFleetWorkspaces: jest.fn(),
      getDeploymentStatus: jest.fn(),
      getFleetLogs: jest.fn()
    };

    // Mock FleetManager constructor
    (FleetManager as jest.MockedClass<typeof FleetManager>).mockImplementation(() => mockFleetManager);

    // Create mock rancher manager
    mockRancherManager = {
      getAllConnections: jest.fn().mockReturnValue([
        {
          name: 'test-server',
          client: mockClient
        }
      ]),
      clusters: {
        getClusters: jest.fn(() => Promise.resolve([{ id: 'cluster-1', name: 'test-cluster' }]))
      },
      getConfigManager: jest.fn().mockReturnValue({}),
      getLogger: jest.fn().mockReturnValue({
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn()
      })
    } as any;

    fleetHandlers = new FleetHandlers(mockRancherManager);
  });

  describe('constructor', () => {
    it('should initialize successfully', () => {
      expect(fleetHandlers).toBeDefined();
    });
  });

  describe('Bundle management handlers', () => {
    it('should list bundles successfully', async () => {
      const mockBundles = [
        { id: 'bundle-1', name: 'test-bundle', state: 'Ready' },
        { id: 'bundle-2', name: 'another-bundle', state: 'Pending' }
      ];
      mockFleetManager.listBundles.mockResolvedValue(mockBundles);

      const result = await fleetHandlers.fleet_list_bundles({ clusterId: 'cluster-1' });

      expect(mockFleetManager.listBundles).toHaveBeenCalledWith('cluster-1');
      expect(result).toEqual(mockBundles);
    });

    it('should list bundles without clusterId', async () => {
      const mockBundles = [{ id: 'bundle-1', name: 'test-bundle' }];
      mockFleetManager.listBundles.mockResolvedValue(mockBundles);

      const result = await fleetHandlers.fleet_list_bundles({});

      expect(mockFleetManager.listBundles).toHaveBeenCalledWith(undefined);
      expect(result).toEqual(mockBundles);
    });

    it('should get bundle by id successfully', async () => {
      const mockBundle = { 
        id: 'bundle-1', 
        name: 'test-bundle', 
        state: 'Ready',
        namespace: 'fleet-default'
      };
      mockFleetManager.getBundle.mockResolvedValue(mockBundle);

      const result = await fleetHandlers.fleet_get_bundle({
        bundleId: 'bundle-1',
        clusterId: 'cluster-1'
      });

      expect(mockFleetManager.getBundle).toHaveBeenCalledWith('bundle-1', 'cluster-1');
      expect(result).toEqual(mockBundle);
    });

    it('should create bundle successfully', async () => {
      const mockBundle = { 
        id: 'new-bundle', 
        name: 'new-bundle',
        state: 'Pending'
      };
      mockFleetManager.createBundle.mockResolvedValue(mockBundle);

      const args = {
        name: 'new-bundle',
        namespace: 'fleet-default',
        clusterId: 'cluster-1',
        targets: [{ clusterId: 'target-cluster', clusterName: 'target' }],
        resources: [{ apiVersion: 'v1', kind: 'ConfigMap', name: 'test-config' }]
      };

      const result = await fleetHandlers.fleet_create_bundle(args);

      expect(mockFleetManager.createBundle).toHaveBeenCalledWith({
        name: 'new-bundle',
        namespace: 'fleet-default',
        targets: [{ clusterId: 'target-cluster', clusterName: 'target' }],
        resources: [{ apiVersion: 'v1', kind: 'ConfigMap', name: 'test-config' }]
      }, 'cluster-1');
      expect(result).toEqual(mockBundle);
    });

    it('should update bundle successfully', async () => {
      const mockBundle = { 
        id: 'bundle-1', 
        name: 'updated-bundle',
        state: 'Ready'
      };
      mockFleetManager.updateBundle.mockResolvedValue(mockBundle);

      const args = {
        bundleId: 'bundle-1',
        clusterId: 'cluster-1',
        targets: [{ clusterId: 'new-target', clusterName: 'new-target' }],
        resources: [{ apiVersion: 'v1', kind: 'Secret', name: 'test-secret' }]
      };

      const result = await fleetHandlers.fleet_update_bundle(args);

      expect(mockFleetManager.updateBundle).toHaveBeenCalledWith('bundle-1', 'cluster-1', {
        targets: [{ clusterId: 'new-target', clusterName: 'new-target' }],
        resources: [{ apiVersion: 'v1', kind: 'Secret', name: 'test-secret' }]
      });
      expect(result).toEqual(mockBundle);
    });

    it('should delete bundle successfully', async () => {
      mockFleetManager.deleteBundle.mockResolvedValue(undefined);

      const result = await fleetHandlers.fleet_delete_bundle({
        bundleId: 'bundle-1',
        clusterId: 'cluster-1'
      });

      expect(mockFleetManager.deleteBundle).toHaveBeenCalledWith('bundle-1', 'cluster-1');
      expect(result).toEqual({
        success: true,
        message: 'Bundle bundle-1 deleted successfully'
      });
    });

    it('should force sync bundle successfully', async () => {
      mockFleetManager.forceSyncBundle.mockResolvedValue(undefined);

      const result = await fleetHandlers.fleet_force_sync_bundle({
        bundleId: 'bundle-1',
        clusterId: 'cluster-1'
      });

      expect(mockFleetManager.forceSyncBundle).toHaveBeenCalledWith('bundle-1', 'cluster-1');
      expect(result).toEqual({
        success: true,
        message: 'Bundle bundle-1 force sync initiated'
      });
    });
  });

  describe('Git repository management handlers', () => {
    it('should list git repositories successfully', async () => {
      const mockRepos = [
        { id: 'repo-1', name: 'test-repo', repo: 'https://github.com/test/repo' },
        { id: 'repo-2', name: 'another-repo', repo: 'https://github.com/test/another' }
      ];
      mockFleetManager.listGitRepos.mockResolvedValue(mockRepos);

      const result = await fleetHandlers.fleet_list_git_repos({ clusterId: 'cluster-1' });

      expect(mockFleetManager.listGitRepos).toHaveBeenCalledWith('cluster-1');
      expect(result).toEqual(mockRepos);
    });

    it('should list git repositories without clusterId', async () => {
      const mockRepos = [{ id: 'repo-1', name: 'test-repo' }];
      mockFleetManager.listGitRepos.mockResolvedValue(mockRepos);

      const result = await fleetHandlers.fleet_list_git_repos({});

      expect(mockFleetManager.listGitRepos).toHaveBeenCalledWith(undefined);
      expect(result).toEqual(mockRepos);
    });

    it('should get git repository by id successfully', async () => {
      const mockRepo = { 
        id: 'repo-1', 
        name: 'test-repo',
        repo: 'https://github.com/test/repo',
        branch: 'main',
        state: 'Ready'
      };
      mockFleetManager.getGitRepo.mockResolvedValue(mockRepo);

      const result = await fleetHandlers.fleet_get_git_repo({
        repoId: 'repo-1',
        clusterId: 'cluster-1'
      });

      expect(mockFleetManager.getGitRepo).toHaveBeenCalledWith('repo-1', 'cluster-1');
      expect(result).toEqual(mockRepo);
    });

    it('should create git repository successfully', async () => {
      const mockRepo = { 
        id: 'new-repo', 
        name: 'new-repo',
        repo: 'https://github.com/test/new-repo',
        state: 'Pending'
      };
      mockFleetManager.createGitRepo.mockResolvedValue(mockRepo);

      const args = {
        name: 'new-repo',
        namespace: 'fleet-default',
        clusterId: 'cluster-1',
        repo: 'https://github.com/test/new-repo',
        branch: 'main',
        paths: ['k8s', 'manifests'],
        targets: [{ clusterId: 'target-cluster', clusterName: 'target' }]
      };

      const result = await fleetHandlers.fleet_create_git_repo(args);

      expect(mockFleetManager.createGitRepo).toHaveBeenCalledWith({
        name: 'new-repo',
        namespace: 'fleet-default',
        repo: 'https://github.com/test/new-repo',
        branch: 'main',
        paths: ['k8s', 'manifests'],
        targets: [{ clusterId: 'target-cluster', clusterName: 'target' }]
      }, 'cluster-1');
      expect(result).toEqual(mockRepo);
    });

    it('should update git repository successfully', async () => {
      const mockRepo = { 
        id: 'repo-1', 
        name: 'updated-repo',
        repo: 'https://github.com/test/updated-repo',
        state: 'Ready'
      };
      mockFleetManager.updateGitRepo.mockResolvedValue(mockRepo);

      const args = {
        repoId: 'repo-1',
        clusterId: 'cluster-1',
        repo: 'https://github.com/test/updated-repo',
        branch: 'develop',
        paths: ['updated-path'],
        targets: [{ clusterId: 'new-target', clusterName: 'new-target' }]
      };

      const result = await fleetHandlers.fleet_update_git_repo(args);

      expect(mockFleetManager.updateGitRepo).toHaveBeenCalledWith('repo-1', 'cluster-1', {
        repo: 'https://github.com/test/updated-repo',
        branch: 'develop',
        paths: ['updated-path'],
        targets: [{ clusterId: 'new-target', clusterName: 'new-target' }]
      });
      expect(result).toEqual(mockRepo);
    });

    it('should delete git repository successfully', async () => {
      mockFleetManager.deleteGitRepo.mockResolvedValue(undefined);

      const result = await fleetHandlers.fleet_delete_git_repo({
        repoId: 'repo-1',
        clusterId: 'cluster-1'
      });

      expect(mockFleetManager.deleteGitRepo).toHaveBeenCalledWith('repo-1', 'cluster-1');
      expect(result).toEqual({
        success: true,
        message: 'Git repository repo-1 deleted successfully'
      });
    });
  });

  describe('Fleet cluster management handlers', () => {
    it('should list fleet clusters successfully', async () => {
      const mockClusters = [
        { id: 'fleet-cluster-1', name: 'cluster-1', state: 'Ready' },
        { id: 'fleet-cluster-2', name: 'cluster-2', state: 'Active' }
      ];
      mockFleetManager.listFleetClusters.mockResolvedValue(mockClusters);

      const result = await fleetHandlers.fleet_list_clusters();

      expect(mockFleetManager.listFleetClusters).toHaveBeenCalled();
      expect(result).toEqual(mockClusters);
    });

    it('should get fleet cluster by id successfully', async () => {
      const mockCluster = { 
        id: 'cluster-1', 
        name: 'cluster-1',
        state: 'Ready',
        fleetWorkspace: 'fleet-default'
      };
      mockFleetManager.getFleetCluster.mockResolvedValue(mockCluster);

      const result = await fleetHandlers.fleet_get_cluster({ clusterId: 'cluster-1' });

      expect(mockFleetManager.getFleetCluster).toHaveBeenCalledWith('cluster-1');
      expect(result).toEqual(mockCluster);
    });
  });

  describe('Fleet workspace handlers', () => {
    it('should list fleet workspaces successfully', async () => {
      const mockWorkspaces = [
        { id: 'workspace-1', name: 'fleet-default' },
        { id: 'workspace-2', name: 'custom-workspace' }
      ];
      mockFleetManager.getFleetWorkspaces.mockResolvedValue(mockWorkspaces);

      const result = await fleetHandlers.fleet_list_workspaces();

      expect(mockFleetManager.getFleetWorkspaces).toHaveBeenCalled();
      expect(result).toEqual(mockWorkspaces);
    });
  });

  describe('Deployment status and monitoring handlers', () => {
    it('should get deployment status successfully', async () => {
      const mockStatus = { 
        state: 'Ready',
        conditions: [{ type: 'Ready', status: 'True' }],
        summary: { ready: 1, total: 1 }
      };
      mockFleetManager.getDeploymentStatus.mockResolvedValue(mockStatus);

      const result = await fleetHandlers.fleet_get_deployment_status({
        bundleId: 'bundle-1',
        clusterId: 'cluster-1'
      });

      expect(mockFleetManager.getDeploymentStatus).toHaveBeenCalledWith('bundle-1', 'cluster-1');
      expect(result).toEqual(mockStatus);
    });

    it('should get fleet logs successfully', async () => {
      const mockLogs = [
        { timestamp: '2024-01-01T00:00:00Z', message: 'Bundle deployed successfully' },
        { timestamp: '2024-01-01T00:01:00Z', message: 'Git repo synced' }
      ];
      mockFleetManager.getFleetLogs.mockResolvedValue(mockLogs);

      const result = await fleetHandlers.fleet_get_logs({
        clusterId: 'cluster-1',
        namespace: 'fleet-default'
      });

      expect(mockFleetManager.getFleetLogs).toHaveBeenCalledWith('cluster-1', 'fleet-default');
      expect(result).toEqual(mockLogs);
    });

    it('should get fleet logs without namespace', async () => {
      const mockLogs = [{ timestamp: '2024-01-01T00:00:00Z', message: 'Log entry' }];
      mockFleetManager.getFleetLogs.mockResolvedValue(mockLogs);

      const result = await fleetHandlers.fleet_get_logs({ clusterId: 'cluster-1' });

      expect(mockFleetManager.getFleetLogs).toHaveBeenCalledWith('cluster-1', undefined);
      expect(result).toEqual(mockLogs);
    });
  });

  describe('Error handling', () => {
    it('should handle no connections available', async () => {
      mockRancherManager.getAllConnections.mockReturnValue([]);

      await expect(fleetHandlers.fleet_list_bundles({ clusterId: 'cluster-1' }))
        .rejects.toThrow('No connected Rancher servers available for Fleet operations');
    });

    it('should handle cluster not found', async () => {
      mockRancherManager.clusters.getClusters.mockResolvedValue([
        { id: 'other-cluster', name: 'other' }
      ]);

      await expect(fleetHandlers.fleet_list_bundles({ clusterId: 'missing-cluster' }))
        .rejects.toThrow('Cluster missing-cluster not found in any connected server');
    });

    it('should handle FleetManager errors', async () => {
      mockFleetManager.listBundles.mockRejectedValue(new Error('Fleet API error'));

      await expect(fleetHandlers.fleet_list_bundles({ clusterId: 'cluster-1' }))
        .rejects.toThrow('Fleet API error');
    });

    it('should use first connection when no clusterId provided', async () => {
      const mockBundles = [{ id: 'bundle-1', name: 'test-bundle' }];
      mockFleetManager.listBundles.mockResolvedValue(mockBundles);

      const result = await fleetHandlers.fleet_list_bundles({});

      expect(mockFleetManager.listBundles).toHaveBeenCalledWith(undefined);
      expect(result).toEqual(mockBundles);
    });

    it('should handle getClusters error gracefully', async () => {
      mockRancherManager.clusters.getClusters.mockRejectedValue(new Error('Clusters API error'));

      await expect(fleetHandlers.fleet_list_bundles({ clusterId: 'cluster-1' }))
        .rejects.toThrow('Cluster cluster-1 not found in any connected server');
    });
  });

  describe('Basic functionality', () => {
    it('should have all required methods', () => {
      const methods = [
        'fleet_list_bundles',
        'fleet_get_bundle', 
        'fleet_create_bundle',
        'fleet_update_bundle',
        'fleet_delete_bundle',
        'fleet_force_sync_bundle',
        'fleet_list_git_repos',
        'fleet_get_git_repo',
        'fleet_create_git_repo',
        'fleet_update_git_repo',
        'fleet_delete_git_repo',
        'fleet_list_clusters',
        'fleet_get_cluster',
        'fleet_list_workspaces',
        'fleet_get_deployment_status',
        'fleet_get_logs'
      ];

      methods.forEach(method => {
        expect(typeof fleetHandlers[method as keyof FleetHandlers]).toBe('function');
      });
    });
  });
});

