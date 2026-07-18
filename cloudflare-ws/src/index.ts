type UserProfile = {
  id: string;
  nickname: string;
  avatarUrl: string;
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

function json(obj: unknown) {
  return JSON.stringify(obj);
}

const rooms = new Map<string, {
  sockets: Set<WebSocket>;
  users: Map<string, UserProfile>;
  messages: ChatMessage[];
  activeThemeId: string;
  isLiveActive: boolean;
  liveStreamer: string | null;
  activeCoHosts: UserProfile[];
  currentPoll: any | null;
}>();

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const match = url.pathname.match(/^\/ws\/(.+)$/);
    
    if (!match) return new Response('Not Found', { status: 404 });
    
    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response('Expected WebSocket', { status: 400 });
    }
    
    const roomId = decodeURIComponent(match[1]);
    
    if (!rooms.has(roomId)) {
      rooms.set(roomId, {
        sockets: new Set(),
        users: new Map(),
        messages: [],
        activeThemeId: 'sakura_dream',
        isLiveActive: false,
        liveStreamer: null,
        activeCoHosts: [],
        currentPoll: null,
      });
    }
    
    const room = rooms.get(roomId)!;
    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];
    server.accept();
    
    room.sockets.add(server);
    
    server.addEventListener('message', async (evt: MessageEvent) => {
      const raw = typeof evt.data === 'string' ? evt.data : '';
      if (!raw) return;
      
      let payload: any;
      try {
        payload = JSON.parse(raw);
      } catch {
        return;
      }
      
      const type = payload.type;
      const userId = payload.userId as string | undefined;
      
      if (type === 'join' && userId) {
        const nickname = payload.data?.nickname || '未知用户';
        const avatarUrl = payload.data?.avatarUrl || '';
        
        const user: UserProfile = { id: userId, nickname, avatarUrl };
        room.users.set(userId, user);
        
        server.send(
          json({
            type: 'init_state',
            roomId,
            data: {
              messages: room.messages,
              users: Array.from(room.users.values()),
              activeThemeId: room.activeThemeId,
              isLiveActive: room.isLiveActive,
              liveStreamer: room.liveStreamer,
              activeCoHosts: room.activeCoHosts,
              currentPoll: room.currentPoll,
            },
          })
        );
        
        room.sockets.forEach((ws) => {
          if (ws !== server) {
            ws.send(json({
              type: 'user_joined',
              roomId,
              data: { user, users: Array.from(room.users.values()) },
            }));
          }
        });
        return;
      }
      
      if (type === 'message') {
        const msg = payload.data?.message as ChatMessage | undefined;
        if (msg && !room.messages.some((m) => m.id === msg.id)) {
          room.messages.push(msg);
          if (room.messages.length > 500) room.messages.shift();
        }
      }
      
      room.sockets.forEach((ws) => {
        if (ws !== server) {
          try {
            ws.send(json(payload));
          } catch {}
        }
      });
    });
    
    server.addEventListener('close', () => {
      room.sockets.delete(server);
      const userId = Array.from(room.sockets.entries())
        .find(([, ws]) => ws === server)?.[0];
      room.sockets.delete(server);
    });
    
    server.addEventListener('error', () => {
      room.sockets.delete(server);
    });
    
    return new Response(null, { status: 101, webSocket: client });
  },
};