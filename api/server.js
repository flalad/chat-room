const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const AWS = require('aws-sdk');

// 导入存储系统
const StorageFactory = require('../src/storage/storage-factory');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// 配置
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'admin-secret-key-change-in-production';

// 初始化存储系统
const storage = StorageFactory.createStorage(process.env);

// 内存存储（仅用于连接用户和临时数据）
const connectedUsers = new Map();
const uploadedFiles = new Map();

// 管理员配置获取函数
async function getAdminConfig() {
    // 优先使用环境变量
    if (process.env.ADMIN_USERNAME) {
        return {
            username: process.env.ADMIN_USERNAME,
            password: process.env.ADMIN_PASSWORD_HASH,
            plainPassword: process.env.ADMIN_PASSWORD
        };
    }
    
    // 从存储系统获取
    const username = await storage.getAdminConfig('admin_username');
    const passwordHash = await storage.getAdminConfig('admin_password_hash');
    const plainPassword = await storage.getAdminConfig('admin_password');
    
    return {
        username: username || 'admin',
        password: passwordHash,
        plainPassword: plainPassword
    };
}

// 检查生产环境管理员配置
async function checkAdminConfig() {
    const config = await getAdminConfig();
    
    if (process.env.NODE_ENV === 'production' && (!config.username || (!config.password && !config.plainPassword))) {
        console.warn('⚠️ 生产环境警告: 建议设置管理员账户环境变量');
        console.warn('请设置以下环境变量之一:');
        console.warn('');
        console.warn('方式1 - 明文密码（简单）:');
        console.warn('  ADMIN_USERNAME=your_admin_username');
        console.warn('  ADMIN_PASSWORD=your_plain_password');
        console.warn('');
        console.warn('方式2 - 哈希密码（更安全）:');
        console.warn('  ADMIN_USERNAME=your_admin_username');
        console.warn('  ADMIN_PASSWORD_HASH=your_bcrypt_hashed_password');
        console.warn('');
        console.warn('方式3 - 数据库配置:');
        console.warn('  DATABASE_URL=your_database_connection_string');
        console.warn('');
        console.warn('当前使用默认管理员配置，请尽快更改！');
    }
}

// 初始化管理员配置检查
checkAdminConfig().catch(console.error);

// 系统设置
const systemSettings = {
    maxFileSize: 50 * 1024 * 1024, // 50MB
    allowedFileTypes: 'image/*,video/*,audio/*,.pdf,.doc,.docx,.txt',
    s3Config: null,
    storageLimit: 0 // 0 = 无限制，单位：字节
};

// S3配置存储（内存中，生产环境应使用数据库）
const s3Configs = new Map();
let s3ConfigIdCounter = 1;

// JWT中间件
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: '访问令牌缺失' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: '访问令牌无效' });
        }
        req.user = user;
        next();
    });
};

// 管理员JWT中间件
const authenticateAdmin = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: '管理员访问令牌缺失' });
    }

    jwt.verify(token, ADMIN_JWT_SECRET, (err, admin) => {
        if (err) {
            return res.status(403).json({ message: '管理员访问令牌无效' });
        }
        req.admin = admin;
        next();
    });
};

// 认证API路由
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, password } = req.body;

        // 验证输入
        if (!username || !password) {
            return res.status(400).json({ message: '用户名和密码不能为空' });
        }

        if (username.length < 3 || username.length > 20) {
            return res.status(400).json({ message: '用户名长度必须在3-20个字符之间' });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: '密码长度至少6个字符' });
        }

        // 检查用户是否已存在
        const existingUser = await storage.getUser(username);
        if (existingUser) {
            return res.status(400).json({ message: '用户名已存在' });
        }

        // 加密密码
        const hashedPassword = await bcrypt.hash(password, 10);

        // 创建用户
        const user = {
            username,
            password: hashedPassword,
            createdAt: new Date().toISOString()
        };

        await storage.saveUser(user);

        res.status(201).json({
            message: '注册成功',
            user: { username, createdAt: user.createdAt }
        });

    } catch (error) {
        console.error('注册错误:', error);
        res.status(500).json({ message: '服务器内部错误' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // 验证输入
        if (!username || !password) {
            return res.status(400).json({ message: '用户名和密码不能为空' });
        }

        // 查找用户
        const user = await storage.getUser(username);
        if (!user) {
            return res.status(401).json({ message: '用户名或密码错误' });
        }

        // 验证密码
        const isValidPassword = await bcrypt.compare(password, user.password || user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({ message: '用户名或密码错误' });
        }

        // 生成JWT令牌
        const token = jwt.sign(
            { username: user.username },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: '登录成功',
            token,
            user: {
                username: user.username,
                createdAt: user.createdAt || user.created_at
            }
        });

    } catch (error) {
        console.error('登录错误:', error);
        res.status(500).json({ message: '服务器内部错误' });
    }
});

app.get('/api/auth/verify', authenticateToken, (req, res) => {
    res.json({ 
        valid: true,
        user: { username: req.user.username }
    });
});

app.post('/api/auth/logout', authenticateToken, (req, res) => {
    // 在实际应用中，这里可以将token加入黑名单
    res.json({ message: '退出登录成功' });
});

