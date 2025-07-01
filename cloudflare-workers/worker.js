/**
 * Cloudflare Workers 聊天室后端
 * 完整的API实现，支持认证、消息、文件上传等功能
 * 
 * 使用方法：
 * 1. 复制此文件内容到Cloudflare Workers编辑器
 * 2. 配置环境变量和数据库绑定
 * 3. 部署Worker
 */

// 导入必要的库（在Workers环境中可用）
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { jwt } from 'hono/jwt'
import { upgradeWebSocket } from 'hono/cloudflare-workers'

// 创建Hono应用实例
const app = new Hono()

// CORS配置
app.use('*', cors({
  origin: ['http://localhost:3000', 'https://*.pages.dev', 'https://*.workers.dev'],
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
}))

// 全局变量
let connectedClients = new Map()
let messageHistory = []

// ==================== 工具函数 ====================

/**
 * 生成UUID
 */
function generateUUID() {
  return crypto.randomUUID()
}

/**
 * 哈希密码
 */
async function hashPassword(password) {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * 验证密码
 */
async function verifyPassword(password, hash) {
  const hashedInput = await hashPassword(password)
  return hashedInput === hash
}

/**
 * 生成JWT Token
 */
async function generateJWT(payload, secret) {
  const header = { alg: 'HS256', typ: 'JWT' }
  const encodedHeader = btoa(JSON.stringify(header))
  const encodedPayload = btoa(JSON.stringify(payload))
  
  const data = `${encodedHeader}.${encodedPayload}`
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data))
  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
  
  return `${data}.${encodedSignature}`
}

/**
 * 验证JWT Token
 */
async function verifyJWT(token, secret) {
  try {
    const [header, payload, signature] = token.split('.')
    const data = `${header}.${payload}`
    
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    )
    
    const signatureBuffer = Uint8Array.from(
      atob(signature.replace(/-/g, '+').replace(/_/g, '/')), 
      c => c.charCodeAt(0)
    )
    
    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      signatureBuffer,
      encoder.encode(data)
    )
    
    if (isValid) {
      return JSON.parse(atob(payload))
    }
    return null
  } catch (error) {
    return null
  }
}

/**
 * 广播消息给所有连接的客户端
 */
function broadcastMessage(message, excludeClientId = null) {
  connectedClients.forEach((client, clientId) => {
    if (clientId !== excludeClientId && client.webSocket.readyState === WebSocket.READY_STATE_OPEN) {
      try {
        client.webSocket.send(JSON.stringify(message))
      } catch (error) {
        console.error('发送消息失败:', error)
        connectedClients.delete(clientId)
      }
    }
  })
}

// ==================== 数据库操作 ====================

/**
 * 获取用户
 */
async function getUser(env, username) {
  if (!env.DB) return null
  
  try {
    const result = await env.DB.prepare(
      'SELECT * FROM users WHERE username = ?'
    ).bind(username).first()
    
    return result
  } catch (error) {
    console.error('获取用户失败:', error)
    return null
  }
}

/**
 * 创建用户
 */
async function createUser(env, username, password) {
  if (!env.DB) throw new Error('数据库未配置')
  
  const hashedPassword = await hashPassword(password)
  const userId = generateUUID()
  
  try {
    await env.DB.prepare(
      'INSERT INTO users (id, username, password_hash, created_at) VALUES (?, ?, ?, ?)'
    ).bind(userId, username, hashedPassword, new Date().toISOString()).run()
    
    return { id: userId, username, created_at: new Date().toISOString() }
  } catch (error) {
    console.error('创建用户失败:', error)
    throw new Error('用户创建失败')
  }
}

/**
 * 保存消息
 */
async function saveMessage(env, message) {
  if (!env.DB) {
    // 如果没有数据库，保存到内存
    messageHistory.push(message)
    if (messageHistory.length > 100) {
      messageHistory = messageHistory.slice(-100)
    }
    return
  }
  
  try {
    await env.DB.prepare(
      'INSERT INTO messages (id, type, username, content, timestamp, file_data) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(
      message.id,
      message.type || 'text',
      message.username,
      message.content || '',
      message.timestamp,
      message.file ? JSON.stringify(message.file) : null
    ).run()
  } catch (error) {
    console.error('保存消息失败:', error)
  }
}

/**
 * 获取消息历史
 */
