# Fase 2 — Backend (Node.js + Express + Socket.IO)

> **Objetivo**: Implementar el backend completo con servidor Express, API REST para CRUD de moléculas, manejo de uploads con Multer, y servidor WebSocket con Socket.IO para sincronización en tiempo real entre pantallas.

---

## Reglas de Código

> Todos los comentarios deben seguir esta convención estrictamente:
> - Separadores `=` de **68 caracteres** dentro del comentario
> - Pasos numerados: `{1}`, `{2}`, `{3}`…
> - **Doble línea de `=`** arriba y abajo para títulos/módulos principales
> - **Línea simple de `=`** arriba y abajo para secciones
> - `{N}` inline para comentarios cortos
>
> **Ejemplo JS:**
> ```js
> // ====================================================================
> // ====================================================================
> // {1} NOMBRE DEL MÓDULO
> // ====================================================================
> // Descripción.
> // ====================================================================
> ```

---

## Paso 1 — Implementar `server/index.js`

**Archivo**: `server/index.js` (reemplazar el placeholder de Fase 1)

Este es el entry point del backend. Crea el servidor HTTP con Express, monta Socket.IO, sirve archivos estáticos (PDB y audio), e importa las rutas y la lógica WebSocket.

### Comportamiento esperado:
- Express escucha en `PORT` (default `3001`)
- Socket.IO montado sobre el mismo servidor HTTP
- CORS habilitado para desarrollo
- Archivos `.pdb` servidos desde `server/data/pdb/`
- Archivos de audio servidos desde `server/data/audio/`
- Rutas REST montadas en `/api`
- WebSocket configurado al conectar un cliente

### Código:

```js
// ====================================================================
// ====================================================================
// {1} ALETHEIA BACKEND — ENTRY POINT
// ====================================================================
// Servidor principal de Aletheia. Combina:
// - Express para API REST y archivos estáticos
// - Socket.IO para sincronización en tiempo real entre
//   la pantalla de exhibición y la pantalla de control.
// ====================================================================

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import moleculesRouter from './routes/molecules.js';
import { setupWebSocket } from './websocket/sync.js';

// {2} Resolver __dirname en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ====================================================================
// {3} CREAR SERVIDOR
// ====================================================================
const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// ====================================================================
// {4} MIDDLEWARES
// ====================================================================
app.use(cors());
app.use(express.json());

// ====================================================================
// {5} ARCHIVOS ESTÁTICOS
// ====================================================================
// Servir archivos PDB y audio desde el directorio data.
// Accesibles como /files/pdb/nombre.pdb y /files/audio/nombre.mp3
// ====================================================================
app.use('/files/pdb', express.static(join(__dirname, 'data', 'pdb')));
app.use('/files/audio', express.static(join(__dirname, 'data', 'audio')));

// ====================================================================
// {6} RUTAS API REST
// ====================================================================
app.use('/api', moleculesRouter);

// {7} Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', name: 'Aletheia', version: '1.0.0' });
});

// ====================================================================
// {8} WEBSOCKET
// ====================================================================
setupWebSocket(io);

// ====================================================================
// {9} INICIAR SERVIDOR
// ====================================================================
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`[Aletheia] Backend running on http://localhost:${PORT}`);
  console.log(`[Aletheia] WebSocket ready`);
});
```

---

## Paso 2 — Implementar `server/routes/molecules.js`

**Archivo**: `server/routes/molecules.js`

API REST completa para gestionar macromoléculas. Usa Multer para manejar uploads de archivos `.pdb` y audio.

### Endpoints:

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/molecules` | Listar todas las moléculas |
| `GET` | `/api/molecules/:id` | Obtener una molécula por ID |
| `POST` | `/api/molecules` | Crear nueva molécula (multipart upload) |
| `PUT` | `/api/molecules/:id` | Actualizar metadata de molécula |
| `DELETE` | `/api/molecules/:id` | Eliminar molécula y sus archivos |

### Almacenamiento:
- Metadata → `server/data/molecules.json`
- Archivos PDB → `server/data/pdb/`
- Archivos de audio → `server/data/audio/`

### Código:

