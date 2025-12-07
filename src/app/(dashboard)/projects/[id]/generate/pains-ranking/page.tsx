"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PainRankingDraft, PainInitial, Segment } from "@/types";
import { BarChart3, Trophy, Star, TrendingUp, Pencil, Trash2, Check, X, Loader2, Sparkles, RefreshCw, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { useTranslation } from "@/lib/hooks/useTranslation";

// Ranking draft as stored in DB - each ranking is a separate row
interface RankingDraftRow {
  id: string;
  project_id: string;
  pain_id: string;
  impact_score: number;
  is_top_pain: boolean;
  ranking_reasoning: string;
  version: number;
  created_at: string;
}

export default function PainsRankingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = use(params);
  const router = useRouter();

  // State
  const [rankings, setRankings] = useState<RankingDraftRow[]>([]);
  const [pains, setPains] = useState<PainInitial[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isApproved, setIsApproved] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  // Language translation
  const { language, setLanguage } = useLanguage();
  const { translatedContent, isTranslating } = useTranslation({
    content: rankings,
    language,
    enabled: rankings.length > 0,
  });

  // Use translated rankings if available (ensure it's an array)
  const displayRankings = Array.isArray(translatedContent) ? translatedContent as RankingDraftRow[] : rankings;

  // Filter out invalid rankings (no pain_id or pain not found) and sort by impact score
  const validRankings = displayRankings.filter(r => {
    if (!r.pain_id) return false;
    // Check if the pain actually exists in our loaded pains
    const painExists = pains.some(p => p.id === r.pain_id);
    return painExists;
  });

  const sortedRankings = [...validRankings].sort((a, b) => (b.impact_score ?? 0) - (a.impact_score ?? 0));
  const topPains = sortedRankings.filter(r => r.is_top_pain);
  const otherPains = sortedRankings.filter(r => !r.is_top_pain);

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, [projectId]);

  const fetchData = async () => {
    try {
      setIsLoading(true);

      // Fetch rankings
      const rankingsRes = await fetch(`/api/drafts?projectId=${projectId}&table=pains_ranking_drafts`);
      const rankingsData = await rankingsRes.json();

      if (rankingsData.success && rankingsData.drafts) {
        setRankings(rankingsData.drafts);
      }

      // Check if approved
      const approvedRes = await fetch(`/api/drafts?projectId=${projectId}&table=pains_ranking_drafts&checkApproved=true`);
      const approvedData = await approvedRes.json();
      setIsApproved(approvedData.hasApproved || false);

      // Fetch segments to get pain names
      const segmentsRes = await fetch(`/api/segments?projectId=${projectId}&stepType=pains-ranking`);
      const segmentsData = await segmentsRes.json();
      if (segmentsData.success && segmentsData.segments) {
        setSegments(segmentsData.segments);
      }

      // Fetch approved pains to get their names
      const painsRes = await fetch(`/api/pains?projectId=${projectId}`);
      const painsData = await painsRes.json();
      if (painsData.success && painsData.pains) {
        setPains(painsData.pains);
      }
    } catch (err) {
      console.error("Failed to fetch data:", err);
      setError("Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      setError(null);

      const res = await fetch("/api/generate/pains-ranking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Generation failed");
      }

      // Refresh data
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApprove = async () => {
    if (sortedRankings.length === 0) return;

    try {
      setIsApproving(true);
      setError(null);

      const draftIds = sortedRankings.map(r => r.id);

      const res = await fetch("/api/approve/pains-ranking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          draftIds,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Approval failed");
      }

      setIsApproved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Approval failed");
    } finally {
      setIsApproving(false);
    }
  };

  const handleEditRanking = async (rankingId: string, updates: Partial<RankingDraftRow>) => {
    try {
      const res = await fetch("/api/drafts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          table: "pains_ranking_drafts",
          id: rankingId,
          updates,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setRankings(prev => prev.map(r => r.id === rankingId ? { ...r, ...updates } : r));
      }
    } catch (err) {
      console.error("Failed to save edit:", err);
    }
  };

  const handleDeleteRanking = async (rankingId: string) => {
    try {
      const res = await fetch(`/api/drafts?table=pains_ranking_drafts&id=${rankingId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setRankings(prev => prev.filter(r => r.id !== rankingId));
      }
    } catch (err) {
      console.error("Failed to delete ranking:", err);
    }
  };

  const handleToggleStar = async (rankingId: string, currentIsTop: boolean) => {
    const newIsTop = !currentIsTop;

    // Optimistic update
    setRankings(prev => prev.map(r => r.id === rankingId ? { ...r, is_top_pain: newIsTop } : r));

    try {
      const res = await fetch("/api/drafts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          table: "pains_ranking_drafts",
          id: rankingId,
          updates: { is_top_pain: newIsTop },
        }),
      });

      const data = await res.json();
      if (!data.success) {
        // Revert on failure
        setRankings(prev => prev.map(r => r.id === rankingId ? { ...r, is_top_pain: currentIsTop } : r));
      }
    } catch (err) {
      console.error("Failed to toggle star:", err);
      // Revert on failure
      setRankings(prev => prev.map(r => r.id === rankingId ? { ...r, is_top_pain: currentIsTop } : r));
    }
  };

  // Get pain name by ID
  const getPainName = (painId: string | undefined): string => {
    if (!painId) return "Unknown Pain";
    const pain = pains.find(p => p.id === painId);
    return pain?.name || `Pain #${painId.substring(0, 8)}`;
  };

  // Get segment name by pain ID (through pains)
  const getSegmentName = (painId: string | undefined): string => {
    if (!painId) return "";
    const pain = pains.find(p => p.id === painId);
    if (!pain) return "";
    const segment = segments.find(s => s.id === pain.segment_id);
    return segment?.name || "";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between"
      >
        <div className="flex items-start gap-4">
          <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl text-white shadow-lg shadow-amber-500/20">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Pain Points Ranking
            </h1>
            <p className="mt-1 text-slate-500 max-w-xl">
              Rank pain points by impact score and identify the top pains that deserve deep analysis.
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

          {sortedRankings.length > 0 && !isApproved && (
            <Button
              variant="outline"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="gap-2"
            >
              <RefreshCw className={cn("w-4 h-4", isGenerating && "animate-spin")} />
              Regenerate
            </Button>
          )}

          {isApproved ? (
            <Button
              onClick={() => router.push(`/projects/${projectId}/generate/canvas`)}
              className="gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
            >
              Continue to Canvas
              <TrendingUp className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={sortedRankings.length === 0 ? handleGenerate : handleApprove}
              disabled={isGenerating || isApproving || (sortedRankings.length > 0 && topPains.length === 0)}
              isLoading={isGenerating || isApproving}
              className="gap-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
              title={sortedRankings.length > 0 && topPains.length === 0 ? "Select at least one Top Pain to approve" : undefined}
            >
              {sortedRankings.length === 0 ? (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Rankings
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  {topPains.length === 0 ? "Select Top Pains" : `Approve ${topPains.length} Top Pains`}
                </>
              )}
            </Button>
          )}
        </div>
      </motion.div>

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
            <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
          </motion.div>
        ) : isGenerating ? (
          <GeneratingState key="generating" />
        ) : sortedRankings.length > 0 ? (
          <motion.div
            key="rankings"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <StatCard
                icon={<Trophy className="w-5 h-5" />}
                label="Top Pains"
                value={topPains.length}
                sublabel="Selected for deep analysis"
                color="amber"
              />
              <StatCard
                icon={<BarChart3 className="w-5 h-5" />}
                label="Total Ranked"
                value={sortedRankings.length}
                sublabel="All pain points"
                color="blue"
              />
              <StatCard
                icon={<TrendingUp className="w-5 h-5" />}
                label="Avg Impact"
                value={sortedRankings.length > 0 ? Math.round(sortedRankings.reduce((sum, r) => sum + (r.impact_score ?? 0), 0) / sortedRankings.length) : 0}
                sublabel="Impact score"
                color="emerald"
              />
            </div>

            {/* Top Pains */}
            {topPains.length > 0 && (
              <Card className="overflow-hidden">
                <div className="p-5 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-600" />
                    <h3 className="font-semibold text-amber-900">Top Pain Points</h3>
                  </div>
                  <p className="text-sm text-amber-600 mt-1">
                    These pains will receive deep canvas analysis
                  </p>
                </div>
                <CardContent className="p-5 space-y-4">
                  {topPains.map((ranking, index) => (
                    <RankingCard
                      key={ranking.id || `top-${index}`}
                      ranking={ranking}
                      rank={index + 1}
                      painName={getPainName(ranking.pain_id)}
                      segmentName={getSegmentName(ranking.pain_id)}
                      isTop
                      onEdit={(updates) => handleEditRanking(ranking.id, updates)}
                      onDelete={() => handleDeleteRanking(ranking.id)}
                      onToggleStar={() => handleToggleStar(ranking.id, ranking.is_top_pain)}
                    />
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Other Pains */}
            {otherPains.length > 0 && (
              <Card className="overflow-hidden">
                <div className="p-5 bg-slate-50 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-slate-600" />
                    <h3 className="font-semibold text-slate-900">Other Pain Points</h3>
                  </div>
                  <p className="text-sm text-slate-500 mt-1">
                    Ranked by impact but not selected for deep analysis
                  </p>
                </div>
                <CardContent className="p-5 space-y-3">
                  {otherPains.map((ranking, index) => (
                    <RankingCard
                      key={ranking.id || `other-${index}`}
                      ranking={ranking}
                      rank={topPains.length + index + 1}
                      painName={getPainName(ranking.pain_id)}
                      segmentName={getSegmentName(ranking.pain_id)}
                      isTop={false}
                      onEdit={(updates) => handleEditRanking(ranking.id, updates)}
                      onDelete={() => handleDeleteRanking(ranking.id)}
                      onToggleStar={() => handleToggleStar(ranking.id, ranking.is_top_pain)}
                    />
                  ))}
                </CardContent>
              </Card>
            )}
          </motion.div>
        ) : isApproved ? (
          <ApprovedState key="approved" />
        ) : (
          <EmptyState
            key="empty"
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
          />
        )}
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex justify-between items-center pt-6 border-t border-slate-200">
        <Button
          variant="outline"
          onClick={() => router.push(`/projects/${projectId}/generate/pains`)}
          disabled={isNavigating}
        >
          Back to Pain Points
        </Button>
        {(isApproved || sortedRankings.length > 0) && (
          <Button
            onClick={() => {
              setIsNavigating(true);
              router.push(`/projects/${projectId}/generate/canvas`);
            }}
            disabled={isNavigating}
            isLoading={isNavigating}
            className="gap-2"
          >
            Continue to Canvas
          </Button>
        )}
      </div>
    </div>
  );
}

function GeneratingState() {
  const steps = [
    "Analyzing pain points...",
    "Calculating impact scores...",
    "Identifying top pains...",
    "Generating reasoning...",
    "Finalizing rankings...",
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
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full blur-xl opacity-30 animate-pulse" />
        <div className="relative w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-white animate-pulse" />
        </div>
      </div>

      <h3 className="mt-8 text-xl font-semibold text-slate-900">
        Generating Pain Rankings
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
          <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mb-6">
            <BarChart3 className="w-8 h-8 text-amber-500" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            Ready to Generate Rankings
          </h3>
          <p className="text-slate-500 text-center max-w-md mb-6">
            Generate rankings for all pain points based on their impact and importance to your audience.
          </p>
          <Button
            onClick={onGenerate}
            disabled={isGenerating}
            isLoading={isGenerating}
            className="gap-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
          >
            <Sparkles className="w-4 h-4" />
            Generate Rankings
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function ApprovedState() {
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
            Rankings Approved
          </h3>
          <p className="text-slate-500 text-center max-w-md">
            Pain rankings have been approved. Continue to Canvas to generate deep analysis.
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sublabel,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  sublabel: string;
  color: "amber" | "blue" | "emerald";
}) {
  const colorClasses = {
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
  };

  return (
    <div className={`p-5 rounded-xl border ${colorClasses[color]}`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wider opacity-80">
          {label}
        </span>
      </div>
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-xs mt-1 opacity-70">{sublabel}</p>
    </div>
  );
}

function RankingCard({
  ranking,
  rank,
  painName,
  segmentName,
  isTop,
  onEdit,
  onDelete,
  onToggleStar,
}: {
  ranking: RankingDraftRow;
  rank: number;
  painName: string;
  segmentName: string;
  isTop: boolean;
  onEdit: (updates: Partial<RankingDraftRow>) => void;
  onDelete: () => void;
  onToggleStar: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [impactScore, setImpactScore] = useState((ranking.impact_score ?? 0).toString());
  const [reasoning, setReasoning] = useState(ranking.ranking_reasoning || "");
  const [isTopPain, setIsTopPain] = useState(ranking.is_top_pain ?? false);
  const [isTogglingstar, setIsTogglingStar] = useState(false);

  const getScoreColor = (score: number) => {
    if (score >= 8) return "bg-rose-500";
    if (score >= 6) return "bg-orange-500";
    if (score >= 4) return "bg-amber-500";
    return "bg-slate-400";
  };

  const handleSave = () => {
    onEdit({
      impact_score: parseInt(impactScore) || 0,
      ranking_reasoning: reasoning,
      is_top_pain: isTopPain,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setImpactScore((ranking.impact_score ?? 0).toString());
    setReasoning(ranking.ranking_reasoning || "");
    setIsTopPain(ranking.is_top_pain ?? false);
    setIsEditing(false);
  };

  return (
    <div
      className={cn(
        "group relative p-5 rounded-xl border",
        isTop
          ? "bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200"
          : "bg-slate-50 border-slate-200"
      )}
    >
      {/* Rank Badge */}
      <div
        className={cn(
          "absolute -left-2 -top-2 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-lg",
          isTop
            ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white"
            : "bg-slate-300 text-slate-700"
        )}
      >
        {rank}
      </div>

      {!isEditing && (
        <div className="absolute -right-2 -top-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
          <button
            onClick={() => setIsEditing(true)}
            className="p-1.5 bg-white text-slate-500 rounded-lg hover:bg-slate-100 hover:text-blue-600 shadow-sm border"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 bg-white text-slate-500 rounded-lg hover:bg-red-50 hover:text-red-600 shadow-sm border"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {isEditing ? (
        <div className="ml-4 space-y-3">
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Impact Score (0-10)</label>
            <input
              type="number"
              min="0"
              max="10"
              value={impactScore}
              onChange={(e) => setImpactScore(e.target.value)}
              className="w-full mt-1 p-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Ranking Reasoning</label>
            <textarea
              value={reasoning}
              onChange={(e) => setReasoning(e.target.value)}
              className="w-full mt-1 p-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              rows={3}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isTopPain}
              onChange={(e) => setIsTopPain(e.target.checked)}
              className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
            />
            <label className="text-sm text-slate-700">Mark as Top Pain</label>
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
          <div className="ml-4 flex items-start justify-between gap-4">
            <div className="flex-1">
              <h4 className="font-semibold text-slate-900 mb-1 flex items-center gap-2">
                {painName}
                <button
                  onClick={onToggleStar}
                  className={cn(
                    "p-1 rounded-md transition-all hover:scale-110",
                    isTop
                      ? "text-amber-500 hover:text-amber-600"
                      : "text-slate-300 hover:text-amber-400"
                  )}
                  title={isTop ? "Remove from Top Pains" : "Add to Top Pains"}
                >
                  <Star className={cn("w-5 h-5", isTop && "fill-amber-500")} />
                </button>
              </h4>
              {segmentName && (
                <p className="text-xs text-slate-400 mb-2">Segment: {segmentName}</p>
              )}
              <p className="text-sm text-slate-600 leading-relaxed">
                {ranking.ranking_reasoning}
              </p>
            </div>

            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  "w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-xl",
                  getScoreColor(ranking.impact_score)
                )}
              >
                {ranking.impact_score}
              </div>
              <span className="text-xs text-slate-500">Impact</span>
            </div>
          </div>

          <div className="mt-4 ml-4">
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all", getScoreColor(ranking.impact_score))}
                style={{ width: `${ranking.impact_score * 10}%` }}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
