# S3存储配置指南

## 概述

聊天室现在支持多种S3兼容的存储服务，包括Cloudflare R2和其他第三方服务。管理员可以通过后台配置存储服务，并设置存储容量限制。

## 支持的存储提供商

### 1. Amazon S3
- **提供商**: `aws`
- **区域**: 如 `us-east-1`, `eu-west-1`
- **端点**: 自动生成，无需填写
- **特点**: 原生AWS S3服务，稳定可靠

### 2. Cloudflare R2 ⭐ 推荐
- **提供商**: `cloudflare`
- **区域**: `auto`
- **端点**: `https://[account-id].r2.cloudflarestorage.com`
- **特点**: 
  - 免费额度大（10GB存储 + 1000万次请求/月）
  - 支持CDN加速
  - 无出站流量费用
  - S3兼容API

### 3. 阿里云OSS
- **提供商**: `aliyun`
- **区域**: 如 `oss-cn-hangzhou`
- **端点**: `https://oss-cn-hangzhou.aliyuncs.com`
- **特点**: 国内访问速度快

### 4. 腾讯云COS
- **提供商**: `tencent`
- **区域**: 如 `ap-beijing`
- **端点**: `https://cos.ap-beijing.myqcloud.com`
- **特点**: 国内服务，价格实惠

### 5. 七牛云
- **提供商**: `qiniu`
- **区域**: 如 `z0`, `z1`, `z2`
- **端点**: `https://s3-cn-east-1.qiniucs.com`
- **特点**: 国内CDN覆盖好

### 6. MinIO
- **提供商**: `minio`
- **区域**: `us-east-1`（通常）
- **端点**: `https://minio.example.com`
- **特点**: 自托管，完全控制

### 7. 其他S3兼容服务
- **提供商**: `other`
- **配置**: 根据服务商要求填写
- **特点**: 支持任何S3兼容的存储服务

## 配置步骤

### 1. 登录管理员后台
访问 `/admin.html` 并使用管理员账户登录。

### 2. 进入S3存储配置
点击侧边栏的"S3存储配置"菜单。

### 3. 填写配置信息
根据选择的存储提供商填写相应信息：

#### 基础配置
- **存储提供商**: 从下拉列表选择
- **区域**: 根据提示填写
- **Access Key**: 访问密钥ID
- **Secret Key**: 访问密钥
- **存储桶名称**: 预先创建的存储桶
- **自定义端点**: 某些提供商需要

#### 高级配置
- **存储目录**: 文件存储的子目录（默认：`chat-files/`）
- **存储容量限制**: 限制总存储使用量（MB，0=无限制）
- **启用CDN加速**: 某些提供商支持CDN

### 4. 测试连接
点击"测试连接"按钮验证配置是否正确。

### 5. 保存配置
确认无误后点击"保存配置"。

## Cloudflare R2 详细配置

### 1. 创建R2存储桶
1. 登录Cloudflare Dashboard
2. 进入R2 Object Storage
3. 创建新的存储桶
4. 记录存储桶名称

### 2. 获取API令牌
1. 进入"管理R2 API令牌"
2. 创建新的API令牌
3. 设置权限：对象读写
4. 记录Token ID和Token Secret

### 3. 获取账户ID
1. 在Cloudflare Dashboard右侧找到账户ID
2. 复制账户ID

### 4. 配置聊天室
- **存储提供商**: Cloudflare R2
- **区域**: `auto`
- **Access Key**: R2 Token ID
- **Secret Key**: R2 Token Secret
- **存储桶名称**: 创建的存储桶名称
- **自定义端点**: `https://[账户ID].r2.cloudflarestorage.com`
- **启用CDN加速**: ✅ 勾选

### 5. CDN配置（可选）
如需公开访问，可以配置自定义域名：
1. 在R2存储桶设置中添加自定义域名
2. 配置DNS记录
3. 文件将通过CDN加速访问

## 存储容量管理

### 容量限制
- 设置存储容量限制可以控制总使用量
- 单位为MB，0表示无限制
- 达到限制时会阻止新文件上传

### 存储使用情况
管理员后台会显示：
- 已使用存储空间
- 文件数量
- 存储限制
- 使用率进度条

### 存储清理
- 系统提供自动清理功能
- 可以清理超过30天的无效文件
- 管理员可以手动触发清理

## 最佳实践

### 1. 选择合适的提供商
- **个人/小团队**: Cloudflare R2（免费额度大）
- **国内用户**: 阿里云OSS或腾讯云COS
- **企业用户**: AWS S3（稳定性最佳）
- **自托管**: MinIO（完全控制）

### 2. 安全配置
- 使用专门的API密钥，不要使用主账户密钥
- 定期轮换访问密钥
- 设置适当的存储桶权限

### 3. 容量规划
- 根据用户数量和使用频率设置合理的存储限制
- 定期监控存储使用情况
- 及时清理无效文件

### 4. 备份策略
- 重要文件建议设置跨区域备份
- 定期导出文件列表
- 考虑设置生命周期策略

## 故障排除

### 常见问题

#### 1. 连接测试失败
- 检查端点URL是否正确
- 验证Access Key和Secret Key
- 确认存储桶已创建且有权限

#### 2. 文件上传失败
- 检查存储容量是否已满
- 验证文件类型是否被允许
- 确认网络连接正常

#### 3. 文件访问失败
- 检查存储桶权限设置
- 验证CDN配置（如果启用）
- 确认文件URL格式正确

### 错误代码
- `400`: 配置信息不完整
- `403`: 访问权限不足
- `413`: 存储空间不足
- `500`: 服务器内部错误

## 技术支持

如果遇到配置问题，请检查：
1. 管理员后台的错误提示
2. 浏览器开发者工具的网络请求
3. 存储服务商的文档和状态页面

更多技术细节请参考各存储服务商的官方文档。