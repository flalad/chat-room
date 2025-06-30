// 聊天室管理器
class RoomManager {
    constructor() {
        this.currentRoom = 'default';
        this.rooms = new Map();
        this.searchResults = [];
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadDefaultRoom();
    }

    bindEvents() {
        // 创建聊天室按钮
        const createRoomBtn = document.getElementById('createRoomBtn');
        if (createRoomBtn) {
            createRoomBtn.addEventListener('click', () => this.showCreateRoomModal());
        }

        // 搜索按钮
        const searchBtn = document.getElementById('searchBtn');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => this.toggleSearchPanel());
        }

        // 更多按钮
        const moreBtn = document.getElementById('moreBtn');
        if (moreBtn) {
            moreBtn.addEventListener('click', (e) => this.toggleMoreDropdown(e));
        }

        // 关闭搜索面板
        const closeSearchBtn = document.getElementById('closeSearchBtn');
        if (closeSearchBtn) {
            closeSearchBtn.addEventListener('click', () => this.hideSearchPanel());
        }

        // 消息搜索输入
        const messageSearchInput = document.getElementById('messageSearchInput');
        if (messageSearchInput) {
            messageSearchInput.addEventListener('input', (e) => this.searchMessages(e.target.value));
        }

        // 聊天室搜索输入
        const roomSearchInput = document.getElementById('roomSearchInput');
        if (roomSearchInput) {
            roomSearchInput.addEventListener('input', (e) => this.searchRooms(e.target.value));
        }

        // 创建聊天室表单
        const createRoomForm = document.getElementById('createRoomForm');
        if (createRoomForm) {
            createRoomForm.addEventListener('submit', (e) => this.handleCreateRoom(e));
        }

        // 模态框关闭按钮
        this.bindModalEvents();

        // 更多下拉菜单项
        const roomInfoBtn = document.getElementById('roomInfoBtn');
        const leaveRoomBtn = document.getElementById('leaveRoomBtn');
        
        if (roomInfoBtn) {
            roomInfoBtn.addEventListener('click', () => this.showRoomInfo());
        }
        
        if (leaveRoomBtn) {
            leaveRoomBtn.addEventListener('click', () => this.leaveRoom());
        }

        // 点击其他地方关闭下拉菜单
        document.addEventListener('click', (e) => {
            const moreDropdown = document.getElementById('moreDropdown');
            const moreBtn = document.getElementById('moreBtn');
            if (moreDropdown && !moreBtn.contains(e.target) && !moreDropdown.contains(e.target)) {
                this.hideMoreDropdown();
            }
        });
    }

    bindModalEvents() {
        // 创建聊天室模态框
        const closeCreateRoomModal = document.getElementById('closeCreateRoomModal');
        const cancelCreateRoom = document.getElementById('cancelCreateRoom');
        const createRoomModal = document.getElementById('createRoomModal');

        if (closeCreateRoomModal) {
            closeCreateRoomModal.addEventListener('click', () => this.hideCreateRoomModal());
        }
        
        if (cancelCreateRoom) {
            cancelCreateRoom.addEventListener('click', () => this.hideCreateRoomModal());
        }

        if (createRoomModal) {
            createRoomModal.addEventListener('click', (e) => {
                if (e.target === createRoomModal) {
                    this.hideCreateRoomModal();
                }
            });
        }

        // 聊天室信息模态框
        const closeRoomInfoModal = document.getElementById('closeRoomInfoModal');
        const roomInfoModal = document.getElementById('roomInfoModal');

        if (closeRoomInfoModal) {
            closeRoomInfoModal.addEventListener('click', () => this.hideRoomInfoModal());
        }

        if (roomInfoModal) {
            roomInfoModal.addEventListener('click', (e) => {
                if (e.target === roomInfoModal) {
                    this.hideRoomInfoModal();
                }
            });
        }
    }

    loadDefaultRoom() {
        // 加载默认聊天室
        this.rooms.set('default', {
            id: 'default',
            name: '私人聊天室',
            description: '群组聊天',
            type: 'public',
            members: 0,
            messages: []
        });
    }

    // 显示创建聊天室模态框
    showCreateRoomModal() {
        const modal = document.getElementById('createRoomModal');
        if (modal) {
            modal.style.display = 'flex';
            // 清空表单
            const form = document.getElementById('createRoomForm');
            if (form) {
                form.reset();
            }
        }
    }

    // 隐藏创建聊天室模态框
    hideCreateRoomModal() {
        const modal = document.getElementById('createRoomModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    // 处理创建聊天室
    async handleCreateRoom(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const roomData = {
            name: formData.get('roomName'),
            description: formData.get('roomDescription'),
            type: formData.get('roomType')
        };

        try {
            // 这里应该调用服务器API创建聊天室
            const response = await fetch('/api/rooms/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...window.authManager.getAuthHeaders()
                },
                body: JSON.stringify(roomData)
            });

            if (response.ok) {
                const newRoom = await response.json();
                this.addRoomToList(newRoom);
                this.hideCreateRoomModal();
                this.showMessage('聊天室创建成功！', 'success');
            } else {
                const error = await response.json();
                this.showMessage(error.message || '创建聊天室失败', 'error');
            }
        } catch (error) {
            console.error('创建聊天室失败:', error);
            this.showMessage('创建聊天室失败，请重试', 'error');
        }
    }

    // 添加聊天室到列表
    addRoomToList(room) {
        this.rooms.set(room.id, room);
        
        const chatList = document.querySelector('.chat-list');
        if (chatList) {
            const roomElement = this.createRoomElement(room);
            chatList.appendChild(roomElement);
        }
    }

    // 创建聊天室元素
    createRoomElement(room) {
        const roomElement = document.createElement('div');
        roomElement.className = 'chat-item';
        roomElement.dataset.roomId = room.id;
        
        roomElement.innerHTML = `
            <div class="chat-avatar">
                <svg viewBox="0 0 24 24" width="24" height="24">
                    <path fill="currentColor" d="M12,2A2,2 0 0,1 14,4C14,4.74 13.6,5.39 13,5.73V7H14A7,7 0 0,1 21,14H22A1,1 0 0,1 23,15V18A1,1 0 0,1 22,19H21V20A2,2 0 0,1 19,22H5A2,2 0 0,1 3,20V19H2A1,1 0 0,1 1,18V15A1,1 0 0,1 2,14H3A7,7 0 0,1 10,7H11V5.73C10.4,5.39 10,4.74 10,4A2,2 0 0,1 12,2M7.5,13A2.5,2.5 0 0,0 5,15.5A2.5,2.5 0 0,0 7.5,18A2.5,2.5 0 0,0 10,15.5A2.5,2.5 0 0,0 7.5,13M16.5,13A2.5,2.5 0 0,0 14,15.5A2.5,2.5 0 0,0 16.5,18A2.5,2.5 0 0,0 19,15.5A2.5,2.5 0 0,0 16.5,13Z"/>
                </svg>
            </div>
            <div class="chat-info">
                <div class="chat-title">${room.name}</div>
                <div class="chat-subtitle">${room.description || '群组聊天'}</div>
            </div>
            <div class="chat-meta">
                <div class="chat-time">刚刚</div>
                <div class="chat-badge" style="display: none;">0</div>
            </div>
        `;

        // 添加点击事件
        roomElement.addEventListener('click', () => this.switchRoom(room.id));
        
        return roomElement;
    }

    // 切换聊天室
    switchRoom(roomId) {
        if (this.currentRoom === roomId) return;
        
        // 更新当前聊天室
        this.currentRoom = roomId;
        
        // 更新UI
        this.updateActiveRoom(roomId);
        this.updateChatHeader(roomId);
        
        // 加载聊天室消息
        this.loadRoomMessages(roomId);
        
        // 通知其他组件
        document.dispatchEvent(new CustomEvent('room:switch', {
            detail: { roomId, room: this.rooms.get(roomId) }
        }));
    }

    // 更新活跃聊天室样式
    updateActiveRoom(roomId) {
        document.querySelectorAll('.chat-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const activeRoom = document.querySelector(`[data-room-id="${roomId}"]`);
        if (activeRoom) {
            activeRoom.classList.add('active');
        }
    }

    // 更新聊天头部
    updateChatHeader(roomId) {
        const room = this.rooms.get(roomId);
        if (!room) return;
        
        const chatHeaderTitle = document.querySelector('.chat-header-title');
        const chatHeaderSubtitle = document.querySelector('.chat-header-subtitle');
        
        if (chatHeaderTitle) {
            chatHeaderTitle.textContent = room.name;
        }
        
        if (chatHeaderSubtitle) {
            chatHeaderSubtitle.innerHTML = `<span id="userCount">${room.members || 0}</span> 位成员在线`;
        }
    }

    // 加载聊天室消息
    loadRoomMessages(roomId) {
        // 这里应该从服务器加载消息
        console.log(`加载聊天室 ${roomId} 的消息`);
    }

    // 切换搜索面板
    toggleSearchPanel() {
        const searchPanel = document.getElementById('searchPanel');
        const messageList = document.getElementById('messageList');
        
        if (searchPanel && messageList) {
            const isVisible = searchPanel.style.display === 'flex';
            
            if (isVisible) {
                this.hideSearchPanel();
            } else {
                this.showSearchPanel();
            }
        }
    }

    // 显示搜索面板
    showSearchPanel() {
        const searchPanel = document.getElementById('searchPanel');
        const messageList = document.getElementById('messageList');
        const messageSearchInput = document.getElementById('messageSearchInput');
        
        if (searchPanel && messageList) {
            searchPanel.style.display = 'flex';
            messageList.style.display = 'none';
            
            // 聚焦搜索输入框
            if (messageSearchInput) {
                setTimeout(() => messageSearchInput.focus(), 100);
            }
        }
    }

    // 隐藏搜索面板
    hideSearchPanel() {
        const searchPanel = document.getElementById('searchPanel');
        const messageList = document.getElementById('messageList');
        const messageSearchInput = document.getElementById('messageSearchInput');
        
        if (searchPanel && messageList) {
            searchPanel.style.display = 'none';
            messageList.style.display = 'flex';
            
            // 清空搜索
            if (messageSearchInput) {
                messageSearchInput.value = '';
            }
            this.clearSearchResults();
        }
    }

    // 搜索消息
    searchMessages(query) {
        if (!query.trim()) {
            this.clearSearchResults();
            return;
        }

        // 这里应该调用服务器API搜索消息
        // 暂时使用模拟数据
        const mockResults = [
            {
                id: 1,
                content: `包含"${query}"的消息内容示例`,
                username: '用户1',
                timestamp: new Date().toISOString()
            },
            {
                id: 2,
                content: `另一条包含"${query}"的消息`,
                username: '用户2',
                timestamp: new Date(Date.now() - 3600000).toISOString()
            }
        ];

        this.displaySearchResults(mockResults);
    }

    // 显示搜索结果
    displaySearchResults(results) {
        const searchResults = document.getElementById('searchResults');
        if (!searchResults) return;

        if (results.length === 0) {
            searchResults.innerHTML = '<div class="search-placeholder">未找到相关消息</div>';
            return;
        }

        const resultsHTML = results.map(result => `
            <div class="search-result-item" data-message-id="${result.id}">
                <div class="search-result-content">${this.highlightSearchTerm(result.content)}</div>
                <div class="search-result-meta">
                    <span>${result.username}</span>
                    <span>${this.formatTime(result.timestamp)}</span>
                </div>
            </div>
        `).join('');

        searchResults.innerHTML = resultsHTML;

        // 绑定点击事件
        searchResults.querySelectorAll('.search-result-item').forEach(item => {
            item.addEventListener('click', () => {
                const messageId = item.dataset.messageId;
                this.jumpToMessage(messageId);
            });
        });
    }

    // 高亮搜索词
    highlightSearchTerm(content) {
        const searchInput = document.getElementById('messageSearchInput');
        if (!searchInput || !searchInput.value.trim()) return content;
        
        const query = searchInput.value.trim();
        const regex = new RegExp(`(${query})`, 'gi');
        return content.replace(regex, '<mark>$1</mark>');
    }

    // 跳转到消息
    jumpToMessage(messageId) {
        console.log(`跳转到消息 ${messageId}`);
        this.hideSearchPanel();
        // 这里应该滚动到对应消息并高亮
    }

    // 清空搜索结果
    clearSearchResults() {
        const searchResults = document.getElementById('searchResults');
        if (searchResults) {
            searchResults.innerHTML = '<div class="search-placeholder">输入关键词搜索消息</div>';
        }
    }

    // 搜索聊天室
    searchRooms(query) {
        const chatItems = document.querySelectorAll('.chat-item');
        
        chatItems.forEach(item => {
            const title = item.querySelector('.chat-title')?.textContent || '';
            const subtitle = item.querySelector('.chat-subtitle')?.textContent || '';
            
            const matches = title.toLowerCase().includes(query.toLowerCase()) ||
                           subtitle.toLowerCase().includes(query.toLowerCase());
            
            item.style.display = matches ? 'flex' : 'none';
        });
    }

    // 切换更多下拉菜单
    toggleMoreDropdown(e) {
        e.stopPropagation();
        const dropdown = document.getElementById('moreDropdown');
        if (dropdown) {
            const isVisible = dropdown.style.display === 'block';
            dropdown.style.display = isVisible ? 'none' : 'block';
        }
    }

    // 隐藏更多下拉菜单
    hideMoreDropdown() {
        const dropdown = document.getElementById('moreDropdown');
        if (dropdown) {
            dropdown.style.display = 'none';
        }
    }

    // 显示聊天室信息
    showRoomInfo() {
        this.hideMoreDropdown();
        
        const room = this.rooms.get(this.currentRoom);
        if (!room) return;

        const modal = document.getElementById('roomInfoModal');
        const content = document.getElementById('roomInfoContent');
        
        if (modal && content) {
            content.innerHTML = `
                <div class="room-info-section">
                    <h4>基本信息</h4>
                    <div class="info-item">
                        <label>聊天室名称:</label>
                        <span>${room.name}</span>
                    </div>
                    <div class="info-item">
                        <label>聊天室描述:</label>
                        <span>${room.description || '无'}</span>
                    </div>
                    <div class="info-item">
                        <label>聊天室类型:</label>
                        <span>${room.type === 'public' ? '公开' : '私人'}</span>
                    </div>
                    <div class="info-item">
                        <label>成员数量:</label>
                        <span>${room.members || 0} 人</span>
                    </div>
                    <div class="info-item">
                        <label>创建时间:</label>
                        <span>${room.createdAt ? this.formatTime(room.createdAt) : '未知'}</span>
                    </div>
                </div>
            `;
            
            modal.style.display = 'flex';
        }
    }

    // 隐藏聊天室信息模态框
    hideRoomInfoModal() {
        const modal = document.getElementById('roomInfoModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    // 离开聊天室
    leaveRoom() {
        this.hideMoreDropdown();
        
        if (this.currentRoom === 'default') {
            this.showMessage('无法离开默认聊天室', 'error');
            return;
        }

        if (confirm('确定要离开这个聊天室吗？')) {
            // 这里应该调用服务器API
            console.log(`离开聊天室 ${this.currentRoom}`);
            
            // 移除聊天室
            this.rooms.delete(this.currentRoom);
            
            // 移除UI元素
            const roomElement = document.querySelector(`[data-room-id="${this.currentRoom}"]`);
            if (roomElement) {
                roomElement.remove();
            }
            
            // 切换到默认聊天室
            this.switchRoom('default');
            
            this.showMessage('已离开聊天室', 'success');
        }
    }

    // 格式化时间
    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) { // 1分钟内
            return '刚刚';
        } else if (diff < 3600000) { // 1小时内
            return `${Math.floor(diff / 60000)}分钟前`;
        } else if (diff < 86400000) { // 1天内
            return `${Math.floor(diff / 3600000)}小时前`;
        } else {
            return date.toLocaleDateString('zh-CN');
        }
    }

    // 显示消息
    showMessage(message, type = 'info') {
        // 创建消息提示
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#2196f3'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            font-size: 14px;
            font-weight: 500;
            animation: slideInRight 0.3s ease-out;
        `;

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

    // 获取当前聊天室
    getCurrentRoom() {
        return this.rooms.get(this.currentRoom);
    }

    // 获取当前聊天室ID
    getCurrentRoomId() {
        return this.currentRoom;
    }
}

// 创建全局实例
window.roomManager = new RoomManager();