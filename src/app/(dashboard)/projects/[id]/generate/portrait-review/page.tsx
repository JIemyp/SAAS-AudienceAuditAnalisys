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
import { PortraitReviewDraft } from "@/types";
import { Search, ArrowRight, Plus, Minus, AlertTriangle } from "lucide-react";

export default function PortraitReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = use(params);

  // State for tracking decisions across all recommendations
  const [decisions, setDecisions] = useState<Record<string, RecommendationDecision>>({});
  // Use ref to track current draft without causing re-renders
  const currentDraftRef = useRef<PortraitReviewDraft | null>(null);
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

  // Calculate approval status based on draft and decisions
  const calculateApprovalStatus = useCallback(
    (draft: PortraitReviewDraft | null) => {
      if (!draft) return { canApprove: true, pending: 0, total: 0 };

      const changes = draft.what_to_change || [];
      const additions = draft.what_to_add || [];
      const removals = draft.what_to_remove || [];
      const total = changes.length + additions.length + removals.length;

      if (total === 0) return { canApprove: true, pending: 0, total: 0 };

      let pending = 0;

      changes.forEach((_, i) => {
        const id = `change-${i}`;
        if (!decisions[id]) pending++;
      });

      additions.forEach((_, i) => {
        const id = `addition-${i}`;
        if (!decisions[id]) pending++;
      });

      removals.forEach((_, i) => {
        const id = `removal-${i}`;
        if (!decisions[id]) pending++;
      });

      return {
        canApprove: pending === 0,
        pending,
        total,
      };
    },
    [decisions]
  );

  // Count by status
  const calculateStatusCounts = useCallback(
    (draft: PortraitReviewDraft | null) => {
      if (!draft) return { applied: 0, edited: 0, dismissed: 0, pending: 0 };

      const allIds: string[] = [];
      (draft.what_to_change || []).forEach((_, i) => allIds.push(`change-${i}`));
      (draft.what_to_add || []).forEach((_, i) => allIds.push(`addition-${i}`));
      (draft.what_to_remove || []).forEach((_, i) => allIds.push(`removal-${i}`));

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
    [decisions]
  );

  // Memoized approval status based on current draft ref
  const approvalStatus = useMemo(() => {
    return calculateApprovalStatus(currentDraftRef.current);
  }, [calculateApprovalStatus, decisions]);

  return (
    <GenerationPage<PortraitReviewDraft>
      projectId={projectId}
      title="Portrait Self-Review"
      description="AI critically reviews the generated portrait and suggests improvements. Review each recommendation and decide whether to apply, edit, or dismiss it."
      generateEndpoint="/api/generate/portrait-review"
      approveEndpoint="/api/approve/portrait-review"
      draftTable="portrait_review_drafts"
      nextStepUrl="/generate/portrait-final"
      icon={<Search className="w-6 h-6" />}
      emptyStateMessage="Let AI review the portrait it generated and suggest improvements, additions, and removals."
      canApprove={approvalStatus.canApprove}
      approveBlockedMessage={`Review all ${approvalStatus.pending} remaining recommendation${approvalStatus.pending > 1 ? "s" : ""} before approving`}
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
          <PortraitReviewDraftView
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

interface PortraitReviewDraftViewProps {
  draft: PortraitReviewDraft;
  decisions: Record<string, RecommendationDecision>;
  onApply: (id: string, originalText: string) => void;
  onEditDecision: (id: string, originalText: string, newText: string) => void;
  onDismiss: (id: string, originalText: string) => void;
  onReset: (id: string) => void;
  approvalStatus: { canApprove: boolean; pending: number; total: number };
  statusCounts: { applied: number; edited: number; dismissed: number; pending: number };
}

function PortraitReviewDraftView({
  draft,
  decisions,
  onApply,
  onEditDecision,
  onDismiss,
  onReset,
  approvalStatus,
  statusCounts,
}: PortraitReviewDraftViewProps) {
  const changes = draft.what_to_change || [];
  const additions = draft.what_to_add || [];
  const removals = draft.what_to_remove || [];

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
                All recommendations reviewed. You can now approve and continue.
              </p>
            ) : (
              <p className="mt-4 text-sm text-slate-500">
                Review all {approvalStatus.pending} remaining recommendation
                {approvalStatus.pending > 1 ? "s" : ""} to enable approval.
              </p>
            )}
          </div>
        </DraftCard>
      )}

      {/* Overall Assessment */}
      {draft.reasoning && (
        <DraftCard>
          <DraftSection
            title="Overall Assessment"
            icon={<AlertTriangle className="w-5 h-5" />}
            color="orange"
          >
            <p className="text-sm text-slate-700 leading-relaxed">{draft.reasoning}</p>
          </DraftSection>
        </DraftCard>
      )}

      {/* Changes Section */}
      {changes.length > 0 && (
        <DraftCard>
          <DraftSection
            title={`Suggested Changes (${changes.length})`}
            icon={<ArrowRight className="w-5 h-5" />}
            color="blue"
          >
            <div className="space-y-4">
              {changes.map((change, index) => {
                const id = `change-${index}`;
                const decision = decisions[id];
                const description = `**Current:** ${change.current}\n\n**Suggested:** ${change.suggested}\n\n**Reasoning:** ${change.reasoning}`;

                return (
                  <RecommendationCard
                    key={id}
                    id={id}
                    title={`Change #${index + 1}`}
                    category="Modification"
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

      {/* Additions Section */}
      {additions.length > 0 && (
        <DraftCard>
          <DraftSection
            title={`Suggested Additions (${additions.length})`}
            icon={<Plus className="w-5 h-5" />}
            color="emerald"
          >
            <div className="space-y-4">
              {additions.map((addition, index) => {
                const id = `addition-${index}`;
                const decision = decisions[id];
                const description = `**Add:** ${addition.addition}\n\n**Reasoning:** ${addition.reasoning}`;

                return (
                  <RecommendationCard
                    key={id}
                    id={id}
                    title={`Addition #${index + 1}`}
                    category="New Element"
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

      {/* Removals Section */}
      {removals.length > 0 && (
        <DraftCard>
          <DraftSection
            title={`Suggested Removals (${removals.length})`}
            icon={<Minus className="w-5 h-5" />}
            color="rose"
          >
            <div className="space-y-4">
              {removals.map((removal, index) => {
                const id = `removal-${index}`;
                const decision = decisions[id];
                const description = `**Remove:** ${removal.removal}\n\n**Reasoning:** ${removal.reasoning}`;

                return (
                  <RecommendationCard
                    key={id}
                    id={id}
                    title={`Removal #${index + 1}`}
                    category="To Remove"
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

      {/* Empty State */}
      {changes.length === 0 && additions.length === 0 && removals.length === 0 && (
        <DraftCard>
          <div className="p-8 text-center">
            <p className="text-slate-500">
              No recommendations generated. The portrait may already be well-optimized.
            </p>
          </div>
        </DraftCard>
      )}
    </div>
  );
}
