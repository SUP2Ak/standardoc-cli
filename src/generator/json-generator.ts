/**
 * @doc json_generator Canonical JSON Generator
 * @description Transforms DocBlocks into canonical JSON structure with doc.<key> keys
 */

import type { DocBlock, CanonicalDoc } from '../types/index';

/**
 * @doc generateCanonicalDoc generateCanonicalDoc
 * @description Generates canonical JSON from a list of DocBlocks
 * @description Creates doc.<key> structure from blocks with their metadata keys
 * @param blocks Array of documentable blocks to transform
 * @returns Canonical document object with doc.<key> structure
 * @throws Error if duplicate keys are found
 */
export function generateCanonicalDoc(blocks: DocBlock[]): CanonicalDoc {
  const canonical: CanonicalDoc = {};

  for (const block of blocks) {
    const meta = block.meta as typeof block.meta & { key?: string };
    const key = meta.key || block.label;
    const docKey = `doc.${key}` as const;

    if (canonical[docKey]) {
      throw new Error(
        `Duplicate key: ${docKey}. The label "${key}" is already used.`
      );
    }

    canonical[docKey] = block;
  }

  return canonical;
}

/**
 * @doc serializeCanonicalDoc serializeCanonicalDoc
 * @description Serializes canonical document to JSON string
 * @param doc The canonical document to serialize
 * @returns Formatted JSON string
 */
export function serializeCanonicalDoc(doc: CanonicalDoc): string {
  return JSON.stringify(doc, null, 2);
}

/**
 * @doc writeCanonicalDoc writeCanonicalDoc
 * @description Writes canonical document to a file
 * @description Creates directory if it doesn't exist
 * @param doc The canonical document to write
 * @param outputPath The file path to write to
 */
export async function writeCanonicalDoc(
  doc: CanonicalDoc,
  outputPath: string
): Promise<void> {
  const fs = await import('node:fs/promises');
  const path = await import('node:path');

  const dir = path.dirname(outputPath);
  await fs.mkdir(dir, { recursive: true });

  const content = serializeCanonicalDoc(doc);
  await fs.writeFile(outputPath, content, 'utf-8');
}
