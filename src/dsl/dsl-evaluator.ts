/**
 * @doc.init dsl_evaluator DSL Evaluator
 * @description Evaluates DSL expressions and replaces {{ @doc.<key>:<method>(...) }} with their values
 */

import { StandardocError, type CanonicalDoc, type DocBlock } from '../types/index';
import { findDSLExpressions, type DSLExpression } from './dsl-parser';

/**
 * @doc.init evaluateDSLExpression evaluateDSLExpression
 * @description Evaluates a single DSL expression and returns its string value
 * @param expr The parsed DSL expression to evaluate
 * @param doc The canonical document containing all documentable blocks
 * @returns The evaluated string value
 * @throws StandardocError if the expression is invalid or the document key doesn't exist
 */
export function evaluateDSLExpression(
  expr: DSLExpression,
  doc: CanonicalDoc
): string {
  if (expr.type === 'end') {
    return '';
  }
  
  if (!expr.key || !expr.method) {
    throw new StandardocError(`Invalid DSL expression: ${expr.raw}`);
  }
  
  const block = doc[expr.key as keyof CanonicalDoc];
  
  if (!block) {
    throw new StandardocError(`Unknown document key: ${expr.key}`);
  }
  
  switch (expr.method) {
    case 'get':
      return evaluateGet(block, expr.args || []);
    
    case 'count':
      return evaluateCount(block, expr.args || []);
    
    case 'has':
      return evaluateHas(block, expr.args || []) ? 'true' : 'false';
    
    case 'meta':
      return evaluateMeta(block, expr.args || []);
    
    case 'each':
      return evaluateEach(block, expr.args || []);
    
    default:
      throw new StandardocError(`Unknown method: ${expr.method}`);
  }
}

/**
 * @doc.init evaluateGet evaluateGet
 * @description Evaluates the get() metamethod: doc.add:get('tag', index, ...mask)
 * @description Format: get(tag, index, ...mask) where mask is a binary vararg (0 = ignore, 1 = select)
 * @param block The document block to query
 * @param args Array of string arguments: [tag, index, ...mask]
 * @returns The selected field value as a string
 * @throws StandardocError if arguments are invalid or tag/index doesn't exist
 */
function evaluateGet(block: DocBlock, args: string[]): string {
  if (args.length < 2) {
    throw new StandardocError(`get() requires at least 2 arguments: tag and index`);
  }
  
  const tag = unquote(args[0]);
  const index = parseInt(args[1], 10);
  const mask = args.slice(2).map(arg => parseInt(arg, 10));
  
  const tagData = block[tag] as string[][] | undefined;
  
  if (!tagData) {
    throw new StandardocError(`Tag does not exist: ${tag}`);
  }
  
  if (index < 0 || index >= tagData.length) {
    throw new StandardocError(`Index out of bounds: ${index} (size: ${tagData.length})`);
  }
  
  const fields = tagData[index];
  
  if (mask.length === 0) {
    return fields[0] || '';
  }
  
  for (let i = 0; i < mask.length && i < fields.length; i++) {
    if (mask[i] === 1) {
      return fields[i] || '';
    }
  }
  
  return '';
}

/**
 * @doc.init evaluateCount evaluateCount
 * @description Evaluates the count() metamethod: doc.add:count('tag')
 * @param block The document block to query
 * @param args Array containing the tag name: [tag]
 * @returns The number of occurrences of the tag as a string
 */
function evaluateCount(block: DocBlock, args: string[]): string {
  if (args.length < 1) {
    throw new StandardocError(`count() requires 1 argument: tag`);
  }
  
  const tag = unquote(args[0]);
  const tagData = block[tag] as string[][] | undefined;
  
  if (!tagData) {
    return '0';
  }
  
  return String(tagData.length);
}

/**
 * @doc.init evaluateHas evaluateHas
 * @description Evaluates the has() metamethod: doc.add:has('tag')
 * @param block The document block to query
 * @param args Array containing the tag name: [tag]
 * @returns True if the tag exists in the block, false otherwise
 */
function evaluateHas(block: DocBlock, args: string[]): boolean {
  if (args.length < 1) {
    throw new StandardocError(`has() requires 1 argument: tag`);
  }
  
  const tag = unquote(args[0]);
  return block[tag] !== undefined;
}

/**
 * @doc.init evaluateMeta evaluateMeta
 * @description Evaluates the meta() metamethod: doc.add:meta('key')
 * @param block The document block to query
 * @param args Array containing the metadata key: [key]
 * @returns The metadata value as a string
 * @throws StandardocError if the metadata key doesn't exist
 */
function evaluateMeta(block: DocBlock, args: string[]): string {
  if (args.length < 1) {
    throw new StandardocError(`meta() requires 1 argument: key`);
  }
  
  const key = unquote(args[0]);
  const value = block.meta[key as keyof typeof block.meta];
  
  if (value === undefined) {
    throw new StandardocError(`Metadata does not exist: ${key}`);
  }
  
  return String(value);
}

