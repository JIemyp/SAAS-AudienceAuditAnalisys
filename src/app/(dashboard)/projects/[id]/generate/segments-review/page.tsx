"use client";

import { use, useState } from "react";
import {
  GenerationPage,
  DraftCard,
  DraftSection,
} from "@/components/generation/GenerationPage";
import { SegmentsReviewDraft, OverlapItem, BreadthItem, MissingSegmentItem } from "@/types";
import { Search, Layers, Maximize, Minimize, Plus, AlertTriangle, CheckCircle2, Pencil, Trash2, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SegmentsReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = use(params);

  return (
    <GenerationPage<SegmentsReviewDraft>
      projectId={projectId}
      title="Segments Self-Review"
      description="AI critically reviews the generated segments for overlaps, breadth issues, and missing opportunities."
      generateEndpoint="/api/generate/segments-review"
      approveEndpoint="/api/approve/segments-review"
      draftTable="segments_review_drafts"
      nextStepUrl="/generate/segment-details"
      icon={<Search className="w-6 h-6" />}
      emptyStateMessage="Let AI analyze the segments for potential improvements - overlaps, too broad/narrow segments, and missing opportunities."
      renderDraft={(draft, onEdit) => (
        <SegmentsReviewDraftView draft={draft} onEdit={onEdit} />
      )}
    />
  );
}

