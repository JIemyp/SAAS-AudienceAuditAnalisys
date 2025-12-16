// Approve ALL existing canvas_drafts → canvas for entire project
// NO regeneration, just transfer existing data
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireWriteAccess } from "@/lib/permissions";
import { handleApiError, ApiError } from "@/lib/api-utils";

export async function POST(request: NextRequest) {
  try {
    const { projectId } = await request.json();

    if (!projectId) throw new ApiError("Project ID is required", 400);

    const supabase = await createServerClient();
    const adminSupabase = createAdminClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new ApiError("Unauthorized", 401);

    // Check write access (owner or editor can approve)
    await requireWriteAccess(supabase, adminSupabase, projectId, user.id);

    // Get ALL canvas_drafts for this project
    const { data: drafts, error: draftsError } = await adminSupabase
      .from("canvas_drafts")
      .select("*")
      .eq("project_id", projectId);

    if (draftsError) throw new ApiError(`Failed to fetch drafts: ${draftsError.message}`, 500);
    if (!drafts || drafts.length === 0) {
      return NextResponse.json({
        success: false,
        error: "No canvas_drafts found for this project",
        stats: { draftsFound: 0 }
      });
    }

    // Get existing canvas records to avoid duplicates
    const { data: existingCanvas } = await adminSupabase
      .from("canvas")
      .select("pain_id")
      .eq("project_id", projectId);

    const existingPainIds = new Set((existingCanvas || []).map(c => c.pain_id));

    // Filter out drafts that already have approved canvas
    const draftsToApprove = drafts.filter(d => !existingPainIds.has(d.pain_id));

    const approved = [];
    const skipped = [];
    const errors = [];

    for (const draft of draftsToApprove) {
      try {
        const { data: canvas, error } = await adminSupabase
          .from("canvas")
          .insert({
            project_id: projectId,
            segment_id: draft.segment_id,
            pain_id: draft.pain_id,
            emotional_aspects: draft.emotional_aspects,
            behavioral_patterns: draft.behavioral_patterns,
            buying_signals: draft.buying_signals,
          })
          .select()
          .single();

        if (error) {
          errors.push({ draftId: draft.id, painId: draft.pain_id, error: error.message });
        } else {
          approved.push(canvas);
        }
      } catch (err) {
        errors.push({ draftId: draft.id, painId: draft.pain_id, error: String(err) });
      }
    }

    // Count how many were already approved
    const alreadyApproved = drafts.length - draftsToApprove.length;

    return NextResponse.json({
      success: true,
      stats: {
        totalDraftsFound: drafts.length,
        alreadyApproved,
        newlyApproved: approved.length,
        errors: errors.length,
      },
      approved,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// GET - check status and clean duplicates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const cleanDuplicates = searchParams.get("cleanDuplicates") === "true";

    if (!projectId) throw new ApiError("Project ID is required", 400);

    const supabase = await createServerClient();
    const adminSupabase = createAdminClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new ApiError("Unauthorized", 401);

    // Check write access for modification operations
    if (cleanDuplicates || searchParams.get("clearAll") === "true" ||
        searchParams.get("cleanNonTopPains") === "true" || searchParams.get("fixOrphans") === "true") {
      await requireWriteAccess(supabase, adminSupabase, projectId, user.id);
    }

    // Clear ALL canvas records if requested
    const clearAll = searchParams.get("clearAll") === "true";
    let clearedAll = 0;
    if (clearAll) {
      const { data: deleted } = await adminSupabase
        .from("canvas")
        .delete()
        .eq("project_id", projectId)
        .select("id");
      clearedAll = deleted?.length || 0;
    }

    // Get all canvas records
    const { data: allCanvas } = await adminSupabase
      .from("canvas")
      .select("id, pain_id, created_at")
      .eq("project_id", projectId)
      .order("created_at", { ascending: true });

    // Find duplicates (same pain_id)
    const painIdToRecords: Record<string, { id: string; created_at: string }[]> = {};
    for (const c of allCanvas || []) {
      if (!painIdToRecords[c.pain_id]) {
        painIdToRecords[c.pain_id] = [];
      }
      painIdToRecords[c.pain_id].push({ id: c.id, created_at: c.created_at });
    }

    const duplicates: { pain_id: string; count: number; idsToDelete: string[] }[] = [];
    for (const [painId, records] of Object.entries(painIdToRecords)) {
      if (records.length > 1) {
        // Keep the first (oldest), delete the rest
        const idsToDelete = records.slice(1).map(r => r.id);
        duplicates.push({ pain_id: painId, count: records.length, idsToDelete });
      }
    }

    let deletedCount = 0;
    if (cleanDuplicates && duplicates.length > 0) {
      const allIdsToDelete = duplicates.flatMap(d => d.idsToDelete);
      const { error: deleteError } = await adminSupabase
        .from("canvas")
        .delete()
        .in("id", allIdsToDelete);

      if (!deleteError) {
        deletedCount = allIdsToDelete.length;
      }
    }

    // Also clean canvas records that are NOT for TOP pains
    const cleanNonTopPains = searchParams.get("cleanNonTopPains") === "true";
    let nonTopPainsDeleted = 0;

    if (cleanNonTopPains) {
      // Get all TOP pain IDs
      const { data: topPainsData } = await adminSupabase
        .from("pains_ranking")
        .select("pain_id")
        .eq("project_id", projectId)
        .eq("is_top_pain", true);

      const topPainIds = new Set((topPainsData || []).map(p => p.pain_id));

      // Find canvas records that are NOT for TOP pains
      const nonTopCanvasIds = (allCanvas || [])
        .filter(c => !topPainIds.has(c.pain_id))
        .map(c => c.id);

      if (nonTopCanvasIds.length > 0) {
        const { error: deleteNonTopError } = await adminSupabase
          .from("canvas")
          .delete()
          .in("id", nonTopCanvasIds);

        if (!deleteNonTopError) {
          nonTopPainsDeleted = nonTopCanvasIds.length;
        }
      }
    }

    // Count after cleanup
    const { count: draftsCount } = await adminSupabase
      .from("canvas_drafts")
      .select("*", { count: "exact", head: true })
      .eq("project_id", projectId);

    const { count: canvasCount } = await adminSupabase
      .from("canvas")
      .select("*", { count: "exact", head: true })
      .eq("project_id", projectId);

    const { count: topPainsCount } = await adminSupabase
      .from("pains_ranking")
      .select("*", { count: "exact", head: true })
      .eq("project_id", projectId)
      .eq("is_top_pain", true);

    // Find missing pain_ids (TOP pains without canvas_drafts)
    const { data: topPainsForMissing } = await adminSupabase
      .from("pains_ranking")
      .select("pain_id, segment_id")
      .eq("project_id", projectId)
      .eq("is_top_pain", true);

    const { data: draftsForMissing } = await adminSupabase
      .from("canvas_drafts")
      .select("pain_id")
      .eq("project_id", projectId);

    const draftPainIds = new Set((draftsForMissing || []).map(d => d.pain_id));
    const missingPainsList = (topPainsForMissing || []).filter(p => !draftPainIds.has(p.pain_id));

    // Fix orphan records - pains_ranking entries that reference non-existent pains_initial
    const fixOrphans = searchParams.get("fixOrphans") === "true";
    let orphansDeleted = 0;

    if (fixOrphans && missingPainsList.length > 0) {
      // Check which pain_ids actually exist in pains_initial
      const { data: existingPains } = await adminSupabase
        .from("pains_initial")
        .select("id")
        .in("id", missingPainsList.map(p => p.pain_id));

      const existingPainIds = new Set((existingPains || []).map(p => p.id));
      const orphanPainIds = missingPainsList
        .map(p => p.pain_id)
        .filter(id => !existingPainIds.has(id));

      if (orphanPainIds.length > 0) {
        // Delete orphan records from pains_ranking
        const { error: deleteOrphansError } = await adminSupabase
          .from("pains_ranking")
          .delete()
          .eq("project_id", projectId)
          .in("pain_id", orphanPainIds);

        if (!deleteOrphansError) {
          orphansDeleted = orphanPainIds.length;
        }
      }
    }

    // Get pain names for missing ones
    let missingPainDetails: { pain_id: string; pain_name: string; segment_id: string; segment_name?: string }[] = [];
    if (missingPainsList.length > 0) {
      const { data: painDetails } = await adminSupabase
        .from("pains_initial")
        .select("id, name, segment_id")
        .in("id", missingPainsList.map(p => p.pain_id));

      // Get segment names too
      const segmentIds = [...new Set((painDetails || []).map(p => p.segment_id))];
      const { data: segmentDetails } = await adminSupabase
        .from("segments")
        .select("id, name")
        .in("id", segmentIds);

      const segmentMap = new Map((segmentDetails || []).map(s => [s.id, s.name]));

      missingPainDetails = (painDetails || []).map(p => ({
        pain_id: p.id,
        pain_name: p.name,
        segment_id: p.segment_id,
        segment_name: segmentMap.get(p.segment_id) || "Unknown",
      }));
    }

    return NextResponse.json({
      success: true,
      stats: {
        topPainsCount: topPainsCount || 0,
        canvasDraftsCount: draftsCount || 0,
        canvasApprovedCount: canvasCount || 0,
        missingDraftsCount: missingPainsList.length,
        duplicatesFound: duplicates.length,
        duplicatesDeleted: deletedCount,
        nonTopPainsDeleted,
        clearedAll,
        orphansDeleted,
      },
      duplicates: duplicates.length > 0 ? duplicates : undefined,
      missingPains: missingPainDetails,
      // Debug: raw missing pain_ids from pains_ranking
      missingPainIds: missingPainsList.map(p => p.pain_id),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
