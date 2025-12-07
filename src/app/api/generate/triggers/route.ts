// =====================================================
// Generate Triggers - Prompt 8 (Per Segment)
// =====================================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { generateWithClaude, parseJSONResponse } from "@/lib/anthropic";
import { buildTriggersPrompt, TriggersResponse } from "@/lib/prompts";
import { handleApiError, ApiError, withRetry } from "@/lib/api-utils";
import { Project, PortraitFinal, Jobs, Preferences, Difficulties, Segment, SegmentDetails } from "@/types";

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

    // Get approved segment details for this segment
    const { data: segmentDetails } = await supabase
      .from("segment_details")
      .select("*")
      .eq("project_id", projectId)
      .eq("segment_id", segmentId)
      .order("approved_at", { ascending: false })
      .limit(1)
      .single();

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
      throw new ApiError("Jobs not found for this segment", 400);
    }

    // Get approved preferences for this segment
    const { data: preferences } = await supabase
      .from("preferences")
      .select("*")
      .eq("project_id", projectId)
      .eq("segment_id", segmentId)
      .order("approved_at", { ascending: false })
      .limit(1)
      .single();

    if (!preferences) {
      throw new ApiError("Preferences not found for this segment. Approve preferences first.", 400);
    }

    // Get approved difficulties for this segment
    const { data: difficulties } = await supabase
      .from("difficulties")
      .select("*")
      .eq("project_id", projectId)
      .eq("segment_id", segmentId)
      .order("approved_at", { ascending: false })
      .limit(1)
      .single();

    if (!difficulties) {
      throw new ApiError("Difficulties not found for this segment. Approve difficulties first.", 400);
    }

    const prompt = buildTriggersPrompt(
      typedProject.onboarding_data,
      portraitFinal as PortraitFinal,
      segment as Segment,
      segmentDetails as SegmentDetails | null,
      jobs as Jobs,
      preferences as Preferences,
      difficulties as Difficulties
    );

    const response = await withRetry(async () => {
      const text = await generateWithClaude({ prompt, maxTokens: 4096 });
      return parseJSONResponse<TriggersResponse>(text);
    });

    const { data: draft, error: insertError } = await supabase
      .from("triggers_drafts")
      .insert({
        project_id: projectId,
        segment_id: segmentId,
        triggers: response.triggers,
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
