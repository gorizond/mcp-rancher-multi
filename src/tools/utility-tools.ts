import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { BaseToolManager } from './base';

export class UtilityTools extends BaseToolManager {
  getTools(): Tool[] {
    return [
      {
        name: 'rancher_get_system_info',
        description: 'Get MCP server system information',
        inputSchema: {
          type: 'object',
          properties: {},
          additionalProperties: false
        }
      },
      {
        name: 'rancher_get_version',
        description: 'Get MCP server version',
        inputSchema: {
          type: 'object',
          properties: {},
          additionalProperties: false
        }
      },
      {
        name: 'rancher_get_health_status',
        description: 'Get overall system health status',
        inputSchema: {
          type: 'object',
          properties: {},
          additionalProperties: false
        }
      },
      {
        name: 'rancher_get_statistics',
        description: 'Get overall usage statistics',
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
        name: 'rancher_clear_cache',
        description: 'Clear system cache',
        inputSchema: {
          type: 'object',
          properties: {
            cacheType: {
              type: 'string',
              description: 'Cache type to clear (all, connections, config)'
            }
          }
        }
      },
      {
        name: 'rancher_reload_config',
        description: 'Reload configuration',
        inputSchema: {
          type: 'object',
          properties: {},
          additionalProperties: false
        }
      },
      {
        name: 'rancher_get_mcp_server_logs',
        description: 'Get MCP server logs',
        inputSchema: {
          type: 'object',
          properties: {
            level: {
              type: 'string',
              description: 'Log level (info, warn, error, debug)'
            },
            lines: {
              type: 'number',
              description: 'Number of lines'
            },
            filter: {
              type: 'string',
              description: 'Text filter'
            }
          }
        }
      },
      {
        name: 'rancher_rotate_logs',
        description: 'Log rotation',
        inputSchema: {
          type: 'object',
          properties: {
            keepDays: {
              type: 'number',
              description: 'Number of days to keep logs'
            }
          }
        }
      },
      {
        name: 'rancher_backup_config',
        description: 'Create configuration backup',
        inputSchema: {
          type: 'object',
          properties: {
            includePasswords: {
              type: 'boolean',
              description: 'Include passwords in backup'
            },
            format: {
              type: 'string',
              description: 'Backup format (json, yaml)'
            }
          }
        }
      },
      {
        name: 'rancher_restore_config',
        description: 'Restore configuration from backup',
        inputSchema: {
          type: 'object',
          properties: {
            backupData: {
              type: 'object',
              description: 'Backup data'
            },
            overwrite: {
              type: 'boolean',
              description: 'Overwrite existing configuration'
            }
          },
          required: ['backupData']
        }
      },
      {
        name: 'rancher_validate_all',
        description: 'Validate all configurations and connections',
        inputSchema: {
          type: 'object',
          properties: {},
          additionalProperties: false
        }
      },
      {
        name: 'rancher_test_all_connections',
        description: 'Test all connections',
        inputSchema: {
          type: 'object',
          properties: {},
          additionalProperties: false
        }
      },
      {
        name: 'rancher_get_performance_metrics',
        description: 'Get performance metrics',
        inputSchema: {
          type: 'object',
          properties: {
            detailed: {
              type: 'boolean',
              description: 'Detailed metrics'
            }
          }
        }
      },
      {
        name: 'rancher_optimize_connections',
        description: 'Optimize connections',
        inputSchema: {
          type: 'object',
          properties: {
            maxConnections: {
              type: 'number',
              description: 'Maximum number of connections'
            },
            timeout: {
              type: 'number',
              description: 'Connection timeout'
            }
          }
        }
      },
      {
        name: 'rancher_get_error_summary',
        description: 'Get error summary',
        inputSchema: {
          type: 'object',
          properties: {
            period: {
              type: 'string',
              description: 'Period (1h, 24h, 7d)'
            },
            serverName: {
              type: 'string',
              description: 'Server name (optional)'
            }
          }
        }
      },
      {
        name: 'rancher_cleanup_old_data',
        description: 'Clean up old data',
        inputSchema: {
          type: 'object',
          properties: {
            olderThan: {
              type: 'string',
              description: 'Remove data older than (7d, 30d, 90d)'
            },
            dataType: {
              type: 'string',
              description: 'Data type (logs, cache, temp)'
            }
          }
        }
      },
      {
        name: 'rancher_get_usage_report',
        description: 'Get usage report',
        inputSchema: {
          type: 'object',
          properties: {
            period: {
              type: 'string',
              description: 'Report period (24h, 7d, 30d)'
            },
            format: {
              type: 'string',
              description: 'Report format (json, csv, html)'
            }
          }
        }
      },
      {
        name: 'rancher_set_log_level',
        description: 'Set log level',
        inputSchema: {
          type: 'object',
          properties: {
            level: {
              type: 'string',
              description: 'Log level',
              enum: ['error', 'warn', 'info', 'debug', 'verbose']
            }
          },
          required: ['level']
        }
      },
      {
        name: 'rancher_configure_logging',
        description: 'Configure logging settings',
        inputSchema: {
          type: 'object',
          properties: {
            enableFileLogging: {
              type: 'boolean',
              description: 'Enable or disable file logging'
            },
            logDirectory: {
              type: 'string',
              description: 'Log directory path'
            },
            logLevel: {
              type: 'string',
              description: 'Log level',
              enum: ['error', 'warn', 'info', 'debug', 'verbose']
            }
          }
        }
      },
      {
        name: 'rancher_get_available_commands',
        description: 'Get list of available commands',
        inputSchema: {
          type: 'object',
          properties: {
            category: {
              type: 'string',
              description: 'Command category (optional)'
            }
          }
        }
      },
      {
        name: 'rancher_get_command_help',
        description: 'Get command help',
        inputSchema: {
          type: 'object',
          properties: {
            command: {
              type: 'string',
              description: 'Command name'
            }
          },
          required: ['command']
        }
      },
      {
        name: 'rancher_execute_batch',
        description: 'Execute batch commands',
        inputSchema: {
          type: 'object',
          properties: {
            commands: {
              type: 'array',
              description: 'Array of commands to execute',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  args: { type: 'object' }
                }
              }
            },
            stopOnError: {
              type: 'boolean',
              description: 'Stop on error'
            }
          },
          required: ['commands']
        }
      }
    ];
  }
}
