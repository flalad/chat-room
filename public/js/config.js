// 应用配置
const CONFIG = {
    // 应用信息
    APP_NAME: '私人聊天室',
    VERSION: '1.0.0',
    
    // 服务器配置
    SERVER_URL: window.location.origin,
    SOCKET_PATH: '/socket.io/',
    
    // 连接配置
    CONNECTION_TIMEOUT: 5000,
    RECONNECT_ATTEMPTS: 5,
    RECONNECT_DELAY: 1000,
    
    // 消息配置
    MAX_MESSAGE_LENGTH: 1000,
    MESSAGE_HISTORY_LIMIT: 100,
    
    // 用户配置
    MAX_USERNAME_LENGTH: 20,
    MIN_PASSWORD_LENGTH: 6,
    
    // UI配置
    NOTIFICATION_DURATION: 3000,
    TYPING_TIMEOUT: 3000,
    MESSAGE_ANIMATION_DURATION: 300,
    
    // 本地存储键名
    STORAGE_KEYS: {
        USER_DATA: 'chatroom_user_data',
        SETTINGS: 'chatroom_settings',
        THEME: 'chatroom_theme'
    },
    
    // 消息类型
    MESSAGE_TYPES: {
        TEXT: 'text',
        SYSTEM: 'system',
        JOIN: 'join',
        LEAVE: 'leave'
    },
    
    // 用户状态
    USER_STATUS: {
        ONLINE: 'online',
        OFFLINE: 'offline',
        AWAY: 'away'
    },
    
    // 事件名称
    EVENTS: {
        // 连接事件
        CONNECT: 'connect',
        DISCONNECT: 'disconnect',
        RECONNECT: 'reconnect',
        CONNECT_ERROR: 'connect_error',
        
        // 认证事件
        LOGIN: 'login',
        REGISTER: 'register',
        LOGOUT: 'logout',
        AUTH_SUCCESS: 'auth_success',
        AUTH_ERROR: 'auth_error',
        
        // 消息事件
        MESSAGE: 'message',
        NEW_MESSAGE: 'new_message',
        MESSAGE_HISTORY: 'message_history',
        
        // 用户事件
        USER_JOIN: 'user_join',
        USER_LEAVE: 'user_leave',
        USER_LIST: 'user_list',
        USER_TYPING: 'user_typing',
        USER_STOP_TYPING: 'user_stop_typing',
        
        // 系统事件
        SYSTEM_MESSAGE: 'system_message',
        ERROR: 'error'
    },
    
    // 错误代码
    ERROR_CODES: {
        INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
        USER_EXISTS: 'USER_EXISTS',
        USER_NOT_FOUND: 'USER_NOT_FOUND',
        INVALID_TOKEN: 'INVALID_TOKEN',
        MESSAGE_TOO_LONG: 'MESSAGE_TOO_LONG',
        RATE_LIMITED: 'RATE_LIMITED',
        SERVER_ERROR: 'SERVER_ERROR'
    },
    
    // 错误消息
    ERROR_MESSAGES: {
        INVALID_CREDENTIALS: '用户名或密码错误',
        USER_EXISTS: '用户名已存在',
        USER_NOT_FOUND: '用户不存在',
        INVALID_TOKEN: '登录已过期，请重新登录',
        MESSAGE_TOO_LONG: '消息太长，请缩短后重试',
        RATE_LIMITED: '发送太频繁，请稍后再试',
        SERVER_ERROR: '服务器错误，请稍后重试',
        CONNECTION_FAILED: '连接失败，请检查网络',
        UNKNOWN_ERROR: '未知错误，请重试'
    },
    
    // 成功消息
    SUCCESS_MESSAGES: {
        LOGIN_SUCCESS: '登录成功',
        REGISTER_SUCCESS: '注册成功',
        MESSAGE_SENT: '消息已发送',
        CONNECTED: '已连接到服务器'
    },
    
    // 主题配置
    THEMES: {
        LIGHT: 'light',
        DARK: 'dark',
        AUTO: 'auto'
    },
    
    // 声音配置
    SOUNDS: {
        MESSAGE: '/sounds/message.mp3',
        NOTIFICATION: '/sounds/notification.mp3',
        JOIN: '/sounds/join.mp3',
        LEAVE: '/sounds/leave.mp3'
    },
    
    // 开发模式
    DEBUG: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
    
    // API端点
    API_ENDPOINTS: {
        LOGIN: '/api/auth/login',
        REGISTER: '/api/auth/register',
        LOGOUT: '/api/auth/logout',
        MESSAGES: '/api/messages',
        USERS: '/api/users'
    }
};

// 冻结配置对象，防止意外修改
Object.freeze(CONFIG);
Object.freeze(CONFIG.STORAGE_KEYS);
Object.freeze(CONFIG.MESSAGE_TYPES);
Object.freeze(CONFIG.USER_STATUS);
Object.freeze(CONFIG.EVENTS);
Object.freeze(CONFIG.ERROR_CODES);
Object.freeze(CONFIG.ERROR_MESSAGES);
Object.freeze(CONFIG.SUCCESS_MESSAGES);
Object.freeze(CONFIG.THEMES);
Object.freeze(CONFIG.SOUNDS);
Object.freeze(CONFIG.API_ENDPOINTS);

// 导出配置
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}

// 开发模式下输出配置信息
if (CONFIG.DEBUG) {
    console.log('🔧 应用配置已加载:', CONFIG);
}