// =====================================================
// Increase timeout for AI generation
export const maxDuration = 60;

// Generate Strategy Summary - V6 MODULE (Per Project)
// Creates growth bets, positioning pillars, channel priorities, risk flags
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
  StrategySummary,
} from "@/types";

// Response type matching PROMPTS_V6.md
interface StrategySummaryResponse {
  growth_bets: Array<{
    title: string;
    rationale: string;
    score: number;
    key_jobs: string[];
    key_triggers: string[];
    key_pains: string[];
  }>;
  positioning_pillars: Array<{
    pillar: string;
    proof_points: string[];
    objections: string[];
  }>;
  channel_priorities: Array<{
    channel: string;
    why: string;
    fit_score: number;
    segments: string[];
  }>;
  risk_flags: Array<{
    risk: string;
    impact: string;
    mitigation: string;
  }>;
}

interface ResearchPack {
  segments: Array<{ id: string; name: string; description: string }>;
  jobs: unknown[];
  triggers: unknown[];
  pains: unknown[];
  portrait: unknown;
}

interface V5Pack {
  channel_strategy: unknown[];
  competitive_intelligence: unknown;
  pricing_psychology: unknown;
  trust_framework: unknown;
  jtbd_context: unknown;
}

function buildStrategySummaryPrompt(
  onboarding: OnboardingData,
  research: ResearchPack,
  v5: V5Pack
): string {
  return `You are a senior growth strategist. Produce a concise, structured strategy summary in strict JSON.

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

## Research Data
### Segments
${JSON.stringify(research.segments, null, 2)}

### Jobs
${JSON.stringify(research.jobs?.slice(0, 10) || [], null, 2)}

### Triggers
${JSON.stringify(research.triggers?.slice(0, 10) || [], null, 2)}

### Top Pains
${JSON.stringify(research.pains?.slice(0, 10) || [], null, 2)}

## V5 Modules
### Channel Strategy (aggregated)
${JSON.stringify(v5.channel_strategy?.slice(0, 3) || [], null, 2)}

### Competitive Intelligence
${JSON.stringify(v5.competitive_intelligence || {}, null, 2)}

### Trust Framework
${JSON.stringify(v5.trust_framework || {}, null, 2)}

## Your Task
Generate a project-level strategy summary with:
1) 3 scored growth bets (score = job_frequency × trigger_urgency × pain_impact, normalize to 1-125)
2) 3 positioning pillars with proof points and objections
3) 5 channel priorities with fit scores (1-10)
4) 3 risk flags with mitigations

## Scoring Rule
- job_frequency: daily=5, weekly=4, monthly=3, occasionally=2, rarely=1
- trigger_urgency: critical=5, high=4, medium=3, low=2
- pain_impact: use 1-5 scale

## REQUIRED JSON OUTPUT:
{
  "growth_bets": [
    {
      "title": "string",
      "rationale": "string",
      "score": 0,
      "key_jobs": ["string"],
      "key_triggers": ["string"],
      "key_pains": ["string"]
    }
  ],
  "positioning_pillars": [
    {
      "pillar": "string",
      "proof_points": ["string"],
      "objections": ["string"]
    }
  ],
  "channel_priorities": [
    {
      "channel": "string",
      "why": "string",
      "fit_score": 0,
      "segments": ["string"]
    }
  ],
  "risk_flags": [
    {
      "risk": "string",
      "impact": "string",
      "mitigation": "string"
    }
  ]
}

## MINIMUM REQUIREMENTS:
- growth_bets: 3 items
- positioning_pillars: 3 items
- channel_priorities: 5 items
- risk_flags: 3 items

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

    // Gather research data
    const [
      { data: segments },
      { data: jobs },
      { data: triggers },
      { data: pains },
      { data: portrait },
      { data: channelStrategy },
      { data: competitiveIntelligence },
      { data: trustFramework },
    ] = await Promise.all([
      supabase.from("segments").select("id, name, description").eq("project_id", projectId),
      supabase.from("jobs").select("*").eq("project_id", projectId).limit(20),
      supabase.from("triggers").select("*").eq("project_id", projectId).limit(20),
      supabase.from("pains_ranking").select("*").eq("project_id", projectId).eq("is_top_pain", true).limit(10),
      supabase.from("portrait_final").select("*").eq("project_id", projectId).order("approved_at", { ascending: false }).limit(1).single(),
      supabase.from("channel_strategy").select("*").eq("project_id", projectId).limit(5),
      supabase.from("competitive_intelligence").select("*").eq("project_id", projectId).order("approved_at", { ascending: false }).limit(1).single(),
      supabase.from("trust_framework").select("*").eq("project_id", projectId).order("approved_at", { ascending: false }).limit(1).single(),
    ]);

    const research: ResearchPack = {
      segments: (segments || []).map(s => ({ id: s.id, name: s.name, description: s.description })),
      jobs: jobs || [],
      triggers: triggers || [],
      pains: pains || [],
      portrait: portrait || null,
    };

    const v5: V5Pack = {
      channel_strategy: channelStrategy || [],
      competitive_intelligence: competitiveIntelligence || null,
      pricing_psychology: null,
      trust_framework: trustFramework || null,
      jtbd_context: null,
    };

    const prompt = buildStrategySummaryPrompt(
      typedProject.onboarding_data,
      research,
      v5
    );

    const response = await withRetry(async () => {
      const text = await generateWithAI({ prompt, maxTokens: 4000, userId: user.id });
      return parseJSONResponse<StrategySummaryResponse>(text);
    });

    // Check existing draft
    const { data: existingDraft } = await supabase
      .from("strategy_summary_drafts")
      .select("id")
      .eq("project_id", projectId)
      .single();

    if (existingDraft) {
      const { data: draft, error: updateError } = await supabase
        .from("strategy_summary_drafts")
        .update({
          growth_bets: response.growth_bets,
          positioning_pillars: response.positioning_pillars,
          channel_priorities: response.channel_priorities,
          risk_flags: response.risk_flags,
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
      .from("strategy_summary_drafts")
      .insert({
        project_id: projectId,
        growth_bets: response.growth_bets,
        positioning_pillars: response.positioning_pillars,
        channel_priorities: response.channel_priorities,
        risk_flags: response.risk_flags,
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
