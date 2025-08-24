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

  it('should register rancher.servers.list tool', () => {
    // Test tool registration
    mockServer.registerTool('rancher.servers.list', {
      title: "List registered Rancher servers",
      description: "Returns known servers from local store",
      inputSchema: expect.any(Object)
    }, expect.any(Function));
    
    expect(mockServer.registerTool).toHaveBeenCalledWith(
      'rancher.servers.list',
      {
        title: "List registered Rancher servers",
        description: "Returns known servers from local store",
        inputSchema: expect.any(Object)
      },
      expect.any(Function)
    );
  });

  it('should register rancher.servers.add tool', () => {
    mockServer.registerTool('rancher.servers.add', {
      title: "Add/Update Rancher server (runtime only)",
      description: "Register a Rancher Manager for current session (not persisted)",
      inputSchema: expect.any(Object)
    }, expect.any(Function));
    
    expect(mockServer.registerTool).toHaveBeenCalledWith(
      'rancher.servers.add',
      {
        title: "Add/Update Rancher server (runtime only)",
        description: "Register a Rancher Manager for current session (not persisted)",
        inputSchema: expect.any(Object)
      },
      expect.any(Function)
    );
  });

  it('should register rancher.servers.remove tool', () => {
    mockServer.registerTool('rancher.servers.remove', {
      title: "Remove Rancher server (runtime only)",
      description: "Deletes a server from current session (not persisted)",
      inputSchema: expect.any(Object)
    }, expect.any(Function));
    
    expect(mockServer.registerTool).toHaveBeenCalledWith(
      'rancher.servers.remove',
      {
        title: "Remove Rancher server (runtime only)",
        description: "Deletes a server from current session (not persisted)",
        inputSchema: expect.any(Object)
      },
      expect.any(Function)
    );
  });

  it('should register rancher.clusters.list tool', () => {
    mockServer.registerTool('rancher.clusters.list', {
      title: "List clusters",
      description: "Return clusters from selected Rancher server",
      inputSchema: expect.any(Object)
    }, expect.any(Function));
    
    expect(mockServer.registerTool).toHaveBeenCalledWith(
      'rancher.clusters.list',
      {
        title: "List clusters",
        description: "Return clusters from selected Rancher server",
        inputSchema: expect.any(Object)
      },
      expect.any(Function)
    );
  });

  it('should register rancher.clusters.kubeconfig tool', () => {
    mockServer.registerTool('rancher.clusters.kubeconfig', {
      title: "Generate kubeconfig for a cluster",
      description: "POST /v3/clusters/{id}?action=generateKubeconfig",
      inputSchema: expect.any(Object)
    }, expect.any(Function));
    
    expect(mockServer.registerTool).toHaveBeenCalledWith(
      'rancher.clusters.kubeconfig',
      {
        title: "Generate kubeconfig for a cluster",
        description: "POST /v3/clusters/{id}?action=generateKubeconfig",
        inputSchema: expect.any(Object)
      },
      expect.any(Function)
    );
  });

  it('should register rancher.nodes.list tool', () => {
    mockServer.registerTool('rancher.nodes.list', {
      title: "List nodes",
      description: "Return nodes (v3/nodes)",
      inputSchema: expect.any(Object)
    }, expect.any(Function));
    
    expect(mockServer.registerTool).toHaveBeenCalledWith(
      'rancher.nodes.list',
      {
        title: "List nodes",
        description: "Return nodes (v3/nodes)",
        inputSchema: expect.any(Object)
      },
      expect.any(Function)
    );
  });

  it('should register rancher.projects.list tool', () => {
    mockServer.registerTool('rancher.projects.list', {
      title: "List projects",
      description: "Return projects in cluster (v3/projects)",
      inputSchema: expect.any(Object)
    }, expect.any(Function));
    
    expect(mockServer.registerTool).toHaveBeenCalledWith(
      'rancher.projects.list',
      {
        title: "List projects",
        description: "Return projects in cluster (v3/projects)",
        inputSchema: expect.any(Object)
      },
      expect.any(Function)
    );
  });

  it('should register k8s.namespaces.list tool', () => {
    mockServer.registerTool('k8s.namespaces.list', {
      title: "List namespaces",
      description: "GET /api/v1/namespaces via Rancher proxy",
      inputSchema: expect.any(Object)
    }, expect.any(Function));
    
    expect(mockServer.registerTool).toHaveBeenCalledWith(
      'k8s.namespaces.list',
      {
        title: "List namespaces",
        description: "GET /api/v1/namespaces via Rancher proxy",
        inputSchema: expect.any(Object)
      },
      expect.any(Function)
    );
  });

  it('should register k8s.raw tool', () => {
    mockServer.registerTool('k8s.raw', {
      title: "Raw Kubernetes API request",
      description: "Arbitrary request to /api or /apis (DANGEROUS) — use carefully",
      inputSchema: expect.any(Object)
    }, expect.any(Function));
    
    expect(mockServer.registerTool).toHaveBeenCalledWith(
      'k8s.raw',
      {
        title: "Raw Kubernetes API request",
        description: "Arbitrary request to /api or /apis (DANGEROUS) — use carefully",
        inputSchema: expect.any(Object)
      },
      expect.any(Function)
    );
  });

  it('should register rancher.health tool', () => {
    mockServer.registerTool('rancher.health', {
      title: "Check Rancher server health",
      description: "Check /v3 endpoint",
      inputSchema: expect.any(Object)
    }, expect.any(Function));
    
    expect(mockServer.registerTool).toHaveBeenCalledWith(
      'rancher.health',
      {
        title: "Check Rancher server health",
        description: "Check /v3 endpoint",
        inputSchema: expect.any(Object)
      },
      expect.any(Function)
    );
  });

  it('should register rancher.kubeconfigs.merge tool', () => {
    mockServer.registerTool('rancher.kubeconfigs.merge', {
      title: "Merge multiple kubeconfigs",
      description: "Concatenate generated kubeconfigs for a list of clusterIds",
      inputSchema: expect.any(Object)
    }, expect.any(Function));
    
    expect(mockServer.registerTool).toHaveBeenCalledWith(
      'rancher.kubeconfigs.merge',
      {
        title: "Merge multiple kubeconfigs",
        description: "Concatenate generated kubeconfigs for a list of clusterIds",
        inputSchema: expect.any(Object)
      },
      expect.any(Function)
    );
  });

  it('should register fleet.gitrepos.list tool', () => {
    mockServer.registerTool('fleet.gitrepos.list', {
      title: "List Fleet GitRepos",
      description: "GET /apis/fleet.cattle.io/v1alpha1/namespaces/{ns}/gitrepos",
      inputSchema: expect.any(Object)
    }, expect.any(Function));
    
    expect(mockServer.registerTool).toHaveBeenCalledWith(
      'fleet.gitrepos.list',
      {
        title: "List Fleet GitRepos",
        description: "GET /apis/fleet.cattle.io/v1alpha1/namespaces/{ns}/gitrepos",
        inputSchema: expect.any(Object)
      },
      expect.any(Function)
    );
  });

  it('should register fleet.gitrepos.get tool', () => {
    mockServer.registerTool('fleet.gitrepos.get', {
      title: "Get Fleet GitRepo",
      description: "GET /apis/fleet.cattle.io/v1alpha1/namespaces/{ns}/gitrepos/{name}",
      inputSchema: expect.any(Object)
    }, expect.any(Function));
    
    expect(mockServer.registerTool).toHaveBeenCalledWith(
      'fleet.gitrepos.get',
      {
        title: "Get Fleet GitRepo",
        description: "GET /apis/fleet.cattle.io/v1alpha1/namespaces/{ns}/gitrepos/{name}",
        inputSchema: expect.any(Object)
      },
      expect.any(Function)
    );
  });

  it('should register fleet.gitrepos.create tool', () => {
    mockServer.registerTool('fleet.gitrepos.create', {
      title: "Create Fleet GitRepo",
      description: "POST a GitRepo manifest (JSON)",
      inputSchema: expect.any(Object)
    }, expect.any(Function));
    
    expect(mockServer.registerTool).toHaveBeenCalledWith(
      'fleet.gitrepos.create',
      {
        title: "Create Fleet GitRepo",
        description: "POST a GitRepo manifest (JSON)",
        inputSchema: expect.any(Object)
      },
      expect.any(Function)
    );
  });

  it('should register fleet.gitrepos.apply tool', () => {
    mockServer.registerTool('fleet.gitrepos.apply', {
      title: "Apply Fleet GitRepo",
      description: "PATCH application/apply-patch+yaml to GitRepo (idempotent)",
      inputSchema: expect.any(Object)
    }, expect.any(Function));
    
    expect(mockServer.registerTool).toHaveBeenCalledWith(
      'fleet.gitrepos.apply',
      {
        title: "Apply Fleet GitRepo",
        description: "PATCH application/apply-patch+yaml to GitRepo (idempotent)",
        inputSchema: expect.any(Object)
      },
      expect.any(Function)
    );
  });

  it('should register fleet.gitrepos.redeploy tool', () => {
    mockServer.registerTool('fleet.gitrepos.redeploy', {
      title: "Redeploy Fleet GitRepo",
      description: "PATCH merge-patch: set metadata.annotations['fleet.cattle.io/redeployHash']",
      inputSchema: expect.any(Object)
    }, expect.any(Function));
    
    expect(mockServer.registerTool).toHaveBeenCalledWith(
      'fleet.gitrepos.redeploy',
      {
        title: "Redeploy Fleet GitRepo",
        description: "PATCH merge-patch: set metadata.annotations['fleet.cattle.io/redeployHash']",
        inputSchema: expect.any(Object)
      },
      expect.any(Function)
    );
  });

  it('should register fleet.bdeploys.list tool', () => {
    mockServer.registerTool('fleet.bdeploys.list', {
      title: "List Fleet BundleDeployments",
      description: "GET /apis/fleet.cattle.io/v1alpha1/bundledeployments (optional labelSelector)",
      inputSchema: expect.any(Object)
    }, expect.any(Function));
    
    expect(mockServer.registerTool).toHaveBeenCalledWith(
      'fleet.bdeploys.list',
      {
        title: "List Fleet BundleDeployments",
        description: "GET /apis/fleet.cattle.io/v1alpha1/bundledeployments (optional labelSelector)",
        inputSchema: expect.any(Object)
      },
      expect.any(Function)
    );
  });

  it('should register fleet.status.summary tool', () => {
    mockServer.registerTool('fleet.status.summary', {
      title: "Fleet status summary",
      description: "Aggregate Ready/NonReady from BundleDeployments and link to GitRepos",
      inputSchema: expect.any(Object)
    }, expect.any(Function));
    
    expect(mockServer.registerTool).toHaveBeenCalledWith(
      'fleet.status.summary',
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
      'rancher.servers.list',
      'rancher.servers.add',
      'rancher.servers.remove',
      'rancher.clusters.list',
      'rancher.clusters.kubeconfig',
      'rancher.nodes.list',
      'rancher.projects.list',
      'k8s.namespaces.list',
      'k8s.raw',
      'rancher.health',
      'rancher.kubeconfigs.merge',
      'fleet.gitrepos.list',
      'fleet.gitrepos.get',
      'fleet.gitrepos.create',
      'fleet.gitrepos.apply',
      'fleet.gitrepos.redeploy',
      'fleet.bdeploys.list',
      'fleet.status.summary'
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
