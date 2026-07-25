# Fase 5 — Pantalla de Control (Interactiva)

> **Objetivo**: Implementar la pantalla de control interactivo con lista de moléculas, vista previa 3D miniatura con OrbitControls, controles de estilo de visualización, y controles de audio. Todo se sincroniza con la pantalla de exhibición vía WebSocket.

---

## Reglas de Código

> Todos los comentarios deben seguir esta convención estrictamente:
> - Separadores `=` de **68 caracteres** dentro del comentario
> - Pasos numerados: `{1}`, `{2}`, `{3}`…
> - **Doble línea de `=`** arriba y abajo para títulos/módulos principales
> - **Línea simple de `=`** arriba y abajo para secciones
> - `{N}` inline para comentarios cortos

---

## Prerequisitos

- Fases 1-4 completadas
- Backend corriendo con API y WebSocket
- Módulos compartidos disponibles

---

## Paso 1 — Implementar `src/control/control.css`

**Archivo**: `src/control/control.css` (reemplazar placeholder)

Estilos completos premium: tema oscuro, glassmorphism, micro-animaciones, layout responsivo grid.

```css
/* ====================================================================
   ====================================================================
   {1} CONTROL — ESTILOS PRINCIPALES
   ====================================================================
   Pantalla de control interactivo para Aletheia.
   Tema oscuro premium con glassmorphism y micro-animaciones.
   ==================================================================== */

/* ====================================================================
   {2} VARIABLES CSS
   ==================================================================== */
:root {
  --bg-primary: #0a0a0f;
  --bg-secondary: #12121a;
  --bg-card: rgba(18, 18, 30, 0.8);
  --bg-card-hover: rgba(25, 25, 40, 0.9);
  --border-color: rgba(255, 255, 255, 0.06);
  --border-hover: rgba(255, 255, 255, 0.12);
  --text-primary: #f0f0f0;
  --text-secondary: rgba(255, 255, 255, 0.6);
  --text-muted: rgba(255, 255, 255, 0.35);
  --accent: #00d4aa;
  --accent-hover: #00e8bb;
  --accent-glow: rgba(0, 212, 170, 0.15);
  --danger: #ff4466;
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
  --transition: 0.2s ease;
}

/* ====================================================================
   {3} RESET Y BASE
   ==================================================================== */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-family: 'Inter', sans-serif;
}

/* ====================================================================
   {4} LAYOUT GRID PRINCIPAL
   ====================================================================
   Dos columnas: sidebar (280px fijo) + área principal (flexible).
   ==================================================================== */
#app-layout {
  display: grid;
  grid-template-columns: 280px 1fr;
  height: 100vh;
  gap: 0;
}

/* ====================================================================
   ====================================================================
   {5} SIDEBAR — LISTA DE MOLÉCULAS
   ==================================================================== */
#sidebar {
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.sidebar-header {
  padding: 24px 20px 16px;
  border-bottom: 1px solid var(--border-color);
}

.app-title {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 2px;
  text-transform: uppercase;
  background: linear-gradient(135deg, var(--accent), #7b61ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.app-subtitle {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 4px;
  letter-spacing: 0.5px;
}

/* {6} Búsqueda */
.search-container {
  padding: 12px 16px;
}

#molecule-search {
  width: 100%;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  outline: none;
  transition: border-color var(--transition), background var(--transition);
}

#molecule-search:focus {
  border-color: var(--accent);
  background: rgba(0, 212, 170, 0.04);
}

#molecule-search::placeholder {
  color: var(--text-muted);
}

/* {7} Lista de moléculas */
#molecule-list {
  list-style: none;
  overflow-y: auto;
  flex: 1;
  padding: 8px;
}

#molecule-list::-webkit-scrollbar {
  width: 4px;
}

#molecule-list::-webkit-scrollbar-track {
  background: transparent;
}

#molecule-list::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
}

/* {8} Cada molécula en la lista */
.molecule-item {
  padding: 14px 16px;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background var(--transition), transform var(--transition);
  border: 1px solid transparent;
  margin-bottom: 4px;
}

.molecule-item:hover {
  background: var(--bg-card-hover);
  transform: translateX(4px);
}

.molecule-item.active {
  background: var(--accent-glow);
  border-color: rgba(0, 212, 170, 0.3);
}

.molecule-item-name {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
}

.molecule-item-meta {
  font-size: 11px;
  color: var(--text-muted);
  display: flex;
  gap: 12px;
}

.molecule-item-category {
  color: var(--accent);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* ====================================================================
   ====================================================================
   {9} ÁREA PRINCIPAL
   ==================================================================== */
#main-area {
  padding: 24px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* {10} Títulos de sección */
.section-title {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: var(--text-secondary);
  margin-bottom: 12px;
}

/* ====================================================================
   {11} VISTA PREVIA 3D
   ==================================================================== */
#preview-section {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 16px;
  backdrop-filter: blur(8px);
}

#preview-container {
  width: 100%;
  height: 300px;
  background: #000000;
  border-radius: var(--radius-md);
  overflow: hidden;
  position: relative;
}

#preview-container canvas {
  display: block;
  width: 100%;
  height: 100%;
}

/* ====================================================================
   {12} CONTROLES DE VISUALIZACIÓN
   ==================================================================== */
#controls-section {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 16px;
  backdrop-filter: blur(8px);
}

#style-buttons {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.style-btn {
  flex: 1;
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition);
}

.style-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: var(--border-hover);
  color: var(--text-primary);
}

.style-btn.active {
  background: var(--accent-glow);
  border-color: var(--accent);
  color: var(--accent);
}

.action-btn {
  width: 100%;
  padding: 10px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  cursor: pointer;
  transition: all var(--transition);
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-primary);
  transform: translateY(-1px);
}

/* ====================================================================
   {13} CONTROLES DE AUDIO
   ==================================================================== */
#audio-section {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 16px;
  backdrop-filter: blur(8px);
}

#audio-track-name {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 12px;
}

#audio-controls {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.audio-btn {
  width: 44px;
  height: 44px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-size: 16px;
  cursor: pointer;
  transition: all var(--transition);
  display: flex;
  align-items: center;
  justify-content: center;
}

.audio-btn:hover:not(:disabled) {
  background: var(--accent-glow);
  border-color: var(--accent);
  color: var(--accent);
  transform: scale(1.05);
}

.audio-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

/* {14} Barra de progreso de audio */
#audio-progress {
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 2px;
  overflow: hidden;
}

#audio-progress-fill {
  width: 0%;
  height: 100%;
  background: var(--accent);
  border-radius: 2px;
  transition: width 0.1s linear;
}

/* ====================================================================
   {15} SCROLLBAR DEL ÁREA PRINCIPAL
   ==================================================================== */
#main-area::-webkit-scrollbar {
  width: 4px;
}

#main-area::-webkit-scrollbar-track {
  background: transparent;
}

#main-area::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 2px;
}
```

