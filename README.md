# mcp-rancher-multi

An MCP server that supports **multiple Rancher Manager** backends and exposes a rich toolbox, including **Fleet (GitOps)** helpers. Works over stdio for MCP hosts (Claude Desktop, etc.).

## Features
- Register many Rancher servers, list/remove them.
- Rancher v3 API helpers: list clusters, nodes, projects, generate kubeconfig.
- Kubernetes proxy via Rancher (`/k8s/clusters/{id}`) with a raw passthrough tool.
- Fleet GitOps tools: list/get/create/apply GitRepo, force redeploy, list BundleDeployments, status summaries.

## Quickstart
```bash
npm i
npm run build
node dist/index.js
```
Or via Docker:
```bash
docker build -t ghcr.io/<you>/mcp-rancher-multi:0.3.0 .
docker run --rm -i \
  -e MCP_RANCHER_STORE=/data/servers.json \
  -v $PWD/servers.json:/data/servers.json \
  ghcr.io/<you>/mcp-rancher-multi:0.3.0
```

## MCP host config (Claude Desktop example)
```json
{
  "mcpServers": {
    "rancher-multi": {
      "command": "mcp-rancher-multi",
      "args": [],
      "env": { "MCP_RANCHER_STORE": "/abs/path/servers.json" }
    }
  }
}
```
To avoid global install, you can use `npx -y mcp-rancher-multi` as command.

## Config store
`servers.json` holds Rancher endpoints. Tokens may be in-file or referenced from env using `${ENV:NAME}`.
```json
{
  "prod": {
    "id": "prod",
    "name": "Rancher PROD",
    "baseUrl": "https://rancher.prod.example.com",
    "token": "${ENV:RANCHER_TOKEN_prod}",
    "insecureSkipTlsVerify": false
  },
  "lab": {
    "id": "lab",
    "name": "Rancher LAB",
    "baseUrl": "https://rancher.lab.example.com",
    "token": "${ENV:RANCHER_TOKEN_lab}"
  }
}
```

## Security notes
- Do **not** log tokens. Rotate regularly and scope minimally.
- Prefer env substitution for tokens when sharing the file.

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
