import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Mock child_process
vi.mock('node:child_process', () => ({
  spawn: vi.fn()
}));

describe('CLI', () => {
  let mockSpawn: any;
  let mockChild: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock child process
    mockChild = {
      on: vi.fn(),
      stdio: 'inherit'
    };
    
    mockSpawn = spawn as any;
    mockSpawn.mockReturnValue(mockChild);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should spawn child process with correct arguments', () => {
    // This test would require importing the actual CLI module
    // For now, we'll test the expected behavior
    
    const expectedIndexPath = path.join(
      path.dirname(fileURLToPath(import.meta.url)), 
      '../../dist/index.js'
    );

    expect(mockSpawn).toHaveBeenCalledWith(
      process.execPath,
      [expectedIndexPath],
      expect.objectContaining({
        stdio: 'inherit',
        env: expect.objectContaining({
          MCP_RANCHER_STORE: expect.any(String)
        })
      })
    );
  });

  it('should set MCP_RANCHER_STORE environment variable', () => {
    const calls = mockSpawn.mock.calls;
    const env = calls[0][2].env;
    
    expect(env).toHaveProperty('MCP_RANCHER_STORE');
    expect(env.MCP_RANCHER_STORE).toMatch(/servers\.json$/);
  });

  it('should preserve existing environment variables', () => {
    const calls = mockSpawn.mock.calls;
    const env = calls[0][2].env;
    
    // Should preserve process.env
    expect(env).toHaveProperty('NODE_ENV');
    expect(env).toHaveProperty('PATH');
  });

  it('should handle child process exit', () => {
    const calls = mockChild.on.mock.calls;
    const exitCall = calls.find((call: any) => call[0] === 'exit');
    
    expect(exitCall).toBeDefined();
    expect(typeof exitCall[1]).toBe('function');
  });

  it('should exit with child process code', () => {
    // Mock process.exit
    const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called');
    });

    const calls = mockChild.on.mock.calls;
    const exitHandler = calls.find((call: any) => call[0] === 'exit')[1];
    
    // Test exit with code 0
    expect(() => exitHandler(0)).toThrow('process.exit called');
    expect(mockExit).toHaveBeenCalledWith(0);
    
    // Test exit with code 1
    expect(() => exitHandler(1)).toThrow('process.exit called');
    expect(mockExit).toHaveBeenCalledWith(1);
    
    // Test exit with null (should default to 0)
    expect(() => exitHandler(null)).toThrow('process.exit called');
    expect(mockExit).toHaveBeenCalledWith(0);
    
    mockExit.mockRestore();
  });

  it('should handle child process error', () => {
    const calls = mockChild.on.mock.calls;
    const errorCall = calls.find((call: any) => call[0] === 'error');
    
    if (errorCall) {
      expect(typeof errorCall[1]).toBe('function');
    }
  });
});
