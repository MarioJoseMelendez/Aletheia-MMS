# Fase 4 — Pantalla de Exhibición (Display)

> **Objetivo**: Implementar la pantalla de exhibición fullscreen que renderiza macromoléculas en 3D con Three.js. Se conecta al backend por WebSocket para recibir comandos de la pantalla de control. Cuando no hay interacción, se auto-rota mostrándose sola. Incluye loading screen personalizable y overlay de info de molécula. Fondo negro puro #000000. Audio se auto-reproduce al seleccionar una molécula.

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

- Fase 1 completada (HTML base en `src/display/index.html`)
- Fase 2 completada (backend corriendo con Socket.IO)
- Fase 3 completada (módulos compartidos: `constants.js`, `socket-client.js`, `molecule-loader.js`)

---

## Paso 1 — Actualizar `src/display/index.html`

**Archivo**: `src/display/index.html`

Reemplazar el HTML de Fase 1 con la versión final. La página es fullscreen con fondo negro puro. Contiene el canvas de Three.js, el loading screen y el molecule overlay como bloques HTML estáticos personalizables.

> **IMPORTANTE**: El loading screen y el overlay están delimitados con comentarios HTML claros (`<!-- LOADING SCREEN START -->`, etc.) para que el usuario pueda modificarlos fácilmente sin tocar JS.

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Aletheia — Exhibición</title>
  <meta name="description" content="Aletheia: Visualización de macromoléculas biológicas en 3D" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="./display.css" />
</head>
<body>

  <!-- ==================================================================
       ==================================================================
       {1} CANVAS 3D
       ==================================================================
       Contenedor del canvas de Three.js. Ocupa el 100% del viewport.
       NO MODIFICAR este div — el canvas se genera desde JavaScript.
       ================================================================== -->
  <div id="canvas-container"></div>

  <!-- ==================================================================
       ==================================================================
       {2} LOADING SCREEN — PERSONALIZABLE
       ==================================================================
       Pantalla de carga. Puedes modificar TODO el HTML y CSS de esta
       sección libremente. El JS solo controla la clase .hidden
       para mostrar/ocultar. No se genera HTML dinámico.
       ================================================================== -->
  <!-- LOADING SCREEN START -->
  <div id="loading-screen">
    <div class="loading-content">
      <div class="loading-spinner"></div>
      <p class="loading-text">Cargando molécula…</p>
      <div class="loading-bar">
        <div class="loading-bar-fill" id="loading-bar-fill"></div>
      </div>
    </div>
  </div>
  <!-- LOADING SCREEN END -->

  <!-- ==================================================================
       ==================================================================
       {3} MOLECULE OVERLAY — PERSONALIZABLE
       ==================================================================
       Desplegable con info de la molécula actual. Puedes modificar
       TODO el HTML y CSS. El JS solo inyecta texto en los elementos
       con ID y controla la clase .hidden para mostrar/ocultar.
       ================================================================== -->
  <!-- MOLECULE OVERLAY START -->
  <div id="molecule-overlay" class="hidden">
    <h2 id="molecule-name"></h2>
    <p id="molecule-description"></p>
    <span id="molecule-category"></span>
  </div>
  <!-- MOLECULE OVERLAY END -->

  <!-- ==================================================================
       {4} SCRIPT PRINCIPAL
       ================================================================== -->
  <script type="module" src="./display.js"></script>

</body>
</html>
```

---

## Paso 2 — Implementar `src/display/display.css`

**Archivo**: `src/display/display.css`

Estilos completos para la pantalla de exhibición. Fondo negro puro `#000000` en todos los elementos. El loading screen y molecule overlay tienen sus propios bloques CSS claramente delimitados y usan CSS custom properties para fácil personalización.

