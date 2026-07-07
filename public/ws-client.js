// public/ws-client.js
// Simple client helper to connect to the Worker DO rooms
// Usage example in browser console or include in your pages

(function (global) {
  function createRoomSocket(roomId, onMessage, onOpen, onClose, onError) {
    // Use relative host so that when the Worker is routed to pages.dev it works with same-origin
    const host = location.host;
    const protocol = location.protocol === 'https:' ? 'wss' : 'ws';
    const url = `${protocol}://${host}/rooms/${encodeURIComponent(roomId)}`;

    const ws = new WebSocket(url);
    ws.addEventListener('open', () => onOpen && onOpen());
    ws.addEventListener('message', (evt) => onMessage && onMessage(evt.data));
    ws.addEventListener('close', () => onClose && onClose());
    ws.addEventListener('error', (e) => onError && onError(e));

    return ws;
  }

  // Expose to global scope
  global.RoomSocket = { create: createRoomSocket };
})(window);