// HTTP聊天API（Vercel兼容，无需认证）
app.get('/api/messages/history', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 100;
        const messages = await storage.getMessages(limit);
        
        res.json({
            success: true,
            messages: messages,
            count: messages.length
        });
    } catch (error) {
        console.error('获取消息历史失败:', error);
        res.status(500).json({ message: '获取消息历史失败' });
    }
});

app.get('/api/messages/poll', async (req, res) => {
    try {
        const afterId = req.query.after;
        const messages = await storage.getMessages(50);
        
        let newMessages = messages;
        if (afterId) {
            const afterIndex = messages.findIndex(msg => msg.id === afterId);
            newMessages = afterIndex >= 0 ? messages.slice(afterIndex + 1) : [];
        }
        
        res.json({
            success: true,
            messages: newMessages,
            count: newMessages.length
        });
    } catch (error) {
        console.error('轮询消息失败:', error);
        res.status(500).json({ message: '轮询消息失败' });
    }
});

app.post('/api/messages/send', async (req, res) => {
    try {
        const { content, type = 'text', username = '匿名用户' } = req.body;
        
        if (!content || content.trim().length === 0) {
            return res.status(400).json({ message: '消息内容不能为空' });
        }
        
        if (content.length > 1000) {
            return res.status(400).json({ message: '消息长度不能超过1000个字符' });
        }
        
        const message = {
            id: require('crypto').randomUUID(),
            type: type,
            username: username,
            content: content.trim(),
            timestamp: new Date().toISOString()
        };
        
        await storage.saveMessage(message);
        
        res.json({
            success: true,
            message: '消息发送成功',
            data: message
        });
        
        console.log(`HTTP消息来自 ${username}: ${content}`);
    } catch (error) {
        console.error('发送消息失败:', error);
        res.status(500).json({ message: '发送消息失败' });
    }
});

app.get('/api/users/online', (req, res) => {
    try {
        const onlineUsers = Array.from(connectedUsers.values());
        res.json({
            success: true,
            users: onlineUsers,
            count: onlineUsers.length
        });
    } catch (error) {
        console.error('获取在线用户失败:', error);
        res.status(500).json({ message: '获取在线用户失败' });
    }
});

// 调试API（仅在开发环境）
app.get('/api/debug/info', (req, res) => {
    if (process.env.NODE_ENV !== 'production') {
        res.json({
            environment: process.env.NODE_ENV,
            hasJwtSecret: !!process.env.JWT_SECRET,
            hasAdminJwtSecret: !!process.env.ADMIN_JWT_SECRET,
            hasDatabaseUrl: !!process.env.DATABASE_URL,
            jwtSecretLength: JWT_SECRET.length,
            adminJwtSecretLength: ADMIN_JWT_SECRET.length
        });
    } else {
        res.status(404).json({ message: 'Not found' });
    }
});

// 管理员API路由
app.post('/api/admin/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // 验证输入
        if (!username || !password) {
            return res.status(400).json({ message: '用户名和密码不能为空' });
        }

        // 获取管理员配置
        const adminConfig = await getAdminConfig();

        // 检查管理员配置是否存在
        if (!adminConfig.username || (!adminConfig.password && !adminConfig.plainPassword)) {
            return res.status(503).json({ message: '管理员功能未配置，请联系系统管理员设置环境变量' });
        }

        // 验证管理员凭据
        if (username !== adminConfig.username) {
            return res.status(401).json({ message: '管理员用户名或密码错误' });
        }

        // 支持明文密码和哈希密码两种方式
        let isValidPassword = false;
        if (adminConfig.plainPassword) {
            // 使用明文密码验证
            isValidPassword = (password === adminConfig.plainPassword);
        } else if (adminConfig.password) {
            // 使用哈希密码验证
            isValidPassword = await bcrypt.compare(password, adminConfig.password);
        }

        if (!isValidPassword) {
            return res.status(401).json({ message: '管理员用户名或密码错误' });
        }

        // 生成管理员JWT令牌
        const token = jwt.sign(
            { username: adminConfig.username, role: 'admin' },
            ADMIN_JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: '管理员登录成功',
            token,
            admin: {
                username: adminConfig.username,
                role: 'admin'
            }
        });

    } catch (error) {
        console.error('管理员登录错误:', error);
        res.status(500).json({ message: '服务器内部错误' });
    }
});

app.get('/api/admin/verify', authenticateAdmin, (req, res) => {
    res.json({
        valid: true,
        admin: { username: req.admin.username, role: req.admin.role }
    });
});

app.get('/api/admin/dashboard', authenticateAdmin, async (req, res) => {
    try {
        const onlineUsers = connectedUsers.size;
        
        // 从数据库获取消息
        const allMessages = await storage.getMessages(1000);
        const todayMessages = allMessages.filter(msg => {
            const today = new Date().toDateString();
            const msgDate = new Date(msg.timestamp).toDateString();
            return msgDate === today;
        }).length;
        
        const totalFiles = uploadedFiles.size;
        const storageUsed = Array.from(uploadedFiles.values()).reduce((total, file) => total + (file.size || 0), 0);
        
        const recentActivities = allMessages.slice(-10).map(msg => ({
            timestamp: msg.timestamp,
            username: msg.username || 'System',
            action: msg.type === 'file' ? '上传文件' : '发送消息',
            status: 'online'
        }));

        res.json({
            onlineUsers,
            todayMessages,
            totalFiles,
            storageUsed,
            recentActivities
        });

    } catch (error) {
        console.error('获取仪表板数据错误:', error);
        res.status(500).json({ message: '服务器内部错误' });
    }
});

