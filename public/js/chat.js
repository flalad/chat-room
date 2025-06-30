// 聊天管理模块
class ChatManager {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.isReconnecting = false;
        this.reconnectAttempts = 0;
        this.currentUser = null;
        this.messages = [];
        this.onlineUsers = new Map();
        this.typingUsers = new Set();
        this.typingTimeout = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.initializeSocket();
    }

    bindEvents() {
        // 监听认证事件
        document.addEventListener('auth:login', (event) => {
            this.handleUserLogin(event.detail);
        });

        document.addEventListener('auth:logout', () => {
            this.handleUserLogout();
        });

        // 消息发送表单
        const messageForm = document.getElementById('messageForm');
        if (messageForm) {
            messageForm.addEventListener('submit', this.handleSendMessage.bind(this));
        }

        // 消息输入框
        const messageText = document.getElementById('messageText');
        if (messageText) {
            messageText.addEventListener('input', this.handleTyping.bind(this));
            messageText.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    this.handleSendMessage(event);
                }
            });
        }

        // 网络状态监听
        window.addEventListener('online', this.handleNetworkOnline.bind(this));
        window.addEventListener('offline', this.handleNetworkOffline.bind(this));
    }

    initializeSocket() {
        if (typeof io === 'undefined') {
            console.error('Socket.IO未加载');
            this.showError('聊天功能不可用，请刷新页面重试');
            return;
        }

        try {
            this.socket = io('/', {
                timeout: 20000,
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000
            });

            this.setupSocketListeners();
            console.log('Socket连接已初始化');

        } catch (error) {
            console.error('Socket初始化失败:', error);
            this.updateConnectionStatus('disconnected');
        }
    }

    setupSocketListeners() {
        if (!this.socket) return;

        // 连接事件
        this.socket.on('connect', () => {
            this.handleConnect();
        });

        this.socket.on('disconnect', (reason) => {
            this.handleDisconnect(reason);
        });

        this.socket.on('connect_error', (error) => {
            this.handleConnectError(error);
        });

        this.socket.on('reconnect', (attemptNumber) => {
            this.handleReconnect(attemptNumber);
        });

        this.socket.on('reconnect_attempt', (attemptNumber) => {
            this.handleReconnectAttempt(attemptNumber);
        });

        this.socket.on('reconnect_failed', () => {
            this.handleReconnectFailed();
        });

        // 消息事件
        this.socket.on('new_message', (message) => {
            this.handleNewMessage(message);
        });

        this.socket.on('message_history', (messages) => {
            this.handleMessageHistory(messages);
        });

        // 用户事件
        this.socket.on('users_update', (users) => {
            this.handleUsersUpdate(users);
        });

        this.socket.on('user_typing', (data) => {
            this.handleUserTyping(data);
        });
    }

    handleConnect() {
        this.isConnected = true;
        this.isReconnecting = false;
        this.reconnectAttempts = 0;
        this.updateConnectionStatus('connected');
        console.log('Socket连接成功');

        // 如果用户已登录，发送用户信息
        if (window.authManager && window.authManager.isLoggedIn()) {
            const user = window.authManager.getCurrentUser();
            this.socket.emit('user_join', user);
        }
    }

    handleDisconnect(reason) {
        this.isConnected = false;
        this.updateConnectionStatus('disconnected');
        console.warn('Socket连接断开:', reason);
    }

    handleConnectError(error) {
        console.error('Socket连接错误:', error);
        this.updateConnectionStatus('disconnected');
    }

    handleReconnect(attemptNumber) {
        this.isReconnecting = false;
        console.log(`Socket重连成功，尝试次数: ${attemptNumber}`);
        this.showSuccess('重新连接成功');
    }

    handleReconnectAttempt(attemptNumber) {
        this.isReconnecting = true;
        this.reconnectAttempts = attemptNumber;
        this.updateConnectionStatus('connecting');
        console.log(`Socket重连尝试: ${attemptNumber}`);
    }

    handleReconnectFailed() {
        this.isReconnecting = false;
        console.error('Socket重连失败');
        this.showError('连接失败，请检查网络后刷新页面');
    }

    handleUserLogin(userData) {
        this.currentUser = userData.user;
        
        if (this.isConnected) {
            this.socket.emit('user_join', userData.user);
        }
        
        console.log('用户登录，启用聊天功能');
    }

    handleUserLogout() {
        this.currentUser = null;
        this.clearMessages();
        this.clearOnlineUsers();
        console.log('用户退出，清空聊天数据');
    }

    handleSendMessage(event) {
        event.preventDefault();

        // 检查是否已登录（不验证token）
        if (!window.authManager.isLoggedIn()) {
            this.showError('请先登录');
            return;
        }

        if (!this.isConnected) {
            this.showError('连接已断开，请稍后重试');
            return;
        }

        const messageText = document.getElementById('messageText');
        if (!messageText) return;

        const content = messageText.value.trim();
        if (!content) return;

        if (content.length > 1000) {
            this.showError('消息长度不能超过1000个字符');
            return;
        }

        // 发送消息
        this.socket.emit('send_message', {
            content: content,
            timestamp: new Date().toISOString()
        });

        // 清空输入框
        messageText.value = '';
        this.adjustTextareaHeight(messageText);

        // 停止打字状态
        this.stopTyping();
    }

    handleTyping() {
        if (!window.authManager.isLoggedIn() || !this.isConnected) return;

        // 发送打字状态
        this.socket.emit('typing_start');

        // 清除之前的定时器
        if (this.typingTimeout) {
            clearTimeout(this.typingTimeout);
        }

        // 设置停止打字的定时器
        this.typingTimeout = setTimeout(() => {
            this.stopTyping();
        }, 3000);
    }

    stopTyping() {
        if (!window.authManager.isLoggedIn() || !this.isConnected) return;

        this.socket.emit('typing_stop');

        if (this.typingTimeout) {
            clearTimeout(this.typingTimeout);
            this.typingTimeout = null;
        }
    }

    handleNewMessage(message) {
        this.addMessageToUI(message);
        this.playNotificationSound();
        console.log('收到新消息:', message);
    }

    handleMessageHistory(messages) {
        this.messages = messages;
        this.renderAllMessages();
        console.log('加载消息历史:', messages.length);
    }

    handleUsersUpdate(users) {
        this.onlineUsers.clear();
        users.forEach(user => {
            this.onlineUsers.set(user.username, user);
        });
        this.renderOnlineUsers();
        console.log('更新用户列表:', users.length);
    }

    handleUserTyping(data) {
        if (data.typing) {
            this.typingUsers.add(data.username);
        } else {
            this.typingUsers.delete(data.username);
        }
        this.updateTypingIndicator();
    }

    handleNetworkOnline() {
        if (!this.isConnected && this.socket) {
            this.socket.connect();
        }
        this.showSuccess('网络已连接');
    }

    handleNetworkOffline() {
        this.updateConnectionStatus('disconnected');
        this.showError('网络已断开');
    }

    addMessageToUI(message) {
        const messageList = document.getElementById('messageList');
        if (!messageList) return;

        // 移除欢迎消息
        const welcomeMessage = messageList.querySelector('.welcome-message');
        if (welcomeMessage) {
            welcomeMessage.remove();
        }

        const messageElement = this.createMessageElement(message);
        messageList.appendChild(messageElement);

        // 滚动到底部
        this.scrollToBottom();
    }

    createMessageElement(message) {
        const messageDiv = document.createElement('div');
        
        // 获取当前用户信息，优先从认证管理器获取
        const currentUser = window.authManager ? window.authManager.getCurrentUser() : this.currentUser;
        const currentUsername = currentUser ? currentUser.username : null;
        
        const isOwn = currentUsername && message.username === currentUsername;
        const isSystem = message.type === 'system';
        
        messageDiv.className = `message ${isOwn ? 'own' : isSystem ? 'system' : 'other'}`;
        
        if (isSystem) {
            messageDiv.innerHTML = `
                <div class="message-content">
                    ${this.escapeHtml(message.content)}
                </div>
            `;
        } else if (message.type === 'file') {
            // 使用增强的文件上传管理器创建文件消息
            if (window.enhancedFileUploadManager) {
                return window.enhancedFileUploadManager.createFileMessage(message, isOwn);
            } else if (window.fileUploadManager) {
                return window.fileUploadManager.createFileMessage(message, isOwn);
            } else {
                // 备用文件消息显示
                messageDiv.innerHTML = `
                    <div class="message-content">
                        <div class="file-info">
                            <div class="file-icon">📎</div>
                            <div class="file-details">
                                <div class="file-name">${this.escapeHtml(message.file.fileName)}</div>
                                <div class="file-size">文件</div>
                            </div>
                            <a href="${message.file.url}" target="_blank" class="download-btn" title="下载文件">下载</a>
                        </div>
                    </div>
                    <div class="message-time">${this.formatTime(new Date(message.timestamp))}</div>
                `;
                return messageDiv;
            }
        } else {
            // 普通文本消息 - Telegram风格
            const avatarChar = this.getAvatarChar(message.username);
            
            messageDiv.innerHTML = `
                ${!isOwn ? `
                <div class="message-header">
                    <div class="message-avatar">${avatarChar}</div>
                    <span class="message-username">${this.escapeHtml(message.username)}</span>
                    <span class="message-time">${this.formatTime(new Date(message.timestamp))}</span>
                </div>
                ` : ''}
                <div class="message-content">
                    ${this.formatMessageContent(message.content)}
                </div>
                ${isOwn ? `
                <div class="message-time">${this.formatTime(new Date(message.timestamp))}</div>
                ` : ''}
            `;
        }
        
        return messageDiv;
    }

    renderAllMessages() {
        const messageList = document.getElementById('messageList');
        if (!messageList) return;

        messageList.innerHTML = '';

        if (this.messages.length === 0) {
            this.showWelcomeMessage();
            return;
        }

        this.messages.forEach(message => {
            const messageElement = this.createMessageElement(message);
            messageList.appendChild(messageElement);
        });

        this.scrollToBottom();
    }

    renderOnlineUsers() {
        const usersList = document.getElementById('usersList');
        const userCount = document.getElementById('userCount');
        const memberCount = document.getElementById('memberCount');
        const onlineStatus = document.getElementById('onlineStatus');

        if (!usersList) return;

        // 更新用户计数
        const count = this.onlineUsers.size;
        if (userCount) userCount.textContent = count;
        if (memberCount) memberCount.textContent = count;
        if (onlineStatus) {
            onlineStatus.innerHTML = `<span id="userCount">${count}</span> 位成员在线`;
        }

        // 清空并重新渲染用户列表
        usersList.innerHTML = '';

        this.onlineUsers.forEach(user => {
            const userElement = this.createUserElement(user);
            usersList.appendChild(userElement);
        });
    }

    createUserElement(user) {
        const userDiv = document.createElement('div');
        userDiv.className = 'user-item';
        
        const avatarChar = this.getAvatarChar(user.username);
        
        userDiv.innerHTML = `
            <div class="user-avatar">${avatarChar}</div>
            <span class="user-name">${this.escapeHtml(user.username)}</span>
            <div class="user-status online"></div>
        `;
        
        return userDiv;
    }

    showWelcomeMessage() {
        const messageList = document.getElementById('messageList');
        if (!messageList) return;

        messageList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">💬</div>
                <p>欢迎来到私人聊天室</p>
                <p>开始您的对话吧！支持文件和图片分享</p>
            </div>
        `;
    }

    updateTypingIndicator() {
        // TODO: 实现打字指示器UI
        if (this.typingUsers.size > 0) {
            const users = Array.from(this.typingUsers);
            console.log('用户正在打字:', users);
        }
    }

    clearMessages() {
        this.messages = [];
        this.showWelcomeMessage();
    }

    clearOnlineUsers() {
        this.onlineUsers.clear();
        this.renderOnlineUsers();
    }

    scrollToBottom() {
        const messageList = document.getElementById('messageList');
        if (messageList) {
            setTimeout(() => {
                messageList.scrollTop = messageList.scrollHeight;
            }, 100);
        }
    }

    adjustTextareaHeight(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 100) + 'px';
    }

    updateConnectionStatus(status) {
        const statusElement = document.getElementById('connectionStatus');
        if (!statusElement) return;

        statusElement.className = `connection-status ${status}`;

        const statusText = statusElement.querySelector('.status-text');
        if (statusText) {
            switch (status) {
                case 'connected':
                    statusText.textContent = '已连接';
                    break;
                case 'connecting':
                    statusText.textContent = '连接中...';
                    break;
                case 'disconnected':
                    statusText.textContent = '已断开';
                    break;
                default:
                    statusText.textContent = '未知状态';
            }
        }
    }

    formatMessageContent(content) {
        // 转义HTML并处理换行
        let formatted = this.escapeHtml(content);
        formatted = formatted.replace(/\n/g, '<br>');
        
        // 处理URL链接
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        formatted = formatted.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
        
        return formatted;
    }

    formatTime(date) {
        return date.toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    getAvatarChar(username) {
        if (!username) return '?';
        return username.charAt(0).toUpperCase();
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    playNotificationSound() {
        // TODO: 实现通知音效
        if ('Notification' in window && Notification.permission === 'granted') {
            // 可以添加音效播放逻辑
        }
    }

    showError(message) {
        this.showToast(message, 'error');
    }

    showSuccess(message) {
        this.showToast(message, 'success');
    }

    showToast(message, type = 'info') {
        // 创建提示元素
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 8px;
            color: white;
            font-size: 14px;
            font-weight: 500;
            z-index: 10000;
            animation: slideInRight 0.3s ease-out;
            max-width: 300px;
        `;

        // 设置背景色
        switch (type) {
            case 'error':
                toast.style.background = '#ff4757';
                break;
            case 'success':
                toast.style.background = '#2ed573';
                break;
            case 'warning':
                toast.style.background = '#ffa502';
                break;
            default:
                toast.style.background = '#5352ed';
        }

        document.body.appendChild(toast);

        // 3秒后自动移除
        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }

    // 获取连接状态
    getConnectionStatus() {
        return {
            connected: this.isConnected,
            reconnecting: this.isReconnecting,
            attempts: this.reconnectAttempts
        };
    }
}

// 创建Chat类的别名以保持向后兼容
const Chat = ChatManager;

// 导出聊天管理器实例和类
window.Chat = Chat;
window.chatManager = new ChatManager();