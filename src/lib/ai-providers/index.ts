// AI Providers - Export all adapters and types

export * from './types';
export { anthropicAdapter } from './anthropic';
export { openaiAdapter } from './openai';
export { googleAdapter } from './google';

import { AIProvider, AIProviderAdapter } from './types';
import { anthropicAdapter } from './anthropic';
import { openaiAdapter } from './openai';
import { googleAdapter } from './google';

// Get adapter for a specific provider
export function getProviderAdapter(provider: AIProvider): AIProviderAdapter {
  switch (provider) {
    case 'anthropic':
      return anthropicAdapter;
    case 'openai':
      return openaiAdapter;
    case 'google':
      return googleAdapter;
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }
}
