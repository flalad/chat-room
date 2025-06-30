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
- **多平台支持**：支持 Railway、Render、Vercel、Heroku、Cloudflare 等平台
- **通用存储系统**：自动适配内存、PostgreSQL、MySQL、Cloudflare KV 等存储方式
- **实时通信**：WebSocket 和 HTTP 轮询双模式支持
- **文件存储**：支持本地存储和 AWS S3 云存储
- **安全认证**：JWT Token 认证，密码加密存储

## 🚀 快速开始

### 环境要求
- Node.js 14.0 或更高版本
- npm 或 yarn 包管理器

### 本地开发

1. **克隆项目**
```bash
git clone <repository-url>
cd chat-room
```

2. **安装依赖**
```bash
npm install
```

3. **启动应用**
```bash
npm start
# 或
node server.js
```

4. **访问应用**
打开浏览器访问 `http://localhost:3000`

### 默认管理员账户
- **用户名**: `admin`
- **密码**: `password`

## 📁 项目结构

```
chat-room/
├── docs/                   # 文档目录
│   ├── DEPLOYMENT.md       # 部署指南
│   └── CLOUDFLARE.md       # Cloudflare解决方案
├── src/                    # 源代码
│   └── storage/            # 存储适配器
│       ├── storage-factory.js    # 存储工厂
│       ├── base-storage.js       # 存储基类
│       └── postgres-storage.js   # PostgreSQL适配器
├── api/                    # API服务器
│   ├── index.js           # Vercel函数入口
│   └── server.js          # 主服务器文件
├── public/                 # 前端静态文件
│   ├── css/               # 样式文件
│   ├── js/                # JavaScript文件
│   │   ├── vercel-chat-adapter.js  # Vercel聊天适配器
│   │   └── ...            # 其他JS文件
│   ├── index.html         # 主页面
│   ├── login.html         # 登录页面
│   ├── register.html      # 注册页面
│   └── admin.html         # 管理员页面
├── server.js              # 服务器主文件（本地开发）
├── package.json           # 项目配置
├── vercel.json            # Vercel配置
└── README.md              # 项目文档
```

## 🌐 部署指南

### 🎯 平台选择

| 平台 | 聊天功能 | 数据库 | 难度 | 推荐度 |
|------|----------|--------|------|--------|
| **Railway** | ✅ 完整 | 内置PostgreSQL | ⭐ | 🟢 强烈推荐 |
| **Render** | ✅ 完整 | 外部PostgreSQL | ⭐⭐ | 🟢 推荐 |
| **Vercel** | ⚠️ HTTP轮询 | 外部PostgreSQL | ⭐⭐⭐ | 🟡 可用 |
| **Heroku** | ✅ 完整 | 插件PostgreSQL | ⭐⭐ | 🟢 推荐 |
| **Cloudflare** | ✅ 完整 | D1+KV | ⭐⭐⭐⭐ | 🟡 高级 |

### 📋 环境变量配置

```bash
# 基础配置
NODE_ENV=production
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_password

# 数据库配置（推荐）
DATABASE_URL=postgresql://user:password@host:port/database

# JWT密钥（可选）
JWT_SECRET=your_jwt_secret
ADMIN_JWT_SECRET=your_admin_jwt_secret
```

### 🚀 一键部署

