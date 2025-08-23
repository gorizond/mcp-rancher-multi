import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import axios from 'axios';
import { RancherClient } from '../client';
import { RancherServerConfig } from '../../config/manager';
import { Logger } from '../../utils/logger';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('RancherClient', () => {
  let rancherClient: RancherClient;
  let mockConfig: RancherServerConfig;
  let mockLogger: Logger;
  let mockAxiosInstance: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock axios instance
    mockAxiosInstance = {
      defaults: {
        baseURL: '',
        timeout: 0,
        headers: {
          common: {}
        }
      },
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      request: jest.fn(),
      interceptors: {
        request: {
          use: jest.fn()
        },
        response: {
          use: jest.fn()
        }
      }
    };

    mockedAxios.create.mockReturnValue(mockAxiosInstance);

    // Create mock config
    mockConfig = {
      name: 'test-server',
      url: 'https://rancher.test.com',
      token: 'test-token',
      timeout: 30000,
      retries: 3
    };

    // Create mock logger
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn()
    } as any;

    rancherClient = new RancherClient(mockConfig, mockLogger);
  });

  describe('constructor', () => {
    it('should initialize with config and logger', () => {
      expect(rancherClient).toBeDefined();
      expect(mockedAxios.create).toHaveBeenCalled();
    });
  });

  describe('initialize', () => {
    it('should initialize with token authentication', async () => {
      // Mock the ping method to return true
      jest.spyOn(rancherClient as any, 'ping').mockResolvedValue(true);
      mockAxiosInstance.get.mockResolvedValue({ data: { version: '2.6.0' } });

      await rancherClient.initialize();

      expect(mockAxiosInstance.defaults.baseURL).toBe('https://rancher.test.com');
      expect(mockAxiosInstance.defaults.timeout).toBe(30000);
      expect(mockAxiosInstance.defaults.headers.common['Authorization']).toBe('Bearer test-token');
      expect(mockLogger.info).toHaveBeenCalledWith('Initializing Rancher client for test-server');
      expect(mockLogger.info).toHaveBeenCalledWith('Rancher client test-server initialized');
    });

    it('should initialize with username/password authentication', async () => {
      const configWithCreds = {
        name: 'test-server',
        url: 'https://rancher.test.com',
        token: '', // Empty token, will use username/password
        username: 'admin',
        password: 'password',
        timeout: 30000,
        retries: 3
      };

      rancherClient = new RancherClient(configWithCreds, mockLogger);

      // Mock authentication response
      mockedAxios.post.mockResolvedValue({
        data: { token: 'auth-token' }
      });

      // Mock the ping method to return true
      jest.spyOn(rancherClient as any, 'ping').mockResolvedValue(true);
      mockAxiosInstance.get.mockResolvedValue({ data: { version: '2.6.0' } });

      await rancherClient.initialize();

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://rancher.test.com/v3-public/localProviders/local?action=login',
        {
          username: 'admin',
          password: 'password'
        }
      );
      expect(mockAxiosInstance.defaults.headers.common['Authorization']).toBe('Bearer auth-token');
    });

    it('should setup interceptors', async () => {
      // Mock the ping method to return true
      jest.spyOn(rancherClient as any, 'ping').mockResolvedValue(true);
      mockAxiosInstance.get.mockResolvedValue({ data: { version: '2.6.0' } });

      await rancherClient.initialize();

      expect(mockAxiosInstance.interceptors.request.use).toHaveBeenCalled();
      expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalled();
    });

    it('should handle ping failure', async () => {
      mockAxiosInstance.get.mockRejectedValue(new Error('Connection failed'));

      await expect(rancherClient.initialize()).rejects.toThrow('Failed to connect to Rancher server');
    });
  });

  describe('request', () => {
    beforeEach(async () => {
      // Mock the ping method to return true
      jest.spyOn(rancherClient as any, 'ping').mockResolvedValue(true);
      mockAxiosInstance.get.mockResolvedValue({ data: { version: '2.6.0' } });
      await rancherClient.initialize();
    });

    it('should make successful request', async () => {
      const mockResponse = { data: { clusters: [] } };
      mockAxiosInstance.request.mockResolvedValue(mockResponse);

      const result = await rancherClient.request({
        method: 'GET',
        url: '/v3/clusters'
      });

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'GET',
        url: '/v3/clusters'
      });
      expect(result).toEqual({ clusters: [] });
    });

    it('should handle request error', async () => {
      mockAxiosInstance.request.mockRejectedValue(new Error('API Error'));

      await expect(rancherClient.request({
        method: 'GET',
        url: '/v3/clusters'
      })).rejects.toThrow('API Error');
    });

    it('should handle request with data', async () => {
      const mockResponse = { data: { id: 'cluster-1' } };
      mockAxiosInstance.request.mockResolvedValue(mockResponse);

      const requestData = { name: 'test-cluster', type: 'cluster' };
      const result = await rancherClient.request({
        method: 'POST',
        url: '/v3/clusters',
        data: requestData
      });

      expect(mockAxiosInstance.request).toHaveBeenCalledWith({
        method: 'POST',
        url: '/v3/clusters',
        data: requestData
      });
      expect(result).toEqual({ id: 'cluster-1' });
    });
  });

  describe('ping', () => {
    beforeEach(async () => {
      // Skip initialization for ping-only tests
      jest.spyOn(rancherClient as any, 'ping').mockImplementation(async () => {
        return mockAxiosInstance.get('/v3');
      });
    });

    it('should ping successfully', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: { version: '2.6.0' } });

      const result = await (rancherClient as any).ping();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v3');
    });

    it('should handle ping failure', async () => {
      mockAxiosInstance.get.mockRejectedValue(new Error('Network error'));

      await expect((rancherClient as any).ping()).rejects.toThrow('Network error');
    });
  });

  describe('getClusters', () => {
    beforeEach(async () => {
      // Mock the ping method to return true
      jest.spyOn(rancherClient as any, 'ping').mockResolvedValue(true);
      mockAxiosInstance.get.mockResolvedValue({ data: { version: '2.6.0' } });
      await rancherClient.initialize();
    });

    it('should get clusters successfully', async () => {
      const mockClusters = {
        data: [
          { id: 'cluster-1', name: 'test-cluster-1' },
          { id: 'cluster-2', name: 'test-cluster-2' }
        ]
      };
      mockAxiosInstance.get.mockResolvedValue({ data: mockClusters });

      const result = await rancherClient.getClusters();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v3/clusters');
      expect(result).toEqual(mockClusters.data);
    });

    it('should handle getClusters error', async () => {
      mockAxiosInstance.get.mockRejectedValue(new Error('Failed to fetch clusters'));

      await expect(rancherClient.getClusters()).rejects.toThrow('Failed to fetch clusters');
    });
  });

  describe('getCluster', () => {
    beforeEach(async () => {
      // Mock the ping method to return true
      jest.spyOn(rancherClient as any, 'ping').mockResolvedValue(true);
      mockAxiosInstance.get.mockResolvedValue({ data: { version: '2.6.0' } });
      await rancherClient.initialize();
    });

    it('should get cluster by id successfully', async () => {
      const mockCluster = { data: { id: 'cluster-1', name: 'test-cluster' } };
      mockAxiosInstance.get.mockResolvedValue({ data: mockCluster });

      const result = await rancherClient.getCluster('cluster-1');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v3/clusters/cluster-1');
      expect(result).toEqual(mockCluster.data);
    });

    it('should handle getCluster error', async () => {
      mockAxiosInstance.get.mockRejectedValue(new Error('Cluster not found'));

      await expect(rancherClient.getCluster('non-existent')).rejects.toThrow('Cluster not found');
    });
  });

  describe('createCluster', () => {
    beforeEach(async () => {
      // Mock the ping method to return true
      jest.spyOn(rancherClient as any, 'ping').mockResolvedValue(true);
      mockAxiosInstance.get.mockResolvedValue({ data: { version: '2.6.0' } });
      await rancherClient.initialize();
    });

    it('should create cluster successfully', async () => {
      const mockCluster = { data: { id: 'new-cluster', name: 'new-cluster' } };
      mockAxiosInstance.post.mockResolvedValue({ data: mockCluster });

      const clusterData = {
        name: 'new-cluster',
        type: 'cluster'
      };

      const result = await rancherClient.createCluster(clusterData);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/v3/clusters', clusterData);
      expect(result).toEqual(mockCluster.data);
    });

    it('should handle createCluster error', async () => {
      mockAxiosInstance.post.mockRejectedValue(new Error('Failed to create cluster'));

      await expect(rancherClient.createCluster({})).rejects.toThrow('Failed to create cluster');
    });
  });

  describe('deleteCluster', () => {
    beforeEach(async () => {
      // Mock the ping method to return true
      jest.spyOn(rancherClient as any, 'ping').mockResolvedValue(true);
      mockAxiosInstance.get.mockResolvedValue({ data: { version: '2.6.0' } });
      await rancherClient.initialize();
    });

    it('should delete cluster successfully', async () => {
      mockAxiosInstance.delete.mockResolvedValue({ data: {} });

      await rancherClient.deleteCluster('cluster-1');

      expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/v3/clusters/cluster-1');
    });

    it('should handle deleteCluster error', async () => {
      mockAxiosInstance.delete.mockRejectedValue(new Error('Failed to delete cluster'));

      await expect(rancherClient.deleteCluster('cluster-1')).rejects.toThrow('Failed to delete cluster');
    });
  });

  describe('getProjects', () => {
    beforeEach(async () => {
      // Mock the ping method to return true
      jest.spyOn(rancherClient as any, 'ping').mockResolvedValue(true);
      mockAxiosInstance.get.mockResolvedValue({ data: { version: '2.6.0' } });
      await rancherClient.initialize();
    });

    it('should get projects successfully', async () => {
      const mockProjects = {
        data: [
          { id: 'project-1', name: 'test-project-1' },
          { id: 'project-2', name: 'test-project-2' }
        ]
      };
      mockAxiosInstance.get.mockResolvedValue({ data: mockProjects });

      const result = await rancherClient.getProjects();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v3/projects', { params: {} });
      expect(result).toEqual(mockProjects.data);
    });

    it('should get projects for specific cluster', async () => {
      const mockProjects = {
        data: [{ id: 'project-1', name: 'test-project' }]
      };
      mockAxiosInstance.get.mockResolvedValue({ data: mockProjects });

      const result = await rancherClient.getProjects('cluster-1');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v3/projects', { params: { clusterId: 'cluster-1' } });
      expect(result).toEqual(mockProjects.data);
    });
  });

  describe('isInitialized', () => {
    it('should return false before initialization', () => {
      expect((rancherClient as any).isInitialized).toBe(false);
    });

    it('should return true after initialization', async () => {
      // Mock the ping method to return true
      jest.spyOn(rancherClient as any, 'ping').mockResolvedValue(true);
      mockAxiosInstance.get.mockResolvedValue({ data: { version: '2.6.0' } });
      await rancherClient.initialize();

      expect((rancherClient as any).isInitialized).toBe(true);
    });
  });

  describe('disconnect', () => {
    it('should disconnect successfully', async () => {
      // Mock the ping method to return true
      jest.spyOn(rancherClient as any, 'ping').mockResolvedValue(true);
      mockAxiosInstance.get.mockResolvedValue({ data: { version: '2.6.0' } });
      await rancherClient.initialize();

      await rancherClient.disconnect();

      expect(mockLogger.info).toHaveBeenCalledWith('Rancher client test-server disconnected');
    });
  });

  describe('getClusterKubeconfig', () => {
    beforeEach(async () => {
      // Mock the ping method to return true
      jest.spyOn(rancherClient as any, 'ping').mockResolvedValue(true);
      mockAxiosInstance.get.mockResolvedValue({ data: { version: '2.6.0' } });
      await rancherClient.initialize();
    });

    it('should get kubeconfig in yaml format', async () => {
      const mockKubeconfig = 'apiVersion: v1\nkind: Config';
      mockAxiosInstance.post.mockResolvedValue({
        data: { config: mockKubeconfig }
      });

      const result = await rancherClient.getClusterKubeconfig('cluster-1', 'yaml');

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/v3/clusters/cluster-1?action=generateKubeconfig',
        {},
        {
          headers: {
            'Accept': 'application/yaml',
            'Content-Type': 'application/json'
          }
        }
      );
      expect(result).toEqual({
        clusterId: 'cluster-1',
        format: 'yaml',
        kubeconfig: mockKubeconfig
      });
    });

    it('should get kubeconfig in json format', async () => {
      const mockKubeconfig = 'apiVersion: v1\nkind: Config';
      mockAxiosInstance.post.mockResolvedValue({
        data: { config: mockKubeconfig }
      });

      const result = await rancherClient.getClusterKubeconfig('cluster-1', 'json');

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/v3/clusters/cluster-1?action=generateKubeconfig',
        {},
        {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        }
      );
      expect(result).toHaveProperty('clusterId', 'cluster-1');
      expect(result).toHaveProperty('format', 'json');
      expect(result).toHaveProperty('kubeconfig');
      expect(result).toHaveProperty('raw');
    });

    it('should get kubeconfig in raw format', async () => {
      const mockKubeconfig = 'apiVersion: v1\nkind: Config';
      mockAxiosInstance.post.mockResolvedValue({
        data: { config: mockKubeconfig }
      });

      const result = await rancherClient.getClusterKubeconfig('cluster-1', 'raw');

      expect(result).toEqual({
        clusterId: 'cluster-1',
        format: 'raw',
        kubeconfig: mockKubeconfig
      });
    });

    it('should handle kubeconfig error', async () => {
      mockAxiosInstance.post.mockRejectedValue(new Error('Failed to generate kubeconfig'));

      await expect(rancherClient.getClusterKubeconfig('cluster-1')).rejects.toThrow('Failed to get kubeconfig: Failed to generate kubeconfig');
    });

    it('should handle missing kubeconfig in response', async () => {
      mockAxiosInstance.post.mockResolvedValue({
        data: {} // No config property
      });

      await expect(rancherClient.getClusterKubeconfig('cluster-1')).rejects.toThrow('Failed to get kubeconfig: No kubeconfig found in response');
    });
  });

  describe('getProject', () => {
    beforeEach(async () => {
      // Mock the ping method to return true
      jest.spyOn(rancherClient as any, 'ping').mockResolvedValue(true);
      mockAxiosInstance.get.mockResolvedValue({ data: { version: '2.6.0' } });
      await rancherClient.initialize();
    });

    it('should get project by id successfully', async () => {
      const mockProject = { data: { id: 'project-1', name: 'test-project' } };
      mockAxiosInstance.get.mockResolvedValue({ data: mockProject });

      const result = await rancherClient.getProject('project-1');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v3/projects/project-1');
      expect(result).toEqual(mockProject.data);
    });

    it('should handle getProject error', async () => {
      mockAxiosInstance.get.mockRejectedValue(new Error('Project not found'));

      await expect(rancherClient.getProject('non-existent')).rejects.toThrow('Project not found');
    });
  });

  describe('createProject', () => {
    beforeEach(async () => {
      // Mock the ping method to return true
      jest.spyOn(rancherClient as any, 'ping').mockResolvedValue(true);
      mockAxiosInstance.get.mockResolvedValue({ data: { version: '2.6.0' } });
      await rancherClient.initialize();
    });

    it('should create project successfully', async () => {
      const mockProject = { data: { id: 'new-project', name: 'new-project' } };
      mockAxiosInstance.post.mockResolvedValue({ data: mockProject });

      const projectData = {
        name: 'new-project',
        clusterId: 'cluster-1'
      };

      const result = await rancherClient.createProject(projectData);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/v3/projects', projectData);
      expect(result).toEqual(mockProject.data);
    });

    it('should handle createProject error', async () => {
      mockAxiosInstance.post.mockRejectedValue(new Error('Failed to create project'));

      await expect(rancherClient.createProject({})).rejects.toThrow('Failed to create project');
    });
  });

  describe('deleteProject', () => {
    beforeEach(async () => {
      // Mock the ping method to return true
      jest.spyOn(rancherClient as any, 'ping').mockResolvedValue(true);
      mockAxiosInstance.get.mockResolvedValue({ data: { version: '2.6.0' } });
      await rancherClient.initialize();
    });

    it('should delete project successfully', async () => {
      mockAxiosInstance.delete.mockResolvedValue({ data: {} });

      await rancherClient.deleteProject('project-1');

      expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/v3/projects/project-1');
    });

    it('should handle deleteProject error', async () => {
      mockAxiosInstance.delete.mockRejectedValue(new Error('Failed to delete project'));

      await expect(rancherClient.deleteProject('project-1')).rejects.toThrow('Failed to delete project');
    });
  });

  describe('getNamespaces', () => {
    beforeEach(async () => {
      // Mock the ping method to return true
      jest.spyOn(rancherClient as any, 'ping').mockResolvedValue(true);
      mockAxiosInstance.get.mockResolvedValue({ data: { version: '2.6.0' } });
      await rancherClient.initialize();
    });

    it('should get all namespaces successfully', async () => {
      const mockNamespaces = {
        data: [
          { id: 'ns-1', name: 'namespace-1' },
          { id: 'ns-2', name: 'namespace-2' }
        ]
      };
      mockAxiosInstance.get.mockResolvedValue({ data: mockNamespaces });

      const result = await rancherClient.getNamespaces();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v3/namespaces', { params: {} });
      expect(result).toEqual(mockNamespaces.data);
    });

    it('should get namespaces for specific project', async () => {
      const mockNamespaces = {
        data: [{ id: 'ns-1', name: 'namespace-1' }]
      };
      mockAxiosInstance.get.mockResolvedValue({ data: mockNamespaces });

      const result = await rancherClient.getNamespaces('project-1');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v3/namespaces', { params: { projectId: 'project-1' } });
      expect(result).toEqual(mockNamespaces.data);
    });
  });

  describe('getNamespace', () => {
    beforeEach(async () => {
      // Mock the ping method to return true
      jest.spyOn(rancherClient as any, 'ping').mockResolvedValue(true);
      mockAxiosInstance.get.mockResolvedValue({ data: { version: '2.6.0' } });
      await rancherClient.initialize();
    });

    it('should get namespace by id successfully', async () => {
      const mockNamespace = { data: { id: 'ns-1', name: 'namespace-1' } };
      mockAxiosInstance.get.mockResolvedValue({ data: mockNamespace });

      const result = await rancherClient.getNamespace('ns-1');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v3/namespaces/ns-1');
      expect(result).toEqual(mockNamespace.data);
    });
  });

  describe('createNamespace', () => {
    beforeEach(async () => {
      // Mock the ping method to return true
      jest.spyOn(rancherClient as any, 'ping').mockResolvedValue(true);
      mockAxiosInstance.get.mockResolvedValue({ data: { version: '2.6.0' } });
      await rancherClient.initialize();
    });

    it('should create namespace successfully', async () => {
      const mockNamespace = { data: { id: 'new-ns', name: 'new-namespace' } };
      mockAxiosInstance.post.mockResolvedValue({ data: mockNamespace });

      const namespaceData = {
        name: 'new-namespace',
        projectId: 'project-1'
      };

      const result = await rancherClient.createNamespace(namespaceData);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/v3/namespaces', namespaceData);
      expect(result).toEqual(mockNamespace.data);
    });
  });

  describe('deleteNamespace', () => {
    beforeEach(async () => {
      // Mock the ping method to return true
      jest.spyOn(rancherClient as any, 'ping').mockResolvedValue(true);
      mockAxiosInstance.get.mockResolvedValue({ data: { version: '2.6.0' } });
      await rancherClient.initialize();
    });

    it('should delete namespace successfully', async () => {
      mockAxiosInstance.delete.mockResolvedValue({ data: {} });

      await rancherClient.deleteNamespace('ns-1');

      expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/v3/namespaces/ns-1');
    });
  });

  describe('getUsers', () => {
    beforeEach(async () => {
      // Mock the ping method to return true
      jest.spyOn(rancherClient as any, 'ping').mockResolvedValue(true);
      mockAxiosInstance.get.mockResolvedValue({ data: { version: '2.6.0' } });
      await rancherClient.initialize();
    });

    it('should get users successfully', async () => {
      const mockUsers = {
        data: [
          { id: 'user-1', username: 'user1' },
          { id: 'user-2', username: 'user2' }
        ]
      };
      mockAxiosInstance.get.mockResolvedValue({ data: mockUsers });

      const result = await rancherClient.getUsers();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v3/users');
      expect(result).toEqual(mockUsers.data);
    });
  });

  describe('getUser', () => {
    beforeEach(async () => {
      // Mock the ping method to return true
      jest.spyOn(rancherClient as any, 'ping').mockResolvedValue(true);
      mockAxiosInstance.get.mockResolvedValue({ data: { version: '2.6.0' } });
      await rancherClient.initialize();
    });

    it('should get user by id successfully', async () => {
      const mockUser = { data: { id: 'user-1', username: 'user1' } };
      mockAxiosInstance.get.mockResolvedValue({ data: mockUser });

      const result = await rancherClient.getUser('user-1');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v3/users/user-1');
      expect(result).toEqual(mockUser.data);
    });
  });

  describe('createUser', () => {
    beforeEach(async () => {
      // Mock the ping method to return true
      jest.spyOn(rancherClient as any, 'ping').mockResolvedValue(true);
      mockAxiosInstance.get.mockResolvedValue({ data: { version: '2.6.0' } });
      await rancherClient.initialize();
    });

    it('should create user successfully', async () => {
      const mockUser = { data: { id: 'new-user', username: 'newuser' } };
      mockAxiosInstance.post.mockResolvedValue({ data: mockUser });

      const userData = {
        username: 'newuser',
        password: 'password123'
      };

      const result = await rancherClient.createUser(userData);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/v3/users', userData);
      expect(result).toEqual(mockUser.data);
    });
  });

  describe('deleteUser', () => {
    beforeEach(async () => {
      // Mock the ping method to return true
      jest.spyOn(rancherClient as any, 'ping').mockResolvedValue(true);
      mockAxiosInstance.get.mockResolvedValue({ data: { version: '2.6.0' } });
      await rancherClient.initialize();
    });

    it('should delete user successfully', async () => {
      mockAxiosInstance.delete.mockResolvedValue({ data: {} });

      await rancherClient.deleteUser('user-1');

      expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/v3/users/user-1');
    });
  });

  describe('getApplications', () => {
    beforeEach(async () => {
      // Mock the ping method to return true
      jest.spyOn(rancherClient as any, 'ping').mockResolvedValue(true);
      mockAxiosInstance.get.mockResolvedValue({ data: { version: '2.6.0' } });
      await rancherClient.initialize();
    });

    it('should get all applications successfully', async () => {
      const mockApps = {
        data: [
          { id: 'app-1', name: 'app1' },
          { id: 'app-2', name: 'app2' }
        ]
      };
      mockAxiosInstance.get.mockResolvedValue({ data: mockApps });

      const result = await rancherClient.getApplications();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v3/apps', { params: {} });
      expect(result).toEqual(mockApps.data);
    });

    it('should get applications for specific project', async () => {
      const mockApps = {
        data: [{ id: 'app-1', name: 'app1' }]
      };
      mockAxiosInstance.get.mockResolvedValue({ data: mockApps });

      const result = await rancherClient.getApplications('project-1');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v3/apps', { params: { projectId: 'project-1' } });
      expect(result).toEqual(mockApps.data);
    });
  });

  describe('getApplication', () => {
    beforeEach(async () => {
      // Mock the ping method to return true
      jest.spyOn(rancherClient as any, 'ping').mockResolvedValue(true);
      mockAxiosInstance.get.mockResolvedValue({ data: { version: '2.6.0' } });
      await rancherClient.initialize();
    });

    it('should get application by id successfully', async () => {
      const mockApp = { data: { id: 'app-1', name: 'app1' } };
      mockAxiosInstance.get.mockResolvedValue({ data: mockApp });

      const result = await rancherClient.getApplication('app-1');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v3/apps/app-1');
      expect(result).toEqual(mockApp.data);
    });
  });

  describe('createApplication', () => {
    beforeEach(async () => {
      // Mock the ping method to return true
      jest.spyOn(rancherClient as any, 'ping').mockResolvedValue(true);
      mockAxiosInstance.get.mockResolvedValue({ data: { version: '2.6.0' } });
      await rancherClient.initialize();
    });

    it('should create application successfully', async () => {
      const mockApp = { data: { id: 'new-app', name: 'newapp' } };
      mockAxiosInstance.post.mockResolvedValue({ data: mockApp });

      const appData = {
        name: 'newapp',
        projectId: 'project-1'
      };

      const result = await rancherClient.createApplication(appData);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/v3/apps', appData);
      expect(result).toEqual(mockApp.data);
    });
  });

  describe('deleteApplication', () => {
    beforeEach(async () => {
      // Mock the ping method to return true
      jest.spyOn(rancherClient as any, 'ping').mockResolvedValue(true);
      mockAxiosInstance.get.mockResolvedValue({ data: { version: '2.6.0' } });
      await rancherClient.initialize();
    });

    it('should delete application successfully', async () => {
      mockAxiosInstance.delete.mockResolvedValue({ data: {} });

      await rancherClient.deleteApplication('app-1');

      expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/v3/apps/app-1');
    });
  });

  describe('getServerStatus', () => {
    beforeEach(async () => {
      // Mock the ping method to return true
      jest.spyOn(rancherClient as any, 'ping').mockResolvedValue(true);
      mockAxiosInstance.get.mockResolvedValue({ data: { version: '2.6.0' } });
      await rancherClient.initialize();
    });

    it('should get server status successfully', async () => {
      mockAxiosInstance.get
        .mockResolvedValueOnce({ data: { value: '2.6.0' } }) // version response
        .mockResolvedValueOnce({ data: { setting1: 'value1' } }); // settings response

      const result = await rancherClient.getServerStatus();

      expect(result).toEqual({
        version: '2.6.0',
        settings: { setting1: 'value1' },
        status: 'healthy'
      });
    });

    it('should handle server status error', async () => {
      mockAxiosInstance.get.mockRejectedValue(new Error('Server error'));

      const result = await rancherClient.getServerStatus();

      expect(result).toEqual({
        status: 'unhealthy',
        error: 'Server error'
      });
    });
  });

  describe('getConfig', () => {
    it('should return config', () => {
      const result = rancherClient.getConfig();

      expect(result).toEqual(mockConfig);
    });
  });

  describe('isConnected', () => {
    it('should return false before initialization', () => {
      expect(rancherClient.isConnected()).toBe(false);
    });

    it('should return true after initialization', async () => {
      // Mock the ping method to return true
      jest.spyOn(rancherClient as any, 'ping').mockResolvedValue(true);
      mockAxiosInstance.get.mockResolvedValue({ data: { version: '2.6.0' } });
      await rancherClient.initialize();

      expect(rancherClient.isConnected()).toBe(true);
    });
  });

  describe('getCatalogs', () => {
    beforeEach(async () => {
      // Mock the ping method to return true
      jest.spyOn(rancherClient as any, 'ping').mockResolvedValue(true);
      mockAxiosInstance.get.mockResolvedValue({ data: { version: '2.6.0' } });
      await rancherClient.initialize();
    });

    it('should get catalogs successfully', async () => {
      const mockCatalogs = {
        data: [
          { id: 'cat-1', name: 'catalog-1' },
          { id: 'cat-2', name: 'catalog-2' }
        ]
      };
      mockAxiosInstance.get.mockResolvedValue({ data: mockCatalogs });

      const result = await rancherClient.getCatalogs();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v3/catalogs');
      expect(result).toEqual(mockCatalogs.data);
    });
  });

  describe('getCatalogTemplates', () => {
    beforeEach(async () => {
      // Mock the ping method to return true
      jest.spyOn(rancherClient as any, 'ping').mockResolvedValue(true);
      mockAxiosInstance.get.mockResolvedValue({ data: { version: '2.6.0' } });
      await rancherClient.initialize();
    });

    it('should get catalog templates successfully', async () => {
      const mockTemplates = {
        data: [
          { id: 'template-1', name: 'template-1' },
          { id: 'template-2', name: 'template-2' }
        ]
      };
      mockAxiosInstance.get.mockResolvedValue({ data: mockTemplates });

      const result = await rancherClient.getCatalogTemplates('cat-1');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v3/catalogs/cat-1/templates');
      expect(result).toEqual(mockTemplates.data);
    });
  });

  describe('getEvents', () => {
    beforeEach(async () => {
      // Mock the ping method to return true
      jest.spyOn(rancherClient as any, 'ping').mockResolvedValue(true);
      mockAxiosInstance.get.mockResolvedValue({ data: { version: '2.6.0' } });
      await rancherClient.initialize();
    });

    it('should get events successfully', async () => {
      const mockEvents = {
        data: [
          { id: 'event-1', type: 'Normal' },
          { id: 'event-2', type: 'Warning' }
        ]
      };
      mockAxiosInstance.get.mockResolvedValue({ data: mockEvents });

      const result = await rancherClient.getEvents();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v3/events', { params: {} });
      expect(result).toEqual(mockEvents.data);
    });

    it('should get events with filters', async () => {
      const mockEvents = {
        data: [{ id: 'event-1', type: 'Normal' }]
      };
      mockAxiosInstance.get.mockResolvedValue({ data: mockEvents });

      const filters = { type: 'Normal' };
      const result = await rancherClient.getEvents(filters);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v3/events', { params: filters });
      expect(result).toEqual(mockEvents.data);
    });
  });

  describe('getLogs', () => {
    beforeEach(async () => {
      // Mock the ping method to return true
      jest.spyOn(rancherClient as any, 'ping').mockResolvedValue(true);
      mockAxiosInstance.get.mockResolvedValue({ data: { version: '2.6.0' } });
      await rancherClient.initialize();
    });

    it('should get logs successfully', async () => {
      const mockLogs = 'log line 1\nlog line 2';
      mockAxiosInstance.get.mockResolvedValue({ data: mockLogs });

      const result = await rancherClient.getLogs('pod', 'pod-1', { lines: 100 });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v3/logs', { 
        params: { lines: 100, resourceType: 'pod', resourceId: 'pod-1' } 
      });
      expect(result).toEqual(mockLogs);
    });
  });

  describe('getMetrics', () => {
    beforeEach(async () => {
      // Mock the ping method to return true
      jest.spyOn(rancherClient as any, 'ping').mockResolvedValue(true);
      mockAxiosInstance.get.mockResolvedValue({ data: { version: '2.6.0' } });
      await rancherClient.initialize();
    });

    it('should get metrics successfully', async () => {
      const mockMetrics = { cpu: 50, memory: 60 };
      mockAxiosInstance.get.mockResolvedValue({ data: mockMetrics });

      const result = await rancherClient.getMetrics('cluster', 'cluster-1', { period: '1h' });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v3/metrics', { 
        params: { period: '1h', resourceType: 'cluster', resourceId: 'cluster-1' } 
      });
      expect(result).toEqual(mockMetrics);
    });
  });

  describe('getAlerts', () => {
    beforeEach(async () => {
      // Mock the ping method to return true
      jest.spyOn(rancherClient as any, 'ping').mockResolvedValue(true);
      mockAxiosInstance.get.mockResolvedValue({ data: { version: '2.6.0' } });
      await rancherClient.initialize();
    });

    it('should get alerts successfully', async () => {
      const mockAlerts = {
        data: [
          { id: 'alert-1', name: 'High CPU' },
          { id: 'alert-2', name: 'Low Memory' }
        ]
      };
      mockAxiosInstance.get.mockResolvedValue({ data: mockAlerts });

      const result = await rancherClient.getAlerts();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v3/alerts');
      expect(result).toEqual(mockAlerts.data);
    });
  });

  describe('createAlert', () => {
    beforeEach(async () => {
      // Mock the ping method to return true
      jest.spyOn(rancherClient as any, 'ping').mockResolvedValue(true);
      mockAxiosInstance.get.mockResolvedValue({ data: { version: '2.6.0' } });
      await rancherClient.initialize();
    });

    it('should create alert successfully', async () => {
      const mockAlert = { id: 'new-alert', name: 'New Alert' };
      mockAxiosInstance.post.mockResolvedValue({ data: mockAlert });

      const alertData = {
        name: 'New Alert',
        condition: 'cpu > 80'
      };

      const result = await rancherClient.createAlert(alertData);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/v3/alerts', alertData);
      expect(result).toEqual(mockAlert);
    });
  });

  describe('getPolicies', () => {
    beforeEach(async () => {
      // Mock the ping method to return true
      jest.spyOn(rancherClient as any, 'ping').mockResolvedValue(true);
      mockAxiosInstance.get.mockResolvedValue({ data: { version: '2.6.0' } });
      await rancherClient.initialize();
    });

    it('should get policies successfully', async () => {
      const mockPolicies = {
        data: [
          { id: 'policy-1', name: 'policy-1' },
          { id: 'policy-2', name: 'policy-2' }
        ]
      };
      mockAxiosInstance.get.mockResolvedValue({ data: mockPolicies });

      const result = await rancherClient.getPolicies();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v3/policies');
      expect(result).toEqual(mockPolicies.data);
    });
  });

  describe('createPolicy', () => {
    beforeEach(async () => {
      // Mock the ping method to return true
      jest.spyOn(rancherClient as any, 'ping').mockResolvedValue(true);
      mockAxiosInstance.get.mockResolvedValue({ data: { version: '2.6.0' } });
      await rancherClient.initialize();
    });

    it('should create policy successfully', async () => {
      const mockPolicy = { id: 'new-policy', name: 'New Policy' };
      mockAxiosInstance.post.mockResolvedValue({ data: mockPolicy });

      const policyData = {
        name: 'New Policy',
        rules: [{ rule: 'allow-all' }]
      };

      const result = await rancherClient.createPolicy(policyData);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/v3/policies', policyData);
      expect(result).toEqual(mockPolicy);
    });
  });

  describe('getQuotas', () => {
    beforeEach(async () => {
      // Mock the ping method to return true
      jest.spyOn(rancherClient as any, 'ping').mockResolvedValue(true);
      mockAxiosInstance.get.mockResolvedValue({ data: { version: '2.6.0' } });
      await rancherClient.initialize();
    });

    it('should get all quotas successfully', async () => {
      const mockQuotas = {
        data: [
          { id: 'quota-1', name: 'quota-1' },
          { id: 'quota-2', name: 'quota-2' }
        ]
      };
      mockAxiosInstance.get.mockResolvedValue({ data: mockQuotas });

      const result = await rancherClient.getQuotas();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v3/quotas', { params: {} });
      expect(result).toEqual(mockQuotas.data);
    });

    it('should get quotas for specific project', async () => {
      const mockQuotas = {
        data: [{ id: 'quota-1', name: 'quota-1' }]
      };
      mockAxiosInstance.get.mockResolvedValue({ data: mockQuotas });

      const result = await rancherClient.getQuotas('project-1');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v3/quotas', { params: { projectId: 'project-1' } });
      expect(result).toEqual(mockQuotas.data);
    });
  });

  describe('createQuota', () => {
    beforeEach(async () => {
      // Mock the ping method to return true
      jest.spyOn(rancherClient as any, 'ping').mockResolvedValue(true);
      mockAxiosInstance.get.mockResolvedValue({ data: { version: '2.6.0' } });
      await rancherClient.initialize();
    });

    it('should create quota successfully', async () => {
      const mockQuota = { id: 'new-quota', name: 'New Quota' };
      mockAxiosInstance.post.mockResolvedValue({ data: mockQuota });

      const quotaData = {
        name: 'New Quota',
        projectId: 'project-1',
        limits: { cpu: '4', memory: '8Gi' }
      };

      const result = await rancherClient.createQuota(quotaData);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/v3/quotas', quotaData);
      expect(result).toEqual(mockQuota);
    });
  });

  describe('createBackup', () => {
    beforeEach(async () => {
      // Mock the ping method to return true
      jest.spyOn(rancherClient as any, 'ping').mockResolvedValue(true);
      mockAxiosInstance.get.mockResolvedValue({ data: { version: '2.6.0' } });
      await rancherClient.initialize();
    });

    it('should create backup successfully', async () => {
      const mockBackup = { id: 'new-backup', name: 'New Backup' };
      mockAxiosInstance.post.mockResolvedValue({ data: mockBackup });

      const backupData = {
        name: 'New Backup',
        clusterId: 'cluster-1'
      };

      const result = await rancherClient.createBackup(backupData);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/v3/backups', backupData);
      expect(result).toEqual(mockBackup);
    });
  });

  describe('getBackups', () => {
    beforeEach(async () => {
      // Mock the ping method to return true
      jest.spyOn(rancherClient as any, 'ping').mockResolvedValue(true);
      mockAxiosInstance.get.mockResolvedValue({ data: { version: '2.6.0' } });
      await rancherClient.initialize();
    });

    it('should get backups successfully', async () => {
      const mockBackups = {
        data: [
          { id: 'backup-1', name: 'backup-1' },
          { id: 'backup-2', name: 'backup-2' }
        ]
      };
      mockAxiosInstance.get.mockResolvedValue({ data: mockBackups });

      const result = await rancherClient.getBackups();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v3/backups');
      expect(result).toEqual(mockBackups.data);
    });
  });

  describe('restoreBackup', () => {
    beforeEach(async () => {
      // Mock the ping method to return true
      jest.spyOn(rancherClient as any, 'ping').mockResolvedValue(true);
      mockAxiosInstance.get.mockResolvedValue({ data: { version: '2.6.0' } });
      await rancherClient.initialize();
    });

    it('should restore backup successfully', async () => {
      const mockRestore = { id: 'restore-1', status: 'completed' };
      mockAxiosInstance.post.mockResolvedValue({ data: mockRestore });

      const restoreData = { clusterId: 'cluster-1' };
      const result = await rancherClient.restoreBackup('backup-1', restoreData);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/v3/backups/backup-1?action=restore', restoreData);
      expect(result).toEqual(mockRestore);
    });
  });

  describe('getNodes', () => {
    beforeEach(async () => {
      // Mock the ping method to return true
      jest.spyOn(rancherClient as any, 'ping').mockResolvedValue(true);
      mockAxiosInstance.get.mockResolvedValue({ data: { version: '2.6.0' } });
      await rancherClient.initialize();
    });

    it('should get all nodes successfully', async () => {
      const mockNodes = {
        data: [
          { id: 'node-1', name: 'node-1' },
          { id: 'node-2', name: 'node-2' }
        ]
      };
      mockAxiosInstance.get.mockResolvedValue({ data: mockNodes });

      const result = await rancherClient.getNodes();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v3/nodes', { params: {} });
      expect(result).toEqual(mockNodes.data);
    });

    it('should get nodes for specific cluster', async () => {
      const mockNodes = {
        data: [{ id: 'node-1', name: 'node-1' }]
      };
      mockAxiosInstance.get.mockResolvedValue({ data: mockNodes });

      const result = await rancherClient.getNodes('cluster-1');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v3/nodes', { params: { clusterId: 'cluster-1' } });
      expect(result).toEqual(mockNodes.data);
    });
  });

  describe('getNode', () => {
    beforeEach(async () => {
      // Mock the ping method to return true
      jest.spyOn(rancherClient as any, 'ping').mockResolvedValue(true);
      mockAxiosInstance.get.mockResolvedValue({ data: { version: '2.6.0' } });
      await rancherClient.initialize();
    });

    it('should get node by id successfully', async () => {
      const mockNode = { id: 'node-1', name: 'node-1' };
      mockAxiosInstance.get.mockResolvedValue({ data: mockNode });

      const result = await rancherClient.getNode('node-1');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v3/nodes/node-1');
      expect(result).toEqual(mockNode);
    });
  });

  describe('getStorageClasses', () => {
    beforeEach(async () => {
      // Mock the ping method to return true
      jest.spyOn(rancherClient as any, 'ping').mockResolvedValue(true);
      mockAxiosInstance.get.mockResolvedValue({ data: { version: '2.6.0' } });
      await rancherClient.initialize();
    });

    it('should get all storage classes successfully', async () => {
      const mockStorageClasses = {
        data: [
          { id: 'sc-1', name: 'fast-ssd' },
          { id: 'sc-2', name: 'slow-hdd' }
        ]
      };
      mockAxiosInstance.get.mockResolvedValue({ data: mockStorageClasses });

      const result = await rancherClient.getStorageClasses();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v3/storageclasses', { params: {} });
      expect(result).toEqual(mockStorageClasses.data);
    });

    it('should get storage classes for specific cluster', async () => {
      const mockStorageClasses = {
        data: [{ id: 'sc-1', name: 'fast-ssd' }]
      };
      mockAxiosInstance.get.mockResolvedValue({ data: mockStorageClasses });

      const result = await rancherClient.getStorageClasses('cluster-1');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v3/storageclasses', { params: { clusterId: 'cluster-1' } });
      expect(result).toEqual(mockStorageClasses.data);
    });
  });

  describe('getPersistentVolumes', () => {
    beforeEach(async () => {
      // Mock the ping method to return true
      jest.spyOn(rancherClient as any, 'ping').mockResolvedValue(true);
      mockAxiosInstance.get.mockResolvedValue({ data: { version: '2.6.0' } });
      await rancherClient.initialize();
    });

    it('should get all persistent volumes successfully', async () => {
      const mockPVs = {
        data: [
          { id: 'pv-1', name: 'pv-1' },
          { id: 'pv-2', name: 'pv-2' }
        ]
      };
      mockAxiosInstance.get.mockResolvedValue({ data: mockPVs });

      const result = await rancherClient.getPersistentVolumes();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v3/persistentvolumes', { params: {} });
      expect(result).toEqual(mockPVs.data);
    });

    it('should get persistent volumes for specific cluster', async () => {
      const mockPVs = {
        data: [{ id: 'pv-1', name: 'pv-1' }]
      };
      mockAxiosInstance.get.mockResolvedValue({ data: mockPVs });

      const result = await rancherClient.getPersistentVolumes('cluster-1');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v3/persistentvolumes', { params: { clusterId: 'cluster-1' } });
      expect(result).toEqual(mockPVs.data);
    });
  });

  describe('getServices', () => {
    beforeEach(async () => {
      // Mock the ping method to return true
      jest.spyOn(rancherClient as any, 'ping').mockResolvedValue(true);
      mockAxiosInstance.get.mockResolvedValue({ data: { version: '2.6.0' } });
      await rancherClient.initialize();
    });

    it('should get all services successfully', async () => {
      const mockServices = {
        data: [
          { id: 'svc-1', name: 'service-1' },
          { id: 'svc-2', name: 'service-2' }
        ]
      };
      mockAxiosInstance.get.mockResolvedValue({ data: mockServices });

      const result = await rancherClient.getServices();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v3/services', { params: {} });
      expect(result).toEqual(mockServices.data);
    });

    it('should get services for specific cluster', async () => {
      const mockServices = {
        data: [{ id: 'svc-1', name: 'service-1' }]
      };
      mockAxiosInstance.get.mockResolvedValue({ data: mockServices });

      const result = await rancherClient.getServices('cluster-1');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v3/services', { params: { clusterId: 'cluster-1' } });
      expect(result).toEqual(mockServices.data);
    });
  });

  describe('getIngresses', () => {
    beforeEach(async () => {
      // Mock the ping method to return true
      jest.spyOn(rancherClient as any, 'ping').mockResolvedValue(true);
      mockAxiosInstance.get.mockResolvedValue({ data: { version: '2.6.0' } });
      await rancherClient.initialize();
    });

    it('should get all ingresses successfully', async () => {
      const mockIngresses = {
        data: [
          { id: 'ing-1', name: 'ingress-1' },
          { id: 'ing-2', name: 'ingress-2' }
        ]
      };
      mockAxiosInstance.get.mockResolvedValue({ data: mockIngresses });

      const result = await rancherClient.getIngresses();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v3/ingresses', { params: {} });
      expect(result).toEqual(mockIngresses.data);
    });

    it('should get ingresses for specific cluster', async () => {
      const mockIngresses = {
        data: [{ id: 'ing-1', name: 'ingress-1' }]
      };
      mockAxiosInstance.get.mockResolvedValue({ data: mockIngresses });

      const result = await rancherClient.getIngresses('cluster-1');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v3/ingresses', { params: { clusterId: 'cluster-1' } });
      expect(result).toEqual(mockIngresses.data);
    });
  });

  describe('getRoles', () => {
    beforeEach(async () => {
      // Mock the ping method to return true
      jest.spyOn(rancherClient as any, 'ping').mockResolvedValue(true);
      mockAxiosInstance.get.mockResolvedValue({ data: { version: '2.6.0' } });
      await rancherClient.initialize();
    });

    it('should get roles successfully', async () => {
      const mockRoles = {
        data: [
          { id: 'role-1', name: 'admin' },
          { id: 'role-2', name: 'user' }
        ]
      };
      mockAxiosInstance.get.mockResolvedValue({ data: mockRoles });

      const result = await rancherClient.getRoles();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v3/roles');
      expect(result).toEqual(mockRoles.data);
    });
  });

  describe('getRoleBindings', () => {
    beforeEach(async () => {
      // Mock the ping method to return true
      jest.spyOn(rancherClient as any, 'ping').mockResolvedValue(true);
      mockAxiosInstance.get.mockResolvedValue({ data: { version: '2.6.0' } });
      await rancherClient.initialize();
    });

    it('should get role bindings successfully', async () => {
      const mockRoleBindings = {
        data: [
          { id: 'rb-1', name: 'admin-binding' },
          { id: 'rb-2', name: 'user-binding' }
        ]
      };
      mockAxiosInstance.get.mockResolvedValue({ data: mockRoleBindings });

      const result = await rancherClient.getRoleBindings();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v3/rolebindings');
      expect(result).toEqual(mockRoleBindings.data);
    });
  });

  describe('createRoleBinding', () => {
    beforeEach(async () => {
      // Mock the ping method to return true
      jest.spyOn(rancherClient as any, 'ping').mockResolvedValue(true);
      mockAxiosInstance.get.mockResolvedValue({ data: { version: '2.6.0' } });
      await rancherClient.initialize();
    });

    it('should create role binding successfully', async () => {
      const mockRoleBinding = { id: 'new-rb', name: 'New Role Binding' };
      mockAxiosInstance.post.mockResolvedValue({ data: mockRoleBinding });

      const roleBindingData = {
        name: 'New Role Binding',
        roleId: 'role-1',
        userId: 'user-1'
      };

      const result = await rancherClient.createRoleBinding(roleBindingData);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/v3/rolebindings', roleBindingData);
      expect(result).toEqual(mockRoleBinding);
    });
  });

  describe('getWorkloads', () => {
    beforeEach(async () => {
      // Mock the ping method to return true
      jest.spyOn(rancherClient as any, 'ping').mockResolvedValue(true);
      mockAxiosInstance.get.mockResolvedValue({ data: { version: '2.6.0' } });
      await rancherClient.initialize();
    });

    it('should get all workloads successfully', async () => {
      const mockWorkloads = {
        data: [
          { id: 'workload-1', name: 'workload-1' },
          { id: 'workload-2', name: 'workload-2' }
        ]
      };
      mockAxiosInstance.get.mockResolvedValue({ data: mockWorkloads });

      const result = await rancherClient.getWorkloads();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v3/workloads', { params: {} });
      expect(result).toEqual(mockWorkloads.data);
    });

    it('should get workloads for specific project', async () => {
      const mockWorkloads = {
        data: [{ id: 'workload-1', name: 'workload-1' }]
      };
      mockAxiosInstance.get.mockResolvedValue({ data: mockWorkloads });

      const result = await rancherClient.getWorkloads('project-1');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v3/workloads', { params: { projectId: 'project-1' } });
      expect(result).toEqual(mockWorkloads.data);
    });
  });

  describe('getWorkload', () => {
    beforeEach(async () => {
      // Mock the ping method to return true
      jest.spyOn(rancherClient as any, 'ping').mockResolvedValue(true);
      mockAxiosInstance.get.mockResolvedValue({ data: { version: '2.6.0' } });
      await rancherClient.initialize();
    });

    it('should get workload by id successfully', async () => {
      const mockWorkload = { id: 'workload-1', name: 'workload-1' };
      mockAxiosInstance.get.mockResolvedValue({ data: mockWorkload });

      const result = await rancherClient.getWorkload('workload-1');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v3/workloads/workload-1');
      expect(result).toEqual(mockWorkload);
    });
  });

  describe('createWorkload', () => {
    beforeEach(async () => {
      // Mock the ping method to return true
      jest.spyOn(rancherClient as any, 'ping').mockResolvedValue(true);
      mockAxiosInstance.get.mockResolvedValue({ data: { version: '2.6.0' } });
      await rancherClient.initialize();
    });

    it('should create workload successfully', async () => {
      const mockWorkload = { id: 'new-workload', name: 'New Workload' };
      mockAxiosInstance.post.mockResolvedValue({ data: mockWorkload });

      const workloadData = {
        name: 'New Workload',
        projectId: 'project-1',
        type: 'deployment'
      };

      const result = await rancherClient.createWorkload(workloadData);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/v3/workloads', workloadData);
      expect(result).toEqual(mockWorkload);
    });
  });

  describe('updateWorkload', () => {
    beforeEach(async () => {
      // Mock the ping method to return true
      jest.spyOn(rancherClient as any, 'ping').mockResolvedValue(true);
      mockAxiosInstance.get.mockResolvedValue({ data: { version: '2.6.0' } });
      await rancherClient.initialize();
    });

    it('should update workload successfully', async () => {
      const mockWorkload = { id: 'workload-1', name: 'Updated Workload' };
      mockAxiosInstance.put.mockResolvedValue({ data: mockWorkload });

      const workloadData = { replicas: 3 };
      const result = await rancherClient.updateWorkload('workload-1', workloadData);

      expect(mockAxiosInstance.put).toHaveBeenCalledWith('/v3/workloads/workload-1', workloadData);
      expect(result).toEqual(mockWorkload);
    });
  });

  describe('deleteWorkload', () => {
    beforeEach(async () => {
      // Mock the ping method to return true
      jest.spyOn(rancherClient as any, 'ping').mockResolvedValue(true);
      mockAxiosInstance.get.mockResolvedValue({ data: { version: '2.6.0' } });
      await rancherClient.initialize();
    });

    it('should delete workload successfully', async () => {
      mockAxiosInstance.delete.mockResolvedValue({ data: {} });

      await rancherClient.deleteWorkload('workload-1');

      expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/v3/workloads/workload-1');
    });
  });

  describe('getSettings', () => {
    beforeEach(async () => {
      // Mock the ping method to return true
      jest.spyOn(rancherClient as any, 'ping').mockResolvedValue(true);
      mockAxiosInstance.get.mockResolvedValue({ data: { version: '2.6.0' } });
      await rancherClient.initialize();
    });

    it('should get settings successfully', async () => {
      const mockSettings = {
        data: [
          { id: 'setting-1', name: 'setting-1' },
          { id: 'setting-2', name: 'setting-2' }
        ]
      };
      mockAxiosInstance.get.mockResolvedValue({ data: mockSettings });

      const result = await rancherClient.getSettings();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/v3/settings');
      expect(result).toEqual(mockSettings.data);
    });
  });

  describe('updateSetting', () => {
    beforeEach(async () => {
      // Mock the ping method to return true
      jest.spyOn(rancherClient as any, 'ping').mockResolvedValue(true);
      mockAxiosInstance.get.mockResolvedValue({ data: { version: '2.6.0' } });
      await rancherClient.initialize();
    });

    it('should update setting successfully', async () => {
      const mockSetting = { id: 'setting-1', value: 'new-value' };
      mockAxiosInstance.put.mockResolvedValue({ data: mockSetting });

      const result = await rancherClient.updateSetting('setting-1', 'new-value');

      expect(mockAxiosInstance.put).toHaveBeenCalledWith('/v3/settings/setting-1', { value: 'new-value' });
      expect(result).toEqual(mockSetting);
    });
  });
});
