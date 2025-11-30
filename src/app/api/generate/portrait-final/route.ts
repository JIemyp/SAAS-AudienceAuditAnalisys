// =====================================================
// Generate Portrait Final - Prompt 4
// =====================================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { generateWithClaude, parseJSONResponse } from "@/lib/anthropic";
import { buildPortraitFinalPrompt, PortraitFinalResponse } from "@/lib/prompts";
import { handleApiError, ApiError, withRetry } from "@/lib/api-utils";
import { Portrait, PortraitReview } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const { projectId } = await request.json();

    if (!projectId) {
      throw new ApiError("Project ID is required", 400);
    }

    const supabase = await createServerClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new ApiError("Unauthorized", 401);
    }

    // Get approved portrait
    const { data: portrait, error: portraitError } = await supabase
      .from("portrait")
      .select("*")
      .eq("project_id", projectId)
      .order("approved_at", { ascending: false })
      .limit(1)
      .single();

    if (portraitError || !portrait) {
      throw new ApiError("Portrait not found", 400);
    }

    // Get approved review
    const { data: review, error: reviewError } = await supabase
      .from("portrait_review")
      .select("*")
      .eq("project_id", projectId)
      .order("approved_at", { ascending: false })
      .limit(1)
      .single();

    if (reviewError || !review) {
      throw new ApiError("Portrait review not found", 400);
    }

    const prompt = buildPortraitFinalPrompt(portrait as Portrait, review as PortraitReview);

    const response = await withRetry(async () => {
      const text = await generateWithClaude({ prompt, maxTokens: 4096 });
      return parseJSONResponse<PortraitFinalResponse>(text);
    });

    const { data: draft, error: insertError } = await supabase
      .from("portrait_final_drafts")
      .insert({
        project_id: projectId,
        sociodemographics: response.sociodemographics,
        psychographics: response.psychographics,
        age_range: response.demographics_detailed.age_range,
        gender_distribution: response.demographics_detailed.gender_distribution,
        income_level: response.demographics_detailed.income_level,
        education: response.demographics_detailed.education,
        location: response.demographics_detailed.location,
        occupation: response.demographics_detailed.occupation,
        family_status: response.demographics_detailed.family_status,
        values_beliefs: response.psychographics_detailed.values_beliefs,
        lifestyle_habits: response.psychographics_detailed.lifestyle_habits,
        interests_hobbies: response.psychographics_detailed.interests_hobbies,
        personality_traits: response.psychographics_detailed.personality_traits,
        changes_applied: response.changes_applied,
        version: 1,
      })
      .select()
      .single();

    if (insertError) {
      throw new ApiError("Failed to save draft", 500);
    }

    await supabase
      .from("projects")
      .update({ current_step: "portrait_final_draft" })
      .eq("id", projectId);

    return NextResponse.json({ success: true, draft });
  } catch (error) {
    return handleApiError(error);
  }
}
