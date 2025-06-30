# Vercel 部署问题修复说明

## 问题描述
在 Vercel 部署时遇到错误：**"无法将'functions'属性与'builds'属性一起使用，请删除其中一个"**

## 问题原因
Vercel 的新版本不再支持同时使用 `builds` 和 `functions` 配置。旧的 `builds` 配置已被弃用，应该使用新的 `functions` 配置方式。

## 修复方案

### 1. 更新 vercel.json 配置
已将配置文件从旧格式更新为新格式：

**修复前（有问题的配置）：**
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "functions": {
    "server.js": {
      "maxDuration": 30
    }
  }
}
```

**修复后（正确的配置）：**
```json
{
  "version": 2,
  "name": "private-chat-room",
  "rewrites": [
    {
      "source": "/socket.io/(.*)",
      "destination": "/api/server"
    },
    {
      "source": "/api/(.*)",
      "destination": "/api/server"
    }
  ],
  "functions": {
    "api/server.js": {
      "maxDuration": 30
    }
  },
  "env": {
    "NODE_ENV": "production"
  }
}
```

### 2. 文件结构调整
- 创建了 `api/` 目录
- 将 `server.js` 复制到 `api/server.js`
- 静态文件保持在 `public/` 目录

### 3. 新的文件结构
```
项目根目录/
├── api/
│   └── server.js          # 服务器端代码
├── public/                # 静态文件
│   ├── index.html
│   ├── css/
│   ├── js/
│   └── ...
├── vercel.json           # Vercel 配置文件
└── package.json
```

## 部署步骤

### 方法一：通过 Vercel CLI
```bash
# 1. 安装 Vercel CLI（如果还没安装）
npm install -g vercel

# 2. 登录 Vercel
vercel login

# 3. 在项目根目录执行部署
vercel

# 4. 生产环境部署
vercel --prod
```

### 方法二：通过 Git 自动部署
1. 将修复后的代码推送到 Git 仓库
2. 在 Vercel 控制台连接您的仓库
3. Vercel 会自动检测配置并部署

## 验证部署
部署成功后，您可以访问以下端点验证：
- 主页：`https://your-app.vercel.app/`
- API 端点：`https://your-app.vercel.app/api/...`
- Socket.IO：`https://your-app.vercel.app/socket.io/...`

## 注意事项

### 1. 环境变量
确保在 Vercel 控制台设置必要的环境变量：

#### 基础环境变量：
- `NODE_ENV=production`

#### 管理员账户（推荐设置）：
- `ADMIN_USERNAME=your_admin_username`
- `ADMIN_PASSWORD_HASH=your_bcrypt_hashed_password`

#### JWT密钥（可选，有默认值）：
- `JWT_SECRET=your_jwt_secret_key`
- `ADMIN_JWT_SECRET=your_admin_jwt_secret_key`

如果不设置管理员环境变量，将使用默认账户：`admin/password`

### 2. 函数限制
- Vercel 免费版本函数执行时间限制为 10 秒
- 付费版本可以设置更长的 `maxDuration`

### 3. WebSocket 支持
Vercel 对 WebSocket 的支持有限制，如果您的应用大量使用 Socket.IO，可能需要考虑其他部署平台如 Railway 或 Render。

## 常见问题

### Q: 部署后 Socket.IO 连接失败
A: Vercel 的 Serverless 函数对 WebSocket 支持有限。建议：
1. 使用 Socket.IO 的 polling 模式
2. 考虑使用 Railway 或 Render 等支持长连接的平台

### Q: API 路由返回 404
A: 检查：
1. `api/server.js` 文件是否存在
2. `vercel.json` 中的 rewrites 配置是否正确

### Q: 静态文件无法访问
A: 确保：
1. 静态文件在 `public/` 目录下
2. 文件路径正确

## 替代部署方案

如果 Vercel 不适合您的应用（特别是需要长连接的聊天应用），推荐以下平台：

1. **Railway** - 支持全栈应用，WebSocket 友好
2. **Render** - 功能全面，价格合理
3. **Heroku** - 老牌 PaaS，生态丰富

详细的多平台部署指南请参考 `DEPLOYMENT_GUIDE.md` 文件。