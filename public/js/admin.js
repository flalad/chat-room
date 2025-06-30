// 管理员后台JavaScript

class AdminPanel {
    constructor() {
        this.currentPage = 'dashboard';
        this.adminToken = localStorage.getItem('adminToken');
        this.adminInfo = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.checkAdminAuth();
    }

    bindEvents() {
        // 登录表单事件
        const loginForm = document.getElementById('adminLoginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // 导航事件
        document.addEventListener('click', (e) => {
            if (e.target.matches('.nav-item') || e.target.closest('.nav-item')) {
                e.preventDefault();
                const navItem = e.target.closest('.nav-item');
                const page = navItem.dataset.page;
                this.navigateTo(page);
            }
        });

        // 退出登录事件
        const logoutBtn = document.getElementById('adminLogoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }

        // 前往聊天室事件
        const gotoChatBtn = document.getElementById('gotoChatBtn');
        if (gotoChatBtn) {
            gotoChatBtn.addEventListener('click', () => this.gotoChat());
        }

        // 刷新按钮事件
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshCurrentPage());
        }
    }

    // 检查管理员认证状态
    async checkAdminAuth() {
        if (this.adminToken) {
            try {
                const response = await fetch('/api/admin/verify', {
                    headers: {
                        'Authorization': `Bearer ${this.adminToken}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    this.adminInfo = data.admin;
                    this.showAdminPanel();
                    this.loadDashboard();
                } else {
                    this.showLoginPage();
                }
            } catch (error) {
                console.error('验证管理员身份失败:', error);
                this.showLoginPage();
            }
        } else {
            this.showLoginPage();
        }
    }

    // 处理管理员登录
    async handleLogin(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const username = formData.get('username');
        const password = formData.get('password');

        this.showMessage('正在登录...', 'info');

        try {
            const response = await fetch('/api/admin/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok) {
                this.adminToken = data.token;
                this.adminInfo = data.admin;
                localStorage.setItem('adminToken', this.adminToken);
                
                this.showMessage('登录成功！', 'success');
                setTimeout(() => {
                    this.showAdminPanel();
                    this.loadDashboard();
                }, 1000);
            } else {
                this.showMessage(data.message || '登录失败', 'error');
            }
        } catch (error) {
            console.error('登录失败:', error);
            this.showMessage('登录失败，请重试', 'error');
        }
    }

    // 处理退出登录
    handleLogout() {
        if (confirm('确定要退出登录吗？')) {
            localStorage.removeItem('adminToken');
            this.adminToken = null;
            this.adminInfo = null;
            this.showLoginPage();
        }
    }

    // 前往聊天室
    gotoChat() {
        console.log('准备跳转到聊天室...');
        console.log('管理员信息:', this.adminInfo);
        console.log('管理员token:', this.adminToken ? '存在' : '不存在');
        
        // 将管理员登录信息同步到聊天室认证系统
        if (this.adminInfo && this.adminToken) {
            // 创建用户信息对象，标记为管理员
            const userInfo = {
                id: this.adminInfo.id || 'admin',
                username: this.adminInfo.username || 'admin',
                role: 'admin',
                isAdmin: true
            };
            
            console.log('创建的用户信息对象:', userInfo);
            
            // 将管理员信息存储到localStorage，供聊天室使用
            localStorage.setItem('user', JSON.stringify(userInfo));
            localStorage.setItem('token', this.adminToken);
            
            console.log('已将认证信息存储到localStorage');
            console.log('存储的用户信息:', localStorage.getItem('user'));
            console.log('存储的token:', localStorage.getItem('token') ? '存在' : '不存在');
            
            // 跳转到聊天室（同一标签页）
            window.location.href = '/';
        } else {
            console.warn('缺少管理员认证信息，直接跳转到聊天室');
            // 如果没有登录信息，直接跳转
            window.location.href = '/';
        }
    }

    // 显示登录页面
    showLoginPage() {
        document.getElementById('adminLogin').style.display = 'flex';
        document.getElementById('adminPanel').style.display = 'none';
    }

    // 显示管理员面板
    showAdminPanel() {
        document.getElementById('adminLogin').style.display = 'none';
        document.getElementById('adminPanel').style.display = 'block';
        
        // 更新管理员信息显示
        if (this.adminInfo) {
            const adminNameEl = document.getElementById('adminName');
            if (adminNameEl) {
                adminNameEl.textContent = this.adminInfo.username || '管理员';
            }
        }
    }

    // 导航到指定页面
    navigateTo(page) {
        // 更新导航状态
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-page="${page}"]`).classList.add('active');

        // 更新页面标题
        const titles = {
            'dashboard': '仪表板',
            's3-config': 'S3存储配置',
            'file-management': '文件管理',
            'image-gallery': '图片管理',
            'user-management': '用户管理',
            'system-settings': '系统设置'
        };
        document.getElementById('pageTitle').textContent = titles[page] || '管理后台';

        this.currentPage = page;
        this.loadPage(page);
    }

    // 加载页面内容
    async loadPage(page) {
        const mainContent = document.getElementById('mainContent');
        
        switch (page) {
            case 'dashboard':
                this.loadDashboard();
                break;
            case 's3-config':
                this.loadS3Config();
                break;
            case 'file-management':
                this.loadFileManagement();
                break;
            case 'image-gallery':
                this.loadImageGallery();
                break;
            case 'user-management':
                this.loadUserManagement();
                break;
            case 'system-settings':
                this.loadSystemSettings();
                break;
            default:
                mainContent.innerHTML = '<p>页面不存在</p>';
        }
    }

    // 加载仪表板
    async loadDashboard() {
        const mainContent = document.getElementById('mainContent');
        
        try {
            const response = await fetch('/api/admin/dashboard', {
                headers: {
                    'Authorization': `Bearer ${this.adminToken}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                mainContent.innerHTML = this.renderDashboard(data);
            } else {
                mainContent.innerHTML = '<p>加载仪表板数据失败</p>';
            }
        } catch (error) {
            console.error('加载仪表板失败:', error);
            mainContent.innerHTML = '<p>加载失败，请重试</p>';
        }
    }

    // 渲染仪表板
    renderDashboard(data) {
        return `
            <div class="dashboard-grid">
                <div class="dashboard-card">
                    <div class="card-header">
                        <div class="card-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
                            👥
                        </div>
                        <h3 class="card-title">在线用户</h3>
                    </div>
                    <div class="card-value">${data.onlineUsers || 0}</div>
                    <p class="card-description">当前在线聊天用户数量</p>
                </div>

                <div class="dashboard-card">
                    <div class="card-header">
                        <div class="card-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white;">
                            💬
                        </div>
                        <h3 class="card-title">今日消息</h3>
                    </div>
                    <div class="card-value">${data.todayMessages || 0}</div>
                    <p class="card-description">今天发送的消息总数</p>
                </div>

                <div class="dashboard-card">
                    <div class="card-header">
                        <div class="card-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white;">
                            📁
                        </div>
                        <h3 class="card-title">文件总数</h3>
                    </div>
                    <div class="card-value">${data.totalFiles || 0}</div>
                    <p class="card-description">系统中存储的文件数量</p>
                </div>

                <div class="dashboard-card">
                    <div class="card-header">
                        <div class="card-icon" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); color: white;">
                            💾
                        </div>
                        <h3 class="card-title">存储使用</h3>
                    </div>
                    <div class="card-value">${this.formatFileSize(data.storageUsed || 0)}</div>
                    <p class="card-description">已使用的存储空间</p>
                </div>
            </div>

            <div class="data-table">
                <div class="table-header">
                    <h3 class="table-title">最近活动</h3>
                </div>
                <div class="table-content">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>时间</th>
                                <th>用户</th>
                                <th>操作</th>
                                <th>状态</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${(data.recentActivities || []).map(activity => `
                                <tr>
                                    <td>${this.formatDate(activity.timestamp)}</td>
                                    <td>${activity.username}</td>
                                    <td>${activity.action}</td>
                                    <td><span class="status-indicator status-${activity.status}">${activity.status}</span></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    // 加载S3配置页面
    loadS3Config() {
        const mainContent = document.getElementById('mainContent');
        mainContent.innerHTML = `
            <div class="form-section">
                <h3 class="section-title">添加S3存储配置</h3>
                <form id="s3ConfigForm">
                    <input type="hidden" id="configId" name="configId">
                    <div class="form-row">
                        <div class="form-group-admin">
                            <label for="configName">配置名称</label>
                            <input type="text" id="configName" name="configName" required placeholder="如: 主存储、备份存储">
                            <small class="form-help">为这个存储配置起一个便于识别的名称</small>
                        </div>
                        <div class="form-group-admin">
                            <label for="s3Provider">存储提供商</label>
                            <select id="s3Provider" name="provider" required onchange="adminPanel.handleProviderChange()">
                                <option value="">请选择存储提供商</option>
                                <option value="aws">Amazon S3</option>
                                <option value="cloudflare">Cloudflare R2</option>
                                <option value="aliyun">阿里云OSS</option>
                                <option value="tencent">腾讯云COS</option>
                                <option value="qiniu">七牛云</option>
                                <option value="minio">MinIO</option>
                                <option value="other">其他S3兼容服务</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group-admin">
                            <label for="s3Region">区域</label>
                            <input type="text" id="s3Region" name="region" placeholder="如: us-east-1">
                            <small class="form-help" id="regionHelp">根据选择的提供商，区域格式可能不同</small>
                        </div>
                        <div class="form-group-admin">
                            <label for="s3Bucket">存储桶名称</label>
                            <input type="text" id="s3Bucket" name="bucket" required>
                            <small class="form-help">存储桶必须已经存在</small>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group-admin">
                            <label for="s3AccessKey">Access Key</label>
                            <input type="text" id="s3AccessKey" name="accessKey" required>
                            <small class="form-help" id="accessKeyHelp">访问密钥ID</small>
                        </div>
                        <div class="form-group-admin">
                            <label for="s3SecretKey">Secret Key</label>
                            <input type="password" id="s3SecretKey" name="secretKey" required>
                            <small class="form-help" id="secretKeyHelp">访问密钥</small>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group-admin">
                            <label for="s3Endpoint">自定义端点</label>
                            <input type="url" id="s3Endpoint" name="endpoint" placeholder="https://s3.example.com">
                            <small class="form-help" id="endpointHelp">某些提供商需要自定义端点</small>
                        </div>
                        <div class="form-group-admin">
                            <label for="s3Directory">存储目录 (可选)</label>
                            <input type="text" id="s3Directory" name="directory" placeholder="chat-files/" value="chat-files/">
                            <small class="form-help">文件存储的子目录，以/结尾</small>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group-admin">
                            <label for="storageLimit">存储容量限制 (MB)</label>
                            <input type="number" id="storageLimit" name="storageLimit" min="0" placeholder="0 = 无限制">
                            <small class="form-help">0表示无限制，设置后将限制总存储使用量</small>
                        </div>
                        <div class="form-group-admin">
                            <label>
                                <input type="checkbox" id="enableCDN" name="enableCDN">
                                启用CDN加速 (如果支持)
                            </label>
                            <small class="form-help">某些提供商支持CDN加速访问</small>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group-admin full-width">
                            <label>
                                <input type="checkbox" id="isDefault" name="isDefault">
                                设为默认存储
                            </label>
                            <small class="form-help">新上传的文件将使用默认存储</small>
                        </div>
                    </div>
                    
                    <div class="button-group">
                        <button type="button" class="btn btn-secondary" onclick="adminPanel.testS3Connection()">测试连接</button>
                        <button type="submit" class="btn btn-success" id="saveConfigBtn">保存配置</button>
                        <button type="button" class="btn btn-warning" id="cancelEditBtn" onclick="adminPanel.cancelEdit()" style="display: none;">取消编辑</button>
                    </div>
                </form>
            </div>
            
            <div class="form-section" style="margin-top: 2rem;">
                <h3 class="section-title">已配置的存储</h3>
                <div id="s3ConfigList" class="s3-config-list">
                    <div class="loading-spinner"></div> 正在加载存储配置...
                </div>
            </div>
            
            <div class="form-section" style="margin-top: 2rem;">
                <h3 class="section-title">存储使用情况</h3>
                <div id="storageUsage" class="storage-usage">
                    <div class="loading-spinner"></div> 正在加载存储使用情况...
                </div>
            </div>
        `;

        // 加载现有配置
        this.loadS3ConfigList();
        this.loadStorageUsage();

        // 绑定表单提交事件
        document.getElementById('s3ConfigForm').addEventListener('submit', (e) => this.saveS3Config(e));
    }

    // 加载S3配置列表
    async loadS3ConfigList() {
        try {
            const response = await fetch('/api/admin/s3-configs', {
                headers: {
                    'Authorization': `Bearer ${this.adminToken}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.renderS3ConfigList(data.configs || []);
            } else {
                document.getElementById('s3ConfigList').innerHTML = '<p>加载存储配置失败</p>';
            }
        } catch (error) {
            console.error('加载S3配置列表失败:', error);
            document.getElementById('s3ConfigList').innerHTML = '<p>加载失败</p>';
        }
    }

    // 渲染S3配置列表
    renderS3ConfigList(configs) {
        const listEl = document.getElementById('s3ConfigList');
        
        if (configs.length === 0) {
            listEl.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">☁️</div>
                    <p>还没有配置任何存储服务</p>
                    <p>请在上方添加您的第一个存储配置</p>
                </div>
            `;
            return;
        }

        listEl.innerHTML = configs.map(config => `
            <div class="s3-config-card ${config.isDefault ? 'default' : ''}" data-config-id="${config.id}">
                <div class="config-header">
                    <div class="config-info">
                        <h4 class="config-name">
                            ${this.escapeHtml(config.configName)}
                            ${config.isDefault ? '<span class="default-badge">默认</span>' : ''}
                        </h4>
                        <div class="config-details">
                            <span class="provider-badge provider-${config.provider}">${this.getProviderName(config.provider)}</span>
                            <span class="config-bucket">${this.escapeHtml(config.bucket)}</span>
                            <span class="config-region">${this.escapeHtml(config.region)}</span>
                        </div>
                    </div>
                    <div class="config-status">
                        <span class="status-indicator ${config.status || 'unknown'}" title="连接状态">
                            ${config.status === 'connected' ? '✅' : config.status === 'error' ? '❌' : '❓'}
                        </span>
                    </div>
                </div>
                
                <div class="config-stats">
                    <div class="stat-item">
                        <span class="stat-label">存储限制</span>
                        <span class="stat-value">${config.storageLimit > 0 ? this.formatFileSize(config.storageLimit * 1024 * 1024) : '无限制'}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">CDN加速</span>
                        <span class="stat-value">${config.enableCDN ? '已启用' : '未启用'}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">创建时间</span>
                        <span class="stat-value">${this.formatDate(config.createdAt)}</span>
                    </div>
                </div>
                
                <div class="config-actions">
                    <button class="btn btn-sm btn-secondary" onclick="adminPanel.testS3Config('${config.id}')" title="测试连接">
                        <svg viewBox="0 0 24 24" width="14" height="14">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                        </svg>
                        测试
                    </button>
                    <button class="btn btn-sm btn-primary" onclick="adminPanel.editS3Config('${config.id}')" title="编辑配置">
                        <svg viewBox="0 0 24 24" width="14" height="14">
                            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                        </svg>
                        编辑
                    </button>
                    ${!config.isDefault ? `
                    <button class="btn btn-sm btn-success" onclick="adminPanel.setDefaultS3Config('${config.id}')" title="设为默认">
                        <svg viewBox="0 0 24 24" width="14" height="14">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                        设为默认
                    </button>
                    ` : ''}
                    <button class="btn btn-sm btn-danger" onclick="adminPanel.deleteS3Config('${config.id}')" title="删除配置">
                        <svg viewBox="0 0 24 24" width="14" height="14">
                            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
                        </svg>
                        删除
                    </button>
                </div>
            </div>
        `).join('');
    }

    // 获取提供商显示名称
    getProviderName(provider) {
        const names = {
            'aws': 'Amazon S3',
            'cloudflare': 'Cloudflare R2',
            'aliyun': '阿里云OSS',
            'tencent': '腾讯云COS',
            'qiniu': '七牛云',
            'minio': 'MinIO',
            'other': '其他S3兼容'
        };
        return names[provider] || provider;
    }

    // 编辑S3配置
    async editS3Config(configId) {
        try {
            const response = await fetch(`/api/admin/s3-configs/${configId}`, {
                headers: {
                    'Authorization': `Bearer ${this.adminToken}`
                }
            });

            if (response.ok) {
                const config = await response.json();
                this.fillS3ConfigForm(config.data);
                document.getElementById('saveConfigBtn').textContent = '更新配置';
                document.getElementById('cancelEditBtn').style.display = 'inline-flex';
                
                // 滚动到表单
                document.getElementById('s3ConfigForm').scrollIntoView({ behavior: 'smooth' });
            } else {
                this.showMessage('加载配置失败', 'error');
            }
        } catch (error) {
            console.error('编辑S3配置失败:', error);
            this.showMessage('加载配置失败', 'error');
        }
    }

    // 填充S3配置表单
    fillS3ConfigForm(config) {
        document.getElementById('configId').value = config.id || '';
        document.getElementById('configName').value = config.configName || '';
        document.getElementById('s3Provider').value = config.provider || '';
        document.getElementById('s3Region').value = config.region || '';
        document.getElementById('s3Bucket').value = config.bucket || '';
        document.getElementById('s3AccessKey').value = config.accessKey || '';
        document.getElementById('s3SecretKey').value = ''; // 不显示密钥
        document.getElementById('s3Endpoint').value = config.endpoint || '';
        document.getElementById('s3Directory').value = config.directory || '';
        document.getElementById('storageLimit').value = config.storageLimit || '';
        document.getElementById('enableCDN').checked = config.enableCDN || false;
        document.getElementById('isDefault').checked = config.isDefault || false;
        
        // 触发提供商变化事件
        this.handleProviderChange();
    }

    // 取消编辑
    cancelEdit() {
        document.getElementById('s3ConfigForm').reset();
        document.getElementById('configId').value = '';
        document.getElementById('saveConfigBtn').textContent = '保存配置';
        document.getElementById('cancelEditBtn').style.display = 'none';
        document.getElementById('s3Directory').value = 'chat-files/';
    }

    // 设置默认S3配置
    async setDefaultS3Config(configId) {
        try {
            const response = await fetch(`/api/admin/s3-configs/${configId}/set-default`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.adminToken}`
                }
            });

            if (response.ok) {
                this.showMessage('默认存储设置成功', 'success');
                this.loadS3ConfigList(); // 重新加载列表
            } else {
                const result = await response.json();
                this.showMessage(result.message || '设置失败', 'error');
            }
        } catch (error) {
            console.error('设置默认存储失败:', error);
            this.showMessage('设置失败', 'error');
        }
    }

    // 删除S3配置
    async deleteS3Config(configId) {
        if (!confirm('确定要删除这个存储配置吗？此操作不可恢复。')) {
            return;
        }

        try {
            const response = await fetch(`/api/admin/s3-configs/${configId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.adminToken}`
                }
            });

            if (response.ok) {
                this.showMessage('存储配置删除成功', 'success');
                this.loadS3ConfigList(); // 重新加载列表
            } else {
                const result = await response.json();
                this.showMessage(result.message || '删除失败', 'error');
            }
        } catch (error) {
            console.error('删除存储配置失败:', error);
            this.showMessage('删除失败', 'error');
        }
    }

    // 测试指定的S3配置
    async testS3Config(configId) {
        this.showMessage('正在测试连接...', 'info');

        try {
            const response = await fetch(`/api/admin/s3-configs/${configId}/test`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.adminToken}`
                }
            });

            const result = await response.json();

            if (response.ok && result.success) {
                this.showMessage('连接测试成功！', 'success');
                this.loadS3ConfigList(); // 重新加载列表以更新状态
            } else {
                this.showMessage(result.message || '连接测试失败', 'error');
            }
        } catch (error) {
            console.error('测试S3配置失败:', error);
            this.showMessage('连接测试失败', 'error');
        }
    }

    // 加载S3配置数据
    async loadS3ConfigData() {
        try {
            const response = await fetch('/api/admin/s3-config', {
                headers: {
                    'Authorization': `Bearer ${this.adminToken}`
                }
            });

            if (response.ok) {
                const config = await response.json();
                if (config.data) {
                    // 填充表单
                    Object.keys(config.data).forEach(key => {
                        const input = document.querySelector(`[name="${key}"]`);
                        if (input && key !== 'secretKey') { // 不显示密钥
                            input.value = config.data[key] || '';
                        }
                    });
                }
            }
        } catch (error) {
            console.error('加载S3配置失败:', error);
        }
    }

    // 保存S3配置
    async saveS3Config(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const config = Object.fromEntries(formData.entries());
        const configId = config.configId;
        const isEdit = configId && configId.trim() !== '';

        // 验证必填字段
        if (!config.configName || !config.provider || !config.bucket || !config.region || !config.accessKey || !config.secretKey) {
            this.showMessage('请填写完整的配置信息', 'error');
            return;
        }

        try {
            const url = isEdit ? `/api/admin/s3-configs/${configId}` : '/api/admin/s3-configs';
            const method = isEdit ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.adminToken}`
                },
                body: JSON.stringify(config)
            });

            const result = await response.json();

            if (response.ok) {
                this.showMessage(isEdit ? 'S3配置更新成功！' : 'S3配置保存成功！', 'success');
                this.cancelEdit(); // 重置表单
                this.loadS3ConfigList(); // 重新加载列表
            } else {
                this.showMessage(result.message || '保存失败', 'error');
            }
        } catch (error) {
            console.error('保存S3配置失败:', error);
            this.showMessage('保存失败，请重试', 'error');
        }
    }

    // 测试S3连接
    async testS3Connection() {
        const form = document.getElementById('s3ConfigForm');
        const formData = new FormData(form);
        const config = Object.fromEntries(formData.entries());

        // 验证必填字段
        if (!config.provider || !config.bucket || !config.region || !config.accessKey || !config.secretKey) {
            this.showMessage('请先填写完整的配置信息', 'error');
            return;
        }

        this.showMessage('正在测试连接...', 'info');

        try {
            const response = await fetch('/api/admin/test-s3', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.adminToken}`
                },
                body: JSON.stringify(config)
            });

            const result = await response.json();

            if (response.ok && result.success) {
                this.showMessage('S3连接测试成功！文件上传和删除测试通过。', 'success');
            } else {
                this.showMessage(result.message || '连接测试失败', 'error');
            }
        } catch (error) {
            console.error('测试S3连接失败:', error);
            this.showMessage('连接测试失败，请重试', 'error');
        }
    }

    // 处理存储提供商变化
    handleProviderChange() {
        const provider = document.getElementById('s3Provider').value;
        const regionInput = document.getElementById('s3Region');
        const endpointInput = document.getElementById('s3Endpoint');
        const regionHelp = document.getElementById('regionHelp');
        const endpointHelp = document.getElementById('endpointHelp');
        const accessKeyHelp = document.getElementById('accessKeyHelp');
        const secretKeyHelp = document.getElementById('secretKeyHelp');

        // 根据提供商设置默认值和帮助文本
        switch (provider) {
            case 'aws':
                regionInput.placeholder = 'us-east-1';
                endpointInput.value = '';
                endpointInput.placeholder = '留空使用默认AWS端点';
                regionHelp.textContent = 'AWS区域，如: us-east-1, eu-west-1';
                endpointHelp.textContent = '留空使用默认AWS S3端点';
                accessKeyHelp.textContent = 'AWS Access Key ID';
                secretKeyHelp.textContent = 'AWS Secret Access Key';
                break;
                
            case 'cloudflare':
                regionInput.placeholder = 'auto';
                regionInput.value = 'auto';
                endpointInput.placeholder = 'https://[account-id].r2.cloudflarestorage.com';
                regionHelp.textContent = 'Cloudflare R2通常使用 "auto"';
                endpointHelp.textContent = '必填：您的Cloudflare R2端点URL';
                accessKeyHelp.textContent = 'R2 Token ID';
                secretKeyHelp.textContent = 'R2 Token Secret';
                break;
                
            case 'aliyun':
                regionInput.placeholder = 'oss-cn-hangzhou';
                endpointInput.placeholder = 'https://oss-cn-hangzhou.aliyuncs.com';
                regionHelp.textContent = '阿里云区域，如: oss-cn-hangzhou';
                endpointHelp.textContent = '阿里云OSS端点URL';
                accessKeyHelp.textContent = 'AccessKey ID';
                secretKeyHelp.textContent = 'AccessKey Secret';
                break;
                
            case 'tencent':
                regionInput.placeholder = 'ap-beijing';
                endpointInput.placeholder = 'https://cos.ap-beijing.myqcloud.com';
                regionHelp.textContent = '腾讯云区域，如: ap-beijing';
                endpointHelp.textContent = '腾讯云COS端点URL';
                accessKeyHelp.textContent = 'SecretId';
                secretKeyHelp.textContent = 'SecretKey';
                break;
                
            case 'qiniu':
                regionInput.placeholder = 'z0';
                endpointInput.placeholder = 'https://s3-cn-east-1.qiniucs.com';
                regionHelp.textContent = '七牛云区域代码，如: z0, z1, z2';
                endpointHelp.textContent = '七牛云S3兼容端点';
                accessKeyHelp.textContent = 'Access Key';
                secretKeyHelp.textContent = 'Secret Key';
                break;
                
            case 'minio':
                regionInput.placeholder = 'us-east-1';
                endpointInput.placeholder = 'https://minio.example.com';
                regionHelp.textContent = 'MinIO区域，通常为 us-east-1';
                endpointHelp.textContent = '必填：您的MinIO服务器地址';
                accessKeyHelp.textContent = 'MinIO Access Key';
                secretKeyHelp.textContent = 'MinIO Secret Key';
                break;
                
            case 'other':
                regionInput.placeholder = 'us-east-1';
                endpointInput.placeholder = 'https://s3.example.com';
                regionHelp.textContent = '根据服务商要求填写区域';
                endpointHelp.textContent = '必填：S3兼容服务的端点URL';
                accessKeyHelp.textContent = '服务商提供的Access Key';
                secretKeyHelp.textContent = '服务商提供的Secret Key';
                break;
                
            default:
                regionInput.placeholder = '如: us-east-1';
                endpointInput.placeholder = 'https://s3.example.com';
                regionHelp.textContent = '根据选择的提供商，区域格式可能不同';
                endpointHelp.textContent = '某些提供商需要自定义端点';
                accessKeyHelp.textContent = '访问密钥ID';
                secretKeyHelp.textContent = '访问密钥';
        }
    }

    // 加载存储使用情况
    async loadStorageUsage() {
        try {
            const response = await fetch('/api/admin/storage-usage', {
                headers: {
                    'Authorization': `Bearer ${this.adminToken}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.renderStorageUsage(data);
            } else {
                document.getElementById('storageUsage').innerHTML = '<p>无法加载存储使用情况</p>';
            }
        } catch (error) {
            console.error('加载存储使用情况失败:', error);
            document.getElementById('storageUsage').innerHTML = '<p>加载失败</p>';
        }
    }

    // 渲染存储使用情况
    renderStorageUsage(data) {
        const storageUsageEl = document.getElementById('storageUsage');
        const usedMB = Math.round((data.used || 0) / (1024 * 1024));
        const limitMB = data.limit || 0;
        const percentage = limitMB > 0 ? Math.round((usedMB / limitMB) * 100) : 0;
        
        let progressBarClass = 'progress-bar';
        if (percentage > 90) progressBarClass += ' danger';
        else if (percentage > 70) progressBarClass += ' warning';
        else progressBarClass += ' success';

        storageUsageEl.innerHTML = `
            <div class="storage-stats">
                <div class="storage-stat">
                    <div class="stat-label">已使用</div>
                    <div class="stat-value">${this.formatFileSize(data.used || 0)}</div>
                </div>
                <div class="storage-stat">
                    <div class="stat-label">文件数量</div>
                    <div class="stat-value">${data.fileCount || 0}</div>
                </div>
                <div class="storage-stat">
                    <div class="stat-label">存储限制</div>
                    <div class="stat-value">${limitMB > 0 ? this.formatFileSize(limitMB * 1024 * 1024) : '无限制'}</div>
                </div>
            </div>
            
            ${limitMB > 0 ? `
            <div class="storage-progress">
                <div class="progress-label">
                    <span>存储使用率</span>
                    <span>${percentage}%</span>
                </div>
                <div class="progress-container">
                    <div class="${progressBarClass}" style="width: ${Math.min(percentage, 100)}%"></div>
                </div>
                <div class="progress-text">
                    ${usedMB} MB / ${limitMB} MB
                </div>
            </div>
            ` : ''}
            
            <div class="storage-actions">
                <button class="btn btn-secondary btn-sm" onclick="adminPanel.loadStorageUsage()">刷新</button>
                ${data.canCleanup ? '<button class="btn btn-warning btn-sm" onclick="adminPanel.cleanupStorage()">清理无效文件</button>' : ''}
            </div>
        `;
    }

    // 清理存储
    async cleanupStorage() {
        if (!confirm('确定要清理无效的文件吗？这将删除数据库中不存在记录的文件。')) {
            return;
        }

        try {
            const response = await fetch('/api/admin/cleanup-storage', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.adminToken}`
                }
            });

            const result = await response.json();

            if (response.ok) {
                this.showMessage(`清理完成，删除了 ${result.deletedCount || 0} 个无效文件`, 'success');
                this.loadStorageUsage(); // 重新加载使用情况
            } else {
                this.showMessage(result.message || '清理失败', 'error');
            }
        } catch (error) {
            console.error('清理存储失败:', error);
            this.showMessage('清理失败，请重试', 'error');
        }
    }

    // 加载文件管理页面
    async loadFileManagement() {
        const mainContent = document.getElementById('mainContent');
        mainContent.innerHTML = '<div class="loading-spinner"></div> 正在加载文件列表...';

        try {
            const response = await fetch('/api/admin/files', {
                headers: {
                    'Authorization': `Bearer ${this.adminToken}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                mainContent.innerHTML = this.renderFileManagement(data.files || []);
            } else {
                mainContent.innerHTML = '<p>加载文件列表失败</p>';
            }
        } catch (error) {
            console.error('加载文件管理失败:', error);
            mainContent.innerHTML = '<p>加载失败，请重试</p>';
        }
    }

    // 渲染文件管理页面
    renderFileManagement(files) {
        return `
            <div class="data-table">
                <div class="table-header">
                    <h3 class="table-title">文件列表 (${files.length} 个文件)</h3>
                </div>
                <div class="table-content">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>文件名</th>
                                <th>类型</th>
                                <th>大小</th>
                                <th>上传者</th>
                                <th>上传时间</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${files.map(file => `
                                <tr>
                                    <td>${file.originalName}</td>
                                    <td>${file.mimeType}</td>
                                    <td>${this.formatFileSize(file.size)}</td>
                                    <td>${file.uploader || '未知'}</td>
                                    <td>${this.formatDate(file.uploadTime)}</td>
                                    <td>
                                        <button class="btn btn-sm btn-danger" onclick="adminPanel.deleteFile('${file.id}')">删除</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    // 加载图片管理页面
    async loadImageGallery() {
        const mainContent = document.getElementById('mainContent');
        mainContent.innerHTML = '<div class="loading-spinner"></div> 正在加载图片...';

        try {
            const response = await fetch('/api/admin/images', {
                headers: {
                    'Authorization': `Bearer ${this.adminToken}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                mainContent.innerHTML = this.renderImageGallery(data.images || []);
            } else {
                mainContent.innerHTML = '<p>加载图片列表失败</p>';
            }
        } catch (error) {
            console.error('加载图片管理失败:', error);
            mainContent.innerHTML = '<p>加载失败，请重试</p>';
        }
    }

    // 渲染图片管理页面
    renderImageGallery(images) {
        return `
            <div class="image-gallery">
                ${images.map(image => `
                    <div class="image-item">
                        <img src="${image.url}" alt="${image.name}" loading="lazy">
                        <div class="image-info">
                            <div class="image-name">${image.name}</div>
                            <div class="image-date">${this.formatDate(image.uploadTime)}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // 加载用户管理页面
    async loadUserManagement() {
        const mainContent = document.getElementById('mainContent');
        mainContent.innerHTML = '<div class="loading-spinner"></div> 正在加载用户列表...';

        try {
            const response = await fetch('/api/admin/users', {
                headers: {
                    'Authorization': `Bearer ${this.adminToken}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                mainContent.innerHTML = this.renderUserManagement(data.users || []);
            } else {
                mainContent.innerHTML = '<p>加载用户列表失败</p>';
            }
        } catch (error) {
            console.error('加载用户管理失败:', error);
            mainContent.innerHTML = '<p>加载失败，请重试</p>';
        }
    }

    // 渲染用户管理页面
    renderUserManagement(users) {
        return `
            <div class="data-table">
                <div class="table-header">
                    <h3 class="table-title">用户列表 (${users.length} 个用户)</h3>
                </div>
                <div class="table-content">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>用户名</th>
                                <th>邮箱</th>
                                <th>注册时间</th>
                                <th>最后登录</th>
                                <th>状态</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${users.map(user => `
                                <tr>
                                    <td>${user.username}</td>
                                    <td>${user.email || '未设置'}</td>
                                    <td>${this.formatDate(user.createdAt)}</td>
                                    <td>${user.lastLogin ? this.formatDate(user.lastLogin) : '从未登录'}</td>
                                    <td><span class="status-indicator status-${user.isOnline ? 'online' : 'offline'}">${user.isOnline ? '在线' : '离线'}</span></td>
                                    <td>
                                        <button class="btn btn-sm btn-danger" onclick="adminPanel.deleteUser('${user.id}')">删除</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    // 加载系统设置页面
    loadSystemSettings() {
        const mainContent = document.getElementById('mainContent');
        mainContent.innerHTML = `
            <div class="form-section">
                <h3 class="section-title">系统设置</h3>
                <form id="systemSettingsForm">
                    <div class="form-row">
                        <div class="form-group-admin">
                            <label for="maxFileSize">最大文件上传大小 (MB)</label>
                            <input type="number" id="maxFileSize" name="maxFileSize" min="1" max="1000" value="50">
                        </div>
                        <div class="form-group-admin">
                            <label for="allowedFileTypes">允许的文件类型</label>
                            <input type="text" id="allowedFileTypes" name="allowedFileTypes" 
                                   value="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt" 
                                   placeholder="用逗号分隔">
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group-admin">
                            <label for="newAdminPassword">新管理员密码</label>
                            <input type="password" id="newAdminPassword" name="newPassword" 
                                   placeholder="留空则不修改密码">
                        </div>
                        <div class="form-group-admin">
                            <label for="confirmAdminPassword">确认新密码</label>
                            <input type="password" id="confirmAdminPassword" name="confirmPassword" 
                                   placeholder="再次输入新密码">
                        </div>
                    </div>
                    
                    <div class="button-group">
                        <button type="submit" class="btn btn-success">保存设置</button>
                    </div>
                </form>
            </div>
        `;

        // 加载现有设置
        this.loadSystemSettingsData();

        // 绑定表单提交事件
        document.getElementById('systemSettingsForm').addEventListener('submit', (e) => this.saveSystemSettings(e));
    }

    // 加载系统设置数据
    async loadSystemSettingsData() {
        try {
            const response = await fetch('/api/admin/settings', {
                headers: {
                    'Authorization': `Bearer ${this.adminToken}`
                }
            });

            if (response.ok) {
                const settings = await response.json();
                if (settings.data) {
                    Object.keys(settings.data).forEach(key => {
                        const input = document.querySelector(`[name="${key}"]`);
                        if (input) {
                            input.value = settings.data[key] || '';
                        }
                    });
                }
            }
        } catch (error) {
            console.error('加载系统设置失败:', error);
        }
    }

    // 保存系统设置
    async saveSystemSettings(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const settings = Object.fromEntries(formData.entries());

        // 验证密码
        if (settings.newPassword && settings.newPassword !== settings.confirmPassword) {
            this.showMessage('两次输入的密码不一致', 'error');
            return;
        }

        try {
            const response = await fetch('/api/admin/settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.adminToken}`
                },
                body: JSON.stringify(settings)
            });

            const result = await response.json();

            if (response.ok) {
                this.showMessage('系统设置保存成功！', 'success');
                // 清空密码字段
                document.getElementById('newAdminPassword').value = '';
                document.getElementById('confirmAdminPassword').value = '';
            } else {
                this.showMessage(result.message || '保存失败', 'error');
            }
        } catch (error) {
            console.error('保存系统设置失败:', error);
            this.showMessage('保存失败，请重试', 'error');
        }
    }

    // 删除文件
    async deleteFile(fileId) {
        if (!confirm('确定要删除这个文件吗？此操作不可恢复。')) {
            return;
        }

        try {
            const response = await fetch(`/api/admin/files/${fileId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.adminToken}`
                }
            });

            if (response.ok) {
                this.showMessage('文件删除成功', 'success');
                this.loadFileManagement(); // 重新加载文件列表
            } else {
                const result = await response.json();
                this.showMessage(result.message || '删除失败', 'error');
            }
        } catch (error) {
            console.error('删除文件失败:', error);
            this.showMessage('删除失败，请重试', 'error');
        }
    }

    // 删除用户
    async deleteUser(userId) {
        if (!confirm('确定要删除这个用户吗？此操作不可恢复。')) {
            return;
        }

        try {
            const response = await fetch(`/api/admin/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.adminToken}`
                }
            });

            if (response.ok) {
                this.showMessage('用户删除成功', 'success');
                this.loadUserManagement(); // 重新加载用户列表
            } else {
                const result = await response.json();
                this.showMessage(result.message || '删除失败', 'error');
            }
        } catch (error) {
            console.error('删除用户失败:', error);
            this.showMessage('删除失败，请重试', 'error');
        }
    }

    // 刷新当前页面
    refreshCurrentPage() {
        this.loadPage(this.currentPage);
    }

    // 显示消息
    showMessage(message, type = 'info') {
        const errorEl = document.getElementById('adminErrorMessage');
        const successEl = document.getElementById('adminSuccessMessage');
        
        // 清除之前的消息
        if (errorEl) errorEl.style.display = 'none';
        if (successEl) successEl.style.display = 'none';

        if (type === 'error' && errorEl) {
            errorEl.textContent = message;
            errorEl.style.display = 'block';
            setTimeout(() => errorEl.style.display = 'none', 5000);
        } else if (type === 'success' && successEl) {
            successEl.textContent = message;
            successEl.style.display = 'block';
            setTimeout(() => successEl.style.display = 'none', 3000);
        }

        console.log(`[${type.toUpperCase()}] ${message}`);
    }

    // 格式化文件大小
    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // 格式化日期
    formatDate(dateString) {
        if (!dateString) return '未知';
        const date = new Date(dateString);
        return date.toLocaleString('zh-CN');
    }
}

// 初始化管理员面板
const adminPanel = new AdminPanel();

// 全局暴露给HTML使用
window.adminPanel = adminPanel;