import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const assetsDir = path.join(rootDir, 'assets');
const docsDir = path.join(rootDir, 'docs');
const docsAssetsDir = path.join(docsDir, 'assets');

// Helper to copy directory recursively
function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Clean and sync
console.log('--- Syncing Build Artifacts ---');

// 1. Ensure dist/.nojekyll
fs.writeFileSync(path.join(distDir, '.nojekyll'), '');
fs.writeFileSync(path.join(rootDir, '.nojekyll'), '');
fs.writeFileSync(path.join(docsDir, '.nojekyll'), '');

// 2. Clean old assets
if (fs.existsSync(assetsDir)) {
  fs.rmSync(assetsDir, { recursive: true, force: true });
}
if (fs.existsSync(docsAssetsDir)) {
  fs.rmSync(docsAssetsDir, { recursive: true, force: true });
}

// 3. Copy dist/assets to assets/ and docs/assets/
if (fs.existsSync(path.join(distDir, 'assets'))) {
  copyDir(path.join(distDir, 'assets'), assetsDir);
  copyDir(path.join(distDir, 'assets'), docsAssetsDir);
}

// 4. Copy dist/index.html to root and docs
if (fs.existsSync(path.join(distDir, 'index.html'))) {
  fs.copyFileSync(path.join(distDir, 'index.html'), path.join(rootDir, 'index.html'));
  fs.copyFileSync(path.join(distDir, 'index.html'), path.join(docsDir, 'index.html'));
}

console.log('✅ Successfully synced dist to root assets/, docs/, and index.html');