app.get('/api/admin/s3-config', authenticateAdmin, (req, res) => {
    try {
        const config = systemSettings.s3Config;
        if (config) {
            // 不返回敏感信息
            const safeConfig = {
                provider: config.provider,
                endpoint: config.endpoint,
                bucket: config.bucket,
                region: config.region,
                directory: config.directory
            };
            res.json({ data: safeConfig });
        } else {
            res.json({ data: null });
        }
    } catch (error) {
        console.error('获取S3配置错误:', error);
        res.status(500).json({ message: '服务器内部错误' });
    }
});

app.post('/api/admin/s3-config', authenticateAdmin, (req, res) => {
    try {
        const {
            provider,
            endpoint,
            bucket,
            region,
            accessKey,
            secretKey,
            directory,
            storageLimit,
            enableCDN
        } = req.body;

        // 验证必填字段
        if (!provider || !bucket || !region || !accessKey || !secretKey) {
            return res.status(400).json({ message: '请填写完整的S3配置信息' });
        }

        // 对于某些提供商，端点是必需的
        const requiresEndpoint = ['cloudflare', 'minio', 'other', 'aliyun', 'tencent', 'qiniu'];
        if (requiresEndpoint.includes(provider) && !endpoint) {
            return res.status(400).json({ message: '该存储提供商需要填写自定义端点' });
        }

        // 设置默认端点
        let finalEndpoint = endpoint;
        if (!finalEndpoint && provider === 'aws') {
            finalEndpoint = `https://s3.${region}.amazonaws.com`;
        }

        // 保存S3配置到系统设置
        systemSettings.s3Config = {
            provider,
            endpoint: finalEndpoint,
            bucket,
            region,
            accessKey,
            secretKey,
            directory: directory || 'chat-files/',
            enableCDN: enableCDN === 'on' || enableCDN === true,
            updatedAt: new Date().toISOString()
        };

        // 保存存储限制
        const limitMB = parseInt(storageLimit) || 0;
        systemSettings.storageLimit = limitMB * 1024 * 1024; // 转换为字节

        res.json({
            message: 'S3配置保存成功',
            config: {
                provider,
                endpoint: finalEndpoint,
                bucket,
                region,
                directory: directory || 'chat-files/',
                storageLimit: limitMB,
                enableCDN: systemSettings.s3Config.enableCDN
            }
        });

    } catch (error) {
        console.error('保存S3配置错误:', error);
        res.status(500).json({ message: '服务器内部错误' });
    }
});

// 测试S3配置连接的辅助函数
async function testS3ConfigConnection(config) {
    try {
        // 配置AWS SDK
        const s3 = new AWS.S3({
            endpoint: new AWS.Endpoint(config.endpoint),
            accessKeyId: config.accessKey,
            secretAccessKey: config.secretKey,
            region: config.region,
            s3ForcePathStyle: true,
            signatureVersion: 'v4'
        });

        // 1. 测试存储桶访问
        await s3.headBucket({ Bucket: config.bucket }).promise();

        // 2. 测试文件上传
        const testFileName = `test-${Date.now()}.txt`;
        const testKey = `${config.directory || 'chat-files/'}${testFileName}`;
        const testContent = 'This is a test file for S3 connection verification.';

        await s3.putObject({
            Bucket: config.bucket,
            Key: testKey,
            Body: testContent,
            ContentType: 'text/plain'
        }).promise();

        // 3. 测试文件读取
        await s3.getObject({
            Bucket: config.bucket,
            Key: testKey
        }).promise();

        // 4. 删除测试文件
        await s3.deleteObject({
            Bucket: config.bucket,
            Key: testKey
        }).promise();

        return {
            success: true,
            message: 'S3连接测试成功！文件上传、读取和删除测试通过。'
        };

    } catch (error) {
        console.error('S3连接测试失败:', error);
        return {
            success: false,
            message: `连接测试失败: ${error.message}`
        };
    }
}

app.post('/api/admin/test-s3', authenticateAdmin, async (req, res) => {
    try {
        const { provider, endpoint, bucket, region, accessKey, secretKey, directory } = req.body;

        // 验证必填字段
        const requiresEndpoint = ['cloudflare', 'minio', 'other', 'aliyun', 'tencent', 'qiniu'];
        if (!provider || !bucket || !region || !accessKey || !secretKey) {
            return res.status(400).json({ message: '请填写完整的S3配置信息' });
        }

        if (requiresEndpoint.includes(provider) && !endpoint) {
            return res.status(400).json({ message: '该存储提供商需要填写自定义端点' });
        }

        // 设置默认端点
        let finalEndpoint = endpoint;
        if (!finalEndpoint && provider === 'aws') {
            finalEndpoint = `https://s3.${region}.amazonaws.com`;
        }

        const testConfig = {
            provider,
            endpoint: finalEndpoint,
            bucket,
            region,
            accessKey,
            secretKey,
            directory: directory || 'chat-files/'
        };

        const result = await testS3ConfigConnection(testConfig);
        res.json(result);

    } catch (error) {
        console.error('S3测试错误:', error);
        res.status(500).json({ message: '服务器内部错误' });
    }
});

