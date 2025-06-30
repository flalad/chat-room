// 主题管理器
class ThemeManager {
    constructor() {
        this.currentTheme = 'default';
        this.currentBackground = 'none';
        this.themes = {
            default: {
                name: '经典蓝',
                colors: {
                    primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    background: '#ffffff',
                    messageOwn: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    messageOther: '#f1f3f4',
                    text: '#000000',
                    textSecondary: '#70757a'
                },
                preview: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            },
            dark: {
                name: '深色夜晚',
                colors: {
                    primary: 'linear-gradient(135deg, #8774e1 0%, #bf68f0 100%)',
                    background: '#212121',
                    messageOwn: 'linear-gradient(135deg, #8774e1 0%, #bf68f0 100%)',
                    messageOther: '#2f2f2f',
                    text: '#ffffff',
                    textSecondary: '#aaaaaa'
                },
                preview: 'linear-gradient(135deg, #8774e1 0%, #bf68f0 100%)'
            },
            sunset: {
                name: '日落橙',
                colors: {
                    primary: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                    background: '#fff5f5',
                    messageOwn: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                    messageOther: '#ffffff',
                    text: '#2d1b69',
                    textSecondary: '#8b5cf6'
                },
                preview: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
            },
            ocean: {
                name: '海洋蓝',
                colors: {
                    primary: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                    background: '#f0f9ff',
                    messageOwn: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                    messageOther: '#ffffff',
                    text: '#0c4a6e',
                    textSecondary: '#0284c7'
                },
                preview: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
            },
            forest: {
                name: '森林绿',
                colors: {
                    primary: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                    background: '#f0fdf4',
                    messageOwn: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                    messageOther: '#ffffff',
                    text: '#14532d',
                    textSecondary: '#16a34a'
                },
                preview: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
            },
            aurora: {
                name: '极光紫',
                colors: {
                    primary: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
                    background: '#fefcff',
                    messageOwn: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
                    messageOther: '#ffffff',
                    text: '#581c87',
                    textSecondary: '#9333ea'
                },
                preview: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
            }
        };
        
        this.backgrounds = {
            none: {
                name: '无背景',
                type: 'color',
                value: 'transparent'
            },
            doodle1: {
                name: '涂鸦梦境',
                type: 'doodle',
                gradient: 'radial-gradient(ellipse at top left, rgba(255, 182, 193, 0.6) 0%, transparent 70%), radial-gradient(ellipse at top right, rgba(255, 255, 224, 0.6) 0%, transparent 70%), radial-gradient(ellipse at bottom left, rgba(221, 160, 221, 0.6) 0%, transparent 70%), radial-gradient(ellipse at bottom right, rgba(173, 216, 230, 0.6) 0%, transparent 70%), linear-gradient(45deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
                pattern: './patterns/wallpaper.png'
            }
        };
        
        this.init();
    }
    
