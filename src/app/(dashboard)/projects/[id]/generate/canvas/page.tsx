"use client";

import { use, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  DraftCard,
  DraftSection,
} from "@/components/generation/GenerationPage";
import { CanvasDraft, EmotionalAspect, BehavioralPattern, BuyingSignal, PainInitial, Segment } from "@/types";
import { Palette, Heart, Activity, ShoppingCart, ChevronDown, ChevronUp, Pencil, Trash2, Check, X, Star, Sparkles, Loader2, AlertCircle, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { EditableField } from "@/components/generation/EditableField";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { useTranslation } from "@/lib/hooks/useTranslation";

interface TopPain {
  id: string;
  name: string;
  description: string;
  segment_id: string;
  impact_score: number;
  ranking_reasoning: string;
  has_canvas: boolean;
}

// Store pains globally for CanvasDraftView
let globalPains: PainInitial[] = [];

export default function CanvasPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = use(params);
  const router = useRouter();

  // State
  const [segments, setSegments] = useState<Segment[]>([]);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);
  const [topPains, setTopPains] = useState<TopPain[]>([]);
  const [selectedPainId, setSelectedPainId] = useState<string | null>(null);
  const [canvasDraft, setCanvasDraft] = useState<CanvasDraft | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingPainId, setGeneratingPainId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [approvedDraftIds, setApprovedDraftIds] = useState<Set<string>>(new Set());

  // Language translation
  const { language, setLanguage } = useLanguage();
  const { translatedContent: translatedTopPains, isTranslating: isTranslatingPains } = useTranslation({
    content: topPains,
    language,
    enabled: topPains.length > 0,
  });
  const { translatedContent: translatedCanvas, isTranslating: isTranslatingCanvas } = useTranslation({
    content: canvasDraft,
    language,
    enabled: !!canvasDraft,
  });

  // Use translated content if available
  const displayTopPains = (translatedTopPains as TopPain[]) || topPains;
  const displayCanvasDraft = (translatedCanvas as CanvasDraft) || canvasDraft;
  const isTranslating = isTranslatingPains || isTranslatingCanvas;

  // Load segments
  useEffect(() => {
    const fetchSegments = async () => {
      try {
        const res = await fetch(`/api/segments?projectId=${projectId}&stepType=canvas`);
        const data = await res.json();
        if (data.success && data.segments) {
          setSegments(data.segments);
          if (data.segments.length > 0 && !selectedSegmentId) {
            setSelectedSegmentId(data.segments[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to fetch segments:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSegments();
  }, [projectId]);

  // Load TOP pains when segment changes
  useEffect(() => {
    if (!selectedSegmentId) return;

    const fetchTopPains = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/top-pains?projectId=${projectId}&segmentId=${selectedSegmentId}`);
        const data = await res.json();
        if (data.success && data.topPains) {
          setTopPains(data.topPains);
          // Auto-select first pain with canvas, or first pain
          const firstWithCanvas = data.topPains.find((p: TopPain) => p.has_canvas);
          setSelectedPainId(firstWithCanvas?.id || data.topPains[0]?.id || null);
        }
      } catch (err) {
        console.error("Failed to fetch top pains:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTopPains();
  }, [projectId, selectedSegmentId]);

  // Load canvas draft when pain changes
  useEffect(() => {
    if (!selectedPainId || !selectedSegmentId) {
      setCanvasDraft(null);
      return;
    }

    const fetchCanvasDraft = async () => {
      try {
        const res = await fetch(`/api/drafts?projectId=${projectId}&table=canvas_drafts&segmentId=${selectedSegmentId}`);
        const data = await res.json();
        if (data.success && data.drafts) {
          const draft = data.drafts.find((d: CanvasDraft) => d.pain_id === selectedPainId);
          setCanvasDraft(draft || null);
        }
      } catch (err) {
        console.error("Failed to fetch canvas draft:", err);
      }
    };
    fetchCanvasDraft();
  }, [projectId, selectedSegmentId, selectedPainId]);

  // Load all pains for globalPains (for CanvasDraftView)
  useEffect(() => {
    const fetchAllPains = async () => {
      try {
        const res = await fetch(`/api/pains?projectId=${projectId}`);
        const data = await res.json();
        if (data.success && data.pains) {
          globalPains = data.pains;
        }
      } catch (err) {
        console.error("Failed to fetch pains:", err);
      }
    };
    fetchAllPains();
  }, [projectId]);

  // Generate canvas for a specific pain
  const handleGenerateForPain = async (painId: string) => {
    try {
      setIsGenerating(true);
      setGeneratingPainId(painId);
      setError(null);

      const res = await fetch("/api/generate/canvas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          segmentId: selectedSegmentId,
          painId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Generation failed");
      }

      // Refresh top pains to update has_canvas status
      const topPainsRes = await fetch(`/api/top-pains?projectId=${projectId}&segmentId=${selectedSegmentId}`);
      const topPainsData = await topPainsRes.json();
      if (topPainsData.success) {
        setTopPains(topPainsData.topPains);
      }

      // Select the generated pain and load its draft
      setSelectedPainId(painId);
      if (data.drafts && data.drafts.length > 0) {
        setCanvasDraft(data.drafts[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setIsGenerating(false);
      setGeneratingPainId(null);
    }
  };

  // Generate canvas for all pains without canvas
  const handleGenerateAll = async () => {
    const painsWithoutCanvas = topPains.filter(p => !p.has_canvas);
    for (const pain of painsWithoutCanvas) {
      await handleGenerateForPain(pain.id);
    }
  };

  const handleEditDraft = async (updates: Partial<CanvasDraft>) => {
    if (!canvasDraft) return;

    try {
      const res = await fetch("/api/drafts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          table: "canvas_drafts",
          id: canvasDraft.id,
          updates,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setCanvasDraft({ ...canvasDraft, ...updates });
      }
    } catch (err) {
      console.error("Failed to save edit:", err);
    }
  };

  // Approve all canvas drafts for current segment and continue to extended canvas
  const handleApproveAllAndContinue = async () => {
    if (!selectedSegmentId) return;

    try {
      setIsApproving(true);
      setError(null);

      // Fetch all drafts for this segment
      const draftsRes = await fetch(`/api/drafts?projectId=${projectId}&table=canvas_drafts&segmentId=${selectedSegmentId}`);
      const draftsData = await draftsRes.json();

      if (!draftsData.success || !draftsData.drafts || draftsData.drafts.length === 0) {
        throw new Error("No canvas drafts to approve for this segment");
      }

      const draftIds = draftsData.drafts.map((d: CanvasDraft) => d.id);

      // Call approve endpoint
      const res = await fetch("/api/approve/canvas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          segmentId: selectedSegmentId,
          draftIds,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Failed to approve canvas");
      }

      // Mark as approved
      setApprovedDraftIds(prev => new Set([...prev, ...draftIds]));

      // Navigate to next step
      router.push(`/projects/${projectId}/generate/canvas-extended`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve canvas");
    } finally {
      setIsApproving(false);
    }
  };

  // Approve all canvas for ALL segments at once
  const handleApproveAll = async () => {
    try {
      setIsApproving(true);
      setError(null);

      // Get all segments and approve each
      for (const segment of segments) {
        const draftsRes = await fetch(`/api/drafts?projectId=${projectId}&table=canvas_drafts&segmentId=${segment.id}`);
        const draftsData = await draftsRes.json();

        if (draftsData.success && draftsData.drafts && draftsData.drafts.length > 0) {
          const draftIds = draftsData.drafts.map((d: CanvasDraft) => d.id);

          await fetch("/api/approve/canvas", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              projectId,
              segmentId: segment.id,
              draftIds,
            }),
          });

          setApprovedDraftIds(prev => new Set([...prev, ...draftIds]));
        }
      }

      // Navigate to next step
      router.push(`/projects/${projectId}/generate/canvas-extended`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve canvas");
    } finally {
      setIsApproving(false);
    }
  };

  const selectedSegment = segments.find(s => s.id === selectedSegmentId);
  const selectedPain = displayTopPains.find(p => p.id === selectedPainId);
  const painsWithCanvas = displayTopPains.filter(p => p.has_canvas).length;
  const painsWithoutCanvas = topPains.filter(p => !p.has_canvas).length;

  return (
    <div className="space-y-6">
      {/* Header - Title and Description */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start gap-4"
      >
        <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl text-white shadow-lg shadow-purple-500/20">
          <Palette className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Pain Canvas
          </h1>
          <p className="mt-1 text-slate-500">
            Deep analysis of TOP pain points. Select a segment, then generate canvas for each TOP pain.
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
          {painsWithoutCanvas > 0 && (
            <Button
              onClick={handleGenerateAll}
              disabled={isGenerating || isApproving}
              isLoading={isGenerating}
              className="gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
            >
              <Sparkles className="w-4 h-4" />
              Generate All ({painsWithoutCanvas})
            </Button>
          )}
        </div>
      </div>

      {/* Error */}
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

      {/* Segment Selector */}
      <div className="flex gap-2 flex-wrap">
        {segments.map((segment) => (
          <button
            key={segment.id}
            onClick={() => setSelectedSegmentId(segment.id)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all",
              selectedSegmentId === segment.id
                ? "bg-purple-100 text-purple-700 shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            {segment.name}
          </button>
        ))}
      </div>

      {/* Main Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
        </div>
      ) : displayTopPains.length === 0 ? (
        <Card className="border-2 border-dashed border-slate-200 bg-slate-50/50">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mb-6">
              <Star className="w-8 h-8 text-purple-500" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              No TOP Pains for This Segment
            </h3>
            <p className="text-slate-500 text-center max-w-md">
              Complete Pain Points Ranking first to select TOP pains for this segment.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-12 gap-6">
          {/* TOP Pains List */}
          <div className="col-span-4">
            <Card>
              <div className="p-4 border-b border-slate-100">
                <h3 className="font-semibold text-slate-900">TOP Pains</h3>
                <p className="text-xs text-slate-500 mt-1">
                  {painsWithCanvas}/{displayTopPains.length} with canvas
                </p>
              </div>
              <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
                {displayTopPains.map((pain) => (
                  <div
                    key={pain.id}
                    onClick={() => setSelectedPainId(pain.id)}
                    className={cn(
                      "w-full p-4 text-left transition-all hover:bg-slate-50 cursor-pointer",
                      selectedPainId === pain.id && "bg-purple-50 border-l-4 border-purple-500"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Star className={cn(
                            "w-4 h-4 flex-shrink-0",
                            pain.has_canvas ? "text-amber-500 fill-amber-500" : "text-slate-300"
                          )} />
                          <span className="font-medium text-slate-900 truncate">
                            {pain.name}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                          {pain.description}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={cn(
                          "px-2 py-0.5 text-xs font-medium rounded-full",
                          pain.impact_score >= 8 ? "bg-rose-100 text-rose-700" :
                          pain.impact_score >= 6 ? "bg-amber-100 text-amber-700" :
                          "bg-slate-100 text-slate-600"
                        )}>
                          {pain.impact_score}
                        </span>
                        {pain.has_canvas ? (
                          <Check className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleGenerateForPain(pain.id);
                            }}
                            disabled={isGenerating}
                            className="p-1 text-purple-600 hover:bg-purple-100 rounded"
                          >
                            {generatingPainId === pain.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Sparkles className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Canvas Content */}
          <div className="col-span-8">
            {selectedPain && !selectedPain.has_canvas ? (
              <Card className="border-2 border-dashed border-purple-200 bg-purple-50/50">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mb-6">
                    <Palette className="w-8 h-8 text-purple-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    Generate Canvas for "{selectedPain.name}"
                  </h3>
                  <p className="text-slate-500 text-center max-w-md mb-6">
                    Create deep analysis with emotional aspects, behavioral patterns, and buying signals.
                  </p>
                  <Button
                    onClick={() => handleGenerateForPain(selectedPain.id)}
                    disabled={isGenerating}
                    isLoading={generatingPainId === selectedPain.id}
                    className="gap-2 bg-gradient-to-r from-purple-600 to-indigo-600"
                  >
                    <Sparkles className="w-4 h-4" />
                    Generate Canvas
                  </Button>
                </CardContent>
              </Card>
            ) : displayCanvasDraft ? (
              <CanvasDraftView draft={displayCanvasDraft} onEdit={handleEditDraft} pains={globalPains} projectId={projectId} segmentId={selectedSegmentId || undefined} />
            ) : (
              <div className="flex items-center justify-center py-24">
                <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between items-center pt-6 border-t border-slate-200">
        <Button
          variant="outline"
          onClick={() => router.push(`/projects/${projectId}/generate/pains-ranking`)}
        >
          Back to Pain Ranking
        </Button>
        {/* Main action button - only show when all pains have canvas */}
        {painsWithCanvas > 0 && painsWithoutCanvas === 0 ? (
          <Button
            onClick={handleApproveAll}
            disabled={isApproving || isGenerating}
            isLoading={isApproving}
            className="gap-2 bg-linear-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
          >
            <Check className="w-4 h-4" />
            Approve All & Continue
            <ChevronRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            disabled
            variant="outline"
            className="gap-2"
          >
            Generate all canvas first
            <ChevronRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

function CanvasDraftView({
  draft,
  onEdit,
  pains = [],
  projectId,
  segmentId,
}: {
  draft: CanvasDraft;
  onEdit: (updates: Partial<CanvasDraft>) => void;
  pains?: PainInitial[];
  projectId?: string;
  segmentId?: string;
}) {
  const [expandedSections, setExpandedSections] = useState<string[]>(["emotional", "behavioral", "buying"]);

  // Find the pain name for this canvas
  const pain = pains.find(p => p.id === draft.pain_id);
  const painName = pain?.name || "Unknown Pain";

  const toggleSection = (section: string) => {
    setExpandedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const handleEditEmotional = (index: number, updated: EmotionalAspect) => {
    const newAspects = [...(draft.emotional_aspects || [])];
    newAspects[index] = updated;
    onEdit({ emotional_aspects: newAspects });
  };

  const handleDeleteEmotional = (index: number) => {
    const newAspects = (draft.emotional_aspects || []).filter((_, i) => i !== index);
    onEdit({ emotional_aspects: newAspects });
  };

  const handleEditBehavioral = (index: number, updated: BehavioralPattern) => {
    const newPatterns = [...(draft.behavioral_patterns || [])];
    newPatterns[index] = updated;
    onEdit({ behavioral_patterns: newPatterns });
  };

  const handleDeleteBehavioral = (index: number) => {
    const newPatterns = (draft.behavioral_patterns || []).filter((_, i) => i !== index);
    onEdit({ behavioral_patterns: newPatterns });
  };

  const handleEditBuying = (index: number, updated: BuyingSignal) => {
    const newSignals = [...(draft.buying_signals || [])];
    newSignals[index] = updated;
    onEdit({ buying_signals: newSignals });
  };

  const handleDeleteBuying = (index: number) => {
    const newSignals = (draft.buying_signals || []).filter((_, i) => i !== index);
    onEdit({ buying_signals: newSignals });
  };

  return (
    <div className="space-y-6">
      {/* Pain Header - Shows which pain this canvas is for */}
      <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Star className="w-5 h-5 text-purple-600 fill-purple-300" />
          </div>
          <div>
            <p className="text-xs font-medium text-purple-600 uppercase tracking-wider">Canvas for Pain Point</p>
            <h3 className="text-lg font-semibold text-slate-900">{painName}</h3>
          </div>
          <Badge className="ml-auto bg-purple-100 text-purple-700">
            TOP Pain
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <OverviewCard
          icon={<Heart className="w-5 h-5" />}
          label="Emotional Aspects"
          count={draft.emotional_aspects?.length || 0}
          color="rose"
        />
        <OverviewCard
          icon={<Activity className="w-5 h-5" />}
          label="Behavioral Patterns"
          count={draft.behavioral_patterns?.length || 0}
          color="purple"
        />
        <OverviewCard
          icon={<ShoppingCart className="w-5 h-5" />}
          label="Buying Signals"
          count={draft.buying_signals?.length || 0}
          color="emerald"
        />
      </div>

      <CollapsibleCard
        title="Emotional Aspects"
        icon={<Heart className="w-5 h-5" />}
        color="rose"
        isExpanded={expandedSections.includes("emotional")}
        onToggle={() => toggleSection("emotional")}
        count={draft.emotional_aspects?.length || 0}
      >
        <div className="space-y-4">
          {draft.emotional_aspects?.map((aspect, index) => (
            <EditableEmotionalAspectCard
              key={index}
              aspect={aspect}
              index={index}
              onEdit={(updated) => handleEditEmotional(index, updated)}
              onDelete={() => handleDeleteEmotional(index)}
              projectId={projectId}
              segmentId={segmentId}
            />
          ))}
        </div>
      </CollapsibleCard>

      <CollapsibleCard
        title="Behavioral Patterns"
        icon={<Activity className="w-5 h-5" />}
        color="purple"
        isExpanded={expandedSections.includes("behavioral")}
        onToggle={() => toggleSection("behavioral")}
        count={draft.behavioral_patterns?.length || 0}
      >
        <div className="space-y-4">
          {draft.behavioral_patterns?.map((pattern, index) => (
            <EditableBehavioralPatternCard
              key={index}
              pattern={pattern}
              index={index}
              onEdit={(updated) => handleEditBehavioral(index, updated)}
              onDelete={() => handleDeleteBehavioral(index)}
              projectId={projectId}
              segmentId={segmentId}
            />
          ))}
        </div>
      </CollapsibleCard>

      <CollapsibleCard
        title="Buying Signals"
        icon={<ShoppingCart className="w-5 h-5" />}
        color="emerald"
        isExpanded={expandedSections.includes("buying")}
        onToggle={() => toggleSection("buying")}
        count={draft.buying_signals?.length || 0}
      >
        <div className="space-y-4">
          {draft.buying_signals?.map((signal, index) => (
            <EditableBuyingSignalCard
              key={index}
              signal={signal}
              index={index}
              onEdit={(updated) => handleEditBuying(index, updated)}
              onDelete={() => handleDeleteBuying(index)}
              projectId={projectId}
              segmentId={segmentId}
            />
          ))}
        </div>
      </CollapsibleCard>
    </div>
  );
}

function OverviewCard({
  icon,
  label,
  count,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
  color: "rose" | "purple" | "emerald";
}) {
  const colorClasses = {
    rose: "bg-rose-50 text-rose-600 border-rose-100",
    purple: "bg-purple-50 text-purple-600 border-purple-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
  };

  return (
    <div className={`p-5 rounded-xl border ${colorClasses[color]}`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-2xl font-bold">{count}</span>
      </div>
      <span className="text-xs font-medium uppercase tracking-wider opacity-80">
        {label}
      </span>
    </div>
  );
}

function CollapsibleCard({
  title,
  icon,
  color,
  isExpanded,
  onToggle,
  count,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  color: "rose" | "purple" | "emerald";
  isExpanded: boolean;
  onToggle: () => void;
  count: number;
  children: React.ReactNode;
}) {
  const colorClasses = {
    rose: "bg-rose-500/10 text-rose-600",
    purple: "bg-purple-500/10 text-purple-600",
    emerald: "bg-emerald-500/10 text-emerald-600",
  };

  return (
    <DraftCard>
      <button
        onClick={onToggle}
        className="w-full p-5 flex items-center justify-between hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-lg", colorClasses[color])}>
            {icon}
          </div>
          <h3 className="font-semibold text-slate-900">{title}</h3>
          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-medium rounded-full">
            {count}
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-slate-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-400" />
        )}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-5 pb-5 border-t border-slate-100 pt-5">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </DraftCard>
  );
}

function EditableEmotionalAspectCard({
  aspect,
  index,
  onEdit,
  onDelete,
  projectId,
  segmentId,
}: {
  aspect: EmotionalAspect;
  index: number;
  onEdit: (updated: EmotionalAspect) => void;
  onDelete: () => void;
  projectId?: string;
  segmentId?: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [emotion, setEmotion] = useState(aspect.emotion);
  const [intensity, setIntensity] = useState(aspect.intensity);
  const [description, setDescription] = useState(aspect.description);
  const [selfImageImpact, setSelfImageImpact] = useState(aspect.self_image_impact);

  const handleRegenerate = async () => {
    if (!projectId) return;

    try {
      setIsRegenerating(true);
      const res = await fetch("/api/generate/field", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          segmentId,
          fieldName: "description",
          fieldType: "emotional_aspect",
          currentValue: description,
          context: `Emotion: ${emotion}. Intensity: ${intensity}. Self-image impact: ${selfImageImpact}`,
        }),
      });

      const data = await res.json();
      if (data.success && data.value) {
        setDescription(data.value);
        onEdit({ ...aspect, description: data.value });
      }
    } catch (err) {
      console.error("Failed to regenerate:", err);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleSave = () => {
    onEdit({
      ...aspect,
      emotion,
      intensity,
      description,
      self_image_impact: selfImageImpact,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEmotion(aspect.emotion);
    setIntensity(aspect.intensity);
    setDescription(aspect.description);
    setSelfImageImpact(aspect.self_image_impact);
    setIsEditing(false);
  };

  return (
    <div className="group relative p-5 bg-linear-to-br from-rose-50 to-pink-50 border border-rose-100 rounded-xl">
      {!isEditing && (
        <div className="absolute -right-2 -top-2 flex gap-1">
          <button
            onClick={() => setIsEditing(true)}
            className="p-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-blue-100 hover:text-blue-600 border border-slate-200 transition-colors"
            title="Edit"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleRegenerate}
            disabled={isRegenerating}
            className="p-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-purple-100 hover:text-purple-600 border border-slate-200 transition-colors disabled:opacity-50"
            title="Regenerate with AI"
          >
            {isRegenerating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-red-100 hover:text-red-600 border border-slate-200 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {isEditing ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Emotion</label>
              <input
                type="text"
                value={emotion}
                onChange={(e) => setEmotion(e.target.value)}
                className="w-full mt-1 p-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Intensity</label>
              <input
                type="text"
                value={intensity}
                onChange={(e) => setIntensity(e.target.value)}
                className="w-full mt-1 p-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full mt-1 p-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              rows={2}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Self-Image Impact</label>
            <textarea
              value={selfImageImpact}
              onChange={(e) => setSelfImageImpact(e.target.value)}
              className="w-full mt-1 p-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              rows={2}
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
        <>
          <div className="flex items-start justify-between mb-3">
            <h4 className="font-semibold text-slate-900">{aspect.emotion}</h4>
            <span className="px-2 py-1 bg-rose-100 text-rose-700 text-xs font-medium rounded-full">
              {aspect.intensity}
            </span>
          </div>
          <p className="text-sm text-slate-700 mb-4">{aspect.description}</p>
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-rose-100">
            <div>
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Self-Image Impact
              </span>
              <p className="mt-1 text-sm text-slate-700">{aspect.self_image_impact}</p>
            </div>
            <div>
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Connected Fears
              </span>
              <div className="mt-1 flex flex-wrap gap-1">
                {aspect.connected_fears?.map((fear, i) => (
                  <span key={i} className="px-2 py-0.5 bg-rose-100 text-rose-700 text-xs rounded-full">
                    {fear}
                  </span>
                ))}
              </div>
            </div>
          </div>
          {aspect.blocked_desires && aspect.blocked_desires.length > 0 && (
            <div className="mt-4 pt-4 border-t border-rose-100">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Blocked Desires
              </span>
              <div className="mt-1 flex flex-wrap gap-1">
                {aspect.blocked_desires.map((desire, i) => (
                  <span key={i} className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">
                    {desire}
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function EditableBehavioralPatternCard({
  pattern,
  index,
  onEdit,
  onDelete,
  projectId,
  segmentId,
}: {
  pattern: BehavioralPattern;
  index: number;
  onEdit: (updated: BehavioralPattern) => void;
  onDelete: () => void;
  projectId?: string;
  segmentId?: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [patternName, setPatternName] = useState(pattern.pattern);
  const [frequency, setFrequency] = useState(pattern.frequency);
  const [description, setDescription] = useState(pattern.description);
  const [copingMechanism, setCopingMechanism] = useState(pattern.coping_mechanism);
  const [avoidance, setAvoidance] = useState(pattern.avoidance);

  const handleRegenerate = async () => {
    if (!projectId) return;

    try {
      setIsRegenerating(true);
      const res = await fetch("/api/generate/field", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          segmentId,
          fieldName: "description",
          fieldType: "behavioral_pattern",
          currentValue: description,
          context: `Pattern: ${patternName}. Frequency: ${frequency}. Coping: ${copingMechanism}. Avoidance: ${avoidance}`,
        }),
      });

      const data = await res.json();
      if (data.success && data.value) {
        setDescription(data.value);
        onEdit({ ...pattern, description: data.value });
      }
    } catch (err) {
      console.error("Failed to regenerate:", err);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleSave = () => {
    onEdit({
      ...pattern,
      pattern: patternName,
      frequency,
      description,
      coping_mechanism: copingMechanism,
      avoidance,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setPatternName(pattern.pattern);
    setFrequency(pattern.frequency);
    setDescription(pattern.description);
    setCopingMechanism(pattern.coping_mechanism);
    setAvoidance(pattern.avoidance);
    setIsEditing(false);
  };

  return (
    <div className="group relative p-5 bg-linear-to-br from-purple-50 to-violet-50 border border-purple-100 rounded-xl">
      {!isEditing && (
        <div className="absolute -right-2 -top-2 flex gap-1">
          <button
            onClick={() => setIsEditing(true)}
            className="p-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-blue-100 hover:text-blue-600 border border-slate-200 transition-colors"
            title="Edit"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleRegenerate}
            disabled={isRegenerating}
            className="p-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-purple-100 hover:text-purple-600 border border-slate-200 transition-colors disabled:opacity-50"
            title="Regenerate with AI"
          >
            {isRegenerating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-red-100 hover:text-red-600 border border-slate-200 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {isEditing ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Pattern</label>
              <input
                type="text"
                value={patternName}
                onChange={(e) => setPatternName(e.target.value)}
                className="w-full mt-1 p-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Frequency</label>
              <input
                type="text"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="w-full mt-1 p-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full mt-1 p-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Coping Mechanism</label>
              <textarea
                value={copingMechanism}
                onChange={(e) => setCopingMechanism(e.target.value)}
                className="w-full mt-1 p-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                rows={2}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Avoidance</label>
              <textarea
                value={avoidance}
                onChange={(e) => setAvoidance(e.target.value)}
                className="w-full mt-1 p-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                rows={2}
              />
            </div>
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
        <>
          <div className="flex items-start justify-between mb-3">
            <h4 className="font-semibold text-slate-900">{pattern.pattern}</h4>
            <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
              {pattern.frequency}
            </span>
          </div>
          <p className="text-sm text-slate-700 mb-4">{pattern.description}</p>
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-purple-100">
            <div>
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Coping Mechanism
              </span>
              <p className="mt-1 text-sm text-slate-700">{pattern.coping_mechanism}</p>
            </div>
            <div>
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Avoidance Behavior
              </span>
              <p className="mt-1 text-sm text-slate-700">{pattern.avoidance}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function EditableBuyingSignalCard({
  signal,
  index,
  onEdit,
  onDelete,
  projectId,
  segmentId,
}: {
  signal: BuyingSignal;
  index: number;
  onEdit: (updated: BuyingSignal) => void;
  onDelete: () => void;
  projectId?: string;
  segmentId?: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [signalName, setSignalName] = useState(signal.signal);
  const [readinessLevel, setReadinessLevel] = useState(signal.readiness_level);
  const [messagingAngle, setMessagingAngle] = useState(signal.messaging_angle);
  const [proofNeeded, setProofNeeded] = useState(signal.proof_needed);

  const handleRegenerate = async () => {
    if (!projectId) return;

    try {
      setIsRegenerating(true);
      const res = await fetch("/api/generate/field", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          segmentId,
          fieldName: "messaging_angle",
          fieldType: "buying_signal",
          currentValue: messagingAngle,
          context: `Signal: ${signalName}. Readiness: ${readinessLevel}. Proof needed: ${proofNeeded}`,
        }),
      });

      const data = await res.json();
      if (data.success && data.value) {
        setMessagingAngle(data.value);
        onEdit({ ...signal, messaging_angle: data.value });
      }
    } catch (err) {
      console.error("Failed to regenerate:", err);
    } finally {
      setIsRegenerating(false);
    }
  };

  const readinessColors = {
    high: "bg-emerald-100 text-emerald-700",
    medium: "bg-amber-100 text-amber-700",
    low: "bg-slate-100 text-slate-700",
  };

  const handleSave = () => {
    onEdit({
      ...signal,
      signal: signalName,
      readiness_level: readinessLevel,
      messaging_angle: messagingAngle,
      proof_needed: proofNeeded,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setSignalName(signal.signal);
    setReadinessLevel(signal.readiness_level);
    setMessagingAngle(signal.messaging_angle);
    setProofNeeded(signal.proof_needed);
    setIsEditing(false);
  };

  const readinessLevelKey = signal.readiness_level?.toLowerCase() as keyof typeof readinessColors;

  return (
    <div className="group relative p-5 bg-linear-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-xl">
      {!isEditing && (
        <div className="absolute -right-2 -top-2 flex gap-1">
          <button
            onClick={() => setIsEditing(true)}
            className="p-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-blue-100 hover:text-blue-600 border border-slate-200 transition-colors"
            title="Edit"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleRegenerate}
            disabled={isRegenerating}
            className="p-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-purple-100 hover:text-purple-600 border border-slate-200 transition-colors disabled:opacity-50"
            title="Regenerate with AI"
          >
            {isRegenerating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-red-100 hover:text-red-600 border border-slate-200 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {isEditing ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Signal</label>
              <input
                type="text"
                value={signalName}
                onChange={(e) => setSignalName(e.target.value)}
                className="w-full mt-1 p-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Readiness Level</label>
              <select
                value={readinessLevel}
                onChange={(e) => setReadinessLevel(e.target.value)}
                className="w-full mt-1 p-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Messaging Angle</label>
            <textarea
              value={messagingAngle}
              onChange={(e) => setMessagingAngle(e.target.value)}
              className="w-full mt-1 p-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              rows={2}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Proof Needed</label>
            <textarea
              value={proofNeeded}
              onChange={(e) => setProofNeeded(e.target.value)}
              className="w-full mt-1 p-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              rows={2}
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
        <>
          <div className="flex items-start justify-between mb-3">
            <h4 className="font-semibold text-slate-900">{signal.signal}</h4>
            <span className={cn(
              "px-2 py-1 text-xs font-medium rounded-full",
              readinessColors[readinessLevelKey] || readinessColors.medium
            )}>
              {signal.readiness_level}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Messaging Angle
              </span>
              <p className="mt-1 text-sm text-slate-700">{signal.messaging_angle}</p>
            </div>
            <div>
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Proof Needed
              </span>
              <p className="mt-1 text-sm text-slate-700">{signal.proof_needed}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
