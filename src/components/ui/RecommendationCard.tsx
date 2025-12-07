"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Pencil, X, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";
import { Textarea } from "./Textarea";

export type RecommendationStatus = "pending" | "applied" | "edited" | "dismissed";

export interface RecommendationDecision {
  id: string;
  status: RecommendationStatus;
  originalText: string;
  editedText?: string;
}

interface RecommendationCardProps {
  id: string;
  title: string;
  description: string;
  category?: string;
  status: RecommendationStatus;
  editedText?: string;
  onApply: (id: string) => void;
  onEdit: (id: string, newText: string) => void;
  onDismiss: (id: string) => void;
  onReset?: (id: string) => void;
  className?: string;
}

export function RecommendationCard({
  id,
  title,
  description,
  category,
  status,
  editedText,
  onApply,
  onEdit,
  onDismiss,
  onReset,
  className,
}: RecommendationCardProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editValue, setEditValue] = React.useState(editedText || description);
  const [isExpanded, setIsExpanded] = React.useState(false);

  const handleApply = () => {
    onApply(id);
  };

  const handleDismiss = () => {
    onDismiss(id);
  };

  const handleEditSubmit = () => {
    if (editValue.trim() && editValue !== description) {
      onEdit(id, editValue.trim());
    } else {
      onApply(id);
    }
    setIsEditing(false);
  };

  const handleEditCancel = () => {
    setEditValue(editedText || description);
    setIsEditing(false);
  };

  const handleReset = () => {
    if (onReset) {
      onReset(id);
      setEditValue(description);
    }
  };

  const statusStyles: Record<RecommendationStatus, string> = {
    pending: "border-l-4 border-l-warning bg-warning/5",
    applied: "border-l-4 border-l-success bg-success/5",
    edited: "border-l-4 border-l-accent bg-accent/5",
    dismissed: "border-l-4 border-l-gray-400 bg-gray-50 opacity-60",
  };

  const statusBadge: Record<RecommendationStatus, { text: string; className: string }> = {
    pending: { text: "Pending", className: "bg-warning/20 text-warning" },
    applied: { text: "Applied", className: "bg-success/20 text-success" },
    edited: { text: "Edited & Applied", className: "bg-accent/20 text-accent" },
    dismissed: { text: "Dismissed", className: "bg-gray-200 text-gray-500" },
  };

  const isDecided = status !== "pending";
  const displayText = status === "edited" && editedText ? editedText : description;
  const isLongText = displayText.length > 200;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-lg border border-border bg-white shadow-sm transition-all",
        statusStyles[status],
        className
      )}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1">
            {category && (
              <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">
                {category}
              </span>
            )}
            <h4 className="font-medium text-text-primary">{title}</h4>
          </div>
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
              statusBadge[status].className
            )}
          >
            {statusBadge[status].text}
          </span>
        </div>

        {/* Description / Edit Mode */}
        <AnimatePresence mode="wait">
          {isEditing ? (
            <motion.div
              key="editing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              <Textarea
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="min-h-[120px] text-sm"
                placeholder="Edit the recommendation..."
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleEditSubmit}
                  className="gap-1"
                >
                  <Check className="h-3.5 w-3.5" />
                  Save & Apply
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleEditCancel}
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="display"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <p
                className={cn(
                  "text-sm text-text-secondary",
                  status === "dismissed" && "line-through",
                  !isExpanded && isLongText && "line-clamp-3"
                )}
              >
                {displayText}
              </p>

              {isLongText && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="mt-1 flex items-center gap-1 text-xs text-accent hover:text-accent-hover"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="h-3 w-3" />
                      Show less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3 w-3" />
                      Show more
                    </>
                  )}
                </button>
              )}

              {status === "edited" && editedText && editedText !== description && (
                <details className="mt-2">
                  <summary className="text-xs text-text-secondary cursor-pointer hover:text-text-primary">
                    View original
                  </summary>
                  <p className="mt-1 text-xs text-text-secondary italic pl-3 border-l-2 border-gray-200">
                    {description}
                  </p>
                </details>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Buttons */}
        {!isEditing && (
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/50">
            {!isDecided ? (
              <>
                <Button
                  size="sm"
                  onClick={handleApply}
                  className="gap-1.5"
                >
                  <Check className="h-3.5 w-3.5" />
                  Apply
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                  className="gap-1.5"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleDismiss}
                  className="gap-1.5 text-text-secondary hover:text-error"
                >
                  <X className="h-3.5 w-3.5" />
                  Dismiss
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleReset}
                className="text-text-secondary"
              >
                Undo decision
              </Button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Hook to manage recommendation decisions
export function useRecommendationDecisions(
  recommendations: Array<{ id: string; text: string }>
) {
  const [decisions, setDecisions] = React.useState<Record<string, RecommendationDecision>>(() => {
    const initial: Record<string, RecommendationDecision> = {};
    recommendations.forEach((rec) => {
      initial[rec.id] = {
        id: rec.id,
        status: "pending",
        originalText: rec.text,
      };
    });
    return initial;
  });

  const apply = React.useCallback((id: string) => {
    setDecisions((prev) => ({
      ...prev,
      [id]: { ...prev[id], status: "applied" },
    }));
  }, []);

  const edit = React.useCallback((id: string, newText: string) => {
    setDecisions((prev) => ({
      ...prev,
      [id]: { ...prev[id], status: "edited", editedText: newText },
    }));
  }, []);

  const dismiss = React.useCallback((id: string) => {
    setDecisions((prev) => ({
      ...prev,
      [id]: { ...prev[id], status: "dismissed" },
    }));
  }, []);

  const reset = React.useCallback((id: string) => {
    setDecisions((prev) => ({
      ...prev,
      [id]: { ...prev[id], status: "pending", editedText: undefined },
    }));
  }, []);

  const allDecided = React.useMemo(() => {
    return Object.values(decisions).every((d) => d.status !== "pending");
  }, [decisions]);

  const pendingCount = React.useMemo(() => {
    return Object.values(decisions).filter((d) => d.status === "pending").length;
  }, [decisions]);

  const appliedDecisions = React.useMemo(() => {
    return Object.values(decisions).filter(
      (d) => d.status === "applied" || d.status === "edited"
    );
  }, [decisions]);

  return {
    decisions,
    apply,
    edit,
    dismiss,
    reset,
    allDecided,
    pendingCount,
    appliedDecisions,
  };
}

// Summary component showing decision progress
interface DecisionProgressProps {
  total: number;
  pending: number;
  applied: number;
  edited: number;
  dismissed: number;
}

export function DecisionProgress({
  total,
  pending,
  applied,
  edited,
  dismissed,
}: DecisionProgressProps) {
  const decided = total - pending;
  const percentage = total > 0 ? (decided / total) * 100 : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-text-secondary">
          {decided} of {total} recommendations reviewed
        </span>
        <span className="font-medium">
          {percentage.toFixed(0)}%
        </span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-accent transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="flex gap-4 text-xs text-text-secondary">
        {pending > 0 && (
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-warning" />
            {pending} pending
          </span>
        )}
        {applied > 0 && (
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-success" />
            {applied} applied
          </span>
        )}
        {edited > 0 && (
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-accent" />
            {edited} edited
          </span>
        )}
        {dismissed > 0 && (
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-gray-400" />
            {dismissed} dismissed
          </span>
        )}
      </div>
    </div>
  );
}
