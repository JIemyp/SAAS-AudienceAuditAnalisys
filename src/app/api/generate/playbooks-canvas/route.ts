// =====================================================
// Increase timeout for AI generation
export const maxDuration = 60;

// Generate Playbooks Canvas - V7 MODULE (Per Segment × Top Pain)
// Creates landing page outline: Hero, Insight, Ritual, Proof, CTA sections
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
  SegmentDetails,
  Jobs,
  PainInitial,
  Canvas,
  CanvasExtended,
  TrustFramework,
  JTBDContext,
} from "@/types";

// Response type matching PROMPTS_V7.md
interface PlaybooksCanvasResponse {
  hero_section: {
    headline: string;
    subheadline: string;
    hook: string;
  };
  insight_section: {
    pain_story: string;
    root_cause: string;
    why_now: string;
  };
  ritual_section: {
    ritual_steps: string[];
    how_it_fits: string;
  };
  proof_section: {
    proof_points: string[];
    trust_assets: string[];
  };
  cta_section: {
    primary_cta: string;
    secondary_cta: string;
  };
}

function buildPlaybooksCanvasPrompt(
  onboarding: OnboardingData,
  segment: Segment,
  segmentDetails: SegmentDetails | null,
  pain: PainInitial,
  canvas: Canvas | null,
  canvasExtended: CanvasExtended | null,
  jobs: Jobs | null,
  trustFramework: TrustFramework | null,
  jtbdContext: JTBDContext | null
): string {
  return `You are a conversion strategist. Build a landing page outline in strict JSON.

## Global Output Rules
1. Return ONLY JSON. No markdown, no comments, no prose outside JSON.
2. Use double quotes for all keys and string values.
3. Do NOT include unescaped line breaks inside strings. Use "\\n" if needed.
4. No trailing commas.
5. Output language: English.
6. Keep each string under 240 characters.

## Business Context
- Brand: ${onboarding.brandName || "N/A"}
- Product/Service: ${onboarding.productService || "N/A"}
- Product Format: ${onboarding.productFormat || "N/A"}
- USP: ${onboarding.usp || "N/A"}
- Business Model: ${onboarding.businessModel || "N/A"}
- Price Segment: ${onboarding.priceSegment || "N/A"}
- Competitors: ${onboarding.competitors?.join(", ") || "N/A"}
- Differentiation: ${onboarding.differentiation || "N/A"}

## Segment
- Name: ${segment.name}
- Description: ${segment.description || "N/A"}
- Sociodemographics: ${segment.sociodemographics || "N/A"}
${segmentDetails ? `- Needs: ${JSON.stringify(segmentDetails.needs, null, 2)}` : ""}
${segmentDetails ? `- Core Values: ${JSON.stringify(segmentDetails.core_values, null, 2)}` : ""}

## Pain (Top Pain)
- Name: ${pain.name}
- Description: ${pain.description || "N/A"}

## Canvas Data
${canvas ? JSON.stringify(canvas, null, 2) : "Not available"}
${canvasExtended ? `\n## Canvas Extended\n${JSON.stringify(canvasExtended, null, 2)}` : ""}

## Jobs to Be Done
${jobs ? JSON.stringify(jobs, null, 2) : "Not available"}

## Trust Framework
${trustFramework ? JSON.stringify(trustFramework, null, 2) : "Not available"}

## JTBD Context
${jtbdContext ? JSON.stringify(jtbdContext, null, 2) : "Not available"}

## Your Task

Create a complete landing page outline for segment "${segment.name}" addressing pain "${pain.name}".

Structure:
1. **Hero Section**: Above-the-fold messaging
   - headline: Compelling headline that addresses the pain
   - subheadline: Supporting statement
   - hook: Attention-grabbing hook

2. **Insight Section**: Pain evidence and empathy
   - pain_story: Narrative that shows understanding of the pain
   - root_cause: What's causing this pain
   - why_now: Why this is the right time to address it

3. **Ritual Section**: Product fit and transformation
   - ritual_steps: 4+ steps showing how the product fits into their routine
   - how_it_fits: How the product integrates into their life

4. **Proof Section**: Trust and competitive advantage
   - proof_points: 4+ proof points
   - trust_assets: 3+ trust elements (testimonials, certifications, etc.)

5. **CTA Section**: Call-to-action messaging
   - primary_cta: Main call-to-action
   - secondary_cta: Alternative/softer CTA

## REQUIRED JSON OUTPUT:

{
  "hero_section": {
    "headline": "string (compelling headline addressing the pain)",
    "subheadline": "string (supporting statement)",
    "hook": "string (attention-grabbing hook)"
  },
  "insight_section": {
    "pain_story": "string (narrative showing understanding)",
    "root_cause": "string (what's causing the pain)",
    "why_now": "string (why this is the right time)"
  },
  "ritual_section": {
    "ritual_steps": ["string", "string", "string", "string"],
    "how_it_fits": "string (how product integrates)"
  },
  "proof_section": {
    "proof_points": ["string", "string", "string", "string"],
    "trust_assets": ["string", "string", "string"]
  },
  "cta_section": {
    "primary_cta": "string (main CTA)",
    "secondary_cta": "string (alternative CTA)"
  }
}

## MINIMUM REQUIREMENTS:
- ritual_steps: 4 items
- proof_points: 4 items
- trust_assets: 3 items

Return ONLY valid JSON. No markdown, no explanations.`;
}

export async function POST(request: NextRequest) {
  try {
    const { projectId, segmentId, painId } = await request.json();

    if (!projectId) {
      throw new ApiError("Project ID is required", 400);
    }

    if (!segmentId) {
      throw new ApiError("Segment ID is required", 400);
    }

    if (!painId) {
      throw new ApiError("Pain ID is required", 400);
    }

    const supabase = await createServerClient();
    const adminSupabase = createAdminClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new ApiError("Unauthorized", 401);
    }

    await requireWriteAccess(supabase, adminSupabase, projectId, user.id);

    // Verify pain is a top pain
    const { data: painRanking } = await adminSupabase
      .from("pains_ranking")
      .select("is_top_pain")
      .eq("project_id", projectId)
      .eq("pain_id", painId)
      .eq("is_top_pain", true)
      .maybeSingle();

    if (!painRanking) {
      throw new ApiError("Only top pains (is_top_pain = true) are allowed for playbooks", 400);
    }

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
    const { data: segment, error: segmentError } = await adminSupabase
      .from("segments")
      .select("*")
      .eq("id", segmentId)
      .eq("project_id", projectId)
      .single();

    if (segmentError || !segment) {
      throw new ApiError("Segment not found", 404);
    }

    // Get pain
    const { data: pain, error: painError } = await adminSupabase
      .from("pains_initial")
      .select("*")
      .eq("id", painId)
      .eq("project_id", projectId)
      .single();

    if (painError || !pain) {
      throw new ApiError("Pain not found", 404);
    }

    // Gather required data (only approved tables)
    const [
      { data: segmentDetails },
      { data: canvas },
      { data: canvasExtended },
      { data: jobs },
      { data: trustFramework },
      { data: jtbdContext },
    ] = await Promise.all([
      adminSupabase
        .from("segment_details")
        .select("*")
        .eq("project_id", projectId)
        .eq("segment_id", segmentId)
        .order("approved_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      adminSupabase
        .from("canvas")
        .select("*")
        .eq("project_id", projectId)
        .eq("segment_id", segmentId)
        .eq("pain_id", painId)
        .order("approved_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      adminSupabase
        .from("canvas_extended")
        .select("*")
        .eq("project_id", projectId)
        .eq("segment_id", segmentId)
        .eq("pain_id", painId)
        .order("approved_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      adminSupabase
        .from("jobs")
        .select("*")
        .eq("project_id", projectId)
        .eq("segment_id", segmentId)
        .order("approved_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      adminSupabase
        .from("trust_framework")
        .select("*")
        .eq("project_id", projectId)
        .order("approved_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      adminSupabase
        .from("jtbd_context")
        .select("*")
        .eq("project_id", projectId)
        .eq("segment_id", segmentId)
        .order("approved_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    // Build prompt
    const prompt = buildPlaybooksCanvasPrompt(
      typedProject.onboarding_data,
      segment as Segment,
      segmentDetails as SegmentDetails | null,
      pain as PainInitial,
      canvas as Canvas | null,
      canvasExtended as CanvasExtended | null,
      jobs as Jobs | null,
      trustFramework as TrustFramework | null,
      jtbdContext as JTBDContext | null
    );

    // Generate with Claude
    const response = await withRetry(async () => {
      const text = await generateWithAI({ prompt, maxTokens: 4000, userId: user.id });
      return parseJSONResponse<PlaybooksCanvasResponse>(text);
    });

    // Check existing draft
    const { data: existingDraft } = await adminSupabase
      .from("playbooks_canvas_drafts")
      .select("id")
      .eq("project_id", projectId)
      .eq("segment_id", segmentId)
      .eq("pain_id", painId)
      .maybeSingle();

    if (existingDraft) {
      const { data: draft, error: updateError } = await adminSupabase
        .from("playbooks_canvas_drafts")
        .update({
          hero_section: response.hero_section,
          insight_section: response.insight_section,
          ritual_section: response.ritual_section,
          proof_section: response.proof_section,
          cta_section: response.cta_section,
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

    const { data: draft, error: insertError } = await adminSupabase
      .from("playbooks_canvas_drafts")
      .insert({
        project_id: projectId,
        segment_id: segmentId,
        pain_id: painId,
        hero_section: response.hero_section,
        insight_section: response.insight_section,
        ritual_section: response.ritual_section,
        proof_section: response.proof_section,
        cta_section: response.cta_section,
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

