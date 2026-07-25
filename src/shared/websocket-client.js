// ====================================================================
// ====================================================================
// {1} NATIVE WEBSOCKET CLIENT
// ====================================================================
// Wrapper over native WebSocket for automatic reconnection and
// an event system similar to socket.io (emit/on).
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
  // {2} CONNECTION AND RECONNECTION
  // ====================================================================
  connect() {
    if (this.ws) {
      this.ws.close();
    }

    console.log('[WebSocket] Connecting to', CONFIG.WS_BASE_URL);
    this.ws = new WebSocket(CONFIG.WS_BASE_URL);

    this.ws.onopen = () => {
      console.log('[WebSocket] Connected successfully');
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
        console.error('[WebSocket] Error parsing message', err);
      }
    };

    this.ws.onclose = () => {
      console.log('[WebSocket] Disconnected');
      this.isConnected = false;
      this._emitLocal('disconnect', null);
      this._attemptReconnect();
    };

    this.ws.onerror = (err) => {
      console.error('[WebSocket] Error', err);
      this.ws.close(); // Force onclose to reconnect
    };
  }

  _attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const timeout = this.reconnectDelay * Math.min(this.reconnectAttempts, 5); // Backoff
      console.log(`[WebSocket] Attempting to reconnect in ${timeout}ms... (Attempt ${this.reconnectAttempts})`);
      setTimeout(() => this.connect(), timeout);
    } else {
      console.error('[WebSocket] Critical failure: could not reconnect after multiple attempts.');
    }
  }

  // ====================================================================
  // {3} EVENT API (EMIT / ON)
  // ====================================================================
  
  // Send message to server (broadcast to other clients via Worker)
  emit(type, data = null) {
    if (!this.isConnected || !this.ws) {
      console.warn(`[WebSocket] Attempt to emit '${type}' but no connection.`);
      return;
    }
    const payload = JSON.stringify({ type, data });
    this.ws.send(payload);
  }

  // Subscribe to an event
  on(type, callback) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type).add(callback);
  }

  // Unsubscribe from an event
  off(type, callback) {
    if (this.listeners.has(type)) {
      this.listeners.get(type).delete(callback);
    }
  }

  // Internal use: fire registered callbacks
  _emitLocal(type, data) {
    if (this.listeners.has(type)) {
      for (const callback of this.listeners.get(type)) {
        try {
          callback(data);
        } catch (err) {
          console.error(`[WebSocket] Error in event listener '${type}'`, err);
        }
      }
    }
  }
}

// ====================================================================
// {4} SINGLETON INSTANCE
// ====================================================================
// Export a single instance for the entire application.
// ====================================================================
export const wsClient = new WebSocketClient();
