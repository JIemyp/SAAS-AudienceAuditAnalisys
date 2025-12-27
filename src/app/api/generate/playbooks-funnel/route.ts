// =====================================================
// Increase timeout for AI generation
export const maxDuration = 60;

// Generate Playbooks Funnel Assets - V7 MODULE (Per Segment × Top Pain)
// Creates TOF/MOF/BOF funnel assets for content marketing
// =====================================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireWriteAccess } from "@/lib/permissions";
import { generateWithAI, parseJSONResponse } from "@/lib/ai-client";
import { handleApiError, ApiError, withRetry } from "@/lib/api-utils";
import {
  Project,
  OnboardingData,
  Segment,
  PainInitial,
  StrategyPersonalized,
  CommunicationsFunnel,
  ChannelStrategy,
  PricingPsychology,
  TrustFramework,
  CompetitiveIntelligence,
  JTBDContext,
} from "@/types";

// Response type matching PROMPTS_V7.md
interface PlaybooksFunnelResponse {
  tof_assets: Array<{
    format: string;
    message: string;
    cta: string;
  }>;
  mof_assets: Array<{
    format: string;
    message: string;
    cta: string;
  }>;
  bof_assets: Array<{
    format: string;
    message: string;
    cta: string;
  }>;
}

function buildPlaybooksFunnelPrompt(
  onboarding: OnboardingData,
  segment: Segment,
  pain: PainInitial,
  strategyPersonalized: StrategyPersonalized | null,
  communicationsFunnel: CommunicationsFunnel | null,
  channelStrategy: ChannelStrategy | null,
  pricingPsychology: PricingPsychology | null,
  trustFramework: TrustFramework | null,
  competitiveIntelligence: CompetitiveIntelligence | null,
  jtbdContext: JTBDContext | null
): string {
  return `You are a funnel copywriter. Produce TOF/MOF/BOF assets in strict JSON.

## Global Output Rules
1. Return ONLY JSON. No markdown, no comments, no prose outside JSON.
2. Use double quotes for all keys and string values.
3. Do NOT include unescaped line breaks inside strings. Use "\\n" if needed.
4. No trailing commas.
5. Output language: English.
6. Keep each string under 240 characters.

## Business Context
- Brand: ${onboarding.brandName || "N/A"}
- Product/Service: ${onboarding.productService || "N/A"}
- USP: ${onboarding.usp || "N/A"}
- Price Segment: ${onboarding.priceSegment || "N/A"}

## Segment
- Name: ${segment.name}
- Description: ${segment.description || "N/A"}

## Pain (Top Pain)
- Name: ${pain.name}
- Description: ${pain.description || "N/A"}

## Strategy Personalized
${strategyPersonalized ? JSON.stringify(strategyPersonalized, null, 2) : "Not available"}

## Communications Funnel
${communicationsFunnel ? JSON.stringify(communicationsFunnel, null, 2) : "Not available"}

## Channel Strategy
${channelStrategy ? JSON.stringify(channelStrategy, null, 2) : "Not available"}

## Pricing Psychology
${pricingPsychology ? JSON.stringify(pricingPsychology, null, 2) : "Not available"}

## Trust Framework
${trustFramework ? JSON.stringify(trustFramework, null, 2) : "Not available"}

## Competitive Intelligence
${competitiveIntelligence ? JSON.stringify(competitiveIntelligence, null, 2) : "Not available"}

## JTBD Context
${jtbdContext ? JSON.stringify(jtbdContext, null, 2) : "Not available"}

## Your Task

Create funnel assets for segment "${segment.name}" addressing pain "${pain.name}".

Structure:
1. **TOF Assets** (Top of Funnel - Awareness): 4 assets
   - format: Asset type (e.g., "UGC video", "Carousel post", "Quiz", "Explainer video")
   - message: Core message/hook
   - cta: Call-to-action

2. **MOF Assets** (Middle of Funnel - Consideration): 4 assets
   - format: Asset type (e.g., "Landing section", "Email nurture", "Chat-bot question set", "Comparison guide")
   - message: Core message
   - cta: Call-to-action

3. **BOF Assets** (Bottom of Funnel - Conversion): 4 assets
   - format: Asset type (e.g., "Offer breakdown", "DM script", "Retargeting creative", "Sales page section")
   - message: Core message
   - cta: Call-to-action

## REQUIRED JSON OUTPUT:

{
  "tof_assets": [
    {
      "format": "string (asset type)",
      "message": "string (core message/hook)",
      "cta": "string (call-to-action)"
    }
  ],
  "mof_assets": [
    {
      "format": "string (asset type)",
      "message": "string (core message)",
      "cta": "string (call-to-action)"
    }
  ],
  "bof_assets": [
    {
      "format": "string (asset type)",
      "message": "string (core message)",
      "cta": "string (call-to-action)"
    }
  ]
}

## MINIMUM REQUIREMENTS:
- tof_assets: 4 items
- mof_assets: 4 items
- bof_assets: 4 items

Return ONLY valid JSON. No markdown, no explanations.`;
}