```css
/* ====================================================================
   ====================================================================
   {1} DISPLAY — ESTILOS PRINCIPALES
   ====================================================================
   Pantalla de exhibición fullscreen para macromoléculas 3D.
   Fondo negro puro #000000 obligatorio en toda la página.
   ==================================================================== */

/* ====================================================================
   {2} RESET Y BASE
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
  background: #000000;
  font-family: 'Inter', sans-serif;
  color: #ffffff;
}

/* ====================================================================
   {3} CANVAS 3D
   ====================================================================
   El canvas de Three.js ocupa todo el viewport.
   ==================================================================== */
#canvas-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #000000;
  z-index: 1;
}

#canvas-container canvas {
  display: block;
  width: 100%;
  height: 100%;
}

/* ====================================================================
   ====================================================================
   {4} LOADING SCREEN — PERSONALIZABLE
   ====================================================================
   Modifica las variables CSS y los estilos de esta sección para
   cambiar completamente el look del loading screen sin tocar JS.

   Variables disponibles:
   --loading-bg          Fondo del loading screen
   --loading-text-color  Color del texto
   --loading-accent      Color del spinner y barra de progreso
   --loading-bar-bg      Fondo de la barra de progreso
   --loading-bar-height  Alto de la barra de progreso
   ==================================================================== */
#loading-screen {
  --loading-bg: #000000;
  --loading-text-color: #ffffff;
  --loading-accent: #00d4aa;
  --loading-bar-bg: #1a1a2e;
  --loading-bar-height: 3px;

  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: var(--loading-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  transition: opacity 0.6s ease, visibility 0.6s ease;
}

#loading-screen.hidden {
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
}

.loading-content {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}

/* {5} Spinner */
.loading-spinner {
  width: 48px;
  height: 48px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top-color: var(--loading-accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* {6} Texto de carga */
.loading-text {
  color: var(--loading-text-color);
  font-size: 14px;
  font-weight: 300;
  letter-spacing: 1px;
  text-transform: uppercase;
}

/* {7} Barra de progreso */
.loading-bar {
  width: 200px;
  height: var(--loading-bar-height);
  background: var(--loading-bar-bg);
  border-radius: 2px;
  overflow: hidden;
}

.loading-bar-fill {
  width: 0%;
  height: 100%;
  background: var(--loading-accent);
  border-radius: 2px;
  transition: width 0.3s ease;
}

/* ====================================================================
   ====================================================================
   {8} MOLECULE OVERLAY — PERSONALIZABLE
   ====================================================================
   Modifica estos estilos para cambiar el aspecto del overlay de
   información de molécula. El JS solo controla la clase .hidden
   y el texto de #molecule-name, #molecule-description, #molecule-category.
   ==================================================================== */
#molecule-overlay {
  --overlay-bg: rgba(0, 0, 0, 0.6);
  --overlay-border: rgba(255, 255, 255, 0.08);
  --overlay-text: #ffffff;
  --overlay-accent: #00d4aa;
  --overlay-backdrop-blur: 12px;

  position: fixed;
  bottom: 40px;
  left: 40px;
  padding: 20px 28px;
  background: var(--overlay-bg);
  backdrop-filter: blur(var(--overlay-backdrop-blur));
  -webkit-backdrop-filter: blur(var(--overlay-backdrop-blur));
  border: 1px solid var(--overlay-border);
  border-radius: 12px;
  z-index: 50;
  max-width: 400px;
  transition: opacity 0.4s ease, transform 0.4s ease, visibility 0.4s ease;
  transform: translateY(0);
}

#molecule-overlay.hidden {
  opacity: 0;
  visibility: hidden;
  transform: translateY(20px);
  pointer-events: none;
}

#molecule-name {
  font-size: 20px;
  font-weight: 600;
  color: var(--overlay-text);
  margin-bottom: 6px;
}

#molecule-description {
  font-size: 13px;
  font-weight: 300;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.5;
  margin-bottom: 8px;
}

#molecule-category {
  font-size: 11px;
  font-weight: 500;
  color: var(--overlay-accent);
  text-transform: uppercase;
  letter-spacing: 1.5px;
}

/* ====================================================================
   {9} CURSOR OCULTO EN IDLE
   ====================================================================
   Cuando la pantalla está en modo idle (auto-rotación), se oculta
   el cursor para una experiencia inmersiva.
   ==================================================================== */
body.idle-mode {
  cursor: none;
}
```