// S3配置管理API
// 获取所有S3配置
app.get('/api/admin/s3-configs', authenticateAdmin, (req, res) => {
    try {
        console.log('获取S3配置列表请求，当前配置数量:', s3Configs.size);
        
        const configs = Array.from(s3Configs.values()).map(config => ({
            ...config,
            // 不返回敏感信息
            accessKey: config.accessKey ? config.accessKey.substring(0, 8) + '***' : '',
            secretKey: '***'
        }));
        
        console.log('返回配置列表:', configs.length, '个配置');
        res.json({ configs });
    } catch (error) {
        console.error('获取S3配置列表错误:', error);
        res.status(500).json({ message: '服务器内部错误' });
    }
});

// 获取单个S3配置
app.get('/api/admin/s3-configs/:id', authenticateAdmin, (req, res) => {
    try {
        const configId = req.params.id;
        const config = s3Configs.get(configId);
        
        if (!config) {
            return res.status(404).json({ message: '配置不存在' });
        }
        
        res.json({ data: config });
    } catch (error) {
        console.error('获取S3配置错误:', error);
        res.status(500).json({ message: '服务器内部错误' });
    }
});

// 创建S3配置
app.post('/api/admin/s3-configs', authenticateAdmin, (req, res) => {
    try {
        console.log('创建S3配置请求，请求体:', { ...req.body, secretKey: '***' });
        
        const {
            configName,
            provider,
            endpoint,
            bucket,
            region,
            accessKey,
            secretKey,
            directory,
            storageLimit,
            enableCDN,
            isDefault
        } = req.body;

        // 验证必填字段
        if (!configName || !provider || !bucket || !region || !accessKey || !secretKey) {
            console.log('验证失败，缺少必填字段');
            return res.status(400).json({ message: '请填写完整的S3配置信息' });
        }

        // 对于某些提供商，端点是必需的
        const requiresEndpoint = ['cloudflare', 'minio', 'other', 'aliyun', 'tencent', 'qiniu'];
        if (requiresEndpoint.includes(provider) && !endpoint) {
            console.log('验证失败，该提供商需要端点');
            return res.status(400).json({ message: '该存储提供商需要填写自定义端点' });
        }

        // 设置默认端点
        let finalEndpoint = endpoint;
        if (!finalEndpoint && provider === 'aws') {
            finalEndpoint = `https://s3.${region}.amazonaws.com`;
        }

        const configId = `s3_${s3ConfigIdCounter++}`;
        const newConfig = {
            id: configId,
            configName,
            provider,
            endpoint: finalEndpoint,
            bucket,
            region,
            accessKey,
            secretKey,
            directory: directory || 'chat-files/',
            storageLimit: parseInt(storageLimit) || 0,
            enableCDN: enableCDN === 'on' || enableCDN === true,
            isDefault: isDefault === 'on' || isDefault === true,
            status: 'unknown',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        console.log('创建新配置:', { ...newConfig, secretKey: '***' });

        // 如果设为默认，取消其他配置的默认状态
        if (newConfig.isDefault) {
            for (const [id, config] of s3Configs.entries()) {
                if (config.isDefault) {
                    config.isDefault = false;
                    s3Configs.set(id, config);
                }
            }
            // 更新系统默认配置
            systemSettings.s3Config = newConfig;
        }

        s3Configs.set(configId, newConfig);
        console.log('配置已保存，当前配置总数:', s3Configs.size);

        res.json({
            message: 'S3配置创建成功',
            config: {
                id: configId,
                configName,
                provider,
                bucket,
                region
            }
        });

    } catch (error) {
        console.error('创建S3配置错误:', error);
        res.status(500).json({ message: '服务器内部错误' });
    }
});

// 更新S3配置
app.put('/api/admin/s3-configs/:id', authenticateAdmin, (req, res) => {
    try {
        const configId = req.params.id;
        const existingConfig = s3Configs.get(configId);
        
        if (!existingConfig) {
            return res.status(404).json({ message: '配置不存在' });
        }

        const {
            configName,
            provider,
            endpoint,
            bucket,
            region,
            accessKey,
            secretKey,
            directory,
            storageLimit,
            enableCDN,
            isDefault
        } = req.body;

        // 验证必填字段
        if (!configName || !provider || !bucket || !region || !accessKey) {
            return res.status(400).json({ message: '请填写完整的S3配置信息' });
        }

        // 设置默认端点
        let finalEndpoint = endpoint;
        if (!finalEndpoint && provider === 'aws') {
            finalEndpoint = `https://s3.${region}.amazonaws.com`;
        }

        const updatedConfig = {
            ...existingConfig,
            configName,
            provider,
            endpoint: finalEndpoint,
            bucket,
            region,
            accessKey,
            secretKey: secretKey || existingConfig.secretKey, // 如果没有提供新密钥，保持原有
            directory: directory || 'chat-files/',
            storageLimit: parseInt(storageLimit) || 0,
            enableCDN: enableCDN === 'on' || enableCDN === true,
            isDefault: isDefault === 'on' || isDefault === true,
            updatedAt: new Date().toISOString()
        };

        // 如果设为默认，取消其他配置的默认状态
        if (updatedConfig.isDefault) {
            for (const [id, config] of s3Configs.entries()) {
                if (id !== configId && config.isDefault) {
                    config.isDefault = false;
                    s3Configs.set(id, config);
                }
            }
            // 更新系统默认配置
            systemSettings.s3Config = updatedConfig;
        }

        s3Configs.set(configId, updatedConfig);

        res.json({
            message: 'S3配置更新成功',
            config: {
                id: configId,
                configName,
                provider,
                bucket,
                region
            }
        });

    } catch (error) {
        console.error('更新S3配置错误:', error);
        res.status(500).json({ message: '服务器内部错误' });
    }
});

// 删除S3配置
app.delete('/api/admin/s3-configs/:id', authenticateAdmin, (req, res) => {
    try {
        const configId = req.params.id;
        const config = s3Configs.get(configId);
        
        if (!config) {
            return res.status(404).json({ message: '配置不存在' });
        }

        if (config.isDefault) {
            return res.status(400).json({ message: '不能删除默认配置，请先设置其他配置为默认' });
        }

        s3Configs.delete(configId);
        
        res.json({ message: 'S3配置删除成功' });

    } catch (error) {
        console.error('删除S3配置错误:', error);
        res.status(500).json({ message: '服务器内部错误' });
    }
});

// 设置默认S3配置
app.post('/api/admin/s3-configs/:id/set-default', authenticateAdmin, (req, res) => {
    try {
        const configId = req.params.id;
        const config = s3Configs.get(configId);
        
        if (!config) {
            return res.status(404).json({ message: '配置不存在' });
        }

        // 取消其他配置的默认状态
        for (const [id, cfg] of s3Configs.entries()) {
            if (cfg.isDefault) {
                cfg.isDefault = false;
                s3Configs.set(id, cfg);
            }
        }

        // 设置当前配置为默认
        config.isDefault = true;
        s3Configs.set(configId, config);
        
        // 更新系统默认配置
        systemSettings.s3Config = config;
        
        res.json({ message: '默认配置设置成功' });

    } catch (error) {
        console.error('设置默认配置错误:', error);
        res.status(500).json({ message: '服务器内部错误' });
    }
});

// 测试指定S3配置
app.post('/api/admin/s3-configs/:id/test', authenticateAdmin, async (req, res) => {
    try {
        const configId = req.params.id;
        const config = s3Configs.get(configId);
        
        if (!config) {
            return res.status(404).json({ message: '配置不存在' });
        }

        // 测试连接并更新状态
        const testResult = await testS3ConfigConnection(config);
        
        // 更新配置状态
        config.status = testResult.success ? 'connected' : 'error';
        config.lastTested = new Date().toISOString();
        s3Configs.set(configId, config);
        
        res.json(testResult);

    } catch (error) {
        console.error('测试S3配置错误:', error);
        res.status(500).json({ message: '服务器内部错误' });
    }
});

app.get('/api/admin/files', authenticateAdmin, (req, res) => {
    try {
        const files = Array.from(uploadedFiles.values()).map(file => ({
            id: file.id,
            originalName: file.originalName,
            mimeType: file.mimeType,
            size: file.size,
            uploader: file.uploader,
            uploadTime: file.uploadTime
        }));

        res.json({ files });

    } catch (error) {
        console.error('获取文件列表错误:', error);
        res.status(500).json({ message: '服务器内部错误' });
    }
});

app.get('/api/admin/images', authenticateAdmin, (req, res) => {
    try {
        const images = Array.from(uploadedFiles.values())
            .filter(file => file.mimeType && file.mimeType.startsWith('image/'))
            .map(file => ({
                id: file.id,
                name: file.originalName,
                url: file.url,
                uploadTime: file.uploadTime,
                uploader: file.uploader
            }));

        res.json({ images });

    } catch (error) {
        console.error('获取图片列表错误:', error);
        res.status(500).json({ message: '服务器内部错误' });
    }
});

app.get('/api/admin/users', authenticateAdmin, async (req, res) => {
    try {
        // 从数据库获取用户列表
        const allUsers = await storage.getAllUsers();
        const userList = allUsers.map(user => {
            const isOnline = Array.from(connectedUsers.values()).some(conn => conn.username === user.username);
            return {
                id: user.username,
                username: user.username,
                email: user.email || null,
                createdAt: user.createdAt || user.created_at,
                lastLogin: user.lastLogin || user.last_login || null,
                isOnline
            };
        });

        res.json({ users: userList });

    } catch (error) {
        console.error('获取用户列表错误:', error);
        res.status(500).json({ message: '服务器内部错误' });
    }
});

app.delete('/api/admin/files/:fileId', authenticateAdmin, (req, res) => {
    try {
        const fileId = req.params.fileId;
        
        if (uploadedFiles.has(fileId)) {
            uploadedFiles.delete(fileId);
            res.json({ message: '文件删除成功' });
        } else {
            res.status(404).json({ message: '文件不存在' });
        }

    } catch (error) {
        console.error('删除文件错误:', error);
        res.status(500).json({ message: '服务器内部错误' });
    }
});

// 获取存储使用情况
app.get('/api/admin/storage-usage', authenticateAdmin, (req, res) => {
    try {
        const files = Array.from(uploadedFiles.values());
        const totalUsed = files.reduce((total, file) => total + (file.size || 0), 0);
        const fileCount = files.length;
        const limit = systemSettings.storageLimit || 0;
        
        res.json({
            used: totalUsed,
            limit: limit,
            fileCount: fileCount,
            canCleanup: fileCount > 0,
            files: files.map(file => ({
                id: file.id,
                size: file.size,
                uploadTime: file.uploadTime
            }))
        });
    } catch (error) {
        console.error('获取存储使用情况错误:', error);
        res.status(500).json({ message: '服务器内部错误' });
    }
});

// 清理无效文件
app.post('/api/admin/cleanup-storage', authenticateAdmin, async (req, res) => {
    try {
        let deletedCount = 0;
        const filesToDelete = [];
        
        // 检查内存中的文件记录，找出可能无效的文件
        for (const [fileId, fileInfo] of uploadedFiles.entries()) {
            // 这里可以添加更复杂的清理逻辑
            // 比如检查文件是否在消息中被引用
            const fileAge = Date.now() - new Date(fileInfo.uploadTime).getTime();
            const maxAge = 30 * 24 * 60 * 60 * 1000; // 30天
            
            // 如果文件超过30天且没有被引用，标记为可删除
            if (fileAge > maxAge) {
                filesToDelete.push(fileId);
            }
        }
        
        // 删除标记的文件
        for (const fileId of filesToDelete) {
            uploadedFiles.delete(fileId);
            deletedCount++;
        }
        
        res.json({
            message: '存储清理完成',
            deletedCount: deletedCount
        });
        
    } catch (error) {
        console.error('清理存储错误:', error);
        res.status(500).json({ message: '服务器内部错误' });
    }
});

app.delete('/api/admin/users/:userId', authenticateAdmin, async (req, res) => {
    try {
        const userId = req.params.userId;
        
        // 从数据库删除用户
        const deleted = await storage.deleteUser(userId);
        
        if (deleted) {
            // 断开该用户的连接
            for (const [socketId, userData] of connectedUsers.entries()) {
                if (userData.username === userId) {
                    const socket = io.sockets.sockets.get(socketId);
                    if (socket) {
                        socket.disconnect();
                    }
                }
            }
            
            res.json({ message: '用户删除成功' });
        } else {
            res.status(404).json({ message: '用户不存在' });
        }

    } catch (error) {
        console.error('删除用户错误:', error);
        res.status(500).json({ message: '服务器内部错误' });
    }
});

app.get('/api/admin/settings', authenticateAdmin, (req, res) => {
    try {
        res.json({
            data: {
                maxFileSize: Math.floor(systemSettings.maxFileSize / (1024 * 1024)), // 转换为MB
                allowedFileTypes: systemSettings.allowedFileTypes
            }
        });
    } catch (error) {
        console.error('获取系统设置错误:', error);
        res.status(500).json({ message: '服务器内部错误' });
    }
});

app.post('/api/admin/settings', authenticateAdmin, async (req, res) => {
    try {
        const { maxFileSize, allowedFileTypes, newPassword, confirmPassword } = req.body;

        // 更新文件大小限制
        if (maxFileSize) {
            systemSettings.maxFileSize = parseInt(maxFileSize) * 1024 * 1024; // 转换为字节
        }

        // 更新允许的文件类型
        if (allowedFileTypes) {
            systemSettings.allowedFileTypes = allowedFileTypes;
        }

        // 更新管理员密码
        if (newPassword && newPassword === confirmPassword) {
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            adminConfig.password = hashedPassword;
        }

        res.json({ message: '系统设置保存成功' });

    } catch (error) {
        console.error('保存系统设置错误:', error);
        res.status(500).json({ message: '服务器内部错误' });
    }
});

// S3配置API路由（用户端，现在使用管理员配置的S3）
app.get('/api/s3/config', authenticateToken, (req, res) => {
    try {
        const config = systemSettings.s3Config;
        if (config) {
            // 只返回非敏感信息
            const safeConfig = {
                provider: config.provider,
                endpoint: config.endpoint,
                bucket: config.bucket,
                region: config.region,
                directory: config.directory,
                configured: true
            };
            res.json({ success: true, config: safeConfig });
        } else {
            res.json({ success: false, message: 'S3配置未设置，请联系管理员' });
        }
    } catch (error) {
        console.error('获取S3配置错误:', error);
        res.status(500).json({ message: '服务器内部错误' });
    }
});

app.post('/api/s3/upload-url', authenticateToken, async (req, res) => {
    try {
        const { fileName, fileType, fileSize } = req.body;
        const username = req.user.username;

        // 使用管理员配置的S3
        const s3Config = systemSettings.s3Config;
        if (!s3Config) {
            return res.status(400).json({ message: 'S3配置未设置，请联系管理员' });
        }

        // 检查存储容量限制
        if (systemSettings.storageLimit > 0) {
            const currentUsage = Array.from(uploadedFiles.values()).reduce((total, file) => total + (file.size || 0), 0);
            const requestedSize = parseInt(fileSize) || 0;
            
            if (currentUsage + requestedSize > systemSettings.storageLimit) {
                const availableSpace = systemSettings.storageLimit - currentUsage;
                return res.status(413).json({
                    message: `存储空间不足。可用空间: ${Math.round(availableSpace / (1024 * 1024))}MB，请求大小: ${Math.round(requestedSize / (1024 * 1024))}MB`,
                    availableSpace: availableSpace,
                    requestedSize: requestedSize
                });
            }
        }

        // 配置AWS SDK
        const s3 = new AWS.S3({
            endpoint: new AWS.Endpoint(s3Config.endpoint),
            accessKeyId: s3Config.accessKey,
            secretAccessKey: s3Config.secretKey,
            region: s3Config.region,
            s3ForcePathStyle: true,
            signatureVersion: 'v4'
        });

        // 生成唯一文件名
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 15);
        const fileExtension = path.extname(fileName);
        const uniqueFileName = `${timestamp}-${randomString}${fileExtension}`;
        const key = `${s3Config.directory}${uniqueFileName}`;

        // 生成预签名上传URL
        const uploadUrl = s3.getSignedUrl('putObject', {
            Bucket: s3Config.bucket,
            Key: key,
            ContentType: fileType,
            Expires: 3600 // 1小时过期
        });

        // 生成文件访问URL
        let fileUrl;
        if (s3Config.enableCDN && s3Config.provider === 'cloudflare') {
            // Cloudflare R2 CDN URL
            fileUrl = `https://${s3Config.bucket}.r2.dev/${key}`;
        } else {
            fileUrl = `${s3Config.endpoint}/${s3Config.bucket}/${key}`;
        }

        // 记录文件信息
        const fileInfo = {
            id: `${timestamp}-${randomString}`,
            originalName: fileName,
            fileName: uniqueFileName,
            mimeType: fileType,
            size: parseInt(fileSize) || 0,
            url: fileUrl,
            key: key,
            uploader: username,
            uploadTime: new Date().toISOString()
        };

        uploadedFiles.set(fileInfo.id, fileInfo);

        res.json({
            uploadUrl,
            fileUrl,
            key,
            fileName: uniqueFileName,
            fileId: fileInfo.id
        });

    } catch (error) {
        console.error('生成上传URL错误:', error);
        res.status(500).json({ message: '生成上传URL失败' });
    }
});

