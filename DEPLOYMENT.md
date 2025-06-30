# 部署指南 - 私人聊天室应用

本文档提供了在各种平台上部署私人聊天室应用的详细步骤和最佳实践。

## 📋 部署前准备

### 系统要求
- **Node.js**: 14.0 或更高版本
- **内存**: 最低 512MB，推荐 2GB 以上
- **存储**: 最低 1GB 可用空间
- **网络**: 支持 WebSocket 连接

### 必要文件检查
确保以下文件存在且配置正确：
- `package.json` - 项目依赖配置
- `server.js` - 服务器主文件
- `.env` - 环境变量配置
- `public/` - 前端静态文件目录

## 🖥️ 本地开发部署

### 开发环境设置

1. **克隆项目**
```bash
git clone <repository-url>
cd chat-room
```

2. **安装依赖**
```bash
npm install
```

3. **创建环境配置**
```bash
cp .env.example .env
```

编辑 `.env` 文件：
```env
# 基础配置
PORT=3000
NODE_ENV=development

# 安全配置
JWT_SECRET=your-super-secret-jwt-key-here

# 管理员账户
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-admin-password

# 文件上传配置
MAX_FILE_SIZE=52428800  # 50MB
UPLOAD_PATH=./uploads

# AWS S3 配置（可选）
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
S3_BUCKET_NAME=your-bucket-name
```

4. **启动开发服务器**
```bash
# 开发模式（带热重载）
npm run dev

# 或直接启动
node server.js
```

5. **验证部署**
- 访问 `http://localhost:3000`
- 检查控制台是否有错误
- 测试用户注册和登录功能

## 🐳 Docker 部署

### 单容器部署

1. **创建 Dockerfile**
```dockerfile
FROM node:16-alpine

# 设置工作目录
WORKDIR /app

# 复制 package 文件
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production && npm cache clean --force

# 复制应用代码
COPY . .

# 创建上传目录
RUN mkdir -p uploads && chown -R node:node uploads

# 切换到非 root 用户
USER node

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# 启动应用
CMD ["node", "server.js"]
```

2. **创建 .dockerignore**
```
node_modules
npm-debug.log
.git
.gitignore
README.md
.env
.nyc_output
coverage
.nyc_output
.coverage
.coverage/
uploads/*
!uploads/.gitkeep
```

3. **构建镜像**
```bash
docker build -t chat-room:latest .
```

4. **运行容器**
```bash
docker run -d \
  --name chat-room \
  -p 3000:3000 \
  --env-file .env \
  -v $(pwd)/uploads:/app/uploads \
  --restart unless-stopped \
  chat-room:latest
```

### Docker Compose 部署

1. **创建 docker-compose.yml**
```yaml
version: '3.8'

services:
  chat-room:
    build: .
    container_name: chat-room
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    env_file:
      - .env
    volumes:
      - ./uploads:/app/uploads
      - ./logs:/app/logs
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  nginx:
    image: nginx:alpine
    container_name: chat-room-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - chat-room
    restart: unless-stopped

volumes:
  uploads:
  logs:
```

2. **创建 nginx.conf**
```nginx
events {
    worker_connections 1024;
}

http {
    upstream chat-room {
        server chat-room:3000;
    }

    server {
        listen 80;
        server_name your-domain.com;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name your-domain.com;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;

        location / {
            proxy_pass http://chat-room;
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
}
```

3. **启动服务**
```bash
docker-compose up -d
```

## ☁️ 云平台部署

### Heroku 部署

1. **准备 Heroku 配置**

创建 `Procfile`：
```
web: node server.js
```

创建 `app.json`：
```json
{
  "name": "私人聊天室",
  "description": "现代化实时聊天应用",
  "repository": "https://github.com/your-username/chat-room",
  "logo": "https://your-domain.com/logo.png",
  "keywords": ["node", "express", "socket.io", "chat"],
  "env": {
    "JWT_SECRET": {
      "description": "JWT 密钥",
      "generator": "secret"
    },
    "ADMIN_USERNAME": {
      "description": "管理员用户名",
      "value": "admin"
    },
    "ADMIN_PASSWORD": {
      "description": "管理员密码"
    }
  },
  "formation": {
    "web": {
      "quantity": 1,
      "size": "hobby"
    }
  },
  "addons": [],
  "buildpacks": [
    {
      "url": "heroku/nodejs"
    }
  ]
}
```

