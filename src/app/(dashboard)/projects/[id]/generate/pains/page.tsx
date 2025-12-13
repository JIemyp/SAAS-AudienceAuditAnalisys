"use client";

import { use, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { PainDraft, Segment } from "@/types";
import { AlertCircle, ChevronDown, ChevronUp, ChevronRight, Flame, Zap, Quote, Pencil, Trash2, Check, X, Plus, Loader2, Sparkles, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { SegmentTabs, SegmentStatus } from "@/components/generation/SegmentTabs";
import { SegmentProgress } from "@/components/generation/SegmentProgress";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { useTranslation } from "@/lib/hooks/useTranslation";

// Pain draft as stored in DB - each pain is a separate row
interface PainDraftRow {
  id: string;
  project_id: string;
  segment_id: string;
  pain_index: number;
  name: string;
  description: string;
  deep_triggers: string[];
  examples: string[];
  version: number;
  created_at: string;
}

interface SegmentProgressData {
  segmentId: string;
  segmentName: string;
  completedSteps: string[];
  currentStep: string | null;
}

export default function PainsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = use(params);
  const router = useRouter();

  // State
  const [segments, setSegments] = useState<Segment[]>([]);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);
  const [painDrafts, setPainDrafts] = useState<PainDraftRow[]>([]);
  const [segmentStatuses, setSegmentStatuses] = useState<SegmentStatus[]>([]);
  const [segmentProgressData, setSegmentProgressData] = useState<SegmentProgressData[]>([]);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Language translation
  const { language, setLanguage } = useLanguage();
  const { translatedContent, isTranslating } = useTranslation({
    content: painDrafts,
    language,
    enabled: painDrafts.length > 0,
  });

  // Use translated drafts if available
  const displayDrafts = (translatedContent as PainDraftRow[]) || painDrafts;

  // Fetch segments on mount
  useEffect(() => {
    fetchSegments();
  }, [projectId]);

  // Fetch pain drafts when segment changes
  useEffect(() => {
    if (selectedSegmentId) {
      fetchPainDraftsForSegment(selectedSegmentId);
    }
  }, [selectedSegmentId]);

  // Update segment statuses when segments or drafts change
  useEffect(() => {
    if (segments.length > 0) {
      updateSegmentStatuses();
    }
  }, [segments]);

  const fetchSegments = async () => {
    try {
      const res = await fetch(`/api/segments?projectId=${projectId}&stepType=pains`);
      const data = await res.json();

      if (data.success && data.segments) {
        setSegments(data.segments);

        if (data.statuses && data.statuses.length > 0) {
          setSegmentStatuses(data.statuses);
        }

        if (data.segments.length > 0 && !selectedSegmentId) {
          setSelectedSegmentId(data.segments[0].id);
        }

        if (data.segments.length > 0) {
          const progressData = await fetchAllSegmentProgress(data.segments);
          setSegmentProgressData(progressData);
        }
      }
      setIsLoading(false);
    } catch (err) {
      console.error("Failed to fetch segments:", err);
      setIsLoading(false);
    }
  };

  const fetchAllSegmentProgress = async (segs: Segment[]): Promise<SegmentProgressData[]> => {
    const progress: SegmentProgressData[] = [];
    const stepToDraftTable: Record<string, string> = {
      jobs: "jobs_drafts",
      preferences: "preferences_drafts",
      difficulties: "difficulties_drafts",
      triggers: "triggers_drafts",
      pains: "pains_drafts",
      canvas: "canvas_drafts",
    };

    for (const seg of segs) {
      const completedSteps: string[] = [];
      for (const [step, tableName] of Object.entries(stepToDraftTable)) {
        try {
          const res = await fetch(
            `/api/drafts?projectId=${projectId}&table=${tableName}&segmentId=${seg.id}&checkApproved=true`
          );
          const data = await res.json();
          if (data.hasApproved) {
            completedSteps.push(step);
          }
        } catch {
          // Continue
        }
      }
      progress.push({
        segmentId: seg.id,
        segmentName: seg.name,
        completedSteps,
        currentStep: completedSteps.length > 0 ? completedSteps[completedSteps.length - 1] : null,
      });
    }
    return progress;
  };

  const fetchPainDraftsForSegment = async (segmentId: string) => {
    try {
      setIsLoading(true);
      const res = await fetch(
        `/api/drafts?projectId=${projectId}&table=pains_drafts&segmentId=${segmentId}`
      );
      const data = await res.json();

      if (data.success && data.drafts) {
        // Sort by pain_index to maintain order
        const sorted = [...data.drafts].sort((a, b) => (a.pain_index || 0) - (b.pain_index || 0));
        setPainDrafts(sorted);
      } else {
        setPainDrafts([]);
      }
    } catch (err) {
      console.error("Failed to fetch pain drafts:", err);
      setPainDrafts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSegmentStatuses = async () => {
    const statuses: SegmentStatus[] = [];

    for (const seg of segments) {
      try {
        const approvedRes = await fetch(
          `/api/drafts?projectId=${projectId}&table=pains_drafts&segmentId=${seg.id}&checkApproved=true`
        );
        const approvedData = await approvedRes.json();

        const draftRes = await fetch(
          `/api/drafts?projectId=${projectId}&table=pains_drafts&segmentId=${seg.id}`
        );
        const draftData = await draftRes.json();

        statuses.push({
          segmentId: seg.id,
          hasData: draftData.drafts?.length > 0,
          isApproved: approvedData.hasApproved || false,
        });
      } catch {
        statuses.push({
          segmentId: seg.id,
          hasData: false,
          isApproved: false,
        });
      }
    }

    setSegmentStatuses(statuses);
  };

  const handleGenerate = async () => {
    if (!selectedSegmentId) return;

    try {
      setIsGenerating(true);
      setError(null);

      const res = await fetch("/api/generate/pains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, segmentId: selectedSegmentId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Generation failed");
      }

      // Refresh drafts for this segment
      await fetchPainDraftsForSegment(selectedSegmentId);
      await updateSegmentStatuses();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedSegmentId || painDrafts.length === 0) return;

    try {
      setIsApproving(true);
      setError(null);

      // Get all draft IDs for this segment
      const draftIds = painDrafts.map(d => d.id);

      const res = await fetch("/api/approve/pains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          segmentId: selectedSegmentId,
          draftIds,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Approval failed");
      }

      await updateSegmentStatuses();

      // Auto-select next incomplete segment
      const nextIncomplete = segments.find(seg => {
        const status = segmentStatuses.find(s => s.segmentId === seg.id);
        return !status?.isApproved;
      });

      if (nextIncomplete) {
        setSelectedSegmentId(nextIncomplete.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Approval failed");
    } finally {
      setIsApproving(false);
    }
  };

  const handleGenerateAll = async () => {
    const segmentsWithoutData = segments.filter(seg => {
      const status = segmentStatuses.find(s => s.segmentId === seg.id);
      return !status?.hasData && !status?.isApproved;
    });

    if (segmentsWithoutData.length === 0) return;

    try {
      setIsGenerating(true);
      setError(null);

      for (const seg of segmentsWithoutData) {
        const res = await fetch("/api/generate/pains", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId, segmentId: seg.id }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || `Failed to generate for segment: ${seg.name}`);
        }
      }

      if (selectedSegmentId) {
        await fetchPainDraftsForSegment(selectedSegmentId);
      }
      await updateSegmentStatuses();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApproveAll = async () => {
    const unapprovedSegments = segments.filter(seg => {
      const status = segmentStatuses.find(s => s.segmentId === seg.id);
      return status?.hasData && !status?.isApproved;
    });

    if (unapprovedSegments.length === 0) return;

    try {
      setIsApproving(true);
      setError(null);

      for (const seg of unapprovedSegments) {
        const draftRes = await fetch(
          `/api/drafts?projectId=${projectId}&table=pains_drafts&segmentId=${seg.id}`
        );
        const draftData = await draftRes.json();

        if (!draftData.success || !draftData.drafts?.length) continue;

        const draftIds = draftData.drafts.map((d: PainDraftRow) => d.id);

        const res = await fetch("/api/approve/pains", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId,
            segmentId: seg.id,
            draftIds,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || `Failed to approve segment: ${seg.name}`);
        }
      }

      await updateSegmentStatuses();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Approval failed");
    } finally {
      setIsApproving(false);
    }
  };

  // Auto-approve all segments with drafts before continuing to next step
  const handleContinueWithAutoApprove = async () => {
    console.log("[handleContinueWithAutoApprove] Starting auto-approve for", segments.length, "segments");
    try {
      setIsApproving(true);
      setError(null);

      // Check each segment and approve if has drafts but not approved
      for (const seg of segments) {
        console.log(`[handleContinueWithAutoApprove] Checking segment ${seg.name} (${seg.id})`);

        // Check if already approved
        const approvedRes = await fetch(
          `/api/drafts?projectId=${projectId}&table=pains_drafts&segmentId=${seg.id}&checkApproved=true`
        );
        const approvedData = await approvedRes.json();
        console.log(`[handleContinueWithAutoApprove] Segment ${seg.name} hasApproved:`, approvedData.hasApproved);

        if (approvedData.hasApproved) {
          console.log(`[handleContinueWithAutoApprove] Segment ${seg.name} already approved, skipping`);
          continue;
        }

        // Get drafts for this segment
        const draftRes = await fetch(
          `/api/drafts?projectId=${projectId}&table=pains_drafts&segmentId=${seg.id}`
        );
        const draftData = await draftRes.json();
        console.log(`[handleContinueWithAutoApprove] Segment ${seg.name} drafts:`, draftData.drafts?.length || 0);

        if (!draftData.success || !draftData.drafts?.length) {
          console.log(`[handleContinueWithAutoApprove] Segment ${seg.name} has no drafts, skipping`);
          continue;
        }

        // Approve this segment
        const draftIds = draftData.drafts.map((d: PainDraftRow) => d.id);
        console.log(`[handleContinueWithAutoApprove] Approving segment ${seg.name} with ${draftIds.length} drafts`);

        const res = await fetch("/api/approve/pains", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId,
            segmentId: seg.id,
            draftIds,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          console.error(`[handleContinueWithAutoApprove] Failed to approve segment ${seg.name}:`, data.error);
        } else {
          console.log(`[handleContinueWithAutoApprove] Successfully approved segment ${seg.name}`);
        }
      }

      console.log("[handleContinueWithAutoApprove] Done, navigating to pains-ranking");
      // Navigate to next step
      router.push(`/projects/${projectId}/generate/pains-ranking`);
    } catch (err) {
      console.error("[handleContinueWithAutoApprove] Error:", err);
      setError(err instanceof Error ? err.message : "Auto-approval failed");
    } finally {
      setIsApproving(false);
    }
  };

  const handleEditPain = async (painId: string, updates: Partial<PainDraftRow>) => {
    try {
      const res = await fetch("/api/drafts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          table: "pains_drafts",
          id: painId,
          updates,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setPainDrafts(prev => prev.map(d => d.id === painId ? { ...d, ...updates } : d));
      }
    } catch (err) {
      console.error("Failed to save edit:", err);
    }
  };

  const handleDeletePain = async (painId: string) => {
    try {
      const res = await fetch(`/api/drafts?table=pains_drafts&id=${painId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setPainDrafts(prev => prev.filter(d => d.id !== painId));
      }
    } catch (err) {
      console.error("Failed to delete pain:", err);
    }
  };

  const currentSegmentStatus = segmentStatuses.find(s => s.segmentId === selectedSegmentId);

  // Convert PainDraftRow to PainDraft for the view component (use translated if available)
  const painsForView: PainDraft[] = displayDrafts.map(d => ({
    id: d.id,
    project_id: d.project_id,
    segment_id: d.segment_id,
    pain_index: d.pain_index,
    name: d.name,
    description: d.description,
    deep_triggers: d.deep_triggers || [],
    examples: d.examples || [],
    version: d.version,
    created_at: d.created_at,
  }));

  return (
    <div className="space-y-6">
      {/* Header - Title and Description */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start gap-4"
      >
        <div className="p-3 bg-gradient-to-br from-rose-500 to-red-600 rounded-xl text-white shadow-lg shadow-rose-500/20">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Pain Points
          </h1>
          <p className="mt-1 text-slate-500">
            Identify 6-10 specific pain points with deep triggers and real examples. Complete this for each segment.
          </p>
        </div>
      </motion.div>

      {/* Action Buttons Row */}
      <div className="flex items-center justify-between">
        {/* Language Toggle */}
        <LanguageToggle
          currentLanguage={language}
          onLanguageChange={setLanguage}
          isLoading={isTranslating}
        />

        <div className="flex items-center gap-3">
          {/* Generate All button */}
          {(() => {
            const segmentsWithoutData = segmentStatuses.filter(s => !s.hasData && !s.isApproved).length;
            if (segmentsWithoutData > 1) {
              return (
                <Button
                  variant="outline"
                  onClick={handleGenerateAll}
                  disabled={isGenerating}
                  isLoading={isGenerating}
                  className="gap-2 border-rose-300 text-rose-700 hover:bg-rose-50"
                >
                  <Sparkles className="w-4 h-4" />
                  Generate All ({segmentsWithoutData})
                </Button>
              );
            }
            return null;
          })()}

          {painDrafts.length > 0 && !currentSegmentStatus?.isApproved && (
            <Button
              variant="outline"
              onClick={handleGenerate}
              disabled={isGenerating || !selectedSegmentId}
              className="gap-2"
            >
              <RefreshCw className={cn("w-4 h-4", isGenerating && "animate-spin")} />
              Regenerate
            </Button>
          )}

          {/* Approve All button */}
          {(() => {
            const unapprovedWithData = segmentStatuses.filter(s => s.hasData && !s.isApproved).length;
            if (unapprovedWithData > 1) {
              return (
                <Button
                  variant="outline"
                  onClick={handleApproveAll}
                  disabled={isApproving}
                  isLoading={isApproving}
                  className="gap-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                >
                  <Check className="w-4 h-4" />
                  Approve All ({unapprovedWithData})
                </Button>
              );
            }
            return null;
          })()}

          {currentSegmentStatus?.isApproved ? (
            <Button disabled className="gap-2 bg-emerald-500">
              <Check className="w-4 h-4" />
              Approved
            </Button>
          ) : (
            <Button
              onClick={painDrafts.length === 0 ? handleGenerate : handleApprove}
              disabled={isGenerating || isApproving || !selectedSegmentId}
              isLoading={isGenerating || isApproving}
              className="gap-2 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700"
            >
              {painDrafts.length === 0 ? (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Approve {painDrafts.length} Pains
                </>
              )}
            </Button>
          )}
          {/* Continue to Next Step - show when all segments are approved */}
          {(() => {
            const allSegmentsApproved = segments.length > 0 &&
              segments.every(seg => {
                const progress = segmentProgressData.find(p => p.segmentId === seg.id);
                return progress?.completedSteps.includes("pains");
              });

            if (allSegmentsApproved) {
              return (
                <Button
                  onClick={handleContinueWithAutoApprove}
                  disabled={isApproving}
                  isLoading={isApproving}
                  className="gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
                >
                  Continue to Next Step
                  <ChevronRight className="w-4 h-4" />
                </Button>
              );
            }
            return null;
          })()}
        </div>
      </div>

      {/* Segment Tabs */}
      <SegmentTabs
        segments={segments}
        selectedSegmentId={selectedSegmentId}
        onSelectSegment={setSelectedSegmentId}
        segmentStatuses={segmentStatuses}
        isLoading={isLoading || isGenerating}
      />

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
            <button onClick={() => setError(null)} className="p-1 hover:bg-red-100 rounded">
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
            <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
          </motion.div>
        ) : isGenerating ? (
          <GeneratingState key="generating" />
        ) : painDrafts.length > 0 ? (
          <motion.div
            key={`pains-${selectedSegmentId}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <PainsDraftView
              pains={painsForView}
              onEditPain={(id, updates) => handleEditPain(id, updates as Partial<PainDraftRow>)}
              onDeletePain={handleDeletePain}
              projectId={projectId}
              segmentId={selectedSegmentId}
            />
          </motion.div>
        ) : currentSegmentStatus?.isApproved ? (
          <ApprovedState key="approved" segmentName={segments.find(s => s.id === selectedSegmentId)?.name || "Segment"} />
        ) : (
          <EmptyState
            key="empty"
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
            segmentName={segments.find(s => s.id === selectedSegmentId)?.name}
          />
        )}
      </AnimatePresence>

      {/* Segment Progress Footer */}
      <SegmentProgress
        segments={segments}
        segmentProgressData={segmentProgressData}
        currentStepType="pains"
      />
    </div>
  );
}

function GeneratingState() {
  const steps = [
    "Sending request to AI...",
    "Analyzing segment pain points...",
    "Identifying deep triggers...",
    "Generating real-world examples...",
    "Finalizing pain points...",
  ];
  const [currentStep, setCurrentStep] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep(prev => prev < steps.length - 1 ? prev + 1 : prev);
    }, 4000);
    return () => clearInterval(interval);
  }, [steps.length]);

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
        <div className="absolute inset-0 bg-gradient-to-r from-rose-500 to-red-500 rounded-full blur-xl opacity-30 animate-pulse" />
        <div className="relative w-20 h-20 bg-gradient-to-br from-rose-500 to-red-600 rounded-full flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-white animate-pulse" />
        </div>
      </div>

      <h3 className="mt-8 text-xl font-semibold text-slate-900">
        Generating Pain Points
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
            className="h-full bg-gradient-to-r from-rose-500 to-red-500"
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
    </motion.div>
  );
}

