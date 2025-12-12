// AI Provider Types

export type AIProvider = 'anthropic' | 'openai' | 'google';

export interface AIModel {
  id: string;
  name: string;
  provider: AIProvider;
  recommended?: boolean;
  description?: string;
  inputPrice?: string;  // per 1M tokens
  outputPrice?: string; // per 1M tokens
}

export interface GenerateOptions {
  prompt: string;
  systemPrompt?: string;
  maxTokens?: number;
  model?: string; // Model ID to use (overrides default)
}

export interface AIProviderAdapter {
  provider: AIProvider;

  // Generate text completion
  generate(options: GenerateOptions, apiKey: string): Promise<string>;

  // Test if API key is valid
  testConnection(apiKey: string): Promise<{ valid: boolean; error?: string }>;
}

// Available models per provider
export const AI_MODELS: AIModel[] = [
  // Anthropic (Claude)
  {
    id: 'claude-sonnet-4-5-20250929',
    name: 'Claude Sonnet 4.5',
    provider: 'anthropic',
    recommended: true,
    description: 'Best balance of intelligence and speed',
    inputPrice: '$3',
    outputPrice: '$15',
  },
  {
    id: 'claude-opus-4-5-20251101',
    name: 'Claude Opus 4.5',
    provider: 'anthropic',
    description: 'Maximum intelligence',
    inputPrice: '$5',
    outputPrice: '$25',
  },
  {
    id: 'claude-haiku-4-5-20251001',
    name: 'Claude Haiku 4.5',
    provider: 'anthropic',
    description: 'Fastest, most affordable',
    inputPrice: '$1',
    outputPrice: '$5',
  },

  // OpenAI (GPT-4 family) - December 2025
  // Prices are Standard tier per 1M tokens
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'openai',
    recommended: true,
    description: 'Best for most tasks, multimodal',
    inputPrice: '$2.50',
    outputPrice: '$10',
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'openai',
    description: 'Fast and affordable',
    inputPrice: '$0.15',
    outputPrice: '$0.60',
  },
  {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    provider: 'openai',
    description: 'High capability, 128K context',
    inputPrice: '$10',
    outputPrice: '$30',
  },
  {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    provider: 'openai',
    description: 'Fast, cheapest option',
    inputPrice: '$0.50',
    outputPrice: '$1.50',
  },
  {
    id: 'o1',
    name: 'o1 (Reasoning)',
    provider: 'openai',
    description: 'Advanced reasoning model',
    inputPrice: '$15',
    outputPrice: '$60',
  },
  {
    id: 'o1-mini',
    name: 'o1-mini (Reasoning)',
    provider: 'openai',
    description: 'Fast reasoning model',
    inputPrice: '$3',
    outputPrice: '$12',
  },

  // Google (Gemini) - December 2025
  {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    provider: 'google',
    recommended: true,
    description: 'Most capable, 2M context',
    inputPrice: '$1.25',
    outputPrice: '$5',
  },
  {
    id: 'gemini-1.5-flash',
    name: 'Gemini 1.5 Flash',
    provider: 'google',
    description: 'Fast and efficient',
    inputPrice: '$0.075',
    outputPrice: '$0.30',
  },
  {
    id: 'gemini-1.5-flash-8b',
    name: 'Gemini 1.5 Flash-8B',
    provider: 'google',
    description: 'Ultra-fast, cheapest',
    inputPrice: '$0.0375',
    outputPrice: '$0.15',
  },
];

// Get models for a specific provider
export function getModelsForProvider(provider: AIProvider): AIModel[] {
  return AI_MODELS.filter(m => m.provider === provider);
}

// Get recommended model for provider
export function getRecommendedModel(provider: AIProvider): AIModel | undefined {
  return AI_MODELS.find(m => m.provider === provider && m.recommended);
}

// Get model by ID
export function getModelById(modelId: string): AIModel | undefined {
  return AI_MODELS.find(m => m.id === modelId);
}

// Provider display names
export const PROVIDER_NAMES: Record<AIProvider, string> = {
  anthropic: 'Anthropic (Claude)',
  openai: 'OpenAI (GPT)',
  google: 'Google (Gemini)',
};