```js
// ====================================================================
// ====================================================================
// {1} RUTAS API — MOLÉCULAS
// ====================================================================
// CRUD completo para gestionar macromoléculas.
// Usa Multer para uploads de .pdb y audio.
// Almacena metadata en molecules.json y archivos en disco.
// ====================================================================

import { Router } from 'express';
import multer from 'multer';
import { readFileSync, writeFileSync, unlinkSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join, extname } from 'path';

const router = Router();

// {2} Resolver paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_DIR = join(__dirname, '..', 'data');
const DB_PATH = join(DATA_DIR, 'molecules.json');
const PDB_DIR = join(DATA_DIR, 'pdb');
const AUDIO_DIR = join(DATA_DIR, 'audio');

// ====================================================================
// {3} CONFIGURACIÓN DE MULTER
// ====================================================================
// Dos campos de upload: pdbFile (.pdb) y audioFile (audio/*)
// ====================================================================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'pdbFile') {
      cb(null, PDB_DIR);
    } else if (file.fieldname === 'audioFile') {
      cb(null, AUDIO_DIR);
    }
  },
  filename: (req, file, cb) => {
    // {4} Generar nombre único: timestamp + nombre original
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'pdbFile') {
      // {5} Validar que sea archivo .pdb
      const ext = extname(file.originalname).toLowerCase();
      if (ext !== '.pdb') {
        return cb(new Error('Solo se permiten archivos .pdb'), false);
      }
    }
    cb(null, true);
  },
  limits: {
    fileSize: 50 * 1024 * 1024 // {6} Máximo 50MB por archivo
  }
});

const uploadFields = upload.fields([
  { name: 'pdbFile', maxCount: 1 },
  { name: 'audioFile', maxCount: 1 }
]);

// ====================================================================
// {7} HELPERS PARA LEER/ESCRIBIR LA BASE DE DATOS JSON
// ====================================================================

function readDB() {
  const raw = readFileSync(DB_PATH, 'utf-8');
  return JSON.parse(raw);
}

function writeDB(data) {
  writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

function generateId(name) {
  // {8} Crear ID slug a partir del nombre
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    + '-' + Date.now().toString(36);
}

// ====================================================================
// {9} GET /api/molecules — Listar todas
// ====================================================================
router.get('/molecules', (req, res) => {
  try {
    const db = readDB();
    res.json(db.molecules);
  } catch (error) {
    console.error('[API] Error listing molecules:', error);
    res.status(500).json({ error: 'Error al leer la base de datos' });
  }
});

// ====================================================================
// {10} GET /api/molecules/:id — Obtener una
// ====================================================================
router.get('/molecules/:id', (req, res) => {
  try {
    const db = readDB();
    const molecule = db.molecules.find(m => m.id === req.params.id);

    if (!molecule) {
      return res.status(404).json({ error: 'Molécula no encontrada' });
    }

    res.json(molecule);
  } catch (error) {
    console.error('[API] Error getting molecule:', error);
    res.status(500).json({ error: 'Error al leer la molécula' });
  }
});

// ====================================================================
// {11} POST /api/molecules — Crear nueva
// ====================================================================
// Recibe multipart/form-data con campos:
// - name (string, requerido)
// - description (string)
// - category (string)
// - pdbFile (archivo .pdb, requerido)
// - audioFile (archivo de audio, opcional)
// ====================================================================
router.post('/molecules', uploadFields, (req, res) => {
  try {
    const { name, description, category } = req.body;

    // {12} Validar campos requeridos
    if (!name) {
      return res.status(400).json({ error: 'El nombre es requerido' });
    }
    if (!req.files?.pdbFile?.[0]) {
      return res.status(400).json({ error: 'El archivo PDB es requerido' });
    }

    const db = readDB();

    // {13} Construir objeto de molécula
    const molecule = {
      id: generateId(name),
      name,
      description: description || '',
      category: category || 'Sin categoría',
      pdbFile: req.files.pdbFile[0].filename,
      audioFile: req.files.audioFile?.[0]?.filename || null,
      atomCount: 0, // Se calculará en el frontend al cargar
      createdAt: new Date().toISOString()
    };

    db.molecules.push(molecule);
    writeDB(db);

    console.log(`[API] Molécula creada: ${molecule.name} (${molecule.id})`);
    res.status(201).json(molecule);
  } catch (error) {
    console.error('[API] Error creating molecule:', error);
    res.status(500).json({ error: 'Error al crear la molécula' });
  }
});

// ====================================================================
// {14} PUT /api/molecules/:id — Actualizar metadata
// ====================================================================
router.put('/molecules/:id', uploadFields, (req, res) => {
  try {
    const db = readDB();
    const index = db.molecules.findIndex(m => m.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ error: 'Molécula no encontrada' });
    }

    const molecule = db.molecules[index];
    const { name, description, category } = req.body;

    // {15} Actualizar campos proporcionados
    if (name) molecule.name = name;
    if (description !== undefined) molecule.description = description;
    if (category) molecule.category = category;

    // {16} Si se subió un nuevo PDB, eliminar el anterior
    if (req.files?.pdbFile?.[0]) {
      const oldPdb = join(PDB_DIR, molecule.pdbFile);
      if (existsSync(oldPdb)) unlinkSync(oldPdb);
      molecule.pdbFile = req.files.pdbFile[0].filename;
    }

    // {17} Si se subió un nuevo audio, eliminar el anterior
    if (req.files?.audioFile?.[0]) {
      if (molecule.audioFile) {
        const oldAudio = join(AUDIO_DIR, molecule.audioFile);
        if (existsSync(oldAudio)) unlinkSync(oldAudio);
      }
      molecule.audioFile = req.files.audioFile[0].filename;
    }

    db.molecules[index] = molecule;
    writeDB(db);

    console.log(`[API] Molécula actualizada: ${molecule.name}`);
    res.json(molecule);
  } catch (error) {
    console.error('[API] Error updating molecule:', error);
    res.status(500).json({ error: 'Error al actualizar la molécula' });
  }
});

// ====================================================================
// {18} DELETE /api/molecules/:id — Eliminar
// ====================================================================
router.delete('/molecules/:id', (req, res) => {
  try {
    const db = readDB();
    const index = db.molecules.findIndex(m => m.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ error: 'Molécula no encontrada' });
    }

    const molecule = db.molecules[index];

    // {19} Eliminar archivos del disco
    const pdbPath = join(PDB_DIR, molecule.pdbFile);
    if (existsSync(pdbPath)) unlinkSync(pdbPath);

    if (molecule.audioFile) {
      const audioPath = join(AUDIO_DIR, molecule.audioFile);
      if (existsSync(audioPath)) unlinkSync(audioPath);
    }

    // {20} Eliminar de la base de datos
    db.molecules.splice(index, 1);
    writeDB(db);

    console.log(`[API] Molécula eliminada: ${molecule.name}`);
    res.json({ message: 'Molécula eliminada correctamente' });
  } catch (error) {
    console.error('[API] Error deleting molecule:', error);
    res.status(500).json({ error: 'Error al eliminar la molécula' });
  }
});

// ====================================================================
// {21} MANEJO DE ERRORES DE MULTER
// ====================================================================
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'El archivo excede el tamaño máximo (50MB)' });
    }
    return res.status(400).json({ error: error.message });
  }
  if (error.message === 'Solo se permiten archivos .pdb') {
    return res.status(400).json({ error: error.message });
  }
  next(error);
});

export default router;
```