// 数据库文件存储API
app.post('/api/files/upload-to-db', authenticateToken, async (req, res) => {
    try {
        const { fileName, fileType, fileData } = req.body;
        const username = req.user.username;
        
        // 验证文件大小（10MB限制）
        const maxSize = 10 * 1024 * 1024; // 10MB
        const fileBuffer = Buffer.from(fileData, 'base64');
        
        if (fileBuffer.length > maxSize) {
            return res.status(413).json({
                message: `文件太大，数据库存储限制为10MB，当前文件大小：${Math.round(fileBuffer.length / (1024 * 1024))}MB`
            });
        }
        
        // 生成文件ID
        const fileId = require('crypto').randomUUID();
        
        // 保存到数据库
        await storage.saveFileToDatabase({
            id: fileId,
            originalName: fileName,
            mimeType: fileType,
            size: fileBuffer.length,
            data: fileBuffer,
            uploader: username
        });
        
        // 生成访问URL
        const fileUrl = `/api/files/db/${fileId}`;
        
        res.json({
            success: true,
            fileId: fileId,
            fileUrl: fileUrl,
            fileName: fileName,
            size: fileBuffer.length,
            message: '文件已保存到数据库'
        });
        
    } catch (error) {
        console.error('保存文件到数据库失败:', error);
        res.status(500).json({ message: '文件保存失败' });
    }
});

