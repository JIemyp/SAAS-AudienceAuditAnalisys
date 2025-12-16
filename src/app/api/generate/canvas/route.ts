// Generate Canvas - Prompt 14 (Per Segment)
// Increase timeout for AI generation
export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireWriteAccess } from "@/lib/permissions";
import { generateWithAI, parseJSONResponse } from "@/lib/ai-client";
import { buildCanvasPrompt, CanvasResponse } from "@/lib/prompts";
import { handleApiError, ApiError, withRetry } from "@/lib/api-utils";
import { Project, PortraitFinal, Segment, SegmentDetails, Jobs, Preferences, Difficulties, Triggers, PainInitial } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const { projectId, segmentId, painId } = await request.json();

    if (!projectId) throw new ApiError("Project ID is required", 400);
    if (!segmentId) throw new ApiError("Segment ID is required", 400);

    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new ApiError("Unauthorized", 401);

    const adminSupabase = createAdminClient();

    // Check write access (owner or editor)
    await requireWriteAccess(supabase, adminSupabase, projectId, user.id);

    // Get project with admin client
    const { data: project } = await adminSupabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();
    if (!project) throw new ApiError("Project not found", 404);

    // Get portrait final
    const { data: portraitFinal } = await adminSupabase
      .from("portrait_final")
      .select("*")
      .eq("project_id", projectId)
      .order("approved_at", { ascending: false })
      .limit(1)
      .single();
    if (!portraitFinal) throw new ApiError("Portrait final not found", 400);

    // Get segment
    const { data: segment, error: segmentError } = await adminSupabase
      .from("segments")
      .select("*")
      .eq("id", segmentId)
      .eq("project_id", projectId)
      .single();
    if (segmentError || !segment) throw new ApiError("Segment not found", 404);

    // Get segment details
    const { data: segmentDetails } = await adminSupabase
      .from("segment_details")
      .select("*")
      .eq("project_id", projectId)
      .eq("segment_id", segmentId)
      .order("approved_at", { ascending: false })
      .limit(1)
      .single();

    // Get jobs
    const { data: jobs } = await adminSupabase
      .from("jobs")
      .select("*")
      .eq("project_id", projectId)
      .eq("segment_id", segmentId)
      .order("approved_at", { ascending: false })
      .limit(1)
      .single();

    // Get preferences
    const { data: preferences } = await adminSupabase
      .from("preferences")
      .select("*")
      .eq("project_id", projectId)
      .eq("segment_id", segmentId)
      .order("approved_at", { ascending: false })
      .limit(1)
      .single();

    // Get difficulties
    const { data: difficulties } = await adminSupabase
      .from("difficulties")
      .select("*")
      .eq("project_id", projectId)
      .eq("segment_id", segmentId)
      .order("approved_at", { ascending: false })
      .limit(1)
      .single();

    // Get triggers
    const { data: triggers } = await adminSupabase
      .from("triggers")
      .select("*")
      .eq("project_id", projectId)
      .eq("segment_id", segmentId)
      .order("approved_at", { ascending: false })
      .limit(1)
      .single();

    // Get TOP pains for this segment
    let painsToProcess: PainInitial[] = [];

    if (painId) {
      // Single pain specified
      const { data: pain } = await adminSupabase
        .from("pains_initial")
        .select("*")
        .eq("id", painId)
        .single();
      if (!pain) throw new ApiError("Pain not found", 404);
      const { data: rankingCheck } = await adminSupabase
        .from("pains_ranking")
        .select("is_top_pain")
        .eq("project_id", projectId)
        .eq("segment_id", segmentId)
        .eq("pain_id", painId)
        .single();

      if (!rankingCheck || rankingCheck.is_top_pain !== true) {
        throw new ApiError("This pain is not selected for Canvas. Mark it as a TOP pain first.", 400);
      }

      painsToProcess = [pain as PainInitial];
    } else {
      // Get TOP pain IDs from pains_ranking
      const { data: rankings } = await adminSupabase
        .from("pains_ranking")
        .select("pain_id")
        .eq("project_id", projectId)
        .eq("segment_id", segmentId)
        .eq("is_top_pain", true);

      if (!rankings || rankings.length === 0) {
        throw new ApiError("No TOP pains found for this segment. Complete pains ranking first.", 400);
      }

      // Get full pain data from pains_initial
      const painIds = rankings.map(r => r.pain_id).filter(Boolean);
      const { data: pains } = await adminSupabase
        .from("pains_initial")
        .select("*")
        .in("id", painIds);

      painsToProcess = (pains || []) as PainInitial[];
    }

    const drafts = [];
    for (const pain of painsToProcess) {
      const prompt = buildCanvasPrompt(
        (project as Project).onboarding_data,
        portraitFinal as PortraitFinal,
        segment as Segment,
        segmentDetails as SegmentDetails | null,
        jobs as Jobs | null,
        preferences as Preferences | null,
        difficulties as Difficulties | null,
        triggers as Triggers | null,
        pain
      );

      const response = await withRetry(async () => {
        const text = await generateWithAI({ prompt, maxTokens: 6144, userId: user.id });
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
