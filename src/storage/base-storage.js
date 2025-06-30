// 存储基类 - 定义统一接口
class BaseStorage {
    // 用户管理
    async saveUser(user) {
        throw new Error('Method saveUser() must be implemented');
    }
    
    async getUser(username) {
        throw new Error('Method getUser() must be implemented');
    }
    
    async getAllUsers() {
        throw new Error('Method getAllUsers() must be implemented');
    }
    
    async deleteUser(username) {
        throw new Error('Method deleteUser() must be implemented');
    }
    
    // 消息管理
    async saveMessage(message) {
        throw new Error('Method saveMessage() must be implemented');
    }
    
    async getMessages(limit = 100) {
        throw new Error('Method getMessages() must be implemented');
    }
    
    async clearMessages() {
        throw new Error('Method clearMessages() must be implemented');
    }
    
    // 管理员配置
    async saveAdminConfig(key, value) {
        throw new Error('Method saveAdminConfig() must be implemented');
    }
    
    async getAdminConfig(key) {
        throw new Error('Method getAdminConfig() must be implemented');
    }
    
    // 文件管理
    async saveFileInfo(fileInfo) {
        // 可选实现
        return true;
    }
    
    async getFileInfo(fileId) {
        // 可选实现
        return null;
    }
    
    async deleteFileInfo(fileId) {
        // 可选实现
        return true;
    }
    
    // 系统设置
    async saveSystemSetting(key, value) {
        // 可选实现
        return true;
    }
    
    async getSystemSetting(key) {
        // 可选实现
        return null;
    }
}

module.exports = BaseStorage;