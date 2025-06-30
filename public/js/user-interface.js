// 用户界面管理器
class UserInterfaceManager {
    constructor() {
        this.currentUser = null;
        this.isLoggedIn = false;
        this.init();
    }

    init() {
        // 确保DOM加载完成后再初始化
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.bindEvents();
                this.checkLoginStatus();
            });
        } else {
            this.bindEvents();
            this.checkLoginStatus();
        }
    }

    bindEvents() {
        // 监听认证事件
        document.addEventListener('auth:login', (event) => {
            this.handleUserLogin(event.detail);
        });

        document.addEventListener('auth:logout', () => {
            this.handleUserLogout();
        });

        // 绑定用户菜单事件
        this.bindUserMenuEvents();
    }

    bindUserMenuEvents() {
        // 用户菜单切换按钮
        const userMenuBtn = document.getElementById('userMenuBtn');
        if (userMenuBtn) {
            userMenuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleUserDropdown();
            });
        }

        // 点击外部关闭下拉菜单
        document.addEventListener('click', (e) => {
            const userDropdown = document.getElementById('userDropdown');
            const userMenuContainer = document.getElementById('userMenuContainer');
            
            if (userDropdown && userMenuContainer && 
                !userMenuContainer.contains(e.target)) {
                this.hideUserDropdown();
            }
        });

        // 管理员后台菜单项
        const adminPanelMenuItem = document.getElementById('adminPanelMenuItem');
        if (adminPanelMenuItem) {
            adminPanelMenuItem.addEventListener('click', () => {
                this.openAdminPanel();
            });
        }

        // S3配置菜单项
        const s3ConfigMenuItem = document.getElementById('s3ConfigMenuItem');
        if (s3ConfigMenuItem) {
            s3ConfigMenuItem.addEventListener('click', () => {
                this.openS3Config();
            });
        }

        // 退出登录菜单项
        const logoutMenuItem = document.getElementById('logoutMenuItem');
        if (logoutMenuItem) {
            logoutMenuItem.addEventListener('click', () => {
                this.handleLogout();
            });
        }

        // 登录按钮
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) {
            loginBtn.addEventListener('click', () => {
                this.openLoginPage();
            });
        }
    }

    checkLoginStatus() {
        // 检查是否已登录
        if (window.authManager && window.authManager.isLoggedIn()) {
            const user = window.authManager.getCurrentUser();
            this.handleUserLogin({ user });
        } else {
            this.handleUserLogout();
        }
    }

    handleUserLogin(userData) {
        this.currentUser = userData.user;
        this.isLoggedIn = true;
        this.updateUserInterface();
        console.log('用户界面：用户已登录', this.currentUser);
    }

    handleUserLogout() {
        this.currentUser = null;
        this.isLoggedIn = false;
        this.updateUserInterface();
        console.log('用户界面：用户已退出');
    }

    updateUserInterface() {
        const loginBtn = document.getElementById('loginBtn');
        const userMenuContainer = document.getElementById('userMenuContainer');
        const usernameDisplay = document.getElementById('usernameDisplay');
        const userRoleDisplay = document.getElementById('userRoleDisplay');
        const adminPanelMenuItem = document.getElementById('adminPanelMenuItem');

        if (this.isLoggedIn && this.currentUser) {
            // 隐藏登录按钮，显示用户菜单
            if (loginBtn) loginBtn.style.display = 'none';
            if (userMenuContainer) userMenuContainer.style.display = 'block';

            // 更新用户信息显示
            if (usernameDisplay) {
                usernameDisplay.textContent = this.currentUser.username || '用户';
            }

            if (userRoleDisplay) {
                const isAdmin = this.currentUser.role === 'admin';
                userRoleDisplay.textContent = isAdmin ? '管理员' : '用户';
                userRoleDisplay.className = `user-role ${isAdmin ? 'admin' : ''}`;
            }

            // 显示/隐藏管理员菜单项
            if (adminPanelMenuItem) {
                const isAdmin = this.currentUser.role === 'admin';
                adminPanelMenuItem.style.display = isAdmin ? 'flex' : 'none';
            }

        } else {
            // 显示登录按钮，隐藏用户菜单
            if (loginBtn) loginBtn.style.display = 'flex';
            if (userMenuContainer) userMenuContainer.style.display = 'none';
        }
    }

    toggleUserDropdown() {
        const userDropdown = document.getElementById('userDropdown');
        const userMenuBtn = document.getElementById('userMenuBtn');
        
        if (userDropdown) {
            const isVisible = userDropdown.classList.contains('show');
            
            if (isVisible) {
                this.hideUserDropdown();
            } else {
                this.showUserDropdown();
            }
        }
    }

    showUserDropdown() {
        const userDropdown = document.getElementById('userDropdown');
        const userMenuBtn = document.getElementById('userMenuBtn');
        
        if (userDropdown) {
            userDropdown.classList.add('show');
        }
        
        if (userMenuBtn) {
            userMenuBtn.classList.add('active');
        }
    }

    hideUserDropdown() {
        const userDropdown = document.getElementById('userDropdown');
        const userMenuBtn = document.getElementById('userMenuBtn');
        
        if (userDropdown) {
            userDropdown.classList.remove('show');
        }
        
        if (userMenuBtn) {
            userMenuBtn.classList.remove('active');
        }
    }

    openAdminPanel() {
        this.hideUserDropdown();
        window.open('/admin.html', '_blank');
    }

    openS3Config() {
        this.hideUserDropdown();
        if (window.s3ConfigManager) {
            window.s3ConfigManager.showModal();
        } else {
            console.warn('S3配置管理器未找到');
        }
    }

    openLoginPage() {
        window.location.href = '/login.html';
    }

    handleLogout() {
        this.hideUserDropdown();
        
        if (window.authManager) {
            window.authManager.logout();
        } else {
            // 手动清理登录状态
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.reload();
        }
    }

    // 获取当前用户信息
    getCurrentUser() {
        return this.currentUser;
    }

    // 检查是否为管理员
    isAdmin() {
        return this.currentUser && this.currentUser.role === 'admin';
    }

    // 显示用户信息提示
    showUserTooltip(message, type = 'info') {
        // 创建提示元素
        const tooltip = document.createElement('div');
        tooltip.className = `user-tooltip ${type}`;
        tooltip.textContent = message;
        tooltip.style.cssText = `
            position: fixed;
            top: 70px;
            right: 20px;
            padding: 8px 12px;
            border-radius: 6px;
            color: white;
            font-size: 12px;
            font-weight: 500;
            z-index: 10001;
            animation: fadeInDown 0.3s ease-out;
            max-width: 200px;
        `;

        // 设置背景色
        switch (type) {
            case 'error':
                tooltip.style.background = '#ff4757';
                break;
            case 'success':
                tooltip.style.background = '#2ed573';
                break;
            case 'warning':
                tooltip.style.background = '#ffa502';
                break;
            default:
                tooltip.style.background = '#5352ed';
        }

        document.body.appendChild(tooltip);

        // 2秒后自动移除
        setTimeout(() => {
            tooltip.style.animation = 'fadeOutUp 0.3s ease-in';
            setTimeout(() => {
                if (tooltip.parentNode) {
                    tooltip.parentNode.removeChild(tooltip);
                }
            }, 300);
        }, 2000);
    }
}

// 创建全局实例
window.userInterfaceManager = new UserInterfaceManager();

// 导出类
window.UserInterfaceManager = UserInterfaceManager;