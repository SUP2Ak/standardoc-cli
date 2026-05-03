/**
 * @doc init_command Init Command
 * @description Command to initialize .standardoc/settings.json configuration file
 */

import * as vscode from 'vscode';

/**
 * @doc registerInitCommand registerInitCommand
 * @description Registers the init command
 * @param context Extension context
 */
export function registerInitCommand(context: vscode.ExtensionContext): void {
  const command = vscode.commands.registerCommand('standardoc.init', async () => {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    
    if (!workspaceFolders || workspaceFolders.length === 0) {
      vscode.window.showErrorMessage('No workspace folder open');
      return;
    }

    const workspaceRoot = workspaceFolders[0].uri.fsPath;
    
    // Check if .standardoc/settings.json already exists
    const fs = await import('node:fs');
    const path = await import('node:path');
    const configPath = path.join(workspaceRoot, '.standardoc', 'settings.json');
    
    if (fs.existsSync(configPath)) {
      const action = await vscode.window.showWarningMessage(
        '.standardoc/settings.json already exists. Do you want to overwrite it?',
        'Overwrite',
        'Cancel'
      );
      
      if (action !== 'Overwrite') {
        return;
      }
    }

    vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: 'Standardoc: Initializing configuration...',
        cancellable: false,
      },
      async (progress) => {
        progress.report({ increment: 0 });

        // Execute init command via CLI
        const { spawn } = await import('node:child_process');
        const { getCLIPath } = await import('../services/cli-service');
        
        // Get CLI path
        const cliPath = getCLIPath();
        if (!cliPath) {
          vscode.window.showErrorMessage(
            'Standardoc CLI not found. Please ensure standardoc-cli is available in vendors/standardoc-cli'
          );
          return;
        }

        return new Promise<void>((resolve) => {
          const process = spawn('node', [cliPath, 'init'], {
            cwd: workspaceRoot,
            stdio: ['ignore', 'pipe', 'pipe'],
          });

          let stdout = '';
          let stderr = '';

          process.stdout.on('data', (data) => {
            stdout += data.toString();
          });

          process.stderr.on('data', (data) => {
            stderr += data.toString();
          });

          process.on('close', (code) => {
            progress.report({ increment: 100 });

            if (code === 0) {
              vscode.window.showInformationMessage(
                `Standardoc: Configuration file created at .standardoc/settings.json`
              );
              // Open the config file
              const configUri = vscode.Uri.file(configPath);
              vscode.window.showTextDocument(configUri);
            } else {
              vscode.window.showErrorMessage(
                `Standardoc: Failed to initialize configuration. ${stderr || 'Unknown error'}`
              );
            }
            resolve();
          });

          process.on('error', (error) => {
            vscode.window.showErrorMessage(
              `Standardoc: Failed to initialize configuration. ${error.message}`
            );
            resolve();
          });
        });
      }
    );
  });

  context.subscriptions.push(command);
}