---

## Paso 3 — Implementar `server/websocket/sync.js`

**Archivo**: `server/websocket/sync.js`

Maneja toda la sincronización en tiempo real entre la pantalla de control y la pantalla de exhibición usando Socket.IO.

### Eventos:

| Evento | Dirección | Payload | Descripción |
|--------|-----------|---------|-------------|
| `select-molecule` | Control → Display | `{ id, name }` | Cambiar molécula activa |
| `rotate` | Control → Display | `{ quaternion: {x,y,z,w} }` | Enviar rotación |
| `zoom` | Control → Display | `{ zoom: number }` | Enviar zoom |
| `style-change` | Control → Display | `{ style: string }` | Cambiar estilo visual |
| `audio-control` | Control → Display | `{ action: 'play'|'pause'|'stop' }` | Controlar audio |
| `reset-view` | Control → Display | `{}` | Resetear vista |
| `display-status` | Display → Control | `{ moleculeId, isIdle }` | Estado actual |
| `idle-started` | Display → Control | `{}` | Auto-rotación iniciada |

### Código:

```js
// ====================================================================
// ====================================================================
// {1} WEBSOCKET — SINCRONIZACIÓN EN TIEMPO REAL
// ====================================================================
// Maneja la comunicación bidireccional entre la pantalla de control
// y la pantalla de exhibición usando Socket.IO.
//
// Tipos de clientes:
// - 'display': pantalla de exhibición (recibe comandos)
// - 'control': pantalla de control (envía comandos)
//
// El servidor actúa como relay: recibe de control, reenvía a display.
// ====================================================================

// ====================================================================
// {2} ESTADO GLOBAL
// ====================================================================
// Mantiene el estado actual para sincronizar nuevos clientes al
// conectarse (evitar pantalla en blanco).
// ====================================================================
const state = {
  currentMolecule: null,
  currentStyle: 'ball-and-stick',
  isIdle: true
};

// ====================================================================
// {3} SETUP PRINCIPAL
// ====================================================================
export function setupWebSocket(io) {

  io.on('connection', (socket) => {
    console.log(`[WS] Client connected: ${socket.id}`);

    // ====================================================================
    // {4} REGISTRO DE TIPO DE CLIENTE
    // ====================================================================
    // El cliente debe emitir 'register' con { type: 'display' | 'control' }
    // al conectarse para unirse al room correcto.
    // ====================================================================
    socket.on('register', ({ type }) => {
      socket.join(type);
      socket.clientType = type;
      console.log(`[WS] Client ${socket.id} registered as: ${type}`);

      // {5} Enviar estado actual al nuevo cliente
      socket.emit('sync-state', state);
    });

    // ====================================================================
    // {6} EVENTOS: CONTROL → DISPLAY
    // ====================================================================
    // Cada evento del control se reenvía a todos los displays.
    // ====================================================================

    // {7} Seleccionar molécula
    socket.on('select-molecule', (data) => {
      state.currentMolecule = data;
      state.isIdle = false;
      io.to('display').emit('select-molecule', data);
      console.log(`[WS] Molecule selected: ${data.name || data.id}`);
    });

    // {8} Rotación
    socket.on('rotate', (data) => {
      state.isIdle = false;
      io.to('display').emit('rotate', data);
    });

    // {9} Zoom
    socket.on('zoom', (data) => {
      state.isIdle = false;
      io.to('display').emit('zoom', data);
    });

    // {10} Cambio de estilo
    socket.on('style-change', (data) => {
      state.currentStyle = data.style;
      io.to('display').emit('style-change', data);
      console.log(`[WS] Style changed to: ${data.style}`);
    });

    // {11} Control de audio
    socket.on('audio-control', (data) => {
      io.to('display').emit('audio-control', data);
      console.log(`[WS] Audio: ${data.action}`);
    });

    // {12} Resetear vista
    socket.on('reset-view', () => {
      state.isIdle = false;
      io.to('display').emit('reset-view');
      console.log('[WS] View reset');
    });

    // ====================================================================
    // {13} EVENTOS: DISPLAY → CONTROL
    // ====================================================================

    // {14} Estado del display
    socket.on('display-status', (data) => {
      state.isIdle = data.isIdle;
      io.to('control').emit('display-status', data);
    });

    // {15} Idle iniciado
    socket.on('idle-started', () => {
      state.isIdle = true;
      io.to('control').emit('idle-started');
      console.log('[WS] Display entered idle mode');
    });

    // ====================================================================
    // {16} DESCONEXIÓN
    // ====================================================================
    socket.on('disconnect', () => {
      console.log(`[WS] Client disconnected: ${socket.id} (${socket.clientType || 'unknown'})`);
    });
  });

  console.log('[WS] WebSocket server configured');
}
```

