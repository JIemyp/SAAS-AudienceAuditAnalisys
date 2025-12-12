import OpenAI from 'openai';
import { AIProviderAdapter, GenerateOptions } from './types';

export const openaiAdapter: AIProviderAdapter = {
  provider: 'openai',

  async generate(options: GenerateOptions, apiKey: string): Promise<string> {
    const client = new OpenAI({ apiKey });

    // Use model from options, or default to gpt-5.2
    const modelId = options.model || 'gpt-5.2';

    const response = await client.chat.completions.create({
      model: modelId,
      max_tokens: options.maxTokens || 4096,
      messages: [
        ...(options.systemPrompt
          ? [{ role: 'system' as const, content: options.systemPrompt }]
          : []),
        { role: 'user' as const, content: options.prompt },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    return content;
  },

  async testConnection(apiKey: string): Promise<{ valid: boolean; error?: string }> {
    try {
      const client = new OpenAI({ apiKey });

      // Make a minimal request to verify the key
      await client.chat.completions.create({
        model: 'gpt-5-mini', // Use cheapest model for testing
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Hi' }],
      });

      return { valid: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';

      if (message.includes('401') || message.includes('Incorrect API key')) {
        return { valid: false, error: 'Invalid API key' };
      }
      if (message.includes('403') || message.includes('permission')) {
        return { valid: false, error: 'API key lacks required permissions' };
      }
      if (message.includes('429')) {
        return { valid: false, error: 'Rate limited - try again later' };
      }
      if (message.includes('insufficient_quota')) {
        return { valid: false, error: 'Insufficient quota - check your billing' };
      }

      return { valid: false, error: message };
    }
  },
};
