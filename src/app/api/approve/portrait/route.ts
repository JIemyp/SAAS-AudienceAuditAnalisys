// =====================================================
// Approve Portrait - Prompt 2
// =====================================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { handleApiError, ApiError, getNextStep } from "@/lib/api-utils";

export async function POST(request: NextRequest) {
  try {
    const { projectId, draftId } = await request.json();

    if (!projectId || !draftId) {
      throw new ApiError("Project ID and Draft ID are required", 400);
    }

    const supabase = await createServerClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new ApiError("Unauthorized", 401);
    }

    // Get the draft
    const { data: draft, error: draftError } = await supabase
      .from("portrait_drafts")
      .select("*")
      .eq("id", draftId)
      .eq("project_id", projectId)
      .single();

    if (draftError || !draft) {
      throw new ApiError("Draft not found", 404);
    }

    // Create approved record
    const { data: approved, error: insertError } = await supabase
      .from("portrait")
      .insert({
        project_id: projectId,
        sociodemographics: draft.sociodemographics,
        psychographics: draft.psychographics,
        age_range: draft.age_range,
        gender_distribution: draft.gender_distribution,
        income_level: draft.income_level,
        education: draft.education,
        location: draft.location,
        occupation: draft.occupation,
        family_status: draft.family_status,
        values_beliefs: draft.values_beliefs,
        lifestyle_habits: draft.lifestyle_habits,
        interests_hobbies: draft.interests_hobbies,
        personality_traits: draft.personality_traits,
      })
      .select()
      .single();

    if (insertError) {
      throw new ApiError("Failed to approve portrait", 500);
    }

    // Update project step
    const nextStep = getNextStep("portrait_draft");
    await supabase
      .from("projects")
      .update({ current_step: nextStep })
      .eq("id", projectId);

    return NextResponse.json({
      success: true,
      approved,
      next_step: nextStep,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
