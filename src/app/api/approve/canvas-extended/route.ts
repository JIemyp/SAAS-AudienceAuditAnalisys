// =====================================================
// Approve Canvas Extended - Per Segment (Batch by Pain ID)
// Uses centralized approve-utils with history tracking
// Plus completion status checking
// =====================================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireWriteAccess } from "@/lib/permissions";
import { handleApiError, ApiError } from "@/lib/api-utils";
import { approveBatchByPain, APPROVE_CONFIGS } from "@/lib/approve-utils";

export async function POST(request: NextRequest) {
  try {
    const { projectId, draftIds, segmentId } = await request.json();

    if (!projectId) {
      throw new ApiError("Project ID is required", 400);
    }
    if (!draftIds) {
      throw new ApiError("Draft IDs are required", 400);
    }
    if (!segmentId) {
      throw new ApiError("Segment ID is required", 400);
    }

    const supabase = await createServerClient();
    const adminSupabase = createAdminClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new ApiError("Unauthorized", 401);
    }

    // Check write access (owner or editor can approve)
    await requireWriteAccess(supabase, adminSupabase, projectId, user.id);

    const ids = Array.isArray(draftIds) ? draftIds : [draftIds];

    // Use centralized approve utility
    const result = await approveBatchByPain(APPROVE_CONFIGS.canvasExtended, {
      supabase: adminSupabase,
      projectId,
      draftIds: ids,
      segmentId,
      userId: user.id,
    });

    // =========================================
    // Check segment completion status
    // =========================================
    const { data: topPains } = await adminSupabase
      .from("pains_ranking")
      .select("pain_id")
      .eq("project_id", projectId)
      .eq("segment_id", segmentId)
      .eq("is_top_pain", true);

    const topPainIds = topPains?.map(p => p.pain_id) || [];

    const { data: approvedExtended } = await adminSupabase
      .from("canvas_extended")
      .select("pain_id")
      .eq("project_id", projectId)
      .eq("segment_id", segmentId)
      .in("pain_id", topPainIds);

    const segmentComplete = approvedExtended?.length === topPainIds.length;

    // =========================================
    // Check if all segments are complete
    // =========================================
    let allSegmentsComplete = false;
    if (segmentComplete) {
      const { data: allSegments } = await adminSupabase
        .from("segments")
        .select("id")
        .eq("project_id", projectId);

      if (allSegments) {
        const { data: allTopPains } = await adminSupabase
          .from("pains_ranking")
          .select("pain_id")
          .eq("project_id", projectId)
          .eq("is_top_pain", true);

        const allTopPainIds = allTopPains?.map(p => p.pain_id) || [];

        const { data: allApproved } = await adminSupabase
          .from("canvas_extended")
          .select("pain_id")
          .eq("project_id", projectId)
          .in("pain_id", allTopPainIds);

        allSegmentsComplete = allApproved?.length === allTopPainIds.length;
      }
    }

    // =========================================
    // Update project to next step if canvas-extended complete
    // =========================================
    if (allSegmentsComplete) {
      await adminSupabase
        .from("projects")
        .update({
          current_step: "channel_strategy_draft", // Next step after canvas-extended
        })
        .eq("id", projectId);
    }

    return NextResponse.json({
      success: result.success,
      approved: result.approved,
      segment_id: segmentId,
      segment_complete: segmentComplete,
      all_segments_complete: allSegmentsComplete,
      errors: result.errors.length > 0 ? result.errors : undefined,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
