// =====================================================
// Increase timeout for AI generation
export const maxDuration = 60;

// Generate UGC Creator Profiles - V6 MODULE (Per Segment)
// Creates ideal creator personas and content topics
// =====================================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireUGCAccess } from "@/lib/permissions";
import { generateWithAI, parseJSONResponse } from "@/lib/ai-client";
import { handleApiError, ApiError, withRetry } from "@/lib/api-utils";
import { Project, OnboardingData, Segment, UGCCreatorProfile } from "@/types";

// Response type matching PROMPTS_V6.md
interface UGCCreatorProfilesResponse {
  ideal_persona: {
    name: string;
    age_range: string;
    gender: string;
    location_preference: string;
    platform_presence: string[];
    personality_traits: string[];
    visual_aesthetic: string;
    content_style: string;
  };
  content_topics: Array<{
    topic: string;
    source_pain_id: string;
    hook_angle: string;
    emotional_tone: string;
    format_suggestion: string;
  }>;
  sourcing_guidance: {
    where_to_find: string[];
    outreach_template: string;
    rate_range: string;
    red_flags: string[];
    green_flags: string[];
  };
}

interface TopPain {
  id: string;
  name: string;
  description: string;
}

function buildUGCCreatorProfilesPrompt(
  onboarding: OnboardingData,
  segment: Segment,
  topPains: TopPain[],
  research: Record<string, unknown>
): string {
  const painsList = topPains.map(p => `- ${p.id}: ${p.name} - ${p.description}`).join("\n");

  return `You are a UGC strategist. Build creator profiles and content topics in strict JSON.

## Global Output Rules
1. Return ONLY JSON. No markdown, no comments, no prose outside JSON.
2. Use double quotes for all keys and string values.
3. Do NOT include unescaped line breaks inside strings. Use "\\n" if needed.
4. No trailing commas.
5. Output language: English.
6. Use ONLY pain IDs provided in the input for source_pain_id.

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

## Top Pains (with IDs) - USE THESE IDs for source_pain_id
${painsList}

## Research Data
${JSON.stringify(research, null, 2)}

## Your Task
Generate UGC creator profile for this segment:
1) Ideal persona description
2) 6+ content topics (at least 1 per top pain)
3) Sourcing guidance with where to find, outreach template, rate range

## REQUIRED JSON OUTPUT:
{
  "ideal_persona": {
    "name": "string - creative persona name like 'Health-Conscious Hannah'",
    "age_range": "25-35",
    "gender": "string",
    "location_preference": "string",
    "platform_presence": ["Instagram", "TikTok"],
    "personality_traits": ["string"],
    "visual_aesthetic": "string",
    "content_style": "string"
  },
  "content_topics": [
    {
      "topic": "string",
      "source_pain_id": "USE ONE OF THE PAIN IDs FROM ABOVE",
      "hook_angle": "string",
      "emotional_tone": "string",
      "format_suggestion": "string"
    }
  ],
  "sourcing_guidance": {
    "where_to_find": ["string"],
    "outreach_template": "string - brief DM/email template",
    "rate_range": "$100-300 per video",
    "red_flags": ["string"],
    "green_flags": ["string"]
  }
}

## MINIMUM REQUIREMENTS:
- content_topics: 6 items (at least 1 per top pain ID)
- sourcing_guidance.where_to_find: 4 items
- sourcing_guidance.red_flags: 3 items
- sourcing_guidance.green_flags: 3 items

Return ONLY valid JSON. No markdown, no explanations.`;
}

export async function POST(request: NextRequest) {
  try {
    const { projectId, segmentId } = await request.json();

    if (!projectId) throw new ApiError("Project ID is required", 400);
    if (!segmentId) throw new ApiError("Segment ID is required", 400);

    const supabase = await createServerClient();
    const adminSupabase = createAdminClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new ApiError("Unauthorized", 401);
    }

    await requireUGCAccess(supabase, adminSupabase, projectId, user.id);

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

    // Get top pains for this segment
    const { data: topPains, error: painsError } = await supabase
      .from("pains_ranking")
      .select("id, name, description")
      .eq("project_id", projectId)
      .eq("segment_id", segmentId)
      .eq("is_top_pain", true);

    if (painsError || !topPains || topPains.length === 0) {
      throw new ApiError("No top pains found for this segment. Generate and approve pains first.", 404);
    }

    // Gather research data
    const [
      { data: segmentDetails },
      { data: channelStrategy },
      { data: portrait },
    ] = await Promise.all([
      supabase.from("segment_details").select("*").eq("project_id", projectId).eq("segment_id", segmentId).order("approved_at", { ascending: false }).limit(1).single(),
      supabase.from("channel_strategy").select("*").eq("project_id", projectId).eq("segment_id", segmentId).order("approved_at", { ascending: false }).limit(1).single(),
      supabase.from("portrait_final").select("*").eq("project_id", projectId).order("approved_at", { ascending: false }).limit(1).single(),
    ]);

    const research = {
      segment_details: segmentDetails || null,
      channel_strategy: channelStrategy || null,
      portrait: portrait || null,
    };

    const prompt = buildUGCCreatorProfilesPrompt(
      typedProject.onboarding_data,
      segment as Segment,
      topPains as TopPain[],
      research
    );

    const response = await withRetry(async () => {
      const text = await generateWithAI({ prompt, maxTokens: 4000, userId: user.id });
      return parseJSONResponse<UGCCreatorProfilesResponse>(text);
    });

    // Check existing draft
    const { data: existingDraft } = await supabase
      .from("ugc_creator_profiles_drafts")
      .select("id")
      .eq("project_id", projectId)
      .eq("segment_id", segmentId)
      .single();

    if (existingDraft) {
      const { data: draft, error: updateError } = await supabase
        .from("ugc_creator_profiles_drafts")
        .update({
          ideal_persona: response.ideal_persona,
          content_topics: response.content_topics,
          sourcing_guidance: response.sourcing_guidance,
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
      .from("ugc_creator_profiles_drafts")
      .insert({
        project_id: projectId,
        segment_id: segmentId,
        ideal_persona: response.ideal_persona,
        content_topics: response.content_topics,
        sourcing_guidance: response.sourcing_guidance,
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
