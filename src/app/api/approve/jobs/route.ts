// =====================================================
// Approve Jobs to Be Done - Prompt 5 (Per Segment)
// Uses idempotent approve with history tracking
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

    if (!projectId || !draftId) {
      throw new ApiError("Project ID and Draft ID are required", 400);
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

    // Idempotent approve: INSERT if not exists, UPDATE if exists
    // Also tracks history in data_history table
    const result = await approveWithUpsert(APPROVE_CONFIGS.jobs, {
      supabase: adminSupabase,
      projectId,
      draftId,
      segmentId,
      userId: user.id,
    });

    // Note: We don't update project step here because user stays on same page
    // Project step is managed at the page level when ALL segments are approved

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
