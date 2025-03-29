import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import TokenManager from './tokenManager';

// Base API URLs - these should match your environment variables
const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://192.168.93.41:8000';

// Error interface
export interface ApiError {
  status: number;
  message: string;
  errors?: Record<string, string[]>;
  data?: any;
  tokenError?: 'expired_access' | 'expired_refresh' | 'invalid_token' | 'missing_token';
}

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Include cookies in requests
});

// Create a separate axios instance without auth interceptors for token refresh
const apiClientNoAuth = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Include cookies in requests
});

// Add request interceptor for auth token
apiClient.interceptors.request.use(
  async (config) => {
    // Only in browser environment
    if (typeof window !== 'undefined') {
      try {
        // Get valid token from TokenManager
        const token = await TokenManager.getValidToken();
        console.log('🔍 API Request - Token retrieved:', token ? 'Token exists' : 'No token found');
        
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        console.error('❌ Error getting valid token for request:', error);
        // If we're not on the login page, redirect if token refresh fails
        if (typeof window !== 'undefined' && 
            !window.location.pathname.includes('/signin') && 
            !window.location.pathname.includes('/signup')) {
          window.location.href = '/signin?reason=session_expired';
        }
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor for token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If error is 401 and we haven't tried to refresh the token yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Check if refresh token exists and is not expired
        const refreshToken = TokenManager.getRefreshToken();
        if (!refreshToken || TokenManager.isRefreshTokenExpired(refreshToken)) {
          // If refresh token is missing or expired (1 month validity), force login
          console.error('❌ No valid refresh token available (1 month validity)');
          TokenManager.clearTokens();
          
          // Avoid redirect loops - only redirect if we're not already on the signin page
          if (typeof window !== 'undefined' && 
              !window.location.pathname.includes('/signin') && 
              !window.location.pathname.includes('/signup')) {
            window.location.href = '/signin?reason=login_required';
          }
          
          return Promise.reject(error);
        }
        
        // Try to refresh the token
        await TokenManager.refreshAccessToken();
        
        // Get the new token
        const token = TokenManager.getToken();
        if (token) {
          // Update the Authorization header with the new token
          originalRequest.headers.Authorization = `Bearer ${token}`;
          // Retry the original request
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // If refresh fails, clear tokens and let the error pass through
        TokenManager.clearTokens();
        
        console.error('❌ Token refresh failed:', refreshError);
        
        // Avoid redirect loops - only redirect if we're not already on the signin page
        // and not in the middle of a login request
        if (typeof window !== 'undefined') {
          const currentPath = window.location.pathname;
          const isLoginRequest = originalRequest.url?.includes('/login') || 
                               originalRequest.url?.includes('/auth');
          
          console.log('🔄 Auth Redirect Check:', { 
            currentPath, 
            isLoginRequest,
            originalUrl: originalRequest.url
          });
          
          // Only redirect if not already on signin page and not in login process
          if (currentPath !== '/signin' && !isLoginRequest) {
            console.log('⚠️ Redirecting to signin page due to auth failure');
            window.location.href = '/signin?reason=auth_failed';
          } else {
            console.log('🛑 Prevented redirect loop - already on signin page or in login process');
          }
        }
      }
    }
    
    return Promise.reject(error);
  }
);

// Generic API request function with error handling
export const apiRequest = async <T>(
  method: string,
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<T> => {
  try {
    console.log(`🔄 API Request: ${method} ${url}`, { data });
    const response: AxiosResponse<T> = await apiClient({
      method,
      url,
      data,
      ...config,
    });
    console.log(`✅ API Response: ${method} ${url}`, { status: response.status, data: response.data });
    return response.data;
  } catch (error) {
    console.error(`❌ API Error: ${method} ${url}`, error);
    const axiosError = error as AxiosError<any>;
    const apiError: ApiError = {
      status: axiosError.response?.status || 500,
      message: axiosError.response?.data?.message || 'Something went wrong',
      errors: axiosError.response?.data?.errors,
      data: axiosError.response?.data,
    };
    
    // Add token-specific error information
    if (axiosError.response?.status === 401) {
      const errorDetail = axiosError.response?.data?.detail || '';
      const errorCode = axiosError.response?.data?.code || '';
      
      if (errorDetail.includes('refresh') || errorCode === 'token_not_valid' || errorCode === 'refresh_expired') {
        apiError.tokenError = 'expired_refresh';
      } else if (errorDetail.includes('access') || errorCode === 'token_expired') {
        apiError.tokenError = 'expired_access';
      } else if (errorDetail.includes('invalid') || errorCode === 'invalid_token') {
        apiError.tokenError = 'invalid_token';
      } else {
        apiError.tokenError = 'missing_token';
      }
      
      console.error(`🔑 Token error detected: ${apiError.tokenError}`, {
        status: apiError.status,
        message: apiError.message,
        errorDetail,
        errorCode,
      });
    }
    
    throw apiError;
  }
};

// Generic API request function without authentication (for token refresh)
export const apiRequestWithoutAuth = async <T = any>(
  method: string,
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<T> => {
  try {
    console.log(`🔄 API Request (No Auth): ${method} ${url}`, { data });
    const response: AxiosResponse<T> = await apiClientNoAuth({
      method,
      url,
      data,
      ...config,
    });
    
    // More detailed logging for debugging
    if (url.includes('refresh')) {
      console.log(`✅ Token Refresh Response:`, {
        status: response.status,
        hasAccessToken: response.data && (response.data as any).access ? true : false,
        data: response.data
      });
    } else {
      console.log(`✅ API Response (No Auth): ${method} ${url}`, { 
        status: response.status
      });
    }
    
    return response.data;
  } catch (error) {
    console.error(`❌ API Error (No Auth): ${method} ${url}`, error);
    const axiosError = error as AxiosError<any>;
    
    // More detailed error logging for token refresh failures
    if (url.includes('refresh')) {
      console.error('Token refresh error details:', {
        status: axiosError.response?.status,
        data: axiosError.response?.data,
        message: axiosError.message
      });
    }
    
    const apiError: ApiError = {
      status: axiosError.response?.status || 500,
      message: axiosError.response?.data?.message || axiosError.response?.data?.detail || 'Something went wrong',
      errors: axiosError.response?.data?.errors,
      data: axiosError.response?.data,
    };
    
    throw apiError;
  }
};

// Helper methods for common HTTP methods
export const apiGet = <T>(url: string, config?: AxiosRequestConfig) => 
  apiRequest<T>('GET', url, undefined, config);

export const apiPost = <T>(url: string, data?: any, config?: AxiosRequestConfig) => 
  apiRequest<T>('POST', url, data, config);

export const apiPut = <T>(url: string, data?: any, config?: AxiosRequestConfig) => 
  apiRequest<T>('PUT', url, data, config);

export const apiPatch = <T>(url: string, data?: any, config?: AxiosRequestConfig) => 
  apiRequest<T>('PATCH', url, data, config);

export const apiDelete = <T>(url: string, config?: AxiosRequestConfig) => 
  apiRequest<T>('DELETE', url, undefined, config);

// Helper methods for no-auth API requests
export const apiPostWithoutAuth = <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => 
  apiRequestWithoutAuth<T>('POST', url, data, config); 