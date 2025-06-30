// 文件上传管理模块
class FileUploadManager {
    constructor() {
        this.maxFileSize = 50 * 1024 * 1024; // 50MB
        this.allowedTypes = [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'video/mp4', 'video/webm', 'video/ogg',
            'audio/mp3', 'audio/wav', 'audio/ogg',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain',
            'application/zip',
            'application/x-rar-compressed'
        ];
        this.init();
    }

    init() {
        this.bindEvents();
    }

    bindEvents() {
        // 文件上传按钮
        const attachmentBtn = document.getElementById('attachmentBtn');
        const fileInput = document.getElementById('fileInput');

        if (attachmentBtn && fileInput) {
            attachmentBtn.addEventListener('click', () => {
                if (!window.authManager.isLoggedIn()) {
                    this.showError('请先登录后再上传文件');
                    return;
                }

                if (!window.s3ConfigManager.isConfigured()) {
                    this.showError('请先配置S3存储后再上传文件');
                    return;
                }

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

            if (!window.s3ConfigManager.isConfigured()) {
                this.showError('请先配置S3存储后再上传文件');
                return;
            }

            const files = Array.from(event.dataTransfer.files);
            this.handleFiles(files);
        });
    }

    handleFileSelect(event) {
        const files = Array.from(event.target.files);
        this.handleFiles(files);
        
        // 清空文件输入，允许重复选择同一文件
        event.target.value = '';
    }

    async handleFiles(files) {
        if (files.length === 0) return;

        // 验证文件
        const validFiles = [];
        for (const file of files) {
            if (this.validateFile(file)) {
                validFiles.push(file);
            }
        }

        if (validFiles.length === 0) return;

        // 上传文件
        for (const file of validFiles) {
            await this.uploadFile(file);
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

    async uploadFile(file) {
        // 创建上传进度消息
        const uploadMessage = this.createUploadMessage(file);
        
        try {
            // 上传文件到S3
            const result = await window.s3ConfigManager.uploadFile(file, (progress) => {
                this.updateUploadProgress(uploadMessage, progress);
            });

            // 上传成功，发送文件消息
            this.sendFileMessage(result, uploadMessage);

        } catch (error) {
            console.error('文件上传失败:', error);
            this.updateUploadError(uploadMessage, error.message);
        }
    }

    createUploadMessage(file) {
        const messageList = document.getElementById('messageList');
        if (!messageList) return null;

        const messageDiv = document.createElement('div');
        messageDiv.className = 'message own upload-message';
        
        const fileIcon = this.getFileIcon(file.type);
        const fileSize = this.formatFileSize(file.size);

        messageDiv.innerHTML = `
            <div class="message-content">
                <div class="file-upload-info">
                    <div class="file-icon">${fileIcon}</div>
                    <div class="file-details">
                        <div class="file-name">${this.escapeHtml(file.name)}</div>
                        <div class="file-size">${fileSize}</div>
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

            // 发送文件消息到服务器
            const messageData = {
                type: 'file',
                file: {
                    url: fileResult.url,
                    fileName: fileResult.fileName,
                    fileSize: fileResult.fileSize,
                    fileType: fileResult.fileType,
                    key: fileResult.key
                },
                timestamp: new Date().toISOString()
            };

            // 通过Socket.IO发送文件消息
            if (window.chatManager && window.chatManager.socket) {
                window.chatManager.socket.emit('file_message', messageData);
            }

        } catch (error) {
            console.error('发送文件消息失败:', error);
            this.showError('文件上传成功，但发送消息失败');
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
        messageDiv.className = `message ${isOwn ? 'own' : ''} file-message`;
        
        const file = messageData.file;
        const fileIcon = this.getFileIcon(file.fileType);
        const fileSize = this.formatFileSize(file.fileSize);
        const isImage = file.fileType.startsWith('image/');
        const isVideo = file.fileType.startsWith('video/');
        const isAudio = file.fileType.startsWith('audio/');

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
                    <div class="file-size">${fileSize}</div>
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
}

// 导出文件上传管理器实例
window.fileUploadManager = new FileUploadManager();