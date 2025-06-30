# 管理员密码设置指南

## 问题解决

如果您在Vercel部署后遇到"管理员用户名或密码错误"，现在有两种简单的解决方案：

## 方案1：使用明文密码（推荐，简单易用）

在Vercel控制台设置以下环境变量：
```
ADMIN_USERNAME=admin
ADMIN_PASSWORD=1145141919810
```

**优点**：
- 设置简单，直接使用您想要的密码
- 无需生成哈希值
- 支持任何英文字母和数字组合

## 方案2：使用哈希密码（更安全）

在Vercel控制台设置以下环境变量：
```
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=your_bcrypt_hash_here
```

## 当前您的设置

根据您提供的信息：
- `ADMIN_USERNAME=admin` ✅ 正确
- `ADMIN_PASSWORD_HASH=1145141919810` ❌ 这不是有效的bcrypt哈希

## 立即解决方案

**选择方案1（推荐）**：
1. 在Vercel控制台删除 `ADMIN_PASSWORD_HASH` 环境变量
2. 添加新的环境变量：`ADMIN_PASSWORD=1145141919810`
3. 重新部署
4. 使用用户名 `admin` 和密码 `1145141919810` 登录

## 环境变量优先级

代码会按以下优先级检查密码：
1. 如果设置了 `ADMIN_PASSWORD`，使用明文密码验证
2. 如果设置了 `ADMIN_PASSWORD_HASH`，使用bcrypt哈希验证
3. 如果都没设置，使用默认配置

## 安全建议

- **开发/测试环境**：使用 `ADMIN_PASSWORD` 明文密码即可
- **生产环境**：建议使用 `ADMIN_PASSWORD_HASH` 哈希密码
- **密码强度**：建议使用包含字母、数字的复杂密码

## 验证步骤

1. 设置环境变量后重新部署
2. 访问您的网站
3. 点击登录按钮
4. 输入用户名和密码
5. 应该能成功登录管理员界面

如果仍有问题，请检查Vercel的函数日志获取详细错误信息。