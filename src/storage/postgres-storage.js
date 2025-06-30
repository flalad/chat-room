// PostgreSQL存储适配器
const BaseStorage = require('./base-storage');
const { Pool } = require('pg');

class PostgreSQLStorage extends BaseStorage {
    constructor(databaseUrl) {
        super();
        this.pool = new Pool({
            connectionString: databaseUrl,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        });
        this.initTables();
    }
    
    async initTables() {
        const client = await this.pool.connect();
        try {
            // 用户表
            await client.query(`
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    username VARCHAR(50) UNIQUE NOT NULL,
                    password_hash TEXT NOT NULL,
                    email VARCHAR(100),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_login TIMESTAMP
                )
            `);
            
            // 消息表
            await client.query(`
                CREATE TABLE IF NOT EXISTS messages (
                    id VARCHAR(36) PRIMARY KEY,
                    type VARCHAR(20) DEFAULT 'text',
                    username VARCHAR(50),
                    content TEXT NOT NULL,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    file_url TEXT,
                    file_name TEXT,
                    file_type TEXT,
                    file_size BIGINT
                )
            `);
            
            // 管理员配置表
            await client.query(`
                CREATE TABLE IF NOT EXISTS admin_config (
                    key VARCHAR(50) PRIMARY KEY,
                    value TEXT NOT NULL,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            
            // 文件信息表
            await client.query(`
                CREATE TABLE IF NOT EXISTS file_info (
                    id VARCHAR(36) PRIMARY KEY,
                    original_name TEXT NOT NULL,
                    file_name TEXT NOT NULL,
                    mime_type VARCHAR(100),
                    size BIGINT,
                    url TEXT NOT NULL,
                    uploader VARCHAR(50),
                    upload_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            
            // 系统设置表
            await client.query(`
                CREATE TABLE IF NOT EXISTS system_settings (
                    key VARCHAR(50) PRIMARY KEY,
                    value TEXT NOT NULL,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            
            // 文件存储表（用于存储小文件的二进制数据）
            await client.query(`
                CREATE TABLE IF NOT EXISTS file_storage (
                    id VARCHAR(36) PRIMARY KEY,
                    original_name TEXT NOT NULL,
                    mime_type VARCHAR(100),
                    size BIGINT,
                    data BYTEA NOT NULL,
                    uploader VARCHAR(50),
                    upload_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    access_count INTEGER DEFAULT 0,
                    last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            
            // 插入默认管理员配置
            await client.query(`
                INSERT INTO admin_config (key, value) VALUES 
                ('admin_username', 'admin'),
                ('admin_password_hash', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi')
                ON CONFLICT (key) DO NOTHING
            `);
            
            console.log('✅ PostgreSQL数据库表初始化完成');
            
        } catch (error) {
            console.error('❌ PostgreSQL表初始化失败:', error);
            throw error;
        } finally {
            client.release();
        }
    }
    
    async saveUser(user) {
        const client = await this.pool.connect();
        try {
            await client.query(
                'INSERT INTO users (username, password_hash, email, created_at) VALUES ($1, $2, $3, $4)',
                [user.username, user.password, user.email || null, user.createdAt || new Date()]
            );
            console.log(`👤 PostgreSQL: 用户已保存 - ${user.username}`);
        } catch (error) {
            console.error(`❌ PostgreSQL: 保存用户失败 - ${user.username}:`, error);
            throw error;
        } finally {
            client.release();
        }
    }
    
    async getUser(username) {
        const client = await this.pool.connect();
        try {
            const result = await client.query(
                'SELECT * FROM users WHERE username = $1',
                [username]
            );
            const user = result.rows[0] || null;
            console.log(`👤 PostgreSQL: 查询用户 - ${username}: ${user ? '找到' : '未找到'}`);
            return user;
        } catch (error) {
            console.error(`❌ PostgreSQL: 查询用户失败 - ${username}:`, error);
            throw error;
        } finally {
            client.release();
        }
    }
    
    async getAllUsers() {
        const client = await this.pool.connect();
        try {
            const result = await client.query(
                'SELECT id, username, email, created_at, last_login FROM users ORDER BY created_at DESC'
            );
            console.log(`👥 PostgreSQL: 获取所有用户 - ${result.rows.length} 个`);
            return result.rows;
        } catch (error) {
            console.error('❌ PostgreSQL: 获取所有用户失败:', error);
            throw error;
        } finally {
            client.release();
        }
    }
    
    async deleteUser(username) {
        const client = await this.pool.connect();
        try {
            const result = await client.query(
                'DELETE FROM users WHERE username = $1',
                [username]
            );
            const deleted = result.rowCount > 0;
            console.log(`👤 PostgreSQL: 删除用户 - ${username}: ${deleted ? '成功' : '失败'}`);
            return deleted;
        } catch (error) {
            console.error(`❌ PostgreSQL: 删除用户失败 - ${username}:`, error);
            throw error;
        } finally {
            client.release();
        }
    }
    
    async saveMessage(message) {
        const client = await this.pool.connect();
        try {
            await client.query(
                'INSERT INTO messages (id, type, username, content, timestamp, file_url, file_name, file_type) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
                [
                    message.id || require('crypto').randomUUID(),
                    message.type || 'text',
                    message.username,
                    message.content,
                    message.timestamp || new Date(),
                    message.file?.url || null,
                    message.file?.fileName || null,
                    message.file?.mimeType || null
                ]
            );
            
            // 清理旧消息，保持最新1000条
            await client.query(`
                DELETE FROM messages 
                WHERE id NOT IN (
                    SELECT id FROM messages 
                    ORDER BY timestamp DESC 
                    LIMIT 1000
                )
            `);
            
            console.log(`💬 PostgreSQL: 消息已保存 - ${message.type} from ${message.username}`);
        } catch (error) {
            console.error('❌ PostgreSQL: 保存消息失败:', error);
            throw error;
        } finally {
            client.release();
        }
    }
    
    async getMessages(limit = 100) {
        const client = await this.pool.connect();
        try {
            const result = await client.query(
                'SELECT * FROM messages ORDER BY timestamp DESC LIMIT $1',
                [limit]
            );
            const messages = result.rows.reverse();
            console.log(`💬 PostgreSQL: 获取消息历史 - ${messages.length} 条`);
            return messages;
        } catch (error) {
            console.error('❌ PostgreSQL: 获取消息失败:', error);
            throw error;
        } finally {
            client.release();
        }
    }
    
    async clearMessages() {
        const client = await this.pool.connect();
        try {
            const result = await client.query('DELETE FROM messages');
            console.log(`💬 PostgreSQL: 清空消息 - ${result.rowCount} 条`);
            return result.rowCount;
        } catch (error) {
            console.error('❌ PostgreSQL: 清空消息失败:', error);
            throw error;
        } finally {
            client.release();
        }
    }
    
    async saveAdminConfig(key, value) {
        const client = await this.pool.connect();
        try {
            await client.query(
                'INSERT INTO admin_config (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP',
                [key, value]
            );
            console.log(`⚙️ PostgreSQL: 管理员配置已保存 - ${key}`);
        } catch (error) {
            console.error(`❌ PostgreSQL: 保存管理员配置失败 - ${key}:`, error);
            throw error;
        } finally {
            client.release();
        }
    }
    
    async getAdminConfig(key) {
        const client = await this.pool.connect();
        try {
            const result = await client.query(
                'SELECT value FROM admin_config WHERE key = $1',
                [key]
            );
            const value = result.rows[0]?.value || null;
            console.log(`⚙️ PostgreSQL: 查询管理员配置 - ${key}: ${value ? '找到' : '未找到'}`);
            return value;
        } catch (error) {
            console.error(`❌ PostgreSQL: 查询管理员配置失败 - ${key}:`, error);
            throw error;
        } finally {
            client.release();
        }
    }
    
    async saveFileInfo(fileInfo) {
        const client = await this.pool.connect();
        try {
            await client.query(
                'INSERT INTO file_info (id, original_name, file_name, mime_type, size, url, uploader) VALUES ($1, $2, $3, $4, $5, $6, $7)',
                [fileInfo.id, fileInfo.originalName, fileInfo.fileName, fileInfo.mimeType, fileInfo.size, fileInfo.url, fileInfo.uploader]
            );
            console.log(`📁 PostgreSQL: 文件信息已保存 - ${fileInfo.originalName}`);
            return true;
        } catch (error) {
            console.error('❌ PostgreSQL: 保存文件信息失败:', error);
            throw error;
        } finally {
            client.release();
        }
    }
    
    async getFileInfo(fileId) {
        const client = await this.pool.connect();
        try {
            const result = await client.query(
                'SELECT * FROM file_info WHERE id = $1',
                [fileId]
            );
            return result.rows[0] || null;
        } catch (error) {
            console.error('❌ PostgreSQL: 获取文件信息失败:', error);
            throw error;
        } finally {
            client.release();
        }
    }
    
    async deleteFileInfo(fileId) {
        const client = await this.pool.connect();
        try {
            const result = await client.query(
                'DELETE FROM file_info WHERE id = $1',
                [fileId]
            );
            return result.rowCount > 0;
        } catch (error) {
            console.error('❌ PostgreSQL: 删除文件信息失败:', error);
            throw error;
        } finally {
            client.release();
        }
    }
    
    async saveSystemSetting(key, value) {
        const client = await this.pool.connect();
        try {
            await client.query(
                'INSERT INTO system_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP',
                [key, value]
            );
            return true;
        } catch (error) {
            console.error('❌ PostgreSQL: 保存系统设置失败:', error);
            throw error;
        } finally {
            client.release();
        }
    }
    
    async getSystemSetting(key) {
        const client = await this.pool.connect();
        try {
            const result = await client.query(
                'SELECT value FROM system_settings WHERE key = $1',
                [key]
            );
            return result.rows[0]?.value || null;
        } catch (error) {
            console.error('❌ PostgreSQL: 获取系统设置失败:', error);
            throw error;
        } finally {
            client.release();
        }
    }
    
    // 保存文件到数据库
    async saveFileToDatabase(fileData) {
        const client = await this.pool.connect();
        try {
            const { id, originalName, mimeType, size, data, uploader } = fileData;
            
            await client.query(
                'INSERT INTO file_storage (id, original_name, mime_type, size, data, uploader) VALUES ($1, $2, $3, $4, $5, $6)',
                [id, originalName, mimeType, size, data, uploader]
            );
            
            console.log(`📁 PostgreSQL: 文件已保存到数据库 - ${originalName} (${this.formatFileSize(size)})`);
            return true;
        } catch (error) {
            console.error('❌ PostgreSQL: 保存文件到数据库失败:', error);
            throw error;
        } finally {
            client.release();
        }
    }
    
    // 从数据库获取文件
    async getFileFromDatabase(fileId) {
        const client = await this.pool.connect();
        try {
            const result = await client.query(
                'SELECT * FROM file_storage WHERE id = $1',
                [fileId]
            );
            
            if (result.rows.length > 0) {
                const file = result.rows[0];
                
                // 更新访问计数和时间
                await client.query(
                    'UPDATE file_storage SET access_count = access_count + 1, last_accessed = CURRENT_TIMESTAMP WHERE id = $1',
                    [fileId]
                );
                
                console.log(`📁 PostgreSQL: 从数据库获取文件 - ${file.original_name}`);
                return {
                    id: file.id,
                    originalName: file.original_name,
                    mimeType: file.mime_type,
                    size: file.size,
                    data: file.data,
                    uploader: file.uploader,
                    uploadTime: file.upload_time,
                    accessCount: file.access_count + 1
                };
            }
            
            return null;
        } catch (error) {
            console.error('❌ PostgreSQL: 从数据库获取文件失败:', error);
            throw error;
        } finally {
            client.release();
        }
    }
    
    // 删除数据库中的文件
    async deleteFileFromDatabase(fileId) {
        const client = await this.pool.connect();
        try {
            const result = await client.query(
                'DELETE FROM file_storage WHERE id = $1',
                [fileId]
            );
            
            const deleted = result.rowCount > 0;
            console.log(`📁 PostgreSQL: 从数据库删除文件 - ${fileId}: ${deleted ? '成功' : '失败'}`);
            return deleted;
        } catch (error) {
            console.error('❌ PostgreSQL: 从数据库删除文件失败:', error);
            throw error;
        } finally {
            client.release();
        }
    }
    
    // 获取数据库中的文件列表
    async getDatabaseFileList(limit = 100) {
        const client = await this.pool.connect();
        try {
            const result = await client.query(
                'SELECT id, original_name, mime_type, size, uploader, upload_time, access_count FROM file_storage ORDER BY upload_time DESC LIMIT $1',
                [limit]
            );
            
            const files = result.rows.map(file => ({
                id: file.id,
                originalName: file.original_name,
                mimeType: file.mime_type,
                size: file.size,
                uploader: file.uploader,
                uploadTime: file.upload_time,
                accessCount: file.access_count,
                storageType: 'database'
            }));
            
            console.log(`📁 PostgreSQL: 获取数据库文件列表 - ${files.length} 个文件`);
            return files;
        } catch (error) {
            console.error('❌ PostgreSQL: 获取数据库文件列表失败:', error);
            throw error;
        } finally {
            client.release();
        }
    }
    
    // 获取数据库存储使用情况
    async getDatabaseStorageUsage() {
        const client = await this.pool.connect();
        try {
            const result = await client.query(
                'SELECT COUNT(*) as file_count, COALESCE(SUM(size), 0) as total_size FROM file_storage'
            );
            
            const stats = result.rows[0];
            return {
                fileCount: parseInt(stats.file_count),
                totalSize: parseInt(stats.total_size),
                storageType: 'database'
            };
        } catch (error) {
            console.error('❌ PostgreSQL: 获取数据库存储使用情况失败:', error);
            throw error;
        } finally {
            client.release();
        }
    }
    
    // 清理旧文件（超过指定天数且访问次数少的文件）
    async cleanupOldFiles(maxAgeDays = 30, maxAccessCount = 5) {
        const client = await this.pool.connect();
        try {
            const result = await client.query(`
                DELETE FROM file_storage
                WHERE upload_time < NOW() - INTERVAL '${maxAgeDays} days'
                AND access_count <= $1
                RETURNING id, original_name
            `, [maxAccessCount]);
            
            console.log(`🧹 PostgreSQL: 清理旧文件 - 删除了 ${result.rowCount} 个文件`);
            return result.rows;
        } catch (error) {
            console.error('❌ PostgreSQL: 清理旧文件失败:', error);
            throw error;
        } finally {
            client.release();
        }
    }
    
    // 格式化文件大小的辅助方法
    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    // 关闭连接池
    async close() {
        await this.pool.end();
        console.log('🔌 PostgreSQL连接池已关闭');
    }
}

module.exports = PostgreSQLStorage;