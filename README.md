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

## 🌐 Cloudflare 部署

### 完整部署指南
**[📖 Cloudflare 完整手动部署指南](./docs/CLOUDFLARE_MANUAL_DEPLOYMENT.md)**

这是一个完整的手动部署指南，包含：
- **前端部署**: Cloudflare Pages（静态托管 + CDN）
- **后端部署**: Cloudflare Workers（无服务器API）
- **数据库配置**: Cloudflare D1（SQLite）
- **文件存储**: Cloudflare KV（键值存储）

### 部署特点
- ✅ **无需修改项目结构** - 所有文件已放在正确位置
- ✅ **完整手动流程** - 逐步操作指南，适合所有用户
- ✅ **统一部署方案** - 前端和后端在一个文档中
- ✅ **全球边缘计算** - 极低延迟，高性能
- ✅ **成本极低** - 大部分功能免费使用

### 快速预览
1. 安装Wrangler CLI: `npm install -g wrangler`
2. 创建D1数据库和KV存储
3. 配置 `wrangler.toml` 文件
4. 部署Workers后端
5. 部署Pages前端
6. 配置API地址和CORS

**预计部署时间**: 30-60分钟

## 🛠️ 技术栈

### 前端
- **HTML5, CSS3, JavaScript ES6+**
- **WebSocket** 实时通信
- **响应式设计** 移动端适配
- **文件上传** 支持多种格式

### 后端
- **Node.js** (本地开发)
- **Cloudflare Workers** (生产部署)
- **SQLite/D1** 数据库
- **JWT认证** 用户身份验证

### 部署平台
- **Cloudflare Pages** - 前端静态托管
- **Cloudflare Workers** - 后端无服务器计算
- **Cloudflare D1** - 数据库服务
- **Cloudflare KV** - 文件存储

## 📁 项目结构

```
chat-room/
├── README.md                    # 项目说明
├── package.json                 # 依赖配置
├── server.js                    # 本地开发服务器
├── worker.js                    # Cloudflare Workers代码
├── schema.sql                   # 数据库初始化脚本
├── wrangler.toml               # Workers配置文件
├── 
├── public/                     # 前端文件
│   ├── index.html              # 主页面
│   ├── admin.html              # 管理页面
│   ├── css/                    # 样式文件
│   └── js/                     # JavaScript文件
├── 
├── docs/                       # 📚 文档
│   └── CLOUDFLARE_MANUAL_DEPLOYMENT.md  # 🌟 完整部署指南
├── 
├── api/                        # 本地API路由
└── src/                        # 源代码
```

## 📚 其他文档

在 [`docs/`](./docs/) 文件夹中还包含：

- **[数据库文件存储指南](./docs/DATABASE_FILE_STORAGE_GUIDE.md)** - 文件上传配置
- **[S3存储指南](./docs/S3_STORAGE_GUIDE.md)** - AWS S3集成（可选）
- **[简化认证指南](./docs/SIMPLIFIED_AUTH_GUIDE.md)** - 用户认证配置

## ✨ 主要功能

- 🔐 **用户认证** - 注册、登录、JWT认证
- 💬 **实时聊天** - WebSocket实时消息同步
- 📁 **文件上传** - 支持图片、文档、音频、视频
- 👥 **在线用户** - 实时显示在线用户列表
- 🛡️ **管理功能** - 用户管理、消息管理
- 📱 **响应式设计** - 支持桌面和移动设备
- 🎨 **主题切换** - 多种界面主题

## 💰 部署成本

### Cloudflare免费额度（足够小型项目）
- **Pages**: 无限制静态托管
- **Workers**: 100,000请求/天
- **D1**: 5GB存储 + 25M行读取/天
- **KV**: 10GB存储 + 100,000读取/天

### 预估成本
- **小型项目** (< 10万请求/天): **完全免费**
- **中型项目** (100万请求/月): **约$5-10/月**
- **大型项目** (1000万请求/月): **约$50-100/月**

## 📞 获取帮助

1. 查看 [完整部署指南](./docs/CLOUDFLARE_MANUAL_DEPLOYMENT.md)
2. 检查部署指南中的故障排除部分
3. 确保所有依赖已正确安装
4. 验证Cloudflare账户权限

---

**🚀 开始部署：[Cloudflare 完整手动部署指南](./docs/CLOUDFLARE_MANUAL_DEPLOYMENT.md)**