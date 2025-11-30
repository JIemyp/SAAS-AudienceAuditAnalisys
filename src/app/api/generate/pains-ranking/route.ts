// Generate Pains Ranking - Prompt 13
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { generateWithClaude, parseJSONResponse } from "@/lib/anthropic";
import { buildPainsRankingPrompt, PainsRankingResponse } from "@/lib/prompts";
import { handleApiError, ApiError, withRetry } from "@/lib/api-utils";
import { SegmentInitial, PainInitial } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const { projectId, segmentId } = await request.json();
    if (!projectId) throw new ApiError("Project ID is required", 400);

    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new ApiError("Unauthorized", 401);

    // Get segments
    let segments: SegmentInitial[];
    if (segmentId) {
      const { data: segment } = await supabase.from("segments_initial").select("*").eq("id", segmentId).single();
      if (!segment) throw new ApiError("Segment not found", 404);
      segments = [segment as SegmentInitial];
    } else {
      const { data: allSegments } = await supabase.from("segments_initial").select("*").eq("project_id", projectId).order("segment_index");
      if (!allSegments) throw new ApiError("Segments not found", 400);
      segments = allSegments as SegmentInitial[];
    }

    const drafts = [];
    for (const segment of segments) {
      const { data: pains } = await supabase.from("pains_initial").select("*").eq("segment_id", segment.id).order("pain_index");
      if (!pains || pains.length === 0) continue;

      const prompt = buildPainsRankingPrompt(segment, pains as PainInitial[]);

      const response = await withRetry(async () => {
        const text = await generateWithClaude({ prompt, maxTokens: 4096 });
        return parseJSONResponse<PainsRankingResponse>(text);
      });

      for (const ranking of response.rankings) {
        const pain = pains.find(p => p.pain_index === ranking.pain_index);
        if (!pain) continue;

        const { data: draft, error } = await supabase.from("pains_ranking_drafts").insert({
          project_id: projectId,
          pain_id: pain.id,
          impact_score: ranking.impact_score,
          is_top_pain: ranking.is_top_pain,
          ranking_reasoning: ranking.reasoning,
          version: 1,
        }).select().single();

        if (!error) drafts.push(draft);
      }
    }

    await supabase.from("projects").update({ current_step: "pains_ranking_draft" }).eq("id", projectId);
    return NextResponse.json({ success: true, drafts });
  } catch (error) { return handleApiError(error); }
}
