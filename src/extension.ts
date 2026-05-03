/**
 * @doc extension Extension Entry Point
 * @description Main entry point for Standardoc VS Code extension
 */

import * as vscode from 'vscode';
import { StandardocHoverProvider } from './providers/hover-provider';
import { StandardocDiagnosticProvider } from './providers/diagnostic-provider';
import { StandardocDefinitionProvider } from './providers/definition-provider';
import { registerInitCommand } from './commands/init-command';
import { registerScanCommand } from './commands/scan-command';
import { registerTransformCommand } from './commands/transform-command';
import { registerRefreshCommand } from './commands/refresh-command';
import { registerOpenPanelCommand } from './commands/open-panel-command';
import { loadCanonicalDoc } from './services/cli-service';
import { initI18n } from './i18n/i18n';

/**
 * @doc activate activate
 * @description Activates the extension
 */
export function activate(context: vscode.ExtensionContext) {
  console.log('Standardoc extension is now active');
  
  // Initialize i18n
  initI18n();

  // Initialize providers
  const hoverProvider = new StandardocHoverProvider();
  const diagnosticProvider = new StandardocDiagnosticProvider();
  const definitionProvider = new StandardocDefinitionProvider();

  // Register providers
  context.subscriptions.push(
    vscode.languages.registerHoverProvider(
      [{ language: 'markdown' }, { language: 'mdx' }],
      hoverProvider
    )
  );

  context.subscriptions.push(
    vscode.languages.registerDefinitionProvider(
      [{ language: 'markdown' }, { language: 'mdx' }],
      definitionProvider
    )
  );

  // Register commands
  registerInitCommand(context);
  registerScanCommand(context);
  registerTransformCommand(context);
  registerOpenPanelCommand(context);
  registerRefreshCommand(context, (doc, docPath) => {
    hoverProvider.updateCanonicalDoc(doc, docPath);
    diagnosticProvider.updateCanonicalDoc(doc);
    definitionProvider.updateCanonicalDoc(doc);
  });

  // Load canonical doc on startup
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (workspaceFolders && workspaceFolders.length > 0) {
    const workspaceRoot = workspaceFolders[0].uri.fsPath;
    const config = vscode.workspace.getConfiguration('standardoc');
    const outputPath = config.get<string>('outputPath');

    loadCanonicalDoc(workspaceRoot, outputPath).then(doc => {
      if (doc) {
        const docPath = outputPath 
          ? `${workspaceRoot}/${outputPath}/docs.json`
          : `${workspaceRoot}/.standardoc/docs.json`;
        
        hoverProvider.updateCanonicalDoc(doc, docPath);
        diagnosticProvider.updateCanonicalDoc(doc);
        definitionProvider.updateCanonicalDoc(doc);
      }
    });
  }

  // Validate documents on change
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument(async (event) => {
      await diagnosticProvider.validateDocument(event.document);
    })
  );

  // Validate documents on open
  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument(async (document) => {
      await diagnosticProvider.validateDocument(document);
    })
  );

  // Cleanup
  context.subscriptions.push(diagnosticProvider);
}

/**
 * @doc deactivate deactivate
 * @description Deactivates the extension
 */
export function deactivate() {
  console.log('Standardoc extension is now deactivated');
}