async function getMessageHistory(env, limit = 100) {
  if (!env.DB) {
    return messageHistory.slice(-limit)
  }
  
  try {
    const result = await env.DB.prepare(
      'SELECT * FROM messages ORDER BY timestamp DESC LIMIT ?'
    ).bind(limit).all()
    
    return result.results.reverse().map(msg => ({
      id: msg.id,
      type: msg.type,
      username: msg.username,
      content: msg.content,
      timestamp: msg.timestamp,
      file: msg.file_data ? JSON.parse(msg.file_data) : null
    }))
  } catch (error) {
    console.error('获取消息历史失败:', error)
    return []
  }
}

// ==================== API路由 ====================

// 健康检查
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// 调试信息
app.get('/api/debug/info', (c) => {
  return c.json({
    environment: 'cloudflare-workers',
    hasDatabase: !!c.env.DB,
    hasKV: !!c.env.CACHE,
    connectedClients: connectedClients.size,
    messageHistory: messageHistory.length
  })
})

// 用户注册
app.post('/api/auth/register', async (c) => {
  try {
    const { username, password } = await c.req.json()
    
    if (!username || !password) {
      return c.json({ message: '用户名和密码不能为空' }, 400)
    }
    
    if (username.length < 3 || username.length > 20) {
      return c.json({ message: '用户名长度必须在3-20个字符之间' }, 400)
    }
    
    if (password.length < 6) {
      return c.json({ message: '密码长度至少6个字符' }, 400)
    }
    
    // 检查用户是否已存在
    const existingUser = await getUser(c.env, username)
    if (existingUser) {
      return c.json({ message: '用户名已存在' }, 400)
    }
    
    // 创建用户
    const user = await createUser(c.env, username, password)
    
    return c.json({
      message: '注册成功',
      user: { username: user.username, createdAt: user.created_at }
    })
  } catch (error) {
    console.error('注册错误:', error)
    return c.json({ message: '服务器内部错误' }, 500)
  }
})

// 用户登录
app.post('/api/auth/login', async (c) => {
  try {
    const { username, password } = await c.req.json()
    
    if (!username || !password) {
      return c.json({ message: '用户名和密码不能为空' }, 400)
    }
    
    // 查找用户
    const user = await getUser(c.env, username)
    if (!user) {
      return c.json({ message: '用户名或密码错误' }, 401)
    }
    
    // 验证密码
    const isValidPassword = await verifyPassword(password, user.password_hash)
    if (!isValidPassword) {
      return c.json({ message: '用户名或密码错误' }, 401)
    }
    
    // 生成JWT令牌
    const token = await generateJWT(
      { username: user.username, exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) },
      c.env.JWT_SECRET || 'default-secret'
    )
    
    return c.json({
      message: '登录成功',
      token,
      user: { username: user.username, createdAt: user.created_at }
    })
  } catch (error) {
    console.error('登录错误:', error)
    return c.json({ message: '服务器内部错误' }, 500)
  }
})

// 验证Token
app.get('/api/auth/verify', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ message: '访问令牌缺失' }, 401)
    }
    
    const token = authHeader.substring(7)
    const payload = await verifyJWT(token, c.env.JWT_SECRET || 'default-secret')
    
    if (!payload) {
      return c.json({ message: '访问令牌无效' }, 403)
    }
    
    return c.json({
      valid: true,
      user: { username: payload.username }
    })
  } catch (error) {
    return c.json({ message: '访问令牌无效' }, 403)
  }
})

// 获取消息历史
app.get('/api/messages/history', async (c) => {
  try {
    const limit = parseInt(c.req.query('limit')) || 100
    const messages = await getMessageHistory(c.env, limit)
    
    return c.json({
      success: true,
      messages,
      count: messages.length
    })
  } catch (error) {
    console.error('获取消息历史失败:', error)
    return c.json({ message: '获取消息历史失败' }, 500)
  }
})

