// Reset project data to Segment Details step
// Deletes: segments, segment_details, jobs, preferences, difficulties, triggers, pains, canvas
// Keeps: portrait_final, segments_final, segment_details_drafts

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

    console.log(`[reset-to-segment-details] Starting reset for project: ${projectId}`);

    // Delete in reverse order of dependencies
    const tablesToDelete = [
      "canvas_drafts",
      "canvas",
      "pains_ranking",
      "pains_initial",
      "pains_drafts",
      "triggers",
      "triggers_drafts",
      "difficulties",
      "difficulties_drafts",
      "preferences",
      "preferences_drafts",
      "jobs",
      "jobs_drafts",
      "segment_details",
      "segments",
    ];

    for (const table of tablesToDelete) {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq("project_id", projectId);

      if (error) {
        console.warn(`[reset-to-segment-details] Failed to delete from ${table}:`, error.message);
      } else {
        console.log(`[reset-to-segment-details] Deleted from ${table}`);
      }
    }

    // Update project step
    await supabase
      .from("projects")
      .update({ current_step: "segment_details" })
      .eq("id", projectId);

    console.log(`[reset-to-segment-details] Reset complete for project: ${projectId}`);

    return NextResponse.json({
      success: true,
      message: "Project reset to Segment Details step. Please approve segment details again.",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
