#!/bin/bash

# Cloudflare Pages 部署脚本
# 使用方法: ./deploy-to-cloudflare.sh [后端地址]

set -e

echo "🚀 Cloudflare Pages 部署脚本"
echo "================================"

# 检查参数
BACKEND_URL=${1:-"https://your-backend-app.vercel.app"}

echo "📋 配置信息:"
echo "   后端地址: $BACKEND_URL"
echo "   前端目录: public/"
echo ""

# 检查必要文件
if [ ! -d "public" ]; then
    echo "❌ 错误: 未找到 public 目录"
    echo "请确保在项目根目录运行此脚本"
    exit 1
fi

if [ ! -f "public/index.html" ]; then
    echo "❌ 错误: 未找到 public/index.html"
    exit 1
fi

echo "✅ 项目结构检查通过"

# 更新配置文件
echo "🔧 更新 Cloudflare 配置..."

# 更新 cloudflare-config.js 中的后端地址
if [ -f "public/js/cloudflare-config.js" ]; then
    # 使用 sed 替换后端地址
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s|https://your-backend-app.vercel.app|$BACKEND_URL|g" public/js/cloudflare-config.js
    else
        # Linux
        sed -i "s|https://your-backend-app.vercel.app|$BACKEND_URL|g" public/js/cloudflare-config.js
    fi
    echo "✅ 已更新 cloudflare-config.js"
else
    echo "⚠️  未找到 cloudflare-config.js，将创建新文件"
    
    cat > public/js/cloudflare-config.js << EOF
/**
 * Cloudflare Pages 配置文件
 * 自动检测环境并配置API地址
 */
(function() {
    'use strict';
    
    const hostname = window.location.hostname;
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
    
    let apiBaseUrl, wsUrl;
    
    if (isLocalhost) {
        apiBaseUrl = 'http://localhost:3000';
        wsUrl = 'ws://localhost:3000';
        console.log('🏠 本地开发环境');
    } else {
        apiBaseUrl = '$BACKEND_URL';
        wsUrl = '${BACKEND_URL/https:/wss:}';
        console.log('🌐 生产环境');
    }
    
    window.CLOUDFLARE_CONFIG = {
        API_BASE_URL: apiBaseUrl,
        WS_URL: wsUrl,
        IS_PRODUCTION: !isLocalhost
    };
    
    window.API_BASE_URL = apiBaseUrl;
    window.WS_URL = wsUrl;
    
    console.log('📡 API配置:', { baseUrl: apiBaseUrl, wsUrl: wsUrl });
})();
EOF
    echo "✅ 已创建 cloudflare-config.js"
fi

# 检查 index.html 是否包含配置脚本
if ! grep -q "cloudflare-config.js" public/index.html; then
    echo "🔧 更新 index.html..."
    
    # 在 </head> 之前插入脚本引用
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' 's|</head>|    <script src="./js/cloudflare-config.js"></script>\
</head>|' public/index.html
    else
        # Linux
        sed -i 's|</head>|    <script src="./js/cloudflare-config.js"></script>\n</head>|' public/index.html
    fi
    echo "✅ 已更新 index.html"
else
    echo "✅ index.html 已包含配置脚本"
fi

# 创建 _headers 文件用于 Cloudflare Pages
echo "🔧 创建 Cloudflare Pages 配置..."

cat > public/_headers << EOF
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin

/js/*
  Cache-Control: public, max-age=31536000, immutable

/css/*
  Cache-Control: public, max-age=31536000, immutable

/patterns/*
  Cache-Control: public, max-age=31536000, immutable

/api/*
  Cache-Control: no-cache, no-store, must-revalidate
EOF

echo "✅ 已创建 _headers 文件"

# 创建 _redirects 文件
cat > public/_redirects << EOF
# SPA 路由支持
/*    /index.html   200
EOF

echo "✅ 已创建 _redirects 文件"

# 检查 Git 状态
if [ -d ".git" ]; then
    echo "📦 准备提交更改..."
    
    git add public/js/cloudflare-config.js public/_headers public/_redirects
    
    if ! git diff --cached --quiet; then
        git add public/index.html 2>/dev/null || true
        git commit -m "Configure for Cloudflare Pages deployment

- Add cloudflare-config.js for environment detection
- Update API endpoints to: $BACKEND_URL
- Add _headers for security and caching
- Add _redirects for SPA routing"
        
        echo "✅ 已提交配置更改"
        
        echo ""
        echo "🚀 准备推送到 GitHub..."
        echo "运行以下命令完成部署:"
        echo ""
        echo "   git push"
        echo ""
        echo "然后在 Cloudflare Pages 中连接此仓库"
    else
        echo "ℹ️  没有需要提交的更改"
    fi
else
    echo "⚠️  未检测到 Git 仓库"
    echo "请先初始化 Git 仓库:"
    echo ""
    echo "   git init"
    echo "   git add ."
    echo "   git commit -m 'Initial commit'"
    echo "   git remote add origin https://github.com/yourusername/your-repo.git"
    echo "   git push -u origin main"
fi

echo ""
echo "🎉 配置完成！"
echo ""
echo "📋 下一步操作:"
echo "1. 推送代码到 GitHub: git push"
echo "2. 访问 Cloudflare Dashboard: https://dash.cloudflare.com/"
echo "3. 创建 Pages 项目并连接 GitHub 仓库"
echo "4. 构建设置:"
echo "   - 构建命令: (留空)"
echo "   - 构建输出目录: public"
echo "5. 部署完成后访问: https://your-project.pages.dev"
echo ""
echo "🔧 如需修改后端地址，请编辑: public/js/cloudflare-config.js"
echo ""
echo "✨ 祝你部署顺利！"