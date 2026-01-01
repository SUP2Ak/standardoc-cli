#!/usr/bin/env node

/**
 * @doc.init cli CLI Interface
 * @description Command-line interface for Standardoc
 * @description Commands: scan, transform, watch
 */

import { parseArgs } from 'node:util';
import path from 'node:path';
import { scanWorkspace } from '../scanner/index';
import { transformMarkdownFiles } from '../transformer/index';
import { writeCanonicalDoc } from '../generator/index';
import type { ScannerConfig, CanonicalDoc } from '../types/index';
import { loadConfig, generateDefaultConfig, mergeCommentPatterns, type StandardocConfig } from '../config/config-loader';
import { setCustomPatterns } from '../parser/comment-detector';
import { COMMENT_STYLES } from '../parser/comment-detector';

interface CLIOptions {
  command?: string;
  output?: string;
  include?: string[];
  exclude?: string[];
  watch?: boolean;
  help?: boolean;
}

/**
 * @doc.init parseCLIArgs parseCLIArgs
 * @description Parses command-line arguments into CLIOptions
 * @returns Parsed CLI options with command and flags
 */
function parseCLIArgs(): CLIOptions {
  const { values, positionals } = parseArgs({
    options: {
      output: { type: 'string', short: 'o' },
      include: { type: 'string', multiple: true },
      exclude: { type: 'string', multiple: true },
      watch: { type: 'boolean', short: 'w' },
      help: { type: 'boolean', short: 'h' },
    },
    allowPositionals: true,
  });

  return {
    command: positionals[0],
    output: values.output,
    include: values.include,
    exclude: values.exclude,
    watch: values.watch,
    help: values.help,
  };
}

/**
 * @doc.init printHelp printHelp
 * @description Prints CLI help message with usage and examples
 */
function printHelp() {
  console.log(`
Standardoc CLI v0.1.0

Usage:
  standardoc <command> [options]

Commands:
  init       Generate default .standardoc.json configuration file
  scan       Scan workspace and generate canonical JSON
  transform  Transform MD/MDX files with DSL
  watch      Watch mode (scan + transform continuously)

Options:
  -o, --output <path>    Output path for JSON (default: .standardoc/doc.json)
  --include <pattern>    Glob patterns to include files (can be repeated)
  --exclude <pattern>    Glob patterns to exclude files (can be repeated)
  -w, --watch            Watch mode
  -h, --help             Show this help

Examples:
  standardoc init
  standardoc scan
  standardoc scan --output .standardoc --include "**/*.lua"
  standardoc transform
  standardoc watch
`);
}

/**
 * @doc.init main main
 * @description Main CLI entry point
 * @description Handles command routing and error handling
 */
async function main() {
  const options = parseCLIArgs();

  if (options.help || !options.command) {
    printHelp();
    process.exit(0);
  }

  const workspaceRoot = process.cwd();
  
  // Load custom config if it exists
  const customConfig = loadConfig(workspaceRoot);
  if (customConfig?.commentPatterns) {
    const mergedPatterns = mergeCommentPatterns(COMMENT_STYLES, customConfig.commentPatterns);
    setCustomPatterns(mergedPatterns);
  }

  const outputPath = options.output || path.join(workspaceRoot, '.standardoc', 'doc.json');

  const config: ScannerConfig = {
    workspaceRoot,
    includePatterns: options.include,
    excludePatterns: options.exclude,
    outputPath,
  };

  try {
    switch (options.command) {
      case 'init': {
        generateDefaultConfig(workspaceRoot);
        break;
      }
      case 'scan': {
        console.log('Scanning workspace...');
        const doc = await scanWorkspace(config);

        console.log(`Found ${Object.keys(doc).length} documentable blocks`);

        await writeCanonicalDoc(doc, outputPath);
        console.log(`JSON canonical written in: ${outputPath}`);
        break;
      }

      case 'transform': {
        const fs = await import('node:fs/promises');
        const docContent = await fs.readFile(outputPath, 'utf-8');
        const doc = JSON.parse(docContent) as CanonicalDoc;

        console.log('Transforming markdown files...');
        const transformConfig = customConfig?.transform;
        if (transformConfig?.entry && transformConfig?.output) {
          console.log(`Using entry: ${transformConfig.entry}, output: ${transformConfig.output}`);
        }
        await transformMarkdownFiles(doc, workspaceRoot);
        console.log('Transformation completed');
        break;
      }

      case 'watch': {
        console.log('Watch mode (not implemented yet)');
        break;
      }

      default: {
        console.error(`Unknown command: ${options.command}`);
        printHelp();
        process.exit(1);
      }
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main().catch(console.error);
