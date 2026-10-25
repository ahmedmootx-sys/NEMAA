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
  // If no main.jsx script tag, add it before </head>
  if (!html.includes('/src/main.jsx')) {
    html = html.replace('</head>', '    <script type="module" src="/src/main.jsx"></script>\n  </head>');
  }
  fs.writeFileSync(indexPath, html, 'utf8');
  console.log('✅ Prepared index.html with /src/main.jsx entry');
}
