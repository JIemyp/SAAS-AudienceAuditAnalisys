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

  // OpenAI (GPT)
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'openai',
    recommended: true,
    description: 'Most capable GPT model',
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
    id: 'o1',
    name: 'O1 (Reasoning)',
    provider: 'openai',
    description: 'Advanced reasoning model',
    inputPrice: '$15',
    outputPrice: '$60',
  },

  // Google (Gemini)
  {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    provider: 'google',
    recommended: true,
    description: 'Fast and capable',
    inputPrice: 'Free tier available',
    outputPrice: 'Free tier available',
  },
  {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    provider: 'google',
    description: 'Advanced capabilities',
    inputPrice: '$1.25',
    outputPrice: '$5',
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
