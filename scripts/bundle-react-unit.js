#!/usr/bin/env node
// Copyright (c) Tzvetan Mikov and contributors
// SPDX-License-Identifier: MIT
// See LICENSE file for full license text

import * as esbuild from 'esbuild';
import { mkdirSync, rmSync, readFileSync, writeFileSync } from 'fs';
import { dirname, resolve, join, relative } from 'path';
import { fileURLToPath } from 'url';
import { transformAsync } from '@babel/core';
import { glob } from 'glob';

// Usage: bundle-react-unit.js <entry-point> <output-file> [node-env]
// Example: bundle-react-unit.js src/react-unit/index.js build/react-bundle.js production

const useReactCompiler = process.env.USE_REACT_COMPILER === 'true';
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
const projectRoot = resolve(__dirname, '..');
const babelConfigPath = resolve(projectRoot, '.babelrc.cjs');

// Ensure output directory exists
mkdirSync(dirname(outfile), { recursive: true });

// Make entry point absolute for proper resolution
const absEntryPoint = resolve(entryPoint);
let actualEntryPoint = absEntryPoint;

// If React Compiler is enabled, preprocess with Babel
if (useReactCompiler) {
  console.log('React Compiler: Preprocessing JSX files...');

  const tempDir = join(dirname(outfile), '.babel-temp');
  rmSync(tempDir, { recursive: true, force: true });
  mkdirSync(tempDir, { recursive: true });

  const sourceRoot = dirname(absEntryPoint);

  // Transform all JS/JSX files in the source directory
  const files = glob.sync(join(sourceRoot, '**/*.{js,jsx}'));

  for (const file of files) {
    const relPath = relative(sourceRoot, file);
    const outputPath = join(tempDir, relPath);

    // Ensure subdirectories exist
    mkdirSync(dirname(outputPath), { recursive: true });

    // Transform with Babel
    try {
      const result = await transformAsync(readFileSync(file, 'utf8'), {
        filename: file,
        configFile: babelConfigPath,
      });

      writeFileSync(outputPath, result.code);
    } catch (error) {
      console.error(`Error transforming ${file}:`, error.message);
      throw error;
    }
  }

  actualEntryPoint = join(tempDir, relative(sourceRoot, absEntryPoint));
  console.log('React Compiler: Preprocessing complete');
}

await esbuild.build({
  entryPoints: [actualEntryPoint],
  bundle: true,
  outfile: outfile,
  platform: 'neutral',
  format: 'iife',
  target: 'esnext',
  minify: false,
  sourcemap: true,
  // When React Compiler is enabled, entry point is in temp dir,
  // so we need to ensure module resolution works from project root
  ...(useReactCompiler ? {
    absWorkingDir: projectRoot,
    nodePaths: [join(projectRoot, 'node_modules')],
  } : {}),
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

console.log('React unit bundle created:', outfile, `(NODE_ENV=${nodeEnv}, React Compiler=${useReactCompiler})`);
