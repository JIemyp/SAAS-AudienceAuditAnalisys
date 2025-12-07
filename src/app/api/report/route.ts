// Report Data API - Unified endpoint for Overview, Full Report, and Explorer
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { handleApiError, ApiError } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const level = searchParams.get("level") || "overview"; // overview | full | explorer
    const segmentId = searchParams.get("segmentId"); // optional, for explorer

    if (!projectId) {
      throw new ApiError("Project ID is required", 400);
    }

    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new ApiError("Unauthorized", 401);
    }

    // Verify project ownership
    const { data: project } = await supabase
      .from("projects")
      .select("id, name, onboarding_data")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .single();

    if (!project) {
      throw new ApiError("Project not found", 404);
    }

    switch (level) {
      case "overview":
        return await fetchOverviewData(supabase, projectId, project);
      case "full":
        return await fetchFullReportData(supabase, projectId, project);
      case "explorer":
        return await fetchExplorerData(supabase, projectId, segmentId);
      default:
        throw new ApiError("Invalid level parameter", 400);
    }
  } catch (error) {
    return handleApiError(error);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchOverviewData(supabase: any, projectId: string, project: any) {
  // Portrait final
  const { data: portrait } = await supabase
    .from("portrait_final")
    .select("*")
    .eq("project_id", projectId)
    .order("approved_at", { ascending: false })
    .limit(1)
    .single();

  // Segments count
  const { count: segmentsCount } = await supabase
    .from("segments")
    .select("*", { count: "exact", head: true })
    .eq("project_id", projectId);

  // Pains count
  const { count: painsCount } = await supabase
    .from("pains_initial")
    .select("*", { count: "exact", head: true })
    .eq("project_id", projectId);

  // Canvas count
  const { count: canvasCount } = await supabase
    .from("canvas")
    .select("*", { count: "exact", head: true })
    .eq("project_id", projectId);

  // Top 3 segments
  const { data: topSegments } = await supabase
    .from("segments")
    .select("id, name, description, sociodemographics")
    .eq("project_id", projectId)
    .order("order_index")
    .limit(3);

  // Top 3 pains (by impact score) - join with pains_initial for names
  const { data: topPainsRanking } = await supabase
    .from("pains_ranking")
    .select("pain_id, impact_score, is_top_pain")
    .eq("project_id", projectId)
    .eq("is_top_pain", true)
    .order("impact_score", { ascending: false })
    .limit(3);

  // Get pain names for top pains
  let topPains: Array<{ id: string; name: string; impact_score: number }> = [];
  if (topPainsRanking && topPainsRanking.length > 0) {
    const painIds = topPainsRanking.map((r: { pain_id: string }) => r.pain_id);
    const { data: painNames } = await supabase
      .from("pains_initial")
      .select("id, name")
      .in("id", painIds);

    topPains = topPainsRanking.map((ranking: { pain_id: string; impact_score: number }) => {
      const pain = painNames?.find((p: { id: string }) => p.id === ranking.pain_id);
      return {
        id: ranking.pain_id,
        name: pain?.name || "Unknown",
        impact_score: ranking.impact_score,
      };
    });
  }

  return NextResponse.json({
    success: true,
    data: {
      project: {
        id: project.id,
        name: project.name,
        onboarding_data: project.onboarding_data,
      },
      portrait,
      counts: {
        segments: segmentsCount || 0,
        pains: painsCount || 0,
        canvas: canvasCount || 0,
      },
      topSegments: topSegments || [],
      topPains,
    },
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchFullReportData(supabase: any, projectId: string, project: any) {
  // Get all data for full report

  // Portrait
  const { data: portrait } = await supabase
    .from("portrait_final")
    .select("*")
    .eq("project_id", projectId)
    .order("approved_at", { ascending: false })
    .limit(1)
    .single();

  // All segments with details
  const { data: segments } = await supabase
    .from("segments")
    .select("*")
    .eq("project_id", projectId)
    .order("order_index");

  // Get segment details, jobs, preferences, difficulties, triggers for each segment
  const segmentsWithData = [];
  if (segments) {
    for (const segment of segments) {
      // Segment details
      const { data: details } = await supabase
        .from("segment_details")
        .select("*")
        .eq("project_id", projectId)
        .eq("segment_id", segment.id)
        .order("approved_at", { ascending: false })
        .limit(1)
        .single();

      // Jobs
      const { data: jobs } = await supabase
        .from("jobs")
        .select("*")
        .eq("project_id", projectId)
        .eq("segment_id", segment.id)
        .order("approved_at", { ascending: false })
        .limit(1)
        .single();

      // Preferences
      const { data: preferences } = await supabase
        .from("preferences")
        .select("*")
        .eq("project_id", projectId)
        .eq("segment_id", segment.id)
        .order("approved_at", { ascending: false })
        .limit(1)
        .single();

      // Difficulties
      const { data: difficulties } = await supabase
        .from("difficulties")
        .select("*")
        .eq("project_id", projectId)
        .eq("segment_id", segment.id)
        .order("approved_at", { ascending: false })
        .limit(1)
        .single();

      // Triggers
      const { data: triggers } = await supabase
        .from("triggers")
        .select("*")
        .eq("project_id", projectId)
        .eq("segment_id", segment.id)
        .order("approved_at", { ascending: false })
        .limit(1)
        .single();

      // Pains for this segment
      const { data: pains } = await supabase
        .from("pains_initial")
        .select("*")
        .eq("project_id", projectId)
        .eq("segment_id", segment.id)
        .order("pain_index");

      // Get rankings for pains
      let painsWithRanking = [];
      if (pains && pains.length > 0) {
        const painIds = pains.map((p: { id: string }) => p.id);
        const { data: rankings } = await supabase
          .from("pains_ranking")
          .select("*")
          .eq("project_id", projectId)
          .in("pain_id", painIds);

        painsWithRanking = pains.map((pain: { id: string }) => {
          const ranking = rankings?.find((r: { pain_id: string }) => r.pain_id === pain.id);
          return {
            ...pain,
            impact_score: ranking?.impact_score || 0,
            is_top_pain: ranking?.is_top_pain || false,
            ranking_reasoning: ranking?.ranking_reasoning || "",
          };
        });
      }

      // Canvas for this segment - try to load by segment_id first, fall back to pain_id
      const topPainIds = painsWithRanking
        .filter((p: { is_top_pain: boolean }) => p.is_top_pain)
        .map((p: { id: string }) => p.id);

      let canvasData: unknown[] = [];

      // First try to load canvas by segment_id (new schema)
      const { data: canvasBySegment } = await supabase
        .from("canvas")
        .select("*")
        .eq("project_id", projectId)
        .eq("segment_id", segment.id);

      if (canvasBySegment && canvasBySegment.length > 0) {
        canvasData = canvasBySegment;
      } else if (topPainIds.length > 0) {
        // Fall back to loading by pain_id (old schema)
        const { data: canvas } = await supabase
          .from("canvas")
          .select("*")
          .eq("project_id", projectId)
          .in("pain_id", topPainIds);
        canvasData = canvas || [];
      }

      // Canvas Extended V2 - links by pain_id
      let canvasExtendedData: unknown[] = [];
      const allSegmentPainIds = painsWithRanking.map((p: { id: string }) => p.id);
      if (allSegmentPainIds.length > 0) {
        const { data: canvasExtended } = await supabase
          .from("canvas_extended")
          .select("*")
          .eq("project_id", projectId)
          .in("pain_id", allSegmentPainIds);
        canvasExtendedData = canvasExtended || [];
      }

      segmentsWithData.push({
        ...segment,
        details,
        jobs,
        preferences,
        difficulties,
        triggers,
        pains: painsWithRanking,
        canvas: canvasData,
        canvasExtended: canvasExtendedData,
      });
    }
  }

  return NextResponse.json({
    success: true,
    data: {
      project: {
        id: project.id,
        name: project.name,
        onboarding_data: project.onboarding_data,
      },
      portrait,
      segments: segmentsWithData,
    },
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchExplorerData(supabase: any, projectId: string, segmentId: string | null) {
  // Get all segments
  const { data: segments } = await supabase
    .from("segments")
    .select("id, name, description, sociodemographics, order_index")
    .eq("project_id", projectId)
    .order("order_index");

  if (!segments || segments.length === 0) {
    return NextResponse.json({
      success: true,
      data: {
        segments: [],
        selectedSegment: null,
      },
    });
  }

  // If no segment selected, use first one
  const targetSegmentId = segmentId || segments[0].id;

  // Get detailed data for selected segment
  const selectedSegment = segments.find((s: { id: string }) => s.id === targetSegmentId);

  if (!selectedSegment) {
    return NextResponse.json({
      success: true,
      data: {
        segments,
        selectedSegment: null,
      },
    });
  }

  // Segment details
  const { data: details } = await supabase
    .from("segment_details")
    .select("*")
    .eq("project_id", projectId)
    .eq("segment_id", targetSegmentId)
    .order("approved_at", { ascending: false })
    .limit(1)
    .single();

  // Jobs
  const { data: jobs } = await supabase
    .from("jobs")
    .select("*")
    .eq("project_id", projectId)
    .eq("segment_id", targetSegmentId)
    .order("approved_at", { ascending: false })
    .limit(1)
    .single();

  // Preferences
  const { data: preferences } = await supabase
    .from("preferences")
    .select("*")
    .eq("project_id", projectId)
    .eq("segment_id", targetSegmentId)
    .order("approved_at", { ascending: false })
    .limit(1)
    .single();

  // Difficulties
  const { data: difficulties } = await supabase
    .from("difficulties")
    .select("*")
    .eq("project_id", projectId)
    .eq("segment_id", targetSegmentId)
    .order("approved_at", { ascending: false })
    .limit(1)
    .single();

  // Triggers
  const { data: triggers } = await supabase
    .from("triggers")
    .select("*")
    .eq("project_id", projectId)
    .eq("segment_id", targetSegmentId)
    .order("approved_at", { ascending: false })
    .limit(1)
    .single();

  // Pains
  const { data: pains } = await supabase
    .from("pains_initial")
    .select("*")
    .eq("project_id", projectId)
    .eq("segment_id", targetSegmentId)
    .order("pain_index");

  // Get rankings
  let painsWithRanking = [];
  if (pains && pains.length > 0) {
    const painIds = pains.map((p: { id: string }) => p.id);
    const { data: rankings } = await supabase
      .from("pains_ranking")
      .select("*")
      .eq("project_id", projectId)
      .in("pain_id", painIds);

    painsWithRanking = pains.map((pain: { id: string }) => {
      const ranking = rankings?.find((r: { pain_id: string }) => r.pain_id === pain.id);
      return {
        ...pain,
        impact_score: ranking?.impact_score || 0,
        is_top_pain: ranking?.is_top_pain || false,
        ranking_reasoning: ranking?.ranking_reasoning || "",
      };
    });
  }

  // Canvas for this segment - try to load by segment_id first, fall back to pain_id
  const topPainIds = painsWithRanking
    .filter((p: { is_top_pain: boolean }) => p.is_top_pain)
    .map((p: { id: string }) => p.id);

  let canvasData: unknown[] = [];

  // First try to load canvas by segment_id (new schema)
  const { data: canvasBySegment } = await supabase
    .from("canvas")
    .select("*")
    .eq("project_id", projectId)
    .eq("segment_id", targetSegmentId);

  if (canvasBySegment && canvasBySegment.length > 0) {
    canvasData = canvasBySegment;
  } else if (topPainIds.length > 0) {
    // Fall back to loading by pain_id (old schema)
    const { data: canvas } = await supabase
      .from("canvas")
      .select("*")
      .eq("project_id", projectId)
      .in("pain_id", topPainIds);
    canvasData = canvas || [];
  }

  // Canvas extended V2 - links by pain_id, not canvas_id
  let canvasExtendedData: unknown[] = [];
  const allPainIds = painsWithRanking.map((p: { id: string }) => p.id);
  if (allPainIds.length > 0) {
    const { data: canvasExtended } = await supabase
      .from("canvas_extended")
      .select("*")
      .eq("project_id", projectId)
      .in("pain_id", allPainIds);
    canvasExtendedData = canvasExtended || [];
  }

  return NextResponse.json({
    success: true,
    data: {
      segments,
      selectedSegment: {
        ...selectedSegment,
        details,
        jobs,
        preferences,
        difficulties,
        triggers,
        pains: painsWithRanking,
        canvas: canvasData,
        canvasExtended: canvasExtendedData,
      },
    },
  });
}
