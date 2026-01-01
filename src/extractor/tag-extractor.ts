/**
 * @doc.init tag_extractor Tag Extractor
 * @description Extracts @doc.init and other @tags from parsed comments
 */

import type { ParsedComment, ExtractedTag, DocBlock, DocMeta } from '../types/index';
import { StandardocError } from '../types/index';
import path from 'node:path';

// const DOC_INIT_TAG = '@doc.init';

const TAG_REGEX = /^@(\w+(?:\.\w+)*)(?:\s+(.*))?$/;

/**
 * @doc.init extractTags extractTags
 * @description Extracts all tags from a parsed comment
 * @description Handles multi-line tags (example, description) by collecting subsequent lines
 * @param comment The parsed comment to extract tags from
 * @returns Array of extracted tags with their content and line numbers
 */
export function extractTags(comment: ParsedComment): ExtractedTag[] {
  const tags: ExtractedTag[] = [];
  const lines = comment.content.split('\n');
  
  const multiLineTags = ['example', 'description'];
  
  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();
    const match = line.match(TAG_REGEX);
    
    if (match) {
      const [, tagName, content = ''] = match;
      
      if (multiLineTags.includes(tagName)) {
        const multiLineContent: string[] = [];
        let j = i + 1;
        
        while (j < lines.length) {
          const nextLine = lines[j].trim();
          
          if (nextLine.match(TAG_REGEX)) {
            break;
          }
          
          multiLineContent.push(lines[j]);
          j++;
        }
        
        const fullContent = content + (multiLineContent.length > 0 ? '\n' + multiLineContent.join('\n') : '');
        
        tags.push({
          name: tagName,
          args: [],
          content: fullContent.trim(),
          line: comment.line + i,
        });
        
        i = j;
      } else {
        // Tag single line
        // For @doc.init, we want to keep the label with spaces
        // For other tags, we split by space
        let args: string[];
        if (tagName === 'doc.init') {
          // For @doc.init, we keep the content as is and split intelligently
          // Format: @doc.init key label (label can have spaces)
          // We split only the first word (key), the rest is the label
          const trimmed = content.trim();
          if (trimmed) {
            const firstSpace = trimmed.indexOf(' ');
            if (firstSpace === -1) {
              // No space = only key
              args = [trimmed];
            } else {
              // First word = key, rest = label
              args = [trimmed.slice(0, firstSpace), trimmed.slice(firstSpace + 1)];
            }
          } else {
            args = [];
          }
        } else {
          args = content ? content.split(/\s+/).filter(arg => arg.length > 0) : [];
        }
        
        tags.push({
          name: tagName,
          args,
          content,
          line: comment.line + i,
        });
        
        i++;
      }
    } else {
      i++;
    }
  }
  
  return tags;
}

/**
 * @doc.init extractDocBlocks extractDocBlocks
 * @description Extracts documentable blocks from a list of comments
 * @description A documentable block starts with @doc.init and ends at the next @doc.init or end of consecutive comments
 * @param comments Array of parsed comments from a file
 * @param filePath The file path where comments were found
 * @param workspaceRoot The workspace root directory for relative paths
 * @returns Array of extracted documentable blocks
 */
export function extractDocBlocks(
  comments: ParsedComment[],
  filePath: string,
  workspaceRoot: string
): DocBlock[] {
  const blocks: DocBlock[] = [];
  let currentBlock: {
    initTag: ExtractedTag;
    comments: ParsedComment[];
    startLine: number;
  } | null = null;
  
  for (const comment of comments) {
    const tags = extractTags(comment);
    const initTag = tags.find(tag => tag.name === 'doc.init');
    
    if (initTag) {
      if (currentBlock) {
        const block = buildDocBlock(
          currentBlock.initTag,
          currentBlock.comments,
          filePath,
          workspaceRoot,
          currentBlock.startLine
        );
        blocks.push(block);
      }
      
      currentBlock = {
        initTag,
        comments: [comment],
        startLine: comment.line,
      };
    } else if (currentBlock) {
      currentBlock.comments.push(comment);
    }
  }
  
  if (currentBlock) {
    const block = buildDocBlock(
      currentBlock.initTag,
      currentBlock.comments,
      filePath,
      workspaceRoot,
      currentBlock.startLine
    );
    blocks.push(block);
  }
  
  return blocks;
}

/**
 * @doc.init buildDocBlock buildDocBlock
 * @description Builds a DocBlock from a @doc.init tag and its associated comments
 * @description Extracts all tags, builds metadata, and structures the block
 * @param initTag The @doc.init tag that starts the block
 * @param comments All comments associated with this block
 * @param filePath The file path where the block was found
 * @param workspaceRoot The workspace root for relative paths
 * @param startLine The starting line number of the block
 * @returns A complete DocBlock with all extracted tags and metadata
 * @throws StandardocError if @doc.init is invalid or has wrong number of arguments
 */
