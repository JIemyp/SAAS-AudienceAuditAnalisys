// =====================================================
// Increase timeout for AI generation
export const maxDuration = 60;

// Generate Strategy Ads - V6 MODULE (Per Segment × Top Pain)
// Creates multi-channel paid ads strategy (Google, Meta, Pinterest, TikTok, etc.)
// =====================================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireWriteAccess } from "@/lib/permissions";
import { generateWithAI, parseJSONResponse } from "@/lib/ai-client";
import { handleApiError, ApiError, withRetry } from "@/lib/api-utils";
import { Project, OnboardingData, Segment, StrategyAds } from "@/types";

// Channel object schema from PROMPTS_V6.md
interface AdsChannelConfig {
  objective: string;
  campaign_structure: string;
  keyword_themes: string[];
  ad_copy_templates: Array<{
    headline: string;
    description: string;
    cta: string;
  }>;
  audience_targeting: string;
  budget_allocation: string;
  creative_specs: string;
  placements: string[];
  exclusions: string[];
  landing_angle: string;
}

interface StrategyAdsResponse {
  channels: {
    google?: AdsChannelConfig;
    pinterest?: AdsChannelConfig;
    reddit?: AdsChannelConfig;
    meta?: AdsChannelConfig;
    tiktok?: AdsChannelConfig;
    youtube?: AdsChannelConfig;
  };
}

interface PainData {
  id: string;
  name: string;
  description: string;
  impact_score: number;
}

function buildStrategyAdsPrompt(
  onboarding: OnboardingData,
  segment: Segment,
  pain: PainData,
  research: Record<string, unknown>
): string {
  return `You are a paid media strategist. Build a multi-channel ads plan in strict JSON.

## Global Output Rules
1. Return ONLY JSON. No markdown, no comments, no prose outside JSON.
2. Use double quotes for all keys and string values.
3. Do NOT include unescaped line breaks inside strings. Use "\\n" if needed.
4. No trailing commas.
5. Output language: English.

## Business Context
- Brand: ${onboarding.brandName || "N/A"}
- Product/Service: ${onboarding.productService || "N/A"}
- Product Format: ${onboarding.productFormat || "N/A"}
- USP: ${onboarding.usp || "N/A"}
- Business Model: ${onboarding.businessModel || "N/A"}
- Price Segment: ${onboarding.priceSegment || "N/A"}
- Geography: ${onboarding.geography || "N/A"}

## Segment
- segment_id: ${segment.id}
- name: ${segment.name}
- description: ${segment.description || "N/A"}
- sociodemographics: ${segment.sociodemographics || "N/A"}

## Pain (TOP PAIN)
- pain_id: ${pain.id}
- name: ${pain.name}
- description: ${pain.description}
- impact_score: ${pain.impact_score}

## Research Data
${JSON.stringify(research, null, 2)}

## Your Task
Generate paid ads strategy for ALL 6 channels: google, pinterest, reddit, meta, tiktok, youtube.
Each channel must have the full structure.

## Platform Constraints
- Google: headline <= 30 chars, description <= 90 chars
- Pinterest: headline <= 100 chars, description <= 500 chars
- TikTok: hook <= 70 chars
- Reddit: headline <= 150 chars

## REQUIRED JSON OUTPUT:
{
  "channels": {
    "google": {
      "objective": "string",
      "campaign_structure": "string",
      "keyword_themes": ["string"],
      "ad_copy_templates": [
        { "headline": "string", "description": "string", "cta": "string" }
      ],
      "audience_targeting": "string",
      "budget_allocation": "string",
      "creative_specs": "string",
      "placements": ["string"],
      "exclusions": ["string"],
      "landing_angle": "string"
    },
    "pinterest": { ... },
    "reddit": { ... },
    "meta": { ... },
    "tiktok": { ... },
    "youtube": { ... }
  }
}

## MINIMUM REQUIREMENTS (per channel):
- keyword_themes: 6 items
- ad_copy_templates: 3 items
- placements: 2 items
- exclusions: 3 items

Return ONLY valid JSON. No markdown, no explanations.`;
}

export async function POST(request: NextRequest) {
  try {
    const { projectId, segmentId, painId } = await request.json();

    if (!projectId) throw new ApiError("Project ID is required", 400);
    if (!segmentId) throw new ApiError("Segment ID is required", 400);
    if (!painId) throw new ApiError("Pain ID is required", 400);

    const supabase = await createServerClient();
    const adminSupabase = createAdminClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new ApiError("Unauthorized", 401);
    }

    await requireWriteAccess(supabase, adminSupabase, projectId, user.id);

    // Get project
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      throw new ApiError("Project not found", 404);
    }

    const typedProject = project as Project;

    // Get segment
    const { data: segment, error: segmentError } = await supabase
      .from("segments")
      .select("*")
      .eq("id", segmentId)
      .eq("project_id", projectId)
      .single();

    if (segmentError || !segment) {
      throw new ApiError("Segment not found", 404);
    }

    // Get pain and verify it's a top pain
    const { data: pain, error: painError } = await supabase
      .from("pains_ranking")
      .select("*")
      .eq("id", painId)
      .eq("project_id", projectId)
      .eq("segment_id", segmentId)
      .eq("is_top_pain", true)
      .single();

    if (painError || !pain) {
      throw new ApiError("Top pain not found. Only top pains can be used for ads strategy.", 404);
    }

    // Gather research data
    const [
      { data: channelStrategy },
      { data: canvas },
    ] = await Promise.all([
      supabase.from("channel_strategy").select("*").eq("project_id", projectId).eq("segment_id", segmentId).order("approved_at", { ascending: false }).limit(1).single(),
      supabase.from("canvas").select("*").eq("project_id", projectId).eq("segment_id", segmentId).eq("pain_id", painId).order("approved_at", { ascending: false }).limit(1).single(),
    ]);

    const research = {
      channel_strategy: channelStrategy || null,
      canvas: canvas || null,
    };

    const prompt = buildStrategyAdsPrompt(
      typedProject.onboarding_data,
      segment as Segment,
      { id: pain.id, name: pain.name, description: pain.description, impact_score: pain.impact_score },
      research
    );

    const response = await withRetry(async () => {
      const text = await generateWithAI({ prompt, maxTokens: 8000, userId: user.id });
      return parseJSONResponse<StrategyAdsResponse>(text);
    });

    // Check existing draft
    const { data: existingDraft } = await supabase
      .from("strategy_ads_drafts")
      .select("id")
      .eq("project_id", projectId)
      .eq("segment_id", segmentId)
      .eq("pain_id", painId)
      .single();

    if (existingDraft) {
      const { data: draft, error: updateError } = await supabase
        .from("strategy_ads_drafts")
        .update({
          channels: response.channels,
          version: 1,
        })
        .eq("id", existingDraft.id)
        .select()
        .single();

      if (updateError) {
        throw new ApiError("Failed to update draft", 500);
      }

      return NextResponse.json({ success: true, draft, updated: true });
    }

    const { data: draft, error: insertError } = await supabase
      .from("strategy_ads_drafts")
      .insert({
        project_id: projectId,
        segment_id: segmentId,
        pain_id: painId,
        channels: response.channels,
        version: 1,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      throw new ApiError("Failed to save draft", 500);
    }

    return NextResponse.json({ success: true, draft });
  } catch (error) {
    return handleApiError(error);
  }
}
