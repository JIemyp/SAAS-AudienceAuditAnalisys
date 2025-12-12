"use client";

import React, { use, useState, useEffect, createContext, useContext } from "react";
import {
  GenerationPage,
  DraftCard,
} from "@/components/generation/GenerationPage";
import { NeedItem, CoreValueItem, ObjectionItem, AwarenessLevel, SegmentFinal } from "@/types";
import { FileText, Target, Heart, Shield, Eye, ChevronDown, ChevronUp, Users, Brain, Globe, ShoppingCart, UserCircle, RefreshCw, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// Extended type for the draft that might contain multiple segment details
interface SegmentDetailsDraftData {
  id: string;
  project_id: string;
  segment_id: string;
  segment_name?: string;
  // Behavior fields
  sociodemographics?: string;
  psychographics?: string;
  online_behavior?: string;
  buying_behavior?: string;
  // Analysis fields
  needs: NeedItem[];
  core_values: CoreValueItem[];
  awareness_level: AwarenessLevel;
  objections: ObjectionItem[];
  version: number;
  created_at: string;
}

// Context for segment names and project ID
interface SegmentContextValue {
  segmentNames: Record<string, string>;
  projectId: string;
  regenerateField: (draftId: string, fieldName: string) => Promise<unknown>;
  regeneratingFields: Set<string>;
}

const SegmentContext = createContext<SegmentContextValue>({
  segmentNames: {},
  projectId: "",
  regenerateField: async () => {},
  regeneratingFields: new Set(),
});

export default function SegmentDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = use(params);
  const [segmentNames, setSegmentNames] = useState<Record<string, string>>({});
  const [regeneratingFields, setRegeneratingFields] = useState<Set<string>>(new Set());
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch segment names from segments_final
  useEffect(() => {
    const fetchSegmentNames = async () => {
      try {
        const res = await fetch(`/api/segments/${projectId}?source=final`);
        const data = await res.json();
        if (data.success && data.segments) {
          const names: Record<string, string> = {};
          data.segments.forEach((seg: SegmentFinal) => {
            names[seg.id] = seg.name;
          });
          setSegmentNames(names);
        }
      } catch (err) {
        console.error("Failed to fetch segment names:", err);
      }
    };
    fetchSegmentNames();
  }, [projectId]);

  // Regenerate a single field with AI
  const regenerateField = async (draftId: string, fieldName: string) => {
    const key = `${draftId}-${fieldName}`;
    setRegeneratingFields(prev => new Set(prev).add(key));

    try {
      const res = await fetch("/api/generate/segment-details-field", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, draftId, fieldName }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to regenerate field");
      }

      // Force refresh to show updated data
      setRefreshKey(prev => prev + 1);
      return data.newValue;
    } catch (err) {
      console.error(`Failed to regenerate ${fieldName}:`, err);
      throw err;
    } finally {
      setRegeneratingFields(prev => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  };

  return (
    <SegmentContext.Provider value={{ segmentNames, projectId, regenerateField, regeneratingFields }}>
      <GenerationPage<SegmentDetailsDraftData>
        key={refreshKey}
        projectId={projectId}
        title="Segment Details"
        description="Deep dive into each segment with needs, values, awareness levels, and objections."
        generateEndpoint="/api/generate/segment-details"
        approveEndpoint="/api/approve/segment-details"
        draftTable="segment_details_drafts"
        nextStepUrl="/generate/jobs"
        icon={<FileText className="w-6 h-6" />}
        emptyStateMessage="Generate detailed analysis for each segment including needs, core values, and potential objections."
        renderDraft={(draft, onEdit) => (
          <SegmentDetailsDraftView draft={draft} onEdit={onEdit} />
        )}
      />
    </SegmentContext.Provider>
  );
}

function SegmentDetailsDraftView({
  draft,
  onEdit,
}: {
  draft: SegmentDetailsDraftData;
  onEdit: (updates: Partial<SegmentDetailsDraftData>) => void;
}) {
  const { segmentNames, regenerateField, regeneratingFields } = useContext(SegmentContext);
  const [expandedSections, setExpandedSections] = useState<string[]>(["needs", "awareness"]);

  const segmentName = segmentNames[draft.segment_id] || "Loading...";

  const toggleSection = (section: string) => {
    setExpandedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  return (
    <div className="space-y-6">
      {/* Segment Name Header */}
      <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl">
        <div className="p-2 bg-indigo-500/10 rounded-lg">
          <Users className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <p className="text-xs font-medium text-indigo-600 uppercase tracking-wider">Segment</p>
          <h2 className="text-lg font-bold text-slate-900">{segmentName}</h2>
        </div>
      </div>

      {/* Behavior Fields Grid - Always show, with empty state for missing fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <BehaviorCard
          icon={<UserCircle className="w-5 h-5" />}
          title="Sociodemographics"
          content={draft.sociodemographics}
          color="indigo"
          fieldKey="sociodemographics"
          onEdit={onEdit}
          draftId={draft.id}
        />
        <BehaviorCard
          icon={<Brain className="w-5 h-5" />}
          title="Psychographics"
          content={draft.psychographics}
          color="purple"
          fieldKey="psychographics"
          onEdit={onEdit}
          draftId={draft.id}
        />
        <BehaviorCard
          icon={<Globe className="w-5 h-5" />}
          title="Online Behavior"
          content={draft.online_behavior}
          color="blue"
          fieldKey="online_behavior"
          onEdit={onEdit}
          draftId={draft.id}
        />
        <BehaviorCard
          icon={<ShoppingCart className="w-5 h-5" />}
          title="Buying Behavior"
          content={draft.buying_behavior}
          color="emerald"
          fieldKey="buying_behavior"
          onEdit={onEdit}
          draftId={draft.id}
        />
      </div>

      {/* Awareness Level Banner */}
      <AwarenessLevelCard level={draft.awareness_level} onEdit={onEdit} draftId={draft.id} />

      {/* Needs */}
      <CollapsibleSection
        title="Needs"
        icon={<Target className="w-5 h-5" />}
        color="blue"
        isExpanded={expandedSections.includes("needs")}
        onToggle={() => toggleSection("needs")}
        count={draft.needs?.length || 0}
        fieldKey="needs"
        draftId={draft.id}
      >
        <div className="space-y-3">
          {draft.needs?.map((need, index) => (
            <NeedCard key={index} need={need} />
          ))}
        </div>
      </CollapsibleSection>

      {/* Core Values */}
      <CollapsibleSection
        title="Core Values"
        icon={<Heart className="w-5 h-5" />}
        color="rose"
        isExpanded={expandedSections.includes("values")}
        onToggle={() => toggleSection("values")}
        count={draft.core_values?.length || 0}
        fieldKey="core_values"
        draftId={draft.id}
      >
        <div className="space-y-3">
          {draft.core_values?.map((value, index) => (
            <ValueCard key={index} value={value} />
          ))}
        </div>
      </CollapsibleSection>

      {/* Objections */}
      <CollapsibleSection
        title="Objections"
        icon={<Shield className="w-5 h-5" />}
        color="purple"
        isExpanded={expandedSections.includes("objections")}
        onToggle={() => toggleSection("objections")}
        count={draft.objections?.length || 0}
        fieldKey="objections"
        draftId={draft.id}
      >
        <div className="space-y-3">
          {draft.objections?.map((objection, index) => (
            <ObjectionCard key={index} objection={objection} />
          ))}
        </div>
      </CollapsibleSection>
    </div>
  );
}

function AwarenessLevelCard({
  level,
  onEdit,
  draftId,
}: {
  level: AwarenessLevel;
  onEdit: (updates: Partial<SegmentDetailsDraftData>) => void;
  draftId: string;
}) {
  const { regenerateField, regeneratingFields } = useContext(SegmentContext);
  const [isEditing, setIsEditing] = useState(false);
  const isRegenerating = regeneratingFields.has(`${draftId}-awareness_level`);

  const config: Record<AwarenessLevel, { label: string; description: string; color: string; position: number }> = {
    unaware: {
      label: "Unaware",
      description: "They don't know they have a problem",
      color: "bg-slate-500",
      position: 0,
    },
    problem_aware: {
      label: "Problem Aware",
      description: "They know the problem but not the solutions",
      color: "bg-rose-500",
      position: 25,
    },
    solution_aware: {
      label: "Solution Aware",
      description: "They know solutions exist but not yours",
      color: "bg-amber-500",
      position: 50,
    },
    product_aware: {
      label: "Product Aware",
      description: "They know your product but haven't decided",
      color: "bg-blue-500",
      position: 75,
    },
    most_aware: {
      label: "Most Aware",
      description: "They know your product and are ready to buy",
      color: "bg-emerald-500",
      position: 100,
    },
  };

  // Fallback to 'unaware' if level is not recognized (e.g. translated value)
  const c = config[level] || config.unaware;

  const handleSelect = (newLevel: AwarenessLevel) => {
    onEdit({ awareness_level: newLevel });
    setIsEditing(false);
  };

  const handleRegenerate = async () => {
    try {
      await regenerateField(draftId, "awareness_level");
    } catch (err) {
      console.error("Regeneration failed:", err);
    }
  };

  return (
    <div className={cn(
      "p-6 bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-2xl",
      isRegenerating && "opacity-70"
    )}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Eye className="w-5 h-5 text-slate-600" />
          <h3 className="font-semibold text-slate-900">Awareness Level</h3>
        </div>
        <div className="flex items-center gap-2">
          {/* Regenerate with AI */}
          <button
            onClick={handleRegenerate}
            disabled={isRegenerating}
            className="flex items-center gap-1.5 px-2 py-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors rounded-lg hover:bg-indigo-50"
            title="Regenerate with AI"
          >
            {isRegenerating ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            {isRegenerating ? "Generating..." : "AI"}
          </button>
          {/* Manual change */}
          <button
            onClick={() => setIsEditing(!isEditing)}
            disabled={isRegenerating}
            className="text-xs text-slate-600 hover:text-slate-800 font-medium transition-colors"
          >
            {isEditing ? "Cancel" : "Change"}
          </button>
        </div>
      </div>

      {isEditing ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
          {(Object.entries(config) as [AwarenessLevel, typeof config[AwarenessLevel]][]).map(([key, conf]) => (
            <button
              key={key}
              onClick={() => handleSelect(key)}
              className={cn(
                "p-3 rounded-xl border-2 text-left transition-all hover:shadow-md",
                key === level
                  ? "border-indigo-500 bg-indigo-50"
                  : "border-slate-200 hover:border-slate-300"
              )}
            >
              <div className={cn("w-3 h-3 rounded-full mb-2", conf.color)} />
              <p className="text-sm font-medium text-slate-900">{conf.label}</p>
              <p className="text-xs text-slate-500 mt-1">{conf.description}</p>
            </button>
          ))}
        </div>
      ) : (
        <>
          {/* Progress Bar */}
          <div className="relative mb-4">
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all duration-500", c.color)}
                style={{ width: `${c.position}%` }}
              />
            </div>
            {/* Markers */}
            <div className="absolute -top-1 left-0 right-0 flex justify-between">
              {Object.entries(config).map(([key, conf]) => (
                <div
                  key={key}
                  className={cn(
                    "w-4 h-4 rounded-full border-2 border-white",
                    key === level ? conf.color : "bg-slate-200"
                  )}
                />
              ))}
            </div>
          </div>

          {/* Current Level */}
          <div className="flex items-center gap-3">
            <span className={cn("px-3 py-1.5 text-sm font-semibold text-white rounded-full", c.color)}>
              {c.label}
            </span>
            <span className="text-sm text-slate-600">{c.description}</span>
          </div>
        </>
      )}
    </div>
  );
}

function CollapsibleSection({
  title,
  icon,
  color,
  isExpanded,
  onToggle,
  count,
  children,
  fieldKey,
  draftId,
}: {
  title: string;
  icon: React.ReactNode;
  color: "blue" | "orange" | "rose" | "purple";
  isExpanded: boolean;
  onToggle: () => void;
  count: number;
  children: React.ReactNode;
  fieldKey?: string;
  draftId?: string;
}) {
  const { regenerateField, regeneratingFields } = useContext(SegmentContext);
  const isRegenerating = fieldKey && draftId ? regeneratingFields.has(`${draftId}-${fieldKey}`) : false;

  const colorClasses = {
    blue: "bg-blue-500/10 text-blue-600 border-l-blue-500",
    orange: "bg-orange-500/10 text-orange-600 border-l-orange-500",
    rose: "bg-rose-500/10 text-rose-600 border-l-rose-500",
    purple: "bg-purple-500/10 text-purple-600 border-l-purple-500",
  };

  const handleRegenerate = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!fieldKey || !draftId) return;
    try {
      await regenerateField(draftId, fieldKey);
    } catch (err) {
      console.error("Regeneration failed:", err);
    }
  };

  return (
    <DraftCard>
      <div className={cn(
        "w-full p-5 flex items-center justify-between",
        isRegenerating && "opacity-70"
      )}>
        <button
          onClick={onToggle}
          className="flex items-center gap-3 flex-1 hover:opacity-80 transition-opacity"
        >
          <div className={cn("p-2 rounded-lg", colorClasses[color].split(" ").slice(0, 2).join(" "))}>
            {icon}
          </div>
          <h3 className="font-semibold text-slate-900">{title}</h3>
          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-medium rounded-full">
            {count}
          </span>
        </button>
        <div className="flex items-center gap-2">
          {/* Regenerate with AI button */}
          {fieldKey && draftId && (
            <button
              onClick={handleRegenerate}
              disabled={isRegenerating}
              className="flex items-center gap-1.5 px-2 py-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors rounded-lg hover:bg-indigo-50"
              title={`Regenerate ${title} with AI`}
            >
              {isRegenerating ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              {isRegenerating ? "Generating..." : "Regenerate"}
            </button>
          )}
          <button onClick={onToggle} className="p-1">
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className={cn("px-5 pb-5 border-l-4", colorClasses[color].split(" ")[2])}>
              {isRegenerating ? (
                <div className="flex items-center gap-2 py-4 text-indigo-600">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Regenerating {title.toLowerCase()} with AI...</span>
                </div>
              ) : (
                children
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </DraftCard>
  );
}

function NeedCard({ need }: { need: NeedItem }) {
  const intensityColors = {
    critical: "bg-rose-100 text-rose-700",
    high: "bg-orange-100 text-orange-700",
    medium: "bg-blue-100 text-blue-700",
    low: "bg-slate-100 text-slate-700",
  };

  return (
    <div className="flex items-start justify-between p-4 bg-slate-50 rounded-xl">
      <p className="text-sm text-slate-700 flex-1">{need.need}</p>
      <span className={cn("px-2 py-1 text-xs font-medium rounded-full ml-3", intensityColors[need.intensity])}>
        {need.intensity}
      </span>
    </div>
  );
}

function ValueCard({ value }: { value: CoreValueItem }) {
  return (
    <div className="p-4 bg-rose-50 rounded-xl">
      <p className="text-sm font-medium text-slate-900 mb-2">{value.value}</p>
      <p className="text-xs text-rose-700">
        <span className="font-medium">Manifestation:</span> {value.manifestation}
      </p>
    </div>
  );
}

function ObjectionCard({ objection }: { objection: ObjectionItem }) {
  return (
    <div className="p-4 bg-purple-50 rounded-xl space-y-3">
      <div>
        <span className="text-xs font-medium text-purple-700 uppercase tracking-wider">
          Objection
        </span>
        <p className="mt-1 text-sm text-slate-900 font-medium">{objection.objection}</p>
      </div>
      <div>
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
          Root Cause
        </span>
        <p className="mt-1 text-sm text-slate-700">{objection.root_cause}</p>
      </div>
      <div className="pt-3 border-t border-purple-100">
        <span className="text-xs font-medium text-emerald-700 uppercase tracking-wider">
          How to Overcome
        </span>
        <p className="mt-1 text-sm text-slate-700">{objection.how_to_overcome}</p>
      </div>
    </div>
  );
}

function BehaviorCard({
  icon,
  title,
  content,
  color,
  fieldKey,
  onEdit,
  draftId,
}: {
  icon: React.ReactNode;
  title: string;
  content?: string;
  color: "indigo" | "purple" | "blue" | "emerald";
  fieldKey: string;
  onEdit: (updates: Partial<SegmentDetailsDraftData>) => void;
  draftId: string;
}) {
  const { regenerateField, regeneratingFields } = useContext(SegmentContext);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(content || "");
  const isEmpty = !content || content.trim() === "";
  const isRegenerating = regeneratingFields.has(`${draftId}-${fieldKey}`);

  const colorClasses = {
    indigo: "bg-indigo-50 border-indigo-200 text-indigo-700",
    purple: "bg-purple-50 border-purple-200 text-purple-700",
    blue: "bg-blue-50 border-blue-200 text-blue-700",
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-700",
  };

  const iconClasses = {
    indigo: "bg-indigo-100 text-indigo-600",
    purple: "bg-purple-100 text-purple-600",
    blue: "bg-blue-100 text-blue-600",
    emerald: "bg-emerald-100 text-emerald-600",
  };

  const emptyClasses = {
    indigo: "bg-indigo-50/50 border-indigo-200 border-dashed",
    purple: "bg-purple-50/50 border-purple-200 border-dashed",
    blue: "bg-blue-50/50 border-blue-200 border-dashed",
    emerald: "bg-emerald-50/50 border-emerald-200 border-dashed",
  };

  const handleSave = () => {
    if (editValue.trim()) {
      onEdit({ [fieldKey]: editValue.trim() } as Partial<SegmentDetailsDraftData>);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(content || "");
    setIsEditing(false);
  };

  const handleRegenerate = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await regenerateField(draftId, fieldKey);
    } catch (err) {
      console.error("Regeneration failed:", err);
    }
  };

  if (isEditing) {
    return (
      <div className={cn("p-4 rounded-xl border-2", colorClasses[color])}>
        <div className="flex items-center gap-2 mb-3">
          <div className={cn("p-1.5 rounded-lg", iconClasses[color])}>
            {icon}
          </div>
          <h4 className="font-semibold text-slate-900">{title}</h4>
        </div>
        <textarea
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          className="w-full min-h-[100px] p-3 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
          placeholder={`Enter ${title.toLowerCase()}...`}
          autoFocus
        />
        <div className="flex justify-end gap-2 mt-3">
          <button
            onClick={handleCancel}
            className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "p-4 rounded-xl border transition-all",
        isEmpty ? emptyClasses[color] : colorClasses[color],
        isRegenerating && "opacity-70 pointer-events-none"
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={cn("p-1.5 rounded-lg", iconClasses[color])}>
            {icon}
          </div>
          <h4 className="font-semibold text-slate-900">{title}</h4>
        </div>
        <div className="flex items-center gap-1">
          {/* Regenerate with AI button */}
          <button
            onClick={handleRegenerate}
            disabled={isRegenerating}
            className="p-1.5 rounded-lg hover:bg-white/50 transition-colors group"
            title="Regenerate with AI"
          >
            {isRegenerating ? (
              <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
            )}
          </button>
          {/* Edit button */}
          <button
            onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
            className="p-1.5 rounded-lg hover:bg-white/50 transition-colors group"
            title="Edit manually"
          >
            <UserCircle className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
          </button>
        </div>
      </div>
      {isRegenerating ? (
        <div className="flex items-center gap-2 text-sm text-indigo-600">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>Generating with AI...</span>
        </div>
      ) : isEmpty ? (
        <p className="text-sm text-slate-400 italic">Not filled — click ✨ to generate or ✏️ to add manually</p>
      ) : (
        <p className="text-sm text-slate-700 leading-relaxed">{content}</p>
      )}
    </div>
  );
}
