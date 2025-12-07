// Get TOP pains for a segment with canvas status
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

    // Step 1: Get TOP pains from pains_ranking (only is_top_pain=true)
    let rankingQuery = supabase
      .from("pains_ranking")
      .select("*")
      .eq("project_id", projectId)
      .eq("is_top_pain", true);

    if (segmentId) {
      rankingQuery = rankingQuery.eq("segment_id", segmentId);
    }

    const { data: rankings, error: rankingError } = await rankingQuery.order("impact_score", { ascending: false });

    if (rankingError) {
      throw new ApiError(rankingError.message, 500);
    }

    if (!rankings || rankings.length === 0) {
      return NextResponse.json({
        success: true,
        topPains: [],
        totalCount: 0,
        withCanvas: 0,
        withoutCanvas: 0,
      });
    }

    // Step 2: Get pain details from pains_initial
    const painIds = rankings.map(r => r.pain_id).filter(Boolean);
    const { data: pains, error: painsError } = await supabase
      .from("pains_initial")
      .select("*")
      .in("id", painIds);

    if (painsError) {
      throw new ApiError(painsError.message, 500);
    }

    // Create a map for quick lookup
    const painsMap = new Map((pains || []).map(p => [p.id, p]));

    // Step 3: Get canvas_drafts to check which pains have canvas
    let canvasQuery = supabase
      .from("canvas_drafts")
      .select("pain_id")
      .eq("project_id", projectId);

    if (segmentId) {
      canvasQuery = canvasQuery.eq("segment_id", segmentId);
    }

    const { data: canvasDrafts } = await canvasQuery;
    const painsWithCanvas = new Set(canvasDrafts?.map(c => c.pain_id) || []);

    // Build response with canvas status
    const topPains = rankings.map(ranking => {
      const pain = painsMap.get(ranking.pain_id);
      return {
        id: pain?.id || ranking.pain_id,
        name: pain?.name || "Unknown Pain",
        description: pain?.description || "",
        segment_id: ranking.segment_id,
        impact_score: ranking.impact_score,
        ranking_reasoning: ranking.ranking_reasoning,
        has_canvas: painsWithCanvas.has(ranking.pain_id),
      };
    });

    return NextResponse.json({
      success: true,
      topPains,
      totalCount: topPains.length,
      withCanvas: topPains.filter(p => p.has_canvas).length,
      withoutCanvas: topPains.filter(p => !p.has_canvas).length,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
