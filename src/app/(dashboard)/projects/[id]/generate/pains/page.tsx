"use client";

import { use, useState } from "react";
import {
  DraftCard,
  DraftSection,
} from "@/components/generation/GenerationPage";
import { SegmentGenerationPage } from "@/components/generation/SegmentGenerationPage";
import { PainDraft } from "@/types";
import { AlertCircle, ChevronDown, ChevronUp, Flame, Zap, Quote, Pencil, Trash2, Check, X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface PainsDraftData {
  id: string;
  project_id: string;
  segment_id?: string;
  pains: PainDraft[];
  version: number;
  created_at: string;
}

export default function PainsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = use(params);

  return (
    <SegmentGenerationPage<PainsDraftData>
      projectId={projectId}
      title="Pain Points"
      description="Identify 6-10 specific pain points with deep triggers and real examples. Complete this for each segment."
      stepType="pains"
      generateEndpoint="/api/generate/pains"
      approveEndpoint="/api/approve/pains"
      draftTable="pains_drafts"
      approvedTable="pains_initial"
      nextStepUrl="/generate/canvas"
      icon={<AlertCircle className="w-6 h-6" />}
      emptyStateMessage="Generate detailed pain points for your audience segments including triggers and real-world examples."
      renderDraft={(draft, onEdit) => (
        <PainsDraftView draft={draft} onEdit={onEdit} />
      )}
    />
  );
}

function PainsDraftView({
  draft,
  onEdit,
}: {
  draft: PainsDraftData;
  onEdit: (updates: Partial<PainsDraftData>) => void;
}) {
  const [expandedPains, setExpandedPains] = useState<string[]>([]);

  const pains = Array.isArray(draft) ? draft : (draft.pains || [draft]);

  const togglePain = (id: string) => {
    setExpandedPains(prev =>
      prev.includes(id)
        ? prev.filter(p => p !== id)
        : [...prev, id]
    );
  };

  const handleEditPain = (index: number, updated: PainDraft) => {
    const newPains = [...pains];
    newPains[index] = updated;
    onEdit({ pains: newPains });
  };

  const handleDeletePain = (index: number) => {
    const newPains = pains.filter((_, i) => i !== index);
    onEdit({ pains: newPains });
  };

  const handleAddPain = (pain: PainDraft) => {
    onEdit({ pains: [...pains, pain] });
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
          />
        ))}
        <AddPainForm onAdd={handleAddPain} />
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
}: {
  pain: PainDraft;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: (pain: PainDraft) => void;
  onDelete: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
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

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <button
        onClick={onToggle}
        className="w-full p-5 flex items-center justify-between hover:bg-slate-50 transition-colors"
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

function AddPainForm({ onAdd }: { onAdd: (pain: PainDraft) => void }) {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [deepTriggers, setDeepTriggers] = useState("");
  const [examples, setExamples] = useState("");

  const handleAdd = () => {
    if (name.trim() && description.trim()) {
      onAdd({
        id: `new-${Date.now()}`,
        project_id: "",
        name: name.trim(),
        description: description.trim(),
        deep_triggers: deepTriggers.split("\n").filter(t => t.trim()),
        examples: examples.split("\n").filter(e => e.trim()),
        version: 1,
        created_at: new Date().toISOString(),
      });
      setName("");
      setDescription("");
      setDeepTriggers("");
      setExamples("");
      setIsAdding(false);
    }
  };

  if (isAdding) {
    return (
      <div className="p-5 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Pain Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Information Overload"
              className="w-full mt-1 p-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe this pain point..."
              className="w-full mt-1 p-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              rows={4}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Deep Triggers (one per line)</label>
            <textarea
              value={deepTriggers}
              onChange={(e) => setDeepTriggers(e.target.value)}
              placeholder="What triggers this pain?"
              className="w-full mt-1 p-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              rows={3}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Examples (one per line)</label>
            <textarea
              value={examples}
              onChange={(e) => setExamples(e.target.value)}
              placeholder="Real-world examples of this pain"
              className="w-full mt-1 p-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              rows={3}
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 text-sm"
            >
              <Check className="w-4 h-4" /> Add Pain Point
            </button>
            <button
              onClick={() => {
                setIsAdding(false);
                setName("");
                setDescription("");
                setDeepTriggers("");
                setExamples("");
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
      className="w-full p-4 rounded-xl border-2 border-dashed border-rose-300 hover:border-rose-400 text-rose-600 hover:text-rose-700 transition-colors flex items-center justify-center gap-2"
    >
      <Plus className="w-4 h-4" />
      Add Pain Point
    </button>
  );
}
