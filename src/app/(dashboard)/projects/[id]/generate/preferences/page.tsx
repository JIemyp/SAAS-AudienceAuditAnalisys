"use client";

import { use, useState } from "react";
import {
  DraftCard,
  DraftSection,
} from "@/components/generation/GenerationPage";
import { SegmentGenerationPage } from "@/components/generation/SegmentGenerationPage";
import { PreferencesDraft, PreferenceItem, ImportanceLevel } from "@/types";
import { Settings, AlertTriangle, ChevronUp, ChevronDown, Minus, Pencil, Trash2, Check, X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export default function PreferencesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = use(params);

  return (
    <SegmentGenerationPage<PreferencesDraft>
      projectId={projectId}
      title="Product Preferences"
      description="Understand what specific preferences your audience has when choosing products like yours. Complete this for each segment."
      stepType="preferences"
      generateEndpoint="/api/generate/preferences"
      approveEndpoint="/api/approve/preferences"
      draftTable="preferences_drafts"
      approvedTable="preferences"
      nextStepUrl="/generate/difficulties"
      icon={<Settings className="w-6 h-6" />}
      emptyStateMessage="Discover what your customers look for in products - features, quality standards, certifications, and more."
      renderDraft={(draft, onEdit) => (
        <PreferencesDraftView draft={draft} onEdit={onEdit} />
      )}
    />
  );
}

function PreferencesDraftView({
  draft,
  onEdit,
}: {
  draft: PreferencesDraft;
  onEdit: (updates: Partial<PreferencesDraft>) => void;
}) {
  const handleEditPreference = (index: number, updated: PreferenceItem) => {
    const prefs = [...(draft.preferences || [])];
    prefs[index] = updated;
    onEdit({ preferences: prefs });
  };

  const handleDeletePreference = (index: number) => {
    const prefs = (draft.preferences || []).filter((_, i) => i !== index);
    onEdit({ preferences: prefs });
  };

  const handleAddPreference = (pref: PreferenceItem) => {
    const prefs = [...(draft.preferences || []), pref];
    onEdit({ preferences: prefs });
  };

  // Group preferences by importance
  const grouped = {
    critical: draft.preferences?.filter(p => p.importance === "critical").map((p, i) => ({ ...p, originalIndex: draft.preferences!.indexOf(p) })) || [],
    high: draft.preferences?.filter(p => p.importance === "high").map((p, i) => ({ ...p, originalIndex: draft.preferences!.indexOf(p) })) || [],
    medium: draft.preferences?.filter(p => p.importance === "medium").map((p, i) => ({ ...p, originalIndex: draft.preferences!.indexOf(p) })) || [],
    low: draft.preferences?.filter(p => p.importance === "low").map((p, i) => ({ ...p, originalIndex: draft.preferences!.indexOf(p) })) || [],
  };

  return (
    <div className="space-y-6">
      {/* Importance Legend */}
      <div className="flex items-center gap-6 p-4 bg-slate-50 rounded-xl">
        <span className="text-sm font-medium text-slate-600">Importance:</span>
        <div className="flex gap-4">
          <ImportanceBadge level="critical" showLabel />
          <ImportanceBadge level="high" showLabel />
          <ImportanceBadge level="medium" showLabel />
          <ImportanceBadge level="low" showLabel />
        </div>
      </div>

      {/* Critical Preferences */}
      {grouped.critical.length > 0 && (
        <DraftCard>
          <DraftSection
            title="Critical Requirements"
            icon={<AlertTriangle className="w-5 h-5" />}
            color="rose"
          >
            <p className="text-sm text-slate-500 mb-4">
              Non-negotiable requirements that must be met
            </p>
            <div className="space-y-4">
              {grouped.critical.map((pref) => (
                <EditablePreferenceCard
                  key={pref.originalIndex}
                  preference={pref}
                  onEdit={(updated) => handleEditPreference(pref.originalIndex, updated)}
                  onDelete={() => handleDeletePreference(pref.originalIndex)}
                />
              ))}
            </div>
          </DraftSection>
        </DraftCard>
      )}

      {/* High Importance */}
      {grouped.high.length > 0 && (
        <DraftCard>
          <DraftSection
            title="High Priority"
            icon={<ChevronUp className="w-5 h-5" />}
            color="orange"
          >
            <p className="text-sm text-slate-500 mb-4">
              Important factors that heavily influence decisions
            </p>
            <div className="space-y-4">
              {grouped.high.map((pref) => (
                <EditablePreferenceCard
                  key={pref.originalIndex}
                  preference={pref}
                  onEdit={(updated) => handleEditPreference(pref.originalIndex, updated)}
                  onDelete={() => handleDeletePreference(pref.originalIndex)}
                />
              ))}
            </div>
          </DraftSection>
        </DraftCard>
      )}

      {/* Medium Importance */}
      {grouped.medium.length > 0 && (
        <DraftCard>
          <DraftSection
            title="Medium Priority"
            icon={<Minus className="w-5 h-5" />}
            color="blue"
          >
            <p className="text-sm text-slate-500 mb-4">
              Factors considered but not deal-breakers
            </p>
            <div className="space-y-4">
              {grouped.medium.map((pref) => (
                <EditablePreferenceCard
                  key={pref.originalIndex}
                  preference={pref}
                  onEdit={(updated) => handleEditPreference(pref.originalIndex, updated)}
                  onDelete={() => handleDeletePreference(pref.originalIndex)}
                />
              ))}
            </div>
          </DraftSection>
        </DraftCard>
      )}

      {/* Low Importance */}
      {grouped.low.length > 0 && (
        <DraftCard>
          <DraftSection
            title="Low Priority"
            icon={<ChevronDown className="w-5 h-5" />}
            color="emerald"
          >
            <p className="text-sm text-slate-500 mb-4">
              Nice-to-have features that provide additional value
            </p>
            <div className="space-y-4">
              {grouped.low.map((pref) => (
                <EditablePreferenceCard
                  key={pref.originalIndex}
                  preference={pref}
                  onEdit={(updated) => handleEditPreference(pref.originalIndex, updated)}
                  onDelete={() => handleDeletePreference(pref.originalIndex)}
                />
              ))}
            </div>
          </DraftSection>
        </DraftCard>
      )}

      {/* Add New Preference */}
      <AddPreferenceForm onAdd={handleAddPreference} />
    </div>
  );
}

