/**
 * @doc.init types Types and Interfaces
 * @description Core types and interfaces for Standardoc CLI
 */

/**
 * @doc.init DocMeta DocMeta
 * @description Automatically injected metadata for each documentable block
 */
export interface DocMeta {
  path: string;
  line: number;
  file: string;
  ext: string;
  lastEdit: string;
}

/**
 * @doc.init TagData TagData
 * @description Structure of parsed tag data
 * @description Each tag is an array of field arrays (string[][])
 */
export type TagData = string[][];

/**
 * @doc.init DocBlock DocBlock
 * @description Canonical structure of a documentable block
 */
export interface DocBlock {
  label: string;
  meta: DocMeta;
  [tag: string]: string | DocMeta | TagData;
}

/**
 * @doc.init CanonicalDoc CanonicalDoc
 * @description Complete canonical JSON structure
 * @description Keys in format: doc.<key>
 */
export interface CanonicalDoc {
  [key: `doc.${string}`]: DocBlock;
}

/**
 * @doc.init ScannerConfig ScannerConfig
 * @description Configuration for workspace scanner
 */
export interface ScannerConfig {
  includePatterns?: string[];
  excludePatterns?: string[];
  outputPath?: string;
  workspaceRoot: string;
}

/**
 * @doc.init CommentParserConfig CommentParserConfig
 * @description Configuration for comment parser
 */
export interface CommentParserConfig {
  language?: string;
  extension?: string;
}

/**
 * @doc.init CommentStyle CommentStyle
 * @description Supported comment style types
 */
export type CommentStyle = 
  | 'single-line'
  | 'multi-line'
  | 'doc-single'
  | 'doc-multi';

/**
 * @doc.init ParsedComment ParsedComment
 * @description Result of parsing a comment from source code
 */
export interface ParsedComment {
  raw: string;
  line: number;
  column: number;
  style: CommentStyle;
  content: string;
}

/**
 * @doc.init ExtractedTag ExtractedTag
 * @description Result of extracting a tag from a comment
 */
export interface ExtractedTag {
  name: string;
  args: string[];
  content: string;
  line: number;
}

/**
 * @doc.init StandardocError StandardocError
 * @description Standardoc error class (strict, non-silent)
 * @description Includes file, line, and column information for better error reporting
 */
export class StandardocError extends Error {
  constructor(
    message: string,
    public readonly file?: string,
    public readonly line?: number,
    public readonly column?: number
  ) {
    super(message);
    this.name = 'StandardocError';
  }
}
