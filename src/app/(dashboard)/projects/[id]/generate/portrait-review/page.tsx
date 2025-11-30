"use client";

import { use, useState } from "react";
import {
  GenerationPage,
  DraftCard,
  DraftSection,
  DraftField,
} from "@/components/generation/GenerationPage";
import { PortraitReviewDraft, ChangeItem, AdditionItem, RemovalItem } from "@/types";
import { Search, ArrowRight, Plus, Minus, AlertTriangle, Pencil, Check, X, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function PortraitReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = use(params);

  return (
    <GenerationPage<PortraitReviewDraft>
      projectId={projectId}
      title="Portrait Self-Review"
      description="AI critically reviews the generated portrait and suggests improvements. This self-reflection process ensures a more accurate audience profile."
      generateEndpoint="/api/generate/portrait-review"
      approveEndpoint="/api/approve/portrait-review"
      draftTable="portrait_review_drafts"
      nextStepUrl="/generate/portrait-final"
      icon={<Search className="w-6 h-6" />}
      emptyStateMessage="Let AI review the portrait it generated and suggest improvements, additions, and removals."
      renderDraft={(draft, onEdit) => (
        <PortraitReviewDraftView draft={draft} onEdit={onEdit} />
      )}
    />
  );
}

function PortraitReviewDraftView({
  draft,
  onEdit,
}: {
  draft: PortraitReviewDraft;
  onEdit: (updates: Partial<PortraitReviewDraft>) => void;
}) {
  const [isAddingChange, setIsAddingChange] = useState(false);
  const [isAddingAddition, setIsAddingAddition] = useState(false);
  const [isAddingRemoval, setIsAddingRemoval] = useState(false);

  const handleUpdateChange = (index: number, updated: ChangeItem) => {
    const newChanges = [...(draft.what_to_change || [])];
    newChanges[index] = updated;
    onEdit({ what_to_change: newChanges });
  };

  const handleDeleteChange = (index: number) => {
    const newChanges = (draft.what_to_change || []).filter((_, i) => i !== index);
    onEdit({ what_to_change: newChanges });
  };

  const handleAddChange = (change: ChangeItem) => {
    onEdit({ what_to_change: [...(draft.what_to_change || []), change] });
    setIsAddingChange(false);
  };

  const handleUpdateAddition = (index: number, updated: AdditionItem) => {
    const newAdditions = [...(draft.what_to_add || [])];
    newAdditions[index] = updated;
    onEdit({ what_to_add: newAdditions });
  };

  const handleDeleteAddition = (index: number) => {
    const newAdditions = (draft.what_to_add || []).filter((_, i) => i !== index);
    onEdit({ what_to_add: newAdditions });
  };

  const handleAddAddition = (addition: AdditionItem) => {
    onEdit({ what_to_add: [...(draft.what_to_add || []), addition] });
    setIsAddingAddition(false);
  };

  const handleUpdateRemoval = (index: number, updated: RemovalItem) => {
    const newRemovals = [...(draft.what_to_remove || [])];
    newRemovals[index] = updated;
    onEdit({ what_to_remove: newRemovals });
  };

  const handleDeleteRemoval = (index: number) => {
    const newRemovals = (draft.what_to_remove || []).filter((_, i) => i !== index);
    onEdit({ what_to_remove: newRemovals });
  };

  const handleAddRemoval = (removal: RemovalItem) => {
    onEdit({ what_to_remove: [...(draft.what_to_remove || []), removal] });
    setIsAddingRemoval(false);
  };

  return (
    <div className="space-y-6">
      {/* Reasoning Card - Editable */}
      <DraftCard>
        <DraftSection
          title="Overall Assessment"
          icon={<AlertTriangle className="w-5 h-5" />}
          color="orange"
        >
          <DraftField
            label="Assessment"
            value={draft.reasoning || ""}
            editable
            type="textarea"
            onEdit={(value) => onEdit({ reasoning: value })}
          />
        </DraftSection>
      </DraftCard>

      {/* Changes Section - Editable */}
      <DraftCard>
        <DraftSection
          title="Suggested Changes"
          icon={<ArrowRight className="w-5 h-5" />}
          color="blue"
        >
          <div className="space-y-4">
            {(draft.what_to_change || []).map((change, index) => (
              <EditableChangeCard
                key={index}
                change={change}
                index={index}
                onUpdate={(updated) => handleUpdateChange(index, updated)}
                onDelete={() => handleDeleteChange(index)}
              />
            ))}

            {isAddingChange ? (
              <NewChangeForm
                onSave={handleAddChange}
                onCancel={() => setIsAddingChange(false)}
              />
            ) : (
              <button
                onClick={() => setIsAddingChange(true)}
                className="flex items-center gap-2 w-full p-3 border-2 border-dashed border-blue-200 rounded-xl text-blue-500 hover:border-blue-300 hover:text-blue-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm font-medium">Add Change</span>
              </button>
            )}
          </div>
        </DraftSection>
      </DraftCard>

      {/* Additions Section - Editable */}
      <DraftCard>
        <DraftSection
          title="Suggested Additions"
          icon={<Plus className="w-5 h-5" />}
          color="emerald"
        >
          <div className="space-y-4">
            {(draft.what_to_add || []).map((addition, index) => (
              <EditableAdditionCard
                key={index}
                addition={addition}
                index={index}
                onUpdate={(updated) => handleUpdateAddition(index, updated)}
                onDelete={() => handleDeleteAddition(index)}
              />
            ))}

            {isAddingAddition ? (
              <NewAdditionForm
                onSave={handleAddAddition}
                onCancel={() => setIsAddingAddition(false)}
              />
            ) : (
              <button
                onClick={() => setIsAddingAddition(true)}
                className="flex items-center gap-2 w-full p-3 border-2 border-dashed border-emerald-200 rounded-xl text-emerald-500 hover:border-emerald-300 hover:text-emerald-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm font-medium">Add Addition</span>
              </button>
            )}
          </div>
        </DraftSection>
      </DraftCard>

      {/* Removals Section - Editable */}
      <DraftCard>
        <DraftSection
          title="Suggested Removals"
          icon={<Minus className="w-5 h-5" />}
          color="rose"
        >
          <div className="space-y-4">
            {(draft.what_to_remove || []).map((removal, index) => (
              <EditableRemovalCard
                key={index}
                removal={removal}
                index={index}
                onUpdate={(updated) => handleUpdateRemoval(index, updated)}
                onDelete={() => handleDeleteRemoval(index)}
              />
            ))}

            {isAddingRemoval ? (
              <NewRemovalForm
                onSave={handleAddRemoval}
                onCancel={() => setIsAddingRemoval(false)}
              />
            ) : (
              <button
                onClick={() => setIsAddingRemoval(true)}
                className="flex items-center gap-2 w-full p-3 border-2 border-dashed border-rose-200 rounded-xl text-rose-500 hover:border-rose-300 hover:text-rose-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm font-medium">Add Removal</span>
              </button>
            )}
          </div>
        </DraftSection>
      </DraftCard>
    </div>
  );
}

