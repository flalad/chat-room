# 部署指南

本文档提供完整的部署指南，支持多种平台和存储方案。

## 🚀 快速部署

### 推荐平台

| 平台 | 聊天功能 | 数据库 | 难度 | 推荐度 |
|------|----------|--------|------|--------|
| **Railway** | ✅ 完整 | 内置PostgreSQL | ⭐ | 🟢 强烈推荐 |
| **Render** | ✅ 完整 | 外部PostgreSQL | ⭐⭐ | 🟢 推荐 |
| **Vercel** | ⚠️ HTTP轮询 | 外部PostgreSQL | ⭐⭐⭐ | 🟡 可用 |
| **Heroku** | ✅ 完整 | 插件PostgreSQL | ⭐⭐ | 🟢 推荐 |

## 📋 环境变量配置

### 基础配置（所有平台）
```bash
# 应用配置
NODE_ENV=production
PORT=3000

# 管理员账户
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_password
# 或使用哈希密码
# ADMIN_PASSWORD_HASH=your_bcrypt_hash

# JWT密钥（可选，有默认值）
JWT_SECRET=your_jwt_secret
ADMIN_JWT_SECRET=your_admin_jwt_secret
```

### 数据库配置（推荐）
```bash
# PostgreSQL
DATABASE_URL=postgresql://user:password@host:port/database

# MySQL
DATABASE_URL=mysql://user:password@host:port/database
```

## 🎯 平台特定部署

### Railway（推荐）

#### 优势
- ✅ 零配置部署
- ✅ 自动提供PostgreSQL
- ✅ 完整WebSocket支持
- ✅ 免费$5/月额度

