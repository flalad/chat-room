// 认证页面JavaScript逻辑
class AuthPage {
    constructor() {
        this.init();
    }

    init() {
        this.bindEvents();
        this.checkAuthStatus();
    }

    bindEvents() {
        // 登录表单
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', this.handleLogin.bind(this));
        }

        // 注册表单
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', this.handleRegister.bind(this));
            this.bindRegisterValidation();
        }

        // 窗口控制按钮
        this.bindWindowControls();
    }

    bindWindowControls() {
        const closeBtn = document.querySelector('.control-btn.close');
        const minimizeBtn = document.querySelector('.control-btn.minimize');
        const maximizeBtn = document.querySelector('.control-btn.maximize');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                window.close();
            });
        }

        if (minimizeBtn) {
            minimizeBtn.addEventListener('click', () => {
                // 模拟最小化效果
                document.body.style.transform = 'scale(0.1)';
                document.body.style.opacity = '0';
                setTimeout(() => {
                    document.body.style.transform = 'scale(1)';
                    document.body.style.opacity = '1';
                }, 300);
            });
        }

        if (maximizeBtn) {
            maximizeBtn.addEventListener('click', () => {
                // 模拟最大化效果
                const authWindow = document.querySelector('.auth-window');
                authWindow.classList.toggle('maximized');
            });
        }
    }

    bindRegisterValidation() {
        const passwordInput = document.getElementById('password');
        const confirmPasswordInput = document.getElementById('confirmPassword');
        const usernameInput = document.getElementById('username');

        if (passwordInput) {
            passwordInput.addEventListener('input', this.validatePassword.bind(this));
        }

        if (confirmPasswordInput) {
            confirmPasswordInput.addEventListener('input', this.validatePasswordConfirm.bind(this));
        }

        if (usernameInput) {
            usernameInput.addEventListener('input', this.validateUsername.bind(this));
        }
    }

    validateUsername(event) {
        const username = event.target.value;
        const input = event.target;

        if (username.length < 3) {
            input.classList.remove('valid');
            input.classList.add('invalid');
        } else if (username.length >= 3 && username.length <= 20) {
            input.classList.remove('invalid');
            input.classList.add('valid');
        } else {
            input.classList.remove('valid');
            input.classList.add('invalid');
        }
    }

    validatePassword(event) {
        const password = event.target.value;
        const input = event.target;

        if (password.length < 6) {
            input.classList.remove('valid');
            input.classList.add('invalid');
        } else {
            input.classList.remove('invalid');
            input.classList.add('valid');
        }

        // 触发确认密码验证
        const confirmPasswordInput = document.getElementById('confirmPassword');
        if (confirmPasswordInput && confirmPasswordInput.value) {
            this.validatePasswordConfirm({ target: confirmPasswordInput });
        }
    }

    validatePasswordConfirm(event) {
        const confirmPassword = event.target.value;
        const password = document.getElementById('password').value;
        const input = event.target;

        if (confirmPassword === password && confirmPassword.length >= 6) {
            input.classList.remove('invalid');
            input.classList.add('valid');
        } else {
            input.classList.remove('valid');
            input.classList.add('invalid');
        }
    }

    async handleLogin(event) {
        event.preventDefault();
        
        const form = event.target;
        const formData = new FormData(form);
        const username = formData.get('username');
        const password = formData.get('password');

        if (!username || !password) {
            this.showError('请填写完整的登录信息');
            return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        this.setButtonLoading(submitBtn, true);

        try {
            // 检查是否为管理员账号，优先尝试管理员登录
            if (username === 'admin') {
                try {
                    const adminResponse = await fetch('/api/admin/login', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ username, password })
                    });

                    if (adminResponse.ok) {
                        const adminData = await adminResponse.json();
                        
                        // 保存管理员认证信息
                        localStorage.setItem('adminToken', adminData.token);
                        localStorage.setItem('currentAdmin', JSON.stringify(adminData.admin));
                        
                        this.showSuccess('管理员登录成功！正在跳转到后台...');
                        
                        // 跳转到管理员后台
                        setTimeout(() => {
                            window.location.href = '/admin.html';
                        }, 1500);
                        return;
                    } else {
                        const adminError = await adminResponse.json();
                        this.showError(adminError.message || '管理员登录失败，请检查用户名和密码');
                        return;
                    }
                } catch (adminError) {
                    console.error('管理员登录错误:', adminError);
                    this.showError('管理员登录失败，请稍后重试');
                    return;
                }
            }

            // 普通用户登录
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (response.ok) {
                // 普通用户登录成功
                localStorage.setItem('user', JSON.stringify(data.user));
                localStorage.setItem('token', data.token);
                
                this.showSuccess('登录成功！正在跳转...');
                
                // 延迟跳转到聊天室
                setTimeout(() => {
                    window.location.href = '/';
                }, 1500);
            } else {
                this.showError(data.message || '登录失败，请检查用户名和密码');
            }
        } catch (error) {
            console.error('登录错误:', error);
            this.showError('网络连接失败，请稍后重试');
        } finally {
            this.setButtonLoading(submitBtn, false);
        }
    }

    async handleRegister(event) {
        event.preventDefault();
        
        const form = event.target;
        const formData = new FormData(form);
        const username = formData.get('username');
        const password = formData.get('password');
        const confirmPassword = formData.get('confirmPassword');

        // 表单验证
        if (!username || !password || !confirmPassword) {
            this.showError('请填写完整的注册信息');
            return;
        }

        if (username.length < 3 || username.length > 20) {
            this.showError('用户名长度必须在3-20个字符之间');
            return;
        }

        if (password.length < 6) {
            this.showError('密码长度至少6个字符');
            return;
        }

        if (password !== confirmPassword) {
            this.showError('两次输入的密码不一致');
            return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        this.setButtonLoading(submitBtn, true);

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (response.ok) {
                this.showSuccess('注册成功！正在跳转到登录页面...');
                
                // 延迟跳转到登录页面
                setTimeout(() => {
                    window.location.href = '/login.html';
                }, 2000);
            } else {
                this.showError(data.message || '注册失败，请稍后重试');
            }
        } catch (error) {
            console.error('注册错误:', error);
            this.showError('网络连接失败，请稍后重试');
        } finally {
            this.setButtonLoading(submitBtn, false);
        }
    }

    checkAuthStatus() {
        // 如果已经登录，直接跳转到聊天室
        const user = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        
        if (user && token) {
            // 验证token是否有效
            this.verifyToken(token).then(isValid => {
                if (isValid) {
                    window.location.href = '/';
                }
            });
        }
    }

    async verifyToken(token) {
        try {
            const response = await fetch('/api/auth/verify', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            return response.ok;
        } catch (error) {
            console.error('Token验证失败:', error);
            return false;
        }
    }

    setButtonLoading(button, loading) {
        if (loading) {
            button.classList.add('loading');
            button.disabled = true;
        } else {
            button.classList.remove('loading');
            button.disabled = false;
        }
    }

    showError(message) {
        this.hideMessages();
        const errorDiv = document.getElementById('errorMessage');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
            
            // 自动隐藏错误消息
            setTimeout(() => {
                errorDiv.style.display = 'none';
            }, 5000);
        }
    }

    showSuccess(message) {
        this.hideMessages();
        const successDiv = document.getElementById('successMessage');
        if (successDiv) {
            successDiv.textContent = message;
            successDiv.style.display = 'block';
        }
    }

    hideMessages() {
        const errorDiv = document.getElementById('errorMessage');
        const successDiv = document.getElementById('successMessage');
        
        if (errorDiv) errorDiv.style.display = 'none';
        if (successDiv) successDiv.style.display = 'none';
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    new AuthPage();
});