// Editable Change Card
function EditableChangeCard({
  change,
  index,
  onUpdate,
  onDelete,
}: {
  change: ChangeItem;
  index: number;
  onUpdate: (updated: ChangeItem) => void;
  onDelete: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(change);

  const handleSave = () => {
    onUpdate(editData);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="relative p-4 bg-blue-50 rounded-xl border-2 border-blue-300">
        <div className="absolute -left-2 -top-2 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
          {index + 1}
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Current Value
            </label>
            <input
              type="text"
              value={editData.current}
              onChange={(e) => setEditData({ ...editData, current: e.target.value })}
              className="mt-1 w-full p-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-blue-600 uppercase tracking-wider">
              Suggested Value
            </label>
            <input
              type="text"
              value={editData.suggested}
              onChange={(e) => setEditData({ ...editData, suggested: e.target.value })}
              className="mt-1 w-full p-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Reasoning
            </label>
            <textarea
              value={editData.reasoning}
              onChange={(e) => setEditData({ ...editData, reasoning: e.target.value })}
              className="mt-1 w-full p-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
              rows={2}
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleSave}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600"
            >
              <Check className="w-3 h-3" /> Save
            </button>
            <button
              onClick={() => {
                setEditData(change);
                setIsEditing(false);
              }}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-200 text-slate-700 text-sm rounded-lg hover:bg-slate-300"
            >
              <X className="w-3 h-3" /> Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
      <div className="absolute -left-2 -top-2 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
        {index + 1}
      </div>
      <div className="absolute right-2 top-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => setIsEditing(true)}
          className="p-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
        >
          <Pencil className="w-3 h-3 text-slate-500" />
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 bg-white border border-slate-200 rounded-lg hover:bg-red-50 hover:border-red-200"
        >
          <Trash2 className="w-3 h-3 text-slate-500 hover:text-red-500" />
        </button>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Current
          </span>
          <p className="mt-1 text-sm text-slate-600 line-through decoration-slate-300">
            {change.current}
          </p>
        </div>
        <div>
          <span className="text-xs font-medium text-blue-600 uppercase tracking-wider">
            Suggested
          </span>
          <p className="mt-1 text-sm text-slate-900 font-medium">
            {change.suggested}
          </p>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-slate-200">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
          Reasoning
        </span>
        <p className="mt-1 text-sm text-slate-600">{change.reasoning}</p>
      </div>
    </div>
  );
}

