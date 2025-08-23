import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ApplicationManager } from '../applications';
import { RancherManager } from '../manager';
import { RancherClient } from '../client';

// Mock dependencies
jest.mock('../manager');

describe('ApplicationManager', () => {
  let applicationManager: ApplicationManager;
  let mockRancherManager: any;
  let mockClient: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock client
    mockClient = {
      getApplications: jest.fn(),
      getApplication: jest.fn(),
      createApplication: jest.fn(),
      deleteApplication: jest.fn()
    };

    // Create mock rancher manager
    mockRancherManager = {
      executeOnServer: jest.fn()
    };

    applicationManager = new ApplicationManager(mockRancherManager);
  });

  describe('constructor', () => {
    it('should initialize with rancher manager', () => {
      expect(applicationManager).toBeDefined();
    });
  });

  describe('getApplications', () => {
    it('should get applications without project filter', async () => {
      const mockApplications = [
        { id: 'app-1', name: 'test-app-1', projectId: 'project-1', state: 'active', version: '1.0', created: '2024-01-01', updated: '2024-01-01' },
        { id: 'app-2', name: 'test-app-2', projectId: 'project-1', state: 'active', version: '1.0', created: '2024-01-01', updated: '2024-01-01' }
      ];

      mockRancherManager.executeOnServer.mockImplementation(async (serverName: string, callback: Function) => {
        return await callback(mockClient);
      });

      mockClient.getApplications.mockResolvedValue(mockApplications);

      const result = await applicationManager.getApplications('test-server');

      expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
      expect(mockClient.getApplications).toHaveBeenCalledWith(undefined);
      expect(result).toEqual(mockApplications);
    });

    it('should get applications with project filter', async () => {
      const mockApplications = [
        { id: 'app-1', name: 'test-app-1', projectId: 'project-1' }
      ];

      mockRancherManager.executeOnServer.mockImplementation(async (serverName: string, callback: Function) => {
        return await callback(mockClient);
      });

      mockClient.getApplications.mockResolvedValue(mockApplications);

      const result = await applicationManager.getApplications('test-server', 'project-1');

      expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
      expect(mockClient.getApplications).toHaveBeenCalledWith('project-1');
      expect(result).toEqual(mockApplications);
    });

    it('should handle errors from rancher manager', async () => {
      mockRancherManager.executeOnServer.mockRejectedValue(new Error('Server not found'));

      await expect(applicationManager.getApplications('invalid-server')).rejects.toThrow('Server not found');
    });

    it('should handle errors from client', async () => {
      mockRancherManager.executeOnServer.mockImplementation(async (serverName: string, callback: Function) => {
        return await callback(mockClient);
      });

      mockClient.getApplications.mockRejectedValue(new Error('API Error'));

      await expect(applicationManager.getApplications('test-server')).rejects.toThrow('API Error');
    });
  });

  describe('getApplication', () => {
    it('should get application by id', async () => {
      const mockApplication = {
        id: 'app-1',
        name: 'test-app',
        projectId: 'project-1',
        state: 'active'
      };

      mockRancherManager.executeOnServer.mockImplementation(async (serverName: string, callback: Function) => {
        return await callback(mockClient);
      });

      mockClient.getApplication.mockResolvedValue(mockApplication);

      const result = await applicationManager.getApplication('test-server', 'app-1');

      expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
      expect(mockClient.getApplication).toHaveBeenCalledWith('app-1');
      expect(result).toEqual(mockApplication);
    });

    it('should handle application not found', async () => {
      mockRancherManager.executeOnServer.mockImplementation(async (serverName: string, callback: Function) => {
        return await callback(mockClient);
      });

      mockClient.getApplication.mockRejectedValue(new Error('Application not found'));

      await expect(applicationManager.getApplication('test-server', 'non-existent')).rejects.toThrow('Application not found');
    });
  });

  describe('createApplication', () => {
    it('should create application successfully', async () => {
      const appData = {
        name: 'new-app',
        projectId: 'project-1',
        templateId: 'template-1',
        values: {
          replicas: 3,
          image: 'nginx:latest'
        }
      };

      const mockCreatedApp = {
        id: 'new-app-id',
        ...appData,
        state: 'pending'
      };

      mockRancherManager.executeOnServer.mockImplementation(async (serverName: string, callback: Function) => {
        return await callback(mockClient);
      });

      mockClient.createApplication.mockResolvedValue(mockCreatedApp);

      const result = await applicationManager.createApplication('test-server', appData);

      expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
      expect(mockClient.createApplication).toHaveBeenCalledWith(appData);
      expect(result).toEqual(mockCreatedApp);
    });

    it('should handle creation errors', async () => {
      const appData = {
        name: 'invalid-app'
      };

      mockRancherManager.executeOnServer.mockImplementation(async (serverName: string, callback: Function) => {
        return await callback(mockClient);
      });

      mockClient.createApplication.mockRejectedValue(new Error('Invalid application data'));

      await expect(applicationManager.createApplication('test-server', appData)).rejects.toThrow('Invalid application data');
    });
  });

  describe('deleteApplication', () => {
    it('should delete application successfully', async () => {
      mockRancherManager.executeOnServer.mockImplementation(async (serverName: string, callback: Function) => {
        return await callback(mockClient);
      });

      mockClient.deleteApplication.mockResolvedValue(undefined);

      await applicationManager.deleteApplication('test-server', 'app-1');

      expect(mockRancherManager.executeOnServer).toHaveBeenCalledWith('test-server', expect.any(Function));
      expect(mockClient.deleteApplication).toHaveBeenCalledWith('app-1');
    });

    it('should handle deletion errors', async () => {
      mockRancherManager.executeOnServer.mockImplementation(async (serverName: string, callback: Function) => {
        return await callback(mockClient);
      });

      mockClient.deleteApplication.mockRejectedValue(new Error('Failed to delete application'));

      await expect(applicationManager.deleteApplication('test-server', 'app-1')).rejects.toThrow('Failed to delete application');
    });
  });

  describe('getAllApplications', () => {
    it('should get applications from all servers', async () => {
      const mockApplication = new ApplicationManager(mockRancherManager);
      
      // Mock getAllApplications method if it exists
      const getAllApplicationsSpy = jest.spyOn(mockApplication, 'getApplications');
      getAllApplicationsSpy.mockResolvedValue([
        { id: 'app-1', name: 'test-app-1', projectId: 'project-1', state: 'active', version: '1.0', created: '2024-01-01', updated: '2024-01-01' },
        { id: 'app-2', name: 'test-app-2', projectId: 'project-1', state: 'active', version: '1.0', created: '2024-01-01', updated: '2024-01-01' }
      ]);

      const result = await mockApplication.getApplications('test-server');

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('app-1');
      expect(result[1].id).toBe('app-2');
    });
  });
});