/**
 * @doc.init evaluateEach evaluateEach
 * @description Evaluates the each() metamethod: doc.add:each('tag', 'template')
 * @description Template format: {n} where n is the field index, or {0,1} for mask-based selection
 * @param block The document block to query
 * @param args Array containing tag name and template: [tag, template]
 * @returns The joined result of applying the template to each tag occurrence
 * @throws StandardocError if arguments are invalid or tag doesn't exist
 */
function evaluateEach(block: DocBlock, args: string[]): string {
  if (args.length < 2) {
    throw new StandardocError(`each() requires 2 arguments: tag and template`);
  }
  
  const tag = unquote(args[0]);
  const template = unquote(args[1]);
  
  const tagData = block[tag] as string[][] | undefined;
  
  if (!tagData) {
    throw new StandardocError(`Tag does not exist: ${tag}`);
  }
  
  const results: string[] = [];
  
  for (const fields of tagData) {
    let result = template;
    
    result = result.replace(/\{(\d+(?:,\d+)*)\}/g, (match, indicesStr) => {
      const mask = indicesStr.split(',').map((i: string) => parseInt(i, 10));
      
      for (let pos = 0; pos < mask.length; pos++) {
        if (mask[pos] === 1) {
          if (pos < fields.length) {
            return fields[pos] || '';
          }
        }
      }
      
      return '';
    });
    
    results.push(result);
  }
  
  return results.join('\n');
}

/**
 * @doc.init unquote unquote
 * @description Removes surrounding quotes from a string argument
 * @param str The string to unquote
 * @returns The string without surrounding quotes
 */
function unquote(str: string): string {
  if ((str.startsWith('"') && str.endsWith('"')) ||
      (str.startsWith("'") && str.endsWith("'"))) {
    return str.slice(1, -1);
  }
  return str;
}

/**
 * @doc.init evaluateDSL evaluateDSL
 * @description Evaluates all DSL expressions in content and replaces them with their values
 * @description Handles conditional blocks ({{ @if ... }} / {{ @end }}) by removing false conditions
 * @param content The markdown content containing DSL expressions
 * @param doc The canonical document containing all documentable blocks
 * @returns The transformed content with all DSL expressions replaced
 * @throws StandardocError if any expression evaluation fails
 */
export function evaluateDSL(content: string, doc: CanonicalDoc): string {
  const expressions = findDSLExpressions(content);
  
  let result = content;
  const ifBlocks: Array<{ ifExpr: DSLExpression; endExpr: DSLExpression; condition: boolean }> = [];
  
  for (let i = 0; i < expressions.length; i++) {
    if (expressions[i].type === 'if') {
      for (let j = i + 1; j < expressions.length; j++) {
        if (expressions[j].type === 'end') {
          const ifExpr = expressions[i];
          let condition = false;
          if (ifExpr.key && ifExpr.method === 'has') {
            const block = doc[ifExpr.key as keyof CanonicalDoc];
            condition = block ? evaluateHas(block, ifExpr.args || []) : false;
          }
          
          ifBlocks.push({
            ifExpr: expressions[i],
            endExpr: expressions[j],
            condition,
          });
          break;
        }
      }
    }
  }
  
  const findLineBounds = (pos: number, text: string): { lineStart: number; lineEnd: number } => {
    let lineStart = pos;
    while (lineStart > 0 && text[lineStart - 1] !== '\n') {
      lineStart--;
    }
    
    let lineEnd = pos;
    while (lineEnd < text.length && text[lineEnd] !== '\n') {
      lineEnd++;
    }
    if (lineEnd < text.length && text[lineEnd] === '\n') {
      lineEnd++;
    }
    
    return { lineStart, lineEnd };
  };
  
  ifBlocks.sort((a, b) => b.endExpr.end - a.endExpr.end);
  
  for (const block of ifBlocks) {
    if (!block.condition) {
      const ifLineBounds = findLineBounds(block.ifExpr.start, result);
      const endLineBounds = findLineBounds(block.endExpr.start, result);
      result = result.slice(0, ifLineBounds.lineStart) + result.slice(endLineBounds.lineEnd);
    } else {
      const endLineBounds = findLineBounds(block.endExpr.start, result);
      result = result.slice(0, endLineBounds.lineStart) + result.slice(endLineBounds.lineEnd);
      const ifLineBounds = findLineBounds(block.ifExpr.start, result);
      result = result.slice(0, ifLineBounds.lineStart) + result.slice(ifLineBounds.lineEnd);
    }
  }
  
  const remainingExpressions = findDSLExpressions(result)
    .filter(expr => expr.type !== 'if' && expr.type !== 'end')
    .sort((a, b) => b.start - a.start);
  
  for (const expr of remainingExpressions) {
    try {
      const value = evaluateDSLExpression(expr, doc);
      result = result.slice(0, expr.start) + value + result.slice(expr.end);
    } catch (error) {
      if (error instanceof StandardocError) {
        throw error;
      }
      throw new StandardocError(
        `Error during evaluation: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
  
  return result;
}