---

## Paso 3 — Implementar `src/display/scene.js`

**Archivo**: `src/display/scene.js`

Módulo que crea y configura la escena Three.js completa: scene, camera, renderer, iluminación, y controles orbitales. Fondo negro puro.

```js
// ====================================================================
// ====================================================================
// {1} SCENE — SETUP DE THREE.JS
// ====================================================================
// Crea y configura la escena 3D completa para la pantalla de
// exhibición. Incluye: Scene, Camera, Renderer, Iluminación,
// y OrbitControls.
// Fondo: negro puro #000000. Sin excepciones.
// ====================================================================

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

// ====================================================================
// {2} ESTADO DEL MÓDULO
// ====================================================================
let scene, camera, renderer, controls, composer;
let container;

// ====================================================================
// {3} INICIALIZAR ESCENA
// ====================================================================
// Crea todos los objetos Three.js y los vincula al contenedor DOM.
// @param {HTMLElement} containerEl - div#canvas-container
// @returns {object} - { scene, camera, renderer, controls, composer }
// ====================================================================
export function initScene(containerEl) {
  container = containerEl;

  // {4} Scene — fondo negro puro
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);

  // {5} Camera
  camera = new THREE.PerspectiveCamera(
    60,
    container.clientWidth / container.clientHeight,
    0.1,
    2000
  );
  camera.position.set(0, 0, 50);

  // {6} Renderer
  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false
  });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 1);
  container.appendChild(renderer.domElement);

  // ====================================================================
  // {7} ILUMINACIÓN
  // ====================================================================
  // Combinación de ambient + directional + point para dar volumen
  // a las esferas de los átomos sin sobreexponer.
  // ====================================================================
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(10, 10, 10);
  scene.add(directionalLight);

  const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.3);
  directionalLight2.position.set(-10, -5, -10);
  scene.add(directionalLight2);

  const pointLight = new THREE.PointLight(0x4488ff, 0.3, 100);
  pointLight.position.set(0, 20, 0);
  scene.add(pointLight);

  // ====================================================================
  // {8} ORBIT CONTROLS
  // ====================================================================
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.autoRotate = false;
  controls.autoRotateSpeed = 1.0;
  controls.enablePan = false;
  controls.minDistance = 5;
  controls.maxDistance = 200;

  // ====================================================================
  // {9} POST-PROCESSING — BLOOM SUTIL
  // ====================================================================
  // Un bloom muy sutil para que los átomos tengan un brillo elegante
  // sin resultar excesivo.
  // ====================================================================
  composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(container.clientWidth, container.clientHeight),
    0.15,  // strength — muy sutil
    0.4,   // radius
    0.85   // threshold
  );
  composer.addPass(bloomPass);

  // ====================================================================
  // {10} RESIZE HANDLER
  // ====================================================================
  window.addEventListener('resize', onResize);

  return { scene, camera, renderer, controls, composer };
}

// ====================================================================
// {11} LOOP DE ANIMACIÓN
// ====================================================================
// Debe llamarse una vez para iniciar el render loop.
// ====================================================================
export function startRenderLoop() {
  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    composer.render();
  }
  animate();
}

// ====================================================================
// {12} RESIZE
// ====================================================================
function onResize() {
  if (!container || !camera || !renderer) return;

  const width = container.clientWidth;
  const height = container.clientHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  renderer.setSize(width, height);
  composer.setSize(width, height);
}

// ====================================================================
// {13} LIMPIAR MOLÉCULA DE LA ESCENA
// ====================================================================
// Elimina todos los objetos con name='molecule' de la escena,
// liberando geometrías y materiales.
// ====================================================================
export function clearMolecule() {
  const toRemove = [];
  scene.traverse((child) => {
    if (child.name === 'molecule') {
      toRemove.push(child);
    }
  });

  toRemove.forEach((obj) => {
    scene.remove(obj);
    obj.traverse((child) => {
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
// {14} AÑADIR MOLÉCULA A LA ESCENA
// ====================================================================
export function addMoleculeToScene(moleculeGroup) {
  clearMolecule();
  scene.add(moleculeGroup);

  // {15} Ajustar cámara para encuadrar la molécula
  fitCameraToMolecule(moleculeGroup);
}

// ====================================================================
// {16} AJUSTAR CÁMARA
// ====================================================================
// Calcula el bounding sphere de la molécula y posiciona la cámara
// para que se vea completa.
// ====================================================================
function fitCameraToMolecule(group) {
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
// {17} GETTERS
// ====================================================================
export function getScene() { return scene; }
export function getCamera() { return camera; }
export function getControls() { return controls; }
export function getRenderer() { return renderer; }
```

