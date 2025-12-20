// Report Data API - Unified endpoint for Overview, Full Report, and Explorer
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
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
    const adminSupabase = createAdminClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new ApiError("Unauthorized", 401);
    }

    // Check if user is a member
    const { data: membership } = await supabase
      .from("project_members")
      .select("id")
      .eq("project_id", projectId)
      .eq("user_id", user.id)
      .maybeSingle();

    // Use admin client to fetch project (bypass RLS)
    const { data: project } = await adminSupabase
      .from("projects")
      .select("id, name, onboarding_data, user_id")
      .eq("id", projectId)
      .single();

    if (!project) {
      throw new ApiError("Project not found", 404);
    }

    // Check if user is owner or member
    const isOwner = project.user_id === user.id;
    const isMember = !!membership;

    if (!isOwner && !isMember) {
      throw new ApiError("Project not found", 404);
    }

    switch (level) {
      case "overview":
        return await fetchOverviewData(adminSupabase, projectId, project);
      case "full":
        return await fetchFullReportData(adminSupabase, projectId, project);
      case "explorer":
        return await fetchExplorerData(adminSupabase, projectId, segmentId);
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
  // Get all data for full report - following the CASCADE order

  // 1. Portrait Final
  const { data: portrait } = await supabase
    .from("portrait_final")
    .select("*")
    .eq("project_id", projectId)
    .order("approved_at", { ascending: false })
    .limit(1)
    .single();

  // 2. Segments - use 'segments' table as primary source because pains/canvas reference segments.id
  // IMPORTANT: pains_initial.segment_id references segments.id, NOT segments_final.id
  // So we MUST use segments table for Full Report to link data correctly
  const { data: segmentsTable } = await supabase
    .from("segments")
    .select("*")
    .eq("project_id", projectId)
    .order("order_index");

  // Fallback to segments_final if segments table is empty (shouldn't happen after approve)
  let segments = segmentsTable;
  if (!segments || segments.length === 0) {
    const { data: segmentsFinal } = await supabase
      .from("segments_final")
      .select("*, order_index:segment_index")
      .eq("project_id", projectId)
      .order("segment_index");
    segments = segmentsFinal;
  }

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

      // V5 Modules - Channel Strategy, Competitive Intelligence, Pricing Psychology, Trust Framework, JTBD Context
      const { data: channelStrategy } = await supabase
        .from("channel_strategy")
        .select("*")
        .eq("project_id", projectId)
        .eq("segment_id", segment.id)
        .limit(1)
        .single();

      const { data: competitiveIntelligence } = await supabase
        .from("competitive_intelligence")
        .select("*")
        .eq("project_id", projectId)
        .eq("segment_id", segment.id)
        .limit(1)
        .single();

      const { data: pricingPsychology } = await supabase
        .from("pricing_psychology")
        .select("*")
        .eq("project_id", projectId)
        .eq("segment_id", segment.id)
        .limit(1)
        .single();

      const { data: trustFramework } = await supabase
        .from("trust_framework")
        .select("*")
        .eq("project_id", projectId)
        .eq("segment_id", segment.id)
        .limit(1)
        .single();

      const { data: jtbdContext } = await supabase
        .from("jtbd_context")
        .select("*")
        .eq("project_id", projectId)
        .eq("segment_id", segment.id)
        .limit(1)
        .single();

      // V6 Modules - UGC Creator Profiles (per segment)
      const { data: ugcCreatorProfile } = await supabase
        .from("ugc_creator_profiles")
        .select("*")
        .eq("project_id", projectId)
        .eq("segment_id", segment.id)
        .limit(1)
        .single();

      // V6 Modules - Strategy Personalized & Ads & Communications (per segment × pain)
      // Collect for all top pains
      const strategyPersonalized: unknown[] = [];
      const strategyAds: unknown[] = [];
      const communicationsFunnels: unknown[] = [];

      for (const pain of painsWithRanking.filter((p: { is_top_pain: boolean }) => p.is_top_pain)) {
        const { data: sp } = await supabase
          .from("strategy_personalized")
          .select("*")
          .eq("project_id", projectId)
          .eq("segment_id", segment.id)
          .eq("pain_id", pain.id)
          .limit(1)
          .single();
        if (sp) strategyPersonalized.push({ ...sp, pain_name: pain.name });

        const { data: sa } = await supabase
          .from("strategy_ads")
          .select("*")
          .eq("project_id", projectId)
          .eq("segment_id", segment.id)
          .eq("pain_id", pain.id)
          .limit(1)
          .single();
        if (sa) strategyAds.push({ ...sa, pain_name: pain.name });

        const { data: cf } = await supabase
          .from("communications_funnel")
          .select("*")
          .eq("project_id", projectId)
          .eq("segment_id", segment.id)
          .eq("pain_id", pain.id)
          .limit(1)
          .single();
        if (cf) communicationsFunnels.push({ ...cf, pain_name: pain.name });
      }

      // Separate TOP pains and Other pains
      const topPains = painsWithRanking.filter((p: { is_top_pain: boolean }) => p.is_top_pain);
      const otherPains = painsWithRanking.filter((p: { is_top_pain: boolean }) => !p.is_top_pain);

      segmentsWithData.push({
        ...segment,
        // Use segment_index if available (from segments_final), otherwise order_index
        order_index: segment.segment_index ?? segment.order_index ?? 0,
        details,
        jobs,
        preferences,
        difficulties,
        triggers,
        topPains,      // TOP pains with full analysis
        otherPains,    // Other discovered pains (not analyzed deeply)
        pains: painsWithRanking, // Keep for backwards compatibility
        canvas: canvasData,
        canvasExtended: canvasExtendedData,
        // V5 Modules
        channelStrategy,
        competitiveIntelligence,
        pricingPsychology,
        trustFramework,
        jtbdContext,
        // V6 Modules
        ugcCreatorProfile,
        strategyPersonalized,
        strategyAds,
        communicationsFunnels,
      });
    }
  }

  // V6 Project-level modules: Strategy Summary & Strategy Global
  const { data: strategySummary } = await supabase
    .from("strategy_summary")
    .select("*")
    .eq("project_id", projectId)
    .limit(1)
    .single();

  const { data: strategyGlobal } = await supabase
    .from("strategy_global")
    .select("*")
    .eq("project_id", projectId)
    .limit(1)
    .single();

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
      // V6 Project-level
      strategySummary,
      strategyGlobal,
    },
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchExplorerData(supabase: any, projectId: string, segmentId: string | null) {
  // Get all segments from 'segments' table (enriched with details)
  const { data: segments } = await supabase
    .from("segments")
    .select("id, name, description, sociodemographics, order_index")
    .eq("project_id", projectId)
    .order("order_index");

  // DEDUPLICATE segments by normalized name - keep only one per name (preferring lower order_index)
  // Normalize: lowercase, remove extra spaces, trim
  const normalizeName = (name: string) => name.toLowerCase().replace(/\s+/g, ' ').trim();

  const uniqueSegments: typeof segments = [];
  const seenNames = new Set<string>();
  for (const seg of (segments || [])) {
    const normalizedName = normalizeName(seg.name);
    if (!seenNames.has(normalizedName)) {
      seenNames.add(normalizedName);
      uniqueSegments.push(seg);
    }
  }

  // Get segments_final - these define which segments are "selected"
  const { data: segmentsFinal } = await supabase
    .from("segments_final")
    .select("id, name, segment_index")
    .eq("project_id", projectId)
    .order("segment_index");

  // Also get segment_details to catch segments that have been approved
  const { data: segmentDetails } = await supabase
    .from("segment_details")
    .select("segment_id")
    .eq("project_id", projectId);

  // Build sets for matching
  const finalIdSet = new Set((segmentsFinal || []).map((s: { id: string }) => s.id));
  const finalNameSet = new Set((segmentsFinal || []).map((s: { name: string }) => normalizeName(s.name)));
  const detailsIdSet = new Set((segmentDetails || []).map((d: { segment_id: string }) => d.segment_id));

  // Build index map from segments_final (by ID and normalized name for fallback)
  const finalIdToIndex = new Map<string, number>(
    (segmentsFinal || []).map((s: { id: string; segment_index: number }) => [s.id, s.segment_index])
  );
  const finalNameToIndex = new Map<string, number>(
    (segmentsFinal || []).map((s: { name: string; segment_index: number }) => [normalizeName(s.name), s.segment_index])
  );

  // A segment is "selected" if:
  // 1. Its ID matches segments_final, OR
  // 2. Its normalized name matches segments_final, OR
  // 3. It has segment_details (was approved)
  const selectedSegmentIds = new Set<string>();
  const segmentIndexMap = new Map<string, number>();

  uniqueSegments.forEach((seg: { id: string; name: string; order_index?: number }) => {
    const normalizedName = normalizeName(seg.name);
    let isSelected = false;
    let displayIndex = 0;

    // Check ID match with segments_final
    if (finalIdSet.has(seg.id)) {
      isSelected = true;
      const idx = finalIdToIndex.get(seg.id);
      displayIndex = idx !== undefined ? idx - 1 : 0; // 1-based to 0-based
    }
    // Check normalized name match with segments_final
    else if (finalNameSet.has(normalizedName)) {
      isSelected = true;
      const idx = finalNameToIndex.get(normalizedName);
      displayIndex = idx !== undefined ? idx - 1 : 0;
    }
    // Check if has segment_details (approved)
    else if (detailsIdSet.has(seg.id)) {
      isSelected = true;
      // No index from segments_final, use order_index
      displayIndex = seg.order_index ?? 0;
    }

    if (isSelected) {
      selectedSegmentIds.add(seg.id);
      segmentIndexMap.set(seg.id, displayIndex);
    }
  });

  console.log(`[Explorer] segments: ${uniqueSegments.length}, segmentsFinal: ${segmentsFinal?.length || 0}, segmentDetails: ${segmentDetails?.length || 0}`);
  console.log(`[Explorer] selectedSegmentIds: ${selectedSegmentIds.size}`);

  if (!uniqueSegments || uniqueSegments.length === 0) {
    return NextResponse.json({
      success: true,
      data: {
        segments: [],
        selectedSegment: null,
      },
    });
  }

  // Mark segments as selected and assign proper display_index
  // Selected segments get their segment_index (0-10 for 11 segments)
  // Other segments get indices after all selected ones
  const selectedCount = selectedSegmentIds.size;
  let otherIndex = selectedCount; // Start other segments after selected ones

  const enrichedSegments = uniqueSegments.map((seg: { id: string; order_index: number }) => {
    const isSelected = selectedSegmentIds.has(seg.id);
    let displayIndex: number;

    if (isSelected) {
      // Use segment_index from map (0-based)
      displayIndex = (segmentIndexMap.get(seg.id) ?? 0);
    } else {
      // Assign sequential index after all selected segments
      displayIndex = otherIndex++;
    }

    return {
      ...seg,
      is_selected: isSelected,
      display_index: displayIndex,
    };
  });

  // Sort: selected first (by display_index), then others (by display_index)
  enrichedSegments.sort((a: { is_selected: boolean; display_index: number }, b: { is_selected: boolean; display_index: number }) => {
    if (a.is_selected && !b.is_selected) return -1;
    if (!a.is_selected && b.is_selected) return 1;
    return a.display_index - b.display_index;
  });

  // If no segment selected, use first one (prefer selected segments)
  const targetSegmentId = segmentId || enrichedSegments[0]?.id || uniqueSegments[0].id;

  // Get detailed data for selected segment
  const selectedSegment = enrichedSegments.find((s: { id: string }) => s.id === targetSegmentId);

  if (!selectedSegment) {
    return NextResponse.json({
      success: true,
      data: {
        segments: enrichedSegments,
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

  // V5 Modules - Channel Strategy, Competitive Intelligence, Pricing Psychology, Trust Framework, JTBD Context
  const { data: channelStrategy } = await supabase
    .from("channel_strategy")
    .select("*")
    .eq("project_id", projectId)
    .eq("segment_id", targetSegmentId)
    .limit(1)
    .single();

  const { data: competitiveIntelligence } = await supabase
    .from("competitive_intelligence")
    .select("*")
    .eq("project_id", projectId)
    .eq("segment_id", targetSegmentId)
    .limit(1)
    .single();

  const { data: pricingPsychology } = await supabase
    .from("pricing_psychology")
    .select("*")
    .eq("project_id", projectId)
    .eq("segment_id", targetSegmentId)
    .limit(1)
    .single();

  const { data: trustFramework } = await supabase
    .from("trust_framework")
    .select("*")
    .eq("project_id", projectId)
    .eq("segment_id", targetSegmentId)
    .limit(1)
    .single();

  const { data: jtbdContext } = await supabase
    .from("jtbd_context")
    .select("*")
    .eq("project_id", projectId)
    .eq("segment_id", targetSegmentId)
    .limit(1)
    .single();

  return NextResponse.json({
    success: true,
    data: {
      segments: enrichedSegments,
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
        // V5 Modules
        channelStrategy,
        competitiveIntelligence,
        pricingPsychology,
        trustFramework,
        jtbdContext,
      },
    },
  });
}
