import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import crypto from 'crypto';
import fetch from 'node-fetch';
import cookieParser from 'cookie-parser';
import pkg from 'pg';
const { Pool } = pkg;

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

// PostgreSQL 連接池
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// 初始化數據庫
async function initializeDatabase() {
  try {
    const client = await pool.connect();
    
    // 創建 users 表
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        picture TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // 創建 customers 表
    await client.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(20),
        company VARCHAR(255),
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // 檢查是否已有初始數據
    const result = await client.query('SELECT COUNT(*) FROM customers');
    if (parseInt(result.rows[0].count) === 0) {
      // 插入初始客戶數據
      const initialCustomers = [
        { name: '台灣科技公司', email: 'contact@techcorp.tw', phone: '02-1234-5678', company: 'TechCorp Taiwan', status: 'active' },
        { name: '創意設計工作室', email: 'info@creative.tw', phone: '02-2345-6789', company: 'Creative Studio', status: 'active' },
        { name: '綠色環保公司', email: 'hello@greeneco.tw', phone: '02-3456-7890', company: 'Green Eco', status: 'active' },
        { name: '王小明', email: 'wang@example.com', phone: '09-1234-5678', company: '個人', status: 'pending' },
        { name: '李美麗', email: 'lee@example.com', phone: '09-2345-6789', company: '個人', status: 'active' }
      ];
      
      for (const customer of initialCustomers) {
        await client.query(
          'INSERT INTO customers (name, email, phone, company, status) VALUES ($1, $2, $3, $4, $5)',
          [customer.name, customer.email, customer.phone, customer.company, customer.status]
        );
      }
      console.log('[Database] ✓ Initial customer data inserted');
    }
    
    client.release();
    console.log('[Database] ✓ Connected and initialized');
  } catch (error) {
    console.error('[Database Error]', error);
    process.exit(1);
  }
}

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
    
    // 在數據庫中創建或更新用戶
    const client = await pool.connect();
    try {
      const existingUser = await client.query(
        'SELECT * FROM users WHERE id = $1',
        [userData.id]
      );
      
      let user;
      if (existingUser.rows.length === 0) {
        const result = await client.query(
          'INSERT INTO users (id, email, name, picture) VALUES ($1, $2, $3, $4) RETURNING *',
          [userData.id, userData.email, userData.name, userData.picture]
        );
        user = result.rows[0];
      } else {
        const result = await client.query(
          'UPDATE users SET email = $1, name = $2, picture = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING *',
          [userData.email, userData.name, userData.picture, userData.id]
        );
        user = result.rows[0];
      }
      
      // 創建會話
      const sessionId = crypto.randomBytes(32).toString('hex');
      sessions.set(sessionId, {
        userId: userData.id,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          picture: user.picture
        },
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
    } finally {
      client.release();
    }
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
app.get('/api/customers', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM customers ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: '無法獲取客戶列表' });
  }
});

app.get('/api/customers/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM customers WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: '客戶不存在' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: '無法獲取客戶' });
  }
});

app.post('/api/customers', async (req, res) => {
  const { name, email, phone, company, status } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: '名稱為必填' });
  }
  
  try {
    const result = await pool.query(
      'INSERT INTO customers (name, email, phone, company, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, email || '', phone || '', company || '', status || 'pending']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: '無法創建客戶' });
  }
});

app.put('/api/customers/:id', async (req, res) => {
  const { name, email, phone, company, status } = req.body;
  
  try {
    const result = await pool.query(
      'UPDATE customers SET name = COALESCE($1, name), email = COALESCE($2, email), phone = COALESCE($3, phone), company = COALESCE($4, company), status = COALESCE($5, status), updated_at = CURRENT_TIMESTAMP WHERE id = $6 RETURNING *',
      [name, email, phone, company, status, req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: '客戶不存在' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: '無法更新客戶' });
  }
});

app.delete('/api/customers/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM customers WHERE id = $1 RETURNING *', [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: '客戶不存在' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: '無法刪除客戶' });
  }
});

// 儀表板統計
app.get('/api/stats', async (req, res) => {
  try {
    const totalResult = await pool.query('SELECT COUNT(*) FROM customers');
    const activeResult = await pool.query("SELECT COUNT(*) FROM customers WHERE status = 'active'");
    const phoneResult = await pool.query('SELECT COUNT(*) FROM customers WHERE phone IS NOT NULL AND phone != \'\'');
    
    const total = parseInt(totalResult.rows[0].count);
    const active = parseInt(activeResult.rows[0].count);
    const withPhone = parseInt(phoneResult.rows[0].count);
    
    res.json({
      total,
      active,
      withPhone,
      growth: '+12%'
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: '無法獲取統計信息' });
  }
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
async function startServer() {
  try {
    await initializeDatabase();
    
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`[Server] ✓ Running on http://0.0.0.0:${PORT}`);
      console.log(`[Server] ✓ API available at http://0.0.0.0:${PORT}/api/health`);
      console.log(`[Server] ✓ Google OAuth configured`);
      console.log(`[Server] ✓ PostgreSQL database connected`);
      console.log(`[Server] ✓ Process ID: ${process.pid}`);
    });
  } catch (error) {
    console.error('[Startup Error]', error);
    process.exit(1);
  }
}

startServer();

// 優雅關閉
process.on('SIGTERM', () => {
  console.log('[Server] Shutting down gracefully...');
  server.close(() => {
    console.log('[Server] Server closed');
    pool.end(() => {
      console.log('[Database] Connection pool closed');
      process.exit(0);
    });
  });
});
