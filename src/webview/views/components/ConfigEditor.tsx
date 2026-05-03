/**
 * @doc config_editor Config Editor Component
 * @description Component for editing .standardoc/settings.json configuration
 */

import React, { useState, useEffect } from 'react';

interface VSCodeAPI {
  postMessage: (message: any) => void;
}

interface StandardocConfig {
  docTag?: string;
  commentPatterns?: Record<string, any>;
  transform?: {
    entry?: string;
    output?: string;
  };
}

interface ConfigEditorProps {
  vscode: VSCodeAPI;
  t: (key: string, params?: Record<string, string | number>) => string;
}

export function ConfigEditor({ vscode, t }: ConfigEditorProps) {
  const [config, setConfig] = useState<StandardocConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('🔵 ConfigEditor: Initialisation');
    
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      console.log('🔵 ConfigEditor: Message reçu:', message.command, message);
      
      switch (message.command) {
        case 'updateConfig':
          console.log('🔵 ConfigEditor: Configuration reçue:', message.data);
          setConfig(message.data);
          setLoading(false);
          setError(null);
          break;
        case 'configError':
          console.error('🔵 ConfigEditor: Erreur:', message.error);
          setError(message.error);
          setLoading(false);
          break;
        case 'configSaved':
          console.log('🔵 ConfigEditor: Configuration sauvegardée');
          setSaving(false);
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    console.log('🔵 ConfigEditor: Envoi de la commande loadConfig');
    vscode.postMessage({ command: 'loadConfig' });
    
    return () => {
      console.log('🔵 ConfigEditor: Nettoyage');
      window.removeEventListener('message', handleMessage);
    };
  }, [vscode]);

  const handleSave = () => {
    if (!config) return;
    
    setSaving(true);
    vscode.postMessage({
      command: 'saveConfig',
      config
    });
  };

  const updateConfig = (updates: Partial<StandardocConfig>) => {
    setConfig(prev => prev ? { ...prev, ...updates } : null);
  };

  if (loading) {
    return <div className="loading">{t('app.loading')}</div>;
  }

  if (error) {
    return (
      <div className="error">
        <p>{error}</p>
        <button onClick={() => vscode.postMessage({ command: 'loadConfig' })} className="btn-primary">
          {t('app.refresh')}
        </button>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="empty">
        <p>{t('app.noConfig')}</p>
        <button
          onClick={() => vscode.postMessage({ command: 'initConfig' })}
          className="btn-primary"
        >
          {t('app.createConfig')}
        </button>
      </div>
    );
  }

  return (
    <div className="config-editor">
      <div className="config-section">
        <h3>{t('config.docTag')}</h3>
        <input
          type="text"
          value={config.docTag || 'doc'}
          onChange={(e) => updateConfig({ docTag: e.target.value })}
          placeholder="doc"
          className="config-input"
        />
        <p className="config-help">{t('config.docTagHelp')}</p>
      </div>

      <div className="config-section">
        <h3>{t('config.transform')}</h3>
        <div className="config-row">
          <label>{t('config.entry')}</label>
          <input
            type="text"
            value={config.transform?.entry || ''}
            onChange={(e) => updateConfig({
              transform: { ...config.transform, entry: e.target.value }
            })}
            placeholder="./docs-dev"
            className="config-input"
          />
        </div>
        <div className="config-row">
          <label>{t('config.output')}</label>
          <input
            type="text"
            value={config.transform?.output || ''}
            onChange={(e) => updateConfig({
              transform: { ...config.transform, output: e.target.value }
            })}
            placeholder="./docs"
            className="config-input"
          />
        </div>
        <p className="config-help">{t('config.transformHelp')}</p>
      </div>

      <div className="config-section">
        <h3>{t('config.locale')}</h3>
        <select
          value={config.locale || 'auto'}
          onChange={(e) => updateConfig({ locale: e.target.value })}
          className="config-select"
        >
          <option value="auto">{t('config.localeAuto')}</option>
          <option value="fr">{t('config.localeFr')}</option>
          <option value="en">{t('config.localeEn')}</option>
        </select>
        <p className="config-help">{t('config.localeHelp')}</p>
      </div>

      <div className="config-actions">
        <button
          onClick={handleSave}
          className="btn-primary"
          disabled={saving}
        >
          {saving ? t('app.saving') : t('app.save')}
        </button>
        <button
          onClick={() => vscode.postMessage({ command: 'loadConfig' })}
          className="btn-secondary"
        >
          {t('app.refresh')}
        </button>
      </div>
    </div>
  );
}

