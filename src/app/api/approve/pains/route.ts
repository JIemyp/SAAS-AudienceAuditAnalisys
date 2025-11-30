// Approve Pains - Prompt 12 (Per Segment)
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
      .from("pains_drafts")
      .select("*")
      .in("id", ids)
      .eq("segment_id", segmentId);

    if (!drafts || drafts.length === 0) throw new ApiError("Drafts not found", 404);

    const approved = [];
    for (const draft of drafts) {
      const { data: pain, error } = await supabase
        .from("pains_initial")
        .insert({
          project_id: projectId,
          segment_id: segmentId,
          pain_index: draft.pain_index,
          name: draft.name,
          description: draft.description,
          deep_triggers: draft.deep_triggers,
          examples: draft.examples,
        })
        .select()
        .single();

      if (!error) approved.push(pain);
    }

    return NextResponse.json({ success: true, approved, segment_id: segmentId });
  } catch (error) {
    return handleApiError(error);
  }
}
