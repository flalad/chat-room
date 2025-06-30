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
                <h3 class="section-title">S3存储配置</h3>
                <form id="s3ConfigForm">
                    <div class="form-row">
                        <div class="form-group-admin">
                            <label for="s3Provider">存储提供商</label>
                            <select id="s3Provider" name="provider" required>
                                <option value="">请选择存储提供商</option>
                                <option value="aws">Amazon S3</option>
                                <option value="aliyun">阿里云OSS</option>
                                <option value="tencent">腾讯云COS</option>
                                <option value="qiniu">七牛云</option>
                                <option value="minio">MinIO</option>
                            </select>
                        </div>
                        <div class="form-group-admin">
                            <label for="s3Region">区域</label>
                            <input type="text" id="s3Region" name="region" placeholder="如: us-east-1">
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group-admin">
                            <label for="s3AccessKey">Access Key</label>
                            <input type="text" id="s3AccessKey" name="accessKey" required>
                        </div>
                        <div class="form-group-admin">
                            <label for="s3SecretKey">Secret Key</label>
                            <input type="password" id="s3SecretKey" name="secretKey" required>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group-admin">
                            <label for="s3Bucket">存储桶名称</label>
                            <input type="text" id="s3Bucket" name="bucket" required>
                        </div>
                        <div class="form-group-admin">
                            <label for="s3Endpoint">自定义端点 (可选)</label>
                            <input type="url" id="s3Endpoint" name="endpoint" placeholder="https://s3.example.com">
                        </div>
                    </div>
                    
                    <div class="button-group">
                        <button type="button" class="btn btn-secondary" onclick="adminPanel.testS3Connection()">测试连接</button>
                        <button type="submit" class="btn btn-success">保存配置</button>
                    </div>
                </form>
            </div>
        `;

        // 加载现有配置
        this.loadS3ConfigData();

        // 绑定表单提交事件
        document.getElementById('s3ConfigForm').addEventListener('submit', (e) => this.saveS3Config(e));
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

        try {
            const response = await fetch('/api/admin/s3-config', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.adminToken}`
                },
                body: JSON.stringify(config)
            });

            const result = await response.json();

            if (response.ok) {
                this.showMessage('S3配置保存成功！', 'success');
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

            if (response.ok) {
                this.showMessage('S3连接测试成功！', 'success');
            } else {
                this.showMessage(result.message || '连接测试失败', 'error');
            }
        } catch (error) {
            console.error('测试S3连接失败:', error);
            this.showMessage('连接测试失败，请重试', 'error');
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