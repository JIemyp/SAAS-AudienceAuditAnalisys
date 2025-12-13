// =====================================================
// Approve Canvas - Per Segment (Batch by Pain ID)
// Uses centralized approve-utils with history tracking
// =====================================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { handleApiError, ApiError } from "@/lib/api-utils";
import { approveBatchByPain, APPROVE_CONFIGS } from "@/lib/approve-utils";

export async function POST(request: NextRequest) {
  try {
    const { projectId, draftIds, segmentId } = await request.json();

    if (!projectId || !draftIds) {
      throw new ApiError("Project ID and Draft IDs are required", 400);
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

    const result = await approveBatchByPain(APPROVE_CONFIGS.canvas, {
      supabase,
      projectId,
      draftIds: ids,
      segmentId,
      userId: user.id,
    });

    return NextResponse.json({
      success: result.success,
      approved: result.approved,
      segment_id: segmentId,
      errors: result.errors.length > 0 ? result.errors : undefined,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
