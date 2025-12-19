/**
 * Universal AI Client
 *
 * Provides a unified interface for generating content using different AI providers.
 * Supports user-specific settings with fallback to system defaults.
 */

import { createClient } from '@/lib/supabase/server';
import {
  AIProvider,
  GenerateOptions,
  getProviderAdapter,
  getRecommendedModel,
} from './ai-providers';

// Simple encryption for API keys (uses base64 + reversal for basic obfuscation)
// In production, consider using proper encryption with a secret key
export function encryptApiKey(apiKey: string): string {
  return Buffer.from(apiKey.split('').reverse().join('')).toString('base64');
}

export function decryptApiKey(encrypted: string): string {
  return Buffer.from(encrypted, 'base64').toString('utf-8').split('').reverse().join('');
}

// Mask API key for display (show only last 4 chars)
export function maskApiKey(apiKey: string): string {
  if (apiKey.length <= 8) return '••••••••';
  return `••••••••${apiKey.slice(-4)}`;
}

export interface AISettings {
  provider: AIProvider;
  model: string | null;
  apiKey: string | null; // null = use system key
}

// Default settings
const DEFAULT_SETTINGS: AISettings = {
  provider: 'anthropic',
  model: 'claude-sonnet-4-5-20250929',
  apiKey: null,
};

// Get AI settings for a user
export async function getUserAISettings(userId: string): Promise<AISettings> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('ai_settings')
      .select('provider, model, api_key_encrypted')
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return DEFAULT_SETTINGS;
    }

    return {
      provider: data.provider as AIProvider,
      model: data.model,
      apiKey: data.api_key_encrypted ? decryptApiKey(data.api_key_encrypted) : null,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

// Get API key for provider (user key or system fallback)
function getApiKey(settings: AISettings): string {
  // If user has their own key, use it
  if (settings.apiKey) {
    return settings.apiKey;
  }

  // Fall back to system keys from environment
  switch (settings.provider) {
    case 'anthropic':
      return process.env.ANTHROPIC_API_KEY || '';
    case 'openai':
      return process.env.OPENAI_API_KEY || '';
    case 'google':
      return process.env.GOOGLE_AI_API_KEY || '';
    default:
      return '';
  }
}

export interface GenerateWithAIOptions extends GenerateOptions {
  userId?: string; // Optional - will use system defaults if not provided
}

/**
 * Generate content using AI with user settings
 */
export async function generateWithAI(options: GenerateWithAIOptions): Promise<string> {
  // Get user settings or use defaults
  const settings = options.userId
    ? await getUserAISettings(options.userId)
    : DEFAULT_SETTINGS;

  // Get the appropriate provider adapter
  const adapter = getProviderAdapter(settings.provider);

  // Get API key (user's or system's)
  const apiKey = getApiKey(settings);

  if (!apiKey) {
    throw new Error(
      `No API key configured for ${settings.provider}. ` +
        'Please add your API key in Settings or contact support.'
    );
  }

  // Get model to use (from settings or provider's recommended)
  const recommendedModel = getRecommendedModel(settings.provider);
  const modelId = settings.model || recommendedModel?.id || '';
  const keySource = settings.apiKey ? 'user' : 'system';

  // Log which provider and model is being used
  console.log(`\n╔════════════════════════════════════════════════════════════╗`);
  console.log(`║  🤖 AI GENERATION REQUEST                                  ║`);
  console.log(`╠════════════════════════════════════════════════════════════╣`);
  console.log(`║  Provider: ${settings.provider.toUpperCase().padEnd(47)}║`);
  console.log(`║  Model:    ${modelId.padEnd(47)}║`);
  console.log(`║  API Key:  ${(keySource + ' key').padEnd(47)}║`);
  console.log(`╚════════════════════════════════════════════════════════════╝`);

  const startTime = Date.now();

  // Generate using the selected provider with specified model
  const result = await adapter.generate(
    {
      prompt: options.prompt,
      systemPrompt: options.systemPrompt,
      maxTokens: options.maxTokens,
      model: modelId, // Pass model to adapter
    },
    apiKey
  );

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`[AI] ✅ ${settings.provider.toUpperCase()} response received in ${elapsed}s (${result.length} chars)`);

  return result;
}

/**
 * Test an API key for a specific provider
 */
export async function testApiKey(
  provider: AIProvider,
  apiKey: string
): Promise<{ valid: boolean; error?: string }> {
  const adapter = getProviderAdapter(provider);
  return adapter.testConnection(apiKey);
}

/**
 * Parse JSON response from AI (removes markdown code blocks if present)
 */
export function parseJSONResponse<T>(response: string): T {
  let cleaned = response.trim();

  // Remove markdown code blocks if present
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }
  cleaned = cleaned.trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch (error) {
    const repaired = repairTruncatedJson(cleaned);
    if (repaired) {
      try {
        return JSON.parse(repaired) as T;
      } catch {
        // Fall through to rethrow original error.
      }
    }
    throw error;
  }
}

function repairTruncatedJson(text: string): string | null {
  const start = text.indexOf('{');
  if (start === -1) return null;

  let inString = false;
  let escapeNext = false;
  const stack: string[] = [];
  let lastCompleteIndex = -1;

  for (let i = start; i < text.length; i += 1) {
    const ch = text[i];

    if (inString) {
      if (escapeNext) {
        escapeNext = false;
        continue;
      }
      if (ch === '\\') {
        escapeNext = true;
        continue;
      }
      if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
      continue;
    }

    if (ch === '{' || ch === '[') {
      stack.push(ch);
      continue;
    }

    if (ch === '}' || ch === ']') {
      if (stack.length > 0) {
        stack.pop();
      }
      if (stack.length === 0) {
        lastCompleteIndex = i;
      }
    }
  }

  if (lastCompleteIndex !== -1) {
    return text.slice(start, lastCompleteIndex + 1);
  }

  let repaired = text.slice(start);
  if (inString) {
    repaired += '"';
  }
  for (let i = stack.length - 1; i >= 0; i -= 1) {
    repaired += stack[i] === '{' ? '}' : ']';
  }

  return repaired;
}

// Re-export for convenience
export { AI_MODELS, getModelsForProvider, getRecommendedModel, PROVIDER_NAMES } from './ai-providers';
export type { AIProvider, AIModel } from './ai-providers';
