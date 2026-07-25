# Fase 3 — Módulos Compartidos

> **Objetivo**: Implementar los módulos JavaScript compartidos que serán usados por las tres pantallas (display, control, admin). Incluye constantes globales, cliente Socket.IO reutilizable, y el loader de moléculas PDB con Three.js.

---

## Reglas de Código

> Todos los comentarios deben seguir esta convención estrictamente:
> - Separadores `=` de **68 caracteres** dentro del comentario
> - Pasos numerados: `{1}`, `{2}`, `{3}`…
> - **Doble línea de `=`** arriba y abajo para títulos/módulos principales
> - **Línea simple de `=`** arriba y abajo para secciones
> - `{N}` inline para comentarios cortos
>
> ```js
> // ====================================================================
> // ====================================================================
> // {1} NOMBRE DEL MÓDULO
> // ====================================================================
> // Descripción.
> // ====================================================================
> ```

---

## Paso 1 — Implementar `src/shared/constants.js`

**Archivo**: `src/shared/constants.js`

Contiene todas las constantes compartidas del proyecto: eventos WebSocket, URLs, estilos de visualización, colores CPK para átomos, y configuración de timeouts.

```js
// ====================================================================
// ====================================================================
// {1} CONSTANTES GLOBALES — ALETHEIA
// ====================================================================
// Valores compartidos entre las tres pantallas del sistema:
// display, control y admin.
// ====================================================================

// ====================================================================
// {2} EVENTOS WEBSOCKET
// ====================================================================
// Nombres de todos los eventos Socket.IO. Usar estas constantes
// en lugar de strings hardcodeados para evitar typos.
// ====================================================================
export const SOCKET_EVENTS = {
  // Registro
  REGISTER: 'register',
  SYNC_STATE: 'sync-state',

  // Control → Display
  SELECT_MOLECULE: 'select-molecule',
  ROTATE: 'rotate',
  ZOOM: 'zoom',
  STYLE_CHANGE: 'style-change',
  AUDIO_CONTROL: 'audio-control',
  RESET_VIEW: 'reset-view',

  // Display → Control
  DISPLAY_STATUS: 'display-status',
  IDLE_STARTED: 'idle-started'
};

// ====================================================================
// {3} CONFIGURACIÓN DE API
// ====================================================================
export const API_BASE_URL = '/api';
export const FILES_BASE_URL = '/files';

// ====================================================================
// {4} ESTILOS DE VISUALIZACIÓN
// ====================================================================
export const VISUALIZATION_STYLES = {
  SPHERES: 'spheres',
  BALL_AND_STICK: 'ball-and-stick',
  STICKS: 'sticks'
};

// ====================================================================
// {5} CONFIGURACIÓN DE IDLE / AUTO-ROTACIÓN
// ====================================================================
// IDLE_TIMEOUT: milisegundos sin interacción antes de activar
// la auto-rotación en la pantalla de exhibición.
// ====================================================================
export const IDLE_TIMEOUT = 30000; // 30 segundos
export const AUTO_ROTATE_SPEED = 1.0;

// ====================================================================
// {6} COLORES CPK PARA ÁTOMOS
// ====================================================================
// Convención CPK (Corey-Pauling-Koltun) para colorear átomos
// según su elemento. Valores en hexadecimal para Three.js.
// ====================================================================
export const CPK_COLORS = {
  H:  0xffffff, // Hidrógeno — blanco
  C:  0x909090, // Carbono — gris
  N:  0x3050f8, // Nitrógeno — azul
  O:  0xff0d0d, // Oxígeno — rojo
  F:  0x90e050, // Flúor — verde claro
  Cl: 0x1ff01f, // Cloro — verde
  Br: 0xa62929, // Bromo — marrón oscuro
  I:  0x940094, // Yodo — violeta oscuro
  He: 0xd9ffff, // Helio — cyan claro
  Ne: 0xb3e3f5, // Neón — azul claro
  Ar: 0x80d1e3, // Argón — cyan
  P:  0xff8000, // Fósforo — naranja
  S:  0xffff30, // Azufre — amarillo
  B:  0xffb5b5, // Boro — rosa claro
  Li: 0xcc80ff, // Litio — violeta
  Na: 0xab5cf2, // Sodio — violeta medio
  K:  0x8f40d4, // Potasio — violeta oscuro
  Ca: 0x3dff00, // Calcio — verde brillante
  Fe: 0xe06633, // Hierro — naranja oscuro
  Mg: 0x8aff00, // Magnesio — verde lima
  Zn: 0x7d80b0, // Zinc — gris azulado
  Cu: 0xc88033, // Cobre — cobre
  DEFAULT: 0xff1493 // Desconocido — rosa fuerte
};

// ====================================================================
// {7} RADIOS ATÓMICOS (VAN DER WAALS)
// ====================================================================
// Radios en angstroms, escalados para Three.js.
// Usados en modo "spheres" para el tamaño de las esferas.
// ====================================================================
export const ATOM_RADII = {
  H:  0.31,
  C:  0.77,
  N:  0.75,
  O:  0.73,
  F:  0.72,
  P:  1.06,
  S:  1.02,
  Cl: 0.99,
  Br: 1.14,
  Fe: 1.25,
  Ca: 1.97,
  Mg: 1.60,
  Zn: 1.39,
  DEFAULT: 0.77
};

// ====================================================================
// {8} TIPOS DE CLIENTE WEBSOCKET
// ====================================================================
export const CLIENT_TYPES = {
  DISPLAY: 'display',
  CONTROL: 'control'
};
```

