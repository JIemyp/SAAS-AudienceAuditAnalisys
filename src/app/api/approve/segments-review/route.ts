// Approve Segments Review - Prompt 10
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { handleApiError, ApiError, getNextStep } from "@/lib/api-utils";

export async function POST(request: NextRequest) {
  try {
    const { projectId, draftId } = await request.json();
    if (!projectId || !draftId) throw new ApiError("Project ID and Draft ID required", 400);

    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new ApiError("Unauthorized", 401);

    const { data: draft } = await supabase.from("segments_review_drafts").select("*").eq("id", draftId).single();
    if (!draft) throw new ApiError("Draft not found", 404);

    const { data: approved, error } = await supabase.from("segments_review").insert({
      project_id: projectId,
      overlaps: draft.overlaps,
      too_broad: draft.too_broad,
      too_narrow: draft.too_narrow,
      missing_segments: draft.missing_segments,
      recommendations: draft.recommendations,
    }).select().single();

    if (error) throw new ApiError("Failed to approve", 500);

    const nextStep = getNextStep("segments_review_draft");
    await supabase.from("projects").update({ current_step: nextStep }).eq("id", projectId);

    return NextResponse.json({ success: true, approved, next_step: nextStep });
  } catch (error) { return handleApiError(error); }
}
