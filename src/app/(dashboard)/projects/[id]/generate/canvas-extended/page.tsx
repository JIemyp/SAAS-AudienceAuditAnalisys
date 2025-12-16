"use client";

import { use, useState, useEffect, useCallback } from "react";
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
  ChevronRight,
  Target,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Segment, CanvasExtendedV2Draft } from "@/types";
import {
  CustomerJourneySection,
  EmotionalMapSection,
  NarrativeAnglesSection,
  MessagingFrameworkSection,
  VoiceAndToneSection,
} from "@/components/canvas-extended";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { useTranslation } from "@/lib/hooks/useTranslation";

interface TopPain {
  pain_id: string;
  name: string;
  segment_id: string;
  impact_score: number;
}

interface SegmentWithPains {
  segment: Segment;
  topPains: TopPain[];
  generatedCount: number;
  approvedCount: number;
}

export default function CanvasExtendedPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = use(params);
  const router = useRouter();

  // State
  const [segmentsWithPains, setSegmentsWithPains] = useState<SegmentWithPains[]>([]);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);
  const [selectedPainId, setSelectedPainId] = useState<string | null>(null);
  const [currentDraft, setCurrentDraft] = useState<CanvasExtendedV2Draft | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Language translation
  const { language, setLanguage } = useLanguage();
  const { translatedContent: translatedDraft, isTranslating } = useTranslation({
    content: currentDraft,
    language,
    enabled: !!currentDraft,
  });

  // Use translated content if available
  const displayDraft = (translatedDraft as CanvasExtendedV2Draft) || currentDraft;

  // Derived state
  const selectedSegmentData = segmentsWithPains.find(s => s.segment.id === selectedSegmentId);
  const selectedPain = selectedSegmentData?.topPains.find(p => p.pain_id === selectedPainId);

  // Fetch all data on mount
  useEffect(() => {
    fetchData();
  }, [projectId]);

  // Fetch draft when pain selected
  useEffect(() => {
    if (selectedPainId && selectedSegmentId) {
      fetchDraftForPain(selectedPainId);
    }
  }, [selectedPainId, selectedSegmentId]);

  // skipAutoSelect: true means don't change selected segment/pain (used after generation)
  const fetchData = async (skipAutoSelect = false) => {
    try {
      setIsLoading(true);

      // Get segments
      const segmentsRes = await fetch(`/api/segments?projectId=${projectId}`);
      const segmentsData = await segmentsRes.json();

      if (!segmentsData.success || !segmentsData.segments) {
        throw new Error("Failed to fetch segments");
      }

      const segments: Segment[] = segmentsData.segments;
      const result: SegmentWithPains[] = [];

      for (const segment of segments) {
        // Get TOP pains for this segment
        const painsRes = await fetch(`/api/top-pains?projectId=${projectId}&segmentId=${segment.id}`);
        const painsData = await painsRes.json();

        const topPains = painsData.success && painsData.topPains
          ? painsData.topPains.map((p: { id: string; name: string; segment_id: string; impact_score?: number }) => ({
              pain_id: p.id,
              name: p.name,
              segment_id: p.segment_id,
              impact_score: p.impact_score || 0,
            }))
          : [];

        // Count generated and approved
        let generatedCount = 0;
        let approvedCount = 0;

        for (const pain of topPains) {
          // Check drafts
          const draftRes = await fetch(`/api/drafts?projectId=${projectId}&table=canvas_extended_drafts&painId=${pain.pain_id}`);
          const draftData = await draftRes.json();
          if (draftData.drafts?.length > 0) {
            generatedCount++;
          }

          // Check approved
          const approvedRes = await fetch(`/api/drafts?projectId=${projectId}&table=canvas_extended_drafts&painId=${pain.pain_id}&checkApproved=true`);
          const approvedData = await approvedRes.json();
          if (approvedData.hasApproved) {
            approvedCount++;
          }
        }

        result.push({
          segment,
          topPains,
          generatedCount,
          approvedCount,
        });
      }

      setSegmentsWithPains(result);

      // Only auto-select on initial load, not after generation
      if (!skipAutoSelect && !selectedSegmentId) {
        const firstWithPains = result.find(s => s.topPains.length > 0);
        if (firstWithPains) {
          setSelectedSegmentId(firstWithPains.segment.id);
          if (firstWithPains.topPains.length > 0) {
            setSelectedPainId(firstWithPains.topPains[0].pain_id);
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch data:", err);
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDraftForPain = async (painId: string) => {
    try {
      console.log('[canvas-extended] fetchDraftForPain called:', painId);
      const res = await fetch(`/api/drafts?projectId=${projectId}&table=canvas_extended_drafts&painId=${painId}`);
      const data = await res.json();
      console.log('[canvas-extended] fetchDraftForPain response:', {
        painId,
        success: data.success,
        draftsCount: data.drafts?.length || 0,
        hasDraft: data.drafts?.length > 0
      });

      if (data.success && data.drafts?.length > 0) {
        console.log('[canvas-extended] Setting currentDraft:', data.drafts[0].id);
        setCurrentDraft(data.drafts[0] as CanvasExtendedV2Draft);
      } else {
        console.log('[canvas-extended] No draft found, setting null');
        setCurrentDraft(null);
      }
    } catch (err) {
      console.error("[canvas-extended] Failed to fetch draft:", err);
      setCurrentDraft(null);
    }
  };

  // Helper to handle SSE streaming response
  const handleSSEGeneration = async (body: object, onComplete: () => Promise<void>) => {
    const res = await fetch("/api/generate/canvas-extended", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || "Generation failed");
    }

    // Read SSE stream
    const reader = res.body?.getReader();
    if (!reader) throw new Error("No response body");

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = JSON.parse(line.slice(6));
          console.log("[SSE]", data);

          if (data.type === "error") {
            throw new Error(data.message);
          }

          if (data.type === "complete") {
            await onComplete();
            return;
          }
        }
      }
    }
  };

  const handleGenerate = async (painId?: string) => {
    const targetPainId = painId || selectedPainId;
    if (!targetPainId || !selectedSegmentId) return;

    try {
      setIsGenerating(true);
      setError(null);

      await handleSSEGeneration(
        {
          projectId,
          segmentId: selectedSegmentId,
          painId: targetPainId,
        },
        async () => {
          // Refresh draft
          await fetchDraftForPain(targetPainId);
          // Update counts (skipAutoSelect=true to keep current selection)
          await fetchData(true);
        }
      );
    } catch (err) {
      console.error("Generation error:", err);
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateAll = async () => {
    if (!selectedSegmentData) return;

    try {
      setIsGenerating(true);
      setError(null);

      await handleSSEGeneration(
        {
          projectId,
          segmentId: selectedSegmentId,
        },
        async () => {
          // Refresh data (skipAutoSelect=true to keep current selection)
          await fetchData(true);
          // Fetch current pain's draft
          if (selectedPainId) {
            await fetchDraftForPain(selectedPainId);
          }
        }
      );
    } catch (err) {
      console.error("Generation error:", err);
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApprove = async () => {
    if (!currentDraft || !selectedSegmentId) return;

    try {
      setIsApproving(true);
      setError(null);

      const res = await fetch("/api/approve/canvas-extended", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          draftIds: [currentDraft.id],
          segmentId: selectedSegmentId,
          painId: currentDraft.pain_id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Approval failed");
      }

      // Refresh data (skipAutoSelect=true to keep current segment)
      await fetchData(true);

      // Move to next unapproved pain
      if (selectedSegmentData) {
        const currentIndex = selectedSegmentData.topPains.findIndex(p => p.pain_id === selectedPainId);
        const nextPain = selectedSegmentData.topPains[currentIndex + 1];
        if (nextPain) {
          setSelectedPainId(nextPain.pain_id);
        }
      }
    } catch (err) {
      console.error("Approval error:", err);
      setError(err instanceof Error ? err.message : "Approval failed");
    } finally {
      setIsApproving(false);
    }
  };

  const handleApproveAll = async () => {
    if (!selectedSegmentData) return;

    try {
      setIsApproving(true);
      setError(null);

      // Get all drafts for this segment
      for (const pain of selectedSegmentData.topPains) {
        const draftRes = await fetch(`/api/drafts?projectId=${projectId}&table=canvas_extended_drafts&painId=${pain.pain_id}`);
        const draftData = await draftRes.json();

        if (draftData.drafts?.length > 0) {
          const draft = draftData.drafts[0];

          const res = await fetch("/api/approve/canvas-extended", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              projectId,
              draftIds: [draft.id],
              segmentId: selectedSegmentId,
              painId: draft.pain_id,
            }),
          });

          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || `Failed to approve: ${pain.name}`);
          }
        }
      }

      // Refresh data (skipAutoSelect=true to keep current segment)
      await fetchData(true);
    } catch (err) {
      console.error("Approval error:", err);
      setError(err instanceof Error ? err.message : "Approval failed");
    } finally {
      setIsApproving(false);
    }
  };

  // Check if all complete
  const allComplete = segmentsWithPains.every(s =>
    s.topPains.length > 0 && s.approvedCount === s.topPains.length
  );

  const totalPains = segmentsWithPains.reduce((acc, s) => acc + s.topPains.length, 0);
  const totalApproved = segmentsWithPains.reduce((acc, s) => acc + s.approvedCount, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header - Title and Description */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start gap-4"
      >
        <div className="p-3 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl text-white shadow-lg shadow-purple-500/20">
          <Sparkles className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Extended Canvas Analysis V2
          </h1>
          <p className="mt-1 text-slate-500">
            Deep psychological analysis with customer journey, emotional mapping, narrative angles, and messaging framework for each TOP pain.
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
          {/* Progress Badge */}
          <div className="px-3 py-1.5 bg-slate-100 rounded-lg text-sm">
            <span className="font-medium text-slate-700">{totalApproved}/{totalPains}</span>
            <span className="text-slate-500 ml-1">approved</span>
          </div>

          {allComplete ? (
            <Button
              onClick={() => router.push(`/projects/${projectId}/overview`)}
              className="gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600"
            >
              Continue to Overview
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <>
              {selectedSegmentData && selectedSegmentData.generatedCount < selectedSegmentData.topPains.length && (
                <Button
                  variant="outline"
                  onClick={handleGenerateAll}
                  disabled={isGenerating}
                  isLoading={isGenerating}
                  className="gap-2"
                >
                  <Zap className="w-4 h-4" />
                  Generate All for Segment
                </Button>
              )}
              {selectedSegmentData && selectedSegmentData.generatedCount > selectedSegmentData.approvedCount && (
                <Button
                  variant="outline"
                  onClick={handleApproveAll}
                  disabled={isApproving}
                  isLoading={isApproving}
                  className="gap-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                >
                  <Check className="w-4 h-4" />
                  Approve All for Segment
                </Button>
              )}
            </>
          )}
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
            <button onClick={() => setError(null)} className="p-1 hover:bg-red-100 rounded">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Segment Tabs */}
      <div className="bg-white border border-slate-200 rounded-xl p-2">
        <div className="flex gap-2 overflow-x-auto">
          {segmentsWithPains.map(({ segment, topPains, generatedCount, approvedCount }) => {
            const isSelected = segment.id === selectedSegmentId;
            const isComplete = approvedCount === topPains.length && topPains.length > 0;
            const hasGenerated = generatedCount > 0;
            const progress = topPains.length > 0 ? Math.round((approvedCount / topPains.length) * 100) : 0;

            return (
              <button
                key={segment.id}
                onClick={() => {
                  setSelectedSegmentId(segment.id);
                  if (topPains.length > 0) {
                    setSelectedPainId(topPains[0].pain_id);
                  }
                }}
                className={cn(
                  "relative flex flex-col items-start gap-1 px-4 py-3 rounded-lg transition-all min-w-[180px]",
                  isSelected
                    ? "bg-linear-to-br from-purple-50 to-violet-50 border-2 border-purple-300 shadow-sm"
                    : "bg-slate-50 border-2 border-transparent hover:bg-slate-100"
                )}
              >
                {/* Status indicator */}
                <div className="absolute top-2 right-2">
                  {isComplete ? (
                    <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shadow-sm">
                      <Check className="w-3.5 h-3.5 text-white" />
                    </div>
                  ) : hasGenerated ? (
                    <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center shadow-sm">
                      <span className="text-xs font-bold text-white">{approvedCount}</span>
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center">
                      <span className="text-xs font-medium text-slate-500">0</span>
                    </div>
                  )}
                </div>

                {/* Segment name */}
                <span className={cn(
                  "text-sm font-semibold pr-8 line-clamp-1",
                  isSelected ? "text-purple-900" : "text-slate-700"
                )}>
                  {segment.name}
                </span>

                {/* Stats row */}
                <div className="flex items-center gap-2 text-xs">
                  <span className={cn(
                    "px-2 py-0.5 rounded-full font-medium",
                    topPains.length > 0
                      ? "bg-purple-100 text-purple-700"
                      : "bg-slate-200 text-slate-500"
                  )}>
                    {topPains.length} TOP pains
                  </span>
                  {topPains.length > 0 && (
                    <span className="text-slate-400">
                      {approvedCount}/{topPains.length}
                    </span>
                  )}
                </div>

                {/* Progress bar */}
                {topPains.length > 0 && (
                  <div className="w-full h-1.5 bg-slate-200 rounded-full mt-1 overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-300",
                        isComplete ? "bg-emerald-500" : "bg-purple-500"
                      )}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-12 gap-6">
        {/* Pain Selector Sidebar */}
        <div className="col-span-3">
          <div className="bg-white border border-slate-200 rounded-lg p-4 sticky top-4">
            <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <Target className="w-4 h-4 text-purple-500" />
              TOP Pains
            </h3>
            <div className="space-y-2">
              {selectedSegmentData?.topPains.map((pain, idx) => {
                const isSelected = pain.pain_id === selectedPainId;
                // We'll determine status by checking the draft later
                const hasGenerated = true; // Simplified - would need actual check

                return (
                  <button
                    key={pain.pain_id}
                    onClick={() => setSelectedPainId(pain.pain_id)}
                    className={cn(
                      "w-full flex items-start gap-3 p-3 rounded-lg border text-left transition-all",
                      isSelected
                        ? "bg-purple-50 border-purple-200"
                        : "bg-slate-50 border-slate-200 hover:bg-white"
                    )}
                  >
                    <span className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0",
                      isSelected
                        ? "bg-purple-500 text-white"
                        : "bg-slate-200 text-slate-600"
                    )}>
                      {idx + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className={cn(
                        "text-sm font-medium truncate",
                        isSelected ? "text-purple-900" : "text-slate-700"
                      )}>
                        {pain.name}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Impact: {pain.impact_score}/10
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {selectedSegmentData?.topPains.length === 0 && (
              <p className="text-sm text-slate-500 text-center py-4">
                No TOP pains found for this segment
              </p>
            )}
          </div>
        </div>

        {/* Draft Content */}
        <div className="col-span-9">
          <AnimatePresence mode="wait">
            {isGenerating ? (
              <GeneratingState key="generating" />
            ) : displayDraft ? (
              <motion.div
                key={`draft-${displayDraft.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
                ref={() => {
                  console.log('[canvas-extended] Rendering displayDraft:', {
                    id: displayDraft.id,
                    hasCustomerJourney: !!displayDraft.customer_journey,
                    hasEmotionalMap: !!displayDraft.emotional_map,
                    hasNarrativeAngles: !!displayDraft.narrative_angles,
                    hasMessagingFramework: !!displayDraft.messaging_framework,
                    hasVoiceAndTone: !!displayDraft.voice_and_tone,
                    keys: Object.keys(displayDraft),
                  });
                }}
              >
                {/* Translation banner */}
                {isTranslating && language !== 'en' && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-amber-600 animate-spin" />
                    <span className="text-amber-700 text-sm">Translating...</span>
                  </div>
                )}

                {/* Pain Header */}
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200 rounded-lg">
                  <div>
                    <h2 className="font-semibold text-purple-900">{selectedPain?.name}</h2>
                    <p className="text-sm text-purple-600">Extended Analysis V2</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleGenerate()}
                      disabled={isGenerating}
                      className="gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Regenerate
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleApprove}
                      disabled={isApproving}
                      isLoading={isApproving}
                      className="gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600"
                    >
                      <Check className="w-4 h-4" />
                      Approve
                    </Button>
                  </div>
                </div>

                {/* 5 Sections */}
                <CustomerJourneySection journey={displayDraft.customer_journey} />
                <EmotionalMapSection emotionalMap={displayDraft.emotional_map} />
                <NarrativeAnglesSection angles={displayDraft.narrative_angles} />
                <MessagingFrameworkSection framework={displayDraft.messaging_framework} />
                <VoiceAndToneSection voiceAndTone={displayDraft.voice_and_tone} />
              </motion.div>
            ) : selectedPain ? (
              <EmptyState
                key="empty"
                painName={selectedPain.name}
                onGenerate={() => handleGenerate()}
                isGenerating={isGenerating}
              />
            ) : (
              <div className="flex items-center justify-center py-24 text-slate-500">
                Select a pain to view or generate analysis
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function GeneratingState() {
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center py-24"
    >
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-violet-500 rounded-full blur-xl opacity-30 animate-pulse" />
        <div className="relative w-20 h-20 bg-gradient-to-br from-purple-500 to-violet-600 rounded-full flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-white animate-pulse" />
        </div>
      </div>

      <h3 className="mt-8 text-xl font-semibold text-slate-900">
        Generating Extended Analysis V2
      </h3>
      <p className="mt-2 text-slate-500">
        Building customer journey, emotional map, narrative angles, and messaging framework...
      </p>
      <p className="mt-4 text-sm text-slate-400">
        {Math.floor(elapsedTime / 60)}:{String(elapsedTime % 60).padStart(2, '0')}
      </p>
    </motion.div>
  );
}

function EmptyState({
  painName,
  onGenerate,
  isGenerating,
}: {
  painName: string;
  onGenerate: () => void;
  isGenerating: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
    >
      <Card className="border-2 border-dashed border-slate-200 bg-slate-50/50">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mb-6">
            <Sparkles className="w-8 h-8 text-purple-500" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            Generate Analysis for "{painName}"
          </h3>
          <p className="text-slate-500 text-center max-w-md mb-6">
            Create a comprehensive psychological profile with customer journey mapping, emotional intensity analysis, narrative angles, and actionable messaging framework.
          </p>
          <Button
            onClick={onGenerate}
            disabled={isGenerating}
            isLoading={isGenerating}
            className="gap-2 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700"
          >
            <Sparkles className="w-4 h-4" />
            Generate Extended Analysis
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