---

## Paso 4 — Implementar `src/display/auto-rotate.js`

**Archivo**: `src/display/auto-rotate.js`

Módulo que gestiona la auto-rotación idle. Después de un periodo sin interacción, activa la auto-rotación de OrbitControls. Cualquier interacción (WebSocket o mouse) cancela el idle y reinicia el timer.

```js
// ====================================================================
// ====================================================================
// {1} AUTO-ROTATE — MODO IDLE
// ====================================================================
// Gestiona la auto-rotación automática de la molécula cuando no
// hay interacción del usuario. Después de IDLE_TIMEOUT milisegundos
// sin actividad, la molécula empieza a rotar sola.
//
// Cualquier evento (WebSocket o interacción directa) cancela el
// idle y reinicia el temporizador.
// ====================================================================

import { IDLE_TIMEOUT, AUTO_ROTATE_SPEED } from '@shared/constants.js';

// {2} Estado del módulo
let controls = null;
let idleTimer = null;
let isIdle = false;
let onIdleStartCallback = null;

// ====================================================================
// {3} INICIALIZAR
// ====================================================================
// @param {OrbitControls} orbitControls - Controles de la escena
// @param {Function} onIdleStart       - Callback cuando inicia el idle
// ====================================================================
export function initAutoRotate(orbitControls, onIdleStart = null) {
  controls = orbitControls;
  onIdleStartCallback = onIdleStart;

  // {4} Desactivar auto-rotación inicialmente
  controls.autoRotate = false;

  // {5} Iniciar el timer de idle
  resetIdleTimer();
}

// ====================================================================
// {6} RESETEAR TIMER
// ====================================================================
// Cancela el idle actual (si hay) y reinicia el temporizador.
// Llamar esta función cada vez que hay interacción.
// ====================================================================
export function resetIdleTimer() {
  // {7} Si estaba en idle, desactivar auto-rotación
  if (isIdle) {
    controls.autoRotate = false;
    isIdle = false;
    document.body.classList.remove('idle-mode');
  }

  // {8} Limpiar timer anterior
  if (idleTimer) {
    clearTimeout(idleTimer);
  }

  // {9} Nuevo timer
  idleTimer = setTimeout(() => {
    startIdle();
  }, IDLE_TIMEOUT);
}

// ====================================================================
// {10} INICIAR MODO IDLE
// ====================================================================
function startIdle() {
  isIdle = true;
  controls.autoRotate = true;
  controls.autoRotateSpeed = AUTO_ROTATE_SPEED;
  document.body.classList.add('idle-mode');

  console.log('[AutoRotate] Idle mode started');

  // {11} Notificar al callback (para emitir evento WebSocket)
  if (onIdleStartCallback) {
    onIdleStartCallback();
  }
}

// ====================================================================
// {12} GETTERS
// ====================================================================
export function getIsIdle() {
  return isIdle;
}

// ====================================================================
// {13} DESTRUIR
// ====================================================================
export function destroyAutoRotate() {
  if (idleTimer) {
    clearTimeout(idleTimer);
    idleTimer = null;
  }
  isIdle = false;
}
```

---

## Paso 5 — Implementar `src/display/loading-screen.js`

**Archivo**: `src/display/loading-screen.js`

Controlador minimalista del loading screen. **No genera HTML dinámico** — toda la estructura está en el HTML. Solo controla `show()` / `hide()` y actualiza la barra de progreso.

