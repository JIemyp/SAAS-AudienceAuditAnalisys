// =====================================================
// Approve Validation - Prompt 1
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
      .from("validation_drafts")
      .select("*")
      .eq("id", draftId)
      .eq("project_id", projectId)
      .single();

    if (draftError || !draft) {
      throw new ApiError("Draft not found", 404);
    }

    // Create approved record
    const { data: approved, error: insertError } = await supabase
      .from("validation")
      .insert({
        project_id: projectId,
        what_brand_sells: draft.what_brand_sells,
        problem_solved: draft.problem_solved,
        key_differentiator: draft.key_differentiator,
        understanding_correct: draft.understanding_correct,
      })
      .select()
      .single();

    if (insertError) {
      throw new ApiError("Failed to approve validation", 500);
    }

    // Update project step
    const nextStep = getNextStep("validation_draft");
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
