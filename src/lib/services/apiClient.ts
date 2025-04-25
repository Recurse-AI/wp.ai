import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, CancelTokenSource } from 'axios';

// Configuration constants
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';
const API_TIMEOUT = 60000;
const TOKEN_REFRESH_ENDPOINT = '/auth/refresh-token'; // Adjust based on your API

// Extend the InternalAxiosRequestConfig interface to include metadata
declare module 'axios' {
  export interface InternalAxiosRequestConfig {
    metadata?: {
      startTime: number;
    };
  }
}

interface QueuedRequest {
  resolve: (value: unknown) => void;
  reject: (reason?: any) => void;
  config: InternalAxiosRequestConfig;
}

// Singleton for token management
class TokenManager {
  private static instance: TokenManager;
  private isRefreshing = false;
  private requestQueue: QueuedRequest[] = [];

  private constructor() {}

  public static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager();
    }
    return TokenManager.instance;
  }

  public getToken(): string | null {
    return localStorage.getItem('token');
  }

  public setToken(token: string): void {
    localStorage.setItem('token', token);
  }

  public clearToken(): void {
    localStorage.removeItem('token');
  }

  public get refreshing(): boolean {
    return this.isRefreshing;
  }

  public set refreshing(value: boolean) {
    this.isRefreshing = value;
  }

  public enqueueRequest(request: QueuedRequest): void {
    this.requestQueue.push(request);
  }

  public processQueue(error: Error | null = null): void {
    this.requestQueue.forEach(request => {
      if (error) {
        request.reject(error);
      } else {
        request.resolve(apiClient(request.config));
      }
    });
    this.requestQueue = [];
  }
}

// Create a custom axios instance with default configuration
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for cookies/auth
});

// Request interceptor for adding auth token, etc.
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Add request timestamp for tracking
    config.metadata = { startTime: new Date().getTime() };
    
    // Skip token for authentication endpoints
    if (config.url?.includes('/auth/') && !config.url.includes(TOKEN_REFRESH_ENDPOINT)) {
      return config;
    }
    
    // Dynamically get token
    const tokenManager = TokenManager.getInstance();
    const token = tokenManager.getToken();
    
    if (token) {
      config.headers.set('Authorization', `Bearer ${token}`);
    }
    
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling common errors
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Calculate request duration for performance monitoring
    const config = response.config as InternalAxiosRequestConfig & { metadata?: { startTime: number } };
    if (config.metadata) {
      const requestDuration = new Date().getTime() - config.metadata.startTime;
      console.debug(`Request to ${response.config.url} took ${requestDuration}ms`);
    }
    
    return response;
  },
  async (error: AxiosError) => {
    const { response, config } = error;
    const originalRequest = config as InternalAxiosRequestConfig;
    
    // Handle token refresh
    if (response?.status === 401 && !originalRequest.url?.includes(TOKEN_REFRESH_ENDPOINT)) {
      const tokenManager = TokenManager.getInstance();
      
      // If already refreshing token, add request to queue
      if (tokenManager.refreshing) {
        return new Promise((resolve, reject) => {
          tokenManager.enqueueRequest({ resolve, reject, config: originalRequest });
        });
      }
      
      tokenManager.refreshing = true;
      
      try {
        // Attempt to refresh the token
        const refreshResponse = await apiClient.post(TOKEN_REFRESH_ENDPOINT);
        const newToken = refreshResponse.data.token;
        
        if (newToken) {
          tokenManager.setToken(newToken);
          
          // Update original request with new token
          originalRequest.headers.set('Authorization', `Bearer ${newToken}`);
          
          // Process queued requests with new token
          tokenManager.refreshing = false;
          tokenManager.processQueue();
          
          // Retry original request
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Handle failed token refresh
        tokenManager.clearToken();
        tokenManager.refreshing = false;
        tokenManager.processQueue(new Error('Token refresh failed'));
        
        // Redirect to login
        if (typeof window !== 'undefined') {
          window.location.href = '/signin';
        }
      }
    }
    
    // Handle different error status codes
    if (response) {
      const errorData = response.data as Record<string, any>;
      const errorMessage = errorData?.message || 'Something went wrong';
      
      switch (response.status) {
        case 401:
          console.error("Authentication failed. Please sign in again.");
          // Redirect to login page if not attempting to refresh token
          if (originalRequest.url?.includes(TOKEN_REFRESH_ENDPOINT) && typeof window !== 'undefined') {
            window.location.href = '/signin';
          }
          break;
        case 403:
          console.error("Access denied. You do not have permission for this action.");
          break;
        case 404:
          console.error("Resource not found.");
          break;
        case 429:
          console.error("Rate limit exceeded. Please try again later.");
          break;
        case 500:
        case 502:
        case 503:
          console.error("Server error. Please try again later.");
          break;
        default:
          console.error(errorMessage);
      }
      
      // Add status and message to error object for easier handling
      error.name = `ApiError${response.status}`;
      error.message = errorMessage;
    } else if (error.request) {
      // The request was made but no response was received
      console.error("Network error. Please check your connection.");
      error.name = 'NetworkError';
      error.message = 'Unable to connect to the server. Please check your internet connection.';
    }
    
    return Promise.reject(error);
  }
);

// Helper function to create cancel token
export const createCancelToken = (): CancelTokenSource => {
  return axios.CancelToken.source();
};

// Helper to check if error is a cancellation
export const isRequestCancelled = (error: any): boolean => {
  return axios.isCancel(error);
};

export default apiClient; 