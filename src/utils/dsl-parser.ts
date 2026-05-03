/**
 * @doc dsl_parser_utils DSL Parser Utils
 * @description Simple DSL parser utilities for the extension (lightweight version)
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
 * @doc findDSLExpressions findDSLExpressions
 * @description Finds all DSL expressions in content
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
            } catch {
              // Ignore invalid expressions
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

/**
 * @doc parseDSLExpression parseDSLExpression
 * @description Parses a single DSL expression string
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
 * @description Parses method arguments
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

