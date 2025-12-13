// =====================================================
// Generate Competitive Intelligence - Per Segment
// Analyzes alternatives tried, competitors, switching barriers
// =====================================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { generateWithAI, parseJSONResponse } from "@/lib/ai-client";
import { handleApiError, ApiError, withRetry } from "@/lib/api-utils";
import {
  Project,
  Segment,
  OnboardingData,
  CompetitiveIntelligenceResponse,
} from "@/types";

function buildPrompt(
  onboarding: OnboardingData,
  segment: Segment,
  pains: unknown[],
  jobs: unknown[]
): string {
  return `You are a competitive intelligence analyst with 15+ years experience in health/wellness markets. Analyze the competitive landscape for ONE specific segment.

## CRITICAL: JSON STRUCTURE REQUIREMENTS
Your response MUST match the EXACT JSON structure below. Every field is REQUIRED.
- All enum fields must use ONLY the specified values
- All arrays must have the minimum specified items
- No extra fields, no missing fields

## Business Context
- Brand: ${onboarding.brandName || "N/A"}
- Product/Service: ${onboarding.productService || "N/A"}
- Product Format: ${onboarding.productFormat || "N/A"}
- Unique Selling Point: ${onboarding.usp || "N/A"}
- Business Model: ${onboarding.businessModel || "N/A"}
- Price Segment: ${onboarding.priceSegment || "N/A"}
- Competitors: ${JSON.stringify(onboarding.competitors || [])}
- Differentiation: ${onboarding.differentiation || "N/A"}

## Segment Profile
- Name: ${segment.name}
- Description: ${segment.description || "N/A"}
- Sociodemographics: ${segment.sociodemographics || "N/A"}

## Segment Pains (context)
${JSON.stringify(pains.slice(0, 5), null, 2)}

## Segment Jobs to Be Done (context)
${JSON.stringify(jobs.slice(0, 5), null, 2)}

## Your Task

For segment "${segment.name}", analyze:
1. What alternatives have they TRIED and why did they fail?
2. What workarounds do they currently use?
3. How do they perceive named competitors?
4. What barriers prevent them from switching?
5. How do they evaluate and decide?
6. What category beliefs (including misconceptions) do they hold?

## REQUIRED JSON OUTPUT (copy this structure exactly):

{
  "alternatives_tried": [
    {
      "solution_type": "competitor_product",
      "specific_examples": ["Athletic Greens/AG1", "Spirulina tablets from Amazon", "Green smoothie habit"],
      "adoption_rate": "estimated percentage who tried this - e.g., '40% of segment'",
      "why_they_tried_it": "2-3 sentence explanation of the problem they hoped to solve",
      "initial_expectations": "What results they expected when starting",
      "actual_experience": "What actually happened - be specific about the disappointment",
      "why_it_failed": "Specific reason it didn't work for THIS segment",
      "emotional_residue": "Lingering feelings - frustration, skepticism, guilt, etc."
    }
  ],
  "current_workarounds": [
    {
      "workaround": "Specific workaround they use - e.g., 'Multiple separate supplements daily'",
      "effectiveness": "low",
      "effort_required": "Description of time/mental load - e.g., '15 mins daily + tracking'",
      "cost": "Monthly cost and opportunity cost - e.g., '$80/month + inconsistent results'",
      "why_they_stick_with_it": "Why they haven't switched despite problems"
    }
  ],
  "vs_competitors": [
    {
      "competitor_name": "REAL competitor name from the list or market",
      "segment_perception": "2-3 sentence description of how THIS segment views them",
      "competitor_strengths": ["perceived strength 1", "perceived strength 2", "perceived strength 3"],
      "competitor_weaknesses": ["perceived weakness 1", "perceived weakness 2", "perceived weakness 3"],
      "switching_triggers": ["what would make them switch TO this competitor", "trigger 2"]
    }
  ],
  "switching_barriers": [
    {
      "barrier_type": "emotional",
      "description": "Specific barrier - e.g., 'Fear of another failed supplement purchase'",
      "severity": "high",
      "how_to_overcome": "Specific strategy to remove this barrier"
    }
  ],
  "evaluation_process": {
    "criteria_for_comparison": ["criterion 1", "criterion 2", "criterion 3", "criterion 4"],
    "dealbreakers": ["dealbreaker 1", "dealbreaker 2", "dealbreaker 3"],
    "nice_to_haves": ["nice to have 1", "nice to have 2", "nice to have 3"],
    "how_they_compare": "2-3 sentence description of their research and comparison process",
    "decision_authority": "Who makes the final decision - e.g., 'Individual, but influenced by partner'"
  },
  "category_beliefs": {
    "what_they_believe": ["belief about product category 1", "belief 2", "belief 3", "belief 4"],
    "misconceptions_to_address": [
      {
        "misconception": "Common wrong belief about this category",
        "root_cause": "Why they believe this - past experience, marketing, etc.",
        "how_to_reframe": "Specific messaging angle to correct this belief"
      }
    ]
  }
}

## VALIDATION RULES:
- solution_type: ONLY "competitor_product" | "manual_process" | "hiring" | "doing_nothing" | "diy_solution"
- effectiveness (workarounds): ONLY "low" | "medium" | "high"
- barrier_type: ONLY "financial" | "technical" | "emotional" | "organizational" | "habitual"
- severity: ONLY "low" | "medium" | "high" | "critical"

## MINIMUM REQUIREMENTS:
- alternatives_tried: 4+ items with different solution_types
- current_workarounds: 3+ items
- vs_competitors: 3+ items (use REAL competitor names from context or market)
- switching_barriers: 4+ items (mix of barrier_types)
- criteria_for_comparison: 5+ items
- dealbreakers: 3+ items
- nice_to_haves: 3+ items
- what_they_believe: 4+ items
- misconceptions_to_address: 3+ items

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

    // Get pains for context (from pains_initial - approved pains)
    const { data: pains } = await supabase
      .from("pains_initial")
      .select("*")
      .eq("project_id", projectId)
      .eq("segment_id", segmentId);

    // Get jobs for context
    const { data: jobs } = await supabase
      .from("jobs")
      .select("*")
      .eq("project_id", projectId)
      .eq("segment_id", segmentId);

    const prompt = buildPrompt(
      (project as Project).onboarding_data,
      segment as Segment,
      pains || [],
      jobs || []
    );

    const response = await withRetry(async () => {
      const text = await generateWithAI({ prompt, maxTokens: 6000, userId: user.id });
      return parseJSONResponse<CompetitiveIntelligenceResponse>(text);
    });

    // Check for existing draft
    const { data: existingDraft } = await supabase
      .from("competitive_intelligence_drafts")
      .select("id")
      .eq("project_id", projectId)
      .eq("segment_id", segmentId)
      .single();

    const draftData = {
      project_id: projectId,
      segment_id: segmentId,
      alternatives_tried: response.alternatives_tried,
      current_workarounds: response.current_workarounds,
      vs_competitors: response.vs_competitors,
      switching_barriers: response.switching_barriers,
      evaluation_process: response.evaluation_process,
      category_beliefs: response.category_beliefs,
      version: 1,
    };

    if (existingDraft) {
      const { data: draft, error: updateError } = await supabase
        .from("competitive_intelligence_drafts")
        .update(draftData)
        .eq("id", existingDraft.id)
        .select()
        .single();

      if (updateError) throw new ApiError("Failed to update draft", 500);
      return NextResponse.json({ success: true, draft, updated: true });
    }

    const { data: draft, error: insertError } = await supabase
      .from("competitive_intelligence_drafts")
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
