// ====================================================================
// ====================================================================
// {1} PANTALLA DE CONTROL — ENTRY POINT
// ====================================================================
// Orquesta los módulos de la interfaz interactiva: la lista de 
// moléculas, el panel 3D local y los controles de audio.
// ====================================================================

import { MoleculeList } from './molecule-list.js';
import { ControlsPanel } from './controls-panel.js';
import { AudioControls } from './audio-controls.js';
import { wsClient } from '../shared/websocket-client.js';
import { WS_EVENTS } from '../shared/constants.js';

function init() {
  console.log('[Aletheia] Inicializando Control Panel...');

  // Inicializar subcomponentes
  const audioControls = new AudioControls();
  const controlsPanel = new ControlsPanel();
  
  const moleculeList = new MoleculeList((moleculeData) => {
    // Callback cuando se selecciona una molécula en la lista
    controlsPanel.loadMoleculePreview(moleculeData);
    audioControls.setMolecule(moleculeData);
  });

  // Cargar lista inicial
  moleculeList.loadMolecules();

  // Al conectar o recargar el panel de control, forzar la recarga automática del display
  wsClient.on('connect', () => {
    wsClient.emit(WS_EVENTS.RELOAD_DISPLAY, {});
  });
}

window.addEventListener('DOMContentLoaded', init);
