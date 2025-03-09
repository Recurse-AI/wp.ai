export interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
  updated_at?: string;
  status?: 'delivered' | 'pending' | 'error';
  metadata?: Record<string, any>;
  versions?: ChatMessageVersion[];
}

export interface ChatMessageVersion {
  id: string;
  content: string;
  created_at: string;
}

export interface ChatConversation {
  id: string;
  session_id: string;
  title: string;
  conversation_type?: string;
  created_at: string;
  updated_at: string;
  last_message?: {
    content: string;
    role: 'user' | 'assistant' | 'system';
    created_at: string;
  };
  message_count?: number;
}

export interface ChatResponse {
  response: string;
  session_id: string;
  is_new_session?: boolean;
  provider?: string;
  model?: string;
  temperature?: number;
  max_tokens?: number;
  use_vector_search?: boolean;
  response_time?: number;
  used_vector_search?: boolean;
  message_id?: string;
  conversation?: {
    id: string;
    title: string;
    created_at: string;
    updated_at: string;
    user_message_id?: string;
    assistant_message_id?: string;
    config?: Record<string, any>;
  };
}

export interface ChatConfig {
  provider: string;
  model: string;
  temperature: number;
  max_tokens: number;
  use_vector_search?: boolean;
}

export interface ChatOptions extends Partial<ChatConfig> {
  session_id?: string;
}

export interface ChatFeedback {
  message_id: string;
  feedback_type: 'upvote' | 'downvote' | 'flag';
  comment?: string;
}

export interface ChatHistoryResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: ChatConversation[];
}

export interface ChatMessagesResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: ChatMessage[];
}

export interface RegenerateRequest {
  session_id: string;
  message_id?: string;
}

export interface ConversationRequest {
  query: string;
  session_id?: string;
  provider?: string;
  model?: string;
  temperature?: number;
  max_tokens?: number;
  use_vector_search?: boolean;
} 

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

export interface ChatSessionResponse {
  session_id: string;
  messages: Message[];
  created_at: string;
  updated_at: string;
}

