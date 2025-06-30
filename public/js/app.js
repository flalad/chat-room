// 主应用文件
class ChatRoomApp {
    constructor() {
        this.isInitialized = false;
        this.modules = {
            auth: Auth,
            chat: Chat,
            ui: UI
        };
        this.startTime = Date.now();
    }
    
    // 初始化应用
    async init() {
        try {
            Utils.log.info('🚀 私人聊天室启动中...');
            
            // 检查浏览器兼容性
            this.checkBrowserCompatibility();
            
            // 显示加载状态
            this.showLoadingScreen();
            
            // 初始化各个模块
            await this.initializeModules();
            
            // 设置全局事件监听器
            this.setupGlobalEventListeners();
            
            // 隐藏加载状态
            this.hideLoadingScreen();
            
            // 标记为已初始化
            this.isInitialized = true;
            
            const initTime = Date.now() - this.startTime;
            Utils.log.info(`✅ 应用初始化完成，耗时: ${initTime}ms`);
            
            // 显示欢迎消息
            this.showWelcomeMessage();
            
        } catch (error) {
            Utils.log.error('❌ 应用初始化失败:', error);
            this.showInitError(error);
        }
    }
    
    // 检查浏览器兼容性
    checkBrowserCompatibility() {
        const requiredFeatures = [
            'fetch',
            'localStorage',
            'WebSocket',
            'Promise',
            'addEventListener'
        ];
        
        const missingFeatures = requiredFeatures.filter(feature => {
            if (feature === 'WebSocket') {
                return !window.WebSocket && !window.MozWebSocket;
            }
            return !(feature in window);
        });
        
        if (missingFeatures.length > 0) {
            throw new Error(`浏览器不支持以下功能: ${missingFeatures.join(', ')}`);
        }
        
        // 检查ES6支持
        try {
            eval('const test = () => {};');
        } catch (e) {
            throw new Error('浏览器不支持ES6语法，请使用现代浏览器');
        }
        
        Utils.log.info('✅ 浏览器兼容性检查通过');
    }
    
    // 显示加载屏幕
    showLoadingScreen() {
        const loadingHTML = `
            <div id="loadingScreen" class="loading-screen">
                <div class="loading-content">
                    <div class="loading-logo">💬</div>
                    <h2>私人聊天室</h2>
                    <div class="loading-spinner">
                        <div class="spinner"></div>
                    </div>
                    <p>正在加载...</p>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('afterbegin', loadingHTML);
        
        // 添加加载屏幕样式
        const style = document.createElement('style');
        style.textContent = `
            .loading-screen {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
                opacity: 1;
                transition: opacity 0.5s ease;
            }
            
            .loading-content {
                text-align: center;
                color: white;
            }
            
            .loading-logo {
                font-size: 4rem;
                margin-bottom: 1rem;
                animation: bounce 2s infinite;
            }
            
            .loading-content h2 {
                font-size: 2rem;
                margin-bottom: 2rem;
                font-weight: 300;
            }
            
            .loading-spinner {
                margin: 2rem 0;
            }
            
            .spinner {
                width: 40px;
                height: 40px;
                border: 3px solid rgba(255, 255, 255, 0.3);
                border-top: 3px solid white;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin: 0 auto;
            }
            
            .loading-content p {
                font-size: 1.1rem;
                opacity: 0.8;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            @keyframes bounce {
                0%, 20%, 50%, 80%, 100% {
                    transform: translateY(0);
                }
                40% {
                    transform: translateY(-10px);
                }
                60% {
                    transform: translateY(-5px);
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    // 隐藏加载屏幕
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                loadingScreen.remove();
            }, 500);
        }
    }
    
    // 初始化模块
    async initializeModules() {
        const initOrder = ['ui', 'auth', 'chat'];
        
        for (const moduleName of initOrder) {
            const module = this.modules[moduleName];
            if (module && typeof module.init === 'function') {
                Utils.log.info(`初始化模块: ${moduleName}`);
                await module.init();
            }
        }
        
        // 初始化文件上传管理器
        if (window.enhancedFileUploadManager) {
            Utils.log.info('初始化增强文件上传管理器');
            // 确保文件上传管理器已初始化
            if (typeof window.enhancedFileUploadManager.init === 'function') {
                window.enhancedFileUploadManager.init();
            }
        }
        
        // 禁用原来的文件上传管理器，使用新的增强版本
        if (window.fileUploadManager) {
            Utils.log.info('禁用原文件上传管理器，使用增强版本');
        }
    }
    
