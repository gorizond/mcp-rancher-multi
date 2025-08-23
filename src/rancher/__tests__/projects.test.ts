import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ProjectManager } from '../projects';
import { RancherManager } from '../manager';
import { RancherClient } from '../client';

// Mock dependencies
jest.mock('../manager');

describe('ProjectManager', () => {
  let projectManager: ProjectManager;
  let mockRancherManager: any;
  let mockClient: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock client
    mockClient = {
      getProjects: jest.fn(),
      getProject: jest.fn(),
      createProject: jest.fn(),
      deleteProject: jest.fn()
    };

    // Create mock rancher manager
    mockRancherManager = {
      executeOnServer: jest.fn()
    };

    projectManager = new ProjectManager(mockRancherManager);
  });

  describe('constructor', () => {
    it('should initialize with rancher manager', () => {
      expect(projectManager).toBeDefined();
    });
  });

  describe('getProjects', () => {
    it('should get projects without cluster filter', async () => {
      const mockProjects = [
        { id: 'project-1', name: 'test-project-1', clusterId: 'cluster-1' },
        { id: 'project-2', name: 'test-project-2', clusterId: 'cluster-2' }
      ];

      mockRancherManager.executeOnServer.mockImplementation(async (serverName: string, callback: Function) => {
        return await callback(mockClient);
      });

      mockClient.getProjects.mockResolvedValue(mockProjects);

      const result = await projectManager.getProjects('test-server');

      expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
      expect(mockClient.getProjects).toHaveBeenCalledWith(undefined);
      expect(result).toEqual(mockProjects);
    });

    it('should get projects with cluster filter', async () => {
      const mockProjects = [
        { id: 'project-1', name: 'test-project-1', clusterId: 'cluster-1' }
      ];

      mockRancherManager.executeOnServer.mockImplementation(async (serverName: string, callback: Function) => {
        return await callback(mockClient);
      });

      mockClient.getProjects.mockResolvedValue(mockProjects);

      const result = await projectManager.getProjects('test-server', 'cluster-1');

      expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
      expect(mockClient.getProjects).toHaveBeenCalledWith('cluster-1');
      expect(result).toEqual(mockProjects);
    });

    it('should handle errors from rancher manager', async () => {
      mockRancherManager.executeOnServer.mockRejectedValue(new Error('Server not found'));

      await expect(projectManager.getProjects('invalid-server')).rejects.toThrow('Server not found');
    });

    it('should handle errors from client', async () => {
      mockRancherManager.executeOnServer.mockImplementation(async (serverName: string, callback: Function) => {
        return await callback(mockClient);
      });

      mockClient.getProjects.mockRejectedValue(new Error('API Error'));

      await expect(projectManager.getProjects('test-server')).rejects.toThrow('API Error');
    });
  });

  describe('getProject', () => {
    it('should get project by id', async () => {
      const mockProject = {
        id: 'project-1',
        name: 'test-project',
        clusterId: 'cluster-1',
        state: 'active',
        created: '2024-01-01T00:00:00Z',
        updated: '2024-01-01T00:00:00Z'
      };

      mockRancherManager.executeOnServer.mockImplementation(async (serverName: string, callback: Function) => {
        return await callback(mockClient);
      });

      mockClient.getProject.mockResolvedValue(mockProject);

      const result = await projectManager.getProject('test-server', 'project-1');

      expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
      expect(mockClient.getProject).toHaveBeenCalledWith('project-1');
      expect(result).toEqual(mockProject);
    });

    it('should handle project not found', async () => {
      mockRancherManager.executeOnServer.mockImplementation(async (serverName: string, callback: Function) => {
        return await callback(mockClient);
      });

      mockClient.getProject.mockRejectedValue(new Error('Project not found'));

      await expect(projectManager.getProject('test-server', 'non-existent')).rejects.toThrow('Project not found');
    });

    it('should handle server connection errors', async () => {
      mockRancherManager.executeOnServer.mockRejectedValue(new Error('Connection failed'));

      await expect(projectManager.getProject('test-server', 'project-1')).rejects.toThrow('Connection failed');
    });
  });

  describe('createProject', () => {
    it('should create project successfully', async () => {
      const projectData = {
        name: 'new-project',
        clusterId: 'cluster-1',
        description: 'Test project for development'
      };

      const mockCreatedProject = {
        id: 'new-project-id',
        ...projectData,
        state: 'creating',
        created: '2024-01-01T00:00:00Z',
        updated: '2024-01-01T00:00:00Z'
      };

      mockRancherManager.executeOnServer.mockImplementation(async (serverName: string, callback: Function) => {
        return await callback(mockClient);
      });

      mockClient.createProject.mockResolvedValue(mockCreatedProject);

      const result = await projectManager.createProject('test-server', projectData);

      expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
      expect(mockClient.createProject).toHaveBeenCalledWith(projectData);
      expect(result).toEqual(mockCreatedProject);
    });

    it('should handle creation errors', async () => {
      const projectData = {
        name: 'invalid-project'
      };

      mockRancherManager.executeOnServer.mockImplementation(async (serverName: string, callback: Function) => {
        return await callback(mockClient);
      });

      mockClient.createProject.mockRejectedValue(new Error('Invalid project data'));

      await expect(projectManager.createProject('test-server', projectData)).rejects.toThrow('Invalid project data');
    });

    it('should handle missing cluster ID', async () => {
      const projectData = {
        name: 'project-without-cluster'
      };

      mockRancherManager.executeOnServer.mockImplementation(async (serverName: string, callback: Function) => {
        return await callback(mockClient);
      });

      mockClient.createProject.mockRejectedValue(new Error('Cluster ID is required'));

      await expect(projectManager.createProject('test-server', projectData)).rejects.toThrow('Cluster ID is required');
    });
  });

  describe('deleteProject', () => {
    it('should delete project successfully', async () => {
      mockRancherManager.executeOnServer.mockImplementation(async (serverName: string, callback: Function) => {
        return await callback(mockClient);
      });

      mockClient.deleteProject.mockResolvedValue(undefined);

      await projectManager.deleteProject('test-server', 'project-1');

      expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
      expect(mockClient.deleteProject).toHaveBeenCalledWith('project-1');
    });

    it('should handle deletion errors', async () => {
      mockRancherManager.executeOnServer.mockImplementation(async (serverName: string, callback: Function) => {
        return await callback(mockClient);
      });

      mockClient.deleteProject.mockRejectedValue(new Error('Failed to delete project'));

      await expect(projectManager.deleteProject('test-server', 'project-1')).rejects.toThrow('Failed to delete project');
    });

    it('should handle project not found during deletion', async () => {
      mockRancherManager.executeOnServer.mockImplementation(async (serverName: string, callback: Function) => {
        return await callback(mockClient);
      });

      mockClient.deleteProject.mockRejectedValue(new Error('Project not found'));

      await expect(projectManager.deleteProject('test-server', 'non-existent')).rejects.toThrow('Project not found');
    });
  });

  describe('getAllProjects', () => {
    it('should get projects from specific server', async () => {
      const mockProjects = [
        { id: 'project-1', name: 'test-project-1', clusterId: 'cluster-1' },
        { id: 'project-2', name: 'test-project-2', clusterId: 'cluster-1' }
      ];

      mockRancherManager.executeOnServer.mockImplementation(async (serverName: string, callback: Function) => {
        return await callback(mockClient);
      });

      mockClient.getProjects.mockResolvedValue(mockProjects);

      const result = await projectManager.getProjects('test-server');

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('project-1');
      expect(result[1].id).toBe('project-2');
      expect(result.every(project => project.clusterId === 'cluster-1')).toBe(true);
    });
  });
});