function ImportanceBadge({
  level,
  showLabel = false,
}: {
  level: ImportanceLevel;
  showLabel?: boolean;
}) {
  const config = {
    critical: {
      bg: "bg-rose-100",
      text: "text-rose-700",
      dot: "bg-rose-500",
      label: "Critical",
    },
    high: {
      bg: "bg-orange-100",
      text: "text-orange-700",
      dot: "bg-orange-500",
      label: "High",
    },
    medium: {
      bg: "bg-blue-100",
      text: "text-blue-700",
      dot: "bg-blue-500",
      label: "Medium",
    },
    low: {
      bg: "bg-emerald-100",
      text: "text-emerald-700",
      dot: "bg-emerald-500",
      label: "Low",
    },
  };

  const c = config[level];

  return (
    <div className="flex items-center gap-2">
      <span className={cn("w-2 h-2 rounded-full", c.dot)} />
      {showLabel && (
        <span className={cn("text-xs font-medium", c.text)}>{c.label}</span>
      )}
    </div>
  );
}

function EditablePreferenceCard({
  preference,
  onEdit,
  onDelete,
}: {
  preference: PreferenceItem & { originalIndex: number };
  onEdit: (pref: PreferenceItem) => void;
  onDelete: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(preference.name);
  const [description, setDescription] = useState(preference.description);
  const [importance, setImportance] = useState<ImportanceLevel>(preference.importance);
  const [reasoning, setReasoning] = useState(preference.reasoning);

  const importanceColors = {
    critical: "border-l-rose-500 bg-rose-50/50",
    high: "border-l-orange-500 bg-orange-50/50",
    medium: "border-l-blue-500 bg-blue-50/50",
    low: "border-l-emerald-500 bg-emerald-50/50",
  };

  const handleSave = () => {
    onEdit({ name, description, importance, reasoning });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setName(preference.name);
    setDescription(preference.description);
    setImportance(preference.importance);
    setReasoning(preference.reasoning);
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
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Importance</label>
            <select
              value={importance}
              onChange={(e) => setImportance(e.target.value as ImportanceLevel)}
              className="w-full mt-1 p-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Why This Matters</label>
            <textarea
              value={reasoning}
              onChange={(e) => setReasoning(e.target.value)}
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
    <div
      className={cn(
        "group relative p-5 rounded-xl border border-slate-100 border-l-4 hover:shadow-md transition-all",
        importanceColors[preference.importance]
      )}
    >
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

      <div className="flex items-start justify-between mb-2">
        <h4 className="font-semibold text-slate-900 pr-16">{preference.name}</h4>
        <ImportanceBadge level={preference.importance} showLabel />
      </div>

      <p className="text-sm text-slate-700 mb-3">{preference.description}</p>

      <div className="pt-3 border-t border-slate-100">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
          Why This Matters
        </span>
        <p className="mt-1 text-sm text-slate-600">{preference.reasoning}</p>
      </div>
    </div>
  );
}

function AddPreferenceForm({ onAdd }: { onAdd: (pref: PreferenceItem) => void }) {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [importance, setImportance] = useState<ImportanceLevel>("medium");
  const [reasoning, setReasoning] = useState("");

  const handleAdd = () => {
    if (name.trim() && description.trim() && reasoning.trim()) {
      onAdd({ name: name.trim(), description: description.trim(), importance, reasoning: reasoning.trim() });
      setName("");
      setDescription("");
      setImportance("medium");
      setReasoning("");
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
              placeholder="Preference name"
              className="w-full mt-1 p-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe this preference"
              className="w-full mt-1 p-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              rows={2}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Importance</label>
            <select
              value={importance}
              onChange={(e) => setImportance(e.target.value as ImportanceLevel)}
              className="w-full mt-1 p-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Why This Matters</label>
            <textarea
              value={reasoning}
              onChange={(e) => setReasoning(e.target.value)}
              placeholder="Explain why this matters"
              className="w-full mt-1 p-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              rows={2}
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 text-sm"
            >
              <Check className="w-4 h-4" /> Add Preference
            </button>
            <button
              onClick={() => {
                setIsAdding(false);
                setName("");
                setDescription("");
                setImportance("medium");
                setReasoning("");
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
      Add Preference
    </button>
  );
}