// Editable Addition Card
function EditableAdditionCard({
  addition,
  index,
  onUpdate,
  onDelete,
}: {
  addition: AdditionItem;
  index: number;
  onUpdate: (updated: AdditionItem) => void;
  onDelete: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(addition);

  const handleSave = () => {
    onUpdate(editData);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="relative p-4 bg-emerald-100 rounded-xl border-2 border-emerald-300">
        <div className="absolute -left-2 -top-2 w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center">
          <Plus className="w-3 h-3" />
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-emerald-700 uppercase tracking-wider">
              What to Add
            </label>
            <input
              type="text"
              value={editData.addition}
              onChange={(e) => setEditData({ ...editData, addition: e.target.value })}
              className="mt-1 w-full p-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Reasoning
            </label>
            <textarea
              value={editData.reasoning}
              onChange={(e) => setEditData({ ...editData, reasoning: e.target.value })}
              className="mt-1 w-full p-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none"
              rows={2}
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleSave}
              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 text-white text-sm rounded-lg hover:bg-emerald-600"
            >
              <Check className="w-3 h-3" /> Save
            </button>
            <button
              onClick={() => {
                setEditData(addition);
                setIsEditing(false);
              }}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-200 text-slate-700 text-sm rounded-lg hover:bg-slate-300"
            >
              <X className="w-3 h-3" /> Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative p-4 bg-emerald-50 rounded-xl border border-emerald-100 hover:border-emerald-200 transition-colors">
      <div className="absolute -left-2 -top-2 w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center">
        <Plus className="w-3 h-3" />
      </div>
      <div className="absolute right-2 top-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => setIsEditing(true)}
          className="p-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
        >
          <Pencil className="w-3 h-3 text-slate-500" />
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 bg-white border border-slate-200 rounded-lg hover:bg-red-50 hover:border-red-200"
        >
          <Trash2 className="w-3 h-3 text-slate-500 hover:text-red-500" />
        </button>
      </div>
      <div>
        <span className="text-xs font-medium text-emerald-700 uppercase tracking-wider">
          Add
        </span>
        <p className="mt-1 text-sm text-slate-900 font-medium">
          {addition.addition}
        </p>
      </div>
      <div className="mt-3 pt-3 border-t border-emerald-200">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
          Reasoning
        </span>
        <p className="mt-1 text-sm text-slate-600">{addition.reasoning}</p>
      </div>
    </div>
  );
}

// Editable Removal Card
function EditableRemovalCard({
  removal,
  index,
  onUpdate,
  onDelete,
}: {
  removal: RemovalItem;
  index: number;
  onUpdate: (updated: RemovalItem) => void;
  onDelete: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(removal);

  const handleSave = () => {
    onUpdate(editData);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="relative p-4 bg-rose-100 rounded-xl border-2 border-rose-300">
        <div className="absolute -left-2 -top-2 w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center">
          <Minus className="w-3 h-3" />
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-rose-700 uppercase tracking-wider">
              What to Remove
            </label>
            <input
              type="text"
              value={editData.removal}
              onChange={(e) => setEditData({ ...editData, removal: e.target.value })}
              className="mt-1 w-full p-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Reasoning
            </label>
            <textarea
              value={editData.reasoning}
              onChange={(e) => setEditData({ ...editData, reasoning: e.target.value })}
              className="mt-1 w-full p-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 resize-none"
              rows={2}
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleSave}
              className="flex items-center gap-1 px-3 py-1.5 bg-rose-500 text-white text-sm rounded-lg hover:bg-rose-600"
            >
              <Check className="w-3 h-3" /> Save
            </button>
            <button
              onClick={() => {
                setEditData(removal);
                setIsEditing(false);
              }}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-200 text-slate-700 text-sm rounded-lg hover:bg-slate-300"
            >
              <X className="w-3 h-3" /> Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative p-4 bg-rose-50 rounded-xl border border-rose-100 hover:border-rose-200 transition-colors">
      <div className="absolute -left-2 -top-2 w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center">
        <Minus className="w-3 h-3" />
      </div>
      <div className="absolute right-2 top-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => setIsEditing(true)}
          className="p-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
        >
          <Pencil className="w-3 h-3 text-slate-500" />
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 bg-white border border-slate-200 rounded-lg hover:bg-red-50 hover:border-red-200"
        >
          <Trash2 className="w-3 h-3 text-slate-500 hover:text-red-500" />
        </button>
      </div>
      <div>
        <span className="text-xs font-medium text-rose-700 uppercase tracking-wider">
          Remove
        </span>
        <p className="mt-1 text-sm text-slate-900 font-medium line-through decoration-rose-300">
          {removal.removal}
        </p>
      </div>
      <div className="mt-3 pt-3 border-t border-rose-200">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
          Reasoning
        </span>
        <p className="mt-1 text-sm text-slate-600">{removal.reasoning}</p>
      </div>
    </div>
  );
}

