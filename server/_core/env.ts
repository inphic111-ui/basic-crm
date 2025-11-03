export const ENV = {
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:manus_pg_2025@localhost:5432/postgres',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-key',
  appId: process.env.VITE_APP_ID || '',
  oauthServerUrl: process.env.OAUTH_SERVER_URL || 'https://api.manus.im',
  oauthPortalUrl: process.env.VITE_OAUTH_PORTAL_URL || 'https://portal.manus.im',
  appTitle: process.env.VITE_APP_TITLE || 'CRM 系統',
  appLogo: process.env.VITE_APP_LOGO || '',
  ownerName: process.env.OWNER_NAME || '',
  ownerOpenId: process.env.OWNER_OPEN_ID || '',
};
