// =====================================================
// Generate Trust Framework - Per Segment
// Analyzes trust factors, proof hierarchy, credibility markers
// =====================================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { generateWithAI, parseJSONResponse } from "@/lib/ai-client";
import { handleApiError, ApiError, withRetry } from "@/lib/api-utils";
import {
  Project,
  Segment,
  OnboardingData,
  TrustFrameworkResponse,
} from "@/types";

function buildPrompt(
  onboarding: OnboardingData,
  segment: Segment,
  pains: unknown[],
  competitiveIntel: unknown,
  pricingPsychology: unknown
): string {
  return `You are a consumer psychology expert with 15+ years experience building trust for premium health/wellness brands. Analyze trust factors for ONE specific segment.

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
- Competitors: ${JSON.stringify(onboarding.competitors || [])}
- Geography: ${onboarding.geography || "N/A"}

## Segment Profile
- Name: ${segment.name}
- Description: ${segment.description || "N/A"}
- Sociodemographics: ${segment.sociodemographics || "N/A"}

## Segment Pains (context)
${JSON.stringify(pains.slice(0, 5), null, 2)}

## Competitive Intelligence (context)
${JSON.stringify(competitiveIntel, null, 2)}

## Pricing Psychology (context)
${JSON.stringify(pricingPsychology, null, 2)}

## Your Task

For segment "${segment.name}", analyze:
1. What is their baseline trust level and why are they skeptical?
2. What types of proof do they need, ranked by effectiveness?
3. Who do they trust as authorities in this space?
4. What social proof matters to them?
5. What transparency do they expect?
6. What destroys trust immediately?
7. What credibility markers do they look for?
8. How can we reduce their perceived risk?
9. What does their trust journey look like?

## REQUIRED JSON OUTPUT (copy this structure exactly):

{
  "baseline_trust": {
    "trust_in_category": "How much they trust this category - e.g., 'Low - burned by supplement industry marketing'",
    "trust_in_brand": "Current brand trust - e.g., 'New entrant - no established reputation'",
    "reasons_for_skepticism": ["reason 1", "reason 2", "reason 3", "reason 4"],
    "past_betrayals": ["past negative experience 1", "past experience 2", "past experience 3"]
  },
  "proof_hierarchy": [
    {
      "proof_type": "third_party_testing",
      "effectiveness": "very_high",
      "why_it_works": "Why this proof resonates with THIS segment",
      "how_to_present": "Best format/placement - e.g., 'Certificate badges on product page + downloadable COAs'",
      "examples": ["NSF Certified for Sport", "ConsumerLab verified", "Heavy metal testing results"]
    }
  ],
  "trusted_authorities": [
    {
      "authority_type": "science_communicator",
      "specific_names": ["Dr. Andrew Huberman", "Dr. Rhonda Patrick", "Dr. Peter Attia"],
      "why_trusted": "Why THIS segment trusts them - science-based, no sponsorship feeling",
      "how_to_leverage": "How to get endorsement - e.g., 'Provide product for honest review, share research'"
    }
  ],
  "social_proof": {
    "testimonial_profile": "Who they want to hear from - e.g., 'People like them who were skeptics, now converts'",
    "before_after_importance": "high",
    "numbers_that_matter": ["X customers", "Y% reported improvement", "Z years in business"],
    "case_study_angle": "What angle makes case studies compelling - e.g., 'Skeptic-to-believer journey'"
  },
  "transparency_needs": {
    "information_needed": ["ingredient sourcing", "manufacturing process", "testing protocols", "founder story"],
    "disclosure_expectations": ["what they expect disclosed upfront 1", "expectation 2", "expectation 3"],
    "transparency_level": "high"
  },
  "trust_killers": [
    {
      "red_flag": "Specific trust killer - e.g., 'Proprietary blend hiding actual dosages'",
      "why_triggers_skepticism": "Why this destroys trust for THIS segment",
      "how_to_avoid": "How to avoid - e.g., 'Full disclosure of all ingredients with exact amounts'"
    }
  ],
  "credibility_markers": [
    {
      "signal": "Credibility marker - e.g., 'Third-party testing certificates'",
      "importance": "critical",
      "current_status": "Assessment of whether brand likely has this - 'Unknown - need to verify'"
    }
  ],
  "risk_reduction": {
    "biggest_risks": ["perceived risk 1", "risk 2", "risk 3", "risk 4"],
    "reversal_mechanisms": [
      {
        "mechanism": "Risk reversal - e.g., '60-day money-back guarantee, no questions asked'",
        "effectiveness": "Why effective for THIS segment - e.g., 'Removes financial risk for skeptics'",
        "implementation": "How to implement - e.g., 'Prominent on product page, simple return process'"
      }
    ]
  },
  "trust_journey": {
    "first_touchpoint_goal": "What to achieve on first contact - e.g., 'Establish scientific credibility'",
    "mid_journey_reassurance": ["reassurance needed 1", "reassurance 2", "reassurance 3"],
    "pre_purchase_push": "Final push needed - e.g., 'Risk-free trial + testimonials from similar skeptics'",
    "post_purchase_confirmation": "How to confirm right choice - e.g., 'Welcome email with science, usage tips, expected timeline'"
  }
}

## VALIDATION RULES:
- effectiveness (proof_hierarchy): ONLY "low" | "medium" | "high" | "very_high"
- before_after_importance: ONLY "low" | "medium" | "high" | "critical"
- transparency_level: ONLY "minimal" | "moderate" | "high" | "full"
- importance (credibility_markers): ONLY "low" | "medium" | "high" | "critical"

## MINIMUM REQUIREMENTS:
- reasons_for_skepticism: 4+ items
- past_betrayals: 3+ items
- proof_hierarchy: 6+ items (ranked from most to least effective)
- trusted_authorities: 4+ items with REAL names
- numbers_that_matter: 4+ items
- information_needed: 4+ items
- disclosure_expectations: 3+ items
- trust_killers: 5+ items
- credibility_markers: 6+ items
- biggest_risks: 4+ items
- reversal_mechanisms: 3+ items
- mid_journey_reassurance: 4+ items

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

    const { data: pains } = await supabase
      .from("pains_initial")
      .select("*")
      .eq("project_id", projectId)
      .eq("segment_id", segmentId);

    const { data: competitiveIntel } = await supabase
      .from("competitive_intelligence")
      .select("*")
      .eq("project_id", projectId)
      .eq("segment_id", segmentId)
      .single();

    const { data: pricingPsychology } = await supabase
      .from("pricing_psychology")
      .select("*")
      .eq("project_id", projectId)
      .eq("segment_id", segmentId)
      .single();

    const prompt = buildPrompt(
      (project as Project).onboarding_data,
      segment as Segment,
      pains || [],
      competitiveIntel,
      pricingPsychology
    );

    const response = await withRetry(async () => {
      const text = await generateWithAI({ prompt, maxTokens: 6000, userId: user.id });
      return parseJSONResponse<TrustFrameworkResponse>(text);
    });

    const { data: existingDraft } = await supabase
      .from("trust_framework_drafts")
      .select("id")
      .eq("project_id", projectId)
      .eq("segment_id", segmentId)
      .single();

    const draftData = {
      project_id: projectId,
      segment_id: segmentId,
      baseline_trust: response.baseline_trust,
      proof_hierarchy: response.proof_hierarchy,
      trusted_authorities: response.trusted_authorities,
      social_proof: response.social_proof,
      transparency_needs: response.transparency_needs,
      trust_killers: response.trust_killers,
      credibility_markers: response.credibility_markers,
      risk_reduction: response.risk_reduction,
      trust_journey: response.trust_journey,
      version: 1,
    };

    if (existingDraft) {
      const { data: draft, error: updateError } = await supabase
        .from("trust_framework_drafts")
        .update(draftData)
        .eq("id", existingDraft.id)
        .select()
        .single();

      if (updateError) throw new ApiError("Failed to update draft", 500);
      return NextResponse.json({ success: true, draft, updated: true });
    }

    const { data: draft, error: insertError } = await supabase
      .from("trust_framework_drafts")
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
