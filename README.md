# mcp-rancher-multi

An MCP server that supports **multiple Rancher Manager** backends and exposes a rich toolbox, including **Fleet (GitOps)** helpers. Works over stdio for MCP hosts (Claude Desktop, etc.).

## Features
- Register many Rancher servers, list/remove them.
- Rancher v3 API helpers: list clusters, nodes, projects, generate kubeconfig.
- Kubernetes proxy via Rancher (`/k8s/clusters/{id}`) with a raw passthrough tool.
- Fleet GitOps tools: list/get/create/apply GitRepo, force redeploy, list BundleDeployments, status summaries.

## Installation

### From NPM
```bash
npm install @gorizond/mcp-rancher-multi
```

### Development
```bash
npm i
npm run build
node dist/index.js
```

### Docker
```bash
docker build -t ghcr.io/<you>/mcp-rancher-multi:0.3.0 .
docker run --rm -i \
  -e RANCHER_SERVER_prod_NAME="Rancher PROD" \
  -e RANCHER_SERVER_prod_BASEURL="https://rancher.prod.example.com" \
  -e RANCHER_SERVER_prod_TOKEN="your_token_here" \
  ghcr.io/<you>/mcp-rancher-multi:0.3.0
```

## MCP host config (Claude Desktop example)

### Using NPM package
```json
{
  "mcpServers": {
    "rancher-multi": {
      "command": "npx",
      "args": ["-y", "@gorizond/mcp-rancher-multi"],
      "env": { 
        "RANCHER_SERVER_prod_NAME": "Rancher PROD",
        "RANCHER_SERVER_prod_BASEURL": "https://rancher.prod.example.com",
        "RANCHER_SERVER_prod_TOKEN": "your_token_here"
      }
    }
  }
}
```

### Using global install
```json
{
  "mcpServers": {
    "rancher-multi": {
      "command": "mcp-rancher-multi",
      "args": [],
      "env": { 
        "RANCHER_SERVER_prod_NAME": "Rancher PROD",
        "RANCHER_SERVER_prod_BASEURL": "https://rancher.prod.example.com",
        "RANCHER_SERVER_prod_TOKEN": "your_token_here"
      }
    }
  }
}
```

## Configuration

The server configuration is now handled via environment variables. There are two methods to configure Rancher servers:

### Method 1: JSON configuration in single environment variable
```bash
export RANCHER_SERVERS='{"prod":{"id":"prod","name":"Rancher PROD","baseUrl":"https://rancher.prod.example.com","token":"${ENV:RANCHER_TOKEN_prod}","insecureSkipTlsVerify":false},"lab":{"id":"lab","name":"Rancher LAB","baseUrl":"https://rancher.lab.example.com","token":"${ENV:RANCHER_TOKEN_lab}"}}'
```

### Method 2: Individual environment variables
Format: `RANCHER_SERVER_<ID>_<PROPERTY>`

```bash
# Production server
export RANCHER_SERVER_prod_NAME="Rancher PROD"
export RANCHER_SERVER_prod_BASEURL="https://rancher.prod.example.com"
export RANCHER_SERVER_prod_TOKEN="${ENV:RANCHER_TOKEN_prod}"
export RANCHER_SERVER_prod_INSECURESKIPTLSVERIFY="false"

# Lab server
export RANCHER_SERVER_lab_NAME="Rancher LAB"
export RANCHER_SERVER_lab_BASEURL="https://rancher.lab.example.com"
export RANCHER_SERVER_lab_TOKEN="${ENV:RANCHER_TOKEN_lab}"

# Token values
export RANCHER_TOKEN_prod="your_production_token_here"
export RANCHER_TOKEN_lab="your_lab_token_here"
```

See `env.example` for a complete example.

## Security notes
- Do **not** log tokens. Rotate regularly and scope minimally.
- Use environment variables for sensitive data like tokens.
- Consider using a `.env` file for local development (not committed to version control).
- For production, use your platform's secret management system.

## Tools overview
- `rancher.servers.list` / `rancher.servers.add` / `rancher.servers.remove`
- `rancher.health`
- `rancher.clusters.list` / `rancher.nodes.list` / `rancher.projects.list`
- `rancher.clusters.kubeconfig` / `rancher.kubeconfigs.merge`
- `k8s.namespaces.list` / `k8s.raw`
- `fleet.gitrepos.list|get|create|apply|redeploy` / `fleet.bdeploys.list` / `fleet.status.summary`

## Testing

The project includes a comprehensive test suite using Vitest:

```bash
# Run all tests
npm test

# Run tests once
npm run test:run

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Test Structure
- **Unit tests** (`tests/unit/`): Test individual functions and classes
- **Integration tests** (`tests/integration/`): Test MCP server integration
- **Fixtures** (`tests/fixtures/`): Test data and sample configurations

### Coverage
Current test coverage:
- **Lines**: ~75%
- **Functions**: ~94%
- **Branches**: ~94%

## Build single-file binaries
```bash
npm run bundle
# outputs dist/mcp-rancher-multi[.exe]
```
