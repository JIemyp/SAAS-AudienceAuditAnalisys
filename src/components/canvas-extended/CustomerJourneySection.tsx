"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, MapPin, AlertCircle, Search, Scale, Zap, CheckCircle } from "lucide-react";
import { CustomerJourney } from "@/types";

interface CustomerJourneySectionProps {
  journey: CustomerJourney;
  onUpdate?: (journey: CustomerJourney) => void;
  readonly?: boolean;
}

type StageKey = "unaware_stage" | "problem_aware" | "solution_seeking" | "evaluation" | "decision_trigger" | "post_purchase";

const STAGE_CONFIG: Record<StageKey, {
  title: string;
  icon: typeof MapPin;
  bgColor: string;
  borderColor: string;
  iconBg: string;
  iconColor: string;
}> = {
  unaware_stage: {
    title: "Unaware Stage",
    icon: MapPin,
    bgColor: "bg-slate-50",
    borderColor: "border-slate-200",
    iconBg: "bg-slate-100",
    iconColor: "text-slate-600",
  },
  problem_aware: {
    title: "Problem Aware",
    icon: AlertCircle,
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
  },
  solution_seeking: {
    title: "Solution Seeking",
    icon: Search,
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
  },
  evaluation: {
    title: "Evaluation",
    icon: Scale,
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
  },
  decision_trigger: {
    title: "Decision Trigger",
    icon: Zap,
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
    iconBg: "bg-orange-100",
    iconColor: "text-orange-600",
  },
  post_purchase: {
    title: "Post-Purchase",
    icon: CheckCircle,
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
  },
};

const STAGE_ORDER: StageKey[] = [
  "unaware_stage",
  "problem_aware",
  "solution_seeking",
  "evaluation",
  "decision_trigger",
  "post_purchase",
];

