// Generate Segments Final - Applies decisions from Segments Review
// Similar to Portrait Final which applies Portrait Review decisions
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { generateWithClaude, parseJSONResponse } from "@/lib/anthropic";
import { buildSegmentsFinalPrompt, SegmentsFinalResponse } from "@/lib/prompts";
import { handleApiError, ApiError, withRetry } from "@/lib/api-utils";
import {
  Project,
  SegmentInitial,
  SegmentsReview,
  RecommendationDecision,
  OverlapItem,
  BreadthItem,
  MissingSegmentItem,
} from "@/types";

// Filter review items based on user decisions (same pattern as portrait-final)
function filterReviewByDecisions(
  review: SegmentsReview,
  decisions: Record<string, RecommendationDecision>
): {
  segment_overlaps: OverlapItem[];
  too_broad: BreadthItem[];
  too_narrow: BreadthItem[];
  missing_segments: MissingSegmentItem[];
} {
  // Filter overlaps - keep only applied or edited
  const segment_overlaps = (review.segment_overlaps || []).filter((_, index) => {
    const decision = decisions[`overlap-${index}`];
    return decision && (decision.status === "applied" || decision.status === "edited");
  });

  // Filter too_broad - keep only applied or edited
  const too_broad = (review.too_broad || []).filter((_, index) => {
    const decision = decisions[`broad-${index}`];
    return decision && (decision.status === "applied" || decision.status === "edited");
  });

  // Filter too_narrow - keep only applied or edited
  const too_narrow = (review.too_narrow || []).filter((_, index) => {
    const decision = decisions[`narrow-${index}`];
    return decision && (decision.status === "applied" || decision.status === "edited");
  });

  // Filter missing_segments - keep only applied or edited
  const missing_segments = (review.missing_segments || []).filter((_, index) => {
    const decision = decisions[`missing-${index}`];
    return decision && (decision.status === "applied" || decision.status === "edited");
  });

  return { segment_overlaps, too_broad, too_narrow, missing_segments };
}

export async function POST(request: NextRequest) {
  try {
    const { projectId } = await request.json();

    if (!projectId) {
      throw new ApiError("Project ID is required", 400);
    }

    const supabase = await createServerClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new ApiError("Unauthorized", 401);
    }

    // Get project
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .single();

    if (projectError || !project) {
      throw new ApiError("Project not found", 404);
    }

    // Get original approved segments
    const { data: segments, error: segmentsError } = await supabase
      .from("segments_initial")
      .select("*")
      .eq("project_id", projectId)
      .order("segment_index");

    if (segmentsError || !segments || segments.length === 0) {
      throw new ApiError("Original segments not found", 400);
    }

    // Get approved segments review with decisions
    const { data: review, error: reviewError } = await supabase
      .from("segments_review")
      .select("*")
      .eq("project_id", projectId)
      .order("approved_at", { ascending: false })
      .limit(1)
      .single();

    if (reviewError || !review) {
      throw new ApiError("Segments review not found", 400);
    }

    // Get decisions from the review
    const decisions = (review.decisions as Record<string, RecommendationDecision>) || {};

    // Filter review to only include applied/edited items
    const filteredReview = filterReviewByDecisions(review as SegmentsReview, decisions);

    const appliedCount =
      filteredReview.segment_overlaps.length +
      filteredReview.too_broad.length +
      filteredReview.too_narrow.length +
      filteredReview.missing_segments.length;

    console.log(
      `[segments-final] Applying ${appliedCount} changes: ` +
        `${filteredReview.segment_overlaps.length} overlaps, ` +
        `${filteredReview.too_broad.length} too_broad, ` +
        `${filteredReview.too_narrow.length} too_narrow, ` +
        `${filteredReview.missing_segments.length} missing`
    );

    const prompt = buildSegmentsFinalPrompt(
      (project as Project).onboarding_data,
      segments as SegmentInitial[],
      filteredReview
    );

    const response = await withRetry(async () => {
      const text = await generateWithClaude({ prompt, maxTokens: 8192 });
      return parseJSONResponse<SegmentsFinalResponse>(text);
    });

    // Delete previous drafts for this project
    await supabase.from("segments_final_drafts").delete().eq("project_id", projectId);

    // Insert new drafts for each segment
    const drafts = [];
    for (const segment of response.segments) {
      const { data: draft, error: insertError } = await supabase
        .from("segments_final_drafts")
        .insert({
          project_id: projectId,
          segment_index: segment.segment_index,
          name: segment.name,
          description: segment.description,
          sociodemographics: segment.sociodemographics,
          changes_applied: segment.changes_applied || [],
          is_new: segment.is_new || false,
          version: 1,
        })
        .select()
        .single();

      if (insertError) {
        console.error("[segments-final] Insert error:", insertError);
        throw new ApiError(`Failed to save segment draft: ${insertError.message}`, 500);
      }

      drafts.push(draft);
    }

    // Update project step
    await supabase.from("projects").update({ current_step: "segments_final_draft" }).eq("id", projectId);

    console.log(`[segments-final] Generated ${drafts.length} final segments. Summary: ${response.summary}`);

    return NextResponse.json({
      success: true,
      drafts,
      summary: response.summary,
      changes_applied: appliedCount,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
