/**
 * @doc comment_detector Comment Style Detector
 * @description Detects comment styles by language/extension without understanding code
 */

import type { CommentStyle } from '../types/index';
import type { CommentPatternConfig } from '../config/config-loader';

export const COMMENT_STYLES: Record<string, CommentPatternConfig> = {
  lua: {
    single: ['--'],
    docSingle: ['---'],
  },
  js: {
    single: ['//'],
    multi: { start: '/*', end: '*/' },
    docSingle: ['///'],
    docMulti: { start: '/**', end: '*/' },
  },
  ts: {
    single: ['//'],
    multi: { start: '/*', end: '*/' },
    docSingle: ['///'],
    docMulti: { start: '/**', end: '*/' },
  },
  jsx: {
    single: ['//'],
    multi: { start: '/*', end: '*/' },
    docSingle: ['///'],
    docMulti: { start: '/**', end: '*/' },
  },
  tsx: {
    single: ['//'],
    multi: { start: '/*', end: '*/' },
    docSingle: ['///'],
    docMulti: { start: '/**', end: '*/' },
  },

  c: {
    single: ['//'],
    multi: { start: '/*', end: '*/' },
  },
  cpp: {
    single: ['//'],
    multi: { start: '/*', end: '*/' },
  },
  h: {
    single: ['//'],
    multi: { start: '/*', end: '*/' },
  },
  hpp: {
    single: ['//'],
    multi: { start: '/*', end: '*/' },
  },

  py: {
    single: ['#'],
  },

  rs: {
    single: ['//'],
    multi: { start: '/*', end: '*/' },
    docSingle: ['///'],
    docMulti: { start: '/**', end: '*/' },
  },

  hlsl: {
    single: ['//'],
    multi: { start: '/*', end: '*/' },
  },

  sh: {
    single: ['#'],
  },
  bash: {
    single: ['#'],
  },

  txt: {
    single: [],
  },
  md: {
    single: [],
  },
};

let customPatterns: Record<string, CommentPatternConfig> | null = null;

/**
 * @doc setCustomPatterns setCustomPatterns
 * @description Sets custom comment patterns from config
 * @param patterns Custom patterns to use
 */
export function setCustomPatterns(patterns: Record<string, CommentPatternConfig> | null): void {
  customPatterns = patterns;
}

/**
 * @doc detectCommentStyle detectCommentStyle
 * @description Detects comment style for a given language/extension
 * @description Uses custom patterns if available, otherwise falls back to defaults
 * @param extension File extension (e.g., '.ts', '.lua')
 * @param language Optional language override
 * @returns Comment style configuration or null if not supported
 */
export function detectCommentStyle(
  extension: string,
  language?: string
): {
  single: string[];
  multi?: { start: string; end: string };
  docSingle?: string[];
  docMulti?: { start: string; end: string };
} | null {
  const ext = extension.toLowerCase().replace(/^\./, '');
  const lang = language?.toLowerCase();

  // Check custom patterns first
  if (customPatterns) {
    const customPattern = customPatterns[ext] || (lang ? customPatterns[lang] : undefined);
    if (customPattern) {
      // Ensure single is always defined
      return {
        single: customPattern.single || ['//'],
        multi: customPattern.multi,
        docSingle: customPattern.docSingle,
        docMulti: customPattern.docMulti,
      };
    }
  }

  // Fall back to defaults
  const defaultPattern = COMMENT_STYLES[ext] || (lang ? COMMENT_STYLES[lang] : undefined);
  if (defaultPattern) {
    return {
      single: defaultPattern.single || ['//'],
      multi: defaultPattern.multi,
      docSingle: defaultPattern.docSingle,
      docMulti: defaultPattern.docMulti,
    };
  }

  return {
    single: ['//'],
    multi: { start: '/*', end: '*/' },
  };
}

/**
 * @doc extractCommentPrefix extractCommentPrefix
 * @description Extracts comment prefix from a line
 * @description Returns null if the line is not a comment
 * @param line The line to check
 * @param styles The comment styles configuration
 * @returns Comment prefix and style, or null if not a comment
 */
export function extractCommentPrefix(
  line: string,
  styles: ReturnType<typeof detectCommentStyle>
): { prefix: string; style: CommentStyle } | null {
  if (!styles) return null;

  const trimmed = line.trim();

  if (styles.docSingle) {
    for (const prefix of styles.docSingle) {
      if (trimmed.startsWith(prefix)) {
        return { prefix, style: 'doc-single' };
      }
    }
  }

  if (styles.single) {
    for (const prefix of styles.single) {
      if (trimmed.startsWith(prefix)) {
        return { prefix, style: 'single-line' };
      }
    }
  }

  if (styles.multi) {
    if (trimmed.includes(styles.multi.start)) {
      return { prefix: styles.multi.start, style: 'multi-line' };
    }
  }

  if (styles.docMulti) {
    if (trimmed.includes(styles.docMulti.start)) {
      return { prefix: styles.docMulti.start, style: 'doc-multi' };
    }
  }

  return null;
}

/**
 * @doc cleanCommentContent cleanCommentContent
 * @description Cleans comment content by removing prefix
 * @param line The comment line to clean
 * @param prefix The comment prefix to remove
 * @param style The comment style
 * @returns The cleaned comment content
 */
export function cleanCommentContent(
  line: string,
  prefix: string,
  style: CommentStyle
): string {
  if (style === 'single-line' || style === 'doc-single') {
    const cleaned = line.replace(new RegExp(`^\\s*${escapeRegex(prefix)}`), '');
    return cleaned.trimStart();
  }

  return line;
}

/**
 * @doc escapeRegex escapeRegex
 * @description Escapes special regex characters in a string
 * @param str The string to escape
 * @returns The escaped string safe for use in regex
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
