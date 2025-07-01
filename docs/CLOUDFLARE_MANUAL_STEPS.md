# Cloudflare Pages 手动部署步骤

这是一个完全手动的、逐步操作的Cloudflare Pages部署指南。

## 🎯 目标

将聊天室前端部署到Cloudflare Pages，后端保持在现有平台（如Vercel）。

## 📋 准备工作

### 1. 确保你有以下信息：
- [ ] GitHub账户和仓库地址
- [ ] 后端服务地址（例如：`https://your-app.vercel.app`）
- [ ] Cloudflare账户

### 2. 项目文件检查：
- [ ] `public/` 目录存在
- [ ] `public/index.html` 存在
- [ ] 项目已推送到GitHub

## 🚀 手动部署步骤

### 步骤1: 注册Cloudflare账户

1. 打开浏览器，访问：https://dash.cloudflare.com/sign-up
2. 填写邮箱和密码
3. 点击"Create Account"
4. 验证邮箱（检查邮箱收件箱）
5. 登录到Cloudflare控制台

### 步骤2: 创建Pages项目

1. **进入Pages页面**
   - 在Cloudflare控制台左侧菜单中，点击"Pages"

2. **创建新项目**
   - 点击蓝色的"Create a project"按钮

3. **连接Git仓库**
   - 选择"Connect to Git"
   - 点击"GitHub"
   - 授权Cloudflare访问你的GitHub账户
   - 在弹出窗口中点击"Authorize cloudflare"

4. **选择仓库**
   - 在仓库列表中找到你的聊天室项目
   - 点击项目名称旁边的"Begin setup"

### 步骤3: 配置构建设置

在"Set up builds and deployments"页面：

1. **项目名称**
   - 输入：`chat-room`（或你喜欢的名称）

2. **生产分支**
   - 保持默认：`main`

3. **Framework preset**
   - 选择：`None`

4. **构建命令**
   - 留空（不填写任何内容）

5. **构建输出目录**
   - 输入：`public`

6. **根目录**
   - 留空（使用默认的 `/`）

7. **环境变量**
   - 暂时不添加，点击"Save and Deploy"

### 步骤4: 等待首次部署

1. 点击"Save and Deploy"后，Cloudflare会开始构建
2. 等待构建完成（通常1-3分钟）
3. 构建成功后，你会看到一个绿色的"Success"状态
4. 记下分配的域名，格式类似：`https://chat-room-xxx.pages.dev`

### 步骤5: 配置API地址

现在需要配置前端连接到你的后端：

1. **修改配置文件**
   - 在你的本地项目中，编辑 `public/js/cloudflare-config.js`
   - 找到这两行：
     ```javascript
     apiBaseUrl = 'https://your-backend-app.vercel.app';
     wsUrl = 'wss://your-backend-app.vercel.app';
     ```
   - 将 `https://your-backend-app.vercel.app` 替换为你的实际后端地址

2. **更新index.html**
   - 编辑 `public/index.html`
   - 在 `</head>` 标签之前添加：
     ```html
     <script src="./js/cloudflare-config.js"></script>
     ```

3. **提交更改**
   ```bash
   git add .
   git commit -m "Configure for Cloudflare Pages"
   git push
   ```

### 步骤6: 等待自动重新部署

1. 推送代码后，Cloudflare Pages会自动检测到更改
2. 在Cloudflare控制台的Pages项目页面，你会看到新的部署开始
3. 等待部署完成

### 步骤7: 配置后端CORS

在你的后端项目中（Vercel等），确保允许Cloudflare Pages的访问：

1. **找到CORS配置**
   - 通常在 `server.js` 或 `app.js` 中

2. **添加Cloudflare Pages域名**
   ```javascript
   app.use(cors({
       origin: [
           'http://localhost:3000',
           'https://chat-room-xxx.pages.dev',  // 替换为你的实际域名
           'https://your-custom-domain.com'    // 如果有自定义域名
       ],
       credentials: true
   }));
   ```

3. **重新部署后端**
   - 提交并推送后端更改
   - 等待后端重新部署

### 步骤8: 测试部署

1. **访问你的Cloudflare Pages网站**
   - 打开 `https://your-project.pages.dev`

2. **测试功能**
   - [ ] 页面正常加载
   - [ ] 注册新用户
   - [ ] 登录功能
   - [ ] 发送消息
   - [ ] 文件上传
   - [ ] 实时聊天

3. **检查控制台**
   - 按F12打开开发者工具
   - 查看Console标签，确认没有错误

## 🌐 自定义域名（可选）

如果你有自己的域名：

### 步骤1: 添加域名到Cloudflare

1. **添加站点**
   - 在Cloudflare控制台点击"Add a Site"
   - 输入你的域名（如：`mychatroom.com`）
   - 选择"Free"计划
   - 点击"Continue"

2. **更改DNS服务器**
   - Cloudflare会显示两个DNS服务器地址
   - 去你的域名注册商（如阿里云、腾讯云等）
   - 将域名的DNS服务器改为Cloudflare提供的地址
   - 等待DNS传播（1-24小时）

### 步骤2: 配置Pages自定义域名

1. **添加自定义域名**
   - 进入你的Pages项目
   - 点击"Custom domains"标签
   - 点击"Set up a custom domain"
   - 输入你的域名
   - 点击"Continue"

2. **等待SSL证书**
   - Cloudflare会自动配置SSL证书
   - 等待状态变为"Active"

## 🔧 故障排除

### 问题1: 页面显示404
**解决**: 检查构建输出目录是否设置为 `public`

### 问题2: API调用失败
**解决**: 
1. 检查 `cloudflare-config.js` 中的后端地址是否正确
2. 确认后端CORS配置包含了Pages域名

### 问题3: WebSocket连接失败
**解决**: 确保后端支持WebSocket，且使用 `wss://` 协议

### 问题4: 构建失败
**解决**: 确保构建命令留空，构建输出目录设置为 `public`

## ✅ 完成检查清单

部署完成后，确认以下项目：

- [ ] Cloudflare Pages项目创建成功
- [ ] 首次部署完成
- [ ] 配置文件已更新并推送
- [ ] 后端CORS已配置
- [ ] 网站可以正常访问
- [ ] 所有功能测试通过
- [ ] 自定义域名配置（如果需要）

## 🎉 恭喜！

你的聊天室现在已经部署到Cloudflare Pages！

- **访问地址**: `https://your-project.pages.dev`
- **管理地址**: https://dash.cloudflare.com/
- **自动部署**: 每次推送代码到GitHub都会自动更新

享受全球CDN带来的极速体验吧！🚀

---

## 📞 需要帮助？

如果遇到问题：
1. 检查Cloudflare Pages的部署日志
2. 查看浏览器控制台的错误信息
3. 确认后端服务正常运行
4. 验证所有配置文件正确