#!/usr/bin/env node

import { build } from 'esbuild';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

async function buildPackage() {
  try {
    // Build the main entry point
    const result = await build({
      entryPoints: ['src/index.ts'],
      bundle: true,
      platform: 'node',
      target: 'node18',
      format: 'cjs',
      outfile: 'dist/index.js',
      external: [
        'fs',
        'path',
        'util',
        'stream',
        'events',
        'crypto',
        'http',
        'https',
        'url',
        'querystring',
        'os',
        'child_process',
        'process',
        'buffer',
        'assert',
        'constants',
        'domain',
        'punycode',
        'string_decoder',
        'timers',
        'tty',
        'vm',
        'zlib'
      ],
      sourcemap: true,
      minify: false,

    });

    console.log('Build completed successfully');
    
    // Add shebang to the beginning of the file
    const fs = await import('fs');
    const filePath = 'dist/index.js';
    const content = fs.readFileSync(filePath, 'utf8');
    const shebang = '#!/usr/bin/env node\n';
    
    if (!content.startsWith(shebang)) {
      fs.writeFileSync(filePath, shebang + content);
    }
    
    // Make the output file executable
    fs.chmodSync(filePath, '755');
    
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

buildPackage();
