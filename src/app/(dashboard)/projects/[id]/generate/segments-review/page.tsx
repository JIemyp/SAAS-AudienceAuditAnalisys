"use client";

import { use, useState, useCallback, useRef, useMemo } from "react";
import {
  GenerationPage,
  DraftCard,
  DraftSection,
} from "@/components/generation/GenerationPage";
import {
  RecommendationCard,
  DecisionProgress,
  RecommendationStatus,
  RecommendationDecision,
} from "@/components/ui/RecommendationCard";
import { SegmentsReviewDraft } from "@/types";
import { Search, Layers, Maximize, Minimize, Plus, AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SegmentsReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = use(params);

  // State for tracking decisions across all recommendations
  const [decisions, setDecisions] = useState<Record<string, RecommendationDecision>>({});
  // Use ref to track current draft without causing re-renders
  const currentDraftRef = useRef<SegmentsReviewDraft | null>(null);
  // Force update trigger for approval status
  const [, forceUpdate] = useState({});

  // Callbacks for decision actions
  const handleApply = useCallback((id: string, originalText: string) => {
    setDecisions((prev) => ({
      ...prev,
      [id]: { id, status: "applied", originalText },
    }));
  }, []);

  const handleEdit = useCallback((id: string, originalText: string, newText: string) => {
    setDecisions((prev) => ({
      ...prev,
      [id]: { id, status: "edited", originalText, editedText: newText },
    }));
  }, []);

  const handleDismiss = useCallback((id: string, originalText: string) => {
    setDecisions((prev) => ({
      ...prev,
      [id]: { id, status: "dismissed", originalText },
    }));
  }, []);

  const handleReset = useCallback((id: string) => {
    setDecisions((prev) => {
      const newDecisions = { ...prev };
      delete newDecisions[id];
      return newDecisions;
    });
  }, []);

  // Calculate all recommendation IDs for a draft
  const getAllRecommendationIds = useCallback((draft: SegmentsReviewDraft | null) => {
    if (!draft) return [];

    const ids: string[] = [];
    (draft.segment_overlaps || []).forEach((_: unknown, i: number) => ids.push(`overlap-${i}`));
    (draft.too_broad || []).forEach((_: unknown, i: number) => ids.push(`broad-${i}`));
    (draft.too_narrow || []).forEach((_: unknown, i: number) => ids.push(`narrow-${i}`));
    (draft.missing_segments || []).forEach((_: unknown, i: number) => ids.push(`missing-${i}`));
    (draft.recommendations || []).forEach((_: unknown, i: number) => ids.push(`rec-${i}`));

    return ids;
  }, []);

  // Calculate approval status based on draft and decisions
  const calculateApprovalStatus = useCallback(
    (draft: SegmentsReviewDraft | null) => {
      const allIds = getAllRecommendationIds(draft);
      const total = allIds.length;

      if (total === 0) return { canApprove: true, pending: 0, total: 0 };

      const pending = allIds.filter(id => !decisions[id]).length;

      return {
        canApprove: pending === 0,
        pending,
        total,
      };
    },
    [decisions, getAllRecommendationIds]
  );

  // Count by status
  const calculateStatusCounts = useCallback(
    (draft: SegmentsReviewDraft | null) => {
      const allIds = getAllRecommendationIds(draft);

      let applied = 0,
        edited = 0,
        dismissed = 0,
        pending = 0;

      allIds.forEach((id) => {
        const decision = decisions[id];
        if (!decision) pending++;
        else if (decision.status === "applied") applied++;
        else if (decision.status === "edited") edited++;
        else if (decision.status === "dismissed") dismissed++;
      });

      return { applied, edited, dismissed, pending };
    },
    [decisions, getAllRecommendationIds]
  );

  // Memoized approval status based on current draft ref
  const approvalStatus = useMemo(() => {
    return calculateApprovalStatus(currentDraftRef.current);
  }, [calculateApprovalStatus, decisions]);

  return (
    <GenerationPage<SegmentsReviewDraft>
      projectId={projectId}
      title="Segments Self-Review"
      description="AI critically reviews the generated segments for overlaps, breadth issues, and missing opportunities. Review each finding and decide whether to apply, edit, or dismiss it."
      generateEndpoint="/api/generate/segments-review"
      approveEndpoint="/api/approve/segments-review"
      draftTable="segments_review_drafts"
      nextStepUrl="/generate/segments-final"
      icon={<Search className="w-6 h-6" />}
      emptyStateMessage="Let AI analyze the segments for potential improvements - overlaps, too broad/narrow segments, and missing opportunities."
      canApprove={approvalStatus.canApprove}
      approveBlockedMessage={`Review all ${approvalStatus.pending} remaining finding${approvalStatus.pending > 1 ? "s" : ""} before approving`}
      pendingDecisionsCount={approvalStatus.pending}
      decisions={decisions}
      renderDraft={(draft) => {
        // Update ref without causing re-render loop
        if (currentDraftRef.current?.id !== draft.id) {
          currentDraftRef.current = draft;
          // Trigger one update when draft changes
          setTimeout(() => forceUpdate({}), 0);
        }

        const status = calculateApprovalStatus(draft);
        const counts = calculateStatusCounts(draft);

        return (
          <SegmentsReviewDraftView
            draft={draft}
            decisions={decisions}
            onApply={handleApply}
            onEditDecision={handleEdit}
            onDismiss={handleDismiss}
            onReset={handleReset}
            approvalStatus={status}
            statusCounts={counts}
          />
        );
      }}
    />
  );
}

