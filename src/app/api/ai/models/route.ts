import { NextResponse } from 'next/server';
import {
  AI_MODELS,
  getModelsForProvider,
  PROVIDER_NAMES,
  AIProvider,
} from '@/lib/ai-providers';

// GET - Return available AI models
export async function GET() {
  try {
    const providers: AIProvider[] = ['anthropic', 'openai', 'google'];

    const response = {
      providers: providers.map(p => ({
        id: p,
        name: PROVIDER_NAMES[p],
        models: getModelsForProvider(p),
      })),
      allModels: AI_MODELS,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching AI models:', error);
    return NextResponse.json(
      { error: 'Failed to fetch models' },
      { status: 500 }
    );
  }
}
