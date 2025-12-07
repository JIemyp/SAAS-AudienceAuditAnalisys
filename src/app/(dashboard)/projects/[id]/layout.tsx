"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Users, Download, AlertCircle, CheckCircle2, Lock, Circle, Loader2, Home, FolderOpen, ChevronRight, FileText, Search, Compass } from "lucide-react";
import { use, useEffect, useState } from "react";

// Results section tabs
const resultsTabs = [
    { name: "Overview", href: "/overview", icon: LayoutDashboard },
    { name: "Full Report", href: "/report", icon: FileText },
    { name: "Explorer", href: "/explorer", icon: Compass },
];

// Legacy tabs (for data management)
const dataTabs = [
    { name: "Segments", href: "/segments", icon: Users },
    { name: "Pains", href: "/pains", icon: AlertCircle },
    { name: "Export", href: "/export", icon: Download },
];

// Pages that should not show the tab navigation
const pagesWithoutTabs = ["/edit", "/processing", "/generate"];

// Generation step configuration
// Correct order: Portrait → Segments → Deep Analysis (per segment) → Pains/Canvas
const GENERATION_STEPS = [
    // Block 1: Portrait
    { step: "validation", label: "Validation", block: 1 },
    { step: "portrait", label: "Portrait", block: 1 },
    { step: "portrait-review", label: "Portrait Review", block: 1 },
    { step: "portrait-final", label: "Portrait Final", block: 1 },
    // Block 2: Segmentation (BEFORE deep analysis)
    { step: "segments", label: "Segments", block: 2 },
    { step: "segments-review", label: "Segments Review", block: 2 },
    { step: "segments-final", label: "Segments Final", block: 2 },
    { step: "segment-details", label: "Segment Details", block: 2 },
    // Block 3: Deep Analysis (per segment)
    { step: "jobs", label: "Jobs to Be Done", block: 3 },
    { step: "preferences", label: "Preferences", block: 3 },
    { step: "difficulties", label: "Difficulties", block: 3 },
    { step: "triggers", label: "Triggers", block: 3 },
    // Block 4: Pains & Canvas (per segment)
    { step: "pains", label: "Pains", block: 4 },
    { step: "pains-ranking", label: "Pains Ranking", block: 4 },
    { step: "canvas", label: "Canvas", block: 4 },
    { step: "canvas-extended", label: "Canvas Extended", block: 4 },
];

type StepStatus = "completed" | "in_progress" | "locked";

interface StepStatusData {
    step: string;
    status: StepStatus;
    hasDraft: boolean;
    hasApproved: boolean;
}

