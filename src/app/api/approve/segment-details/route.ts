// Approve Segment Details - Prompt 11
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { handleApiError, ApiError, getNextStep } from "@/lib/api-utils";

export async function POST(request: NextRequest) {
  try {
    const { projectId, draftIds } = await request.json();
    if (!projectId || !draftIds) throw new ApiError("Project ID and Draft IDs required", 400);

    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new ApiError("Unauthorized", 401);

    const ids = Array.isArray(draftIds) ? draftIds : [draftIds];
    const { data: drafts } = await supabase.from("segment_details_drafts").select("*").in("id", ids);
    if (!drafts || drafts.length === 0) throw new ApiError("Drafts not found", 404);

    const approved = [];
    for (const draft of drafts) {
      const { data: detail, error } = await supabase.from("segment_details").insert({
        project_id: projectId,
        segment_id: draft.segment_id,
        needs: draft.needs,
        triggers: draft.triggers,
        core_values: draft.core_values,
        awareness_level: draft.awareness_level,
        objections: draft.objections,
      }).select().single();

      if (!error) approved.push(detail);
    }

    const nextStep = getNextStep("segment_details_draft");
    await supabase.from("projects").update({ current_step: nextStep }).eq("id", projectId);

    return NextResponse.json({ success: true, approved, next_step: nextStep });
  } catch (error) { return handleApiError(error); }
}
