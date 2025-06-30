// Vercel聊天适配器 - 使用HTTP轮询替代WebSocket
class VercelChatAdapter {
    constructor() {
        this.isPolling = false;
        this.pollInterval = null;
        this.lastMessageId = null;
        this.currentUser = null;
        this.pollFrequency = 3000; // 3秒轮询一次
    }
    
    // 初始化聊天（替代Socket.IO连接）
    async initChat(user) {
        this.currentUser = user;
        
        try {
            // 加载历史消息
            await this.loadMessageHistory();
            
            // 开始轮询新消息
            this.startPolling();
            
            // 更新连接状态
            this.updateConnectionStatus('connected');
            
            console.log('✅ Vercel聊天适配器已初始化');
            this.showSuccess('聊天功能已启用（HTTP模式）');
            
        } catch (error) {
            console.error('❌ 初始化聊天失败:', error);
            this.updateConnectionStatus('disconnected');
            this.showError('聊天功能初始化失败');
        }
    }
    
    // 开始轮询新消息
    startPolling() {
        if (this.isPolling) return;
        
        this.isPolling = true;
        this.updateConnectionStatus('connected');
        
        this.pollInterval = setInterval(async () => {
            try {
                await this.pollNewMessages();
            } catch (error) {
                console.error('轮询消息失败:', error);
                // 不要因为单次轮询失败就停止
            }
        }, this.pollFrequency);
        
        console.log(`🔄 开始轮询消息，频率: ${this.pollFrequency}ms`);
    }
    
    // 停止轮询
    stopPolling() {
        this.isPolling = false;
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
        }
        this.updateConnectionStatus('disconnected');
        console.log('⏹️ 停止轮询消息');
    }
    
    // 轮询新消息
    async pollNewMessages() {
        try {
            const url = this.lastMessageId
                ? `/api/messages/poll?after=${this.lastMessageId}`
                : '/api/messages/poll';
                
            const response = await fetch(url);
            
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.messages && data.messages.length > 0) {
                    data.messages.forEach(message => {
                        this.handleNewMessage(message);
                        this.lastMessageId = message.id;
                    });
                    console.log(`📨 收到 ${data.messages.length} 条新消息`);
                }
            }
        } catch (error) {
            console.error('轮询请求失败:', error);
            // 网络错误时暂时更新状态，但不停止轮询
            this.updateConnectionStatus('connecting');
        }
    }
    
    // 加载历史消息
    async loadMessageHistory() {
        try {
            const response = await fetch('/api/messages/history?limit=100');
            
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.messages) {
                    this.handleMessageHistory(data.messages);
                    console.log(`📚 加载历史消息: ${data.messages.length} 条`);
                }
            }
        } catch (error) {
            console.error('加载历史消息失败:', error);
            this.showError('加载历史消息失败');
        }
    }
    
    // 发送消息
    async sendMessage(content) {
        if (!content || content.trim().length === 0) {
            this.showError('消息内容不能为空');
            return false;
        }
        
        // 检查是否已登录
        if (!window.authManager || !window.authManager.isLoggedIn()) {
            this.showError('请先登录');
            return false;
        }
        
        // 获取当前用户名
        const currentUser = window.authManager.getCurrentUser();
        if (!currentUser || !currentUser.username) {
            this.showError('无法获取用户信息');
            return false;
        }
        
        try {
            const response = await fetch('/api/messages/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    content: content.trim(),
                    type: 'text',
                    username: currentUser.username
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log('✅ 消息发送成功');
                // 立即轮询一次获取新消息
                setTimeout(() => this.pollNewMessages(), 500);
                return true;
            } else {
                const error = await response.json();
                this.showError(error.message || '发送消息失败');
                return false;
            }
        } catch (error) {
            console.error('发送消息失败:', error);
            this.showError('发送消息失败，请检查网络连接');
            return false;
        }
    }
    
    // 处理新消息
    handleNewMessage(message) {
        if (window.chatManager && window.chatManager.addMessageToUI) {
            window.chatManager.addMessageToUI(message);
        }
        
        // 播放通知音效
        this.playNotificationSound();
    }
    
    // 处理历史消息
    handleMessageHistory(messages) {
        if (window.chatManager) {
            window.chatManager.messages = messages;
            if (window.chatManager.renderAllMessages) {
                window.chatManager.renderAllMessages();
            }
            
            if (messages.length > 0) {
                this.lastMessageId = messages[messages.length - 1].id;
            }
        }
    }
    
    // 更新连接状态
    updateConnectionStatus(status) {
        if (window.chatManager && window.chatManager.updateConnectionStatus) {
            window.chatManager.updateConnectionStatus(status);
        }
    }
    
    // 显示错误
    showError(message) {
        if (window.chatManager && window.chatManager.showError) {
            window.chatManager.showError(message);
        } else {
            console.error('错误:', message);
        }
    }
    
    // 显示成功消息
    showSuccess(message) {
        if (window.chatManager && window.chatManager.showSuccess) {
            window.chatManager.showSuccess(message);
        } else {
            console.log('成功:', message);
        }
    }
    
    // 播放通知音效
    playNotificationSound() {
        // 简单的通知音效
        if ('AudioContext' in window || 'webkitAudioContext' in window) {
            try {
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.value = 800;
                oscillator.type = 'sine';
                
                gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
                
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.1);
            } catch (error) {
                // 忽略音效播放错误
            }
        }
    }
    
    // 获取连接状态
    getConnectionStatus() {
        return {
            connected: this.isPolling,
            polling: this.isPolling,
            lastMessageId: this.lastMessageId,
            user: this.currentUser
        };
    }
    
    // 清理资源
    destroy() {
        this.stopPolling();
        this.currentUser = null;
        this.lastMessageId = null;
        console.log('🧹 Vercel聊天适配器已清理');
    }
}