// 发送消息
app.post('/api/messages/send', async (c) => {
  try {
    const { content, type = 'text', file, username } = await c.req.json()
    
    let actualUsername = username || '匿名用户'
    
    // 尝试从token获取用户名
    const authHeader = c.req.header('Authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      const payload = await verifyJWT(token, c.env.JWT_SECRET || 'default-secret')
      if (payload) {
        actualUsername = payload.username
      }
    }
    
    if (type === 'file') {
      if (!file || !file.url || !file.fileName) {
        return c.json({ message: '文件信息不完整' }, 400)
      }
      
      const message = {
        id: generateUUID(),
        type: 'file',
        username: actualUsername,
        content: content || `[文件] ${file.fileName}`,
        timestamp: new Date().toISOString(),
        file: file
      }
      
      await saveMessage(c.env, message)
      broadcastMessage({ type: 'new_message', message })
      
      return c.json({
        success: true,
        message: '文件消息发送成功',
        data: message
      })
    } else {
      if (!content || content.trim().length === 0) {
        return c.json({ message: '消息内容不能为空' }, 400)
      }
      
      if (content.length > 1000) {
        return c.json({ message: '消息长度不能超过1000个字符' }, 400)
      }
      
      const message = {
        id: generateUUID(),
        type: type,
        username: actualUsername,
        content: content.trim(),
        timestamp: new Date().toISOString()
      }
      
      await saveMessage(c.env, message)
      broadcastMessage({ type: 'new_message', message })
      
      return c.json({
        success: true,
        message: '消息发送成功',
        data: message
      })
    }
  } catch (error) {
    console.error('发送消息失败:', error)
    return c.json({ message: '发送消息失败' }, 500)
  }
})

// 获取在线用户
app.get('/api/users/online', (c) => {
  try {
    const onlineUsers = Array.from(connectedClients.values()).map(client => ({
      username: client.username,
      joinTime: client.joinTime
    }))
    
    return c.json({
      success: true,
      users: onlineUsers,
      count: onlineUsers.length
    })
  } catch (error) {
    console.error('获取在线用户失败:', error)
    return c.json({ message: '获取在线用户失败' }, 500)
  }
})

// 文件上传到数据库
app.post('/api/files/upload-to-db', async (c) => {
  try {
    const { fileName, fileType, fileData, username = '匿名用户' } = await c.req.json()
    
    console.log('数据库文件上传请求:', { fileName, fileType, username, dataSize: fileData ? fileData.length : 0 })
    
    // 尝试从认证头获取用户名
    let actualUsername = username
    const authHeader = c.req.header('Authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      const payload = await verifyJWT(token, c.env.JWT_SECRET || 'default-secret')
      if (payload) {
        actualUsername = payload.username
      }
    }
    
    // 验证文件大小（5MB限制）
    const maxSize = 5 * 1024 * 1024 // 5MB
    const fileBuffer = Uint8Array.from(atob(fileData), c => c.charCodeAt(0))
    
    if (fileBuffer.length > maxSize) {
      return c.json({
        message: `文件太大，数据库存储限制为5MB，当前文件大小：${Math.round(fileBuffer.length / (1024 * 1024))}MB`
      }, 413)
    }
    
    // 生成文件ID
    const fileId = generateUUID()
    
    // 如果有KV存储，保存文件
    if (c.env.CACHE) {
      await c.env.CACHE.put(`file:${fileId}`, fileData, {
        metadata: {
          originalName: fileName,
          mimeType: fileType,
          size: fileBuffer.length,
          uploader: actualUsername,
          uploadTime: new Date().toISOString()
        }
      })
    }
    
    // 生成访问URL
    const fileUrl = `/api/files/db/${fileId}`
    
    return c.json({
      success: true,
      fileId: fileId,
      fileUrl: fileUrl,
      fileName: fileName,
      size: fileBuffer.length,
      message: '文件已保存到数据库'
    })
  } catch (error) {
    console.error('保存文件到数据库失败:', error)
    return c.json({ message: '文件保存失败' }, 500)
  }
})

// 从数据库获取文件
app.get('/api/files/db/:fileId', async (c) => {
  try {
    const fileId = c.req.param('fileId')
    
    if (!c.env.CACHE) {
      return c.json({ message: '文件存储未配置' }, 404)
    }
    
    const fileData = await c.env.CACHE.get(`file:${fileId}`, { type: 'text' })
    const metadata = await c.env.CACHE.get(`file:${fileId}`, { type: 'json' })
    
    if (!fileData || !metadata) {
      return c.json({ message: '文件不存在' }, 404)
    }
    
    // 转换base64为二进制
    const binaryData = Uint8Array.from(atob(fileData), c => c.charCodeAt(0))
    
    return new Response(binaryData, {
      headers: {
        'Content-Type': metadata.mimeType || 'application/octet-stream',
        'Content-Length': metadata.size.toString(),
        'Content-Disposition': `inline; filename="${encodeURIComponent(metadata.originalName)}"`,
        'Cache-Control': 'public, max-age=31536000'
      }
    })
  } catch (error) {
    console.error('获取数据库文件失败:', error)
    return c.json({ message: '文件获取失败' }, 500)
  }
})

// ==================== WebSocket处理 ====================

