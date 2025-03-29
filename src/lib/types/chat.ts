// Define our own SearchResult interface to avoid import error
export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  display_url: string;
}

export interface ChatConversation {
  id: string;
  title: string;
  conversation_type: string; // "chat" or "agent"
  user?: string; // optional, can be null for guest users
  guest_identifier?: string; // optional, for non-authenticated users
  provider: string; // reference to LLMProvider model
  model: string; // reference to LLMModel model
  created_at: string;
  updated_at: string;
  is_archived: boolean;
  is_pinned: boolean;
  metadata?: Record<string, any>; // arbitrary JSON
  message_count?: number; // read-only, calculated property
  last_message_preview?: {
    preview: string;
    timestamp: string;
  }
}

// Minimal API interfaces needed for history, update, and delete operations
export interface ChatHistoryResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: ChatConversation[];
}

export interface MessageGroup {
  id: string;
  conversation_id: string;
  user_content: string;
  ai_content: string;
  system_content?: string;
  function_content?: Record<string, any>;
  
  // Feedback fields
  upvotes?: number;
  downvotes?: number;
  user_feedback?: Record<string, any>;
  
  // Status and metadata
  created_at: string;
  updated_at: string;
  status?: string;
  metadata?: Record<string, any>;
  
  // Additional data fields matching server schema
  search_results?: any[];
  vector_embeddings_results?: Array<{
    title: string;
    content: string;
    url: string;
    metadata?: {
      source?: string;
      document_id?: string;
      [key: string]: any;
    };
  }>;
  vector_results_summary?: string;
  
  // Flag to track if a response is final
  is_final?: boolean;
  final_response?: boolean;
}

export interface ConversationState {
  conversation: string; // reference to Conversation id
  state_data: Record<string, any>; // arbitrary JSON for storing state
  context: Record<string, any>; // arbitrary JSON for storing context
  last_updated: string; // datetime
}

export interface AgentTask {
  id: string;
  conversation: string; // reference to Conversation id
  task_type: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  created_at: string;
  started_at?: string; // optional
  completed_at?: string; // optional
  result?: Record<string, any>; // arbitrary JSON result
  error?: string; // optional error message
  metadata?: Record<string, any>; // arbitrary JSON
}

export interface SharedConversation {
  id: string;
  conversation: string; // reference to Conversation id
  share_title?: string; // optional custom title
  share_description?: string; // optional description
  created_at: string;
  updated_at: string;
  is_active: boolean;
  view_count: number;
  messages?: MessageGroup[]; // list of MessageGroup objects when using detail view
}

export interface SharedMessage {
  id: string;
  conversation: string; // reference to Conversation id
  message_group: string; // reference to MessageGroup id
  created_at: string;
  view_count: number;
  message_group_data?: MessageGroup; // full MessageGroup object when using detail view
}

// Simple message type used in API routes
export interface ChatMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system' | 'function';
  content: string;
  created_at: string;
  message_group_id?: string;
}

// Request types for API calls
export interface ConversationRequest {
  message: string;
  conversation_id?: string;
  message_group_id?: string;
  options?: {
    do_vector_search?: boolean;
    do_web_search?: boolean;
    extended_thinking?: boolean;
    provider_name?: string;
    model_name?: string;
    temperature?: number;
    max_tokens?: number;
  };
}

export interface RegenerateRequest {
  conversation_id: string;
  message_group_id: string;
  options?: {
    do_vector_search?: boolean;
    do_web_search?: boolean;
    extended_thinking?: boolean;
    provider_name?: string;
    model_name?: string;
    temperature?: number;
    max_tokens?: number;
  };
}

