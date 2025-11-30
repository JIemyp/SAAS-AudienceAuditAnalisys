"use client";

import { use, useState } from "react";
import {
  GenerationPage,
  DraftCard,
  DraftSection,
} from "@/components/generation/GenerationPage";
import { PainRankingDraft } from "@/types";
import { BarChart3, Trophy, Star, TrendingUp, Pencil, Trash2, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { EditableField } from "@/components/generation/EditableField";

// Extended type
interface PainsRankingDraftData {
  id: string;
  project_id: string;
  rankings: PainRankingDraft[];
  version: number;
  created_at: string;
}

export default function PainsRankingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = use(params);

  return (
    <GenerationPage<PainsRankingDraftData>
      projectId={projectId}
      title="Pain Points Ranking"
      description="Rank pain points by impact score and identify the top pains that deserve deep analysis."
      generateEndpoint="/api/generate/pains-ranking"
      approveEndpoint="/api/approve/pains-ranking"
      draftTable="pains_ranking_drafts"
      nextStepUrl="/generate/canvas"
      icon={<BarChart3 className="w-6 h-6" />}
      emptyStateMessage="Generate rankings for all pain points based on their impact and importance to your audience."
      renderDraft={(draft, onEdit) => (
        <PainsRankingDraftView draft={draft} onEdit={onEdit} />
      )}
    />
  );
}

function PainsRankingDraftView({
  draft,
  onEdit,
}: {
  draft: PainsRankingDraftData;
  onEdit: (updates: Partial<PainsRankingDraftData>) => void;
}) {
  const rankings = Array.isArray(draft) ? draft : (draft.rankings || [draft]);
  const sortedRankings = [...rankings].sort((a, b) => b.impact_score - a.impact_score);
  const topPains = sortedRankings.filter(r => r.is_top_pain);
  const otherPains = sortedRankings.filter(r => !r.is_top_pain);

  const handleEditRanking = (index: number, updated: PainRankingDraft) => {
    const newRankings = [...rankings];
    const originalIndex = rankings.findIndex(r => r.id === sortedRankings[index].id);
    if (originalIndex !== -1) {
      newRankings[originalIndex] = updated;
      onEdit({ rankings: newRankings });
    }
  };

  const handleDeleteRanking = (index: number) => {
    const idToDelete = sortedRankings[index].id;
    const newRankings = rankings.filter(r => r.id !== idToDelete);
    onEdit({ rankings: newRankings });
  };

  return (
    <div className="space-y-6">
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
          value={rankings.length}
          sublabel="All pain points"
          color="blue"
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="Avg Impact"
          value={rankings.length > 0 ? Math.round(rankings.reduce((sum, r) => sum + r.impact_score, 0) / rankings.length) : 0}
          sublabel="Impact score"
          color="emerald"
        />
      </div>

      {topPains.length > 0 && (
        <DraftCard>
          <DraftSection
            title="Top Pain Points"
            icon={<Trophy className="w-5 h-5" />}
            color="orange"
          >
            <p className="text-sm text-slate-500 mb-4">
              These pains will receive deep canvas analysis
            </p>
            <div className="space-y-4">
              {topPains.map((ranking, index) => (
                <RankingCard
                  key={ranking.id || index}
                  ranking={ranking}
                  rank={index + 1}
                  isTop
                  onEdit={(updated) => handleEditRanking(sortedRankings.indexOf(ranking), updated)}
                  onDelete={() => handleDeleteRanking(sortedRankings.indexOf(ranking))}
                />
              ))}
            </div>
          </DraftSection>
        </DraftCard>
      )}

      {otherPains.length > 0 && (
        <DraftCard>
          <DraftSection
            title="Other Pain Points"
            icon={<BarChart3 className="w-5 h-5" />}
            color="blue"
          >
            <p className="text-sm text-slate-500 mb-4">
              Ranked by impact but not selected for deep analysis
            </p>
            <div className="space-y-3">
              {otherPains.map((ranking, index) => (
                <RankingCard
                  key={ranking.id || index}
                  ranking={ranking}
                  rank={topPains.length + index + 1}
                  isTop={false}
                  onEdit={(updated) => handleEditRanking(sortedRankings.indexOf(ranking), updated)}
                  onDelete={() => handleDeleteRanking(sortedRankings.indexOf(ranking))}
                />
              ))}
            </div>
          </DraftSection>
        </DraftCard>
      )}
    </div>
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
  isTop,
  onEdit,
  onDelete,
}: {
  ranking: PainRankingDraft;
  rank: number;
  isTop: boolean;
  onEdit: (updated: PainRankingDraft) => void;
  onDelete: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [impactScore, setImpactScore] = useState(ranking.impact_score.toString());
  const [reasoning, setReasoning] = useState(ranking.ranking_reasoning);

  const getScoreColor = (score: number) => {
    if (score >= 8) return "bg-rose-500";
    if (score >= 6) return "bg-orange-500";
    if (score >= 4) return "bg-amber-500";
    return "bg-slate-400";
  };

  const handleSave = () => {
    onEdit({
      ...ranking,
      impact_score: parseInt(impactScore) || 0,
      ranking_reasoning: reasoning,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setImpactScore(ranking.impact_score.toString());
    setReasoning(ranking.ranking_reasoning);
    setIsEditing(false);
  };

  return (
    <div
      className={cn(
        "group relative p-5 rounded-xl border",
        isTop
          ? "bg-linear-to-r from-amber-50 to-orange-50 border-amber-200"
          : "bg-slate-50 border-slate-200"
      )}
    >
      {/* Rank Badge */}
      <div
        className={cn(
          "absolute -left-2 -top-2 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-lg",
          isTop
            ? "bg-linear-to-br from-amber-400 to-orange-500 text-white"
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
              <h4 className="font-semibold text-slate-900 mb-2">
                Pain #{ranking.pain_id?.substring(0, 8)}...
                {isTop && (
                  <Star className="inline-block w-4 h-4 text-amber-500 ml-2" />
                )}
              </h4>
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
