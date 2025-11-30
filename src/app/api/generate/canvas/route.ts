// Generate Canvas - Prompt 14 (Per Segment)
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { generateWithClaude, parseJSONResponse } from "@/lib/anthropic";
import { buildCanvasPrompt, CanvasResponse } from "@/lib/prompts";
import { handleApiError, ApiError, withRetry } from "@/lib/api-utils";
import { Segment, PainInitial } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const { projectId, segmentId, painId } = await request.json();

    if (!projectId) throw new ApiError("Project ID is required", 400);
    if (!segmentId) throw new ApiError("Segment ID is required", 400);

    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new ApiError("Unauthorized", 401);

    // Get segment
    const { data: segment, error: segmentError } = await supabase
      .from("segments")
      .select("*")
      .eq("id", segmentId)
      .eq("project_id", projectId)
      .single();

    if (segmentError || !segment) throw new ApiError("Segment not found", 404);

    // Get top pains for this segment (is_top_pain = true)
    let painsToProcess: PainInitial[] = [];

    if (painId) {
      const { data: pain } = await supabase
        .from("pains_initial")
        .select("*")
        .eq("id", painId)
        .eq("segment_id", segmentId)
        .single();
      if (!pain) throw new ApiError("Pain not found", 404);
      painsToProcess = [pain as PainInitial];
    } else {
      // Get all top pains for this segment
      const { data: rankings } = await supabase
        .from("pains_ranking")
        .select("pain_id")
        .eq("project_id", projectId)
        .eq("segment_id", segmentId)
        .eq("is_top_pain", true);

      if (!rankings || rankings.length === 0) {
        throw new ApiError("No top pains found for this segment. Complete pains ranking first.", 400);
      }

      for (const ranking of rankings) {
        const { data: pain } = await supabase
          .from("pains_initial")
          .select("*")
          .eq("id", ranking.pain_id)
          .single();
        if (pain) painsToProcess.push(pain as PainInitial);
      }
    }

    const drafts = [];
    for (const pain of painsToProcess) {
      const prompt = buildCanvasPrompt(segment as Segment, pain);

      const response = await withRetry(async () => {
        const text = await generateWithClaude({ prompt, maxTokens: 6144 });
        return parseJSONResponse<CanvasResponse>(text);
      });

      const { data: draft, error } = await supabase
        .from("canvas_drafts")
        .insert({
          project_id: projectId,
          segment_id: segmentId,
          pain_id: pain.id,
          emotional_aspects: response.emotional_aspects,
          behavioral_patterns: response.behavioral_patterns,
          buying_signals: response.buying_signals,
          version: 1,
        })
        .select()
        .single();

      if (!error) drafts.push(draft);
    }

    return NextResponse.json({ success: true, drafts });
  } catch (error) {
    return handleApiError(error);
  }
}
