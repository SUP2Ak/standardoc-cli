/**
 * @doc scan_command Scan Command
 * @description Command to scan workspace and generate canonical JSON
 */

import * as vscode from 'vscode';
import { executeCLI, CLIConfig } from '../services/cli-service';

/**
 * @doc registerScanCommand registerScanCommand
 * @description Registers the scan command
 * @param context Extension context
 */
export function registerScanCommand(context: vscode.ExtensionContext): void {
  const command = vscode.commands.registerCommand('standardoc.scan', async () => {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    
    if (!workspaceFolders || workspaceFolders.length === 0) {
      vscode.window.showErrorMessage('No workspace folder open');
      return;
    }

    const workspaceRoot = workspaceFolders[0].uri.fsPath;
    const config = vscode.workspace.getConfiguration('standardoc');

    const outputPath = config.get<string>('outputPath');
    const includePatterns = config.get<string[]>('includePatterns');
    const excludePatterns = config.get<string[]>('excludePatterns');
    
    const cliConfig: CLIConfig = {
      workspaceRoot,
    };
    
    if (outputPath) {
      cliConfig.outputPath = outputPath;
    }
    if (includePatterns) {
      cliConfig.includePatterns = includePatterns;
    }
    if (excludePatterns) {
      cliConfig.excludePatterns = excludePatterns;
    }

    vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: 'Standardoc: Scanning workspace...',
        cancellable: false,
      },
      async (progress) => {
        progress.report({ increment: 0 });

        const result = await executeCLI('scan', cliConfig);

        progress.report({ increment: 100 });

        if (result.success) {
          vscode.window.showInformationMessage(
            `Standardoc: Scan completed successfully. ${result.output}`
          );
          
          // Refresh diagnostics and hover providers
          vscode.commands.executeCommand('standardoc.refresh');
        } else {
          vscode.window.showErrorMessage(
            `Standardoc: Scan failed. ${result.error || 'Unknown error'}`
          );
        }
      }
    );
  });

  context.subscriptions.push(command);
}

