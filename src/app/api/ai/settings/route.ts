import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  encryptApiKey,
  decryptApiKey,
  maskApiKey,
  testApiKey,
} from '@/lib/ai-client';
import { AIProvider, getModelsForProvider, getRecommendedModel } from '@/lib/ai-providers';

// GET - Fetch user's AI settings
export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('ai_settings')
      .select('provider, model, api_key_encrypted, updated_at')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      throw error;
    }

    // Return default settings if none exist
    if (!data) {
      const recommended = getRecommendedModel('anthropic');
      return NextResponse.json({
        provider: 'anthropic',
        model: recommended?.id || 'claude-sonnet-4-5-20250929',
        hasApiKey: false,
        apiKeyMasked: null,
        updatedAt: null,
      });
    }

    return NextResponse.json({
      provider: data.provider,
      model: data.model,
      hasApiKey: !!data.api_key_encrypted,
      apiKeyMasked: data.api_key_encrypted
        ? maskApiKey(decryptApiKey(data.api_key_encrypted))
        : null,
      updatedAt: data.updated_at,
    });
  } catch (error) {
    console.error('Error fetching AI settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// PATCH - Update user's AI settings
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { provider, model, apiKey } = body as {
      provider?: AIProvider;
      model?: string;
      apiKey?: string | null; // null to remove key, undefined to keep existing
    };

    // Validate provider
    if (provider && !['anthropic', 'openai', 'google'].includes(provider)) {
      return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
    }

    // Validate model belongs to provider
    if (provider && model) {
      const providerModels = getModelsForProvider(provider);
      if (!providerModels.some(m => m.id === model)) {
        return NextResponse.json(
          { error: 'Model does not belong to selected provider' },
          { status: 400 }
        );
      }
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (provider !== undefined) {
      updateData.provider = provider;
    }

    if (model !== undefined) {
      updateData.model = model;
    }

    // Handle API key
    if (apiKey === null) {
      // Remove API key (use system key)
      updateData.api_key_encrypted = null;
    } else if (apiKey !== undefined && apiKey.trim() !== '') {
      // Encrypt and save new API key
      updateData.api_key_encrypted = encryptApiKey(apiKey.trim());
    }

    // Upsert settings
    const { data, error } = await supabase
      .from('ai_settings')
      .upsert(
        {
          user_id: user.id,
          ...updateData,
        },
        {
          onConflict: 'user_id',
        }
      )
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      provider: data.provider,
      model: data.model,
      hasApiKey: !!data.api_key_encrypted,
      apiKeyMasked: data.api_key_encrypted
        ? maskApiKey(decryptApiKey(data.api_key_encrypted))
        : null,
    });
  } catch (error) {
    console.error('Error updating AI settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}

// POST - Test API key
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { provider, apiKey } = body as {
      provider: AIProvider;
      apiKey: string;
    };

    if (!provider || !apiKey) {
      return NextResponse.json(
        { error: 'Provider and API key are required' },
        { status: 400 }
      );
    }

    // Test the API key
    const result = await testApiKey(provider, apiKey);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error testing API key:', error);
    return NextResponse.json(
      { valid: false, error: 'Failed to test API key' },
      { status: 500 }
    );
  }
}
