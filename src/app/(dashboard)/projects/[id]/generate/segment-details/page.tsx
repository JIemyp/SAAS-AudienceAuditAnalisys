"use client";

import React, { use, useState, useEffect, createContext, useContext } from "react";
import {
  GenerationPage,
  DraftCard,
} from "@/components/generation/GenerationPage";
import { NeedItem, CoreValueItem, ObjectionItem, AwarenessLevel, SegmentFinal } from "@/types";
import { FileText, Target, Heart, Shield, Eye, ChevronDown, ChevronUp, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// Extended type for the draft that might contain multiple segment details
interface SegmentDetailsDraftData {
  id: string;
  project_id: string;
  segment_id: string;
  segment_name?: string;
  needs: NeedItem[];
  core_values: CoreValueItem[];
  awareness_level: AwarenessLevel;
  objections: ObjectionItem[];
  version: number;
  created_at: string;
}

// Context for segment names
interface SegmentNamesContextValue {
  segmentNames: Record<string, string>;
}

const SegmentNamesContext = createContext<SegmentNamesContextValue>({ segmentNames: {} });

export default function SegmentDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = use(params);
  const [segmentNames, setSegmentNames] = useState<Record<string, string>>({});

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

  return (
    <SegmentNamesContext.Provider value={{ segmentNames }}>
      <GenerationPage<SegmentDetailsDraftData>
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
    </SegmentNamesContext.Provider>
  );
}

function SegmentDetailsDraftView({
  draft,
  onEdit,
}: {
  draft: SegmentDetailsDraftData;
  onEdit: (updates: Partial<SegmentDetailsDraftData>) => void;
}) {
  const { segmentNames } = useContext(SegmentNamesContext);
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

      {/* Awareness Level Banner */}
      <AwarenessLevelCard level={draft.awareness_level} />

      {/* Needs */}
      <CollapsibleSection
        title="Needs"
        icon={<Target className="w-5 h-5" />}
        color="blue"
        isExpanded={expandedSections.includes("needs")}
        onToggle={() => toggleSection("needs")}
        count={draft.needs?.length || 0}
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

function AwarenessLevelCard({ level }: { level: AwarenessLevel }) {
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

  const c = config[level];

  return (
    <div className="p-6 bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-2xl">
      <div className="flex items-center gap-3 mb-4">
        <Eye className="w-5 h-5 text-slate-600" />
        <h3 className="font-semibold text-slate-900">Awareness Level</h3>
      </div>

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
}: {
  title: string;
  icon: React.ReactNode;
  color: "blue" | "orange" | "rose" | "purple";
  isExpanded: boolean;
  onToggle: () => void;
  count: number;
  children: React.ReactNode;
}) {
  const colorClasses = {
    blue: "bg-blue-500/10 text-blue-600 border-l-blue-500",
    orange: "bg-orange-500/10 text-orange-600 border-l-orange-500",
    rose: "bg-rose-500/10 text-rose-600 border-l-rose-500",
    purple: "bg-purple-500/10 text-purple-600 border-l-purple-500",
  };

  return (
    <DraftCard>
      <button
        onClick={onToggle}
        className="w-full p-5 flex items-center justify-between hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-lg", colorClasses[color].split(" ").slice(0, 2).join(" "))}>
            {icon}
          </div>
          <h3 className="font-semibold text-slate-900">{title}</h3>
          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-medium rounded-full">
            {count}
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-slate-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-400" />
        )}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className={cn("px-5 pb-5 border-l-4", colorClasses[color].split(" ")[2])}>
              {children}
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
