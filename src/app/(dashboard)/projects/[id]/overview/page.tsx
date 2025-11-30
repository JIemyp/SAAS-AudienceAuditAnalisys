"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { AudienceOverview, OnboardingData, ProjectFile } from "@/types";
import {
    FileText,
    Pencil,
    ChevronRight,
    Users,
    Brain,
    AlertCircle,
    Zap,
    Building2,
    Target,
    Sparkles,
    Globe,
    DollarSign,
    Package,
} from "lucide-react";

interface ProjectWithFiles {
    id: string;
    name: string;
    onboarding_data: OnboardingData;
    project_files: ProjectFile[];
}

export default function OverviewPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [project, setProject] = useState<ProjectWithFiles | null>(null);
    const [overview, setOverview] = useState<AudienceOverview | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        async function fetchData() {
            try {
                // Fetch project with files
                const { data: projectData, error: projectError } = await supabase
                    .from("projects")
                    .select("id, name, onboarding_data, project_files(*)")
                    .eq("id", id)
                    .single();

                if (projectError) throw projectError;
                setProject(projectData);

                // Fetch overview
                const { data: overviewData, error: overviewError } = await supabase
                    .from("audience_overviews")
                    .select("*")
                    .eq("project_id", id)
                    .order("created_at", { ascending: false })
                    .limit(1)
                    .maybeSingle();

                if (overviewError) throw overviewError;
                setOverview(overviewData);
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setIsLoading(false);
            }
        }

        fetchData();
    }, [id, supabase]);

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-12 w-64" />
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-48 w-full" />
            </div>
        );
    }

    const onboarding = project?.onboarding_data;

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-bold text-text-primary tracking-tight">
                    Audience Overview
                </h1>
                <p className="mt-2 text-text-secondary">
                    Comprehensive analysis of your target audience based on your product data
                </p>
            </div>

            {/* Your Input Section */}
            {onboarding && (
                <Card className="border-l-4 border-l-accent bg-gradient-to-r from-accent/5 to-transparent">
                    <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-accent/10 rounded-lg">
                                    <FileText className="w-5 h-5 text-accent" />
                                </div>
                                <CardTitle className="text-lg">Your Input</CardTitle>
                            </div>
                            <Link href={`/projects/${id}/edit`}>
                                <Button variant="ghost" size="sm" className="gap-2">
                                    <Pencil className="w-4 h-4" />
                                    Edit Input
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Brand & Product Row */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InputField
                                icon={<Building2 className="w-4 h-4" />}
                                label="Brand"
                                value={onboarding.brandName}
                            />
                            <InputField
                                icon={<Package className="w-4 h-4" />}
                                label="Product/Service"
                                value={onboarding.productService}
                            />
                        </div>

                        {/* Format & Geography */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InputField
                                icon={<Sparkles className="w-4 h-4" />}
                                label="Product Format"
                                value={onboarding.productFormat}
                            />
                            <InputField
                                icon={<Globe className="w-4 h-4" />}
                                label="Geography"
                                value={onboarding.geography}
                            />
                        </div>

                        {/* Business Model & Price */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InputField
                                icon={<Target className="w-4 h-4" />}
                                label="Business Model"
                                value={onboarding.businessModel}
                                badge
                            />
                            <InputField
                                icon={<DollarSign className="w-4 h-4" />}
                                label="Price Segment"
                                value={onboarding.priceSegment}
                                badge
                            />
                        </div>

                        {/* Problems & Benefits */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <ListField
                                label="Problems Solved"
                                items={onboarding.problems}
                                variant="error"
                            />
                            <ListField
                                label="Key Benefits"
                                items={onboarding.benefits}
                                variant="success"
                            />
                        </div>

                        {/* USP */}
                        {onboarding.usp && (
                            <div className="p-4 bg-warning/5 border border-warning/20 rounded-lg">
                                <p className="text-xs font-medium text-warning uppercase tracking-wider mb-2">
                                    Unique Selling Proposition
                                </p>
                                <p className="text-sm text-text-primary">{onboarding.usp}</p>
                            </div>
                        )}

                        {/* Competitors & Differentiation */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <ListField
                                label="Competitors"
                                items={onboarding.competitors}
                                variant="secondary"
                            />
                            {onboarding.differentiation && (
                                <div>
                                    <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">
                                        Differentiation
                                    </p>
                                    <p className="text-sm text-text-primary leading-relaxed">
                                        {onboarding.differentiation}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Uploaded Files */}
                        {project?.project_files && project.project_files.length > 0 && (
                            <div className="pt-4 border-t border-border">
                                <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-3">
                                    Uploaded Files
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {project.project_files.map((file) => (
                                        <Badge key={file.id} variant="secondary" className="gap-1.5 py-1.5 px-3">
                                            <FileText className="w-3 h-3" />
                                            {file.file_name}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Generated Analysis Sections */}
            {!overview ? (
                <Card>
                    <CardContent className="p-12 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-bg-secondary flex items-center justify-center">
                            <Brain className="w-8 h-8 text-text-secondary" />
                        </div>
                        <p className="text-text-secondary text-lg">
                            No analysis data available yet.
                        </p>
                        <p className="text-text-secondary text-sm mt-1">
                            The analysis may still be processing.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-6">
                    {/* Socio-demographics */}
                    <AnalysisCard
                        icon={<Users className="w-5 h-5" />}
                        title="Socio-demographics"
                        description="Age, gender, income, location, and occupation"
                        data={overview.sociodemographics}
                        color="blue"
                    />

                    {/* Psychographics */}
                    <AnalysisCard
                        icon={<Brain className="w-5 h-5" />}
                        title="Psychographics"
                        description="Values, interests, lifestyle, and personality traits"
                        data={overview.psychographics}
                        color="purple"
                    />

                    {/* General Pain Points */}
                    <AnalysisCard
                        icon={<AlertCircle className="w-5 h-5" />}
                        title="General Pain Points"
                        description="Top-level problems and frustrations"
                        data={overview.general_pains}
                        color="red"
                    />

                    {/* Purchase Triggers */}
                    <AnalysisCard
                        icon={<Zap className="w-5 h-5" />}
                        title="Purchase Triggers"
                        description="What drives buying decisions"
                        data={overview.triggers}
                        color="green"
                    />
                </div>
            )}
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
        success: "bg-success",
        error: "bg-error",
        secondary: "bg-text-secondary",
    };

    return (
        <div>
            <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">
                {label}
            </p>
            <ul className="space-y-1.5">
                {items.map((item, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-text-primary">
                        <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]} mt-2 flex-shrink-0`} />
                        {item}
                    </li>
                ))}
            </ul>
        </div>
    );
}

function AnalysisCard({
    icon,
    title,
    description,
    data,
    color,
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
    data: Record<string, unknown> | null | undefined;
    color: "blue" | "purple" | "red" | "green";
}) {
    const colorClasses = {
        blue: "border-l-blue-500 bg-blue-500",
        purple: "border-l-purple-500 bg-purple-500",
        red: "border-l-red-500 bg-red-500",
        green: "border-l-green-500 bg-green-500",
    };

    const bgClasses = {
        blue: "bg-blue-500/10 text-blue-600",
        purple: "bg-purple-500/10 text-purple-600",
        red: "bg-red-500/10 text-red-600",
        green: "bg-green-500/10 text-green-600",
    };

    return (
        <Card className={`border-l-4 ${colorClasses[color].split(" ")[0]}`}>
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${bgClasses[color]}`}>
                            {icon}
                        </div>
                        <div>
                            <CardTitle className="text-lg">{title}</CardTitle>
                            <p className="text-sm text-text-secondary mt-0.5">{description}</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="sm" className="gap-2">
                        <Pencil className="w-4 h-4" />
                        Edit
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {data && typeof data === "object" && Object.keys(data).length > 0 ? (
                    <div className="space-y-4">
                        {Object.entries(data).map(([key, value]) => (
                            <DataField key={key} label={key} value={value} />
                        ))}
                    </div>
                ) : (
                    <p className="text-text-secondary text-sm italic">No data available</p>
                )}
            </CardContent>
        </Card>
    );
}

function DataField({ label, value }: { label: string; value: unknown }) {
    // Format the label from snake_case to Title Case
    const formattedLabel = label
        .replace(/_/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase());

    if (value === null || value === undefined) return null;

    // Handle arrays
    if (Array.isArray(value)) {
        if (value.length === 0) return null;
        return (
            <div>
                <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">
                    {formattedLabel}
                </p>
                <ul className="space-y-1.5">
                    {value.map((item, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-text-primary">
                            <span className="w-1.5 h-1.5 rounded-full bg-accent mt-2 flex-shrink-0" />
                            {String(item)}
                        </li>
                    ))}
                </ul>
            </div>
        );
    }

    // Handle strings
    if (typeof value === "string") {
        return (
            <div>
                <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-1">
                    {formattedLabel}
                </p>
                <p className="text-sm text-text-primary leading-relaxed">{value}</p>
            </div>
        );
    }

    // Handle objects
    if (typeof value === "object") {
        return (
            <div>
                <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">
                    {formattedLabel}
                </p>
                <div className="pl-4 border-l-2 border-border space-y-2">
                    {Object.entries(value as Record<string, unknown>).map(([k, v]) => (
                        <DataField key={k} label={k} value={v} />
                    ))}
                </div>
            </div>
        );
    }

    // Handle other primitives
    return (
        <div>
            <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-1">
                {formattedLabel}
            </p>
            <p className="text-sm text-text-primary">{String(value)}</p>
        </div>
    );
}
