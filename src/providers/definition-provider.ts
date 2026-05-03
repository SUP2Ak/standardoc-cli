/**
 * @doc definition_provider Definition Provider
 * @description Provides "Go to Definition" for doc.<key> references
 */

import * as vscode from 'vscode';
import { loadCanonicalDoc } from '../services/cli-service';

/**
 * @doc StandardocDefinitionProvider StandardocDefinitionProvider
 * @description Definition provider for navigating from doc.<key> to source code
 */
export class StandardocDefinitionProvider implements vscode.DefinitionProvider {
  private canonicalDoc: any | null = null;

  /**
   * @doc updateCanonicalDoc updateCanonicalDoc
   * @description Updates the canonical document cache
   * @param doc The canonical document
   */
  public updateCanonicalDoc(doc: any): void {
    this.canonicalDoc = doc;
  }

  /**
   * @doc provideDefinition provideDefinition
   * @description Provides definition location for doc.<key> references
   */
  public async provideDefinition(
    document: vscode.TextDocument,
    position: vscode.Position,
    _token: vscode.CancellationToken
  ): Promise<vscode.Definition | null> {
    // Only provide definition for MD/MDX files
    if (!['markdown', 'mdx'].includes(document.languageId)) {
      return null;
    }

    const line = document.lineAt(position);
    const text = line.text;

    // Check if we're inside a DSL expression {{ @doc.<key>:... }}
    const dslMatch = text.match(/\{\{\s*@doc\.(\w+)(?::[^}]+)?\s*\}\}/);
    if (!dslMatch) {
      return null;
    }

    const key = dslMatch[1];
    const docKey = `doc.${key}`;

    // Load canonical doc if not cached
    if (!this.canonicalDoc) {
      const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
      if (!workspaceFolder) {
        return null;
      }

      const config = vscode.workspace.getConfiguration('standardoc');
      const outputPath = config.get<string>('outputPath');
      
      this.canonicalDoc = await loadCanonicalDoc(workspaceFolder.uri.fsPath, outputPath);
      
      if (!this.canonicalDoc) {
        return null;
      }
    }

    const block = this.canonicalDoc[docKey];
    if (!block || !block.meta) {
      return null;
    }

    const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
    if (!workspaceFolder) {
      return null;
    }

    const filePath = vscode.Uri.joinPath(
      workspaceFolder.uri,
      block.meta.path
    );

    const lineNumber = (block.meta.line || 1) - 1; // Convert to 0-based
    const targetPosition = new vscode.Position(lineNumber, 0);

    return new vscode.Location(filePath, targetPosition);
  }
}

