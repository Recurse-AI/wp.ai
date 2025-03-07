export interface ChatMessage {
  query?: string;
  response?: string;
  session_id: string;
  provider: string;
  model: string;
  temperature?: number;
  max_tokens?: number;
  use_vector_search?: boolean;
  response_time?: number;
  used_vector_search?: boolean;
}

export interface ChatConversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ChatResponse {
  response: string;
  response_time: number;
  provider: string;
  model: string;
  used_vector_search: boolean;
  session_id: string;
  conversation: ChatConversation;
}

export interface ChatConfig {
  provider: string;
  model: string;
  temperature: number;
  max_tokens: number;
  use_vector_search: boolean;
}

export interface ChatOptions extends Partial<ChatConfig> {
  session_id?: string;
} 