    init() {
        this.loadSettings();
        this.applyTheme();
        
        // 确保DOM加载完成后再应用背景
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.applyBackground();
            });
        } else {
            this.applyBackground();
        }
    }
    
    loadSettings() {
        this.currentTheme = localStorage.getItem('chatTheme') || 'default';
        this.currentBackground = localStorage.getItem('chatBackground') || 'none';
    }
    
    saveSettings() {
        localStorage.setItem('chatTheme', this.currentTheme);
        localStorage.setItem('chatBackground', this.currentBackground);
    }
    
    setTheme(themeId) {
        if (this.themes[themeId]) {
            this.currentTheme = themeId;
            this.applyTheme();
            this.saveSettings();
            this.dispatchThemeChange();
        }
    }
    
    setBackground(backgroundId) {
        if (this.backgrounds[backgroundId]) {
            this.currentBackground = backgroundId;
            this.applyBackground();
            this.saveSettings();
            this.dispatchThemeChange();
        }
    }
    
    applyTheme() {
        const theme = this.themes[this.currentTheme];
        if (!theme) return;
        
        const root = document.documentElement;
        Object.entries(theme.colors).forEach(([key, value]) => {
            root.style.setProperty(`--theme-${key}`, value);
        });
        
        document.body.setAttribute('data-theme', this.currentTheme);
    }
    
    applyBackground() {
        const background = this.backgrounds[this.currentBackground];
        if (!background) {
            console.warn('背景不存在:', this.currentBackground);
            return;
        }
        
        const messageList = document.getElementById('messageList');
        if (!messageList) {
            console.warn('找不到messageList元素，延迟应用背景');
            // 如果元素还没加载，延迟执行
            setTimeout(() => this.applyBackground(), 100);
            return;
        }
        
        
        if (background.type === 'color') {
            messageList.style.background = background.value;
            messageList.style.backgroundImage = '';
        } else if (background.type === 'gradient') {
            messageList.style.background = background.value;
            messageList.style.backgroundImage = '';
        } else if (background.type === 'pattern') {
            messageList.style.background = background.value;
            messageList.style.backgroundImage = '';
        } else if (background.type === 'doodle') {
            // 涂鸦背景：四角渐变 + 涂鸦图案
            messageList.style.background = background.gradient;
            messageList.style.backgroundImage = `url('${background.pattern}')`;
            messageList.style.backgroundBlendMode = 'soft-light';
            messageList.style.backgroundSize = 'cover, contain';
            messageList.style.backgroundRepeat = 'no-repeat, no-repeat';
            messageList.style.backgroundPosition = 'center, center';
            messageList.style.backgroundAttachment = 'fixed, fixed';
        }
        
        // 如果不是无背景，添加背景覆盖层样式
        if (this.currentBackground !== 'none') {
            if (background.type !== 'doodle') {
                messageList.style.backgroundAttachment = 'fixed';
                messageList.style.backgroundSize = 'cover';
                messageList.style.backgroundPosition = 'center';
                messageList.style.backgroundRepeat = 'no-repeat';
            }
        } else {
            messageList.style.backgroundAttachment = '';
            messageList.style.backgroundSize = '';
            messageList.style.backgroundPosition = '';
            messageList.style.backgroundRepeat = '';
            messageList.style.backgroundImage = '';
            messageList.style.backgroundBlendMode = '';
        }
    }
    
    dispatchThemeChange() {
        const event = new CustomEvent('themeChanged', {
            detail: {
                theme: this.currentTheme,
                background: this.currentBackground
            }
        });
        document.dispatchEvent(event);
    }
    
    getCurrentTheme() {
        return this.currentTheme;
    }
    
    getCurrentBackground() {
        return this.currentBackground;
    }
    
    getThemes() {
        return this.themes;
    }
    
    getBackgrounds() {
        return this.backgrounds;
    }
    
    createThemeSettingsModal() {
        const modal = document.createElement('div');
        modal.className = 'theme-settings-modal';
        modal.innerHTML = `
            <div class="theme-modal-overlay">
                <div class="theme-modal-content">
                    <div class="theme-modal-header">
                        <h3>聊天主题设置</h3>
                        <button class="theme-modal-close">&times;</button>
                    </div>
                    <div class="theme-modal-body">
                        <div class="theme-section">
                            <h4>主题颜色</h4>
                            <div class="theme-grid">
                                ${Object.entries(this.themes).map(([id, theme]) => `
                                    <div class="theme-item ${id === this.currentTheme ? 'active' : ''}" data-theme="${id}">
                                        <div class="theme-preview" style="background: ${theme.preview || theme.colors.primary}"></div>
                                        <span>${theme.name}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        <div class="theme-section">
                            <h4>聊天背景</h4>
                            <div class="background-grid">
                                ${Object.entries(this.backgrounds).map(([id, bg]) => {
                                    let previewStyle = '';
                                    if (bg.type === 'doodle') {
                                        // 涂鸦背景预览样式
                                        previewStyle = `background: ${bg.gradient}; background-image: url('${bg.pattern}'); background-size: auto, cover; background-blend-mode: multiply; background-repeat: no-repeat; background-position: center;`;
                                    } else if (bg.type === 'gradient') {
                                        previewStyle = `background: ${bg.value}`;
                                    } else if (bg.type === 'color') {
                                        previewStyle = `background: ${bg.value || 'transparent'}`;
                                    } else {
                                        previewStyle = `background: ${bg.value || 'transparent'}`;
                                    }
                                    
                                    
                                    return `
                                        <div class="background-item ${id === this.currentBackground ? 'active' : ''}" data-background="${id}">
                                            <div class="background-preview" style="${previewStyle}"></div>
                                            <span>${bg.name}</span>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        return modal;
    }
    
    showThemeSettings() {
        // 移除已存在的模态框
        const existingModal = document.querySelector('.theme-settings-modal');
        if (existingModal) {
            existingModal.remove();
        }
        
        const modal = this.createThemeSettingsModal();
        document.body.appendChild(modal);
        
        // 添加事件监听器
        this.bindThemeModalEvents(modal);
        
        // 显示模态框
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
    }
    
    bindThemeModalEvents(modal) {
        // 关闭按钮
        const closeBtn = modal.querySelector('.theme-modal-close');
        const overlay = modal.querySelector('.theme-modal-overlay');
        
        const closeModal = () => {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.remove();
            }, 300);
        };
        
        closeBtn.addEventListener('click', closeModal);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeModal();
            }
        });
        
        // 主题选择
        const themeItems = modal.querySelectorAll('.theme-item');
        themeItems.forEach(item => {
            item.addEventListener('click', () => {
                const themeId = item.dataset.theme;
                this.setTheme(themeId);
                
                // 更新选中状态
                themeItems.forEach(t => t.classList.remove('active'));
                item.classList.add('active');
            });
        });
        
        // 背景选择
        const backgroundItems = modal.querySelectorAll('.background-item');
        backgroundItems.forEach(item => {
            item.addEventListener('click', () => {
                const backgroundId = item.dataset.background;
                this.setBackground(backgroundId);
                
                // 更新选中状态
                backgroundItems.forEach(b => b.classList.remove('active'));
                item.classList.add('active');
            });
        });
    }
}

// 创建全局主题管理器实例
window.themeManager = new ThemeManager();