# Tests

This directory contains comprehensive tests for the mcp-rancher-multi project.

## Structure

```
tests/
├── README.md                 # This file
├── fixtures/                 # Test data and fixtures
│   ├── servers.json         # Sample server configurations
│   ├── clusters.json        # Sample cluster data
│   └── nodes.json           # Sample node data
├── unit/                     # Unit tests
│   ├── utils.test.ts        # Tests for utility functions
│   ├── rancher-client.test.ts # Tests for RancherClient class
│   ├── cli.test.ts          # Tests for CLI module
│   ├── schemas.test.ts      # Tests for Zod schemas
│   └── fleet.test.ts        # Tests for Fleet functionality
└── integration/             # Integration tests
    └── server.test.ts       # Tests for MCP server integration
```

## Running Tests

### All Tests
```bash
npm test
```

### Run Tests Once
```bash
npm run test:run
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

### Unit Tests (`tests/unit/`)

#### `utils.test.ts`
- Tests for utility functions like `resolveToken`, `loadStore`, `saveStore`
- Tests environment variable resolution
- Tests file I/O operations
- Tests error handling

#### `rancher-client.test.ts`
- Tests for `RancherClient` class
- Tests HTTP request handling
- Tests API endpoint construction
- Tests error handling for HTTP responses
- Tests k8s proxy functionality

#### `cli.test.ts`
- Tests for CLI module
- Tests child process spawning
- Tests environment variable handling
- Tests process exit handling

#### `schemas.test.ts`
- Tests for Zod validation schemas
- Tests input validation for all MCP tools
- Tests default values
- Tests error messages

#### `fleet.test.ts`
- Tests for Fleet GitOps functionality
- Tests GitRepo operations (list, get, create, apply, redeploy)
- Tests BundleDeployment operations
- Tests status aggregation

### Integration Tests (`tests/integration/`)

#### `server.test.ts`
- Tests for MCP server initialization
- Tests tool registration
- Tests tool handler functions
- Tests error handling at server level

## Test Fixtures (`tests/fixtures/`)

### `servers.json`
Sample server configurations for testing:
- Test server with insecure TLS
- Production server with environment variable token

### `clusters.json`
Sample cluster data for testing API responses

### `nodes.json`
Sample node data for testing API responses

## Mocking Strategy

### HTTP Requests
All HTTP requests are mocked using Vitest's `vi.fn()` to mock the global `fetch` function. This allows testing without making actual network requests.

### File System
File system operations are tested using temporary files created in the system's temp directory. Files are cleaned up after each test.

### Environment Variables
Environment variables are set and restored in tests to ensure isolation.

## Coverage Goals

- **Lines**: >90%
- **Functions**: >95%
- **Branches**: >85%
- **Statements**: >90%

## Best Practices

1. **Test Isolation**: Each test should be independent and not rely on other tests
2. **Cleanup**: Always clean up resources (files, mocks) after tests
3. **Descriptive Names**: Test names should clearly describe what is being tested
4. **Arrange-Act-Assert**: Structure tests with clear sections
5. **Mock External Dependencies**: Don't make real network calls or file system operations unless testing integration

## Adding New Tests

1. Create test file in appropriate directory (`unit/` or `integration/`)
2. Follow naming convention: `*.test.ts`
3. Import necessary modules and mocks
4. Write descriptive test cases
5. Ensure proper cleanup in `afterEach` or `afterAll` hooks
6. Add any new fixtures to `fixtures/` directory if needed

## Debugging Tests

To debug a specific test, you can use:

```bash
# Run specific test file
npm test tests/unit/utils.test.ts

# Run specific test with --reporter=verbose
npm test tests/unit/utils.test.ts -- --reporter=verbose

# Run tests in watch mode for development
npm run test:watch
```
