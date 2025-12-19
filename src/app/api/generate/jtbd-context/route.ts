// =====================================================
// Generate JTBD Context Enhancement - Per Segment
// Adds situational triggers, competing solutions, success metrics
// STREAMING: Uses streaming response to avoid Vercel timeout
// =====================================================

import { NextRequest } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireWriteAccess } from "@/lib/permissions";
import { generateWithAI, parseJSONResponse } from "@/lib/ai-client";
import { ApiError, withRetry } from "@/lib/api-utils";
import {
  Project,
  Segment,
  OnboardingData,
  JTBDContextResponse,
} from "@/types";

// Edge runtime has 30s limit vs 10s for Node.js on Vercel Free
export const runtime = "edge";
export const maxDuration = 30;

// Part 1: Generate job_contexts (the heavy part)
function buildJobContextsPrompt(
  onboarding: OnboardingData,
  segment: Segment,
  jobs: unknown[],
  competitiveIntel: unknown
): string {
  return `You are a Jobs-to-be-Done expert. Enhance JTBD analysis for segment "${segment.name}".

## Business Context
- Brand: ${onboarding.brandName || "N/A"}
- Product/Service: ${onboarding.productService || "N/A"}
- Product Format: ${onboarding.productFormat || "N/A"}
- USP: ${onboarding.usp || "N/A"}

## Segment: ${segment.name}
${segment.description || "N/A"}

## Jobs to enhance (TOP 3-4 most important):
${JSON.stringify(jobs?.slice(0, 4), null, 2)}

## Competitive context:
${JSON.stringify(competitiveIntel, null, 2)}

Return JSON with "job_contexts" array. For each job include:
- job_reference_id, job_name
- hire_triggers (2+ items): situation, frequency (daily|weekly|monthly|occasionally|rarely), urgency (low|medium|high|critical), emotional_state
- competing_solutions (2+ items): alternative, why_chosen, when_chosen, job_completion_rate (low|medium|high|very_high), your_advantage
- success_metrics: how_measured (3+ items), immediate_progress (2+ items), short_term_success, long_term_success, acceptable_tradeoffs (2+ items)
- obstacles (2+ items): obstacle, blocks_progress, how_you_remove_it
- hiring_anxieties (2+ items): anxiety, rooted_in, how_to_address

Return ONLY valid JSON: {"job_contexts": [...]}`;
}

