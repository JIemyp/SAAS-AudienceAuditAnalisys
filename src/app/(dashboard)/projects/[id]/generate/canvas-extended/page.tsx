"use client";

import { use, useState } from "react";
import {
  DraftCard,
  DraftSection,
} from "@/components/generation/GenerationPage";
import { SegmentGenerationPage } from "@/components/generation/SegmentGenerationPage";
import { CanvasExtendedDraft, DifferentAngle } from "@/types";
import { Sparkles, BookOpen, TrendingUp, Heart, ShoppingBag, Smile, Eye, Pencil, Trash2, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { EditableField } from "@/components/generation/EditableField";

export default function CanvasExtendedPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = use(params);

  return (
    <SegmentGenerationPage<CanvasExtendedDraft>
      projectId={projectId}
      title="Extended Canvas Analysis"
      description="The final deep analysis exploring the pain from multiple angles, emotional journey, and purchase moment. Complete this for each segment."
      stepType="canvas-extended"
      generateEndpoint="/api/generate/canvas-extended"
      approveEndpoint="/api/approve/canvas-extended"
      draftTable="canvas_extended_drafts"
      approvedTable="canvas_extended"
      nextStepUrl="/overview"
      icon={<Sparkles className="w-6 h-6" />}
      emptyStateMessage="Generate the final comprehensive analysis with journey mapping, emotional peaks, and purchase insights."
      renderDraft={(draft, onEdit) => (
        <CanvasExtendedDraftView draft={draft} onEdit={onEdit} />
      )}
    />
  );
}

function CanvasExtendedDraftView({
  draft,
  onEdit,
}: {
  draft: CanvasExtendedDraft;
  onEdit: (updates: Partial<CanvasExtendedDraft>) => void;
}) {
  const handleEditAngle = (index: number, updated: DifferentAngle) => {
    const newAngles = [...(draft.different_angles || [])];
    newAngles[index] = updated;
    onEdit({ different_angles: newAngles });
  };

  const handleDeleteAngle = (index: number) => {
    const newAngles = (draft.different_angles || []).filter((_, i) => i !== index);
    onEdit({ different_angles: newAngles });
  };

  return (
    <div className="space-y-6">
      {/* Completion Banner */}
      <div className="p-6 bg-linear-to-r from-violet-50 via-purple-50 to-fuchsia-50 border border-purple-200 rounded-2xl">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-linear-to-br from-violet-500 to-purple-600 rounded-xl text-white">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-purple-900">
              Final Analysis Complete
            </h3>
            <p className="text-sm text-purple-600">
              This is the deepest level of pain analysis. After approval, your research will be compiled.
            </p>
          </div>
        </div>
      </div>

      {/* Extended Analysis */}
      <DraftCard>
        <DraftSection
          title="Extended Analysis"
          icon={<BookOpen className="w-5 h-5" />}
          color="purple"
        >
          <div className="prose prose-slate prose-sm max-w-none">
            <EditableField
              value={draft.extended_analysis}
              onSave={(value) => onEdit({ extended_analysis: value })}
              multiline
              rows={8}
            />
          </div>
        </DraftSection>
      </DraftCard>

      {/* Different Angles */}
      {draft.different_angles && draft.different_angles.length > 0 && (
        <DraftCard>
          <DraftSection
            title="Different Perspectives"
            icon={<Eye className="w-5 h-5" />}
            color="blue"
          >
            <p className="text-sm text-slate-500 mb-4">
              Exploring the pain from different customer perspectives
            </p>
            <div className="space-y-4">
              {draft.different_angles.map((angle, index) => (
                <EditableAngleCard
                  key={index}
                  angle={angle}
                  index={index}
                  onEdit={(updated) => handleEditAngle(index, updated)}
                  onDelete={() => handleDeleteAngle(index)}
                />
              ))}
            </div>
          </DraftSection>
        </DraftCard>
      )}

      {/* Customer Journey */}
      <DraftCard>
        <DraftSection
          title="Customer Journey"
          icon={<TrendingUp className="w-5 h-5" />}
          color="emerald"
        >
          <div className="p-4 bg-linear-to-br from-emerald-50 to-teal-50 rounded-xl">
            <EditableField
              value={draft.journey_description}
              onSave={(value) => onEdit({ journey_description: value })}
              multiline
              rows={4}
            />
          </div>
        </DraftSection>
      </DraftCard>

      {/* Emotional Journey Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Emotional Peaks */}
        <DraftCard>
          <DraftSection
            title="Emotional Peaks"
            icon={<Heart className="w-5 h-5" />}
            color="rose"
          >
            <p className="text-sm text-slate-500 mb-3">
              When the pain is most intense
            </p>
            <div className="p-4 bg-rose-50 rounded-xl">
              <EditableField
                value={draft.emotional_peaks}
                onSave={(value) => onEdit({ emotional_peaks: value })}
                multiline
                rows={3}
              />
            </div>
          </DraftSection>
        </DraftCard>

        {/* Purchase Moment */}
        <DraftCard>
          <DraftSection
            title="Purchase Moment"
            icon={<ShoppingBag className="w-5 h-5" />}
            color="orange"
          >
            <p className="text-sm text-slate-500 mb-3">
              What happens at the decision point
            </p>
            <div className="p-4 bg-orange-50 rounded-xl">
              <EditableField
                value={draft.purchase_moment}
                onSave={(value) => onEdit({ purchase_moment: value })}
                multiline
                rows={3}
              />
            </div>
          </DraftSection>
        </DraftCard>
      </div>

      {/* Post Purchase */}
      <DraftCard>
        <DraftSection
          title="Post-Purchase Reality"
          icon={<Smile className="w-5 h-5" />}
          color="emerald"
        >
          <p className="text-sm text-slate-500 mb-3">
            What happens after they buy
          </p>
          <div className="p-4 bg-linear-to-r from-emerald-50 to-green-50 rounded-xl">
            <EditableField
              value={draft.post_purchase}
              onSave={(value) => onEdit({ post_purchase: value })}
              multiline
              rows={4}
            />
          </div>
        </DraftSection>
      </DraftCard>
    </div>
  );
}

