"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

type StepStatus = "complete" | "pending" | "missing";

export interface ResearchHealthSegment {
  id: string;
  name: string;
  steps: Record<string, StepStatus>;
}

const STEP_ORDER = [
  "segment-details",
  "jobs",
  "preferences",
  "difficulties",
  "triggers",
  "pains",
  "pains-ranking",
  "canvas",
  "canvas-extended",
  "channel-strategy",
  "competitive-intelligence",
  "pricing-psychology",
  "trust-framework",
  "jtbd-context",
];

const STEP_LABELS: Record<string, string> = {
  "segment-details": "Seg Details",
  jobs: "Jobs",
  preferences: "Prefs",
  difficulties: "Difficulties",
  triggers: "Triggers",
  pains: "Pains",
  "pains-ranking": "Ranking",
  canvas: "Canvas",
  "canvas-extended": "Canvas+",
  "channel-strategy": "Channel",
  "competitive-intelligence": "Comp Intel",
  "pricing-psychology": "Pricing",
  "trust-framework": "Trust",
  "jtbd-context": "JTBD",
};

interface ResearchHealthMatrixProps {
  segments: ResearchHealthSegment[];
  title?: string;
  description?: string;
}

export function ResearchHealthMatrix({
  segments,
  title = "Research Health",
  description = "Segment-by-segment completion across the core research steps.",
}: ResearchHealthMatrixProps) {
  const steps = STEP_ORDER;
  const gridTemplate = `minmax(180px, 240px) repeat(${steps.length}, minmax(70px, 1fr))`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {segments.length === 0 ? (
          <div className="text-sm text-text-secondary">No segments found yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[1000px]">
              <div className="grid items-center gap-2 text-xs text-text-secondary pb-2 border-b border-border"
                style={{ gridTemplateColumns: gridTemplate }}
              >
                <div className="font-semibold">Segment</div>
                {steps.map((step) => (
                  <div key={step} className="text-center font-semibold">
                    {STEP_LABELS[step] || step}
                  </div>
                ))}
              </div>

              <div className="mt-2 space-y-2">
                {segments.map((segment) => (
                  <div
                    key={segment.id}
                    className="grid items-center gap-2 rounded-lg bg-white p-2 border border-border"
                    style={{ gridTemplateColumns: gridTemplate }}
                  >
                    <div className="text-sm font-medium text-text-primary truncate" title={segment.name}>
                      {segment.name}
                    </div>
                    {steps.map((step) => {
                      const status = segment.steps[step] || "missing";
                      return (
                        <div key={step} className="flex justify-center">
                          <span
                            className={cn(
                              "h-3 w-3 rounded-full",
                              status === "complete" && "bg-emerald-500",
                              status === "pending" && "bg-amber-400",
                              status === "missing" && "bg-slate-300"
                            )}
                            title={`${STEP_LABELS[step] || step}: ${status}`}
                          />
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-4 text-xs text-text-secondary">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            Complete
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
            Pending approval
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
            Missing
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