// 从数据库获取文件
app.get('/api/files/db/:fileId', async (req, res) => {
    try {
        const fileId = req.params.fileId;
        const file = await storage.getFileFromDatabase(fileId);
        
        if (!file) {
            return res.status(404).json({ message: '文件不存在' });
        }
        
        // 设置响应头
        res.set({
            'Content-Type': file.mimeType || 'application/octet-stream',
            'Content-Length': file.size,
            'Content-Disposition': `inline; filename="${encodeURIComponent(file.originalName)}"`,
            'Cache-Control': 'public, max-age=31536000' // 缓存1年
        });
        
        // 发送文件数据
        res.send(file.data);
        
    } catch (error) {
        console.error('获取数据库文件失败:', error);
        res.status(500).json({ message: '文件获取失败' });
    }
});

// 获取数据库文件列表（管理员）
app.get('/api/admin/files/database', authenticateAdmin, async (req, res) => {
    try {
        const files = await storage.getDatabaseFileList(100);
        res.json({ files });
    } catch (error) {
        console.error('获取数据库文件列表失败:', error);
        res.status(500).json({ message: '获取文件列表失败' });
    }
});

// 删除数据库文件（管理员）
app.delete('/api/admin/files/database/:fileId', authenticateAdmin, async (req, res) => {
    try {
        const fileId = req.params.fileId;
        const deleted = await storage.deleteFileFromDatabase(fileId);
        
        if (deleted) {
            res.json({ message: '文件删除成功' });
        } else {
            res.status(404).json({ message: '文件不存在' });
        }
    } catch (error) {
        console.error('删除数据库文件失败:', error);
        res.status(500).json({ message: '文件删除失败' });
    }
});

