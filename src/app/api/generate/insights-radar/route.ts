// =====================================================
// Increase timeout for AI generation
export const maxDuration = 60;

// Generate Insights Radar - V7 MODULE (Per Project)
// Gap analysis: jobs vs benefits, triggers vs timeline, risk alerts
// =====================================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireWriteAccess } from "@/lib/permissions";
import { generateWithAI, parseJSONResponse } from "@/lib/ai-client";
import { handleApiError, ApiError, withRetry } from "@/lib/api-utils";
import { Project, OnboardingData } from "@/types";

// Response type matching V7 schema
interface InsightsRadarResponse {
  jobs_vs_benefits_gap: {
    gaps: Array<{
      job: string;
      missing_benefits: string[];
      severity: "critical" | "high" | "medium" | "low";
    }>;
    coverage_score: number; // 0-100
  };
  triggers_vs_timeline: {
    timeline_mapping: Array<{
      trigger: string;
      expected_timeline: string;
      actual_timeline: string;
      alignment_score: number; // 0-100
    }>;
    urgency_distribution: {
      critical: number;
      high: number;
      medium: number;
      low: number;
    };
  };
  risk_alerts: Array<{
    risk: string;
    severity: "critical" | "warning" | "info";
    impact: string;
    recommendation: string;
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

function buildInsightsRadarPrompt(
  onboarding: OnboardingData,
  jobs: unknown[],
  triggers: unknown[],
  preferences: unknown[],
  canvasData: unknown[],
  painsRanking: unknown[]
): string {
  return `You are a senior strategic analyst. Generate gap analysis and risk alerts in strict JSON.

## Global Output Rules
1. Return ONLY JSON. No markdown, no comments, no prose outside JSON.
2. Use double quotes for all keys and string values.
3. Do NOT include unescaped line breaks inside strings. Use "\\n" if needed.
4. No trailing commas.
5. Prefer bullet-like sentences, avoid long paragraphs.
6. Output language: English.

## Business Context
- Brand: ${onboarding.brandName || "N/A"}
- Product/Service: ${onboarding.productService || "N/A"}
- USP: ${onboarding.usp || "N/A"}
- Business Model: ${onboarding.businessModel || "N/A"}
- Price Segment: ${onboarding.priceSegment || "N/A"}

## Data for Analysis

### Jobs to Be Done (approved, showing first 12):
${JSON.stringify((jobs || []).slice(0, 12), null, 2)}

### Triggers (approved, showing first 12):
${JSON.stringify((triggers || []).slice(0, 12), null, 2)}

### Preferences (approved, showing first 8):
${JSON.stringify((preferences || []).slice(0, 8), null, 2)}

### Canvas & Messaging (approved, showing first 5):
${JSON.stringify(canvasData.slice(0, 5), null, 2)}

### Pains Ranking (approved, top pains only):
${JSON.stringify((painsRanking || []).slice(0, 8), null, 2)}

## Your Task
Analyze the data to identify:

1. **Jobs vs Benefits Gap**: Which customer jobs are NOT addressed by current messaging/benefits in canvas?
   - List gaps with severity
   - Calculate overall coverage score (0-100)

2. **Triggers vs Timeline**: When do triggers happen vs when customer journey/purchase typically occurs?
   - Map each trigger to expected vs actual timeline
   - Calculate alignment scores
   - Show urgency distribution

3. **Risk Alerts**: Contradictions, missing coverage, misalignment
   - Flag critical issues (severity: critical, warning, info)
   - Explain impact and provide actionable recommendations

4. **Evidence Sources**: Which tables/fields you used (jobs, triggers, canvas, etc.)

5. **Validation Metrics**: How to test these insights (A/B tests, surveys, etc.)

## REQUIRED JSON OUTPUT:
{
  "jobs_vs_benefits_gap": {
    "gaps": [
      {
        "job": "string (e.g., 'Feel confident in social situations')",
        "missing_benefits": ["string", "string"],
        "severity": "critical" | "high" | "medium" | "low"
      }
    ],
    "coverage_score": 75
  },
  "triggers_vs_timeline": {
    "timeline_mapping": [
      {
        "trigger": "string (e.g., 'Upcoming event in 2 weeks')",
        "expected_timeline": "string",
        "actual_timeline": "string",
        "alignment_score": 80
      }
    ],
    "urgency_distribution": {
      "critical": 2,
      "high": 5,
      "medium": 3,
      "low": 1
    }
  },
  "risk_alerts": [
    {
      "risk": "string (e.g., 'No messaging for emotional jobs')",
      "severity": "critical" | "warning" | "info",
      "impact": "string",
      "recommendation": "string"
    }
  ],
  "evidence_sources": [
    {
      "table_name": "jobs",
      "field_used": "functional_jobs",
      "record_count": 3
    }
  ],
  "validation_metrics": [
    {
      "metric": "Job coverage rate",
      "how_to_test": "A/B test messaging variants",
      "expected_outcome": "Increase conversion by addressing gaps"
    }
  ]
}

## MINIMUM REQUIREMENTS:
- gaps: 3+ items
- timeline_mapping: 3+ items
- risk_alerts: 3+ items
- evidence_sources: 3+ items
- validation_metrics: 2+ items

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

    // Gather prerequisite data (APPROVED ONLY) - LIMIT to avoid context window issues
    const [
      { data: jobs },
      { data: triggers },
      { data: preferences },
      { data: canvas },
      { data: canvasExtended },
      { data: painsRanking },
    ] = await Promise.all([
      supabase
        .from("jobs")
        .select("*")
        .eq("project_id", projectId)
        .not("approved_at", "is", null)
        .limit(15), // Limit to avoid large context
      supabase
        .from("triggers")
        .select("*")
        .eq("project_id", projectId)
        .not("approved_at", "is", null)
        .limit(15), // Limit to avoid large context
      supabase
        .from("preferences")
        .select("*")
        .eq("project_id", projectId)
        .not("approved_at", "is", null)
        .limit(10), // Limit to avoid large context
      supabase
        .from("canvas")
        .select("*")
        .eq("project_id", projectId)
        .not("approved_at", "is", null)
        .limit(5), // Limit to avoid large context
      supabase
        .from("canvas_extended")
        .select("*")
        .eq("project_id", projectId)
        .not("approved_at", "is", null)
        .limit(5), // Limit to avoid large context
      supabase
        .from("pains_ranking")
        .select("*")
        .eq("project_id", projectId)
        .not("approved_at", "is", null)
        .eq("is_top_pain", true)
        .limit(10), // Limit to top pains only
    ]);

    // Combine canvas data for messaging/benefits analysis
    const canvasData = [
      ...(canvas || []),
      ...(canvasExtended || []),
    ];

    const prompt = buildInsightsRadarPrompt(
      typedProject.onboarding_data,
      jobs || [],
      triggers || [],
      preferences || [],
      canvasData,
      painsRanking || []
    );

    const response = await withRetry(async () => {
      const text = await generateWithAI({ prompt, maxTokens: 5000, userId: user.id });
      return parseJSONResponse<InsightsRadarResponse>(text);
    });

    // Check existing draft
    const { data: existingDraft } = await supabase
      .from("insights_radar_drafts")
      .select("id")
      .eq("project_id", projectId)
      .single();

    if (existingDraft) {
      const { data: draft, error: updateError } = await supabase
        .from("insights_radar_drafts")
        .update({
          jobs_vs_benefits_gap: response.jobs_vs_benefits_gap,
          triggers_vs_timeline: response.triggers_vs_timeline,
          risk_alerts: response.risk_alerts,
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
      .from("insights_radar_drafts")
      .insert({
        project_id: projectId,
        jobs_vs_benefits_gap: response.jobs_vs_benefits_gap,
        triggers_vs_timeline: response.triggers_vs_timeline,
        risk_alerts: response.risk_alerts,
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
