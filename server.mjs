import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import crypto from 'crypto';
import fetch from 'node-fetch';
import cookieParser from 'cookie-parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Google OAuth 配置
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  console.error('[Error] Google OAuth credentials not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.');
  process.exit(1);
}
const REDIRECT_URI = process.env.REDIRECT_URI || (process.env.NODE_ENV === 'production' ? 'https://basic-crm-offline.up.railway.app/api/auth/google/callback' : 'http://localhost:3000/api/auth/google/callback');

// 中間件
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'client/dist')));

// 簡單的內存會話存儲（生產環境應使用數據庫）
const sessions = new Map();

// API 路由
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 客戶數據（內存存儲）
let customers = [
  { id: 1, name: '台灣科技公司', email: 'contact@techcorp.tw', phone: '02-1234-5678', company: 'TechCorp Taiwan', status: 'active' },
  { id: 2, name: '創意設計工作室', email: 'info@creative.tw', phone: '02-2345-6789', company: 'Creative Studio', status: 'active' },
  { id: 3, name: '綠色環保公司', email: 'hello@greeneco.tw', phone: '02-3456-7890', company: 'Green Eco', status: 'active' },
  { id: 4, name: '王小明', email: 'wang@example.com', phone: '09-1234-5678', company: '個人', status: 'pending' },
  { id: 5, name: '李美麗', email: 'lee@example.com', phone: '09-2345-6789', company: '個人', status: 'active' }
];

let nextId = 6;

// 用戶數據（內存存儲）
const users = new Map();

// Google OAuth 登錄路由
app.get('/api/auth/google/login', (req, res) => {
  const state = crypto.randomBytes(32).toString('hex');
  const scope = 'openid profile email';
  
  // 存儲 state 用於驗證
  sessions.set(state, { createdAt: Date.now() });
  
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${GOOGLE_CLIENT_ID}&` +
    `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
    `response_type=code&` +
    `scope=${encodeURIComponent(scope)}&` +
    `state=${state}`;
  
  res.redirect(authUrl);
});

// Google OAuth 回調路由
app.get('/api/auth/google/callback', async (req, res) => {
  const { code, state } = req.query;
  
  if (!code || !state) {
    return res.status(400).json({ error: '缺少授權碼或狀態' });
  }
  
  // 驗證 state
  if (!sessions.has(state)) {
    return res.status(400).json({ error: '無效的狀態參數' });
  }
  
  sessions.delete(state);
  
  try {
    // 交換授權碼以獲取 token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: REDIRECT_URI
      })
    });
    
    const tokenData = await tokenResponse.json();
    
    if (!tokenData.access_token) {
      return res.status(400).json({ error: '無法獲取訪問令牌' });
    }
    
    // 獲取用戶信息
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
    });
    
    const userData = await userResponse.json();
    
    if (!userData.id) {
      return res.status(400).json({ error: '無法獲取用戶信息' });
    }
    
    // 創建或更新用戶
    let user = users.get(userData.id);
    if (!user) {
      user = {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        picture: userData.picture,
        createdAt: new Date()
      };
      users.set(userData.id, user);
    } else {
      user.email = userData.email;
      user.name = userData.name;
      user.picture = userData.picture;
    }
    
    // 創建會話
    const sessionId = crypto.randomBytes(32).toString('hex');
    sessions.set(sessionId, {
      userId: userData.id,
      user,
      createdAt: Date.now()
    });
    
    // 設置 cookie 並重定向到儀表板
    res.cookie('sessionId', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 天
    });
    
    res.redirect('/');
  } catch (error) {
    console.error('Google OAuth 錯誤:', error);
    res.status(500).json({ error: '認證失敗' });
  }
});

// 獲取當前用戶
app.get('/api/auth/me', (req, res) => {
  const sessionId = req.cookies?.sessionId;
  
  if (!sessionId || !sessions.has(sessionId)) {
    return res.json({ user: null });
  }
  
  const session = sessions.get(sessionId);
  res.json({ user: session.user });
});

// 登出
app.post('/api/auth/logout', (req, res) => {
  const sessionId = req.cookies?.sessionId;
  
  if (sessionId) {
    sessions.delete(sessionId);
  }
  
  res.clearCookie('sessionId');
  res.json({ success: true });
});

// 客戶 API
app.get('/api/customers', (req, res) => {
  res.json(customers);
});

app.get('/api/customers/:id', (req, res) => {
  const customer = customers.find(c => c.id === parseInt(req.params.id));
  if (!customer) {
    return res.status(404).json({ error: '客戶不存在' });
  }
  res.json(customer);
});

app.post('/api/customers', (req, res) => {
  const { name, email, phone, company, status } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: '名稱為必填' });
  }
  
  const newCustomer = {
    id: nextId++,
    name,
    email: email || '',
    phone: phone || '',
    company: company || '',
    status: status || 'pending'
  };
  
  customers.push(newCustomer);
  res.status(201).json(newCustomer);
});

app.put('/api/customers/:id', (req, res) => {
  const customer = customers.find(c => c.id === parseInt(req.params.id));
  if (!customer) {
    return res.status(404).json({ error: '客戶不存在' });
  }
  
  const { name, email, phone, company, status } = req.body;
  if (name) customer.name = name;
  if (email !== undefined) customer.email = email;
  if (phone !== undefined) customer.phone = phone;
  if (company !== undefined) customer.company = company;
  if (status !== undefined) customer.status = status;
  
  res.json(customer);
});

app.delete('/api/customers/:id', (req, res) => {
  const index = customers.findIndex(c => c.id === parseInt(req.params.id));
  if (index === -1) {
    return res.status(404).json({ error: '客戶不存在' });
  }
  
  const deleted = customers.splice(index, 1);
  res.json(deleted[0]);
});

// 儀表板統計
app.get('/api/stats', (req, res) => {
  const total = customers.length;
  const active = customers.filter(c => c.status === 'active').length;
  const withPhone = customers.filter(c => c.phone).length;
  
  res.json({
    total,
    active,
    withPhone,
    growth: '+12%'
  });
});

// SPA 路由 - 返回 index.html
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'client/dist/index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(404).send('<!DOCTYPE html><html><body><h1>404 - Page Not Found</h1></body></html>');
    }
  });
});

// 建立 HTTP 伺服器
const server = http.createServer(app);

// 錯誤處理
server.on('error', (err) => {
  console.error('[Server Error]', err);
});

process.on('uncaughtException', (err) => {
  console.error('[Uncaught Exception]', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Unhandled Rejection]', reason);
});

// 啟動伺服器
server.listen(PORT, '0.0.0.0', () => {
  console.log(`[Server] ✓ Running on http://0.0.0.0:${PORT}`);
  console.log(`[Server] ✓ API available at http://0.0.0.0:${PORT}/api/health`);
  console.log(`[Server] ✓ Google OAuth configured`);
  console.log(`[Server] ✓ Process ID: ${process.pid}`);
});

// 優雅關閉
process.on('SIGTERM', () => {
  console.log('[Server] Shutting down gracefully...');
  server.close(() => {
    console.log('[Server] Server closed');
    process.exit(0);
  });
});
