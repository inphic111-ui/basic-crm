export const APP_TITLE = process.env.VITE_APP_TITLE || 'CRM 系統';
export const APP_LOGO = process.env.VITE_APP_LOGO || '';
export const COOKIE_NAME = 'session';

export const CUSTOMER_PRIORITIES = [
  'S級-確認待收款',
  'A級-優質跟進客戶',
  'B級-跟進客戶',
  'C級-養成客戶',
  'D級-低價值無效客戶',
  'E級-永久無需求',
  '聯繫名單失效',
  '客戶要求拒絕往來',
  '黑名單',
] as const;

export const CUSTOMER_CLASSIFICATIONS = [
  '鯨魚',
  '鯊魚',
  '小魚',
  '小蝦',
] as const;
