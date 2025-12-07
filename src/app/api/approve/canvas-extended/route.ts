// Approve Canvas Extended V2 - Prompt 15 (Per Pain)
// V2: Uses pain_id, structured JSONB output
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { handleApiError, ApiError } from "@/lib/api-utils";

export async function POST(request: NextRequest) {
  try {
    const { projectId, draftIds, segmentId, painId } = await request.json();

    if (!projectId) throw new ApiError("Project ID is required", 400);
    if (!draftIds) throw new ApiError("Draft IDs are required", 400);
    if (!segmentId) throw new ApiError("Segment ID is required", 400);

    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new ApiError("Unauthorized", 401);

    const ids = Array.isArray(draftIds) ? draftIds : [draftIds];

    // Get drafts from V2 table
    const { data: drafts, error: draftsError } = await supabase
      .from("canvas_extended_drafts")
      .select("*")
      .in("id", ids)
      .eq("segment_id", segmentId);

    if (draftsError || !drafts || drafts.length === 0) {
      throw new ApiError("Drafts not found", 404);
    }

    const approved = [];
    for (const draft of drafts) {
      // Check if already approved for this pain_id
      const { data: existing } = await supabase
        .from("canvas_extended")
        .select("id")
        .eq("pain_id", draft.pain_id)
        .eq("project_id", projectId)
        .single();

      if (existing) {
        // Update existing
        const { data: canvasExt, error } = await supabase
          .from("canvas_extended")
          .update({
            customer_journey: draft.customer_journey,
            emotional_map: draft.emotional_map,
            narrative_angles: draft.narrative_angles,
            messaging_framework: draft.messaging_framework,
            voice_and_tone: draft.voice_and_tone,
            approved_at: new Date().toISOString(),
          })
          .eq("id", existing.id)
          .select()
          .single();

        if (!error) approved.push(canvasExt);
      } else {
        // Insert new
        const { data: canvasExt, error } = await supabase
          .from("canvas_extended")
          .insert({
            project_id: projectId,
            segment_id: segmentId,
            pain_id: draft.pain_id,
            customer_journey: draft.customer_journey,
            emotional_map: draft.emotional_map,
            narrative_angles: draft.narrative_angles,
            messaging_framework: draft.messaging_framework,
            voice_and_tone: draft.voice_and_tone,
          })
          .select()
          .single();

        if (!error) approved.push(canvasExt);
      }
    }

    // Check if all canvas_extended for this segment are approved
    const { data: topPains } = await supabase
      .from("pains_ranking")
      .select("pain_id")
      .eq("project_id", projectId)
      .eq("segment_id", segmentId)
      .eq("is_top_pain", true);

    const topPainIds = topPains?.map(p => p.pain_id) || [];

    const { data: approvedExtended } = await supabase
      .from("canvas_extended")
      .select("pain_id")
      .eq("project_id", projectId)
      .eq("segment_id", segmentId)
      .in("pain_id", topPainIds);

    const segmentComplete = approvedExtended?.length === topPainIds.length;

    // Check if all segments are complete
    let allSegmentsComplete = false;
    if (segmentComplete) {
      const { data: allSegments } = await supabase
        .from("segments")
        .select("id")
        .eq("project_id", projectId);

      if (allSegments) {
        const { data: allTopPains } = await supabase
          .from("pains_ranking")
          .select("pain_id")
          .eq("project_id", projectId)
          .eq("is_top_pain", true);

        const allTopPainIds = allTopPains?.map(p => p.pain_id) || [];

        const { data: allApproved } = await supabase
          .from("canvas_extended")
          .select("pain_id")
          .eq("project_id", projectId)
          .in("pain_id", allTopPainIds);

        allSegmentsComplete = allApproved?.length === allTopPainIds.length;
      }
    }

    // Update project step if all segments complete
    if (allSegmentsComplete) {
      await supabase
        .from("projects")
        .update({
          current_step: "completed",
          status: "completed",
        })
        .eq("id", projectId);
    }

    return NextResponse.json({
      success: true,
      approved,
      segment_id: segmentId,
      segment_complete: segmentComplete,
      all_segments_complete: allSegmentsComplete,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
