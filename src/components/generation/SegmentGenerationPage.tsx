"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import {
  Loader2,
  Sparkles,
  Check,
  AlertCircle,
  RefreshCw,
  X,
  Trash2,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Segment } from "@/types";
import { SegmentTabs, SegmentStatus } from "./SegmentTabs";
import { SegmentProgress } from "./SegmentProgress";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { useTranslation } from "@/lib/hooks/useTranslation";

// =====================================================
// Types
// =====================================================

export interface SegmentGenerationPageProps<T> {
  projectId: string;
  title: string;
  description: string;
  stepType: string; // e.g., "jobs", "preferences", etc.
  generateEndpoint: string;
  approveEndpoint: string;
  draftTable: string;
  approvedTable: string;
  nextStepUrl: string;
  renderDraft: (draft: T, onEdit: (updates: Partial<T>) => void) => React.ReactNode;
  emptyStateMessage?: string;
  icon?: React.ReactNode;
  // Optional function to get custom label for draft selector (e.g., pain names for Canvas)
  getDraftLabel?: (draft: T, index: number, total: number) => string;
}

interface SegmentProgressData {
  segmentId: string;
  segmentName: string;
  completedSteps: string[];
  currentStep: string | null;
}

// =====================================================
// Main Component
// =====================================================