```js
// ====================================================================
// ====================================================================
// {1} LOADING SCREEN — CONTROLADOR
// ====================================================================
// Controla la visibilidad del loading screen definido en el HTML.
// NO genera HTML dinámico. Toda la personalización visual se hace
// modificando el HTML en index.html y los estilos en display.css.
//
// API:
// - show()           → Muestra el loading screen
// - hide()           → Oculta con fade-out
// - setProgress(pct) → Actualiza la barra de progreso (0-100)
// - setText(text)     → Cambia el texto de carga
// ====================================================================

// {2} Referencias al DOM
const screen = document.getElementById('loading-screen');
const barFill = document.getElementById('loading-bar-fill');
const textEl = document.querySelector('.loading-text');

// ====================================================================
// {3} MOSTRAR
// ====================================================================
export function show() {
  if (screen) {
    screen.classList.remove('hidden');
  }
}

// ====================================================================
// {4} OCULTAR
// ====================================================================
// Añade la clase .hidden que aplica fade-out vía CSS transition.
// ====================================================================
export function hide() {
  if (screen) {
    screen.classList.add('hidden');
  }
}

// ====================================================================
// {5} ACTUALIZAR PROGRESO
// ====================================================================
// @param {number} percent - Porcentaje de 0 a 100
// ====================================================================
export function setProgress(percent) {
  if (barFill) {
    barFill.style.width = `${Math.min(100, Math.max(0, percent))}%`;
  }
}

// ====================================================================
// {6} ACTUALIZAR TEXTO
// ====================================================================
// @param {string} text - Nuevo texto de carga
// ====================================================================
export function setText(text) {
  if (textEl) {
    textEl.textContent = text;
  }
}
```

---

## Paso 6 — Implementar `src/display/display.js`

**Archivo**: `src/display/display.js` (reemplazar placeholder)

Entry point principal de la pantalla de exhibición. Orquesta todos los módulos: scene, auto-rotate, loading screen, WebSocket, y audio. Este es el archivo más importante de la pantalla de display.