function EmptyState({
  onGenerate,
  isGenerating,
  segmentName,
}: {
  onGenerate: () => void;
  isGenerating: boolean;
  segmentName?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Card className="border-2 border-dashed border-slate-200 bg-slate-50/50">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 bg-rose-100 rounded-2xl flex items-center justify-center mb-6">
            <AlertCircle className="w-8 h-8 text-rose-500" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            Ready to Generate{segmentName ? ` for "${segmentName}"` : ""}
          </h3>
          <p className="text-slate-500 text-center max-w-md mb-6">
            Generate detailed pain points for your audience segments including triggers and real-world examples.
          </p>
          <Button
            onClick={onGenerate}
            disabled={isGenerating}
            isLoading={isGenerating}
            className="gap-2 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700"
          >
            <Sparkles className="w-4 h-4" />
            Generate Pain Points
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function ApprovedState({ segmentName }: { segmentName: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Card className="border-2 border-emerald-200 bg-emerald-50/50">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mb-6">
            <Check className="w-8 h-8 text-emerald-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            Approved for "{segmentName}"
          </h3>
          <p className="text-slate-500 text-center max-w-md">
            Pain points have been approved for this segment. Select another segment to continue.
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function PainsDraftView({
  pains,
  onEditPain,
  onDeletePain,
  projectId,
  segmentId,
}: {
  pains: PainDraft[];
  onEditPain: (id: string, updates: Partial<PainDraft>) => void;
  onDeletePain: (id: string) => void;
  projectId: string;
  segmentId: string | null;
}) {
  const [expandedPains, setExpandedPains] = useState<string[]>([]);

  const togglePain = (id: string) => {
    setExpandedPains(prev =>
      prev.includes(id)
        ? prev.filter(p => p !== id)
        : [...prev, id]
    );
  };

  const handleEditPain = (index: number, updated: PainDraft) => {
    onEditPain(updated.id, updated);
  };

  const handleDeletePain = (index: number) => {
    const pain = pains[index];
    if (pain) {
      onDeletePain(pain.id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-6 bg-gradient-to-r from-rose-50 to-red-50 border border-rose-200 rounded-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-100 rounded-lg">
              <AlertCircle className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <h3 className="font-semibold text-rose-900">
                {pains.length} Pain Points Identified
              </h3>
              <p className="text-sm text-rose-600">
                Click each pain to see triggers and examples
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setExpandedPains(pains.map(p => p.id))}
              className="px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-100 rounded-lg transition-colors"
            >
              Expand All
            </button>
            <button
              onClick={() => setExpandedPains([])}
              className="px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-100 rounded-lg transition-colors"
            >
              Collapse All
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {pains.map((pain, index) => (
          <EditablePainCard
            key={pain.id || index}
            pain={pain}
            index={index}
            isExpanded={expandedPains.includes(pain.id)}
            onToggle={() => togglePain(pain.id)}
            onEdit={(updated) => handleEditPain(index, updated)}
            onDelete={() => handleDeletePain(index)}
            projectId={projectId}
            segmentId={segmentId || undefined}
          />
        ))}
      </div>
    </div>
  );
}

function EditablePainCard({
  pain,
  index,
  isExpanded,
  onToggle,
  onEdit,
  onDelete,
  projectId,
  segmentId,
}: {
  pain: PainDraft;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: (pain: PainDraft) => void;
  onDelete: () => void;
  projectId?: string;
  segmentId?: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [name, setName] = useState(pain.name);
  const [description, setDescription] = useState(pain.description);
  const [deepTriggers, setDeepTriggers] = useState(pain.deep_triggers || []);
  const [examples, setExamples] = useState(pain.examples || []);

  const handleSave = () => {
    onEdit({ ...pain, name, description, deep_triggers: deepTriggers, examples });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setName(pain.name);
    setDescription(pain.description);
    setDeepTriggers(pain.deep_triggers || []);
    setExamples(pain.examples || []);
    setIsEditing(false);
  };

  const handleRegenerateField = async (fieldName: string, fieldType: string) => {
    if (!projectId) return;

    try {
      setIsRegenerating(true);
      const currentValue = fieldName === 'name' ? name :
                          fieldName === 'description' ? description : '';

      const res = await fetch("/api/generate/field", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          segmentId,
          fieldName,
          fieldType: "pain",
          currentValue,
          context: `Pain point: ${name}`,
        }),
      });

      const data = await res.json();
      if (data.success && data.value) {
        if (fieldName === 'name') {
          setName(data.value);
          onEdit({ ...pain, name: data.value, description, deep_triggers: deepTriggers, examples });
        } else if (fieldName === 'description') {
          setDescription(data.value);
          onEdit({ ...pain, name, description: data.value, deep_triggers: deepTriggers, examples });
        }
      }
    } catch (err) {
      console.error("Failed to regenerate field:", err);
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div
        onClick={onToggle}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onToggle()}
        className="w-full p-5 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-red-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-rose-500/30">
            {index + 1}
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-slate-900">{pain.name}</h3>
            <p className="text-sm text-slate-500 line-clamp-1">
              {pain.description?.substring(0, 80)}...
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Always visible action buttons */}
          <div className="flex gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); setIsEditing(true); onToggle(); }}
              className="p-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-blue-100 hover:text-blue-600 border border-slate-200 transition-colors"
              title="Edit"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleRegenerateField('description', 'pain'); }}
              disabled={isRegenerating}
              className="p-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-purple-100 hover:text-purple-600 border border-slate-200 transition-colors disabled:opacity-50"
              title="Regenerate with AI"
            >
              {isRegenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="p-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-red-100 hover:text-red-600 border border-slate-200 transition-colors"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <div className={cn(
            "p-2 rounded-lg transition-colors",
            isExpanded ? "bg-slate-100" : "hover:bg-slate-100"
          )}>
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
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full mt-1 p-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Description</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full mt-1 p-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      rows={4}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Deep Triggers (one per line)</label>
                    <textarea
                      value={deepTriggers.join("\n")}
                      onChange={(e) => setDeepTriggers(e.target.value.split("\n").filter(t => t.trim()))}
                      className="w-full mt-1 p-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Examples (one per line)</label>
                    <textarea
                      value={examples.join("\n")}
                      onChange={(e) => setExamples(e.target.value.split("\n").filter(t => t.trim()))}
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
                <div className="pt-5 space-y-5">
                  <div>
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Full Description
                    </span>
                    <p className="mt-2 text-slate-700 leading-relaxed">
                      {pain.description}
                    </p>
                  </div>

                  {pain.deep_triggers && pain.deep_triggers.length > 0 && (
                    <div className="p-4 bg-orange-50 rounded-xl">
                      <div className="flex items-center gap-2 mb-3">
                        <Zap className="w-4 h-4 text-orange-600" />
                        <span className="text-xs font-medium text-orange-700 uppercase tracking-wider">
                          Deep Triggers
                        </span>
                      </div>
                      <ul className="space-y-2">
                        {pain.deep_triggers.map((trigger, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                            <Flame className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
                            {trigger}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {pain.examples && pain.examples.length > 0 && (
                    <div className="p-4 bg-blue-50 rounded-xl">
                      <div className="flex items-center gap-2 mb-3">
                        <Quote className="w-4 h-4 text-blue-600" />
                        <span className="text-xs font-medium text-blue-700 uppercase tracking-wider">
                          Real Examples
                        </span>
                      </div>
                      <ul className="space-y-3">
                        {pain.examples.map((example, i) => (
                          <li key={i} className="text-sm text-slate-700 italic border-l-2 border-blue-300 pl-3">
                            "{example}"
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

