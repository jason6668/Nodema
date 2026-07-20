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
  private callSignals: any[] = []; // Store pending call signals for polling
  private users: Map<string, UserProfile> = new Map();
  private activeThemeId: string = 'sakura_dream';
  private isLiveActive: boolean = false;
  private liveStreamer: string | null = null;
  private activeCoHosts: UserProfile[] = [];
  private currentPoll: any = null;
  private roomId: string = ''; // Store the actual room ID from URL

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
      const storedSignals = await this.storage.get<any[]>("callSignals");
      
      if (storedMessages) this.messages = storedMessages;
      if (storedUsers) this.users = new Map(Object.entries(storedUsers));
      if (storedTheme) this.activeThemeId = storedTheme;
      if (storedLiveActive !== undefined) this.isLiveActive = storedLiveActive;
      if (storedLiveStreamer !== undefined) this.liveStreamer = storedLiveStreamer;
      if (storedCoHosts) this.activeCoHosts = storedCoHosts;
      if (storedPoll) this.currentPoll = storedPoll;
      if (storedSignals) this.callSignals = storedSignals;
    });
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    console.log(`[DURABLE OBJECT] Request: ${request.method} ${path}`);

    // Extract room ID from URL path
    const pathParts = path.split('/');
    if (pathParts.length >= 3 && pathParts[1] === 'ws') {
      this.roomId = decodeURIComponent(pathParts[2]);
      console.log(`[DURABLE OBJECT] Extracted room ID: ${this.roomId}`);
    }

    // Handle WebSocket upgrade
    if (path.startsWith('/ws')) {
      console.log(`[DURABLE OBJECT] WebSocket upgrade request`);
      const { 0: client, 1: server } = Object.values(new WebSocketPair());

      // Accept with no subprotocol for maximum compatibility
      server.accept();
      console.log(`[DURABLE OBJECT] WebSocket accepted`);

      this.sessions.set(server, ''); // Will be set on join
      console.log(`[DURABLE OBJECT] Current sessions: ${this.sessions.size}`);

      server.addEventListener('message', (event: MessageEvent) => {
        try {
          const payload = JSON.parse(event.data as string);
          console.log(`[DURABLE OBJECT] Received WebSocket message:`, payload);
          this.handleMessage(server, payload);
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      });

      server.addEventListener('close', () => {
        const userId = this.sessions.get(server);
        console.log(`[DURABLE OBJECT] WebSocket closed for user: ${userId}`);
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

    // Handle HTTP polling for mobile compatibility
    if (path.startsWith('/api/poll')) {
      const method = url.searchParams.get('method');
      const userId = url.searchParams.get('userId');

      // Handle CORS preflight request
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          status: 204,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          }
        });
      }

      const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      };

      if (method === 'get_messages') {
        // Return current messages for polling
        console.log(`[HTTP POLLING] Getting messages for ${userId}, current messages: ${this.messages.length}`);
        // Filter call signals for this user only
        const relevantSignals = this.callSignals.filter(sig => 
          sig.data.callee?.id === userId || sig.data.caller?.id === userId
        );
        return Response.json({
          type: 'poll_response',
          data: {
            messages: this.messages,
            callSignals: relevantSignals,
            users: Array.from(this.users.values()),
            activeThemeId: this.activeThemeId,
            isLiveActive: this.isLiveActive,
            liveStreamer: this.liveStreamer,
            activeCoHosts: this.activeCoHosts,
            currentPoll: this.currentPoll
          }
        }, { headers: corsHeaders });
      }

      if (method === 'send_signal' && userId) {
        // Handle call signal sending via HTTP POST
        if (request.method === 'POST') {
          try {
            const body = await request.json();
            const signal = body.signal;
            console.log(`[HTTP POLLING] Received signal from ${userId}:`, signal.type);
            // Store signal for polling (keep only recent signals)
            this.callSignals.push({ ...signal, timestamp: Date.now() });
            if (this.callSignals.length > 100) {
              this.callSignals = this.callSignals.slice(-100);
            }
            await this.storage.put("callSignals", this.callSignals);
            // Broadcast to WebSocket clients
            this.broadcastToAll(signal);
            return Response.json({ success: true }, { headers: corsHeaders });
          } catch (err) {
            console.error(`[HTTP POLLING] Send signal error:`, err);
            return Response.json({ success: false, error: 'Invalid request' }, { status: 400, headers: corsHeaders });
          }
        } else {
          return Response.json({ success: false, error: 'POST method required' }, { status: 405, headers: corsHeaders });
        }
      }

      if (method === 'send_message' && userId) {
        // Handle message sending via HTTP POST
        if (request.method === 'POST') {
          try {
            const body = await request.json();
            const message = body.message;
            console.log(`[HTTP POLLING] Sending message from ${userId}, messageId: ${message.id}`);
            await this.handleMessageBroadcast(userId, message);
            return Response.json({ success: true }, { headers: corsHeaders });
          } catch (err) {
            console.error(`[HTTP POLLING] Send message error:`, err);
            return Response.json({ success: false, error: 'Invalid request' }, { status: 400, headers: corsHeaders });
          }
        } else {
          return Response.json({ success: false, error: 'POST method required' }, { status: 405, headers: corsHeaders });
        }
      }

      if (method === 'join' && userId) {
        // Handle join via HTTP
        if (request.method === 'POST') {
          try {
            const body = await request.json();
            console.log(`[HTTP POLLING JOIN] User ${userId} joining with nickname: ${body.nickname}`);
            const userProfile = {
              id: userId,
              nickname: body.nickname || "未知用户",
              avatarUrl: body.avatarUrl || ""
            };

            this.users.set(userId, userProfile);
            await this.storage.put("users", Object.fromEntries(this.users));
            console.log(`[HTTP POLLING JOIN] Total users after join: ${this.users.size}`);

            // Filter call signals for this user
            const relevantSignals = this.callSignals.filter(sig => 
              sig.data.callee?.id === userId || sig.data.caller?.id === userId
            );

            return Response.json({
              success: true,
              data: {
                messages: this.messages,
                callSignals: relevantSignals,
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
            return Response.json({ success: false, error: 'Invalid request' }, { status: 400, headers: corsHeaders });
          }
        } else {
          return Response.json({ success: false, error: 'POST method required' }, { status: 405, headers: corsHeaders });
        }
      }

      // Clean up old signals periodically (keep only last 30 minutes)
      const now = Date.now();
      this.callSignals = this.callSignals.filter(sig => now - (sig.timestamp || 0) < 30 * 60 * 1000);

      return Response.json({ success: false, error: 'Invalid method' }, { status: 400, headers: corsHeaders });
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
      case 'call_invitation':
        await this.handleCallSignal(userId, data);
        break;
      case 'call_accepted':
        await this.handleCallSignal(userId, data);
        break;
      case 'call_rejected':
        await this.handleCallSignal(userId, data);
        break;
      case 'call_ended':
        await this.handleCallSignal(userId, data);
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

    // Broadcast join event to all other users
    this.broadcastToAll({
      type: 'user_joined',
      roomId: this.roomId,
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
        roomId: this.roomId,
        data: { message }
      });
    }
  }

  private async handleThemeChange(themeId: string) {
    this.activeThemeId = themeId;
    await this.storage.put("activeThemeId", themeId);
    this.broadcastToAll({
      type: 'theme_change',
      roomId: this.roomId,
      data: { themeId }
    });
  }

  private async handlePollUpdate(poll: any) {
    this.currentPoll = poll;
    await this.storage.put("currentPoll", poll);
    this.broadcastToAll({
      type: 'poll_update',
      roomId: this.roomId,
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
      roomId: this.roomId,
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
      roomId: this.roomId,
      data: { messageId }
    });
  }

  private handleSignal(userId: string, data: any) {
    // Forward signaling data to all clients (client-side will filter by targetUserId)
    this.broadcastToAll({
      type: 'signal',
      roomId: this.roomId,
      data: {
        senderUserId: userId,
        signalData: data.signalData,
        callType: data.callType
      }
    });
  }

  private async handleCallSignal(userId: string, data: any) {
    const signalType = data.type || 'call_invitation';
    console.log(`[CALL SIGNAL] Processing ${signalType} from ${userId}`);
    
    // Store signal for HTTP polling
    this.callSignals.push({ ...data, timestamp: Date.now() });
    if (this.callSignals.length > 100) {
      this.callSignals = this.callSignals.slice(-100);
    }
    await this.storage.put("callSignals", this.callSignals);
    
    // Broadcast to all WebSocket clients
    this.broadcastToAll({
      type: signalType,
      roomId: this.roomId,
      userId: userId,
      data: data.data || {}
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

  private async broadcastLiveStatus() {
    this.broadcastToAll({
      type: 'live_status',
      roomId: this.roomId,
      data: {
        isLiveActive: this.isLiveActive,
        liveStreamer: this.liveStreamer,
        activeCoHosts: this.activeCoHosts
      }
    });
  }

  private broadcastToAll(message: any, excludeWs?: WebSocket) {
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
          console.error('Failed to send to client:', err);
          this.sessions.delete(ws);
        }
      }
    });
    
    console.log(`[DURABLE OBJECT BROADCAST] Total sent: ${sentCount}/${this.sessions.size}`);
  }
}
