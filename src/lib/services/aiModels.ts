export interface AIModel {
  id: string;
  provider: string;
  name: string;
  description: string;
  maxTokens: number;
  capabilities: string[];
  defaultForProvider?: boolean;
  extended_thinking?: boolean;
  extended_thinking_budget?: number;
}

export interface AIProvider {
  id: string;
  name: string;
  logo: string;
  models: AIModel[];
  defaultModel?: string;
}

// Define supported AI providers and their models
export const AI_PROVIDERS: AIProvider[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    logo: '/logos/openai.svg',
    models: [
      {
        id: 'gpt-4o',
        provider: 'openai',
        name: 'GPT-4o',
        description: 'Most capable OpenAI model with vision capabilities.',
        maxTokens: 2000,
        capabilities: ['chat', 'code', 'reasoning', 'vision'],
        defaultForProvider: true,
      },
      {
        id: 'gpt-4o-mini',
        provider: 'openai',
        name: 'GPT-4o Mini',
        description: 'Smaller and faster version of GPT-4o.',
        maxTokens: 2000,
        capabilities: ['chat', 'code', 'reasoning'],
      },
      {
        id: 'gpt-4',
        provider: 'openai',
        name: 'GPT-4',
        description: 'Powerful reasoning and advanced capabilities.',
        maxTokens: 2000,
        capabilities: ['chat', 'code', 'reasoning'],
      },
      {
        id: 'gpt-o1',
        provider: 'openai',
        name: 'GPT-o1',
        description: 'Latest model with enhanced capabilities.',
        maxTokens: 2000,
        capabilities: ['chat', 'code', 'reasoning', 'vision'],
      },
    ],
    defaultModel: 'gpt-4o',
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    logo: '/logos/anthropic.svg',
    models: [
      {
        id: 'claude-3-7-sonnet',
        provider: 'anthropic',
        name: 'Claude 3.7 Sonnet',
        description: 'Industry-leading model for coding with extended thinking capabilities.',
        maxTokens: 4096,
        capabilities: ['chat', 'code', 'reasoning', 'vision'],
        defaultForProvider: true,
      },
      {
        id: 'claude-3-7-sonnet-thinking',
        provider: 'anthropic',
        name: 'Claude 3.7 Sonnet (Thinking)',
        description: 'Claude with enhanced thinking capabilities for complex reasoning tasks.',
        maxTokens: 4096,
        capabilities: ['chat', 'code', 'reasoning', 'vision', 'extended_thinking'],
        extended_thinking: true,
        extended_thinking_budget: 1024,
      },
      {
        id: 'claude-3-5-sonnet-v2',
        provider: 'anthropic',
        name: 'Claude 3.5 Sonnet v2',
        description: 'Upgraded model for software engineering and agentic capabilities.',
        maxTokens: 4096,
        capabilities: ['chat', 'code', 'reasoning', 'vision'],
      },
      {
        id: 'claude-3-5-haiku',
        provider: 'anthropic',
        name: 'Claude 3.5 Haiku',
        description: 'Fastest and most cost-effective model for code generation.',
        maxTokens: 4096,
        capabilities: ['chat', 'code', 'reasoning', 'vision'],
      },
      {
        id: 'claude-3-5-sonnet',
        provider: 'anthropic',
        name: 'Claude 3.5 Sonnet',
        description: 'Powerful AI model with top performance at higher speeds.',
        maxTokens: 4096,
        capabilities: ['chat', 'code', 'reasoning', 'vision'],
      },
      {
        id: 'claude-3-opus',
        provider: 'anthropic',
        name: 'Claude 3 Opus',
        description: 'Top-level performance on highly complex tasks.',
        maxTokens: 4096,
        capabilities: ['chat', 'code', 'reasoning', 'vision'],
      },
    ],
    defaultModel: 'claude-3-7-sonnet',
  },
  {
    id: 'google',
    name: 'Google',
    logo: '/logos/google.svg',
    models: [
      {
        id: 'gemini-1.5-pro',
        provider: 'google',
        name: 'Gemini 1.5 Pro',
        description: 'Google\'s most capable model with enhanced reasoning.',
        maxTokens: 8192,
        capabilities: ['chat', 'code', 'reasoning', 'vision'],
        defaultForProvider: true,
      },
      {
        id: 'gemini-1.5-flash',
        provider: 'google',
        name: 'Gemini 1.5 Flash',
        description: 'Faster, more efficient version of Gemini 1.5.',
        maxTokens: 8192,
        capabilities: ['chat', 'code', 'reasoning'],
      },
      {
        id: 'gemini-1.0-pro',
        provider: 'google',
        name: 'Gemini 1.0 Pro',
        description: 'Multimodal model for generating text, code, and more.',
        maxTokens: 8192,
        capabilities: ['chat', 'code', 'reasoning'],
      },
    ],
    defaultModel: 'gemini-1.5-pro',
  },
  {
    id: 'qwen',
    name: 'Qwen',
    logo: '/logos/qwen.svg',
    models: [
      {
        id: 'qwen-max',
        provider: 'qwen',
        name: 'Qwen Max',
        description: 'Qwen\'s flagship large language model.',
        maxTokens: 1000,
        capabilities: ['chat', 'code', 'reasoning'],
        defaultForProvider: true,
      },
    ],
    defaultModel: 'qwen-max',
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    logo: '/logos/deepseek.svg',
    models: [
      {
        id: 'deepseek-chat',
        provider: 'deepseek',
        name: 'DeepSeek Chat',
        description: 'Advanced conversational model from DeepSeek.',
        maxTokens: 1000,
        capabilities: ['chat', 'code', 'reasoning'],
        defaultForProvider: true,
      },
    ],
    defaultModel: 'deepseek-chat',
  },
];

// Helper functions to work with models
export const getProviderById = (providerId: string): AIProvider | undefined => {
  return AI_PROVIDERS.find(provider => provider.id === providerId);
};

export const getModelById = (modelId: string): AIModel | undefined => {
  for (const provider of AI_PROVIDERS) {
    const model = provider.models.find(model => model.id === modelId);
    if (model) return model;
  }
  return undefined;
};

export const getDefaultModel = (providerId: string): AIModel | undefined => {
  const provider = getProviderById(providerId);
  if (!provider) return undefined;
  
  // Find the default model for this provider
  const defaultModel = provider.models.find(model => model.defaultForProvider);
  if (defaultModel) return defaultModel;
  
  // If no default is marked, return the first model
  return provider.models[0];
}; 