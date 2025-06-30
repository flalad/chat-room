// 数据库文件上传组件
class DatabaseFileUpload {
    constructor() {
        this.maxFileSize = 10 * 1024 * 1024; // 10MB
        this.supportedTypes = [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'application/pdf', 'text/plain', 'text/csv',
            'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'audio/mpeg', 'audio/wav', 'audio/ogg',
            'video/mp4', 'video/webm', 'video/ogg'
        ];
    }

    // 检查文件是否适合数据库存储
    isFileEligibleForDatabase(file) {
        // 检查文件大小
        if (file.size > this.maxFileSize) {
            return {
                eligible: false,
                reason: `文件大小超过10MB限制（当前：${this.formatFileSize(file.size)}）`
            };
        }

        // 检查文件类型
        if (!this.supportedTypes.includes(file.type)) {
            return {
                eligible: false,
                reason: `不支持的文件类型：${file.type}`
            };
        }

        return { eligible: true };
    }

    // 上传文件到数据库
    async uploadToDatabase(file, onProgress = null) {
        return new Promise((resolve, reject) => {
            // 检查文件是否适合数据库存储
            const eligibility = this.isFileEligibleForDatabase(file);
            if (!eligibility.eligible) {
                reject(new Error(eligibility.reason));
                return;
            }

            const reader = new FileReader();
            
            reader.onload = async (e) => {
                try {
                    if (onProgress) onProgress(50);
                    
                    // 获取base64数据（去掉data:mime/type;base64,前缀）
                    const base64Data = e.target.result.split(',')[1];
                    
                    const token = localStorage.getItem('token');
                    if (!token) {
                        throw new Error('未登录，请先登录');
                    }

                    if (onProgress) onProgress(75);

                    console.log('开始上传文件到数据库:', file.name, file.type, file.size);

                    const response = await fetch('/api/files/upload-to-db', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            fileName: file.name,
                            fileType: file.type,
                            fileData: base64Data
                        })
                    });

                    if (onProgress) onProgress(90);

                    console.log('上传响应状态:', response.status);

                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({ message: '上传失败' }));
                        console.error('上传失败:', errorData);
                        throw new Error(errorData.message || '上传失败');
                    }

                    const result = await response.json();
                    console.log('上传成功:', result);
                    
                    if (onProgress) onProgress(100);
                    
