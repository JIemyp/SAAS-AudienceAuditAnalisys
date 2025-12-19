// =====================================================
// Approve JTBD Context - Per Segment (FINAL STEP)
// Uses centralized approve-utils with history tracking
// Plus completion status checking - marks project as COMPLETED
// =====================================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireWriteAccess } from "@/lib/permissions";
import { handleApiError, ApiError } from "@/lib/api-utils";
import { approveWithUpsert, APPROVE_CONFIGS } from "@/lib/approve-utils";

export async function POST(request: NextRequest) {
  try {
    const { projectId, draftId, segmentId } = await request.json();

    if (!projectId || !draftId || !segmentId) {
      throw new ApiError("Project ID, Draft ID, and Segment ID are required", 400);
    }

    const supabase = await createServerClient();
    const adminSupabase = createAdminClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new ApiError("Unauthorized", 401);
    }

    // Check write access (owner or editor can approve)
    await requireWriteAccess(supabase, adminSupabase, projectId, user.id);

    const result = await approveWithUpsert(APPROVE_CONFIGS.jtbdContext, {
      supabase: adminSupabase,
      projectId,
      draftId,
      segmentId,
      userId: user.id,
    });

    // =========================================
    // Check if all segments are complete
    // =========================================
    const { data: allSegments } = await adminSupabase
      .from("segments")
      .select("id")
      .eq("project_id", projectId);

    const segmentIds = allSegments?.map(s => s.id) || [];

    const { data: approvedForSegments } = await adminSupabase
      .from("jtbd_context")
      .select("segment_id")
      .eq("project_id", projectId)
      .in("segment_id", segmentIds);

    const allSegmentsComplete = approvedForSegments?.length === segmentIds.length;

    // =========================================
    // Mark project as COMPLETED if all segments done
    // This is the FINAL step in the workflow
    // =========================================
    if (allSegmentsComplete) {
      await adminSupabase
        .from("projects")
        .update({
          current_step: "completed",
          status: "completed",
        })
        .eq("id", projectId);
    }

    return NextResponse.json({
      success: result.success,
      approved: result.approved,
      segment_id: segmentId,
      updated: result.updated,
      all_segments_complete: allSegmentsComplete,
      project_completed: allSegmentsComplete,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
