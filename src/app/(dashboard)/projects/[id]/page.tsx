"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { useTranslation } from "@/lib/hooks/useTranslation";
import { ResearchHealthMatrix } from "@/components/dashboard/ResearchHealthMatrix";
import { StrategicHighlights } from "@/components/dashboard/StrategicHighlights";
import { AlertsPanel } from "@/components/dashboard/AlertsPanel";
import {
    Play,
    Pencil,
    FileText,
    AlertTriangle,
    RotateCcw,
    ArrowRight,
    Loader2,
    Trash2,
    Upload,
    Building2,
    Package,
    Globe,
    DollarSign,
    Target,
    Sparkles,
    LayoutDashboard,
    Compass,
    ExternalLink,
    Copy,
    ChevronDown,
    MessageCircle,
    TrendingUp,
    Users,
    CheckCircle2,
    Clock,
    XCircle,
    Megaphone,
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ProjectStep } from "@/types";
import {
    STEP_TO_URL,
    getStepNumber,
    getStepLabel,
    hasProgress,
    isCompleted,
    getProgressPercentage,
} from "@/lib/project-utils";

interface UploadedFile {
    id: string;
    fileName: string;
    filePath: string;
    fileSize: number;
    expiresAt: string;
}

interface Project {
    id: string;
    name: string;
    status: string;
    current_step: ProjectStep;
    onboarding_data: {
        brandName?: string;
        productService?: string;
        productFormat?: string;
        problems?: string[];
        benefits?: string[];
        usp?: string;
        geography?: string;
        businessModel?: string;
        priceSegment?: string;
        idealCustomer?: string;
        competitors?: string[];
        differentiation?: string;
        notAudience?: string;
        additionalContext?: string;
        files?: UploadedFile[];
    };
    created_at: string;
}

interface DashboardResponse {
    research_health: {
        segments: Array<{
            id: string;
            name: string;
            steps: Record<string, "complete" | "pending" | "missing">;
        }>;
    };
    strategic_highlights: {
        top_segments: Array<{ id: string; name: string; priority_score: number }>;
        top_pains: Array<{ id: string; name: string; segment_name: string; impact_score: number }>;
        key_triggers: string[];
        strategy_summary?: {
            growth_bets?: Array<{ title: string; score?: number }>;
            positioning_pillars?: Array<{ pillar: string }>;
        };
    };
    alerts: Array<{
        type: "missing_data" | "incomplete_segment" | "stale_data";
        message: string;
        action_url: string;
    }>;
}

