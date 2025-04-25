import axios, { AxiosInstance, AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { AgentMessage, FileNode } from "../types";

interface CreateWorkspaceParams {
  name: string;
  description?: string;
  metadata?: Record<string, any>;
}

interface MessageParams {
  message: string;
  codeBlocks?: { language: string; code: string }[];
}

class AgentAPIService {
  private baseUrl: string;
  private apiClient: AxiosInstance;
  
  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
    
    // Create axios instance
    this.apiClient = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    // Request interceptor for adding token
    this.apiClient.interceptors.request.use(
      (config) => {
        if (typeof window !== 'undefined') {
          const token = localStorage.getItem('token');
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
    
    // Response interceptor for error handling
    this.apiClient.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
        
        // Handle 401 error (unauthorized) - could add token refresh here
        if (error.response?.status === 401 && !originalRequest._retry) {
          // Example token refresh logic (commented out)
          /*
          originalRequest._retry = true;
          try {
            const refreshToken = localStorage.getItem('refreshToken');
            const response = await this.refreshAuth(refreshToken);
            const { token } = response.data;
            localStorage.setItem('token', token);
            this.apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            return this.apiClient(originalRequest);
          } catch (refreshError) {
            // Redirect to login or handle refresh failure
            return Promise.reject(refreshError);
          }
          */
        }
        
        // Extract error message
        const errorMessage = 
          error.response?.data && typeof error.response.data === 'object' && 'message' in error.response.data
            ? (error.response.data as { message: string }).message
            : error.message || 
              'An unexpected error occurred';
          
        return Promise.reject(new Error(errorMessage));
      }
    );
  }

  // Create a new workspace
  async createWorkspace(params: CreateWorkspaceParams): Promise<{ workspaceId: string }> {
    try {
      console.log(`Making API request to create workspace: ${JSON.stringify(params)}`);
      
      // Log the API endpoint being called
      const apiEndpoint = '/api/workspace/workspaces/';
      console.log(`API endpoint: ${this.baseUrl}${apiEndpoint}`);
      
      const response = await this.apiClient.post(apiEndpoint, params);
      
      // Log the raw response for debugging
      console.log(`API response status: ${response.status}`);
      console.log('API response data:', response.data);
      
      // Validate the response data
      if (!response.data) {
        console.error('API returned empty response data');
        throw new Error('Server returned empty response');
      }
      
      // Check if the response contains 'id' (Django backend uses 'id') or 'workspaceId'
      if (response.data.id) {
        // Convert the backend's 'id' format to the expected 'workspaceId' format
        console.log(`Found 'id' in response (${response.data.id}), converting to workspaceId format`);
        return { workspaceId: response.data.id };
      }
      
      if (!response.data.workspaceId) {
        console.error('API response missing both id and workspaceId properties:', response.data);
        throw new Error(`API response missing workspaceId property: ${JSON.stringify(response.data)}`);
      }
      
      return response.data;
    } catch (error) {
      // Enhanced error logging
      console.error('Error in createWorkspace API call:', error);
      
      if (axios.isAxiosError(error)) {
        // Log more details for Axios errors
        const axiosError = error;
        console.error(`Axios error: ${axiosError.code}`);
        console.error(`Request URL: ${axiosError.config?.url}`);
        console.error(`Request method: ${axiosError.config?.method}`);
        console.error(`Response status: ${axiosError.response?.status}`);
        console.error('Response data:', axiosError.response?.data);
        
        // If we have response data with an error message
        if (axiosError.response?.data) {
          const responseData = axiosError.response.data;
          if (responseData.error || responseData.message || responseData.detail) {
            const message = responseData.error || responseData.message || responseData.detail;
            throw new Error(`Server error: ${message}`);
          }
        }
      }
      
      this.handleError(error, 'Failed to create workspace');
    }
  }

  // Send a message to the agent
  async sendMessage(workspaceId: string, params: MessageParams): Promise<{ messageId: string }> {
    try {
      console.log(`Sending API message to workspace ${workspaceId}`);
      
      const response = await this.apiClient.post(
        `/api/workspace/workspaces/${workspaceId}/agent_message/`, 
        params
      );
      
      console.log(`Message API response status: ${response.status}`);
      console.log('Message API response data:', response.data);
      
      // Validate the response
      if (!response.data) {
        throw new Error('Server returned empty response for message');
      }
      
      // Check if we got a messageId or we need to extract it
      if (!response.data.messageId && response.data.assistant_message_id) {
        console.log(`Using assistant_message_id as messageId: ${response.data.assistant_message_id}`);
        return { messageId: response.data.assistant_message_id };
      }
      
      return response.data;
    } catch (error) {
      console.error('Error in sendMessage API call:', error);
      
      if (axios.isAxiosError(error)) {
        // Log more details for Axios errors
        const axiosError = error;
        console.error(`Axios error: ${axiosError.code}`);
        console.error(`Request URL: ${axiosError.config?.url}`);
        console.error(`Request method: ${axiosError.config?.method}`);
        console.error(`Response status: ${axiosError.response?.status}`);
        console.error('Response data:', axiosError.response?.data);
        
        // If we have response data with an error message
        if (axiosError.response?.data) {
          const responseData = axiosError.response.data;
          if (responseData.error || responseData.message || responseData.detail) {
            const message = responseData.error || responseData.message || responseData.detail;
            throw new Error(`Server error: ${message}`);
          }
        }
      }
      
      this.handleError(error, 'Failed to send message');
    }
  }

  // Create a file in the workspace
  async createFile(workspaceId: string, path: string, content: string): Promise<{ fileId: string }> {
    try {
      const response = await this.apiClient.post('/api/workspace/files/', {
        workspace_id: workspaceId,
        path,
        content
      });
      return response.data;
    } catch (error) {
      this.handleError(error, 'Failed to create file');
    }
  }

  // Update file content
  async updateFileContent(fileId: string, content: string): Promise<{ success: boolean }> {
    try {
      await this.apiClient.post(`/api/workspace/files/${fileId}/update_content/`, {
        content
      });
      return { success: true };
    } catch (error) {
      this.handleError(error, 'Failed to update file content');
    }
  }

  // Set active file in workspace
  async setActiveFile(workspaceId: string, fileId: string): Promise<{ success: boolean }> {
    try {
      await this.apiClient.post(`/api/workspace/workspaces/${workspaceId}/update_active_file/`, {
        file_id: fileId
      });
      return { success: true };
    } catch (error) {
      this.handleError(error, 'Failed to set active file');
    }
  }
  
  // Get workspace details
  async getWorkspace(workspaceId: string): Promise<any> {
    try {
      const response = await this.apiClient.get(`/api/workspace/workspaces/${workspaceId}/`);
      return response.data;
    } catch (error) {
      this.handleError(error, 'Failed to get workspace');
    }
  }
  
  // Get files in workspace
  async getWorkspaceFiles(workspaceId: string): Promise<FileNode[]> {
    try {
      const response = await this.apiClient.get(`/api/workspace/workspaces/${workspaceId}/files/`);
      return response.data.files;
    } catch (error) {
      this.handleError(error, 'Failed to get workspace files');
    }
  }

  // Get agent messages
  async getMessages(workspaceId: string): Promise<AgentMessage[]> {
    try {
      const response = await this.apiClient.get(`/api/workspace/workspaces/${workspaceId}/messages/`);
      return response.data.messages;
    } catch (error) {
      this.handleError(error, 'Failed to get messages');
    }
  }

  // Delete file 
  async deleteFile(fileId: string): Promise<{ success: boolean }> {
    try {
      await this.apiClient.delete(`/api/workspace/files/${fileId}/`);
      return { success: true };
    } catch (error) {
      this.handleError(error, 'Failed to delete file');
    }
  }

  // Helper method for error handling
  private handleError(error: any, defaultMessage: string): never {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(defaultMessage);
  }
}

export const agentAPI = new AgentAPIService(); 