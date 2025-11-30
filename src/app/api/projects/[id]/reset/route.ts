// =====================================================
// Reset Project Analysis Data
// =====================================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { handleApiError, ApiError } from "@/lib/api-utils";

// All tables that contain analysis data for a project
const TABLES_TO_CLEAR = [
  // Block 1: Portrait
  "validation_drafts",
  "validation",
  "portrait_drafts",
  "portrait",
  "portrait_review_drafts",
  "portrait_review",
  "portrait_final_drafts",
  "portrait_final",

  // Block 2: Deep Analysis
  "jobs_drafts",
  "jobs",
  "preferences_drafts",
  "preferences",
  "difficulties_drafts",
  "difficulties",
  "triggers_drafts",
  "triggers",

  // Block 3: Segmentation
  "segments_drafts",
  "segments_initial",
  "segments_review_drafts",
  "segments_review",
  "segment_details_drafts",
  "segment_details",

  // Block 4: Pains
  "pains_drafts",
  "pains_initial",
  "pains_ranking_drafts",
  "pains_ranking",
  "canvas_drafts",
  "canvas",
  "canvas_extended_drafts",
  "canvas_extended",

  // Final Report Tables
  "audience",
  "segments",
  "pains",

  // Legacy tables
  "audience_overviews",
  "audience_segments",
];

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

    // Verify user owns this project
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new ApiError("Unauthorized", 401);
    }

    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, user_id")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      throw new ApiError("Project not found", 404);
    }

    if (project.user_id !== user.id) {
      throw new ApiError("Forbidden", 403);
    }

    // Delete data from all tables
    const deletePromises = TABLES_TO_CLEAR.map(async (table) => {
      try {
        await supabase.from(table).delete().eq("project_id", projectId);
      } catch (e) {
        // Ignore errors for tables that might not exist
        console.log(`Table ${table} might not exist, skipping...`);
      }
    });

    await Promise.all(deletePromises);

    // Reset project status and step
    // Try to update current_step if it exists, otherwise just update status
    const { error: updateError } = await supabase
      .from("projects")
      .update({
        current_step: "validation_draft",
        status: "draft",
        updated_at: new Date().toISOString(),
      })
      .eq("id", projectId);

    // If current_step column doesn't exist, try updating without it
    if (updateError) {
      console.log("Update error (trying without current_step):", updateError.message);
      const { error: fallbackError } = await supabase
        .from("projects")
        .update({
          status: "draft",
          updated_at: new Date().toISOString(),
        })
        .eq("id", projectId);

      if (fallbackError) {
        console.error("Fallback update error:", fallbackError);
        throw new ApiError("Failed to reset project", 500);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Project analysis data has been reset",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
