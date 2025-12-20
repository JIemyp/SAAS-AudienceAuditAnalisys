// =====================================================
// Increase timeout for AI generation
export const maxDuration = 60;

// Generate Communications Funnel - V6 MODULE (Per Segment × Top Pain)
// Creates TOF/MOF/BOF organic comms strategy
// =====================================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireWriteAccess } from "@/lib/permissions";
import { generateWithAI, parseJSONResponse } from "@/lib/ai-client";
import { handleApiError, ApiError, withRetry } from "@/lib/api-utils";
import { Project, OnboardingData, Segment, CommunicationsFunnel } from "@/types";

// Response type matching PROMPTS_V6.md
interface CommunicationsFunnelResponse {
  organic_rhythm: {
    tof_content: Array<{
      type: string;
      topic: string;
      format: string;
      frequency: string;
    }>;
    mof_content: Array<{
      type: string;
      topic: string;
      format: string;
      frequency: string;
    }>;
    bof_content: Array<{
      type: string;
      topic: string;
      format: string;
      frequency: string;
    }>;
    posting_cadence: {
      daily_posts: number;
      stories: number;
      live: string;
    };
    channel_matrix: Record<string, string>;
  };
  conversation_funnel: {
    entry_points: string[];
    dm_flow: string[];
    chat_flow: string[];
    qualification_criteria: string[];
    handoff_script: string;
  };
  chatbot_scripts: {
    welcome_flow: {
      message: string;
      buttons: string[];
    };
    need_discovery_flow: {
      questions: string[];
      branching: string;
    };
    recommendation_flow: {
      logic: string;
      templates: string[];
    };
    export_format: string;
  } | null;
}

interface PainData {
  id: string;
  name: string;
  description: string;
  impact_score: number;
}

function buildCommunicationsFunnelPrompt(
  onboarding: OnboardingData,
  segment: Segment,
  pain: PainData,
  research: Record<string, unknown>
): string {
  return `You are a communications strategist. Build a TOF/MOF/BOF comms funnel in strict JSON.

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
Generate communications funnel:
1) Organic rhythm (TOF/MOF/BOF content + posting cadence)
2) Conversation funnel (DM/chat flows)
3) Chatbot scripts

Show explicit transitions: comment/quiz -> DM/chat -> landing/offer.

## REQUIRED JSON OUTPUT:
{
  "organic_rhythm": {
    "tof_content": [
      { "type": "string", "topic": "string", "format": "string", "frequency": "string" }
    ],
    "mof_content": [
      { "type": "string", "topic": "string", "format": "string", "frequency": "string" }
    ],
    "bof_content": [
      { "type": "string", "topic": "string", "format": "string", "frequency": "string" }
    ],
    "posting_cadence": {
      "daily_posts": 2,
      "stories": 5,
      "live": "weekly"
    },
    "channel_matrix": {
      "instagram": "primary",
      "tiktok": "secondary",
      "youtube": "long-form"
    }
  },
  "conversation_funnel": {
    "entry_points": ["string"],
    "dm_flow": ["string"],
    "chat_flow": ["string"],
    "qualification_criteria": ["string"],
    "handoff_script": "string"
  },
  "chatbot_scripts": {
    "welcome_flow": {
      "message": "string",
      "buttons": ["string"]
    },
    "need_discovery_flow": {
      "questions": ["string"],
      "branching": "string"
    },
    "recommendation_flow": {
      "logic": "string",
      "templates": ["string"]
    },
    "export_format": "ManyChat JSON"
  }
}

## MINIMUM REQUIREMENTS:
- tof_content: 4 items
- mof_content: 4 items
- bof_content: 4 items
- entry_points: 4 items
- dm_flow: 6 items
- chat_flow: 6 items
- qualification_criteria: 4 items
- chatbot_scripts.recommendation_flow.templates: 4 items

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
      throw new ApiError("Top pain not found. Only top pains can be used for communications.", 404);
    }

    // Gather research data
    const [
      { data: channelStrategy },
      { data: canvas },
      { data: strategyPersonalized },
    ] = await Promise.all([
      supabase.from("channel_strategy").select("*").eq("project_id", projectId).eq("segment_id", segmentId).order("approved_at", { ascending: false }).limit(1).single(),
      supabase.from("canvas").select("*").eq("project_id", projectId).eq("segment_id", segmentId).eq("pain_id", painId).order("approved_at", { ascending: false }).limit(1).single(),
      supabase.from("strategy_personalized").select("*").eq("project_id", projectId).eq("segment_id", segmentId).eq("pain_id", painId).order("approved_at", { ascending: false }).limit(1).single(),
    ]);

    const research = {
      channel_strategy: channelStrategy || null,
      canvas: canvas || null,
      strategy_personalized: strategyPersonalized || null,
    };

    const prompt = buildCommunicationsFunnelPrompt(
      typedProject.onboarding_data,
      segment as Segment,
      { id: pain.id, name: pain.name, description: pain.description, impact_score: pain.impact_score },
      research
    );

    const response = await withRetry(async () => {
      const text = await generateWithAI({ prompt, maxTokens: 5000, userId: user.id });
      return parseJSONResponse<CommunicationsFunnelResponse>(text);
    });

    // Check existing draft
    const { data: existingDraft } = await supabase
      .from("communications_funnel_drafts")
      .select("id")
      .eq("project_id", projectId)
      .eq("segment_id", segmentId)
      .eq("pain_id", painId)
      .single();

    if (existingDraft) {
      const { data: draft, error: updateError } = await supabase
        .from("communications_funnel_drafts")
        .update({
          organic_rhythm: response.organic_rhythm,
          conversation_funnel: response.conversation_funnel,
          chatbot_scripts: response.chatbot_scripts,
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
      .from("communications_funnel_drafts")
      .insert({
        project_id: projectId,
        segment_id: segmentId,
        pain_id: painId,
        organic_rhythm: response.organic_rhythm,
        conversation_funnel: response.conversation_funnel,
        chatbot_scripts: response.chatbot_scripts,
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
