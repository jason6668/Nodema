<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/7767c964-83f7-4144-b20e-15a0069f707e

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## 多浏览器互通（重要）

要让「不同浏览器/不同设备」互相收到消息，需要启动带 WebSocket 的服务端（本项目的 `server.ts`）。推荐：
- 开发：`npm run dev`
- 本地预览（带 WS）：`npm run preview`
- 生产：`npm run build` 然后 `npm run start`

如果你把前端部署到纯静态站点（例如 Pages）而后端部署在另一台服务器上，可以配置 `VITE_WS_URL` 指向后端地址（可写 `https://host` / `wss://host` / `host:port`）。