export function CustomerJourneySection({ journey }: CustomerJourneySectionProps) {
  const [expandedStages, setExpandedStages] = useState<Set<StageKey>>(new Set(["unaware_stage"]));
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleStage = (stage: StageKey) => {
    const newExpanded = new Set(expandedStages);
    if (newExpanded.has(stage)) {
      newExpanded.delete(stage);
    } else {
      newExpanded.add(stage);
    }
    setExpandedStages(newExpanded);
  };

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full flex items-center justify-between p-4 bg-linear-to-r from-slate-50 to-white hover:from-slate-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-slate-100">
            <MapPin className="w-5 h-5 text-slate-600" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-slate-900">Customer Journey Map</h3>
            <p className="text-sm text-slate-500">6 stages from awareness to advocacy</p>
          </div>
        </div>
        {isCollapsed ? (
          <ChevronRight className="w-5 h-5 text-slate-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-400" />
        )}
      </button>

      {!isCollapsed && (
        <div className="p-4 space-y-3">
          {STAGE_ORDER.map((stageKey) => {
            const config = STAGE_CONFIG[stageKey];
            const Icon = config.icon;
            const isExpanded = expandedStages.has(stageKey);

            return (
              <div
                key={stageKey}
                className={`border ${config.borderColor} rounded-lg overflow-hidden`}
              >
                <button
                  onClick={() => toggleStage(stageKey)}
                  className={`w-full flex items-center justify-between p-3 ${config.bgColor} hover:opacity-90 transition-opacity`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-md ${config.iconBg}`}>
                      <Icon className={`w-4 h-4 ${config.iconColor}`} />
                    </div>
                    <span className="font-medium text-slate-800">{config.title}</span>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  )}
                </button>

                {isExpanded && (
                  <div className="p-4 bg-white space-y-4">
                    {stageKey === "unaware_stage" && (
                      <UnawareStageContent data={journey.unaware_stage} />
                    )}
                    {stageKey === "problem_aware" && (
                      <ProblemAwareContent data={journey.problem_aware} />
                    )}
                    {stageKey === "solution_seeking" && (
                      <SolutionSeekingContent data={journey.solution_seeking} />
                    )}
                    {stageKey === "evaluation" && (
                      <EvaluationContent data={journey.evaluation} />
                    )}
                    {stageKey === "decision_trigger" && (
                      <DecisionTriggerContent data={journey.decision_trigger} />
                    )}
                    {stageKey === "post_purchase" && (
                      <PostPurchaseContent data={journey.post_purchase} />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function UnawareStageContent({ data }: { data: CustomerJourney["unaware_stage"] }) {
  return (
    <>
      <Field label="Life Context" value={data.life_context} />
      <Field label="Internal Dialogue" value={data.internal_dialogue} isQuote />
      <Field label="Emotional State" value={data.emotional_state} />
      <Field label="Duration" value={data.duration} />
    </>
  );
}

function ProblemAwareContent({ data }: { data: CustomerJourney["problem_aware"] }) {
  return (
    <>
      <Field label="Trigger Moment" value={data.trigger_moment} />
      <Field label="Internal Dialogue" value={data.internal_dialogue} isQuote />
      <Field label="Emotional State" value={data.emotional_state} />
      <ListField label="Actions They Take" items={data.actions} />
    </>
  );
}

function SolutionSeekingContent({ data }: { data: CustomerJourney["solution_seeking"] }) {
  return (
    <>
      <ListField label="Where They Look" items={data.where_they_look} />
      <ListField label="What They Try" items={data.what_they_try} />
      <Field label="Internal Dialogue" value={data.internal_dialogue} isQuote />
      <ListField label="Frustrations" items={data.frustrations} variant="warning" />
    </>
  );
}

function EvaluationContent({ data }: { data: CustomerJourney["evaluation"] }) {
  return (
    <>
      <ListField label="Criteria" items={data.criteria} />
      <Field label="Comparison Behavior" value={data.comparison_behavior} />
      <Field label="Internal Dialogue" value={data.internal_dialogue} isQuote />
      <ListField label="Dealbreakers" items={data.dealbreakers} variant="danger" />
    </>
  );
}

function DecisionTriggerContent({ data }: { data: CustomerJourney["decision_trigger"] }) {
  return (
    <>
      <Field label="Trigger Moment" value={data.trigger_moment} />
      <Field label="Internal Dialogue" value={data.internal_dialogue} isQuote />
      <Field label="What They Need to Hear" value={data.what_they_need_to_hear} highlight />
      <Field label="Final Hesitation" value={data.final_hesitation} />
    </>
  );
}

function PostPurchaseContent({ data }: { data: CustomerJourney["post_purchase"] }) {
  return (
    <>
      <Field label="First Week Experience" value={data.first_week} />
      <ListField label="Confirmation Moments" items={data.confirmation_moments} variant="success" />
      <ListField label="Doubt Moments" items={data.doubt_moments} variant="warning" />
      <Field label="Advocacy Trigger" value={data.advocacy_trigger} highlight />
    </>
  );
}

function Field({
  label,
  value,
  isQuote = false,
  highlight = false,
}: {
  label: string;
  value: string;
  isQuote?: boolean;
  highlight?: boolean;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</label>
      <p
        className={`mt-1 text-sm ${
          isQuote
            ? "italic text-slate-600 border-l-2 border-slate-300 pl-3"
            : highlight
            ? "font-medium text-slate-900 bg-amber-50 p-2 rounded"
            : "text-slate-700"
        }`}
      >
        {isQuote ? `"${value}"` : value}
      </p>
    </div>
  );
}

function ListField({
  label,
  items,
  variant = "default",
}: {
  label: string;
  items: string[];
  variant?: "default" | "success" | "warning" | "danger";
}) {
  const variantStyles = {
    default: "bg-slate-100 text-slate-700",
    success: "bg-green-100 text-green-700",
    warning: "bg-amber-100 text-amber-700",
    danger: "bg-red-100 text-red-700",
  };

  return (
    <div>
      <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</label>
      <div className="mt-1 flex flex-wrap gap-2">
        {items.map((item, idx) => (
          <span
            key={idx}
            className={`px-2 py-1 rounded text-xs ${variantStyles[variant]}`}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