```js
// ====================================================================
// ====================================================================
// {1} DISPLAY — ENTRY POINT PRINCIPAL
// ====================================================================
// Pantalla de exhibición fullscreen de Aletheia.
// Orquesta:
// - Three.js scene (scene.js)
// - Auto-rotación idle (auto-rotate.js)
// - Loading screen (loading-screen.js)
// - WebSocket para recibir comandos del control (socket-client.js)
// - Audio player (reproduce al seleccionar molécula)
// ====================================================================

import { initScene, startRenderLoop, clearMolecule, addMoleculeToScene, getControls } from './scene.js';
import { initAutoRotate, resetIdleTimer } from './auto-rotate.js';
import * as loadingScreen from './loading-screen.js';
import { createSocketClient } from '@shared/socket-client.js';
import { loadPDB, createMoleculeGroup, applyStyle } from '@shared/molecule-loader.js';
import {
  SOCKET_EVENTS,
  CLIENT_TYPES,
  FILES_BASE_URL,
  API_BASE_URL,
  VISUALIZATION_STYLES
} from '@shared/constants.js';

// ====================================================================
// {2} ESTADO
// ====================================================================
let currentMolecule = null;
let currentPdbData = null;
let currentStyle = VISUALIZATION_STYLES.BALL_AND_STICK;
let audioElement = null;
let socket = null;

// ====================================================================
// {3} INICIALIZACIÓN
// ====================================================================
async function init() {
  console.log('[Display] Initializing...');

  // {4} Inicializar Three.js scene
  const container = document.getElementById('canvas-container');
  const { controls } = initScene(container);

  // {5} Iniciar render loop
  startRenderLoop();

  // {6} Inicializar auto-rotación
  initAutoRotate(controls, () => {
    // Callback: notificar al server que entró en idle
    if (socket) {
      socket.emit(SOCKET_EVENTS.IDLE_STARTED);
    }
  });

  // {7} Crear elemento de audio
  audioElement = new Audio();
  audioElement.preload = 'auto';

  // {8} Conectar WebSocket
  socket = createSocketClient(CLIENT_TYPES.DISPLAY);
  setupSocketListeners();

  // {9} Cargar molécula por defecto (primera del catálogo)
  await loadDefaultMolecule();

  console.log('[Display] Ready');
}

// ====================================================================
// {10} LISTENERS DE WEBSOCKET
// ====================================================================
// Escucha los comandos enviados desde la pantalla de control
// y los aplica a la escena local.
// ====================================================================
function setupSocketListeners() {

  // {11} Seleccionar molécula
  socket.on(SOCKET_EVENTS.SELECT_MOLECULE, async (data) => {
    console.log(`[Display] Select molecule: ${data.name || data.id}`);
    resetIdleTimer();
    await selectMolecule(data.id);
  });

  // {12} Rotación desde el control
  socket.on(SOCKET_EVENTS.ROTATE, (data) => {
    resetIdleTimer();
    const controls = getControls();
    if (controls && data.quaternion) {
      // Aplicar la rotación recibida directamente a la cámara
      // Nota: el control envía el target y la posición de la cámara
      if (data.cameraPosition) {
        controls.object.position.set(
          data.cameraPosition.x,
          data.cameraPosition.y,
          data.cameraPosition.z
        );
      }
      if (data.target) {
        controls.target.set(data.target.x, data.target.y, data.target.z);
      }
      controls.update();
    }
  });

  // {13} Zoom
  socket.on(SOCKET_EVENTS.ZOOM, (data) => {
    resetIdleTimer();
    const controls = getControls();
    if (controls && data.cameraPosition) {
      controls.object.position.set(
        data.cameraPosition.x,
        data.cameraPosition.y,
        data.cameraPosition.z
      );
      controls.update();
    }
  });

  // {14} Cambio de estilo
  socket.on(SOCKET_EVENTS.STYLE_CHANGE, (data) => {
    resetIdleTimer();
    changeStyle(data.style);
  });

  // {15} Control de audio
  socket.on(SOCKET_EVENTS.AUDIO_CONTROL, (data) => {
    resetIdleTimer();
    handleAudioControl(data.action);
  });

  // {16} Resetear vista
  socket.on(SOCKET_EVENTS.RESET_VIEW, () => {
    resetIdleTimer();
    const controls = getControls();
    if (controls) {
      controls.reset();
    }
  });

  // {17} Estado inicial sincronizado
  socket.on(SOCKET_EVENTS.SYNC_STATE, (state) => {
    if (state.currentMolecule) {
      selectMolecule(state.currentMolecule.id);
    }
    if (state.currentStyle) {
      changeStyle(state.currentStyle);
    }
  });
}

// ====================================================================
// {18} SELECCIONAR MOLÉCULA
// ====================================================================
// Carga una molécula por ID: fetch metadata → cargar PDB → renderizar.
// El audio se auto-reproduce al seleccionar.
// ====================================================================
async function selectMolecule(moleculeId) {
  try {
    // {19} Mostrar loading screen
    loadingScreen.show();
    loadingScreen.setProgress(0);
    loadingScreen.setText('Cargando molécula…');

    // {20} Fetch metadata desde la API
    const response = await fetch(`${API_BASE_URL}/molecules/${moleculeId}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const molecule = await response.json();

    currentMolecule = molecule;
    loadingScreen.setProgress(20);

    // {21} Cargar archivo PDB
    loadingScreen.setText('Parseando estructura…');
    const pdbUrl = `${FILES_BASE_URL}/pdb/${molecule.pdbFile}`;
    currentPdbData = await loadPDB(pdbUrl);
    loadingScreen.setProgress(70);

    // {22} Crear grupo de Three.js
    loadingScreen.setText('Renderizando…');
    const moleculeGroup = createMoleculeGroup(currentPdbData, currentStyle);
    addMoleculeToScene(moleculeGroup);
    loadingScreen.setProgress(90);

    // {23} Actualizar overlay con info de la molécula
    updateOverlay(molecule);

    // {24} Auto-reproducir audio si existe
    if (molecule.audioFile) {
      audioElement.src = `${FILES_BASE_URL}/audio/${molecule.audioFile}`;
      audioElement.play().catch(err => {
        console.warn('[Display] Audio autoplay blocked:', err.message);
      });
    } else {
      audioElement.pause();
      audioElement.src = '';
    }

    // {25} Ocultar loading screen
    loadingScreen.setProgress(100);
    setTimeout(() => {
      loadingScreen.hide();
    }, 300);

    console.log(`[Display] Molecule loaded: ${molecule.name}`);

  } catch (error) {
    console.error('[Display] Error loading molecule:', error);
    loadingScreen.setText('Error al cargar molécula');
    setTimeout(() => loadingScreen.hide(), 2000);
  }
}

