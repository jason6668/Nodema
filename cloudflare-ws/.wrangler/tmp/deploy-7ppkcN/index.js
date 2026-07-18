var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/index.ts
function json(obj) {
  return JSON.stringify(obj);
}
__name(json, "json");
var index_default = {
  async fetch(request, env) {
    const url = new URL(request.url);
    const match = url.pathname.match(/^\/ws\/(.+)$/);
    if (!match) return new Response("Not Found", { status: 404 });
    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("Expected WebSocket", { status: 400 });
    }
    const roomId = decodeURIComponent(match[1]);
    const id = env.CHAT_ROOMS.idFromName(roomId);
    const stub = env.CHAT_ROOMS.get(id);
    return stub.fetch(request);
  }
};
var ChatRoom = class {
  static {
    __name(this, "ChatRoom");
  }
  state;
  sockets = /* @__PURE__ */ new Set();
  socketInfo = /* @__PURE__ */ new Map();
  users = /* @__PURE__ */ new Map();
  messages = [];
  activeThemeId = "sakura_dream";
  isLiveActive = false;
  liveStreamer = null;
  activeCoHosts = [];
  currentPoll = null;
  constructor(state) {
    this.state = state;
  }
  async fetch(request) {
    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];
    server.accept();
    const url = new URL(request.url);
    const match = url.pathname.match(/^\/ws\/(.+)$/);
    const roomId = match ? decodeURIComponent(match[1]) : "default";
    this.sockets.add(server);
    server.addEventListener("message", async (evt) => {
      const raw = typeof evt.data === "string" ? evt.data : "";
      if (!raw) return;
      let payload;
      try {
        payload = JSON.parse(raw);
      } catch {
        return;
      }
      const type = payload.type;
      const userId = payload.userId;
      if (type === "join" && userId) {
        const nickname = payload?.data?.nickname || "\u672A\u77E5\u7528\u6237";
        const avatarUrl = payload?.data?.avatarUrl || "";
        const user = { id: userId, nickname, avatarUrl };
        this.users.set(userId, user);
        this.socketInfo.set(server, { roomId, userId });
        server.send(
          json({
            type: "init_state",
            roomId,
            data: {
              messages: this.messages,
              users: Array.from(this.users.values()),
              activeThemeId: this.activeThemeId,
              isLiveActive: this.isLiveActive,
              liveStreamer: this.liveStreamer,
              activeCoHosts: this.activeCoHosts,
              currentPoll: this.currentPoll
            }
          })
        );
        this.broadcast(
          {
            type: "user_joined",
            roomId,
            data: {
              user,
              users: Array.from(this.users.values())
            }
          },
          server
        );
        return;
      }
      if (type === "message") {
        const msg = payload?.data?.message;
        if (msg && !this.messages.some((m) => m.id === msg.id)) {
          this.messages.push(msg);
          if (this.messages.length > 500) this.messages.shift();
        }
        this.broadcast(payload, void 0);
        return;
      }
      if (type === "theme_change") {
        const themeId = payload?.data?.themeId;
        if (typeof themeId === "string") this.activeThemeId = themeId;
        this.broadcast(payload, void 0);
        return;
      }
      if (type === "poll_update") {
        this.currentPoll = payload?.data?.poll ?? null;
        this.broadcast(payload, void 0);
        return;
      }
      if (type === "live_status") {
        this.isLiveActive = !!payload?.data?.isLiveActive;
        this.liveStreamer = payload?.data?.liveStreamer ?? null;
        this.activeCoHosts = payload?.data?.activeCoHosts ?? [];
        this.broadcast(payload, void 0);
        return;
      }
      this.broadcast(payload, void 0);
    });
    server.addEventListener("close", () => {
      this.handleClose(server);
    });
    server.addEventListener("error", () => {
      this.handleClose(server);
    });
    return new Response(null, { status: 101, webSocket: client });
  }
  handleClose(ws) {
    this.sockets.delete(ws);
    const info = this.socketInfo.get(ws);
    this.socketInfo.delete(ws);
    if (!info) return;
    const { roomId, userId } = info;
    const user = this.users.get(userId);
    const nickname = user?.nickname || "\u672A\u77E5\u7528\u6237";
    this.users.delete(userId);
    this.activeCoHosts = this.activeCoHosts.filter((h) => h.id !== userId);
    this.broadcast({
      type: "user_left",
      roomId,
      data: {
        userId,
        nickname,
        users: Array.from(this.users.values()),
        isLiveActive: this.isLiveActive,
        liveStreamer: this.liveStreamer,
        activeCoHosts: this.activeCoHosts
      }
    });
  }
  broadcast(msgObj, exclude) {
    const raw = json(msgObj);
    for (const ws of this.sockets) {
      if (exclude && ws === exclude) continue;
      try {
        ws.send(raw);
      } catch {
      }
    }
  }
};
export {
  ChatRoom,
  index_default as default
};
//# sourceMappingURL=index.js.map
