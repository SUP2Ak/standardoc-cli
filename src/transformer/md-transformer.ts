/**
 * @doc md_transformer Markdown Transformer
 * @description Replaces {{ @doc.<key>:<method>(...) }} expressions with their values
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import fastGlob from 'fast-glob';
import path from 'node:path';
import type { CanonicalDoc } from '../types/index';
import { evaluateDSL } from '../dsl/index';
import { loadConfig, type TransformConfig } from '../config/config-loader';

/**
 * @doc transformMarkdownFiles transformMarkdownFiles
 * @description Transforms all MD/MDX files in a directory
 * @description Uses entry/output from config if available, otherwise creates .generated.md files
 * @param doc The canonical document containing all blocks
 * @param workspaceRoot The workspace root directory
 * @param patterns Glob patterns for files to transform (default: all .md and .mdx files)
 */
export async function transformMarkdownFiles(
  doc: CanonicalDoc,
  workspaceRoot: string,
  patterns: string[] = ['**/*.md', '**/*.mdx']
): Promise<void> {
  const config = loadConfig(workspaceRoot);
  const transformConfig: TransformConfig = config?.transform || {};

  let entryDir: string | null = null;
  let outputDir: string | null = null;

  if (transformConfig.entry && transformConfig.output) {
    entryDir = path.resolve(workspaceRoot, transformConfig.entry);
    outputDir = path.resolve(workspaceRoot, transformConfig.output);

    if (!existsSync(entryDir)) {
      console.warn(`Entry directory does not exist: ${entryDir}`);
      return;
    }

    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }
  }

  const searchPatterns = entryDir
    ? patterns.map(p => path.join(entryDir!, p))
    : patterns;

  const files = await fastGlob(searchPatterns, {
    cwd: entryDir || workspaceRoot,
    absolute: true,
    ignore: entryDir ? [] : ['**/*.generated.md', '**/*.generated.mdx'],
  });

  for (const filePath of files) {
    try {
      const content = readFileSync(filePath, 'utf-8');
      const transformed = evaluateDSL(content, doc);

      let outputPath: string;

      if (entryDir && outputDir) {
        // Use entry/output structure
        const relativePath = path.relative(entryDir, filePath);
        outputPath = path.join(outputDir, relativePath);

        // Ensure output directory exists
        const outputFileDir = path.dirname(outputPath);
        if (!existsSync(outputFileDir)) {
          mkdirSync(outputFileDir, { recursive: true });
        }
      } else {
        // Fallback to .generated.md
        const ext = path.extname(filePath);
        const baseName = path.basename(filePath, ext);
        const dirName = path.dirname(filePath);

        if (baseName.endsWith('.generated')) {
          outputPath = filePath;
        } else {
          outputPath = path.join(dirName, `${baseName}.generated${ext}`);
        }
      }

      writeFileSync(outputPath, transformed, 'utf-8');
    } catch (error) {
      console.error(`Error transforming ${filePath}:`, error);
      throw error;
    }
  }

  if (entryDir && outputDir) {
    console.log(`Transformed files from ${entryDir} to ${outputDir}`);
  }
}

/**
 * @doc transformMarkdownFile transformMarkdownFile
 * @description Transforms a single MD/MDX file
 * @param filePath The file path to transform
 * @param doc The canonical document containing all blocks
 * @returns The transformed content as a string
 */
export function transformMarkdownFile(
  filePath: string,
  doc: CanonicalDoc
): string {
  const content = readFileSync(filePath, 'utf-8');
  return evaluateDSL(content, doc);
}
