/**
 * @doc config_loader Config Loader
 * @description Loads and merges custom configuration from .standardoc.json
 */

import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { COMMENT_STYLES } from '../parser/comment-detector';

export interface CommentPatternConfig {
  single?: string[];
  multi?: { start: string; end: string };
  docSingle?: string[];
  docMulti?: { start: string; end: string };
}

export interface TransformConfig {
  entry?: string;
  output?: string;
}

export interface StandardocConfig {
  docTag?: string; // Custom tag name (default: "doc")
  commentPatterns?: Record<string, CommentPatternConfig>;
  transform?: TransformConfig;
}

/**
 * @doc loadConfig loadConfig
 * @description Loads configuration from .standardoc.json if it exists
 * @param workspaceRoot The workspace root directory
 * @returns Configuration object or null if file doesn't exist
 */
export function loadConfig(workspaceRoot: string): StandardocConfig | null {
  const configPath = path.join(workspaceRoot, '.standardoc.json');

  if (!existsSync(configPath)) {
    return null;
  }

  try {
    const content = readFileSync(configPath, 'utf-8');
    return JSON.parse(content) as StandardocConfig;
  } catch (error) {
    console.warn(`Failed to load .standardoc.json: ${error}`);
    return null;
  }
}

/**
 * @doc generateDefaultConfig generateDefaultConfig
 * @description Generates a default .standardoc.json file with current patterns
 * @param workspaceRoot The workspace root directory
 */
export function generateDefaultConfig(workspaceRoot: string): void {
  const configPath = path.join(workspaceRoot, '.standardoc.json');

  if (existsSync(configPath)) {
    console.warn('.standardoc.json already exists. Skipping generation.');
    return;
  }

  // Convert COMMENT_STYLES to ensure all have single defined
  const commentPatterns: Record<string, CommentPatternConfig> = {};
  for (const [ext, pattern] of Object.entries(COMMENT_STYLES)) {
    commentPatterns[ext] = {
      single: pattern.single || ['//'],
      multi: pattern.multi,
      docSingle: pattern.docSingle,
      docMulti: pattern.docMulti,
    };
  }

  const config: StandardocConfig = {
    docTag: 'doc',
    commentPatterns,
    transform: {
      entry: './docs-dev',
      output: './docs',
    },
  };

  writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
  console.log(`Generated .standardoc.json at ${configPath}`);
}

/**
 * @doc mergeCommentPatterns mergeCommentPatterns
 * @description Merges custom patterns with default patterns
 * @description Custom patterns override default patterns for the same extension
 * @param defaultPatterns Default patterns from code
 * @param customPatterns Custom patterns from config
 * @returns Merged patterns with custom overriding defaults
 */
export function mergeCommentPatterns(
  defaultPatterns: Record<string, CommentPatternConfig>,
  customPatterns?: Record<string, CommentPatternConfig>
): Record<string, CommentPatternConfig> {
  if (!customPatterns) {
    return defaultPatterns;
  }

  const merged = { ...defaultPatterns };

  for (const [ext, patterns] of Object.entries(customPatterns)) {
    if (merged[ext]) {
      // Merge with existing, custom overrides
      merged[ext] = {
        ...merged[ext],
        ...patterns,
      };
    } else {
      // New extension
      merged[ext] = patterns;
    }
  }

  return merged;
}
