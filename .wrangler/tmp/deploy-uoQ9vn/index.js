var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// worker/room-durable-object.ts
var RoomDurableObject = class {
  // Store the actual room ID from URL
  constructor(state, env) {
    this.sessions = /* @__PURE__ */ new Map();
    this.messages = [];
    this.users = /* @__PURE__ */ new Map();
    this.activeThemeId = "sakura_dream";
    this.isLiveActive = false;
    this.liveStreamer = null;
    this.activeCoHosts = [];
    this.currentPoll = null;
    this.roomId = "";
    this.state = state;
    this.env = env;
    this.storage = state.storage;
    this.state.blockConcurrencyWhile(async () => {
      const storedMessages = await this.storage.get("messages");
      const storedUsers = await this.storage.get("users");
      const storedTheme = await this.storage.get("activeThemeId");
      const storedLiveActive = await this.storage.get("isLiveActive");
      const storedLiveStreamer = await this.storage.get("liveStreamer");
      const storedCoHosts = await this.storage.get("activeCoHosts");
      const storedPoll = await this.storage.get("currentPoll");
      if (storedMessages) this.messages = storedMessages;
      if (storedUsers) this.users = new Map(Object.entries(storedUsers));
      if (storedTheme) this.activeThemeId = storedTheme;
      if (storedLiveActive !== void 0) this.isLiveActive = storedLiveActive;
      if (storedLiveStreamer !== void 0) this.liveStreamer = storedLiveStreamer;
      if (storedCoHosts) this.activeCoHosts = storedCoHosts;
      if (storedPoll) this.currentPoll = storedPoll;
    });
  }
  static {
    __name(this, "RoomDurableObject");
  }
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;
    console.log(`[DURABLE OBJECT] Request: ${request.method} ${path}`);
    const pathParts = path.split("/");
    if (pathParts.length >= 3 && pathParts[1] === "ws") {
      this.roomId = decodeURIComponent(pathParts[2]);
      console.log(`[DURABLE OBJECT] Extracted room ID: ${this.roomId}`);
    }
    if (path.startsWith("/ws")) {
      console.log(`[DURABLE OBJECT] WebSocket upgrade request`);
      const { 0: client, 1: server } = Object.values(new WebSocketPair());
      server.accept();
      console.log(`[DURABLE OBJECT] WebSocket accepted`);
      this.sessions.set(server, "");
      console.log(`[DURABLE OBJECT] Current sessions: ${this.sessions.size}`);
      server.addEventListener("message", (event) => {
        try {
          const payload = JSON.parse(event.data);
          console.log(`[DURABLE OBJECT] Received WebSocket message:`, payload);
          this.handleMessage(server, payload);
        } catch (err) {
          console.error("Failed to parse WebSocket message:", err);
        }
      });
      server.addEventListener("close", () => {
        const userId = this.sessions.get(server);
        console.log(`[DURABLE OBJECT] WebSocket closed for user: ${userId}`);
        if (userId) {
          this.handleDisconnect(userId);
        }
        this.sessions.delete(server);
      });
      server.addEventListener("error", (err) => {
        console.error("WebSocket error:", err);
        this.sessions.delete(server);
      });
      return new Response(null, { status: 101, webSocket: client });
    }
    if (path.startsWith("/api/poll")) {
      const method = url.searchParams.get("method");
      const userId = url.searchParams.get("userId");
      if (request.method === "OPTIONS") {
        return new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type"
          }
        });
      }
      const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      };
      if (method === "get_messages") {
        console.log(`[HTTP POLLING] Getting messages for ${userId}, current messages: ${this.messages.length}`);
        return Response.json({
          type: "poll_response",
          data: {
            messages: this.messages,
            users: Array.from(this.users.values()),
            activeThemeId: this.activeThemeId,
            isLiveActive: this.isLiveActive,
            liveStreamer: this.liveStreamer,
            activeCoHosts: this.activeCoHosts,
            currentPoll: this.currentPoll
          }
        }, { headers: corsHeaders });
      }
      if (method === "send_message" && userId) {
        if (request.method === "POST") {
          try {
            const body = await request.json();
            const message = body.message;
            console.log(`[HTTP POLLING] Sending message from ${userId}, messageId: ${message.id}`);
            await this.handleMessageBroadcast(userId, message);
            return Response.json({ success: true }, { headers: corsHeaders });
          } catch (err) {
            console.error(`[HTTP POLLING] Send message error:`, err);
            return Response.json({ success: false, error: "Invalid request" }, { status: 400, headers: corsHeaders });
          }
        }
      }
      if (method === "join" && userId) {
        if (request.method === "POST") {
          try {
            const body = await request.json();
            console.log(`[HTTP POLLING JOIN] User ${userId} joining with nickname: ${body.nickname}`);
            const userProfile = {
              id: userId,
              nickname: body.nickname || "\u672A\u77E5\u7528\u6237",
              avatarUrl: body.avatarUrl || ""
            };
            this.users.set(userId, userProfile);
            await this.storage.put("users", Object.fromEntries(this.users));
            console.log(`[HTTP POLLING JOIN] Total users after join: ${this.users.size}`);
            return Response.json({
              success: true,
              data: {
                messages: this.messages,
                users: Array.from(this.users.values()),
                activeThemeId: this.activeThemeId,
                isLiveActive: this.isLiveActive,
                liveStreamer: this.liveStreamer,
                activeCoHosts: this.activeCoHosts,
                currentPoll: this.currentPoll
              }
            }, { headers: corsHeaders });
          } catch (err) {
            console.error(`[HTTP POLLING JOIN] Error:`, err);
            return Response.json({ success: false, error: "Invalid request" }, { status: 400, headers: corsHeaders });
          }
        }
      }
      return Response.json({ success: false, error: "Invalid method" }, { status: 400, headers: corsHeaders });
    }
    return new Response("Not found", { status: 404 });
  }
  async handleMessage(ws, payload) {
    const { type, userId, data, roomId } = payload;
    console.log(`[DURABLE OBJECT] Received message type: ${type}, userId: ${userId}`);
    switch (type) {
      case "join":
        await this.handleJoin(ws, userId, data);
        break;
      case "message":
        await this.handleMessageBroadcast(userId, data.message);
        break;
      case "theme_change":
        await this.handleThemeChange(data.themeId);
        break;
      case "gift":
        this.broadcastToAll({ type: "gift", roomId, data });
        break;
      case "danmaku":
        this.broadcastToAll({ type: "danmaku", roomId, data });
        break;
      case "poll_update":
        await this.handlePollUpdate(data.poll);
        break;
      case "live_status":
        await this.handleLiveStatus(data);
        break;
      case "cohost_join":
        await this.handleCoHostJoin(userId);
        break;
      case "cohost_leave":
        await this.handleCoHostLeave(userId);
        break;
      case "burn_message":
        await this.handleBurnMessage(data.messageId);
        break;
      case "signal":
        this.handleSignal(userId, data);
        break;
    }
  }
  async handleJoin(ws, userId, data) {
    const userProfile = {
      id: userId,
      nickname: data.nickname || "\u672A\u77E5\u7528\u6237",
      avatarUrl: data.avatarUrl || ""
    };
    this.users.set(userId, userProfile);
    this.sessions.set(ws, userId);
    await this.storage.put("users", Object.fromEntries(this.users));
    console.log(`[DURABLE OBJECT] User ${userProfile.nickname} (${userId}) joined. Total users: ${this.users.size}`);
    ws.send(JSON.stringify({
      type: "init_state",
      roomId: this.roomId,
      data: {
        messages: this.messages,
        users: Array.from(this.users.values()),
        activeThemeId: this.activeThemeId,
        isLiveActive: this.isLiveActive,
        liveStreamer: this.liveStreamer,
        activeCoHosts: this.activeCoHosts,
        currentPoll: this.currentPoll
      }
    }));
    this.broadcastToAll({
      type: "user_joined",
      roomId: this.roomId,
      data: {
        user: userProfile,
        users: Array.from(this.users.values())
      }
    }, ws);
  }
  async handleMessageBroadcast(userId, message) {
    console.log(`[DURABLE OBJECT] Broadcasting message from ${userId}, messageId: ${message.id}`);
    if (!this.messages.some((m) => m.id === message.id)) {
      this.messages.push(message);
      if (this.messages.length > 500) {
        this.messages.shift();
      }
      await this.storage.put("messages", this.messages);
      this.broadcastToAll({
        type: "message",
        roomId: this.roomId,
        data: { message }
      });
    }
  }
  async handleThemeChange(themeId) {
    this.activeThemeId = themeId;
    await this.storage.put("activeThemeId", themeId);
    this.broadcastToAll({
      type: "theme_change",
      roomId: this.roomId,
      data: { themeId }
    });
  }
  async handlePollUpdate(poll) {
    this.currentPoll = poll;
    await this.storage.put("currentPoll", poll);
    this.broadcastToAll({
      type: "poll_update",
      roomId: this.roomId,
      data: { poll }
    });
  }
  async handleLiveStatus(data) {
    this.isLiveActive = data.isLiveActive;
    this.liveStreamer = data.isLiveActive ? data.liveStreamer : null;
    if (!data.isLiveActive) {
      this.activeCoHosts = [];
    }
    await this.storage.put("isLiveActive", this.isLiveActive);
    await this.storage.put("liveStreamer", this.liveStreamer);
    await this.storage.put("activeCoHosts", this.activeCoHosts);
    this.broadcastToAll({
      type: "live_status",
      roomId: this.roomId,
      data: {
        isLiveActive: this.isLiveActive,
        liveStreamer: this.liveStreamer,
        activeCoHosts: this.activeCoHosts
      }
    });
  }
  async handleCoHostJoin(userId) {
    const user = this.users.get(userId);
    if (user) {
      user.isCoHost = true;
      if (!this.activeCoHosts.some((h) => h.id === userId)) {
        this.activeCoHosts.push(user);
      }
      await this.storage.put("activeCoHosts", this.activeCoHosts);
      this.broadcastLiveStatus();
    }
  }
  async handleCoHostLeave(userId) {
    const user = this.users.get(userId);
    if (user) {
      user.isCoHost = false;
    }
    this.activeCoHosts = this.activeCoHosts.filter((h) => h.id !== userId);
    await this.storage.put("activeCoHosts", this.activeCoHosts);
    this.broadcastLiveStatus();
  }
  async handleBurnMessage(messageId) {
    this.messages = this.messages.filter((m) => m.id !== messageId);
    await this.storage.put("messages", this.messages);
    this.broadcastToAll({
      type: "burn_message",
      roomId: this.roomId,
      data: { messageId }
    });
  }
  handleSignal(userId, data) {
    this.broadcastToAll({
      type: "signal",
      roomId: this.roomId,
      data: {
        senderUserId: userId,
        signalData: data.signalData,
        callType: data.callType
      }
    });
  }
  handleDisconnect(userId) {
    const user = this.users.get(userId);
    if (user) {
      console.log(`[DURABLE OBJECT] User ${user.nickname} (${userId}) disconnected`);
      this.users.delete(userId);
      this.storage.put("users", Object.fromEntries(this.users));
      this.activeCoHosts = this.activeCoHosts.filter((h) => h.id !== userId);
      this.storage.put("activeCoHosts", this.activeCoHosts);
      if (this.liveStreamer === user.nickname) {
        this.isLiveActive = false;
        this.liveStreamer = null;
        this.activeCoHosts = [];
        this.storage.put("isLiveActive", false);
        this.storage.put("liveStreamer", null);
        this.storage.put("activeCoHosts", []);
      }
      this.broadcastToAll({
        type: "user_left",
        roomId: this.roomId,
        data: {
          userId,
          nickname: user.nickname,
          users: Array.from(this.users.values()),
          isLiveActive: this.isLiveActive,
          liveStreamer: this.liveStreamer,
          activeCoHosts: this.activeCoHosts
        }
      });
    }
  }
  async broadcastLiveStatus() {
    this.broadcastToAll({
      type: "live_status",
      roomId: this.roomId,
      data: {
        isLiveActive: this.isLiveActive,
        liveStreamer: this.liveStreamer,
        activeCoHosts: this.activeCoHosts
      }
    });
  }
  broadcastToAll(message, excludeWs) {
    const rawMsg = JSON.stringify(message);
    console.log(`[DURABLE OBJECT] Broadcasting to ${this.sessions.size} sessions, message type: ${message.type}`);
    let sentCount = 0;
    console.log(`[DURABLE OBJECT BROADCAST] Type: ${message.type}, Sessions: ${this.sessions.size}`);
    this.sessions.forEach((userId, ws) => {
      if (ws !== excludeWs && ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(rawMsg);
          sentCount++;
          console.log(`[DURABLE OBJECT BROADCAST] Sent to user ${userId}`);
        } catch (err) {
          console.error("Failed to send to client:", err);
          this.sessions.delete(ws);
        }
      }
    });
    console.log(`[DURABLE OBJECT BROADCAST] Total sent: ${sentCount}/${this.sessions.size}`);
  }
};

