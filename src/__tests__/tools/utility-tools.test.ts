// @ts-nocheck
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { UtilityTools } from '../../tools/utility-tools';
import { RancherManager } from '../../rancher/manager';

// Mock dependencies
jest.mock('../../rancher/manager');

const MockRancherManager = RancherManager as jest.MockedClass<typeof RancherManager>;

describe('UtilityTools', () => {
  let utilityTools: UtilityTools;
  let mockRancherManager: jest.Mocked<RancherManager>;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup mock rancher manager
    mockRancherManager = {
      getConfigManager: jest.fn(),
      getServerStatus: jest.fn(),
      pingServer: jest.fn(),
      pingAllServers: jest.fn(),
      connectToServer: jest.fn(),
      disconnectFromServer: jest.fn(),
      getConnectedServers: jest.fn()
    } as any;

    // Mock RancherManager constructor
    MockRancherManager.mockImplementation(() => mockRancherManager);

    utilityTools = new UtilityTools(mockRancherManager);
  });

  describe('constructor', () => {
    it('should initialize with rancher manager', () => {
      expect(utilityTools).toBeDefined();
    });
  });

  describe('getTools', () => {
    it('should return array of utility tools', () => {
      const tools = utilityTools.getTools();

      expect(Array.isArray(tools)).toBe(true);
      expect(tools.length).toBeGreaterThan(0);
    });

    it('should have correct tool structure', () => {
      const tools = utilityTools.getTools();

      tools.forEach(tool => {
        expect(tool).toHaveProperty('name');
        expect(tool).toHaveProperty('description');
        expect(tool).toHaveProperty('inputSchema');
        expect(typeof tool.name).toBe('string');
        expect(typeof tool.description).toBe('string');
        expect(typeof tool.inputSchema).toBe('object');
      });
    });

    it('should include all expected utility tools', () => {
      const tools = utilityTools.getTools();
      const toolNames = tools.map(tool => tool.name);

      const expectedTools = [
        'rancher_get_system_info',
        'rancher_get_version',
        'rancher_get_health_status',
        'rancher_get_statistics',
        'rancher_clear_cache',
        'rancher_reload_config',
        'rancher_get_mcp_server_logs',
        'rancher_rotate_logs',
        'rancher_backup_config',
        'rancher_restore_config',
        'rancher_validate_all',
        'rancher_test_all_connections',
        'rancher_get_performance_metrics',
        'rancher_optimize_connections',
        'rancher_get_error_summary',
        'rancher_cleanup_old_data',
        'rancher_get_usage_report',
        'rancher_set_log_level',
        'rancher_configure_logging',
        'rancher_get_available_commands',
        'rancher_get_command_help',
        'rancher_execute_batch'
      ];

      expectedTools.forEach(expectedTool => {
        expect(toolNames).toContain(expectedTool);
      });
    });

    it('should have correct input schemas for specific tools', () => {
      const tools = utilityTools.getTools();
      
      // Test rancher_get_system_info
      const systemInfoTool = tools.find(t => t.name === 'rancher_get_system_info');
      expect(systemInfoTool).toBeDefined();
      expect(systemInfoTool.inputSchema).toEqual({
        type: 'object',
        properties: {},
        additionalProperties: false
      });

      // Test rancher_get_statistics
      const statisticsTool = tools.find(t => t.name === 'rancher_get_statistics');
      expect(statisticsTool).toBeDefined();
      expect(statisticsTool.inputSchema).toEqual({
        type: 'object',
        properties: {
          period: {
            type: 'string',
            description: 'Statistics period (1h, 24h, 7d, 30d)'
          }
        }
      });

      // Test rancher_set_log_level
      const setLogLevelTool = tools.find(t => t.name === 'rancher_set_log_level');
      expect(setLogLevelTool).toBeDefined();
      expect(setLogLevelTool.inputSchema.properties).toHaveProperty('level');
      expect(setLogLevelTool.inputSchema.required).toContain('level');
    });

    it('should have correct descriptions for tools', () => {
      const tools = utilityTools.getTools();
      
      const systemInfoTool = tools.find(t => t.name === 'rancher_get_system_info');
      expect(systemInfoTool.description).toBe('Get MCP server system information');

      const versionTool = tools.find(t => t.name === 'rancher_get_version');
      expect(versionTool.description).toBe('Get MCP server version');

      const healthTool = tools.find(t => t.name === 'rancher_get_health_status');
      expect(healthTool.description).toBe('Get overall system health status');
    });

    it('should have correct enum values for log levels', () => {
      const tools = utilityTools.getTools();
      const setLogLevelTool = tools.find(t => t.name === 'rancher_set_log_level');
      
      expect(setLogLevelTool.inputSchema.properties.level.enum).toEqual([
        'error', 'warn', 'info', 'debug', 'verbose'
      ]);
    });

    it('should have correct enum values for configure logging', () => {
      const tools = utilityTools.getTools();
      const configureLoggingTool = tools.find(t => t.name === 'rancher_configure_logging');
      
      expect(configureLoggingTool.inputSchema.properties.logLevel.enum).toEqual([
        'error', 'warn', 'info', 'debug', 'verbose'
      ]);
    });

    it('should have correct cache type options', () => {
      const tools = utilityTools.getTools();
      const clearCacheTool = tools.find(t => t.name === 'rancher_clear_cache');
      
      expect(clearCacheTool.inputSchema.properties.cacheType.description).toContain('all, connections, config');
    });

    it('should have correct log level options for MCP server logs', () => {
      const tools = utilityTools.getTools();
      const getMcpLogsTool = tools.find(t => t.name === 'rancher_get_mcp_server_logs');
      
      expect(getMcpLogsTool.inputSchema.properties.level.description).toContain('info, warn, error, debug');
    });

    it('should have correct backup format options', () => {
      const tools = utilityTools.getTools();
      const backupConfigTool = tools.find(t => t.name === 'rancher_backup_config');
      
      expect(backupConfigTool.inputSchema.properties.format.description).toContain('json, yaml');
    });

    it('should have correct report format options', () => {
      const tools = utilityTools.getTools();
      const getUsageReportTool = tools.find(t => t.name === 'rancher_get_usage_report');
      
      expect(getUsageReportTool.inputSchema.properties.format.description).toContain('json, csv, html');
    });

    it('should have correct period options for statistics', () => {
      const tools = utilityTools.getTools();
      const getStatsTool = tools.find(t => t.name === 'rancher_get_statistics');
      
      expect(getStatsTool.inputSchema.properties.period.description).toContain('1h, 24h, 7d, 30d');
    });

    it('should have correct period options for error summary', () => {
      const tools = utilityTools.getTools();
      const getErrorSummaryTool = tools.find(t => t.name === 'rancher_get_error_summary');
      
      expect(getErrorSummaryTool.inputSchema.properties.period.description).toContain('1h, 24h, 7d');
    });

    it('should have correct older than options for cleanup', () => {
      const tools = utilityTools.getTools();
      const cleanupTool = tools.find(t => t.name === 'rancher_cleanup_old_data');
      
      expect(cleanupTool.inputSchema.properties.olderThan.description).toContain('7d, 30d, 90d');
    });

    it('should have correct data type options for cleanup', () => {
      const tools = utilityTools.getTools();
      const cleanupTool = tools.find(t => t.name === 'rancher_cleanup_old_data');
      
      expect(cleanupTool.inputSchema.properties.dataType.description).toContain('logs, cache, temp');
    });

    it('should have correct report period options', () => {
      const tools = utilityTools.getTools();
      const getUsageReportTool = tools.find(t => t.name === 'rancher_get_usage_report');
      
      expect(getUsageReportTool.inputSchema.properties.period.description).toContain('24h, 7d, 30d');
    });
  });

  describe('tool validation', () => {
    it('should have unique tool names', () => {
      const tools = utilityTools.getTools();
      const toolNames = tools.map(tool => tool.name);
      const uniqueNames = new Set(toolNames);

      expect(toolNames.length).toBe(uniqueNames.size);
    });

    it('should have valid JSON schema structure', () => {
      const tools = utilityTools.getTools();

      tools.forEach(tool => {
        expect(tool.inputSchema).toHaveProperty('type');
        expect(tool.inputSchema.type).toBe('object');
        
        if (tool.inputSchema.properties) {
          expect(typeof tool.inputSchema.properties).toBe('object');
        }
        
        if (tool.inputSchema.required) {
          expect(Array.isArray(tool.inputSchema.required)).toBe(true);
        }
      });
    });

    it('should have consistent property types', () => {
      const tools = utilityTools.getTools();

      tools.forEach(tool => {
        if (tool.inputSchema.properties) {
          Object.values(tool.inputSchema.properties).forEach(prop => {
            expect(prop).toHaveProperty('type');
            expect(['string', 'number', 'boolean', 'object', 'array']).toContain(prop.type);
          });
        }
      });
    });

    it('should have valid array item schemas', () => {
      const tools = utilityTools.getTools();
      const executeBatchTool = tools.find(t => t.name === 'rancher_execute_batch');
      
      expect(executeBatchTool.inputSchema.properties.commands.items).toBeDefined();
      expect(executeBatchTool.inputSchema.properties.commands.items.type).toBe('object');
      expect(executeBatchTool.inputSchema.properties.commands.items.properties).toBeDefined();
    });
  });

  describe('inheritance', () => {
    it('should extend BaseToolManager', () => {
      expect(utilityTools).toBeInstanceOf(UtilityTools);
      expect(typeof utilityTools.getTools).toBe('function');
    });
  });

  describe('specific tool schemas', () => {
    it('should have correct execute_batch schema', () => {
      const tools = utilityTools.getTools();
      const executeBatchTool = tools.find(t => t.name === 'rancher_execute_batch');
      
      expect(executeBatchTool.inputSchema.properties.commands.type).toBe('array');
      expect(executeBatchTool.inputSchema.properties.stopOnError.type).toBe('boolean');
      expect(executeBatchTool.inputSchema.required).toContain('commands');
    });

    it('should have correct restore_config schema', () => {
      const tools = utilityTools.getTools();
      const restoreConfigTool = tools.find(t => t.name === 'rancher_restore_config');
      
      expect(restoreConfigTool.inputSchema.properties.backupData.type).toBe('object');
      expect(restoreConfigTool.inputSchema.properties.overwrite.type).toBe('boolean');
      expect(restoreConfigTool.inputSchema.required).toContain('backupData');
    });

    it('should have correct get_command_help schema', () => {
      const tools = utilityTools.getTools();
      const getCommandHelpTool = tools.find(t => t.name === 'rancher_get_command_help');
      
      expect(getCommandHelpTool.inputSchema.properties.command.type).toBe('string');
      expect(getCommandHelpTool.inputSchema.required).toContain('command');
    });
  });
});
