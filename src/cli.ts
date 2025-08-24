#!/usr/bin/env node
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import { loadEnvFiles } from "./utils.js";

// Load .env files before starting the server
loadEnvFiles();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const indexJs = path.join(__dirname, "index.js");

const child = spawn(process.execPath, [indexJs], {
  stdio: "inherit",
  env: process.env
});
child.on("exit", code => process.exit(code ?? 0));
