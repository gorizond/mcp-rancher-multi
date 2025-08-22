import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { BaseToolManager } from './base.js';

export class ProjectTools extends BaseToolManager {
  getTools(): Tool[] {
    return [
      {
        name: 'rancher_list_projects',
        description: 'Get list of projects',
        inputSchema: {
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
        }
      },
      {
        name: 'rancher_get_project',
        description: 'Get project information',
        inputSchema: {
          type: 'object',
          properties: {
            serverName: {
              type: 'string',
              description: 'Server name'
            },
            projectId: {
              type: 'string',
              description: 'Project ID'
            }
          },
          required: ['serverName', 'projectId']
        }
      },
      {
        name: 'rancher_create_project',
        description: 'Create new project',
        inputSchema: {
          type: 'object',
          properties: {
            serverName: {
              type: 'string',
              description: 'Server name'
            },
            name: {
              type: 'string',
              description: 'Project name'
            },
            clusterId: {
              type: 'string',
              description: 'Cluster ID'
            },
            description: {
              type: 'string',
              description: 'Project description'
            }
          },
          required: ['serverName', 'name', 'clusterId']
        }
      },
      {
        name: 'rancher_delete_project',
        description: 'Delete project',
        inputSchema: {
          type: 'object',
          properties: {
            serverName: {
              type: 'string',
              description: 'Server name'
            },
            projectId: {
              type: 'string',
              description: 'Project ID'
            }
          },
          required: ['serverName', 'projectId']
        }
      }
    ];
  }
}
