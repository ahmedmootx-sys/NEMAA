import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const indexPath = path.join(rootDir, 'index.html');

if (fs.existsSync(indexPath)) {
  let html = fs.readFileSync(indexPath, 'utf8');
  // Replace compiled script with dev entry
  html = html.replace(/<script type="module" crossorigin src="[./assets/]*index-.*?\.js"><\/script>/g, '<script type="module" src="/src/main.jsx"></script>');
  // Remove compiled css link if present
  html = html.replace(/<link rel="stylesheet" crossorigin href="[./assets/]*index-.*?\.css">/g, '');
  // Remove stale <link rel="modulepreload"> tags left by previous builds. Vite treats them as extra
  // entry files (so old hashed chunks keep getting rebuilt and the list grows with every build),
  // and links to files that no longer exist cause 404s. Vite regenerates the correct ones itself.
  html = html.replace(/[ \t]*<link rel="modulepreload"[^>]*>[ \t]*\r?\n?/g, '');
  // If no main.jsx script tag, add it before </head>
  if (!html.includes('/src/main.jsx')) {
    html = html.replace('</head>', '    <script type="module" src="/src/main.jsx"></script>\n  </head>');
  }
  // Reset hashed brand icon links back to canonical ./brand/ paths
  html = html.replace(/(\.\/)?assets\/icon-192-.*?\.png/g, './brand/icon-192.png');
  html = html.replace(/(\.\/)?assets\/icon-512-.*?\.png/g, './brand/icon-512.png');
  html = html.replace(/(\.\/)?assets\/logo-calligraphy-.*?\.jpg/g, './brand/logo-calligraphy.jpg');

  fs.writeFileSync(indexPath, html, 'utf8');
  console.log('✅ Prepared index.html with /src/main.jsx entry and clean brand assets');
}