function SegmentsReviewDraftView({
  draft,
  onEdit,
}: {
  draft: SegmentsReviewDraft;
  onEdit: (updates: Partial<SegmentsReviewDraft>) => void;
}) {
  const hasOverlaps = draft.overlaps && draft.overlaps.length > 0;
  const hasTooBroad = draft.too_broad && draft.too_broad.length > 0;
  const hasTooNarrow = draft.too_narrow && draft.too_narrow.length > 0;
  const hasMissing = draft.missing_segments && draft.missing_segments.length > 0;
  const hasRecommendations = draft.recommendations && draft.recommendations.length > 0;

  const hasNoIssues = !hasOverlaps && !hasTooBroad && !hasTooNarrow && !hasMissing;

  const handleEditOverlap = (index: number, updated: OverlapItem) => {
    const newOverlaps = [...(draft.overlaps || [])];
    newOverlaps[index] = updated;
    onEdit({ overlaps: newOverlaps });
  };

  const handleDeleteOverlap = (index: number) => {
    const newOverlaps = (draft.overlaps || []).filter((_, i) => i !== index);
    onEdit({ overlaps: newOverlaps });
  };

  const handleEditTooBroad = (index: number, updated: BreadthItem) => {
    const newTooBroad = [...(draft.too_broad || [])];
    newTooBroad[index] = updated;
    onEdit({ too_broad: newTooBroad });
  };

  const handleDeleteTooBroad = (index: number) => {
    const newTooBroad = (draft.too_broad || []).filter((_, i) => i !== index);
    onEdit({ too_broad: newTooBroad });
  };

  const handleEditTooNarrow = (index: number, updated: BreadthItem) => {
    const newTooNarrow = [...(draft.too_narrow || [])];
    newTooNarrow[index] = updated;
    onEdit({ too_narrow: newTooNarrow });
  };

  const handleDeleteTooNarrow = (index: number) => {
    const newTooNarrow = (draft.too_narrow || []).filter((_, i) => i !== index);
    onEdit({ too_narrow: newTooNarrow });
  };

  const handleEditMissing = (index: number, updated: MissingSegmentItem) => {
    const newMissing = [...(draft.missing_segments || [])];
    newMissing[index] = updated;
    onEdit({ missing_segments: newMissing });
  };

  const handleDeleteMissing = (index: number) => {
    const newMissing = (draft.missing_segments || []).filter((_, i) => i !== index);
    onEdit({ missing_segments: newMissing });
  };

  const handleEditRecommendation = (index: number, value: string) => {
    const newRecs = [...(draft.recommendations || [])];
    newRecs[index] = value;
    onEdit({ recommendations: newRecs });
  };

  const handleDeleteRecommendation = (index: number) => {
    const newRecs = (draft.recommendations || []).filter((_, i) => i !== index);
    onEdit({ recommendations: newRecs });
  };

  const handleAddRecommendation = () => {
    onEdit({ recommendations: [...(draft.recommendations || []), "New recommendation"] });
  };

  return (
    <div className="space-y-6">
      {/* Summary Banner */}
      <div className={cn(
        "p-6 rounded-2xl border",
        hasNoIssues
          ? "bg-linear-to-r from-emerald-50 to-teal-50 border-emerald-200"
          : "bg-linear-to-r from-amber-50 to-orange-50 border-amber-200"
      )}>
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2 rounded-lg",
            hasNoIssues ? "bg-emerald-100" : "bg-amber-100"
          )}>
            {hasNoIssues ? (
              <CheckCircle2 className={cn("w-5 h-5", hasNoIssues ? "text-emerald-600" : "text-amber-600")} />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            )}
          </div>
          <div>
            <h3 className={cn(
              "font-semibold",
              hasNoIssues ? "text-emerald-900" : "text-amber-900"
            )}>
              {hasNoIssues
                ? "Segments Look Well-Balanced"
                : "Potential Improvements Identified"}
            </h3>
            <p className={cn(
              "text-sm",
              hasNoIssues ? "text-emerald-600" : "text-amber-600"
            )}>
              {hasNoIssues
                ? "No significant issues found with the current segments"
                : "Review the suggestions below to refine your segments"}
            </p>
          </div>
        </div>
      </div>

      {/* Overlaps */}
      {hasOverlaps && (
        <DraftCard>
          <DraftSection
            title="Segment Overlaps"
            icon={<Layers className="w-5 h-5" />}
            color="orange"
          >
            <p className="text-sm text-slate-500 mb-4">
              These segments may have overlapping characteristics
            </p>
            <div className="space-y-4">
              {draft.overlaps?.map((overlap, index) => (
                <EditableOverlapCard
                  key={index}
                  overlap={overlap}
                  onEdit={(updated) => handleEditOverlap(index, updated)}
                  onDelete={() => handleDeleteOverlap(index)}
                />
              ))}
            </div>
          </DraftSection>
        </DraftCard>
      )}

      {/* Too Broad */}
      {hasTooBroad && (
        <DraftCard>
          <DraftSection
            title="Segments Too Broad"
            icon={<Maximize className="w-5 h-5" />}
            color="rose"
          >
            <p className="text-sm text-slate-500 mb-4">
              These segments might be too broad and could benefit from refinement
            </p>
            <div className="space-y-4">
              {draft.too_broad?.map((item, index) => (
                <EditableBreadthCard
                  key={index}
                  item={item}
                  type="broad"
                  onEdit={(updated) => handleEditTooBroad(index, updated)}
                  onDelete={() => handleDeleteTooBroad(index)}
                />
              ))}
            </div>
          </DraftSection>
        </DraftCard>
      )}

      {/* Too Narrow */}
      {hasTooNarrow && (
        <DraftCard>
          <DraftSection
            title="Segments Too Narrow"
            icon={<Minimize className="w-5 h-5" />}
            color="blue"
          >
            <p className="text-sm text-slate-500 mb-4">
              These segments might be too narrow and could be expanded
            </p>
            <div className="space-y-4">
              {draft.too_narrow?.map((item, index) => (
                <EditableBreadthCard
                  key={index}
                  item={item}
                  type="narrow"
                  onEdit={(updated) => handleEditTooNarrow(index, updated)}
                  onDelete={() => handleDeleteTooNarrow(index)}
                />
              ))}
            </div>
          </DraftSection>
        </DraftCard>
      )}

      {/* Missing Segments */}
      {hasMissing && (
        <DraftCard>
          <DraftSection
            title="Potentially Missing Segments"
            icon={<Plus className="w-5 h-5" />}
            color="emerald"
          >
            <p className="text-sm text-slate-500 mb-4">
              Consider adding these segments to your analysis
            </p>
            <div className="space-y-4">
              {draft.missing_segments?.map((item, index) => (
                <EditableMissingSegmentCard
                  key={index}
                  item={item}
                  onEdit={(updated) => handleEditMissing(index, updated)}
                  onDelete={() => handleDeleteMissing(index)}
                />
              ))}
            </div>
          </DraftSection>
        </DraftCard>
      )}

      {/* Recommendations */}
      {hasRecommendations && (
        <DraftCard>
          <DraftSection
            title="General Recommendations"
            icon={<CheckCircle2 className="w-5 h-5" />}
            color="purple"
          >
            <ul className="space-y-3">
              {draft.recommendations?.map((rec, index) => (
                <EditableRecommendationItem
                  key={index}
                  recommendation={rec}
                  index={index}
                  onEdit={(value) => handleEditRecommendation(index, value)}
                  onDelete={() => handleDeleteRecommendation(index)}
                />
              ))}
            </ul>
            <button
              onClick={handleAddRecommendation}
              className="mt-4 w-full p-3 rounded-lg border-2 border-dashed border-purple-300 hover:border-purple-400 text-purple-600 hover:text-purple-700 transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Recommendation
            </button>
          </DraftSection>
        </DraftCard>
      )}
    </div>
  );
}

