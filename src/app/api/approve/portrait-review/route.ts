// =====================================================
// Approve Portrait Review - Prompt 3
// Saves user decisions (Apply/Edit/Dismiss) along with the review
// =====================================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { handleApiError, ApiError, getNextStep } from "@/lib/api-utils";

export async function POST(request: NextRequest) {
  try {
    const { projectId, draftId, decisions } = await request.json();

    if (!projectId || !draftId) {
      throw new ApiError("Project ID and Draft ID are required", 400);
    }

    const supabase = await createServerClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new ApiError("Unauthorized", 401);
    }

    const { data: draft, error: draftError } = await supabase
      .from("portrait_review_drafts")
      .select("*")
      .eq("id", draftId)
      .eq("project_id", projectId)
      .single();

    if (draftError || !draft) {
      throw new ApiError("Draft not found", 404);
    }

    // Save decisions to draft as well for historical reference
    if (decisions && Object.keys(decisions).length > 0) {
      await supabase
        .from("portrait_review_drafts")
        .update({ decisions })
        .eq("id", draftId);
    }

    const { data: approved, error: insertError } = await supabase
      .from("portrait_review")
      .insert({
        project_id: projectId,
        what_to_change: draft.what_to_change,
        what_to_add: draft.what_to_add,
        what_to_remove: draft.what_to_remove,
        reasoning: draft.reasoning,
        decisions: decisions || {},
      })
      .select()
      .single();

    if (insertError) {
      console.error("[portrait-review approve] Insert error:", insertError);
      throw new ApiError("Failed to approve", 500);
    }

    const nextStep = getNextStep("portrait_review_draft");
    await supabase
      .from("projects")
      .update({ current_step: nextStep })
      .eq("id", projectId);

    console.log(`[portrait-review approve] Approved with ${Object.keys(decisions || {}).length} decisions`);
    return NextResponse.json({ success: true, approved, next_step: nextStep });
  } catch (error) {
    return handleApiError(error);
  }
}
