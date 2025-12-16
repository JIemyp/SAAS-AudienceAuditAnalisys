// =====================================================
// Increase timeout for AI generation
export const maxDuration = 60;

// Generate JTBD Context Enhancement - Per Segment
// Adds situational triggers, competing solutions, success metrics
// =====================================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { generateWithAI, parseJSONResponse } from "@/lib/ai-client";
import { handleApiError, ApiError, withRetry } from "@/lib/api-utils";
import {
  Project,
  Segment,
  OnboardingData,
  JTBDContextResponse,
} from "@/types";

function buildPrompt(
  onboarding: OnboardingData,
  segment: Segment,
  jobs: unknown[],
  competitiveIntel: unknown
): string {
  return `You are a Jobs-to-be-Done expert with 15+ years experience applying JTBD framework to premium health/wellness products. Enhance JTBD analysis with contextual depth.

## CRITICAL: JSON STRUCTURE REQUIREMENTS
Your response MUST match the EXACT JSON structure below. Every field is REQUIRED.
- All enum fields must use ONLY the specified values
- All arrays must have the minimum specified items
- No extra fields, no missing fields

## Business Context
- Brand: ${onboarding.brandName || "N/A"}
- Product/Service: ${onboarding.productService || "N/A"}
- Product Format: ${onboarding.productFormat || "N/A"}
- Business Model: ${onboarding.businessModel || "N/A"}
- Price Segment: ${onboarding.priceSegment || "N/A"}
- USP: ${onboarding.usp || "N/A"}

## Segment Profile
- Name: ${segment.name}
- Description: ${segment.description || "N/A"}
- Sociodemographics: ${segment.sociodemographics || "N/A"}

## Existing Jobs to Be Done (enhance these)
${JSON.stringify(jobs, null, 2)}

## Competitive Intelligence (context)
${JSON.stringify(competitiveIntel, null, 2)}

## Your Task

For segment "${segment.name}", enhance each job with:
1. WHEN do they "hire" this job? (situational triggers)
2. WHAT ELSE might they "hire"? (competing solutions)
3. HOW do they measure success?
4. WHAT blocks them from completing the job?
5. WHAT anxieties do they have about hiring a solution?

## REQUIRED JSON OUTPUT (copy this structure exactly):

{
  "job_contexts": [
    {
      "job_reference_id": "ID from original job if available, otherwise sequential number",
      "job_name": "The job statement - e.g., 'Get convenient, complete nutrition without prep time'",
      "hire_triggers": [
        {
          "situation": "WHEN situation - e.g., 'Morning rush with no time for healthy breakfast'",
          "frequency": "daily",
          "urgency": "high",
          "emotional_state": "How they feel - e.g., 'Stressed, guilty about skipping nutrition'"
        }
      ],
      "competing_solutions": [
        {
          "alternative": "What else they might hire - e.g., 'Meal prep Sundays'",
          "why_chosen": "Why they choose this - e.g., 'Feels more 'real food''",
          "when_chosen": "Situation - e.g., 'When they have weekend time'",
          "job_completion_rate": "low",
          "your_advantage": "Why your solution is better for THIS segment"
        }
      ],
      "success_metrics": {
        "how_measured": ["metric 1", "metric 2", "metric 3", "metric 4"],
        "immediate_progress": ["sign 1", "sign 2", "sign 3"],
        "short_term_success": "What success looks like in days/weeks",
        "long_term_success": "What success looks like in months",
        "acceptable_tradeoffs": ["tradeoff 1", "tradeoff 2", "tradeoff 3"]
      },
      "obstacles": [
        {
          "obstacle": "Specific obstacle - e.g., 'Analysis paralysis from too many options'",
          "blocks_progress": "How it blocks them - e.g., 'Delays purchase decision for weeks'",
          "how_you_remove_it": "How your solution removes this - e.g., 'Single product replaces multiple decisions'"
        }
      ],
      "hiring_anxieties": [
        {
          "anxiety": "Fear - e.g., 'What if this is just another supplement that doesn't work?'",
          "rooted_in": "Source - e.g., 'Past supplement failures, money wasted'",
          "how_to_address": "How to alleviate - e.g., 'Money-back guarantee + testimonials from former skeptics'"
        }
      ]
    }
  ],
  "job_priority_ranking": [
    {
      "job_name": "Job statement",
      "priority": 1,
      "reasoning": "Why this is #1 priority for THIS segment - be specific"
    }
  ],
  "job_dependencies": [
    {
      "primary_job": "Main job that must be completed first",
      "enables_job": "Job that becomes possible after",
      "relationship": "How they're connected - e.g., 'Trust in product enables willingness to subscribe'"
    }
  ]
}

## VALIDATION RULES:
- frequency: ONLY "daily" | "weekly" | "monthly" | "occasionally" | "rarely"
- urgency: ONLY "low" | "medium" | "high" | "critical"
- job_completion_rate: ONLY "low" | "medium" | "high" | "very_high"
- priority: Sequential integers starting from 1

## MINIMUM REQUIREMENTS:
- job_contexts: Cover ALL jobs from existing jobs list (or at least 5 if many)
- hire_triggers per job: 3+ items
- competing_solutions per job: 3+ items
- how_measured: 4+ items
- immediate_progress: 3+ items
- acceptable_tradeoffs: 3+ items
- obstacles per job: 3+ items
- hiring_anxieties per job: 3+ items
- job_priority_ranking: Rank ALL jobs
- job_dependencies: 3+ items

Return ONLY valid JSON. No markdown, no explanations.`;
}

export async function POST(request: NextRequest) {
  try {
    const { projectId, segmentId } = await request.json();

    if (!projectId || !segmentId) {
      throw new ApiError("Project ID and Segment ID are required", 400);
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

    const prompt = buildPrompt(
      (project as Project).onboarding_data,
      segment as Segment,
      jobs || [],
      competitiveIntel
    );

    const response = await withRetry(async () => {
      const text = await generateWithAI({ prompt, maxTokens: 8000, userId: user.id });
      return parseJSONResponse<JTBDContextResponse>(text);
    });

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