                    resolve({
                        success: true,
                        fileId: result.fileId,
                        fileUrl: result.fileUrl,
                        fileName: result.fileName,
                        size: result.size,
                        mimeType: file.type,
                        storageType: 'database'
                    });

                } catch (error) {
                    console.error('数据库上传错误:', error);
                    reject(error);
                }
            };

            reader.onerror = () => {
                reject(new Error('文件读取失败'));
            };

            if (onProgress) onProgress(25);
            reader.readAsDataURL(file);
        });
    }

    // 创建文件上传UI
    createUploadUI(container, onFileUploaded = null) {
        const uploadArea = document.createElement('div');
        uploadArea.className = 'database-upload-area';
        uploadArea.innerHTML = `
            <div class="upload-zone" id="dbUploadZone">
                <div class="upload-icon">📁</div>
                <div class="upload-text">
                    <p><strong>拖拽文件到此处或点击选择</strong></p>
                    <p class="upload-hint">支持图片、文档、音频、视频等文件，最大10MB</p>
                </div>
                <input type="file" id="dbFileInput" multiple accept="${this.supportedTypes.join(',')}" style="display: none;">
            </div>
            <div class="upload-progress" id="dbUploadProgress" style="display: none;">
                <div class="progress-bar">
                    <div class="progress-fill" id="dbProgressFill"></div>
                </div>
                <div class="progress-text" id="dbProgressText">上传中...</div>
            </div>
            <div class="upload-result" id="dbUploadResult"></div>
        `;

        // 添加样式
        if (!document.getElementById('database-upload-styles')) {
            const styles = document.createElement('style');
            styles.id = 'database-upload-styles';
            styles.textContent = `
                .database-upload-area {
                    margin: 1rem 0;
                }
                
                .upload-zone {
                    border: 2px dashed #ddd;
                    border-radius: 8px;
                    padding: 2rem;
                    text-align: center;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    background: #fafafa;
                }
                
                .upload-zone:hover {
                    border-color: #007bff;
                    background: #f0f8ff;
                }
                
                .upload-zone.dragover {
                    border-color: #007bff;
                    background: #e3f2fd;
                }
                
                .upload-icon {
                    font-size: 3rem;
                    margin-bottom: 1rem;
                }
                
                .upload-text p {
                    margin: 0.5rem 0;
                }
                
                .upload-hint {
                    color: #666;
                    font-size: 0.9rem;
                }
                
                .upload-progress {
                    margin: 1rem 0;
                }
                
                .progress-bar {
                    width: 100%;
                    height: 8px;
                    background: #e0e0e0;
                    border-radius: 4px;
                    overflow: hidden;
                }
                
                .progress-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #007bff, #0056b3);
                    width: 0%;
                    transition: width 0.3s ease;
                }
                
                .progress-text {
                    text-align: center;
                    margin-top: 0.5rem;
                    font-size: 0.9rem;
                    color: #666;
                }
                
                .upload-result {
                    margin: 1rem 0;
                }
                
                .file-item {
                    display: flex;
                    align-items: center;
                    padding: 0.5rem;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    margin: 0.5rem 0;
                    background: white;
                }
                
                .file-icon {
                    margin-right: 0.5rem;
                    font-size: 1.2rem;
                }
                
                .file-info {
                    flex: 1;
                }
                
                .file-name {
                    font-weight: bold;
                    margin-bottom: 0.2rem;
                }
                
                .file-details {
                    font-size: 0.8rem;
                    color: #666;
                }
                
                .file-actions {
                    display: flex;
                    gap: 0.5rem;
                }
                
                .btn-small {
                    padding: 0.25rem 0.5rem;
                    font-size: 0.8rem;
                    border: none;
                    border-radius: 3px;
                    cursor: pointer;
                    text-decoration: none;
                    display: inline-block;
                }
                
                .btn-primary {
                    background: #007bff;
                    color: white;
                }
                
                .btn-success {
                    background: #28a745;
                    color: white;
                }
            `;
            document.head.appendChild(styles);
        }

        container.appendChild(uploadArea);

        // 绑定事件
        this.bindUploadEvents(uploadArea, onFileUploaded);
    }

    // 绑定上传事件
    bindUploadEvents(uploadArea, onFileUploaded) {
        const uploadZone = uploadArea.querySelector('#dbUploadZone');
        const fileInput = uploadArea.querySelector('#dbFileInput');
        const progressArea = uploadArea.querySelector('#dbUploadProgress');
        const progressFill = uploadArea.querySelector('#dbProgressFill');
        const progressText = uploadArea.querySelector('#dbProgressText');
        const resultArea = uploadArea.querySelector('#dbUploadResult');

        // 点击上传区域
        uploadZone.addEventListener('click', () => {
            fileInput.click();
        });

        // 文件选择
        fileInput.addEventListener('change', (e) => {
            this.handleFiles(Array.from(e.target.files), progressArea, progressFill, progressText, resultArea, onFileUploaded);
        });

        // 拖拽事件
        uploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadZone.classList.add('dragover');
        });

        uploadZone.addEventListener('dragleave', () => {
            uploadZone.classList.remove('dragover');
        });

        uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadZone.classList.remove('dragover');
            const files = Array.from(e.dataTransfer.files);
            this.handleFiles(files, progressArea, progressFill, progressText, resultArea, onFileUploaded);
        });
    }

    // 处理文件上传
    async handleFiles(files, progressArea, progressFill, progressText, resultArea, onFileUploaded) {
        if (files.length === 0) return;

        progressArea.style.display = 'block';
        resultArea.innerHTML = '';

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            
            try {
                progressText.textContent = `上传文件 ${i + 1}/${files.length}: ${file.name}`;
                
                const result = await this.uploadToDatabase(file, (progress) => {
                    const totalProgress = ((i / files.length) + (progress / 100 / files.length)) * 100;
                    progressFill.style.width = `${totalProgress}%`;
                });

                // 显示上传结果
                this.displayFileResult(resultArea, file, result);
                
                // 回调通知
                if (onFileUploaded) {
                    onFileUploaded(result);
                }

            } catch (error) {
                console.error('文件上传失败:', error);
                this.displayFileError(resultArea, file, error.message);
            }
        }

        progressArea.style.display = 'none';
        progressFill.style.width = '0%';
    }

    // 显示文件上传结果
    displayFileResult(container, file, result) {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        
        const fileIcon = this.getFileIcon(file.type);
        
        fileItem.innerHTML = `
            <div class="file-icon">${fileIcon}</div>
            <div class="file-info">
                <div class="file-name">${file.name}</div>
                <div class="file-details">
                    ${this.formatFileSize(result.size)} • 数据库存储 • 上传成功
                </div>
            </div>
            <div class="file-actions">
                <a href="${result.fileUrl}" target="_blank" class="btn-small btn-primary">查看</a>
                <button class="btn-small btn-success" onclick="navigator.clipboard.writeText('${result.fileUrl}')">复制链接</button>
            </div>
        `;
        
        container.appendChild(fileItem);
    }

    // 显示文件上传错误
    displayFileError(container, file, errorMessage) {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.style.borderColor = '#dc3545';
        fileItem.style.background = '#fff5f5';
        
        fileItem.innerHTML = `
            <div class="file-icon">❌</div>
            <div class="file-info">
                <div class="file-name">${file.name}</div>
                <div class="file-details" style="color: #dc3545;">
                    ${this.formatFileSize(file.size)} • 上传失败: ${errorMessage}
                </div>
            </div>
        `;
        
        container.appendChild(fileItem);
    }

    // 获取文件图标
    getFileIcon(mimeType) {
        if (mimeType.startsWith('image/')) return '🖼️';
        if (mimeType.startsWith('video/')) return '🎥';
        if (mimeType.startsWith('audio/')) return '🎵';
        if (mimeType.includes('pdf')) return '📄';
        if (mimeType.includes('word')) return '📝';
        if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
        if (mimeType.includes('text')) return '📃';
        return '📁';
    }

    // 格式化文件大小
    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// 全局实例
window.DatabaseFileUpload = DatabaseFileUpload;