import axios from 'axios';
import { initializeAuthInterceptors } from './authUtils';

/**
 * Create a pre-configured axios instance for API requests
 * with authentication interceptors already set up
 */
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Initialize authentication interceptors
initializeAuthInterceptors(apiClient);

// Add response interceptor to handle common error cases
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle auth errors (401, 403)
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // Log out the user or refresh token as needed
      console.error('Authentication error:', error.response.status);
      
      // If we're in a browser environment, redirect to login
      if (typeof window !== 'undefined') {
        // Store the current URL to redirect back after login
        localStorage.setItem('loginRedirect', window.location.pathname);
        
        // Check if we're already on the login page to avoid redirect loops
        if (!window.location.pathname.includes('/signin')) {
          window.location.href = '/signin';
        }
      }
    }
    
    // Handle 404 errors
    if (error.response && error.response.status === 404) {
      console.error('Resource not found:', error.config.url);
    }
    
    // Handle server errors
    if (error.response && error.response.status >= 500) {
      console.error('Server error:', error.response.status, error.response.data);
    }
    
    return Promise.reject(error);
  }
);

export default apiClient; 