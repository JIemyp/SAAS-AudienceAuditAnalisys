import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIProviderAdapter, GenerateOptions } from './types';

export const googleAdapter: AIProviderAdapter = {
  provider: 'google',

  async generate(options: GenerateOptions, apiKey: string): Promise<string> {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-3-pro-preview' });

    // Combine system prompt with user prompt if provided
    const fullPrompt = options.systemPrompt
      ? `${options.systemPrompt}\n\n${options.prompt}`
      : options.prompt;

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
      generationConfig: {
        maxOutputTokens: options.maxTokens || 4096,
      },
    });

    const response = result.response;
    const text = response.text();

    if (!text) {
      throw new Error('No response from Gemini');
    }

    return text;
  },

  async testConnection(apiKey: string): Promise<{ valid: boolean; error?: string }> {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' }); // Use cheaper model for testing

      // Make a minimal request to verify the key
      await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: 'Hi' }] }],
        generationConfig: { maxOutputTokens: 10 },
      });

      return { valid: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';

      if (message.includes('API_KEY_INVALID') || message.includes('invalid')) {
        return { valid: false, error: 'Invalid API key' };
      }
      if (message.includes('PERMISSION_DENIED')) {
        return { valid: false, error: 'API key lacks required permissions' };
      }
      if (message.includes('RESOURCE_EXHAUSTED') || message.includes('429')) {
        return { valid: false, error: 'Rate limited - try again later' };
      }

      return { valid: false, error: message };
    }
  },
};