---

## Paso 2 — Implementar `src/control/molecule-list.js`

**Archivo**: `src/control/molecule-list.js`

Módulo que carga y renderiza la lista de moléculas en el sidebar. Al hacer click en una, emite `select-molecule` vía WebSocket.

```js
// ====================================================================
// ====================================================================
// {1} MOLECULE LIST — LISTA DE MOLÉCULAS
// ====================================================================
// Carga la lista de moléculas desde la API y la renderiza en el
// sidebar. Al seleccionar una, emite el evento vía WebSocket
// para sincronizar con la pantalla de exhibición.
// ====================================================================

import { API_BASE_URL, SOCKET_EVENTS } from '@shared/constants.js';

// {2} Estado
let molecules = [];
let activeId = null;
let socket = null;
let onSelectCallback = null;

// ====================================================================
// {3} INICIALIZAR
// ====================================================================
// @param {Socket} socketInstance       - Cliente Socket.IO
// @param {Function} onSelect          - Callback cuando se selecciona una molécula
// ====================================================================
export async function initMoleculeList(socketInstance, onSelect) {
  socket = socketInstance;
  onSelectCallback = onSelect;

  await loadMolecules();
  setupSearch();
}

// ====================================================================
// {4} CARGAR MOLÉCULAS DESDE LA API
// ====================================================================
async function loadMolecules() {
  try {
    const response = await fetch(`${API_BASE_URL}/molecules`);
    molecules = await response.json();
    renderList(molecules);

    console.log(`[MoleculeList] Loaded ${molecules.length} molecules`);
  } catch (error) {
    console.error('[MoleculeList] Error loading molecules:', error);
  }
}

// ====================================================================
// {5} RENDERIZAR LISTA
// ====================================================================
function renderList(moleculesToRender) {
  const listEl = document.getElementById('molecule-list');
  if (!listEl) return;

  listEl.innerHTML = '';

  moleculesToRender.forEach((molecule) => {
    const li = document.createElement('li');
    li.className = `molecule-item${molecule.id === activeId ? ' active' : ''}`;
    li.dataset.id = molecule.id;

    li.innerHTML = `
      <div class="molecule-item-name">${molecule.name}</div>
      <div class="molecule-item-meta">
        <span class="molecule-item-category">${molecule.category}</span>
        <span>${molecule.audioFile ? '🔊' : ''}</span>
      </div>
    `;

    // {6} Click handler
    li.addEventListener('click', () => {
      selectMolecule(molecule);
    });

    listEl.appendChild(li);
  });
}

// ====================================================================
// {7} SELECCIONAR MOLÉCULA
// ====================================================================
function selectMolecule(molecule) {
  activeId = molecule.id;

  // {8} Actualizar visual de la lista
  document.querySelectorAll('.molecule-item').forEach(el => {
    el.classList.toggle('active', el.dataset.id === activeId);
  });

  // {9} Emitir evento WebSocket
  socket.emit(SOCKET_EVENTS.SELECT_MOLECULE, {
    id: molecule.id,
    name: molecule.name
  });

  // {10} Callback local
  if (onSelectCallback) {
    onSelectCallback(molecule);
  }

  console.log(`[MoleculeList] Selected: ${molecule.name}`);
}

// ====================================================================
// {11} BÚSQUEDA / FILTRO
// ====================================================================
function setupSearch() {
  const searchInput = document.getElementById('molecule-search');
  if (!searchInput) return;

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();

    if (!query) {
      renderList(molecules);
      return;
    }

    const filtered = molecules.filter(m =>
      m.name.toLowerCase().includes(query) ||
      m.category.toLowerCase().includes(query)
    );

    renderList(filtered);
  });
}

// ====================================================================
// {12} REFRESCAR LISTA
// ====================================================================
// Llamar después de agregar/eliminar moléculas desde el admin.
// ====================================================================
export async function refreshList() {
  await loadMolecules();
}
```

