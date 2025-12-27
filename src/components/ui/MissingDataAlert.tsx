import * as React from "react";
import { cn } from "@/lib/utils";
import { AlertTriangle, ArrowRight, Database, ChevronRight } from "lucide-react";
import { Button } from "./Button";
import Link from "next/link";

export interface MissingDataStep {
    label: string;
    href?: string;
    status: "completed" | "current" | "pending";
}

interface MissingDataAlertProps {
    title: string;
    description: string;
    requiredData: string[];
    steps?: MissingDataStep[];
    className?: string;
    variant?: "warning" | "info";
}

export function MissingDataAlert({
    title,
    description,
    requiredData,
    steps,
    className,
    variant = "warning",
}: MissingDataAlertProps) {
    const bgColor = variant === "warning" ? "bg-amber-50" : "bg-blue-50";
    const borderColor = variant === "warning" ? "border-amber-200" : "border-blue-200";
    const iconColor = variant === "warning" ? "text-amber-600" : "text-blue-600";
    const titleColor = variant === "warning" ? "text-amber-900" : "text-blue-900";
    const textColor = variant === "warning" ? "text-amber-700" : "text-blue-700";

    return (
        <div
            className={cn(
                "rounded-xl border p-6",
                bgColor,
                borderColor,
                className
            )}
        >
            <div className="flex gap-4">
                <div className={cn("flex-shrink-0 p-2 rounded-lg", variant === "warning" ? "bg-amber-100" : "bg-blue-100")}>
                    <AlertTriangle className={cn("w-5 h-5", iconColor)} />
                </div>
                <div className="flex-1 space-y-4">
                    <div>
                        <h3 className={cn("font-semibold", titleColor)}>{title}</h3>
                        <p className={cn("text-sm mt-1", textColor)}>{description}</p>
                    </div>

                    {/* Required Data */}
                    <div>
                        <p className="text-xs font-medium text-slate-500 uppercase mb-2">Required Data</p>
                        <div className="flex flex-wrap gap-2">
                            {requiredData.map((data) => (
                                <span
                                    key={data}
                                    className="inline-flex items-center gap-1 px-2 py-1 bg-white/80 rounded border border-slate-200 text-xs text-slate-600"
                                >
                                    <Database className="w-3 h-3" />
                                    {data}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Next Steps */}
                    {steps && steps.length > 0 && (
                        <div>
                            <p className="text-xs font-medium text-slate-500 uppercase mb-2">Next Steps</p>
                            <div className="space-y-2">
                                {steps.map((step, index) => {
                                    const isCompleted = step.status === "completed";
                                    const isCurrent = step.status === "current";

                                    const content = (
                                        <div
                                            className={cn(
                                                "flex items-center gap-3 p-3 rounded-lg transition-colors",
                                                isCompleted && "bg-emerald-50/50 border border-emerald-200",
                                                isCurrent && "bg-white border-2 border-amber-400 shadow-sm",
                                                !isCompleted && !isCurrent && "bg-white/50 border border-slate-200 opacity-60"
                                            )}
                                        >
                                            <div
                                                className={cn(
                                                    "w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold",
                                                    isCompleted && "bg-emerald-500 text-white",
                                                    isCurrent && "bg-amber-500 text-white",
                                                    !isCompleted && !isCurrent && "bg-slate-200 text-slate-500"
                                                )}
                                            >
                                                {isCompleted ? "✓" : index + 1}
                                            </div>
                                            <span
                                                className={cn(
                                                    "flex-1 text-sm font-medium",
                                                    isCompleted && "text-emerald-700",
                                                    isCurrent && "text-amber-900",
                                                    !isCompleted && !isCurrent && "text-slate-500"
                                                )}
                                            >
                                                {step.label}
                                            </span>
                                            {step.href && isCurrent && (
                                                <ChevronRight className="w-4 h-4 text-amber-500" />
                                            )}
                                        </div>
                                    );

                                    if (step.href && isCurrent) {
                                        return (
                                            <Link key={index} href={step.href} className="block hover:opacity-90">
                                                {content}
                                            </Link>
                                        );
                                    }

                                    return <div key={index}>{content}</div>;
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Preset for no segments
export function NoSegmentsAlert({ projectId }: { projectId: string }) {
    return (
        <MissingDataAlert
            title="No Segments Available"
            description="Generate and approve segments first to access this module."
            requiredData={["segments_final"]}
            steps={[
                { label: "Generate segments in Audience Explorer", href: `/projects/${projectId}/generate/segments`, status: "current" },
                { label: "Review and approve segments", status: "pending" },
                { label: "Return to this page", status: "pending" },
            ]}
        />
    );
}

// Preset for no top pains
export function NoTopPainsAlert({ projectId, segmentName }: { projectId: string; segmentName?: string }) {
    return (
        <MissingDataAlert
            title={segmentName ? `No Top Pains for "${segmentName}"` : "No Top Pains Available"}
            description="Select top pains in Pains Ranking before generating strategies for this segment."
            requiredData={["pains_ranking (is_top_pain = true)"]}
            steps={[
                { label: "Go to Pains Ranking", href: `/projects/${projectId}/generate/pains-ranking`, status: "current" },
                { label: "Mark top pains for segment", status: "pending" },
                { label: "Return to this page", status: "pending" },
            ]}
        />
    );
}

// Preset for missing prerequisite data
export function MissingPrerequisitesAlert({
    projectId,
    moduleName,
    prerequisites,
}: {
    projectId: string;
    moduleName: string;
    prerequisites: Array<{ name: string; href: string; completed: boolean }>;
}) {
    const currentIndex = prerequisites.findIndex((p) => !p.completed);

    return (
        <MissingDataAlert
            title={`Complete Prerequisites for ${moduleName}`}
            description="This module requires data from previous steps. Complete them first."
            requiredData={prerequisites.filter((p) => !p.completed).map((p) => p.name)}
            steps={prerequisites.map((p, i) => ({
                label: p.name,
                href: p.href,
                status: p.completed ? "completed" : i === currentIndex ? "current" : "pending",
            }))}
            variant="info"
        />
    );
}
