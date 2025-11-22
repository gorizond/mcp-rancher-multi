import { describe, it, expect } from 'vitest';
import { z } from 'zod';

describe('Zod Schemas', () => {
  describe('Server configuration schema', () => {
    const serverConfigSchema = z.object({
      id: z.string(),
      baseUrl: z.string().url(),
      token: z.string(),
      name: z.string().optional(),
      insecureSkipTlsVerify: z.boolean().optional(),
      caCertPemBase64: z.string().optional(),
    });

    it('should validate valid server configuration', () => {
      const validConfig = {
        id: 'test-server',
        baseUrl: 'https://rancher.test.local',
        token: 'test-token-123',
        name: 'Test Server',
        insecureSkipTlsVerify: true
      };

      const result = serverConfigSchema.safeParse(validConfig);
      expect(result.success).toBe(true);
    });

    it('should validate minimal server configuration', () => {
      const minimalConfig = {
        id: 'test-server',
        baseUrl: 'https://rancher.test.local',
        token: 'test-token-123'
      };

      const result = serverConfigSchema.safeParse(minimalConfig);
      expect(result.success).toBe(true);
    });

    it('should reject invalid URL', () => {
      const invalidConfig = {
        id: 'test-server',
        baseUrl: 'not-a-url',
        token: 'test-token-123'
      };

      const result = serverConfigSchema.safeParse(invalidConfig);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('baseUrl');
      }
    });

    it('should reject missing required fields', () => {
      const invalidConfig = {
        id: 'test-server',
        // missing baseUrl and token
        name: 'Test Server'
      };

      const result = serverConfigSchema.safeParse(invalidConfig);
      expect(result.success).toBe(false);
      if (!result.success) {
        const paths = result.error.issues.map(issue => issue.path[0]);
        expect(paths).toContain('baseUrl');
        expect(paths).toContain('token');
      }
    });
  });

  describe('Cluster operations schema', () => {
    const clusterListSchema = z.object({
      serverId: z.string()
    });

    const clusterKubeconfigSchema = z.object({
      serverId: z.string(),
      clusterId: z.string()
    });

    it('should validate cluster list parameters', () => {
      const validParams = {
        serverId: 'test-server'
      };

      const result = clusterListSchema.safeParse(validParams);
      expect(result.success).toBe(true);
    });

    it('should validate kubeconfig generation parameters', () => {
      const validParams = {
        serverId: 'test-server',
        clusterId: 'cluster-1'
      };

      const result = clusterKubeconfigSchema.safeParse(validParams);
      expect(result.success).toBe(true);
    });

    it('should reject missing serverId', () => {
      const invalidParams = {
        clusterId: 'cluster-1'
      };

      const result = clusterKubeconfigSchema.safeParse(invalidParams);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('serverId');
      }
    });
  });

  describe('Node operations schema', () => {
    const nodeListSchema = z.object({
      serverId: z.string(),
      clusterId: z.string().optional()
    });

    it('should validate node list parameters without cluster filter', () => {
      const validParams = {
        serverId: 'test-server'
      };

      const result = nodeListSchema.safeParse(validParams);
      expect(result.success).toBe(true);
    });

    it('should validate node list parameters with cluster filter', () => {
      const validParams = {
        serverId: 'test-server',
        clusterId: 'cluster-1'
      };

      const result = nodeListSchema.safeParse(validParams);
      expect(result.success).toBe(true);
    });
  });

  describe('Project operations schema', () => {
    const projectListSchema = z.object({
      serverId: z.string(),
      clusterId: z.string()
    });

    it('should validate project list parameters', () => {
      const validParams = {
        serverId: 'test-server',
        clusterId: 'cluster-1'
      };

      const result = projectListSchema.safeParse(validParams);
      expect(result.success).toBe(true);
    });

    it('should reject missing clusterId for projects', () => {
      const invalidParams = {
        serverId: 'test-server'
      };

      const result = projectListSchema.safeParse(invalidParams);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('clusterId');
      }
    });
  });

  describe('Kubernetes operations schema', () => {
    const k8sNamespacesSchema = z.object({
      serverId: z.string(),
      clusterId: z.string()
    });

    const k8sRawSchema = z.object({
      serverId: z.string(),
      clusterId: z.string(),
      path: z.string().describe('E.g. /api/v1/pods?limit=50'),
      method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']).default('GET'),
      body: z.string().optional(),
      contentType: z.string().optional().default('application/json'),
      accept: z.string().optional(),
      limit: z.number().int().positive().optional(),
      autoContinue: z.boolean().default(false),
      maxPages: z.number().int().positive().optional(),
      maxItems: z.number().int().positive().optional(),
      stripManagedFields: z.boolean().default(true),
      stripKeys: z.array(z.string()).optional()
    });

    it('should validate k8s namespaces parameters', () => {
      const validParams = {
        serverId: 'test-server',
        clusterId: 'cluster-1'
      };

      const result = k8sNamespacesSchema.safeParse(validParams);
      expect(result.success).toBe(true);
    });

    it('should validate k8s raw request parameters', () => {
      const validParams = {
        serverId: 'test-server',
        clusterId: 'cluster-1',
        path: '/api/v1/pods',
        method: 'GET'
      };

      const result = k8sRawSchema.safeParse(validParams);
      expect(result.success).toBe(true);
    });

    it('should allow optional stripKeys for compact responses', () => {
      const params = {
        serverId: 'test-server',
        clusterId: 'cluster-1',
        path: '/api/v1/secrets',
        stripKeys: ['data']
      };

      const result = k8sRawSchema.safeParse(params);
      expect(result.success).toBe(true);
    });

    it('should use default method for k8s raw request', () => {
      const params = {
        serverId: 'test-server',
        clusterId: 'cluster-1',
        path: '/api/v1/pods'
      };

      const result = k8sRawSchema.parse(params);
      expect(result.method).toBe('GET');
    });

    it('should validate POST request with body', () => {
      const validParams = {
        serverId: 'test-server',
        clusterId: 'cluster-1',
        path: '/api/v1/pods',
        method: 'POST',
        body: '{"name": "test-pod"}',
        contentType: 'application/json'
      };

      const result = k8sRawSchema.safeParse(validParams);
      expect(result.success).toBe(true);
    });

    it('should reject invalid HTTP method', () => {
      const invalidParams = {
        serverId: 'test-server',
        clusterId: 'cluster-1',
        path: '/api/v1/pods',
        method: 'INVALID'
      };

      const result = k8sRawSchema.safeParse(invalidParams);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('method');
      }
    });
  });

  describe('Fleet operations schema', () => {
    const fleetGitReposListSchema = z.object({
      serverId: z.string(),
      namespace: z.string().default('fleet-default'),
      clusterId: z.string().default('local')
    });

    const fleetGitReposGetSchema = z.object({
      serverId: z.string(),
      namespace: z.string(),
      name: z.string(),
      clusterId: z.string().default('local')
    });

    const fleetGitReposCreateSchema = z.object({
      serverId: z.string(),
      clusterId: z.string().default('local'),
      namespace: z.string().default('fleet-default'),
      body: z.string().describe('GitRepo JSON manifest')
    });

    it('should validate Fleet GitRepos list parameters with defaults', () => {
      const validParams = {
        serverId: 'test-server'
      };

      const result = fleetGitReposListSchema.parse(validParams);
      expect(result.namespace).toBe('fleet-default');
      expect(result.clusterId).toBe('local');
    });

    it('should validate Fleet GitRepos get parameters', () => {
      const validParams = {
        serverId: 'test-server',
        namespace: 'fleet-default',
        name: 'test-repo'
      };

      const result = fleetGitReposGetSchema.safeParse(validParams);
      expect(result.success).toBe(true);
    });

    it('should validate Fleet GitRepos create parameters', () => {
      const validParams = {
        serverId: 'test-server',
        body: '{"apiVersion": "fleet.cattle.io/v1alpha1", "kind": "GitRepo"}'
      };

      const result = fleetGitReposCreateSchema.safeParse(validParams);
      expect(result.success).toBe(true);
    });

    it('should reject missing required fields for Fleet operations', () => {
      const invalidParams = {
        serverId: 'test-server'
        // missing namespace and name
      };

      const result = fleetGitReposGetSchema.safeParse(invalidParams);
      expect(result.success).toBe(false);
      if (!result.success) {
        const paths = result.error.issues.map(issue => issue.path[0]);
        expect(paths).toContain('namespace');
        expect(paths).toContain('name');
      }
    });
  });
});