// Part 2: Generate rankings and dependencies (lighter part)
function buildRankingsPrompt(
  segment: Segment,
  jobContexts: unknown[]
): string {
  const jobNames = (jobContexts as Array<{job_name: string}>).map(j => j.job_name);
  return `Based on these jobs for segment "${segment.name}":
${JSON.stringify(jobNames, null, 2)}

Generate:
1. job_priority_ranking - rank ALL jobs by priority for this segment
2. job_dependencies - how jobs relate to each other (3+ items)

Return ONLY valid JSON:
{
  "job_priority_ranking": [{"job_name": "...", "priority": 1, "reasoning": "..."}],
  "job_dependencies": [{"primary_job": "...", "enables_job": "...", "relationship": "..."}]
}`;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const log = (msg: string) => console.log(`[jtbd-context] ${Date.now() - startTime}ms: ${msg}`);

  // Read body FIRST before creating stream
  log("Starting request...");
  const { projectId, segmentId } = await request.json();
  log(`Parsed body: projectId=${projectId}, segmentId=${segmentId}`);

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
      await sendProgress({ type: "progress", message: "Starting...", step: 1, total: 4 });

      if (!projectId || !segmentId) {
        throw new ApiError("Project ID and Segment ID are required", 400);
      }

      log("Creating Supabase client...");
      const supabase = await createServerClient();
      const adminSupabase = createAdminClient();

      const { data: { user }, error: authError } = await supabase.auth.getUser();
      log(`User fetched: ${user?.id || "null"}, error: ${authError?.message || "none"}`);
      if (authError || !user) throw new ApiError("Unauthorized", 401);

      // Check write access (owner or editor)
      await requireWriteAccess(supabase, adminSupabase, projectId, user.id);

      await sendProgress({ type: "progress", message: "Loading data...", step: 2, total: 4 });

      const [
        { data: project, error: projectError },
        { data: segment, error: segmentError },
        { data: jobs },
        { data: competitiveIntel },
      ] = await Promise.all([
        supabase
          .from("projects")
          .select("*")
          .eq("id", projectId)
          .single(),
        supabase
          .from("segments")
          .select("*")
          .eq("id", segmentId)
          .eq("project_id", projectId)
          .single(),
        supabase
          .from("jobs")
          .select("*")
          .eq("project_id", projectId)
          .eq("segment_id", segmentId),
        supabase
          .from("competitive_intelligence")
          .select("*")
          .eq("project_id", projectId)
          .eq("segment_id", segmentId)
          .single(),
      ]);

      if (projectError || !project) {
        throw new ApiError("Project not found", 404);
      }
      if (segmentError || !segment) {
        throw new ApiError("Segment not found", 404);
      }

      await sendProgress({ type: "progress", message: "Generating AI analysis...", step: 3, total: 4 });

      // Part 1: Generate job_contexts (heavy part)
      const jobContextsPrompt = buildJobContextsPrompt(
        (project as Project).onboarding_data,
        segment as Segment,
        jobs || [],
        competitiveIntel
      );

      const jobContextsResult = await withRetry(async () => {
        log("Job contexts generation starting...");
        const text = await generateWithAI({
          prompt: jobContextsPrompt,
          maxTokens: 4000,
          userId: user.id,
        });
        log(`Job contexts completed, got ${text.length} chars`);
        return parseJSONResponse<{ job_contexts: JTBDContextResponse["job_contexts"] }>(text);
      });

      // Part 2: Generate rankings and dependencies (light part)
      const rankingsPrompt = buildRankingsPrompt(
        segment as Segment,
        jobContextsResult.job_contexts
      );

      const rankingsResult = await withRetry(async () => {
        log("Rankings generation starting...");
        const text = await generateWithAI({
          prompt: rankingsPrompt,
          maxTokens: 2000,
          userId: user.id,
        });
        log(`Rankings completed, got ${text.length} chars`);
        return parseJSONResponse<{
          job_priority_ranking: JTBDContextResponse["job_priority_ranking"];
          job_dependencies: JTBDContextResponse["job_dependencies"];
        }>(text);
      });

      // Combine results
      const response: JTBDContextResponse = {
        job_contexts: jobContextsResult.job_contexts,
        job_priority_ranking: rankingsResult.job_priority_ranking,
        job_dependencies: rankingsResult.job_dependencies,
      };

      await sendProgress({ type: "progress", message: "Saving results...", step: 4, total: 4 });

      const { data: existingDraft } = await supabase
        .from("jtbd_context_drafts")
        .select("id")
        .eq("project_id", projectId)
        .eq("segment_id", segmentId)
        .single();

      const draftData = {
        project_id: projectId,
        segment_id: segmentId,
        job_contexts: response.job_contexts,
        job_priority_ranking: response.job_priority_ranking,
        job_dependencies: response.job_dependencies,
        version: 1,
      };

      if (existingDraft) {
        const { data: draft, error: updateError } = await supabase
          .from("jtbd_context_drafts")
          .update(draftData)
          .eq("id", existingDraft.id)
          .select()
          .single();

        if (updateError) throw new ApiError("Failed to update draft", 500);
        await sendProgress({ type: "complete", success: true, draft, updated: true });
        return;
      }

      const { data: draft, error: insertError } = await supabase
        .from("jtbd_context_drafts")
        .insert(draftData)
        .select()
        .single();

      if (insertError) {
        console.error("Insert error:", insertError);
        throw new ApiError("Failed to save draft", 500);
      }

      await sendProgress({ type: "complete", success: true, draft });
    } catch (error) {
      log(`Error: ${error}`);
      const message = error instanceof ApiError ? error.message : "An unexpected error occurred";
      const status = error instanceof ApiError ? error.statusCode : 500;
      await sendProgress({
        type: "error",
        success: false,
        message,
        status,
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
