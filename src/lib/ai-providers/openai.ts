import OpenAI from 'openai';
import { AIProviderAdapter, GenerateOptions } from './types';

type ResponseOutput = OpenAI.Beta.Responses.Response['output'];

function isResponsesOnlyModel(modelId: string): boolean {
  return (
    modelId.startsWith('gpt-5') ||
    modelId.startsWith('gpt-4.1') ||
    modelId.startsWith('o3') ||
    modelId.startsWith('o4')
  );
}

function extractTextFromOutput(output?: ResponseOutput): string[] {
  if (!output) return [];

  const chunks: string[] = [];

  for (const block of output) {
    const blockAny = block as { content?: Array<any> };
    if (!Array.isArray(blockAny.content)) continue;

    for (const part of blockAny.content) {
      if (typeof part === 'string') {
        chunks.push(part);
        continue;
      }

      if (part && typeof part === 'object') {
        if ('text' in part && typeof part.text === 'string') {
          chunks.push(part.text);
          continue;
        }

        if ('content' in part && Array.isArray(part.content)) {
          for (const nested of part.content) {
            if (nested && typeof nested === 'object' && 'text' in nested && typeof nested.text === 'string') {
              chunks.push(nested.text);
            }
          }
        }
      }
    }
  }

  return chunks;
}

export const openaiAdapter: AIProviderAdapter = {
  provider: 'openai',

  async generate(options: GenerateOptions, apiKey: string): Promise<string> {
    const client = new OpenAI({ apiKey });

    // Use model from options, or default to gpt-5.2
    const modelId = options.model || 'gpt-5.2';

    // gpt-5.x / o-series / gpt-4.1 only support the Responses API
    if (isResponsesOnlyModel(modelId)) {
      const prompt = options.systemPrompt
        ? `System:\n${options.systemPrompt}\n\nUser:\n${options.prompt}`
        : options.prompt;

      const response = await client.responses.create({
        model: modelId,
        max_output_tokens: options.maxTokens || 4096,
        input: prompt,
      });

      const content =
        (Array.isArray(response.output_text) && response.output_text.join('\n').trim()) ||
        extractTextFromOutput(response.output).join('').trim() ||
        null;

      if (!content) {
        throw new Error('No response from OpenAI');
      }
      return content;
    }

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
        max_completion_tokens: 10,
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
