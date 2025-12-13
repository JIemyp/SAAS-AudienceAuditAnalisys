// Approve Pains Ranking - Prompt 13
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { handleApiError, ApiError, getNextStep } from "@/lib/api-utils";
import { approveWithUpsert, APPROVE_CONFIGS } from "@/lib/approve-utils";

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

    const hasTopPainSelected = drafts.some(d => d.is_top_pain === true);
    if (!hasTopPainSelected) throw new ApiError("Select at least one TOP pain before approving", 400);

    const approved = [];
    const config = APPROVE_CONFIGS.painsRanking;

    for (const draft of drafts) {
      if (!draft.pain_id) {
        console.warn("[pains-ranking approve] Draft missing pain_id, skipping", draft.id);
        continue;
      }

      let segmentId: string | undefined = draft.segment_id || undefined;

      if (!segmentId) {
        const { data: pain } = await supabase
          .from("pains_initial")
          .select("segment_id")
          .eq("project_id", projectId)
          .eq("id", draft.pain_id)
          .single();
        segmentId = pain?.segment_id;
      }

      if (!segmentId) {
        console.warn("[pains-ranking approve] Unable to determine segment_id for draft", draft.id);
        continue;
      }

      const result = await approveWithUpsert(config, {
        supabase,
        projectId,
        draftId: draft.id,
        segmentId,
        painId: draft.pain_id,
        userId: user.id,
      });

      if (result.success) {
        approved.push(result.approved);
      }
    }

    const nextStep = getNextStep("pains_ranking_draft");
    await supabase.from("projects").update({ current_step: nextStep }).eq("id", projectId);

    return NextResponse.json({ success: true, approved, next_step: nextStep });
  } catch (error) { return handleApiError(error); }
}
