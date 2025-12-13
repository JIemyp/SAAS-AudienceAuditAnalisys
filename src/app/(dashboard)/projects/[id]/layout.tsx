"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Users,
    Download,
    AlertCircle,
    CheckCircle2,
    Lock,
    Circle,
    Loader2,
    Home,
    ChevronRight,
    FileText,
    Compass,
    Settings,
    Sparkles,
    MessageCircle,
    Target,
} from "lucide-react";
import { use, useEffect, useState } from "react";

const PROJECT_NAV_SECTIONS = [
    {
        label: "Project Hub",
        items: [
            { name: "Dashboard", href: "", icon: Home },
            { name: "Overview", href: "/overview", icon: LayoutDashboard },
            { name: "Full Report", href: "/report", icon: FileText },
            { name: "Explorer", href: "/explorer", icon: Compass },
        ],
    },
    {
        label: "Strategy Toolkit",
        items: [
            { name: "Insights", href: "/insights", icon: Sparkles },
            { name: "Communications", href: "/communications", icon: MessageCircle },
            { name: "Playbooks", href: "/playbooks", icon: Target },
        ],
    },
    {
        label: "Data & Ops",
        items: [
            { name: "Segments", href: "/segments", icon: Users },
            { name: "Pains", href: "/pains", icon: AlertCircle },
            { name: "Export", href: "/export", icon: Download },
            { name: "Settings", href: "/settings", icon: Settings },
        ],
    },
];

const pagesWithoutSidebar = ["/edit", "/processing", "/generate"];

// Generation step configuration (21 steps - v5 with strategic modules)
// Correct order: Portrait → Segments → Deep Analysis (per segment) → Pains/Canvas → Strategic
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
    // Block 5: Strategic Modules (v5)
    { step: "channel-strategy", label: "Channel Strategy", block: 5 },
    { step: "competitive-intelligence", label: "Competitive Intel", block: 5 },
    { step: "pricing-psychology", label: "Pricing Psychology", block: 5 },
    { step: "trust-framework", label: "Trust Framework", block: 5 },
    { step: "jtbd-context", label: "JTBD Context", block: 5 },
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
    const [projectName, setProjectName] = useState<string>("");
    const [loading, setLoading] = useState(true);

    // Fetch step statuses and project name from API - refetch when pathname changes (after navigation)
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch step statuses
                const stepsRes = await fetch(`/api/projects/${id}/steps`);
                const stepsData = await stepsRes.json();

                if (stepsData.success && stepsData.steps) {
                    setStepStatuses(stepsData.steps);
                }

                // Fetch project name
                const projectRes = await fetch(`/api/projects/${id}`);
                const projectData = await projectRes.json();

                if (projectData.name) {
                    setProjectName(projectData.name);
                } else if (projectData.project?.name) {
                    setProjectName(projectData.project.name);
                }
            } catch (err) {
                console.error("Failed to fetch data:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id, pathname]);

    // Check if we're on a generation page
    const isGeneratePage = pathname.includes("/generate/");

    // Check if current page should hide tabs
    const hideSidebar = pagesWithoutSidebar.some((page) => pathname.includes(page));

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

                    {/* Results Links */}
                    <div className="pt-4 mt-4 border-t border-white/10 shrink-0 space-y-2">
                        <p className="text-xs font-medium text-white/40 uppercase tracking-wider mb-3">Results</p>
                        <Link
                            href={`${baseHref}/overview`}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white/60 hover:bg-white/5 hover:text-white/90 transition-colors"
                        >
                            <LayoutDashboard className="w-4 h-4" />
                            Overview
                        </Link>
                        <Link
                            href={`${baseHref}/report`}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white/60 hover:bg-white/5 hover:text-white/90 transition-colors"
                        >
                            <FileText className="w-4 h-4" />
                            Full Report
                        </Link>
                        <Link
                            href={`${baseHref}/explorer`}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white/60 hover:bg-white/5 hover:text-white/90 transition-colors"
                        >
                            <Compass className="w-4 h-4" />
                            Explorer
                        </Link>
                    </div>

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
                                href="/projects"
                                className="flex items-center gap-1.5 text-slate-500 hover:text-slate-900 transition-colors"
                            >
                                <Home className="w-4 h-4" />
                            </Link>
                            <ChevronRight className="w-4 h-4 text-slate-300" />
                            <Link
                                href={baseHref}
                                className="text-slate-500 hover:text-slate-900 transition-colors max-w-[200px] truncate"
                                title={projectName || "Project"}
                            >
                                {projectName || "Project"}
                            </Link>
                            <ChevronRight className="w-4 h-4 text-slate-300" />
                            <span className="text-slate-500">
                                Generation
                            </span>
                            <ChevronRight className="w-4 h-4 text-slate-300" />
                            <span className="text-slate-900 font-medium">
                                {GENERATION_STEPS.find(s => s.step === currentGenerateStep)?.label || "Step"}
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

    if (hideSidebar) {
        return <>{children}</>;
    }

    return (
        <div className="flex gap-8">
            <aside className="w-60 shrink-0">
                <div className="sticky top-8 rounded-2xl border border-slate-200 bg-white p-5">
                    <div className="mb-6">
                        <p className="text-xs uppercase tracking-wider text-slate-400">Project</p>
                        <p className="mt-1 text-base font-semibold text-slate-900 truncate" title={projectName || "Project"}>
                            {projectName || "Project"}
                        </p>
                    </div>
                    <div className="space-y-6">
                        {PROJECT_NAV_SECTIONS.map((section) => (
                            <div key={section.label}>
                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                                    {section.label}
                                </p>
                                <div className="space-y-1">
                                    {section.items.map((item) => {
                                        const href = `${baseHref}${item.href}`;
                                        const isActive =
                                            pathname === href ||
                                            (item.href
                                                ? pathname.startsWith(`${href}/`)
                                                : pathname === baseHref);

                                        return (
                                            <Link
                                                key={item.name}
                                                href={href}
                                                className={cn(
                                                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                                                    isActive
                                                        ? "bg-slate-900 text-white"
                                                        : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                                                )}
                                            >
                                                <item.icon className={cn("h-4 w-4", isActive ? "text-white" : "text-slate-400")} />
                                                <span className="truncate">{item.name}</span>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-6 border-t border-slate-100 pt-4">
                        <Link
                            href="/projects"
                            className="text-sm font-medium text-slate-400 hover:text-slate-900 transition-colors"
                        >
                            ← Back to projects
                        </Link>
                    </div>
                </div>
            </aside>
            <div className="flex-1 min-w-0">{children}</div>
        </div>
    );
}
