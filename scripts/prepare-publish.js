#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

console.log('🚀 Preparing for npm publish...');

// Check if we're in a git repository
try {
  execSync('git status', { stdio: 'pipe' });
} catch (error) {
  console.error('❌ Not in a git repository. Please initialize git first.');
  process.exit(1);
}

// Check if there are uncommitted changes
try {
  const status = execSync('git status --porcelain', { encoding: 'utf8' });
  if (status.trim()) {
    console.error('❌ There are uncommitted changes. Please commit or stash them first.');
    console.log('Uncommitted files:');
    console.log(status);
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Error checking git status:', error.message);
  process.exit(1);
}

// Build the project
console.log('📦 Building project...');
try {
  execSync('npm run build', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}

// Make CLI executable
console.log('🔧 Making CLI executable...');
try {
  execSync('chmod +x dist/cli.js', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ Failed to make CLI executable:', error.message);
  process.exit(1);
}

// Check if package.json has required fields
console.log('📋 Validating package.json...');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

const requiredFields = ['name', 'version', 'description', 'author', 'license'];
for (const field of requiredFields) {
  if (!packageJson[field]) {
    console.error(`❌ Missing required field: ${field}`);
    process.exit(1);
  }
}

// Check if dist files exist
const requiredFiles = ['dist/index.js', 'dist/cli.js'];
for (const file of requiredFiles) {
  if (!fs.existsSync(file)) {
    console.error(`❌ Missing required file: ${file}`);
    process.exit(1);
  }
}

console.log('✅ All checks passed! Ready for publish.');
console.log('');
console.log('Next steps:');
console.log('1. npm login (if not already logged in)');
console.log('2. npm publish');
console.log('3. npm run bundle (to create binaries)');
console.log('4. Create GitHub release with binaries');