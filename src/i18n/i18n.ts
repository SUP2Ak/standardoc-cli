/**
 * @doc i18n Internationalization
 * @description Internationalization system for Standardoc extension
 */

import * as vscode from 'vscode';
import * as fs from 'node:fs';
import * as path from 'node:path';

type Locale = 'fr' | 'en';
type Translations = Record<string, any>;

let currentLocale: Locale = 'en';
let translations: Translations = {};

/**
 * Get VS Code language
 */
function getVSCodeLanguage(): Locale {
  const config = vscode.workspace.getConfiguration();
  const locale = config.get<string>('locale') || 
                vscode.env.language || 
                Intl.DateTimeFormat().resolvedOptions().locale;
  
  // Extract language code (e.g., 'fr-FR' -> 'fr')
  const langCode = locale.split('-')[0].toLowerCase();
  
  return langCode === 'fr' ? 'fr' : 'en';
}

/**
 * Load translations from JSON file
 */
function loadTranslations(locale: Locale): Translations {
  const extensionPath = vscode.extensions.getExtension('standardoc.standardoc')?.extensionPath;
  if (!extensionPath) {
    return {};
  }

  const localePath = path.join(extensionPath, 'out', 'i18n', 'locales', `${locale}.json`);
  
  try {
    const content = fs.readFileSync(localePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Failed to load locale ${locale}:`, error);
    // Fallback to English
    if (locale !== 'en') {
      return loadTranslations('en');
    }
    return {};
  }
}

/**
 * Initialize i18n system
 */
export function initI18n(): void {
  currentLocale = getVSCodeLanguage();
  translations = loadTranslations(currentLocale);
  console.log(`Standardoc: Loaded locale ${currentLocale}`);
}

/**
 * Get translation by key
 * Supports nested keys with dot notation (e.g., "app.title")
 */
export function t(key: string, params?: Record<string, string | number>): string {
  const keys = key.split('.');
  let value: any = translations;
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      // Key not found, return the key itself
      console.warn(`Translation key not found: ${key}`);
      return key;
    }
  }
  
  if (typeof value !== 'string') {
    return key;
  }
  
  // Replace parameters
  if (params) {
    return value.replace(/\{(\w+)\}/g, (match, paramKey) => {
      return params[paramKey]?.toString() || match;
    });
  }
  
  return value;
}

/**
 * Get current locale
 */
export function getLocale(): Locale {
  return currentLocale;
}

