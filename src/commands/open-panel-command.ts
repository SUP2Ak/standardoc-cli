/**
 * @doc open_panel_command Open Panel Command
 * @description Command to open the React documentation panel
 */

import * as vscode from 'vscode';
import { ReactPanelRenderer } from '../webview/renderReact';

/**
 * @doc registerOpenPanelCommand registerOpenPanelCommand
 * @description Registers the open panel command
 * @param context Extension context
 */
export function registerOpenPanelCommand(context: vscode.ExtensionContext): void {
  const command = vscode.commands.registerCommand('standardoc.openPanel', async () => {
    await ReactPanelRenderer.createOrShow(context.extensionUri);
  });

  context.subscriptions.push(command);
}

