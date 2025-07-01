-- Cloudflare D1 数据库初始化脚本
-- 使用方法: wrangler d1 execute your-database-name --file=schema.sql

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    email TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME,
    is_active BOOLEAN DEFAULT 1
);

-- 消息表
CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL DEFAULT 'text',
    username TEXT NOT NULL,
    content TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    file_data TEXT,  -- JSON格式的文件信息
    room_id TEXT DEFAULT 'main',
    reply_to TEXT,   -- 回复消息的ID
    edited_at DATETIME,
    is_deleted BOOLEAN DEFAULT 0
);

-- 管理员配置表
CREATE TABLE IF NOT EXISTS admin_config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 文件存储表（如果不使用KV）
CREATE TABLE IF NOT EXISTS files (
    id TEXT PRIMARY KEY,
    original_name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size INTEGER NOT NULL,
    data BLOB,  -- 文件二进制数据
    uploader TEXT NOT NULL,
    upload_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    access_count INTEGER DEFAULT 0,
    last_accessed DATETIME
);

-- 聊天室表（支持多房间）
CREATE TABLE IF NOT EXISTS rooms (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_by TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_private BOOLEAN DEFAULT 0,
    max_users INTEGER DEFAULT 100
);

-- 用户房间关系表
CREATE TABLE IF NOT EXISTS user_rooms (
    user_id TEXT NOT NULL,
    room_id TEXT NOT NULL,
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    role TEXT DEFAULT 'member',  -- member, admin, owner
    PRIMARY KEY (user_id, room_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_messages_username ON messages(username);
CREATE INDEX IF NOT EXISTS idx_messages_room_id ON messages(room_id);
CREATE INDEX IF NOT EXISTS idx_files_uploader ON files(uploader);
CREATE INDEX IF NOT EXISTS idx_files_upload_time ON files(upload_time);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- 插入默认数据
INSERT OR IGNORE INTO rooms (id, name, description, created_by) VALUES 
('main', '主聊天室', '默认聊天室', 'system');

-- 插入默认管理员配置
INSERT OR IGNORE INTO admin_config (key, value) VALUES 
('admin_username', 'admin'),
('admin_password_hash', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9'), -- 默认密码: admin123
('max_file_size', '5242880'),  -- 5MB
('allowed_file_types', 'image/*,video/*,audio/*,.pdf,.doc,.docx,.txt'),
('max_message_length', '1000'),
('enable_file_upload', '1'),
('enable_registration', '1');

-- 插入欢迎消息
INSERT OR IGNORE INTO messages (id, type, username, content, timestamp, room_id) VALUES 
('welcome-msg-001', 'system', 'System', '欢迎来到聊天室！这里支持文本消息、文件分享和实时通信。', datetime('now'), 'main');