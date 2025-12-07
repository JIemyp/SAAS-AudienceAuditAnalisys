// Get approved pains for a project with ranking info (is_top_pain)
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { handleApiError, ApiError } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const segmentId = searchParams.get("segmentId");

    if (!projectId) {
      throw new ApiError("Project ID is required", 400);
    }

    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new ApiError("Unauthorized", 401);
    }

    // Build query for pains
    let query = supabase
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

    // Get rankings to add is_top_pain and impact_score
    const { data: rankings } = await supabase
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
