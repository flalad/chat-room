@echo off
setlocal enabledelayedexpansion

REM Cloudflare Pages 部署脚本 (Windows版本)
REM 使用方法: deploy-to-cloudflare.bat [后端地址]

echo 🚀 Cloudflare Pages 部署脚本
echo ================================

REM 检查参数
set "BACKEND_URL=%~1"
if "%BACKEND_URL%"=="" set "BACKEND_URL=https://your-backend-app.vercel.app"

echo 📋 配置信息:
echo    后端地址: %BACKEND_URL%
echo    前端目录: public/
echo.

REM 检查必要文件
if not exist "public" (
    echo ❌ 错误: 未找到 public 目录
    echo 请确保在项目根目录运行此脚本
    pause
    exit /b 1
)

if not exist "public\index.html" (
    echo ❌ 错误: 未找到 public\index.html
    pause
    exit /b 1
)

echo ✅ 项目结构检查通过

REM 创建 js 目录（如果不存在）
if not exist "public\js" mkdir "public\js"

REM 更新配置文件
echo 🔧 更新 Cloudflare 配置...

REM 创建 cloudflare-config.js
echo 创建 cloudflare-config.js...
(
echo /**
echo  * Cloudflare Pages 配置文件
echo  * 自动检测环境并配置API地址
echo  */
echo ^(function^(^) {
echo     'use strict';
echo.    
echo     const hostname = window.location.hostname;
echo     const isLocalhost = hostname === 'localhost' ^|^| hostname === '127.0.0.1';
echo.    
echo     let apiBaseUrl, wsUrl;
echo.    
echo     if ^(isLocalhost^) {
echo         apiBaseUrl = 'http://localhost:3000';
echo         wsUrl = 'ws://localhost:3000';
echo         console.log^('🏠 本地开发环境'^);
echo     } else {
echo         apiBaseUrl = '%BACKEND_URL%';
echo         wsUrl = '%BACKEND_URL:https:=wss:%';
echo         console.log^('🌐 生产环境'^);
echo     }
echo.    
echo     window.CLOUDFLARE_CONFIG = {
echo         API_BASE_URL: apiBaseUrl,
echo         WS_URL: wsUrl,
echo         IS_PRODUCTION: !isLocalhost
echo     };
echo.    
echo     window.API_BASE_URL = apiBaseUrl;
echo     window.WS_URL = wsUrl;
echo.    
echo     console.log^('📡 API配置:', { baseUrl: apiBaseUrl, wsUrl: wsUrl }^);
echo }^)^(^);
) > "public\js\cloudflare-config.js"

echo ✅ 已创建 cloudflare-config.js

REM 检查 index.html 是否包含配置脚本
findstr /c:"cloudflare-config.js" "public\index.html" >nul
if errorlevel 1 (
    echo 🔧 更新 index.html...
    