---

## Paso 3 — Implementar `src/control/controls-panel.js`

**Archivo**: `src/control/controls-panel.js`

Módulo que gestiona la vista previa 3D miniatura y los controles de estilo. Cada interacción con la vista previa emite los datos correspondientes vía WebSocket.

```js
// ====================================================================
// ====================================================================
// {1} CONTROLS PANEL — VISTA PREVIA Y CONTROLES
// ====================================================================
// Gestiona:
// - Vista previa 3D miniatura con OrbitControls
// - Botones de estilo de visualización
// - Botón de reset de vista
//
// Cada interacción emite el cambio vía WebSocket para sincronizar
// con la pantalla de exhibición.
// ====================================================================

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { loadPDB, createMoleculeGroup } from '@shared/molecule-loader.js';
import {
  SOCKET_EVENTS,
  FILES_BASE_URL,
  VISUALIZATION_STYLES
} from '@shared/constants.js';

// {2} Estado
let scene, camera, renderer, controls;
let socket = null;
let currentPdbData = null;
let currentStyle = VISUALIZATION_STYLES.BALL_AND_STICK;
let syncThrottleTimer = null;

// ====================================================================
// {3} INICIALIZAR
// ====================================================================
export function initControlsPanel(socketInstance) {
  socket = socketInstance;

  setupPreview();
  setupStyleButtons();
  setupResetButton();
}

// ====================================================================
// {4} SETUP VISTA PREVIA 3D
// ====================================================================
function setupPreview() {
  const container = document.getElementById('preview-container');
  if (!container) return;

  // {5} Scene — fondo negro
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);

  // {6} Camera
  camera = new THREE.PerspectiveCamera(
    60,
    container.clientWidth / container.clientHeight,
    0.1,
    2000
  );
  camera.position.set(0, 0, 50);

  // {7} Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 1);
  container.appendChild(renderer.domElement);

  // {8} Iluminación
  scene.add(new THREE.AmbientLight(0xffffff, 0.5));
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(10, 10, 10);
  scene.add(dirLight);
  const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.3);
  dirLight2.position.set(-10, -5, -10);
  scene.add(dirLight2);

  // {9} OrbitControls
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.enablePan = false;

  // ====================================================================
  // {10} SINCRONIZAR MOVIMIENTOS CON EL DISPLAY
  // ====================================================================
  // Cuando el usuario mueve la preview, enviar la posición de la
  // cámara al display vía WebSocket. Throttled a 60fps max.
  // ====================================================================
  controls.addEventListener('change', () => {
    if (syncThrottleTimer) return;

    syncThrottleTimer = setTimeout(() => {
      syncThrottleTimer = null;

      socket.emit(SOCKET_EVENTS.ROTATE, {
        cameraPosition: {
          x: camera.position.x,
          y: camera.position.y,
          z: camera.position.z
        },
        target: {
          x: controls.target.x,
          y: controls.target.y,
          z: controls.target.z
        }
      });
    }, 16); // ~60fps
  });

  // {11} Render loop
  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }
  animate();

  // {12} Resize observer
  const resizeObserver = new ResizeObserver(() => {
    const w = container.clientWidth;
    const h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });
  resizeObserver.observe(container);
}

// ====================================================================
// {13} CARGAR MOLÉCULA EN LA PREVIEW
// ====================================================================
export async function loadMoleculePreview(molecule) {
  if (!scene) return;

  try {
    // {14} Limpiar escena
    clearScene();

    // {15} Cargar PDB
    const pdbUrl = `${FILES_BASE_URL}/pdb/${molecule.pdbFile}`;
    currentPdbData = await loadPDB(pdbUrl);

    // {16} Crear meshes
    const group = createMoleculeGroup(currentPdbData, currentStyle);
    scene.add(group);

    // {17} Ajustar cámara
    fitCamera(group);

    console.log(`[Preview] Loaded: ${molecule.name}`);
  } catch (error) {
    console.error('[Preview] Error loading molecule:', error);
  }
}

// ====================================================================
// {18} LIMPIAR ESCENA
// ====================================================================
function clearScene() {
  const toRemove = [];
  scene.traverse((child) => {
    if (child.name === 'molecule') toRemove.push(child);
  });
  toRemove.forEach(obj => {
    scene.remove(obj);
    obj.traverse(child => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
  });
}

// ====================================================================
// {19} AJUSTAR CÁMARA
// ====================================================================
function fitCamera(group) {
  const box = new THREE.Box3().setFromObject(group);
  const sphere = new THREE.Sphere();
  box.getBoundingSphere(sphere);

  const fov = camera.fov * (Math.PI / 180);
  const distance = sphere.radius / Math.sin(fov / 2) * 1.2;

  camera.position.set(0, 0, distance);
  controls.target.copy(sphere.center);
  controls.update();
}

// ====================================================================
// {20} BOTONES DE ESTILO
// ====================================================================
function setupStyleButtons() {
  const buttons = document.querySelectorAll('.style-btn');

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const style = btn.dataset.style;
      if (style === currentStyle) return;

      currentStyle = style;

      // {21} Actualizar visual
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // {22} Re-renderizar en la preview
      if (currentPdbData) {
        clearScene();
        const group = createMoleculeGroup(currentPdbData, style);
        scene.add(group);
        fitCamera(group);
      }

      // {23} Emitir al display
      socket.emit(SOCKET_EVENTS.STYLE_CHANGE, { style });

      console.log(`[Controls] Style: ${style}`);
    });
  });
}

// ====================================================================
// {24} BOTÓN RESET VIEW
// ====================================================================
function setupResetButton() {
  const btn = document.getElementById('reset-view-btn');
  if (!btn) return;

  btn.addEventListener('click', () => {
    // {25} Resetear preview local
    if (controls) {
      controls.reset();
    }

    // {26} Emitir al display
    socket.emit(SOCKET_EVENTS.RESET_VIEW);

    console.log('[Controls] View reset');
  });
}
```

