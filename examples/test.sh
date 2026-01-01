#!/bin/bash

# Script to test the Standardoc CLI
# Uses Bun to execute directly TypeScript

echo "🧪 Test the Standardoc CLI"
echo ""

# Go to the CLI directory
cd "$(dirname "$0")/.."

echo "📦 Installing dependencies..."
bun install

echo ""
echo "🔍 Scan the workspace examples..."
bun src/cli/cli.ts scan \
  --output examples/.standardoc/doc.json \
  --include "examples/**/*.lua" \
  --include "examples/**/*.cpp" \
  --include "examples/**/*.rs" \
  --include "examples/**/*.py" \
  --include "examples/**/*.ts"

echo ""
echo "📝 Transform the documentation..."
bun src/cli/cli.ts transform --output examples/.standardoc/doc.json

echo ""
echo "✔ Test completed !"
echo "📄 Check examples/docs.md to see the result"
echo "📊 Check examples/.standardoc/doc.json for the canonical JSON"

