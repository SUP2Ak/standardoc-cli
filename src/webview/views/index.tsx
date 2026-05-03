/**
 * @doc webview_index Webview Entry Point
 * @description Entry point for React webview
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/index.css';

// Get VS Code API
declare function acquireVsCodeApi(): {
  postMessage: (message: any) => void;
  getState: () => any;
  setState: (state: any) => void;
};

const vscode = acquireVsCodeApi();

// Render React app
console.log('🔵 Webview: Initialisation du React app');
const container = document.getElementById('root');
if (container) {
  console.log('🔵 Webview: Container trouvé, création du root React');
  const root = createRoot(container);
  root.render(<App vscode={vscode} />);
  console.log('🔵 Webview: React app rendu');
} else {
  console.error('❌ Webview: Container #root non trouvé!');
}

