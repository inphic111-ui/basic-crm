import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// 中間件
app.use(express.json());
app.use(express.static(path.join(__dirname, 'client/dist')));

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
