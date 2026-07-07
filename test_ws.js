import WebSocket from 'ws';

const ws = new WebSocket('ws://localhost:3000');

ws.on('open', () => {
  console.log('WS connection opened');
  ws.send(JSON.stringify({
    type: 'join',
    roomId: 'Room-888',
    userId: 'user-test-agent',
    data: {
      nickname: 'TestAgent',
      avatarUrl: ''
    }
  }));
});

ws.on('message', (data) => {
  const payload = JSON.parse(data.toString());
  console.log('Received payload:', JSON.stringify(payload, null, 2));
});

ws.on('close', () => {
  console.log('WS connection closed');
});

ws.on('error', (err) => {
  console.error('WS error:', err);
});
