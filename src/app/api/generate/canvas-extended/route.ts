// Generate Canvas Extended V2 - Prompt 15 (Per Pain)
// V2: Uses pain_id instead of canvas_id, structured JSONB output
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { generateWithAI, parseJSONResponse } from "@/lib/ai-client";
import {
  buildCanvasExtendedPart1,
  buildCanvasExtendedPart2,
  CanvasExtendedPart1Response,
  CanvasExtendedPart2Response,
} from "@/lib/prompts";
import { handleApiError, ApiError, withRetry } from "@/lib/api-utils";
import {
  Segment,
  PainInitial,
  Canvas,
  OnboardingData,
  SegmentDetails,
  Jobs,
  Triggers,
  Preferences,
  Difficulties,
  PortraitFinal
} from "@/types";

// Increase timeout for AI generation (Vercel Pro: up to 60s)
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const { projectId, segmentId, painId } = await request.json();

    if (!projectId) throw new ApiError("Project ID is required", 400);
    if (!segmentId) throw new ApiError("Segment ID is required", 400);

    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new ApiError("Unauthorized", 401);

    // Fetch all required data in parallel for speed
    const [
      { data: project, error: projectError },
      { data: segment, error: segmentError },
      { data: segmentDetails },
      { data: jobs },
      { data: triggers },
      { data: preferences },
      { data: difficulties },
      { data: portraitFinal },
    ] = await Promise.all([
      supabase.from("projects").select("*").eq("id", projectId).eq("user_id", user.id).single(),
      supabase.from("segments").select("*").eq("id", segmentId).eq("project_id", projectId).single(),
      supabase.from("segment_details").select("*").eq("segment_id", segmentId).single(),
      supabase.from("jobs").select("*").eq("segment_id", segmentId).single(),
      supabase.from("triggers").select("*").eq("segment_id", segmentId).single(),
      supabase.from("preferences").select("*").eq("segment_id", segmentId).single(),
      supabase.from("difficulties").select("*").eq("segment_id", segmentId).single(),
      supabase.from("portrait_final").select("*").eq("project_id", projectId).order("approved_at", { ascending: false }).limit(1).single(),
    ]);

    // Validate required data
    if (projectError || !project) throw new ApiError("Project not found", 404);
    const onboarding = project.onboarding_data as OnboardingData;

    if (segmentError || !segment) throw new ApiError("Segment not found", 404);
    if (!segmentDetails) throw new ApiError("Segment details not found. Complete segment details first.", 400);
    if (!jobs) throw new ApiError("Jobs not found. Complete jobs analysis first.", 400);
    if (!triggers) throw new ApiError("Triggers not found. Complete triggers analysis first.", 400);
    if (!preferences) throw new ApiError("Preferences not found. Complete preferences analysis first.", 400);
    if (!difficulties) throw new ApiError("Difficulties not found. Complete difficulties analysis first.", 400);
    if (!portraitFinal) throw new ApiError("Portrait final not found. Complete portrait analysis first.", 400);

    // Determine which pains to process
    let painsToProcess: { pain: PainInitial; canvas: Canvas }[] = [];

    if (painId) {
      // Generate for specific pain
      const { data: pain, error: painError } = await supabase
        .from("pains_initial")
        .select("*")
        .eq("id", painId)
        .eq("segment_id", segmentId)
        .single();

      if (painError || !pain) throw new ApiError("Pain not found", 404);

      const { data: rankingCheck } = await supabase
        .from("pains_ranking")
        .select("is_top_pain")
        .eq("project_id", projectId)
        .eq("segment_id", segmentId)
        .eq("pain_id", painId)
        .single();

      if (!rankingCheck || rankingCheck.is_top_pain !== true) {
        throw new ApiError("This pain is not selected for Canvas. Mark it as a TOP pain first.", 400);
      }

      // Get canvas for this pain (try approved first, fallback to draft)
      let canvas = null;

      // Try approved canvas first
      const { data: approvedCanvas } = await supabase
        .from("canvas")
        .select("*")
        .eq("pain_id", painId)
        .eq("project_id", projectId)
        .single();

      if (approvedCanvas) {
        canvas = approvedCanvas;
      } else {
        // Fallback to draft
        const { data: draftCanvas } = await supabase
          .from("canvas_drafts")
          .select("*")
          .eq("pain_id", painId)
          .eq("project_id", projectId)
          .single();

        if (draftCanvas) {
          canvas = draftCanvas;
        }
      }

      if (!canvas) {
        throw new ApiError("Canvas not found for this pain. Complete canvas analysis first.", 400);
      }

      painsToProcess = [{ pain: pain as PainInitial, canvas: canvas as Canvas }];
    } else {
      // Generate for all TOP pains in this segment
      const { data: topPains } = await supabase
        .from("pains_ranking")
        .select("pain_id")
        .eq("project_id", projectId)
        .eq("segment_id", segmentId)
        .eq("is_top_pain", true);

      if (!topPains || topPains.length === 0) {
        throw new ApiError("No TOP pains found for this segment. Complete pain ranking first.", 400);
      }

      const topPainIds = topPains.map(p => p.pain_id);

      // Get all pains
      const { data: pains } = await supabase
        .from("pains_initial")
        .select("*")
        .in("id", topPainIds);

      if (!pains || pains.length === 0) {
        throw new ApiError("Pains not found", 404);
      }

      // Get canvases for these pains (try approved first, fallback to drafts)
      const { data: approvedCanvases } = await supabase
        .from("canvas")
        .select("*")
        .eq("project_id", projectId)
        .in("pain_id", topPainIds);

      const { data: draftCanvases } = await supabase
        .from("canvas_drafts")
        .select("*")
        .eq("project_id", projectId)
        .in("pain_id", topPainIds);

      // Merge: prefer approved, fallback to draft
      const canvasMap = new Map<string, Canvas>();

      // First add drafts
      for (const draft of draftCanvases || []) {
        canvasMap.set(draft.pain_id, draft as Canvas);
      }

      // Then override with approved (if exists)
      for (const approved of approvedCanvases || []) {
        canvasMap.set(approved.pain_id, approved as Canvas);
      }

      if (canvasMap.size === 0) {
        throw new ApiError("No canvases found. Complete canvas analysis first.", 400);
      }

      // Match pains with their canvases
      for (const pain of pains) {
        const canvas = canvasMap.get(pain.id);
        if (canvas) {
          painsToProcess.push({ pain: pain as PainInitial, canvas });
        }
      }

      if (painsToProcess.length === 0) {
        throw new ApiError("No matching pain-canvas pairs found.", 400);
      }
    }

    const drafts = [];
    for (const { pain, canvas } of painsToProcess) {
      // Check if draft already exists for this pain
      const { data: existingDraft } = await supabase
        .from("canvas_extended_drafts")
        .select("id")
        .eq("project_id", projectId)
        .eq("pain_id", pain.id)
        .single();

      if (existingDraft) {
        // Skip if already generated
        continue;
      }

      // Build SPLIT prompts for parallel execution (Vercel 10s limit)
      const promptInput = {
        onboarding,
        segment: segment as Segment,
        segmentDetails: segmentDetails as SegmentDetails,
        jobs: jobs as Jobs,
        triggers: triggers as Triggers,
        preferences: preferences as Preferences,
        difficulties: difficulties as Difficulties,
        portraitFinal: portraitFinal as PortraitFinal,
        pain,
        canvas,
      };

      const part1Prompt = buildCanvasExtendedPart1(promptInput);
      const part2Prompt = buildCanvasExtendedPart2(promptInput);

      // Run BOTH parts in PARALLEL - each ~5-6s instead of 15-25s total
      const [part1Response, part2Response] = await Promise.all([
        withRetry(async () => {
          const text = await generateWithAI({
            prompt: part1Prompt.userPrompt,
            systemPrompt: part1Prompt.systemPrompt,
            maxTokens: 2048,
            userId: user.id,
          });
          return parseJSONResponse<CanvasExtendedPart1Response>(text);
        }),
        withRetry(async () => {
          const text = await generateWithAI({
            prompt: part2Prompt.userPrompt,
            systemPrompt: part2Prompt.systemPrompt,
            maxTokens: 2048,
            userId: user.id,
          });
          return parseJSONResponse<CanvasExtendedPart2Response>(text);
        }),
      ]);

      // Merge both parts into complete response
      const response = {
        customer_journey: part1Response.customer_journey,
        emotional_map: part1Response.emotional_map,
        narrative_angles: part2Response.narrative_angles,
        messaging_framework: part2Response.messaging_framework,
        voice_and_tone: part2Response.voice_and_tone,
      };

      // Insert into V2 table
      const { data: draft, error } = await supabase
        .from("canvas_extended_drafts")
        .insert({
          project_id: projectId,
          segment_id: segmentId,
          pain_id: pain.id,
          customer_journey: response.customer_journey,
          emotional_map: response.emotional_map,
          narrative_angles: response.narrative_angles,
          messaging_framework: response.messaging_framework,
          voice_and_tone: response.voice_and_tone,
          version: 1,
        })
        .select()
        .single();

      if (error) {
        console.error("Error inserting canvas extended draft:", error);
        throw new ApiError(`Failed to save draft: ${error.message}`, 500);
      }

      drafts.push(draft);
    }

    return NextResponse.json({
      success: true,
      drafts,
      message: drafts.length > 0
        ? `Generated ${drafts.length} extended canvas draft(s)`
        : "All drafts already exist"
    });
  } catch (error) {
    return handleApiError(error);
  }
}
