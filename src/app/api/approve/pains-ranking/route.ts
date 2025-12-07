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

    // Filter only TOP pains (is_top_pain = true)
    const topPainDrafts = drafts.filter(d => d.is_top_pain === true);
    if (topPainDrafts.length === 0) throw new ApiError("No TOP pains selected", 400);

    // Clear existing pains_ranking for this project before approving new ones
    await supabase
      .from("pains_ranking")
      .delete()
      .eq("project_id", projectId);

    const approved = [];
    for (const draft of topPainDrafts) {
      // Get segment_id from pains_initial if not in draft
      let segmentId = draft.segment_id;
      if (!segmentId && draft.pain_id) {
        const { data: pain } = await supabase
          .from("pains_initial")
          .select("segment_id")
          .eq("id", draft.pain_id)
          .single();
        segmentId = pain?.segment_id;
      }

      const { data: ranking, error } = await supabase.from("pains_ranking").insert({
        project_id: projectId,
        segment_id: segmentId,
        pain_id: draft.pain_id,
        impact_score: draft.impact_score,
        is_top_pain: true,
        ranking_reasoning: draft.ranking_reasoning,
      }).select().single();

      if (!error) approved.push(ranking);
    }

    const nextStep = getNextStep("pains_ranking_draft");
    await supabase.from("projects").update({ current_step: nextStep }).eq("id", projectId);

    return NextResponse.json({ success: true, approved, next_step: nextStep });
  } catch (error) { return handleApiError(error); }
}
