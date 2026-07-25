// ====================================================================
// ====================================================================
// {1} CONTROL SCREEN — ENTRY POINT
// ====================================================================
// Orchestrates the interactive interface modules: the molecule
// list, the local 3D panel, and the audio controls.
// ====================================================================

import { MoleculeList } from './molecule-list.js';
import { ControlsPanel } from './controls-panel.js';
import { AudioControls } from './audio-controls.js';
import { wsClient } from '../shared/websocket-client.js';
import { WS_EVENTS } from '../shared/constants.js';

function init() {
  console.log('[Aletheia] Initializing Control Panel...');

  // Initialize subcomponents
  const audioControls = new AudioControls();
  const controlsPanel = new ControlsPanel();
  
  const moleculeList = new MoleculeList((moleculeData) => {
    // Callback when a molecule is selected in the list
    controlsPanel.loadMoleculePreview(moleculeData);
    audioControls.setMolecule(moleculeData);
  });

  // Load initial list
  moleculeList.loadMolecules();

  // On connect or reload of the control panel, force automatic display reload
  wsClient.on('connect', () => {
    wsClient.emit(WS_EVENTS.RELOAD_DISPLAY, {});
  });
}

window.addEventListener('DOMContentLoaded', init);
