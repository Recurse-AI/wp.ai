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
    max_tokens: 2000,
    use_vector_search: false,
    extended_thinking: false,
    extended_thinking_budget: 1024,
  },
  RESPONSE_FORMATS: {
    STREAM: 'stream',
    JSON: 'json',
  },
} as const;

export type ChatProvider = 'openai' | 'anthropic' | 'google' | 'qwen' | 'deepseek';
export type ChatModel = 
  // OpenAI models
  | 'gpt-4o' 
  | 'gpt-4o-mini' 
  | 'gpt-4' 
  | 'gpt-o1'
  // Anthropic models
  | 'claude-3-7-sonnet'
  | 'claude-3-7-sonnet-thinking'
  | 'claude-3-5-sonnet-v2'
  | 'claude-3-5-haiku'
  | 'claude-3-5-sonnet'
  | 'claude-3-opus'
  // Google models
  | 'gemini-1.5-pro'
  | 'gemini-1.5-flash'
  | 'gemini-1.0-pro'
  // Qwen models
  | 'qwen-max'
  // DeepSeek models
  | 'deepseek-chat';

export interface ChatSettings {
  provider: ChatProvider;
  model: ChatModel;
  temperature: number;
  max_tokens: number;
  use_vector_search: boolean;
  extended_thinking?: boolean;
  extended_thinking_budget?: number;
  id?: string;
  is_new_chat?: boolean;
  mode?: string;
} 