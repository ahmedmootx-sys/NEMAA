import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    react(),
    {
      name: 'html-transform',
      transformIndexHtml(html, { server }) {
        if (server) {
          // When running in Vite dev server, replace compiled bundle with raw dev entry
          return html
            .replace(/<script type="module" crossorigin src="[./assets/]*index-.*?\.js"><\/script>/, '<script type="module" src="/src/main.jsx"></script>')
            .replace(/<link rel="stylesheet" crossorigin href="[./assets/]*index-.*?\.css">/, '');
        }
        return html;
      }
    }
  ],
})
