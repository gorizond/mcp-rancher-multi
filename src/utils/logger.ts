import winston from 'winston';
import { ConfigManager } from '../config/manager';

export class Logger {
  private logger!: winston.Logger;
  private configManager: ConfigManager;

  constructor() {
    this.configManager = new ConfigManager();
    this.initializeLogger();
  }

  private initializeLogger(): void {
    const logLevel = this.configManager.getLogLevel();
    const enableFileLogging = this.configManager.getEnableFileLogging();
    const logDirectory = this.configManager.getLogDirectory();
    
    const transports: winston.transport[] = [
      // Console output
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
      })
    ];

    // Add file transports only if file logging is enabled
    if (enableFileLogging) {
      // File for errors
      transports.push(
        new winston.transports.File({ 
          filename: `${logDirectory}/error.log`, 
          level: 'error',
          maxsize: 5242880, // 5MB
          maxFiles: 5,
        })
      );
      
      // File for all logs
      transports.push(
        new winston.transports.File({ 
          filename: `${logDirectory}/combined.log`,
          maxsize: 5242880, // 5MB
          maxFiles: 5,
        })
      );
    }
    
    this.logger = winston.createLogger({
      level: logLevel,
      format: winston.format.combine(
        winston.format.timestamp({
          format: 'YYYY-MM-DD HH:mm:ss'
        }),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      defaultMeta: { service: 'rancher-mcp-server' },
      transports,
    });

    // Add handlers for unhandled exceptions and rejections only if file logging is enabled
    if (enableFileLogging) {
      this.logger.exceptions.handle(
        new winston.transports.File({ filename: `${logDirectory}/exceptions.log` })
      );

      this.logger.rejections.handle(
        new winston.transports.File({ filename: `${logDirectory}/rejections.log` })
      );
    }
  }

  public info(message: string, meta?: any): void {
    this.logger.info(message, meta);
  }

  public error(message: string, meta?: any): void {
    this.logger.error(message, meta);
  }

  public warn(message: string, meta?: any): void {
    this.logger.warn(message, meta);
  }

  public debug(message: string, meta?: any): void {
    this.logger.debug(message, meta);
  }

  public verbose(message: string, meta?: any): void {
    this.logger.verbose(message, meta);
  }

  public silly(message: string, meta?: any): void {
    this.logger.silly(message, meta);
  }

  // Special methods for logging Rancher operations
  public logRancherOperation(operation: string, serverName: string, details?: any): void {
    this.info(`Rancher operation: ${operation}`, {
      server: serverName,
      details,
      timestamp: new Date().toISOString()
    });
  }

  public logRancherError(operation: string, serverName: string, error: any): void {
    this.error(`Rancher operation error: ${operation}`, {
      server: serverName,
      error: error.message || error,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }

  public logToolExecution(toolName: string, args: any, result?: any): void {
    this.info(`Tool execution: ${toolName}`, {
      arguments: args,
      result,
      timestamp: new Date().toISOString()
    });
  }

  public logToolError(toolName: string, args: any, error: any): void {
    this.error(`Tool error: ${toolName}`, {
      arguments: args,
      error: error.message || error,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }

  // Methods for logging performance
  public logPerformance(operation: string, duration: number, details?: any): void {
    this.info(`Performance: ${operation}`, {
      duration: `${duration}ms`,
      details,
      timestamp: new Date().toISOString()
    });
  }

  // Methods for logging security
  public logSecurityEvent(event: string, details?: any): void {
    this.warn(`Security event: ${event}`, {
      details,
      timestamp: new Date().toISOString()
    });
  }

  // Methods for logging configuration
  public logConfigChange(change: string, details?: any): void {
    this.info(`Configuration change: ${change}`, {
      details,
      timestamp: new Date().toISOString()
    });
  }

  // Method to get logger with additional metadata
  public withMeta(meta: any): Logger {
    const loggerWithMeta = new Logger();
    loggerWithMeta.logger = this.logger.child(meta);
    return loggerWithMeta;
  }

  // Method to clean up old logs
  public async cleanupOldLogs(daysToKeep: number = 30): Promise<void> {
    // Here you can add logic to clean up old logs
    this.info(`Cleaning up logs older than ${daysToKeep} days`);
  }

  // Method to get log statistics
  public getLogStats(): Promise<any> {
    // Here you can add logic to get log statistics
    return Promise.resolve({
      totalLogs: 0,
      errorCount: 0,
      warningCount: 0,
      infoCount: 0
    });
  }
}
