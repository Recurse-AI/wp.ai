/**
 * Authentication utility functions
 */

/**
 * Get the authentication token from localStorage
 * @returns The authentication token or null if not found
 */
export const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    try {
      // Try to get the session from localStorage
      const token = localStorage.getItem('token');
      if (token) {
        return token;
      }
      
      // Fallback to nextauth session (depending on your auth provider)
      const nextAuthSession = localStorage.getItem('next-auth.session-token');
      return nextAuthSession || null;
    } catch (e) {
      console.error('Error retrieving auth token:', e);
      return null;
    }
  }
  return null;
};

/**
 * Get authorization headers for API requests
 * @returns Object containing authorization headers
 */
export const getAuthHeaders = (): Record<string, string> => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Check if the user is authenticated
 * @returns Boolean indicating if the user is authenticated
 */
export const isAuthenticated = (): boolean => {
  return !!getAuthToken();
};

/**
 * Initialize axios interceptors to automatically add auth headers
 * @param axiosInstance The axios instance to configure
 */
export const initializeAuthInterceptors = (axiosInstance: any): void => {
  axiosInstance.interceptors.request.use(
    (config: any) => {
      const token = getAuthToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error: any) => Promise.reject(error)
  );
}; 