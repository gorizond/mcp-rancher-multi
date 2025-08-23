import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { FleetHandlers } from '../../handlers/fleet-handlers';
import { FleetManager } from '../../rancher/fleet';
import { RancherManager } from '../../rancher/manager';

// Mock dependencies
jest.mock('../../rancher/fleet');
jest.mock('../../rancher/manager');

describe('FleetHandlers', () => {
  let fleetHandlers: FleetHandlers;
  let mockRancherManager: any;
  let mockFleetManager: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

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
          client: {
            request: jest.fn()
          }
        }
      ]),
      getConfigManager: jest.fn().mockReturnValue({}),
      getLogger: jest.fn().mockReturnValue({
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn()
      })
    };

    fleetHandlers = new FleetHandlers(mockRancherManager);
  });

  describe('constructor', () => {
    it('should initialize with connected Rancher server', () => {
      expect(mockRancherManager.getAllConnections).toHaveBeenCalled();
      expect(FleetManager).toHaveBeenCalled();
    });

    it('should throw error when no connections available', () => {
      mockRancherManager.getAllConnections.mockReturnValue([]);
      
      expect(() => new FleetHandlers(mockRancherManager)).toThrow(
        'No connected Rancher servers available for Fleet operations'
      );
    });
  });

  describe('Bundle management handlers', () => {
    it('should list bundles', async () => {
      const mockBundles = [{ id: 'bundle-1', name: 'test-bundle' }];
      mockFleetManager.listBundles.mockResolvedValue(mockBundles);

      const result = await fleetHandlers.fleet_list_bundles({ clusterId: 'cluster-1' });

      expect(mockFleetManager.listBundles).toHaveBeenCalledWith('cluster-1');
      expect(result).toEqual(mockBundles);
    });

    it('should get bundle', async () => {
      const mockBundle = { id: 'bundle-1', name: 'test-bundle' };
      mockFleetManager.getBundle.mockResolvedValue(mockBundle);

      const result = await fleetHandlers.fleet_get_bundle({
        bundleId: 'bundle-1',
        clusterId: 'cluster-1'
      });

      expect(mockFleetManager.getBundle).toHaveBeenCalledWith('bundle-1', 'cluster-1');
      expect(result).toEqual(mockBundle);
    });

    it('should create bundle', async () => {
      const mockBundle = { id: 'new-bundle', name: 'new-bundle' };
      mockFleetManager.createBundle.mockResolvedValue(mockBundle);

      const args = {
        name: 'new-bundle',
        namespace: 'fleet-default',
        clusterId: 'cluster-1',
        targets: [],
        resources: []
      };

      const result = await fleetHandlers.fleet_create_bundle(args);

      expect(mockFleetManager.createBundle).toHaveBeenCalledWith({
        name: 'new-bundle',
        namespace: 'fleet-default',
        targets: [],
        resources: []
      }, 'cluster-1');
      expect(result).toEqual(mockBundle);
    });

    it('should update bundle', async () => {
      const mockBundle = { id: 'bundle-1', name: 'updated-bundle' };
      mockFleetManager.updateBundle.mockResolvedValue(mockBundle);

      const args = {
        bundleId: 'bundle-1',
        clusterId: 'cluster-1',
        targets: [],
        resources: []
      };

      const result = await fleetHandlers.fleet_update_bundle(args);

      expect(mockFleetManager.updateBundle).toHaveBeenCalledWith('bundle-1', 'cluster-1', {
        targets: [],
        resources: []
      });
      expect(result).toEqual(mockBundle);
    });

    it('should delete bundle', async () => {
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

    it('should force sync bundle', async () => {
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
    it('should list git repos', async () => {
      const mockRepos = [{ id: 'repo-1', name: 'test-repo' }];
      mockFleetManager.listGitRepos.mockResolvedValue(mockRepos);

      const result = await fleetHandlers.fleet_list_git_repos({ clusterId: 'cluster-1' });

      expect(mockFleetManager.listGitRepos).toHaveBeenCalledWith('cluster-1');
      expect(result).toEqual(mockRepos);
    });

    it('should get git repo', async () => {
      const mockRepo = { id: 'repo-1', name: 'test-repo' };
      mockFleetManager.getGitRepo.mockResolvedValue(mockRepo);

      const result = await fleetHandlers.fleet_get_git_repo({
        repoId: 'repo-1',
        clusterId: 'cluster-1'
      });

      expect(mockFleetManager.getGitRepo).toHaveBeenCalledWith('repo-1', 'cluster-1');
      expect(result).toEqual(mockRepo);
    });

    it('should create git repo', async () => {
      const mockRepo = { id: 'new-repo', name: 'new-repo' };
      mockFleetManager.createGitRepo.mockResolvedValue(mockRepo);

      const args = {
        name: 'new-repo',
        namespace: 'fleet-default',
        clusterId: 'cluster-1',
        repo: 'https://github.com/test/repo',
        branch: 'main',
        paths: ['k8s'],
        targets: []
      };

      const result = await fleetHandlers.fleet_create_git_repo(args);

      expect(mockFleetManager.createGitRepo).toHaveBeenCalledWith({
        name: 'new-repo',
        namespace: 'fleet-default',
        repo: 'https://github.com/test/repo',
        branch: 'main',
        paths: ['k8s'],
        targets: []
      }, 'cluster-1');
      expect(result).toEqual(mockRepo);
    });

    it('should update git repo', async () => {
      const mockRepo = { id: 'repo-1', name: 'updated-repo' };
      mockFleetManager.updateGitRepo.mockResolvedValue(mockRepo);

      const args = {
        repoId: 'repo-1',
        clusterId: 'cluster-1',
        repo: 'https://github.com/test/updated-repo',
        branch: 'develop',
        paths: ['manifests'],
        targets: []
      };

      const result = await fleetHandlers.fleet_update_git_repo(args);

      expect(mockFleetManager.updateGitRepo).toHaveBeenCalledWith('repo-1', 'cluster-1', {
        repo: 'https://github.com/test/updated-repo',
        branch: 'develop',
        paths: ['manifests'],
        targets: []
      });
      expect(result).toEqual(mockRepo);
    });

    it('should delete git repo', async () => {
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
    it('should list fleet clusters', async () => {
      const mockClusters = [{ id: 'cluster-1', name: 'test-cluster' }];
      mockFleetManager.listFleetClusters.mockResolvedValue(mockClusters);

      const result = await fleetHandlers.fleet_list_clusters();

      expect(mockFleetManager.listFleetClusters).toHaveBeenCalled();
      expect(result).toEqual(mockClusters);
    });

    it('should get fleet cluster', async () => {
      const mockCluster = { id: 'cluster-1', name: 'test-cluster' };
      mockFleetManager.getFleetCluster.mockResolvedValue(mockCluster);

      const result = await fleetHandlers.fleet_get_cluster({ clusterId: 'cluster-1' });

      expect(mockFleetManager.getFleetCluster).toHaveBeenCalledWith('cluster-1');
      expect(result).toEqual(mockCluster);
    });
  });

  describe('Fleet workspace handlers', () => {
    it('should list workspaces', async () => {
      const mockWorkspaces = [{ id: 'workspace-1', name: 'default' }];
      mockFleetManager.getFleetWorkspaces.mockResolvedValue(mockWorkspaces);

      const result = await fleetHandlers.fleet_list_workspaces();

      expect(mockFleetManager.getFleetWorkspaces).toHaveBeenCalled();
      expect(result).toEqual(mockWorkspaces);
    });
  });

  describe('Deployment status and monitoring handlers', () => {
    it('should get deployment status', async () => {
      const mockStatus = { state: 'Ready', targets: [] };
      mockFleetManager.getDeploymentStatus.mockResolvedValue(mockStatus);

      const result = await fleetHandlers.fleet_get_deployment_status({
        bundleId: 'bundle-1',
        clusterId: 'cluster-1'
      });

      expect(mockFleetManager.getDeploymentStatus).toHaveBeenCalledWith('bundle-1', 'cluster-1');
      expect(result).toEqual(mockStatus);
    });

    it('should get fleet logs', async () => {
      const mockLogs = [{ timestamp: '2024-01-01', message: 'Log entry' }];
      mockFleetManager.getFleetLogs.mockResolvedValue(mockLogs);

      const result = await fleetHandlers.fleet_get_logs({
        clusterId: 'cluster-1',
        namespace: 'fleet-default'
      });

      expect(mockFleetManager.getFleetLogs).toHaveBeenCalledWith('cluster-1', 'fleet-default');
      expect(result).toEqual(mockLogs);
    });
  });
});
