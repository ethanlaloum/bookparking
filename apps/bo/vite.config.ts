import { fileURLToPath, URL } from 'node:url';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@front': fileURLToPath(new URL('../front/src', import.meta.url)) },
    // Les fichiers empruntés au front résolvent leurs paquets depuis
    // apps/front/node_modules : une seule copie de chaque singleton, ou le
    // contexte de React, du routeur ou d'i18next se dédouble.
    dedupe: ['react', 'react-dom', 'react-router-dom', 'react-redux', 'react-i18next', 'i18next'],
  },
  server: {
    port: 5174,
    strictPort: true,
    // Même montage que le site : l'api ne pose aucun en-tête CORS, le proxy
    // fait passer ses appels pour same-origin. En production, c'est Caddy.
    proxy: {
      '/api': {
        target: process.env.VITE_API_TARGET ?? 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/u, ''),
      },
    },
  },
});