function EditableOverlapCard({
  overlap,
  onEdit,
  onDelete,
}: {
  overlap: OverlapItem;
  onEdit: (updated: OverlapItem) => void;
  onDelete: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [segments, setSegments] = useState(overlap.segments.join(", "));
  const [description, setDescription] = useState(overlap.overlap_description);
  const [recommendation, setRecommendation] = useState(overlap.recommendation);

  const handleSave = () => {
    onEdit({
      segments: segments.split(",").map(s => parseInt(s.trim())).filter(n => !isNaN(n)),
      overlap_description: description,
      recommendation,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setSegments(overlap.segments.join(", "));
    setDescription(overlap.overlap_description);
    setRecommendation(overlap.recommendation);
    setIsEditing(false);
  };

  return (
    <div className="group relative p-4 bg-orange-50 border border-orange-100 rounded-xl">
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
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Segments (comma separated)</label>
            <input
              type="text"
              value={segments}
              onChange={(e) => setSegments(e.target.value)}
              className="w-full mt-1 p-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              placeholder="1, 2, 3"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Overlap Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full mt-1 p-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              rows={3}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Recommendation</label>
            <textarea
              value={recommendation}
              onChange={(e) => setRecommendation(e.target.value)}
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
      ) : (
        <>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-medium text-orange-700 uppercase tracking-wider">
              Overlapping Segments
            </span>
            <div className="flex gap-1">
              {overlap.segments.map((seg, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-bold rounded-full"
                >
                  #{seg}
                </span>
              ))}
            </div>
          </div>
          <p className="text-sm text-slate-700 mb-3">{overlap.overlap_description}</p>
          <div className="pt-3 border-t border-orange-200">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Recommendation
            </span>
            <p className="mt-1 text-sm text-slate-600">{overlap.recommendation}</p>
          </div>
        </>
      )}
    </div>
  );
}

function EditableBreadthCard({
  item,
  type,
  onEdit,
  onDelete,
}: {
  item: BreadthItem;
  type: "broad" | "narrow";
  onEdit: (updated: BreadthItem) => void;
  onDelete: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [segment, setSegment] = useState(item.segment.toString());
  const [issue, setIssue] = useState(item.issue);
  const [recommendation, setRecommendation] = useState(item.recommendation);

  const colors = type === "broad"
    ? { bg: "bg-rose-50", border: "border-rose-100", badge: "bg-rose-100 text-rose-700", borderT: "border-rose-200" }
    : { bg: "bg-blue-50", border: "border-blue-100", badge: "bg-blue-100 text-blue-700", borderT: "border-blue-200" };

  const handleSave = () => {
    onEdit({
      segment: parseInt(segment) || 0,
      issue,
      recommendation,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setSegment(item.segment.toString());
    setIssue(item.issue);
    setRecommendation(item.recommendation);
    setIsEditing(false);
  };

  return (
    <div className={cn("group relative p-4 border rounded-xl", colors.bg, colors.border)}>
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
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Segment Number</label>
            <input
              type="number"
              value={segment}
              onChange={(e) => setSegment(e.target.value)}
              className="w-full mt-1 p-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Issue</label>
            <textarea
              value={issue}
              onChange={(e) => setIssue(e.target.value)}
              className="w-full mt-1 p-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              rows={3}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Recommendation</label>
            <textarea
              value={recommendation}
              onChange={(e) => setRecommendation(e.target.value)}
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
      ) : (
        <>
          <div className="flex items-center gap-2 mb-3">
            <span className={cn("px-2 py-0.5 text-xs font-bold rounded-full", colors.badge)}>
              Segment #{item.segment}
            </span>
          </div>
          <p className="text-sm text-slate-700 mb-3">{item.issue}</p>
          <div className={cn("pt-3 border-t", colors.borderT)}>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Recommendation
            </span>
            <p className="mt-1 text-sm text-slate-600">{item.recommendation}</p>
          </div>
        </>
      )}
    </div>
  );
}

function EditableMissingSegmentCard({
  item,
  onEdit,
  onDelete,
}: {
  item: MissingSegmentItem;
  onEdit: (updated: MissingSegmentItem) => void;
  onDelete: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [suggestedName, setSuggestedName] = useState(item.suggested_name);
  const [description, setDescription] = useState(item.description);
  const [reasoning, setReasoning] = useState(item.reasoning);

  const handleSave = () => {
    onEdit({
      suggested_name: suggestedName,
      description,
      reasoning,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setSuggestedName(item.suggested_name);
    setDescription(item.description);
    setReasoning(item.reasoning);
    setIsEditing(false);
  };

  return (
    <div className="group relative p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
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
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Suggested Name</label>
            <input
              type="text"
              value={suggestedName}
              onChange={(e) => setSuggestedName(e.target.value)}
              className="w-full mt-1 p-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Reasoning</label>
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
      ) : (
        <>
          <div className="flex items-center gap-2 mb-2">
            <Plus className="w-4 h-4 text-emerald-600" />
            <h4 className="font-semibold text-slate-900">{item.suggested_name}</h4>
          </div>
          <p className="text-sm text-slate-700 mb-3">{item.description}</p>
          <div className="pt-3 border-t border-emerald-200">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Why Add This Segment
            </span>
            <p className="mt-1 text-sm text-slate-600">{item.reasoning}</p>
          </div>
        </>
      )}
    </div>
  );
}

function EditableRecommendationItem({
  recommendation,
  index,
  onEdit,
  onDelete,
}: {
  recommendation: string;
  index: number;
  onEdit: (value: string) => void;
  onDelete: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(recommendation);

  const handleSave = () => {
    onEdit(value);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setValue(recommendation);
    setIsEditing(false);
  };

  return (
    <li className="group relative flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
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
        <div className="flex-1 space-y-2">
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full p-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            rows={2}
          />
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
          <span className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
            {index + 1}
          </span>
          <p className="text-sm text-slate-700 flex-1">{recommendation}</p>
        </>
      )}
    </li>
  );
}
