import Anthropic from '@anthropic-ai/sdk';
import { AIProviderAdapter, GenerateOptions } from './types';

export const anthropicAdapter: AIProviderAdapter = {
  provider: 'anthropic',

  async generate(options: GenerateOptions, apiKey: string): Promise<string> {
    const client = new Anthropic({ apiKey });

    const response = await client.messages.create({
      model: options.maxTokens && options.maxTokens > 8000
        ? 'claude-sonnet-4-5-20250929' // Use Sonnet for larger outputs
        : 'claude-sonnet-4-5-20250929',
      max_tokens: options.maxTokens || 4096,
      ...(options.systemPrompt && { system: options.systemPrompt }),
      messages: [
        {
          role: 'user',
          content: options.prompt,
        },
      ],
    });

    const textBlock = response.content.find(block => block.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('No text response from Claude');
    }

    return textBlock.text;
  },

  async testConnection(apiKey: string): Promise<{ valid: boolean; error?: string }> {
    try {
      const client = new Anthropic({ apiKey });

      // Make a minimal request to verify the key
      await client.messages.create({
        model: 'claude-haiku-4-5-20251001', // Use cheapest model for testing
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Hi' }],
      });

      return { valid: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';

      if (message.includes('401') || message.includes('invalid_api_key')) {
        return { valid: false, error: 'Invalid API key' };
      }
      if (message.includes('403') || message.includes('permission')) {
        return { valid: false, error: 'API key lacks required permissions' };
      }
      if (message.includes('429')) {
        return { valid: false, error: 'Rate limited - try again later' };
      }

      return { valid: false, error: message };
    }
  },
};
