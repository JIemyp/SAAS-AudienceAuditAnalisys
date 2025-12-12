"use client";

import { use, useState } from "react";
import {
  DraftCard,
  DraftSection,
} from "@/components/generation/GenerationPage";
import { SegmentGenerationPage } from "@/components/generation/SegmentGenerationPage";
import { TriggersDraft, TriggerItem } from "@/types";
import { Zap, Brain, Clock, MessageSquare, Pencil, Trash2, Check, X, Plus, Sparkles, Loader2 } from "lucide-react";

export default function TriggersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = use(params);

  return (
    <SegmentGenerationPage<TriggersDraft>
      projectId={projectId}
      title="Deep Purchase Triggers"
      description="Discover the deep psychological triggers that drive your audience's purchase decisions. Complete this for each segment."
      stepType="triggers"
      generateEndpoint="/api/generate/triggers"
      approveEndpoint="/api/approve/triggers"
      draftTable="triggers_drafts"
      approvedTable="triggers"
      nextStepUrl="/generate/pains"
      icon={<Zap className="w-6 h-6" />}
      emptyStateMessage="Uncover the psychological triggers and key moments that drive your customers to make purchase decisions."
      renderDraft={(draft, onEdit) => (
        <TriggersDraftView draft={draft} onEdit={onEdit} projectId={projectId} segmentId={draft.segment_id} />
      )}
    />
  );
}

function TriggersDraftView({
  draft,
  onEdit,
  projectId,
  segmentId,
}: {
  draft: TriggersDraft;
  onEdit: (updates: Partial<TriggersDraft>) => void;
  projectId: string;
  segmentId?: string;
}) {
  const handleEditTrigger = (index: number, updated: TriggerItem) => {
    const triggers = [...(draft.triggers || [])];
    triggers[index] = updated;
    onEdit({ triggers });
  };

  const handleDeleteTrigger = (index: number) => {
    const triggers = (draft.triggers || []).filter((_, i) => i !== index);
    onEdit({ triggers });
  };

  const handleAddTrigger = (trigger: TriggerItem) => {
    const triggers = [...(draft.triggers || []), trigger];
    onEdit({ triggers });
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="p-6 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-amber-100 rounded-lg">
            <Zap className="w-5 h-5 text-amber-600" />
          </div>
          <h3 className="font-semibold text-amber-900">
            {draft.triggers?.length || 0} Purchase Triggers Identified
          </h3>
        </div>
        <p className="text-sm text-amber-700">
          These are the psychological moments and motivations that drive your audience to take action.
        </p>
      </div>

      {/* Triggers List */}
      <DraftCard>
        <DraftSection
          title="Identified Triggers"
          icon={<Brain className="w-5 h-5" />}
          color="orange"
        >
          <div className="space-y-6">
            {draft.triggers?.map((trigger, index) => (
              <EditableTriggerCard
                key={index}
                trigger={trigger}
                index={index}
                onEdit={(updated) => handleEditTrigger(index, updated)}
                onDelete={() => handleDeleteTrigger(index)}
                projectId={projectId}
                segmentId={segmentId}
              />
            ))}
            <AddTriggerForm onAdd={handleAddTrigger} />
          </div>
        </DraftSection>
      </DraftCard>
    </div>
  );
}

