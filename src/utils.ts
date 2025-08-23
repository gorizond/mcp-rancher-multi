// Utility functions for testing and general use

export type RancherServerConfig = {
  id: string;                 // short id (e.g. "prod", "lab")
  name?: string;              // human friendly name
  baseUrl: string;            // https://rancher.example.com
  token: string;              // API token; supports ${ENV:NAME}
  insecureSkipTlsVerify?: boolean;
  caCertPemBase64?: string;   // optional custom CA (base64 PEM)
};

export function resolveToken(tok: string): string {
  const m = tok?.match(/^\$\{ENV:([A-Za-z_][A-Za-z0-9_]*)\}$/);
  if (m) return process.env[m[1]] || "";
  return tok;
}

export function loadStore(file: string): Record<string, RancherServerConfig> {
  try {
    const fs = require('node:fs');
    if (!fs.existsSync(file)) return {};
    const raw = fs.readFileSync(file, "utf-8");
    const parsed = JSON.parse(raw);
    return parsed || {};
  } catch (e) {
    console.warn("Cannot read store:", e);
    return {};
  }
}

export function saveStore(data: Record<string, RancherServerConfig>, file: string) {
  const fs = require('node:fs');
  const path = require('node:path');
  
  // Create directory if it doesn't exist
  const dir = path.dirname(file);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}
