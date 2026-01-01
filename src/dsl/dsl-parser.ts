/**
 * @doc dsl_parser DSL Parser
 * @description Parses DSL expressions from markdown content: {{ @doc.<key>:<method>(...) }}
 */

/**
 * @doc DSLExpression DSLExpression
 * @description Parsed DSL expression interface
 */
export interface DSLExpression {
  type: 'method' | 'if' | 'end';
  key?: string;
  method?: string;
  args?: string[];
  raw: string;
  start: number;
  end: number;
}

/**
 * @doc parseDSLExpression parseDSLExpression
 * @description Parses a single DSL expression string into a DSLExpression object
 * @description Supported formats: doc.add:get('param', 0), @if doc.add:has('returns'), @end
 * @param expression The expression string to parse
 * @returns The parsed DSLExpression or null if invalid
 */
export function parseDSLExpression(expression: string): DSLExpression | null {
  const trimmed = expression.trim();

  if (trimmed === 'end') {
    return {
      type: 'end',
      raw: expression,
      start: 0,
      end: expression.length,
    };
  }

  if (trimmed.startsWith('if ')) {
    const condition = trimmed.slice(3).trim();
    const parsed = parseMethodCall(condition);

    return {
      type: 'if',
      key: parsed.key,
      method: parsed.method,
      args: parsed.args,
      raw: expression,
      start: 0,
      end: expression.length,
    };
  }

  const parsed = parseMethodCall(trimmed);

  return {
    type: 'method',
    key: parsed.key,
    method: parsed.method,
    args: parsed.args,
    raw: expression,
    start: 0,
    end: expression.length,
  };
}

/**
 * @doc parseMethodCall parseMethodCall
 * @description Parses a method call: doc.add:get('param', 0, 1)
 * @description Format: <key>:<method>(<args>)
 * @param expr The method call expression string
 * @returns Object with key, method, and parsed args
 * @throws Error if expression format is invalid
 */
function parseMethodCall(expr: string): {
  key: string;
  method: string;
  args: string[];
} {
  const match = expr.match(/^([\w.]+):(\w+)\((.*)\)$/);

  if (!match) {
    throw new Error(`Invalid DSL expression: ${expr}`);
  }

  const [, key, method, argsStr] = match;
  const args = parseArgs(argsStr);

  return { key, method, args };
}

/**
 * @doc parseArgs parseArgs
 * @description Parses method arguments supporting strings, numbers, and binary masks
 * @description Supports: 'param', "param", 0, 1, 42, and vararg masks: 0, 1, 0, 1
 * @param argsStr The arguments string to parse
 * @returns Array of parsed argument strings
 */
function parseArgs(argsStr: string): string[] {
  if (!argsStr.trim()) {
    return [];
  }

  const args: string[] = [];
  let current = '';
  let inString = false;
  let stringChar = '';
  let depth = 0;

  for (let i = 0; i < argsStr.length; i++) {
    const char = argsStr[i];

    if (!inString) {
      if (char === '"' || char === "'") {
        inString = true;
        stringChar = char;
        current += char;
      } else if (char === '(') {
        depth++;
        current += char;
      } else if (char === ')') {
        depth--;
        current += char;
      } else if (char === ',' && depth === 0) {
        args.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    } else {
      current += char;
      if (char === stringChar && argsStr[i - 1] !== '\\') {
        inString = false;
        stringChar = '';
      }
    }
  }

  if (current.trim()) {
    args.push(current.trim());
  }

  return args;
}

/**
 * @doc findDSLExpressions findDSLExpressions
 * @description Finds all DSL expressions in content using {{ @expression }} syntax
 * @description Specifically searches for {{ @ to avoid conflicts with MDX/JSX
 * @param content The markdown content to search
 * @returns Array of all found DSL expressions with their positions
 */
export function findDSLExpressions(content: string): DSLExpression[] {
  const expressions: DSLExpression[] = [];
  let i = 0;

  while (i < content.length) {
    const startMatch = content.slice(i).match(/^\{\{\s*@/);
    if (!startMatch) {
      i++;
      continue;
    }

    const startPos = i;
    const exprStart = i + startMatch[0].length;
    let j = exprStart;
    let inString = false;
    let stringChar = '';
    let parenDepth = 0;

    while (j < content.length) {
      const char = content[j];
      const prevChar = j > 0 ? content[j - 1] : '';

      if (!inString) {
        if (char === '"' || char === "'") {
          inString = true;
          stringChar = char;
        } else if (char === '(') {
          parenDepth++;
        } else if (char === ')') {
          parenDepth--;
        } else if (char === '}') {
          if (j + 1 < content.length && content[j + 1] === '}' && parenDepth === 0) {
            const endPos = j + 2;
            const innerExpr = content.slice(exprStart, j).trim();

            try {
              const parsed = parseDSLExpression(innerExpr);
              if (parsed) {
                expressions.push({
                  ...parsed,
                  start: startPos,
                  end: endPos,
                });
              }
            } catch (error) {
              // Ignore invalid expressions silently
            }

            i = endPos;
            break;
          }
        }
      } else {
        if (char === stringChar && prevChar !== '\\') {
          inString = false;
          stringChar = '';
        }
      }

      j++;
    }

    if (j >= content.length) {
      break;
    }
  }

  return expressions;
}
