import { AIModel } from './aiModels';
import apiClient from './apiClient';
import { AxiosResponse } from 'axios';

export interface CodeFile {
  id: string;
  name: string;
  path: string;
  content: string;
  language: string;
  lastModified: Date;
}

export interface CodeProject {
  id: string;
  name: string;
  description: string;
  files: CodeFile[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AgentMessage {
  id: string;
  role: 'user' | 'agent';
  content: string;
  timestamp: Date;
  codeChanges?: {
    fileId: string;
    diff: string;
    operation: 'create' | 'update' | 'delete';
  }[];
}

export interface AgentSession {
  id: string;
  projectId: string;
  title: string;
  messages: AgentMessage[];
  model: string;
  provider: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AgentOptions {
  model: AIModel;
  temperature?: number;
  max_tokens?: number;
  project_id?: string;
}

/**
 * Create a new file in a project
 * @param projectId - ID of the project
 * @param file - File data
 * @returns The created file
 */
export const createFile = async (
  projectId: string,
  file: Omit<CodeFile, 'id' | 'lastModified'>
): Promise<CodeFile> => {
  try {
    const endpoint = `/api/agent/projects/${projectId}/files`;
    const response: AxiosResponse = await apiClient.post(endpoint, file);
    
    return response.data;
  } catch (error) {
    console.error('Error creating file:', error);
    throw error;
  }
};

/**
 * Update a file in a project
 * @param projectId - ID of the project
 * @param fileId - ID of the file to update
 * @param content - New file content
 * @returns The updated file
 */
export const updateFile = async (
  projectId: string,
  fileId: string,
  content: string
): Promise<CodeFile> => {
  try {
    const endpoint = `/api/agent/projects/${projectId}/files/${fileId}`;
    const response: AxiosResponse = await apiClient.patch(endpoint, { content });
    
    return response.data;
  } catch (error) {
    console.error('Error updating file:', error);
    throw error;
  }
};

/**
 * Delete a file from a project
 * @param projectId - ID of the project
 * @param fileId - ID of the file to delete
 * @returns Success boolean
 */
export const deleteFile = async (
  projectId: string,
  fileId: string
): Promise<boolean> => {
  try {
    const endpoint = `/api/agent/projects/${projectId}/files/${fileId}`;
    await apiClient.delete(endpoint);
    
    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
};

/**
 * Create a new project
 * @param name - Project name
 * @param description - Project description
 * @param initialFiles - Initial files to create with the project
 * @returns The created project
 */
export const createProject = async (
  name: string,
  description: string,
  initialFiles: Omit<CodeFile, 'id' | 'lastModified'>[] = []
): Promise<CodeProject> => {
  try {
    const endpoint = `/api/agent/projects`;
    const payload = {
      name,
      description,
      files: initialFiles,
    };
    
    const response: AxiosResponse = await apiClient.post(endpoint, payload);
    
    return response.data;
  } catch (error) {
    console.error('Error creating project:', error);
    throw error;
  }
};

/**
 * Get a project by ID
 * @param projectId - ID of the project to retrieve
 * @returns The project data
 */
export const getProject = async (projectId: string): Promise<CodeProject> => {
  try {
    const endpoint = `/api/agent/projects/${projectId}`;
    const response: AxiosResponse = await apiClient.get(endpoint);
    
    return response.data;
  } catch (error) {
    console.error('Error fetching project:', error);
    throw error;
  }
};

/**
 * List all projects
 * @returns List of projects
 */
export const listProjects = async (): Promise<CodeProject[]> => {
  try {
    const endpoint = `/api/agent/projects`;
    const response: AxiosResponse = await apiClient.get(endpoint);
    
    return response.data;
  } catch (error) {
    console.error('Error listing projects:', error);
    throw error;
  }
};

/**
 * Send a message to the agent
 * @param sessionId - ID of the existing session, or null for a new session
 * @param projectId - ID of the project
 * @param message - Message content
 * @param options - Agent configuration options
 * @returns Response with session ID, message ID, and response info
 */
export const sendAgentMessage = async (
  sessionId: string | null,
  projectId: string,
  message: string,
  options: AgentOptions
): Promise<{
  sessionId: string;
  messageId: string;
  response: string;
  codeChanges?: any[];
  isNewSession: boolean;
}> => {
  try {
    const isNewSession = !sessionId;
    const endpoint = `/api/agent/message`;
    
    const payload = {
      message,
      project_id: projectId,
      model_id: options.model.id,
      provider: options.model.provider,
      temperature: options.temperature || 0.7,
      max_tokens: options.max_tokens || options.model.maxTokens,
      ...(sessionId ? { session_id: sessionId } : {})
    };
    
    const response: AxiosResponse = await apiClient.post(endpoint, payload);
    const data = response.data;
    
    return {
      sessionId: data.session_id,
      messageId: data.message_id,
      response: data.response,
      codeChanges: data.code_changes,
      isNewSession
    };
  } catch (error) {
    console.error('Error sending message to agent:', error);
    throw error;
  }
};

/**
 * Get agent session details
 * @param sessionId - ID of the session to retrieve
 * @returns Session data
 */
export const getAgentSession = async (sessionId: string): Promise<AgentSession> => {
  try {
    const endpoint = `/api/agent/sessions/${sessionId}`;
    const response: AxiosResponse = await apiClient.get(endpoint);
    
    return response.data;
  } catch (error) {
    console.error('Error fetching agent session:', error);
    throw error;
  }
};

/**
 * List all agent sessions
 * @returns List of agent sessions
 */
export const listAgentSessions = async (): Promise<AgentSession[]> => {
  try {
    const endpoint = `/api/agent/sessions`;
    const response: AxiosResponse = await apiClient.get(endpoint);
    
    return response.data;
  } catch (error) {
    console.error('Error listing agent sessions:', error);
    throw error;
  }
}; 