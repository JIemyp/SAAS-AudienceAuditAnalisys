// =====================================================
// Approve Strategy Global - Per Project
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
    const { projectId, draftId } = await request.json();

    if (!projectId || !draftId) {
      throw new ApiError("Project ID and Draft ID are required", 400);
    }

    const supabase = await createServerClient();
    const adminSupabase = createAdminClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new ApiError("Unauthorized", 401);
    }

    await requireWriteAccess(supabase, adminSupabase, projectId, user.id);

    const result = await approveWithUpsert(APPROVE_CONFIGS.strategyGlobal, {
      supabase: adminSupabase,
      projectId,
      draftId,
      userId: user.id,
    });

    return NextResponse.json({
      success: result.success,
      approved: result.approved,
      updated: result.updated,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