function buildDocBlock(
  initTag: ExtractedTag,
  comments: ParsedComment[],
  filePath: string,
  workspaceRoot: string,
  startLine: number
): DocBlock {
  if (initTag.args.length < 1) {
    throw new StandardocError(
      `@doc.init requires at least 1 argument: <key> [label]`,
      filePath,
      initTag.line
    );
  }
  
  const key = initTag.args[0];
  // If no label, use key as label
  // Otherwise, join all remaining args as label (to support spaces)
  const label = initTag.args.length > 1 
    ? initTag.args.slice(1).join(' ')
    : key;
  
  const relativePath = path.relative(workspaceRoot, filePath);
  const meta: DocMeta = {
    path: relativePath,
    line: startLine,
    file: path.basename(filePath),
    ext: path.extname(filePath),
    lastEdit: getLastEdit(filePath),
  };
  
  const allTags = new Map<string, string[][]>();
  const multiLineTags = ['example', 'description'];
  
  const allCommentLines: Array<{ line: string; commentIndex: number; lineInComment: number }> = [];
  for (let i = 0; i < comments.length; i++) {
    const comment = comments[i];
    const lines = comment.content.split('\n');
    for (let j = 0; j < lines.length; j++) {
      allCommentLines.push({
        line: lines[j],
        commentIndex: i,
        lineInComment: j,
      });
    }
  }
  
  let i = 0;
  while (i < allCommentLines.length) {
    const { line: rawLine } = allCommentLines[i];
    const line = rawLine.trim();
    const match = line.match(TAG_REGEX);
    
    if (match) {
      const [, tagName, content = ''] = match;
      
      if (tagName === 'doc.init') {
        i++;
        continue;
      }
      
      if (multiLineTags.includes(tagName)) {
        const multiLineContent: string[] = [];
        let j = i + 1;
        
        while (j < allCommentLines.length) {
          const { line: nextRawLine } = allCommentLines[j];
          const nextLine = nextRawLine.trim();
          
          if (nextLine.match(TAG_REGEX)) {
            break;
          }
          
          multiLineContent.push(allCommentLines[j].line);
          j++;
        }
        
        const fullContent = content + (multiLineContent.length > 0 ? '\n' + multiLineContent.join('\n') : '');
        
        const tag: ExtractedTag = {
          name: tagName,
          args: [],
          content: fullContent.trim(),
          line: comments[allCommentLines[i].commentIndex].line + allCommentLines[i].lineInComment,
        };
        
        const fields = parseTagContent(tag);
        
        if (!allTags.has(tagName)) {
          allTags.set(tagName, []);
        }
        
        allTags.get(tagName)!.push(fields);
        
        i = j;
      } else {
        // Tag simple ligne
        // Pour @doc.init, on veut garder le label avec espaces
        let args: string[];
        if (tagName === 'doc.init') {
          const trimmed = content.trim();
          if (trimmed) {
            const firstSpace = trimmed.indexOf(' ');
            if (firstSpace === -1) {
              args = [trimmed];
            } else {
              args = [trimmed.slice(0, firstSpace), trimmed.slice(firstSpace + 1)];
            }
          } else {
            args = [];
          }
        } else {
          args = content ? content.split(/\s+/).filter(arg => arg.length > 0) : [];
        }
        
        const tag: ExtractedTag = {
          name: tagName,
          args,
          content,
          line: comments[allCommentLines[i].commentIndex].line + allCommentLines[i].lineInComment,
        };
        
        const fields = parseTagContent(tag);
        
        if (!allTags.has(tagName)) {
          allTags.set(tagName, []);
        }
        
        allTags.get(tagName)!.push(fields);
        
        i++;
      }
    } else {
      i++;
    }
  }
  
  const block: DocBlock = {
    label,
    meta: {
      ...meta,
      key,
    } as DocMeta & { key: string },
  };
  
  for (const [tagName, tagData] of allTags.entries()) {
    block[tagName] = tagData;
  }
  
  return block;
}

/**
 * @doc.init parseTagContent parseTagContent
 * @description Parses tag content into fields
 * @description For most tags, splits by space but keeps description as single string
 * @description For special tags (example), keeps raw content
 * @param tag The extracted tag to parse
 * @returns Array of parsed fields
 */
function parseTagContent(tag: ExtractedTag): string[] {
  const rawContentTags = ['example', 'description'];
  
  if (rawContentTags.includes(tag.name)) {
    return [tag.content];
  }
  
  const parts = tag.content.split(/\s+/);
  
  if (tag.name === 'param') {
    if (parts.length >= 3) {
      const name = parts[0];
      const type = parts[1];
      const description = parts.slice(2).join(' ');
      return [name, type, description];
    }
    return parts;
  } else if (tag.name === 'returns') {
    if (parts.length >= 2) {
      const type = parts[0];
      const description = parts.slice(1).join(' ');
      return [type, description];
    }
    return parts;
  }
  
  return parts;
}

/**
 * @doc.init getLastEdit getLastEdit
 * @description Gets the last modification date of a file
 * @param filePath The file path to check
 * @returns ISO string of the last modification time
 */
function getLastEdit(filePath: string): string {
  try {
    const fs = require('node:fs');
    const stats = fs.statSync(filePath);
    return stats.mtime.toISOString();
  } catch {
    return new Date().toISOString();
  }
}
