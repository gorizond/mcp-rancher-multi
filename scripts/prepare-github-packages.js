#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

// Read package.json
const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
const currentVersion = packageJson.version;

// Get version from git tag
const gitTag = process.env.GITHUB_REF_NAME || '';
const tagVersion = gitTag.replace('v', '');

if (tagVersion && tagVersion !== currentVersion) {
  console.log(`Updating version from ${currentVersion} to ${tagVersion}`);
  packageJson.version = tagVersion;
}

// Add publishConfig for GitHub Packages
packageJson.publishConfig = {
  registry: "https://npm.pkg.github.com"
};

// Update repository URL to use GitHub Packages format
packageJson.repository = {
  type: "git",
  url: "https://github.com/gorizond/mcp-rancher-multi.git"
};

writeFileSync('package.json', JSON.stringify(packageJson, null, 2) + '\n');
console.log('Package.json prepared for GitHub Packages publication');