2. **部署步骤**
```bash
# 安装 Heroku CLI
npm install -g heroku

# 登录 Heroku
heroku login

# 创建应用
heroku create your-app-name

# 设置环境变量
heroku config:set JWT_SECRET=$(openssl rand -base64 32)
heroku config:set ADMIN_USERNAME=admin
heroku config:set ADMIN_PASSWORD=your-secure-password
heroku config:set NODE_ENV=production

# 部署
git add .
git commit -m "Deploy to Heroku"
git push heroku main

# 查看日志
heroku logs --tail
```

### Vercel 部署

1. **创建 vercel.json**
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    },
    {
      "src": "public/**",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/public/(.*)",
      "dest": "/public/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/server.js"
    }
  ],
  "env": {
    "JWT_SECRET": "@jwt-secret",
    "ADMIN_USERNAME": "@admin-username",
    "ADMIN_PASSWORD": "@admin-password"
  }
}
```

2. **部署命令**
```bash
# 安装 Vercel CLI
npm install -g vercel

# 登录
vercel login

# 设置环境变量
vercel env add JWT_SECRET
vercel env add ADMIN_USERNAME
vercel env add ADMIN_PASSWORD

# 部署
vercel --prod
```

### Railway 部署

1. **连接 GitHub 仓库**
   - 访问 [Railway](https://railway.app)
   - 连接 GitHub 账户
   - 选择项目仓库

2. **配置环境变量**
```bash
# 在 Railway 控制台设置
JWT_SECRET=your-jwt-secret
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-password
NODE_ENV=production
```

3. **自动部署**
   - Railway 会自动检测 Node.js 项目
   - 推送代码到 main 分支即可触发部署

### Render 部署

1. **创建 render.yaml**
```yaml
services:
  - type: web
    name: chat-room
    env: node
    plan: starter
    buildCommand: npm install
    startCommand: node server.js
    envVars:
      - key: JWT_SECRET
        generateValue: true
      - key: ADMIN_USERNAME
        value: admin
      - key: ADMIN_PASSWORD
        sync: false
      - key: NODE_ENV
        value: production
```

2. **部署步骤**
   - 连接 GitHub 仓库
   - 配置环境变量
   - 自动部署

## 🖥️ VPS/云服务器部署

### Ubuntu/Debian 系统

1. **系统更新**
```bash
sudo apt update && sudo apt upgrade -y
```

2. **安装 Node.js**
```bash
# 使用 NodeSource 仓库
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证安装
node --version
npm --version
```

3. **安装 PM2**
```bash
sudo npm install -g pm2
```

4. **创建应用用户**
```bash
sudo adduser chatroom
sudo usermod -aG sudo chatroom
su - chatroom
```

5. **部署应用**
```bash
# 克隆代码
git clone <your-repo-url> chat-room
cd chat-room

# 安装依赖
npm install --production

# 配置环境变量
cp .env.example .env
nano .env

# 创建上传目录
mkdir -p uploads
chmod 755 uploads
```

6. **配置 PM2**
```bash
# 创建 PM2 配置文件
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'chat-room',
    script: 'server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
}
EOF

# 创建日志目录
mkdir -p logs

# 启动应用
pm2 start ecosystem.config.js --env production

# 设置开机自启
pm2 startup
pm2 save
```

### CentOS/RHEL 系统

1. **安装 Node.js**
```bash
# 使用 NodeSource 仓库
curl -fsSL https://rpm.nodesource.com/setup_16.x | sudo bash -
sudo yum install -y nodejs

# 或使用 dnf (CentOS 8+)
sudo dnf install -y nodejs npm
```

2. **配置防火墙**
```bash
# CentOS 7
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --reload

# CentOS 8+
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

其余步骤与 Ubuntu 类似。

## 🌐 Nginx 反向代理配置

### 基础配置

1. **安装 Nginx**
```bash
# Ubuntu/Debian
sudo apt install nginx

# CentOS/RHEL
sudo yum install nginx
```

2. **创建站点配置**
```bash
sudo nano /etc/nginx/sites-available/chat-room
```

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # 重定向到 HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL 配置
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # 反向代理配置
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 静态文件缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        proxy_pass http://127.0.0.1:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # 文件上传大小限制
    client_max_body_size 50M;
}
```

3. **启用站点**
```bash
sudo ln -s /etc/nginx/sites-available/chat-room /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### SSL 证书配置

