import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { BaseToolManager } from './base.js';

export class ServerTools extends BaseToolManager {
  getTools(): Tool[] {
    return [
      {
        name: 'rancher_list_servers',
        description: 'Get list of all configured Rancher servers',
        inputSchema: {
          type: 'object',
          properties: {},
          additionalProperties: false
        }
      },
      {
        name: 'rancher_get_server_status',
        description: 'Get status of all servers or specific server',
        inputSchema: {
          type: 'object',
          properties: {
            serverName: {
              type: 'string',
              description: 'Specific server name (optional)'
            }
          }
        }
      },
      {
        name: 'rancher_ping_server',
        description: 'Check server availability',
        inputSchema: {
          type: 'object',
          properties: {
            serverName: {
              type: 'string',
              description: 'Server name'
            }
          },
          required: ['serverName']
        }
      },
      {
        name: 'rancher_ping_all_servers',
        description: 'Check availability of all servers',
        inputSchema: {
          type: 'object',
          properties: {},
          additionalProperties: false
        }
      },
      {
        name: 'rancher_connect_server',
        description: 'Connect to server',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Server name'
            },
            url: {
              type: 'string',
              description: 'Server URL'
            },
            token: {
              type: 'string',
              description: 'Authorization token'
            },
            username: {
              type: 'string',
              description: 'Username (optional)'
            },
            password: {
              type: 'string',
              description: 'Password (optional)'
            },
            insecure: {
              type: 'boolean',
              description: 'Use insecure connection'
            },
            timeout: {
              type: 'number',
              description: 'Timeout in milliseconds'
            },
            retries: {
              type: 'number',
              description: 'Number of retries'
            }
          },
          required: ['name', 'url', 'token']
        }
      },
      {
        name: 'rancher_disconnect_server',
        description: 'Disconnect from server',
        inputSchema: {
          type: 'object',
          properties: {
            serverName: {
              type: 'string',
              description: 'Server name'
            }
          },
          required: ['serverName']
        }
      },
      {
        name: 'rancher_add_server',
        description: 'Add new server to configuration',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Server name'
            },
            url: {
              type: 'string',
              description: 'Server URL'
            },
            token: {
              type: 'string',
              description: 'Authorization token'
            },
            username: {
              type: 'string',
              description: 'Username (optional)'
            },
            password: {
              type: 'string',
              description: 'Password (optional)'
            },
            insecure: {
              type: 'boolean',
              description: 'Use insecure connection'
            },
            timeout: {
              type: 'number',
              description: 'Timeout in milliseconds'
            },
            retries: {
              type: 'number',
              description: 'Number of retries'
            }
          },
          required: ['name', 'url', 'token']
        }
      },
      {
        name: 'rancher_remove_server',
        description: 'Remove server from configuration',
        inputSchema: {
          type: 'object',
          properties: {
            serverName: {
              type: 'string',
              description: 'Server name'
            }
          },
          required: ['serverName']
        }
      },
      {
        name: 'rancher_update_server',
        description: 'Update server configuration',
        inputSchema: {
          type: 'object',
          properties: {
            serverName: {
              type: 'string',
              description: 'Server name'
            },
            url: {
              type: 'string',
              description: 'New server URL'
            },
            token: {
              type: 'string',
              description: 'New authorization token'
            },
            username: {
              type: 'string',
              description: 'New username'
            },
            password: {
              type: 'string',
              description: 'New password'
            },
            insecure: {
              type: 'boolean',
              description: 'Use insecure connection'
            },
            timeout: {
              type: 'number',
              description: 'Timeout in milliseconds'
            },
            retries: {
              type: 'number',
              description: 'Number of retries'
            }
          },
          required: ['serverName']
        }
      },
      {
        name: 'rancher_set_default_server',
        description: 'Set default server',
        inputSchema: {
          type: 'object',
          properties: {
            serverName: {
              type: 'string',
              description: 'Server name'
            }
          },
          required: ['serverName']
        }
      },
      {
        name: 'rancher_get_connected_servers',
        description: 'Get list of connected servers',
        inputSchema: {
          type: 'object',
          properties: {},
          additionalProperties: false
        }
      },
      {
        name: 'rancher_get_server_info',
        description: 'Get detailed server information',
        inputSchema: {
          type: 'object',
          properties: {
            serverName: {
              type: 'string',
              description: 'Server name'
            }
          },
          required: ['serverName']
        }
      },
      {
        name: 'rancher_validate_server_config',
        description: 'Validate server configuration',
        inputSchema: {
          type: 'object',
          properties: {
            serverName: {
              type: 'string',
              description: 'Server name (optional)'
            }
          }
        }
      },
      {
        name: 'rancher_test_server_connection',
        description: 'Test server connection',
        inputSchema: {
          type: 'object',
          properties: {
            serverName: {
              type: 'string',
              description: 'Server name'
            }
          },
          required: ['serverName']
        }
      },
      {
        name: 'rancher_get_server_metrics',
        description: 'Get server performance metrics',
        inputSchema: {
          type: 'object',
          properties: {
            serverName: {
              type: 'string',
              description: 'Server name'
            }
          },
          required: ['serverName']
        }
      },
      {
        name: 'rancher_get_server_logs',
        description: 'Get server logs',
        inputSchema: {
          type: 'object',
          properties: {
            serverName: {
              type: 'string',
              description: 'Server name'
            },
            lines: {
              type: 'number',
              description: 'Number of log lines'
            },
            level: {
              type: 'string',
              description: 'Log level (info, warn, error)'
            }
          },
          required: ['serverName']
        }
      },
      {
        name: 'rancher_restart_server_connection',
        description: 'Restart server connection',
        inputSchema: {
          type: 'object',
          properties: {
            serverName: {
              type: 'string',
              description: 'Server name'
            }
          },
          required: ['serverName']
        }
      },
      {
        name: 'rancher_get_server_health',
        description: 'Get server health status',
        inputSchema: {
          type: 'object',
          properties: {
            serverName: {
              type: 'string',
              description: 'Server name'
            }
          },
          required: ['serverName']
        }
      },
      {
        name: 'rancher_export_server_config',
        description: 'Export server configuration',
        inputSchema: {
          type: 'object',
          properties: {
            format: {
              type: 'string',
              description: 'Export format (json, yaml)',
              enum: ['json', 'yaml']
            },
            includePasswords: {
              type: 'boolean',
              description: 'Include passwords in export'
            }
          }
        }
      },
      {
        name: 'rancher_import_server_config',
        description: 'Import server configuration',
        inputSchema: {
          type: 'object',
          properties: {
            config: {
              type: 'object',
              description: 'Server configuration'
            },
            overwrite: {
              type: 'boolean',
              description: 'Overwrite existing servers'
            }
          },
          required: ['config']
        }
      },
      {
        name: 'rancher_get_server_statistics',
        description: 'Get server usage statistics',
        inputSchema: {
          type: 'object',
          properties: {
            period: {
              type: 'string',
              description: 'Statistics period (1h, 24h, 7d, 30d)'
            }
          }
        }
      },
      {
        name: 'rancher_cleanup_disconnected_servers',
        description: 'Clean up disconnected servers',
        inputSchema: {
          type: 'object',
          properties: {
            force: {
              type: 'boolean',
              description: 'Force cleanup'
            }
          }
        }
      }
    ];
  }
}
