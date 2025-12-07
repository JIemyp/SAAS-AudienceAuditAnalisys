// Generate Canvas Extended V2 - Prompt 15 (Per Pain)
// V2: Uses pain_id instead of canvas_id, structured JSONB output
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { generateWithClaude, parseJSONResponse } from "@/lib/anthropic";
import { buildCanvasExtendedPromptV2, CanvasExtendedV2Response } from "@/lib/prompts";
import { handleApiError, ApiError, withRetry } from "@/lib/api-utils";
import {
  Segment,
  PainInitial,
  Canvas,
  OnboardingData,
  SegmentDetails,
  Jobs,
  Triggers
} from "@/types";

export async function POST(request: NextRequest) {
  try {
    const { projectId, segmentId, painId } = await request.json();

    if (!projectId) throw new ApiError("Project ID is required", 400);
    if (!segmentId) throw new ApiError("Segment ID is required", 400);

    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new ApiError("Unauthorized", 401);

    // Get project with onboarding data
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .single();

    if (projectError || !project) throw new ApiError("Project not found", 404);
    const onboarding = project.onboarding_data as OnboardingData;

    // Get segment
    const { data: segment, error: segmentError } = await supabase
      .from("segments")
      .select("*")
      .eq("id", segmentId)
      .eq("project_id", projectId)
      .single();

    if (segmentError || !segment) throw new ApiError("Segment not found", 404);

    // Get segment details (optional but enriches prompt)
    const { data: segmentDetails } = await supabase
      .from("segment_details")
      .select("*")
      .eq("segment_id", segmentId)
      .single();

    // Get jobs (optional)
    const { data: jobs } = await supabase
      .from("jobs")
      .select("*")
      .eq("segment_id", segmentId)
      .single();

    // Get triggers (optional)
    const { data: triggers } = await supabase
      .from("triggers")
      .select("*")
      .eq("segment_id", segmentId)
      .single();

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

      // Build V2 prompt with full context
      const { systemPrompt, userPrompt } = buildCanvasExtendedPromptV2({
        onboarding,
        segment: segment as Segment,
        segmentDetails: segmentDetails as SegmentDetails | null,
        jobs: jobs as Jobs | null,
        triggers: triggers as Triggers | null,
        pain,
        canvas,
      });

      // Generate with Claude - V2 needs more tokens for detailed output
      const response = await withRetry(async () => {
        const text = await generateWithClaude({
          prompt: userPrompt,
          systemPrompt,
          maxTokens: 12000  // Increased for V2 detailed output
        });
        return parseJSONResponse<CanvasExtendedV2Response>(text);
      });

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
