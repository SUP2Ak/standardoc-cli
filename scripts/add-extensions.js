#!/usr/bin/env node

/**
 * Post-build script to add .js extensions to imports
 * Necessary for Node.js ESM which requires extensions
 */

import { readFileSync, writeFileSync } from "node:fs";
import fastGlob from "fast-glob";
import path from "node:path";

const distDir = path.join(process.cwd(), "dist");

// Find all .js files in dist/
const files = await fastGlob("**/*.js", {
  cwd: distDir,
  absolute: true,
});

for (const file of files) {
  let content = readFileSync(file, "utf-8");
  let modified = false;

  // Replace imports without extension with imports with .js
  // Pattern: from './module' or from '../module' (but not from 'node:...' or packages npm)
  content = content.replace(
    /from\s+['"](\.\.?\/[^'"]+)['"]/g,
    (match, importPath) => {
      // Don't modify if the import already has an extension
      if (importPath.endsWith(".js") || importPath.endsWith(".json")) {
        return match;
      }
      modified = true;
      return `from '${importPath}.js'`;
    },
  );

  // Also replace exports
  content = content.replace(
    /export\s+\*\s+from\s+['"](\.\.?\/[^'"]+)['"]/g,
    (match, importPath) => {
      if (importPath.endsWith(".js") || importPath.endsWith(".json")) {
        return match;
      }
      modified = true;
      return `export * from '${importPath}.js'`;
    },
  );

  if (modified) {
    writeFileSync(file, content, "utf-8");
    console.log(`✓ Updated: ${path.relative(distDir, file)}`);
  }
}

console.log(`\n✓ Added .js extensions to ${files.length} files`);
