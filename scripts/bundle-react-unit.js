#!/usr/bin/env node
// Copyright (c) Tzvetan Mikov and contributors
// SPDX-License-Identifier: MIT
// See LICENSE file for full license text

import * as esbuild from 'esbuild';
import { mkdirSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

// Usage: bundle-react-unit.js <entry-point> <output-file> [node-env]
// Example: bundle-react-unit.js src/react-unit/index.js build/react-bundle.js production

const entryPoint = process.argv[2];
const outfile = process.argv[3];
const nodeEnv = process.argv[4] || 'production';

if (!entryPoint || !outfile) {
  console.error('Usage: bundle-react-unit.js <entry-point> <output-file> [node-env]');
  console.error('Example: bundle-react-unit.js src/react-unit/index.js build/react-bundle.js production');
  process.exit(1);
}

// Resolve lib directory relative to this script (scripts/ and lib/ are siblings)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const libDir = resolve(__dirname, '../lib/react-imgui-reconciler');

// Ensure output directory exists
mkdirSync(dirname(outfile), { recursive: true });

await esbuild.build({
  entryPoints: [entryPoint],
  bundle: true,
  outfile: outfile,
  platform: 'neutral',
  format: 'iife',
  target: 'esnext',
  minify: false,
  sourcemap: true,
  // External packages that should be bundled
  external: [],
  // Alias for clean imports from lib/
  alias: {
    'react-imgui-reconciler': libDir,
  },
  // Define NODE_ENV for dead code elimination
  define: {
    'process.env.NODE_ENV': JSON.stringify(nodeEnv),
  },
});

console.log('React unit bundle created:', outfile, `(NODE_ENV=${nodeEnv})`);
