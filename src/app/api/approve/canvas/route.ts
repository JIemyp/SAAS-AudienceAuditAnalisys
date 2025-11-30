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

    const approved = [];
    for (const draft of drafts) {
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

    return NextResponse.json({ success: true, approved, segment_id: segmentId });
  } catch (error) {
    return handleApiError(error);
  }
}