// WebSocket升级处理
app.get('/ws', upgradeWebSocket((c) => {
  return {
    onOpen(event, ws) {
      const clientId = generateUUID()
      connectedClients.set(clientId, {
        webSocket: ws,
        username: null,
        joinTime: new Date().toISOString(),
        clientId: clientId
      })
      
      console.log(`WebSocket客户端连接: ${clientId}`)
    },
    
    onMessage(event, ws) {
      try {
        const data = JSON.parse(event.data)
        handleWebSocketMessage(ws, data, c.env)
      } catch (error) {
        console.error('WebSocket消息处理错误:', error)
      }
    },
    
    onClose(event, ws) {
      // 找到并移除断开连接的客户端
      for (const [clientId, client] of connectedClients.entries()) {
        if (client.webSocket === ws) {
          if (client.username) {
            // 广播用户离开消息
            const leaveMessage = {
              id: generateUUID(),
              type: 'system',
              content: `${client.username} 离开了聊天室`,
              timestamp: new Date().toISOString()
            }
            
            broadcastMessage({ type: 'new_message', message: leaveMessage }, clientId)
            broadcastUserUpdate(clientId)
          }
          
          connectedClients.delete(clientId)
          console.log(`WebSocket客户端断开: ${clientId}`)
          break
        }
      }
    },
    
    onError(event, ws) {
      console.error('WebSocket错误:', event)
    }
  }
}))

/**
 * 处理WebSocket消息
 */
async function handleWebSocketMessage(ws, data, env) {
  // 找到发送消息的客户端
  let clientId = null
  let client = null
  
  for (const [id, c] of connectedClients.entries()) {
    if (c.webSocket === ws) {
      clientId = id
      client = c
      break
    }
  }
  
  if (!client) return
  
  switch (data.type) {
    case 'user_join':
      await handleUserJoin(clientId, client, data.user, env)
      break
      
    case 'send_message':
      await handleSendMessage(clientId, client, data, env)
      break
      
    case 'file_message':
      await handleFileMessage(clientId, client, data, env)
      break
      
    case 'typing_start':
      handleTypingStart(clientId, client)
      break
      
    case 'typing_stop':
      handleTypingStop(clientId, client)
      break
  }
}

/**
 * 处理用户加入
 */
async function handleUserJoin(clientId, client, userData, env) {
  client.username = userData.username
  
  // 发送历史消息
  const messages = await getMessageHistory(env, 100)
  client.webSocket.send(JSON.stringify({
    type: 'message_history',
    messages
  }))
  
  // 广播用户列表更新
  broadcastUserUpdate()
  
  // 广播用户加入消息
  const joinMessage = {
    id: generateUUID(),
    type: 'system',
    content: `${userData.username} 加入了聊天室`,
    timestamp: new Date().toISOString()
  }
  
  await saveMessage(env, joinMessage)
  broadcastMessage({ type: 'new_message', message: joinMessage }, clientId)
}

/**
 * 处理发送消息
 */
async function handleSendMessage(clientId, client, data, env) {
  if (!client.username || !data.content) return
  
  const message = {
    id: generateUUID(),
    type: 'text',
    username: client.username,
    content: data.content,
    timestamp: new Date().toISOString()
  }
  
  await saveMessage(env, message)
  broadcastMessage({ type: 'new_message', message })
}

/**
 * 处理文件消息
 */
async function handleFileMessage(clientId, client, data, env) {
  if (!client.username || !data.file) return
  
  const message = {
    id: generateUUID(),
    type: 'file',
    username: client.username,
    file: data.file,
    timestamp: new Date().toISOString()
  }
  
  await saveMessage(env, message)
  broadcastMessage({ type: 'new_message', message })
}

/**
 * 处理开始输入
 */
function handleTypingStart(clientId, client) {
  if (!client.username) return
  
  broadcastMessage({
    type: 'user_typing',
    username: client.username,
    typing: true
  }, clientId)
}

/**
 * 处理停止输入
 */
function handleTypingStop(clientId, client) {
  if (!client.username) return
  
  broadcastMessage({
    type: 'user_typing',
    username: client.username,
    typing: false
  }, clientId)
}

/**
 * 广播用户列表更新
 */
function broadcastUserUpdate(excludeClientId = null) {
  const users = Array.from(connectedClients.values())
    .filter(client => client.username)
    .map(client => ({
      username: client.username,
      joinTime: client.joinTime
    }))
  
  broadcastMessage({
    type: 'users_update',
    users
  }, excludeClientId)
}

// ==================== 导出 ====================

export default {
  async fetch(request, env, ctx) {
    return app.fetch(request, env, ctx)
  }
}