    // 设置全局事件监听器
    setupGlobalEventListeners() {
        // 全局错误处理
        window.addEventListener('error', (event) => {
            Utils.log.error('全局错误:', event.error);
            this.handleGlobalError(event.error);
        });
        
        // 未处理的Promise错误
        window.addEventListener('unhandledrejection', (event) => {
            Utils.log.error('未处理的Promise错误:', event.reason);
            this.handleGlobalError(event.reason);
        });
        
        // 页面可见性变化
        document.addEventListener('visibilitychange', () => {
            this.handleVisibilityChange();
        });
        
        // 页面卸载前
        window.addEventListener('beforeunload', (event) => {
            this.handleBeforeUnload(event);
        });
        
        // 网络状态变化
        window.addEventListener('online', () => {
            Utils.showNotification('网络已连接', 'success');
        });
        
        window.addEventListener('offline', () => {
            Utils.showNotification('网络已断开', 'warning');
        });
        
        // 窗口控制按钮（仅为装饰）
        this.setupWindowControls();
    }
    
    // 设置窗口控制按钮
    setupWindowControls() {
        const closeBtn = document.querySelector('.control-btn.close');
        const minimizeBtn = document.querySelector('.control-btn.minimize');
        const maximizeBtn = document.querySelector('.control-btn.maximize');
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                if (confirm('确定要关闭聊天室吗？')) {
                    window.close();
                }
            });
        }
        
        if (minimizeBtn) {
            minimizeBtn.addEventListener('click', () => {
                // 模拟最小化效果
                const container = document.querySelector('.window-container');
                if (container) {
                    container.style.transform = 'translate(-50%, -50%) scale(0.1)';
                    container.style.opacity = '0';
                    
                    setTimeout(() => {
                        container.style.transform = 'translate(-50%, -50%) scale(1)';
                        container.style.opacity = '1';
                    }, 1000);
                }
            });
        }
        
        if (maximizeBtn) {
            maximizeBtn.addEventListener('click', () => {
                // 切换全屏模式
                this.toggleFullscreen();
            });
        }
    }
    
    // 切换全屏模式
    toggleFullscreen() {
        const container = document.querySelector('.window-container');
        if (!container) return;
        
        if (container.classList.contains('fullscreen')) {
            container.classList.remove('fullscreen');
            container.style.width = '90vw';
            container.style.height = '85vh';
            container.style.borderRadius = '12px';
        } else {
            container.classList.add('fullscreen');
            container.style.width = '100vw';
            container.style.height = '100vh';
            container.style.borderRadius = '0';
        }
    }
    
    // 处理全局错误
    handleGlobalError(error) {
        // 避免错误循环
        if (this.errorHandling) return;
        this.errorHandling = true;
        
        setTimeout(() => {
            this.errorHandling = false;
        }, 1000);
        
        // 根据错误类型显示不同的消息
        let message = '应用发生错误';
        
        if (error.name === 'NetworkError') {
            message = '网络连接错误，请检查网络';
        } else if (error.name === 'TypeError') {
            message = '应用运行错误，请刷新页面';
        } else if (error.message) {
            message = error.message;
        }
        
        Utils.showNotification(message, 'error');
    }
    
    // 处理页面可见性变化
    handleVisibilityChange() {
        if (document.hidden) {
            Utils.log.info('页面隐藏');
            // 页面隐藏时可以暂停一些操作
        } else {
            Utils.log.info('页面显示');
            // 页面显示时恢复操作
            if (this.modules.chat && this.modules.chat.isConnected) {
                // 重新获取消息
                this.modules.chat.socket.emit('get_messages');
            }
        }
    }
    
    // 处理页面卸载前
    handleBeforeUnload(event) {
        if (this.modules.auth && this.modules.auth.isLoggedIn) {
            // 通知服务器用户离开
            if (this.modules.chat && this.modules.chat.socket) {
                this.modules.chat.socket.emit('user_leaving');
            }
        }
    }
    
    // 显示欢迎消息
    showWelcomeMessage() {
        const isFirstTime = !Utils.storage.get('hasVisited');
        
        if (isFirstTime) {
            Utils.storage.set('hasVisited', true);
            
            setTimeout(() => {
                Utils.showNotification('欢迎使用私人聊天室！', 'info');
                
                // 如果用户未登录，提示登录
                if (!this.modules.auth.isLoggedIn) {
                    setTimeout(() => {
                        Utils.showNotification('请登录后开始聊天', 'info');
                    }, 2000);
                }
            }, 1000);
        }
    }
    
    // 显示初始化错误
    showInitError(error) {
        const errorHTML = `
            <div class="init-error">
                <div class="error-content">
                    <div class="error-icon">😵</div>
                    <h2>应用启动失败</h2>
                    <p>${error.message}</p>
                    <div class="error-actions">
                        <button onclick="location.reload()" class="retry-btn">
                            🔄 重新加载
                        </button>
                        <button onclick="localStorage.clear(); location.reload()" class="clear-btn">
                            🗑️ 清除数据并重载
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.innerHTML = errorHTML;
        
        // 添加错误页面样式
        const style = document.createElement('style');
        style.textContent = `
            .init-error {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            }
            
            .error-content {
                text-align: center;
                max-width: 500px;
                padding: 2rem;
            }
            
            .error-icon {
                font-size: 4rem;
                margin-bottom: 1rem;
            }
            
            .error-content h2 {
                font-size: 2rem;
                margin-bottom: 1rem;
                font-weight: 300;
            }
            
            .error-content p {
                font-size: 1.1rem;
                margin-bottom: 2rem;
                opacity: 0.9;
                line-height: 1.5;
            }
            
            .error-actions {
                display: flex;
                gap: 1rem;
                justify-content: center;
                flex-wrap: wrap;
            }
            
            .retry-btn, .clear-btn {
                padding: 12px 24px;
                border: 2px solid white;
                background: transparent;
                color: white;
                border-radius: 8px;
                cursor: pointer;
                font-size: 1rem;
                transition: all 0.2s ease;
            }
            
            .retry-btn:hover, .clear-btn:hover {
                background: white;
                color: #ff6b6b;
            }
        `;
        document.head.appendChild(style);
    }
    
    // 重启应用
    restart() {
        Utils.log.info('🔄 重启应用...');
        location.reload();
    }
    
    // 清理应用数据
    clearData() {
        if (confirm('确定要清除所有本地数据吗？这将删除登录信息和设置。')) {
            Utils.storage.clear();
            Utils.log.info('🗑️ 本地数据已清除');
            this.restart();
        }
    }
    
    // 获取应用状态
    getStatus() {
        return {
            initialized: this.isInitialized,
            startTime: this.startTime,
            uptime: Date.now() - this.startTime,
            modules: Object.keys(this.modules).reduce((status, name) => {
                const module = this.modules[name];
                status[name] = {
                    loaded: !!module,
                    initialized: module && module.isInitialized !== undefined ? module.isInitialized : true
                };
                return status;
            }, {}),
            browser: Utils.getBrowser(),
            device: Utils.getDeviceType(),
            online: Utils.isOnline()
        };
    }
    
    // 获取调试信息
    getDebugInfo() {
        return {
            config: CONFIG,
            status: this.getStatus(),
            auth: this.modules.auth ? {
                isLoggedIn: this.modules.auth.isLoggedIn,
                currentUser: this.modules.auth.currentUser
            } : null,
            chat: this.modules.chat ? {
                isConnected: this.modules.chat.isConnected,
                messagesCount: this.modules.chat.messages.length,
                onlineUsersCount: this.modules.chat.onlineUsers.size
            } : null,
            ui: this.modules.ui ? this.modules.ui.getState() : null
        };
    }
}

// 创建应用实例
const app = new ChatRoomApp();

// DOM加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});

// 导出到全局作用域（用于调试）
window.ChatRoomApp = app;
window.CONFIG = CONFIG;
window.Utils = Utils;
window.Auth = Auth;
window.Chat = Chat;
window.UI = UI;

// 开发模式下的调试信息
if (CONFIG.DEBUG) {
    console.log('🔧 开发模式已启用');
    console.log('可用的全局对象:', {
        ChatRoomApp: app,
        CONFIG,
        Utils,
        Auth,
        Chat,
        UI
    });
    
    // 添加调试快捷键
    document.addEventListener('keydown', (e) => {
        // Ctrl+Shift+D 显示调试信息
        if (e.ctrlKey && e.shiftKey && e.key === 'D') {
            console.log('🐛 调试信息:', app.getDebugInfo());
        }
        
        // Ctrl+Shift+R 重启应用
        if (e.ctrlKey && e.shiftKey && e.key === 'R') {
            app.restart();
        }
        
        // Ctrl+Shift+C 清除数据
        if (e.ctrlKey && e.shiftKey && e.key === 'C') {
            app.clearData();
        }
    });
}