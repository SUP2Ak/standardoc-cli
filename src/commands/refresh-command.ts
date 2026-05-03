/**
 * @doc refresh_command Refresh Command
 * @description Command to refresh diagnostics and hover providers after scan
 */

import * as vscode from 'vscode';
import { loadCanonicalDoc } from '../services/cli-service';

/**
 * @doc registerRefreshCommand registerRefreshCommand
 * @description Registers the refresh command
 * @param context Extension context
 * @param updateProviders Callback to update providers with new canonical doc
 */
export function registerRefreshCommand(
  context: vscode.ExtensionContext,
  updateProviders: (doc: any, docPath: string) => void
): void {
  const command = vscode.commands.registerCommand('standardoc.refresh', async () => {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    
    if (!workspaceFolders || workspaceFolders.length === 0) {
      return;
    }

    const workspaceRoot = workspaceFolders[0].uri.fsPath;
    const config = vscode.workspace.getConfiguration('standardoc');
    const outputPath = config.get<string>('outputPath');

    const doc = await loadCanonicalDoc(workspaceRoot, outputPath);
    
    if (doc) {
      const docPath = outputPath 
        ? `${workspaceRoot}/${outputPath}/docs.json`
        : `${workspaceRoot}/.standardoc/docs.json`;
      
      updateProviders(doc, docPath);
      
      // Revalidate all open MD/MDX documents
      // This will be handled by the diagnostic provider automatically
    }
  });

  context.subscriptions.push(command);
}

