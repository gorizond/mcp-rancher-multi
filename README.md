# MCP Rancher Multi-Server

MCP (Model Context Protocol) server for working with multiple Rancher servers simultaneously. Provides tools for managing clusters, projects, applications, and Kubernetes resources.

## Features

- Support for multiple Rancher servers
- Cluster management (create, delete, monitor)
- Project and namespace management
- Application deployment and management
- **Rancher Fleet management (GitOps deployment)**
- User and security management
- Monitoring and metrics
- Backup and recovery

## Quick Start

### Using NPX (Recommended)

```bash
npx @gorizond/mcp-rancher-multi
```

### Local Installation

```bash
git clone https://github.com/gorizond/mcp-rancher-multi.git
cd mcp-rancher-multi
npm install
npm run build
npm start
```

## Configuration

Create a `.env` file with your Rancher server settings:

```env
RANCHER_URL=https://rancher.example.com
RANCHER_TOKEN=your-token-here
LOG_LEVEL=info
```

## Usage

The server provides **over 120 tools** in the following categories:

### 🔗 Server Management (20+ tools)
- `rancher_list_servers` - List all configured servers
- `rancher_get_server_status` - Get server status and health
- `rancher_ping_server` - Check server availability
- `rancher_connect_server` - Connect to a specific server
- `rancher_add_server` - Add new Rancher server
- `rancher_remove_server` - Remove server from configuration
- `rancher_update_server` - Update server configuration
- `rancher_export_server_config` - Export server configuration
- `rancher_import_server_config` - Import server configuration
- `rancher_get_server_health` - Get detailed server health
- `rancher_get_server_metrics` - Get server performance metrics
- `rancher_restart_server_connection` - Restart server connection
- `rancher_cleanup_disconnected_servers` - Remove disconnected servers

### 🏗️ Cluster Management (15+ tools)
- `rancher_list_clusters` - List all clusters across servers
- `rancher_create_cluster` - Create new cluster
- `rancher_delete_cluster` - Delete existing cluster
- `rancher_get_cluster_status` - Get cluster status and health
- `rancher_get_cluster_metrics` - Get cluster performance metrics
- `rancher_create_aws_cluster` - Create AWS EKS cluster
- `rancher_create_azure_cluster` - Create Azure AKS cluster
- `rancher_create_gcp_cluster` - Create Google GKE cluster
- `rancher_create_vsphere_cluster` - Create vSphere cluster
- `rancher_get_cluster_providers` - List available cloud providers
- `rancher_get_cluster_templates` - Get cluster templates
- `rancher_create_cluster_from_template` - Create cluster from template
- `rancher_get_cluster_stats` - Get comprehensive cluster statistics

### 📁 Project Management (4 tools)
- `rancher_list_projects` - List all projects
- `rancher_create_project` - Create new project
- `rancher_get_project` - Get project details
- `rancher_delete_project` - Delete project

### 🚢 Fleet Management (15+ tools)
- `fleet_list_bundles` - List all Fleet bundles across clusters
- `fleet_get_bundle` - Get details of a specific Fleet bundle
- `fleet_create_bundle` - Create a new Fleet bundle
- `fleet_update_bundle` - Update an existing Fleet bundle
- `fleet_delete_bundle` - Delete a Fleet bundle
- `fleet_force_sync_bundle` - Force sync a Fleet bundle
- `fleet_list_git_repos` - List all Fleet Git repositories
- `fleet_get_git_repo` - Get details of a specific Fleet Git repository
- `fleet_create_git_repo` - Create a new Fleet Git repository
- `fleet_update_git_repo` - Update an existing Fleet Git repository
- `fleet_delete_git_repo` - Delete a Fleet Git repository
- `fleet_list_clusters` - List all Fleet clusters
- `fleet_get_cluster` - Get details of a specific Fleet cluster
- `fleet_list_workspaces` - List all Fleet workspaces
- `fleet_get_deployment_status` - Get deployment status of a Fleet bundle
- `fleet_get_logs` - Get Fleet logs for a cluster