export function SegmentGenerationPage<T extends { id: string; segment_id?: string }>({
  projectId,
  title,
  description,
  stepType,
  generateEndpoint,
  approveEndpoint,
  draftTable,
  approvedTable,
  nextStepUrl,
  renderDraft,
  emptyStateMessage = "No draft generated yet",
  icon,
  getDraftLabel,
}: SegmentGenerationPageProps<T>) {
  const router = useRouter();

  // State
  const [segments, setSegments] = useState<Segment[]>([]);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<T[]>([]);
  const [selectedDraftId, setSelectedDraftId] = useState<string | null>(null);
  const [segmentStatuses, setSegmentStatuses] = useState<SegmentStatus[]>([]);
  const [segmentProgressData, setSegmentProgressData] = useState<SegmentProgressData[]>([]);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editedDraft, setEditedDraft] = useState<Partial<T> | null>(null);

  // Language translation
  const { language, setLanguage } = useLanguage();
  const { translatedContent, isTranslating } = useTranslation({
    content: drafts,
    language,
    enabled: drafts.length > 0,
  });

  // Use translated drafts if available
  const displayDrafts = (translatedContent as T[]) || drafts;
  const selectedDraft = displayDrafts.find(d => d.id === selectedDraftId);

  // DEBUG: Check if selectedDraft is from translated or original
  console.log('[SegmentGenerationPage] RENDER DEBUG:', {
    selectedDraftId,
    displayDraftsIds: displayDrafts.map(d => d.id),
    foundSelectedDraft: !!selectedDraft,
    selectedDraftSource: translatedContent ? 'translated' : 'original',
    // Check if preferences exist and show first name
    selectedDraftFirstPref: selectedDraft && 'preferences' in selectedDraft
      ? (selectedDraft as { preferences?: Array<{ name?: string }> }).preferences?.[0]?.name?.substring(0, 40)
      : 'no preferences',
  });

  // Debug: log translation - show actual keys and first text value
  const getFirstTextField = (obj: unknown): string => {
    if (!obj || typeof obj !== 'object') return 'not object';
    const o = obj as Record<string, unknown>;
    // Find first array property that has objects with text fields
    for (const key of Object.keys(o)) {
      if (Array.isArray(o[key]) && o[key].length > 0) {
        const firstItem = o[key][0] as Record<string, unknown>;
        // Return first string field from first item
        for (const itemKey of Object.keys(firstItem)) {
          if (typeof firstItem[itemKey] === 'string' && firstItem[itemKey].length > 10) {
            return `${key}[0].${itemKey}: "${(firstItem[itemKey] as string).substring(0, 50)}..."`;
          }
        }
      }
    }
    return 'no text field found';
  };

  console.log('[SegmentGenerationPage] TRANSLATION DEBUG:', {
    language,
    hasTranslated: !!translatedContent,
    originalKeys: drafts[0] ? Object.keys(drafts[0]).filter(k => !['id', 'project_id', 'segment_id', 'created_at'].includes(k)) : [],
    originalText: getFirstTextField(drafts[0]),
    translatedText: getFirstTextField(translatedContent && Array.isArray(translatedContent) ? translatedContent[0] : null),
  });

  // Fetch segments on mount
  useEffect(() => {
    fetchSegments();
  }, [projectId]);

  // Fetch drafts when segment changes
  useEffect(() => {
    if (selectedSegmentId) {
      fetchDraftsForSegment(selectedSegmentId);
    }
  }, [selectedSegmentId, draftTable]);

  // Update segment statuses
  useEffect(() => {
    updateSegmentStatuses();
  }, [segments, drafts]);

  const fetchSegments = async () => {
    try {
      console.log(`[SegmentGenerationPage] Fetching segments for project: ${projectId}, stepType: ${stepType}`);
      const res = await fetch(`/api/segments?projectId=${projectId}&stepType=${stepType}`);
      const data = await res.json();
      console.log(`[SegmentGenerationPage] Segments response:`, data);

      if (data.success && data.segments) {
        console.log(`[SegmentGenerationPage] Found ${data.segments.length} segments`);
        setSegments(data.segments);

        // Use statuses from API if available
        if (data.statuses && data.statuses.length > 0) {
          console.log(`[SegmentGenerationPage] Setting statuses from API:`, data.statuses);
          setSegmentStatuses(data.statuses);
        }

        // Select first segment by default
        if (data.segments.length > 0 && !selectedSegmentId) {
          console.log(`[SegmentGenerationPage] Selecting first segment: ${data.segments[0].id}`);
          setSelectedSegmentId(data.segments[0].id);
        }

        // Build progress data (skip if no segments)
        if (data.segments.length > 0) {
          const progressData = await fetchAllSegmentProgress(data.segments);
          setSegmentProgressData(progressData);
        }
      } else {
        console.warn(`[SegmentGenerationPage] No segments found or error:`, data);
        setIsLoading(false);
      }
    } catch (err) {
      console.error("[SegmentGenerationPage] Failed to fetch segments:", err);
      setIsLoading(false);
    }
  };

  const fetchAllSegmentProgress = async (segs: Segment[]): Promise<SegmentProgressData[]> => {
    const progress: SegmentProgressData[] = [];

    for (const seg of segs) {
      const completedSteps: string[] = [];

      // Check each step type for this segment
      // Map step names to draft table names
      const stepToDraftTable: Record<string, string> = {
        jobs: "jobs_drafts",
        preferences: "preferences_drafts",
        difficulties: "difficulties_drafts",
        triggers: "triggers_drafts",
        pains: "pains_drafts",
        canvas: "canvas_drafts",
        "canvas-extended": "canvas_extended_drafts",
      };
      const stepsToCheck = Object.keys(stepToDraftTable);

      for (const step of stepsToCheck) {
        const tableName = stepToDraftTable[step];
        try {
          const res = await fetch(
            `/api/drafts?projectId=${projectId}&table=${tableName}&segmentId=${seg.id}&checkApproved=true`
          );
          const data = await res.json();
          if (data.hasApproved) {
            completedSteps.push(step);
          }
        } catch {
          // Continue checking other steps
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

  const fetchDraftsForSegment = async (segmentId: string) => {
    try {
      setIsLoading(true);
      console.log(`[SegmentGenerationPage] Fetching drafts for segment: ${segmentId}, table: ${draftTable}`);
      const res = await fetch(
        `/api/drafts?projectId=${projectId}&table=${draftTable}&segmentId=${segmentId}`
      );
      const data = await res.json();
      console.log(`[SegmentGenerationPage] Drafts response:`, data);

      if (data.success && data.drafts && data.drafts.length > 0) {
        console.log(`[SegmentGenerationPage] Found ${data.drafts.length} drafts`);
        setDrafts(data.drafts);
        setSelectedDraftId(data.drafts[0].id);
      } else {
        // No drafts found - try to load approved data
        console.log(`[SegmentGenerationPage] No drafts, checking approved table: ${approvedTable}`);
        const approvedRes = await fetch(
          `/api/approved?projectId=${projectId}&table=${approvedTable}&segmentId=${segmentId}`
        );
        const approvedData = await approvedRes.json();
        console.log(`[SegmentGenerationPage] Approved data response:`, approvedData);

        if (approvedData.success && approvedData.data && approvedData.data.length > 0) {
          console.log(`[SegmentGenerationPage] Found ${approvedData.data.length} approved records`);
          // Use approved data as "drafts" for display (read-only)
          setDrafts(approvedData.data);
          setSelectedDraftId(approvedData.data[0].id);
        } else {
          setDrafts([]);
          setSelectedDraftId(null);
        }
      }
    } catch (err) {
      console.error("[SegmentGenerationPage] Failed to fetch drafts:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSegmentStatuses = async () => {
    const statuses: SegmentStatus[] = [];

    for (const seg of segments) {
      try {
        // Check for approved data - use draftTable with checkApproved=true
        // /api/drafts will resolve the approved table automatically
        const approvedRes = await fetch(
          `/api/drafts?projectId=${projectId}&table=${draftTable}&segmentId=${seg.id}&checkApproved=true`
        );
        const approvedData = await approvedRes.json();

        // Check for draft data
        const draftRes = await fetch(
          `/api/drafts?projectId=${projectId}&table=${draftTable}&segmentId=${seg.id}`
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
    if (!selectedSegmentId) {
      console.warn("[SegmentGenerationPage] handleGenerate called but no segment selected!");
      return;
    }

    try {
      setIsGenerating(true);
      setError(null);

      console.log(`[SegmentGenerationPage] Starting generation for segment: ${selectedSegmentId}`);
      console.log(`[SegmentGenerationPage] POST ${generateEndpoint} with:`, { projectId, segmentId: selectedSegmentId });

      const res = await fetch(generateEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, segmentId: selectedSegmentId }),
      });

      const contentType = res.headers.get("content-type") || "";
      const data = contentType.includes("text/event-stream")
        ? await readStreamingResponse(res)
        : await res.json();
      console.log(`[SegmentGenerationPage] Generate response:`, data);

      if (!res.ok) {
        throw new Error(data.error || "Generation failed");
      }

      if (data.draft) {
        console.log(`[SegmentGenerationPage] Draft created:`, data.draft.id);
        setDrafts(prev => [data.draft, ...prev]);
        setSelectedDraftId(data.draft.id);
      } else if (data.drafts) {
        // Some endpoints return array of drafts
        console.log(`[SegmentGenerationPage] Multiple drafts created:`, data.drafts.length);
        setDrafts(data.drafts);
        if (data.drafts.length > 0) {
          setSelectedDraftId(data.drafts[0].id);
        }
      }

      // Update statuses
      await updateSegmentStatuses();
    } catch (err) {
      console.error("[SegmentGenerationPage] Generation error:", err);
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedDraftId || !selectedSegmentId) return;

    try {
      setIsApproving(true);
      setError(null);

      // Save any pending edits first
      if (editedDraft) {
        await handleSaveEdit();
      }

      const res = await fetch(approveEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          draftId: selectedDraftId,
          draftIds: [selectedDraftId],
          segmentId: selectedSegmentId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Approval failed");
      }

      // Update statuses
      await updateSegmentStatuses();

      // Quick update for current segment progress
      setSegmentProgressData(prev =>
        prev.map(p =>
          p.segmentId === selectedSegmentId
            ? {
                ...p,
                completedSteps: p.completedSteps.includes(stepType)
                  ? p.completedSteps
                  : [...p.completedSteps, stepType],
              }
            : p
        )
      );

      // Refresh full progress data in background
      const progressData = await fetchAllSegmentProgress(segments);
      setSegmentProgressData(progressData);

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

  // Generate all segments at once
  const handleGenerateAll = async () => {
    // Find segments without drafts (no data generated yet)
    const segmentsWithoutData = segments.filter(seg => {
      const status = segmentStatuses.find(s => s.segmentId === seg.id);
      return !status?.hasData && !status?.isApproved;
    });

    if (segmentsWithoutData.length === 0) return;

    try {
      setIsGenerating(true);
      setError(null);

      for (const seg of segmentsWithoutData) {
        console.log(`[SegmentGenerationPage] Generating for segment: ${seg.name} (${seg.id})`);

      const res = await fetch(generateEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, segmentId: seg.id }),
      });

        const contentType = res.headers.get("content-type") || "";
        const data = contentType.includes("text/event-stream")
          ? await readStreamingResponse(res)
          : await res.json();

        if (!res.ok) {
          throw new Error(data.error || `Failed to generate for segment: ${seg.name}`);
        }

        console.log(`[SegmentGenerationPage] Generated for segment: ${seg.name}`);
      }

      // Refresh drafts for current segment and update statuses
      if (selectedSegmentId) {
        await fetchDraftsForSegment(selectedSegmentId);
      }
      await updateSegmentStatuses();

      // Refresh progress data
      const progressData = await fetchAllSegmentProgress(segments);
      setSegmentProgressData(progressData);
    } catch (err) {
      console.error("[SegmentGenerationPage] Generate all error:", err);
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setIsGenerating(false);
    }
  };

  const readStreamingResponse = async (res: Response) => {
    const reader = res.body?.getReader();
    if (!reader) {
      throw new Error("Streaming response not available");
    }

    const decoder = new TextDecoder();
    let buffer = "";
    let lastComplete: any = null;

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const chunks = buffer.split("\n\n");
      buffer = chunks.pop() || "";

      for (const chunk of chunks) {
        const line = chunk.trim();
        if (!line.startsWith("data:")) continue;

        const jsonText = line.replace(/^data:\s*/, "");
        try {
          const data = JSON.parse(jsonText);
          if (data.type === "progress") {
            console.log("[SegmentGenerationPage] Stream progress:", data);
            continue;
          }
          if (data.type === "error") {
            throw new Error(data.message || "Generation failed");
          }
          if (data.type === "complete") {
            lastComplete = data;
          }
        } catch (error) {
          throw new Error(error instanceof Error ? error.message : "Invalid streaming response");
        }
      }
    }

    if (!lastComplete) {
      throw new Error("No completion event received");
    }

    return lastComplete;
  };

  // Approve all segments at once
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
        // Get draft for this segment
        const draftRes = await fetch(
          `/api/drafts?projectId=${projectId}&table=${draftTable}&segmentId=${seg.id}`
        );
        const draftData = await draftRes.json();

        if (!draftData.success || !draftData.drafts?.length) continue;

        const draftId = draftData.drafts[0].id;

        // Approve this segment
        const res = await fetch(approveEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId,
            draftId,
            draftIds: [draftId],
            segmentId: seg.id,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || `Failed to approve segment: ${seg.name}`);
        }
      }

      // Update statuses after all approvals
      await updateSegmentStatuses();

      // Quick update for current step progress (mark all as completed)
      // This is faster than fetchAllSegmentProgress which checks all steps
      setSegmentProgressData(prev =>
        prev.map(p => ({
          ...p,
          completedSteps: p.completedSteps.includes(stepType)
            ? p.completedSteps
            : [...p.completedSteps, stepType],
        }))
      );

      // Also refresh full progress data in background
      const progressData = await fetchAllSegmentProgress(segments);
      setSegmentProgressData(progressData);
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

  const handleSelectSegment = (segmentId: string) => {
    setSelectedSegmentId(segmentId);
    setEditedDraft(null);
  };

  // Get current segment status
  const currentSegmentStatus = segmentStatuses.find(
    s => s.segmentId === selectedSegmentId
  );

  // Get merged draft with edits
  const currentDraft = selectedDraft
    ? { ...selectedDraft, ...editedDraft } as T
    : null;

  return (
    <div className="space-y-6">
      {/* Header - Title and Description */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start gap-4"
      >
        {icon && (
          <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl text-white shadow-lg shadow-blue-500/20">
            {icon}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {title}
          </h1>
          <p className="mt-1 text-slate-500">
            {description}
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
          {/* Generate All button - show when there are segments without data */}
          {(() => {
            const segmentsWithoutData = segmentStatuses.filter(s => !s.hasData && !s.isApproved).length;
            if (segmentsWithoutData > 1) {
              return (
                <Button
                  variant="outline"
                  onClick={handleGenerateAll}
                  disabled={isGenerating}
                  isLoading={isGenerating}
                  className="gap-2 border-blue-300 text-blue-700 hover:bg-blue-50 hover:text-blue-800"
                >
                  <Sparkles className="w-4 h-4" />
                  Generate All ({segmentsWithoutData})
                </Button>
              );
            }
            return null;
          })()}
          {drafts.length > 0 && !currentSegmentStatus?.isApproved && (
            <Button
              variant="outline"
              onClick={handleGenerate}
              disabled={isGenerating || !selectedSegmentId}
              className="gap-2 border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-slate-900 hover:border-slate-400"
            >
              <RefreshCw className={cn("w-4 h-4", isGenerating && "animate-spin")} />
              Regenerate
            </Button>
          )}
          {/* Approve All button - show when there are unapproved segments with data */}
          {(() => {
            const unapprovedWithData = segmentStatuses.filter(s => s.hasData && !s.isApproved).length;
            const allApproved = segmentStatuses.every(s => s.isApproved);
            if (unapprovedWithData > 1 && !allApproved) {
              return (
                <Button
                  variant="outline"
                  onClick={handleApproveAll}
                  disabled={isApproving}
                  isLoading={isApproving}
                  className="gap-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-400"
                >
                  <Check className="w-4 h-4" />
                  Approve All ({unapprovedWithData})
                </Button>
              );
            }
            return null;
          })()}
          {/* Main action button - shows Continue when all approved, otherwise Approve/Generate */}
          {(() => {
            const allSegmentsApproved = segments.length > 0 &&
              segments.every(seg => {
                const progress = segmentProgressData.find(p => p.segmentId === seg.id);
                return progress?.completedSteps.includes(stepType);
              });

            // When ALL segments are approved - show Continue to Next Step
            if (allSegmentsApproved) {
              return (
                <Button
                  onClick={() => router.push(`/projects/${projectId}${nextStepUrl}`)}
                  className="gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
                >
                  Continue to Next Step
                  <ChevronRight className="w-4 h-4" />
                </Button>
              );
            }

            // When current segment is approved but not all - show disabled Approved
            if (currentSegmentStatus?.isApproved) {
              return (
                <Button
                  disabled
                  className="gap-2 bg-emerald-500"
                >
                  <Check className="w-4 h-4" />
                  Approved
                </Button>
              );
            }

            // Not approved - show Generate or Approve button
            return (
              <Button
                onClick={drafts.length === 0 ? handleGenerate : handleApprove}
                disabled={isGenerating || isApproving || !selectedSegmentId || (drafts.length > 0 && !selectedDraftId)}
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
                    Approve for this Segment
                  </>
                )}
              </Button>
            );
          })()}
        </div>
      </div>

      {/* Segment Tabs */}
      <SegmentTabs
        segments={segments}
        selectedSegmentId={selectedSegmentId}
        onSelectSegment={handleSelectSegment}
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

      {/* Draft Version Selector - show for multiple drafts OR when custom labels provided (e.g., pain names) */}
      {(drafts.length > 1 || (getDraftLabel && drafts.length >= 1)) && !currentSegmentStatus?.isApproved && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 p-3 bg-slate-100 rounded-xl"
        >
          <span className="text-sm text-slate-500 font-medium">
            {getDraftLabel ? "Select:" : "Versions:"}
          </span>
          <div className="flex gap-2 flex-wrap">
            {drafts.map((draft, index) => {
              const label = getDraftLabel
                ? getDraftLabel(draft, index, drafts.length)
                : `v${drafts.length - index}`;
              return (
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
                  {label}
                </button>
              );
            })}
          </div>
          {selectedDraftId && drafts.length > 1 && !getDraftLabel && (
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
            key={`draft-${selectedSegmentId}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {renderDraft(currentDraft, handleEdit)}
          </motion.div>
        ) : currentSegmentStatus?.isApproved ? (
          <ApprovedState key="approved" segmentName={segments.find(s => s.id === selectedSegmentId)?.name || "Segment"} />
        ) : (
          <EmptyState
            key="empty"
            message={emptyStateMessage}
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
            segmentName={segments.find(s => s.id === selectedSegmentId)?.name}
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

      {/* Segment Progress Footer */}
      <SegmentProgress
        segments={segments}
        segmentProgressData={segmentProgressData}
        currentStepType={stepType}
        projectId={projectId}
        nextStepUrl={nextStepUrl}
      />
    </div>
  );
}

// =====================================================
// Sub Components
// =====================================================

function GeneratingState() {
  const steps = [
    "Sending request to AI...",
    "Analyzing segment characteristics...",
    "Building comprehensive profile...",
    "Generating insights...",
    "Finalizing output...",
  ];
  const [currentStep, setCurrentStep] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev < steps.length - 1) {
          return prev + 1;
        }
        return prev;
      });
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
  segmentName,
}: {
  message: string;
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
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-6">
            <Sparkles className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            Ready to Generate{segmentName ? ` for "${segmentName}"` : ""}
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
            This step has been completed for this segment. Select another segment to continue.
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
