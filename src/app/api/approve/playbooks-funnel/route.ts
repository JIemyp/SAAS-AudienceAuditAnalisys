// =====================================================
// Approve Playbooks Funnel - Per Segment × Top Pain
// Uses centralized approve-utils with history tracking
// =====================================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireWriteAccess } from "@/lib/permissions";
import { handleApiError, ApiError } from "@/lib/api-utils";
import { approveWithUpsert, APPROVE_CONFIGS } from "@/lib/approve-utils";

export async function POST(request: NextRequest) {
  try {
    const { projectId, draftId, segmentId, painId } = await request.json();

    if (!projectId || !draftId) {
      throw new ApiError("Project ID and Draft ID are required", 400);
    }

    if (!segmentId) {
      throw new ApiError("Segment ID is required", 400);
    }

    if (!painId) {
      throw new ApiError("Pain ID is required", 400);
    }

    const supabase = await createServerClient();
    const adminSupabase = createAdminClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new ApiError("Unauthorized", 401);
    }

    await requireWriteAccess(supabase, adminSupabase, projectId, user.id);

    const result = await approveWithUpsert(APPROVE_CONFIGS.playbooksFunnel, {
      supabase: adminSupabase,
      projectId,
      draftId,
      segmentId,
      painId,
      userId: user.id,
    });

    return NextResponse.json({
      success: result.success,
      approved: result.approved,
      segment_id: segmentId,
      pain_id: painId,
      updated: result.updated,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