export async function POST(request: NextRequest) {
  try {
    const { projectId, segmentId, painId } = await request.json();

    if (!projectId) {
      throw new ApiError("Project ID is required", 400);
    }

    if (!segmentId) {
      throw new ApiError("Segment ID is required", 400);
    }

    if (!painId) {
      throw new ApiError("Pain ID is required", 400);
    }

    const supabase = await createServerClient();
    const adminSupabase = createAdminClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new ApiError("Unauthorized", 401);
    }

    await requireWriteAccess(supabase, adminSupabase, projectId, user.id);

    // Verify pain is a top pain
    const { data: painRanking } = await adminSupabase
      .from("pains_ranking")
      .select("is_top_pain")
      .eq("project_id", projectId)
      .eq("pain_id", painId)
      .eq("is_top_pain", true)
      .maybeSingle();

    if (!painRanking) {
      throw new ApiError("Only top pains (is_top_pain = true) are allowed for playbooks", 400);
    }

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
    const { data: segment, error: segmentError } = await adminSupabase
      .from("segments")
      .select("*")
      .eq("id", segmentId)
      .eq("project_id", projectId)
      .single();

    if (segmentError || !segment) {
      throw new ApiError("Segment not found", 404);
    }

    // Get pain
    const { data: pain, error: painError } = await adminSupabase
      .from("pains_initial")
      .select("*")
      .eq("id", painId)
      .eq("project_id", projectId)
      .single();

    if (painError || !pain) {
      throw new ApiError("Pain not found", 404);
    }

    // Gather required data (only approved tables)
    const [
      { data: strategyPersonalized },
      { data: communicationsFunnel },
      { data: channelStrategy },
      { data: pricingPsychology },
      { data: trustFramework },
      { data: competitiveIntelligence },
      { data: jtbdContext },
    ] = await Promise.all([
      adminSupabase
        .from("strategy_personalized")
        .select("*")
        .eq("project_id", projectId)
        .eq("segment_id", segmentId)
        .eq("pain_id", painId)
        .order("approved_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      adminSupabase
        .from("communications_funnel")
        .select("*")
        .eq("project_id", projectId)
        .eq("segment_id", segmentId)
        .eq("pain_id", painId)
        .order("approved_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      adminSupabase
        .from("channel_strategy")
        .select("*")
        .eq("project_id", projectId)
        .eq("segment_id", segmentId)
        .order("approved_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      adminSupabase
        .from("pricing_psychology")
        .select("*")
        .eq("project_id", projectId)
        .order("approved_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      adminSupabase
        .from("trust_framework")
        .select("*")
        .eq("project_id", projectId)
        .order("approved_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      adminSupabase
        .from("competitive_intelligence")
        .select("*")
        .eq("project_id", projectId)
        .order("approved_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      adminSupabase
        .from("jtbd_context")
        .select("*")
        .eq("project_id", projectId)
        .eq("segment_id", segmentId)
        .order("approved_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    // Build prompt
    const prompt = buildPlaybooksFunnelPrompt(
      typedProject.onboarding_data,
      segment as Segment,
      pain as PainInitial,
      strategyPersonalized as StrategyPersonalized | null,
      communicationsFunnel as CommunicationsFunnel | null,
      channelStrategy as ChannelStrategy | null,
      pricingPsychology as PricingPsychology | null,
      trustFramework as TrustFramework | null,
      competitiveIntelligence as CompetitiveIntelligence | null,
      jtbdContext as JTBDContext | null
    );

    // Generate with Claude
    const response = await withRetry(async () => {
      const text = await generateWithAI({ prompt, maxTokens: 4000, userId: user.id });
      return parseJSONResponse<PlaybooksFunnelResponse>(text);
    });

    // Check existing draft
    const { data: existingDraft } = await adminSupabase
      .from("playbooks_funnel_drafts")
      .select("id")
      .eq("project_id", projectId)
      .eq("segment_id", segmentId)
      .eq("pain_id", painId)
      .maybeSingle();

    if (existingDraft) {
      const { data: draft, error: updateError } = await adminSupabase
        .from("playbooks_funnel_drafts")
        .update({
          tof_assets: response.tof_assets,
          mof_assets: response.mof_assets,
          bof_assets: response.bof_assets,
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

    const { data: draft, error: insertError } = await adminSupabase
      .from("playbooks_funnel_drafts")
      .insert({
        project_id: projectId,
        segment_id: segmentId,
        pain_id: painId,
        tof_assets: response.tof_assets,
        mof_assets: response.mof_assets,
        bof_assets: response.bof_assets,
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