#### Railway（推荐）
1. 访问 [Railway.app](https://railway.app)
2. 连接GitHub仓库
3. 自动部署，零配置

#### Render
1. 访问 [Render.com](https://render.com)
2. 创建Web Service
3. 连接仓库并配置环境变量

#### Vercel（特殊配置）
1. 获取外部数据库（推荐 [Supabase](https://supabase.com)）
2. 设置 `DATABASE_URL` 环境变量
3. 自动启用HTTP轮询聊天模式

**📚 详细部署指南**: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

**🌐 Cloudflare解决方案**: [docs/CLOUDFLARE.md](docs/CLOUDFLARE.md)

## 🔧 存储系统

### 自动适配机制
项目会根据环境自动选择最适合的存储方式：

1. **外部数据库**（推荐）
   - 设置 `DATABASE_URL` 环境变量
   - 支持 PostgreSQL 和 MySQL
   - 数据持久化，重启不丢失

2. **Cloudflare KV**
   - 设置 `KV_NAMESPACE` 环境变量
   - 适用于 Cloudflare Workers
   - 全球分布式存储

3. **内存存储**（开发环境）
   - 无需配置
   - 重启后数据丢失
   - 仅适合开发测试

## 🎨 主题系统

### 内置主题
1. **默认主题**：简洁的白色背景
2. **涂鸦梦境**：四角渐变背景配合涂鸦图案
3. **彩色渐变**：多种渐变色彩主题

### 自定义主题
可以通过修改 `public/css/theme-settings.css` 添加新的主题。

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

### 聊天接口（HTTP模式）
- `GET /api/messages/history` - 获取消息历史
- `GET /api/messages/poll` - 轮询新消息
- `POST /api/messages/send` - 发送消息
- `GET /api/users/online` - 获取在线用户

### 文件接口
- `POST /api/upload` - 文件上传
- `GET /uploads/:filename` - 文件下载

**📖 完整API文档**: [API.md](API.md)

## 🔧 功能对比

### WebSocket vs HTTP轮询

| 功能 | WebSocket模式 | HTTP模式（Vercel） |
|------|---------------|-------------------|
| 发送消息 | ✅ 实时 | ✅ 立即 |
| 接收消息 | ✅ 实时 | ⚠️ 3秒延迟 |
| 在线用户 | ✅ 实时更新 | ❌ 静态显示 |
| 数据持久化 | ❌ 内存 | ✅ 数据库 |
| 服务器要求 | 长连接 | 无状态函数 |

## 🚨 故障排除

### 常见问题

#### 1. 管理员登录失败
**解决方案**: 
- 检查环境变量 `ADMIN_USERNAME` 和 `ADMIN_PASSWORD`
- 确认密码格式（支持明文密码）

#### 2. 聊天功能不可用
**解决方案**:
- **Vercel**: 正常现象，会自动切换到HTTP轮询模式
- **其他平台**: 检查WebSocket支持和防火墙设置

#### 3. 数据库连接失败
**解决方案**:
- 检查 `DATABASE_URL` 格式
- 确认数据库服务状态

## 💰 成本对比

| 平台 | 免费额度 | 付费起价 | 数据库成本 | 推荐场景 |
|------|----------|----------|------------|----------|
| **Railway** | $5/月 | $5/月 | 包含 | 个人项目 |
| **Render** | 750小时/月 | $7/月 | 外部 | 小型团队 |
| **Vercel** | 100GB/月 | $20/月 | 外部 | 静态优先 |
| **Heroku** | 550小时/月 | $7/月 | $9/月 | 企业应用 |
| **Cloudflare** | 大额度 | $5/月 | 包含 | 全球应用 |

## 📚 文档目录

- **[部署指南](docs/DEPLOYMENT.md)** - 完整的多平台部署指南
- **[Cloudflare解决方案](docs/CLOUDFLARE.md)** - Cloudflare Pages + Workers方案
- **[API文档](API.md)** - 完整的API接口说明
- **[安全指南](SECURITY.md)** - 安全配置和最佳实践

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

### 开发指南
1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 发起 Pull Request

## 📄 许可证

MIT License

## 📞 支持

如有问题，请通过以下方式联系：
- 提交 GitHub Issue
- 查看文档目录获取详细帮助

---

**享受聊天的乐趣！** 🎉

## 🎯 快速链接

- 🚀 [立即部署到Railway](https://railway.app)
- 🌐 [部署到Render](https://render.com)
- ☁️ [部署到Vercel](https://vercel.com)
- 📖 [查看部署指南](docs/DEPLOYMENT.md)
- 🔧 [Cloudflare高级方案](docs/CLOUDFLARE.md)