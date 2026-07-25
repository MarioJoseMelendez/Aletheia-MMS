// ====================================================================
// ====================================================================
// {1} AUTO ROTACIÓN (IDLE MODE)
// ====================================================================
// Activa la auto-rotación de la molécula cuando no hay interacción
// en la pantalla de control después de un tiempo definido.
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
  // {2} GESTIÓN DEL TIMER
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
    
    // Notificar al control que la pantalla ha entrado en modo idle
    wsClient.emit(WS_EVENTS.IDLE_STARTED, {});
    
    if (this.onIdleStart) {
      this.onIdleStart();
    }
  }

  // ====================================================================
  // {3} LOOP DE ANIMACIÓN
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
