/**
 * Copy i18n locale files to out directory
 */

const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'src', 'i18n', 'locales');
const outDir = path.join(__dirname, '..', 'out', 'i18n', 'locales');

// Create out directory if it doesn't exist
if (!fs.existsSync(path.join(__dirname, '..', 'out', 'i18n'))) {
  fs.mkdirSync(path.join(__dirname, '..', 'out', 'i18n'), { recursive: true });
}

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Copy locale files
const files = ['fr.json', 'en.json'];
files.forEach(file => {
  const srcPath = path.join(srcDir, file);
  const outPath = path.join(outDir, file);
  
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, outPath);
    console.log(`✓ Copied ${file}`);
  }
});

console.log('✅ i18n files copied');

