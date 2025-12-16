// Generate Segments Review - Prompt 10
// Increase timeout for AI generation
export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { generateWithAI, parseJSONResponse } from "@/lib/ai-client";
import { buildSegmentsReviewPrompt, SegmentsReviewResponse } from "@/lib/prompts";
import { handleApiError, ApiError, withRetry } from "@/lib/api-utils";
import { Project, SegmentInitial } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const { projectId } = await request.json();
    if (!projectId) throw new ApiError("Project ID is required", 400);

    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new ApiError("Unauthorized", 401);

    const { data: project } = await supabase.from("projects").select("*").eq("id", projectId).eq("user_id", user.id).single();
    if (!project) throw new ApiError("Project not found", 404);

    const { data: segments } = await supabase.from("segments_initial").select("*").eq("project_id", projectId).order("segment_index");
    if (!segments || segments.length === 0) throw new ApiError("Segments not found", 400);

    console.log(`[segments-review] Analyzing ${segments.length} segments:`, segments.map(s => s.name));

    const prompt = buildSegmentsReviewPrompt((project as Project).onboarding_data, segments as SegmentInitial[]);

    const response = await withRetry(async () => {
      const text = await generateWithAI({ prompt, maxTokens: 4096, userId: user.id });
      return parseJSONResponse<SegmentsReviewResponse>(text);
    });

    const { data: draft, error } = await supabase.from("segments_review_drafts").insert({
      project_id: projectId,
      segment_overlaps: response.overlaps,
      too_broad: response.too_broad,
      too_narrow: response.too_narrow,
      missing_segments: response.missing_segments,
      recommendations: response.top_recommendations,
      version: 1,
    }).select().single();

    if (error) {
      console.error("Segments review insert error:", error);
      throw new ApiError(`Failed to save draft: ${error.message}`, 500);
    }

    await supabase.from("projects").update({ current_step: "segments_review_draft" }).eq("id", projectId);
    return NextResponse.json({ success: true, draft });
  } catch (error) { return handleApiError(error); }
}
