// ====================================================================
// ====================================================================
// {1} CLIENTE WEBSOCKET NATIVO
// ====================================================================
// Wrapper sobre WebSocket nativo para reconexión automática y 
// un sistema de eventos similar a socket.io (emit/on).
// ====================================================================

import { CONFIG } from './constants.js';

class WebSocketClient {
  constructor() {
    this.ws = null;
    this.listeners = new Map();
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 2000;
    
    this.connect();
  }

  // ====================================================================
  // {2} CONEXIÓN Y RECONEXIÓN
  // ====================================================================
  connect() {
    if (this.ws) {
      this.ws.close();
    }

    console.log('[WebSocket] Conectando a', CONFIG.WS_BASE_URL);
    this.ws = new WebSocket(CONFIG.WS_BASE_URL);

    this.ws.onopen = () => {
      console.log('[WebSocket] Conectado exitosamente');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this._emitLocal('connect', null);
    };

    this.ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload && payload.type) {
          this._emitLocal(payload.type, payload.data);
        }
      } catch (err) {
        console.error('[WebSocket] Error parseando mensaje', err);
      }
    };

    this.ws.onclose = () => {
      console.log('[WebSocket] Desconectado');
      this.isConnected = false;
      this._emitLocal('disconnect', null);
      this._attemptReconnect();
    };

    this.ws.onerror = (err) => {
      console.error('[WebSocket] Error', err);
      this.ws.close(); // Forzar onclose para reconectar
    };
  }

  _attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const timeout = this.reconnectDelay * Math.min(this.reconnectAttempts, 5); // Backoff
      console.log(`[WebSocket] Intentando reconectar en ${timeout}ms... (Intento ${this.reconnectAttempts})`);
      setTimeout(() => this.connect(), timeout);
    } else {
      console.error('[WebSocket] Fallo crítico: no se pudo reconectar después de múltiples intentos.');
    }
  }

  // ====================================================================
  // {3} API DE EVENTOS (EMIT / ON)
  // ====================================================================
  
  // Enviar mensaje al servidor (broadcast a otros clientes vía Worker)
  emit(type, data = null) {
    if (!this.isConnected || !this.ws) {
      console.warn(`[WebSocket] Intento de emitir '${type}' pero no hay conexión.`);
      return;
    }
    const payload = JSON.stringify({ type, data });
    this.ws.send(payload);
  }

  // Suscribirse a un evento
  on(type, callback) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type).add(callback);
  }

  // Desuscribirse de un evento
  off(type, callback) {
    if (this.listeners.has(type)) {
      this.listeners.get(type).delete(callback);
    }
  }

  // Uso interno: disparar callbacks registrados
  _emitLocal(type, data) {
    if (this.listeners.has(type)) {
      for (const callback of this.listeners.get(type)) {
        try {
          callback(data);
        } catch (err) {
          console.error(`[WebSocket] Error en el listener del evento '${type}'`, err);
        }
      }
    }
  }
}

// ====================================================================
// {4} INSTANCIA SINGLETON
// ====================================================================
// Exportamos una única instancia para toda la aplicación.
// ====================================================================
export const wsClient = new WebSocketClient();
