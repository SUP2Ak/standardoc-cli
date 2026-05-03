/**
 * Build script for React webview using esbuild
 */

const esbuild = require('esbuild');
const { rm, mkdir } = require('fs/promises');
const path = require('path');

const isProduction = process.argv.includes('--production');
const isWatch = process.argv.includes('--watch');

// React webview options
const reactOptions = {
  entryPoints: ['src/webview/views/index.tsx'],
  bundle: true,
  outfile: 'out/webview/views/index.js',
  format: 'iife',
  platform: 'browser',
  target: 'es2020',
  sourcemap: !isProduction,
  minify: isProduction,
  define: {
    'process.env.NODE_ENV': isProduction ? '"production"' : '"development"'
  },
  loader: {
    '.css': 'css'
  },
  external: ['vscode']
};

async function build() {
  try {
    console.log('🔨 Building React webview...');
    
    // Ensure output directory exists
    const outDir = path.join(__dirname, '..', 'out', 'webview', 'views');
    await mkdir(outDir, { recursive: true });
    
    if (isWatch) {
      // Watch mode
      const context = await esbuild.context(reactOptions);
      await context.watch();
      console.log('🔍 Watching for changes...');
    } else {
      // Single build
      await esbuild.build(reactOptions);
      console.log('✅ React webview build completed!');
    }
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

build();

