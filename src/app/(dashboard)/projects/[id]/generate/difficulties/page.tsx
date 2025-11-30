"use client";

import { use, useState } from "react";
import {
  DraftCard,
  DraftSection,
} from "@/components/generation/GenerationPage";
import { SegmentGenerationPage } from "@/components/generation/SegmentGenerationPage";
import { DifficultiesDraft, DifficultyItem, FrequencyLevel } from "@/types";
import { AlertCircle, Clock, Repeat, Calendar, AlertTriangle, Pencil, Trash2, Check, X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export default function DifficultiesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = use(params);

  return (
    <SegmentGenerationPage<DifficultiesDraft>
      projectId={projectId}
      title="Difficulties & Frustrations"
      description="Understand the obstacles and frustrations your audience faces when searching for solutions. Complete this for each segment."
      stepType="difficulties"
      generateEndpoint="/api/generate/difficulties"
      approveEndpoint="/api/approve/difficulties"
      draftTable="difficulties_drafts"
      approvedTable="difficulties"
      nextStepUrl="/generate/triggers"
      icon={<AlertCircle className="w-6 h-6" />}
      emptyStateMessage="Discover the challenges your customers face when looking for solutions - information overload, trust issues, and more."
      renderDraft={(draft, onEdit) => (
        <DifficultiesDraftView draft={draft} onEdit={onEdit} />
      )}
    />
  );
}

function DifficultiesDraftView({
  draft,
  onEdit,
}: {
  draft: DifficultiesDraft;
  onEdit: (updates: Partial<DifficultiesDraft>) => void;
}) {
  const handleEditDifficulty = (index: number, updated: DifficultyItem) => {
    const diffs = [...(draft.difficulties || [])];
    diffs[index] = updated;
    onEdit({ difficulties: diffs });
  };

  const handleDeleteDifficulty = (index: number) => {
    const diffs = (draft.difficulties || []).filter((_, i) => i !== index);
    onEdit({ difficulties: diffs });
  };

  const handleAddDifficulty = (diff: DifficultyItem) => {
    const diffs = [...(draft.difficulties || []), diff];
    onEdit({ difficulties: diffs });
  };

  // Group by frequency with original indices
  const grouped = {
    constant: draft.difficulties?.filter(d => d.frequency === "constant").map(d => ({ ...d, originalIndex: draft.difficulties!.indexOf(d) })) || [],
    frequent: draft.difficulties?.filter(d => d.frequency === "frequent").map(d => ({ ...d, originalIndex: draft.difficulties!.indexOf(d) })) || [],
    occasional: draft.difficulties?.filter(d => d.frequency === "occasional").map(d => ({ ...d, originalIndex: draft.difficulties!.indexOf(d) })) || [],
    rare: draft.difficulties?.filter(d => d.frequency === "rare").map(d => ({ ...d, originalIndex: draft.difficulties!.indexOf(d) })) || [],
  };

  const totalCount = draft.difficulties?.length || 0;

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-4 gap-4">
        <FrequencyCard
          icon={<Repeat className="w-5 h-5" />}
          label="Constant"
          count={grouped.constant.length}
          total={totalCount}
          color="rose"
        />
        <FrequencyCard
          icon={<Clock className="w-5 h-5" />}
          label="Frequent"
          count={grouped.frequent.length}
          total={totalCount}
          color="orange"
        />
        <FrequencyCard
          icon={<Calendar className="w-5 h-5" />}
          label="Occasional"
          count={grouped.occasional.length}
          total={totalCount}
          color="blue"
        />
        <FrequencyCard
          icon={<AlertTriangle className="w-5 h-5" />}
          label="Rare"
          count={grouped.rare.length}
          total={totalCount}
          color="slate"
        />
      </div>

      {/* Constant Difficulties */}
      {grouped.constant.length > 0 && (
        <DraftCard>
          <DraftSection
            title="Constant Challenges"
            icon={<Repeat className="w-5 h-5" />}
            color="rose"
          >
            <p className="text-sm text-slate-500 mb-4">
              Problems they face all the time, creating ongoing frustration
            </p>
            <div className="space-y-4">
              {grouped.constant.map((diff) => (
                <EditableDifficultyCard
                  key={diff.originalIndex}
                  difficulty={diff}
                  onEdit={(updated) => handleEditDifficulty(diff.originalIndex, updated)}
                  onDelete={() => handleDeleteDifficulty(diff.originalIndex)}
                />
              ))}
            </div>
          </DraftSection>
        </DraftCard>
      )}

      {/* Frequent Difficulties */}
      {grouped.frequent.length > 0 && (
        <DraftCard>
          <DraftSection
            title="Frequent Challenges"
            icon={<Clock className="w-5 h-5" />}
            color="orange"
          >
            <p className="text-sm text-slate-500 mb-4">
              Regular obstacles that significantly impact their experience
            </p>
            <div className="space-y-4">
              {grouped.frequent.map((diff) => (
                <EditableDifficultyCard
                  key={diff.originalIndex}
                  difficulty={diff}
                  onEdit={(updated) => handleEditDifficulty(diff.originalIndex, updated)}
                  onDelete={() => handleDeleteDifficulty(diff.originalIndex)}
                />
              ))}
            </div>
          </DraftSection>
        </DraftCard>
      )}

      {/* Occasional Difficulties */}
      {grouped.occasional.length > 0 && (
        <DraftCard>
          <DraftSection
            title="Occasional Challenges"
            icon={<Calendar className="w-5 h-5" />}
            color="blue"
          >
            <p className="text-sm text-slate-500 mb-4">
              Issues that arise periodically but still cause frustration
            </p>
            <div className="space-y-4">
              {grouped.occasional.map((diff) => (
                <EditableDifficultyCard
                  key={diff.originalIndex}
                  difficulty={diff}
                  onEdit={(updated) => handleEditDifficulty(diff.originalIndex, updated)}
                  onDelete={() => handleDeleteDifficulty(diff.originalIndex)}
                />
              ))}
            </div>
          </DraftSection>
        </DraftCard>
      )}

      {/* Rare Difficulties */}
      {grouped.rare.length > 0 && (
        <DraftCard>
          <DraftSection
            title="Rare Challenges"
            icon={<AlertTriangle className="w-5 h-5" />}
            color="emerald"
          >
            <p className="text-sm text-slate-500 mb-4">
              Uncommon issues that can still be significant when they occur
            </p>
            <div className="space-y-4">
              {grouped.rare.map((diff) => (
                <EditableDifficultyCard
                  key={diff.originalIndex}
                  difficulty={diff}
                  onEdit={(updated) => handleEditDifficulty(diff.originalIndex, updated)}
                  onDelete={() => handleDeleteDifficulty(diff.originalIndex)}
                />
              ))}
            </div>
          </DraftSection>
        </DraftCard>
      )}

      {/* Add New Difficulty */}
      <AddDifficultyForm onAdd={handleAddDifficulty} />
    </div>
  );
}