---

## Paso 4 — Implementar `src/control/audio-controls.js`

**Archivo**: `src/control/audio-controls.js`

Módulo que gestiona los controles de audio: play, pause, stop, y barra de progreso.

```js
// ====================================================================
// ====================================================================
// {1} AUDIO CONTROLS — CONTROLES DE AUDIO
// ====================================================================
// Gestiona los botones de audio (play/pause/stop) y la barra de
// progreso. Emite comandos vía WebSocket al display donde el
// audio realmente se reproduce.
// ====================================================================

import { SOCKET_EVENTS } from '@shared/constants.js';

// {2} Estado
let socket = null;
let hasAudio = false;

// ====================================================================
// {3} INICIALIZAR
// ====================================================================
export function initAudioControls(socketInstance) {
  socket = socketInstance;

  const playBtn = document.getElementById('audio-play-btn');
  const pauseBtn = document.getElementById('audio-pause-btn');
  const stopBtn = document.getElementById('audio-stop-btn');

  // {4} Event listeners
  if (playBtn) {
    playBtn.addEventListener('click', () => {
      socket.emit(SOCKET_EVENTS.AUDIO_CONTROL, { action: 'play' });
    });
  }

  if (pauseBtn) {
    pauseBtn.addEventListener('click', () => {
      socket.emit(SOCKET_EVENTS.AUDIO_CONTROL, { action: 'pause' });
    });
  }

  if (stopBtn) {
    stopBtn.addEventListener('click', () => {
      socket.emit(SOCKET_EVENTS.AUDIO_CONTROL, { action: 'stop' });
    });
  }
}

// ====================================================================
// {5} ACTUALIZAR ESTADO DE AUDIO
// ====================================================================
// Llamar cuando se selecciona una nueva molécula para habilitar
// o deshabilitar los controles según si tiene audio.
//
// @param {object|null} molecule - Molécula seleccionada
// ====================================================================
export function updateAudioState(molecule) {
  hasAudio = !!(molecule && molecule.audioFile);

  const playBtn = document.getElementById('audio-play-btn');
  const pauseBtn = document.getElementById('audio-pause-btn');
  const stopBtn = document.getElementById('audio-stop-btn');
  const trackName = document.getElementById('audio-track-name');

  // {6} Habilitar/deshabilitar botones
  [playBtn, pauseBtn, stopBtn].forEach(btn => {
    if (btn) btn.disabled = !hasAudio;
  });

  // {7} Actualizar nombre del track
  if (trackName) {
    trackName.textContent = hasAudio
      ? `🔊 ${molecule.name}`
      : 'Sin audio disponible';
  }

  // {8} Resetear barra de progreso
  const fill = document.getElementById('audio-progress-fill');
  if (fill) fill.style.width = '0%';
}
```