function EditableAngleCard({
  angle,
  index,
  onEdit,
  onDelete,
}: {
  angle: DifferentAngle;
  index: number;
  onEdit: (updated: DifferentAngle) => void;
  onDelete: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [angleValue, setAngleValue] = useState(angle.angle);
  const [narrative, setNarrative] = useState(angle.narrative);

  const colors = [
    "from-blue-50 to-indigo-50 border-blue-200",
    "from-purple-50 to-violet-50 border-purple-200",
    "from-emerald-50 to-teal-50 border-emerald-200",
    "from-amber-50 to-orange-50 border-amber-200",
    "from-rose-50 to-pink-50 border-rose-200",
  ];

  const badgeColors = [
    "bg-blue-100 text-blue-700",
    "bg-purple-100 text-purple-700",
    "bg-emerald-100 text-emerald-700",
    "bg-amber-100 text-amber-700",
    "bg-rose-100 text-rose-700",
  ];

  const handleSave = () => {
    onEdit({ angle: angleValue, narrative });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setAngleValue(angle.angle);
    setNarrative(angle.narrative);
    setIsEditing(false);
  };

  return (
    <div className={cn(
      "group relative p-5 rounded-xl border bg-linear-to-br",
      colors[index % colors.length]
    )}>
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
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Angle</label>
            <input
              type="text"
              value={angleValue}
              onChange={(e) => setAngleValue(e.target.value)}
              className="w-full mt-1 p-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Narrative</label>
            <textarea
              value={narrative}
              onChange={(e) => setNarrative(e.target.value)}
              className="w-full mt-1 p-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              rows={4}
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
          <div className="flex items-center gap-2 mb-3">
            <span className={cn(
              "px-3 py-1 text-xs font-semibold rounded-full",
              badgeColors[index % badgeColors.length]
            )}>
              {angle.angle}
            </span>
          </div>
          <p className="text-slate-700 leading-relaxed text-sm">
            {angle.narrative}
          </p>
        </>
      )}
    </div>
  );
}
