// ====================================================================
// ====================================================================
// {1} AUTO ROTATION (IDLE MODE)
// ====================================================================
// Activates auto-rotation of the molecule when there is no interaction
// on the control screen after a defined time.
// ====================================================================

import { CONFIG, WS_EVENTS } from '../shared/constants.js';
import { wsClient } from '../shared/websocket-client.js';

class AutoRotateManager {
  constructor() {
    this.idleTimer = null;
    this.isIdle = false;
    this.onIdleStart = null; // Callback
  }

  // ====================================================================
  // {2} TIMER MANAGEMENT
  // ====================================================================
  resetTimer() {
    this.isIdle = false;
    
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
    }

    this.idleTimer = setTimeout(() => {
      this.triggerIdle();
    }, CONFIG.IDLE_TIMEOUT_MS);
  }

  triggerIdle() {
    this.isIdle = true;
    console.log('[AutoRotate] Idle timeout reached. Starting auto-rotation.');
    
    // Notify the control that the screen has entered idle mode
    wsClient.emit(WS_EVENTS.IDLE_STARTED, {});
    
    if (this.onIdleStart) {
      this.onIdleStart();
    }
  }

  // ====================================================================
  // {3} ANIMATION LOOP
  // ====================================================================
  /**
   * Debe ser llamado dentro del requestAnimationFrame principal
   * @param {DisplayScene} scene Instancia de la escena principal
   */
  update(scene) {
    if (this.isIdle) {
      scene.rotate(CONFIG.AUTO_ROTATE_SPEED * 0.005);
    }
  }
}

export const autoRotate = new AutoRotateManager();
