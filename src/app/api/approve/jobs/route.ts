// =====================================================
// Approve Jobs to Be Done - Prompt 5 (Per Segment)
// =====================================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { handleApiError, ApiError } from "@/lib/api-utils";

export async function POST(request: NextRequest) {
  try {
    const { projectId, draftId, segmentId } = await request.json();

    if (!projectId || !draftId) {
      throw new ApiError("Project ID and Draft ID are required", 400);
    }

    if (!segmentId) {
      throw new ApiError("Segment ID is required", 400);
    }

    const supabase = await createServerClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new ApiError("Unauthorized", 401);
    }

    const { data: draft, error: draftError } = await supabase
      .from("jobs_drafts")
      .select("*")
      .eq("id", draftId)
      .eq("project_id", projectId)
      .eq("segment_id", segmentId)
      .single();

    if (draftError || !draft) {
      throw new ApiError("Draft not found", 404);
    }

    // Insert approved jobs with segment_id
    const { data: approved, error: insertError } = await supabase
      .from("jobs")
      .insert({
        project_id: projectId,
        segment_id: segmentId,
        functional_jobs: draft.functional_jobs,
        emotional_jobs: draft.emotional_jobs,
        social_jobs: draft.social_jobs,
      })
      .select()
      .single();

    if (insertError) {
      throw new ApiError("Failed to approve", 500);
    }

    // Note: We don't update project step here because user stays on same page
    // Project step is managed at the page level when ALL segments are approved

    return NextResponse.json({ success: true, approved, segment_id: segmentId });
  } catch (error) {
    return handleApiError(error);
  }
}
