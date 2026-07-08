// Cloudflare Durable Object for managing room state and WebSocket connections
export interface Env {
  ROOM_DURABLE_OBJECT: DurableObjectNamespace;
}

interface UserProfile {
  id: string;
  nickname: string;
  avatarUrl: string;
  isStreamer?: boolean;
  isCoHost?: boolean;
}

interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  avatar: string;
  content: string;
  encryptedContent?: string;
  type: 'text' | 'image' | 'file' | 'system' | 'gift' | 'poll';
  mediaUrl?: string;
  burnDuration?: number;
  burnTimerStartedAt?: number;
  reactions: Array<{ emoji: string; count: number; users: string[] }>;
  replyTo?: {
    id: string;
    userName: string;
    content: string;
  };
  isPrivate?: boolean;
  privateTo?: string;
  isBurned?: boolean;
}

export class RoomDurableObject {
  private state: DurableObjectState;
  private env: Env;
  private sessions: Map<WebSocket, string> = new Map(); // WebSocket -> userId
  private storage: DurableObjectStorage;
  private messages: ChatMessage[] = [];
  private users: Map<string, UserProfile> = new Map();
  private activeThemeId: string = 'sakura_dream';
  private isLiveActive: boolean = false;
  private liveStreamer: string | null = null;
  private activeCoHosts: UserProfile[] = [];
  private currentPoll: any = null;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
    this.storage = state.storage;

    // Load persisted state on startup
    this.state.blockConcurrencyWhile(async () => {
      const storedMessages = await this.storage.get<ChatMessage[]>("messages");
      const storedUsers = await this.storage.get<Record<string, UserProfile>>("users");
      const storedTheme = await this.storage.get<string>("activeThemeId");
      const storedLiveActive = await this.storage.get<boolean>("isLiveActive");
      const storedLiveStreamer = await this.storage.get<string>("liveStreamer");
      const storedCoHosts = await this.storage.get<UserProfile[]>("activeCoHosts");
      const storedPoll = await this.storage.get<any>("currentPoll");
      
      if (storedMessages) this.messages = storedMessages;
      if (storedUsers) this.users = new Map(Object.entries(storedUsers));
      if (storedTheme) this.activeThemeId = storedTheme;
      if (storedLiveActive !== undefined) this.isLiveActive = storedLiveActive;
      if (storedLiveStreamer !== undefined) this.liveStreamer = storedLiveStreamer;
      if (storedCoHosts) this.activeCoHosts = storedCoHosts;
      if (storedPoll) this.currentPoll = storedPoll;
    });
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // Handle WebSocket upgrade
    if (path.startsWith('/ws')) {
      const { 0: client, 1: server } = Object.values(new WebSocketPair());
      
      server.accept();
      
      this.sessions.set(server, ''); // Will be set on join
      
      server.addEventListener('message', (event: MessageEvent) => {
        try {
          const payload = JSON.parse(event.data as string);
          this.handleMessage(server, payload);
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      });

      server.addEventListener('close', () => {
        const userId = this.sessions.get(server);
        if (userId) {
          this.handleDisconnect(userId);
        }
        this.sessions.delete(server);
      });

      server.addEventListener('error', (err) => {
        console.error('WebSocket error:', err);
        this.sessions.delete(server);
      });

      return new Response(null, { status: 101, webSocket: client });
    }

    return new Response('Not found', { status: 404 });
  }

  private async handleMessage(ws: WebSocket, payload: any) {
    const { type, userId, data, roomId } = payload;

    console.log(`[DURABLE OBJECT] Received message type: ${type}, userId: ${userId}`);

    switch (type) {
      case 'join':
        await this.handleJoin(ws, userId, data);
        break;
      case 'message':
        await this.handleMessageBroadcast(userId, data.message);
        break;
      case 'theme_change':
        await this.handleThemeChange(data.themeId);
        break;
      case 'gift':
        this.broadcastToAll({ type: 'gift', roomId, data });
        break;
      case 'danmaku':
        this.broadcastToAll({ type: 'danmaku', roomId, data });
        break;
      case 'poll_update':
        await this.handlePollUpdate(data.poll);
        break;
      case 'live_status':
        await this.handleLiveStatus(data);
        break;
      case 'cohost_join':
        await this.handleCoHostJoin(userId);
        break;
      case 'cohost_leave':
        await this.handleCoHostLeave(userId);
        break;
      case 'burn_message':
        await this.handleBurnMessage(data.messageId);
        break;
      case 'signal':
        this.handleSignal(userId, data);
        break;
    }
  }

