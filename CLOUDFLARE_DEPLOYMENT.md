# Cloudflare Workers 部署指南

## 问题说明

原 `server.ts` 使用内存存储 (`roomsDb` 和 `clients` Map)，在 Cloudflare 无服务器环境中会导致状态丢失。Cloudflare 的无服务器环境每次请求可能在不同的实例上运行，导致 WebSocket 连接状态无法共享。

## 解决方案

使用 Cloudflare Workers + Durable Objects 来维护 WebSocket 连接状态和房间数据。

## ⚠️ 重要：架构说明

本项目需要**分别部署**两个部分：

1. **Worker（后端）**: WebSocket 服务器，使用 Durable Objects 管理状态
2. **Pages（前端）**: React 静态网页，连接到 Worker

**Worker 和 Pages 是 Cloudflare 的两个不同服务，必须分开配置！**

## 部署步骤

### 第一步：部署 Worker（后端）

```bash
# 1. 安装依赖
npm install

# 2. 安装 Wrangler CLI（如果还没有安装）
npm install -g wrangler

# 3. 登录 Cloudflare
wrangler login

# 4. 部署 Worker
npm run deploy:worker
```

部署成功后，你会看到类似这样的输出：
```
✨ Published nodecrypt (1.23 sec)
   https://nodecrypt.your-subdomain.workers.dev
```

**记住这个 URL，后面配置 Pages 时需要用到！**

### 第二步：配置 Worker 的 Durable Objects

在 Cloudflare Dashboard 中：
1. 进入 **Workers & Pages**
2. 选择刚才部署的 **Worker**（不是 Pages！）
3. 进入 **Settings** > **Durable Objects**
4. 点击 **Add binding**
5. 填写：
   - **Variable name**: `ROOM_DURABLE_OBJECT`
   - **Durable Object class**: `RoomDurableObject`
6. 点击 **Save**

**⚠️ 注意：如果下拉框里找不到 `RoomDurableObject`，说明 Worker 还没有成功部署。请检查 Worker 的部署状态。**

### 第三步：部署 Pages（前端）

1. 在 Cloudflare Dashboard 中创建 **Pages** 项目
2. 连接到 GitHub 仓库
3. 设置构建命令：
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
4. 在 **Environment variables** 中添加：
   - **Variable name**: `VITE_WS_URL`
   - **Value**: 第一步部署 Worker 时得到的 URL（例如：`https://nodecrypt.your-subdomain.workers.dev`）
5. 点击 **Save and Deploy**

### 第四步：验证部署

1. 打开 Pages 的 URL
2. 进入一个房间
3. 在另一个浏览器中打开同一个房间
4. 发送消息，验证跨浏览器同步

## 架构说明

### 文件结构

```
├── worker/
│   ├── index.ts              # Workers 入口文件
│   └── room-durable-object.ts # Durable Object 实现
├── wrangler.toml            # Cloudflare Worker 配置文件
├── tsconfig.worker.json      # Worker TypeScript 配置
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

### 查看 Worker 日志

```bash
wrangler tail
```

### 查看 Worker 部署状态

在 Cloudflare Dashboard 中：
1. 进入 **Workers & Pages**
2. 选择你的 **Worker**
3. 点击 **Deployments** 标签
4. 查看最新部署的状态（应该显示 "Success"）

### 查看前端日志

打开浏览器控制台，查看以下日志：
- `[WS MESSAGE]` - 接收到的 WebSocket 消息
- `[SEND MESSAGE]` - 发送的 WebSocket 消息
- `[DURABLE OBJECT BROADCAST]` - Durable Object 广播日志

## 常见问题

### Q: 在 Worker 的 Durable Objects 设置中找不到 RoomDurableObject 类名？

**A:** 这说明 Worker 还没有成功部署。请检查：
1. Worker 的部署状态是否为 "Success"
2. 如果部署失败，查看部署日志找出错误原因
3. 确保 `wrangler.toml` 中的 `class_name` 与代码中的类名一致

### Q: 部署 Worker 时出现编译错误？

**A:** 可能的原因：
1. TypeScript 类型错误：运行 `npm run lint` 检查
2. 依赖缺失：运行 `npm install` 安装所有依赖
3. 构建命令错误：确保 `package.json` 中有 `build:worker` 脚本

### Q: 前端无法连接到 Worker？

**A:** 检查：
1. Pages 的环境变量 `VITE_WS_URL` 是否正确设置
2. Worker 是否成功部署并启用了 Durable Objects
3. 浏览器控制台是否有连接错误

## 注意事项

1. **Durable Objects 限制**: 免费计划有 Durable Objects 使用限制
2. **冷启动**: 首次连接可能有冷启动延迟
3. **WebSocket 超时**: Cloudflare Workers WebSocket 连接有超时限制
4. **数据清理**: 建议定期清理过期的房间数据
5. **Worker 和 Pages 区别**: Worker 是后端服务，Pages 是前端托管，必须分开配置

## 回退到传统服务器

如果需要回退到传统 Node.js 服务器：

```bash
npm run dev  # 开发模式
npm run build && npm run start  # 生产模式
```

前端会自动检测是否设置了 `VITE_WS_URL`，如果没有设置则使用相对路径连接到本地服务器。
