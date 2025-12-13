// =====================================================
// Approve Channel Strategy - Per Segment
// Uses centralized approve-utils with history tracking
// =====================================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { handleApiError, ApiError } from "@/lib/api-utils";
import { approveWithUpsert, APPROVE_CONFIGS } from "@/lib/approve-utils";

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

    const result = await approveWithUpsert(APPROVE_CONFIGS.channelStrategy, {
      supabase,
      projectId,
      draftId,
      segmentId,
      userId: user.id,
    });

    return NextResponse.json({
      success: result.success,
      approved: result.approved,
      segment_id: segmentId,
      updated: result.updated,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