// New Change Form
function NewChangeForm({
  onSave,
  onCancel,
}: {
  onSave: (change: ChangeItem) => void;
  onCancel: () => void;
}) {
  const [data, setData] = useState<ChangeItem>({ current: "", suggested: "", reasoning: "" });

  return (
    <div className="p-4 bg-blue-50 rounded-xl border-2 border-blue-300">
      <h4 className="text-sm font-medium text-blue-700 mb-3">Add New Change</h4>
      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Current Value
          </label>
          <input
            type="text"
            value={data.current}
            onChange={(e) => setData({ ...data, current: e.target.value })}
            placeholder="What currently exists..."
            className="mt-1 w-full p-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-blue-600 uppercase tracking-wider">
            Suggested Value
          </label>
          <input
            type="text"
            value={data.suggested}
            onChange={(e) => setData({ ...data, suggested: e.target.value })}
            placeholder="What it should be..."
            className="mt-1 w-full p-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Reasoning
          </label>
          <textarea
            value={data.reasoning}
            onChange={(e) => setData({ ...data, reasoning: e.target.value })}
            placeholder="Why this change is needed..."
            className="mt-1 w-full p-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
            rows={2}
          />
        </div>
        <div className="flex gap-2 pt-2">
          <button
            onClick={() => onSave(data)}
            disabled={!data.current || !data.suggested}
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check className="w-3 h-3" /> Add
          </button>
          <button
            onClick={onCancel}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-200 text-slate-700 text-sm rounded-lg hover:bg-slate-300"
          >
            <X className="w-3 h-3" /> Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// New Addition Form
function NewAdditionForm({
  onSave,
  onCancel,
}: {
  onSave: (addition: AdditionItem) => void;
  onCancel: () => void;
}) {
  const [data, setData] = useState<AdditionItem>({ addition: "", reasoning: "" });

  return (
    <div className="p-4 bg-emerald-50 rounded-xl border-2 border-emerald-300">
      <h4 className="text-sm font-medium text-emerald-700 mb-3">Add New Addition</h4>
      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium text-emerald-700 uppercase tracking-wider">
            What to Add
          </label>
          <input
            type="text"
            value={data.addition}
            onChange={(e) => setData({ ...data, addition: e.target.value })}
            placeholder="New item to add..."
            className="mt-1 w-full p-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Reasoning
          </label>
          <textarea
            value={data.reasoning}
            onChange={(e) => setData({ ...data, reasoning: e.target.value })}
            placeholder="Why this should be added..."
            className="mt-1 w-full p-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none"
            rows={2}
          />
        </div>
        <div className="flex gap-2 pt-2">
          <button
            onClick={() => onSave(data)}
            disabled={!data.addition}
            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 text-white text-sm rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check className="w-3 h-3" /> Add
          </button>
          <button
            onClick={onCancel}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-200 text-slate-700 text-sm rounded-lg hover:bg-slate-300"
          >
            <X className="w-3 h-3" /> Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// New Removal Form
function NewRemovalForm({
  onSave,
  onCancel,
}: {
  onSave: (removal: RemovalItem) => void;
  onCancel: () => void;
}) {
  const [data, setData] = useState<RemovalItem>({ removal: "", reasoning: "" });

  return (
    <div className="p-4 bg-rose-50 rounded-xl border-2 border-rose-300">
      <h4 className="text-sm font-medium text-rose-700 mb-3">Add New Removal</h4>
      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium text-rose-700 uppercase tracking-wider">
            What to Remove
          </label>
          <input
            type="text"
            value={data.removal}
            onChange={(e) => setData({ ...data, removal: e.target.value })}
            placeholder="Item to remove..."
            className="mt-1 w-full p-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Reasoning
          </label>
          <textarea
            value={data.reasoning}
            onChange={(e) => setData({ ...data, reasoning: e.target.value })}
            placeholder="Why this should be removed..."
            className="mt-1 w-full p-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/20 resize-none"
            rows={2}
          />
        </div>
        <div className="flex gap-2 pt-2">
          <button
            onClick={() => onSave(data)}
            disabled={!data.removal}
            className="flex items-center gap-1 px-3 py-1.5 bg-rose-500 text-white text-sm rounded-lg hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check className="w-3 h-3" /> Add
          </button>
          <button
            onClick={onCancel}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-200 text-slate-700 text-sm rounded-lg hover:bg-slate-300"
          >
            <X className="w-3 h-3" /> Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
