// Generate Canvas Extended V2 - Prompt 15 (Per Pain)
// V2: Uses pain_id instead of canvas_id, structured JSONB output
// STREAMING: Uses streaming response to avoid Vercel timeout
import { NextRequest } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireWriteAccess } from "@/lib/permissions";
import { generateWithAI, parseJSONResponse } from "@/lib/ai-client";
import {
  buildCanvasExtendedPart1,
  buildCanvasExtendedPart2,
  CanvasExtendedPart1Response,
  CanvasExtendedPart2Response,
} from "@/lib/prompts";
import { ApiError, withRetry } from "@/lib/api-utils";
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

// Edge runtime has 30s limit vs 10s for Node.js on Vercel Free
export const runtime = "edge";
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const log = (msg: string) => console.log(`[canvas-extended] ${Date.now() - startTime}ms: ${msg}`);

  // Read body FIRST before creating stream
  log("Starting request...");
  const { projectId, segmentId, painId, language, regenerate } = await request.json();
  log(`Parsed body: projectId=${projectId}, segmentId=${segmentId}, painId=${painId}, language=${language}, regenerate=${regenerate}`);

  // Create a streaming response to avoid timeout
  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  // Helper to send progress updates
  const sendProgress = async (data: object) => {
    await writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
  };

  // Start processing in background - response returns immediately
  (async () => {
    try {
      await sendProgress({ type: "progress", message: "Starting...", step: 1, total: 5 });

      if (!projectId) throw new ApiError("Project ID is required", 400);
      if (!segmentId) throw new ApiError("Segment ID is required", 400);

      log("Creating Supabase client...");
      const supabase = await createServerClient();
      const adminSupabase = createAdminClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      log(`User fetched: ${user?.id || 'null'}, error: ${authError?.message || 'none'}`);
      if (authError || !user) throw new ApiError("Unauthorized", 401);

      // Check write access (owner or editor)
      await requireWriteAccess(supabase, adminSupabase, projectId, user.id);

      await sendProgress({ type: "progress", message: "Loading data...", step: 2, total: 5 });

      // Fetch all required data in parallel for speed
      log("Fetching all data in parallel...");
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
        adminSupabase.from("projects").select("*").eq("id", projectId).single(),
        adminSupabase.from("segments").select("*").eq("id", segmentId).eq("project_id", projectId).single(),
        adminSupabase.from("segment_details").select("*").eq("segment_id", segmentId).single(),
        adminSupabase.from("jobs").select("*").eq("segment_id", segmentId).single(),
        adminSupabase.from("triggers").select("*").eq("segment_id", segmentId).single(),
        adminSupabase.from("preferences").select("*").eq("segment_id", segmentId).single(),
        adminSupabase.from("difficulties").select("*").eq("segment_id", segmentId).single(),
        adminSupabase.from("portrait_final").select("*").eq("project_id", projectId).order("approved_at", { ascending: false }).limit(1).single(),
      ]);
      log("All data fetched");

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
        const { data: pain, error: painError } = await adminSupabase
          .from("pains_initial")
          .select("*")
          .eq("id", painId)
          .eq("segment_id", segmentId)
          .single();

        if (painError || !pain) throw new ApiError("Pain not found", 404);

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

        // Get canvas for this pain (try approved first, fallback to draft)
        let canvas = null;

        // Try approved canvas first
        const { data: approvedCanvas } = await adminSupabase
          .from("canvas")
          .select("*")
          .eq("pain_id", painId)
          .eq("project_id", projectId)
          .single();

        if (approvedCanvas) {
          canvas = approvedCanvas;
        } else {
          // Fallback to draft
          const { data: draftCanvas } = await adminSupabase
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
        const { data: topPains } = await adminSupabase
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
        const { data: pains } = await adminSupabase
          .from("pains_initial")
          .select("*")
          .in("id", topPainIds);

        if (!pains || pains.length === 0) {
          throw new ApiError("Pains not found", 404);
        }

        // Get canvases for these pains (try approved first, fallback to drafts)
        const { data: approvedCanvases } = await adminSupabase
          .from("canvas")
          .select("*")
          .eq("project_id", projectId)
          .in("pain_id", topPainIds);

        const { data: draftCanvases } = await adminSupabase
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

      await sendProgress({ type: "progress", message: "Generating AI analysis...", step: 3, total: 5 });

      const drafts = [];
      for (const { pain, canvas } of painsToProcess) {
        // Check if draft already exists for this pain
        const { data: existingDraft } = await adminSupabase
          .from("canvas_extended_drafts")
          .select("id")
          .eq("project_id", projectId)
          .eq("pain_id", pain.id)
          .single();

        if (existingDraft) {
          if (regenerate) {
            // Delete existing draft to regenerate
            log(`Deleting existing draft for pain: ${pain.name} (regenerate=true)`);
            await adminSupabase
              .from("canvas_extended_drafts")
              .delete()
              .eq("id", existingDraft.id);
          } else {
            // Skip if already generated
            continue;
          }
        }

        // Build SPLIT prompts for parallel execution
        log(`Building prompts for pain: ${pain.name}`);
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
          language: language || 'en', // Pass language for generation
        };

        const part1Prompt = buildCanvasExtendedPart1(promptInput);
        const part2Prompt = buildCanvasExtendedPart2(promptInput);
        log("Prompts built, starting parallel AI generation...");

        await sendProgress({ type: "progress", message: `Generating for: ${pain.name}...`, step: 3, total: 5 });

        // Run BOTH parts in PARALLEL
        const [part1Response, part2Response] = await Promise.all([
          withRetry(async () => {
            log("Part1 (journey+emotions) starting...");
            const text = await generateWithAI({
              prompt: part1Prompt.userPrompt,
              systemPrompt: part1Prompt.systemPrompt,
              maxTokens: 4096,
              userId: user.id,
            });
            log(`Part1 completed, got ${text.length} chars`);
            return parseJSONResponse<CanvasExtendedPart1Response>(text);
          }),
          withRetry(async () => {
            log("Part2 (narrative+messaging+voice) starting...");
            const text = await generateWithAI({
              prompt: part2Prompt.userPrompt,
              systemPrompt: part2Prompt.systemPrompt,
              maxTokens: 4096,
              userId: user.id,
            });
            log(`Part2 completed, got ${text.length} chars`);
            return parseJSONResponse<CanvasExtendedPart2Response>(text);
          }),
        ]);
        log("Both parts completed, merging...");

        await sendProgress({ type: "progress", message: "Saving results...", step: 4, total: 5 });

        // Merge both parts into complete response
        const response = {
          customer_journey: part1Response.customer_journey,
          emotional_map: part1Response.emotional_map,
          narrative_angles: part2Response.narrative_angles,
          messaging_framework: part2Response.messaging_framework,
          voice_and_tone: part2Response.voice_and_tone,
        };

        // Insert into V2 table
        const { data: draft, error } = await adminSupabase
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

      await sendProgress({ type: "progress", message: "Complete!", step: 5, total: 5 });

      // Send final result
      await sendProgress({
        type: "complete",
        success: true,
        drafts,
        message: drafts.length > 0
          ? `Generated ${drafts.length} extended canvas draft(s)`
          : "All drafts already exist"
      });

    } catch (error) {
      log(`Error: ${error}`);
      const message = error instanceof ApiError ? error.message : "An unexpected error occurred";
      const status = error instanceof ApiError ? error.statusCode : 500;
      await sendProgress({
        type: "error",
        success: false,
        message,
        status
      });
    } finally {
      await writer.close();
    }
  })();

  // Return streaming response immediately
  return new Response(stream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
