// Batch delete drafts for a project (all segments)
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { handleApiError, ApiError } from "@/lib/api-utils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, table } = body;

    if (!projectId) {
      throw new ApiError("Project ID is required", 400);
    }

    if (!table) {
      throw new ApiError("Table name is required", 400);
    }

    // Validate table name to prevent SQL injection
    const allowedTables = [
      "pains_drafts",
      "jobs_drafts",
      "triggers_drafts",
      "preferences_drafts",
      "difficulties_drafts",
      "canvas_drafts",
    ];

    if (!allowedTables.includes(table)) {
      throw new ApiError("Invalid table name", 400);
    }

    const supabase = await createServerClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new ApiError("Unauthorized", 401);
    }

    // Delete all drafts for this project from the specified table
    const { error } = await supabase
      .from(table)
      .delete()
      .eq("project_id", projectId);

    if (error) {
      throw new ApiError(error.message, 500);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
