# Cloudflare Pages 跨浏览器互通（必读）

你现在用的 `*.pages.dev` 是纯静态站点，它不会运行本项目的 Node 服务端 `server.ts`，因此**无法在不同浏览器/不同手机之间互通消息**。

要实现跨浏览器/跨设备实时互通，需要一个**可公网访问的 WebSocket 转发后端**。本仓库已提供 Cloudflare Worker + Durable Object 版本，目录在 `cloudflare-ws/`。

## 1. 部署 WebSocket Worker（Cloudflare）

前提：
- 你有 Cloudflare 账号，并已登录
- 已安装 Node.js

步骤：
1. 进入 `cloudflare-ws/` 目录：
   - `cd cloudflare-ws`
2. 安装依赖：
   - `npm install`
3. 登录 Cloudflare（若未登录）：
   - `npx wrangler login`
4. 部署 Worker：
   - `npm run deploy`

部署成功后会得到一个 Worker 域名，形如：
- `https://nodema-ws.<你的子域>.workers.dev`

对应 WebSocket 地址为：
- `wss://nodema-ws.<你的子域>.workers.dev/ws/<房间号>`

## 2. 配置 Cloudflare Pages 前端（关键）

在 Cloudflare Pages 项目的设置里，新增环境变量：
- `VITE_WS_URL = https://nodema-ws.<你的子域>.workers.dev`

然后触发一次重新部署（或重新构建）。

## 3. 验证方法

1. 用 Chrome 打开你的 Pages 域名，进入同一个房间号
2. 用 Edge / Safari / 手机浏览器打开同一个 Pages 域名，进入同一个房间号
3. 互发消息应可实时收到

## 常见坑

- Pages 是 `https://`：Worker 也必须使用 `https://`（这样前端才会用 `wss://` 连接），否则浏览器会拦截混合内容。
- 只部署 Pages 不部署 Worker：一定无法跨浏览器互通（只能同浏览器 localStorage 同步）。

