/**
 * @doc app App Component
 * @description Main React component for Standardoc documentation panel
 */

import React, { useEffect, useState } from "react";
import { ConfigEditor } from "./components/ConfigEditor";
import { PreviewView } from "./components/PreviewView";
import { TagEditor } from "./components/TagEditor";

// Type definitions for CanonicalDoc (duplicated from CLI to avoid import issues)
interface DocMeta {
  path: string;
  line: number;
  file: string;
  ext: string;
  lastEdit: string;
}

interface DocBlock {
  label: string;
  meta: DocMeta;
  [key: string]: any;
}

interface CanonicalDoc {
  [key: `doc.${string}`]: DocBlock;
}

interface VSCodeAPI {
  postMessage: (message: any) => void;
  getState: () => any;
  setState: (state: any) => void;
}

interface AppProps {
  vscode: VSCodeAPI;
}

function App({ vscode }: AppProps) {
  const [doc, setDoc] = useState<CanonicalDoc | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [translations, setTranslations] = useState<any>({});
  const [editingKey, setEditingKey] = useState<
    { key: string; filePath: string; line: number; fullKey?: string } | null
  >(null);
  const [editingTag, setEditingTag] = useState<
    { tag: string; filePath: string; line: number; blockKey: string } | null
  >(null);
  const [newTagValue, setNewTagValue] = useState("");
  const [newKeyValue, setNewKeyValue] = useState("");
  const [activeTab, setActiveTab] = useState<"docs" | "config" | "preview">("docs");
  const [config, setConfig] = useState<any>(null);
  const [fileTree, setFileTree] = useState<any[]>([]);
  const [previewContent, setPreviewContent] = useState<{ original: string; transformed: string } | null>(null);
  const [selectedFileForPreview, setSelectedFileForPreview] = useState<string | null>(null);

  // Listen to messages from VS Code
  useEffect(() => {
    console.log("🔵 App: Initialisation du composant");
    
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      console.log("🔵 App: Message reçu:", message.command, message);

      switch (message.command) {
        case "updateDoc":
          console.log("🔵 App: Mise à jour de la documentation", message.data);
          setDoc(message.data);
          setError(message.error || null);
          setLoading(false);
          break;
        case "updateTranslations":
          console.log("🔵 App: Mise à jour des traductions", message.translations);
          setTranslations(message.translations || {});
          break;
        case "updateConfig":
          console.log("🔵 App: Mise à jour de la configuration", message.data);
          setConfig(message.data);
          break;
        case "updateFileTree":
          console.log("🔵 App: Mise à jour de l'arborescence", message.data);
          setFileTree(message.data || []);
          break;
        case "updatePreview":
          console.log("🔵 App: Mise à jour de l'aperçu", message.data);
          setPreviewContent(message.data);
          break;
        default:
          console.log("🔵 App: Message non géré:", message);
      }
    };

    window.addEventListener("message", handleMessage);

    // Load initial data
    console.log("🔵 App: Envoi des commandes initiales");
    vscode.postMessage({ command: "loadDoc" });
    vscode.postMessage({ command: "getTranslations" });

    return () => {
      console.log("🔵 App: Nettoyage du composant");
      window.removeEventListener("message", handleMessage);
    };
  }, [vscode]);

  const t = (key: string, params?: Record<string, string | number>): string => {
    const keys = key.split(".");
    let value: any = translations;

    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = value[k];
      } else {
        return key;
      }
    }

    if (typeof value !== "string") {
      return key;
    }

    if (params) {
      return value.replace(/\{(\w+)\}/g, (match: string, paramKey: string) => {
        return params[paramKey]?.toString() || match;
      });
    }

    return value;
  };

  const refreshDoc = () => {
    setLoading(true);
    vscode.postMessage({ command: "refreshDoc" });
  };

  const startEditKey = (fullKey: string, block: DocBlock) => {
    // Extract base key (remove doc. prefix and any suffix)
    const baseKey = fullKey.replace(/^doc\./, "").split(".")[0];
    setEditingKey({
      key: baseKey,
      filePath: block.meta.path,
      line: block.meta.line,
      fullKey,
    });
    setNewKeyValue(baseKey);
  };

  const cancelEdit = () => {
    setEditingKey(null);
    setNewKeyValue("");
  };

  const saveKeyEdit = () => {
    if (!editingKey || !newKeyValue.trim()) {
      return;
    }

    vscode.postMessage({
      command: "updateKey",
      oldKey: editingKey.key,
      newKey: newKeyValue.trim(),
      filePath: editingKey.filePath,
      line: editingKey.line,
    });

    setEditingKey(null);
    setNewKeyValue("");
  };

  const cancelTagEdit = () => {
    setEditingTag(null);
    setNewTagValue("");
  };

  const getBlockKeys = (): string[] => {
    if (!doc) return [];
    return Object.keys(doc).sort();
  };

  const getBlock = (key: string): DocBlock | null => {
    if (!doc) return null;
    return doc[key as keyof CanonicalDoc] as DocBlock | null;
  };

  const getDuplicateGroups = (): Map<string, string[]> => {
    const groups = new Map<string, string[]>();

    if (!doc) return groups;

    for (const key of Object.keys(doc)) {
      // Extract base key (e.g., "doc.user" from "doc.user" or "doc.user.src.utils")
      const match = key.match(/^doc\.([^.]+)/);
      if (match) {
        const baseKey = match[1];
        if (!groups.has(baseKey)) {
          groups.set(baseKey, []);
        }
        groups.get(baseKey)!.push(key);
      }
    }

    // Filter to only show groups with duplicates
    const duplicateGroups = new Map<string, string[]>();
    for (const [baseKey, keys] of groups.entries()) {
      if (keys.length > 1) {
        duplicateGroups.set(baseKey, keys);
      }
    }

    return duplicateGroups;
  };

  if (loading) {
    return (
      <div className="app">
        <div className="loading">{t("app.loading")}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app">
        <div className="error">
          <h2>❌ {t("app.error")}</h2>
          <p>{error}</p>
          <button onClick={refreshDoc} className="btn-primary">
            {t("app.refresh")}
          </button>
        </div>
      </div>
    );
  }

  if (!doc || Object.keys(doc).length === 0) {
    return (
      <div className="app">
        <div className="empty">
          <h2>📚 {t("app.noDocumentation")}</h2>
          <p>{t("app.noDocumentationMessage")}</p>
          <button onClick={refreshDoc} className="btn-primary">
            {t("app.refresh")}
          </button>
        </div>
      </div>
    );
  }

  const duplicateGroups = getDuplicateGroups();
  const allKeys = getBlockKeys();

  return (
    <div className="app">
      <div className="header">
        <h2>📚 {t("app.title")}</h2>
        <div className="header-actions">
          <button onClick={refreshDoc} className="btn-secondary">
            🔄 {t("app.refresh")}
          </button>
        </div>
      </div>

      <div className="tabs">
        <button
          className={`tab ${activeTab === "docs" ? "active" : ""}`}
          onClick={() => setActiveTab("docs")}
        >
          📚 {t("app.documentation")}
        </button>
        <button
          className={`tab ${activeTab === "config" ? "active" : ""}`}
          onClick={() => setActiveTab("config")}
        >
          ⚙️ {t("app.configuration")}
        </button>
        <button
          className={`tab ${activeTab === "preview" ? "active" : ""}`}
          onClick={() => setActiveTab("preview")}
        >
          👁️ {t("app.preview")}
        </button>
      </div>

      {activeTab === "config" && (
        <div className="tab-content">
          <ConfigEditor vscode={vscode} t={t} />
        </div>
      )}

      {activeTab === "preview" && (
        <div className="tab-content">
          <PreviewView vscode={vscode} t={t} />
        </div>
      )}

      {activeTab === "docs" && (
        <div className="tab-content">
          <div className="stats">
            <span>📦 {t("app.blocksCount", { count: allKeys.length })}</span>
            {duplicateGroups.size > 0 && (
              <span className="warning">
                ⚠️ {t("app.duplicatesCount", { count: duplicateGroups.size })}
              </span>
            )}
          </div>

          {duplicateGroups.size > 0 && (
            <div className="duplicates-section">
              <h3>🔀 {t("app.duplicatesTitle")}</h3>
              <div className="duplicates-list">
                {Array.from(duplicateGroups.entries()).map(
                  ([baseKey, keys]) => {
                    const isEditing = editingKey?.key === baseKey;
                    return (
                      <div key={baseKey} className="duplicate-group">
                        <div className="duplicate-header">
                          <strong>{baseKey}</strong>
                          <span className="count">
                            {t("app.occurrences", { count: keys.length })}
                          </span>
                        </div>
                        {isEditing
                          ? (
                            <div className="edit-key-form">
                              <input
                                type="text"
                                value={newKeyValue}
                                onChange={(e) => setNewKeyValue(e.target.value)}
                                placeholder={t("app.newKey")}
                                className="key-input"
                              />
                              <div className="edit-actions">
                                <button
                                  onClick={saveKeyEdit}
                                  className="btn-primary"
                                >
                                  {t("app.save")}
                                </button>
                                <button
                                  onClick={cancelEdit}
                                  className="btn-secondary"
                                >
                                  {t("app.cancel")}
                                </button>
                              </div>
                            </div>
                          )
                          : (
                            <div className="duplicate-keys">
                              {keys.map((key) => {
                                const block = getBlock(key);
                                const isEditingThis =
                                  editingKey?.fullKey === key;

                                if (isEditingThis && block) {
                                  return (
                                    <div key={key} className="edit-key-form">
                                      <input
                                        type="text"
                                        value={newKeyValue}
                                        onChange={(e) =>
                                          setNewKeyValue(e.target.value)}
                                        placeholder={t("app.newKey")}
                                        className="key-input"
                                      />
                                      <div className="edit-actions">
                                        <button
                                          onClick={saveKeyEdit}
                                          className="btn-primary"
                                        >
                                          {t("app.save")}
                                        </button>
                                        <button
                                          onClick={cancelEdit}
                                          className="btn-secondary"
                                        >
                                          {t("app.cancel")}
                                        </button>
                                      </div>
                                    </div>
                                  );
                                }

                                return (
                                  <div
                                    key={key}
                                    className={`duplicate-item ${
                                      selectedKey === key ? "selected" : ""
                                    }`}
                                  >
                                    <div
                                      onClick={() => setSelectedKey(key)}
                                      style={{ flex: 1 }}
                                    >
                                      <code>{key}</code>
                                      {block && (
                                        <span className="file-info">
                                          📄 {block.meta.file} ({t("app.line")}
                                          {" "}
                                          {block.meta.line})
                                        </span>
                                      )}
                                    </div>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (block) {
                                          startEditKey(key, block);
                                        }
                                      }}
                                      className="btn-edit-small"
                                      title={t("app.editInSource")}
                                    >
                                      ✏️
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                      </div>
                    );
                  },
                )}
              </div>
            </div>
          )}

          <div className="blocks-section">
            <h3>📋 {t("app.allBlocks")}</h3>
            <div className="blocks-list">
              {allKeys.map((key) => {
                const block = getBlock(key);
                if (!block) return null;

                const isDuplicate = duplicateGroups.has(
                  key.replace(/^doc\.([^.]+).*/, "$1"),
                );

                return (
                  <div
                    key={key}
                    className={`block-item ${
                      selectedKey === key ? "selected" : ""
                    } ${isDuplicate ? "duplicate" : ""}`}
                    onClick={() => setSelectedKey(key)}
                  >
                    <div className="block-header">
                      <code className="block-key">{key}</code>
                      {isDuplicate && (
                        <span className="duplicate-badge">
                          {t("app.duplicate")}
                        </span>
                      )}
                    </div>
                    <div className="block-info">
                      <span>📝 {block.label}</span>
                      <span>📄 {block.meta.file}</span>
                      <span>📍 {t("app.line")} {block.meta.line}</span>
                    </div>
                    {selectedKey === key && (
                      <div className="block-details">
                        <div className="detail-row">
                          <strong>{t('app.path')}:</strong>{" "}
                          <code>{block.meta.path}</code>
                        </div>
                        <div className="detail-row">
                          <strong>{t('app.file')}:</strong> {block.meta.file}
                        </div>
                        <div className="detail-row">
                          <strong>{t('app.extension')}:</strong> {block.meta.ext}
                        </div>
                        <div className="detail-row">
                          <strong>{t('app.lastEdit')}:</strong>{" "}
                          {block.meta.lastEdit}
                        </div>
                        <div className="detail-row">
                          <strong>{t('app.tags')}:</strong>
                          <ul>
                            {Object.keys(block)
                              .filter((k) => k !== "label" && k !== "meta")
                              .map((tag) => {
                                const isEditingTag = editingTag?.tag === tag && editingTag?.blockKey === key;
                                const tagValue = typeof block[tag] === 'string' ? block[tag] : '';
                                return (
                                  <li key={tag} className="tag-item">
                                    {isEditingTag ? (
                                      <TagEditor
                                        vscode={vscode}
                                        t={t}
                                        tagName={tag}
                                        tagValue={tagValue}
                                        filePath={block.meta.path}
                                        line={block.meta.line}
                                        blockKey={key}
                                        onSave={(newValue) => {
                                          if (editingTag) {
                                            vscode.postMessage({
                                              command: 'updateTag',
                                              oldTag: editingTag.tag,
                                              newTag: newValue,
                                              filePath: editingTag.filePath,
                                              line: editingTag.line
                                            });
                                            setEditingTag(null);
                                            setNewTagValue('');
                                          }
                                        }}
                                        onCancel={cancelTagEdit}
                                      />
                                    ) : (
                                      <div className="tag-display">
                                        <code>@{tag}</code>
                                        {tagValue && <span className="tag-value">{tagValue}</span>}
                                        <button
                                          onClick={() => {
                                            setEditingTag({ tag, filePath: block.meta.path, line: block.meta.line, blockKey: key });
                                            setNewTagValue(tagValue);
                                          }}
                                          className="btn-edit-tag"
                                          title={t('app.edit')}
                                        >
                                          ✏️
                                        </button>
                                      </div>
                                    )}
                                  </li>
                                );
                              })}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
