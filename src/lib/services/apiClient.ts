import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

// Create a custom axios instance with default configuration
const apiClient: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || '',
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for cookies/auth
});

// Request interceptor for adding auth token, etc.
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // You can add auth token here if needed
    const token = localStorage.getItem('token');
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
    return response;
  },
  (error: AxiosError) => {
    const { response } = error;
    
    // Handle different error status codes
    if (response) {
      switch (response.status) {
        case 401:
          // Handle unauthorized access
          console.log("Session expired. Please sign in again.");
          // Redirect to login page if needed
          // window.location.href = '/signin';
          break;
        case 403:
          console.log("Access denied. You do not have permission for this action.");
          break;
        case 404:
          console.log("Resource not found.");
          break;
        case 500:
          console.log("Server error. Please try again later.");
          break;
        default:
          // Get error message from response if available
          const errorData = response.data as Record<string, any>;
          const errorMessage = errorData?.message || 'Something went wrong';
          console.log(errorMessage, "errorMessage");
      }
    } 
    
    return Promise.reject(error);
  }
);

export default apiClient; 