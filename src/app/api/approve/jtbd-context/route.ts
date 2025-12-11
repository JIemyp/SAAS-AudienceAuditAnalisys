// =====================================================
// Approve JTBD Context - Per Segment (FINAL STEP)
// =====================================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { handleApiError, ApiError } from "@/lib/api-utils";

export async function POST(request: NextRequest) {
  try {
    const { projectId, draftId, segmentId } = await request.json();

    if (!projectId || !draftId || !segmentId) {
      throw new ApiError("Project ID, Draft ID, and Segment ID are required", 400);
    }

    const supabase = await createServerClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new ApiError("Unauthorized", 401);
    }

    const { data: draft, error: draftError } = await supabase
      .from("jtbd_context_drafts")
      .select("*")
      .eq("id", draftId)
      .eq("project_id", projectId)
      .eq("segment_id", segmentId)
      .single();

    if (draftError || !draft) {
      throw new ApiError("Draft not found", 404);
    }

    const { data: existingApproved } = await supabase
      .from("jtbd_context")
      .select("id")
      .eq("project_id", projectId)
      .eq("segment_id", segmentId)
      .single();

    const approvedData = {
      project_id: projectId,
      segment_id: segmentId,
      job_contexts: draft.job_contexts,
      job_priority_ranking: draft.job_priority_ranking,
      job_dependencies: draft.job_dependencies,
      approved_at: new Date().toISOString(),
    };

    if (existingApproved) {
      const { data: approved, error: updateError } = await supabase
        .from("jtbd_context")
        .update(approvedData)
        .eq("id", existingApproved.id)
        .select()
        .single();

      if (updateError) throw new ApiError("Failed to update approved record", 500);
      return NextResponse.json({ success: true, approved, segment_id: segmentId, updated: true });
    }

    const { data: approved, error: insertError } = await supabase
      .from("jtbd_context")
      .insert(approvedData)
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      throw new ApiError("Failed to approve", 500);
    }

    return NextResponse.json({ success: true, approved, segment_id: segmentId });
  } catch (error) {
    return handleApiError(error);
  }
}
