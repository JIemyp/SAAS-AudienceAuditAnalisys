"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { useTranslation } from "@/lib/hooks/useTranslation";
import {
  Loader2,
  Sparkles,
  Check,
  AlertCircle,
  RefreshCw,
  ChevronRight,
  Pencil,
  X,
  Plus,
  Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";

// =====================================================
// Types
// =====================================================

export interface GenerationPageProps<T> {
  projectId: string;
  title: string;
  description: string;
  generateEndpoint: string;
  approveEndpoint: string;
  draftTable: string;
  nextStepUrl: string;
  renderDraft: (draft: T, onEdit: (updates: Partial<T>) => void) => React.ReactNode;
  emptyStateMessage?: string;
  icon?: React.ReactNode;
  // Optional callback to check if approve is allowed (e.g., all recommendations reviewed)
  canApprove?: boolean;
  // Optional message when approve is blocked
  approveBlockedMessage?: string;
  // Optional pending count for UI feedback
  pendingDecisionsCount?: number;
  // Optional decisions object to pass to approve endpoint
  decisions?: Record<string, unknown>;
  // Optional: approved data table name (to fetch and show approved data for editing)
  approvedTable?: string;
  // Optional: validation function to check for empty fields before approve
  validateDraft?: (draft: T) => { isValid: boolean; emptyFields: string[] };
}

// =====================================================
// Main Component
// =====================================================

export function GenerationPage<T extends { id: string }>({
  projectId,
  title,
  description,
  generateEndpoint,
  approveEndpoint,
  draftTable,
  nextStepUrl,
  renderDraft,
  emptyStateMessage = "No draft generated yet",
  icon,
  canApprove = true,
  approveBlockedMessage,
  pendingDecisionsCount,
  decisions,
  approvedTable,
  validateDraft,
}: GenerationPageProps<T>) {
  const router = useRouter();
  const [drafts, setDrafts] = useState<T[]>([]);
  const [approvedData, setApprovedData] = useState<T[]>([]);
  const [isEditingApproved, setIsEditingApproved] = useState(false);
  const [selectedDraftId, setSelectedDraftId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editedDraft, setEditedDraft] = useState<Partial<T> | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Language translation
  const { language, setLanguage } = useLanguage();
  const { translatedContent, isTranslating, error: translationError } = useTranslation({
    content: drafts,
    language,
    enabled: drafts.length > 0,
  });

  // Debug translation
  console.log('[GenerationPage] Translation debug:', {
    language,
    draftsCount: drafts.length,
    hasTranslatedContent: !!translatedContent,
    isTranslating,
    translationError,
  });

  // Use translated drafts if available
  const displayDrafts = (translatedContent as T[]) || drafts;

  const selectedDraft = displayDrafts.find(d => d.id === selectedDraftId);

  // Fetch existing drafts and approved data
  useEffect(() => {
    fetchDrafts();
    if (approvedTable) {
      fetchApprovedData();
    }
  }, [projectId, draftTable, approvedTable]);

  const fetchApprovedData = async () => {
    if (!approvedTable) return;
    try {
      const res = await fetch(`/api/drafts?projectId=${projectId}&table=${approvedTable}`);
      const data = await res.json();
      if (data.success && data.drafts) {
        setApprovedData(data.drafts);
      }
    } catch (err) {
      console.error("Failed to fetch approved data:", err);
    }
  };

  const fetchDrafts = async (forceSelectFirst = false) => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/drafts?projectId=${projectId}&table=${draftTable}`);
      const data = await res.json();

      if (data.success && data.drafts) {
        setDrafts(data.drafts);
        if (data.drafts.length > 0) {
          // Always select first if forceSelectFirst, or if no draft is selected,
          // or if currently selected draft no longer exists
          const currentDraftExists = data.drafts.some((d: { id: string }) => d.id === selectedDraftId);
          if (forceSelectFirst || !selectedDraftId || !currentDraftExists) {
            setSelectedDraftId(data.drafts[0].id);
          }
        } else {
          setSelectedDraftId(null);
        }
      }
    } catch (err) {
      console.error("Failed to fetch drafts:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      setError(null);

      const res = await fetch(generateEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Generation failed");
      }

      // After generation, always refetch drafts from server to get fresh data
      // This handles both single draft (data.draft) and multiple drafts (data.drafts) cases
      // and ensures we don't have duplicates after regeneration
      // forceSelectFirst=true ensures the first draft is selected after regeneration
      await fetchDrafts(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerate = async () => {
    await handleGenerate();
  };

  const handleApprove = async () => {
    if (!selectedDraftId && drafts.length === 0) return;

    // Validate drafts before approve if validation function provided
    if (validateDraft) {
      const allErrors: string[] = [];
      for (const draft of drafts) {
        const result = validateDraft(draft);
        if (!result.isValid) {
          allErrors.push(...result.emptyFields);
        }
      }
      if (allErrors.length > 0) {
        setValidationErrors(allErrors);
        setError(`Cannot approve: ${allErrors.length} empty field(s) found. Please fill them first.`);
        return;
      }
    }
    setValidationErrors([]);

    try {
      setIsApproving(true);
      setError(null);

      // Save any pending edits first
      if (editedDraft) {
        await handleSaveEdit();
      }

      // Send both draftId (single) and draftIds (array) for compatibility
      // Some endpoints expect draftId (single draft), others expect draftIds (multiple drafts)
      const allDraftIds = drafts.map(d => d.id);

      const res = await fetch(approveEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          draftId: selectedDraftId,
          draftIds: allDraftIds,
          decisions
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Approval failed");
      }

      // Navigate to next step
      router.push(`/projects/${projectId}${nextStepUrl}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Approval failed");
    } finally {
      setIsApproving(false);
    }
  };

  const handleEdit = (updates: Partial<T>) => {
    setEditedDraft(prev => ({ ...prev, ...updates }));
  };

  const handleSaveEdit = async () => {
    if (!selectedDraftId || !editedDraft) return;

    try {
      const res = await fetch("/api/drafts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          table: draftTable,
          id: selectedDraftId,
          updates: editedDraft,
        }),
      });

      const data = await res.json();

      if (data.success && data.draft) {
        setDrafts(prev => prev.map(d => d.id === selectedDraftId ? data.draft : d));
        setEditedDraft(null);
      }
    } catch (err) {
      console.error("Failed to save edit:", err);
    }
  };

  const handleDeleteDraft = async (draftId: string) => {
    try {
      const res = await fetch(`/api/drafts?table=${draftTable}&id=${draftId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setDrafts(prev => prev.filter(d => d.id !== draftId));
        if (selectedDraftId === draftId) {
          setSelectedDraftId(drafts[0]?.id || null);
        }
      }
    } catch (err) {
      console.error("Failed to delete draft:", err);
    }
  };

  // Get merged draft with edits
  const currentDraft = selectedDraft
    ? { ...selectedDraft, ...editedDraft } as T
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between"
      >
        <div className="flex items-start gap-4">
          {icon && (
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl text-white shadow-lg shadow-blue-500/20">
              {icon}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {title}
            </h1>
            <p className="mt-1 text-slate-500 max-w-xl">
              {description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Language Toggle */}
          <LanguageToggle
            currentLanguage={language}
            onLanguageChange={setLanguage}
            isLoading={isTranslating}
          />

          {drafts.length > 0 && (
            <Button
              variant="outline"
              onClick={handleRegenerate}
              disabled={isGenerating}
              className="gap-2"
            >
              <RefreshCw className={cn("w-4 h-4", isGenerating && "animate-spin")} />
              Regenerate
            </Button>
          )}
          <div className="relative group">
            <Button
              onClick={drafts.length === 0 ? handleGenerate : handleApprove}
              disabled={isGenerating || isApproving || (drafts.length > 0 && !selectedDraftId) || (drafts.length > 0 && !canApprove)}
              isLoading={isGenerating || isApproving}
              className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              {drafts.length === 0 ? (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Approve & Continue
                  {pendingDecisionsCount !== undefined && pendingDecisionsCount > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 text-xs bg-warning/20 text-warning rounded-full">
                      {pendingDecisionsCount}
                    </span>
                  )}
                </>
              )}
            </Button>
            {/* Tooltip when approve is blocked */}
            {drafts.length > 0 && !canApprove && approveBlockedMessage && (
              <div className="absolute bottom-full mb-2 right-0 w-64 p-2 bg-slate-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                {approveBlockedMessage}
                <div className="absolute bottom-0 right-4 translate-y-1/2 rotate-45 w-2 h-2 bg-slate-900" />
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="flex-1">{error}</span>
              <button onClick={() => { setError(null); setValidationErrors([]); }} className="p-1 hover:bg-red-100 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>
            {validationErrors.length > 0 && (
              <div className="mt-3 pl-8">
                <p className="text-sm font-medium mb-2">Empty fields:</p>
                <ul className="text-sm space-y-1">
                  {validationErrors.slice(0, 5).map((field, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                      {field}
                    </li>
                  ))}
                  {validationErrors.length > 5 && (
                    <li className="text-red-500">...and {validationErrors.length - 5} more</li>
                  )}
                </ul>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Editing Approved Data Banner */}
      {isEditingApproved && approvedData.length > 0 && drafts.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700"
        >
          <Check className="w-5 h-5 flex-shrink-0" />
          <span className="flex-1">This step is already completed. You can view and regenerate the data if needed.</span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRegenerate}
            disabled={isGenerating}
            className="gap-2 border-emerald-300 text-emerald-700 hover:bg-emerald-100"
          >
            <RefreshCw className={cn("w-4 h-4", isGenerating && "animate-spin")} />
            Regenerate
          </Button>
        </motion.div>
      )}

      {/* Draft Version Selector */}
      {drafts.length > 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 p-3 bg-slate-100 rounded-xl"
        >
          <span className="text-sm text-slate-500 font-medium">Versions:</span>
          <div className="flex gap-2">
            {drafts.map((draft, index) => (
              <button
                key={draft.id}
                onClick={() => setSelectedDraftId(draft.id)}
                className={cn(
                  "px-3 py-1.5 text-sm rounded-lg transition-all",
                  selectedDraftId === draft.id
                    ? "bg-white text-slate-900 shadow-sm font-medium"
                    : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
                )}
              >
                v{drafts.length - index}
              </button>
            ))}
          </div>
          {selectedDraftId && drafts.length > 1 && (
            <button
              onClick={() => handleDeleteDraft(selectedDraftId)}
              className="ml-auto p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </motion.div>
      )}

      {/* Main Content */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center py-24"
          >
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </motion.div>
        ) : isGenerating ? (
          <GeneratingState key="generating" />
        ) : currentDraft ? (
          <motion.div
            key="draft"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {renderDraft(currentDraft, handleEdit)}
          </motion.div>
        ) : isEditingApproved && approvedData.length > 0 ? (
          /* Show approved data for viewing/editing */
          <motion.div
            key="approved"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {approvedData.map((item, index) => (
              <div key={item.id || index}>
                {renderDraft(item, () => {})}
              </div>
            ))}
          </motion.div>
        ) : (
          <EmptyState
            key="empty"
            message={emptyStateMessage}
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
          />
        )}
      </AnimatePresence>

      {/* Save Edits Button */}
      <AnimatePresence>
        {editedDraft && Object.keys(editedDraft).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-xl shadow-xl"
          >
            <span className="text-sm text-slate-600">You have unsaved changes</span>
            <Button variant="outline" size="sm" onClick={() => setEditedDraft(null)}>
              Discard
            </Button>
            <Button size="sm" onClick={handleSaveEdit}>
              Save Changes
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// =====================================================
// Sub Components
// =====================================================

function GeneratingState() {
  const steps = [
    "Sending request to AI...",
    "Analyzing your input data...",
    "Building comprehensive profile...",
    "Generating insights...",
    "Finalizing output...",
  ];
  const [currentStep, setCurrentStep] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Progress through steps linearly (not cycling)
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep(prev => {
        // Stop at last step, don't cycle
        if (prev < steps.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [steps.length]);

  // Timer to show elapsed time
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="flex flex-col items-center justify-center py-24"
    >
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full blur-xl opacity-30 animate-pulse" />
        <div className="relative w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-white animate-pulse" />
        </div>
      </div>

      <h3 className="mt-8 text-xl font-semibold text-slate-900">
        Generating with AI
      </h3>

      <AnimatePresence mode="wait">
        <motion.p
          key={currentStep}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="mt-2 text-slate-500"
        >
          {steps[currentStep]}
        </motion.p>
      </AnimatePresence>

      {/* Progress bar */}
      <div className="mt-6 w-64">
        <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500"
            initial={{ width: "0%" }}
            animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-slate-400">
          <span>Step {currentStep + 1} of {steps.length}</span>
          <span>{formatTime(elapsedTime)}</span>
        </div>
      </div>

      {/* Step indicators */}
      <div className="mt-4 flex gap-1.5">
        {steps.map((_, index) => (
          <div
            key={index}
            className={cn(
              "w-2 h-2 rounded-full transition-colors duration-300",
              index < currentStep
                ? "bg-emerald-500"
                : index === currentStep
                ? "bg-blue-500"
                : "bg-slate-200"
            )}
          />
        ))}
      </div>
    </motion.div>
  );
}

function EmptyState({
  message,
  onGenerate,
  isGenerating,
}: {
  message: string;
  onGenerate: () => void;
  isGenerating: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Card className="border-2 border-dashed border-slate-200 bg-slate-50/50">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-6">
            <Sparkles className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            Ready to Generate
          </h3>
          <p className="text-slate-500 text-center max-w-md mb-6">
            {message}
          </p>
          <Button
            onClick={onGenerate}
            disabled={isGenerating}
            isLoading={isGenerating}
            className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            <Sparkles className="w-4 h-4" />
            Generate Now
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// =====================================================
// Reusable Draft Display Components
// =====================================================

export function DraftCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      {children}
    </Card>
  );
}

export function DraftSection({
  title,
  icon,
  children,
  className,
  onEdit,
  color = "blue",
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  onEdit?: () => void;
  color?: "blue" | "purple" | "emerald" | "orange" | "rose";
}) {
  const colorClasses = {
    blue: "bg-blue-500/10 text-blue-600 border-l-blue-500",
    purple: "bg-purple-500/10 text-purple-600 border-l-purple-500",
    emerald: "bg-emerald-500/10 text-emerald-600 border-l-emerald-500",
    orange: "bg-orange-500/10 text-orange-600 border-l-orange-500",
    rose: "bg-rose-500/10 text-rose-600 border-l-rose-500",
  };

  return (
    <div className={cn("border-l-4", colorClasses[color].split(" ")[2], className)}>
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {icon && (
              <div className={cn("p-2 rounded-lg", colorClasses[color].split(" ").slice(0, 2).join(" "))}>
                {icon}
              </div>
            )}
            <h3 className="font-semibold text-slate-900">{title}</h3>
          </div>
          {onEdit && (
            <button
              onClick={onEdit}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Pencil className="w-4 h-4" />
            </button>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}

export function DraftField({
  label,
  value,
  editable = false,
  onEdit,
  type = "text",
}: {
  label: string;
  value: string | string[] | boolean;
  editable?: boolean;
  onEdit?: (value: string) => void;
  type?: "text" | "textarea" | "list" | "boolean";
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(value));

  const handleSave = () => {
    onEdit?.(editValue);
    setIsEditing(false);
  };

  if (type === "boolean") {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-500">{label}:</span>
        <span className={cn(
          "px-2 py-0.5 text-xs font-medium rounded-full",
          value ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
        )}>
          {value ? "Yes" : "No"}
        </span>
      </div>
    );
  }

  if (type === "list" && Array.isArray(value)) {
    return (
      <div>
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
          {label}
        </span>
        <ul className="mt-2 space-y-1.5">
          {value.map((item, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-slate-700">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-2 flex-shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div>
      <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
        {label}
      </span>
      {isEditing ? (
        <div className="mt-2 space-y-2">
          {type === "textarea" ? (
            <textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="w-full p-3 border border-slate-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              rows={4}
            />
          ) : (
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          )}
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave}>Save</Button>
            <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
          </div>
        </div>
      ) : (
        <p
          className={cn(
            "mt-1 text-sm text-slate-700 leading-relaxed",
            editable && "cursor-pointer hover:bg-slate-50 p-2 -m-2 rounded-lg transition-colors"
          )}
          onClick={() => editable && setIsEditing(true)}
        >
          {String(value)}
        </p>
      )}
    </div>
  );
}

export function DraftList({
  items,
  renderItem,
  onAdd,
  onRemove,
  addLabel = "Add Item",
}: {
  items: unknown[];
  renderItem: (item: unknown, index: number) => React.ReactNode;
  onAdd?: () => void;
  onRemove?: (index: number) => void;
  addLabel?: string;
}) {
  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={index} className="group relative">
          {renderItem(item, index)}
          {onRemove && (
            <button
              onClick={() => onRemove(index)}
              className="absolute -right-2 -top-2 p-1 bg-white border border-slate-200 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-50 hover:border-red-200 hover:text-red-500"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      ))}
      {onAdd && (
        <button
          onClick={onAdd}
          className="flex items-center gap-2 w-full p-3 border-2 border-dashed border-slate-200 rounded-lg text-slate-500 hover:border-blue-300 hover:text-blue-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm font-medium">{addLabel}</span>
        </button>
      )}
    </div>
  );
}
