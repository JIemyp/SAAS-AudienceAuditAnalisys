// =====================================================
// Increase timeout for AI generation
export const maxDuration = 60;

// Generate Strategy Personalized - V6 MODULE (Per Segment × Top Pain)
// Creates TOF/MOF/BOF funnel strategy
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
  StrategyPersonalized,
} from "@/types";

// Response type matching PROMPTS_V6.md
interface StrategyPersonalizedResponse {
  tof_ugc_hooks: Array<{
    hook_type: "problem_agitation" | "curiosity" | "transformation" | "social_proof";
    script_outline: string;
    emotional_angle: string;
    visual_direction: string;
    cta: string;
  }>;
  mof_quiz_flow: {
    quiz_title: string;
    questions: Array<{
      question: string;
      options: string[];
      segment_logic?: string;
    }>;
    branching_logic: string;
    lead_magnet: string;
  };
  mof_chat_script: {
    opening_message: string;
    discovery_questions: string[];
    objection_handlers: Array<{
      objection: string;
      response: string;
    }>;
    handoff_trigger: string;
  } | null;
  bof_creative_briefs: Array<{
    format: "static" | "video" | "carousel";
    headline: string;
    body: string;
    visual_concept: string;
    cta: string;
    target_placement: "feed" | "stories" | "reels";
  }>;
  bof_landing_structure: {
    hero_headline: string;
    hero_subheadline: string;
    pain_section: string;
    solution_section: string;
    proof_section: string;
    cta_section: string;
  };
}

interface PainData {
  id: string;
  name: string;
  description: string;
  impact_score: number;
}

function buildStrategyPersonalizedPrompt(
  onboarding: OnboardingData,
  segment: Segment,
  pain: PainData,
  research: Record<string, unknown>
): string {
  return `You are a senior performance marketer. Build a full-funnel strategy for one segment and one top pain.

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
- is_top_pain: true

## Research Data
${JSON.stringify(research, null, 2)}

## Your Task
Generate TOF -> MOF -> BOF strategy for this segment and pain:

1) TOF: 4 UGC hooks (one for each hook_type)
2) MOF: Quiz flow with 6 questions + Chat script with 5 discovery questions
3) BOF: 4 creative briefs + Landing page structure

## Enumerations
- hook_type: problem_agitation | curiosity | transformation | social_proof
- format: static | video | carousel
- target_placement: feed | stories | reels

## REQUIRED JSON OUTPUT:
{
  "tof_ugc_hooks": [
    {
      "hook_type": "problem_agitation",
      "script_outline": "string",
      "emotional_angle": "string",
      "visual_direction": "string",
      "cta": "string"
    }
  ],
  "mof_quiz_flow": {
    "quiz_title": "string",
    "questions": [
      {
        "question": "string",
        "options": ["string"],
        "segment_logic": "string"
      }
    ],
    "branching_logic": "string",
    "lead_magnet": "string"
  },
  "mof_chat_script": {
    "opening_message": "string",
    "discovery_questions": ["string"],
    "objection_handlers": [
      {
        "objection": "string",
        "response": "string"
      }
    ],
    "handoff_trigger": "string"
  },
  "bof_creative_briefs": [
    {
      "format": "static",
      "headline": "string",
      "body": "string",
      "visual_concept": "string",
      "cta": "string",
      "target_placement": "feed"
    }
  ],
  "bof_landing_structure": {
    "hero_headline": "string",
    "hero_subheadline": "string",
    "pain_section": "string",
    "solution_section": "string",
    "proof_section": "string",
    "cta_section": "string"
  }
}

## MINIMUM REQUIREMENTS:
- tof_ugc_hooks: 4 items (cover all hook_type values)
- mof_quiz_flow.questions: 6 items
- mof_chat_script.discovery_questions: 5 items
- mof_chat_script.objection_handlers: 4 items
- bof_creative_briefs: 4 items

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
      throw new ApiError("Top pain not found. Only top pains can be used for strategy generation.", 404);
    }

    // Gather research data
    const [
      { data: segmentDetails },
      { data: canvas },
      { data: canvasExtended },
      { data: channelStrategy },
    ] = await Promise.all([
      supabase.from("segment_details").select("*").eq("project_id", projectId).eq("segment_id", segmentId).order("approved_at", { ascending: false }).limit(1).single(),
      supabase.from("canvas").select("*").eq("project_id", projectId).eq("segment_id", segmentId).eq("pain_id", painId).order("approved_at", { ascending: false }).limit(1).single(),
      supabase.from("canvas_extended").select("*").eq("project_id", projectId).eq("segment_id", segmentId).eq("pain_id", painId).order("approved_at", { ascending: false }).limit(1).single(),
      supabase.from("channel_strategy").select("*").eq("project_id", projectId).eq("segment_id", segmentId).order("approved_at", { ascending: false }).limit(1).single(),
    ]);

    const research = {
      segment_details: segmentDetails || null,
      canvas: canvas || null,
      canvas_extended: canvasExtended || null,
      channel_strategy: channelStrategy || null,
    };

    const prompt = buildStrategyPersonalizedPrompt(
      typedProject.onboarding_data,
      segment as Segment,
      { id: pain.id, name: pain.name, description: pain.description, impact_score: pain.impact_score },
      research
    );

    const response = await withRetry(async () => {
      const text = await generateWithAI({ prompt, maxTokens: 6000, userId: user.id });
      return parseJSONResponse<StrategyPersonalizedResponse>(text);
    });

    // Check existing draft
    const { data: existingDraft } = await supabase
      .from("strategy_personalized_drafts")
      .select("id")
      .eq("project_id", projectId)
      .eq("segment_id", segmentId)
      .eq("pain_id", painId)
      .single();

    if (existingDraft) {
      const { data: draft, error: updateError } = await supabase
        .from("strategy_personalized_drafts")
        .update({
          tof_ugc_hooks: response.tof_ugc_hooks,
          mof_quiz_flow: response.mof_quiz_flow,
          mof_chat_script: response.mof_chat_script,
          bof_creative_briefs: response.bof_creative_briefs,
          bof_landing_structure: response.bof_landing_structure,
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
      .from("strategy_personalized_drafts")
      .insert({
        project_id: projectId,
        segment_id: segmentId,
        pain_id: painId,
        tof_ugc_hooks: response.tof_ugc_hooks,
        mof_quiz_flow: response.mof_quiz_flow,
        mof_chat_script: response.mof_chat_script,
        bof_creative_briefs: response.bof_creative_briefs,
        bof_landing_structure: response.bof_landing_structure,
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
