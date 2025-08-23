import { describe, it, expect, beforeEach } from '@jest/globals';
import { ProjectTools } from '../../tools/projects';

describe('ProjectTools', () => {
  let projectTools: ProjectTools;

  beforeEach(() => {
    projectTools = new ProjectTools({} as any);
  });

  describe('getTools', () => {
    it('should return all project tools', () => {
      const tools = projectTools.getTools();
      
      expect(tools).toBeDefined();
      expect(Array.isArray(tools)).toBe(true);
      expect(tools.length).toBe(4);

      // Check for specific project tools
      const toolNames = tools.map(tool => tool.name);
      
      expect(toolNames).toContain('rancher_list_projects');
      expect(toolNames).toContain('rancher_get_project');
      expect(toolNames).toContain('rancher_create_project');
      expect(toolNames).toContain('rancher_delete_project');
    });

    it('should have correct schema for rancher_list_projects', () => {
      const tools = projectTools.getTools();
      const listProjectsTool = tools.find(tool => tool.name === 'rancher_list_projects');
      
      expect(listProjectsTool).toBeDefined();
      expect(listProjectsTool?.inputSchema).toEqual({
        type: 'object',
        properties: {
          serverName: {
            type: 'string',
            description: 'Server name'
          },
          clusterId: {
            type: 'string',
            description: 'Cluster ID (optional)'
          }
        },
        required: ['serverName']
      });
    });

    it('should have correct schema for rancher_get_project', () => {
      const tools = projectTools.getTools();
      const getProjectTool = tools.find(tool => tool.name === 'rancher_get_project');
      
      expect(getProjectTool).toBeDefined();
      expect(getProjectTool?.inputSchema.properties).toHaveProperty('serverName');
      expect(getProjectTool?.inputSchema.properties).toHaveProperty('projectId');
      expect(getProjectTool?.inputSchema.required).toEqual(['serverName', 'projectId']);
    });

    it('should have correct schema for rancher_create_project', () => {
      const tools = projectTools.getTools();
      const createProjectTool = tools.find(tool => tool.name === 'rancher_create_project');
      
      expect(createProjectTool).toBeDefined();
      expect(createProjectTool?.inputSchema.properties).toHaveProperty('serverName');
      expect(createProjectTool?.inputSchema.properties).toHaveProperty('name');
      expect(createProjectTool?.inputSchema.properties).toHaveProperty('clusterId');
      expect(createProjectTool?.inputSchema.properties).toHaveProperty('description');
      expect(createProjectTool?.inputSchema.required).toEqual(['serverName', 'name', 'clusterId']);
    });

    it('should have correct schema for rancher_delete_project', () => {
      const tools = projectTools.getTools();
      const deleteProjectTool = tools.find(tool => tool.name === 'rancher_delete_project');
      
      expect(deleteProjectTool).toBeDefined();
      expect(deleteProjectTool?.inputSchema.properties).toHaveProperty('serverName');
      expect(deleteProjectTool?.inputSchema.properties).toHaveProperty('projectId');
      expect(deleteProjectTool?.inputSchema.required).toEqual(['serverName', 'projectId']);
    });

    it('should have all tools with proper descriptions', () => {
      const tools = projectTools.getTools();
      
      tools.forEach(tool => {
        expect(tool.name).toBeDefined();
        expect(tool.description).toBeDefined();
        expect(tool.inputSchema).toBeDefined();
        expect(typeof tool.name).toBe('string');
        expect(typeof tool.description).toBe('string');
        expect(tool.name.length).toBeGreaterThan(0);
        expect(tool.description?.length).toBeGreaterThan(0);
      });
    });

    it('should have tools with rancher_ prefix', () => {
      const tools = projectTools.getTools();
      
      tools.forEach(tool => {
        expect(tool.name).toMatch(/^rancher_/);
      });
    });

    it('should have description property in each tool schema', () => {
      const tools = projectTools.getTools();
      
      tools.forEach(tool => {
        const properties = tool.inputSchema.properties as any;
        Object.values(properties).forEach((property: any) => {
          expect(property).toHaveProperty('description');
          expect(typeof property.description).toBe('string');
          expect(property.description.length).toBeGreaterThan(0);
        });
      });
    });
  });
});
