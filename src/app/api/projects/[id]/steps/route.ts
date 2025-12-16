// =====================================================
// Get Generation Steps Status
// Returns status for each step based on actual table data
// =====================================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { handleApiError, ApiError } from "@/lib/api-utils";

// Step configuration: step name -> { draft table, approved table }
const STEP_TABLES: Record<string, { draft: string; approved: string }> = {
  validation: { draft: "validation_drafts", approved: "validation" },
  portrait: { draft: "portrait_drafts", approved: "portrait" },
  "portrait-review": { draft: "portrait_review_drafts", approved: "portrait_review" },
  "portrait-final": { draft: "portrait_final_drafts", approved: "portrait_final" },
  jobs: { draft: "jobs_drafts", approved: "jobs" },
  preferences: { draft: "preferences_drafts", approved: "preferences" },
  difficulties: { draft: "difficulties_drafts", approved: "difficulties" },
  triggers: { draft: "triggers_drafts", approved: "triggers" },
  segments: { draft: "segments_drafts", approved: "segments_initial" },
  "segments-review": { draft: "segments_review_drafts", approved: "segments_review" },
  "segments-final": { draft: "segments_final_drafts", approved: "segments_final" },
  "segment-details": { draft: "segment_details_drafts", approved: "segment_details" },
  pains: { draft: "pains_drafts", approved: "pains_initial" },
  "pains-ranking": { draft: "pains_ranking_drafts", approved: "pains_ranking" },
  canvas: { draft: "canvas_drafts", approved: "canvas" },
  "canvas-extended": { draft: "canvas_extended_drafts", approved: "canvas_extended" },
  // V5 Strategic Modules
  "channel-strategy": { draft: "channel_strategy_drafts", approved: "channel_strategy" },
  "competitive-intelligence": { draft: "competitive_intelligence_drafts", approved: "competitive_intelligence" },
  "pricing-psychology": { draft: "pricing_psychology_drafts", approved: "pricing_psychology" },
  "trust-framework": { draft: "trust_framework_drafts", approved: "trust_framework" },
  "jtbd-context": { draft: "jtbd_context_drafts", approved: "jtbd_context" },
};

// Step order for determining which steps are locked
const STEP_ORDER = [
  "validation",
  "portrait",
  "portrait-review",
  "portrait-final",
  "segments",
  "segments-review",
  "segments-final",
  "segment-details",
  "jobs",
  "preferences",
  "difficulties",
  "triggers",
  "pains",
  "pains-ranking",
  "canvas",
  "canvas-extended",
  // V5 Strategic Modules
  "channel-strategy",
  "competitive-intelligence",
  "pricing-psychology",
  "trust-framework",
  "jtbd-context",
];

export type StepStatus = "completed" | "in_progress" | "locked";

export interface StepStatusResponse {
  step: string;
  status: StepStatus;
  hasDraft: boolean;
  hasApproved: boolean;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;

    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new ApiError("Unauthorized", 401);

    // Check project exists and get owner info
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, user_id")
      .eq("id", projectId)
      .single();

    if (projectError || !project) throw new ApiError("Project not found", 404);

    // Check if user is owner
    const isOwner = project.user_id === user.id;

    // If not owner, check if user is a member
    if (!isOwner) {
      const { data: membership } = await supabase
        .from("project_members")
        .select("id")
        .eq("project_id", projectId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (!membership) throw new ApiError("Project not found", 404);
    }

    // First pass: collect all data
    const stepData: { step: string; hasDraft: boolean; hasApproved: boolean }[] = [];

    for (const stepName of STEP_ORDER) {
      const tables = STEP_TABLES[stepName];

      // Check if approved table has data
      let hasApproved = false;
      try {
        const { data: approvedData, error: approvedError } = await supabase
          .from(tables.approved)
          .select("id")
          .eq("project_id", projectId)
          .limit(1);

        hasApproved = !approvedError && approvedData && approvedData.length > 0;
      } catch {
        hasApproved = false;
      }

      // Check if draft table has data
      let hasDraft = false;
      try {
        const { data: draftData, error: draftError } = await supabase
          .from(tables.draft)
          .select("id")
          .eq("project_id", projectId)
          .limit(1);

        hasDraft = !draftError && draftData && draftData.length > 0;
      } catch {
        hasDraft = false;
      }

      stepData.push({ step: stepName, hasDraft, hasApproved });
    }

    // Second pass: determine statuses
    // Rule: step is accessible if previous step is completed OR if this step has any data
    const stepStatuses: StepStatusResponse[] = [];

    for (let i = 0; i < stepData.length; i++) {
      const { step, hasDraft, hasApproved } = stepData[i];
      const previousStepCompleted = i === 0 || stepData[i - 1].hasApproved;

      let status: StepStatus;

      if (hasApproved) {
        // Step is completed (approved)
        status = "completed";
      } else if (hasDraft) {
        // Step has draft but not approved yet
        status = "in_progress";
      } else if (previousStepCompleted) {
        // Previous step is done, this step can be started
        status = "in_progress";
      } else {
        // Previous step not completed, this step is locked
        status = "locked";
      }

      stepStatuses.push({
        step,
        status,
        hasDraft,
        hasApproved,
      });
    }

    return NextResponse.json({
      success: true,
      steps: stepStatuses,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
