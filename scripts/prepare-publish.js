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
  writeFileSync('package.json', JSON.stringify(packageJson, null, 2) + '\n');
  console.log('Version updated successfully');
} else {
  console.log(`Version is already correct: ${currentVersion}`);
}
