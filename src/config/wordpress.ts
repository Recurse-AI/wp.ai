export const WP_CONFIG = {
  baseUrl: 'http://localhost:8000',
  apiPath: '/wp-json/wp/v2',
  adminPath: '/wp-admin',
  sitesPath: '/var/www/sites'
};

export const getWpUserUrl = (userId: string) => `${WP_CONFIG.baseUrl}/user_${userId}`;
export const getWpUserApiUrl = (userId: string) => `${getWpUserUrl(userId)}${WP_CONFIG.apiPath}`;
export const getWpUserAdminUrl = (userId: string) => `${getWpUserUrl(userId)}${WP_CONFIG.adminPath}`; 