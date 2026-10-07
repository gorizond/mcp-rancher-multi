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
docker build -t ghcr.io/<you>/mcp-rancher-multi:0.1.16 .
docker run --rm -i \
  -e RANCHER_SERVER_prod_NAME="Rancher PROD" \
  -e RANCHER_SERVER_prod_BASEURL="https://rancher.prod.example.com" \
  -e RANCHER_SERVER_prod_TOKEN="your_token_here" \
  ghcr.io/<you>/mcp-rancher-multi:0.1.16
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

The server configuration is handled via environment variables. The project supports loading configuration from `.env` files for easier local development:

### Environment File Support
The server automatically loads configuration from `.env` files in the following order (highest priority first):
1. `.env.local` - for local development overrides
2. `.env` - default configuration

Copy `env.example` to `.env` and customize it for your environment:

```bash
cp env.example .env
# Edit .env with your actual values
```

**Note**: `.env` files should not be committed to version control as they may contain sensitive information.

### Configuration Methods
There are two methods to configure Rancher servers:

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
- **Token obfuscation**: All tokens are automatically obfuscated in logs and output (showing only last 4 characters with `***` prefix)
  - Example: `secret_token_12345` becomes `***2345`
- Do **not** log tokens. Rotate regularly and scope minimally.
- Use environment variables for sensitive data like tokens.
- Consider using a `.env` file for local development (not committed to version control).
- For production, use your platform's secret management system.
- **`k8s_raw` safe defaults** (per-call opt-in, no restart required):
  - `allowWrite` (default: `false`) — mutating methods (`POST`/`PUT`/`PATCH`/`DELETE`) are **blocked** unless the call passes `allowWrite: true`.
  - `showSensitiveData` (default: `false`) — `Secret` `data`/`stringData` values are **masked** as `***` (single objects and lists) unless the call passes `showSensitiveData: true`.
- **Exec tools are opt-in** (env flags, default: `false`, restart required):
  - `rancher_node_shell` — requires `ENABLE_NODE_SHELL=true`.
  - `k8s_exec` — requires `ENABLE_CONTAINER_EXEC=true`.

## Tools overview
- `rancher_servers_list`
- `rancher_health`
- `rancher_clusters_list` / `rancher_cluster_get` / `rancher_nodes_list` / `rancher_projects_list`
- `rancher_clusters_kubeconfig` / `rancher_kubeconfigs_merge`
- `k8s_namespaces_list` / `k8s_raw` (read-only by default; see **Security notes**)
- `fleet_gitrepos_list|get|create|apply|redeploy` / `fleet_bdeploys_list` / `fleet_status_summary`
- `rancher_node_shell` *(opt-in: `ENABLE_NODE_SHELL=true`)* — run one command on a node provisioned via a Rancher node driver; the Rancher server proxies the SSH session (no direct access from the MCP host). Returns stdout + exit code.
  - **Limitations**: `stderr` is not delivered separately — the session is a PTY, so stderr is merged into stdout and the result always has `stderr: null`; an exit-code marker is appended to stdout internally and stripped from the result. Known upstream issue [rancher/rancher#52003](https://github.com/rancher/rancher/issues/52003) (WebSocket ping-pong under heavy output; low risk for one-shot commands).
- `k8s_exec` *(opt-in: `ENABLE_CONTAINER_EXEC=true`)* — run one non-interactive command in a pod container through the Rancher Kubernetes proxy (WebSocket exec); no kubeconfig or external `kubectl` needed. Returns stdout, stderr and exit code.

### Handling large lists / compact views
- `rancher_clusters_list` defaults to a **minimal** view (`id` + `name`). Use `summaryFields` to include more from the curated summary (state/provider/workspace/fleet/kubeVersion, etc.) or `summary=false` to return full cluster objects. Pagination knobs: `limit`, `autoContinue`, `maxPages`, `maxItems`, and `continueToken` (use `pagination.next`).
- `rancher_cluster_get` still accepts `summary=true` and `stripKeys` to drop heavy sections like `links`/`actions`.
- `k8s_raw` supports `limit`, `autoContinue`, `maxPages`, `maxItems`, custom `accept`, `stripManagedFields` (default true), and `stripKeys` (e.g. `['data','binaryData']` to drop base64 payloads) to keep outputs compact while following `metadata.continue`.
- Fleet list tools (`fleet_gitrepos_list`, `fleet_bdeploys_list`, `fleet_status_summary`) accept the same pagination knobs plus optional `continueToken` to resume listing, and now return compact summaries by default. Use `summary=false` or `summaryFields` to control the output payload.

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
