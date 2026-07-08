<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# NodeCrypt - 零知识端到端加密聊天室

<div align="center">

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/jason6668/Nodema)

</div>

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/7767c964-83f7-4144-b20e-15a0069f707e

## 🚀 一键部署到 Cloudflare

点击上方按钮即可一键部署到 Cloudflare Workers + Pages。

**详细部署步骤请查看：** [CLOUDFLARE_DEPLOYMENT.md](CLOUDFLARE_DEPLOYMENT.md)

## 💻 本地运行

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## 🌐 多浏览器互通（重要）

要让「不同浏览器/不同设备」互相收到消息，需要启动带 WebSocket 的服务端。

### 方式一：Cloudflare Workers（推荐）
- 使用 Cloudflare Workers + Durable Objects
- 支持跨浏览器消息同步
- 适合生产环境部署
- 详细配置见 [CLOUDFLARE_DEPLOYMENT.md](CLOUDFLARE_DEPLOYMENT.md)

### 方式二：传统 Node.js 服务器
- 开发：`npm run dev`
- 本地预览（带 WS）：`npm run preview`
- 生产：`npm run build` 然后 `npm run start`

如果你把前端部署到纯静态站点（例如 Pages）而后端部署在另一台服务器上，可以配置 `VITE_WS_URL` 指向后端地址（可写 `https://host` / `wss://host` / `host:port`）。
