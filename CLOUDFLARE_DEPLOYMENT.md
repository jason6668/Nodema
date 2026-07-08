# Cloudflare Workers 部署指南

## 问题说明

原 `server.ts` 使用内存存储 (`roomsDb` 和 `clients` Map)，在 Cloudflare 无服务器环境中会导致状态丢失。Cloudflare 的无服务器环境每次请求可能在不同的实例上运行，导致 WebSocket 连接状态无法共享。

## 解决方案

使用 Cloudflare Workers + Durable Objects 来维护 WebSocket 连接状态和房间数据。

## 部署步骤

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

在 `.env` 文件中设置：

```bash
VITE_WS_URL="https://your-worker-name.your-subdomain.workers.dev"
```

### 3. 部署 Cloudflare Workers

```bash
# 安装 Wrangler CLI（如果还没有安装）
npm install -g wrangler

# 登录 Cloudflare
wrangler login

# 部署 Workers
npm run deploy:worker
```

### 4. 配置 Cloudflare Pages

1. 在 Cloudflare Dashboard 中创建 Pages 项目
2. 连接到 GitHub 仓库
3. 设置构建命令：
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
4. 在环境变量中设置 `VITE_WS_URL` 为你的 Workers URL

### 5. 启用 Durable Objects

在 Cloudflare Dashboard 中：
1. 进入 Workers & Pages
2. 选择你的 Worker
3. 进入 Settings > Durable Objects
4. 添加绑定：
   - **Variable name**: `ROOM_DURABLE_OBJECT`
   - **Durable Object class**: `RoomDurableObject`

## 架构说明

### 文件结构

```
├── worker/
│   ├── index.ts              # Workers 入口文件
│   └── room-durable-object.ts # Durable Object 实现
├── wrangler.toml            # Cloudflare 配置文件
├── tsconfig.worker.json      # Workers TypeScript 配置
└── src/
    └── components/
        └── SecureChatRoom.tsx # 前端 WebSocket 客户端
```

### 工作原理

1. **前端连接**: 前端通过 `VITE_WS_URL` 连接到 Cloudflare Workers
2. **Workers 路由**: Workers 根据房间 ID 路由到对应的 Durable Object
3. **Durable Object**: 每个 Durable Object 实例管理一个房间的状态
4. **状态持久化**: 使用 Durable Object Storage 持久化消息和用户数据
5. **WebSocket 管理**: Durable Object 维护所有 WebSocket 连接

### Durable Object 优势

- **状态持久化**: 数据在实例重启后仍然保留
- **全局一致性**: 同一房间的所有连接路由到同一个 Durable Object
- **低延迟**: Durable Object 部署在边缘节点，减少延迟
- **自动扩展**: Cloudflare 自动管理扩展和负载均衡

## 测试

1. 在浏览器 A 中打开应用并进入房间
2. 在浏览器 B 中打开应用并进入**同一个房间**（相同的 Room ID 和 Passphrase）
3. 在浏览器 A 中发送消息
4. 浏览器 B 应该能收到消息

## 调试

### 查看 Workers 日志

```bash
wrangler tail
```

### 查看前端日志

打开浏览器控制台，查看以下日志：
- `[WS MESSAGE]` - 接收到的 WebSocket 消息
- `[SEND MESSAGE]` - 发送的 WebSocket 消息
- `[DURABLE OBJECT BROADCAST]` - Durable Object 广播日志

## 注意事项

1. **Durable Objects 限制**: 免费计划有 Durable Objects 使用限制
2. **冷启动**: 首次连接可能有冷启动延迟
3. **WebSocket 超时**: Cloudflare Workers WebSocket 连接有超时限制
4. **数据清理**: 建议定期清理过期的房间数据

## 回退到传统服务器

如果需要回退到传统 Node.js 服务器：

```bash
npm run dev  # 开发模式
npm run build && npm run start  # 生产模式
```

前端会自动检测是否设置了 `VITE_WS_URL`，如果没有设置则使用相对路径连接到本地服务器。
