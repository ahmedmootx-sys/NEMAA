import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const docsDir = path.join(rootDir, 'docs');
const assetsDir = path.join(rootDir, 'assets');
const docsAssetsDir = path.join(docsDir, 'assets');

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    for (const item of fs.readdirSync(src)) {
      copyRecursive(path.join(src, item), path.join(dest, item));
    }
  } else {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

console.log('--- Syncing Build Artifacts ---');

// 1. Fix manifest link in dist/index.html to point directly to ./manifest.json at root
const distIndexPath = path.join(distDir, 'index.html');
if (fs.existsSync(distIndexPath)) {
  let html = fs.readFileSync(distIndexPath, 'utf8');
  // Normalize manifest path to ./manifest.json
  html = html.replace(/<link rel="manifest" href="[^"]*"\s*\/?>/g, '<link rel="manifest" href="./manifest.json" />');
  fs.writeFileSync(distIndexPath, html, 'utf8');
  console.log('✅ Normalized manifest href to ./manifest.json in dist/index.html');
}

// 2. Ensure dist/brand is mirrored inside dist/assets/brand as a fallback
const distBrand = path.join(distDir, 'brand');
const distAssetsBrand = path.join(distDir, 'assets', 'brand');
if (fs.existsSync(distBrand)) {
  copyRecursive(distBrand, distAssetsBrand);
}

// 3. Ensure .nojekyll in dist, root, docs
fs.writeFileSync(path.join(distDir, '.nojekyll'), '');
fs.writeFileSync(path.join(rootDir, '.nojekyll'), '');
fs.writeFileSync(path.join(docsDir, '.nojekyll'), '');

// 4. Clean old assets
if (fs.existsSync(assetsDir)) fs.rmSync(assetsDir, { recursive: true, force: true });
if (fs.existsSync(docsAssetsDir)) fs.rmSync(docsAssetsDir, { recursive: true, force: true });

// 5. Copy all dist output to docs/ and root
if (fs.existsSync(distDir)) {
  const distItems = fs.readdirSync(distDir);
  for (const item of distItems) {
    const srcPath = path.join(distDir, item);
    const destDocsPath = path.join(docsDir, item);
    const destRootPath = path.join(rootDir, item);

    // Sync to docs/
    copyRecursive(srcPath, destDocsPath);

    // Sync to root
    copyRecursive(srcPath, destRootPath);
  }
}

console.log('✅ Successfully synced all dist artifacts (manifest, sw, brand, assets, html) to root and docs/');
