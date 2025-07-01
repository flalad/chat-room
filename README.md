# 聊天室项目

一个功能完整的实时聊天室应用，支持用户认证、文件上传、管理员功能等。

## 🚀 快速开始

### 本地运行
```bash
# 安装依赖
npm install

# 启动服务器
npm start
```

访问 `http://localhost:3000` 开始使用。

## 📚 完整文档

所有详细文档都在 [`docs/`](./docs/) 文件夹中：

### 🌟 主要文档
- **[Cloudflare完整部署方案](./docs/CLOUDFLARE_COMPLETE_SOLUTION.md)** - 推荐阅读，包含所有部署选项
- **[快速部署指南](./docs/CLOUDFLARE_QUICK_DEPLOY.md)** - 30分钟快速部署
- **[Workers完整后端](./docs/CLOUDFLARE_WORKERS_MANUAL_DEPLOY.md)** - 全栈Cloudflare解决方案
- **[详细手动步骤](./docs/CLOUDFLARE_MANUAL_STEPS.md)** - 新手友好的逐步指南

### 📖 其他文档
- **[数据库文件存储指南](./docs/DATABASE_FILE_STORAGE_GUIDE.md)** - 文件上传配置
- **[S3存储指南](./docs/S3_STORAGE_GUIDE.md)** - AWS S3集成
- **[简化认证指南](./docs/SIMPLIFIED_AUTH_GUIDE.md)** - 用户认证配置

## 🛠️ 技术栈

- **前端**: HTML5, CSS3, JavaScript ES6+
- **后端**: Node.js / Cloudflare Workers
- **数据库**: SQLite / Cloudflare D1
- **实时通信**: WebSocket
- **部署**: Vercel / Cloudflare Pages + Workers

## 🎯 部署选项

### 方案A：混合部署（推荐新手）
- 前端：Cloudflare Pages
- 后端：保持现有平台
- 时间：30分钟

### 方案B：全Cloudflare生态（推荐进阶）
- 前端：Cloudflare Pages
- 后端：Cloudflare Workers
- 数据库：Cloudflare D1
- 时间：2-3小时

## 📞 获取帮助

1. 查看 [`docs/`](./docs/) 文件夹中的详细文档
2. 检查各指南中的故障排除部分
3. 确保所有依赖已正确安装

---

**开始你的部署之旅：阅读 [Cloudflare完整部署方案](./docs/CLOUDFLARE_COMPLETE_SOLUTION.md)** 🚀