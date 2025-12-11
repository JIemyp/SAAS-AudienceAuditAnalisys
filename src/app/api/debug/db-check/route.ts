// Debug: Check database tables for a project
// This endpoint bypasses RLS by using server client with auth
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { handleApiError, ApiError } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const table = searchParams.get("table"); // optional: specific table to check

    if (!projectId) {
      throw new ApiError("Project ID is required", 400);
    }

    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new ApiError("Unauthorized", 401);
    }

    // If specific table requested
    if (table) {
      const { data, count } = await supabase
        .from(table)
        .select("*", { count: "exact" })
        .eq("project_id", projectId)
        .limit(5);

      return NextResponse.json({
        success: true,
        table,
        count,
        sample: data,
      });
    }

    // Check all relevant tables
    const tables = [
      "projects",
      "portrait_final",
      "segments_final",
      "segments",
      "segment_details",
      "segment_details_drafts",
      "jobs",
      "preferences",
      "difficulties",
      "triggers",
      "pains_initial",
      "pains_ranking",
      "pains_ranking_drafts",
      "canvas",
      "canvas_drafts",
      "canvas_extended",
      "canvas_extended_drafts",
    ];

    const results: Record<string, { count: number; sample?: unknown }> = {};

    for (const tableName of tables) {
      try {
        // Special handling for projects table (no project_id filter)
        if (tableName === "projects") {
          const { data, count } = await supabase
            .from(tableName)
            .select("id, name, current_step, status", { count: "exact" })
            .eq("id", projectId)
            .limit(1);
          results[tableName] = { count: count || 0, sample: data?.[0] };
        } else {
          const { count } = await supabase
            .from(tableName)
            .select("*", { count: "exact", head: true })
            .eq("project_id", projectId);
          results[tableName] = { count: count || 0 };
        }
      } catch {
        results[tableName] = { count: -1 }; // -1 means error/table not found
      }
    }

    // Summary
    const summary = {
      hasPortrait: (results.portrait_final?.count || 0) > 0,
      segmentsFinal: results.segments_final?.count || 0,
      segments: results.segments?.count || 0,
      segmentDetails: results.segment_details?.count || 0,
      painsInitial: results.pains_initial?.count || 0,
      painsRanking: results.pains_ranking?.count || 0,
      canvas: results.canvas?.count || 0,
      canvasDrafts: results.canvas_drafts?.count || 0,
      canvasExtended: results.canvas_extended?.count || 0,
      canvasExtendedDrafts: results.canvas_extended_drafts?.count || 0,
    };

    return NextResponse.json({
      success: true,
      projectId,
      project: results.projects?.sample,
      summary,
      details: results,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
