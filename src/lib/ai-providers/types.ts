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

  // OpenAI (GPT-5.2) - Released December 11, 2025
  {
    id: 'gpt-5.2',
    name: 'GPT-5.2',
    provider: 'openai',
    recommended: true,
    description: 'Best for coding and agentic tasks',
    inputPrice: '$1.75',
    outputPrice: '$14',
  },
  {
    id: 'gpt-5.2-pro',
    name: 'GPT-5.2 Pro',
    provider: 'openai',
    description: 'Smartest, most precise model',
    inputPrice: '$21',
    outputPrice: '$168',
  },
  {
    id: 'gpt-5-mini',
    name: 'GPT-5 Mini',
    provider: 'openai',
    description: 'Faster, more affordable',
    inputPrice: '$0.25',
    outputPrice: '$2',
  },

  // Google (Gemini 3) - Released November 2025
  {
    id: 'gemini-3-pro-preview',
    name: 'Gemini 3 Pro',
    provider: 'google',
    recommended: true,
    description: 'Most powerful, best for reasoning',
    inputPrice: '$2',
    outputPrice: '$12',
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    provider: 'google',
    description: 'Best for coding tasks',
    inputPrice: '$1.25',
    outputPrice: '$10',
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'google',
    description: 'Fast hybrid reasoning',
    inputPrice: '$0.15',
    outputPrice: '$0.60',
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