export default function ProjectLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ id: string }>;
}) {
    const pathname = usePathname();
    const { id } = use(params);
    const baseHref = `/projects/${id}`;
    const [stepStatuses, setStepStatuses] = useState<StepStatusData[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch step statuses from API - refetch when pathname changes (after navigation)
    useEffect(() => {
        const fetchStepStatuses = async () => {
            try {
                const res = await fetch(`/api/projects/${id}/steps`);
                const data = await res.json();

                if (data.success && data.steps) {
                    setStepStatuses(data.steps);
                }
            } catch (err) {
                console.error("Failed to fetch step statuses:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchStepStatuses();
    }, [id, pathname]);

    // Check if we're on a generation page
    const isGeneratePage = pathname.includes("/generate/");

    // Check if current page should hide tabs
    const hideTabs = pagesWithoutTabs.some((page) => pathname.includes(page));

    // Also hide tabs on the main project page (review before generation)
    const isMainProjectPage = pathname === baseHref;

    // Get current generation step from URL
    const currentGenerateStep = pathname.split("/generate/")[1]?.split("/")[0] || "";

    // Get status for a step
    const getStepStatus = (stepName: string): { status: StepStatus; hasDraft: boolean } => {
        const stepData = stepStatuses.find(s => s.step === stepName);
        if (!stepData) {
            // Default: first step is in_progress, others are locked
            const stepIndex = GENERATION_STEPS.findIndex(s => s.step === stepName);
            return { status: stepIndex === 0 ? "in_progress" : "locked", hasDraft: false };
        }
        return { status: stepData.status, hasDraft: stepData.hasDraft };
    };

    if (isGeneratePage) {
        // Render generation progress sidebar
        return (
            <div className="flex h-screen">
                {/* Progress Sidebar */}
                <aside className="w-72 bg-slate-900 text-white p-6 flex flex-col shrink-0 h-screen overflow-hidden">
                    <div className="mb-6 shrink-0">
                        <h2 className="text-lg font-semibold text-white/90">Research Progress</h2>
                        <p className="text-sm text-white/50 mt-1">Complete each step to build your audience profile</p>
                    </div>

                    <nav className="flex-1 space-y-1 overflow-y-auto min-h-0">
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="w-5 h-5 animate-spin text-white/50" />
                            </div>
                        ) : (
                            GENERATION_STEPS.map((genStep, index) => {
                                const isActive = genStep.step === currentGenerateStep;
                                const { status, hasDraft } = getStepStatus(genStep.step);

                                const isCompleted = status === "completed";
                                const isInProgress = status === "in_progress" && hasDraft;
                                const isLocked = status === "locked";

                                // Show block dividers
                                const showBlockDivider = index > 0 && GENERATION_STEPS[index - 1].block !== genStep.block;

                                const content = (
                                    <div
                                        className={cn(
                                            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200",
                                            isActive
                                                ? "bg-white/10 text-white font-medium"
                                                : isCompleted
                                                ? "text-emerald-400/80 hover:bg-white/5"
                                                : isInProgress
                                                ? "text-amber-400/80 hover:bg-white/5"
                                                : isLocked
                                                ? "text-white/20 cursor-not-allowed"
                                                : "text-white/60 hover:bg-white/5 hover:text-white/80"
                                        )}
                                    >
                                        <span className={cn(
                                            "flex items-center justify-center w-5 h-5 rounded-full text-xs",
                                            isActive
                                                ? "bg-white text-slate-900 font-bold"
                                                : isCompleted
                                                ? "bg-emerald-500/20 text-emerald-400"
                                                : isInProgress
                                                ? "bg-amber-500/20 text-amber-400"
                                                : isLocked
                                                ? "bg-white/5 text-white/20"
                                                : "bg-white/10 text-white/40"
                                        )}>
                                            {isCompleted ? (
                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                            ) : isInProgress ? (
                                                <Circle className="w-3 h-3 fill-current" />
                                            ) : isLocked ? (
                                                <Lock className="w-3 h-3" />
                                            ) : (
                                                <span>{index + 1}</span>
                                            )}
                                        </span>
                                        <span className="truncate">{genStep.label}</span>
                                    </div>
                                );

                                return (
                                    <div key={genStep.step}>
                                        {showBlockDivider && (
                                            <div className="h-px bg-white/10 my-4" />
                                        )}
                                        {isLocked ? (
                                            <div className="cursor-not-allowed" title="Complete previous steps first">
                                                {content}
                                            </div>
                                        ) : (
                                            <Link href={`${baseHref}/generate/${genStep.step}`}>
                                                {content}
                                            </Link>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </nav>

                    <div className="pt-4 mt-4 border-t border-white/10 shrink-0">
                        <Link
                            href="/projects"
                            className="text-sm text-white/50 hover:text-white/80 transition-colors"
                        >
                            ← Back to Projects
                        </Link>
                    </div>
                </aside>

                {/* Main Content with Header */}
                <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
                    {/* Breadcrumb Header */}
                    <header className="bg-white border-b border-slate-200 px-6 py-3 shrink-0">
                        <nav className="flex items-center gap-2 text-sm">
                            <Link
                                href="/"
                                className="flex items-center gap-1.5 text-slate-500 hover:text-slate-900 transition-colors"
                            >
                                <Home className="w-4 h-4" />
                                <span>Home</span>
                            </Link>
                            <ChevronRight className="w-4 h-4 text-slate-300" />
                            <Link
                                href="/projects"
                                className="flex items-center gap-1.5 text-slate-500 hover:text-slate-900 transition-colors"
                            >
                                <FolderOpen className="w-4 h-4" />
                                <span>Projects</span>
                            </Link>
                            <ChevronRight className="w-4 h-4 text-slate-300" />
                            <Link
                                href={baseHref}
                                className="text-slate-500 hover:text-slate-900 transition-colors"
                            >
                                Project
                            </Link>
                            <ChevronRight className="w-4 h-4 text-slate-300" />
                            <span className="text-slate-900 font-medium">
                                {GENERATION_STEPS.find(s => s.step === currentGenerateStep)?.label || "Generation"}
                            </span>
                        </nav>
                    </header>

                    {/* Scrollable Content */}
                    <main className="flex-1 overflow-y-auto">
                        <div className="max-w-4xl mx-auto p-8">
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    if (hideTabs || isMainProjectPage) {
        return <>{children}</>;
    }

    const renderTabGroup = (tabs: typeof resultsTabs, label?: string) => (
        <div className="flex items-center">
            {label && (
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider mr-4 pr-4 border-r border-slate-200">
                    {label}
                </span>
            )}
            <div className="flex space-x-6">
                {tabs.map((tab) => {
                    const href = `${baseHref}${tab.href}`;
                    const isActive = pathname === href || pathname.startsWith(`${href}/`);

                    return (
                        <Link
                            key={tab.name}
                            href={href}
                            className={cn(
                                "group flex items-center gap-2 border-b-2 px-1 py-4 text-sm font-medium transition-colors",
                                isActive
                                    ? "border-blue-600 text-blue-600"
                                    : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-900"
                            )}
                        >
                            <tab.icon
                                className={cn(
                                    "h-4 w-4",
                                    isActive
                                        ? "text-blue-600"
                                        : "text-slate-400 group-hover:text-slate-600"
                                )}
                            />
                            {tab.name}
                        </Link>
                    );
                })}
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <nav className="border-b border-slate-200 bg-white -mx-8 px-8 -mt-8">
                <div className="flex items-center justify-between">
                    {renderTabGroup(resultsTabs, "Results")}
                    {renderTabGroup(dataTabs, "Data")}
                </div>
            </nav>

            <div>{children}</div>
        </div>
    );
}
