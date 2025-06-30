# 安全指南 - 私人聊天室应用

本文档详细说明了私人聊天室应用的安全措施、最佳实践和安全配置指南。

## 📋 目录

- [安全概述](#安全概述)
- [认证与授权](#认证与授权)
- [数据保护](#数据保护)
- [网络安全](#网络安全)
- [文件安全](#文件安全)
- [输入验证](#输入验证)
- [会话管理](#会话管理)
- [日志与监控](#日志与监控)
- [部署安全](#部署安全)
- [安全配置](#安全配置)
- [漏洞防护](#漏洞防护)
- [应急响应](#应急响应)

## 🛡️ 安全概述

### 安全架构
私人聊天室应用采用多层安全防护架构：

1. **网络层安全**: HTTPS/WSS 加密传输
2. **应用层安全**: JWT 认证、输入验证、权限控制
3. **数据层安全**: 敏感数据加密、安全存储
4. **基础设施安全**: 服务器加固、防火墙配置

### 安全原则
- **最小权限原则**: 用户只能访问必要的资源
- **深度防御**: 多层安全控制
- **安全默认**: 默认配置采用最安全的选项
- **失败安全**: 系统故障时保持安全状态

## 🔐 认证与授权

### JWT 令牌安全

#### 令牌配置
```javascript
// 安全的 JWT 配置
const jwtConfig = {
  secret: process.env.JWT_SECRET, // 强密钥
  expiresIn: '1h', // 短期有效期
  algorithm: 'HS256', // 安全算法
  issuer: 'chat-room-app',
  audience: 'chat-room-users'
};
```

#### 令牌最佳实践
1. **强密钥**: 使用至少 256 位的随机密钥
```bash
# 生成安全密钥
openssl rand -base64 32
```

2. **短期有效期**: 设置较短的令牌有效期（1-2小时）
3. **刷新机制**: 实现令牌自动刷新
4. **安全存储**: 客户端使用 httpOnly Cookie 或安全的本地存储

#### 令牌验证中间件
```javascript
const verifyToken = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'AUTHENTICATION_ERROR',
        message: '缺少访问令牌'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 检查令牌黑名单
    if (isTokenBlacklisted(token)) {
      return res.status(401).json({
        success: false,
        error: 'AUTHENTICATION_ERROR',
        message: '令牌已失效'
      });
    }

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'AUTHENTICATION_ERROR',
      message: '令牌无效或已过期'
    });
  }
};
```

### 密码安全

#### 密码策略
```javascript
const passwordPolicy = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  preventCommonPasswords: true,
  preventUserInfo: true
};
```

#### 密码加密
```javascript
const bcrypt = require('bcrypt');

// 密码哈希
const hashPassword = async (password) => {
  const saltRounds = 12; // 高强度盐值
  return await bcrypt.hash(password, saltRounds);
};

// 密码验证
const verifyPassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};
```

#### 密码验证函数
```javascript
const validatePassword = (password) => {
  const errors = [];
  
  if (password.length < 8) {
    errors.push('密码长度至少8个字符');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('密码必须包含大写字母');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('密码必须包含小写字母');
  }
  
  if (!/\d/.test(password)) {
    errors.push('密码必须包含数字');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('密码必须包含特殊字符');
  }
  
  // 检查常见密码
  const commonPasswords = ['password', '123456', 'qwerty'];
  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('不能使用常见密码');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};
```

### 权限控制

#### 基于角色的访问控制 (RBAC)
```javascript
const roles = {
  user: {
    permissions: ['read_messages', 'send_messages', 'upload_files']
  },
  moderator: {
    permissions: ['read_messages', 'send_messages', 'upload_files', 'delete_messages', 'ban_users']
  },
  admin: {
    permissions: ['*'] // 所有权限
  }
};

const checkPermission = (userRole, requiredPermission) => {
  const userPermissions = roles[userRole]?.permissions || [];
  return userPermissions.includes('*') || userPermissions.includes(requiredPermission);
};
```

#### 权限验证中间件
```javascript
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'AUTHENTICATION_ERROR',
        message: '未认证用户'
      });
    }

    if (!checkPermission(req.user.role, permission)) {
      return res.status(403).json({
        success: false,
        error: 'PERMISSION_ERROR',
        message: '权限不足'
      });
    }

    next();
  };
};
```

## 🔒 数据保护

### 敏感数据加密

#### 数据库加密
```javascript
const crypto = require('crypto');

const encryptionKey = process.env.ENCRYPTION_KEY; // 32字节密钥
const algorithm = 'aes-256-gcm';

const encrypt = (text) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher(algorithm, encryptionKey);
  cipher.setAAD(Buffer.from('chat-room-app'));
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  };
};

const decrypt = (encryptedData) => {
  const decipher = crypto.createDecipher(algorithm, encryptionKey);
  decipher.setAAD(Buffer.from('chat-room-app'));
  decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
  
  let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
};
```

#### 个人信息保护
```javascript
// 敏感字段加密存储
const encryptUserData = (userData) => {
  const sensitiveFields = ['email', 'phone', 'realName'];
  const encrypted = { ...userData };
  
  sensitiveFields.forEach(field => {
    if (encrypted[field]) {
      encrypted[field] = encrypt(encrypted[field]);
    }
  });
  
  return encrypted;
};
```

### 数据脱敏

#### 日志脱敏
```javascript
const sanitizeForLog = (data) => {
  const sanitized = { ...data };
  
  // 移除敏感字段
  delete sanitized.password;
  delete sanitized.token;
  delete sanitized.secret;
  
  // 脱敏邮箱
  if (sanitized.email) {
    sanitized.email = sanitized.email.replace(/(.{2}).*(@.*)/, '$1***$2');
  }
  
  // 脱敏手机号
  if (sanitized.phone) {
    sanitized.phone = sanitized.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
  }
  
  return sanitized;
};
```

#### API 响应脱敏
```javascript
const sanitizeUserForResponse = (user) => {
  const { password, salt, ...safeUser } = user;
  return safeUser;
};
```

## 🌐 网络安全

### HTTPS 配置

#### SSL/TLS 设置
```javascript
const https = require('https');
const fs = require('fs');

const sslOptions = {
  key: fs.readFileSync('path/to/private-key.pem'),
  cert: fs.readFileSync('path/to/certificate.pem'),
  // 强制使用 TLS 1.2+
  secureProtocol: 'TLSv1_2_method',
  // 禁用不安全的密码套件
  ciphers: [
    'ECDHE-RSA-AES256-GCM-SHA384',
    'ECDHE-RSA-AES128-GCM-SHA256',
    'ECDHE-RSA-AES256-SHA384',
    'ECDHE-RSA-AES128-SHA256'
  ].join(':'),
  honorCipherOrder: true
};

const server = https.createServer(sslOptions, app);
```

#### 安全头配置
```javascript
const helmet = require('helmet');

app.use(helmet({
  // 内容安全策略
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "wss:"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  // 严格传输安全
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  // 防止点击劫持
  frameguard: { action: 'deny' },
  // 防止 MIME 类型嗅探
  noSniff: true,
  // XSS 保护
  xssFilter: true
}));
```

### WebSocket 安全

#### WSS 配置
```javascript
const io = require('socket.io')(server, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    methods: ['GET', 'POST'],
    credentials: true
  },
  // 启用压缩
  compression: true,
  // 连接超时
  pingTimeout: 60000,
  pingInterval: 25000
});
```

#### WebSocket 认证
```javascript
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.userId;
    socket.userRole = decoded.role;
    next();
  } catch (error) {
    next(new Error('认证失败'));
  }
});
```

### 跨域资源共享 (CORS)

#### CORS 配置
```javascript
const cors = require('cors');

const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
    
    // 允许无 origin 的请求（移动应用等）
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('不允许的跨域请求'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400 // 预检请求缓存时间
};

app.use(cors(corsOptions));
```

## 📁 文件安全

### 文件上传安全

#### 文件类型验证
```javascript
const allowedMimeTypes = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'text/plain',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

const validateFileType = (file) => {
  return allowedMimeTypes.includes(file.mimetype);
};
```

#### 文件大小限制
```javascript
const multer = require('multer');

const upload = multer({
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
    files: 1
  },
  fileFilter: (req, file, cb) => {
    if (validateFileType(file)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件类型'), false);
    }
  }
});
```

#### 文件内容扫描
```javascript
const virusScanner = require('clamscan');

const scanFile = async (filePath) => {
  try {
    const clamscan = await new virusScanner().init();
    const scanResult = await clamscan.scanFile(filePath);
    
    if (scanResult.isInfected) {
      throw new Error('文件包含恶意内容');
    }
    
    return true;
  } catch (error) {
    throw new Error('文件扫描失败');
  }
};
```

#### 安全文件存储
```javascript
const path = require('path');
const crypto = require('crypto');

const generateSecureFilename = (originalName) => {
  const ext = path.extname(originalName);
  const hash = crypto.randomBytes(16).toString('hex');
  return `${hash}${ext}`;
};

const getSecureUploadPath = (filename) => {
  // 使用哈希分目录存储
  const hash = crypto.createHash('md5').update(filename).digest('hex');
  const subDir = hash.substring(0, 2);
  return path.join(process.env.UPLOAD_PATH, subDir, filename);
};
```

### 文件访问控制

#### 文件权限验证
```javascript
const checkFileAccess = async (userId, fileId) => {
  const file = await getFileById(fileId);
  
  if (!file) {
    throw new Error('文件不存在');
  }
  
  // 检查文件所有者或管理员权限
  if (file.uploadedBy !== userId && !isAdmin(userId)) {
    throw new Error('无权访问此文件');
  }
  
  return true;
};
```

#### 安全文件下载
```javascript
app.get('/api/files/:fileId/download', verifyToken, async (req, res) => {
  try {
    await checkFileAccess(req.user.userId, req.params.fileId);
    
    const file = await getFileById(req.params.fileId);
    const filePath = getSecureUploadPath(file.filename);
    
    // 设置安全响应头
    res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    res.sendFile(filePath);
  } catch (error) {
    res.status(403).json({
      success: false,
      message: error.message
    });
  }
});
```

## ✅ 输入验证

### 数据验证

#### 输入验证中间件
```javascript
const { body, validationResult } = require('express-validator');

const validateInput = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      error: 'VALIDATION_ERROR',
      message: '输入验证失败',
      details: errors.array()
    });
  }
  
  next();
};
```

#### 用户注册验证
```javascript
const registerValidation = [
  body('username')
    .isLength({ min: 3, max: 20 })
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('用户名只能包含字母、数字和下划线'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('请输入有效的邮箱地址'),
  
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('密码必须包含大小写字母、数字和特殊字符'),
  
  validateInput
];
```

#### 消息内容验证
```javascript
const messageValidation = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('消息内容长度必须在1-2000个字符之间'),
  
  body('type')
    .isIn(['text', 'image', 'file'])
    .withMessage('无效的消息类型'),
  
  validateInput
];
```

### XSS 防护

#### 内容过滤
```javascript
const DOMPurify = require('isomorphic-dompurify');

const sanitizeContent = (content) => {
  // 清理 HTML 标签
  const clean = DOMPurify.sanitize(content, {
    ALLOWED_TAGS: [], // 不允许任何 HTML 标签
    ALLOWED_ATTR: []
  });
  
  return clean;
};
```

#### 输出编码
```javascript
const escapeHtml = (text) => {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  
  return text.replace(/[&<>"']/g, (m) => map[m]);
};
```

### SQL 注入防护

#### 参数化查询
```javascript
// 使用参数化查询防止 SQL 注入
const getUserByUsername = async (username) => {
  const query = 'SELECT * FROM users WHERE username = ?';
  const result = await db.query(query, [username]);
  return result[0];
};
```

#### 输入清理
```javascript
const sanitizeInput = (input) => {
  if (typeof input !== 'string') {
    return input;
  }
  
  // 移除危险字符
  return input.replace(/['"\\;]/g, '');
};
```

## 🔄 会话管理

### 会话安全

#### 会话配置
```javascript
const session = require('express-session');
const MongoStore = require('connect-mongo');

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only
    httpOnly: true, // 防止 XSS
    maxAge: 1000 * 60 * 60 * 24, // 24小时
    sameSite: 'strict' // CSRF 保护
  }
}));
```

#### 会话固定攻击防护
```javascript
const regenerateSession = (req) => {
  return new Promise((resolve, reject) => {
    req.session.regenerate((err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

// 登录后重新生成会话 ID
app.post('/api/login', async (req, res) => {
  try {
    // 验证用户凭据
    const user = await authenticateUser(req.body.username, req.body.password);
    
    // 重新生成会话 ID
    await regenerateSession(req);
    
    req.session.userId = user.id;
    
    res.json({ success: true, user });
  } catch (error) {
    res.status(401).json({ success: false, message: error.message });
  }
});
```

### 令牌黑名单

#### 令牌撤销
```javascript
const tokenBlacklist = new Set();

const blacklistToken = (token) => {
  tokenBlacklist.add(token);
  
  // 设置过期时间清理
  const decoded = jwt.decode(token);
  const expiresIn = decoded.exp * 1000 - Date.now();
  
  setTimeout(() => {
    tokenBlacklist.delete(token);
  }, expiresIn);
};

const isTokenBlacklisted = (token) => {
  return tokenBlacklist.has(token);
};
```

#### 退出登录
```javascript
app.post('/api/logout', verifyToken, (req, res) => {
  const token = req.headers.authorization.split(' ')[1];
  blacklistToken(token);
  
  res.json({
    success: true,
    message: '退出登录成功'
  });
});
```

## 📊 日志与监控

### 安全日志

#### 日志配置
```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/security.log', level: 'warn' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});
```

#### 安全事件记录
```javascript
const logSecurityEvent = (event, details) => {
  logger.warn('Security Event', {
    event,
    details: sanitizeForLog(details),
    timestamp: new Date().toISOString(),
    ip: details.ip,
    userAgent: details.userAgent
  });
};

// 登录失败记录
const logFailedLogin = (username, ip, userAgent) => {
  logSecurityEvent('FAILED_LOGIN', {
    username,
    ip,
    userAgent,
    severity: 'medium'
  });
};

// 权限违规记录
const logPermissionViolation = (userId, action, resource) => {
  logSecurityEvent('PERMISSION_VIOLATION', {
    userId,
    action,
    resource,
    severity: 'high'
  });
};
```

### 入侵检测

#### 暴力破解检测
```javascript
const loginAttempts = new Map();

const checkBruteForce = (ip) => {
  const attempts = loginAttempts.get(ip) || { count: 0, lastAttempt: 0 };
  const now = Date.now();
  
  // 重置计数器（1小时后）
  if (now - attempts.lastAttempt > 3600000) {
    attempts.count = 0;
  }
  
  attempts.count++;
  attempts.lastAttempt = now;
  loginAttempts.set(ip, attempts);
  
  // 超过5次失败则锁定1小时
  if (attempts.count > 5) {
    throw new Error('登录尝试过于频繁，请稍后再试');
  }
};
```

#### 异常行为检测
```javascript
const detectAnomalousActivity = (userId, action) => {
  const userActivity = getUserActivity(userId);
  
  // 检测异常登录位置
  if (action === 'login' && isUnusualLocation(userActivity.lastLoginLocation, getCurrentLocation())) {
    logSecurityEvent('UNUSUAL_LOGIN_LOCATION', { userId });
    // 发送安全警告邮件
    sendSecurityAlert(userId, 'unusual_location');
  }
  
  // 检测异常活动时间
  if (isUnusualTime(userActivity.normalActiveHours, new Date().getHours())) {
    logSecurityEvent('UNUSUAL_ACTIVITY_TIME', { userId });
  }
};
```

## 🚀 部署安全

### 环境配置

#### 生产环境变量
```bash
# .env.production
NODE_ENV=production

# 强密钥配置
JWT_SECRET=your-super-secure-jwt-secret-key-here
SESSION_SECRET=your-super-secure-session-secret-key-here
ENCRYPTION_KEY=your-32-byte-encryption-key-here

# 数据库安全配置
DB_SSL=true
DB_SSL_VALIDATE=true

# 安全头配置
HSTS_MAX_AGE=31536000
CSP_REPORT_URI=https://your-domain.com/csp-report

# 允许的域名
ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com

# 文件上传限制
MAX_FILE_SIZE=52428800
ALLOWED_FILE_TYPES=image/jpeg,image/png,text/plain,application/pdf
```

#### Docker 安全配置
```dockerfile
# 使用非 root 用户
FROM node:16-alpine
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# 设置安全的文件权限
COPY --chown=nextjs:nodejs . .
USER nextjs

# 移除不必要的包
RUN apk del .build-deps

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1
```

### 服务器加固

#### 防火墙配置
```bash
# UFW 防火墙配置
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# 限制 SSH 访问
sudo ufw limit ssh
```

#### 系统安全配置
```bash
# 禁用不必要的服务
sudo systemctl disable telnet
sudo systemctl disable ftp
sudo systemctl disable rsh

# 设置自动安全更新
sudo apt install unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades

# 配置 fail2ban
sudo apt install fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

## 🛡️ 漏洞防护

### 常见漏洞防护

#### CSRF 防护
```javascript
const csrf = require('csurf');

const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  }
});

app.use(csrfProtection);

// 提供 CSRF 令牌
app.get('/api/csrf-token', (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});
```

#### 点击劫持防护
```javascript
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Content-Security-Policy', "frame-ancestors 'none'");
  next();
});
```

#### 目录遍历防护
```javascript
const path = require('path');

const validateFilePath = (filePath) => {
  const normalizedPath = path.normalize(filePath);
  const uploadDir = path.resolve(process.env.UPLOAD_PATH);
  
  if (!normalizedPath.startsWith(uploadDir)) {
    throw new Error('非法文件路径');
  }
  
  return normalizedPath;
};
```

### 依赖安全

#### 依赖扫描
```bash
# 使用 npm audit 检查漏洞
npm audit

# 自动修复漏洞
npm audit fix

# 使用 Snyk 进行深度扫描
npm install -g snyk
snyk test
snyk monitor
```

#### 依赖更新策略
```json
{
  "scripts": {
    "security-check": "npm audit && snyk test",
    "update-deps": "npm update && npm audit fix"
  }
}
```

## 🚨 应急响应

### 安全事件响应
#### 事件分类
1. **低风险事件**: 单次登录失败、轻微的输入验证错误
2. **中风险事件**: 多次登录失败、权限违规尝试、异常文件上传
3. **高风险事件**: 暴力破解攻击、SQL注入尝试、恶意文件上传
4. **严重事件**: 数据泄露、系统入侵、服务拒绝攻击

#### 响应流程
```javascript
const securityIncidentResponse = {
  // 低风险事件
  low: {
    actions: ['记录日志', '监控趋势'],
    notification: false,
    escalation: false
  },
  
  // 中风险事件
  medium: {
    actions: ['记录日志', '增强监控', '发送警告'],
    notification: true,
    escalation: false,
    responseTime: '1小时内'
  },
  
  // 高风险事件
  high: {
    actions: ['立即记录', '阻止IP', '通知管理员', '增强防护'],
    notification: true,
    escalation: true,
    responseTime: '15分钟内'
  },
  
  // 严重事件
  critical: {
    actions: ['立即隔离', '通知所有管理员', '启动应急预案'],
    notification: true,
    escalation: true,
    responseTime: '立即'
  }
};
```

#### 自动响应机制
```javascript
const autoResponse = {
  // IP 封禁
  blockIP: (ip, duration = 3600000) => {
    blockedIPs.set(ip, Date.now() + duration);
    logger.warn('IP Blocked', { ip, duration });
  },
  
  // 用户账户锁定
  lockAccount: (userId, reason) => {
    updateUserStatus(userId, 'locked');
    logSecurityEvent('ACCOUNT_LOCKED', { userId, reason });
  },
  
  // 服务降级
  degradeService: () => {
    enableRateLimit(true);
    disableFileUpload(true);
    logger.warn('Service Degraded due to security threat');
  }
};
```

### 数据泄露响应

#### 泄露检测
```javascript
const detectDataBreach = {
  // 异常数据访问检测
  checkUnusualAccess: (userId, accessPattern) => {
    const baseline = getUserAccessBaseline(userId);
    
    if (accessPattern.volume > baseline.volume * 10) {
      logSecurityEvent('UNUSUAL_DATA_ACCESS', {
        userId,
        volume: accessPattern.volume,
        baseline: baseline.volume
      });
      
      return true;
    }
    
    return false;
  },
  
  // 大量数据导出检测
  checkBulkExport: (userId, exportSize) => {
    const threshold = 1000; // 1000条记录
    
    if (exportSize > threshold) {
      logSecurityEvent('BULK_DATA_EXPORT', {
        userId,
        exportSize,
        threshold
      });
      
      return true;
    }
    
    return false;
  }
};
```

#### 泄露响应计划
```javascript
const dataBreachResponse = {
  // 立即响应
  immediate: [
    '隔离受影响系统',
    '停止数据泄露',
    '保护证据',
    '通知安全团队'
  ],
  
  // 短期响应（24小时内）
  shortTerm: [
    '评估泄露范围',
    '通知受影响用户',
    '修复安全漏洞',
    '加强监控'
  ],
  
  // 长期响应（1周内）
  longTerm: [
    '完整安全审计',
    '更新安全策略',
    '员工安全培训',
    '第三方安全评估'
  ]
};
```

### 恢复计划

#### 系统恢复
```bash
#!/bin/bash
# 安全事件恢复脚本

# 1. 停止服务
sudo systemctl stop chat-room

# 2. 备份当前状态
sudo tar -czf /backup/incident-$(date +%Y%m%d_%H%M%S).tar.gz /app/chat-room

# 3. 恢复到安全状态
sudo git checkout main
sudo git pull origin main

# 4. 重新安装依赖
npm ci --production

# 5. 更新安全配置
sudo cp /secure-configs/.env.production .env

# 6. 重启服务
sudo systemctl start chat-room

# 7. 验证服务状态
sudo systemctl status chat-room
```

#### 数据恢复
```javascript
const dataRecovery = {
  // 从备份恢复
  restoreFromBackup: async (backupDate) => {
    try {
      const backupFile = `backup-${backupDate}.sql`;
      await executeCommand(`mysql -u root -p chat_room < ${backupFile}`);
      logger.info('Data restored from backup', { backupDate });
    } catch (error) {
      logger.error('Data recovery failed', { error: error.message });
      throw error;
    }
  },
  
  // 验证数据完整性
  verifyDataIntegrity: async () => {
    const checks = [
      'SELECT COUNT(*) FROM users',
      'SELECT COUNT(*) FROM messages',
      'SELECT COUNT(*) FROM files'
    ];
    
    for (const check of checks) {
      const result = await db.query(check);
      logger.info('Data integrity check', { query: check, result });
    }
  }
};
```

## 📋 安全检查清单

### 部署前检查

#### 代码安全检查
- [ ] 移除所有调试代码和注释
- [ ] 检查硬编码的密钥和密码
- [ ] 验证所有输入验证规则
- [ ] 确认错误处理不泄露敏感信息
- [ ] 检查依赖包漏洞

#### 配置安全检查
- [ ] 强密钥配置（JWT、Session、加密）
- [ ] HTTPS/WSS 强制启用
- [ ] 安全头配置正确
- [ ] CORS 策略配置合理
- [ ] 文件上传限制配置

#### 服务器安全检查
- [ ] 防火墙规则配置
- [ ] SSH 密钥认证
- [ ] 自动安全更新启用
- [ ] 日志监控配置
- [ ] 备份策略实施

### 运行时监控

#### 安全监控指标
```javascript
const securityMetrics = {
  // 认证相关
  authentication: {
    failedLogins: 0,
    suspiciousLogins: 0,
    tokenViolations: 0
  },
  
  // 访问控制
  accessControl: {
    permissionViolations: 0,
    unauthorizedAccess: 0,
    privilegeEscalation: 0
  },
  
  // 数据保护
  dataProtection: {
    unusualDataAccess: 0,
    bulkDataExport: 0,
    sensitiveDataExposure: 0
  },
  
  // 网络安全
  networkSecurity: {
    suspiciousTraffic: 0,
    ddosAttempts: 0,
    maliciousRequests: 0
  }
};
```

#### 告警阈值
```javascript
const alertThresholds = {
  failedLogins: { warning: 10, critical: 50 },
  permissionViolations: { warning: 5, critical: 20 },
  unusualDataAccess: { warning: 3, critical: 10 },
  suspiciousTraffic: { warning: 100, critical: 500 }
};
```

### 定期安全审计

#### 月度安全检查
- [ ] 用户权限审计
- [ ] 日志分析和异常检测
- [ ] 依赖包安全更新
- [ ] 备份完整性验证
- [ ] 安全配置复查

#### 季度安全评估
- [ ] 渗透测试
- [ ] 代码安全审计
- [ ] 第三方安全评估
- [ ] 安全培训更新
- [ ] 应急预案演练

#### 年度安全规划
- [ ] 安全策略更新
- [ ] 安全架构评估
- [ ] 合规性检查
- [ ] 安全投资规划
- [ ] 安全团队培训

## 🔗 安全资源

### 安全工具推荐

#### 代码安全扫描
- **ESLint Security Plugin**: JavaScript 安全规则检查
- **Snyk**: 依赖漏洞扫描
- **SonarQube**: 代码质量和安全分析
- **OWASP ZAP**: Web 应用安全测试

#### 运行时保护
- **Helmet.js**: Express 安全头中间件
- **Rate Limiter**: API 限流保护
- **CSRF Protection**: CSRF 攻击防护
- **Input Validation**: 输入验证库

#### 监控和日志
- **Winston**: 结构化日志记录
- **Morgan**: HTTP 请求日志
- **Prometheus**: 指标监控
- **Grafana**: 监控仪表板

### 安全标准参考

#### OWASP Top 10
1. 注入攻击防护
2. 失效的身份认证
3. 敏感数据泄露
4. XML 外部实体攻击
5. 失效的访问控制
6. 安全配置错误
7. 跨站脚本攻击
8. 不安全的反序列化
9. 使用含有已知漏洞的组件
10. 不足的日志记录和监控

#### 安全框架
- **NIST Cybersecurity Framework**: 网络安全框架
- **ISO 27001**: 信息安全管理体系
- **CIS Controls**: 关键安全控制措施

### 安全培训资源

#### 在线课程
- OWASP WebGoat: Web 应用安全实践
- PortSwigger Web Security Academy: Web 安全学院
- Cybrary: 网络安全在线课程

#### 安全社区
- OWASP 社区: 开放式 Web 应用安全项目
- Security Stack Exchange: 安全问答社区
- Reddit r/netsec: 网络安全讨论

## 📞 安全联系方式

### 安全事件报告
- **邮箱**: security@your-domain.com
- **电话**: +86-xxx-xxxx-xxxx
- **紧急联系**: 24/7 安全热线

### 漏洞披露
- **负责任披露**: 遵循负责任的漏洞披露原则
- **响应时间**: 24小时内确认，7天内初步响应
- **奖励计划**: 根据漏洞严重程度提供奖励

---

**注意**: 本安全指南应定期更新，以应对新出现的安全威胁和最佳实践的变化。建议每季度审查一次，确保安全措施的有效性和时效性。

**免责声明**: 本指南提供的安全建议基于当前的最佳实践，但不能保证绝对的安全性。实施时应根据具体环境和需求进行调整。