---

## Paso 2 — Implementar `src/shared/socket-client.js`

**Archivo**: `src/shared/socket-client.js`

Factory function que crea y configura un cliente Socket.IO. Incluye reconexión automática, logging para debug, y registro del tipo de cliente.

### Dependencias:
- Socket.IO client se importa desde CDN o se incluye vía script tag. Como usamos Vite, importar el paquete `socket.io-client` que viene incluido al instalar `socket.io`.

**NOTA**: Hay que agregar `socket.io-client` como dependencia en package.json. Si no está, ejecutar `npm install socket.io-client`.

```js
// ====================================================================
// ====================================================================
// {1} CLIENTE SOCKET.IO — FACTORY
// ====================================================================
// Crea y configura un cliente Socket.IO para conectarse al backend.
// Usado por las pantallas display y control.
// ====================================================================

import { io } from 'socket.io-client';
import { SOCKET_EVENTS, CLIENT_TYPES } from './constants.js';

// ====================================================================
// {2} CREAR CLIENTE
// ====================================================================
// @param {string} clientType - Tipo de cliente ('display' o 'control')
// @param {object} options    - Opciones adicionales de Socket.IO
// @returns {Socket}          - Instancia de Socket.IO configurada
// ====================================================================
export function createSocketClient(clientType, options = {}) {

  // {3} Crear conexión. En desarrollo, Vite proxea /socket.io al backend.
  const socket = io({
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    ...options
  });

  // ====================================================================
  // {4} EVENTOS DE CONEXIÓN
  // ====================================================================

  socket.on('connect', () => {
    console.log(`[Socket] Connected as ${clientType} (${socket.id})`);

    // {5} Registrar tipo de cliente en el servidor
    socket.emit(SOCKET_EVENTS.REGISTER, { type: clientType });
  });

  socket.on('disconnect', (reason) => {
    console.warn(`[Socket] Disconnected: ${reason}`);
  });

  socket.on('reconnect', (attemptNumber) => {
    console.log(`[Socket] Reconnected after ${attemptNumber} attempts`);
  });

  socket.on('connect_error', (error) => {
    console.error(`[Socket] Connection error:`, error.message);
  });

  // ====================================================================
  // {6} RECIBIR ESTADO INICIAL
  // ====================================================================
  // Cuando el servidor envía el estado actual al conectarse.
  // ====================================================================
  socket.on(SOCKET_EVENTS.SYNC_STATE, (state) => {
    console.log('[Socket] Received initial state:', state);
  });

  return socket;
}
```

---

## Paso 3 — Implementar `src/shared/molecule-loader.js`

**Archivo**: `src/shared/molecule-loader.js`

Wrapper sobre el `PDBLoader` de Three.js. Provee funciones para cargar archivos `.pdb`, crear meshes de átomos (InstancedMesh) y enlaces, y aplicar estilos de visualización.

### Funciones exportadas:
- `loadPDB(url)` — Carga un .pdb y retorna Promise con datos parseados
- `createMoleculeGroup(pdbData, style)` — Crea un Group de Three.js con la molécula renderizada
- `applyStyle(group, style)` — Cambia el estilo de visualización de un grupo existente

