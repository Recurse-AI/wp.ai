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

// Message group data schema for streamable messages
export interface MessageGroupData {
  type: 'message_group_data';
  message_group: {
    id: string;
    user_content: string;
    ai_content: string;
    system_content?: string;
    function_content?: any;
    created_at: string;
    updated_at: string;
    status: 'complete' | 'pending' | 'error';
    metadata?: {
      embedding_context?: {
        processed_context?: string;
        query?: string;
        processed_at?: string;
      };
      custom_field?: string;
      [key: string]: any;
    };
    search_results?: Array<{
      title: string;
      url: string;
      snippet: string;
      position: number;
    }>;
    embeddings?: {
      results: Array<{
        content: string;
        metadata: {
          source: string;
          document_id: string;
          [key: string]: any;
        };
      }>;
      query?: string;
    };
    thinking_process?: Array<{
      step: number;
      content: string;
    }>;
  };
  message_group_id: string;
  conversation_id: string;
  status: 'complete' | 'pending' | 'error';
  is_final: boolean;
  final_response: boolean;
}

