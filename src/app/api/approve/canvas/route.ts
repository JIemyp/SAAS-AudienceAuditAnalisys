// Approve Canvas - Prompt 14 (Per Segment)
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { handleApiError, ApiError } from "@/lib/api-utils";

export async function POST(request: NextRequest) {
  try {
    const { projectId, draftIds, segmentId } = await request.json();

    if (!projectId || !draftIds) throw new ApiError("Project ID and Draft IDs required", 400);
    if (!segmentId) throw new ApiError("Segment ID is required", 400);

    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new ApiError("Unauthorized", 401);

    const ids = Array.isArray(draftIds) ? draftIds : [draftIds];
    const { data: drafts } = await supabase
      .from("canvas_drafts")
      .select("*")
      .in("id", ids)
      .eq("segment_id", segmentId);

    if (!drafts || drafts.length === 0) throw new ApiError("Drafts not found", 404);

    // Get existing canvas records to prevent duplicates
    const { data: existingCanvas } = await supabase
      .from("canvas")
      .select("id, pain_id")
      .eq("project_id", projectId)
      .eq("segment_id", segmentId);

    const existingPainIds = new Set((existingCanvas || []).map(c => c.pain_id));

    const approved = [];
    for (const draft of drafts) {
      // Check if canvas for this pain already exists
      if (existingPainIds.has(draft.pain_id)) {
        // Update existing canvas
        const existingId = existingCanvas?.find(c => c.pain_id === draft.pain_id)?.id;
        if (existingId) {
          const { data: canvas, error } = await supabase
            .from("canvas")
            .update({
              emotional_aspects: draft.emotional_aspects,
              behavioral_patterns: draft.behavioral_patterns,
              buying_signals: draft.buying_signals,
            })
            .eq("id", existingId)
            .select()
            .single();

          if (!error) approved.push(canvas);
        }
      } else {
        // Insert new canvas
        const { data: canvas, error } = await supabase
          .from("canvas")
          .insert({
            project_id: projectId,
            segment_id: segmentId,
            pain_id: draft.pain_id,
            emotional_aspects: draft.emotional_aspects,
            behavioral_patterns: draft.behavioral_patterns,
            buying_signals: draft.buying_signals,
          })
          .select()
          .single();

        if (!error) approved.push(canvas);
      }
    }

    return NextResponse.json({ success: true, approved, segment_id: segmentId });
  } catch (error) {
    return handleApiError(error);
  }
}
