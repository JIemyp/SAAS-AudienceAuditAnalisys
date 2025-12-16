// =====================================================
// Increase timeout for AI generation
export const maxDuration = 60;

// Generate Jobs to Be Done - Prompt 5 (Per Segment)
// =====================================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { generateWithAI, parseJSONResponse } from "@/lib/ai-client";
import { buildJobsPrompt, JobsResponse } from "@/lib/prompts";
import { handleApiError, ApiError, withRetry } from "@/lib/api-utils";
import { Project, PortraitFinal, Segment } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const { projectId, segmentId } = await request.json();

    if (!projectId) {
      throw new ApiError("Project ID is required", 400);
    }

    if (!segmentId) {
      throw new ApiError("Segment ID is required", 400);
    }

    const supabase = await createServerClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new ApiError("Unauthorized", 401);
    }

    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .single();

    if (projectError || !project) {
      throw new ApiError("Project not found", 404);
    }

    const typedProject = project as Project;

    // Get approved portrait final
    const { data: portraitFinal, error: portraitError } = await supabase
      .from("portrait_final")
      .select("*")
      .eq("project_id", projectId)
      .order("approved_at", { ascending: false })
      .limit(1)
      .single();

    if (portraitError || !portraitFinal) {
      throw new ApiError("Portrait final not found", 400);
    }

    // Get segment data
    const { data: segment, error: segmentError } = await supabase
      .from("segments")
      .select("*")
      .eq("id", segmentId)
      .eq("project_id", projectId)
      .single();

    if (segmentError || !segment) {
      throw new ApiError("Segment not found", 404);
    }

    // Build prompt with segment context
    const prompt = buildJobsPrompt(
      typedProject.onboarding_data,
      portraitFinal as PortraitFinal,
      segment as Segment
    );

    const response = await withRetry(async () => {
      const text = await generateWithAI({ prompt, maxTokens: 4096, userId: user.id });
      return parseJSONResponse<JobsResponse>(text);
    });

    // Save draft with segment_id
    const { data: draft, error: insertError } = await supabase
      .from("jobs_drafts")
      .insert({
        project_id: projectId,
        segment_id: segmentId,
        functional_jobs: response.functional_jobs,
        emotional_jobs: response.emotional_jobs,
        social_jobs: response.social_jobs,
        version: 1,
      })
      .select()
      .single();

    if (insertError) {
      throw new ApiError("Failed to save draft", 500);
    }

    // Update project step (only if not already at jobs_draft or later)
    const { data: currentProject } = await supabase
      .from("projects")
      .select("current_step")
      .eq("id", projectId)
      .single();

    if (currentProject?.current_step === "segment_details_approved") {
      await supabase
        .from("projects")
        .update({ current_step: "jobs_draft" })
        .eq("id", projectId);
    }

    return NextResponse.json({ success: true, draft });
  } catch (error) {
    return handleApiError(error);
  }
}
