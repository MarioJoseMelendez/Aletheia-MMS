// ====================================================================
// ====================================================================
// {1} DISPLAY SCREEN — ENTRY POINT
// ====================================================================
// Main controller for the fullscreen 3D view.
// Listens to WebSocket events and reacts by updating the scene.
// Automatically loads a demo molecule if no initial selection.
// ====================================================================

import { DisplayScene } from './scene.js';
import { loadingScreen } from './loading-screen.js';
import { wsClient } from '../shared/websocket-client.js';
import { moleculeLoader } from '../shared/molecule-loader.js';
import { WS_EVENTS, CONFIG, VISUALIZATION_STYLES } from '../shared/constants.js';

// Default molecule if the display screen is opened alone
const DEFAULT_DEMO_MOLECULE = {
  id: 'hemoglobin-demo',
  name: 'Hemoglobina',
  description: 'Proteína tetramérica encargada del transporte de oxígeno en los glóbulos rojos.',
  category: 'Proteínas',
  pdbFile: 'demo_1A3N.pdb',
  audioFile: null
};

// ====================================================================
// {2} GLOBAL STATE
// ====================================================================
const state = {
  activeMoleculeId: null,
  currentStyle: VISUALIZATION_STYLES.BALL_AND_STICK,
  audioElement: new Audio(),
  scene: null
};

// ====================================================================
// {3} INITIALIZATION
// ====================================================================
async function init() {
  console.log('[Aletheia] Initializing Display...');
  
  // 1. Setup 3D Scene
  state.scene = new DisplayScene('canvas-container');
  
  // 2. Start render loop
  const animate = () => {
    requestAnimationFrame(animate);
    state.scene.renderer.render(state.scene.scene, state.scene.camera);
  };
  animate();

  // 3. Subscribe to WebSocket events
  setupWebSocketListeners();

  // 4. Load initial default molecule
  await loadMolecule(DEFAULT_DEMO_MOLECULE);
}

// ====================================================================
// {4} WEBSOCKET HANDLING
// ====================================================================
function setupWebSocketListeners() {
  
  // Load new molecule
  wsClient.on(WS_EVENTS.SELECT_MOLECULE, async (moleculeData) => {
    await loadMolecule(moleculeData);
  });

  // Camera synchronization from Control (position + target)
  wsClient.on(WS_EVENTS.CAMERA_UPDATE, (data) => {
    state.scene.setCamera(data.cameraPos, data.targetPos);
  });

  // Reset camera
  wsClient.on(WS_EVENTS.RESET_VIEW, () => {
    state.scene.resetView();
  });

  // Change visual style
  wsClient.on(WS_EVENTS.STYLE_CHANGE, async (style) => {
    if (state.activeMoleculeId && state.currentStyle !== style) {
      state.currentStyle = style;
      const moleculeGroup = moleculeLoader.rebuildStyle(style);
      if (moleculeGroup) state.scene.setMolecule(moleculeGroup);
      console.log(`[Display] Changing style to: ${style}`);
    }
  });

  // Audio Controls
  wsClient.on(WS_EVENTS.AUDIO_CONTROL, (action) => {
    handleAudioControl(action);
  });
}

// ====================================================================
// {5} LOAD AND RENDER LOGIC
// ====================================================================
async function loadMolecule(moleculeData) {
  try {
    state.activeMoleculeId = moleculeData.id;
    loadingScreen.show();
    hideOverlay();

    // 1. Load PDB from API/R2/Proxy
    const pdbUrl = `${CONFIG.API_BASE_URL}/files/${moleculeData.pdbFile}`;
    const pdbRawData = await moleculeLoader.loadPDB(pdbUrl);

    // 2. Build 3D mesh (ECS pipeline: parse → color → style → render)
    const moleculeGroup = moleculeLoader.buildMolecule(pdbRawData, state.currentStyle);
    state.scene.setMolecule(moleculeGroup);

    // 3. Prepare Audio
    if (moleculeData.audioFile) {
      const audioUrl = `${CONFIG.API_BASE_URL}/files/${moleculeData.audioFile}`;
      state.audioElement.src = audioUrl;
      state.audioElement.load();
      handleAudioControl('play');
    }

    // 4. Update UI
    updateOverlay(moleculeData.name, moleculeData.description);
    showOverlay();

  } catch (error) {
    console.error('[Display] Error loading molecule:', error);
  } finally {
    loadingScreen.hide();
  }
}

// ====================================================================
// {6} AUDIO LOGIC
// ====================================================================
function handleAudioControl(action) {
  if (!state.audioElement.src) return;

  switch (action) {
    case 'play':
      state.audioElement.play().catch(e => console.warn('Autoplay blocked:', e));
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
// {7} OVERLAY UI LOGIC
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