interface SegmentsReviewDraftViewProps {
  draft: SegmentsReviewDraft;
  decisions: Record<string, RecommendationDecision>;
  onApply: (id: string, originalText: string) => void;
  onEditDecision: (id: string, originalText: string, newText: string) => void;
  onDismiss: (id: string, originalText: string) => void;
  onReset: (id: string) => void;
  approvalStatus: { canApprove: boolean; pending: number; total: number };
  statusCounts: { applied: number; edited: number; dismissed: number; pending: number };
}

function SegmentsReviewDraftView({
  draft,
  decisions,
  onApply,
  onEditDecision,
  onDismiss,
  onReset,
  approvalStatus,
  statusCounts,
}: SegmentsReviewDraftViewProps) {
  // Debug: check if draft is translated
  console.log('[SegmentsReviewDraftView] Draft received:', {
    id: draft.id,
    firstOverlap: draft.segment_overlaps?.[0]?.overlap_description?.substring(0, 50),
    firstRecommendation: draft.recommendations?.[0]?.substring(0, 50),
  });

  const hasOverlaps = draft.segment_overlaps && draft.segment_overlaps.length > 0;
  const hasTooBroad = draft.too_broad && draft.too_broad.length > 0;
  const hasTooNarrow = draft.too_narrow && draft.too_narrow.length > 0;
  const hasMissing = draft.missing_segments && draft.missing_segments.length > 0;
  const hasRecommendations = draft.recommendations && draft.recommendations.length > 0;

  const hasNoIssues = !hasOverlaps && !hasTooBroad && !hasTooNarrow && !hasMissing && !hasRecommendations;

  return (
    <div className="space-y-6">
      {/* Progress Card */}
      {approvalStatus.total > 0 && (
        <DraftCard>
          <div className="p-5">
            <h3 className="font-semibold text-slate-900 mb-4">Review Progress</h3>
            <DecisionProgress
              total={approvalStatus.total}
              pending={statusCounts.pending}
              applied={statusCounts.applied}
              edited={statusCounts.edited}
              dismissed={statusCounts.dismissed}
            />
            {approvalStatus.canApprove ? (
              <p className="mt-4 text-sm text-emerald-600 font-medium">
                All findings reviewed. You can now approve and continue.
              </p>
            ) : (
              <p className="mt-4 text-sm text-slate-500">
                Review all {approvalStatus.pending} remaining finding
                {approvalStatus.pending > 1 ? "s" : ""} to enable approval.
              </p>
            )}
          </div>
        </DraftCard>
      )}

      {/* Summary Banner */}
      <div className={cn(
        "p-6 rounded-2xl border",
        hasNoIssues
          ? "bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200"
          : "bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200"
      )}>
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2 rounded-lg",
            hasNoIssues ? "bg-emerald-100" : "bg-amber-100"
          )}>
            {hasNoIssues ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            )}
          </div>
          <div>
            <h3 className={cn(
              "font-semibold",
              hasNoIssues ? "text-emerald-900" : "text-amber-900"
            )}>
              {hasNoIssues
                ? "Segments Look Well-Balanced"
                : "Potential Improvements Identified"}
            </h3>
            <p className={cn(
              "text-sm",
              hasNoIssues ? "text-emerald-600" : "text-amber-600"
            )}>
              {hasNoIssues
                ? "No significant issues found with the current segments"
                : "Review each finding below and decide: Apply, Edit, or Dismiss"}
            </p>
          </div>
        </div>
      </div>

      {/* Overlaps */}
      {hasOverlaps && (
        <DraftCard>
          <DraftSection
            title={`Segment Overlaps (${draft.segment_overlaps?.length})`}
            icon={<Layers className="w-5 h-5" />}
            color="orange"
          >
            <p className="text-sm text-slate-500 mb-4">
              These segments may have overlapping characteristics
            </p>
            <div className="space-y-4">
              {draft.segment_overlaps?.map((overlap, index) => {
                const id = `overlap-${index}`;
                const decision = decisions[id];
                const description = `**Overlapping Segments:** #${overlap.segments.join(", #")}\n\n**Issue:** ${overlap.overlap_description}\n\n**Recommendation:** ${overlap.recommendation}`;

                return (
                  <RecommendationCard
                    key={id}
                    id={id}
                    title={`Overlap: Segments #${overlap.segments.join(" & #")}`}
                    category="Segment Overlap"
                    description={description}
                    status={(decision?.status as RecommendationStatus) || "pending"}
                    editedText={decision?.editedText}
                    onApply={(id) => onApply(id, description)}
                    onEdit={(id, newText) => onEditDecision(id, description, newText)}
                    onDismiss={(id) => onDismiss(id, description)}
                    onReset={onReset}
                  />
                );
              })}
            </div>
          </DraftSection>
        </DraftCard>
      )}

      {/* Too Broad */}
      {hasTooBroad && (
        <DraftCard>
          <DraftSection
            title={`Segments Too Broad (${draft.too_broad?.length})`}
            icon={<Maximize className="w-5 h-5" />}
            color="rose"
          >
            <p className="text-sm text-slate-500 mb-4">
              These segments might be too broad and could benefit from refinement
            </p>
            <div className="space-y-4">
              {draft.too_broad?.map((item, index) => {
                const id = `broad-${index}`;
                const decision = decisions[id];
                const description = `**Segment:** #${item.segment}\n\n**Issue:** ${item.issue}\n\n**Recommendation:** ${item.recommendation}`;

                return (
                  <RecommendationCard
                    key={id}
                    id={id}
                    title={`Segment #${item.segment} Too Broad`}
                    category="Too Broad"
                    description={description}
                    status={(decision?.status as RecommendationStatus) || "pending"}
                    editedText={decision?.editedText}
                    onApply={(id) => onApply(id, description)}
                    onEdit={(id, newText) => onEditDecision(id, description, newText)}
                    onDismiss={(id) => onDismiss(id, description)}
                    onReset={onReset}
                  />
                );
              })}
            </div>
          </DraftSection>
        </DraftCard>
      )}

      {/* Too Narrow */}
      {hasTooNarrow && (
        <DraftCard>
          <DraftSection
            title={`Segments Too Narrow (${draft.too_narrow?.length})`}
            icon={<Minimize className="w-5 h-5" />}
            color="blue"
          >
            <p className="text-sm text-slate-500 mb-4">
              These segments might be too narrow and could be expanded
            </p>
            <div className="space-y-4">
              {draft.too_narrow?.map((item, index) => {
                const id = `narrow-${index}`;
                const decision = decisions[id];
                const description = `**Segment:** #${item.segment}\n\n**Issue:** ${item.issue}\n\n**Recommendation:** ${item.recommendation}`;

                return (
                  <RecommendationCard
                    key={id}
                    id={id}
                    title={`Segment #${item.segment} Too Narrow`}
                    category="Too Narrow"
                    description={description}
                    status={(decision?.status as RecommendationStatus) || "pending"}
                    editedText={decision?.editedText}
                    onApply={(id) => onApply(id, description)}
                    onEdit={(id, newText) => onEditDecision(id, description, newText)}
                    onDismiss={(id) => onDismiss(id, description)}
                    onReset={onReset}
                  />
                );
              })}
            </div>
          </DraftSection>
        </DraftCard>
      )}

      {/* Missing Segments */}
      {hasMissing && (
        <DraftCard>
          <DraftSection
            title={`Potentially Missing Segments (${draft.missing_segments?.length})`}
            icon={<Plus className="w-5 h-5" />}
            color="emerald"
          >
            <p className="text-sm text-slate-500 mb-4">
              Consider adding these segments to your analysis
            </p>
            <div className="space-y-4">
              {draft.missing_segments?.map((item, index) => {
                const id = `missing-${index}`;
                const decision = decisions[id];
                const description = `**Suggested Segment:** ${item.suggested_name}\n\n**Description:** ${item.description}\n\n**Reasoning:** ${item.reasoning}`;

                return (
                  <RecommendationCard
                    key={id}
                    id={id}
                    title={item.suggested_name}
                    category="Missing Segment"
                    description={description}
                    status={(decision?.status as RecommendationStatus) || "pending"}
                    editedText={decision?.editedText}
                    onApply={(id) => onApply(id, description)}
                    onEdit={(id, newText) => onEditDecision(id, description, newText)}
                    onDismiss={(id) => onDismiss(id, description)}
                    onReset={onReset}
                  />
                );
              })}
            </div>
          </DraftSection>
        </DraftCard>
      )}

      {/* General Recommendations */}
      {hasRecommendations && (
        <DraftCard>
          <DraftSection
            title={`General Recommendations (${draft.recommendations?.length})`}
            icon={<CheckCircle2 className="w-5 h-5" />}
            color="purple"
          >
            <div className="space-y-4">
              {draft.recommendations?.map((rec, index) => {
                const id = `rec-${index}`;
                const decision = decisions[id];

                return (
                  <RecommendationCard
                    key={id}
                    id={id}
                    title={`Recommendation #${index + 1}`}
                    category="General"
                    description={rec}
                    status={(decision?.status as RecommendationStatus) || "pending"}
                    editedText={decision?.editedText}
                    onApply={(id) => onApply(id, rec)}
                    onEdit={(id, newText) => onEditDecision(id, rec, newText)}
                    onDismiss={(id) => onDismiss(id, rec)}
                    onReset={onReset}
                  />
                );
              })}
            </div>
          </DraftSection>
        </DraftCard>
      )}

      {/* No Issues State */}
      {hasNoIssues && (
        <DraftCard>
          <div className="p-8 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
            <h3 className="font-semibold text-slate-900 mb-2">Segments Look Great!</h3>
            <p className="text-slate-500">
              No significant issues found. You can approve and continue to segment details.
            </p>
          </div>
        </DraftCard>
      )}
    </div>
  );
}
