import { describe, test, expect, beforeEach } from '@jest/globals';
import { ConfigManager } from '../../config/manager';

describe('ConfigManager', () => {
  let configManager: ConfigManager;

  beforeEach(() => {
    configManager = new ConfigManager();
  });

  test('should create config manager instance', () => {
    expect(configManager).toBeInstanceOf(ConfigManager);
  });

  test('should have default configuration', () => {
    const config = configManager.getConfig();
    expect(config).toBeDefined();
    expect(config.logLevel).toBeDefined();
    expect(config.defaultServer).toBeDefined();
  });

  test('should get server configuration', () => {
    const servers = configManager.getAllServers();
    expect(Array.isArray(servers)).toBe(true);
  });

  test('should get server names', () => {
    const serverNames = configManager.getServerNames();
    expect(Array.isArray(serverNames)).toBe(true);
  });

  test('should validate configuration', () => {
    expect(() => configManager.validateConfig()).not.toThrow();
  });
});
