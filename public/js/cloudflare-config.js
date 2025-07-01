/**
 * Cloudflare Pages 配置文件
 * 自动检测环境并配置API地址
 */
(function() {
    'use strict';
    
    // 检测当前环境
    const hostname = window.location.hostname;
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
    const isCloudflarePages = hostname.includes('pages.dev');
    const isCustomDomain = !isLocalhost && !isCloudflarePages;
    
    // 配置API地址
    let apiBaseUrl, wsUrl;
    
    if (isLocalhost) {
        // 本地开发环境
        apiBaseUrl = 'http://localhost:3000';
        wsUrl = 'ws://localhost:3000';
        console.log('🏠 本地开发环境');
    } else {
        // 生产环境 - 请替换为你的实际后端地址
        apiBaseUrl = 'https://your-backend-app.vercel.app';  // 替换为你的后端地址
        wsUrl = 'wss://your-backend-app.vercel.app';         // 替换为你的后端地址
        
        if (isCloudflarePages) {
            console.log('🌐 Cloudflare Pages环境');
        } else if (isCustomDomain) {
            console.log('🌍 自定义域名环境');
        }
    }
    
    // 设置全局配置
    window.CLOUDFLARE_CONFIG = {
        API_BASE_URL: apiBaseUrl,
        WS_URL: wsUrl,
        IS_PRODUCTION: !isLocalhost,
        IS_CLOUDFLARE_PAGES: isCloudflarePages,
        ENVIRONMENT: isLocalhost ? 'development' : 'production'
    };
    
    // 向后兼容
    window.API_BASE_URL = apiBaseUrl;
    window.WS_URL = wsUrl;
    
    console.log('📡 API配置:', {
        baseUrl: apiBaseUrl,
        wsUrl: wsUrl,
        environment: window.CLOUDFLARE_CONFIG.ENVIRONMENT
    });
    
    // 检查后端连接状态
    if (!isLocalhost) {
        checkBackendConnection();
    }
    
    /**
     * 检查后端连接状态
     */
    async function checkBackendConnection() {
        try {
            const response = await fetch(`${apiBaseUrl}/api/debug/info`, {
                method: 'GET',
                timeout: 5000
            });
            
            if (response.ok) {
                console.log('✅ 后端连接正常');
            } else {
                console.warn('⚠️ 后端响应异常:', response.status);
            }
        } catch (error) {
            console.error('❌ 后端连接失败:', error.message);
            console.warn('请检查后端服务是否正常运行，或更新 cloudflare-config.js 中的API地址');
        }
    }
    
})();