"use client";

import { motion } from "framer-motion";
import { Check, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Segment } from "@/types";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";

// Steps that are bound to segments (per-segment analysis)
const SEGMENT_STEP_LABELS: Record<string, string> = {
  jobs: "Jobs to Be Done",
  preferences: "Preferences",
  difficulties: "Difficulties",
  triggers: "Deep Triggers",
  pains: "Pain Points",
  canvas: "Canvas",
  "canvas-extended": "Canvas Extended",
};

interface SegmentProgressData {
  segmentId: string;
  segmentName: string;
  completedSteps: string[];
  currentStep: string | null;
}

interface SegmentProgressProps {
  segments: Segment[];
  segmentProgressData: SegmentProgressData[];
  currentStepType: string;
  projectId?: string;
  nextStepUrl?: string;
}

export function SegmentProgress({
  segments,
  segmentProgressData,
  currentStepType,
  projectId,
  nextStepUrl,
}: SegmentProgressProps) {
  const router = useRouter();
  // Check if all segments have completed current step
  const allSegmentsCompleted = segments.length > 0 &&
    segments.every(seg => {
      const progress = segmentProgressData.find(p => p.segmentId === seg.id);
      return progress?.completedSteps.includes(currentStepType);
    });

  // Calculate overall progress percentage
  const totalSteps = segments.length;
  const completedSteps = segmentProgressData.filter(p =>
    p.completedSteps.includes(currentStepType)
  ).length;
  const progressPercent = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl border border-slate-200"
    >
      <div className="flex items-start gap-6">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-lg font-semibold text-slate-900">
              {SEGMENT_STEP_LABELS[currentStepType] || currentStepType} Progress
            </h3>
            {allSegmentsCompleted && (
              <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-600">
                <Check className="w-4 h-4" />
                All Complete
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 mb-4">
            {allSegmentsCompleted
              ? "All segments completed! Use the button above to continue."
              : "Complete this step for all segments to continue"
            }
          </p>

          {/* Progress bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700">
                {completedSteps} of {totalSteps} segments
              </span>
              <span className="text-sm text-slate-500">
                {Math.round(progressPercent)}%
              </span>
            </div>
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <motion.div
                className={cn(
                  "h-full rounded-full",
                  allSegmentsCompleted
                    ? "bg-emerald-500"
                    : "bg-gradient-to-r from-blue-500 to-indigo-500"
                )}
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
          </div>

          {/* Segment status dots */}
          <div className="flex flex-wrap gap-2">
            {segments.map((segment, index) => {
              const progress = segmentProgressData.find(p => p.segmentId === segment.id);
              const isCompleted = progress?.completedSteps.includes(currentStepType);

              return (
                <div
                  key={segment.id}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors",
                    isCompleted
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-white text-slate-500 border border-slate-200"
                  )}
                  title={segment.name}
                >
                  {isCompleted ? (
                    <Check className="w-3 h-3" />
                  ) : (
                    <span className="w-3 h-3 flex items-center justify-center">
                      {index + 1}
                    </span>
                  )}
                  <span className="max-w-[100px] truncate">{segment.name}</span>
                </div>
              );
            })}
          </div>

          {/* Continue button when all segments are completed */}
          {allSegmentsCompleted && projectId && nextStepUrl && (
            <div className="mt-4 pt-4 border-t border-slate-200">
              <Button
                onClick={() => router.push(`/projects/${projectId}${nextStepUrl}`)}
                className="w-full gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
              >
                Continue to Next Step
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Compact inline version for the header area
export function SegmentProgressInline({
  segments,
  segmentProgressData,
  currentStepType,
}: {
  segments: Segment[];
  segmentProgressData: SegmentProgressData[];
  currentStepType: string;
}) {
  const completedSteps = segmentProgressData.filter(p =>
    p.completedSteps.includes(currentStepType)
  ).length;
  const totalSteps = segments.length;
  const allComplete = totalSteps > 0 && completedSteps === totalSteps;

  return (
    <div className="flex items-center gap-3">
      <div className="flex -space-x-1">
        {segments.slice(0, 5).map((segment) => {
          const progress = segmentProgressData.find(p => p.segmentId === segment.id);
          const isCompleted = progress?.completedSteps.includes(currentStepType);

          return (
            <div
              key={segment.id}
              className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium border-2 border-white",
                isCompleted ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-500"
              )}
              title={segment.name}
            >
              {isCompleted ? <Check className="w-3 h-3" /> : null}
            </div>
          );
        })}
        {segments.length > 5 && (
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium bg-slate-100 text-slate-500 border-2 border-white">
            +{segments.length - 5}
          </div>
        )}
      </div>

      <div className="text-sm">
        <span className={cn(
          "font-medium",
          allComplete ? "text-emerald-600" : "text-slate-700"
        )}>
          {completedSteps}/{totalSteps}
        </span>
        <span className="text-slate-400 ml-1">segments</span>
      </div>
    </div>
  );
}
