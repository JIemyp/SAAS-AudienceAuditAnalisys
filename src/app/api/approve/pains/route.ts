// =====================================================
// Approve Pains - Per Segment (Batch)
// Uses centralized approve-utils with history tracking
// =====================================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireWriteAccess } from "@/lib/permissions";
import { handleApiError, ApiError } from "@/lib/api-utils";
import { approveBatch, APPROVE_CONFIGS } from "@/lib/approve-utils";

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
    const adminSupabase = createAdminClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new ApiError("Unauthorized", 401);
    }

    // Check write access (owner or editor can approve)
    await requireWriteAccess(supabase, adminSupabase, projectId, user.id);

    const ids = Array.isArray(draftIds) ? draftIds : [draftIds];

    const result = await approveBatch(APPROVE_CONFIGS.pains, {
      supabase: adminSupabase,
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
