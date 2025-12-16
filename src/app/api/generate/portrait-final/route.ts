// =====================================================
// Increase timeout for AI generation
export const maxDuration = 60;

// Generate Portrait Final - Prompt 4
// Uses user decisions from portrait review to apply only accepted changes
// =====================================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { generateWithAI, parseJSONResponse } from "@/lib/ai-client";
import { buildPortraitFinalPrompt, PortraitFinalResponse } from "@/lib/prompts";
import { handleApiError, ApiError, withRetry } from "@/lib/api-utils";
import { Portrait, PortraitReview, RecommendationDecision } from "@/types";

// Filter review items based on user decisions
function filterReviewByDecisions(
  review: PortraitReview,
  decisions: Record<string, RecommendationDecision>
): PortraitReview {
  const filteredReview = { ...review };

  // Filter what_to_change - keep only applied or edited
  if (review.what_to_change) {
    filteredReview.what_to_change = review.what_to_change.filter((_, index) => {
      const decision = decisions[`change-${index}`];
      return decision && (decision.status === "applied" || decision.status === "edited");
    }).map((item, index) => {
      const decision = decisions[`change-${index}`];
      // If edited, use the edited text (parse it back to structure if possible)
      if (decision?.status === "edited" && decision.editedText) {
        return { ...item, suggested: decision.editedText };
      }
      return item;
    });
  }

  // Filter what_to_add - keep only applied or edited
  if (review.what_to_add) {
    filteredReview.what_to_add = review.what_to_add.filter((_, index) => {
      const decision = decisions[`addition-${index}`];
      return decision && (decision.status === "applied" || decision.status === "edited");
    }).map((item, index) => {
      const decision = decisions[`addition-${index}`];
      if (decision?.status === "edited" && decision.editedText) {
        return { ...item, addition: decision.editedText };
      }
      return item;
    });
  }

  // Filter what_to_remove - keep only applied or edited
  if (review.what_to_remove) {
    filteredReview.what_to_remove = review.what_to_remove.filter((_, index) => {
      const decision = decisions[`removal-${index}`];
      return decision && (decision.status === "applied" || decision.status === "edited");
    }).map((item, index) => {
      const decision = decisions[`removal-${index}`];
      if (decision?.status === "edited" && decision.editedText) {
        return { ...item, removal: decision.editedText };
      }
      return item;
    });
  }

  return filteredReview;
}

export async function POST(request: NextRequest) {
  try {
    const { projectId } = await request.json();

    if (!projectId) {
      throw new ApiError("Project ID is required", 400);
    }

    const supabase = await createServerClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new ApiError("Unauthorized", 401);
    }

    // Get approved portrait
    const { data: portrait, error: portraitError } = await supabase
      .from("portrait")
      .select("*")
      .eq("project_id", projectId)
      .order("approved_at", { ascending: false })
      .limit(1)
      .single();

    if (portraitError || !portrait) {
      throw new ApiError("Portrait not found", 400);
    }

    // Get approved review with decisions
    const { data: review, error: reviewError } = await supabase
      .from("portrait_review")
      .select("*")
      .eq("project_id", projectId)
      .order("approved_at", { ascending: false })
      .limit(1)
      .single();

    if (reviewError || !review) {
      throw new ApiError("Portrait review not found", 400);
    }

    // Get decisions from the review
    const decisions = (review.decisions as Record<string, RecommendationDecision>) || {};

    // Filter review to only include applied/edited items
    const filteredReview = filterReviewByDecisions(review as PortraitReview, decisions);

    console.log(`[portrait-final] Applying ${filteredReview.what_to_change?.length || 0} changes, ${filteredReview.what_to_add?.length || 0} additions, ${filteredReview.what_to_remove?.length || 0} removals`);

    const prompt = buildPortraitFinalPrompt(portrait as Portrait, filteredReview);

    const response = await withRetry(async () => {
      const text = await generateWithAI({ prompt, maxTokens: 4096, userId: user.id });
      return parseJSONResponse<PortraitFinalResponse>(text);
    });

    const { data: draft, error: insertError } = await supabase
      .from("portrait_final_drafts")
      .insert({
        project_id: projectId,
        sociodemographics: response.sociodemographics,
        psychographics: response.psychographics,
        age_range: response.demographics_detailed.age_range,
        gender_distribution: response.demographics_detailed.gender_distribution,
        income_level: response.demographics_detailed.income_level,
        education: response.demographics_detailed.education,
        location: response.demographics_detailed.location,
        occupation: response.demographics_detailed.occupation,
        family_status: response.demographics_detailed.family_status,
        values_beliefs: response.psychographics_detailed.values_beliefs,
        lifestyle_habits: response.psychographics_detailed.lifestyle_habits,
        interests_hobbies: response.psychographics_detailed.interests_hobbies,
        personality_traits: response.psychographics_detailed.personality_traits,
        changes_applied: response.changes_applied,
        version: 1,
      })
      .select()
      .single();

    if (insertError) {
      throw new ApiError("Failed to save draft", 500);
    }

    await supabase
      .from("projects")
      .update({ current_step: "portrait_final_draft" })
      .eq("id", projectId);

    return NextResponse.json({ success: true, draft });
  } catch (error) {
    return handleApiError(error);
  }
}
