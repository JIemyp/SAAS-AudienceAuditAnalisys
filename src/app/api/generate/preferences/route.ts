// =====================================================
// Generate Preferences - Prompt 6 (Per Segment)
// =====================================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { generateWithAI, parseJSONResponse } from "@/lib/ai-client";
import { buildPreferencesPrompt, PreferencesResponse } from "@/lib/prompts";
import { handleApiError, ApiError, withRetry } from "@/lib/api-utils";
import { Project, PortraitFinal, Jobs, Segment } from "@/types";

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

    const { data: portraitFinal } = await supabase
      .from("portrait_final")
      .select("*")
      .eq("project_id", projectId)
      .order("approved_at", { ascending: false })
      .limit(1)
      .single();

    if (!portraitFinal) {
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

    // Get approved jobs for this segment
    const { data: jobs } = await supabase
      .from("jobs")
      .select("*")
      .eq("project_id", projectId)
      .eq("segment_id", segmentId)
      .order("approved_at", { ascending: false })
      .limit(1)
      .single();

    if (!jobs) {
      throw new ApiError("Jobs not found for this segment. Approve jobs first.", 400);
    }

    const prompt = buildPreferencesPrompt(
      typedProject.onboarding_data,
      portraitFinal as PortraitFinal,
      jobs as Jobs,
      segment as Segment
    );

    const response = await withRetry(async () => {
      const text = await generateWithAI({ prompt, maxTokens: 4096, userId: user.id });
      return parseJSONResponse<PreferencesResponse>(text);
    });

    const { data: draft, error: insertError } = await supabase
      .from("preferences_drafts")
      .insert({
        project_id: projectId,
        segment_id: segmentId,
        preferences: response.preferences,
        version: 1,
      })
      .select()
      .single();

    if (insertError) {
      throw new ApiError("Failed to save draft", 500);
    }

    return NextResponse.json({ success: true, draft });
  } catch (error) {
    return handleApiError(error);
  }
}
