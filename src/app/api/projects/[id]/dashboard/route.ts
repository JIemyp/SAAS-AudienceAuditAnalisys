import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { handleApiError, ApiError } from "@/lib/api-utils";
import { requireProjectAccess } from "@/lib/permissions";

type StepStatus = "complete" | "pending" | "missing";

const STEP_DEFS = [
  { key: "segment-details", draft: "segment_details_drafts", approved: "segment_details" },
  { key: "jobs", draft: "jobs_drafts", approved: "jobs" },
  { key: "preferences", draft: "preferences_drafts", approved: "preferences" },
  { key: "difficulties", draft: "difficulties_drafts", approved: "difficulties" },
  { key: "triggers", draft: "triggers_drafts", approved: "triggers" },
  { key: "pains", draft: "pains_drafts", approved: "pains_initial" },
  { key: "pains-ranking", draft: "pains_ranking_drafts", approved: "pains_ranking" },
  { key: "canvas", draft: "canvas_drafts", approved: "canvas" },
  { key: "canvas-extended", draft: "canvas_extended_drafts", approved: "canvas_extended" },
  { key: "channel-strategy", draft: "channel_strategy_drafts", approved: "channel_strategy" },
  { key: "competitive-intelligence", draft: "competitive_intelligence_drafts", approved: "competitive_intelligence" },
  { key: "pricing-psychology", draft: "pricing_psychology_drafts", approved: "pricing_psychology" },
  { key: "trust-framework", draft: "trust_framework_drafts", approved: "trust_framework" },
  { key: "jtbd-context", draft: "jtbd_context_drafts", approved: "jtbd_context" },
];

const STEP_ACTIONS: Record<string, string> = {
  "segment-details": "/generate/segment-details",
  jobs: "/generate/jobs",
  preferences: "/generate/preferences",
  difficulties: "/generate/difficulties",
  triggers: "/generate/triggers",
  pains: "/generate/pains",
  "pains-ranking": "/generate/pains-ranking",
  canvas: "/generate/canvas",
  "canvas-extended": "/generate/canvas-extended",
  "channel-strategy": "/generate/channel-strategy",
  "competitive-intelligence": "/generate/competitive-intelligence",
  "pricing-psychology": "/generate/pricing-psychology",
  "trust-framework": "/generate/trust-framework",
  "jtbd-context": "/generate/jtbd-context",
};

const STEP_LABELS: Record<string, string> = {
  "segment-details": "Segment Details",
  jobs: "Jobs",
  preferences: "Preferences",
  difficulties: "Difficulties",
  triggers: "Triggers",
  pains: "Pains",
  "pains-ranking": "Pains Ranking",
  canvas: "Canvas",
  "canvas-extended": "Canvas Extended",
  "channel-strategy": "Channel Strategy",
  "competitive-intelligence": "Competitive Intelligence",
  "pricing-psychology": "Pricing Psychology",
  "trust-framework": "Trust Framework",
  "jtbd-context": "JTBD Context",
};

