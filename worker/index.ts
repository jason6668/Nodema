import { RoomDurableObject } from "./room-durable-object";

export interface Env {
  ROOM_DURABLE_OBJECT: DurableObjectNamespace;
}

export { RoomDurableObject };

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    console.log(`[WORKER] Request: ${request.method} ${path}`);

    // Route to Durable Object based on room ID for WebSocket connections
    if (path.startsWith('/ws/')) {
      const roomId = path.split('/')[2];
      if (!roomId) {
        console.log('[WORKER] Room ID required');
        return new Response('Room ID required', { status: 400 });
      }

      console.log(`[WORKER] Routing to Durable Object for room: ${roomId}`);
      const id = env.ROOM_DURABLE_OBJECT.idFromName(roomId);
      const stub = env.ROOM_DURABLE_OBJECT.get(id);

      return stub.fetch(request);
    }

    // Health check endpoint
    if (path === '/api/health') {
      return Response.json({ status: "ok", service: "Cloudflare Workers WebSocket" });
    }

    // HTTP polling endpoints for mobile compatibility
    if (path.startsWith('/api/poll/')) {
      const roomId = path.split('/')[3];
      if (!roomId) {
        return new Response('Room ID required', { status: 400 });
      }

      const id = env.ROOM_DURABLE_OBJECT.idFromName(roomId);
      const stub = env.ROOM_DURABLE_OBJECT.get(id);

      // Forward to Durable Object for polling
      return stub.fetch(request);
    }

    // Serve static files for Pages
    return new Response('NodeCrypt WebSocket Server on Cloudflare Workers', { status: 200 });
  }
};