// worker/index.ts
var index_default = {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    console.log(`[WORKER] Request: ${request.method} ${path}`);
    if (path.startsWith("/ws/")) {
      const roomId = path.split("/")[2];
      if (!roomId) {
        console.log("[WORKER] Room ID required");
        return new Response("Room ID required", { status: 400 });
      }
      console.log(`[WORKER] Routing to Durable Object for room: ${roomId}`);
      const id = env.ROOM_DURABLE_OBJECT.idFromName(roomId);
      const stub = env.ROOM_DURABLE_OBJECT.get(id);
      return stub.fetch(request);
    }
    if (path === "/api/health") {
      return Response.json({ status: "ok", service: "Cloudflare Workers WebSocket" });
    }
    if (path.startsWith("/api/poll/")) {
      const roomId = path.split("/")[3];
      if (!roomId) {
        return new Response("Room ID required", { status: 400 });
      }
      const id = env.ROOM_DURABLE_OBJECT.idFromName(roomId);
      const stub = env.ROOM_DURABLE_OBJECT.get(id);
      return stub.fetch(request);
    }
    return new Response("NodeCrypt WebSocket Server on Cloudflare Workers", { status: 200 });
  }
};
export {
  RoomDurableObject,
  index_default as default
};
//# sourceMappingURL=index.js.map
