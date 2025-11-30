// Approve Pains Ranking - Prompt 13
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
    const { data: drafts } = await supabase.from("pains_ranking_drafts").select("*").in("id", ids);
    if (!drafts || drafts.length === 0) throw new ApiError("Drafts not found", 404);

    const approved = [];
    for (const draft of drafts) {
      const { data: ranking, error } = await supabase.from("pains_ranking").insert({
        project_id: projectId,
        pain_id: draft.pain_id,
        impact_score: draft.impact_score,
        is_top_pain: draft.is_top_pain,
        ranking_reasoning: draft.ranking_reasoning,
      }).select().single();

      if (!error) approved.push(ranking);
    }

    const nextStep = getNextStep("pains_ranking_draft");
    await supabase.from("projects").update({ current_step: nextStep }).eq("id", projectId);

    return NextResponse.json({ success: true, approved, next_step: nextStep });
  } catch (error) { return handleApiError(error); }
}