---

## Paso 5 — Implementar `src/control/control.js`

**Archivo**: `src/control/control.js` (reemplazar placeholder)

Entry point de la pantalla de control. Orquesta todos los sub-módulos.

```js
// ====================================================================
// ====================================================================
// {1} CONTROL — ENTRY POINT PRINCIPAL
// ====================================================================
// Pantalla de control interactivo de Aletheia.
// Orquesta:
// - Lista de moléculas (molecule-list.js)
// - Vista previa 3D + controles (controls-panel.js)
// - Controles de audio (audio-controls.js)
// - WebSocket para enviar comandos al display
// ====================================================================

import { createSocketClient } from '@shared/socket-client.js';
import { CLIENT_TYPES } from '@shared/constants.js';
import { initMoleculeList } from './molecule-list.js';
import { initControlsPanel, loadMoleculePreview } from './controls-panel.js';
import { initAudioControls, updateAudioState } from './audio-controls.js';

// ====================================================================
// {2} INICIALIZACIÓN
// ====================================================================
async function init() {
  console.log('[Control] Initializing...');

  // {3} Conectar WebSocket como 'control'
  const socket = createSocketClient(CLIENT_TYPES.CONTROL);

  // {4} Inicializar controles de visualización y audio
  initControlsPanel(socket);
  initAudioControls(socket);

  // ====================================================================
  // {5} INICIALIZAR LISTA DE MOLÉCULAS
  // ====================================================================
  // Cuando el usuario selecciona una molécula, cargar en la preview
  // local y actualizar los controles de audio.
  // ====================================================================
  await initMoleculeList(socket, async (molecule) => {
    // {6} Cargar en la preview 3D local
    await loadMoleculePreview(molecule);

    // {7} Actualizar controles de audio
    updateAudioState(molecule);
  });

  console.log('[Control] Ready');
}

// ====================================================================
// {8} ARRANQUE
// ====================================================================
init();
```

---

## Verificación

```bash
# 1. Iniciar todo
npm run dev

# 2. Abrir la pantalla de control
# http://localhost:5173/src/control/

# Verificar:
# ✅ Sidebar muestra la lista de moléculas (o vacía si no hay)
# ✅ Búsqueda filtra por nombre y categoría
# ✅ Hacer click en una molécula la carga en la preview 3D
# ✅ Los botones de estilo cambian la visualización
# ✅ El botón de reset resetea la vista
# ✅ Los controles de audio se habilitan si la molécula tiene audio

# 3. Abrir la pantalla de display en otra pestaña
# http://localhost:5173/src/display/

# Verificar sincronización:
# ✅ Seleccionar molécula en control → aparece en display
# ✅ Rotar la preview en control → la molécula rota en display
# ✅ Cambiar estilo en control → cambia en display
# ✅ Reset view en control → resetea en display
# ✅ Controles de audio en control → audio suena en display
```

Si todo funciona, la Fase 5 está completa. Proceder a Fase 6.
