#!/usr/bin/env bun

/**
 * Test script for Standardoc CLI
 * Uses Bun to execute directly TypeScript
 */

import { scanWorkspace, writeCanonicalDoc, transformMarkdownFiles } from '../src/index';
import { join } from 'node:path';
import { existsSync } from 'node:fs';

// @ts-ignore
const examplesDir = join(import.meta.dir, '..', 'examples');
const outputPath = join(examplesDir, '.standardoc', 'doc.json');

// @ts-ignore - Bun provides test and expect globally
test('Standardoc CLI - Full workflow', async () => {
  console.log('🧪 Testing Standardoc CLI');
  console.log('');

  let doc;
  try {
    console.log('🔍 Scanning workspace examples...');
    doc = await scanWorkspace({
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

    console.log(`✅ Found ${Object.keys(doc).length} documentable blocks`);
    console.log('');
    
    // Assert that we found some documentable blocks
    // @ts-ignore - Bun provides expect globally
    expect(Object.keys(doc).length).toBeGreaterThan(0);
  } catch (error) {
    console.error('❌ Error during workspace scan:');
    console.error(error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.stack) {
      console.error(error.stack);
    }
    throw error;
  }

  try {
    console.log('💾 Writing canonical JSON...');
    await writeCanonicalDoc(doc, outputPath);
    console.log(`✅ JSON written to: ${outputPath}`);
    console.log('');
    
    // Assert that the JSON file was created
    // @ts-ignore - Bun provides expect globally
    expect(existsSync(outputPath)).toBe(true);
  } catch (error) {
    console.error('❌ Error during JSON writing:');
    console.error(error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.stack) {
      console.error(error.stack);
    }
    throw error;
  }

  try {
    console.log('📝 Transforming documentation...');
    await transformMarkdownFiles(doc, examplesDir, ['docs.md']);
    console.log('✅ Transformation completed');
    console.log('');
    
    // Assert that the generated file was created
    const generatedPath = join(examplesDir, 'docs.generated.md');
    // @ts-ignore - Bun provides expect globally
    expect(existsSync(generatedPath)).toBe(true);
  } catch (error) {
    console.error('❌ Error during transformation:');
    console.error(error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.stack) {
      console.error(error.stack);
    }
    throw error;
  }

  console.log('📄 Check examples/docs.generated.md for the result');
  console.log('📊 Check examples/.standardoc/doc.json for the canonical JSON');
});

