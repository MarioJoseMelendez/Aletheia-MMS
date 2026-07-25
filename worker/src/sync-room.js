// ====================================================================
// ====================================================================
// {1} DURABLE OBJECT — SYNC ROOM
// ====================================================================
// Manages the room's state and WebSocket connections.
// Broadcasts events (rotation, selection) between Control and Display.
// ====================================================================

export class SyncRoom {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.sessions = [];
  }

  // ====================================================================
  // {2} HTTP REQUEST / WS UPGRADE HANDLING
  // ====================================================================
  async fetch(request) {
    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response('Expected Upgrade: websocket', { status: 426 });
    }

    // Create the WebSocket pair (client / server)
    const webSocketPair = new WebSocketPair();
    const [client, server] = Object.values(webSocketPair);

    // Accept the connection in the DO
    this.state.acceptWebSocket(server);
    this.sessions.push(server);

    return new Response(null, {
      status: 101,
      webSocket: client
    });
  }

  // ====================================================================
  // {3} NATIVE WEBSOCKET EVENTS (DURABLE OBJECT API)
  // ====================================================================
  async webSocketMessage(ws, message) {
    // Retransmit the message to all other clients (Broadcast)
    for (const session of this.sessions) {
      if (session !== ws) {
        try {
          session.send(message);
        } catch (err) {
          // If it fails, the session is probably dead
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
