// =====================================================
// Increase timeout for AI generation
export const maxDuration = 60;

// Generate Insights Snapshots - V6 MODULE (Per Segment)
// Creates concise snapshot: who/what/why/when + top pains + barriers
// =====================================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireWriteAccess } from "@/lib/permissions";
import { generateWithAI, parseJSONResponse } from "@/lib/ai-client";
import { handleApiError, ApiError, withRetry } from "@/lib/api-utils";
import {
  Project,
  OnboardingData,
  Segment,
} from "@/types";

// Response type matching PROMPTS_V6.md
interface InsightsSnapshotResponse {
  who: string;
  what: string;
  why: string;
  when_active: string;
  top_pains: Array<{
    pain_id: string;
    pain_name: string;
    severity: number;
  }>;
  adoption_barriers: Array<{
    barrier: string;
    severity: "low" | "medium" | "high";
    mitigation: string;
  }>;
  evidence_sources: Array<{
    table_name: string;
    field_used: string;
    record_count: number;
  }>;
  validation_metrics: Array<{
    metric: string;
    how_to_test: string;
    expected_outcome: string;
  }>;
}

interface SegmentData {
  id: string;
  name: string;
  description: string;
  sociodemographics: string | null;
}

interface SegmentDetailsData {
  sociodemographics: string | null;
  psychographics: string | null;
  online_behavior: string | null;
  buying_behavior: string | null;
  needs: string[];
  core_values: string[];
  awareness_level: string;
  objections: string[];
}

interface PainRankingData {
  id: string;
  name: string;
  description: string;
  impact_score: number;
  frequency_score: number;
  urgency_score: number;
  severity: string;
}

interface JobData {
  id: string;
  job: string;
  outcome: string;
  context: string;
}

interface PreferenceData {
  id: string;
  preference: string;
  weight: number;
}

interface DifficultyData {
  id: string;
  difficulty: string;
  severity: string;
}

interface TriggerData {
  id: string;
  trigger: string;
  urgency_level: string;
}

