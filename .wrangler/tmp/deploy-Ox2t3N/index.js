// worker/index.ts
var index_default = {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    if (path.startsWith("/ws/")) {
      const roomId = path.split("/")[2];
      if (!roomId) {
        return new Response("Room ID required", { status: 400 });
      }
      const id = env.ROOM_DURABLE_OBJECT.idFromName(roomId);
      const stub = env.ROOM_DURABLE_OBJECT.get(id);
      return stub.fetch(request);
    }
    if (path === "/api/health") {
      return Response.json({ status: "ok", service: "Cloudflare Workers WebSocket" });
    }
    return new Response("NodeCrypt WebSocket Server on Cloudflare Workers", { status: 200 });
  }
};
export {
  index_default as default
};
//# sourceMappingURL=index.js.map
