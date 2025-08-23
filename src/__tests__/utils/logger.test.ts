import { Logger } from '../../utils/logger';
import { ConfigManager } from '../../config/manager';
import winston from 'winston';

// Mock dependencies
jest.mock('../../config/manager');
jest.mock('winston');

const MockConfigManager = ConfigManager as jest.MockedClass<typeof ConfigManager>;
const MockWinston = winston as jest.Mocked<typeof winston>;

describe('Logger', () => {
  let logger: Logger;
  let mockConfigManager: jest.Mocked<ConfigManager>;
  let mockWinstonLogger: jest.Mocked<winston.Logger>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock config manager
    mockConfigManager = {
      getLogLevel: jest.fn().mockReturnValue('info'),
      getEnableFileLogging: jest.fn().mockReturnValue(false),
      getLogDirectory: jest.fn().mockReturnValue('/tmp/logs'),
    } as any;

    MockConfigManager.mockImplementation(() => mockConfigManager);

    // Setup mock winston logger
    mockWinstonLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
      silly: jest.fn(),
      child: jest.fn().mockReturnValue({
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
        verbose: jest.fn(),
        silly: jest.fn(),
      }),
      exceptions: {
        handle: jest.fn(),
      },
      rejections: {
        handle: jest.fn(),
      },
    } as any;

    // Setup mock winston.createLogger
    MockWinston.createLogger = jest.fn().mockReturnValue(mockWinstonLogger);
    MockWinston.transports = {
      Console: jest.fn().mockImplementation(() => ({})),
      File: jest.fn().mockImplementation(() => ({})),
    } as any;
    MockWinston.format = {
      combine: jest.fn().mockReturnValue({}),
      colorize: jest.fn().mockReturnValue({}),
      simple: jest.fn().mockReturnValue({}),
      timestamp: jest.fn().mockReturnValue({}),
      errors: jest.fn().mockReturnValue({}),
      json: jest.fn().mockReturnValue({}),
    } as any;

    logger = new Logger();
  });

  describe('constructor and initialization', () => {
    it('should initialize logger with config manager', () => {
      expect(MockConfigManager).toHaveBeenCalled();
      expect(MockWinston.createLogger).toHaveBeenCalled();
    });

    it('should configure logger with file logging when enabled', () => {
      mockConfigManager.getEnableFileLogging.mockReturnValue(true);
      
      new Logger();
      
      expect(MockWinston.transports.File).toHaveBeenCalled();
      expect(mockWinstonLogger.exceptions.handle).toHaveBeenCalled();
      expect(mockWinstonLogger.rejections.handle).toHaveBeenCalled();
    });

    it('should configure logger without file logging when disabled', () => {
      mockConfigManager.getEnableFileLogging.mockReturnValue(false);
      
      new Logger();
      
      expect(MockWinston.transports.File).not.toHaveBeenCalled();
      expect(mockWinstonLogger.exceptions.handle).not.toHaveBeenCalled();
      expect(mockWinstonLogger.rejections.handle).not.toHaveBeenCalled();
    });
  });

  describe('basic logging methods', () => {
    it('should log info message', () => {
      const message = 'Test info message';
      const meta = { key: 'value' };

      logger.info(message, meta);

      expect(mockWinstonLogger.info).toHaveBeenCalledWith(message, meta);
    });

    it('should log error message', () => {
      const message = 'Test error message';
      const meta = { error: 'details' };

      logger.error(message, meta);

      expect(mockWinstonLogger.error).toHaveBeenCalledWith(message, meta);
    });

    it('should log warn message', () => {
      const message = 'Test warning message';
      const meta = { warning: 'details' };

      logger.warn(message, meta);

      expect(mockWinstonLogger.warn).toHaveBeenCalledWith(message, meta);
    });

    it('should log debug message', () => {
      const message = 'Test debug message';
      const meta = { debug: 'details' };

      logger.debug(message, meta);

      expect(mockWinstonLogger.debug).toHaveBeenCalledWith(message, meta);
    });

    it('should log verbose message', () => {
      const message = 'Test verbose message';
      const meta = { verbose: 'details' };

      logger.verbose(message, meta);

      expect(mockWinstonLogger.verbose).toHaveBeenCalledWith(message, meta);
    });

    it('should log silly message', () => {
      const message = 'Test silly message';
      const meta = { silly: 'details' };

      logger.silly(message, meta);

      expect(mockWinstonLogger.silly).toHaveBeenCalledWith(message, meta);
    });

    it('should log without metadata', () => {
      const message = 'Test message without metadata';

      logger.info(message);

      expect(mockWinstonLogger.info).toHaveBeenCalledWith(message, undefined);
    });
  });

  describe('Rancher operation logging', () => {
    it('should log Rancher operation', () => {
      const operation = 'getClusters';
      const serverName = 'test-server';
      const details = { clusterCount: 5 };

      logger.logRancherOperation(operation, serverName, details);

      expect(mockWinstonLogger.info).toHaveBeenCalledWith(
        `Rancher operation: ${operation}`,
        expect.objectContaining({
          server: serverName,
          details,
          timestamp: expect.any(String)
        })
      );
    });

    it('should log Rancher error', () => {
      const operation = 'getClusters';
      const serverName = 'test-server';
      const error = new Error('Connection failed');

      logger.logRancherError(operation, serverName, error);

      expect(mockWinstonLogger.error).toHaveBeenCalledWith(
        `Rancher operation error: ${operation}`,
        expect.objectContaining({
          server: serverName,
          error: error.message,
          stack: error.stack,
          timestamp: expect.any(String)
        })
      );
    });

    it('should log Rancher error with string error', () => {
      const operation = 'getClusters';
      const serverName = 'test-server';
      const error = 'Connection failed';

      logger.logRancherError(operation, serverName, error);

      expect(mockWinstonLogger.error).toHaveBeenCalledWith(
        `Rancher operation error: ${operation}`,
        expect.objectContaining({
          server: serverName,
          error: error,
          timestamp: expect.any(String)
        })
      );
    });
  });

  describe('Tool execution logging', () => {
    it('should log tool execution', () => {
      const toolName = 'mcp_rancher_rancher_list_clusters';
      const args = { serverName: 'test-server' };
      const result = { clusters: [] };

      logger.logToolExecution(toolName, args, result);

      expect(mockWinstonLogger.info).toHaveBeenCalledWith(
        `Tool execution: ${toolName}`,
        expect.objectContaining({
          arguments: args,
          result,
          timestamp: expect.any(String)
        })
      );
    });

    it('should log tool error', () => {
      const toolName = 'mcp_rancher_rancher_list_clusters';
      const args = { serverName: 'test-server' };
      const error = new Error('Tool execution failed');

      logger.logToolError(toolName, args, error);

      expect(mockWinstonLogger.error).toHaveBeenCalledWith(
        `Tool error: ${toolName}`,
        expect.objectContaining({
          arguments: args,
          error: error.message,
          stack: error.stack,
          timestamp: expect.any(String)
        })
      );
    });
  });

  describe('Performance logging', () => {
    it('should log performance metrics', () => {
      const operation = 'clusterCreation';
      const duration = 1500;
      const details = { nodeCount: 3 };

      logger.logPerformance(operation, duration, details);

      expect(mockWinstonLogger.info).toHaveBeenCalledWith(
        `Performance: ${operation}`,
        expect.objectContaining({
          duration: `${duration}ms`,
          details,
          timestamp: expect.any(String)
        })
      );
    });
  });

  describe('Security logging', () => {
    it('should log security events', () => {
      const event = 'unauthorized_access';
      const details = { ip: '192.168.1.1', user: 'unknown' };

      logger.logSecurityEvent(event, details);

      expect(mockWinstonLogger.warn).toHaveBeenCalledWith(
        `Security event: ${event}`,
        expect.objectContaining({
          details,
          timestamp: expect.any(String)
        })
      );
    });
  });

  describe('Configuration logging', () => {
    it('should log configuration changes', () => {
      const change = 'log_level_updated';
      const details = { oldLevel: 'info', newLevel: 'debug' };

      logger.logConfigChange(change, details);

      expect(mockWinstonLogger.info).toHaveBeenCalledWith(
        `Configuration change: ${change}`,
        expect.objectContaining({
          details,
          timestamp: expect.any(String)
        })
      );
    });
  });

  describe('Logger with metadata', () => {
    it('should create logger with additional metadata', () => {
      const meta = { requestId: '123', userId: 'user-1' };
      const childLogger = {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
        verbose: jest.fn(),
        silly: jest.fn(),
      };

      mockWinstonLogger.child.mockReturnValue(childLogger as any);

      const loggerWithMeta = logger.withMeta(meta);

      expect(mockWinstonLogger.child).toHaveBeenCalledWith(meta);
      expect(loggerWithMeta).toBeInstanceOf(Logger);
    });
  });

  describe('Log cleanup and statistics', () => {
    it('should handle log cleanup', async () => {
      const daysToKeep = 30;

      await logger.cleanupOldLogs(daysToKeep);

      expect(mockWinstonLogger.info).toHaveBeenCalledWith(
        `Cleaning up logs older than ${daysToKeep} days`,
        undefined
      );
    });

    it('should get log statistics', async () => {
      const stats = await logger.getLogStats();

      expect(stats).toEqual({
        totalLogs: 0,
        errorCount: 0,
        warningCount: 0,
        infoCount: 0
      });
    });
  });

  describe('Logger configuration', () => {
    it('should use configured log level', () => {
      mockConfigManager.getLogLevel.mockReturnValue('debug');
      
      new Logger();
      
      expect(MockWinston.createLogger).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'debug'
        })
      );
    });

    it('should use configured log directory', () => {
      mockConfigManager.getEnableFileLogging.mockReturnValue(true);
      mockConfigManager.getLogDirectory.mockReturnValue('/custom/logs');
      
      new Logger();
      
      expect(MockWinston.transports.File).toHaveBeenCalledWith(
        expect.objectContaining({
          filename: '/custom/logs/error.log'
        })
      );
    });
  });
});
