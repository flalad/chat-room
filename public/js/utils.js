// 工具函数库
const Utils = {
    // 生成唯一ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },
    
    // 格式化时间
    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        // 小于1分钟显示"刚刚"
        if (diff < 60000) {
            return '刚刚';
        }
        
        // 小于1小时显示分钟
        if (diff < 3600000) {
            const minutes = Math.floor(diff / 60000);
            return `${minutes}分钟前`;
        }
        
        // 小于24小时显示小时
        if (diff < 86400000) {
            const hours = Math.floor(diff / 3600000);
            return `${hours}小时前`;
        }
        
        // 今天显示时间
        if (date.toDateString() === now.toDateString()) {
            return date.toLocaleTimeString('zh-CN', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
        }
        
        // 昨天
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        if (date.toDateString() === yesterday.toDateString()) {
            return `昨天 ${date.toLocaleTimeString('zh-CN', { 
                hour: '2-digit', 
                minute: '2-digit' 
            })}`;
        }
        
        // 其他显示日期
        return date.toLocaleDateString('zh-CN', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },
    
    // 转义HTML
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },
    
    // 反转义HTML
    unescapeHtml(html) {
        const div = document.createElement('div');
        div.innerHTML = html;
        return div.textContent || div.innerText || '';
    },
    
    // 验证用户名
    validateUsername(username) {
        if (!username || typeof username !== 'string') {
            return { valid: false, message: '用户名不能为空' };
        }
        
        if (username.length < 2) {
            return { valid: false, message: '用户名至少需要2个字符' };
        }
        
        if (username.length > CONFIG.MAX_USERNAME_LENGTH) {
            return { valid: false, message: `用户名不能超过${CONFIG.MAX_USERNAME_LENGTH}个字符` };
        }
        
        if (!/^[a-zA-Z0-9\u4e00-\u9fa5_-]+$/.test(username)) {
            return { valid: false, message: '用户名只能包含字母、数字、中文、下划线和连字符' };
        }
        
        return { valid: true };
    },
    
    // 验证密码
    validatePassword(password) {
        if (!password || typeof password !== 'string') {
            return { valid: false, message: '密码不能为空' };
        }
        
        if (password.length < CONFIG.MIN_PASSWORD_LENGTH) {
            return { valid: false, message: `密码至少需要${CONFIG.MIN_PASSWORD_LENGTH}个字符` };
        }
        
        return { valid: true };
    },
    
    // 验证消息
    validateMessage(message) {
        if (!message || typeof message !== 'string') {
            return { valid: false, message: '消息不能为空' };
        }
        
        if (message.trim().length === 0) {
            return { valid: false, message: '消息不能为空' };
        }
        
        if (message.length > CONFIG.MAX_MESSAGE_LENGTH) {
            return { valid: false, message: `消息不能超过${CONFIG.MAX_MESSAGE_LENGTH}个字符` };
        }
        
        return { valid: true };
    },
    
    // 显示通知
    showNotification(message, type = 'info', duration = CONFIG.NOTIFICATION_DURATION) {
        // 移除现有通知
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        // 创建通知元素
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        // 添加到页面
        document.body.appendChild(notification);
        
        // 显示动画
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // 自动隐藏
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);
    },
    
    // 本地存储操作
    storage: {
        set(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (error) {
                console.error('存储数据失败:', error);
                return false;
            }
        },
        
        get(key, defaultValue = null) {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            } catch (error) {
                console.error('读取数据失败:', error);
                return defaultValue;
            }
        },
        
        remove(key) {
            try {
                localStorage.removeItem(key);
                return true;
            } catch (error) {
                console.error('删除数据失败:', error);
                return false;
            }
        },
        
        clear() {
            try {
                localStorage.clear();
                return true;
            } catch (error) {
                console.error('清空数据失败:', error);
                return false;
            }
        }
    },
    
    // 防抖函数
    debounce(func, wait, immediate = false) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                timeout = null;
                if (!immediate) func.apply(this, args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(this, args);
        };
    },
    
    // 节流函数
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },
    
    // 获取用户头像字符
    getAvatarChar(username) {
        if (!username) return '?';
        
        // 如果是中文，取第一个字符
        if (/[\u4e00-\u9fa5]/.test(username)) {
            return username.charAt(0);
        }
        
        // 如果是英文，取第一个字母并转大写
        return username.charAt(0).toUpperCase();
    },
    
    // 生成随机颜色
    generateColor(seed) {
        const colors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
            '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
            '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D7BDE2'
        ];
        
        if (seed) {
            let hash = 0;
            for (let i = 0; i < seed.length; i++) {
                hash = seed.charCodeAt(i) + ((hash << 5) - hash);
            }
            return colors[Math.abs(hash) % colors.length];
        }
        
        return colors[Math.floor(Math.random() * colors.length)];
    },
    
    // 复制到剪贴板
    async copyToClipboard(text) {
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
                return true;
            } else {
                // 降级方案
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                textArea.style.top = '-999999px';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                const result = document.execCommand('copy');
                textArea.remove();
                return result;
            }
        } catch (error) {
            console.error('复制失败:', error);
            return false;
        }
    },
    
    // 检测设备类型
    getDeviceType() {
        const userAgent = navigator.userAgent.toLowerCase();
        
        if (/mobile|android|iphone|ipad|phone/i.test(userAgent)) {
            return 'mobile';
        }
        
        if (/tablet|ipad/i.test(userAgent)) {
            return 'tablet';
        }
        
        return 'desktop';
    },
    
    // 检测浏览器
    getBrowser() {
        const userAgent = navigator.userAgent.toLowerCase();
        
        if (userAgent.includes('chrome')) return 'chrome';
        if (userAgent.includes('firefox')) return 'firefox';
        if (userAgent.includes('safari')) return 'safari';
        if (userAgent.includes('edge')) return 'edge';
        if (userAgent.includes('opera')) return 'opera';
        
        return 'unknown';
    },
    
    // 格式化文件大小
    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },
    
    // 检查网络状态
    isOnline() {
        return navigator.onLine;
    },
    
    // 等待函数
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },
    
    // 重试函数
    async retry(fn, maxAttempts = 3, delay = 1000) {
        let lastError;
        
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return await fn();
            } catch (error) {
                lastError = error;
                if (attempt < maxAttempts) {
                    await this.sleep(delay * attempt);
                }
            }
        }
        
        throw lastError;
    },
    
    // 日志函数
    log: {
        info(message, ...args) {
            if (CONFIG.DEBUG) {
                console.log(`[INFO] ${message}`, ...args);
            }
        },
        
        warn(message, ...args) {
            if (CONFIG.DEBUG) {
                console.warn(`[WARN] ${message}`, ...args);
            }
        },
        
        error(message, ...args) {
            console.error(`[ERROR] ${message}`, ...args);
        },
        
        debug(message, ...args) {
            if (CONFIG.DEBUG) {
                console.debug(`[DEBUG] ${message}`, ...args);
            }
        }
    }
};

// 导出工具函数
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
}

// 开发模式下输出工具函数信息
if (CONFIG.DEBUG) {
    console.log('🔧 工具函数已加载:', Utils);
}