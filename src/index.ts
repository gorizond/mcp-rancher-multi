#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { RancherManager } from './rancher/manager.js';
import { Logger } from './utils/logger.js';
import { ConfigManager } from './config/manager.js';
import { 
  ClusterTools, 
  ProjectTools, 
  FleetTools,
  ApplicationTools, 
  UserTools, 
  MonitoringTools, 
  BackupTools,
  NodeTools,
  StorageTools,
  NetworkTools,
  SecurityTools,
  CatalogTools,
  WorkloadTools,
  ConfigTools,
  EventTools,
  LogTools,
  MetricTools,
  AlertTools,
  PolicyTools,
  QuotaTools,
  NamespaceTools
} from './tools/index.js';
import { ServerTools } from './tools/server-tools.js';
import { UtilityTools } from './tools/utility-tools.js';
import { ToolHandlers } from './handlers/tool-handlers.js';

class RancherMCPServer {
  private server: Server;
  private rancherManager: RancherManager;
  private logger: Logger;
  private configManager: ConfigManager;
  private tools: Tool[] = [];

  constructor() {
    this.logger = new Logger();
    this.configManager = new ConfigManager();
    this.rancherManager = new RancherManager(this.configManager, this.logger);
    this.server = new Server(
      {
        name: 'rancher-multi-server',
        version: '1.0.0',
      }
    );

    this.initializeTools();
    this.setupHandlers();
  }

  private initializeTools(): void {
    // Initialize all tool categories
    const toolCategories = [
      new ServerTools(this.rancherManager),
      new UtilityTools(this.rancherManager),
      new ClusterTools(this.rancherManager),
      new ProjectTools(this.rancherManager),
      new FleetTools(this.rancherManager),
      new ApplicationTools(this.rancherManager),
      new UserTools(this.rancherManager),
      new MonitoringTools(this.rancherManager),
      new BackupTools(this.rancherManager),
      new NodeTools(this.rancherManager),
      new StorageTools(this.rancherManager),
      new NetworkTools(this.rancherManager),
      new SecurityTools(this.rancherManager),
      new CatalogTools(this.rancherManager),
      new WorkloadTools(this.rancherManager),
      new ConfigTools(this.rancherManager),
      new EventTools(this.rancherManager),
      new LogTools(this.rancherManager),
      new MetricTools(this.rancherManager),
      new AlertTools(this.rancherManager),
      new PolicyTools(this.rancherManager),
      new QuotaTools(this.rancherManager),
      new NamespaceTools(this.rancherManager)
    ];

    // Collect all tools from all categories
    for (const category of toolCategories) {
      this.tools.push(...category.getTools());
    }

    this.logger.info(`Initialized ${this.tools.length} tools`);
  }

  private setupHandlers(): void {
    // Handler for getting tool list
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: this.tools,
      };
    });

    // Handler for calling tools
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      this.logger.info(`Calling tool: ${name}`, { args });
      
      try {
        const tool = this.tools.find(t => t.name === name);
        if (!tool) {
          throw new Error(`Tool '${name}' not found`);
        }

        // Find corresponding handler
        const handler = this.findToolHandler(name);
        if (!handler) {
          throw new Error(`Handler for tool '${name}' not found`);
        }

        const result = await handler(args);
        
        this.logger.info(`Tool ${name} executed successfully`);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        this.logger.error(`Error executing tool ${name}:`, error);
        throw error;
      }
    });
  }

  private findToolHandler(toolName: string): ((args: any) => Promise<any>) | null {
    const handlers = new ToolHandlers(this.rancherManager);
    
    // Check if there's a method with this name in handlers
    if (typeof handlers[toolName as keyof ToolHandlers] === 'function') {
      return (args: any) => handlers[toolName as keyof ToolHandlers](args);
    }
    
    // If handler not found, return universal handler
    return (args: any) => handlers.unknown_tool(args);
  }

  async run(): Promise<void> {
    try {
      await this.rancherManager.initialize();
      this.logger.info('Rancher MCP server started');
      
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      
      this.logger.info('Server ready for work');
    } catch (error) {
      this.logger.error('Server startup error:', error);
      process.exit(1);
    }
  }
}

// Start server
const server = new RancherMCPServer();
server.run().catch((error) => {
  console.error('Critical error:', error);
  process.exit(1);
});
