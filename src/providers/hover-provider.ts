/**
 * @doc hover_provider Hover Provider
 * @description Provides hover information for doc.<key> references in MD/MDX files
 */

import * as vscode from 'vscode';
import { loadCanonicalDoc } from '../services/cli-service';

/**
 * @doc StandardocHoverProvider StandardocHoverProvider
 * @description Hover provider for Standardoc DSL expressions
 */
export class StandardocHoverProvider implements vscode.HoverProvider {
  private canonicalDoc: any | null = null;

  /**
   * @doc updateCanonicalDoc updateCanonicalDoc
   * @description Updates the canonical document cache
   * @param doc The canonical document
   * @param _docPath The path to the document (unused but kept for API consistency)
   */
  public updateCanonicalDoc(doc: any, _docPath: string): void {
    this.canonicalDoc = doc;
  }

  /**
   * @doc provideHover provideHover
   * @description Provides hover information for DSL expressions
   */
  public async provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    _token: vscode.CancellationToken
  ): Promise<vscode.Hover | null> {
    // Only provide hover for MD/MDX files
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
        return new vscode.Hover(
          new vscode.MarkdownString(`**Standardoc**: Document "${docKey}" not found. Run \`standardoc scan\` to generate documentation.`),
          line.range
        );
      }
    }

    const block = this.canonicalDoc[docKey];
    if (!block) {
      return new vscode.Hover(
        new vscode.MarkdownString(`**Standardoc**: Document "${docKey}" not found in canonical JSON.`),
        line.range
      );
    }

    // Build hover content
    const markdown = new vscode.MarkdownString();
    markdown.isTrusted = true;
    
    markdown.appendMarkdown(`### ${block.label || key}\n\n`);
    
    if (block.description && block.description.length > 0) {
      markdown.appendMarkdown(`**Description**: ${block.description[0][0]}\n\n`);
    }
    
    if (block.meta) {
      markdown.appendMarkdown(`**File**: \`${block.meta.file}\` (line ${block.meta.line})\n\n`);
      markdown.appendMarkdown(`**Path**: \`${block.meta.path}\`\n\n`);
    }
    
    if (block.param && block.param.length > 0) {
      markdown.appendMarkdown(`**Parameters**: ${block.param.length}\n\n`);
    }
    
    if (block.returns && block.returns.length > 0) {
      markdown.appendMarkdown(`**Returns**: ${block.returns[0][0] || 'N/A'}\n\n`);
    }

    return new vscode.Hover(markdown, line.range);
  }
}

