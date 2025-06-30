// 认证管理模块
class AuthManager {
    constructor() {
        this.user = null;
        this.token = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.checkAuthStatus();
    }

    bindEvents() {
        // 登录按钮点击事件
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) {
            loginBtn.addEventListener('click', () => {
                // 跳转到登录页面
                window.location.href = '/login.html';
            });
        }

        // 退出登录
        const logoutMenuItem = document.getElementById('logoutMenuItem');
        if (logoutMenuItem) {
            logoutMenuItem.addEventListener('click', this.logout.bind(this));
        }


        // 管理员后台菜单项
        const adminPanelMenuItem = document.getElementById('adminPanelMenuItem');
        if (adminPanelMenuItem) {
            adminPanelMenuItem.addEventListener('click', () => {
                window.location.href = '/admin.html';
            });
        }

        // 个人信息菜单项
        const userProfileMenuItem = document.getElementById('userProfileMenuItem');
        if (userProfileMenuItem) {
            userProfileMenuItem.addEventListener('click', () => {
                this.showUserProfile();
            });
        }
    }

    // 显示用户个人信息
    showUserProfile() {
        console.log('🔍 显示用户个人信息');
        // 这里可以添加显示用户个人信息的逻辑
        // 比如打开一个模态框显示用户详细信息
        alert(`用户信息：\n用户名：${this.user?.username || '未知'}\n角色：${this.user?.isAdmin ? '管理员' : '普通用户'}`);
    }

    checkAuthStatus() {
        console.log('开始检查认证状态...');
        
        // 检查localStorage中的用户信息
        const storedUser = localStorage.getItem('user');
        const storedToken = localStorage.getItem('token');

        console.log('localStorage中的用户信息:', storedUser);
        console.log('localStorage中的token:', storedToken ? '存在' : '不存在');

        if (storedUser && storedToken) {
            try {
                this.user = JSON.parse(storedUser);
                this.token = storedToken;
                
                console.log('解析后的用户信息:', this.user);
                console.log('用户是否为管理员:', this.user.isAdmin || this.user.role === 'admin');
                
                // 验证token是否有效（包括管理员token）
                this.verifyToken().then(isValid => {
                    console.log('Token验证结果:', isValid);
                    
                    if (isValid) {
                        this.onLoginSuccess(this.user, this.token);
                    } else {
                        // 如果验证失败，但是是管理员用户，尝试直接启用（兼容性处理）
                        if (this.user.isAdmin || this.user.role === 'admin') {
                            console.log('管理员token验证失败，但仍启用聊天功能（兼容性处理）');
                            this.onLoginSuccess(this.user, this.token);
                        } else {
                            console.log('普通用户token验证失败，清除认证信息');
                            this.clearAuth();
                        }
                    }
                });
            } catch (error) {
                console.error('解析用户信息失败:', error);
                this.clearAuth();
            }
        } else {
            console.log('未找到存储的认证信息');
        }
    }

    async verifyToken() {
        try {
            // 如果是管理员用户，尝试使用管理员验证端点
            const isAdmin = this.user && (this.user.isAdmin || this.user.role === 'admin');
            const verifyEndpoint = isAdmin ? '/api/admin/verify' : '/api/auth/verify';
            
            console.log('验证token，用户类型:', isAdmin ? '管理员' : '普通用户');
            console.log('使用验证端点:', verifyEndpoint);
            
            const response = await fetch(verifyEndpoint, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('验证响应状态:', response.status);

            if (response.ok) {
                const data = await response.json();
                console.log('验证响应数据:', data);
                const isValid = data.valid === true || (isAdmin && data.admin);
                console.log('最终验证结果:', isValid);
                return isValid;
            }
            console.log('验证请求失败，状态码:', response.status);
            return false;
        } catch (error) {
            console.error('Token验证失败:', error);
            return false;
        }
    }

    onLoginSuccess(user, token) {
        console.log('认证成功，用户信息:', user);
        this.user = user;
        this.token = token;

        // 更新UI状态
        this.updateUIForLoggedInUser();

        // 启用聊天功能
        this.enableChatFeatures();

        // 触发登录成功事件
        this.dispatchAuthEvent('login', { user, token });
        
        console.log('聊天功能已启用，认证流程完成');
    }

    updateUIForLoggedInUser() {
        console.log('🔄 更新UI为已登录状态...');
        
        // 隐藏登录按钮
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) {
            loginBtn.style.display = 'none';
            console.log('✅ 登录按钮已隐藏');
        }

        // 显示用户菜单
        const userMenuContainer = document.getElementById('userMenuContainer');
        if (userMenuContainer) {
            userMenuContainer.style.display = 'block';
            console.log('✅ 用户菜单容器已显示');
        }

        // 更新用户名显示
        const usernameDisplay = document.getElementById('usernameDisplay');
        const userRoleDisplay = document.getElementById('userRoleDisplay');
        if (usernameDisplay && this.user) {
            usernameDisplay.textContent = this.user.username || '用户';
            console.log('✅ 用户名已更新:', this.user.username);
        }
        if (userRoleDisplay && this.user) {
            userRoleDisplay.textContent = this.user.isAdmin ? '管理员' : '用户';
            console.log('✅ 用户角色已更新:', this.user.isAdmin ? '管理员' : '用户');
        }

        // 根据用户角色显示相应的菜单项
        const isAdmin = this.user.isAdmin || this.user.role === 'admin';
        
        // 管理员后台菜单项（仅管理员可见）
        const adminPanelMenuItem = document.getElementById('adminPanelMenuItem');
        if (adminPanelMenuItem) {
            adminPanelMenuItem.style.display = isAdmin ? 'block' : 'none';
            console.log(isAdmin ? '✅ 管理员后台菜单已显示' : '❌ 管理员后台菜单已隐藏');
        }

        // 个人信息菜单项（仅普通用户可见）
        const userProfileMenuItem = document.getElementById('userProfileMenuItem');
        if (userProfileMenuItem) {
            userProfileMenuItem.style.display = isAdmin ? 'none' : 'block';
            console.log(isAdmin ? '❌ 个人信息菜单已隐藏' : '✅ 个人信息菜单已显示');
        }

        console.log('🎉 UI更新完成');
    }

    enableChatFeatures() {
        console.log('开始启用聊天功能...');
        
        // 启用消息输入
        const messageText = document.getElementById('messageText');
        if (messageText) {
            messageText.disabled = false;
            messageText.placeholder = '输入消息...';
            console.log('消息输入框已启用');
        } else {
            console.warn('未找到消息输入框元素');
        }

        // 启用发送按钮
        const sendButton = document.getElementById('sendButton');
        if (sendButton) {
            sendButton.disabled = false;
            console.log('发送按钮已启用');
        } else {
            console.warn('未找到发送按钮元素');
        }

        // 启用文件上传按钮
        const attachmentBtn = document.getElementById('attachmentBtn');
        if (attachmentBtn) {
            attachmentBtn.disabled = false;
            console.log('文件上传按钮已启用');
        } else {
            console.warn('未找到文件上传按钮元素');
        }
        
        console.log('聊天功能启用完成');
    }

    async logout() {
        try {
            // 调用服务器端登出API
            if (this.token) {
                await fetch('/api/auth/logout', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.token}`,
                        'Content-Type': 'application/json'
                    }
                });
            }
        } catch (error) {
            console.error('服务器端登出失败:', error);
        }

        // 清除本地认证信息
        this.clearAuth();

        // 更新UI状态
        this.updateUIForLoggedOutUser();

        // 禁用聊天功能
        this.disableChatFeatures();

        // 触发登出事件
        this.dispatchAuthEvent('logout');
    }

    clearAuth() {
        this.user = null;
        this.token = null;
        localStorage.removeItem('user');
        localStorage.removeItem('token');
    }

    updateUIForLoggedOutUser() {
        // 显示登录按钮
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) {
            loginBtn.style.display = 'block';
        }

        // 隐藏用户菜单
        const userMenuContainer = document.getElementById('userMenuContainer');
        if (userMenuContainer) {
            userMenuContainer.style.display = 'none';
        }
    }

    disableChatFeatures() {
        // 禁用消息输入
        const messageText = document.getElementById('messageText');
        if (messageText) {
            messageText.disabled = true;
            messageText.placeholder = '请先登录后开始聊天...';
            messageText.value = '';
        }

        // 禁用发送按钮
        const sendButton = document.getElementById('sendButton');
        if (sendButton) {
            sendButton.disabled = true;
        }

        // 禁用文件上传按钮
        const attachmentBtn = document.getElementById('attachmentBtn');
        if (attachmentBtn) {
            attachmentBtn.disabled = true;
        }
    }

    dispatchAuthEvent(type, data = null) {
        const event = new CustomEvent(`auth:${type}`, {
            detail: data
        });
        document.dispatchEvent(event);
    }

    // 获取当前用户信息
    getCurrentUser() {
        return this.user;
    }

    // 获取当前token
    getToken() {
        return this.token;
    }

    // 检查是否已登录
    isLoggedIn() {
        return this.user !== null && this.token !== null;
    }

    // 获取认证头
    getAuthHeaders() {
        if (this.token) {
            return {
                'Authorization': `Bearer ${this.token}`,
                'Content-Type': 'application/json'
            };
        }
        return {
            'Content-Type': 'application/json'
        };
    }

    // 处理认证错误
    handleAuthError(error) {
        console.error('认证错误:', error);
        
        // 如果是401错误，清除认证信息并跳转到登录页面
        if (error.status === 401) {
            this.clearAuth();
            this.updateUIForLoggedOutUser();
            this.disableChatFeatures();
            
            // 显示错误提示
            this.showAuthError('登录已过期，请重新登录');
            
            // 延迟跳转到登录页面
            setTimeout(() => {
                window.location.href = '/login.html';
            }, 2000);
        }
    }

    showAuthError(message) {
        // 创建错误提示元素
        const errorDiv = document.createElement('div');
        errorDiv.className = 'auth-error-toast';
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
        `;

        // 添加动画样式
        if (!document.querySelector('#auth-error-styles')) {
            const style = document.createElement('style');
            style.id = 'auth-error-styles';
            style.textContent = `
                @keyframes slideInRight {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                @keyframes slideOutRight {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }

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

}

// 创建Auth类的别名以保持向后兼容
const Auth = AuthManager;

// 导出认证管理器实例和类
window.Auth = Auth;
window.authManager = new AuthManager();