// S3存储配置管理模块（现在由管理员后台统一管理）
class S3ConfigManager {
    constructor() {
        this.config = null;
        this.isConfigured = false;
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadConfig();
    }

    bindEvents() {
        // 关闭S3配置模态框
        const closeS3ConfigModal = document.getElementById('closeS3ConfigModal');
        if (closeS3ConfigModal) {
            closeS3ConfigModal.addEventListener('click', this.closeModal.bind(this));
        }

        // 点击模态框外部关闭
        const s3ConfigModal = document.getElementById('s3ConfigModal');
        if (s3ConfigModal) {
            s3ConfigModal.addEventListener('click', (event) => {
                if (event.target === s3ConfigModal) {
                    this.closeModal();
                }
            });
        }
    }

    // 从服务器加载S3配置
    async loadConfig() {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                this.isConfigured = false;
                return;
            }

            const response = await fetch('/api/s3/config', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const result = await response.json();

            if (response.ok && result.success) {
                this.config = result.config;
                this.isConfigured = result.config.configured;
                console.log('S3配置加载成功');
            } else {
                this.isConfigured = false;
                console.log('S3配置未设置:', result.message);
            }
        } catch (error) {
            console.error('加载S3配置失败:', error);
            this.isConfigured = false;
        }
    }

    // 显示S3配置提示（现在由管理员配置）
    showConfigModal() {
        const modal = document.getElementById('s3ConfigModal');
        if (modal) {
            // 更新模态框内容，提示用户联系管理员
            const modalContent = modal.querySelector('.modal-content');
            if (modalContent) {
                modalContent.innerHTML = `
                    <div class="modal-header">
                        <h3>S3存储配置</h3>
                        <button class="modal-close" onclick="window.s3ConfigManager.closeModal()">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="config-notice">
                            <div class="notice-icon">ℹ️</div>
                            <h4>配置说明</h4>
                            <p>S3存储配置现在由管理员统一管理，以确保安全性和一致性。</p>
                            <p>如需配置或修改S3存储设置，请联系系统管理员。</p>
                            <div class="notice-status">
                                <strong>当前状态：</strong>
                                <span class="status-badge ${this.isConfigured ? 'status-success' : 'status-warning'}">
                                    ${this.isConfigured ? '✅ 已配置' : '⚠️ 未配置'}
                                </span>
                            </div>
                            <div class="notice-actions">
                                <button class="btn btn-primary" onclick="window.s3ConfigManager.closeModal()">我知道了</button>
                                <button class="btn btn-secondary" onclick="window.s3ConfigManager.refreshConfig()">刷新配置</button>
                            </div>
                        </div>
                    </div>
                `;
            }
            modal.style.display = 'flex';
        }
    }

    // 隐藏S3配置模态框
    closeModal() {
        const s3ConfigModal = document.getElementById('s3ConfigModal');
        if (s3ConfigModal) {
            s3ConfigModal.style.display = 'none';
        }
        this.clearMessage();
    }

    // 刷新配置
    async refreshConfig() {
        await this.loadConfig();
        this.closeModal();
        
        if (this.isConfigured) {
            this.showGlobalMessage('S3配置已更新', 'success');
        } else {
            this.showGlobalMessage('S3配置尚未设置，请联系管理员', 'warning');
        }
    }

    // 显示全局消息
    showGlobalMessage(message, type = 'info') {
        // 尝试使用全局消息系统
        if (window.showMessage) {
            window.showMessage(message, type);
        } else {
            // 备用方案：控制台输出
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }

    // 获取当前配置
    getConfig() {
        return this.config;
    }

    // 检查是否已配置
    isS3Configured() {
        return this.isConfigured;
    }

    // 获取上传URL
    async getUploadUrl(fileName, fileType) {
        if (!this.isConfigured) {
            throw new Error('S3配置未设置，请联系管理员');
        }

        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                throw new Error('未登录');
            }

            const response = await fetch('/api/s3/upload-url', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    fileName,
                    fileType
                })
            });

            const data = await response.json();

            if (response.ok) {
                return data;
            } else {
                throw new Error(data.message || '获取上传URL失败');
            }
        } catch (error) {
            console.error('获取上传URL错误:', error);
            throw error;
        }
    }

    // 上传文件到S3
    async uploadFile(file, onProgress = null) {
        if (!this.isConfigured) {
            throw new Error('S3配置未设置，请联系管理员');
        }

        try {
            // 获取预签名上传URL
            const uploadData = await this.getUploadUrl(file.name, file.type);

            // 上传文件到S3
            const xhr = new XMLHttpRequest();
            
            return new Promise((resolve, reject) => {
                xhr.upload.addEventListener('progress', (event) => {
                    if (event.lengthComputable && onProgress) {
                        const percentComplete = (event.loaded / event.total) * 100;
                        onProgress(percentComplete);
                    }
                });

                xhr.addEventListener('load', () => {
                    if (xhr.status === 200 || xhr.status === 204) {
                        resolve({
                            url: uploadData.fileUrl,
                            key: uploadData.key,
                            fileName: file.name,
                            fileSize: file.size,
                            fileType: file.type,
                            fileId: uploadData.fileId
                        });
                    } else {
                        reject(new Error(`上传失败: ${xhr.status} ${xhr.statusText}`));
                    }
                });

                xhr.addEventListener('error', () => {
                    reject(new Error('上传过程中发生网络错误'));
                });

                xhr.open('PUT', uploadData.uploadUrl);
                xhr.setRequestHeader('Content-Type', file.type);
                xhr.send(file);
            });
        } catch (error) {
            console.error('文件上传错误:', error);
            throw error;
        }
    }

    // 清除消息
    clearMessage() {
        const messageDiv = document.getElementById('s3ConfigMessage');
        if (messageDiv) {
            messageDiv.style.display = 'none';
            messageDiv.textContent = '';
            messageDiv.className = 'config-message';
        }
    }

    // 显示配置状态
    getConfigStatus() {
        return {
            isConfigured: this.isConfigured,
            config: this.config ? {
                provider: this.config.provider,
                endpoint: this.config.endpoint,
                bucket: this.config.bucket,
                region: this.config.region
            } : null
        };
    }

    // 检查配置并提示用户
    async checkConfigurationAndPrompt() {
        await this.loadConfig();
        
        if (!this.isConfigured) {
            this.showConfigModal();
            return false;
        }
        
        return true;
    }
}

// 导出S3配置管理器实例
window.s3ConfigManager = new S3ConfigManager();

// 页面加载时检查配置
document.addEventListener('DOMContentLoaded', () => {
    window.s3ConfigManager.loadConfig();
});