/**
 * @doc comment_parser Comment Parser
 * @description Parses files line by line to extract comments and detect Standardoc tags
 */

import { detectCommentStyle, extractCommentPrefix, cleanCommentContent } from './comment-detector';
import type { ParsedComment, CommentParserConfig } from '../types/index';
import path from 'node:path';

/**
 * @doc parseComments parseComments
 * @description Parses a file to extract comments based on file extension/language
 * @description Handles single-line, multi-line, and documentation comments
 * @param content The file content to parse
 * @param filePath The file path for extension detection
 * @param config Optional parser configuration (extension, language override)
 * @returns Array of parsed comments with their positions and cleaned content
 */
export function parseComments(
  content: string,
  filePath: string,
  config: CommentParserConfig = {}
): ParsedComment[] {
  const extension = config.extension || path.extname(filePath);
  const styles = detectCommentStyle(extension, config.language);

  if (!styles) {
    return [];
  }

  const lines = content.split(/\r?\n/);
  const comments: ParsedComment[] = [];
  let inMultiLine = false;
  let multiLineStart: { line: number; column: number; prefix: string; style: ParsedComment['style'] } | null = null;
  let multiLineContent: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNumber = i + 1;

    if (inMultiLine && multiLineStart) {
      multiLineContent.push(line);

      const multiEnd = styles.multi?.end || styles.docMulti?.end;
      if (multiEnd && line.includes(multiEnd)) {
        const fullContent = multiLineContent.join('\n');
        let cleaned = fullContent
          .replace(new RegExp(`^.*?${escapeRegex(multiLineStart.prefix)}`), '')
          .replace(new RegExp(`${escapeRegex(multiEnd)}.*$`), '');

        cleaned = cleaned
          .split('\n')
          .map(l => {
            return l.replace(/^\s*\*\s?/, '').trimEnd();
          })
          .join('\n')
          .trim();

        comments.push({
          raw: fullContent,
          line: multiLineStart.line,
          column: multiLineStart.column,
          style: multiLineStart.style,
          content: cleaned,
        });

        inMultiLine = false;
        multiLineStart = null;
        multiLineContent = [];
      }

      continue;
    }

    const commentInfo = extractCommentPrefix(line, styles);

    if (commentInfo) {
      const { prefix, style } = commentInfo;
      const column = line.indexOf(prefix) + 1;

      if (style === 'multi-line' || style === 'doc-multi') {
        inMultiLine = true;
        multiLineStart = { line: lineNumber, column, prefix, style };
        multiLineContent = [line];

        const multiEnd = (style === 'multi-line' ? styles.multi : styles.docMulti)?.end;
        if (multiEnd && line.includes(multiEnd)) {
          let cleaned = line
            .replace(new RegExp(`^.*?${escapeRegex(prefix)}`), '')
            .replace(new RegExp(`${escapeRegex(multiEnd)}.*$`), '');

          cleaned = cleaned.replace(/^\s*\*\s?/, '').trim();

          comments.push({
            raw: line,
            line: lineNumber,
            column,
            style,
            content: cleaned,
          });

          inMultiLine = false;
          multiLineStart = null;
          multiLineContent = [];
        }
      } else {
        const cleaned = cleanCommentContent(line, prefix, style);

        comments.push({
          raw: line,
          line: lineNumber,
          column,
          style,
          content: cleaned,
        });
      }
    }
  }

  if (inMultiLine && multiLineStart && multiLineContent.length > 0) {
    const fullContent = multiLineContent.join('\n');
    const prefix = multiLineStart.prefix;
    const multiEnd = (multiLineStart.style === 'multi-line' ? styles.multi : styles.docMulti)?.end;

    let cleaned = fullContent
      .replace(new RegExp(`^.*?${escapeRegex(prefix)}`), '');

    if (multiEnd) {
      cleaned = cleaned.replace(new RegExp(`${escapeRegex(multiEnd)}.*$`), '');
    }

    cleaned = cleaned
      .split('\n')
      .map(line => {
        return line.replace(/^\s*\*\s?/, '').trimEnd();
      })
      .join('\n')
      .trim();

    comments.push({
      raw: fullContent,
      line: multiLineStart.line,
      column: multiLineStart.column,
      style: multiLineStart.style,
      content: cleaned,
    });
  }

  return comments;
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