function buildInsightsSnapshotPrompt(
  onboarding: OnboardingData,
  segment: SegmentData,
  segmentDetails: SegmentDetailsData | null,
  jobs: JobData[],
  preferences: PreferenceData[],
  difficulties: DifficultyData[],
  triggers: TriggerData[],
  topPains: PainRankingData[]
): string {
  return `You are a senior marketing strategist. Create a concise insights snapshot for one audience segment.

## Global Output Rules
1. Return ONLY JSON. No markdown, no comments, no prose outside JSON.
2. Use double quotes for all keys and string values.
3. Do NOT include unescaped line breaks inside strings. Use "\\n" if needed.
4. No trailing commas.
5. Output language: English.

## Business Context
- Brand: ${onboarding.brandName || "N/A"}
- Product/Service: ${onboarding.productService || "N/A"}
- Product Format: ${onboarding.productFormat || "N/A"}
- USP: ${onboarding.usp || "N/A"}
- Business Model: ${onboarding.businessModel || "N/A"}
- Price Segment: ${onboarding.priceSegment || "N/A"}
- Geography: ${onboarding.geography || "N/A"}

## Segment
- segment_id: ${segment.id}
- name: ${segment.name}
- description: ${segment.description || "N/A"}
- sociodemographics: ${segment.sociodemographics || "N/A"}

## Segment Details
${segmentDetails ? `
- sociodemographics: ${segmentDetails.sociodemographics || "N/A"}
- psychographics: ${segmentDetails.psychographics || "N/A"}
- online_behavior: ${segmentDetails.online_behavior || "N/A"}
- buying_behavior: ${segmentDetails.buying_behavior || "N/A"}
- needs: ${JSON.stringify(segmentDetails.needs)}
- core_values: ${JSON.stringify(segmentDetails.core_values)}
- awareness_level: ${segmentDetails.awareness_level}
- objections: ${JSON.stringify(segmentDetails.objections)}
` : "N/A"}

## Jobs-to-be-Done (${jobs.length} items)
${jobs.map((j, i) => `${i + 1}. ${j.job} → ${j.outcome} (context: ${j.context})`).join("\n")}

## Preferences (${preferences.length} items)
${preferences.map((p, i) => `${i + 1}. ${p.preference} (weight: ${p.weight})`).join("\n")}

## Difficulties (${difficulties.length} items)
${difficulties.map((d, i) => `${i + 1}. ${d.difficulty} (severity: ${d.severity})`).join("\n")}

## Triggers (${triggers.length} items)
${triggers.map((t, i) => `${i + 1}. ${t.trigger} (urgency: ${t.urgency_level})`).join("\n")}

## Top Pains (${topPains.length} items - is_top_pain=true)
${topPains.map((p, i) => `${i + 1}. ${p.name} - ${p.description} (impact: ${p.impact_score}, frequency: ${p.frequency_score}, urgency: ${p.urgency_score}, severity: ${p.severity})`).join("\n")}

## Your Task
Create a concise insights snapshot that synthesizes all this research into actionable intelligence:

1) **who** (1-2 sentences): Target audience description combining demographics + psychographics
2) **what** (1-2 sentences): What they want to achieve (based on jobs/outcomes)
3) **why** (1-2 sentences): Core underlying motivation (based on needs/values)
4) **when_active** (1-2 sentences): Timing/triggers when they're most engaged (based on triggers)
5) **top_pains** (3-5 items): Most critical pains with severity scoring
6) **adoption_barriers** (2-4 items): Key blockers preventing action (based on objections/difficulties)
7) **evidence_sources**: List data sources used (segment_details, jobs, preferences, etc.)
8) **validation_metrics**: How to test these insights in market (3-5 testable hypotheses)

## Enumerations
- severity: "low" | "medium" | "high"

## REQUIRED JSON OUTPUT:
{
  "who": "string (1-2 sentences describing target audience)",
  "what": "string (1-2 sentences describing desired outcome)",
  "why": "string (1-2 sentences describing core motivation)",
  "when_active": "string (1-2 sentences describing timing/triggers)",
  "top_pains": [
    {
      "pain_id": "${topPains[0]?.id || "uuid"}",
      "pain_name": "string",
      "severity": 1-10
    }
  ],
  "adoption_barriers": [
    {
      "barrier": "string (concise description)",
      "severity": "low | medium | high",
      "mitigation": "string (how to overcome)"
    }
  ],
  "evidence_sources": [
    {
      "table_name": "segment_details | jobs | preferences | difficulties | triggers | pains_ranking",
      "field_used": "string (which field was referenced)",
      "record_count": number
    }
  ],
  "validation_metrics": [
    {
      "metric": "string (what to measure)",
      "how_to_test": "string (testing method)",
      "expected_outcome": "string (success criteria)"
    }
  ]
}

## MINIMUM REQUIREMENTS:
- who, what, why, when_active: 1-2 sentences each
- top_pains: ${Math.min(topPains.length, 5)} items (use all available top pains)
- adoption_barriers: 2-4 items
- evidence_sources: 4-6 items (reference the data sources)
- validation_metrics: 3-5 testable hypotheses

## GUIDELINES:
- Be specific and actionable, not generic
- Reference actual data from the research above
- For evidence_sources, list which tables/fields informed each insight
- For validation_metrics, provide concrete A/B test ideas or market signals
- Keep language concise and business-focused
- Ensure all pain_id values match the actual pain IDs from Top Pains section

Return ONLY valid JSON. No markdown, no explanations.`;
}

