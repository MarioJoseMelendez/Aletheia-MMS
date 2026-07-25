// ====================================================================
// ====================================================================
// {1} CONFIGURACIÓN VITE — ALETHEIA
// ====================================================================
// Multi-page app con 3 entry points:
// - display: pantalla de exhibición fullscreen
// - control: pantalla de control interactivo
// - admin: panel de administración
// Proxy de /api y /ws hacia el backend Cloudflare Worker (o fallback local).
// ====================================================================

import { defineConfig } from 'vite';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, '..');

// Demo data fallback para desarrollo directo en Vite
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
  // {2} ENTRY POINTS MULTI-PAGE
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
  // {3} ALIAS DE IMPORTACIÓN
  // ====================================================================
  resolve: {
    alias: {
      '@shared': resolve(__dirname, 'src/shared')
    }
  },

  // ====================================================================
  // {4} PROXY Y MIDDLEWARE FALLBACK
  // ====================================================================
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            // Si el backend Wrangler no responde, Vite responde directamente con los datos demo
            if (req.url === '/api/molecules') {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ molecules: DEMO_MOLECULES }));
              return;
            }
            if (req.url.startsWith('/api/files/')) {
              const filename = req.url.replace('/api/files/', '');
              if (DEMO_PDB_URLS[filename]) {
                fetch(DEMO_PDB_URLS[filename])
                  .then(r => r.text())
                  .then(body => {
                    res.writeHead(200, { 'Content-Type': 'text/plain' });
                    res.end(body);
                  })
                  .catch(() => {
                    res.writeHead(404);
                    res.end('File not found');
                  });
                return;
              }
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
