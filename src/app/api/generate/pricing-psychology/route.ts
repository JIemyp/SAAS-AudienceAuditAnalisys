// =====================================================
// Increase timeout for AI generation
export const maxDuration = 60;

// Generate Pricing Psychology - Per Segment
// Analyzes budget context, price perception, value anchors
// =====================================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { generateWithAI, parseJSONResponse } from "@/lib/ai-client";
import { handleApiError, ApiError, withRetry } from "@/lib/api-utils";
import {
  Project,
  Segment,
  OnboardingData,
  PricingPsychologyResponse,
} from "@/types";

function buildPrompt(
  onboarding: OnboardingData,
  segment: Segment,
  pains: unknown[],
  competitiveIntel: unknown
): string {
  return `You are a pricing strategist and behavioral economist with 15+ years experience in premium health/wellness products. Analyze pricing psychology for ONE specific segment.

## CRITICAL: JSON STRUCTURE REQUIREMENTS
Your response MUST match the EXACT JSON structure below. Every field is REQUIRED.
- All enum fields must use ONLY the specified values
- All arrays must have the minimum specified items
- Boolean fields must be true or false (not strings)
- No extra fields, no missing fields

## Business Context
- Brand: ${onboarding.brandName || "N/A"}
- Product/Service: ${onboarding.productService || "N/A"}
- Product Format: ${onboarding.productFormat || "N/A"}
- Business Model: ${onboarding.businessModel || "N/A"}
- Price Segment: ${onboarding.priceSegment || "N/A"}
- Geography: ${onboarding.geography || "N/A"}
- USP: ${onboarding.usp || "N/A"}

## Segment Profile
- Name: ${segment.name}
- Description: ${segment.description || "N/A"}
- Sociodemographics: ${segment.sociodemographics || "N/A"}

## Segment Pains (context)
${JSON.stringify(pains.slice(0, 5), null, 2)}

## Competitive Intelligence (context)
${JSON.stringify(competitiveIntel, null, 2)}

## Your Task

For segment "${segment.name}", analyze:
1. How do they budget and categorize this expense?
2. What is their price sensitivity and spending behavior?
3. What value comparisons resonate with them?
4. What signals show readiness to pay?
5. How do they prefer to pay?
6. How do they calculate ROI?
7. What pricing objections do they have?
8. How do they respond to discounts?
9. What events trigger budget availability?

## REQUIRED JSON OUTPUT (copy this structure exactly):

{
  "budget_context": {
    "spending_category": "How they mentally categorize this expense - e.g., 'Health investment' vs 'Grocery budget'",
    "budget_allocation": "Where the money comes from - e.g., 'Discretionary health budget' or 'Household food budget'",
    "decision_cycle": "When budget decisions happen - e.g., 'Monthly review' or 'As-needed'",
    "who_controls_budget": "Decision maker - e.g., 'Individual discretion' or 'Joint decision with partner'"
  },
  "price_perception": {
    "price_sensitivity_level": "medium",
    "current_spending_on_alternatives": "What they currently spend - e.g., '$50-100/month on supplements'",
    "spending_ceiling": "Maximum they'd consider - e.g., '$150/month' with reasoning",
    "spending_sweet_spot": "Price range that feels 'fair' - e.g., '$70-90/month'",
    "free_trial_importance": "high"
  },
  "value_anchors": [
    {
      "comparison_point": "What they compare price to - e.g., 'Daily coffee habit ($5/day = $150/month)'",
      "why_this_works": "Why this comparison is persuasive for THIS segment"
    }
  ],
  "willingness_to_pay_signals": [
    {
      "signal": "Behavioral signal - e.g., 'Asks about ingredient sourcing before price'",
      "indicates": "What this means - e.g., 'Quality > price mindset'",
      "how_to_respond": "How to capitalize - e.g., 'Lead with quality credentials'"
    }
  ],
  "payment_psychology": {
    "preferred_structure": ["subscription_monthly", "subscription_annual", "one_time_purchase"],
    "payment_methods": ["credit_card", "paypal", "apple_pay"],
    "billing_frequency": "monthly",
    "payment_friction_points": ["unexpected shipping costs", "complex checkout", "no PayPal option"]
  },
  "roi_calculation": {
    "how_they_measure_value": "How they calculate if it's worth it - e.g., 'Feel better + save on other supplements'",
    "payback_expectation": "Expected time to see value - e.g., '2-4 weeks to feel difference'",
    "metrics_they_track": ["energy levels", "digestive comfort", "money saved on other supplements"]
  },
  "pricing_objections": [
    {
      "objection": "Specific objection - e.g., 'It's more expensive than my current supplements'",
      "underlying_concern": "Real concern - e.g., 'Fear of paying more for similar results'",
      "is_price_or_value": "value",
      "reframe_strategy": "How to address - e.g., 'Show consolidation savings and superior absorption'"
    }
  ],
  "discount_sensitivity": {
    "responds_to_discounts": true,
    "types_that_work": ["first_order_discount", "subscription_savings", "bundle_deals"],
    "types_that_backfire": ["constant_sales", "deep_discounts", "urgency_tactics"],
    "optimal_strategy": "Best approach for this segment - e.g., 'Subscribe & save 15% feels fair, not desperate'"
  },
  "budget_triggers": [
    {
      "trigger_event": "Event that unlocks budget - e.g., 'New Year health reset'",
      "timing": "When this happens - e.g., 'Late December - early January'",
      "how_to_leverage": "How to time approach - e.g., 'December email campaign with January start'"
    }
  ]
}

## VALIDATION RULES:
- price_sensitivity_level: ONLY "low" | "medium" | "high"
- free_trial_importance: ONLY "low" | "medium" | "high" | "critical"
- billing_frequency: ONLY "monthly" | "quarterly" | "annual" | "one_time"
- is_price_or_value: ONLY "price" | "value"
- responds_to_discounts: ONLY true | false (boolean, not string)

## MINIMUM REQUIREMENTS:
- value_anchors: 4+ items
- willingness_to_pay_signals: 4+ items
- preferred_structure: 3+ items
- payment_methods: 3+ items
- payment_friction_points: 3+ items
- metrics_they_track: 4+ items
- pricing_objections: 5+ items
- types_that_work: 3+ items
- types_that_backfire: 3+ items
- budget_triggers: 4+ items

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

    const prompt = buildPrompt(
      (project as Project).onboarding_data,
      segment as Segment,
      pains || [],
      competitiveIntel
    );

    const response = await withRetry(async () => {
      const text = await generateWithAI({ prompt, maxTokens: 6000, userId: user.id });
      return parseJSONResponse<PricingPsychologyResponse>(text);
    });

    const { data: existingDraft } = await supabase
      .from("pricing_psychology_drafts")
      .select("id")
      .eq("project_id", projectId)
      .eq("segment_id", segmentId)
      .single();

    const draftData = {
      project_id: projectId,
      segment_id: segmentId,
      budget_context: response.budget_context,
      price_perception: response.price_perception,
      value_anchors: response.value_anchors,
      willingness_to_pay_signals: response.willingness_to_pay_signals,
      payment_psychology: response.payment_psychology,
      roi_calculation: response.roi_calculation,
      pricing_objections: response.pricing_objections,
      discount_sensitivity: response.discount_sensitivity,
      budget_triggers: response.budget_triggers,
      version: 1,
    };

    if (existingDraft) {
      const { data: draft, error: updateError } = await supabase
        .from("pricing_psychology_drafts")
        .update(draftData)
        .eq("id", existingDraft.id)
        .select()
        .single();

      if (updateError) throw new ApiError("Failed to update draft", 500);
      return NextResponse.json({ success: true, draft, updated: true });
    }

    const { data: draft, error: insertError } = await supabase
      .from("pricing_psychology_drafts")
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
