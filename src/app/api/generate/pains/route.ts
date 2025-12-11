// Generate Pains - Prompt 12 (Per Segment)
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { generateWithAI, parseJSONResponse } from "@/lib/ai-client";
import { buildPainsPrompt, PainsResponse } from "@/lib/prompts";
import { handleApiError, ApiError, withRetry } from "@/lib/api-utils";
import { Project, PortraitFinal, Segment, SegmentDetails, Jobs, Preferences, Difficulties, Triggers } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const { projectId, segmentId } = await request.json();

    if (!projectId) throw new ApiError("Project ID is required", 400);
    if (!segmentId) throw new ApiError("Segment ID is required", 400);

    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new ApiError("Unauthorized", 401);

    const { data: project } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .single();
    if (!project) throw new ApiError("Project not found", 404);

    // Get portrait final
    const { data: portraitFinal } = await supabase
      .from("portrait_final")
      .select("*")
      .eq("project_id", projectId)
      .order("approved_at", { ascending: false })
      .limit(1)
      .single();

    if (!portraitFinal) throw new ApiError("Portrait final not found", 400);

    // Get segment
    const { data: segment, error: segmentError } = await supabase
      .from("segments")
      .select("*")
      .eq("id", segmentId)
      .eq("project_id", projectId)
      .single();

    if (segmentError || !segment) throw new ApiError("Segment not found", 404);

    // Get approved segment details for this segment
    const { data: segmentDetails } = await supabase
      .from("segment_details")
      .select("*")
      .eq("project_id", projectId)
      .eq("segment_id", segmentId)
      .order("approved_at", { ascending: false })
      .limit(1)
      .single();

    if (!segmentDetails) {
      throw new ApiError("Segment details not found. Approve segment details first.", 400);
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

    if (!jobs) throw new ApiError("Jobs not found. Approve jobs first.", 400);

    // Get approved preferences for this segment
    const { data: preferences } = await supabase
      .from("preferences")
      .select("*")
      .eq("project_id", projectId)
      .eq("segment_id", segmentId)
      .order("approved_at", { ascending: false })
      .limit(1)
      .single();

    if (!preferences) throw new ApiError("Preferences not found. Approve preferences first.", 400);

    // Get approved difficulties for this segment
    const { data: difficulties } = await supabase
      .from("difficulties")
      .select("*")
      .eq("project_id", projectId)
      .eq("segment_id", segmentId)
      .order("approved_at", { ascending: false })
      .limit(1)
      .single();

    if (!difficulties) throw new ApiError("Difficulties not found. Approve difficulties first.", 400);

    // Get approved triggers for this segment
    const { data: triggers } = await supabase
      .from("triggers")
      .select("*")
      .eq("project_id", projectId)
      .eq("segment_id", segmentId)
      .order("approved_at", { ascending: false })
      .limit(1)
      .single();

    if (!triggers) throw new ApiError("Triggers not found. Approve triggers first.", 400);

    const prompt = buildPainsPrompt(
      (project as Project).onboarding_data,
      portraitFinal as PortraitFinal,
      segment as Segment,
      segmentDetails as SegmentDetails,
      jobs as Jobs,
      preferences as Preferences,
      difficulties as Difficulties,
      triggers as Triggers
    );

    const response = await withRetry(async () => {
      const text = await generateWithAI({ prompt, maxTokens: 6144, userId: user.id });
      return parseJSONResponse<PainsResponse>(text);
    });

    const drafts = [];
    // Insert each pain as a draft
    for (const pain of response.pains) {
      const { data: draft, error } = await supabase
        .from("pains_drafts")
        .insert({
          project_id: projectId,
          segment_id: segmentId,
          pain_index: pain.index,
          name: pain.name,
          description: pain.description,
          deep_triggers: pain.deep_triggers,
          examples: pain.examples,
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
