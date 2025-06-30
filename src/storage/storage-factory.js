// 存储工厂 - 根据环境自动选择存储方式
const BaseStorage = require('./base-storage');

class StorageFactory {
    static createStorage(env) {
        // Cloudflare环境 - 使用KV存储
        if (env.KV_NAMESPACE) {
            console.log('🔧 使用Cloudflare KV存储');
            const KVStorage = require('./kv-storage');
            return new KVStorage(env.KV_NAMESPACE);
        }
        
        // 外部数据库 - 通过DATABASE_URL连接
        if (env.DATABASE_URL) {
            const dbUrl = env.DATABASE_URL;
            
            if (dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://')) {
                console.log('🔧 使用PostgreSQL数据库');
                const PostgreSQLStorage = require('./postgres-storage');
                return new PostgreSQLStorage(dbUrl);
            }
            
            if (dbUrl.startsWith('mysql://')) {
                console.log('🔧 使用MySQL数据库');
                const MySQLStorage = require('./mysql-storage');
                return new MySQLStorage(dbUrl);
            }
            
            console.warn('⚠️ 不支持的数据库URL格式:', dbUrl);
        }
        
        // 默认内存存储（开发环境）
        console.log('🔧 使用内存存储（仅用于开发环境）');
        return new MemoryStorage();
    }
}

// 内存存储实现（开发环境）
class MemoryStorage extends BaseStorage {
    constructor() {
        super();
        this.users = new Map();
        this.messages = [];
        this.adminConfig = new Map();
        
        // 设置默认管理员配置
        this.adminConfig.set('admin_username', 'admin');
        this.adminConfig.set('admin_password_hash', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi');
        
        console.log('💾 内存存储已初始化');
    }
    
    async saveUser(user) {
        this.users.set(user.username, {
            ...user,
            createdAt: user.createdAt || new Date().toISOString()
        });
        console.log(`👤 用户已保存: ${user.username}`);
    }
    
    async getUser(username) {
        const user = this.users.get(username) || null;
        console.log(`👤 查询用户: ${username} - ${user ? '找到' : '未找到'}`);
        return user;
    }
    
    async saveMessage(message) {
        this.messages.push({
            ...message,
            id: message.id || Date.now().toString(),
            timestamp: message.timestamp || new Date().toISOString()
        });
        
        // 保持最新1000条消息
        if (this.messages.length > 1000) {
            this.messages.splice(0, this.messages.length - 1000);
        }
        
        console.log(`💬 消息已保存: ${message.type} - ${message.username}`);
    }
    
    async getMessages(limit = 100) {
        const messages = this.messages.slice(-limit);
        console.log(`💬 获取消息历史: ${messages.length} 条`);
        return messages;
    }
    
    async saveAdminConfig(key, value) {
        this.adminConfig.set(key, value);
        console.log(`⚙️ 管理员配置已保存: ${key}`);
    }
    
    async getAdminConfig(key) {
        const value = this.adminConfig.get(key) || null;
        console.log(`⚙️ 查询管理员配置: ${key} - ${value ? '找到' : '未找到'}`);
        return value;
    }
    
    async getAllUsers() {
        return Array.from(this.users.values());
    }
    
    async deleteUser(username) {
        const deleted = this.users.delete(username);
        console.log(`👤 删除用户: ${username} - ${deleted ? '成功' : '失败'}`);
        return deleted;
    }
    
    async clearMessages() {
        const count = this.messages.length;
        this.messages = [];
        console.log(`💬 清空消息: ${count} 条`);
        return count;
    }
}

module.exports = StorageFactory;