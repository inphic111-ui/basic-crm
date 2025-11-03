import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';

type Page = 'dashboard' | 'customers';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const navigation = [
    { id: 'dashboard', label: '儀表板', icon: '📊' },
    { id: 'customers', label: '客戶管理', icon: '👥' },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* 側邊欄 */}
      <div
        className={`${
          sidebarOpen ? 'w-64' : 'w-0'
        } bg-gray-900 text-white transition-all duration-300 overflow-hidden`}
      >
        <div className="p-6">
          <h1 className="text-2xl font-bold">CRM 系統</h1>
        </div>
        <nav className="mt-8">
          {navigation.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id as Page)}
              className={`w-full text-left px-6 py-3 flex items-center gap-3 transition ${
                currentPage === item.id
                  ? 'bg-blue-600 border-l-4 border-blue-400'
                  : 'hover:bg-gray-800'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* 主要內容 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 頂部欄 */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-600 hover:text-gray-900"
          >
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <div className="text-gray-600 text-sm">
            歡迎使用 CRM 系統
          </div>
        </div>

        {/* 頁面內容 */}
        <div className="flex-1 overflow-auto">
          {currentPage === 'dashboard' && <Dashboard />}
          {currentPage === 'customers' && <Customers />}
        </div>
      </div>
    </div>
  );
}
