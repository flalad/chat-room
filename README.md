# 私人聊天室 - 现代化实时聊天应用

一个基于 Node.js 和 Socket.IO 的现代化私人聊天室应用，采用 Telegram 风格的三栏布局设计，支持实时消息传递、文件分享、用户管理和主题定制。

## 🌟 主要特性

### 🎨 界面设计
- **Apple 风格窗口**：仿 macOS 窗口设计，带有标题栏和控制按钮
- **Telegram 风格布局**：三栏式布局（聊天列表、主聊天区、群组信息）
- **响应式设计**：支持桌面端和移动端适配
- **主题系统**：内置多种背景主题，包括渐变和图案组合

### 💬 聊天功能
- **实时消息**：基于 Socket.IO 的实时双向通信
- **文件分享**：支持图片、视频、音频、文档等多种文件类型
- **拖拽上传**：支持拖拽文件到聊天区域直接上传
- **消息搜索**：实时搜索聊天历史记录
- **在线状态**：显示在线用户数量和成员列表

### 👥 用户管理
- **用户注册/登录**：完整的用户认证系统
- **角色权限**：管理员和普通用户权限分离
- **管理员后台**：用户管理、系统配置等功能
- **个人信息**：用户资料查看和编辑

### 🎭 主题定制
- **多种背景**：
  - 默认简洁背景
  - 涂鸦梦境（四角渐变 + 涂鸦图案）
  - 多种彩色渐变主题
- **实时切换**：无需刷新页面即可切换主题
- **本地存储**：主题选择自动保存

### 🔧 技术特性
- **现代化架构**：ES6+ JavaScript，模块化设计
- **实时通信**：Socket.IO 实现低延迟消息传递
- **文件存储**：支持本地存储和 AWS S3 云存储
- **安全认证**：JWT Token 认证，密码加密存储
- **错误处理**：完善的错误处理和用户反馈机制

## 🚀 快速开始

### 环境要求
- Node.js 14.0 或更高版本
- npm 或 yarn 包管理器

### 安装步骤

1. **克隆项目**
```bash
git clone <repository-url>
cd chat-room
```

2. **安装依赖**
```bash
npm install
```

3. **配置环境变量**
```bash
cp .env.example .env
```

编辑 `.env` 文件，配置以下参数：
```env
PORT=3000
JWT_SECRET=your-jwt-secret-key
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-admin-password

# AWS S3 配置（可选）
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=your-region
S3_BUCKET_NAME=your-bucket-name
```

4. **启动应用**
```bash
npm start
```

5. **访问应用**
打开浏览器访问 `http://localhost:3000`

## 📁 项目结构

```
chat-room/
├── public/                 # 前端静态文件
│   ├── css/               # 样式文件
│   │   ├── apple-window.css    # 窗口和用户界面样式
│   │   ├── telegram.css        # Telegram 风格布局
│   │   ├── theme-settings.css  # 主题设置样式
│   │   ├── components.css      # 组件样式
│   │   ├── auth.css           # 认证页面样式
│   │   ├── main.css           # 主要样式
│   │   ├── reset.css          # CSS 重置
│   │   └── responsive.css     # 响应式样式
│   ├── js/                # JavaScript 文件
│   │   ├── app.js             # 应用主入口
│   │   ├── auth.js            # 认证管理
│   │   ├── chat.js            # 聊天功能
│   │   ├── theme-manager.js   # 主题管理
│   │   ├── file-upload.js     # 文件上传
│   │   ├── user-interface.js  # 用户界面
│   │   ├── room-manager.js    # 房间管理
│   │   ├── s3-config.js       # S3 配置
│   │   ├── auth-page.js       # 认证页面
│   │   ├── ui.js              # UI 工具
│   │   ├── config.js          # 配置管理
│   │   └── utils.js           # 工具函数
│   ├── images/            # 图片资源
│   │   └── backgrounds/       # 背景图片
│   ├── index.html         # 主页面
│   ├── login.html         # 登录页面
│   ├── register.html      # 注册页面
│   └── admin.html         # 管理员页面
├── server.js              # 服务器主文件
├── package.json           # 项目配置
├── .env.example          # 环境变量示例
└── README.md             # 项目文档
```

## 🎨 主题系统

### 内置主题
1. **默认主题**：简洁的白色背景
2. **涂鸦梦境**：四角渐变背景配合涂鸦图案
3. **彩色渐变**：多种渐变色彩主题

### 自定义主题
可以通过修改 `public/css/theme-settings.css` 添加新的主题：

