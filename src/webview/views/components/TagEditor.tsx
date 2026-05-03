/**
 * @doc tag_editor Tag Editor Component
 * @description Advanced tag editor with variadic support and type detection
 */

import React, { useState, useEffect } from 'react';

interface VSCodeAPI {
  postMessage: (message: any) => void;
}

interface TagPart {
  type: 'key' | 'type' | 'description';
  value: string;
  fieldType: 'string' | 'number' | 'int' | 'float' | 'longstring';
}

interface ParsedTag {
  name: string;
  parts: TagPart[];
  format: 'ts' | 'simple'; // TS format: @param {type} key description, Simple: @param key type description
}

interface TagEditorProps {
  vscode: VSCodeAPI;
  t: (key: string, params?: Record<string, string | number>) => string;
  tagName: string;
  tagValue: string;
  filePath: string;
  line: number;
  blockKey: string;
  onSave: (newValue: string) => void;
  onCancel: () => void;
}

/**
 * Parse a tag value to detect format and extract parts
 */
function parseTag(tagName: string, tagValue: string): ParsedTag {
  const trimmed = tagValue.trim();
  
  if (!trimmed) {
    // Empty value, default structure based on tag name
    if (tagName === 'param' || tagName === 'return' || tagName === 'returns') {
      return {
        name: tagName,
        format: 'simple',
        parts: [
          { type: 'key', value: '', fieldType: 'string' },
          { type: 'type', value: '', fieldType: 'string' },
          { type: 'description', value: '', fieldType: 'longstring' }
        ]
      };
    }
    return {
      name: tagName,
      format: 'simple',
      parts: [
        { type: 'description', value: '', fieldType: 'longstring' }
      ]
    };
  }
  
  // Detect TS format: @param {number} a First number
  const tsFormatMatch = trimmed.match(/^\{([^}]+)\}\s+(\w+)(?:\s+(.+))?$/);
  if (tsFormatMatch) {
    return {
      name: tagName,
      format: 'ts',
      parts: [
        { type: 'type', value: tsFormatMatch[1], fieldType: 'string' },
        { type: 'key', value: tsFormatMatch[2], fieldType: 'string' },
        { type: 'description', value: tsFormatMatch[3] || '', fieldType: 'longstring' }
      ]
    };
  }
  
  // Detect simple format: @param a number First number
  // Split by spaces, first is key, second might be type, rest is description
  const parts = trimmed.split(/\s+/);
  if (parts.length >= 1) {
    const parsedParts: TagPart[] = [];
    
    // First part is always key
    parsedParts.push({
      type: 'key',
      value: parts[0] || '',
      fieldType: 'string'
    });
    
    // Second part might be type (if it's a common type name)
    const commonTypes = ['number', 'string', 'boolean', 'object', 'array', 'int', 'float', 'void', 'any', 'unknown'];
    if (parts.length >= 2 && commonTypes.includes(parts[1].toLowerCase())) {
      parsedParts.push({
        type: 'type',
        value: parts[1],
        fieldType: 'string'
      });
      
      // Rest is description
      if (parts.length > 2) {
        parsedParts.push({
          type: 'description',
          value: parts.slice(2).join(' '),
          fieldType: 'longstring'
        });
      }
    } else {
      // All remaining parts are description
      if (parts.length > 1) {
        parsedParts.push({
          type: 'description',
          value: parts.slice(1).join(' '),
          fieldType: 'longstring'
        });
      }
    }
    
    return {
      name: tagName,
      format: 'simple',
      parts: parsedParts
    };
  }
  
  // Fallback: treat entire value as description
  return {
    name: tagName,
    format: 'simple',
    parts: [
      { type: 'description', value: trimmed, fieldType: 'longstring' }
    ]
  };
}

/**
 * Serialize parsed tag back to string
 */
function serializeTag(parsed: ParsedTag): string {
  if (parsed.format === 'ts') {
    const type = parsed.parts.find(p => p.type === 'type')?.value || '';
    const key = parsed.parts.find(p => p.type === 'key')?.value || '';
    const desc = parsed.parts.find(p => p.type === 'description')?.value || '';
    
    if (type && key) {
      return `{${type}} ${key}${desc ? ' ' + desc : ''}`;
    }
    return `${key}${desc ? ' ' + desc : ''}`;
  } else {
    // Simple format
    const key = parsed.parts.find(p => p.type === 'key')?.value || '';
    const type = parsed.parts.find(p => p.type === 'type')?.value || '';
    const desc = parsed.parts.find(p => p.type === 'description')?.value || '';
    
    const parts = [key, type, desc].filter(Boolean);
    return parts.join(' ');
  }
}

