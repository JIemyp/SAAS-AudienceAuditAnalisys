"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { useTranslation } from "@/lib/hooks/useTranslation";
import {
  Crown,
  Users,
  ChevronDown,
  ChevronUp,
  User2,
  Pencil,
  Check,
  X,
  Sparkles,
  RefreshCw,
  Loader2,
  AlertCircle,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SegmentFinalDraft } from "@/types";

export default function SegmentsFinalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = use(params);
  const router = useRouter();

  const [segments, setSegments] = useState<SegmentFinalDraft[]>([]);
  const [expandedSegments, setExpandedSegments] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editedSegments, setEditedSegments] = useState<
    Record<string, Partial<SegmentFinalDraft>>
  >({});
  const [summary, setSummary] = useState<string>("");
  const [changesApplied, setChangesApplied] = useState<number>(0);

  // Language translation
  const { language, setLanguage } = useLanguage();
  const { translatedContent, isTranslating } = useTranslation({
    content: segments,
    language,
    enabled: segments.length > 0,
  });

  // Use translated segments if available
  const displaySegments = (translatedContent as SegmentFinalDraft[]) || segments;

  // Fetch segments
  useEffect(() => {
    fetchSegments();
  }, [projectId]);

  const fetchSegments = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(
        `/api/drafts?projectId=${projectId}&table=segments_final_drafts`
      );
      const data = await res.json();

      if (data.success && data.drafts) {
        const sorted = data.drafts.sort(
          (a: SegmentFinalDraft, b: SegmentFinalDraft) =>
            a.segment_index - b.segment_index
        );
        setSegments(sorted);
      }
    } catch (err) {
      console.error("Failed to fetch segments:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      setError(null);

      const res = await fetch("/api/generate/segments-final", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Generation failed");
      }

      if (data.summary) {
        setSummary(data.summary);
      }
      if (data.changes_applied !== undefined) {
        setChangesApplied(data.changes_applied);
      }

      // Refresh segments list
      await fetchSegments();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApprove = async () => {
    try {
      setIsApproving(true);
      setError(null);

      // Save any pending edits first
      await saveAllEdits();

      const res = await fetch("/api/approve/segments-final", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Approval failed");
      }

      // Navigate to next step
      router.push(`/projects/${projectId}/generate/segment-details`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Approval failed");
    } finally {
      setIsApproving(false);
    }
  };

  const saveAllEdits = async () => {
    const editPromises = Object.entries(editedSegments).map(
      async ([id, updates]) => {
        await fetch("/api/drafts", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            table: "segments_final_drafts",
            id,
            updates,
          }),
        });
      }
    );
    await Promise.all(editPromises);
    setEditedSegments({});
  };

  const handleEditSegment = (
    segmentId: string,
    updates: Partial<SegmentFinalDraft>
  ) => {
    setEditedSegments((prev) => ({
      ...prev,
      [segmentId]: { ...prev[segmentId], ...updates },
    }));

    // Also update local state for immediate UI feedback
    setSegments((prev) =>
      prev.map((s) => (s.id === segmentId ? { ...s, ...updates } : s))
    );
  };

  const toggleSegment = (segmentId: string) => {
    setExpandedSegments((prev) =>
      prev.includes(segmentId)
        ? prev.filter((id) => id !== segmentId)
        : [...prev, segmentId]
    );
  };

  const expandAll = () => {
    setExpandedSegments(segments.map((s) => s.id));
  };

  const collapseAll = () => {
    setExpandedSegments([]);
  };

  const hasUnsavedChanges = Object.keys(editedSegments).length > 0;

  // Count new vs modified segments
  const newSegmentsCount = segments.filter((s) => s.is_new).length;
  const modifiedSegmentsCount = segments.filter(
    (s) => !s.is_new && s.changes_applied && s.changes_applied.length > 0
  ).length;

  return (
    <div className="space-y-6">
      {/* Header - Title and Description */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start gap-4"
      >
        <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl text-white shadow-lg shadow-amber-500/20">
          <Crown className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Final Segments
          </h1>
          <p className="mt-1 text-slate-500 max-w-xl">
            The refined segments incorporating approved changes from the
            self-review process.
          </p>
        </div>
      </motion.div>

      {/* Action Buttons Row */}
      <div className="flex items-center justify-between">
        <LanguageToggle
          currentLanguage={language}
          onLanguageChange={setLanguage}
          isLoading={isTranslating}
        />

        <div className="flex items-center gap-3">
          {segments.length > 0 && (
            <Button
              variant="outline"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="gap-2"
            >
              <RefreshCw
                className={cn("w-4 h-4", isGenerating && "animate-spin")}
              />
              Regenerate
            </Button>
          )}
          <Button
            onClick={segments.length === 0 ? handleGenerate : handleApprove}
            disabled={
              isGenerating || isApproving || (segments.length > 0 && segments.length < 3)
            }
            isLoading={isGenerating || isApproving}
            className="gap-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
          >
            {segments.length === 0 ? (
              <>
                <Sparkles className="w-4 h-4" />
                Generate Final Segments
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Approve & Continue
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="flex-1">{error}</span>
            <button
              onClick={() => setError(null)}
              className="p-1 hover:bg-red-100 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

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
            <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
          </motion.div>
        ) : isGenerating ? (
          <GeneratingState key="generating" />
        ) : segments.length > 0 ? (
          <motion.div
            key="segments"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Summary Header */}
            <div className="p-6 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <Crown className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-amber-900">
                      {segments.length} Final Segments
                    </h3>
                    <p className="text-sm text-amber-700">
                      {newSegmentsCount > 0 && (
                        <span className="inline-flex items-center gap-1 mr-3">
                          <Plus className="w-3 h-3" />
                          {newSegmentsCount} new
                        </span>
                      )}
                      {modifiedSegmentsCount > 0 && (
                        <span className="inline-flex items-center gap-1">
                          <Pencil className="w-3 h-3" />
                          {modifiedSegmentsCount} modified
                        </span>
                      )}
                      {newSegmentsCount === 0 && modifiedSegmentsCount === 0 && (
                        <span>No changes applied</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={expandAll}
                    className="px-3 py-1.5 text-xs font-medium text-amber-600 hover:bg-amber-100 rounded-lg transition-colors"
                  >
                    Expand All
                  </button>
                  <button
                    onClick={collapseAll}
                    className="px-3 py-1.5 text-xs font-medium text-amber-600 hover:bg-amber-100 rounded-lg transition-colors"
                  >
                    Collapse All
                  </button>
                </div>
              </div>

              {summary && (
                <p className="mt-3 text-sm text-amber-800 border-t border-amber-200 pt-3">
                  {summary}
                </p>
              )}
            </div>

            {/* Segments List */}
            <div className="space-y-4">
              {displaySegments.map((segment, index) => (
                <SegmentFinalCard
                  key={segment.id}
                  segment={segment}
                  index={index}
                  isExpanded={expandedSegments.includes(segment.id)}
                  onToggle={() => toggleSegment(segment.id)}
                  onEdit={(updates) => handleEditSegment(segment.id, updates)}
                />
              ))}
            </div>
          </motion.div>
        ) : (
          <EmptyState
            key="empty"
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
          />
        )}
      </AnimatePresence>

      {/* Unsaved Changes Banner */}
      <AnimatePresence>
        {hasUnsavedChanges && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-xl shadow-xl"
          >
            <span className="text-sm text-slate-600">
              You have unsaved changes
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditedSegments({})}
            >
              Discard
            </Button>
            <Button size="sm" onClick={saveAllEdits}>
              Save Changes
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// =====================================================
// Segment Final Card Component
// =====================================================

function SegmentFinalCard({
  segment,
  index,
  isExpanded,
  onToggle,
  onEdit,
}: {
  segment: SegmentFinalDraft;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: (updates: Partial<SegmentFinalDraft>) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(segment.name);
  const [description, setDescription] = useState(segment.description);
  const [sociodemographics, setSociodemographics] = useState(
    segment.sociodemographics
  );

  const colors = [
    "from-blue-500 to-indigo-500",
    "from-purple-500 to-pink-500",
    "from-emerald-500 to-teal-500",
    "from-orange-500 to-amber-500",
    "from-rose-500 to-pink-500",
    "from-cyan-500 to-blue-500",
    "from-violet-500 to-purple-500",
    "from-lime-500 to-green-500",
    "from-fuchsia-500 to-pink-500",
    "from-sky-500 to-indigo-500",
  ];

  const gradientColor = colors[index % colors.length];

  const handleSave = () => {
    onEdit({ name, description, sociodemographics });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setName(segment.name);
    setDescription(segment.description);
    setSociodemographics(segment.sociodemographics);
    setIsEditing(false);
  };

  // Sync local state when segment changes
  useEffect(() => {
    setName(segment.name);
    setDescription(segment.description);
    setSociodemographics(segment.sociodemographics);
  }, [segment]);

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="w-full p-5 flex items-center justify-between hover:bg-slate-50 transition-colors">
        <div
          className="flex items-center gap-4 flex-1 cursor-pointer"
          onClick={onToggle}
        >
          <div
            className={cn(
              "relative w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg bg-gradient-to-br",
              gradientColor
            )}
          >
            {segment.is_new && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
                <Plus className="w-3 h-3 text-white" />
              </div>
            )}
            {index + 1}
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-900">{segment.name}</h3>
              {segment.is_new && (
                <span className="px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-700 rounded-full">
                  NEW
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500 line-clamp-1">
              {segment.description?.substring(0, 100)}...
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
            <button
              onClick={() => setIsEditing(true)}
              className="p-1.5 bg-white text-slate-500 rounded-lg hover:bg-slate-100 hover:text-blue-600 shadow-sm border"
            >
              <Pencil className="w-4 h-4" />
            </button>
          </div>
          <div
            onClick={onToggle}
            className={cn(
              "p-2 rounded-lg transition-colors cursor-pointer",
              isExpanded ? "bg-slate-100" : "hover:bg-slate-100"
            )}
          >
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-slate-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-500" />
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-5 pb-5 pt-0 border-t border-slate-100">
              {isEditing ? (
                <div className="pt-5 space-y-4">
                  <div>
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full mt-1 p-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Description
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full mt-1 p-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      rows={4}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Sociodemographics
                    </label>
                    <textarea
                      value={sociodemographics}
                      onChange={(e) => setSociodemographics(e.target.value)}
                      className="w-full mt-1 p-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSave}
                      className="flex items-center gap-1 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 text-sm"
                    >
                      <Check className="w-4 h-4" /> Save
                    </button>
                    <button
                      onClick={handleCancel}
                      className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 text-sm"
                    >
                      <X className="w-4 h-4" /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="pt-5 space-y-4">
                  {/* Changes Applied */}
                  {segment.changes_applied &&
                    segment.changes_applied.length > 0 && (
                      <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl">
                        <div className="flex items-center gap-2 mb-2">
                          <Check className="w-4 h-4 text-emerald-600" />
                          <span className="text-xs font-medium text-emerald-700 uppercase tracking-wider">
                            Changes Applied
                          </span>
                        </div>
                        <ul className="space-y-1">
                          {segment.changes_applied.map((change, i) => (
                            <li
                              key={i}
                              className="text-sm text-emerald-800 flex items-start gap-2"
                            >
                              <span className="text-emerald-500">•</span>
                              {change}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                  <div>
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Full Description
                    </span>
                    <p className="mt-2 text-slate-700 leading-relaxed">
                      {segment.description}
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <User2 className="w-4 h-4 text-slate-500" />
                      <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Sociodemographics
                      </span>
                    </div>
                    <p className="text-sm text-slate-700">
                      {segment.sociodemographics}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// =====================================================
// Generating State
// =====================================================

function GeneratingState() {
  const steps = [
    "Sending request to AI...",
    "Analyzing review decisions...",
    "Applying approved changes...",
    "Generating updated segments...",
    "Finalizing segment profiles...",
  ];
  const [currentStep, setCurrentStep] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 4000);
    return () => clearInterval(interval);
  }, [steps.length]);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
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
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full blur-xl opacity-30 animate-pulse" />
        <div className="relative w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-white animate-pulse" />
        </div>
      </div>

      <h3 className="mt-8 text-xl font-semibold text-slate-900">
        Applying Review Changes
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

      <div className="mt-6 w-64">
        <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-amber-500 to-orange-500"
            initial={{ width: "0%" }}
            animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-slate-400">
          <span>
            Step {currentStep + 1} of {steps.length}
          </span>
          <span>{formatTime(elapsedTime)}</span>
        </div>
      </div>

      <div className="mt-4 flex gap-1.5">
        {steps.map((_, index) => (
          <div
            key={index}
            className={cn(
              "w-2 h-2 rounded-full transition-colors duration-300",
              index < currentStep
                ? "bg-emerald-500"
                : index === currentStep
                ? "bg-amber-500"
                : "bg-slate-200"
            )}
          />
        ))}
      </div>
    </motion.div>
  );
}

// =====================================================
// Empty State
// =====================================================

function EmptyState({
  onGenerate,
  isGenerating,
}: {
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
            <Crown className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            Ready to Apply Review Changes
          </h3>
          <p className="text-slate-500 text-center max-w-md mb-6">
            Generate final segments by applying the approved changes from the
            self-review. This will merge, modify, or add segments based on your
            decisions.
          </p>
          <Button
            onClick={onGenerate}
            disabled={isGenerating}
            isLoading={isGenerating}
            className="gap-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
          >
            <Sparkles className="w-4 h-4" />
            Generate Final Segments
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