  private async handleJoin(ws: WebSocket, userId: string, data: any) {
    const userProfile: UserProfile = {
      id: userId,
      nickname: data.nickname || "未知用户",
      avatarUrl: data.avatarUrl || ""
    };

    this.users.set(userId, userProfile);
    this.sessions.set(ws, userId);
    
    // Persist users
    await this.storage.put("users", Object.fromEntries(this.users));

    console.log(`[DURABLE OBJECT] User ${userProfile.nickname} (${userId}) joined. Total users: ${this.users.size}`);

    // Send current state to new user
    ws.send(JSON.stringify({
      type: 'init_state',
      roomId: this.state.id.toString(),
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

    // Broadcast join event to all other users
    this.broadcastToAll({
      type: 'user_joined',
      roomId: this.state.id.toString(),
      data: {
        user: userProfile,
        users: Array.from(this.users.values())
      }
    }, ws);
  }

  private async handleMessageBroadcast(userId: string, message: ChatMessage) {
    console.log(`[DURABLE OBJECT] Broadcasting message from ${userId}, messageId: ${message.id}`);

    // Check for duplicates
    if (!this.messages.some(m => m.id === message.id)) {
      this.messages.push(message);
      
      // Limit message history
      if (this.messages.length > 500) {
        this.messages.shift();
      }

      // Persist messages
      await this.storage.put("messages", this.messages);

      // Broadcast to all clients
      this.broadcastToAll({
        type: 'message',
        roomId: this.state.id.toString(),
        data: { message }
      });
    }
  }

  private async handleThemeChange(themeId: string) {
    this.activeThemeId = themeId;
    await this.storage.put("activeThemeId", themeId);
    this.broadcastToAll({
      type: 'theme_change',
      roomId: this.state.id.toString(),
      data: { themeId }
    });
  }

  private async handlePollUpdate(poll: any) {
    this.currentPoll = poll;
    await this.storage.put("currentPoll", poll);
    this.broadcastToAll({
      type: 'poll_update',
      roomId: this.state.id.toString(),
      data: { poll }
    });
  }

  private async handleLiveStatus(data: any) {
    this.isLiveActive = data.isLiveActive;
    this.liveStreamer = data.isLiveActive ? data.liveStreamer : null;
    
    if (!data.isLiveActive) {
      this.activeCoHosts = [];
    }

    await this.storage.put("isLiveActive", this.isLiveActive);
    await this.storage.put("liveStreamer", this.liveStreamer);
    await this.storage.put("activeCoHosts", this.activeCoHosts);

    this.broadcastToAll({
      type: 'live_status',
      roomId: this.state.id.toString(),
      data: {
        isLiveActive: this.isLiveActive,
        liveStreamer: this.liveStreamer,
        activeCoHosts: this.activeCoHosts
      }
    });
  }

  private async handleCoHostJoin(userId: string) {
    const user = this.users.get(userId);
    if (user) {
      user.isCoHost = true;
      if (!this.activeCoHosts.some(h => h.id === userId)) {
        this.activeCoHosts.push(user);
      }
      await this.storage.put("activeCoHosts", this.activeCoHosts);
      this.broadcastLiveStatus();
    }
  }

  private async handleCoHostLeave(userId: string) {
    const user = this.users.get(userId);
    if (user) {
      user.isCoHost = false;
    }
    this.activeCoHosts = this.activeCoHosts.filter(h => h.id !== userId);
    await this.storage.put("activeCoHosts", this.activeCoHosts);
    this.broadcastLiveStatus();
  }

  private async handleBurnMessage(messageId: string) {
    this.messages = this.messages.filter(m => m.id !== messageId);
    await this.storage.put("messages", this.messages);
    this.broadcastToAll({
      type: 'burn_message',
      roomId: this.state.id.toString(),
      data: { messageId }
    });
  }

  private handleSignal(userId: string, data: any) {
    // Forward signaling data to all clients (client-side will filter by targetUserId)
    this.broadcastToAll({
      type: 'signal',
      roomId: this.state.id.toString(),
      data: {
        senderUserId: userId,
        signalData: data.signalData,
        callType: data.callType
      }
    });
  }

  private handleDisconnect(userId: string) {
    const user = this.users.get(userId);
    if (user) {
      console.log(`[DURABLE OBJECT] User ${user.nickname} (${userId}) disconnected`);
      
      this.users.delete(userId);
      this.storage.put("users", Object.fromEntries(this.users));
      
      // Remove from co-hosts if present
      this.activeCoHosts = this.activeCoHosts.filter(h => h.id !== userId);
      this.storage.put("activeCoHosts", this.activeCoHosts);
      
      // If live streamer disconnected, end the live stream
      if (this.liveStreamer === user.nickname) {
        this.isLiveActive = false;
        this.liveStreamer = null;
        this.activeCoHosts = [];
        this.storage.put("isLiveActive", false);
        this.storage.put("liveStreamer", null);
        this.storage.put("activeCoHosts", []);
      }
      
      this.broadcastToAll({
        type: 'user_left',
        roomId: this.state.id.toString(),
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

  private async broadcastLiveStatus() {
    this.broadcastToAll({
      type: 'live_status',
      roomId: this.state.id.toString(),
      data: {
        isLiveActive: this.isLiveActive,
        liveStreamer: this.liveStreamer,
        activeCoHosts: this.activeCoHosts
      }
    });
  }

  private broadcastToAll(message: any, excludeWs?: WebSocket) {
    const rawMsg = JSON.stringify(message);
    let sentCount = 0;
    
    console.log(`[DURABLE OBJECT BROADCAST] Type: ${message.type}, Sessions: ${this.sessions.size}`);
    
    this.sessions.forEach((userId, ws) => {
      if (ws !== excludeWs && ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(rawMsg);
          sentCount++;
          console.log(`[DURABLE OBJECT BROADCAST] Sent to user ${userId}`);
        } catch (err) {
          console.error('Failed to send to client:', err);
          this.sessions.delete(ws);
        }
      }
    });
    
    console.log(`[DURABLE OBJECT BROADCAST] Total sent: ${sentCount}/${this.sessions.size}`);
  }
}
