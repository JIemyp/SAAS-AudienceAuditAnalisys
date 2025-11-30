"use client";

import { use, useState } from "react";
import {
  GenerationPage,
  DraftCard,
  DraftSection,
  DraftField,
} from "@/components/generation/GenerationPage";
import { PortraitDraft } from "@/types";
import { Users, Heart, Briefcase, MapPin, GraduationCap, User2, Pencil, Check, X, Plus } from "lucide-react";

export default function PortraitPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = use(params);

  return (
    <GenerationPage<PortraitDraft>
      projectId={projectId}
      title="Audience Portrait"
      description="Generate a comprehensive socio-demographic and psychographic profile of your target audience based on your product data."
      generateEndpoint="/api/generate/portrait"
      approveEndpoint="/api/approve/portrait"
      draftTable="portrait_drafts"
      nextStepUrl="/generate/portrait-review"
      icon={<Users className="w-6 h-6" />}
      emptyStateMessage="Generate a detailed portrait of your ideal customer including demographics, psychographics, values, and lifestyle."
      renderDraft={(draft, onEdit) => (
        <PortraitDraftView draft={draft} onEdit={onEdit} />
      )}
    />
  );
}

function PortraitDraftView({
  draft,
  onEdit,
}: {
  draft: PortraitDraft;
  onEdit: (updates: Partial<PortraitDraft>) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Summary Cards - All Editable */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <EditableSummaryCard
          icon={<User2 className="w-5 h-5" />}
          label="Age Range"
          value={draft.age_range}
          color="blue"
          onEdit={(value) => onEdit({ age_range: value })}
        />
        <EditableSummaryCard
          icon={<MapPin className="w-5 h-5" />}
          label="Location"
          value={draft.location}
          color="emerald"
          onEdit={(value) => onEdit({ location: value })}
        />
        <EditableSummaryCard
          icon={<Briefcase className="w-5 h-5" />}
          label="Occupation"
          value={draft.occupation}
          color="purple"
          onEdit={(value) => onEdit({ occupation: value })}
        />
        <EditableSummaryCard
          icon={<GraduationCap className="w-5 h-5" />}
          label="Education"
          value={draft.education}
          color="orange"
          onEdit={(value) => onEdit({ education: value })}
        />
      </div>

      {/* Detailed Sections */}
      <DraftCard>
        <DraftSection
          title="Socio-Demographics"
          icon={<Users className="w-5 h-5" />}
          color="blue"
        >
          <div className="space-y-4">
            <DraftField
              label="Overview"
              value={draft.sociodemographics}
              editable
              type="textarea"
              onEdit={(value) => onEdit({ sociodemographics: value })}
            />

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
              <DraftField
                label="Gender Distribution"
                value={draft.gender_distribution}
                editable
                onEdit={(value) => onEdit({ gender_distribution: value })}
              />
              <DraftField
                label="Income Level"
                value={draft.income_level}
                editable
                onEdit={(value) => onEdit({ income_level: value })}
              />
              <DraftField
                label="Family Status"
                value={draft.family_status}
                editable
                onEdit={(value) => onEdit({ family_status: value })}
              />
            </div>
          </div>
        </DraftSection>
      </DraftCard>

      <DraftCard>
        <DraftSection
          title="Psychographics"
          icon={<Heart className="w-5 h-5" />}
          color="rose"
        >
          <DraftField
            label="Overview"
            value={draft.psychographics}
            editable
            type="textarea"
            onEdit={(value) => onEdit({ psychographics: value })}
          />
        </DraftSection>
      </DraftCard>

      {/* Values & Lifestyle Grid - All Editable */}
      <div className="grid md:grid-cols-2 gap-6">
        <DraftCard>
          <DraftSection title="Values & Beliefs" color="purple">
            <EditableTagList
              items={draft.values_beliefs || []}
              color="purple"
              onEdit={(items) => onEdit({ values_beliefs: items })}
            />
          </DraftSection>
        </DraftCard>

        <DraftCard>
          <DraftSection title="Lifestyle Habits" color="emerald">
            <EditableTagList
              items={draft.lifestyle_habits || []}
              color="emerald"
              onEdit={(items) => onEdit({ lifestyle_habits: items })}
            />
          </DraftSection>
        </DraftCard>

        <DraftCard>
          <DraftSection title="Interests & Hobbies" color="blue">
            <EditableTagList
              items={draft.interests_hobbies || []}
              color="blue"
              onEdit={(items) => onEdit({ interests_hobbies: items })}
            />
          </DraftSection>
        </DraftCard>

        <DraftCard>
          <DraftSection title="Personality Traits" color="orange">
            <EditableTagList
              items={draft.personality_traits || []}
              color="orange"
              onEdit={(items) => onEdit({ personality_traits: items })}
            />
          </DraftSection>
        </DraftCard>
      </div>
    </div>
  );
}