// 添加一些页面特效
document.addEventListener('DOMContentLoaded', () => {
    // 添加粒子背景效果
    createParticleBackground();
    
    // 添加键盘快捷键支持
    document.addEventListener('keydown', (event) => {
        // Enter键快速提交表单
        if (event.key === 'Enter' && event.ctrlKey) {
            const activeForm = document.querySelector('form');
            if (activeForm) {
                activeForm.dispatchEvent(new Event('submit'));
            }
        }
        
        // Escape键清除错误消息
        if (event.key === 'Escape') {
            const errorDiv = document.getElementById('errorMessage');
            const successDiv = document.getElementById('successMessage');
            if (errorDiv) errorDiv.style.display = 'none';
            if (successDiv) successDiv.style.display = 'none';
        }
    });
});

// 创建粒子背景效果
function createParticleBackground() {
    const container = document.querySelector('.auth-container');
    if (!container) return;

    // 创建粒子容器
    const particleContainer = document.createElement('div');
    particleContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: -1;
    `;
    container.appendChild(particleContainer);

    // 创建粒子
    for (let i = 0; i < 50; i++) {
        createParticle(particleContainer);
    }
}

function createParticle(container) {
    const particle = document.createElement('div');
    const size = Math.random() * 4 + 2;
    const x = Math.random() * window.innerWidth;
    const y = Math.random() * window.innerHeight;
    const duration = Math.random() * 20 + 10;

    particle.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        background: rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        left: ${x}px;
        top: ${y}px;
        animation: float ${duration}s infinite linear;
    `;

    // 添加浮动动画
    const keyframes = `
        @keyframes float {
            0% {
                transform: translateY(0px) rotate(0deg);
                opacity: 0;
            }
            10% {
                opacity: 1;
            }
            90% {
                opacity: 1;
            }
            100% {
                transform: translateY(-100vh) rotate(360deg);
                opacity: 0;
            }
        }
    `;

    if (!document.querySelector('#particle-keyframes')) {
        const style = document.createElement('style');
        style.id = 'particle-keyframes';
        style.textContent = keyframes;
        document.head.appendChild(style);
    }

    container.appendChild(particle);

    // 粒子动画结束后重新创建
    setTimeout(() => {
        if (particle.parentNode) {
            particle.parentNode.removeChild(particle);
            createParticle(container);
        }
    }, duration * 1000);
}