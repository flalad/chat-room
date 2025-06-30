// 增强的文件上传管理模块
class EnhancedFileUploadManager {
    constructor() {
        this.maxFileSize = 50 * 1024 * 1024; // 50MB
        this.databaseMaxSize = 10 * 1024 * 1024; // 10MB for database storage
        this.allowedTypes = [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'video/mp4', 'video/webm', 'video/ogg',
            'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/mpeg',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain',
            'application/zip',
            'application/x-rar-compressed'
        ];
        this.databaseUpload = new DatabaseFileUpload();
        this.init();
    }

    init() {
        this.bindEvents();
        this.addStyles();
        this.setupPasteUpload();
    }

    addStyles() {
        if (document.getElementById('enhanced-upload-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'enhanced-upload-styles';
        styles.textContent = `
            .file-info-display {
                display: flex;
                align-items: center;
                padding: 1rem;
                background: #f8f9fa;
                border-radius: 8px;
                margin-bottom: 1.5rem;
            }
            
            .file-info-display .file-icon {
                font-size: 2rem;
                margin-right: 1rem;
            }
            
            .file-info-display .file-name {
                font-weight: bold;
                margin-bottom: 0.25rem;
            }
            
            .file-info-display .file-size {
                color: #666;
                font-size: 0.9rem;
            }
            
            .storage-options, .upload-options {
                display: flex;
                flex-direction: column;
                gap: 1rem;
                margin-bottom: 1.5rem;
            }
            
            .storage-option, .upload-option {
                border: 2px solid #e0e0e0;
                border-radius: 8px;
                padding: 1rem;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            
            .storage-option:hover:not(.disabled), .upload-option:hover:not(.disabled) {
                border-color: #007bff;
                background: #f8f9ff;
            }
            
            .storage-option.disabled, .upload-option.disabled {
                opacity: 0.6;
                cursor: not-allowed;
            }
            
            .option-header {
                display: flex;
                align-items: center;
                margin-bottom: 0.5rem;
            }
            
            .option-icon {
                font-size: 1.5rem;
                margin-right: 0.75rem;
            }
            
            .option-title {
                font-weight: bold;
                flex: 1;
            }
            
            .option-badge {
                padding: 0.25rem 0.5rem;
                border-radius: 4px;
                font-size: 0.75rem;
                font-weight: bold;
            }
            
            .option-badge.recommended {
                background: #28a745;
                color: white;
            }
            
            .option-description {
                color: #666;
                font-size: 0.9rem;
                line-height: 1.4;
            }
            
            @keyframes slideInDown {
                from {
                    transform: translateX(-50%) translateY(-100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(-50%) translateY(0);
                    opacity: 1;
                }
            }
            
            @keyframes slideOutUp {
                from {
                    transform: translateX(-50%) translateY(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(-50%) translateY(-100%);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(styles);
    }

    bindEvents() {
        // 文件上传按钮
        const attachmentBtn = document.getElementById('attachmentBtn');
        const fileInput = document.getElementById('fileInput');

        if (attachmentBtn && fileInput) {
            // 移除可能存在的旧事件监听器
            attachmentBtn.replaceWith(attachmentBtn.cloneNode(true));
            const newAttachmentBtn = document.getElementById('attachmentBtn');
            
            newAttachmentBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                if (!window.authManager || !window.authManager.isLoggedIn()) {
                    this.showError('请先登录后再上传文件');
                    return;
                }

                // 直接打开文件选择器
                fileInput.click();
            });

            fileInput.addEventListener('change', this.handleFileSelect.bind(this));
        }

        // 拖拽上传
        this.bindDragAndDrop();
    }

    bindDragAndDrop() {
        const messageList = document.getElementById('messageList');
        if (!messageList) return;

        messageList.addEventListener('dragover', (event) => {
            event.preventDefault();
            event.stopPropagation();
            messageList.classList.add('drag-over');
        });

        messageList.addEventListener('dragleave', (event) => {
            event.preventDefault();
            event.stopPropagation();
            messageList.classList.remove('drag-over');
        });

        messageList.addEventListener('drop', (event) => {
            event.preventDefault();
            event.stopPropagation();
            messageList.classList.remove('drag-over');

            if (!window.authManager.isLoggedIn()) {
                this.showError('请先登录后再上传文件');
                return;
            }

            const files = Array.from(event.dataTransfer.files);
            this.handleFilesWithOptions(files);
        });
    }

    handleFileSelect(event) {
        const files = Array.from(event.target.files);
        if (files.length === 0) return;
        
        this.handleFilesWithOptions(files);
        
        // 清空文件输入，允许重复选择同一文件
        event.target.value = '';
    }

    // 处理文件并显示选择选项
    async handleFilesWithOptions(files) {
        if (files.length === 0) return;

        // 验证文件
        const validFiles = [];
        for (const file of files) {
            if (this.validateFile(file)) {
                validFiles.push(file);
            }
        }

        if (validFiles.length === 0) return;

        // 为每个文件选择存储方式
        for (const file of validFiles) {
            await this.selectStorageForFile(file);
        }
    }

    // 为单个文件选择存储方式
    async selectStorageForFile(file) {
        console.log('选择存储方式，文件:', file.name, '大小:', this.formatFileSize(file.size));
        
        const eligibility = this.databaseUpload.isFileEligibleForDatabase(file);
        console.log('数据库存储适用性:', eligibility);
        
        // 优先使用数据库存储（如果文件符合条件）
        if (eligibility.eligible) {
            console.log('使用数据库存储');
            await this.uploadToDatabase(file);
        } else {
            // 文件不适合数据库存储，尝试使用S3
            console.log('检查S3存储可用性');
            if (window.s3ConfigManager && window.s3ConfigManager.isConfigured()) {
                console.log('使用S3存储');
                await this.uploadToS3(file);
            } else {
                console.log('S3存储未配置');
                this.showError(`文件过大（${this.formatFileSize(file.size)}）不适合数据库存储，且S3存储未配置。请联系管理员配置S3存储服务，或选择较小的文件（≤10MB）。`);
                return;
            }
        }
    }

    // 显示存储方式选择模态框
    showStorageSelectionModal(file) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'block';
        
        const s3Available = window.s3ConfigManager && window.s3ConfigManager.isConfigured();
        
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h3>选择存储方式</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">
                        <svg viewBox="0 0 24 24" width="20" height="20">
                            <path fill="currentColor" d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
                        </svg>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="file-info-display">
                        <div class="file-icon">${this.getFileIcon(file.type)}</div>
                        <div class="file-details">
                            <div class="file-name">${this.escapeHtml(file.name)}</div>
                            <div class="file-size">${this.formatFileSize(file.size)}</div>
                        </div>
                    </div>
                    
                    <div class="storage-options">
                        <div class="storage-option" data-storage="database">
                            <div class="option-header">
                                <div class="option-icon">🗄️</div>
                                <div class="option-title">数据库存储</div>
                                <div class="option-badge recommended">推荐</div>
                            </div>
                            <div class="option-description">
                                • 快速访问，无需外部依赖<br>
                                • 适合10MB以内的文件<br>
                                • 永久保存，不会过期
                            </div>
                        </div>
                        
                        ${s3Available ? `
                        <div class="storage-option" data-storage="s3">
                            <div class="option-header">
                                <div class="option-icon">☁️</div>
                                <div class="option-title">S3云存储</div>
                            </div>
                            <div class="option-description">
                                • 支持大文件存储<br>
                                • CDN加速访问<br>
                                • 需要配置S3服务
                            </div>
                        </div>
                        ` : `
                        <div class="storage-option disabled">
                            <div class="option-header">
                                <div class="option-icon">☁️</div>
                                <div class="option-title">S3云存储</div>
                                <div class="option-badge">未配置</div>
                            </div>
                            <div class="option-description">
                                需要先配置S3存储服务
                            </div>
                        </div>
                        `}
                    </div>
                    
                    <div class="modal-actions">
                        <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">取消</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 绑定点击事件
        modal.querySelectorAll('.storage-option:not(.disabled)').forEach(option => {
            option.addEventListener('click', async () => {
                const storageType = option.dataset.storage;
                modal.remove();
                
                if (storageType === 'database') {
                    await this.uploadToDatabase(file);
                } else if (storageType === 's3') {
                    await this.uploadToS3(file);
                }
            });
        });
    }

    // 显示上传选项模态框
    showUploadOptionsModal() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'block';
        
        const s3Available = window.s3ConfigManager && window.s3ConfigManager.isConfigured();
        
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h3>选择文件上传方式</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">
                        <svg viewBox="0 0 24 24" width="20" height="20">
                            <path fill="currentColor" d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
                        </svg>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="upload-options">
                        <div class="upload-option" data-type="database">
                            <div class="option-header">
                                <div class="option-icon">🗄️</div>
                                <div class="option-title">数据库存储</div>
                                <div class="option-badge recommended">推荐</div>
                            </div>
                            <div class="option-description">
                                • 支持图片、文档、音频、视频等<br>
                                • 文件大小限制：10MB<br>
                                • 快速访问，永久保存
                            </div>
                        </div>
                        
                        ${s3Available ? `
                        <div class="upload-option" data-type="s3">
                            <div class="option-header">
                                <div class="option-icon">☁️</div>
                                <div class="option-title">S3云存储</div>
                            </div>
                            <div class="option-description">
                                • 支持所有文件类型<br>
                                • 文件大小限制：50MB<br>
                                • CDN加速，适合大文件
                            </div>
                        </div>
                        ` : `
                        <div class="upload-option disabled">
                            <div class="option-header">
                                <div class="option-icon">☁️</div>
                                <div class="option-title">S3云存储</div>
                                <div class="option-badge">未配置</div>
                            </div>
                            <div class="option-description">
                                需要先配置S3存储服务
                            </div>
                        </div>
                        `}
                    </div>
                    
                    <div class="modal-actions">
                        <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">取消</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 绑定点击事件
        modal.querySelectorAll('.upload-option:not(.disabled)').forEach(option => {
            option.addEventListener('click', () => {
                const uploadType = option.dataset.type;
                modal.remove();
                
                const fileInput = document.getElementById('fileInput');
                if (uploadType === 'database') {
                    fileInput.setAttribute('data-upload-type', 'database');
                } else {
                    fileInput.setAttribute('data-upload-type', 's3');
                }
                fileInput.click();
            });
        });
    }

    // 处理数据库上传
    async handleDatabaseUpload(files) {
        for (const file of files) {
            if (!this.validateFile(file)) continue;
            await this.uploadToDatabase(file);
        }
    }

    // 处理S3上传
    async handleS3Upload(files) {
        for (const file of files) {
            if (!this.validateFile(file)) continue;
            await this.uploadToS3(file);
        }
    }

    // 上传到数据库
    async uploadToDatabase(file) {
        const uploadMessage = this.createUploadMessage(file, 'database');
        
        try {
            const result = await this.databaseUpload.uploadToDatabase(file, (progress) => {
                this.updateUploadProgress(uploadMessage, progress);
            });

            // 上传成功，发送文件消息
            await this.sendFileMessage({
                ...result,
                storageType: 'database'
            }, uploadMessage);

        } catch (error) {
            console.error('数据库文件上传失败:', error);
            this.updateUploadError(uploadMessage, error.message);
        }
    }

    // 上传到S3
    async uploadToS3(file) {
        if (!window.s3ConfigManager || !window.s3ConfigManager.isConfigured()) {
            this.showError('S3存储未配置，无法上传大文件');
            return;
        }

        const uploadMessage = this.createUploadMessage(file, 's3');
        
        try {
            const result = await window.s3ConfigManager.uploadFile(file, (progress) => {
                this.updateUploadProgress(uploadMessage, progress);
            });

            // 上传成功，发送文件消息
            await this.sendFileMessage({
                ...result,
                storageType: 's3'
            }, uploadMessage);

        } catch (error) {
            console.error('S3文件上传失败:', error);
            this.updateUploadError(uploadMessage, error.message);
        }
    }

    validateFile(file) {
        // 检查文件大小
        if (file.size > this.maxFileSize) {
            this.showError(`文件 "${file.name}" 超过最大限制 (50MB)`);
            return false;
        }

        // 检查文件类型
        if (!this.allowedTypes.includes(file.type)) {
            this.showError(`不支持的文件类型: "${file.name}"`);
            return false;
        }

        return true;
    }

    createUploadMessage(file, storageType = 'unknown') {
        const messageList = document.getElementById('messageList');
        if (!messageList) return null;

        const messageDiv = document.createElement('div');
        messageDiv.className = 'message own upload-message';
        
        const fileIcon = this.getFileIcon(file.type);
        const fileSize = this.formatFileSize(file.size);
        const storageIcon = storageType === 'database' ? '🗄️' : storageType === 's3' ? '☁️' : '📁';

        messageDiv.innerHTML = `
            <div class="message-content">
                <div class="file-upload-info">
                    <div class="file-icon">${fileIcon}</div>
                    <div class="file-details">
                        <div class="file-name">${this.escapeHtml(file.name)}</div>
                        <div class="file-size">${fileSize} • ${storageIcon} ${storageType === 'database' ? '数据库存储' : storageType === 's3' ? 'S3存储' : '存储中'}</div>
                    </div>
                </div>
                <div class="upload-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: 0%"></div>
                    </div>
                    <div class="progress-text">准备上传...</div>
                </div>
            </div>
            <div class="message-time">${this.formatTime(new Date())}</div>
        `;

        messageList.appendChild(messageDiv);
        messageList.scrollTop = messageList.scrollHeight;

        return messageDiv;
    }

    updateUploadProgress(messageElement, progress) {
        if (!messageElement) return;

        const progressFill = messageElement.querySelector('.progress-fill');
        const progressText = messageElement.querySelector('.progress-text');

        if (progressFill) {
            progressFill.style.width = `${progress}%`;
        }

        if (progressText) {
            progressText.textContent = `上传中... ${Math.round(progress)}%`;
        }
    }

    updateUploadError(messageElement, errorMessage) {
        if (!messageElement) return;

        const uploadProgress = messageElement.querySelector('.upload-progress');
        if (uploadProgress) {
            uploadProgress.innerHTML = `
                <div class="upload-error">
                    <span class="error-icon">❌</span>
                    <span class="error-text">上传失败: ${this.escapeHtml(errorMessage)}</span>
                </div>
            `;
        }

        messageElement.classList.add('upload-error');
    }

    async sendFileMessage(fileResult, uploadMessageElement) {
        try {
            // 移除上传进度消息
            if (uploadMessageElement && uploadMessageElement.parentNode) {
                uploadMessageElement.parentNode.removeChild(uploadMessageElement);
            }

            console.log('准备发送文件消息:', fileResult);

            // 发送文件消息到服务器
            const messageData = {
                type: 'file',
                file: {
                    url: fileResult.fileUrl || fileResult.url,
                    fileName: fileResult.fileName,
                    fileSize: fileResult.size || fileResult.fileSize,
                    fileType: fileResult.fileType || fileResult.mimeType,
                    key: fileResult.key,
                    storageType: fileResult.storageType
                },
                timestamp: new Date().toISOString()
            };

            console.log('发送文件消息数据:', messageData);

            // 获取用户名
            let username = '匿名用户';
            if (window.authManager && window.authManager.isLoggedIn()) {
                const user = window.authManager.getCurrentUser();
                username = user.username;
            }

            // 通过Socket.IO发送文件消息
            if (window.chatManager && window.chatManager.socket && window.chatManager.isConnected) {
                console.log('通过Socket.IO发送文件消息');
                window.chatManager.socket.emit('file_message', messageData);
            } else {
                console.log('Socket未连接，尝试HTTP方式发送');
                // 如果Socket未连接，尝试通过HTTP API发送
                let token = localStorage.getItem('token');
                if (!token && window.authManager && window.authManager.isLoggedIn()) {
                    const user = window.authManager.getCurrentUser();
                    if (user && user.token) {
                        token = user.token;
                    }
                }
                
                if (token) {
                    const response = await fetch('/api/messages/send', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            type: 'file',
                            content: `[文件] ${messageData.file.fileName}`,
                            username: username,
                            file: messageData.file
                        })
                    });

                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({ message: 'HTTP发送失败' }));
                        throw new Error(errorData.message || 'HTTP发送失败');
                    }
                    
                    console.log('HTTP方式发送成功');
                    
                    // HTTP发送成功后，手动添加消息到UI（因为没有Socket事件）
                    if (window.chatManager) {
                        window.chatManager.handleNewMessage(messageData);
                    }
                } else {
                    throw new Error('无法发送消息：未登录且Socket未连接');
                }
            }

        } catch (error) {
            console.error('发送文件消息失败:', error);
            this.showError('文件上传成功，但发送消息失败: ' + error.message);
        }
    }

    getFileIcon(fileType) {
        if (fileType.startsWith('image/')) return '🖼️';
        if (fileType.startsWith('video/')) return '🎥';
        if (fileType.startsWith('audio/')) return '🎵';
        if (fileType === 'application/pdf') return '📄';
        if (fileType.includes('word')) return '📝';
        if (fileType === 'text/plain') return '📄';
        if (fileType.includes('zip') || fileType.includes('rar')) return '📦';
        return '📎';
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    formatTime(date) {
        return date.toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showError(message) {
        // 创建错误提示
        const errorDiv = document.createElement('div');
        errorDiv.className = 'upload-error-toast';
        errorDiv.textContent = message;
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ff4757;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            font-size: 14px;
            font-weight: 500;
            animation: slideInRight 0.3s ease-out;
            max-width: 300px;
        `;

        document.body.appendChild(errorDiv);

        // 3秒后自动移除
        setTimeout(() => {
            errorDiv.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => {
                if (errorDiv.parentNode) {
                    errorDiv.parentNode.removeChild(errorDiv);
                }
            }, 300);
        }, 3000);
    }

    // 创建文件消息元素
    createFileMessage(messageData, isOwn = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isOwn ? 'own' : 'other'} file-message`;
        
        const file = messageData.file;
        const fileIcon = this.getFileIcon(file.fileType);
        const fileSize = this.formatFileSize(file.fileSize);
        const isImage = file.fileType.startsWith('image/');
        const isVideo = file.fileType.startsWith('video/');
        const isAudio = file.fileType.startsWith('audio/');
        const storageIcon = file.storageType === 'database' ? '🗄️' : file.storageType === 's3' ? '☁️' : '📁';

        let fileContent = '';

        if (isImage) {
            fileContent = `
                <div class="file-preview image-preview">
                    <img src="${file.url}" alt="${this.escapeHtml(file.fileName)}"
                         onclick="window.open('${file.url}', '_blank')"
                         style="max-width: 300px; max-height: 200px; cursor: pointer; border-radius: 8px;">
                </div>
            `;
        } else if (isVideo) {
            fileContent = `
                <div class="file-preview video-preview">
                    <video controls style="max-width: 300px; max-height: 200px; border-radius: 8px;">
                        <source src="${file.url}" type="${file.fileType}">
                        您的浏览器不支持视频播放。
                    </video>
                </div>
            `;
        } else if (isAudio) {
            fileContent = `
                <div class="file-preview audio-preview">
                    <audio controls style="width: 300px;">
                        <source src="${file.url}" type="${file.fileType}">
                        您的浏览器不支持音频播放。
                    </audio>
                </div>
            `;
        }

        fileContent += `
            <div class="file-info">
                <div class="file-icon">${fileIcon}</div>
                <div class="file-details">
                    <div class="file-name">${this.escapeHtml(file.fileName)}</div>
                    <div class="file-size">${fileSize} • ${storageIcon} ${file.storageType === 'database' ? '数据库存储' : file.storageType === 's3' ? 'S3存储' : '存储'}</div>
                </div>
                <a href="${file.url}" target="_blank" class="download-btn" title="下载文件">
                    <svg viewBox="0 0 24 24" width="16" height="16">
                        <path fill="currentColor" d="M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z"/>
                    </svg>
                </a>
            </div>
        `;

        messageDiv.innerHTML = `
            <div class="message-content">
                ${fileContent}
            </div>
            <div class="message-time">${this.formatTime(new Date(messageData.timestamp))}</div>
        `;

        return messageDiv;
    }

    // 设置粘贴上传功能
    setupPasteUpload() {
        // 避免重复绑定
        if (this.pasteEventBound) return;
        this.pasteEventBound = true;
        
        // 监听全局粘贴事件
        document.addEventListener('paste', (event) => {
            // 检查是否在聊天输入框或消息区域
            const activeElement = document.activeElement;
            const messageText = document.getElementById('messageText');
            const messageList = document.getElementById('messageList');
            
            if (!window.authManager || !window.authManager.isLoggedIn()) {
                return; // 未登录时不处理粘贴
            }
            
            // 只在聊天相关区域处理粘贴
            if (activeElement === messageText ||
                messageList && messageList.contains(activeElement) ||
                activeElement === document.body) {
                
                this.handlePasteEvent(event);
            }
        });
    }

    // 处理粘贴事件
    async handlePasteEvent(event) {
        const clipboardData = event.clipboardData || window.clipboardData;
        if (!clipboardData) return;

        const items = Array.from(clipboardData.items);
        const files = [];

        // 检查粘贴的内容中是否有文件
        for (const item of items) {
            if (item.kind === 'file') {
                const file = item.getAsFile();
                if (file) {
                    files.push(file);
                }
            }
        }

        if (files.length > 0) {
            event.preventDefault(); // 阻止默认粘贴行为
            
            // 显示粘贴提示
            this.showPasteNotification(files.length);
            
            try {
                // 直接处理粘贴的文件，优先使用数据库存储
                for (const file of files) {
                    console.log('处理粘贴文件:', file.name, file.size, file.type);
                    
                    // 检查文件是否适合数据库存储
                    const eligibility = this.databaseUpload.isFileEligibleForDatabase(file);
                    
                    if (eligibility.eligible) {
                        console.log('粘贴文件适合数据库存储，直接上传');
                        await this.uploadToDatabase(file);
                    } else {
                        console.log('粘贴文件不适合数据库存储:', eligibility.reason);
                        this.showError(`文件 "${file.name}" ${eligibility.reason}`);
                    }
                }
            } catch (error) {
                console.error('粘贴文件处理失败:', error);
                this.showError('粘贴文件处理失败: ' + error.message);
            }
        }
    }

    // 显示粘贴提示
    showPasteNotification(fileCount) {
        const notification = document.createElement('div');
        notification.className = 'paste-notification';
        notification.textContent = `检测到 ${fileCount} 个文件，正在处理...`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #007bff;
            color: white;
            padding: 8px 16px;
            border-radius: 6px;
            font-size: 14px;
            z-index: 10000;
            animation: slideInDown 0.3s ease-out;
        `;

        document.body.appendChild(notification);

        // 3秒后自动移除
        setTimeout(() => {
            notification.style.animation = 'slideOutUp 0.3s ease-in';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// 导出增强的文件上传管理器实例
window.enhancedFileUploadManager = new EnhancedFileUploadManager();