```css
.theme-custom {
    background: your-custom-background;
}
```

## 🔐 用户权限

### 管理员权限
- 访问管理员后台
- 用户管理（查看、删除用户）
- 系统配置
- 聊天室管理

### 普通用户权限
- 发送消息和文件
- 查看个人信息
- 切换主题
- 搜索消息

## 📱 API 接口

### 认证接口
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/logout` - 用户登出
- `GET /api/auth/verify` - 验证 Token

### 管理员接口
- `POST /api/admin/login` - 管理员登录
- `GET /api/admin/verify` - 验证管理员 Token
- `GET /api/admin/users` - 获取用户列表
- `DELETE /api/admin/users/:id` - 删除用户

### 文件接口
- `POST /api/upload` - 文件上传
- `GET /uploads/:filename` - 文件下载

## 🌐 部署指南

### 本地部署

1. **开发环境**
```bash
npm run dev  # 如果配置了开发脚本
# 或
node server.js
```

2. **生产环境**
```bash
NODE_ENV=production node server.js
```

### Docker 部署

1. **创建 Dockerfile**
```dockerfile
FROM node:16-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
```

2. **构建和运行**
```bash
docker build -t chat-room .
docker run -p 3000:3000 --env-file .env chat-room
```

### 云平台部署

#### Heroku 部署

1. **安装 Heroku CLI**
```bash
npm install -g heroku
```

2. **登录并创建应用**
```bash
heroku login
heroku create your-app-name
```

3. **配置环境变量**
```bash
heroku config:set JWT_SECRET=your-jwt-secret
heroku config:set ADMIN_USERNAME=admin
heroku config:set ADMIN_PASSWORD=your-password
```

4. **部署**
```bash
git add .
git commit -m "Deploy to Heroku"
git push heroku main
```

#### Vercel 部署

1. **安装 Vercel CLI**
```bash
npm install -g vercel
```

2. **配置 vercel.json**
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/server.js"
    }
  ]
}
```

3. **部署**
```bash
vercel --prod
```

#### AWS EC2 部署

1. **连接到 EC2 实例**
```bash
ssh -i your-key.pem ubuntu@your-ec2-ip
```

2. **安装 Node.js**
```bash
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs
```

3. **克隆和配置项目**
```bash
git clone <your-repo-url>
cd chat-room
npm install
```

4. **使用 PM2 管理进程**
```bash
sudo npm install -g pm2
pm2 start server.js --name "chat-room"
pm2 startup
pm2 save
```

5. **配置 Nginx（可选）**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### 阿里云/腾讯云部署

1. **购买云服务器**
   - 选择合适的配置（推荐 2核4G 以上）
   - 安装 Ubuntu 20.04 或 CentOS 8

2. **安装环境**
```bash
# Ubuntu
sudo apt update
sudo apt install nodejs npm nginx -y

# CentOS
sudo yum update
sudo yum install nodejs npm nginx -y
```

3. **配置防火墙**
```bash
# Ubuntu
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable

# CentOS
sudo firewall-cmd --permanent --add-port=22/tcp
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=443/tcp
sudo firewall-cmd --reload
```

4. **配置域名和 SSL**
```bash
# 使用 Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## 🔧 配置说明

### 环境变量
- `PORT`: 服务器端口（默认 3000）
- `JWT_SECRET`: JWT 密钥（必须设置）
- `ADMIN_USERNAME`: 管理员用户名
- `ADMIN_PASSWORD`: 管理员密码
- `AWS_*`: AWS S3 配置（可选）

### 文件上传配置
- 支持的文件类型：图片、视频、音频、文档
- 最大文件大小：50MB（可在 server.js 中修改）
- 存储方式：本地存储或 AWS S3

## 🐛 故障排除

### 常见问题

1. **端口被占用**
```bash
# 查找占用端口的进程
lsof -i :3000
# 杀死进程
kill -9 <PID>
```

2. **文件上传失败**
   - 检查 uploads 目录权限
   - 确认文件大小限制
   - 验证 S3 配置（如果使用）

3. **Socket.IO 连接失败**
   - 检查防火墙设置
   - 确认 WebSocket 支持
   - 验证代理配置

4. **主题不生效**
   - 清除浏览器缓存
   - 检查 CSS 文件路径
   - 验证主题文件完整性

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📞 支持

如有问题，请通过以下方式联系：
- 提交 GitHub Issue
- 发送邮件至：[your-email@example.com]

---

**享受聊天的乐趣！** 🎉