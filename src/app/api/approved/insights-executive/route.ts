// =====================================================
// Convenience endpoint for insights-executive approved
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

    if (!projectId) throw new ApiError("Project ID is required", 400);

    const supabase = await createServerClient();
    const adminSupabase = createAdminClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new ApiError("Unauthorized", 401);

    await requireProjectAccess(supabase, adminSupabase, projectId, user.id);

    const { data: approved, error } = await adminSupabase
      .from("insights_executive")
      .select("*")
      .eq("project_id", projectId)
      .order("approved_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      console.log("Insights executive approved error:", error.message);
    }

    return NextResponse.json({ success: true, approved: approved || null });
  } catch (error) {
    return handleApiError(error);
  }
}

