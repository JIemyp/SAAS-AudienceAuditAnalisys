// Generate Segment Details - Prompt 11
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { generateWithClaude, parseJSONResponse } from "@/lib/anthropic";
import { buildSegmentDetailsPrompt, SegmentDetailsResponse } from "@/lib/prompts";
import { handleApiError, ApiError, withRetry } from "@/lib/api-utils";
import { Project, SegmentInitial, Triggers } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const { projectId, segmentId } = await request.json();
    if (!projectId) throw new ApiError("Project ID is required", 400);

    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new ApiError("Unauthorized", 401);

    const { data: project } = await supabase.from("projects").select("*").eq("id", projectId).eq("user_id", user.id).single();
    if (!project) throw new ApiError("Project not found", 404);

    const { data: triggers } = await supabase.from("triggers").select("*").eq("project_id", projectId).order("approved_at", { ascending: false }).limit(1).single();
    if (!triggers) throw new ApiError("Triggers not found", 400);

    // If segmentId provided, generate for that segment; otherwise generate for all
    let segments: SegmentInitial[];
    if (segmentId) {
      const { data: segment } = await supabase.from("segments_initial").select("*").eq("id", segmentId).single();
      if (!segment) throw new ApiError("Segment not found", 404);
      segments = [segment as SegmentInitial];
    } else {
      const { data: allSegments } = await supabase.from("segments_initial").select("*").eq("project_id", projectId).order("segment_index");
      if (!allSegments || allSegments.length === 0) throw new ApiError("Segments not found", 400);
      segments = allSegments as SegmentInitial[];
    }

    const drafts = [];
    for (const segment of segments) {
      const prompt = buildSegmentDetailsPrompt((project as Project).onboarding_data, segment, triggers as Triggers);

      const response = await withRetry(async () => {
        const text = await generateWithClaude({ prompt, maxTokens: 4096 });
        return parseJSONResponse<SegmentDetailsResponse>(text);
      });

      const { data: draft, error } = await supabase.from("segment_details_drafts").insert({
        project_id: projectId,
        segment_id: segment.id,
        needs: response.needs,
        triggers: response.triggers,
        core_values: response.core_values,
        awareness_level: response.awareness_level,
        objections: response.objections,
        version: 1,
      }).select().single();

      if (!error) drafts.push(draft);
    }

    await supabase.from("projects").update({ current_step: "segment_details_draft" }).eq("id", projectId);
    return NextResponse.json({ success: true, drafts });
  } catch (error) { return handleApiError(error); }
}
