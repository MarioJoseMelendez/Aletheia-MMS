// ====================================================================
// ====================================================================
// {1} PANTALLA DE EXHIBICIÓN — ENTRY POINT
// ====================================================================
// Controlador principal de la vista 3D en pantalla completa.
// Escucha eventos del WebSocket y reacciona actualizando la escena.
// Carga automáticamente una molécula demo si no hay selección inicial.
// ====================================================================

import { DisplayScene } from './scene.js';
import { loadingScreen } from './loading-screen.js';
import { wsClient } from '../shared/websocket-client.js';
import { moleculeLoader } from '../shared/molecule-loader.js';
import { WS_EVENTS, CONFIG, VISUALIZATION_STYLES } from '../shared/constants.js';

// Molécula por defecto si se abre la pantalla de exhibición sola
const DEFAULT_DEMO_MOLECULE = {
  id: 'hemoglobin-demo',
  name: 'Hemoglobina',
  description: 'Proteína tetramérica encargada del transporte de oxígeno en los glóbulos rojos.',
  category: 'Proteínas',
  pdbFile: 'demo_1A3N.pdb',
  audioFile: null
};

// ====================================================================
// {2} ESTADO GLOBAL
// ====================================================================
const state = {
  activeMoleculeId: null,
  currentStyle: VISUALIZATION_STYLES.BALL_AND_STICK,
  audioElement: new Audio(),
  scene: null
};

// ====================================================================
// {3} INICIALIZACIÓN
// ====================================================================
async function init() {
  console.log('[Aletheia] Inicializando Display...');
  
  // 1. Setup Escena 3D
  state.scene = new DisplayScene('canvas-container');
  
  // 2. Iniciar loop de renderizado
  const animate = () => {
    requestAnimationFrame(animate);
    state.scene.renderer.render(state.scene.scene, state.scene.camera);
  };
  animate();

  // 3. Suscribirse a eventos WebSocket
  setupWebSocketListeners();

  // 4. Cargar molécula inicial por defecto
  await loadMolecule(DEFAULT_DEMO_MOLECULE);
}

// ====================================================================
// {4} MANEJO DE WEBSOCKET
// ====================================================================
function setupWebSocketListeners() {
  
  // Cargar nueva molécula
  wsClient.on(WS_EVENTS.SELECT_MOLECULE, async (moleculeData) => {
    await loadMolecule(moleculeData);
  });

  // Sincronización de cámara desde Control (posición + target)
  wsClient.on(WS_EVENTS.CAMERA_UPDATE, (data) => {
    state.scene.setCamera(data.cameraPos, data.targetPos);
  });

  // Resetear cámara
  wsClient.on(WS_EVENTS.RESET_VIEW, () => {
    state.scene.resetView();
  });

  // Cambiar estilo visual
  wsClient.on(WS_EVENTS.STYLE_CHANGE, async (style) => {
    if (state.activeMoleculeId && state.currentStyle !== style) {
      state.currentStyle = style;
      const moleculeGroup = moleculeLoader.rebuildStyle(style);
      if (moleculeGroup) state.scene.setMolecule(moleculeGroup);
      console.log(`[Display] Cambiando estilo a: ${style}`);
    }
  });

  // Controles de Audio
  wsClient.on(WS_EVENTS.AUDIO_CONTROL, (action) => {
    handleAudioControl(action);
  });
}

// ====================================================================
// {5} LÓGICA DE CARGA Y RENDERIZADO
// ====================================================================
async function loadMolecule(moleculeData) {
  try {
    state.activeMoleculeId = moleculeData.id;
    loadingScreen.show();
    hideOverlay();

    // 1. Cargar PDB desde la API/R2/Proxy
    const pdbUrl = `${CONFIG.API_BASE_URL}/files/${moleculeData.pdbFile}`;
    const pdbRawData = await moleculeLoader.loadPDB(pdbUrl);

    // 2. Construir malla 3D (ECS pipeline: parse → color → style → render)
    const moleculeGroup = moleculeLoader.buildMolecule(pdbRawData, state.currentStyle);
    state.scene.setMolecule(moleculeGroup);

    // 3. Preparar Audio
    if (moleculeData.audioFile) {
      const audioUrl = `${CONFIG.API_BASE_URL}/files/${moleculeData.audioFile}`;
      state.audioElement.src = audioUrl;
      state.audioElement.load();
      handleAudioControl('play');
    }

    // 4. Actualizar UI
    updateOverlay(moleculeData.name, moleculeData.description);
    showOverlay();

  } catch (error) {
    console.error('[Display] Error cargando molécula:', error);
  } finally {
    loadingScreen.hide();
  }
}

// ====================================================================
// {6} LÓGICA DE AUDIO
// ====================================================================
function handleAudioControl(action) {
  if (!state.audioElement.src) return;

  switch (action) {
    case 'play':
      state.audioElement.play().catch(e => console.warn('Autoplay bloqueado:', e));
      break;
    case 'pause':
      state.audioElement.pause();
      break;
    case 'stop':
      state.audioElement.pause();
      state.audioElement.currentTime = 0;
      break;
  }
}

// ====================================================================
// {7} LÓGICA DE OVERLAY UI
// ====================================================================
function updateOverlay(name, description) {
  document.getElementById('molecule-name').textContent = name;
  document.getElementById('molecule-description').textContent = description || '';
}

function showOverlay() {
  document.getElementById('molecule-overlay').classList.remove('hidden');
}

function hideOverlay() {
  document.getElementById('molecule-overlay').classList.add('hidden');
}

window.addEventListener('DOMContentLoaded', init);