---

## Verificación

```bash
# 1. Iniciar el backend
node server/index.js
# Debe imprimir:
# [Aletheia] Backend running on http://localhost:3001
# [Aletheia] WebSocket ready
# [WS] WebSocket server configured

# 2. Probar health check
curl http://localhost:3001/api/health
# → {"status":"ok","name":"Aletheia","version":"1.0.0"}

# 3. Probar listar moléculas (vacío)
curl http://localhost:3001/api/molecules
# → []

# 4. Probar crear molécula (necesita un .pdb de prueba)
# Crear un archivo de prueba: echo "ATOM test" > server/data/pdb/test.pdb
# Luego probar con curl multipart:
curl -X POST http://localhost:3001/api/molecules \
  -F "name=Test Molecule" \
  -F "description=A test molecule" \
  -F "category=Test" \
  -F "pdbFile=@server/data/pdb/test.pdb"
# → Debe responder con 201 y los datos de la molécula

# 5. Probar listar moléculas (ahora debe tener una)
curl http://localhost:3001/api/molecules
# → Debe mostrar la molécula creada

# 6. Probar eliminar
curl -X DELETE http://localhost:3001/api/molecules/<id-de-la-molecula>
# → {"message":"Molécula eliminada correctamente"}

# 7. Verificar que el dev completo funciona
npm run dev
# Debe arrancar tanto el backend como Vite sin errores
```

Si todo funciona, la Fase 2 está completa. Proceder a Fase 3.
