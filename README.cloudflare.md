# Cloudflare Worker + Durable Object for Rooms

This branch adds a simple Cloudflare Worker backed by Durable Objects to provide real-time "rooms" where multiple browsers/devices can join the same room and exchange messages.

Files added
- `src/index.js` — Durable Object `Room` implementation and router (`/rooms/{roomId}`).
- `wrangler.toml` — Wrangler configuration with a `ROOMS` Durable Object binding. Replace `account_id` with your Cloudflare Account ID before publish.
- `public/ws-client.js` — Small client helper to connect to `/rooms/{roomId}` using WebSocket (works when Worker is bound to your Pages domain or via workers.dev).

How it works
- The Pages site (or any client) opens a `wss://.../rooms/{roomId}` WebSocket connection.
- The Worker routes `/rooms/{roomId}` requests to a Durable Object instance (named by `roomId`).
- The `Room` Durable Object holds in-memory WebSocket connections and broadcasts messages between connected clients.

Notes & limitations
- This example does in-memory connection tracking inside the Durable Object. Durable Objects provide a single instance per logical name, so this is sufficient for broadcasting; if you need message persistence or reconnection semantics, extend the DO to persist history to `this.state`.
- The `wrangler.toml` currently uses `account_id = "YOUR_ACCOUNT_ID"`. Replace it with your real account id from the Cloudflare dashboard.

Publish steps (quick)
1. Install Wrangler and login locally:
   - `npm install -g wrangler`
   - `wrangler login`
2. Replace `wrangler.toml` `account_id` with your account id.
3. Publish:
   - `wrangler publish`
   This deploys the Worker to `room-worker.<your-subdomain>.workers.dev`.
4. (Optional) Bind Worker to Pages domain:
   - In Cloudflare dashboard -> Workers -> choose the Worker -> Add route/trigger
   - Add route: `your-pages-site.pages.dev/rooms/*`
   - Select the Worker to bind. After that, your Pages site can use relative path `/rooms/{roomId}` for WebSocket connections.

Client example (on the Pages site)
```html
<script src="/ws-client.js"></script>
<script>
  const room = 'test-room';
  const ws = RoomSocket.create(room,
    (msg) => console.log('recv', msg),
    () => console.log('open'),
    () => console.log('close'),
    (e) => console.error('err', e)
  );

  // send example
  function send(text) {
    if (ws.readyState === WebSocket.OPEN) ws.send(text);
    else console.warn('ws not open');
  }
</script>
```

Debugging
- Use `wrangler tail` to watch logs while testing.
- If multiple clients do not see each other's messages, ensure they use the same `roomId`, and that the Worker route/endpoint is correct.

If you want, I can also create a Pull Request with these changes on branch `add/room-worker` — tell me and I'll create the PR and add a description.
