// Generate Canvas Extended - Prompt 15 (Per Segment)
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { generateWithClaude, parseJSONResponse } from "@/lib/anthropic";
import { buildCanvasExtendedPrompt, CanvasExtendedResponse } from "@/lib/prompts";
import { handleApiError, ApiError, withRetry } from "@/lib/api-utils";
import { Segment, PainInitial, Canvas } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const { projectId, segmentId, canvasId } = await request.json();

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

    // Get canvases to process for this segment
    let canvasesToProcess: { canvas: Canvas; pain: PainInitial }[] = [];

    if (canvasId) {
      const { data: canvas } = await supabase
        .from("canvas")
        .select("*")
        .eq("id", canvasId)
        .eq("segment_id", segmentId)
        .single();
      if (!canvas) throw new ApiError("Canvas not found", 404);

      const { data: pain } = await supabase
        .from("pains_initial")
        .select("*")
        .eq("id", canvas.pain_id)
        .single();
      if (!pain) throw new ApiError("Pain not found", 404);

      canvasesToProcess = [{ canvas: canvas as Canvas, pain: pain as PainInitial }];
    } else {
      // Get all approved canvases for this segment
      const { data: allCanvases } = await supabase
        .from("canvas")
        .select("*")
        .eq("project_id", projectId)
        .eq("segment_id", segmentId);

      if (!allCanvases || allCanvases.length === 0) {
        throw new ApiError("No canvases found for this segment. Complete canvas analysis first.", 400);
      }

      for (const canvas of allCanvases) {
        const { data: pain } = await supabase
          .from("pains_initial")
          .select("*")
          .eq("id", canvas.pain_id)
          .single();
        if (pain) {
          canvasesToProcess.push({ canvas: canvas as Canvas, pain: pain as PainInitial });
        }
      }
    }

    const drafts = [];
    for (const { canvas, pain } of canvasesToProcess) {
      const prompt = buildCanvasExtendedPrompt(segment as Segment, pain, canvas);

      const response = await withRetry(async () => {
        const text = await generateWithClaude({ prompt, maxTokens: 8192 });
        return parseJSONResponse<CanvasExtendedResponse>(text);
      });

      const { data: draft, error } = await supabase
        .from("canvas_extended_drafts")
        .insert({
          project_id: projectId,
          segment_id: segmentId,
          canvas_id: canvas.id,
          extended_analysis: response.extended_analysis,
          different_angles: response.different_angles,
          journey_description: response.journey_description,
          emotional_peaks: response.emotional_peaks,
          purchase_moment: response.purchase_moment,
          post_purchase: response.post_purchase,
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
