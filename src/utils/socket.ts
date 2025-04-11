// Type definitions for WebSocket communication

import { SearchResult } from "@/lib/types/chat";

// WebSocket connection status
export type WebSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'disconnecting' | 'error';

// AI generation status
export type AIStatus = 'idle' | 'thinking' | 'searching_web' | 'searching_context' | 'generating' | 'complete' | 'error' | 'cancelled';


// Token stream data
export interface StreamTokenData {
  type: string;
  token: string;
  message_group_id: string;
  status: 'token';
}

// Stream complete data
export interface StreamCompleteData {
  type: string;
  message_group_id: string;
  status: 'generation_completed' | 'generation_failed';
  message_group?: {
    id: string;
    user_content: string;
    ai_content: string;
    system_content?: string;
    status?: string;
    thinking_process?: string | any[];
  };
}

// Search result data - updated based on WebSocket documentation
export interface SearchResultsData {
  type: string;
  status?: 'started' | 'web_search_partial_result' | 'completed' | 'skipped';
  query?: string;
  result?: any;
  results?: SearchResult[];
  message_group_id?: string;
  index?: number;
  total?: number;
  summary?: string;
}

// AI status data
export interface AIStatusData {
  type: string;
  status: 'generation_started' | 'generation_completed' | 'generation_failed';
  message?: string;
  message_group_id: string;
}

// Error message data
export interface ErrorData {
  type: 'error';
  message: string;
  message_group_id?: string;
  code?: string;
}

// Connection established data
export interface ConnectionEstablishedData {
  type: 'connection_established';
  conversation_id: string;
  is_new_conversation: boolean;
  status: string;
  user_id?: string;
  auth_method?: string;
}

// Outgoing message types - updated to match schema
export interface SendMessageOptions {
  type?: 'message';
  message: string;
  message_group_id?: string;
  options?: {
    do_web_search?: boolean;
    do_vector_search?: boolean;
    extended_thinking?: boolean;
    extended_thinking_budget?: number;
    provider_name?: string;
    model_name?: string;
    temperature?: number;
    max_tokens?: number;
    top_p?: number;
    frequency_penalty?: number;
    presence_penalty?: number;
    stop?: string[];
  };
}

// Command options
export interface CommandOptions {
  type: 'command';
  command: 'cancel';
  message_group_id: string;
}

// History request
export interface HistoryRequest {
  type: 'history_request';
  offset?: number;
  limit?: number;
  conversation_id?: string;
}

// Create conversation request
export interface CreateConversationRequest {
  type: 'create_conversation';
  title?: string;
  metadata?: Record<string, any>;
}

