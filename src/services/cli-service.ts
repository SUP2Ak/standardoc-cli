/**
 * @doc cli_service CLI Service
 * @description Service for executing Standardoc CLI commands
 */

import * as vscode from 'vscode';
import * as path from 'node:path';
import * as fs from 'node:fs';
import { spawn, execSync } from 'node:child_process';

export interface CLIConfig {
  workspaceRoot: string;
  outputPath?: string | undefined;
  includePatterns?: string[] | undefined;
  excludePatterns?: string[] | undefined;
}

export interface CLIResult {
  success: boolean;
  output: string;
  error?: string | undefined;
}

/**
 * @doc executeCLI executeCLI
 * @description Executes a Standardoc CLI command
 * @param command The command to execute (scan, transform, watch)
 * @param config CLI configuration
 * @returns Promise with the result
 */
export async function executeCLI(
  command: 'scan' | 'transform' | 'watch',
  config: CLIConfig
): Promise<CLIResult> {
  return new Promise((resolve) => {
    const cliPath = getCLIPath();
    
    if (!cliPath) {
      resolve({
        success: false,
        output: '',
        error: 'Standardoc CLI not found. Please ensure standardoc-cli is installed or available in vendors/standardoc-cli',
      });
      return;
    }

    const args: string[] = [command];
    
    if (config.outputPath) {
      args.push('--output', config.outputPath);
    }
    
    if (config.includePatterns && config.includePatterns.length > 0) {
      config.includePatterns.forEach(pattern => {
        args.push('--include', pattern);
      });
    }
    
    if (config.excludePatterns && config.excludePatterns.length > 0) {
      config.excludePatterns.forEach(pattern => {
        args.push('--exclude', pattern);
      });
    }

    const process = spawn('node', [cliPath, ...args], {
      cwd: config.workspaceRoot,
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
      const result: CLIResult = {
        success: code === 0,
        output: stdout,
      };
      if (stderr || code !== 0) {
        result.error = stderr || `Process exited with code ${code}`;
      }
      resolve(result);
    });

    process.on('error', (error) => {
      resolve({
        success: false,
        output: stdout,
        error: error.message,
      });
    });
  });
}

/**
 * @doc getCLIPath getCLIPath
 * @description Gets the path to the Standardoc CLI
 * @description First checks vendors/standardoc-cli, then global installation
 * @returns Path to CLI or null if not found
 */
export function getCLIPath(): string | null {
  // Check vendors/standardoc-cli first
  const extensionPath = vscode.extensions.getExtension('standardoc.standardoc')?.extensionPath;
  const workspaceFolders = vscode.workspace.workspaceFolders;
  
  if (workspaceFolders && workspaceFolders.length > 0) {
    const workspaceRoot = workspaceFolders[0].uri.fsPath;
    const vendorsPath = path.join(workspaceRoot, 'vendors', 'standardoc-cli', 'dist', 'cli', 'cli.js');
    
    if (fs.existsSync(vendorsPath)) {
      return vendorsPath;
    }
  }

  // Check extension path
  if (extensionPath) {
    const vendorsPath = path.join(extensionPath, 'vendors', 'standardoc-cli', 'dist', 'cli', 'cli.js');
    if (fs.existsSync(vendorsPath)) {
      return vendorsPath;
    }
  }

  // Try global installation
  try {
    execSync('which standardoc', { stdio: 'ignore' });
    return 'standardoc';
  } catch {
    // Not found globally
  }

  return null;
}

/**
 * @doc getCanonicalDocPath getCanonicalDocPath
 * @description Gets the path to the canonical JSON document
 * @description outputPath from config is a directory (e.g., ".standardoc"), CLI converts it to full path
 * @param workspaceRoot The workspace root directory
 * @param outputPath Optional custom output directory (relative to workspace root, e.g., ".standardoc")
 * @returns Path to the canonical JSON file
 */
export function getCanonicalDocPath(workspaceRoot: string, outputPath?: string): string {
  const defaultPath = path.join(workspaceRoot, '.standardoc', 'docs.json');
  
  if (!outputPath) {
    return defaultPath;
  }
  
  // outputPath from config is a directory, append docs.json
  if (path.isAbsolute(outputPath)) {
    return path.join(outputPath, 'docs.json');
  }
  
  return path.join(workspaceRoot, outputPath, 'docs.json');
}

/**
 * @doc loadCanonicalDoc loadCanonicalDoc
 * @description Loads the canonical JSON document
 * @param workspaceRoot The workspace root directory
 * @param outputPath Optional custom output path
 * @returns The canonical document or null if not found
 */
export async function loadCanonicalDoc(
  workspaceRoot: string,
  outputPath?: string
): Promise<any | null> {
  const docPath = getCanonicalDocPath(workspaceRoot, outputPath);
  
  try {
    const content = await fs.promises.readFile(docPath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

