/**
 * @doc render_react React Panel Renderer
 * @description Manages React webview panel for Standardoc documentation
 */

import * as vscode from 'vscode';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { getReactWebviewContent } from './ReactWebviewContent';
import { loadCanonicalDoc, getCanonicalDocPath } from '../services/cli-service';
import { getLocale } from '../i18n/i18n';

export class ReactPanelRenderer {
  private static _currentPanel: vscode.WebviewPanel | undefined;

  /**
   * Creates or shows the React panel
   */
  public static async createOrShow(extensionUri: vscode.Uri): Promise<void> {
    // If a panel already exists, simply reveal it
    if (this._currentPanel) {
      this._currentPanel.reveal(this._currentPanel.viewColumn);
      // Refresh data if needed
      await this.loadAndSendDocData(this._currentPanel);
      return;
    }
    await this.openReactPanel(extensionUri);
  }

  /**
   * Opens the React panel
   */
  private static async openReactPanel(extensionUri: vscode.Uri): Promise<void> {
    // Create the webview panel
    const panel = vscode.window.createWebviewPanel(
      'standardocDocumentationPanel',
      'Standardoc Documentation',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.joinPath(extensionUri, 'out')
        ],
        enableCommandUris: false,
        enableFindWidget: false
      }
    );

    // Store the panel reference
    this._currentPanel = panel;

    // Load React content
    panel.webview.html = await getReactWebviewContent(panel.webview, extensionUri);

    // Setup message handlers
    this.setupMessageHandlers(panel);

    // Cleanup when panel is closed
    panel.onDidDispose(() => {
      this._currentPanel = undefined;
    });

    // Refresh when panel becomes visible
    panel.onDidChangeViewState(async () => {
      if (panel.visible) {
        await this.loadAndSendDocData(panel);
      }
    });
  }

  /**
   * Setup message handlers for React
   */
  private static setupMessageHandlers(panel: vscode.WebviewPanel): void {
    panel.webview.onDidReceiveMessage(async (message) => {
      try {
        console.log('🟢 Extension: Message reçu du panel React:', message.command, message);

        switch (message.command) {
          case 'loadDoc':
            await this.loadAndSendDocData(panel);
            break;

          case 'refreshDoc':
            await this.loadAndSendDocData(panel);
            break;

          case 'updateKey':
            await this.updateKeyInSource(message.oldKey, message.newKey, message.filePath, message.line);
            await this.loadAndSendDocData(panel);
            break;

          case 'updateTag':
            await this.updateTagInSource(message.oldTag, message.newTag, message.filePath, message.line);
            await this.loadAndSendDocData(panel);
            break;

          case 'getTranslations':
            await this.sendTranslations(panel);
            break;

          case 'loadConfig':
            await this.loadAndSendConfig(panel);
            break;

          case 'saveConfig':
            await this.saveConfig(message.config);
            await this.loadAndSendConfig(panel);
            break;

          case 'initConfig':
            await this.initConfig(panel);
            break;

          case 'loadFileTree':
            await this.loadAndSendFileTree(panel);
            break;

          case 'previewFile':
            await this.previewFile(message.filePath, panel);
            break;

          default:
            console.log('Message non géré:', message);
        }
      } catch (error) {
        console.error('Erreur lors du traitement du message React:', error);
        vscode.window.showErrorMessage(`Erreur: ${error}`);
      }
    });
  }

  /**
   * Load and send documentation data to the panel
   */
  private static async loadAndSendDocData(panel: vscode.WebviewPanel): Promise<void> {
    try {
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) {
        panel.webview.postMessage({
          command: 'updateDoc',
          data: null,
          error: 'No workspace folder open'
        });
        return;
      }

      const workspaceRoot = workspaceFolders[0].uri.fsPath;
      const config = vscode.workspace.getConfiguration('standardoc');
      const outputPath = config.get<string>('outputPath');

      const expectedDocPath = getCanonicalDocPath(workspaceRoot, outputPath);
      console.log('Loading doc from:', expectedDocPath);
      
      const doc = await loadCanonicalDoc(workspaceRoot, outputPath);
      
      if (doc) {
        panel.webview.postMessage({
          command: 'updateDoc',
          data: doc,
          docPath: expectedDocPath
        });
        // Also send locale
        await this.sendTranslations(panel);
      } else {
        console.error('Document not found at:', expectedDocPath);
        panel.webview.postMessage({
          command: 'updateDoc',
          data: null,
          error: `No documentation found at ${expectedDocPath}. Run "Standardoc: Scan Workspace" first.`
        });
        await this.sendTranslations(panel);
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la documentation:', error);
      panel.webview.postMessage({
        command: 'updateDoc',
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Send translations to panel
   */
  private static async sendTranslations(panel: vscode.WebviewPanel): Promise<void> {
    const extensionPath = vscode.extensions.getExtension('standardoc.standardoc')?.extensionPath;
    if (!extensionPath) {
      return;
    }

    const locale = getLocale();
    const localePath = path.join(extensionPath, 'out', 'i18n', 'locales', `${locale}.json`);
    
    try {
      const content = await fs.promises.readFile(localePath, 'utf-8');
      const translations = JSON.parse(content);
      
      panel.webview.postMessage({
        command: 'updateTranslations',
        locale,
        translations
      });
    } catch (error) {
      console.error('Failed to load translations:', error);
    }
  }

  /**
   * Update key in source file
   */
  private static async updateKeyInSource(
    oldKey: string,
    newKey: string,
    filePath: string,
    lineNumber: number
  ): Promise<void> {
    try {
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) {
        return;
      }

      const workspaceRoot = workspaceFolders[0].uri.fsPath;
      const fullPath = path.isAbsolute(filePath) 
        ? filePath 
        : path.join(workspaceRoot, filePath);

      // Read file
      const content = await fs.promises.readFile(fullPath, 'utf-8');
      const lines = content.split('\n');

      // Find the line with @doc tag
      if (lineNumber > 0 && lineNumber <= lines.length) {
        const lineIndex = lineNumber - 1;
        const line = lines[lineIndex];

        // Replace the key in @doc.init or @doc tag
        // Pattern: @doc.init oldKey or @doc oldKey
        const updatedLine = line.replace(
          /(@doc(?:\.init)?\s+)(\S+)/,
          (match: string, prefix: string, key: string) => {
            if (key === oldKey) {
              return `${prefix}${newKey}`;
            }
            return match;
          }
        );

        if (updatedLine !== line) {
          lines[lineIndex] = updatedLine;
          const newContent = lines.join('\n');

          // Write back to file
          await fs.promises.writeFile(fullPath, newContent, 'utf-8');

          // Show success message
          vscode.window.showInformationMessage(
            `Key updated: ${oldKey} → ${newKey} in ${path.basename(filePath)}`
          );
        } else {
          vscode.window.showWarningMessage(
            `Could not find key "${oldKey}" in ${path.basename(filePath)} at line ${lineNumber}`
          );
        }
      }
    } catch (error) {
      console.error('Error updating key in source:', error);
      vscode.window.showErrorMessage(
        `Failed to update key: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Update tag in source file
   */
  private static async updateTagInSource(
    oldTag: string,
    newTag: string,
    filePath: string,
    lineNumber: number
  ): Promise<void> {
    try {
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) {
        return;
      }

      const workspaceRoot = workspaceFolders[0].uri.fsPath;
      const fullPath = path.isAbsolute(filePath) 
        ? filePath 
        : path.join(workspaceRoot, filePath);

      // Read file
      const content = await fs.promises.readFile(fullPath, 'utf-8');
      const lines = content.split('\n');

      // Find the line with @tag
      if (lineNumber > 0 && lineNumber <= lines.length) {
        const lineIndex = lineNumber - 1;
        let found = false;

        // Look for @tag in the current line and nearby lines (comments can span multiple lines)
        const searchRange = 5; // Search 5 lines before and after
        const startSearch = Math.max(0, lineIndex - searchRange);
        const endSearch = Math.min(lines.length, lineIndex + searchRange + 1);

        for (let i = startSearch; i < endSearch; i++) {
          const currentLine = lines[i];
          
          // Replace @oldTag with @newTag
          // Pattern: @oldTag or @oldTag value
          const tagPattern = new RegExp(`@${oldTag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\s|$)`, 'g');
          if (tagPattern.test(currentLine)) {
            lines[i] = currentLine.replace(tagPattern, `@${newTag}$1`);
            found = true;
            break;
          }
        }

        if (found) {
          const newContent = lines.join('\n');

          // Write back to file
          await fs.promises.writeFile(fullPath, newContent, 'utf-8');

          // Show success message
          vscode.window.showInformationMessage(
            `Tag updated: @${oldTag} → @${newTag} in ${path.basename(filePath)}`
          );
        } else {
          vscode.window.showWarningMessage(
            `Could not find tag "@${oldTag}" in ${path.basename(filePath)} around line ${lineNumber}`
          );
        }
      }
    } catch (error) {
      console.error('Error updating tag in source:', error);
      vscode.window.showErrorMessage(
        `Failed to update tag: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Load and send configuration
   */
  private static async loadAndSendConfig(panel: vscode.WebviewPanel): Promise<void> {
    console.log('🟢 Extension: Chargement de la configuration...');
    try {
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) {
        panel.webview.postMessage({
          command: 'configError',
          error: 'No workspace folder open'
        });
        return;
      }

      const workspaceRoot = workspaceFolders[0].uri.fsPath;
      const configPath = path.join(workspaceRoot, '.standardoc', 'settings.json');

      if (!fs.existsSync(configPath)) {
        panel.webview.postMessage({
          command: 'updateConfig',
          data: null
        });
        return;
      }

      const content = await fs.promises.readFile(configPath, 'utf-8');
      const config = JSON.parse(content);

      panel.webview.postMessage({
        command: 'updateConfig',
        data: config
      });
    } catch (error) {
      panel.webview.postMessage({
        command: 'configError',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Save configuration
   */
  private static async saveConfig(config: any): Promise<void> {
    try {
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) {
        return;
      }

      const workspaceRoot = workspaceFolders[0].uri.fsPath;
      const standardocDir = path.join(workspaceRoot, '.standardoc');
      const configPath = path.join(standardocDir, 'settings.json');

      // Ensure .standardoc directory exists
      if (!fs.existsSync(standardocDir)) {
        await fs.promises.mkdir(standardocDir, { recursive: true });
      }

      await fs.promises.writeFile(
        configPath,
        JSON.stringify(config, null, 2),
        'utf-8'
      );

      vscode.window.showInformationMessage('Configuration saved successfully');
      
      // Notify panel that config was saved
      if (this._currentPanel) {
        await this.loadAndSendConfig(this._currentPanel);
      }
    } catch (error) {
      vscode.window.showErrorMessage(
        `Failed to save configuration: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Initialize configuration
   */
  private static async initConfig(panel: vscode.WebviewPanel): Promise<void> {
    try {
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) {
        return;
      }

      const workspaceRoot = workspaceFolders[0].uri.fsPath;
      const { getCLIPath } = await import('../services/cli-service');
      const cliPath = getCLIPath();
      
      if (!cliPath) {
        vscode.window.showErrorMessage('Standardoc CLI not found');
        return;
      }

      const { spawn } = await import('node:child_process');
      return new Promise<void>((resolve) => {
        const process = spawn('node', [cliPath, 'init'], {
          cwd: workspaceRoot,
          stdio: 'ignore'
        });

        process.on('close', async (code) => {
          if (code === 0) {
            vscode.window.showInformationMessage('Configuration initialized');
            // Wait a bit for file system to sync, then reload config
            await new Promise(resolve => setTimeout(resolve, 500));
            await this.loadAndSendConfig(panel);
          }
          resolve();
        });
      });
    } catch (error) {
      vscode.window.showErrorMessage(
        `Failed to initialize configuration: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Load and send file tree
   */
  private static async loadAndSendFileTree(panel: vscode.WebviewPanel): Promise<void> {
    try {
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) {
        return;
      }
      const workspaceRoot = workspaceFolders[0].uri.fsPath;
      const tree = await this.buildFileTree(workspaceRoot, ['**/*.md', '**/*.mdx']);
      
      panel.webview.postMessage({
        command: 'updateFileTree',
        data: tree
      });
    } catch (error) {
      console.error('Error loading file tree:', error);
    }
  }

  /**
   * Build file tree structure
   */
  private static async buildFileTree(root: string, patterns: string[]): Promise<any[]> {
    const fastGlob = await import('fast-glob');
    const pkg = fastGlob as any;
    const files = await pkg.glob(patterns, {
      cwd: root,
      absolute: true
    });

    const tree: any = {};
    
    for (const file of files) {
      const relative = path.relative(root, file);
      const parts = relative.split(path.sep);
      let current = tree;

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const isFile = i === parts.length - 1;

        if (!current[part]) {
          current[part] = {
            name: part,
            path: path.join(...parts.slice(0, i + 1)),
            type: isFile ? 'file' : 'directory',
            children: isFile ? undefined : {}
          };
        }

        if (!isFile) {
          current = current[part].children;
        }
      }
    }

    const convertToArray = (obj: any): any[] => {
      return Object.values(obj).map((item: any) => ({
        ...item,
        children: item.children ? convertToArray(item.children) : undefined
      }));
    };

    return convertToArray(tree);
  }

  /**
   * Preview file with DSL transformation
   */
  private static async previewFile(filePath: string, panel: vscode.WebviewPanel): Promise<void> {
    try {
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) {
        return;
      }

      const workspaceRoot = workspaceFolders[0].uri.fsPath;
      const fullPath = path.isAbsolute(filePath)
        ? filePath
        : path.join(workspaceRoot, filePath);

      // Read original file
      const original = await fs.promises.readFile(fullPath, 'utf-8');

      // Load docs.json for transformation
      const config = vscode.workspace.getConfiguration('standardoc');
      const outputPath = config.get<string>('outputPath');
      const docPath = getCanonicalDocPath(workspaceRoot, outputPath);

      let transformed = original;
      
      if (fs.existsSync(docPath)) {
        const docContent = await fs.promises.readFile(docPath, 'utf-8');
        const doc = JSON.parse(docContent);

        // Transform using CLI's evaluateDSL
        try {
          const { evaluateDSL } = await import('../utils/dsl-evaluator');
          transformed = await evaluateDSL(original, doc);
        } catch (error) {
          console.error('Error evaluating DSL:', error);
          // Fallback: use original if DSL evaluation fails
        }
      }

      // Convert markdown to HTML (simple conversion)
      const markdownToHtml = (md: string): string => {
        return md
          .replace(/^# (.*$)/gim, '<h1>$1</h1>')
          .replace(/^## (.*$)/gim, '<h2>$1</h2>')
          .replace(/^### (.*$)/gim, '<h3>$1</h3>')
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.*?)\*/g, '<em>$1</em>')
          .replace(/`(.*?)`/g, '<code>$1</code>')
          .replace(/\n/g, '<br>');
      };

      panel.webview.postMessage({
        command: 'updatePreview',
        data: {
          original,
          transformed: markdownToHtml(transformed)
        }
      });
    } catch (error) {
      console.error('Error previewing file:', error);
      panel.webview.postMessage({
        command: 'updatePreview',
        data: {
          original: '',
          transformed: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      });
    }
  }

  /**
   * Dispose resources
   */
  public static dispose(): void {
    if (this._currentPanel) {
      this._currentPanel.dispose();
      this._currentPanel = undefined;
    }
  }
}

