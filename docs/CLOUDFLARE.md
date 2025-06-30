# Cloudflare Pages + Workers 解决方案

本文档提供在Cloudflare平台上部署聊天室的完整解决方案，使用Pages托管前端，Workers处理后端逻辑。

## 🌟 优势

- **全球CDN**: 极快的访问速度
- **无服务器**: 自动扩缩容，按需付费
- **成本低**: 大部分功能免费使用
- **高可用**: 99.9%+ 可用性保证
- **现代架构**: 边缘计算，就近处理

## 🏗️ 架构设计

```
用户请求
    ↓
Cloudflare Pages (前端)
    ↓
Cloudflare Workers (API)
    ↓
Durable Objects (WebSocket + 状态)
    ↓
Cloudflare D1 (数据库) + KV (缓存)
```

## 📋 前置要求

- Cloudflare账户
- Wrangler CLI工具
- GitHub仓库
- 基本的JavaScript/TypeScript知识

## 🚀 部署步骤

### 1. 安装工具

```bash
# 安装Wrangler CLI
npm install -g wrangler

# 登录Cloudflare
wrangler login
```

### 2. 创建D1数据库

```bash
# 创建数据库
wrangler d1 create chat-room-db

# 初始化表结构
wrangler d1 execute chat-room-db --file=schema.sql
```

### 3. 创建KV命名空间

```bash
# 创建KV存储
wrangler kv:namespace create "CHAT_CACHE"
```

### 4. 配置wrangler.toml

```toml
name = "chat-room-api"
main = "src/worker.js"
compatibility_date = "2023-10-30"

[env.production]
name = "chat-room-api-prod"

# Durable Objects配置
[[env.production.durable_objects.bindings]]
name = "CHAT_ROOM"
class_name = "ChatRoom"
script_name = "chat-room-api-prod"

# D1数据库配置
[[env.production.d1_databases]]
binding = "DB"
database_name = "chat-room-db"
database_id = "your-database-id"

# KV存储配置
[[env.production.kv_namespaces]]
binding = "CACHE"
id = "your-kv-namespace-id"

# 环境变量
[env.production.vars]
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "your_password"
JWT_SECRET = "your_jwt_secret"
```

### 5. 实现Worker代码

#### 主Worker文件
```javascript
// src/worker.js
import { ChatRoom } from './chat-room';

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        
        // WebSocket升级
        if (url.pathname === '/ws') {
            return handleWebSocket(request, env);
        }
        
        // API路由
        if (url.pathname.startsWith('/api/')) {
            return handleAPI(request, env);
        }
        
        return new Response('Not found', { status: 404 });
    }
};

async function handleWebSocket(request, env) {
    const upgradeHeader = request.headers.get('Upgrade');
    if (upgradeHeader !== 'websocket') {
        return new Response('Expected websocket', { status: 400 });
    }
    
    // 获取Durable Object实例
    const id = env.CHAT_ROOM.idFromName('main-room');
    const chatRoom = env.CHAT_ROOM.get(id);
    
    return chatRoom.fetch(request);
}

async function handleAPI(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // 认证API
    if (path === '/api/auth/login') {
        return handleLogin(request, env);
    }
    
    if (path === '/api/admin/login') {
        return handleAdminLogin(request, env);
    }
    
    // 消息API
    if (path === '/api/messages/history') {
        return handleMessageHistory(request, env);
    }
    
    return new Response('API not found', { status: 404 });
}

export { ChatRoom };
```

