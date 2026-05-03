/**
 * @doc diagnostic_provider Diagnostic Provider
 * @description Provides diagnostics (errors/warnings) for DSL expressions in MD/MDX files
 */

import * as vscode from 'vscode';
import { loadCanonicalDoc } from '../services/cli-service';
import { findDSLExpressions, parseDSLExpression } from '../utils/dsl-parser';

/**
 * @doc StandardocDiagnosticProvider StandardocDiagnosticProvider
 * @description Diagnostic provider for Standardoc DSL validation
 */
export class StandardocDiagnosticProvider {
  private diagnosticCollection: vscode.DiagnosticCollection;
  private canonicalDoc: any | null = null;

  constructor() {
    this.diagnosticCollection = vscode.languages.createDiagnosticCollection('standardoc');
  }

  /**
   * @doc updateCanonicalDoc updateCanonicalDoc
   * @description Updates the canonical document cache
   * @param doc The canonical document
   */
  public updateCanonicalDoc(doc: any): void {
    this.canonicalDoc = doc;
  }

  /**
   * @doc validateDocument validateDocument
   * @description Validates a document and updates diagnostics
   * @param document The document to validate
   */
  public async validateDocument(document: vscode.TextDocument): Promise<void> {
    if (!['markdown', 'mdx'].includes(document.languageId)) {
      return;
    }

    const config = vscode.workspace.getConfiguration('standardoc');
    const enableDiagnostics = config.get<boolean>('enableDiagnostics', true);

    if (!enableDiagnostics) {
      this.diagnosticCollection.delete(document.uri);
      return;
    }

    // Load canonical doc if not cached
    if (!this.canonicalDoc) {
      const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
      if (!workspaceFolder) {
        return;
      }

      const outputPath = config.get<string>('outputPath');
      this.canonicalDoc = await loadCanonicalDoc(workspaceFolder.uri.fsPath, outputPath);
    }

    const diagnostics: vscode.Diagnostic[] = [];
    const text = document.getText();
    const expressions = findDSLExpressions(text);

    for (const expr of expressions) {
      const range = new vscode.Range(
        document.positionAt(expr.start),
        document.positionAt(expr.end)
      );

      try {
        const parsed = parseDSLExpression(expr.raw);
        
        if (!parsed) {
          diagnostics.push(
            new vscode.Diagnostic(
              range,
              `Invalid DSL expression: ${expr.raw}`,
              vscode.DiagnosticSeverity.Error
            )
          );
          continue;
        }

        if (parsed.type === 'method' && parsed.key) {
          const docKey = parsed.key;
          
          // Check if document exists in canonical doc
          if (this.canonicalDoc && !this.canonicalDoc[docKey]) {
            diagnostics.push(
              new vscode.Diagnostic(
                range,
                `Document "${docKey}" not found. Run 'standardoc scan' to generate documentation.`,
                vscode.DiagnosticSeverity.Warning
              )
            );
          }

          // Validate method calls
          if (parsed.method === 'get' && parsed.args && parsed.args.length < 2) {
            diagnostics.push(
              new vscode.Diagnostic(
                range,
                `Method 'get' requires at least 2 arguments: tag and index`,
                vscode.DiagnosticSeverity.Error
              )
            );
          }

          if (parsed.method === 'each' && parsed.args && parsed.args.length < 2) {
            diagnostics.push(
              new vscode.Diagnostic(
                range,
                `Method 'each' requires 2 arguments: tag and template`,
                vscode.DiagnosticSeverity.Error
              )
            );
          }
        }
      } catch (error) {
        diagnostics.push(
          new vscode.Diagnostic(
            range,
            `Error parsing DSL expression: ${error instanceof Error ? error.message : String(error)}`,
            vscode.DiagnosticSeverity.Error
          )
        );
      }
    }

    this.diagnosticCollection.set(document.uri, diagnostics);
  }

  /**
   * @doc dispose dispose
   * @description Disposes the diagnostic collection
   */
  public dispose(): void {
    this.diagnosticCollection.dispose();
  }
}

