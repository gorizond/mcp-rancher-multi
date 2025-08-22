# Tests

This directory contains tests for the MCP Rancher Multi-Server project.

## Test Structure

```
src/__tests__/
├── config/
│   └── manager.test.ts          # ConfigManager tests
├── handlers/
│   └── tool-handlers.test.ts    # ToolHandlers tests
├── integration/
│   └── server.test.ts           # Integration tests
├── tools/
│   └── base.test.ts             # BaseToolManager tests
├── utils/
│   └── logger.test.ts           # Logger tests
├── setup.ts                     # Test setup file
└── README.md                    # This file
```

## Running Tests

### Basic Tests
```bash
npm test
```

### Watch Mode
```bash
npm run test:watch
```

### Coverage Report
```bash
npm run test:coverage
```

## Test Categories

### Unit Tests
- **ConfigManager**: Tests for configuration management
- **Logger**: Tests for logging functionality
- **BaseToolManager**: Tests for base tool manager class
- **ToolHandlers**: Tests for tool handler structure

### Integration Tests
- **Server**: Tests for server initialization and structure
- **Tool Structure**: Tests for tool definition structure
- **Configuration**: Tests for configuration validation

## Test Coverage

The tests cover:
- ✅ Basic functionality of all major components
- ✅ Error handling and edge cases
- ✅ Data structure validation
- ✅ Mock implementations for external dependencies

## Adding New Tests

1. Create test files in the appropriate directory
2. Use descriptive test names
3. Mock external dependencies
4. Test both success and error scenarios
5. Follow the existing test patterns

## Test Configuration

Tests are configured in `jest.config.js` with:
- TypeScript support via `ts-jest`
- Coverage reporting
- Test timeout of 10 seconds
- Setup file for global test configuration
