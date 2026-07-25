// ====================================================================
// ====================================================================
// {1} AUDIO CONTROLS
// ====================================================================
// Manages the audio UI (Play, Pause, Stop) and emits commands
// via WebSocket to the display screen.
// ====================================================================

import { WS_EVENTS } from '../shared/constants.js';
import { wsClient } from '../shared/websocket-client.js';

export class AudioControls {
  constructor() {
    this.playBtn = document.getElementById('audio-play-btn');
    this.pauseBtn = document.getElementById('audio-pause-btn');
    this.stopBtn = document.getElementById('audio-stop-btn');
    this.trackNameLabel = document.getElementById('audio-track-name');
    
    this.hasAudio = false;

    this.setupEventListeners();
  }

  // ====================================================================
  // {2} ENABLE/DISABLE UI
  // ====================================================================
  setMolecule(moleculeData) {
    if (moleculeData && moleculeData.audioFile) {
      this.hasAudio = true;
      this.trackNameLabel.textContent = `Audio: ${moleculeData.audioFile}`;
      this.playBtn.disabled = false;
      this.pauseBtn.disabled = false;
      this.stopBtn.disabled = false;
    } else {
      this.hasAudio = false;
      this.trackNameLabel.textContent = 'No audio selected';
      this.playBtn.disabled = true;
      this.pauseBtn.disabled = true;
      this.stopBtn.disabled = true;
    }
  }

  // ====================================================================
  // {3} EVENT EMISSION
  // ====================================================================
  setupEventListeners() {
    this.playBtn.addEventListener('click', () => {
      if (this.hasAudio) wsClient.emit(WS_EVENTS.AUDIO_CONTROL, 'play');
    });

    this.pauseBtn.addEventListener('click', () => {
      if (this.hasAudio) wsClient.emit(WS_EVENTS.AUDIO_CONTROL, 'pause');
    });

    this.stopBtn.addEventListener('click', () => {
      if (this.hasAudio) wsClient.emit(WS_EVENTS.AUDIO_CONTROL, 'stop');
    });
  }
}
