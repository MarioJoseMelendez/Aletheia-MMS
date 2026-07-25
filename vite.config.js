// ====================================================================
// ====================================================================
// {1} VITE CONFIGURATION — ALETHEIA
// ====================================================================
// Multi-page app with 3 entry points:
// - display: fullscreen exhibition screen
// - control: interactive control panel
// - admin: administration panel
// Proxies /api and /ws to the Cloudflare Worker backend (or local fallback).
// ====================================================================

import { defineConfig } from 'vite';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, '..');

// Demo data fallback for direct Vite development
const DEMO_MOLECULES = [
  {
    id: 'hemoglobin-demo',
    name: 'Hemoglobina',
    description: 'Proteína tetramérica encargada del transporte de oxígeno en los glóbulos rojos.',
    category: 'Proteínas',
    pdbFile: 'demo_1A3N.pdb',
    audioFile: null,
    createdAt: new Date().toISOString(),
    atomCount: 4779
  },
  {
    id: 'dna-demo',
    name: 'ADN (Doble Hélice B-DNA)',
    description: 'Estructura de doble hélice de ácido desoxirribonucleico conteniendo la información genética.',
    category: 'Ácidos Nucleicos',
    pdbFile: 'demo_1BNA.pdb',
    audioFile: null,
    createdAt: new Date().toISOString(),
    atomCount: 486
  },
  {
    id: 'rna-demo',
    name: 'ARN de Transferencia (tRNA)',
    description: 'Molécula de ARN encargada de transferir aminoácidos al ribosoma durante la traducción.',
    category: 'Ácidos Nucleicos',
    pdbFile: 'demo_1EHZ.pdb',
    audioFile: null,
    createdAt: new Date().toISOString(),
    atomCount: 1653
  }
];

const DEMO_PDB_URLS = {
  'demo_1A3N.pdb': 'https://files.rcsb.org/download/1A3N.pdb',
  'demo_1BNA.pdb': 'https://files.rcsb.org/download/1BNA.pdb',
  'demo_1EHZ.pdb': 'https://files.rcsb.org/download/1EHZ.pdb'
};

export default defineConfig({

  // ====================================================================
  // {2} MULTI-PAGE ENTRY POINTS
  // ====================================================================
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        display: resolve(__dirname, 'src/display/index.html'),
        control: resolve(__dirname, 'src/control/index.html'),
        admin: resolve(__dirname, 'src/admin/index.html')
      }
    }
  },

  // ====================================================================
  // {3} IMPORT ALIAS
  // ====================================================================
  resolve: {
    alias: {
      '@shared': resolve(__dirname, 'src/shared')
    }
  },

  // ====================================================================
  // {4} DEV SERVER — PROXY + FILE FALLBACK
  // ====================================================================
  plugins: [
    {
      name: 'aletheia-dev-fallback',
      configureServer(server) {
        // Insert handler at BEGINNING of middleware stack (before proxy)
        server.middlewares.stack.unshift({
          route: '',
          handle: (req, res, next) => {
            // Serve demo PDB files directly from RCSB, bypassing Worker
            if (req.url.startsWith('/api/files/')) {
              const filename = req.url.replace('/api/files/', '');
              const pdbUrl = DEMO_PDB_URLS[filename];
              if (pdbUrl) {
                fetch(pdbUrl)
                  .then(r => {
                    if (!r.ok) throw new Error('RCSB fetch failed');
                    return r.text();
                  })
                  .then(text => {
                    res.writeHead(200, { 'Content-Type': 'text/plain' });
                    res.end(text);
                  })
                  .catch(() => next());
                return;
              }
            }
            next();
          }
        });
      }
    }
  ],

  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('error', (err, req, res) => {
            // If the Wrangler backend does not respond, Vite responds directly with demo data
            if (req.url === '/api/molecules') {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ molecules: DEMO_MOLECULES }));
              return;
            }
            res.writeHead(500);
            res.end('Proxy Error');
          });
        }
      },
      '/ws': {
        target: 'http://localhost:8787',
        ws: true
      }
    }
  }
});