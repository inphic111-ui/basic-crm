# CRM 系統

現代簡潔的客戶關係管理系統，為小型團隊設計。

## 功能特性

- 📊 **儀表板**: 實時統計和數據可視化
- 👥 **客戶管理**: 完整的 CRUD 操作
- 📱 **響應式設計**: 支持桌面和移動設備
- 🚀 **高性能**: 使用 React 19 和 tRPC
- 🔒 **安全認證**: Manus OAuth 集成

## 技術棧

- **前端**: React 19 + TypeScript + Tailwind CSS
- **後端**: Node.js + Express + tRPC
- **資料庫**: PostgreSQL
- **ORM**: Drizzle ORM
- **部署**: Railway

## 快速開始

### 1. 安裝依賴

```bash
cd /home/ubuntu/crm_system
pnpm install
```

### 2. 配置環境變數

複製 `.env.example` 到 `.env` 並填入相應的配置：

```bash
cp .env.example .env
```

### 3. 初始化資料庫

```bash
# 生成遷移文件
pnpm db:generate

# 執行遷移
pnpm db:push

# 種植預設客戶
curl http://localhost:3000/api/init
```

### 4. 啟動開發伺服器

```bash
pnpm dev
```

訪問 `http://localhost:3000` 查看應用程式。

## 預設客戶

系統包含 5 個預設客戶：

1. 台灣科技公司 - TechCorp Taiwan
2. 創意設計工作室 - Creative Studio
3. 綠色環保公司 - Green Eco
4. 王小明 - 個人
5. 李美麗 - 個人

## API 端點

### 客戶管理

- `GET /api/trpc/customers.list` - 獲取客戶列表
- `GET /api/trpc/customers.get` - 獲取客戶詳情
- `POST /api/trpc/customers.create` - 新增客戶
- `PUT /api/trpc/customers.update` - 編輯客戶
- `DELETE /api/trpc/customers.delete` - 刪除客戶

### 認證

- `GET /api/trpc/auth.me` - 獲取當前用戶
- `POST /api/trpc/auth.logout` - 登出

## 項目結構

```
crm_system/
├── client/                 # 前端應用
│   ├── src/
│   │   ├── pages/         # 頁面組件
│   │   ├── components/    # 可重用組件
│   │   ├── lib/           # 工具函數
│   │   ├── App.tsx        # 主應用
│   │   └── main.tsx       # 入口文件
│   └── index.html         # HTML 模板
├── server/                # 後端應用
│   ├── routers.ts         # tRPC 路由
│   ├── db.ts              # 資料庫查詢
│   └── _core/             # 核心框架
├── drizzle/               # 資料庫配置
│   └── schema.ts          # 資料庫架構
├── shared/                # 共享代碼
├── package.json           # 依賴配置
└── tsconfig.json          # TypeScript 配置
```

## 開發命令

```bash
# 啟動開發伺服器
pnpm dev

# 構建生產版本
pnpm build

# 預覽生產版本
pnpm preview

# 資料庫遷移
pnpm db:generate
pnpm db:push
pnpm db:studio
```

## 部署到 Railway

1. 推送代碼到 GitHub
2. 在 Railway 中連接 GitHub 倉庫
3. 配置環境變數
4. 自動部署

## 環境變數

| 變數名 | 說明 | 必需 |
|--------|------|------|
| DATABASE_URL | PostgreSQL 連接字符串 | ✅ |
| JWT_SECRET | JWT 簽名密鑰 | ✅ |
| VITE_APP_ID | OAuth 應用 ID | ❌ |
| OAUTH_SERVER_URL | OAuth 伺服器 URL | ❌ |
| VITE_OAUTH_PORTAL_URL | OAuth 登入門戶 URL | ❌ |

## 許可證

MIT

## 支援

如有問題，請訪問 https://help.manus.im