// 检测是否在Vercel环境中
function isVercelEnvironment() {
    // 检测是否有Socket.IO但连接失败
    return typeof io === 'undefined' ||
           window.location.hostname.includes('vercel.app') ||
           window.location.hostname.includes('vercel.com');
}

// 自动初始化适配器
if (isVercelEnvironment()) {
    console.log('🔧 检测到Vercel环境，使用HTTP聊天适配器');
    window.vercelChatAdapter = new VercelChatAdapter();
    
    // 替换原有的聊天管理器初始化
    document.addEventListener('DOMContentLoaded', () => {
        // 等待认证管理器初始化完成
        setTimeout(() => {
            // 检查用户是否已登录
            if (window.authManager && window.authManager.isLoggedIn()) {
                const currentUser = window.authManager.getCurrentUser();
                // 启动聊天功能
                window.vercelChatAdapter.initChat(currentUser);
            }
            
            if (window.chatManager) {
                // 重写发送消息方法
                const originalHandleSendMessage = window.chatManager.handleSendMessage;
                window.chatManager.handleSendMessage = async function(event) {
                    event.preventDefault();
                    
                    // 检查是否已登录
                    if (!window.authManager.isLoggedIn()) {
                        this.showError('请先登录');
                        return;
                    }
                    
                    const messageText = document.getElementById('messageText');
                    if (!messageText) return;
                    
                    const content = messageText.value.trim();
                    if (!content) return;
                    
                    // 使用Vercel适配器发送消息
                    const success = await window.vercelChatAdapter.sendMessage(content);
                    if (success) {
                        messageText.value = '';
                        if (this.adjustTextareaHeight) {
                            this.adjustTextareaHeight(messageText);
                        }
                    }
                };
                
                // 重写用户登录处理
                const originalHandleUserLogin = window.chatManager.handleUserLogin;
                window.chatManager.handleUserLogin = function(userData) {
                    this.currentUser = userData.user;
                    
                    // 更新Vercel适配器的用户信息并启动聊天
                    window.vercelChatAdapter.currentUser = userData.user;
                    window.vercelChatAdapter.initChat(userData.user);
                    
                    console.log('用户登录，启动Vercel聊天功能');
                };
                
                // 重写用户退出处理
                const originalHandleUserLogout = window.chatManager.handleUserLogout;
                window.chatManager.handleUserLogout = function() {
                    this.currentUser = null;
                    
                    // 停止聊天功能
                    window.vercelChatAdapter.stopPolling();
                    window.vercelChatAdapter.currentUser = null;
                    
                    console.log('用户退出，停止聊天功能');
                };
            }
        }, 100); // 延迟100ms确保认证管理器已初始化
    });
}

// 导出适配器
window.VercelChatAdapter = VercelChatAdapter;