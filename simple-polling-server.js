// Simple HTTP Polling Server
// Can be deployed to any Node.js environment (domestic servers, Vercel, etc.)
// Uses in-memory storage for simplicity

const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage (use Redis for production)
const rooms = new Map();

// Helper functions
function getRoom(roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      messages: [],
      users: new Map()
    });
  }
  return rooms.get(roomId);
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Simple Polling Server' });
});

// Join room
app.post('/api/poll/:roomId', (req, res) => {
  const { roomId } = req.params;
  const { method, userId } = req.query;
  const room = getRoom(roomId);

  console.log(`[POLLING SERVER] ${method} for room ${roomId}, user ${userId}`);

  if (method === 'join') {
    const { nickname, avatarUrl } = req.body;
    room.users.set(userId, {
      id: userId,
      nickname: nickname || '未知用户',
      avatarUrl: avatarUrl || ''
    });

    return res.json({
      success: true,
      data: {
        messages: room.messages,
        users: Array.from(room.users.values())
      }
    });
  }

  if (method === 'get_messages') {
    return res.json({
      type: 'poll_response',
      data: {
        messages: room.messages,
        users: Array.from(room.users.values())
      }
    });
  }

  if (method === 'send_message') {
    const { message } = req.body;
    if (message && !room.messages.find(m => m.id === message.id)) {
      room.messages.push(message);
      // Keep only last 500 messages
      if (room.messages.length > 500) {
        room.messages.shift();
      }
    }
    return res.json({ success: true });
  }

  res.json({ success: false, error: 'Invalid method' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Simple Polling Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`Polling endpoint: http://localhost:${PORT}/api/poll/:roomId`);
});