// 获取数据库存储使用情况
app.get('/api/admin/storage/database-usage', authenticateAdmin, async (req, res) => {
    try {
        const usage = await storage.getDatabaseStorageUsage();
        res.json(usage);
    } catch (error) {
        console.error('获取数据库存储使用情况失败:', error);
        res.status(500).json({ message: '获取存储使用情况失败' });
    }
});

// 清理数据库中的旧文件
app.post('/api/admin/storage/cleanup-database', authenticateAdmin, async (req, res) => {
    try {
        const { maxAgeDays = 30, maxAccessCount = 5 } = req.body;
        const deletedFiles = await storage.cleanupOldFiles(maxAgeDays, maxAccessCount);
        
        res.json({
            message: '数据库文件清理完成',
            deletedCount: deletedFiles.length,
            deletedFiles: deletedFiles.map(f => f.original_name)
        });
    } catch (error) {
        console.error('清理数据库文件失败:', error);
        res.status(500).json({ message: '文件清理失败' });
    }
});

// Socket.IO连接处理
io.on('connection', (socket) => {
    console.log('用户连接:', socket.id);

    // 用户加入
    socket.on('user_join', async (userData) => {
        if (userData && userData.username) {
            socket.username = userData.username;
            connectedUsers.set(socket.id, {
                username: userData.username,
                joinTime: new Date().toISOString()
            });

            try {
                // 发送历史消息
                const messages = await storage.getMessages(100);
                socket.emit('message_history', messages);

                // 广播用户列表更新
                io.emit('users_update', Array.from(connectedUsers.values()));

                // 广播用户加入消息
                const joinMessage = {
                    id: require('crypto').randomUUID(),
                    type: 'system',
                    content: `${userData.username} 加入了聊天室`,
                    timestamp: new Date().toISOString()
                };
                
                await storage.saveMessage(joinMessage);
                socket.broadcast.emit('new_message', joinMessage);

                console.log(`用户 ${userData.username} 加入聊天室`);
            } catch (error) {
                console.error('用户加入处理错误:', error);
            }
        }
    });

    // 处理文本消息
    socket.on('send_message', async (messageData) => {
        if (socket.username && messageData.content) {
            const message = {
                id: require('crypto').randomUUID(),
                type: 'text',
                username: socket.username,
                content: messageData.content,
                timestamp: new Date().toISOString()
            };

            try {
                await storage.saveMessage(message);
                io.emit('new_message', message);
                console.log(`消息来自 ${socket.username}: ${messageData.content}`);
            } catch (error) {
                console.error('保存消息错误:', error);
                socket.emit('error', { message: '消息发送失败' });
            }
        }
    });

    // 处理文件消息
    socket.on('file_message', async (messageData) => {
        if (socket.username && messageData.file) {
            const message = {
                id: require('crypto').randomUUID(),
                type: 'file',
                username: socket.username,
                file: messageData.file,
                timestamp: new Date().toISOString()
            };

            try {
                await storage.saveMessage(message);
                io.emit('new_message', message);
                console.log(`文件消息来自 ${socket.username}: ${messageData.file.fileName}`);
            } catch (error) {
                console.error('保存文件消息错误:', error);
                socket.emit('error', { message: '文件消息发送失败' });
            }
        }
    });

    // 处理正在输入
    socket.on('typing_start', () => {
        if (socket.username) {
            socket.broadcast.emit('user_typing', {
                username: socket.username,
                typing: true
            });
        }
    });

    socket.on('typing_stop', () => {
        if (socket.username) {
            socket.broadcast.emit('user_typing', {
                username: socket.username,
                typing: false
            });
        }
    });

    // 用户断开连接
    socket.on('disconnect', async () => {
        if (socket.username) {
            connectedUsers.delete(socket.id);

            // 广播用户列表更新
            io.emit('users_update', Array.from(connectedUsers.values()));

            // 广播用户离开消息
            const leaveMessage = {
                id: require('crypto').randomUUID(),
                type: 'system',
                content: `${socket.username} 离开了聊天室`,
                timestamp: new Date().toISOString()
            };
            
            try {
                await storage.saveMessage(leaveMessage);
                socket.broadcast.emit('new_message', leaveMessage);
                console.log(`用户 ${socket.username} 离开聊天室`);
            } catch (error) {
                console.error('保存离开消息错误:', error);
            }
        }
        console.log('用户断开连接:', socket.id);
    });
});

// 错误处理
app.use((err, req, res, next) => {
    console.error('服务器错误:', err);
    res.status(500).json({ message: '服务器内部错误' });
});

// 404处理
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// 导出app供Vercel使用
module.exports = app;

// 如果直接运行此文件，启动服务器
if (require.main === module) {
    server.listen(PORT, () => {
        console.log(`服务器运行在端口 ${PORT}`);
        console.log(`访问地址: http://localhost:${PORT}`);
    });

    // 优雅关闭
    process.on('SIGTERM', () => {
        console.log('收到SIGTERM信号，正在关闭服务器...');
        server.close(() => {
            console.log('服务器已关闭');
            process.exit(0);
        });
    });

    process.on('SIGINT', () => {
        console.log('收到SIGINT信号，正在关闭服务器...');
        server.close(() => {
            console.log('服务器已关闭');
            process.exit(0);
        });
    });
}