// =====================================================
// Increase timeout for AI generation
export const maxDuration = 60;

// Generate Insights Executive - V7 MODULE (Per Project)
// Creates growth bets, segment priorities, positioning summary, validation questions
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
} from "@/types";

// Response type matching Insights Executive structure
interface InsightsExecutiveResponse {
  growth_bets: Array<{
    title: string;
    rationale: string;
    score: number;
    key_jobs: string[];
    key_triggers: string[];
    key_pains: string[];
  }>;
  segment_priorities: Array<{
    segment_id: string;
    segment_name: string;
    priority_score: number;
    market_size_estimate: string;
    urgency_level: "critical" | "high" | "medium" | "low";
  }>;
  positioning_summary: {
    pillars: string[];
    value_proposition: string;
    differentiation: string;
  };
  validation_questions: string[];
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

interface Segment {
  id: string;
  name: string;
  description: string;
  sociodemographics?: string;
}

interface Job {
  id: string;
  segment_id: string;
  job: string;
  frequency?: string;
}

interface Trigger {
  id: string;
  segment_id: string;
  trigger: string;
  urgency?: string;
}

interface Pain {
  id: string;
  segment_id: string;
  pain: string;
  impact?: number;
}

interface PortraitFinal {
  id: string;
  interests_hobbies?: string[];
  lifestyle_habits?: string[];
  personality_traits?: string[];
}

interface ResearchPack {
  segments: Segment[];
  jobs: Job[];
  triggers: Trigger[];
  pains: Pain[];
  portrait: PortraitFinal | null;
}

function buildInsightsExecutivePrompt(
  onboarding: OnboardingData,
  research: ResearchPack
): string {
  return `You are a senior growth strategist and executive advisor. Produce a concise, strategic executive summary in strict JSON.

## Global Output Rules
1. Return ONLY JSON. No markdown, no comments, no prose outside JSON.
2. Use double quotes for all keys and string values.
3. Do NOT include unescaped line breaks inside strings. Use "\\n" if needed.
4. No trailing commas.
5. Keep each string under 240 characters.
6. Output language: English.

## Business Context
- Brand: ${onboarding.brandName || "N/A"}
- Product/Service: ${onboarding.productService || "N/A"}
- Product Format: ${onboarding.productFormat || "N/A"}
- USP: ${onboarding.usp || "N/A"}
- Business Model: ${onboarding.businessModel || "N/A"}
- Price Segment: ${onboarding.priceSegment || "N/A"}
- Competitors: ${onboarding.competitors || "N/A"}
- Differentiation: ${onboarding.differentiation || "N/A"}
- Geography: ${onboarding.geography || "N/A"}

## Research Data Available

### Segments (${research.segments.length} total, showing first 10)
${JSON.stringify(research.segments.slice(0, 10), null, 2)}

### Jobs to Be Done (${research.jobs.length} total, showing first 15)
${JSON.stringify(research.jobs.slice(0, 15), null, 2)}

### Purchase Triggers (${research.triggers.length} total, showing first 15)
${JSON.stringify(research.triggers.slice(0, 15), null, 2)}

### Top Pains (${research.pains.length} total, showing first 10)
${JSON.stringify(research.pains.slice(0, 10), null, 2)}

### Portrait Data (summary only)
${research.portrait ? JSON.stringify({
  interests_hobbies: Array.isArray(research.portrait.interests_hobbies) ? research.portrait.interests_hobbies.slice(0, 5) : [],
  lifestyle_habits: Array.isArray(research.portrait.lifestyle_habits) ? research.portrait.lifestyle_habits.slice(0, 5) : [],
  personality_traits: Array.isArray(research.portrait.personality_traits) ? research.portrait.personality_traits.slice(0, 5) : [],
}, null, 2) : "{}"}

## Your Task

Analyze all research data and create an executive-level strategic summary with:

1. **Growth Bets** (3-5 opportunities ranked by impact)
   - Score = job_frequency × trigger_urgency × pain_impact
   - Identify segment × job × trigger overlap patterns
   - Extract key jobs, triggers, and pains for each bet
   - Provide clear rationale for each opportunity

2. **Segment Priorities** (rank all segments)
   - Priority score based on:
     * Market size estimate (infer from demographics + job frequency)
     * Urgency level (critical/high/medium/low based on trigger analysis)
     * Pain severity (average impact across segment pains)
   - Include all segments from research data
   - Provide market size estimate (e.g., "100K-500K annual buyers", "Mid-market B2B 5K+ companies")

3. **Positioning Pillars** (3-5 core pillars)
   - Extract from portrait_final data (interests, lifestyle, personality)
   - Extract from approved jobs data (what they're trying to accomplish)
   - Build coherent value proposition
   - Highlight key differentiation points

4. **Validation Questions** (5-7 questions)
   - What needs to be verified in customer research
   - Questions that would validate/invalidate key assumptions
   - Focus on testable hypotheses

5. **Evidence Sources** (document what data was used)
   - List tables and fields referenced
   - Include record counts for transparency

6. **Validation Metrics** (3-5 metrics)
   - How to test assumptions in the field
   - What outcomes to expect if strategy is correct

## Scoring Rules

**job_frequency scoring:**
- daily = 5
- weekly = 4
- monthly = 3
- occasionally = 2
- rarely = 1

**trigger_urgency scoring:**
- critical = 5
- high = 4
- medium = 3
- low = 2
- (if missing, infer from trigger text)

**pain_impact scoring:**
- Use 1-5 scale (if available in data)
- If missing, infer from pain description (critical/severe = 5, moderate = 3, minor = 1)

**growth_bet score calculation:**
- Multiply: job_frequency × trigger_urgency × pain_impact
- Normalize to 1-125 range

**segment priority_score calculation:**
- Formula: (market_size_factor × 0.4) + (urgency_factor × 0.3) + (pain_severity × 0.3)
- Normalize to 1-100 range

## REQUIRED JSON OUTPUT:

{
  "growth_bets": [
    {
      "title": "string (concise opportunity name)",
      "rationale": "string (why this is valuable, 1-2 sentences)",
      "score": 0,
      "key_jobs": ["job1", "job2", "job3"],
      "key_triggers": ["trigger1", "trigger2"],
      "key_pains": ["pain1", "pain2", "pain3"]
    }
  ],
  "segment_priorities": [
    {
      "segment_id": "uuid",
      "segment_name": "string",
      "priority_score": 0,
      "market_size_estimate": "string (e.g., '50K-200K consumers', '10K+ B2B decision-makers')",
      "urgency_level": "critical"
    }
  ],
  "positioning_summary": {
    "pillars": ["pillar1", "pillar2", "pillar3"],
    "value_proposition": "string (1-2 sentences, what makes this unique)",
    "differentiation": "string (1-2 sentences, why customers choose this over competitors)"
  },
  "validation_questions": [
    "string (question to validate in research)",
    "string (question to validate in research)"
  ],
  "evidence_sources": [
    {
      "table_name": "segments_final",
      "field_used": "name, description",
      "record_count": 0
    },
    {
      "table_name": "jobs",
      "field_used": "job, frequency",
      "record_count": 0
    },
    {
      "table_name": "triggers",
      "field_used": "trigger, urgency",
      "record_count": 0
    },
    {
      "table_name": "pains_ranking",
      "field_used": "pain, impact",
      "record_count": 0
    },
    {
      "table_name": "portrait_final",
      "field_used": "interests_hobbies, lifestyle_habits, personality_traits",
      "record_count": 0
    }
  ],
  "validation_metrics": [
    {
      "metric": "string (what to measure)",
      "how_to_test": "string (how to test in the field)",
      "expected_outcome": "string (what result validates the strategy)"
    }
  ]
}

## MINIMUM REQUIREMENTS:
- growth_bets: 3+ items (ranked by score, highest first)
- segment_priorities: ALL segments from research data (ranked by priority_score)
- positioning_summary.pillars: 3+ items
- validation_questions: 5+ items
- evidence_sources: 5 items (one per table used)
- validation_metrics: 3+ items

## VALIDATION RULES:
- urgency_level: ONLY "critical" | "high" | "medium" | "low"
- All scores must be numeric (0-125 for growth_bets, 0-100 for segment priorities)
- All segment_id values must match actual segment IDs from research data
- All arrays must have minimum specified items

Return ONLY valid JSON. No markdown, no explanations.`;
}

export async function POST(request: NextRequest) {
  try {
    const { projectId } = await request.json();

    if (!projectId) {
      throw new ApiError("Project ID is required", 400);
    }

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

    // Gather research data (only approved tables) - LIMIT to avoid context window issues
    const [
      { data: segments },
      { data: jobs },
      { data: triggers },
      { data: pains },
      { data: portrait },
    ] = await Promise.all([
      supabase
        .from("segments_final")
        .select("id, name, description, sociodemographics")
        .eq("project_id", projectId)
        .limit(10), // Limit segments to avoid large context
      supabase
        .from("jobs")
        .select("id, segment_id, job, frequency")
        .eq("project_id", projectId)
        .limit(20), // Reduced from 50
      supabase
        .from("triggers")
        .select("id, segment_id, trigger, urgency")
        .eq("project_id", projectId)
        .limit(20), // Reduced from 50
      supabase
        .from("pains_ranking")
        .select("id, segment_id, pain, impact")
        .eq("project_id", projectId)
        .eq("is_top_pain", true)
        .limit(15), // Reduced from 30
      supabase
        .from("portrait_final")
        .select("id, interests_hobbies, lifestyle_habits, personality_traits")
        .eq("project_id", projectId)
        .order("approved_at", { ascending: false })
        .limit(1)
        .single(),
    ]);

    const research: ResearchPack = {
      segments: (segments || []) as Segment[],
      jobs: (jobs || []) as Job[],
      triggers: (triggers || []) as Trigger[],
      pains: (pains || []) as Pain[],
      portrait: portrait as PortraitFinal | null,
    };

    // Build prompt
    const prompt = buildInsightsExecutivePrompt(
      typedProject.onboarding_data,
      research
    );

    // Generate with Claude
    const response = await withRetry(async () => {
      const text = await generateWithAI({ prompt, maxTokens: 4000, userId: user.id });
      return parseJSONResponse<InsightsExecutiveResponse>(text);
    });

    // Check existing draft
    const { data: existingDraft } = await supabase
      .from("insights_executive_drafts")
      .select("id")
      .eq("project_id", projectId)
      .single();

    if (existingDraft) {
      const { data: draft, error: updateError } = await supabase
        .from("insights_executive_drafts")
        .update({
          growth_bets: response.growth_bets,
          segment_priorities: response.segment_priorities,
          positioning_summary: response.positioning_summary,
          validation_questions: response.validation_questions,
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
      .from("insights_executive_drafts")
      .insert({
        project_id: projectId,
        growth_bets: response.growth_bets,
        segment_priorities: response.segment_priorities,
        positioning_summary: response.positioning_summary,
        validation_questions: response.validation_questions,
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
