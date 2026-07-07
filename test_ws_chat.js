import WebSocket from 'ws';

const userA = new WebSocket('ws://localhost:3000');
const userB = new WebSocket('ws://localhost:3000');

let userAJoined = false;
let userBJoined = false;

userA.on('open', () => {
  console.log('User A connected');
  userA.send(JSON.stringify({
    type: 'join',
    roomId: 'Room-888',
    userId: 'user-A',
    data: { nickname: 'Alice', avatarUrl: '' }
  }));
});

userB.on('open', () => {
  console.log('User B connected');
  userB.send(JSON.stringify({
    type: 'join',
    roomId: 'Room-888',
    userId: 'user-B',
    data: { nickname: 'Bob', avatarUrl: '' }
  }));
});

userA.on('message', (data) => {
  const payload = JSON.parse(data.toString());
  console.log('User A received:', payload.type);
  if (payload.type === 'init_state') {
    userAJoined = true;
    checkAndSend();
  }
});

userB.on('message', (data) => {
  const payload = JSON.parse(data.toString());
  console.log('User B received:', payload.type, payload.data ? JSON.stringify(payload.data) : '');
  if (payload.type === 'init_state') {
    userBJoined = true;
    checkAndSend();
  }
});

function checkAndSend() {
  if (userAJoined && userBJoined) {
    console.log('Both users joined, Alice sending a message...');
    userA.send(JSON.stringify({
      type: 'message',
      roomId: 'Room-888',
      userId: 'user-A',
      data: {
        message: {
          id: 'msg-alice-12345',
          userId: 'user-A',
          userName: 'Alice',
          avatar: '',
          content: 'Hello Bob!',
          encryptedContent: 'ENCRYPTED_TEXT_HERE',
          type: 'text',
          reactions: []
        }
      }
    }));
  }
}

setTimeout(() => {
  console.log('Closing connections');
  userA.close();
  userB.close();
  process.exit(0);
}, 5000);
