"use client";

import { use, useState } from "react";
import {
  GenerationPage,
  DraftCard,
  DraftSection,
} from "@/components/generation/GenerationPage";
import { SegmentDraft } from "@/types";
import { Users, ChevronDown, ChevronUp, User2, Pencil, Trash2, Check, X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface SegmentsDraftData {
  id: string;
  project_id: string;
  segments: SegmentDraft[];
  version: number;
  created_at: string;
}

export default function SegmentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = use(params);

  return (
    <GenerationPage<SegmentsDraftData>
      projectId={projectId}
      title="Audience Segments"
      description="Generate 10 distinct audience segments based on the portrait, jobs, and triggers. Each segment represents a unique subset of your target audience."
      generateEndpoint="/api/generate/segments"
      approveEndpoint="/api/approve/segments"
      draftTable="segments_drafts"
      nextStepUrl="/generate/segments-review"
      icon={<Users className="w-6 h-6" />}
      emptyStateMessage="Generate distinct audience segments to better understand the different types of customers within your target market."
      renderDraft={(draft, onEdit) => (
        <SegmentsDraftView draft={draft} onEdit={onEdit} />
      )}
    />
  );
}

function SegmentsDraftView({
  draft,
  onEdit,
}: {
  draft: SegmentsDraftData;
  onEdit: (updates: Partial<SegmentsDraftData>) => void;
}) {
  const [expandedSegments, setExpandedSegments] = useState<number[]>([0]);

  const toggleSegment = (index: number) => {
    setExpandedSegments(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const segments = Array.isArray(draft) ? draft : (draft.segments || [draft]);

  const handleEditSegment = (index: number, updated: SegmentDraft) => {
    const newSegments = [...segments];
    newSegments[index] = updated;
    onEdit({ segments: newSegments });
  };

  const handleDeleteSegment = (index: number) => {
    const newSegments = segments.filter((_, i) => i !== index);
    onEdit({ segments: newSegments });
  };

  const handleAddSegment = (segment: SegmentDraft) => {
    onEdit({ segments: [...segments, segment] });
  };

  return (
    <div className="space-y-6">
      <div className="p-6 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Users className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="font-semibold text-indigo-900">
                {segments.length} Audience Segments
              </h3>
              <p className="text-sm text-indigo-600">
                Click to expand and edit details
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setExpandedSegments(segments.map((_, i) => i))}
              className="px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors"
            >
              Expand All
            </button>
            <button
              onClick={() => setExpandedSegments([])}
              className="px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors"
            >
              Collapse All
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {segments.map((segment, index) => (
          <EditableSegmentCard
            key={segment.id || index}
            segment={segment}
            index={index}
            isExpanded={expandedSegments.includes(index)}
            onToggle={() => toggleSegment(index)}
            onEdit={(updated) => handleEditSegment(index, updated)}
            onDelete={() => handleDeleteSegment(index)}
          />
        ))}
        <AddSegmentForm onAdd={handleAddSegment} />
      </div>
    </div>
  );
}

function EditableSegmentCard({
  segment,
  index,
  isExpanded,
  onToggle,
  onEdit,
  onDelete,
}: {
  segment: SegmentDraft;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: (segment: SegmentDraft) => void;
  onDelete: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(segment.name);
  const [description, setDescription] = useState(segment.description);
  const [sociodemographics, setSociodemographics] = useState(segment.sociodemographics);

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
    onEdit({ ...segment, name, description, sociodemographics });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setName(segment.name);
    setDescription(segment.description);
    setSociodemographics(segment.sociodemographics);
    setIsEditing(false);
  };

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <button
        onClick={onToggle}
        className="w-full p-5 flex items-center justify-between hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div
            className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg bg-gradient-to-br",
              gradientColor
            )}
          >
            {index + 1}
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-slate-900">{segment.name}</h3>
            <p className="text-sm text-slate-500 line-clamp-1">
              {segment.description?.substring(0, 100)}...
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
            <button
              onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
              className="p-1.5 bg-white text-slate-500 rounded-lg hover:bg-slate-100 hover:text-blue-600 shadow-sm border"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="p-1.5 bg-white text-slate-500 rounded-lg hover:bg-red-50 hover:text-red-600 shadow-sm border"
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
      </button>

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
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Sociodemographics</label>
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
                    <p className="text-sm text-slate-700">{segment.sociodemographics}</p>
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

function AddSegmentForm({ onAdd }: { onAdd: (segment: SegmentDraft) => void }) {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [sociodemographics, setSociodemographics] = useState("");

  const handleAdd = () => {
    if (name.trim() && description.trim()) {
      onAdd({
        id: `new-${Date.now()}`,
        project_id: "",
        name: name.trim(),
        description: description.trim(),
        sociodemographics: sociodemographics.trim(),
        version: 1,
        created_at: new Date().toISOString(),
      });
      setName("");
      setDescription("");
      setSociodemographics("");
      setIsAdding(false);
    }
  };

  if (isAdding) {
    return (
      <div className="p-5 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Segment Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Budget-Conscious Professionals"
              className="w-full mt-1 p-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe this segment..."
              className="w-full mt-1 p-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              rows={4}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Sociodemographics</label>
            <textarea
              value={sociodemographics}
              onChange={(e) => setSociodemographics(e.target.value)}
              placeholder="Age, income, location, etc."
              className="w-full mt-1 p-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              rows={3}
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 text-sm"
            >
              <Check className="w-4 h-4" /> Add Segment
            </button>
            <button
              onClick={() => {
                setIsAdding(false);
                setName("");
                setDescription("");
                setSociodemographics("");
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
      className="w-full p-4 rounded-xl border-2 border-dashed border-indigo-300 hover:border-indigo-400 text-indigo-600 hover:text-indigo-700 transition-colors flex items-center justify-center gap-2"
    >
      <Plus className="w-4 h-4" />
      Add Segment
    </button>
  );
}
