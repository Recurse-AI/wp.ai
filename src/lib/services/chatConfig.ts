export const CHAT_CONFIG = {
  API_ENDPOINTS: {
    CHAT: '/api/llm/chat',
    HISTORY: '/api/chat',
    CONVERSATIONS: '/api/chat',
  },
  DEFAULT_SETTINGS: {
    provider: 'openai',
    model: 'gpt-4o',
    temperature: 0.7,
    max_tokens: 1000,
    use_vector_search: false,
  },
  RESPONSE_FORMATS: {
    STREAM: 'stream',
    JSON: 'json',
  },
} as const;

export type ChatProvider = 'openai' | 'anthropic' | 'google';
export type ChatModel = 'gpt-4o' | 'gpt-3.5-turbo' | 'claude-2' | 'gemini-pro';

export interface ChatSettings {
  provider: ChatProvider;
  model: ChatModel;
  temperature: number;
  max_tokens: number;
  use_vector_search: boolean;
  session_id?: string;
} 