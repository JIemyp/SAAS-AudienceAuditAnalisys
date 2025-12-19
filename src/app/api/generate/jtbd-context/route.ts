// =====================================================
// Increase timeout for AI generation
export const maxDuration = 60;

// Generate JTBD Context Enhancement - Per Segment
// Adds situational triggers, competing solutions, success metrics
// =====================================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireWriteAccess } from "@/lib/permissions";
import { generateWithAI, parseJSONResponse } from "@/lib/ai-client";
import { handleApiError, ApiError, withRetry } from "@/lib/api-utils";
import {
  Project,
  Segment,
  OnboardingData,
  JTBDContextResponse,
} from "@/types";

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
  try {
    const { projectId, segmentId } = await request.json();

    if (!projectId || !segmentId) {
      throw new ApiError("Project ID and Segment ID are required", 400);
    }

    const supabase = await createServerClient();
    const adminSupabase = createAdminClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new ApiError("Unauthorized", 401);
    }

    // Check write access (owner or editor)
    await requireWriteAccess(supabase, adminSupabase, projectId, user.id);

    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      
      .single();

    if (projectError || !project) {
      throw new ApiError("Project not found", 404);
    }

    const { data: segment, error: segmentError } = await supabase
      .from("segments")
      .select("*")
      .eq("id", segmentId)
      .eq("project_id", projectId)
      .single();

    if (segmentError || !segment) {
      throw new ApiError("Segment not found", 404);
    }

    // Get approved jobs - this is the key data source
    const { data: jobs } = await supabase
      .from("jobs")
      .select("*")
      .eq("project_id", projectId)
      .eq("segment_id", segmentId);

    const { data: competitiveIntel } = await supabase
      .from("competitive_intelligence")
      .select("*")
      .eq("project_id", projectId)
      .eq("segment_id", segmentId)
      .single();

    // Part 1: Generate job_contexts (heavy part)
    const jobContextsPrompt = buildJobContextsPrompt(
      (project as Project).onboarding_data,
      segment as Segment,
      jobs || [],
      competitiveIntel
    );

    const jobContextsResult = await withRetry(async () => {
      const text = await generateWithAI({ prompt: jobContextsPrompt, maxTokens: 4000, userId: user.id });
      return parseJSONResponse<{ job_contexts: JTBDContextResponse["job_contexts"] }>(text);
    });

    // Part 2: Generate rankings and dependencies (light part)
    const rankingsPrompt = buildRankingsPrompt(
      segment as Segment,
      jobContextsResult.job_contexts
    );

    const rankingsResult = await withRetry(async () => {
      const text = await generateWithAI({ prompt: rankingsPrompt, maxTokens: 2000, userId: user.id });
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
      return NextResponse.json({ success: true, draft, updated: true });
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

    return NextResponse.json({ success: true, draft });
  } catch (error) {
    return handleApiError(error);
  }
}
