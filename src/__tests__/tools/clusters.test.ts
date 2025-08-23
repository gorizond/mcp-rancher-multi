import { describe, it, expect, beforeEach } from '@jest/globals';
import { ClusterTools } from '../../tools/clusters';

describe('ClusterTools', () => {
  let clusterTools: ClusterTools;

  beforeEach(() => {
    clusterTools = new ClusterTools({} as any);
  });

  describe('getTools', () => {
    it('should return all cluster tools', () => {
      const tools = clusterTools.getTools();
      
      expect(tools).toBeDefined();
      expect(Array.isArray(tools)).toBe(true);
      expect(tools.length).toBeGreaterThan(0);

      // Check for specific cluster tools
      const toolNames = tools.map(tool => tool.name);
      
      expect(toolNames).toContain('rancher_list_clusters');
      expect(toolNames).toContain('rancher_get_cluster');
      expect(toolNames).toContain('rancher_create_cluster');
      expect(toolNames).toContain('rancher_delete_cluster');
      expect(toolNames).toContain('rancher_get_cluster_status');
      expect(toolNames).toContain('rancher_get_cluster_metrics');
      expect(toolNames).toContain('rancher_get_cluster_events');
      expect(toolNames).toContain('rancher_get_cluster_logs');
    });

    it('should have correct schema for rancher_list_clusters', () => {
      const tools = clusterTools.getTools();
      const listClustersTool = tools.find(tool => tool.name === 'rancher_list_clusters');
      
      expect(listClustersTool).toBeDefined();
      expect(listClustersTool?.inputSchema).toEqual({
        type: 'object',
        properties: {
          serverName: {
            type: 'string',
            description: 'Specific server name (optional)'
          }
        }
      });
    });

    it('should have correct schema for rancher_get_cluster', () => {
      const tools = clusterTools.getTools();
      const getClusterTool = tools.find(tool => tool.name === 'rancher_get_cluster');
      
      expect(getClusterTool).toBeDefined();
      expect(getClusterTool?.inputSchema.properties).toHaveProperty('serverName');
      expect(getClusterTool?.inputSchema.properties).toHaveProperty('clusterId');
      expect(getClusterTool?.inputSchema.required).toContain('serverName');
      expect(getClusterTool?.inputSchema.required).toContain('clusterId');
    });

    it('should have correct schema for rancher_create_cluster', () => {
      const tools = clusterTools.getTools();
      const createClusterTool = tools.find(tool => tool.name === 'rancher_create_cluster');
      
      expect(createClusterTool).toBeDefined();
      expect(createClusterTool?.inputSchema.properties).toHaveProperty('serverName');
      expect(createClusterTool?.inputSchema.properties).toHaveProperty('name');
      expect(createClusterTool?.inputSchema.properties).toHaveProperty('provider');
      expect(createClusterTool?.inputSchema.properties).toHaveProperty('config');
      expect(createClusterTool?.inputSchema.required).toContain('serverName');
      expect(createClusterTool?.inputSchema.required).toContain('name');
      expect(createClusterTool?.inputSchema.required).toContain('provider');
    });

    it('should have cloud provider specific tools', () => {
      const tools = clusterTools.getTools();
      const toolNames = tools.map(tool => tool.name);
      
      expect(toolNames).toContain('rancher_create_aws_cluster');
      expect(toolNames).toContain('rancher_create_azure_cluster');
      expect(toolNames).toContain('rancher_create_gcp_cluster');
      expect(toolNames).toContain('rancher_create_vsphere_cluster');
    });

    it('should have correct schema for rancher_create_aws_cluster', () => {
      const tools = clusterTools.getTools();
      const awsClusterTool = tools.find(tool => tool.name === 'rancher_create_aws_cluster');
      
      expect(awsClusterTool).toBeDefined();
      expect(awsClusterTool?.inputSchema.properties).toHaveProperty('serverName');
      expect(awsClusterTool?.inputSchema.properties).toHaveProperty('name');
      expect(awsClusterTool?.inputSchema.properties).toHaveProperty('region');
      expect(awsClusterTool?.inputSchema.properties).toHaveProperty('instanceType');
      expect(awsClusterTool?.inputSchema.properties).toHaveProperty('nodeCount');
      expect(awsClusterTool?.inputSchema.required).toEqual(['serverName', 'name', 'region', 'instanceType', 'nodeCount']);
    });

    it('should have correct schema for rancher_create_azure_cluster', () => {
      const tools = clusterTools.getTools();
      const azureClusterTool = tools.find(tool => tool.name === 'rancher_create_azure_cluster');
      
      expect(azureClusterTool).toBeDefined();
      expect(azureClusterTool?.inputSchema.properties).toHaveProperty('serverName');
      expect(azureClusterTool?.inputSchema.properties).toHaveProperty('name');
      expect(azureClusterTool?.inputSchema.properties).toHaveProperty('location');
      expect(azureClusterTool?.inputSchema.properties).toHaveProperty('vmSize');
      expect(azureClusterTool?.inputSchema.properties).toHaveProperty('nodeCount');
      expect(azureClusterTool?.inputSchema.required).toEqual(['serverName', 'name', 'location', 'vmSize', 'nodeCount']);
    });

    it('should have correct schema for rancher_create_gcp_cluster', () => {
      const tools = clusterTools.getTools();
      const gcpClusterTool = tools.find(tool => tool.name === 'rancher_create_gcp_cluster');
      
      expect(gcpClusterTool).toBeDefined();
      expect(gcpClusterTool?.inputSchema.properties).toHaveProperty('serverName');
      expect(gcpClusterTool?.inputSchema.properties).toHaveProperty('name');
      expect(gcpClusterTool?.inputSchema.properties).toHaveProperty('zone');
      expect(gcpClusterTool?.inputSchema.properties).toHaveProperty('machineType');
      expect(gcpClusterTool?.inputSchema.properties).toHaveProperty('nodeCount');
      expect(gcpClusterTool?.inputSchema.required).toEqual(['serverName', 'name', 'zone', 'machineType', 'nodeCount']);
    });

    it('should have correct schema for rancher_create_vsphere_cluster', () => {
      const tools = clusterTools.getTools();
      const vsphereClusterTool = tools.find(tool => tool.name === 'rancher_create_vsphere_cluster');
      
      expect(vsphereClusterTool).toBeDefined();
      expect(vsphereClusterTool?.inputSchema.properties).toHaveProperty('serverName');
      expect(vsphereClusterTool?.inputSchema.properties).toHaveProperty('name');
      expect(vsphereClusterTool?.inputSchema.properties).toHaveProperty('datacenter');
      expect(vsphereClusterTool?.inputSchema.properties).toHaveProperty('datastore');
      expect(vsphereClusterTool?.inputSchema.properties).toHaveProperty('nodeCount');
      expect(vsphereClusterTool?.inputSchema.required).toEqual(['serverName', 'name', 'datacenter', 'datastore', 'nodeCount']);
    });

    it('should have management and monitoring tools', () => {
      const tools = clusterTools.getTools();
      const toolNames = tools.map(tool => tool.name);
      
      expect(toolNames).toContain('rancher_get_cluster_providers');
      expect(toolNames).toContain('rancher_get_cluster_templates');
      expect(toolNames).toContain('rancher_create_cluster_from_template');
      expect(toolNames).toContain('rancher_update_cluster_config');
      expect(toolNames).toContain('rancher_get_cluster_stats');
      expect(toolNames).toContain('rancher_get_cluster_kubeconfig');
    });

    it('should have correct schema for rancher_get_cluster_kubeconfig', () => {
      const tools = clusterTools.getTools();
      const kubeconfigTool = tools.find(tool => tool.name === 'rancher_get_cluster_kubeconfig');
      
      expect(kubeconfigTool).toBeDefined();
      expect(kubeconfigTool?.inputSchema.properties).toHaveProperty('serverName');
      expect(kubeconfigTool?.inputSchema.properties).toHaveProperty('clusterId');
      expect(kubeconfigTool?.inputSchema.properties).toHaveProperty('format');
      expect(kubeconfigTool?.inputSchema.required).toEqual(['serverName', 'clusterId']);
      
      const formatProperty = (kubeconfigTool?.inputSchema.properties as any).format;
      expect(formatProperty.enum).toEqual(['yaml', 'json', 'raw']);
      expect(formatProperty.default).toBe('yaml');
    });

    it('should have monitoring tools with proper schemas', () => {
      const tools = clusterTools.getTools();
      
      const statusTool = tools.find(tool => tool.name === 'rancher_get_cluster_status');
      expect(statusTool?.inputSchema.required).toEqual(['serverName', 'clusterId']);
      
      const metricsTool = tools.find(tool => tool.name === 'rancher_get_cluster_metrics');
      expect(metricsTool?.inputSchema.required).toEqual(['serverName', 'clusterId']);
      
      const eventsTool = tools.find(tool => tool.name === 'rancher_get_cluster_events');
      expect(eventsTool?.inputSchema.required).toEqual(['serverName', 'clusterId']);
      expect(eventsTool?.inputSchema.properties).toHaveProperty('limit');
      
      const logsTool = tools.find(tool => tool.name === 'rancher_get_cluster_logs');
      expect(logsTool?.inputSchema.required).toEqual(['serverName', 'clusterId']);
      expect(logsTool?.inputSchema.properties).toHaveProperty('lines');
    });

    it('should have all tools with proper descriptions', () => {
      const tools = clusterTools.getTools();
      
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

    it('should have 18 cluster tools in total', () => {
      const tools = clusterTools.getTools();
      expect(tools.length).toBe(18);
    });
  });
});