export function TagEditor({ vscode, t, tagName, tagValue, filePath, line, blockKey, onSave, onCancel }: TagEditorProps) {
  const [parsed, setParsed] = useState<ParsedTag>(() => parseTag(tagName, tagValue));
  const [format, setFormat] = useState<'ts' | 'simple'>(parsed.format);

  const updatePart = (index: number, value: string) => {
    const newParts = [...parsed.parts];
    if (newParts[index]) {
      newParts[index] = { ...newParts[index], value };
      setParsed({ ...parsed, parts: newParts });
    }
  };

  const addPart = (type: 'key' | 'type' | 'description', afterIndex?: number) => {
    const newParts = [...parsed.parts];
    const newPart: TagPart = {
      type,
      value: '',
      fieldType: type === 'description' ? 'longstring' : type === 'type' ? 'string' : 'string'
    };
    
    if (afterIndex !== undefined) {
      newParts.splice(afterIndex + 1, 0, newPart);
    } else {
      newParts.push(newPart);
    }
    
    setParsed({ ...parsed, parts: newParts });
  };

  const removePart = (index: number) => {
    const newParts = parsed.parts.filter((_, i) => i !== index);
    if (newParts.length > 0) {
      setParsed({ ...parsed, parts: newParts });
    }
  };

  const handleSave = () => {
    const serialized = serializeTag({ ...parsed, format });
    onSave(serialized);
  };

  const handleFormatChange = (newFormat: 'ts' | 'simple') => {
    setFormat(newFormat);
    // Re-parse with new format
    const currentValue = serializeTag(parsed);
    setParsed(parseTag(tagName, currentValue));
  };

  return (
    <div className="tag-editor">
      <div className="tag-editor-header">
        <h4>✏️ {t('tagEditor.editTag', { tag: `@${tagName}` })}</h4>
        <div className="format-selector">
          <label>
            <input
              type="radio"
              checked={format === 'ts'}
              onChange={() => handleFormatChange('ts')}
            />
            TypeScript ({`{type}`})
          </label>
          <label>
            <input
              type="radio"
              checked={format === 'simple'}
              onChange={() => handleFormatChange('simple')}
            />
            Simple
          </label>
        </div>
      </div>

      <div className="tag-parts">
        {parsed.parts.map((part, index) => (
          <div key={index} className="tag-part">
            <div className="tag-part-header">
              <span className="tag-part-type">{part.type}</span>
              <span className="tag-part-field-type">({part.fieldType})</span>
              <button
                onClick={() => removePart(index)}
                className="btn-remove-part"
                title={t('tagEditor.remove')}
              >
                ➖
              </button>
            </div>
            {part.fieldType === 'longstring' ? (
              <textarea
                value={part.value}
                onChange={(e) => updatePart(index, e.target.value)}
                placeholder={t(`tagEditor.placeholder.${part.type}`)}
                className="tag-input-long"
                rows={3}
              />
            ) : (
              <input
                type={part.fieldType === 'number' || part.fieldType === 'int' || part.fieldType === 'float' ? 'number' : 'text'}
                value={part.value}
                onChange={(e) => updatePart(index, e.target.value)}
                placeholder={t(`tagEditor.placeholder.${part.type}`)}
                className="tag-input"
              />
            )}
          </div>
        ))}
      </div>

      <div className="tag-editor-actions">
        <button
          onClick={() => addPart('key')}
          className="btn-add-part"
          title={t('tagEditor.addKey')}
        >
          ➕ {t('tagEditor.addKey')}
        </button>
        <button
          onClick={() => addPart('type')}
          className="btn-add-part"
          title={t('tagEditor.addType')}
        >
          ➕ {t('tagEditor.addType')}
        </button>
        <button
          onClick={() => addPart('description')}
          className="btn-add-part"
          title={t('tagEditor.addDescription')}
        >
          ➕ {t('tagEditor.addDescription')}
        </button>
      </div>

      <div className="tag-preview">
        <strong>{t('tagEditor.preview')}:</strong>
        <code>@{tagName} {serializeTag({ ...parsed, format })}</code>
      </div>

      <div className="tag-editor-buttons">
        <button onClick={handleSave} className="btn-primary">
          {t('app.save')}
        </button>
        <button onClick={onCancel} className="btn-secondary">
          {t('app.cancel')}
        </button>
      </div>
    </div>
  );
}

