// ====================================================================
// ====================================================================
// {1} ALETHEIA WORKER — HONO + CLOUDFLARE BACKEND
// ====================================================================
// Ultra fault-tolerant serverless REST API.
// Supports D1 SQL, Cloudflare KV, R2 and local/memory fallback.
// ====================================================================

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { SyncRoom } from './sync-room.js';

export { SyncRoom };

const app = new Hono();
app.use('*', cors());

// ====================================================================
// {2} DEFAULT DEMO MOLECULES AND IN-MEMORY STATE
// ====================================================================
const DEFAULT_DEMO_MOLECULES = [
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

let memoryMoleculesStore = [...DEFAULT_DEMO_MOLECULES];

const DEMO_PDB_URLS = {
  'demo_1A3N.pdb': 'https://files.rcsb.org/download/1A3N.pdb',
  'demo_1BNA.pdb': 'https://files.rcsb.org/download/1BNA.pdb',
  'demo_1EHZ.pdb': 'https://files.rcsb.org/download/1EHZ.pdb'
};

const memoryFileStore = new Map();

// ====================================================================
// {3} D1 DATABASE HELPER
// ====================================================================
async function tryGetD1Molecules(db) {
  try {
    if (!db) return null;
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS molecules (
        id TEXT PRIMARY KEY, name TEXT, description TEXT, category TEXT,
        pdbFile TEXT, audioFile TEXT, createdAt TEXT, atomCount INTEGER
      )
    `).run();
    const { results } = await db.prepare('SELECT * FROM molecules ORDER BY createdAt DESC').all();
    if (results && results.length > 0) return results;
  } catch (e) {
    console.warn('D1 not available:', e.message);
  }
  return null;
}

// ====================================================================
// {4} API AND WEBSOCKET ROUTES
// ====================================================================

// WebSocket Upgrade -> Durable Object
app.get('/ws', (c) => {
  try {
    const id = c.env.SYNC_ROOM.idFromName('global-room');
    const roomObject = c.env.SYNC_ROOM.get(id);
    return roomObject.fetch(c.req.raw);
  } catch (e) {
    return c.text('WebSocket Unavailable', 500);
  }
});

// Files (Local Assets / R2 / Memory / RCSB Proxy)
app.get('/api/files/:filename', async (c) => {
  const filename = c.req.param('filename');

  // 1. Memory store (local uploads)
  if (memoryFileStore.has(filename)) {
    return new Response(memoryFileStore.get(filename));
  }

  // 2. R2 Storage
  if (c.env.ALETHEIA_STORAGE) {
    try {
      const object = await c.env.ALETHEIA_STORAGE.get(filename);
      if (object) {
        const headers = new Headers();
        object.writeHttpMetadata(headers);
        headers.set('etag', object.httpEtag);
        return new Response(object.body, { headers });
      }
    } catch (e) {
      console.warn('R2 get error:', e);
    }
  }

  // 3. Fallback to local files downloaded in public/assets/pdb/
  if (DEMO_PDB_URLS[filename]) {
    try {
      const origin = new URL(c.req.url).origin;
      const localFileRes = await fetch(`${origin}/assets/pdb/${filename}`);
      if (localFileRes.ok) {
        const body = await localFileRes.text();
        return c.text(body);
      }
    } catch (e) {
      // Ignore
    }

    // 4. Remote proxy fallback (RCSB PDB)
    try {
      const proxyRes = await fetch(DEMO_PDB_URLS[filename]);
      if (proxyRes.ok) {
        const body = await proxyRes.text();
        return c.text(body);
      }
    } catch (e) {
      console.error('Error fetching demo PDB', e);
    }
  }

  return c.text('File not found', 404);
});

// GET /api/molecules
app.get('/api/molecules', async (c) => {
  const d1Data = await tryGetD1Molecules(c.env.DB);
  if (d1Data) return c.json({ molecules: d1Data });

  if (c.env.ALETHEIA_KV) {
    try {
      const kvData = await c.env.ALETHEIA_KV.get('molecules', 'json');
      if (kvData && kvData.molecules && kvData.molecules.length > 0) {
        return c.json(kvData);
      }
    } catch (e) {
      console.warn('KV read error:', e);
    }
  }

  return c.json({ molecules: memoryMoleculesStore });
});

// POST /api/molecules
app.post('/api/molecules', async (c) => {
  try {
    const formData = await c.req.formData();
    const name = formData.get('name');
    const description = formData.get('description');
    const category = formData.get('category');
    const pdbFile = formData.get('pdb');
    const audioFile = formData.get('audio');

    if (!name || !pdbFile) {
      return c.text('Missing required fields', 400);
    }

    const id = Date.now().toString();
    const pdbFilename = `${id}_${pdbFile.name}`;
    const audioFilename = audioFile ? `${id}_${audioFile.name}` : null;
    const createdAt = new Date().toISOString();

    memoryFileStore.set(pdbFilename, pdbFile);
    if (audioFile) memoryFileStore.set(audioFilename, audioFile);

    if (c.env.ALETHEIA_STORAGE) {
      try {
        await c.env.ALETHEIA_STORAGE.put(pdbFilename, pdbFile);
        if (audioFile) await c.env.ALETHEIA_STORAGE.put(audioFilename, audioFile);
      } catch (e) {
        console.warn('R2 put warning:', e);
      }
    }

    const newMolecule = {
      id,
      name,
      description,
      category,
      pdbFile: pdbFilename,
      audioFile: audioFilename,
      createdAt,
      atomCount: 0
    };

    memoryMoleculesStore.unshift(newMolecule);

    if (c.env.DB) {
      try {
        await c.env.DB.prepare(`
          INSERT INTO molecules (id, name, description, category, pdbFile, audioFile, createdAt, atomCount)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(id, name, description, category, pdbFilename, audioFilename, createdAt, 0).run();
      } catch (e) {
        console.warn('D1 insert error:', e);
      }
    }

    if (c.env.ALETHEIA_KV) {
      try {
        await c.env.ALETHEIA_KV.put('molecules', JSON.stringify({ molecules: memoryMoleculesStore }));
      } catch (e) {
        console.warn('KV put error:', e);
      }
    }

    return c.json(newMolecule, 201);
  } catch (error) {
    return c.text(error.message, 500);
  }
});

export default app;
