export interface Env {
  CHAT_ROOMS: DurableObjectNamespace;
}

type UserProfile = {
  id: string;
  nickname: string;
  avatarUrl: string;
  isStreamer?: boolean;
  isCoHost?: boolean;
};

type ChatMessage = {
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
  replyTo?: { id: string; userName: string; content: string };
  isPrivate?: boolean;
  privateTo?: string;
  isBurned?: boolean;
};

type Payload =
  | { type: 'join'; roomId?: string; userId?: string; data?: Partial<UserProfile> }
  | { type: 'message'; roomId?: string; userId?: string; data?: { message: ChatMessage } }
  | { type: 'theme_change'; roomId?: string; userId?: string; data?: { themeId: string } }
  | { type: 'gift'; roomId?: string; userId?: string; data?: any }
  | { type: 'danmaku'; roomId?: string; userId?: string; data?: any }
  | { type: 'poll_update'; roomId?: string; userId?: string; data?: any }
  | { type: 'live_status'; roomId?: string; userId?: string; data?: any }
  | { type: 'cohost_join'; roomId?: string; userId?: string; data?: any }
  | { type: 'cohost_leave'; roomId?: string; userId?: string; data?: any }
  | { type: 'burn_message'; roomId?: string; userId?: string; data?: any }
  | { type: 'signal'; roomId?: string; userId?: string; data?: any }
  | { type: string; [k: string]: any };

function json(obj: unknown) {
  return JSON.stringify(obj);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const match = url.pathname.match(/^\/ws\/(.+)$/);
    if (!match) return new Response('Not Found', { status: 404 });

    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response('Expected WebSocket', { status: 400 });
    }

    const roomId = decodeURIComponent(match[1]);
    const id = env.CHAT_ROOMS.idFromName(roomId);
    const stub = env.CHAT_ROOMS.get(id);
    return stub.fetch(request);
  },
};

export class ChatRoom implements DurableObject {
  private state: DurableObjectState;
  private sockets = new Set<WebSocket>();
  private socketInfo = new Map<WebSocket, { roomId: string; userId: string }>();

  private users = new Map<string, UserProfile>();
  private messages: ChatMessage[] = [];
  private activeThemeId = 'sakura_dream';
  private isLiveActive = false;
  private liveStreamer: string | null = null;
  private activeCoHosts: UserProfile[] = [];
  private currentPoll: any | null = null;

  constructor(state: DurableObjectState) {
    this.state = state;
  }

  async fetch(request: Request): Promise<Response> {
    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];
    server.accept();

    const url = new URL(request.url);
    const match = url.pathname.match(/^\/ws\/(.+)$/);
    const roomId = match ? decodeURIComponent(match[1]) : 'default';

    this.sockets.add(server);

    server.addEventListener('message', async (evt: MessageEvent) => {
      const raw = typeof evt.data === 'string' ? evt.data : '';
      if (!raw) return;

      let payload: Payload;
      try {
        payload = JSON.parse(raw);
      } catch {
        return;
      }

      const type = payload.type;
      const userId = (payload as any).userId as string | undefined;

      // JOIN
      if (type === 'join' && userId) {
        const nickname = (payload as any)?.data?.nickname || '未知用户';
        const avatarUrl = (payload as any)?.data?.avatarUrl || '';

        const user: UserProfile = { id: userId, nickname, avatarUrl };
        this.users.set(userId, user);
        this.socketInfo.set(server, { roomId, userId });

        // init_state for the new connection
        server.send(
          json({
            type: 'init_state',
            roomId,
            data: {
              messages: this.messages,
              users: Array.from(this.users.values()),
              activeThemeId: this.activeThemeId,
              isLiveActive: this.isLiveActive,
              liveStreamer: this.liveStreamer,
              activeCoHosts: this.activeCoHosts,
              currentPoll: this.currentPoll,
            },
          })
        );

        // broadcast user_joined to others
        this.broadcast(
          {
            type: 'user_joined',
            roomId,
            data: {
              user,
              users: Array.from(this.users.values()),
            },
          },
          server
        );
        return;
      }

      // MESSAGE
      if (type === 'message') {
        const msg = (payload as any)?.data?.message as ChatMessage | undefined;
        if (msg && !this.messages.some((m) => m.id === msg.id)) {
          this.messages.push(msg);
          if (this.messages.length > 500) this.messages.shift();
        }
        this.broadcast(payload, undefined);
        return;
      }

      // THEME CHANGE (and other realtime events) - just broadcast + update minimal state
      if (type === 'theme_change') {
        const themeId = (payload as any)?.data?.themeId;
        if (typeof themeId === 'string') this.activeThemeId = themeId;
        this.broadcast(payload, undefined);
        return;
      }

      if (type === 'poll_update') {
        this.currentPoll = (payload as any)?.data?.poll ?? null;
        this.broadcast(payload, undefined);
        return;
      }

      if (type === 'live_status') {
        this.isLiveActive = !!(payload as any)?.data?.isLiveActive;
        this.liveStreamer = (payload as any)?.data?.liveStreamer ?? null;
        this.activeCoHosts = (payload as any)?.data?.activeCoHosts ?? [];
        this.broadcast(payload, undefined);
        return;
      }

      // default: broadcast as-is (gift/danmaku/signal/burn...)
      this.broadcast(payload, undefined);
    });

    server.addEventListener('close', () => {
      this.handleClose(server);
    });
    server.addEventListener('error', () => {
      this.handleClose(server);
    });

    return new Response(null, { status: 101, webSocket: client });
  }

  private handleClose(ws: WebSocket) {
    this.sockets.delete(ws);
    const info = this.socketInfo.get(ws);
    this.socketInfo.delete(ws);

    if (!info) return;
    const { roomId, userId } = info;
    const user = this.users.get(userId);
    const nickname = user?.nickname || '未知用户';

    this.users.delete(userId);
    this.activeCoHosts = this.activeCoHosts.filter((h) => h.id !== userId);

    // broadcast user_left
    this.broadcast({
      type: 'user_left',
      roomId,
      data: {
        userId,
        nickname,
        users: Array.from(this.users.values()),
        isLiveActive: this.isLiveActive,
        liveStreamer: this.liveStreamer,
        activeCoHosts: this.activeCoHosts,
      },
    });
  }

  private broadcast(msgObj: any, exclude?: WebSocket) {
    const raw = json(msgObj);
    for (const ws of this.sockets) {
      if (exclude && ws === exclude) continue;
      try {
        ws.send(raw);
      } catch {
        // ignore broken ws
      }
    }
  }
}

