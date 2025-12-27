// =====================================================
// Convenience endpoint for playbooks-canvas drafts
// =====================================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { handleApiError, ApiError } from "@/lib/api-utils";
import { requireProjectAccess } from "@/lib/permissions";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const segmentId = searchParams.get("segmentId");
    const painId = searchParams.get("painId");

    if (!projectId) throw new ApiError("Project ID is required", 400);
    if (!segmentId) throw new ApiError("Segment ID is required", 400);
    if (!painId) throw new ApiError("Pain ID is required", 400);

    const supabase = await createServerClient();
    const adminSupabase = createAdminClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new ApiError("Unauthorized", 401);

    await requireProjectAccess(supabase, adminSupabase, projectId, user.id);

    const { data: draft, error } = await adminSupabase
      .from("playbooks_canvas_drafts")
      .select("*")
      .eq("project_id", projectId)
      .eq("segment_id", segmentId)
      .eq("pain_id", painId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      console.log("Playbooks canvas draft error:", error.message);
    }

    return NextResponse.json({ success: true, draft: draft || null });
  } catch (error) {
    return handleApiError(error);
  }
}