export default function ProjectPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);
    const router = useRouter();
    const [project, setProject] = useState<Project | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState<DashboardResponse | null>(null);
    const [dashboardLoading, setDashboardLoading] = useState(false);
    const [dashboardError, setDashboardError] = useState<string | null>(null);
    const [isResetting, setIsResetting] = useState(false);
    const [showResetModal, setShowResetModal] = useState(false);

    // Language & Translation
    const { language, setLanguage } = useLanguage();
    const { translatedContent, isTranslating } = useTranslation({
        content: project?.onboarding_data,
        language,
        enabled: !!project?.onboarding_data,
    });

    useEffect(() => {
        async function fetchProject() {
            try {
                const res = await fetch(`/api/projects/${id}`);
                if (!res.ok) {
                    console.error("Error fetching project:", res.status);
                    router.push("/projects");
                    return;
                }
                const data = await res.json();
                setProject(data);
            } catch (error) {
                console.error("Error fetching project:", error);
                router.push("/projects");
            } finally {
                setIsLoading(false);
            }
        }

        fetchProject();
    }, [id, router]);

    useEffect(() => {
        let cancelled = false;
        const fetchDashboard = async () => {
            try {
                setDashboardLoading(true);
                setDashboardError(null);
                const res = await fetch(`/api/projects/${id}/dashboard`);
                const data = await res.json();
                if (!res.ok) {
                    throw new Error(data.error || "Failed to load dashboard");
                }
                if (!cancelled) {
                    setDashboardData(data);
                }
            } catch (err) {
                if (!cancelled) {
                    setDashboardError(err instanceof Error ? err.message : "Failed to load dashboard");
                }
            } finally {
                if (!cancelled) {
                    setDashboardLoading(false);
                }
            }
        };
        fetchDashboard();
        return () => {
            cancelled = true;
        };
    }, [id]);

    const handleContinue = () => {
        if (!project) return;
        const url = STEP_TO_URL[project.current_step] || "/generate/validation";
        router.push(`/projects/${id}${url}`);
    };

    const handleStartNew = () => {
        setShowResetModal(true);
    };

    const handleConfirmReset = async () => {
        setIsResetting(true);
        try {
            const res = await fetch(`/api/projects/${id}/reset`, {
                method: "POST",
            });

            if (!res.ok) {
                throw new Error("Failed to reset project");
            }

            router.push(`/projects/${id}/generate/validation`);
        } catch (error) {
            console.error("Error resetting project:", error);
            setIsResetting(false);
            setShowResetModal(false);
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-12 w-64" />
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-48 w-full" />
            </div>
        );
    }

    if (!project) {
        return null;
    }

    // Use translated content if available, otherwise use original
    const data = (translatedContent && typeof translatedContent === 'object')
        ? (translatedContent as Project['onboarding_data'])
        : project.onboarding_data;
    const stepNumber = getStepNumber(project.current_step);
    const stepLabel = getStepLabel(stepNumber);
    const progress = getProgressPercentage(project.current_step);
    const projectHasProgress = hasProgress(project.current_step);
    const projectIsCompleted = isCompleted(project.current_step);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-text-primary">{project.name}</h1>
                    <p className="mt-2 text-text-secondary">
                        {projectIsCompleted
                            ? "Analysis completed. View results or start a new analysis."
                            : projectHasProgress
                            ? "Continue your analysis or start fresh."
                            : "Review your project data and start the analysis."}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <LanguageToggle
                        currentLanguage={language}
                        onLanguageChange={setLanguage}
                        isLoading={isTranslating}
                    />
                    <Badge
                        variant={
                            project.status === "failed"
                                ? "destructive"
                                : project.status === "completed"
                                ? "default"
                                : "secondary"
                        }
                    >
                        {project.status}
                    </Badge>
                </div>
            </div>

            {/* Translation in progress banner */}
            {isTranslating && language !== 'en' && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3">
                    <Loader2 className="w-5 h-5 text-amber-600 animate-spin" />
                    <div>
                        <p className="text-amber-800 font-medium">Translating content...</p>
                        <p className="text-amber-600 text-sm">FREE translation (no AI tokens used)</p>
                    </div>
                </div>
            )}

            {/* Analysis Progress & Actions Card */}
            <Card className="overflow-hidden">
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 text-white">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-lg font-semibold">Analysis Progress</h3>
                            {projectHasProgress ? (
                                <p className="text-slate-300 text-sm mt-1">
                                    {projectIsCompleted
                                        ? "All 15 steps completed"
                                        : `Step ${stepNumber} of 15 — ${stepLabel}`}
                                </p>
                            ) : (
                                <p className="text-slate-300 text-sm mt-1">Not started yet</p>
                            )}
                        </div>
                        <div className="text-right">
                            <span className="text-3xl font-bold">{progress}%</span>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-3 bg-slate-700 rounded-full overflow-hidden mb-6">
                        <div
                            className={cn(
                                "h-full rounded-full transition-all duration-500",
                                projectIsCompleted
                                    ? "bg-emerald-500"
                                    : "bg-gradient-to-r from-blue-500 to-indigo-500"
                            )}
                            style={{ width: `${progress}%` }}
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3">
                        {projectHasProgress ? (
                            <>
                                <Button
                                    onClick={handleContinue}
                                    size="lg"
                                    className="bg-white text-slate-900 hover:bg-slate-100 gap-2"
                                >
                                    {projectIsCompleted ? (
                                        <>
                                            <Sparkles className="w-4 h-4" />
                                            View Results
                                        </>
                                    ) : (
                                        <>
                                            <ArrowRight className="w-4 h-4" />
                                            Continue Analysis
                                        </>
                                    )}
                                </Button>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="lg"
                                            className="border border-slate-500 text-slate-200 hover:bg-slate-700 hover:text-white gap-2"
                                        >
                                            <RotateCcw className="w-4 h-4" />
                                            Start New Analysis
                                            <ChevronDown className="w-4 h-4 opacity-70" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start" className="w-56">
                                        <DropdownMenuItem onClick={handleStartNew}>
                                            <RotateCcw className="mr-2 h-4 w-4" />
                                            Reset This Project
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => router.push(`/projects/new?clone=${id}`)}>
                                            <Copy className="mr-2 h-4 w-4" />
                                            Clone to New Project
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </>
                        ) : (
                            <Button
                                onClick={() => router.push(`/projects/${id}/generate/validation`)}
                                size="lg"
                                className="bg-white text-slate-900 hover:bg-slate-100 gap-2"
                            >
                                <Play className="w-4 h-4" />
                                Start Analysis
                            </Button>
                        )}
                    </div>
                </div>
            </Card>

            {/* Results Section - Always visible */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/10 rounded-lg">
                            <Sparkles className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                            <CardTitle>Results</CardTitle>
                            <CardDescription>
                                {projectHasProgress
                                    ? "View and explore your analysis results"
                                    : "Results will appear here after analysis"}
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Overview */}
                        <Link
                            href={`/projects/${id}/overview`}
                            className={cn(
                                "group flex items-center gap-4 p-4 rounded-xl border-2 transition-all",
                                projectHasProgress
                                    ? "border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 cursor-pointer"
                                    : "border-slate-100 bg-slate-50/50 opacity-60 pointer-events-none"
                            )}
                        >
                            <div className={cn(
                                "p-3 rounded-lg transition-colors",
                                projectHasProgress
                                    ? "bg-blue-100 group-hover:bg-blue-200"
                                    : "bg-slate-100"
                            )}>
                                <LayoutDashboard className={cn(
                                    "w-5 h-5",
                                    projectHasProgress ? "text-blue-600" : "text-slate-400"
                                )} />
                            </div>
                            <div className="flex-1">
                                <h4 className={cn(
                                    "font-semibold",
                                    projectHasProgress ? "text-slate-900" : "text-slate-500"
                                )}>Overview</h4>
                                <p className="text-sm text-slate-500">Key insights at a glance</p>
                            </div>
                            {projectHasProgress && (
                                <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
                            )}
                        </Link>

                        {/* Full Report */}
                        <Link
                            href={`/projects/${id}/report`}
                            className={cn(
                                "group flex items-center gap-4 p-4 rounded-xl border-2 transition-all",
                                projectHasProgress
                                    ? "border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 cursor-pointer"
                                    : "border-slate-100 bg-slate-50/50 opacity-60 pointer-events-none"
                            )}
                        >
                            <div className={cn(
                                "p-3 rounded-lg transition-colors",
                                projectHasProgress
                                    ? "bg-indigo-100 group-hover:bg-indigo-200"
                                    : "bg-slate-100"
                            )}>
                                <FileText className={cn(
                                    "w-5 h-5",
                                    projectHasProgress ? "text-indigo-600" : "text-slate-400"
                                )} />
                            </div>
                            <div className="flex-1">
                                <h4 className={cn(
                                    "font-semibold",
                                    projectHasProgress ? "text-slate-900" : "text-slate-500"
                                )}>Full Report</h4>
                                <p className="text-sm text-slate-500">Complete analysis data</p>
                            </div>
                            {projectHasProgress && (
                                <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                            )}
                        </Link>

                        {/* Explorer */}
                        <Link
                            href={`/projects/${id}/explorer`}
                            className={cn(
                                "group flex items-center gap-4 p-4 rounded-xl border-2 transition-all",
                                projectHasProgress
                                    ? "border-slate-200 hover:border-purple-300 hover:bg-purple-50/50 cursor-pointer"
                                    : "border-slate-100 bg-slate-50/50 opacity-60 pointer-events-none"
                            )}
                        >
                            <div className={cn(
                                "p-3 rounded-lg transition-colors",
                                projectHasProgress
                                    ? "bg-purple-100 group-hover:bg-purple-200"
                                    : "bg-slate-100"
                            )}>
                                <Compass className={cn(
                                    "w-5 h-5",
                                    projectHasProgress ? "text-purple-600" : "text-slate-400"
                                )} />
                            </div>
                            <div className="flex-1">
                                <h4 className={cn(
                                    "font-semibold",
                                    projectHasProgress ? "text-slate-900" : "text-slate-500"
                                )}>Explorer</h4>
                                <p className="text-sm text-slate-500">Explore by segment</p>
                            </div>
                            {projectHasProgress && (
                                <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-purple-500 transition-colors" />
                            )}
                        </Link>
                    </div>
                </CardContent>
            </Card>

            {/* Strategy Toolkit Section */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-500/10 rounded-lg">
                            <Target className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                            <CardTitle>Activation Toolkit</CardTitle>
                            <CardDescription>
                                Turn research into campaigns, communications, and assets
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Insights */}
                        <Link
                            href={`/projects/${id}/insights`}
                            className={cn(
                                "group flex items-center gap-4 p-4 rounded-xl border-2 transition-all",
                                projectHasProgress
                                    ? "border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 cursor-pointer"
                                    : "border-slate-100 bg-slate-50/50 opacity-60 pointer-events-none"
                            )}
                        >
                            <div className={cn(
                                "p-3 rounded-lg transition-colors",
                                projectHasProgress
                                    ? "bg-emerald-100 group-hover:bg-emerald-200"
                                    : "bg-slate-100"
                            )}>
                                <Sparkles className={cn(
                                    "w-5 h-5",
                                    projectHasProgress ? "text-emerald-600" : "text-slate-400"
                                )} />
                            </div>
                            <div className="flex-1">
                                <h4 className={cn(
                                    "font-semibold",
                                    projectHasProgress ? "text-slate-900" : "text-slate-500"
                                )}>Insights</h4>
                                <p className="text-sm text-slate-500">Executive takeaways per segment</p>
                            </div>
                            {projectHasProgress && (
                                <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                            )}
                        </Link>

                        {/* Communications */}
                        <Link
                            href={`/projects/${id}/communications`}
                            className={cn(
                                "group flex items-center gap-4 p-4 rounded-xl border-2 transition-all",
                                projectHasProgress
                                    ? "border-slate-200 hover:border-sky-300 hover:bg-sky-50/50 cursor-pointer"
                                    : "border-slate-100 bg-slate-50/50 opacity-60 pointer-events-none"
                            )}
                        >
                            <div className={cn(
                                "p-3 rounded-lg transition-colors",
                                projectHasProgress
                                    ? "bg-sky-100 group-hover:bg-sky-200"
                                    : "bg-slate-100"
                            )}>
                                <MessageCircle className={cn(
                                    "w-5 h-5",
                                    projectHasProgress ? "text-sky-600" : "text-slate-400"
                                )} />
                            </div>
                            <div className="flex-1">
                                <h4 className={cn(
                                    "font-semibold",
                                    projectHasProgress ? "text-slate-900" : "text-slate-500"
                                )}>Communications</h4>
                                <p className="text-sm text-slate-500">Organic & chatbot scenarios</p>
                            </div>
                            {projectHasProgress && (
                                <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-sky-500 transition-colors" />
                            )}
                        </Link>

                        {/* Playbooks */}
                        <Link
                            href={`/projects/${id}/playbooks`}
                            className={cn(
                                "group flex items-center gap-4 p-4 rounded-xl border-2 transition-all",
                                projectHasProgress
                                    ? "border-slate-200 hover:border-rose-300 hover:bg-rose-50/50 cursor-pointer"
                                    : "border-slate-100 bg-slate-50/50 opacity-60 pointer-events-none"
                            )}
                        >
                            <div className={cn(
                                "p-3 rounded-lg transition-colors",
                                projectHasProgress
                                    ? "bg-rose-100 group-hover:bg-rose-200"
                                    : "bg-slate-100"
                            )}>
                                <Target className={cn(
                                    "w-5 h-5",
                                    projectHasProgress ? "text-rose-600" : "text-slate-400"
                                )} />
                            </div>
                            <div className="flex-1">
                                <h4 className={cn(
                                    "font-semibold",
                                    projectHasProgress ? "text-slate-900" : "text-slate-500"
                                )}>Playbooks</h4>
                                <p className="text-sm text-slate-500">Segment × pain funnels (TOF→BOF)</p>
                            </div>
                            {projectHasProgress && (
                                <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-rose-500 transition-colors" />
                            )}
                        </Link>

                        {/* Strategy */}
                        <Link
                            href={`/projects/${id}/strategy`}
                            className={cn(
                                "group flex items-center gap-4 p-4 rounded-xl border-2 transition-all",
                                projectHasProgress
                                    ? "border-slate-200 hover:border-amber-300 hover:bg-amber-50/50 cursor-pointer"
                                    : "border-slate-100 bg-slate-50/50 opacity-60 pointer-events-none"
                            )}
                        >
                            <div className={cn(
                                "p-3 rounded-lg transition-colors",
                                projectHasProgress
                                    ? "bg-amber-100 group-hover:bg-amber-200"
                                    : "bg-slate-100"
                            )}>
                                <TrendingUp className={cn(
                                    "w-5 h-5",
                                    projectHasProgress ? "text-amber-600" : "text-slate-400"
                                )} />
                            </div>
                            <div className="flex-1">
                                <h4 className={cn(
                                    "font-semibold",
                                    projectHasProgress ? "text-slate-900" : "text-slate-500"
                                )}>Strategy</h4>
                                <p className="text-sm text-slate-500">Personalized, Global & Ads</p>
                            </div>
                            {projectHasProgress && (
                                <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-amber-500 transition-colors" />
                            )}
                        </Link>

                        {/* UGC Creators */}
                        <Link
                            href={`/projects/${id}/ugc-creators`}
                            className={cn(
                                "group flex items-center gap-4 p-4 rounded-xl border-2 transition-all",
                                projectHasProgress
                                    ? "border-slate-200 hover:border-pink-300 hover:bg-pink-50/50 cursor-pointer"
                                    : "border-slate-100 bg-slate-50/50 opacity-60 pointer-events-none"
                            )}
                        >
                            <div className={cn(
                                "p-3 rounded-lg transition-colors",
                                projectHasProgress
                                    ? "bg-pink-100 group-hover:bg-pink-200"
                                    : "bg-slate-100"
                            )}>
                                <Users className={cn(
                                    "w-5 h-5",
                                    projectHasProgress ? "text-pink-600" : "text-slate-400"
                                )} />
                            </div>
                            <div className="flex-1">
                                <h4 className={cn(
                                    "font-semibold",
                                    projectHasProgress ? "text-slate-900" : "text-slate-500"
                                )}>UGC Creators</h4>
                                <p className="text-sm text-slate-500">Profiles & tracking</p>
                            </div>
                            {projectHasProgress && (
                                <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-pink-500 transition-colors" />
                            )}
                        </Link>
                    </div>
                </CardContent>
            </Card>

            {/* Research Health + Highlights + Alerts */}
            {dashboardLoading && (
                <Card>
                    <CardHeader>
                        <CardTitle>Dashboard Insights</CardTitle>
                        <CardDescription>Loading health and highlights…</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <Skeleton className="h-6 w-1/3" />
                            <Skeleton className="h-32 w-full" />
                        </div>
                    </CardContent>
                </Card>
            )}

            {!dashboardLoading && dashboardError && (
                <Card>
                    <CardHeader>
                        <CardTitle>Dashboard Insights</CardTitle>
                        <CardDescription className="text-red-500">{dashboardError}</CardDescription>
                    </CardHeader>
                </Card>
            )}

            {!dashboardLoading && dashboardData && (
                <div className="space-y-6">
                    <ResearchHealthMatrix
                        segments={dashboardData.research_health?.segments || []}
                        title="Research Health Matrix"
                        description="Completion status per segment across research and V5 modules."
                    />
                    <StrategicHighlights
                        topSegments={dashboardData.strategic_highlights?.top_segments || []}
                        topPains={dashboardData.strategic_highlights?.top_pains || []}
                        keyTriggers={dashboardData.strategic_highlights?.key_triggers || []}
                        strategySummary={dashboardData.strategic_highlights?.strategy_summary}
                    />
                    <AlertsPanel
                        alerts={dashboardData.alerts || []}
                        title="Alerts & Next Actions"
                        description="Resolve missing or pending data before scaling activation."
                    />
                </div>
            )}

            {/* Your Input Section */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-accent/10 rounded-lg">
                                <FileText className="w-5 h-5 text-accent" />
                            </div>
                            <div>
                                <CardTitle>Your Input</CardTitle>
                                <CardDescription>Brand and product information</CardDescription>
                            </div>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                            <Link href={`/projects/${id}/edit`}>
                                <Pencil className="w-4 h-4 mr-2" />
                                Edit Input
                            </Link>
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Brand & Product */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputField
                            icon={<Building2 className="w-4 h-4" />}
                            label="Brand Name"
                            value={data.brandName}
                        />
                        <InputField
                            icon={<Package className="w-4 h-4" />}
                            label="Product Format"
                            value={data.productFormat}
                            badge
                        />
                    </div>

                    <div>
                        <InputField
                            icon={<Sparkles className="w-4 h-4" />}
                            label="Product/Service Description"
                            value={data.productService}
                        />
                    </div>

                    {/* Geography & Business */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <InputField
                            icon={<Globe className="w-4 h-4" />}
                            label="Geography"
                            value={data.geography}
                        />
                        <InputField
                            icon={<Target className="w-4 h-4" />}
                            label="Business Model"
                            value={data.businessModel}
                            badge
                        />
                        <InputField
                            icon={<DollarSign className="w-4 h-4" />}
                            label="Price Segment"
                            value={data.priceSegment}
                            badge
                        />
                    </div>

                    {/* Problems & Benefits */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <ListField label="Problems Solved" items={data.problems} variant="error" />
                        <ListField label="Key Benefits" items={data.benefits} variant="success" />
                    </div>

                    {/* USP */}
                    {data.usp && (
                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                            <p className="text-xs font-medium text-amber-700 uppercase tracking-wider mb-2">
                                Unique Selling Proposition
                            </p>
                            <p className="text-sm text-amber-900">{data.usp}</p>
                        </div>
                    )}

                    {/* Competitors */}
                    {data.competitors && data.competitors.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <ListField label="Competitors" items={data.competitors} variant="secondary" />
                            {data.differentiation && (
                                <div>
                                    <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">
                                        Differentiation
                                    </p>
                                    <p className="text-sm text-text-primary">{data.differentiation}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Ideal Customer */}
                    {data.idealCustomer && (
                        <div>
                            <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">
                                Ideal Customer
                            </p>
                            <p className="text-sm text-text-primary">{data.idealCustomer}</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Uploaded Files Section */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500/10 rounded-lg">
                                <FileText className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <CardTitle>Uploaded Files</CardTitle>
                                <CardDescription>
                                    Additional documents for better analysis
                                </CardDescription>
                            </div>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                            <Link href={`/projects/${id}/edit`}>
                                <Upload className="w-4 h-4 mr-2" />
                                Upload More
                            </Link>
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Info Banner */}
                    <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 mb-4">
                        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                        <div className="text-sm">
                            <p className="font-medium text-blue-800">More context = better analysis</p>
                            <p className="mt-1 text-blue-700">
                                Upload customer interviews, survey results, or market research documents.
                            </p>
                        </div>
                    </div>

                    {data.files && data.files.length > 0 ? (
                        <ul className="space-y-2">
                            {data.files.map((file, index) => (
                                <li
                                    key={file.id || index}
                                    className="flex items-center gap-3 rounded-lg border border-border bg-white p-3"
                                >
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                                        <FileText className="h-5 w-5 text-slate-500" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-text-primary truncate">
                                            {file.fileName}
                                        </p>
                                        <p className="text-xs text-text-secondary">
                                            {(file.fileSize / 1024 / 1024).toFixed(2)} MB
                                            {file.expiresAt && (
                                                <span className="ml-2">
                                                    • Expires {new Date(file.expiresAt).toLocaleDateString()}
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="rounded-lg border-2 border-dashed border-border bg-slate-50 p-8 text-center">
                            <FileText className="mx-auto h-10 w-10 text-slate-400 mb-3" />
                            <p className="text-sm text-text-secondary font-medium">No files uploaded</p>
                            <p className="text-xs text-text-secondary mt-1">
                                Click "Upload More" to add documents for better analysis
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Additional Context */}
            {(data.notAudience || data.additionalContext) && (
                <Card>
                    <CardHeader>
                        <CardTitle>Additional Context</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {data.notAudience && (
                            <div>
                                <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">
                                    Who is NOT your audience
                                </p>
                                <p className="text-sm text-text-primary">{data.notAudience}</p>
                            </div>
                        )}
                        {data.additionalContext && (
                            <div>
                                <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">
                                    Additional Notes
                                </p>
                                <p className="text-sm text-text-primary">{data.additionalContext}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Reset Confirmation Modal */}
            <Modal
                isOpen={showResetModal}
                onClose={() => setShowResetModal(false)}
                title="Start New Analysis?"
                description="This action cannot be undone."
                footer={
                    <>
                        <Button
                            variant="outline"
                            onClick={() => setShowResetModal(false)}
                            disabled={isResetting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleConfirmReset}
                            disabled={isResetting}
                        >
                            {isResetting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Resetting...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete & Start Fresh
                                </>
                            )}
                        </Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-800">
                            <strong>This will permanently delete:</strong>
                        </p>
                        <ul className="mt-2 space-y-1 text-sm text-red-700">
                            <li>• All generated content (validation, portraits, segments...)</li>
                            <li>• All approved analysis data</li>
                            <li>• Final reports and exports</li>
                        </ul>
                    </div>
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800">
                            <strong>What will be kept:</strong>
                        </p>
                        <ul className="mt-2 space-y-1 text-sm text-blue-700">
                            <li>• Your original input data (brand info, product details)</li>
                            <li>• Uploaded files</li>
                        </ul>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

// Helper Components

function InputField({
    icon,
    label,
    value,
    badge = false,
}: {
    icon: React.ReactNode;
    label: string;
    value?: string;
    badge?: boolean;
}) {
    if (!value) return null;

    return (
        <div>
            <div className="flex items-center gap-2 mb-1.5">
                <span className="text-text-secondary">{icon}</span>
                <p className="text-xs font-medium text-text-secondary uppercase tracking-wider">
                    {label}
                </p>
            </div>
            {badge ? (
                <Badge variant="secondary" className="text-sm">
                    {value}
                </Badge>
            ) : (
                <p className="text-sm text-text-primary">{value}</p>
            )}
        </div>
    );
}

function ListField({
    label,
    items,
    variant = "default",
}: {
    label: string;
    items?: string[];
    variant?: "default" | "success" | "error" | "secondary";
}) {
    if (!items || items.length === 0) return null;

    const dotColors = {
        default: "bg-accent",
        success: "bg-emerald-500",
        error: "bg-red-500",
        secondary: "bg-slate-400",
    };

    return (
        <div>
            <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">
                {label}
            </p>
            <ul className="space-y-1.5">
                {items.map((item, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-text-primary">
                        <span
                            className={cn(
                                "w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0",
                                dotColors[variant]
                            )}
                        />
                        {item}
                    </li>
                ))}
            </ul>
        </div>
    );
}