#### Durable Objects聊天室
```javascript
// src/chat-room.js
export class ChatRoom {
    constructor(state, env) {
        this.state = state;
        this.env = env;
        this.sessions = new Map();
        this.users = new Map();
    }
    
    async fetch(request) {
        const webSocketPair = new WebSocketPair();
        const [client, server] = Object.values(webSocketPair);
        
        this.handleSession(server);
        
        return new Response(null, {
            status: 101,
            webSocket: client,
        });
    }
    
    async handleSession(webSocket) {
        webSocket.accept();
        
        const sessionId = crypto.randomUUID();
        this.sessions.set(sessionId, {
            webSocket,
            user: null
        });
        
        webSocket.addEventListener('message', async (event) => {
            try {
                const data = JSON.parse(event.data);
                await this.handleMessage(sessionId, data);
            } catch (error) {
                console.error('Message handling error:', error);
            }
        });
        
        webSocket.addEventListener('close', () => {
            this.handleDisconnect(sessionId);
        });
    }
    
    async handleMessage(sessionId, data) {
        const session = this.sessions.get(sessionId);
        if (!session) return;
        
        switch (data.type) {
            case 'user_join':
                await this.handleUserJoin(sessionId, data.user);
                break;
                
            case 'send_message':
                await this.handleSendMessage(sessionId, data);
                break;
        }
    }
    
    async handleUserJoin(sessionId, user) {
        const session = this.sessions.get(sessionId);
        session.user = user;
        this.users.set(user.username, sessionId);
        
        // 发送历史消息
        const messages = await this.getMessageHistory();
        session.webSocket.send(JSON.stringify({
            type: 'message_history',
            messages
        }));
        
        // 广播用户列表更新
        this.broadcastUserUpdate();
    }
    
    async handleSendMessage(sessionId, data) {
        const session = this.sessions.get(sessionId);
        if (!session.user) return;
        
        const message = {
            id: crypto.randomUUID(),
            type: 'text',
            username: session.user.username,
            content: data.content,
            timestamp: new Date().toISOString()
        };
        
        await this.saveMessage(message);
        
        this.broadcast({
            type: 'new_message',
            message
        });
    }
    
    async saveMessage(message) {
        // 保存到D1数据库
        await this.env.DB.prepare(`
            INSERT INTO messages (id, type, username, content, timestamp)
            VALUES (?, ?, ?, ?, ?)
        `).bind(
            message.id,
            message.type,
            message.username,
            message.content,
            message.timestamp
        ).run();
    }
    
    async getMessageHistory() {
        const result = await this.env.DB.prepare(`
            SELECT * FROM messages 
            ORDER BY timestamp DESC 
            LIMIT 100
        `).all();
        
        return result.results.reverse();
    }
    
    broadcast(data, excludeSessionId = null) {
        this.sessions.forEach((session, sessionId) => {
            if (sessionId !== excludeSessionId && 
                session.webSocket.readyState === WebSocket.READY_STATE_OPEN) {
                session.webSocket.send(JSON.stringify(data));
            }
        });
    }
    
    broadcastUserUpdate() {
        const users = Array.from(this.sessions.values())
            .filter(session => session.user)
            .map(session => session.user);
            
        this.broadcast({
            type: 'users_update',
            users
        });
    }
    
    handleDisconnect(sessionId) {
        const session = this.sessions.get(sessionId);
        if (session && session.user) {
            this.users.delete(session.user.username);
        }
        
        this.sessions.delete(sessionId);
        this.broadcastUserUpdate();
    }
}
```

### 6. 数据库初始化

```sql
-- schema.sql
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL DEFAULT 'text',
    username TEXT,
    content TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admin_config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 插入默认管理员
INSERT OR IGNORE INTO admin_config (key, value) VALUES 
('admin_username', 'admin'),
('admin_password_hash', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi');
```

### 7. 部署Workers

```bash
# 部署到生产环境
wrangler deploy

# 查看部署状态
wrangler tail
```

### 8. 配置Pages

1. 在Cloudflare控制台创建Pages项目
2. 连接GitHub仓库
3. 设置构建配置：
   - 构建命令: `npm run build`
   - 输出目录: `public`
4. 配置自定义域名（可选）

## 🔧 前端适配

### 修改WebSocket连接
```javascript
// 替换原有的Socket.IO连接
// const socket = io();

// 使用原生WebSocket连接到Worker
const ws = new WebSocket('wss://your-worker.your-subdomain.workers.dev/ws');

ws.onopen = () => {
    console.log('Connected to Cloudflare Worker');
};

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    handleMessage(data);
};

ws.onclose = () => {
    console.log('Disconnected from Worker');
};
```

### API调用适配
```javascript
// 调用Worker API
async function sendMessage(content) {
    const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content })
    });
    
    return response.json();
}
```

## 💰 成本估算

### 免费额度
- **Pages**: 无限制
- **Workers**: 100,000请求/天
- **D1**: 5GB存储 + 25M行读取/天
- **KV**: 10GB存储 + 100,000读取/天
- **Durable Objects**: 1GB-小时/月

### 付费价格
- **Workers**: $5/月（10M请求）
- **D1**: $5/月（25GB存储）
- **KV**: $0.50/月（额外存储）
- **Durable Objects**: $12.50/月（额外使用）

### 预估成本
- **小型应用**: 完全免费
- **中型应用**: $5-15/月
- **大型应用**: $20-50/月

## 🚨 注意事项

### 技术限制
1. **学习曲线**: 需要熟悉Cloudflare生态
2. **调试复杂**: 本地开发环境配置
3. **功能限制**: 某些Node.js功能不支持
4. **冷启动**: 首次请求可能有延迟

### 最佳实践
1. **错误处理**: 完善的错误捕获和重试机制
2. **性能优化**: 合理使用缓存和批量操作
3. **监控告警**: 设置性能和错误监控
4. **安全配置**: 正确配置CORS和认证

## 🔍 调试和监控

### 本地开发
```bash
# 启动本地开发环境
wrangler dev

# 查看实时日志
wrangler tail
```

### 生产监控
1. Cloudflare Analytics
2. Workers Analytics
3. D1 Analytics
4. 自定义日志记录

## 📚 相关资源

- [Cloudflare Workers文档](https://developers.cloudflare.com/workers/)
- [Durable Objects指南](https://developers.cloudflare.com/workers/learning/using-durable-objects/)
- [D1数据库文档](https://developers.cloudflare.com/d1/)
- [KV存储文档](https://developers.cloudflare.com/workers/runtime-apis/kv/)

---

这个方案适合需要全球分布、高性能、低成本的聊天室应用。虽然实现复杂度较高，但可以获得最佳的用户体验和成本效益。