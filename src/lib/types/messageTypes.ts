// Common message types for both chat and agent components

// Base message interface
export interface BaseMessage {
  id: string;
  content: string;
  timestamp: Date;
}

// Chat message types
export interface ChatMessage extends BaseMessage {
  owner_name: string;
  user_prompt?: string;
  ai_response?: string;
  group?: number;
}

// Agent message types
export interface AgentMessage extends BaseMessage {
  role: 'user' | 'agent' | 'system';
  projectId?: string;
  sessionId?: string;
  codeChanges?: CodeChange[];
}

// Code change interface for agent messages
export interface CodeChange {
  type: 'create' | 'update' | 'delete';
  path: string;
  content?: string;
  diff?: string;
}

// Message service response interfaces
export interface MessageResponse {
  success: boolean;
  message: string;
  data?: any;
}

// Message options for both chat and agent components
export interface MessageOptions {
  model?: string;
  webSearch?: boolean;
  temperature?: number;
  systemPrompt?: string;
  attachments?: Attachment[];
}

// Attachment interface
export interface Attachment {
  id: string;
  type: 'image' | 'file' | 'code';
  name: string;
  content: string | ArrayBuffer;
  size: number;
  mimeType: string;
} 