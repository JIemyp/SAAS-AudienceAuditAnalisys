// =====================================================
// Approve Canvas Extended - Per Segment (Batch by Pain ID)
// Uses centralized approve-utils with history tracking
// Plus completion status checking
// =====================================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
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

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new ApiError("Unauthorized", 401);
    }

    const ids = Array.isArray(draftIds) ? draftIds : [draftIds];

    // Use centralized approve utility
    const result = await approveBatchByPain(APPROVE_CONFIGS.canvasExtended, {
      supabase,
      projectId,
      draftIds: ids,
      segmentId,
      userId: user.id,
    });

    // =========================================
    // Check segment completion status
    // =========================================
    const { data: topPains } = await supabase
      .from("pains_ranking")
      .select("pain_id")
      .eq("project_id", projectId)
      .eq("segment_id", segmentId)
      .eq("is_top_pain", true);

    const topPainIds = topPains?.map(p => p.pain_id) || [];

    const { data: approvedExtended } = await supabase
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
      const { data: allSegments } = await supabase
        .from("segments")
        .select("id")
        .eq("project_id", projectId);

      if (allSegments) {
        const { data: allTopPains } = await supabase
          .from("pains_ranking")
          .select("pain_id")
          .eq("project_id", projectId)
          .eq("is_top_pain", true);

        const allTopPainIds = allTopPains?.map(p => p.pain_id) || [];

        const { data: allApproved } = await supabase
          .from("canvas_extended")
          .select("pain_id")
          .eq("project_id", projectId)
          .in("pain_id", allTopPainIds);

        allSegmentsComplete = allApproved?.length === allTopPainIds.length;
      }
    }

    // =========================================
    // Update project status if complete
    // =========================================
    if (allSegmentsComplete) {
      await supabase
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
      segment_complete: segmentComplete,
      all_segments_complete: allSegmentsComplete,
      errors: result.errors.length > 0 ? result.errors : undefined,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
