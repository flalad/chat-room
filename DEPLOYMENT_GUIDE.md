# 聊天室项目部署指南

本文档详细介绍如何将聊天室项目部署到各个主流平台。

## 目录
- [Vercel 部署](#vercel-部署)
- [Netlify 部署](#netlify-部署)
- [Cloudflare Pages 部署](#cloudflare-pages-部署)
- [Railway 部署](#railway-部署)
- [Render 部署](#render-部署)
- [Heroku 部署](#heroku-部署)

---

## Vercel 部署

### 前置要求
- GitHub/GitLab/Bitbucket 账户
- Vercel 账户
- Node.js 项目

### 手动部署步骤

#### 方法一：通过 Vercel CLI
1. **安装 Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **登录 Vercel**
   ```bash
   vercel login
   ```

3. **在项目根目录执行部署**
   ```bash
   vercel
   ```

4. **按照提示配置项目**
   - 选择项目名称
   - 选择团队（如果有）
   - 确认项目设置

5. **生产环境部署**
   ```bash
   vercel --prod
   ```

#### 方法二：通过 Vercel 网站
1. **访问 [Vercel 官网](https://vercel.com)**

2. **登录并创建新项目**
   - 点击 "New Project"
   - 选择 "Import Git Repository"

3. **连接代码仓库**
   - 选择 GitHub/GitLab/Bitbucket
   - 授权 Vercel 访问您的仓库
   - 选择要部署的仓库

4. **配置项目设置**
   - Project Name: `private-chat-room`
   - Framework Preset: `Other`
   - Root Directory: `./`
   - Build Command: `npm run build` (如果有)
   - Output Directory: `public`
   - Install Command: `npm install`

5. **环境变量设置**
   - 在 "Environment Variables" 部分添加必要的环境变量
   - 例如：`NODE_ENV=production`

6. **部署**
   - 点击 "Deploy" 按钮
   - 等待部署完成

### Vercel 配置文件说明
项目根目录的 `vercel.json` 文件配置：
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

### 常见问题解决
- **函数超时**：调整 `maxDuration` 值
- **静态文件404**：检查 `public` 目录结构
- **API路由问题**：确保 `api/server.js` 文件存在

---

## Netlify 部署

### 手动部署步骤

#### 方法一：拖拽部署
1. **准备构建文件**
   ```bash
   npm run build  # 如果有构建脚本
   ```

2. **访问 [Netlify 官网](https://netlify.com)**

3. **拖拽部署**
   - 将 `public` 文件夹直接拖拽到 Netlify 的部署区域
   - 等待上传完成

#### 方法二：Git 集成部署
1. **连接 Git 仓库**
   - 登录 Netlify
   - 点击 "New site from Git"
   - 选择 Git 提供商并授权

2. **配置构建设置**
   - Repository: 选择您的仓库
   - Branch: `main` 或 `master`
   - Build command: `npm run build`
   - Publish directory: `public`

3. **环境变量**
   - 在 Site settings > Environment variables 中添加

4. **部署**
   - 点击 "Deploy site"

### Netlify 配置文件
创建 `netlify.toml` 文件：
```toml
[build]
  publish = "public"
  command = "npm run build"

[build.environment]
  NODE_ENV = "production"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

## Cloudflare Pages 部署

### 手动部署步骤

1. **访问 [Cloudflare Pages](https://pages.cloudflare.com)**

2. **创建新项目**
   - 点击 "Create a project"
   - 选择 "Connect to Git"

3. **连接仓库**
   - 授权 Cloudflare 访问您的 Git 仓库
   - 选择要部署的仓库

4. **配置构建设置**
   - Project name: `private-chat-room`
   - Production branch: `main`
   - Build command: `npm run build`
   - Build output directory: `public`

5. **环境变量**
   - 在 Settings > Environment variables 中添加

6. **部署**
   - 点击 "Save and Deploy"

### Cloudflare Workers 配置
如果需要服务端功能，创建 `wrangler.toml`：
```toml
name = "private-chat-room"
main = "server.js"
compatibility_date = "2023-05-18"

[env.production]
name = "private-chat-room-prod"
```

---

## Railway 部署

### 手动部署步骤

1. **访问 [Railway](https://railway.app)**

2. **创建新项目**
   - 点击 "New Project"
   - 选择 "Deploy from GitHub repo"

3. **连接仓库**
   - 授权 Railway 访问 GitHub
   - 选择仓库

4. **配置服务**
   - Service name: `private-chat-room`
   - Start command: `node server.js`
   - Port: `3000` (或您的应用端口)

5. **环境变量**
   - 在 Variables 标签页添加环境变量

6. **部署**
   - Railway 会自动检测并部署

### Railway 配置
创建 `railway.json`：
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "node server.js",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

---

## Render 部署

### 手动部署步骤

1. **访问 [Render](https://render.com)**

2. **创建新服务**
   - 点击 "New +"
   - 选择 "Web Service"

3. **连接仓库**
   - 选择 "Build and deploy from a Git repository"
   - 连接 GitHub 并选择仓库

4. **配置服务**
   - Name: `private-chat-room`
   - Environment: `Node`
   - Build Command: `npm install`
   - Start Command: `node server.js`

5. **环境变量**
   - 在 Environment 部分添加变量

6. **部署**
   - 点击 "Create Web Service"

---

## Heroku 部署

### 手动部署步骤

#### 方法一：Heroku CLI
1. **安装 Heroku CLI**
   - 下载并安装 [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli)

2. **登录 Heroku**
   ```bash
   heroku login
   ```

3. **创建应用**
   ```bash
   heroku create private-chat-room
   ```

4. **设置环境变量**
   ```bash
   heroku config:set NODE_ENV=production
   ```

5. **部署**
   ```bash
   git add .
   git commit -m "Deploy to Heroku"
   git push heroku main
   ```

#### 方法二：Heroku 网站
1. **访问 [Heroku Dashboard](https://dashboard.heroku.com)**

2. **创建新应用**
   - 点击 "New" > "Create new app"
   - 输入应用名称和选择区域

3. **连接 GitHub**
   - 在 Deploy 标签页选择 GitHub
   - 搜索并连接仓库

4. **配置环境变量**
   - 在 Settings > Config Vars 中添加

5. **部署**
   - 选择分支并点击 "Deploy Branch"

### Heroku 配置文件
创建 `Procfile`：
```
web: node server.js
```

创建 `package.json` 中的 engines 字段：
```json
{
  "engines": {
    "node": "18.x",
    "npm": "9.x"
  }
}
```

---

## 通用部署注意事项

### 1. 环境变量
确保在各平台设置以下环境变量：
- `NODE_ENV=production`
- 数据库连接字符串
- API 密钥
- 其他敏感配置

### 2. 端口配置
大多数平台会提供 `PORT` 环境变量，确保您的应用监听正确端口：
```javascript
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### 3. 静态文件服务
确保正确配置静态文件服务：
```javascript
app.use(express.static('public'));
```

### 4. CORS 配置
如果前后端分离部署，配置 CORS：
```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
```

### 5. 数据库连接
使用环境变量配置数据库连接，避免硬编码：
```javascript
const dbUrl = process.env.DATABASE_URL || 'mongodb://localhost:27017/chatroom';
```

---

## 部署后验证

### 1. 功能测试
- [ ] 页面正常加载
- [ ] 用户注册/登录功能
- [ ] 聊天功能正常
- [ ] 文件上传功能
- [ ] 管理员功能

### 2. 性能测试
- [ ] 页面加载速度
- [ ] API 响应时间
- [ ] WebSocket 连接稳定性

### 3. 安全检查
- [ ] HTTPS 证书
- [ ] 环境变量安全
- [ ] API 接口安全

---

## 故障排除

### 常见错误及解决方案

1. **构建失败**
   - 检查 `package.json` 依赖
   - 确认 Node.js 版本兼容性
   - 查看构建日志

2. **应用无法启动**
   - 检查启动命令
   - 确认端口配置
   - 查看应用日志

3. **静态文件404**
   - 检查文件路径
   - 确认构建输出目录
   - 验证服务器配置

4. **API 请求失败**
   - 检查 CORS 配置
   - 确认 API 路由
   - 验证环境变量

5. **WebSocket 连接问题**
   - 检查 WebSocket 配置
   - 确认代理设置
   - 验证协议（ws/wss）

---

## 监控和维护

### 1. 日志监控
- 设置应用日志收集
- 配置错误报警
- 定期检查性能指标

### 2. 自动部署
- 配置 CI/CD 流水线
- 设置自动测试
- 实现滚动更新

### 3. 备份策略
- 定期备份数据库
- 保存配置文件
- 制定恢复计划

---

## 总结

选择合适的部署平台取决于您的具体需求：

- **Vercel**: 适合静态网站和 Serverless 应用
- **Netlify**: 优秀的静态网站托管，有丰富的插件
- **Cloudflare Pages**: 全球 CDN，性能优秀
- **Railway**: 简单易用，适合全栈应用
- **Render**: 功能全面，价格合理
- **Heroku**: 老牌 PaaS，生态丰富

建议根据项目规模、预算和技术要求选择最适合的平台。