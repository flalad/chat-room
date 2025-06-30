# API 文档 - 私人聊天室应用

本文档详细描述了私人聊天室应用的所有 API 接口、WebSocket 事件和数据结构。

## 📋 目录

- [基础信息](#基础信息)
- [认证接口](#认证接口)
- [用户管理](#用户管理)
- [聊天功能](#聊天功能)
- [文件上传](#文件上传)
- [管理员功能](#管理员功能)
- [WebSocket 事件](#websocket-事件)
- [数据结构](#数据结构)
- [错误处理](#错误处理)

## 🔧 基础信息

### 服务器信息
- **基础 URL**: `http://localhost:3000` (开发环境)
- **协议**: HTTP/HTTPS + WebSocket
- **认证方式**: JWT Token
- **数据格式**: JSON

### 通用响应格式
```json
{
  "success": true,
  "message": "操作成功",
  "data": {},
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 错误响应格式
```json
{
  "success": false,
  "error": "错误类型",
  "message": "错误描述",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 🔐 认证接口

### 用户注册
**POST** `/api/register`

注册新用户账户。

**请求体**:
```json
{
  "username": "用户名",
  "password": "密码",
  "email": "邮箱地址"
}
```

**响应**:
```json
{
  "success": true,
  "message": "注册成功",
  "data": {
    "user": {
      "id": "user_123",
      "username": "用户名",
      "email": "邮箱地址",
      "role": "user",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "jwt_token_here"
  }
}
```

**错误响应**:
- `400` - 用户名已存在
- `400` - 邮箱已被使用
- `400` - 密码强度不足
- `422` - 参数验证失败

### 用户登录
**POST** `/api/login`

用户登录获取访问令牌。

**请求体**:
```json
{
  "username": "用户名",
  "password": "密码"
}
```

**响应**:
```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "user": {
      "id": "user_123",
      "username": "用户名",
      "email": "邮箱地址",
      "role": "user",
      "lastLoginAt": "2024-01-01T00:00:00.000Z"
    },
    "token": "jwt_token_here"
  }
}
```

**错误响应**:
- `401` - 用户名或密码错误
- `404` - 用户不存在
- `429` - 登录尝试过于频繁

### 管理员登录
**POST** `/api/admin/login`

管理员登录接口。

**请求体**:
```json
{
  "username": "管理员用户名",
  "password": "管理员密码"
}
```

**响应**:
```json
{
  "success": true,
  "message": "管理员登录成功",
  "data": {
    "user": {
      "id": "admin_123",
      "username": "管理员用户名",
      "role": "admin",
      "permissions": ["user_management", "room_management", "system_config"]
    },
    "token": "admin_jwt_token_here"
  }
}
```

### 令牌验证
**GET** `/api/verify-token`

验证当前令牌是否有效。

**请求头**:
```
Authorization: Bearer <jwt_token>
```

**响应**:
```json
{
  "success": true,
  "message": "令牌有效",
  "data": {
    "user": {
      "id": "user_123",
      "username": "用户名",
      "role": "user"
    },
    "expiresAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 退出登录
**POST** `/api/logout`

用户退出登录。

**请求头**:
```
Authorization: Bearer <jwt_token>
```

**响应**:
```json
{
  "success": true,
  "message": "退出登录成功"
}
```

## 👥 用户管理

### 获取用户信息
**GET** `/api/user/profile`

获取当前用户的详细信息。

**请求头**:
```
Authorization: Bearer <jwt_token>
```

**响应**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "username": "用户名",
      "email": "邮箱地址",
      "avatar": "头像URL",
      "role": "user",
      "status": "online",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "lastLoginAt": "2024-01-01T00:00:00.000Z",
      "preferences": {
        "theme": "default",
        "notifications": true,
        "language": "zh-CN"
      }
    }
  }
}
```

### 更新用户信息
**PUT** `/api/user/profile`

更新当前用户的信息。

**请求头**:
```
Authorization: Bearer <jwt_token>
```

**请求体**:
```json
{
  "email": "新邮箱地址",
  "avatar": "新头像URL",
  "preferences": {
    "theme": "dark",
    "notifications": false,
    "language": "en-US"
  }
}
```

**响应**:
```json
{
  "success": true,
  "message": "用户信息更新成功",
  "data": {
    "user": {
      "id": "user_123",
      "username": "用户名",
      "email": "新邮箱地址",
      "avatar": "新头像URL",
      "preferences": {
        "theme": "dark",
        "notifications": false,
        "language": "en-US"
      }
    }
  }
}
```

### 修改密码
**PUT** `/api/user/password`

修改当前用户密码。

**请求头**:
```
Authorization: Bearer <jwt_token>
```

**请求体**:
```json
{
  "currentPassword": "当前密码",
  "newPassword": "新密码"
}
```

**响应**:
```json
{
  "success": true,
  "message": "密码修改成功"
}
```

**错误响应**:
- `400` - 当前密码错误
- `400` - 新密码强度不足

## 💬 聊天功能

### 获取聊天历史
**GET** `/api/chat/history`

获取聊天室的历史消息。

**请求头**:
```
Authorization: Bearer <jwt_token>
```

**查询参数**:
- `page` (可选): 页码，默认为 1
- `limit` (可选): 每页消息数量，默认为 50
- `before` (可选): 获取指定时间之前的消息

**响应**:
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": "msg_123",
        "userId": "user_123",
        "username": "用户名",
        "content": "消息内容",
        "type": "text",
        "timestamp": "2024-01-01T00:00:00.000Z",
        "edited": false,
        "editedAt": null
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 150,
      "hasMore": true
    }
  }
}
```

### 发送消息
**POST** `/api/chat/message`

发送新消息到聊天室。

**请求头**:
```
Authorization: Bearer <jwt_token>
```

**请求体**:
```json
{
  "content": "消息内容",
  "type": "text"
}
```

**响应**:
```json
{
  "success": true,
  "message": "消息发送成功",
  "data": {
    "message": {
      "id": "msg_124",
      "userId": "user_123",
      "username": "用户名",
      "content": "消息内容",
      "type": "text",
      "timestamp": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### 编辑消息
**PUT** `/api/chat/message/:messageId`

编辑已发送的消息。

**请求头**:
```
Authorization: Bearer <jwt_token>
```

**请求体**:
```json
{
  "content": "编辑后的消息内容"
}
```

**响应**:
```json
{
  "success": true,
  "message": "消息编辑成功",
  "data": {
    "message": {
      "id": "msg_124",
      "content": "编辑后的消息内容",
      "edited": true,
      "editedAt": "2024-01-01T00:05:00.000Z"
    }
  }
}
```

### 删除消息
**DELETE** `/api/chat/message/:messageId`

删除已发送的消息。

**请求头**:
```
Authorization: Bearer <jwt_token>
```

**响应**:
```json
{
  "success": true,
  "message": "消息删除成功"
}
```

### 获取在线用户
**GET** `/api/chat/online-users`

获取当前在线用户列表。

**请求头**:
```
Authorization: Bearer <jwt_token>
```

**响应**:
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "user_123",
        "username": "用户名",
        "avatar": "头像URL",
        "status": "online",
        "lastSeen": "2024-01-01T00:00:00.000Z"
      }
    ],
    "count": 5
  }
}
```

## 📁 文件上传

### 上传文件
**POST** `/api/upload`

上传文件到聊天室。

**请求头**:
```
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data
```

**请求体** (FormData):
- `file`: 要上传的文件
- `type` (可选): 文件类型标识

**响应**:
```json
{
  "success": true,
  "message": "文件上传成功",
  "data": {
    "file": {
      "id": "file_123",
      "filename": "原始文件名.jpg",
      "originalName": "原始文件名.jpg",
      "mimeType": "image/jpeg",
      "size": 1024000,
      "url": "/uploads/file_123.jpg",
      "uploadedBy": "user_123",
      "uploadedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

**错误响应**:
- `400` - 文件大小超出限制
- `400` - 不支持的文件类型
- `413` - 请求体过大

### 获取文件信息
**GET** `/api/upload/:fileId`

获取已上传文件的详细信息。

**请求头**:
```
Authorization: Bearer <jwt_token>
```

**响应**:
```json
{
  "success": true,
  "data": {
    "file": {
      "id": "file_123",
      "filename": "原始文件名.jpg",
      "originalName": "原始文件名.jpg",
      "mimeType": "image/jpeg",
      "size": 1024000,
      "url": "/uploads/file_123.jpg",
      "uploadedBy": "user_123",
      "uploadedAt": "2024-01-01T00:00:00.000Z",
      "downloads": 5
    }
  }
}
```

### 下载文件
**GET** `/uploads/:filename`

下载已上传的文件。

**响应**: 文件二进制数据

**响应头**:
```
Content-Type: <文件MIME类型>
Content-Disposition: attachment; filename="<原始文件名>"
```

## 🔧 管理员功能

### 获取用户列表
**GET** `/api/admin/users`

获取所有用户列表（仅管理员）。

**请求头**:
```
Authorization: Bearer <admin_jwt_token>
```

**查询参数**:
- `page` (可选): 页码
- `limit` (可选): 每页数量
- `search` (可选): 搜索关键词
- `role` (可选): 用户角色筛选

**响应**:
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "user_123",
        "username": "用户名",
        "email": "邮箱地址",
        "role": "user",
        "status": "active",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "lastLoginAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "hasMore": true
    }
  }
}
```

### 管理用户
**PUT** `/api/admin/users/:userId`

管理用户状态（仅管理员）。

**请求头**:
```
Authorization: Bearer <admin_jwt_token>
```

**请求体**:
```json
{
  "status": "banned",
  "role": "moderator",
  "reason": "违规行为"
}
```

**响应**:
```json
{
  "success": true,
  "message": "用户状态更新成功",
  "data": {
    "user": {
      "id": "user_123",
      "status": "banned",
      "role": "moderator"
    }
  }
}
```

### 删除用户
**DELETE** `/api/admin/users/:userId`

删除用户账户（仅管理员）。

**请求头**:
```
Authorization: Bearer <admin_jwt_token>
```

**响应**:
```json
{
  "success": true,
  "message": "用户删除成功"
}
```

### 获取系统统计
**GET** `/api/admin/stats`

获取系统统计信息（仅管理员）。

**请求头**:
```
Authorization: Bearer <admin_jwt_token>
```

**响应**:
```json
{
  "success": true,
  "data": {
    "stats": {
      "totalUsers": 150,
      "activeUsers": 45,
      "totalMessages": 5000,
      "todayMessages": 120,
      "totalFiles": 300,
      "storageUsed": "2.5GB",
      "uptime": "7 days, 12 hours",
      "systemLoad": {
        "cpu": 25.5,
        "memory": 60.2,
        "disk": 45.8
      }
    }
  }
}
```

### 清理聊天记录
**DELETE** `/api/admin/chat/cleanup`

清理聊天记录（仅管理员）。

**请求头**:
```
Authorization: Bearer <admin_jwt_token>
```

**请求体**:
```json
{
  "before": "2024-01-01T00:00:00.000Z",
  "keepCount": 1000
}
```

**响应**:
```json
{
  "success": true,
  "message": "聊天记录清理完成",
  "data": {
    "deletedCount": 500,
    "remainingCount": 1000
  }
}
```

## 🔌 WebSocket 事件

### 连接事件

#### 客户端连接
```javascript
// 连接到服务器
const socket = io('http://localhost:3000', {
  auth: {
    token: 'jwt_token_here'
  }
});
```

#### 连接成功
```javascript
socket.on('connect', () => {
  console.log('连接成功');
});
```

#### 连接错误
```javascript
socket.on('connect_error', (error) => {
  console.log('连接错误:', error.message);
});
```

### 用户事件

#### 用户加入
```javascript
socket.on('user_joined', (data) => {
  // data: { userId, username, timestamp }
  console.log(`${data.username} 加入了聊天室`);
});
```

#### 用户离开
```javascript
socket.on('user_left', (data) => {
  // data: { userId, username, timestamp }
  console.log(`${data.username} 离开了聊天室`);
});
```

#### 在线用户更新
```javascript
socket.on('online_users_update', (data) => {
  // data: { users: [...], count: number }
  console.log('在线用户:', data.users);
});
```

### 消息事件

#### 发送消息
```javascript
socket.emit('send_message', {
  content: '消息内容',
  type: 'text'
});
```

#### 接收新消息
```javascript
socket.on('new_message', (data) => {
  // data: { id, userId, username, content, type, timestamp }
  console.log('新消息:', data);
});
```

#### 消息编辑
```javascript
socket.emit('edit_message', {
  messageId: 'msg_123',
  content: '编辑后的内容'
});

socket.on('message_edited', (data) => {
  // data: { messageId, content, editedAt }
  console.log('消息已编辑:', data);
});
```

#### 消息删除
```javascript
socket.emit('delete_message', {
  messageId: 'msg_123'
});

socket.on('message_deleted', (data) => {
  // data: { messageId }
  console.log('消息已删除:', data.messageId);
});
```

### 文件事件

#### 文件上传完成
```javascript
socket.on('file_uploaded', (data) => {
  // data: { fileId, filename, url, uploadedBy }
  console.log('文件上传完成:', data);
});
```

### 系统事件

#### 系统通知
```javascript
socket.on('system_notification', (data) => {
  // data: { type, message, level }
  console.log('系统通知:', data.message);
});
```

#### 服务器维护
```javascript
socket.on('server_maintenance', (data) => {
  // data: { message, estimatedDuration }
  console.log('服务器维护:', data.message);
});
```

### 错误事件

#### 操作错误
```javascript
socket.on('error', (data) => {
  // data: { type, message, code }
  console.error('操作错误:', data.message);
});
```

#### 权限错误
```javascript
socket.on('permission_error', (data) => {
  // data: { action, message }
  console.error('权限不足:', data.message);
});
```

## 📊 数据结构

### 用户对象
```typescript
interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  role: 'user' | 'admin' | 'moderator';
  status: 'active' | 'banned' | 'inactive';
  createdAt: string;
  lastLoginAt?: string;
  preferences: {
    theme: string;
    notifications: boolean;
    language: string;
  };
}
```

### 消息对象
```typescript
interface Message {
  id: string;
  userId: string;
  username: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'system';
  timestamp: string;
  edited: boolean;
  editedAt?: string;
  fileId?: string;
  replyTo?: string;
}
```

### 文件对象
```typescript
interface File {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedBy: string;
  uploadedAt: string;
  downloads: number;
}
```

### 房间对象
```typescript
interface Room {
  id: string;
  name: string;
  description?: string;
  type: 'public' | 'private';
  createdBy: string;
  createdAt: string;
  memberCount: number;
  lastActivity: string;
}
```

## ❌ 错误处理

### HTTP 状态码

- `200` - 请求成功
- `201` - 创建成功
- `400` - 请求参数错误
- `401` - 未授权/令牌无效
- `403` - 权限不足
- `404` - 资源不存在
- `409` - 资源冲突
- `413` - 请求体过大
- `422` - 参数验证失败
- `429` - 请求过于频繁
- `500` - 服务器内部错误

### 错误类型

#### 认证错误
```json
{
  "success": false,
  "error": "AUTHENTICATION_ERROR",
  "message": "令牌无效或已过期",
  "code": "TOKEN_EXPIRED"
}
```

#### 权限错误
```json
{
  "success": false,
  "error": "PERMISSION_ERROR",
  "message": "权限不足，无法执行此操作",
  "code": "INSUFFICIENT_PERMISSIONS"
}
```

#### 验证错误
```json
{
  "success": false,
  "error": "VALIDATION_ERROR",
  "message": "参数验证失败",
  "details": {
    "username": "用户名长度必须在3-20个字符之间",
    "password": "密码强度不足"
  }
}
```

#### 业务逻辑错误
```json
{
  "success": false,
  "error": "BUSINESS_ERROR",
  "message": "用户名已存在",
  "code": "USERNAME_EXISTS"
}
```

#### 系统错误
```json
{
  "success": false,
  "error": "SYSTEM_ERROR",
  "message": "服务器内部错误",
  "code": "INTERNAL_ERROR"
}
```

### 错误处理最佳实践

1. **客户端错误处理**:
```javascript
try {
  const response = await fetch('/api/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ username, password })
  });
  
  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.message);
  }
  
  // 处理成功响应
  console.log('登录成功:', data.data);
} catch (error) {
  console.error('登录失败:', error.message);
}
```

2. **WebSocket 错误处理**:
```javascript
socket.on('error', (error) => {
  switch (error.code) {
    case 'TOKEN_EXPIRED':
      // 重新登录
      redirectToLogin();
      break;
    case 'RATE_LIMIT_EXCEEDED':
      // 显示限流提示
      showRateLimitWarning();
      break;
    default:
      // 显示通用错误
      showErrorMessage(error.message);
  }
});
```

## 🔧 SDK 示例

### JavaScript SDK
```javascript
class ChatRoomAPI {
  constructor(baseURL, token) {
    this.baseURL = baseURL;
    this.token = token;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`,
        ...options.headers
      },
      ...options
    };

    const response = await fetch(url, config);
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message);
    }

    return data.data;
  }

  // 用户相关
  async login(username, password) {
    return this.request('/api/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
  }

  async getProfile() {
    return this.request('/api/user/profile');
  }

  // 聊天相关
  async getChatHistory(page = 1, limit = 50) {
    return this.request(`/api/chat/history?page=${page}&limit=${limit}`);
  }

  async sendMessage(content, type = 'text') {
    return this.request('/api/chat/message', {
      method: 'POST',
      body: JSON.stringify({ content, type })
    });
  }

  // 文件上传
  async uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);

    return this.request('/api/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`
      },
      body: formData
    });
  }
}

// 使用示例
const api = new ChatRoomAPI('http://localhost:3000', 'your_jwt_token');

// 登录
const loginData = await api.login('username', 'password');
console.log('登录成功:', loginData);

// 获取聊天历史
const history = await api.getChatHistory();
console.log('聊天历史:', history);

// 发送消息
const message = await api.sendMessage('Hello, World!');
console.log('消息发送成功:', message);
```

这份 API 文档提供了完整的接口说明、数据结构定义和使用示例，帮助开发者快速集成和使用私人聊天室应用的各项功能。