// Durable Object Room implementation and router entry
// File: src/index.js
export class Room {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.clients = new Map(); // clientId -> WebSocket
    this.nextId = 1;
  }

  async fetch(request) {
    const upgradeHeader = request.headers.get('Upgrade') || '';
    if (upgradeHeader.toLowerCase() !== 'websocket') {
      return new Response('expected websocket', { status: 400 });
    }

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    server.accept();

    const clientId = String(this.nextId++);
    this.clients.set(clientId, server);

    server.addEventListener('message', (evt) => {
      // Broadcast incoming message to other clients in the same Room
      const data = evt.data;
      for (const [id, ws] of this.clients) {
        if (id === clientId) continue;
        try {
          ws.send(data);
        } catch (e) {
          // ignore send errors
        }
      }
    });

    server.addEventListener('close', () => {
      this.clients.delete(clientId);
    });

    server.addEventListener('error', () => {
      this.clients.delete(clientId);
    });

    return new Response(null, { status: 101, webSocket: client });
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const match = url.pathname.match(/^\/rooms\/([^\/]+)/);
    if (!match) return new Response('not found', { status: 404 });
    const roomName = match[1];

    const id = env.ROOMS.idFromName(roomName);
    const obj = env.ROOMS.get(id);
    return obj.fetch(request);
  }
};