// ====================================================================
// {26} CAMBIAR ESTILO DE VISUALIZACIÓN
// ====================================================================
function changeStyle(style) {
  if (!currentPdbData || style === currentStyle) return;

  currentStyle = style;
  const moleculeGroup = createMoleculeGroup(currentPdbData, style);
  addMoleculeToScene(moleculeGroup);

  console.log(`[Display] Style changed to: ${style}`);
}

// ====================================================================
// {27} CONTROL DE AUDIO
// ====================================================================
function handleAudioControl(action) {
  if (!audioElement) return;

  switch (action) {
    case 'play':
      audioElement.play().catch(err => {
        console.warn('[Display] Audio play failed:', err.message);
      });
      break;
    case 'pause':
      audioElement.pause();
      break;
    case 'stop':
      audioElement.pause();
      audioElement.currentTime = 0;
      break;
  }
}

// ====================================================================
// {28} ACTUALIZAR OVERLAY
// ====================================================================
function updateOverlay(molecule) {
  const nameEl = document.getElementById('molecule-name');
  const descEl = document.getElementById('molecule-description');
  const catEl = document.getElementById('molecule-category');
  const overlay = document.getElementById('molecule-overlay');

  if (nameEl) nameEl.textContent = molecule.name;
  if (descEl) descEl.textContent = molecule.description;
  if (catEl) catEl.textContent = molecule.category;
  if (overlay) overlay.classList.remove('hidden');

  // {29} Auto-ocultar overlay después de 5 segundos
  setTimeout(() => {
    if (overlay) overlay.classList.add('hidden');
  }, 5000);
}

// ====================================================================
// {30} CARGAR MOLÉCULA POR DEFECTO
// ====================================================================
// Carga la primera molécula del catálogo al iniciar.
// ====================================================================
async function loadDefaultMolecule() {
  try {
    const response = await fetch(`${API_BASE_URL}/molecules`);
    const molecules = await response.json();

    if (molecules.length > 0) {
      await selectMolecule(molecules[0].id);
    } else {
      console.log('[Display] No molecules available');
      loadingScreen.setText('No hay moléculas disponibles');
      setTimeout(() => loadingScreen.hide(), 2000);
    }
  } catch (error) {
    console.error('[Display] Error loading default molecule:', error);
    loadingScreen.setText('Error de conexión');
    setTimeout(() => loadingScreen.hide(), 2000);
  }
}

// ====================================================================
// {31} ARRANQUE
// ====================================================================
init();
```

---

## Verificación

```bash
# 1. Asegurarse que el backend está corriendo
npm run dev:server

# 2. Iniciar Vite
npm run dev:client

# 3. Abrir la pantalla de exhibición
# http://localhost:5173/src/display/

# Verificar:
# ✅ Fondo negro puro #000000
# ✅ Loading screen aparece al cargar
# ✅ Loading screen desaparece con fade-out
# ✅ Si hay moléculas en la DB, se carga la primera
# ✅ Overlay de info aparece y desaparece después de 5s
# ✅ Después de 30s sin interacción, la molécula empieza a rotar sola
# ✅ El cursor desaparece en modo idle
# ✅ Conecta al WebSocket y recibe comandos
```

Si todo funciona, la Fase 4 está completa. Proceder a Fase 5.
