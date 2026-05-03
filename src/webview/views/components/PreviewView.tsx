/**
 * @doc preview_view Preview View Component
 * @description Component for previewing MD files with DSL transformation
 */

import React, { useState, useEffect } from 'react';

interface VSCodeAPI {
  postMessage: (message: any) => void;
}

interface PreviewViewProps {
  vscode: VSCodeAPI;
  t: (key: string, params?: Record<string, string | number>) => string;
}

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
}

export function PreviewView({ vscode, t }: PreviewViewProps) {
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ original: string; transformed: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log('🔵 PreviewView: Initialisation');
    
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      console.log('🔵 PreviewView: Message reçu:', message.command, message);
      
      switch (message.command) {
        case 'updateFileTree':
          console.log('🔵 PreviewView: Arborescence reçue:', message.data);
          setFileTree(message.data);
          break;
        case 'updatePreview':
          console.log('🔵 PreviewView: Aperçu reçu:', message.data);
          setPreview(message.data);
          setLoading(false);
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    console.log('🔵 PreviewView: Envoi de la commande loadFileTree');
    vscode.postMessage({ command: 'loadFileTree' });
    
    return () => {
      console.log('🔵 PreviewView: Nettoyage');
      window.removeEventListener('message', handleMessage);
    };
  }, [vscode]);

  const handleFileSelect = (filePath: string) => {
    if (filePath.endsWith('.md') || filePath.endsWith('.mdx')) {
      setSelectedFile(filePath);
      setLoading(true);
      vscode.postMessage({
        command: 'previewFile',
        filePath
      });
    }
  };

  const renderTree = (nodes: FileNode[], depth = 0): React.ReactNode => {
    return nodes.map((node) => (
      <div key={node.path} style={{ paddingLeft: `${depth * 16}px` }}>
        <div
          className={`tree-item ${node.type} ${selectedFile === node.path ? 'selected' : ''}`}
          onClick={() => node.type === 'file' && handleFileSelect(node.path)}
        >
          {node.type === 'directory' ? '📁' : '📄'} {node.name}
        </div>
        {node.children && node.children.length > 0 && (
          <div className="tree-children">
            {renderTree(node.children, depth + 1)}
          </div>
        )}
      </div>
    ));
  };

  return (
    <div className="preview-view">
      <div className="preview-layout">
        <div className="preview-sidebar">
          <h3>{t('preview.files')}</h3>
          <div className="file-tree">
            {fileTree.length > 0 ? (
              renderTree(fileTree)
            ) : (
              <div className="empty">{t('preview.noFiles')}</div>
            )}
          </div>
        </div>
        
        <div className="preview-content">
          {loading ? (
            <div className="loading">{t('app.loading')}</div>
          ) : preview ? (
            <div className="preview-comparison">
              <div className="preview-panel">
                <h3>{t('preview.original')}</h3>
                <pre className="preview-code">{preview.original}</pre>
              </div>
              <div className="preview-panel">
                <h3>{t('preview.transformed')}</h3>
                <div className="preview-markdown" dangerouslySetInnerHTML={{ __html: preview.transformed }} />
              </div>
            </div>
          ) : (
            <div className="empty">{t('preview.selectFile')}</div>
          )}
        </div>
      </div>
    </div>
  );
}