1. **使用 Let's Encrypt**
```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# 设置自动续期
sudo crontab -e
# 添加以下行
0 12 * * * /usr/bin/certbot renew --quiet
```

## 📊 监控和日志

### PM2 监控

```bash
# 查看应用状态
pm2 status

# 查看日志
pm2 logs chat-room

# 监控资源使用
pm2 monit

# 重启应用
pm2 restart chat-room

# 查看详细信息
pm2 show chat-room
```

### 系统监控

1. **安装监控工具**
```bash
# 安装 htop
sudo apt install htop

# 安装 iotop
sudo apt install iotop

# 安装 netstat
sudo apt install net-tools
```

2. **日志轮转配置**
```bash
sudo nano /etc/logrotate.d/chat-room
```

```
/home/chatroom/chat-room/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 chatroom chatroom
    postrotate
        pm2 reload chat-room
    endscript
}
```

## 🔧 性能优化

### Node.js 优化

1. **环境变量配置**
```env
NODE_ENV=production
NODE_OPTIONS="--max-old-space-size=2048"
UV_THREADPOOL_SIZE=128
```

2. **PM2 集群模式**
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'chat-room',
    script: 'server.js',
    instances: 'max', // 使用所有 CPU 核心
    exec_mode: 'cluster',
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=2048'
  }]
}
```

### Nginx 优化

```nginx
# 在 http 块中添加
worker_processes auto;
worker_connections 1024;

# 启用 gzip 压缩
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

# 缓存配置
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=my_cache:10m max_size=10g inactive=60m use_temp_path=off;
```

## 🚨 故障排除

### 常见问题

1. **端口被占用**
```bash
# 查找占用进程
sudo lsof -i :3000
sudo netstat -tulpn | grep :3000

# 杀死进程
sudo kill -9 <PID>
```

2. **权限问题**
```bash
# 修复文件权限
sudo chown -R chatroom:chatroom /home/chatroom/chat-room
sudo chmod -R 755 /home/chatroom/chat-room
sudo chmod -R 777 /home/chatroom/chat-room/uploads
```

3. **内存不足**
```bash
# 查看内存使用
free -h
top

# 创建交换文件
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

4. **Socket.IO 连接问题**
```bash
# 检查防火墙
sudo ufw status
sudo firewall-cmd --list-all

# 测试端口连通性
telnet your-domain.com 3000
```

### 日志分析

```bash
# 查看应用日志
pm2 logs chat-room --lines 100

# 查看 Nginx 日志
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# 查看系统日志
sudo journalctl -u nginx -f
sudo journalctl -f
```

## 🔄 更新和维护

### 应用更新

```bash
# 拉取最新代码
git pull origin main

# 安装新依赖
npm install --production

# 重启应用
pm2 reload chat-room

# 验证更新
pm2 status
```

### 数据备份

```bash
# 备份上传文件
tar -czf uploads-backup-$(date +%Y%m%d).tar.gz uploads/

# 备份配置文件
cp .env .env.backup-$(date +%Y%m%d)

# 自动备份脚本
cat > backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/home/chatroom/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# 备份上传文件
tar -czf $BACKUP_DIR/uploads-$DATE.tar.gz uploads/

# 备份配置
cp .env $BACKUP_DIR/env-$DATE

# 删除 30 天前的备份
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete
find $BACKUP_DIR -name "env-*" -mtime +30 -delete
EOF

chmod +x backup.sh

# 设置定时备份
crontab -e
# 添加：0 2 * * * /home/chatroom/chat-room/backup.sh
```

## 📈 扩展部署

### 负载均衡

使用多个服务器实例：

```nginx
upstream chat_backend {
    least_conn;
    server 192.168.1.10:3000;
    server 192.168.1.11:3000;
    server 192.168.1.12:3000;
}

server {
    location / {
        proxy_pass http://chat_backend;
        # 其他配置...
    }
}
```

### Redis 会话存储

```javascript
// 在 server.js 中添加 Redis 支持
const redis = require('redis');
const client = redis.createClient({
    host: 'your-redis-host',
    port: 6379
});

// Socket.IO Redis 适配器
const redisAdapter = require('socket.io-redis');
io.adapter(redisAdapter({ host: 'your-redis-host', port: 6379 }));
```

这份详细的部署指南涵盖了从本地开发到生产环境的各种部署场景，帮助您在任何平台上成功部署私人聊天室应用。