async function fetchSegmentIds(
  adminSupabase: ReturnType<typeof createAdminClient>,
  projectId: string,
  table: string
): Promise<Set<string>> {
  const { data, error } = await adminSupabase
    .from(table)
    .select("segment_id")
    .eq("project_id", projectId);

  if (error || !data) {
    return new Set();
  }

  return new Set(
    data
      .map((row) => row.segment_id)
      .filter((id): id is string => typeof id === "string" && id.length > 0)
  );
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const supabase = await createServerClient();
    const adminSupabase = createAdminClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new ApiError("Unauthorized", 401);

    await requireProjectAccess(supabase, adminSupabase, projectId, user.id);

    const { data: segments, error: segmentsError } = await adminSupabase
      .from("segments")
      .select("id, name, order_index")
      .eq("project_id", projectId)
      .order("order_index", { ascending: true });

    if (segmentsError) {
      throw new ApiError(`Failed to load segments: ${segmentsError.message}`, 500);
    }

    const stepSets = await Promise.all(
      STEP_DEFS.map(async (step) => {
        const [approvedSet, draftSet] = await Promise.all([
          fetchSegmentIds(adminSupabase, projectId, step.approved),
          fetchSegmentIds(adminSupabase, projectId, step.draft),
        ]);

        return { key: step.key, approvedSet, draftSet };
      })
    );

    const researchHealthSegments = (segments || []).map((segment) => {
      const steps: Record<string, StepStatus> = {};

      for (const step of stepSets) {
        if (step.approvedSet.has(segment.id)) {
          steps[step.key] = "complete";
        } else if (step.draftSet.has(segment.id)) {
          steps[step.key] = "pending";
        } else {
          steps[step.key] = "missing";
        }
      }

      return {
        id: segment.id,
        name: segment.name,
        steps,
      };
    });

    const { data: pains } = await adminSupabase
      .from("pains_initial")
      .select("id, segment_id, name")
      .eq("project_id", projectId);

    const painMap = new Map<string, { id: string; segment_id: string | null; name: string | null }>(
      (pains || []).map((pain) => [pain.id, pain])
    );

    const { data: rankings } = await adminSupabase
      .from("pains_ranking")
      .select("pain_id, impact_score, is_top_pain, segment_id")
      .eq("project_id", projectId);

    const segmentNameMap = new Map<string, string>(
      (segments || []).map((seg) => [seg.id, seg.name])
    );

    const topRankings = (rankings || []).filter((row) => row.is_top_pain);
    const segmentPriority: Record<string, number> = {};

    for (const row of topRankings) {
      const pain = painMap.get(row.pain_id);
      const segmentId = row.segment_id || pain?.segment_id || null;
      if (!segmentId) continue;
      segmentPriority[segmentId] = (segmentPriority[segmentId] || 0) + (row.impact_score || 0);
    }

    const topSegments = Object.entries(segmentPriority)
      .map(([segmentId, score]) => ({
        id: segmentId,
        name: segmentNameMap.get(segmentId) || "Unknown",
        priority_score: score,
      }))
      .sort((a, b) => b.priority_score - a.priority_score)
      .slice(0, 5);

    const topPains = topRankings
      .map((row) => {
        const pain = painMap.get(row.pain_id);
        const segmentId = row.segment_id || pain?.segment_id || null;
        return {
          id: row.pain_id,
          name: pain?.name || "Unknown pain",
          segment_name: segmentId ? segmentNameMap.get(segmentId) || "Unknown segment" : "Unknown segment",
          impact_score: row.impact_score || 0,
        };
      })
      .sort((a, b) => b.impact_score - a.impact_score)
      .slice(0, 6);

    const { data: triggersRows } = await adminSupabase
      .from("triggers")
      .select("triggers")
      .eq("project_id", projectId);

    const triggerNames: string[] = [];
    const seenTriggers = new Set<string>();

    for (const row of triggersRows || []) {
      const list = Array.isArray(row.triggers) ? row.triggers : [];
      for (const trigger of list) {
        const name = trigger?.name;
        if (typeof name === "string" && name.length > 0 && !seenTriggers.has(name)) {
          seenTriggers.add(name);
          triggerNames.push(name);
        }
      }
    }

    const { data: strategySummary } = await adminSupabase
      .from("strategy_summary")
      .select("growth_bets, positioning_pillars")
      .eq("project_id", projectId)
      .order("approved_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const alerts: Array<{
      type: "missing_data" | "incomplete_segment" | "stale_data";
      message: string;
      segment_id?: string;
      action_url: string;
    }> = [];

    const topPainSegments = new Set<string>();
    for (const row of topRankings) {
      const pain = painMap.get(row.pain_id);
      const segmentId = row.segment_id || pain?.segment_id || null;
      if (segmentId) topPainSegments.add(segmentId);
    }

    for (const segment of segments || []) {
      const steps = researchHealthSegments.find((s) => s.id === segment.id)?.steps;
      if (!steps) continue;

      const pendingSteps = Object.entries(steps)
        .filter(([, status]) => status === "pending")
        .map(([key]) => key);

      if (pendingSteps.length > 0) {
        const firstPending = pendingSteps[0];
        const pendingLabels = pendingSteps.map((step) => STEP_LABELS[step] || step);
        alerts.push({
          type: "incomplete_segment",
          message: `Segment "${segment.name}" has pending approvals: ${pendingLabels.slice(0, 3).join(", ")}`,
          segment_id: segment.id,
          action_url: `/projects/${projectId}${STEP_ACTIONS[firstPending] || ""}`,
        });
      }

      if (!topPainSegments.has(segment.id)) {
        alerts.push({
          type: "missing_data",
          message: `Segment "${segment.name}" is missing top pains selection.`,
          segment_id: segment.id,
          action_url: `/projects/${projectId}${STEP_ACTIONS["pains-ranking"]}`,
        });
      }

      const criticalSteps = ["segment-details", "canvas-extended", "channel-strategy", "trust-framework", "jtbd-context"];
      for (const stepKey of criticalSteps) {
        if (steps[stepKey] === "missing") {
          alerts.push({
            type: "missing_data",
            message: `Segment "${segment.name}" is missing ${STEP_LABELS[stepKey] || stepKey}.`,
            segment_id: segment.id,
            action_url: `/projects/${projectId}${STEP_ACTIONS[stepKey] || ""}`,
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      research_health: {
        segments: researchHealthSegments,
      },
      strategic_highlights: {
        top_segments: topSegments,
        top_pains: topPains,
        key_triggers: triggerNames.slice(0, 6),
        strategy_summary: strategySummary || undefined,
      },
      alerts,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
