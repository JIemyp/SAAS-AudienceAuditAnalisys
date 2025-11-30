// =====================================================
// Approve Portrait Review - Prompt 3
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

    const { data: approved, error: insertError } = await supabase
      .from("portrait_review")
      .insert({
        project_id: projectId,
        what_to_change: draft.what_to_change,
        what_to_add: draft.what_to_add,
        what_to_remove: draft.what_to_remove,
        reasoning: draft.reasoning,
      })
      .select()
      .single();

    if (insertError) {
      throw new ApiError("Failed to approve", 500);
    }

    const nextStep = getNextStep("portrait_review_draft");
    await supabase
      .from("projects")
      .update({ current_step: nextStep })
      .eq("id", projectId);

    return NextResponse.json({ success: true, approved, next_step: nextStep });
  } catch (error) {
    return handleApiError(error);
  }
}
