// Delete entire version of segments
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { handleApiError, ApiError } from "@/lib/api-utils";

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const version = searchParams.get("version");

    if (!projectId || !version) {
      throw new ApiError("Project ID and version are required", 400);
    }

    const supabase = await createServerClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new ApiError("Unauthorized", 401);
    }

    // Verify project belongs to user
    const { data: project } = await supabase
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .single();

    if (!project) {
      throw new ApiError("Project not found", 404);
    }

    // Delete all segments with this version
    const { error: deleteError, count } = await supabase
      .from("segments_drafts")
      .delete()
      .eq("project_id", projectId)
      .eq("version", parseInt(version));

    if (deleteError) {
      throw new ApiError(`Failed to delete version: ${deleteError.message}`, 500);
    }

    console.log(`[drafts/version] Deleted version ${version} (${count} segments) for project ${projectId}`);

    return NextResponse.json({
      success: true,
      deleted_version: parseInt(version),
      deleted_count: count
    });
  } catch (error) {
    return handleApiError(error);
  }
}
