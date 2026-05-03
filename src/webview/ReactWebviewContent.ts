/**
 * @doc react_webview_content React Webview Content
 * @description Generates HTML content for React webview panel
 */

import * as vscode from 'vscode';

/**
 * Generate a nonce for Content Security Policy
 */
function getNonce(): string {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

/**
 * Generate the HTML content to load the React app
 */
export async function getReactWebviewContent(
  webview: vscode.Webview,
  extensionUri: vscode.Uri
): Promise<string> {
  // Load the React compiled script by ESBuild
  const scriptPath = vscode.Uri.joinPath(extensionUri, 'out', 'webview', 'views', 'index.js');
  const scriptUri = webview.asWebviewUri(scriptPath);
  const cssPath = vscode.Uri.joinPath(extensionUri, 'out', 'webview', 'views', 'index.css');
  let cssContent = '';
  try {
    const cssBuffer = await vscode.workspace.fs.readFile(cssPath);
    cssContent = cssBuffer.toString();
  } catch (error) {
    console.error('❌ CSS loading error:', error);
  }

  const nonce = getNonce();

  return `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'nonce-${nonce}' 'unsafe-eval'; style-src 'unsafe-inline'; connect-src 'none';">
    <title>Standardoc Documentation Panel</title>
    <style>
      body {
        font-family: var(--vscode-font-family);
        background-color: var(--vscode-editor-background);
        color: var(--vscode-editor-foreground);
        margin: 0;
        padding: 0;
      }
      
      ${cssContent}
    </style>
</head>
<body>
    <div id="root">Loading...</div>
    <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
}

