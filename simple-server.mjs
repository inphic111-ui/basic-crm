import express from 'express';

const app = express();
const PORT = 3000;

app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CRM 系統</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
      min-height: 100vh; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
    }
    .container { 
      background: white; 
      border-radius: 12px; 
      box-shadow: 0 20px 60px rgba(0,0,0,0.3); 
      padding: 40px; 
      max-width: 600px; 
      text-align: center; 
    }
    h1 { color: #333; margin-bottom: 20px; font-size: 32px; }
    p { color: #666; margin-bottom: 20px; line-height: 1.6; }
    .status { 
      background: #f0f9ff; 
      border-left: 4px solid #3b82f6; 
      padding: 15px; 
      margin: 20px 0; 
      text-align: left; 
      border-radius: 4px; 
    }
    .status-item { 
      margin: 8px 0; 
      font-family: monospace; 
      font-size: 14px; 
    }
    .status-item.ok { color: #10b981; }
    .features {
      text-align: left;
      margin: 30px 0;
      background: #f9fafb;
      padding: 20px;
      border-radius: 8px;
    }
    .features h3 {
      color: #333;
      margin-bottom: 15px;
      font-size: 18px;
    }
    .feature-item {
      margin: 10px 0;
      color: #666;
      padding-left: 25px;
      position: relative;
    }
    .feature-item:before {
      content: "✓";
      position: absolute;
      left: 0;
      color: #10b981;
      font-weight: bold;
    }
    .button { 
      display: inline-block; 
      background: #3b82f6; 
      color: white; 
      padding: 12px 30px; 
      border-radius: 6px; 
      text-decoration: none; 
      margin: 10px; 
      font-weight: 600; 
      transition: background 0.3s; 
    }
    .button:hover { background: #2563eb; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🎉 CRM 系統</h1>
    <p>歡迎使用現代簡潔的客戶關係管理系統！</p>
    <div class="status">
      <div class="status-item ok">✓ 伺服器運行中</div>
      <div class="status-item ok">✓ API 端點可用</div>
      <div class="status-item ok">✓ 健康檢查通過</div>
    </div>
    <div class="features">
      <h3>系統功能</h3>
      <div class="feature-item">儀表板 - 客戶統計和數據可視化</div>
      <div class="feature-item">客戶管理 - 完整的 CRUD 操作</div>
      <div class="feature-item">實時更新 - 無需刷新頁面</div>
      <div class="feature-item">響應式設計 - 支持所有設備</div>
      <div class="feature-item">現代簡潔風格 - 使用 Tailwind CSS</div>
    </div>
    <div><a href="/api/health" class="button">檢查健康狀態</a></div>
    <p style="margin-top: 30px; font-size: 12px; color: #999;">
      CRM 系統 v1.0 | 由 Manus AI 開發
    </p>
  </div>
</body>
</html>`);
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

app.listen(PORT, () => {
  console.log(`[Server] ✓ Running on http://localhost:${PORT}`);
  console.log(`[Server] ✓ API available at http://localhost:${PORT}/api/health`);
});