### 🚀 Application Management (4 tools)
- `rancher_list_applications` - List deployed applications
- `rancher_create_application` - Deploy new application
- `rancher_get_application` - Get application details
- `rancher_delete_application` - Delete application

### 👥 User Management (4 tools)
- `rancher_list_users` - List all users
- `rancher_create_user` - Create new user
- `rancher_get_user` - Get user information
- `rancher_delete_user` - Delete user

### 📊 Monitoring (3 tools)
- `rancher_get_metrics` - Get system metrics
- `rancher_list_alerts` - List active alerts
- `rancher_create_alert` - Create new alert

### 💾 Backup and Recovery (3 tools)
- `rancher_create_backup` - Create cluster backup
- `rancher_list_backups` - List available backups
- `rancher_restore_backup` - Restore from backup

### 🖥️ Node Management (2 tools)
- `rancher_list_nodes` - List cluster nodes
- `rancher_get_node` - Get node details

### 💿 Storage Management (2 tools)
- `rancher_list_storage_classes` - List storage classes
- `rancher_list_persistent_volumes` - List persistent volumes

### 🌐 Network Management (2 tools)
- `rancher_list_services` - List Kubernetes services
- `rancher_list_ingresses` - List ingress controllers

### 🔐 Security (3 tools)
- `rancher_list_roles` - List available roles
- `rancher_list_role_bindings` - List role bindings
- `rancher_create_role_binding` - Create new role binding

### 📚 Catalog Management (2 tools)
- `rancher_list_catalogs` - List Helm catalogs
- `rancher_get_catalog_templates` - Get catalog templates

### 🐳 Workload Management (5 tools)
- `rancher_list_workloads` - List all workloads
- `rancher_create_workload` - Create new workload
- `rancher_get_workload` - Get workload details
- `rancher_update_workload` - Update existing workload
- `rancher_delete_workload` - Delete workload

### ⚙️ Configuration Management (2 tools)
- `rancher_get_settings` - Get server settings
- `rancher_update_setting` - Update server setting

### 📝 Events and Logs (2 tools)
- `rancher_get_events` - Get cluster events
- `rancher_get_logs` - Get application logs

### 📈 Policies and Quotas (4 tools)
- `rancher_list_policies` - List network policies
- `rancher_create_policy` - Create new policy
- `rancher_list_quotas` - List resource quotas
- `rancher_create_quota` - Create resource quota

### 📂 Namespace Management (4 tools)
- `rancher_list_namespaces` - List all namespaces
- `rancher_create_namespace` - Create new namespace
- `rancher_get_namespace` - Get namespace details
- `rancher_delete_namespace` - Delete namespace

### 🔧 System Utilities (20+ tools)
- `rancher_get_system_info` - Get system information
- `rancher_get_version` - Get server version
- `rancher_get_health_status` - Get overall health status
- `rancher_get_statistics` - Get general statistics
- `rancher_clear_cache` - Clear system cache
- `rancher_reload_config` - Reload configuration
- `rancher_backup_config` - Backup configuration
- `rancher_restore_config` - Restore configuration
- `rancher_validate_all` - Validate all configurations
- `rancher_test_all_connections` - Test all server connections
- `rancher_get_performance_metrics` - Get performance metrics
- `rancher_optimize_connections` - Optimize server connections
- `rancher_get_error_summary` - Get error summary
- `rancher_cleanup_old_data` - Cleanup old data
- `rancher_get_usage_report` - Generate usage report
- `rancher_set_log_level` - Set logging level
- `rancher_configure_logging` - Configure logging settings
- `rancher_get_available_commands` - List available commands
- `rancher_get_command_help` - Get command help
- `rancher_execute_batch` - Execute batch commands

## Development

```bash
npm run dev    # Start in development mode
npm test       # Run tests
npm run build  # Build project
```

## License

MIT License
