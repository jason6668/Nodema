# NodeCrypt 一键部署在 Cloudflare 指南 (One-Click Cloudflare Deployment Guide)

本指南将指导您如何利用 **Cloudflare Pages** 将 NodeCrypt 加密聊天室与直播间应用一键免费部署。

由于 NodeCrypt 的所有 **AES-GCM-256 安全加解密算法均在浏览器本地（客户端）安全渲染完成**，本系统可以完美通过静态页面独立发布，无需依赖复杂的传统服务器，安全可靠。

---

## 🚀 方式一：利用 Cloudflare 网页后台 (GitHub 自动化构建 - 推荐)

这是最简单、最主流的部署方式。每次您向 GitHub 提交代码，Cloudflare 将会自动拉取并部署。

### 1. 准备工作
1. 将您的 NodeCrypt 项目代码上传至您的个人 **GitHub** / **GitLab** 仓库。
2. 登录 [Cloudflare 控制台](https://dash.cloudflare.com/)。

### 2. 部署步骤
1. 在 Cloudflare 仪表板左侧导航栏，点击 **"Workers 和 Pages"** -> **"创建"** (Create)。
2. 选择 **"Pages"** 标签页，然后点击 **"连接到 Git"** (Connect to Git)。
3. 授权连接您的 GitHub 账号，选择 NodeCrypt 的项目仓库，点击 **"开始设置"**。
4. 在 **"构建设置"** (Build Settings) 中进行如下配置：
   - **框架预设 (Framework Preset)**: 选择 `Vite`
   - **构建命令 (Build Command)**: `npm run build`
   - **输出目录 (Build Output Directory)**: `dist`
5. **环境变量 (Environment Variables)**: (可选)
   - 如果您希望自定义某些公开变量，可以添加：`VITE_APP_URL` 为您的自定义域名。
6. 点击 **"保存并部署"** (Save and Deploy)。

部署完成后，Cloudflare 将为您生成一个专属二级域名 `https://your-app.pages.dev`，点击即可安全登录！

---

## 💻 方式二：使用 Wrangler CLI 命令行工具一键本地部署

如果您不想连接 GitHub，可以直接在本地通过 Cloudflare 命令行工具（Wrangler）直接构建并发布到 Cloudflare 节点。

### 1. 安装 Cloudflare CLI 工具
在本地项目根目录下运行安装：
```bash
npm install -g wrangler
```

### 2. 登录您的 Cloudflare 账号
```bash
wrangler login
```
系统会自动弹窗打开浏览器，点击 "Authorize" 授予 wrangler 终端发布权限。

### 3. 本地编译打包项目
```bash
npm run build
```
编译成功后，您的项目根目录下会生成一个 `dist/` 文件夹。

### 4. 运行一键发布命令
直接将 `dist/` 静态资源一键同步到 Cloudflare Pages 全球 CDN：
```bash
wrangler pages deploy dist --project-name=nodecrypt-chat
```
- 控制台将询问您是否创建新项目，选择 **"Yes"** 并选择您的生产环境。
- Wrangler 仅需 5 秒钟即可完成全球加速分发，并在控制台返回您的专属安全访问链接！

---

## 🔒 环境变量与安全密钥声明 (Environment & Secrets)

根据安全指引，**NodeCrypt** 全程遵守端到端零知识零日志架构：
1. **GEMINI_API_KEY**:
   - 如果您接入了后端的 Gemini AI 智能辅佐或转译，可以通过 Cloudflare 控制台 -> 项目设置 -> "环境变量" 中安全绑定，无需写入明文代码，防范密钥泄露。
2. **多端互通同步原理 (Multi-device / Multi-browser Sync)**:
   - 仅用 Cloudflare Pages（纯静态）时：可以利用浏览器的 `localStorage` 实现「同一浏览器的多标签页/多窗口」同步，但**不同浏览器（Chrome/Edge/Safari）之间无法互通**（各浏览器存储隔离）。
   - 如需「不同浏览器 / 不同设备」互通：必须提供一个可用的 WebSocket 后端做转发。
     - 方案 A：部署 Node 服务端（本项目 `server.ts` / `npm run start`）
     - 方案 B（推荐）：部署 Cloudflare Worker + Durable Object（见 `CLOUDFLARE_WS_DEPLOY.md`）
   - 前端通过环境变量 `VITE_WS_URL` 指向 WebSocket 后端的 base URL（支持 `http(s)://` / `ws(s)://` / `host:port`），并自动连接到 `/ws/<房间号>`。

祝您体验愉快！如果有任何关于安全底座的调整需求，请随时告诉我。

---

# One-Click Cloudflare Deployment Guide (English)

This guide helps you deploy **NodeCrypt** instantly on **Cloudflare Pages** for free.

Since all AES-GCM-256 end-to-end encryption algorithms run fully locally in the client-side browser browser, NodeCrypt runs seamlessly as a secure decentralized web interface on Cloudflare Pages without needing complex host configuration.

## 🚀 Method 1: Connecting with GitHub (Auto-Build)

1. Upload your code to a **GitHub** repository.
2. Go to **Cloudflare Dashboard** -> **Workers & Pages** -> **Create** -> **Pages** -> **Connect to Git**.
3. Set these build configurations:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Build Output Directory**: `dist`
4. Click **Save and Deploy**. You're done!

## 💻 Method 2: Command Line Deploy via Wrangler CLI

1. Run: `npm install -g wrangler`
2. Run: `wrangler login` to authorize Cloudflare.
3. Build the assets: `npm run build`
4. Publish instantly: `wrangler pages deploy dist --project-name=nodecrypt-chat`
