import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import TokenManager from './tokenManager';

// Base API URLs - these should match your environment variables
const API_URL = process.env.NEXT_PUBLIC_AUTH_API_URL || 'http://localhost:8000/api';

// Error interface
export interface ApiError {
  status: number;
  message: string;
  errors?: Record<string, string[]>;
}

// Create axios instance with default config
const apiClient = axios.create({
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
      // Get valid token from TokenManager
      const token = await TokenManager.getValidToken();
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
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
        
        // Redirect to login page if in browser
        if (typeof window !== 'undefined') {
          window.location.href = '/signin';
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
    const response: AxiosResponse<T> = await apiClient({
      method,
      url,
      data,
      ...config,
    });
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<any>;
    const apiError: ApiError = {
      status: axiosError.response?.status || 500,
      message: axiosError.response?.data?.message || 'Something went wrong',
      errors: axiosError.response?.data?.errors,
    };
    
    console.error('API Error:', apiError);
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