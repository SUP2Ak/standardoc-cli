#!/usr/bin/env bun

/**
 * Script de test pour Standardoc CLI
 * Utilise Bun pour exécuter directement TypeScript
 */

import { scanWorkspace, writeCanonicalDoc, transformMarkdownFiles } from '../src/index';
import { join } from 'node:path';

const examplesDir = join(import.meta.dir, '..', 'examples');
const outputPath = join(examplesDir, '.standardoc', 'doc.json');

console.log('🧪 Test de Standardoc CLI');
console.log('');

console.log('🔍 Scan du workspace examples...');
const doc = await scanWorkspace({
  workspaceRoot: examplesDir,
  includePatterns: [
    '**/*.lua',
    '**/*.cpp',
    '**/*.rs',
    '**/*.py',
    '**/*.ts',
  ],
  excludePatterns: [
    '**/node_modules/**',
    '**/.git/**',
    '**/dist/**',
    '**/.standardoc/**',
  ],
  outputPath,
});

console.log(`✅ Trouvé ${Object.keys(doc).length} blocs documentables`);
console.log('');

console.log('💾 Écriture du JSON canonique...');
await writeCanonicalDoc(doc, outputPath);
console.log(`✅ JSON écrit dans: ${outputPath}`);
console.log('');

console.log('📝 Transformation de la documentation...');
await transformMarkdownFiles(doc, examplesDir, ['docs.md']);
console.log('✅ Transformation terminée');
console.log('');

console.log('📄 Vérifiez examples/docs.generated.md pour voir le résultat');
console.log('📊 Vérifiez examples/.standardoc/doc.json pour le JSON canonique');