```js
// ====================================================================
// ====================================================================
// {1} MOLECULE LOADER — CARGADOR DE MACROMOLÉCULAS
// ====================================================================
// Wrapper sobre PDBLoader de Three.js para cargar archivos .pdb
// y convertirlos en geometrías renderizables.
//
// Soporta 3 estilos de visualización:
// - ball-and-stick: esferas pequeñas + cilindros (default)
// - spheres: esferas grandes (Van der Waals)
// - sticks: solo cilindros, sin esferas
// ====================================================================

import * as THREE from 'three';
import { PDBLoader } from 'three/addons/loaders/PDBLoader.js';
import {
  CPK_COLORS,
  ATOM_RADII,
  VISUALIZATION_STYLES
} from './constants.js';

// {2} Instancia global del loader
const loader = new PDBLoader();

// ====================================================================
// {3} CARGAR ARCHIVO PDB
// ====================================================================
// @param {string} url - URL del archivo .pdb
// @returns {Promise<{geometryAtoms, geometryBonds, json}>}
// ====================================================================
export function loadPDB(url) {
  return new Promise((resolve, reject) => {
    loader.load(
      url,
      (pdb) => {
        console.log(`[Loader] PDB loaded: ${pdb.json.atoms.length} atoms`);
        resolve(pdb);
      },
      (progress) => {
        // {4} Callback de progreso (para loading bar)
        if (progress.total > 0) {
          const percent = (progress.loaded / progress.total) * 100;
          console.log(`[Loader] Loading: ${percent.toFixed(1)}%`);
        }
      },
      (error) => {
        console.error('[Loader] Error loading PDB:', error);
        reject(error);
      }
    );
  });
}

// ====================================================================
// {5} CREAR GRUPO DE MOLÉCULA
// ====================================================================
// Genera un THREE.Group con átomos y enlaces renderizados según
// el estilo especificado.
//
// @param {object} pdbData - Datos del PDBLoader ({ geometryAtoms, geometryBonds, json })
// @param {string} style   - Estilo de visualización (default: 'ball-and-stick')
// @returns {THREE.Group}
// ====================================================================
export function createMoleculeGroup(pdbData, style = VISUALIZATION_STYLES.BALL_AND_STICK) {
  const group = new THREE.Group();
  group.name = 'molecule';

  const { geometryAtoms, geometryBonds, json } = pdbData;
  const atoms = json.atoms;

  // ====================================================================
  // {6} CREAR ÁTOMOS (InstancedMesh)
  // ====================================================================
  if (style !== VISUALIZATION_STYLES.STICKS) {
    const atomGroup = createAtomMeshes(geometryAtoms, atoms, style);
    atomGroup.name = 'atoms';
    group.add(atomGroup);
  }

  // ====================================================================
  // {7} CREAR ENLACES (Cilindros)
  // ====================================================================
  if (style !== VISUALIZATION_STYLES.SPHERES) {
    const bondGroup = createBondMeshes(geometryBonds);
    bondGroup.name = 'bonds';
    group.add(bondGroup);
  }

  // {8} Centrar la molécula en el origen
  centerGroup(group, geometryAtoms);

  return group;
}

// ====================================================================
// {9} CREAR MESHES DE ÁTOMOS
// ====================================================================
// Usa InstancedMesh para renderizar miles de átomos eficientemente.
// Cada átomo es una esfera con color CPK y radio según el estilo.
// ====================================================================
function createAtomMeshes(geometryAtoms, atoms, style) {
  const atomGroup = new THREE.Group();

  // {10} Escala de las esferas según el estilo
  const radiusScale = style === VISUALIZATION_STYLES.SPHERES ? 1.0 : 0.3;

  const positions = geometryAtoms.getAttribute('position');
  const colors = geometryAtoms.getAttribute('color');
  const atomCount = positions.count;

  // {11} Geometría y material base para instanced rendering
  const sphereGeometry = new THREE.SphereGeometry(1, 16, 16);
  const material = new THREE.MeshPhongMaterial({
    vertexColors: false,
    shininess: 80,
    specular: 0x444444
  });

  // {12} Agrupar átomos por elemento para instanced mesh
  const atomsByElement = {};

  for (let i = 0; i < atomCount; i++) {
    const atom = atoms[i];
    const element = atom[4] || 'DEFAULT'; // atom[4] = símbolo del elemento

    if (!atomsByElement[element]) {
      atomsByElement[element] = [];
    }

    atomsByElement[element].push({
      position: new THREE.Vector3(
        positions.getX(i),
        positions.getY(i),
        positions.getZ(i)
      ),
      color: new THREE.Color(
        colors.getX(i),
        colors.getY(i),
        colors.getZ(i)
      )
    });
  }

  // {13} Crear un InstancedMesh por cada elemento
  for (const [element, atomList] of Object.entries(atomsByElement)) {
    const color = CPK_COLORS[element] || CPK_COLORS.DEFAULT;
    const radius = (ATOM_RADII[element] || ATOM_RADII.DEFAULT) * radiusScale;

    const instancedMaterial = material.clone();
    instancedMaterial.color.setHex(color);

    const instancedMesh = new THREE.InstancedMesh(
      sphereGeometry,
      instancedMaterial,
      atomList.length
    );

    const dummy = new THREE.Object3D();

    for (let i = 0; i < atomList.length; i++) {
      dummy.position.copy(atomList[i].position);
      dummy.scale.setScalar(radius);
      dummy.updateMatrix();
      instancedMesh.setMatrixAt(i, dummy.matrix);
    }

    instancedMesh.instanceMatrix.needsUpdate = true;
    atomGroup.add(instancedMesh);
  }

  return atomGroup;
}

// ====================================================================
// {14} CREAR MESHES DE ENLACES
// ====================================================================
// Cada enlace es un cilindro que conecta dos posiciones de átomos.
// ====================================================================
function createBondMeshes(geometryBonds) {
  const bondGroup = new THREE.Group();

  const positions = geometryBonds.getAttribute('position');
  const bondCount = positions.count / 2; // Cada bond = 2 posiciones

  const bondMaterial = new THREE.MeshPhongMaterial({
    color: 0x606060,
    shininess: 40
  });

  const cylinderGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1, 6);
  // {15} Rotar el cilindro para que apunte en Y por defecto
  cylinderGeometry.applyMatrix4(
    new THREE.Matrix4().makeTranslation(0, 0.5, 0)
  );

  for (let i = 0; i < bondCount; i++) {
    const start = new THREE.Vector3(
      positions.getX(i * 2),
      positions.getY(i * 2),
      positions.getZ(i * 2)
    );
    const end = new THREE.Vector3(
      positions.getX(i * 2 + 1),
      positions.getY(i * 2 + 1),
      positions.getZ(i * 2 + 1)
    );

    const bond = new THREE.Mesh(cylinderGeometry.clone(), bondMaterial);

    // {16} Posicionar y orientar el cilindro entre start y end
    const direction = new THREE.Vector3().subVectors(end, start);
    const length = direction.length();

    bond.position.copy(start);
    bond.scale.set(1, length, 1);
    bond.lookAt(end);
    bond.rotateX(Math.PI / 2);

    bondGroup.add(bond);
  }

  return bondGroup;
}

// ====================================================================
// {17} CENTRAR MOLÉCULA
// ====================================================================
// Calcula el centro geométrico y desplaza todo el grupo para que
// la molécula quede centrada en el origen (0, 0, 0).
// ====================================================================
function centerGroup(group, geometryAtoms) {
  const positions = geometryAtoms.getAttribute('position');
  const center = new THREE.Vector3();

  for (let i = 0; i < positions.count; i++) {
    center.x += positions.getX(i);
    center.y += positions.getY(i);
    center.z += positions.getZ(i);
  }

  center.divideScalar(positions.count);
  group.position.sub(center);
}

// ====================================================================
// {18} APLICAR ESTILO A GRUPO EXISTENTE
// ====================================================================
// Reconstruye los hijos del grupo según el nuevo estilo.
// Requiere los datos PDB originales almacenados en group.userData.
//
// @param {THREE.Group} group  - Grupo de molécula existente
// @param {object} pdbData     - Datos PDB originales
// @param {string} newStyle    - Nuevo estilo a aplicar
// @returns {THREE.Group}      - Nuevo grupo (reemplaza el anterior)
// ====================================================================
export function applyStyle(group, pdbData, newStyle) {
  // {19} Limpiar el grupo anterior
  while (group.children.length > 0) {
    const child = group.children[0];
    group.remove(child);
    if (child.geometry) child.geometry.dispose();
    if (child.material) child.material.dispose();
  }

  // {20} Reconstruir con el nuevo estilo
  return createMoleculeGroup(pdbData, newStyle);
}
```

---

## Paso Extra — Agregar `socket.io-client` a las dependencias

Si no se incluyó en la Fase 1, ejecutar:

```bash
npm install socket.io-client
```

---

## Verificación

```bash
# 1. Verificar que los imports funcionan creando un script de test temporal
node -e "
  import('./src/shared/constants.js').then(m => {
    console.log('Constants OK:', Object.keys(m.SOCKET_EVENTS).length, 'events');
    console.log('CPK colors:', Object.keys(m.CPK_COLORS).length, 'elements');
  }).catch(e => console.error(e));
"

# 2. Verificar que Vite resuelve los módulos sin errores
npx vite build --mode development 2>&1 | head -20
# No debe mostrar errores de importación

# 3. Verificar que socket.io-client está instalado
node -e "import('socket.io-client').then(() => console.log('socket.io-client OK')).catch(e => console.error(e))"
```

Si todo funciona, la Fase 3 está completa. Proceder a Fase 4.
