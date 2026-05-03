/**
 * @doc transform_command Transform Command
 * @description Command to transform MD/MDX files with DSL
 */

import * as vscode from 'vscode';
import { executeCLI, CLIConfig } from '../services/cli-service';

/**
 * @doc registerTransformCommand registerTransformCommand
 * @description Registers the transform command
 * @param context Extension context
 */
export function registerTransformCommand(context: vscode.ExtensionContext): void {
  const command = vscode.commands.registerCommand('standardoc.transform', async () => {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    
    if (!workspaceFolders || workspaceFolders.length === 0) {
      vscode.window.showErrorMessage('No workspace folder open');
      return;
    }

    const workspaceRoot = workspaceFolders[0].uri.fsPath;
    const config = vscode.workspace.getConfiguration('standardoc');

    const outputPath = config.get<string>('outputPath');
    
    const cliConfig: CLIConfig = {
      workspaceRoot,
    };
    
    if (outputPath) {
      cliConfig.outputPath = outputPath;
    }

    vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: 'Standardoc: Transforming markdown files...',
        cancellable: false,
      },
      async (progress) => {
        progress.report({ increment: 0 });

        const result = await executeCLI('transform', cliConfig);

        progress.report({ increment: 100 });

        if (result.success) {
          vscode.window.showInformationMessage('Standardoc: Transformation completed successfully.');
        } else {
          vscode.window.showErrorMessage(
            `Standardoc: Transformation failed. ${result.error || 'Unknown error'}`
          );
        }
      }
    );
  });

  context.subscriptions.push(command);
}

