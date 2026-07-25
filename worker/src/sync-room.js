// ====================================================================
// ====================================================================
// {1} DURABLE OBJECT — SYNC ROOM
// ====================================================================
// Gestiona el estado y las conexiones WebSocket de la sala.
// Broadcasts eventos (rotación, selección) entre Control y Display.
// ====================================================================

export class SyncRoom {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.sessions = [];
  }

  // ====================================================================
  // {2} MANEJO DE PETICIONES HTTP / WS UPGRADE
  // ====================================================================
  async fetch(request) {
    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response('Expected Upgrade: websocket', { status: 426 });
    }

    // Crear el par de WebSockets (cliente / servidor)
    const webSocketPair = new WebSocketPair();
    const [client, server] = Object.values(webSocketPair);

    // Aceptar la conexión en el DO
    this.state.acceptWebSocket(server);
    this.sessions.push(server);

    return new Response(null, {
      status: 101,
      webSocket: client
    });
  }

  // ====================================================================
  // {3} EVENTOS WEBSOCKET NATIVOS (DURABLE OBJECT API)
  // ====================================================================
  async webSocketMessage(ws, message) {
    // Retransmitir el mensaje a todos los demás clientes (Broadcast)
    for (const session of this.sessions) {
      if (session !== ws) {
        try {
          session.send(message);
        } catch (err) {
          // Si falla, la sesión probablemente está muerta
        }
      }
    }
  }

  async webSocketClose(ws, code, reason, wasClean) {
    this.sessions = this.sessions.filter(session => session !== ws);
  }

  async webSocketError(ws, error) {
    this.sessions = this.sessions.filter(session => session !== ws);
  }
}