export async function POST(request: NextRequest) {
  try {
    const { projectId, segmentId } = await request.json();

    if (!projectId) throw new ApiError("Project ID is required", 400);
    if (!segmentId) throw new ApiError("Segment ID is required", 400);

    const supabase = await createServerClient();
    const adminSupabase = createAdminClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new ApiError("Unauthorized", 401);
    }

    await requireWriteAccess(supabase, adminSupabase, projectId, user.id);

    // Get project
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      throw new ApiError("Project not found", 404);
    }

    const typedProject = project as Project;

    // Get segment
    const { data: segment, error: segmentError } = await supabase
      .from("segments")
      .select("*")
      .eq("id", segmentId)
      .eq("project_id", projectId)
      .single();

    if (segmentError || !segment) {
      throw new ApiError("Segment not found", 404);
    }

    // Fetch prerequisite data for this segment
    const [
      { data: segmentDetails },
      { data: jobs },
      { data: preferences },
      { data: difficulties },
      { data: triggers },
      { data: topPains },
    ] = await Promise.all([
      supabase
        .from("segment_details")
        .select("*")
        .eq("project_id", projectId)
        .eq("segment_id", segmentId)
        .order("approved_at", { ascending: false })
        .limit(1)
        .single(),
      supabase
        .from("jobs")
        .select("*")
        .eq("project_id", projectId)
        .eq("segment_id", segmentId)
        .order("created_at"),
      supabase
        .from("preferences")
        .select("*")
        .eq("project_id", projectId)
        .eq("segment_id", segmentId)
        .order("weight", { ascending: false }),
      supabase
        .from("difficulties")
        .select("*")
        .eq("project_id", projectId)
        .eq("segment_id", segmentId)
        .order("created_at"),
      supabase
        .from("triggers")
        .select("*")
        .eq("project_id", projectId)
        .eq("segment_id", segmentId)
        .order("created_at"),
      supabase
        .from("pains_ranking")
        .select("*")
        .eq("project_id", projectId)
        .eq("segment_id", segmentId)
        .eq("is_top_pain", true)
        .order("impact_score", { ascending: false }),
    ]);

    // Validate prerequisites
    if (!topPains || topPains.length === 0) {
      throw new ApiError("No top pains found. Complete pains ranking first.", 400);
    }

    const prompt = buildInsightsSnapshotPrompt(
      typedProject.onboarding_data,
      segment as SegmentData,
      segmentDetails as SegmentDetailsData | null,
      (jobs || []) as JobData[],
      (preferences || []) as PreferenceData[],
      (difficulties || []) as DifficultyData[],
      (triggers || []) as TriggerData[],
      topPains as PainRankingData[]
    );

    const response = await withRetry(async () => {
      const text = await generateWithAI({ prompt, maxTokens: 4000, userId: user.id });
      return parseJSONResponse<InsightsSnapshotResponse>(text);
    });

    // Check existing draft
    const { data: existingDraft } = await supabase
      .from("insights_snapshots_drafts")
      .select("id")
      .eq("project_id", projectId)
      .eq("segment_id", segmentId)
      .single();

    if (existingDraft) {
      const { data: draft, error: updateError } = await supabase
        .from("insights_snapshots_drafts")
        .update({
          who: response.who,
          what: response.what,
          why: response.why,
          when_active: response.when_active,
          top_pains: response.top_pains,
          adoption_barriers: response.adoption_barriers,
          evidence_sources: response.evidence_sources,
          validation_metrics: response.validation_metrics,
          version: 1,
        })
        .eq("id", existingDraft.id)
        .select()
        .single();

      if (updateError) {
        throw new ApiError("Failed to update draft", 500);
      }

      return NextResponse.json({ success: true, draft, updated: true });
    }

    const { data: draft, error: insertError } = await supabase
      .from("insights_snapshots_drafts")
      .insert({
        project_id: projectId,
        segment_id: segmentId,
        who: response.who,
        what: response.what,
        why: response.why,
        when_active: response.when_active,
        top_pains: response.top_pains,
        adoption_barriers: response.adoption_barriers,
        evidence_sources: response.evidence_sources,
        validation_metrics: response.validation_metrics,
        version: 1,
      })
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
