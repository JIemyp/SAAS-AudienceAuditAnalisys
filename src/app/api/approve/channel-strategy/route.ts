// =====================================================
// Approve Channel Strategy - NEW MODULE (Per Segment)
// =====================================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { handleApiError, ApiError } from "@/lib/api-utils";

export async function POST(request: NextRequest) {
  try {
    const { projectId, draftId, segmentId } = await request.json();

    if (!projectId || !draftId) {
      throw new ApiError("Project ID and Draft ID are required", 400);
    }

    if (!segmentId) {
      throw new ApiError("Segment ID is required", 400);
    }

    const supabase = await createServerClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new ApiError("Unauthorized", 401);
    }

    // Get draft
    const { data: draft, error: draftError } = await supabase
      .from("channel_strategy_drafts")
      .select("*")
      .eq("id", draftId)
      .eq("project_id", projectId)
      .eq("segment_id", segmentId)
      .single();

    if (draftError || !draft) {
      throw new ApiError("Draft not found", 404);
    }

    // Check if approved record already exists for this segment
    const { data: existingApproved } = await supabase
      .from("channel_strategy")
      .select("id")
      .eq("project_id", projectId)
      .eq("segment_id", segmentId)
      .single();

    if (existingApproved) {
      // Update existing approved record
      const { data: approved, error: updateError } = await supabase
        .from("channel_strategy")
        .update({
          primary_platforms: draft.primary_platforms,
          content_preferences: draft.content_preferences,
          trusted_sources: draft.trusted_sources,
          communities: draft.communities,
          search_patterns: draft.search_patterns,
          advertising_response: draft.advertising_response,
          approved_at: new Date().toISOString(),
        })
        .eq("id", existingApproved.id)
        .select()
        .single();

      if (updateError) {
        throw new ApiError("Failed to update approved record", 500);
      }

      return NextResponse.json({ success: true, approved, segment_id: segmentId, updated: true });
    }

    // Insert new approved record
    const { data: approved, error: insertError } = await supabase
      .from("channel_strategy")
      .insert({
        project_id: projectId,
        segment_id: segmentId,
        primary_platforms: draft.primary_platforms,
        content_preferences: draft.content_preferences,
        trusted_sources: draft.trusted_sources,
        communities: draft.communities,
        search_patterns: draft.search_patterns,
        advertising_response: draft.advertising_response,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      throw new ApiError("Failed to approve", 500);
    }

    return NextResponse.json({ success: true, approved, segment_id: segmentId });
  } catch (error) {
    return handleApiError(error);
  }
}
