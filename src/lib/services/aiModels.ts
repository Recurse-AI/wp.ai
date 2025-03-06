export interface AIModel {
  id: string;
  provider: string;
  name: string;
  description: string;
  maxTokens: number;
  capabilities: string[];
  defaultForProvider?: boolean;
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
        id: 'gpt-4-turbo',
        provider: 'openai',
        name: 'GPT-4 Turbo',
        description: 'Most capable GPT-4 model, optimized for speed and cost.',
        maxTokens: 8192,
        capabilities: ['chat', 'code', 'reasoning'],
        defaultForProvider: true,
      },
      {
        id: 'gpt-4-vision',
        provider: 'openai',
        name: 'GPT-4 Vision',
        description: 'Accepts images as input alongside text.',
        maxTokens: 4096,
        capabilities: ['chat', 'code', 'reasoning', 'vision'],
      },
      {
        id: 'gpt-3.5-turbo',
        provider: 'openai',
        name: 'GPT-3.5 Turbo',
        description: 'Faster, more cost-effective for simpler tasks.',
        maxTokens: 4096,
        capabilities: ['chat', 'code'],
      },
    ],
    defaultModel: 'gpt-4-turbo',
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    logo: '/logos/anthropic.svg',
    models: [
      {
        id: 'claude-3-opus',
        provider: 'anthropic',
        name: 'Claude 3 Opus',
        description: 'Most powerful Claude model with expert reasoning.',
        maxTokens: 200000,
        capabilities: ['chat', 'code', 'reasoning', 'vision'],
        defaultForProvider: true,
      },
      {
        id: 'claude-3-sonnet',
        provider: 'anthropic',
        name: 'Claude 3 Sonnet',
        description: 'Balanced performance for most tasks.',
        maxTokens: 200000,
        capabilities: ['chat', 'code', 'reasoning', 'vision'],
      },
      {
        id: 'claude-3-haiku',
        provider: 'anthropic',
        name: 'Claude 3 Haiku',
        description: 'Fastest and most cost-effective Claude model.',
        maxTokens: 200000,
        capabilities: ['chat', 'code', 'reasoning', 'vision'],
      },
    ],
    defaultModel: 'claude-3-opus',
  },
  {
    id: 'mistral',
    name: 'Mistral AI',
    logo: '/logos/mistral.svg',
    models: [
      {
        id: 'mistral-large',
        provider: 'mistral',
        name: 'Mistral Large',
        description: 'Most powerful Mistral model.',
        maxTokens: 32768,
        capabilities: ['chat', 'code', 'reasoning'],
        defaultForProvider: true,
      },
      {
        id: 'mistral-medium',
        provider: 'mistral',
        name: 'Mistral Medium',
        description: 'Balanced performance for most tasks.',
        maxTokens: 32768,
        capabilities: ['chat', 'code', 'reasoning'],
      },
      {
        id: 'mistral-small',
        provider: 'mistral',
        name: 'Mistral Small',
        description: 'Fast and cost-effective Mistral model.',
        maxTokens: 32768,
        capabilities: ['chat', 'code', 'reasoning'],
      },
    ],
    defaultModel: 'mistral-large',
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