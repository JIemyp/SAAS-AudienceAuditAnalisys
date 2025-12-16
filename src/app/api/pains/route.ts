// Get approved pains for a project with ranking info (is_top_pain)
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { handleApiError, ApiError } from "@/lib/api-utils";
import { requireProjectAccess, requireWriteAccess } from "@/lib/permissions";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const segmentId = searchParams.get("segmentId");

    if (!projectId) {
      throw new ApiError("Project ID is required", 400);
    }

    const supabase = await createServerClient();
    const adminSupabase = createAdminClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new ApiError("Unauthorized", 401);
    }

    // Check project access (owner or member)
    await requireProjectAccess(supabase, adminSupabase, projectId, user.id);

    // Build query for pains (use admin to bypass RLS)
    let query = adminSupabase
      .from("pains_initial")
      .select("*")
      .eq("project_id", projectId)
      .order("pain_index");

    if (segmentId) {
      query = query.eq("segment_id", segmentId);
    }

    const { data: pains, error } = await query;

    if (error) {
      throw new ApiError(error.message, 500);
    }

    // Get rankings to add is_top_pain and impact_score (use admin to bypass RLS)
    const { data: rankings } = await adminSupabase
      .from("pains_ranking")
      .select("pain_id, is_top_pain, impact_score")
      .eq("project_id", projectId);

    // Merge pains with ranking data
    const painsWithRanking = (pains || []).map(pain => {
      const ranking = rankings?.find(r => r.pain_id === pain.id);
      return {
        ...pain,
        is_top_pain: ranking?.is_top_pain || false,
        impact_score: ranking?.impact_score || 0,
      };
    });

    return NextResponse.json({
      success: true,
      pains: painsWithRanking,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// Delete all approved pains for a project
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const segmentId = searchParams.get("segmentId");

    if (!projectId) {
      throw new ApiError("Project ID is required", 400);
    }

    const supabase = await createServerClient();
    const adminSupabase = createAdminClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new ApiError("Unauthorized", 401);
    }

    // Check write access (owner or editor only)
    await requireWriteAccess(supabase, adminSupabase, projectId, user.id);

    // Build delete query (use admin to bypass RLS)
    let query = adminSupabase
      .from("pains_initial")
      .delete()
      .eq("project_id", projectId);

    if (segmentId) {
      query = query.eq("segment_id", segmentId);
    }

    const { error } = await query;

    if (error) {
      throw new ApiError(error.message, 500);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
