// UI模块
const UI = {
    // UI状态
    isInitialized: false,
    isMobile: false,
    
    // 初始化UI模块
    init() {
        this.detectDevice();
        this.setupEventListeners();
        this.setupResponsiveFeatures();
        this.isInitialized = true;
        Utils.log.info('UI模块已初始化');
    },
    
    // 检测设备类型
    detectDevice() {
        this.isMobile = Utils.getDeviceType() === 'mobile';
        
        if (this.isMobile) {
            document.body.classList.add('mobile');
            this.setupMobileFeatures();
        } else {
            document.body.classList.add('desktop');
        }
        
        Utils.log.info('设备类型:', this.isMobile ? 'mobile' : 'desktop');
    },
    
    // 设置事件监听器
    setupEventListeners() {
        // 窗口大小变化
        window.addEventListener('resize', Utils.debounce(() => {
            this.handleResize();
        }, 250));
        
        // 用户菜单下拉 - 由Auth模块负责处理，这里不重复绑定
        // 只保留通用的点击外部关闭功能
        document.addEventListener('click', (e) => {
            const userDropdown = document.getElementById('userDropdown');
            const userMenuContainer = document.getElementById('userMenuContainer');
            
            if (userDropdown && userMenuContainer &&
                !userMenuContainer.contains(e.target)) {
                this.hideUserDropdown();
            }
        });
        
        // 消息输入框自动调整高度
        const messageText = document.getElementById('messageText');
        if (messageText) {
            messageText.addEventListener('input', () => {
                this.adjustTextareaHeight(messageText);
            });
            
            messageText.addEventListener('focus', () => {
                this.handleInputFocus();
            });
            
            messageText.addEventListener('blur', () => {
                this.handleInputBlur();
            });
        }
        
        // 键盘快捷键
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });
        
        // 滚动事件
        const messageList = document.getElementById('messageList');
        if (messageList) {
            messageList.addEventListener('scroll', Utils.throttle(() => {
                this.handleMessageListScroll();
            }, 100));
        }
        
        // 主题设置按钮
        const themeSettingsBtn = document.getElementById('themeSettingsBtn');
        if (themeSettingsBtn) {
            themeSettingsBtn.addEventListener('click', () => {
                if (window.themeManager) {
                    window.themeManager.showThemeSettings();
                }
            });
        }
    },
    
    // 设置响应式功能
    setupResponsiveFeatures() {
        // 创建移动端用户列表切换按钮
        if (this.isMobile) {
            this.createUsersToggleButton();
        }
        
        // 监听屏幕方向变化
        if (screen.orientation) {
            screen.orientation.addEventListener('change', () => {
                this.handleOrientationChange();
            });
        }
    },
    
    // 设置移动端功能
    setupMobileFeatures() {
        // 禁用双击缩放
        let lastTouchEnd = 0;
        document.addEventListener('touchend', (e) => {
            const now = Date.now();
            if (now - lastTouchEnd <= 300) {
                e.preventDefault();
            }
            lastTouchEnd = now;
        }, false);
        
        // 处理虚拟键盘
        this.setupVirtualKeyboard();
    },
    
    // 创建用户列表切换按钮
    createUsersToggleButton() {
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'sidebar-toggle';
        toggleBtn.id = 'sidebarToggle';
        toggleBtn.innerHTML = `
            <svg viewBox="0 0 24 24" width="20" height="20">
                <path fill="currentColor" d="M3,6H21V8H3V6M3,11H21V13H3V11M3,16H21V18H3V16Z"/>
            </svg>
        `;
        
        // 添加到聊天头部
        const chatHeader = document.querySelector('.chat-header');
        if (chatHeader) {
            chatHeader.insertBefore(toggleBtn, chatHeader.firstChild);
        }
        
        toggleBtn.addEventListener('click', () => {
            this.toggleSidebar();
        });
    },
    
    // 设置虚拟键盘处理
    setupVirtualKeyboard() {
        if (!this.isMobile) return;
        
        const viewport = document.querySelector('meta[name=viewport]');
        if (viewport) {
            const originalContent = viewport.content;
            
            // 输入框获得焦点时
            document.addEventListener('focusin', (e) => {
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                    // 防止页面缩放
                    viewport.content = originalContent + ', user-scalable=no';
                    
                    // 调整布局
                    setTimeout(() => {
                        this.adjustForKeyboard(true);
                    }, 300);
                }
            });
            
            // 输入框失去焦点时
            document.addEventListener('focusout', (e) => {
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                    // 恢复缩放
                    viewport.content = originalContent;
                    
                    // 恢复布局
                    setTimeout(() => {
                        this.adjustForKeyboard(false);
                    }, 300);
                }
            });
        }
    },
    
    // 处理窗口大小变化
    handleResize() {
        const newIsMobile = Utils.getDeviceType() === 'mobile';
        
        if (newIsMobile !== this.isMobile) {
            this.isMobile = newIsMobile;
            
            if (this.isMobile) {
                document.body.classList.add('mobile');
                document.body.classList.remove('desktop');
                this.setupMobileFeatures();
            } else {
                document.body.classList.add('desktop');
                document.body.classList.remove('mobile');
            }
        }
        
        // 调整消息列表滚动
        this.scrollToBottom();
    },
    
    // 处理屏幕方向变化
    handleOrientationChange() {
        setTimeout(() => {
            this.handleResize();
        }, 100);
    },
    
    // 切换用户下拉菜单
    toggleUserDropdown() {
        const userDropdown = document.getElementById('userDropdown');
        if (userDropdown) {
            const isVisible = userDropdown.classList.contains('show');
            if (isVisible) {
                this.hideUserDropdown();
            } else {
                this.showUserDropdown();
            }
        }
    },
    
    // 显示用户下拉菜单
    showUserDropdown() {
        const userDropdown = document.getElementById('userDropdown');
        const userMenuBtn = document.getElementById('userMenuBtn');
        if (userDropdown) {
            userDropdown.classList.add('show');
        }
        if (userMenuBtn) {
            userMenuBtn.classList.add('active');
        }
    },
    
    // 隐藏用户下拉菜单
    hideUserDropdown() {
        const userDropdown = document.getElementById('userDropdown');
        const userMenuBtn = document.getElementById('userMenuBtn');
        if (userDropdown) {
            userDropdown.classList.remove('show');
        }
        if (userMenuBtn) {
            userMenuBtn.classList.remove('active');
        }
    },
    
    // 切换侧边栏
    toggleSidebar() {
        const sidebarLeft = document.querySelector('.sidebar-left');
        if (sidebarLeft) {
            sidebarLeft.classList.toggle('show');
        }
    },
    
    // 隐藏侧边栏
    hideSidebar() {
        const sidebarLeft = document.querySelector('.sidebar-left');
        if (sidebarLeft) {
            sidebarLeft.classList.remove('show');
        }
    },
    
    // 切换在线用户列表（兼容旧方法）
    toggleOnlineUsers() {
        this.toggleSidebar();
    },
    
    // 隐藏在线用户列表（兼容旧方法）
    hideOnlineUsers() {
        this.hideSidebar();
    },
    
    // 调整文本框高度
    adjustTextareaHeight(textarea) {
        textarea.style.height = 'auto';
        const maxHeight = this.isMobile ? 80 : 100;
        textarea.style.height = Math.min(textarea.scrollHeight, maxHeight) + 'px';
    },
    
    // 处理输入框获得焦点
    handleInputFocus() {
        if (this.isMobile) {
            // 移动端隐藏在线用户列表
            this.hideOnlineUsers();
        }
    },
    
    // 处理输入框失去焦点
    handleInputBlur() {
        // 可以在这里添加失去焦点时的处理逻辑
    },
    
    // 处理键盘快捷键
    handleKeyboardShortcuts(e) {
        // Ctrl/Cmd + Enter 发送消息
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            const messageForm = document.getElementById('messageForm');
            if (messageForm) {
                messageForm.dispatchEvent(new Event('submit'));
            }
        }
        
        // ESC 关闭模态框和下拉菜单
        if (e.key === 'Escape') {
            this.hideUserDropdown();
            this.hideOnlineUsers();
        }
        
        // Alt + U 切换用户列表
        if (e.altKey && e.key === 'u') {
            e.preventDefault();
            this.toggleOnlineUsers();
        }
    },
    
    // 处理消息列表滚动
    handleMessageListScroll() {
        const messageList = document.getElementById('messageList');
        if (!messageList) return;
        
        const { scrollTop, scrollHeight, clientHeight } = messageList;
        const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;
        
        // 如果不在底部，显示"滚动到底部"按钮
        this.toggleScrollToBottomButton(!isAtBottom);
    },
    
    // 切换滚动到底部按钮
    toggleScrollToBottomButton(show) {
        let button = document.getElementById('scrollToBottomBtn');
        
        if (show && !button) {
            button = document.createElement('button');
            button.id = 'scrollToBottomBtn';
            button.className = 'scroll-to-bottom-btn';
            button.innerHTML = `
                <svg viewBox="0 0 24 24" width="20" height="20">
                    <path fill="currentColor" d="M7,10L12,15L17,10H7Z"/>
                </svg>
            `;
            
            button.addEventListener('click', () => {
                this.scrollToBottom();
            });
            
            document.body.appendChild(button);
            
            setTimeout(() => {
                button.classList.add('show');
            }, 10);
            
        } else if (!show && button) {
            button.classList.remove('show');
            setTimeout(() => {
                if (button.parentNode) {
                    button.parentNode.removeChild(button);
                }
            }, 300);
        }
    },
    
    // 滚动到底部
    scrollToBottom() {
        const messageList = document.getElementById('messageList');
        if (messageList) {
            messageList.scrollTo({
                top: messageList.scrollHeight,
                behavior: 'smooth'
            });
        }
    },
    
    // 调整键盘布局
    adjustForKeyboard(show) {
        const windowContainer = document.querySelector('.window-container');
        if (windowContainer) {
            if (show) {
                windowContainer.style.height = '70vh';
                windowContainer.style.top = '20%';
            } else {
                windowContainer.style.height = '85vh';
                windowContainer.style.top = '50%';
            }
        }
    },
    
    // 显示加载状态
    showLoading(message = '加载中...') {
        const messageList = document.getElementById('messageList');
        if (messageList) {
            messageList.innerHTML = `
                <div class="loading">
                    <div class="loading-spinner">⏳</div>
                    <p>${message}</p>
                </div>
            `;
        }
    },
    
    // 隐藏加载状态
    hideLoading() {
        const loading = document.querySelector('.loading');
        if (loading) {
            loading.remove();
        }
    },
    
    // 显示错误状态
    showError(message = '加载失败') {
        const messageList = document.getElementById('messageList');
        if (messageList) {
            messageList.innerHTML = `
                <div class="error-state">
                    <div class="error-icon">❌</div>
                    <p>${message}</p>
                    <button onclick="location.reload()" class="retry-btn">重试</button>
                </div>
            `;
        }
    },
    
    // 添加消息动画
    animateMessage(messageElement) {
        if (!messageElement) return;
        
        messageElement.style.opacity = '0';
        messageElement.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            messageElement.style.transition = 'all 0.3s ease';
            messageElement.style.opacity = '1';
            messageElement.style.transform = 'translateY(0)';
        }, 10);
    },
    
    // 高亮消息
    highlightMessage(messageId) {
        const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
        if (messageElement) {
            messageElement.classList.add('highlight');
            setTimeout(() => {
                messageElement.classList.remove('highlight');
            }, 2000);
        }
    },
    
    // 设置主题
    setTheme(theme) {
        document.body.className = document.body.className.replace(/theme-\w+/g, '');
        document.body.classList.add(`theme-${theme}`);
        Utils.storage.set(CONFIG.STORAGE_KEYS.THEME, theme);
        Utils.log.info('主题已切换:', theme);
    },
    
    // 获取当前主题
    getCurrentTheme() {
        return Utils.storage.get(CONFIG.STORAGE_KEYS.THEME, CONFIG.THEMES.LIGHT);
    },
    
    // 切换主题
    toggleTheme() {
        const currentTheme = this.getCurrentTheme();
        const newTheme = currentTheme === CONFIG.THEMES.LIGHT ? CONFIG.THEMES.DARK : CONFIG.THEMES.LIGHT;
        this.setTheme(newTheme);
    },
    
    // 显示通知权限请求
    async requestNotificationPermission() {
        if (!('Notification' in window)) {
            Utils.log.warn('浏览器不支持通知');
            return false;
        }
        
        if (Notification.permission === 'granted') {
            return true;
        }
        
        if (Notification.permission === 'denied') {
            return false;
        }
        
        const permission = await Notification.requestPermission();
        return permission === 'granted';
    },
    
    // 显示桌面通知
    showDesktopNotification(title, options = {}) {
        if (Notification.permission !== 'granted') {
            return;
        }
        
        const notification = new Notification(title, {
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            ...options
        });
        
        // 自动关闭通知
        setTimeout(() => {
            notification.close();
        }, 5000);
        
        return notification;
    },
    
    // 获取UI状态
    getState() {
        return {
            initialized: this.isInitialized,
            mobile: this.isMobile,
            theme: this.getCurrentTheme()
        };
    }
};

// 导出UI模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UI;
}

// 开发模式下输出UI模块信息
if (CONFIG.DEBUG) {
    console.log('🔧 UI模块已加载:', UI);
}