function EditableSummaryCard({
  icon,
  label,
  value,
  color,
  onEdit,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: "blue" | "emerald" | "purple" | "orange";
  onEdit: (value: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  const colorClasses = {
    blue: "bg-blue-50 text-blue-600 border-blue-100 hover:border-blue-300",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100 hover:border-emerald-300",
    purple: "bg-purple-50 text-purple-600 border-purple-100 hover:border-purple-300",
    orange: "bg-orange-50 text-orange-600 border-orange-100 hover:border-orange-300",
  };

  const handleSave = () => {
    onEdit(editValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className={`p-4 rounded-xl border-2 ${colorClasses[color]}`}>
        <div className="flex items-center gap-2 mb-2">
          {icon}
          <span className="text-xs font-medium uppercase tracking-wider opacity-80">
            {label}
          </span>
        </div>
        <input
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          className="w-full p-1.5 text-sm border border-slate-200 rounded bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          autoFocus
        />
        <div className="flex gap-1 mt-2">
          <button
            onClick={handleSave}
            className="p-1 bg-emerald-100 text-emerald-600 rounded hover:bg-emerald-200"
          >
            <Check className="w-3 h-3" />
          </button>
          <button
            onClick={handleCancel}
            className="p-1 bg-slate-100 text-slate-600 rounded hover:bg-slate-200"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`p-4 rounded-xl border cursor-pointer transition-all group ${colorClasses[color]}`}
      onClick={() => setIsEditing(true)}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-xs font-medium uppercase tracking-wider opacity-80">
            {label}
          </span>
        </div>
        <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />
      </div>
      <p className="text-sm font-semibold truncate">{value}</p>
    </div>
  );
}

function EditableTagList({
  items,
  color,
  onEdit,
}: {
  items: string[];
  color: "blue" | "emerald" | "purple" | "orange";
  onEdit: (items: string[]) => void;
}) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [newValue, setNewValue] = useState("");

  const colorClasses = {
    blue: "bg-blue-100 text-blue-700 hover:bg-blue-200",
    emerald: "bg-emerald-100 text-emerald-700 hover:bg-emerald-200",
    purple: "bg-purple-100 text-purple-700 hover:bg-purple-200",
    orange: "bg-orange-100 text-orange-700 hover:bg-orange-200",
  };

  const handleStartEdit = (index: number) => {
    setEditingIndex(index);
    setEditValue(items[index]);
  };

  const handleSaveEdit = () => {
    if (editingIndex !== null && editValue.trim()) {
      const newItems = [...items];
      newItems[editingIndex] = editValue.trim();
      onEdit(newItems);
    }
    setEditingIndex(null);
    setEditValue("");
  };

  const handleDelete = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    onEdit(newItems);
  };

  const handleAddNew = () => {
    if (newValue.trim()) {
      onEdit([...items, newValue.trim()]);
      setNewValue("");
      setIsAdding(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {items?.map((item, index) => (
          editingIndex === index ? (
            <div key={index} className="flex items-center gap-1">
              <input
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="px-2 py-1 text-sm border border-slate-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveEdit();
                  if (e.key === "Escape") setEditingIndex(null);
                }}
              />
              <button
                onClick={handleSaveEdit}
                className="p-1 bg-emerald-100 text-emerald-600 rounded-full hover:bg-emerald-200"
              >
                <Check className="w-3 h-3" />
              </button>
              <button
                onClick={() => setEditingIndex(null)}
                className="p-1 bg-slate-100 text-slate-600 rounded-full hover:bg-slate-200"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <span
              key={index}
              className={`group relative px-3 py-1.5 text-sm rounded-full cursor-pointer transition-colors ${colorClasses[color]}`}
              onClick={() => handleStartEdit(index)}
            >
              {item}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(index);
                }}
                className="absolute -top-1 -right-1 p-0.5 bg-red-100 text-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-200"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          )
        ))}
      </div>

      {isAdding ? (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            placeholder="Enter new item..."
            className="flex-1 px-3 py-1.5 text-sm border border-slate-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAddNew();
              if (e.key === "Escape") {
                setIsAdding(false);
                setNewValue("");
              }
            }}
          />
          <button
            onClick={handleAddNew}
            className="p-1.5 bg-emerald-100 text-emerald-600 rounded-full hover:bg-emerald-200"
          >
            <Check className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setIsAdding(false);
              setNewValue("");
            }}
            className="p-1.5 bg-slate-100 text-slate-600 rounded-full hover:bg-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-500 border border-dashed border-slate-300 rounded-full hover:border-slate-400 hover:text-slate-600 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add item
        </button>
      )}
    </div>
  );
}
