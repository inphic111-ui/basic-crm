import { trpc } from '@/lib/trpc';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Users, TrendingUp, Phone, Mail } from 'lucide-react';

export default function Dashboard() {
  const { data: customersData, isLoading } = trpc.customers.list.useQuery({
    page: 1,
    limit: 100,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const customers = customersData?.customers || [];
  const total = customersData?.total || 0;

  // 統計數據
  const stats = [
    {
      label: '總客戶數',
      value: total,
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      label: '已聯繫',
      value: customers.filter((c) => c.email).length,
      icon: Mail,
      color: 'bg-green-500',
    },
    {
      label: '有電話',
      value: customers.filter((c) => c.phone).length,
      icon: Phone,
      color: 'bg-purple-500',
    },
    {
      label: '增長率',
      value: '100%',
      icon: TrendingUp,
      color: 'bg-orange-500',
    },
  ];

  // 公司分佈數據
  const companyData = customers.reduce(
    (acc, customer) => {
      const company = customer.company || '未分類';
      const existing = acc.find((item) => item.name === company);
      if (existing) {
        existing.count += 1;
      } else {
        acc.push({ name: company, count: 1 });
      }
      return acc;
    },
    [] as Array<{ name: string; count: number }>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* 標題 */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">儀表板</h1>
          <p className="text-gray-600 mt-2">歡迎回來！這是您的 CRM 系統概覽。</p>
        </div>

        {/* 統計卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">{stat.label}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                  </div>
                  <div className={`${stat.color} p-3 rounded-lg`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 圖表 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">客戶公司分佈</h2>
          {companyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={companyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#3b82f6" name="客戶數" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>暫無客戶數據</p>
            </div>
          )}
        </div>

        {/* 最近客戶 */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">最近添加的客戶</h2>
          {customers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4 font-semibold text-gray-700">客戶名稱</th>
                    <th className="text-left py-2 px-4 font-semibold text-gray-700">公司</th>
                    <th className="text-left py-2 px-4 font-semibold text-gray-700">電郵</th>
                    <th className="text-left py-2 px-4 font-semibold text-gray-700">電話</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.slice(0, 5).map((customer) => (
                    <tr key={customer.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-900">{customer.name}</td>
                      <td className="py-3 px-4 text-gray-600">{customer.company || '-'}</td>
                      <td className="py-3 px-4 text-gray-600">{customer.email || '-'}</td>
                      <td className="py-3 px-4 text-gray-600">{customer.phone || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>暫無客戶數據</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