function EditableTriggerCard({
  trigger,
  index,
  onEdit,
  onDelete,
  projectId,
  segmentId,
}: {
  trigger: TriggerItem;
  index: number;
  onEdit: (trigger: TriggerItem) => void;
  onDelete: () => void;
  projectId?: string;
  segmentId?: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [name, setName] = useState(trigger.name);
  const [description, setDescription] = useState(trigger.description);
  const [psychologicalBasis, setPsychologicalBasis] = useState(trigger.psychological_basis);
  const [triggerMoment, setTriggerMoment] = useState(trigger.trigger_moment);
  const [messagingAngle, setMessagingAngle] = useState(trigger.messaging_angle);

  const handleSave = () => {
    onEdit({
      name,
      description,
      psychological_basis: psychologicalBasis,
      trigger_moment: triggerMoment,
      messaging_angle: messagingAngle,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setName(trigger.name);
    setDescription(trigger.description);
    setPsychologicalBasis(trigger.psychological_basis);
    setTriggerMoment(trigger.trigger_moment);
    setMessagingAngle(trigger.messaging_angle);
    setIsEditing(false);
  };

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
          fieldType: "trigger",
          currentValue: description,
          context: `Trigger: ${name}`,
        }),
      });

      const data = await res.json();
      if (data.success && data.value) {
        setDescription(data.value);
        onEdit({
          name,
          description: data.value,
          psychological_basis: psychologicalBasis,
          trigger_moment: triggerMoment,
          messaging_angle: messagingAngle,
        });
      }
    } catch (err) {
      console.error("Failed to regenerate:", err);
    } finally {
      setIsRegenerating(false);
    }
  };

  if (isEditing) {
    return (
      <div className="relative ml-4 p-6 bg-white border-2 border-slate-300 rounded-2xl">
        <div className="absolute -left-3 -top-3 w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg shadow-amber-500/30">
          {index + 1}
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Trigger Name</label>
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
              rows={3}
            />
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Psychological Basis</label>
              <textarea
                value={psychologicalBasis}
                onChange={(e) => setPsychologicalBasis(e.target.value)}
                className="w-full mt-1 p-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                rows={3}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Trigger Moment</label>
              <textarea
                value={triggerMoment}
                onChange={(e) => setTriggerMoment(e.target.value)}
                className="w-full mt-1 p-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                rows={3}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Messaging Angle</label>
              <textarea
                value={messagingAngle}
                onChange={(e) => setMessagingAngle(e.target.value)}
                className="w-full mt-1 p-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                rows={3}
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
      </div>
    );
  }

  return (
    <div className="group relative">
      {/* Index Badge */}
      <div className="absolute -left-3 -top-3 w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg shadow-amber-500/30">
        {index + 1}
      </div>

      <div className="ml-4 p-6 bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-2xl hover:shadow-md transition-all">
        {/* Always visible action buttons */}
        <div className="absolute top-3 right-3 flex gap-1">
          <button
            onClick={() => setIsEditing(true)}
            className="p-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-blue-100 hover:text-blue-600 border border-slate-200 transition-colors"
            title="Edit"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={handleRegenerate}
            disabled={isRegenerating}
            className="p-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-purple-100 hover:text-purple-600 border border-slate-200 transition-colors disabled:opacity-50"
            title="Regenerate with AI"
          >
            {isRegenerating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-red-100 hover:text-red-600 border border-slate-200 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Trigger Name */}
        <h4 className="text-lg font-semibold text-slate-900 mb-2 pr-16">
          {trigger.name}
        </h4>

        {/* Description */}
        <p className="text-slate-700 mb-4 leading-relaxed">
          {trigger.description}
        </p>

        {/* Details Grid */}
        <div className="grid md:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
          {/* Psychological Basis */}
          <div className="p-4 bg-purple-50 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="w-4 h-4 text-purple-600" />
              <span className="text-xs font-medium text-purple-700 uppercase tracking-wider">
                Psychological Basis
              </span>
            </div>
            <p className="text-sm text-purple-900">{trigger.psychological_basis}</p>
          </div>

          {/* Trigger Moment */}
          <div className="p-4 bg-blue-50 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-medium text-blue-700 uppercase tracking-wider">
                Trigger Moment
              </span>
            </div>
            <p className="text-sm text-blue-900">{trigger.trigger_moment}</p>
          </div>

          {/* Messaging Angle */}
          <div className="p-4 bg-emerald-50 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-medium text-emerald-700 uppercase tracking-wider">
                Messaging Angle
              </span>
            </div>
            <p className="text-sm text-emerald-900">{trigger.messaging_angle}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function AddTriggerForm({ onAdd }: { onAdd: (trigger: TriggerItem) => void }) {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [psychologicalBasis, setPsychologicalBasis] = useState("");
  const [triggerMoment, setTriggerMoment] = useState("");
  const [messagingAngle, setMessagingAngle] = useState("");

  const handleAdd = () => {
    if (name.trim() && description.trim()) {
      onAdd({
        name: name.trim(),
        description: description.trim(),
        psychological_basis: psychologicalBasis.trim(),
        trigger_moment: triggerMoment.trim(),
        messaging_angle: messagingAngle.trim(),
      });
      setName("");
      setDescription("");
      setPsychologicalBasis("");
      setTriggerMoment("");
      setMessagingAngle("");
      setIsAdding(false);
    }
  };

  if (isAdding) {
    return (
      <div className="p-6 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Trigger Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name of the trigger"
              className="w-full mt-1 p-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe this trigger"
              className="w-full mt-1 p-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              rows={3}
            />
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Psychological Basis</label>
              <textarea
                value={psychologicalBasis}
                onChange={(e) => setPsychologicalBasis(e.target.value)}
                placeholder="The psychology behind it"
                className="w-full mt-1 p-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                rows={3}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Trigger Moment</label>
              <textarea
                value={triggerMoment}
                onChange={(e) => setTriggerMoment(e.target.value)}
                placeholder="When does this trigger?"
                className="w-full mt-1 p-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                rows={3}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Messaging Angle</label>
              <textarea
                value={messagingAngle}
                onChange={(e) => setMessagingAngle(e.target.value)}
                placeholder="How to use in messaging"
                className="w-full mt-1 p-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                rows={3}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 text-sm"
            >
              <Check className="w-4 h-4" /> Add Trigger
            </button>
            <button
              onClick={() => {
                setIsAdding(false);
                setName("");
                setDescription("");
                setPsychologicalBasis("");
                setTriggerMoment("");
                setMessagingAngle("");
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
      className="w-full p-4 rounded-xl border-2 border-dashed border-amber-300 hover:border-amber-400 text-amber-600 hover:text-amber-700 transition-colors flex items-center justify-center gap-2"
    >
      <Plus className="w-4 h-4" />
      Add Trigger
    </button>
  );
}
