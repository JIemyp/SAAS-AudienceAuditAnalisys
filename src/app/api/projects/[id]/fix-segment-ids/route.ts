// Fix segment_id references in all tables
// Maps old segment_final IDs to new segments table IDs

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { handleApiError, ApiError } from "@/lib/api-utils";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;

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
      .select("id")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .single();

    if (!project) {
      throw new ApiError("Project not found", 404);
    }

    console.log(`[fix-segment-ids] Starting fix for project: ${projectId}`);

    // Get segments_final
    const { data: segmentsFinal } = await supabase
      .from("segments_final")
      .select("*")
      .eq("project_id", projectId);

    // Get segments (the correct table)
    const { data: segments } = await supabase
      .from("segments")
      .select("*")
      .eq("project_id", projectId);

    if (!segmentsFinal || !segments) {
      throw new ApiError("Could not fetch segments", 500);
    }

    console.log(`[fix-segment-ids] Found ${segmentsFinal.length} segments_final, ${segments.length} segments`);

    // Build mapping: segments_final.id -> segments.id (match by name or order_index)
    const idMapping: Record<string, string> = {};

    for (const finalSeg of segmentsFinal) {
      // Try to match by name first, then by order_index
      const matchedSeg = segments.find(
        s => s.name === finalSeg.name || s.order_index === finalSeg.segment_index
      );

      if (matchedSeg) {
        idMapping[finalSeg.id] = matchedSeg.id;
        console.log(`[fix-segment-ids] Mapped: ${finalSeg.id} (${finalSeg.name}) -> ${matchedSeg.id}`);
      } else {
        console.warn(`[fix-segment-ids] No match for segment_final: ${finalSeg.id} (${finalSeg.name})`);
      }
    }

    // Tables to update
    const tablesToFix = [
      "segment_details",
      "jobs",
      "preferences",
      "difficulties",
      "triggers",
      "pains_initial",
      "pains_drafts",
      "pains_ranking",
      "canvas_drafts",
      "canvas",
    ];

    const results: Record<string, number> = {};

    for (const table of tablesToFix) {
      let updatedCount = 0;

      // Get all records with old segment_ids
      const { data: records } = await supabase
        .from(table)
        .select("id, segment_id")
        .eq("project_id", projectId);

      if (records && records.length > 0) {
        for (const record of records) {
          const oldId = record.segment_id;
          const newId = idMapping[oldId];

          if (newId && newId !== oldId) {
            const { error } = await supabase
              .from(table)
              .update({ segment_id: newId })
              .eq("id", record.id);

            if (!error) {
              updatedCount++;
            } else {
              console.warn(`[fix-segment-ids] Failed to update ${table}.${record.id}:`, error.message);
            }
          }
        }
      }

      results[table] = updatedCount;
      if (updatedCount > 0) {
        console.log(`[fix-segment-ids] Updated ${updatedCount} records in ${table}`);
      }
    }

    console.log(`[fix-segment-ids] Fix complete for project: ${projectId}`);

    return NextResponse.json({
      success: true,
      message: "Segment IDs fixed successfully",
      mapping: idMapping,
      updates: results,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
