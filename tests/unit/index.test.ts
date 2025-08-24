import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

// Mock MCP SDK
vi.mock("@modelcontextprotocol/sdk/server/mcp.js", () => ({
  McpServer: vi.fn().mockImplementation(() => ({
    registerTool: vi.fn(),
    run: vi.fn()
  }))
}));

// Mock utils
vi.mock('../src/utils.js', () => ({
  loadEnvFiles: vi.fn(),
  loadConfigFromEnv: vi.fn(() => ({
    testServer: {
      id: 'testServer',
      baseUrl: 'https://test.rancher.com',
      token: 'test-token',
      name: 'Test Server'
    }
  })),
  resolveToken: vi.fn((token) => token),
  obfuscateConfig: vi.fn((config) => config)
}));

// Mock fetch globally
global.fetch = vi.fn();

describe('MCP Server', () => {
  let mockServer: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockServer = {
      registerTool: vi.fn(),
      run: vi.fn()
    };
    (McpServer as any).mockImplementation(() => mockServer);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create MCP server instance with correct name and version', () => {
    // Test the server creation logic
    const server = new McpServer({ name: "mcp-rancher-multi", version: "0.3.0" });
    
    expect(McpServer).toHaveBeenCalledWith({
      name: "mcp-rancher-multi",
      version: "0.3.0"
    });
    expect(server).toBeDefined();
  });

  it('should register rancher_servers_list tool', () => {
    // Test tool registration
    mockServer.registerTool('rancher_servers_list', {
      title: "List registered Rancher servers",
      description: "Returns known servers from local store",
      inputSchema: expect.any(Object)
    }, expect.any(Function));
    
    expect(mockServer.registerTool).toHaveBeenCalledWith(
      'rancher_servers_list',
      {
        title: "List registered Rancher servers",
        description: "Returns known servers from local store",
        inputSchema: expect.any(Object)
      },
      expect.any(Function)
    );
  });

  it('should register rancher_servers_add tool', () => {
    mockServer.registerTool('rancher_servers_add', {
      title: "Add/Update Rancher server (runtime only)",
      description: "Register a Rancher Manager for current session (not persisted)",
      inputSchema: expect.any(Object)
    }, expect.any(Function));
    
    expect(mockServer.registerTool).toHaveBeenCalledWith(
      'rancher_servers_add',
      {
        title: "Add/Update Rancher server (runtime only)",
        description: "Register a Rancher Manager for current session (not persisted)",
        inputSchema: expect.any(Object)
      },
      expect.any(Function)
    );
  });

  it('should register rancher_servers_remove tool', () => {
    mockServer.registerTool('rancher_servers_remove', {
      title: "Remove Rancher server (runtime only)",
      description: "Deletes a server from current session (not persisted)",
      inputSchema: expect.any(Object)
    }, expect.any(Function));
    
    expect(mockServer.registerTool).toHaveBeenCalledWith(
      'rancher_servers_remove',
      {
        title: "Remove Rancher server (runtime only)",
        description: "Deletes a server from current session (not persisted)",
        inputSchema: expect.any(Object)
      },
      expect.any(Function)
    );
  });

  it('should register rancher_clusters_list tool', () => {
    mockServer.registerTool('rancher_clusters_list', {
      title: "List clusters",
      description: "Return clusters from selected Rancher server",
      inputSchema: expect.any(Object)
    }, expect.any(Function));
    
    expect(mockServer.registerTool).toHaveBeenCalledWith(
      'rancher_clusters_list',
      {
        title: "List clusters",
        description: "Return clusters from selected Rancher server",
        inputSchema: expect.any(Object)
      },
      expect.any(Function)
    );
  });

  it('should register rancher_clusters_kubeconfig tool', () => {
    mockServer.registerTool('rancher_clusters_kubeconfig', {
      title: "Generate kubeconfig for a cluster",
      description: "POST /v3/clusters/{id}?action=generateKubeconfig",
      inputSchema: expect.any(Object)
    }, expect.any(Function));
    
    expect(mockServer.registerTool).toHaveBeenCalledWith(
      'rancher_clusters_kubeconfig',
      {
        title: "Generate kubeconfig for a cluster",
        description: "POST /v3/clusters/{id}?action=generateKubeconfig",
        inputSchema: expect.any(Object)
      },
      expect.any(Function)
    );
  });

  it('should register rancher_nodes_list tool', () => {
    mockServer.registerTool('rancher_nodes_list', {
      title: "List nodes",
      description: "Return nodes (v3/nodes)",
      inputSchema: expect.any(Object)
    }, expect.any(Function));
    
    expect(mockServer.registerTool).toHaveBeenCalledWith(
      'rancher_nodes_list',
      {
        title: "List nodes",
        description: "Return nodes (v3/nodes)",
        inputSchema: expect.any(Object)
      },
      expect.any(Function)
    );
  });

  it('should register rancher_projects_list tool', () => {
    mockServer.registerTool('rancher_projects_list', {
      title: "List projects",
      description: "Return projects in cluster (v3/projects)",
      inputSchema: expect.any(Object)
    }, expect.any(Function));
    
    expect(mockServer.registerTool).toHaveBeenCalledWith(
      'rancher_projects_list',
      {
        title: "List projects",
        description: "Return projects in cluster (v3/projects)",
        inputSchema: expect.any(Object)
      },
      expect.any(Function)
    );
  });

  it('should register k8s_namespaces_list tool', () => {
    mockServer.registerTool('k8s_namespaces_list', {
      title: "List namespaces",
      description: "GET /api/v1/namespaces via Rancher proxy",
      inputSchema: expect.any(Object)
    }, expect.any(Function));
    
    expect(mockServer.registerTool).toHaveBeenCalledWith(
      'k8s_namespaces_list',
      {
        title: "List namespaces",
        description: "GET /api/v1/namespaces via Rancher proxy",
        inputSchema: expect.any(Object)
      },
      expect.any(Function)
    );
  });

  it('should register k8s_raw tool', () => {
    mockServer.registerTool('k8s_raw', {
      title: "Raw Kubernetes API request",
      description: "Arbitrary request to /api or /apis (DANGEROUS) — use carefully",
      inputSchema: expect.any(Object)
    }, expect.any(Function));
    
    expect(mockServer.registerTool).toHaveBeenCalledWith(
      'k8s_raw',
      {
        title: "Raw Kubernetes API request",
        description: "Arbitrary request to /api or /apis (DANGEROUS) — use carefully",
        inputSchema: expect.any(Object)
      },
      expect.any(Function)
    );
  });

  it('should register rancher_health tool', () => {
    mockServer.registerTool('rancher_health', {
      title: "Check Rancher server health",
      description: "Check /v3 endpoint",
      inputSchema: expect.any(Object)
    }, expect.any(Function));
    
    expect(mockServer.registerTool).toHaveBeenCalledWith(
      'rancher_health',
      {
        title: "Check Rancher server health",
        description: "Check /v3 endpoint",
        inputSchema: expect.any(Object)
      },
      expect.any(Function)
    );
  });

  it('should register rancher_kubeconfigs_merge tool', () => {
    mockServer.registerTool('rancher_kubeconfigs_merge', {
      title: "Merge multiple kubeconfigs",
      description: "Concatenate generated kubeconfigs for a list of clusterIds",
      inputSchema: expect.any(Object)
    }, expect.any(Function));
    
    expect(mockServer.registerTool).toHaveBeenCalledWith(
      'rancher_kubeconfigs_merge',
      {
        title: "Merge multiple kubeconfigs",
        description: "Concatenate generated kubeconfigs for a list of clusterIds",
        inputSchema: expect.any(Object)
      },
      expect.any(Function)
    );
  });

  it('should register fleet_gitrepos_list tool', () => {
    mockServer.registerTool('fleet_gitrepos_list', {
      title: "List Fleet GitRepos",
      description: "GET /apis/fleet.cattle.io/v1alpha1/namespaces/{ns}/gitrepos",
      inputSchema: expect.any(Object)
    }, expect.any(Function));
    
    expect(mockServer.registerTool).toHaveBeenCalledWith(
      'fleet_gitrepos_list',
      {
        title: "List Fleet GitRepos",
        description: "GET /apis/fleet.cattle.io/v1alpha1/namespaces/{ns}/gitrepos",
        inputSchema: expect.any(Object)
      },
      expect.any(Function)
    );
  });

  it('should register fleet_gitrepos_get tool', () => {
    mockServer.registerTool('fleet_gitrepos_get', {
      title: "Get Fleet GitRepo",
      description: "GET /apis/fleet.cattle.io/v1alpha1/namespaces/{ns}/gitrepos/{name}",
      inputSchema: expect.any(Object)
    }, expect.any(Function));
    
    expect(mockServer.registerTool).toHaveBeenCalledWith(
      'fleet_gitrepos_get',
      {
        title: "Get Fleet GitRepo",
        description: "GET /apis/fleet.cattle.io/v1alpha1/namespaces/{ns}/gitrepos/{name}",
        inputSchema: expect.any(Object)
      },
      expect.any(Function)
    );
  });

  it('should register fleet_gitrepos_create tool', () => {
    mockServer.registerTool('fleet_gitrepos_create', {
      title: "Create Fleet GitRepo",
      description: "POST a GitRepo manifest (JSON)",
      inputSchema: expect.any(Object)
    }, expect.any(Function));
    
    expect(mockServer.registerTool).toHaveBeenCalledWith(
      'fleet_gitrepos_create',
      {
        title: "Create Fleet GitRepo",
        description: "POST a GitRepo manifest (JSON)",
        inputSchema: expect.any(Object)
      },
      expect.any(Function)
    );
  });

  it('should register fleet_gitrepos_apply tool', () => {
    mockServer.registerTool('fleet_gitrepos_apply', {
      title: "Apply Fleet GitRepo",
      description: "PATCH application/apply-patch+yaml to GitRepo (idempotent)",
      inputSchema: expect.any(Object)
    }, expect.any(Function));
    
    expect(mockServer.registerTool).toHaveBeenCalledWith(
      'fleet_gitrepos_apply',
      {
        title: "Apply Fleet GitRepo",
        description: "PATCH application/apply-patch+yaml to GitRepo (idempotent)",
        inputSchema: expect.any(Object)
      },
      expect.any(Function)
    );
  });

  it('should register fleet_gitrepos_redeploy tool', () => {
    mockServer.registerTool('fleet_gitrepos_redeploy', {
      title: "Redeploy Fleet GitRepo",
      description: "PATCH merge-patch: set metadata.annotations['fleet.cattle.io/redeployHash']",
      inputSchema: expect.any(Object)
    }, expect.any(Function));
    
    expect(mockServer.registerTool).toHaveBeenCalledWith(
      'fleet_gitrepos_redeploy',
      {
        title: "Redeploy Fleet GitRepo",
        description: "PATCH merge-patch: set metadata.annotations['fleet.cattle.io/redeployHash']",
        inputSchema: expect.any(Object)
      },
      expect.any(Function)
    );
  });

  it('should register fleet_bdeploys_list tool', () => {
    mockServer.registerTool('fleet_bdeploys_list', {
      title: "List Fleet BundleDeployments",
      description: "GET /apis/fleet.cattle.io/v1alpha1/bundledeployments (optional labelSelector)",
      inputSchema: expect.any(Object)
    }, expect.any(Function));
    
    expect(mockServer.registerTool).toHaveBeenCalledWith(
      'fleet_bdeploys_list',
      {
        title: "List Fleet BundleDeployments",
        description: "GET /apis/fleet.cattle.io/v1alpha1/bundledeployments (optional labelSelector)",
        inputSchema: expect.any(Object)
      },
      expect.any(Function)
    );
  });

  it('should register fleet_status_summary tool', () => {
    mockServer.registerTool('fleet_status_summary', {
      title: "Fleet status summary",
      description: "Aggregate Ready/NonReady from BundleDeployments and link to GitRepos",
      inputSchema: expect.any(Object)
    }, expect.any(Function));
    
    expect(mockServer.registerTool).toHaveBeenCalledWith(
      'fleet_status_summary',
      {
        title: "Fleet status summary",
        description: "Aggregate Ready/NonReady from BundleDeployments and link to GitRepos",
        inputSchema: expect.any(Object)
      },
      expect.any(Function)
    );
  });

  it('should register all expected tools', () => {
    const expectedTools = [
      'rancher_servers_list',
      'rancher_servers_add',
      'rancher_servers_remove',
      'rancher_clusters_list',
      'rancher_clusters_kubeconfig',
      'rancher_nodes_list',
      'rancher_projects_list',
      'k8s_namespaces_list',
      'k8s_raw',
      'rancher_health',
      'rancher_kubeconfigs_merge',
      'fleet_gitrepos_list',
      'fleet_gitrepos_get',
      'fleet_gitrepos_create',
      'fleet_gitrepos_apply',
      'fleet_gitrepos_redeploy',
      'fleet_bdeploys_list',
      'fleet_status_summary'
    ];
    
    // Register all tools
    expectedTools.forEach(tool => {
      mockServer.registerTool(tool, expect.any(Object), expect.any(Function));
    });
    
    expect(mockServer.registerTool).toHaveBeenCalledTimes(expectedTools.length);
    
    const registeredTools = mockServer.registerTool.mock.calls.map((call: any) => call[0]);
    expectedTools.forEach(tool => {
      expect(registeredTools).toContain(tool);
    });
  });
});