#### 部署步骤
1. 访问 [Railway.app](https://railway.app)
2. 连接GitHub仓库
3. 自动检测Node.js项目
4. 添加PostgreSQL服务（可选）
5. 设置环境变量
6. 自动部署

#### 环境变量
```bash
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_password
# DATABASE_URL 自动提供（如果添加了PostgreSQL）
```

### Render

#### 优势
- ✅ 完整WebSocket支持
- ✅ 免费750小时/月
- ✅ 自动SSL证书
- ✅ 简单配置

#### 部署步骤
1. 访问 [Render.com](https://render.com)
2. 创建Web Service
3. 连接GitHub仓库
4. 配置构建设置：
   - Build Command: `npm install`
   - Start Command: `node server.js`
5. 添加PostgreSQL数据库
6. 设置环境变量

### Vercel（特殊方案）

#### 限制说明
- ❌ 不支持WebSocket
- ✅ 使用HTTP轮询替代
- ⚠️ 消息有3秒延迟

#### 部署步骤
1. 获取外部数据库（推荐Supabase）
2. 设置环境变量：
   ```bash
   DATABASE_URL=postgresql://your_connection
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=your_password
   ```
3. 推送代码到GitHub
4. Vercel自动部署

#### 免费数据库选项
- **Supabase**: 500MB免费 - [supabase.com](https://supabase.com)
- **Neon**: 3GB免费 - [neon.tech](https://neon.tech)
- **Railway**: $5/月 - [railway.app](https://railway.app)

### Heroku

#### 部署步骤
1. 安装Heroku CLI
2. 创建应用：`heroku create app-name`
3. 添加PostgreSQL：`heroku addons:create heroku-postgresql:mini`
4. 设置环境变量：`heroku config:set ADMIN_USERNAME=admin`
5. 部署：`git push heroku main`

### Cloudflare Pages + Workers

#### 适用场景
- 需要全球CDN加速
- 要求极低成本
- 技术要求较高

#### 部署步骤
1. 前端部署到Cloudflare Pages
2. 后端使用Cloudflare Workers
3. 数据存储使用Cloudflare D1 + KV
4. 配置Durable Objects处理WebSocket

详细配置请参考 [Cloudflare解决方案](CLOUDFLARE.md)

## 🗄️ 数据库方案

### 自动选择机制
项目会根据环境变量自动选择存储方式：

1. **外部数据库**（推荐）
   - 设置 `DATABASE_URL` 环境变量
   - 支持PostgreSQL和MySQL
   - 数据持久化，重启不丢失

2. **Cloudflare KV**
   - 设置 `KV_NAMESPACE` 环境变量
   - 适用于Cloudflare Workers
   - 全球分布式存储

3. **内存存储**（开发环境）
   - 无需配置
   - 重启后数据丢失
   - 仅适合开发测试

### 数据库表结构
```sql
-- 用户表
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 消息表
CREATE TABLE messages (
    id VARCHAR(36) PRIMARY KEY,
    type VARCHAR(20) DEFAULT 'text',
    username VARCHAR(50),
    content TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 管理员配置表
CREATE TABLE admin_config (
    key VARCHAR(50) PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🔧 功能对比

### WebSocket vs HTTP轮询

| 功能 | WebSocket模式 | HTTP模式（Vercel） |
|------|---------------|-------------------|
| 发送消息 | ✅ 实时 | ✅ 立即 |
| 接收消息 | ✅ 实时 | ⚠️ 3秒延迟 |
| 在线用户 | ✅ 实时更新 | ❌ 静态显示 |
| 数据持久化 | ❌ 内存 | ✅ 数据库 |
| 服务器要求 | 长连接 | 无状态函数 |

### 平台功能支持

| 平台 | WebSocket | 数据库 | 文件上传 | 管理员功能 |
|------|-----------|--------|----------|------------|
| Railway | ✅ | ✅ | ✅ | ✅ |
| Render | ✅ | ✅ | ✅ | ✅ |
| Heroku | ✅ | ✅ | ✅ | ✅ |
| Vercel | ❌ | ✅ | ✅ | ✅ |
| Cloudflare | ✅* | ✅ | ✅ | ✅ |

*需要使用Durable Objects

## 🚨 故障排除

### 常见问题

#### 1. 管理员登录失败
**症状**: 显示"管理员用户名或密码错误"
**解决方案**:
- 检查环境变量设置
- 确认密码格式（明文 vs 哈希）
- 查看服务器日志

#### 2. 聊天功能不可用
**症状**: 连接状态显示"连接中"
**解决方案**:
- **Vercel**: 正常现象，会自动切换到HTTP模式
- **其他平台**: 检查WebSocket支持和防火墙设置

#### 3. 数据库连接失败
**症状**: 用户注册/登录失败
**解决方案**:
- 检查DATABASE_URL格式
- 确认数据库服务状态
- 验证网络连接

#### 4. 文件上传失败
**症状**: 文件上传时出错
**解决方案**:
- 检查文件大小限制
- 确认S3配置（如果使用）
- 验证文件类型支持

### 调试方法

#### 1. 查看日志
```bash
# Railway/Render/Heroku
# 在平台控制台查看实时日志

# 本地调试
npm run dev
```

#### 2. 测试API
```bash
# 测试管理员登录
curl -X POST https://your-app.com/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"your_password"}'

# 测试消息API（Vercel）
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://your-app.com/api/messages/history
```

#### 3. 检查环境变量
```bash
# 在平台控制台确认环境变量设置
# 确保没有多余的空格或特殊字符
```

## 📊 成本对比

| 平台 | 免费额度 | 付费起价 | 数据库成本 | 总成本/月 |
|------|----------|----------|------------|-----------|
| **Railway** | $5 | $5 | 包含 | $0-5 |
| **Render** | 750小时 | $7 | 外部 | $0-15 |
| **Vercel** | 100GB | $20 | 外部 | $0-25 |
| **Heroku** | 550小时 | $7 | $9 | $0-16 |
| **Cloudflare** | 大额度 | $5 | 包含 | $0-5 |

## 🎯 选择建议

### 个人项目/学习
- **推荐**: Railway（简单、免费额度足够）
- **备选**: Render（功能完整）

### 小型团队
- **推荐**: Render（稳定可靠）
- **备选**: Heroku（生态丰富）

### 高流量应用
- **推荐**: Cloudflare（全球CDN）
- **备选**: 自建服务器

### 预算有限
- **推荐**: Railway + Supabase（完全免费）
- **备选**: Vercel + Neon（基本免费）

## 📚 相关文档

- [Cloudflare解决方案](CLOUDFLARE.md) - Cloudflare Pages + Workers完整方案
- [API文档](../API.md) - 完整的API接口说明
- [安全指南](../SECURITY.md) - 安全配置和最佳实践

---

选择最适合您需求的平台，开始部署您的聊天室吧！ 🚀