import express from "express";
import path from "path";
import http from "http";
import { WebSocketServer, WebSocket } from "ws";
import { createServer as createViteServer } from "vite";

// Interfaces for Server State
interface UserProfile {
  id: string; // unique client connection ID
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
  burnDuration?: number; // seconds, undefined means no burn
  burnTimerStartedAt?: number; // timestamp
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

interface RoomState {
  roomId: string;
  messages: ChatMessage[];
  users: Map<string, UserProfile>; // connectionId -> user profile
  activeThemeId: string;
  isLiveActive: boolean;
  liveStreamer: string | null;
  activeCoHosts: UserProfile[];
  currentPoll: any | null;
}

// In-Memory Database for Rooms
const roomsDb = new Map<string, RoomState>();

function getOrCreateRoom(roomId: string): RoomState {
  let room = roomsDb.get(roomId);
  if (!room) {
    room = {
      roomId,
      messages: [],
      users: new Map(),
      activeThemeId: 'sakura_dream',
      isLiveActive: false,
      liveStreamer: null,
      activeCoHosts: [],
      currentPoll: null
    };
    roomsDb.set(roomId, room);
  }
  return room;
}

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server });
  const PORT = 3000;

  // Serve static JSON metadata if needed
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", rooms: roomsDb.size });
  });

  // Client connection tracking map
  const clients = new Map<WebSocket, { roomId: string; userId: string }>();

  // WebSocket Connection Handler
  wss.on("connection", (ws: WebSocket) => {
    console.log("New WebSocket connection established");

    ws.on("message", (messageStr: string) => {
      try {
        const payload = JSON.parse(messageStr);
        const { type, roomId, userId, data } = payload;

        if (!roomId || !userId) return;

        // 1. JOIN ROOM
        if (type === "join") {
          const room = getOrCreateRoom(roomId);
          
          // Register user profile
          const userProfile: UserProfile = {
            id: userId,
            nickname: data.nickname || "未知用户",
            avatarUrl: data.avatarUrl || ""
          };

          room.users.set(userId, userProfile);
          clients.set(ws, { roomId, userId });

          console.log(`User ${userProfile.nickname} (${userId}) joined room ${roomId}`);

          // Send current state to newly joined user
          const activeUsersList = Array.from(room.users.values());
          ws.send(JSON.stringify({
            type: "init_state",
            roomId,
            data: {
              messages: room.messages,
              users: activeUsersList,
              activeThemeId: room.activeThemeId,
              isLiveActive: room.isLiveActive,
              liveStreamer: room.liveStreamer,
              activeCoHosts: room.activeCoHosts,
              currentPoll: room.currentPoll
            }
          }));

          // Broadcast join event and updated user list to all other clients in the same room
          broadcastToRoom(roomId, {
            type: "user_joined",
            roomId,
            data: {
              user: userProfile,
              users: activeUsersList
            }
          });
        }

        // 2. CHAT MESSAGE
        else if (type === "message") {
          const room = getOrCreateRoom(roomId);
          const chatMsg: ChatMessage = data.message;
          
          // Make sure message isn't duplicated
          if (!room.messages.some(m => m.id === chatMsg.id)) {
            room.messages.push(chatMsg);
            
            // Limit message history to prevent excessive memory usage
            if (room.messages.length > 500) {
              room.messages.shift();
            }

            broadcastToRoom(roomId, {
              type: "message",
              roomId,
              data: { message: chatMsg }
            });
          }
        }

        // 3. THEME CHANGE
        else if (type === "theme_change") {
          const room = getOrCreateRoom(roomId);
          room.activeThemeId = data.themeId;

          broadcastToRoom(roomId, {
            type: "theme_change",
            roomId,
            data: { themeId: data.themeId }
          });
        }

        // 4. GIFT SENT
        else if (type === "gift") {
          // Broadcast gift immediately to show overlay animations
          broadcastToRoom(roomId, {
            type: "gift",
            roomId,
            data: {
              senderId: userId,
              senderName: data.senderName,
              senderAvatar: data.senderAvatar,
              giftId: data.giftId,
              giftName: data.giftName,
              giftEmoji: data.giftEmoji,
              comboCount: data.comboCount
            }
          });

          // Add a system notification message about the gift
          const room = getOrCreateRoom(roomId);
          const giftMsg: ChatMessage = {
            id: `gift-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            userId: "system",
            userName: "系统公告",
            avatar: "📢",
            content: `${data.senderName} 送出了 ${data.giftEmoji} ${data.giftName} x${data.comboCount}!`,
            type: "system",
            reactions: []
          };
          room.messages.push(giftMsg);
          broadcastToRoom(roomId, {
            type: "message",
            roomId,
            data: { message: giftMsg }
          });
        }

        // 5. DANMAKU (FLYING BULLET COMMENTS)
        else if (type === "danmaku") {
          broadcastToRoom(roomId, {
            type: "danmaku",
            roomId,
            data: {
              id: `danmaku-${Date.now()}`,
              text: data.text,
              color: data.color || "#ffffff",
              avatar: data.avatar || "👤",
              senderName: data.senderName
            }
          });
        }

        // 6. POLL CREATION / VOTING
        else if (type === "poll_update") {
          const room = getOrCreateRoom(roomId);
          room.currentPoll = data.poll;

          broadcastToRoom(roomId, {
            type: "poll_update",
            roomId,
            data: { poll: data.poll }
          });
        }

        // 7. STREAM LIVE STATUS
        else if (type === "live_status") {
          const room = getOrCreateRoom(roomId);
          room.isLiveActive = data.isLiveActive;
          room.liveStreamer = data.isLiveActive ? data.liveStreamer : null;
          if (!data.isLiveActive) {
            room.activeCoHosts = [];
          }

          broadcastToRoom(roomId, {
            type: "live_status",
            roomId,
            data: {
              isLiveActive: room.isLiveActive,
              liveStreamer: room.liveStreamer,
              activeCoHosts: room.activeCoHosts
            }
          });
        }

        // 8. ADD CO-HOST
        else if (type === "cohost_join") {
          const room = getOrCreateRoom(roomId);
          const user = room.users.get(userId);
          if (user) {
            user.isCoHost = true;
            if (!room.activeCoHosts.some(h => h.id === userId)) {
              room.activeCoHosts.push(user);
            }
          }
          broadcastToRoom(roomId, {
            type: "live_status",
            roomId,
            data: {
              isLiveActive: room.isLiveActive,
              liveStreamer: room.liveStreamer,
              activeCoHosts: room.activeCoHosts
            }
          });
        }

        // 9. REMOVE CO-HOST
        else if (type === "cohost_leave") {
          const room = getOrCreateRoom(roomId);
          const user = room.users.get(userId);
          if (user) {
            user.isCoHost = false;
          }
          room.activeCoHosts = room.activeCoHosts.filter(h => h.id !== userId);
          broadcastToRoom(roomId, {
            type: "live_status",
            roomId,
            data: {
              isLiveActive: room.isLiveActive,
              liveStreamer: room.liveStreamer,
              activeCoHosts: room.activeCoHosts
            }
          });
        }

        // 10. BURN / DELETE CHAT MESSAGE (For self-destruct)
        else if (type === "burn_message") {
          const room = getOrCreateRoom(roomId);
          const msgId = data.messageId;
          
          room.messages = room.messages.filter(m => m.id !== msgId);
          broadcastToRoom(roomId, {
            type: "burn_message",
            roomId,
            data: { messageId: msgId }
          });
        }

        // 11. WEBRTC SIGNALING (For true voice/video streaming/calling)
        else if (type === "signal") {
          // Forward signaling data to the specific recipient
          const targetUserId = data.targetUserId;
          broadcastToRoom(roomId, {
            type: "signal",
            roomId,
            data: {
              senderUserId: userId,
              signalData: data.signalData,
              callType: data.callType
            }
          }, (clientWs) => {
            const clientInfo = clients.get(clientWs);
            return clientInfo?.roomId === roomId && clientInfo?.userId === targetUserId;
          });
        }

      } catch (err) {
        console.error("Failed to parse WebSocket message:", err);
      }
    });

    ws.on("close", () => {
      const clientInfo = clients.get(ws);
      if (clientInfo) {
        const { roomId, userId } = clientInfo;
        const room = roomsDb.get(roomId);
        if (room) {
          const userProfile = room.users.get(userId);
          const nickname = userProfile?.nickname || "未知用户";
          
          // Remove user from room and co-hosts
          room.users.delete(userId);
          room.activeCoHosts = room.activeCoHosts.filter(h => h.id !== userId);

          // If the live streamer disconnected, end the live stream
          if (room.liveStreamer === nickname) {
            room.isLiveActive = false;
            room.liveStreamer = null;
            room.activeCoHosts = [];
          }

          console.log(`User ${nickname} (${userId}) disconnected from room ${roomId}`);

          const activeUsersList = Array.from(room.users.values());
          // Notify room of user departure
          broadcastToRoom(roomId, {
            type: "user_left",
            roomId,
            data: {
              userId,
              nickname,
              users: activeUsersList,
              isLiveActive: room.isLiveActive,
              liveStreamer: room.liveStreamer,
              activeCoHosts: room.activeCoHosts
            }
          });

          // Clean up empty room to free memory after some inactivity
          if (room.users.size === 0) {
            // Keep room history for a bit or clear it
            // For this applet, let's keep it in memory so users can revisit, but cap message histories
          }
        }
        clients.delete(ws);
      }
    });
  });

  // Broadcast helper function
  function broadcastToRoom(
    roomId: string, 
    msgObj: any, 
    filterFn: (ws: WebSocket) => boolean = () => true
  ) {
    const rawMsg = JSON.stringify(msgObj);
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        const info = clients.get(client);
        if (info && info.roomId === roomId && filterFn(client)) {
          client.send(rawMsg);
        }
      }
    });
  }

  // Vite development middleware vs production bundle static serving
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