function FrequencyCard({
  icon,
  label,
  count,
  total,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
  total: number;
  color: "rose" | "orange" | "blue" | "slate";
}) {
  const colorClasses = {
    rose: "bg-rose-50 text-rose-600 border-rose-100",
    orange: "bg-orange-50 text-orange-600 border-orange-100",
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    slate: "bg-slate-50 text-slate-600 border-slate-200",
  };

  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;

  return (
    <div className={`p-4 rounded-xl border ${colorClasses[color]}`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-2xl font-bold">{count}</span>
      </div>
      <span className="text-xs font-medium uppercase tracking-wider opacity-80">
        {label}
      </span>
      {total > 0 && (
        <div className="mt-2">
          <div className="h-1 bg-white/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-current opacity-50 rounded-full transition-all"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function EditableDifficultyCard({
  difficulty,
  onEdit,
  onDelete,
}: {
  difficulty: DifficultyItem & { originalIndex: number };
  onEdit: (diff: DifficultyItem) => void;
  onDelete: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(difficulty.name);
  const [description, setDescription] = useState(difficulty.description);
  const [frequency, setFrequency] = useState<FrequencyLevel>(difficulty.frequency);
  const [emotionalImpact, setEmotionalImpact] = useState(difficulty.emotional_impact);

  const frequencyConfig = {
    constant: {
      bg: "bg-rose-50 border-rose-100",
      badge: "bg-rose-100 text-rose-700",
      label: "Constant",
    },
    frequent: {
      bg: "bg-orange-50 border-orange-100",
      badge: "bg-orange-100 text-orange-700",
      label: "Frequent",
    },
    occasional: {
      bg: "bg-blue-50 border-blue-100",
      badge: "bg-blue-100 text-blue-700",
      label: "Occasional",
    },
    rare: {
      bg: "bg-slate-50 border-slate-200",
      badge: "bg-slate-100 text-slate-700",
      label: "Rare",
    },
  };

  const config = frequencyConfig[difficulty.frequency];

  const handleSave = () => {
    onEdit({ name, description, frequency, emotional_impact: emotionalImpact });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setName(difficulty.name);
    setDescription(difficulty.description);
    setFrequency(difficulty.frequency);
    setEmotionalImpact(difficulty.emotional_impact);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="p-5 rounded-xl border-2 border-slate-300 bg-white">
        <div className="space-y-4">
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
              rows={2}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Frequency</label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as FrequencyLevel)}
              className="w-full mt-1 p-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="constant">Constant</option>
              <option value="frequent">Frequent</option>
              <option value="occasional">Occasional</option>
              <option value="rare">Rare</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Emotional Impact</label>
            <textarea
              value={emotionalImpact}
              onChange={(e) => setEmotionalImpact(e.target.value)}
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
      </div>
    );
  }

  return (
    <div className={cn("group relative p-5 rounded-xl border hover:shadow-md transition-all", config.bg)}>
      {/* Edit/Delete buttons */}
      <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => setIsEditing(true)}
          className="p-1.5 bg-white text-slate-500 rounded-lg hover:bg-slate-100 hover:text-blue-600 shadow-sm"
        >
          <Pencil className="w-4 h-4" />
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 bg-white text-slate-500 rounded-lg hover:bg-red-50 hover:text-red-600 shadow-sm"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-start justify-between mb-3">
        <h4 className="font-semibold text-slate-900 pr-16">{difficulty.name}</h4>
        <span className={cn("px-2 py-1 text-xs font-medium rounded-full", config.badge)}>
          {config.label}
        </span>
      </div>

      <p className="text-sm text-slate-700 mb-4">{difficulty.description}</p>

      <div className="pt-3 border-t border-slate-200/50">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
          Emotional Impact
        </span>
        <p className="mt-1 text-sm text-slate-600 italic">
          "{difficulty.emotional_impact}"
        </p>
      </div>
    </div>
  );
}

function AddDifficultyForm({ onAdd }: { onAdd: (diff: DifficultyItem) => void }) {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [frequency, setFrequency] = useState<FrequencyLevel>("occasional");
  const [emotionalImpact, setEmotionalImpact] = useState("");

  const handleAdd = () => {
    if (name.trim() && description.trim() && emotionalImpact.trim()) {
      onAdd({
        name: name.trim(),
        description: description.trim(),
        frequency,
        emotional_impact: emotionalImpact.trim(),
      });
      setName("");
      setDescription("");
      setFrequency("occasional");
      setEmotionalImpact("");
      setIsAdding(false);
    }
  };

  if (isAdding) {
    return (
      <div className="p-5 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Difficulty name"
              className="w-full mt-1 p-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe this difficulty"
              className="w-full mt-1 p-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              rows={2}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Frequency</label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as FrequencyLevel)}
              className="w-full mt-1 p-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="constant">Constant</option>
              <option value="frequent">Frequent</option>
              <option value="occasional">Occasional</option>
              <option value="rare">Rare</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Emotional Impact</label>
            <textarea
              value={emotionalImpact}
              onChange={(e) => setEmotionalImpact(e.target.value)}
              placeholder="How does this make them feel?"
              className="w-full mt-1 p-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              rows={2}
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 text-sm"
            >
              <Check className="w-4 h-4" /> Add Difficulty
            </button>
            <button
              onClick={() => {
                setIsAdding(false);
                setName("");
                setDescription("");
                setFrequency("occasional");
                setEmotionalImpact("");
              }}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 text-sm"
            >
              <X className="w-4 h-4" /> Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setIsAdding(true)}
      className="w-full p-4 rounded-xl border-2 border-dashed border-slate-300 hover:border-slate-400 text-slate-500 hover:text-slate-700 transition-colors flex items-center justify-center gap-2"
    >
      <Plus className="w-4 h-4" />
      Add Difficulty
    </button>
  );
}
