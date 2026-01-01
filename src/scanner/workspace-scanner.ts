/**
 * @doc workspace_scanner Workspace Scanner
 * @description Scans files, parses comments, and generates canonical JSON
 */

import { readFileSync } from 'node:fs';
import fastGlob from 'fast-glob';
import path from 'node:path';
import type { ScannerConfig, CanonicalDoc, DocBlock } from '../types/index';
import { parseComments } from '../parser/index';
import { extractDocBlocks } from '../extractor/index';
import { generateCanonicalDoc } from '../generator/index';

/**
 * @doc scanWorkspace scanWorkspace
 * @description Scans a workspace and generates canonical JSON
 * @description Finds files matching patterns, parses comments, extracts blocks
 * @param config Scanner configuration with workspace root, include/exclude patterns
 * @returns Canonical document with all extracted blocks
 */
export async function scanWorkspace(config: ScannerConfig): Promise<CanonicalDoc> {
  const {
    workspaceRoot,
    includePatterns = ['**/*'],
    excludePatterns = ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/build/**'],
  } = config;

  const allFiles = await fastGlob(includePatterns, {
    cwd: workspaceRoot,
    ignore: excludePatterns,
    absolute: true,
  });

  const allBlocks: DocBlock[] = [];

  for (const filePath of allFiles) {
    try {
      const content = readFileSync(filePath, 'utf-8');
      const extension = path.extname(filePath);

      const comments = parseComments(content, filePath, { extension });
      const blocks = extractDocBlocks(comments, filePath, workspaceRoot);

      allBlocks.push(...blocks);
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
        continue;
      }
      console.warn(`Error parsing ${filePath}:`, error);
    }
  }

  return generateCanonicalDoc(allBlocks);
}
