/**
 * @doc dsl_evaluator_wrapper DSL Evaluator Wrapper
 * @description Wrapper to use CLI's evaluateDSL function in the extension
 */

import * as path from 'node:path';
import * as fs from 'node:fs';
import type { CanonicalDoc } from '../../vendors/standardoc-cli/src/types/index';

/**
 * Evaluate DSL expressions in markdown content
 */
export async function evaluateDSL(content: string, doc: CanonicalDoc): Promise<string> {
  try {
    // Try to import from the compiled CLI
    const workspaceFolders = await import('vscode').then(m => m.workspace.workspaceFolders);
    if (!workspaceFolders || workspaceFolders.length === 0) {
      return content;
    }

    const workspaceRoot = workspaceFolders[0].uri.fsPath;
    const dslPath = path.join(workspaceRoot, 'vendors', 'standardoc-cli', 'dist', 'dsl', 'index.js');

    if (fs.existsSync(dslPath)) {
      const dslModule = await import(dslPath);
      if (dslModule && dslModule.evaluateDSL) {
        return dslModule.evaluateDSL(content, doc);
      }
    }
  } catch (error) {
    console.error('Error evaluating DSL:', error);
  }

  // Fallback: return original content
  return content;
}

