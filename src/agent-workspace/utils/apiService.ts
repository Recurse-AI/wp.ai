import axios, { AxiosInstance, AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { FileNode, WorkspaceData, MessageData, FileActionData, ToolInvocation } from "../types";


interface DeployWPSiteParams {
  url: string;
  username: string;
  password: string;
}

// API response types
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Export the class so it can be used elsewhere
export class AgentAPIService {
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

  // Workspace operations
  async createWorkspace(name: string): Promise<ApiResponse<WorkspaceData>> {
    try {
      const response = await this.apiClient.post('/workspaces/', { name });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error('Error creating workspace:', error);
      return { success: false, error: error.response?.data?.error || error.message };
    }
  }
  
  async getWorkspace(workspaceId: string): Promise<ApiResponse<WorkspaceData>> {
    try {
      const response = await this.apiClient.get(`/workspaces/${workspaceId}/`);
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error(`Error getting workspace ${workspaceId}:`, error);
      return { success: false, error: error.response?.data?.error || error.message };
    }
  }
  
  async updateWorkspace(workspaceId: string, data: Partial<WorkspaceData>): Promise<ApiResponse<WorkspaceData>> {
    try {
      const response = await this.apiClient.patch(`/workspaces/${workspaceId}/`, data);
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error(`Error updating workspace ${workspaceId}:`, error);
      return { success: false, error: error.response?.data?.error || error.message };
    }
  }

  // Message operations
  async getMessages(workspaceId: string): Promise<ApiResponse<MessageData[]>> {
    try {
      const response = await this.apiClient.get(`/workspaces/${workspaceId}/messages/`);
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error(`Error getting messages for workspace ${workspaceId}:`, error);
      return { success: false, error: error.response?.data?.error || error.message };
    }
  }
  
  async sendMessage(
    workspaceId: string, 
    text: string,
    codeBlocks?: Array<{ language: string; code: string }>
  ): Promise<ApiResponse<MessageData>> {
    try {
      const response = await this.apiClient.post(`/workspaces/${workspaceId}/messages/`, {
        sender: 'user',
        text,
        code_blocks: codeBlocks,
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error(`Error sending message to workspace ${workspaceId}:`, error);
      return { success: false, error: error.response?.data?.error || error.message };
    }
  }

  // Tool invocation operations
  async invokeToolWithStatus(
    messageId: string,
    toolName: string,
    parameters: Record<string, any>
  ): Promise<ApiResponse<ToolInvocation>> {
    try {
      const response = await this.apiClient.post(`/messages/${messageId}/tools/`, {
        tool_name: toolName,
        parameters,
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error(`Error invoking tool ${toolName} for message ${messageId}:`, error);
      return { success: false, error: error.response?.data?.error || error.message };
    }
  }
  
  async getToolStatus(messageId: string, toolId: string): Promise<ApiResponse<ToolInvocation>> {
    try {
      const response = await this.apiClient.get(`/messages/${messageId}/tools/${toolId}/`);
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error(`Error getting tool status for ${toolId}:`, error);
      return { success: false, error: error.response?.data?.error || error.message };
    }
  }

  // File operations
  async getFileActions(workspaceId: string): Promise<ApiResponse<FileActionData[]>> {
    try {
      const response = await this.apiClient.get(`/workspaces/${workspaceId}/file-actions/`);
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error(`Error getting file actions for workspace ${workspaceId}:`, error);
      return { success: false, error: error.response?.data?.error || error.message };
    }
  }
  
  async createFile(
    workspaceId: string,
    path: string,
    content: string,
    messageId?: string
  ): Promise<ApiResponse<FileActionData>> {
    try {
      const response = await this.apiClient.post(`/workspaces/${workspaceId}/file-actions/`, {
        action_type: 'create',
        path,
        metadata: { content },
        message_id: messageId,
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error(`Error creating file ${path} in workspace ${workspaceId}:`, error);
      return { success: false, error: error.response?.data?.error || error.message };
    }
  }
  
  async updateFile(
    workspaceId: string,
    path: string,
    content: string,
    messageId?: string
  ): Promise<ApiResponse<FileActionData>> {
    try {
      const response = await this.apiClient.post(`/workspaces/${workspaceId}/file-actions/`, {
        action_type: 'update',
        path,
        metadata: { content },
        message_id: messageId,
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error(`Error updating file ${path} in workspace ${workspaceId}:`, error);
      return { success: false, error: error.response?.data?.error || error.message };
    }
  }
  
  async deleteFile(
    workspaceId: string,
    path: string,
    messageId?: string
  ): Promise<ApiResponse<FileActionData>> {
    try {
      const response = await this.apiClient.post(`/workspaces/${workspaceId}/file-actions/`, {
        action_type: 'delete',
        path,
        metadata: {},
        message_id: messageId,
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error(`Error deleting file ${path} in workspace ${workspaceId}:`, error);
      return { success: false, error: error.response?.data?.error || error.message };
    }
  }
  
  // Download WordPress package as ZIP
  async downloadWordPressPackage(workspaceId: string): Promise<{ downloadUrl: string; fileName: string }> {
    try {
      console.log(`Downloading WordPress package from workspace ${workspaceId}`);
      
      const response = await this.apiClient.get(
        `/api/workspace/workspaces/${workspaceId}/wordpress/download/`
      );
      
      return response.data;
    } catch (error) {
      console.error('Error in downloadWordPressPackage API call:', error);
      this.handleError(error, 'Failed to download WordPress package');
    }
  }
  
  // Deploy to WordPress site
  async deployToWordPressSite(workspaceId: string, params: DeployWPSiteParams): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`Deploying WordPress package to site from workspace ${workspaceId}`);
      
      const response = await this.apiClient.post(
        `/api/workspace/workspaces/${workspaceId}/wordpress/deploy/`, 
        params
      );
      
      return response.data;
    } catch (error) {
      console.error('Error in deployToWordPressSite API call:', error);
      this.handleError(error, 'Failed to deploy to WordPress site');
    }
  }

  // Get message history for a workspace (agent session)
  async getAgentHistory(workspaceId: string): Promise<any> {
    try {
      console.log(`Fetching agent history for workspace ${workspaceId}`);
      
      const response = await this.apiClient.get(
        `/api/workspace/workspaces/${workspaceId}/history/`
      );
      
      console.log(`History API response status: ${response.status}`);
      
      // Validate the response
      if (!response.data) {
        throw new Error('Server returned empty response for history');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error in getAgentHistory API call:', error);
      this.handleError(error, 'Failed to fetch agent history');
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