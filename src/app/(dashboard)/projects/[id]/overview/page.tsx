"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  Target,
  Palette,
  FileText,
  Search,
  Download,
  CheckCircle,
  Loader2,
  AlertCircle,
  Pencil,
  ChevronRight,
  Building2,
  Package,
  Sparkles,
  Globe,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/report/StatCard";
import { AudienceSnapshot } from "@/components/report/AudienceSnapshot";
import { TopList } from "@/components/report/TopList";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { useTranslation } from "@/lib/hooks/useTranslation";
import { OnboardingData, ProjectFile } from "@/types";
import { createClient } from "@/lib/supabase";

interface OverviewData {
  project: {
    id: string;
    name: string;
    onboarding_data: OnboardingData;
  };
  portrait: {
    age_range?: string;
    gender_distribution?: string;
    income_level?: string;
    location?: string;
    occupation?: string;
    education?: string;
    family_status?: string;
    sociodemographics?: string;
    psychographics?: string;
  } | null;
  counts: {
    segments: number;
    pains: number;
    canvas: number;
  };
  topSegments: Array<{
    id: string;
    name: string;
    description: string;
    sociodemographics?: string;
  }>;
  topPains: Array<{
    id: string;
    name: string;
    impact_score: number;
  }>;
}

export default function OverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = use(params);
  const router = useRouter();
  const supabase = createClient();

  const [data, setData] = useState<OverviewData | null>(null);
  const [projectFiles, setProjectFiles] = useState<ProjectFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Language
  const { language, setLanguage } = useLanguage();
  const { translatedContent, isTranslating } = useTranslation({
    content: data,
    language,
    enabled: !!data,
  });

  // Use translated content if available and has valid structure, otherwise use original data
  // translatedContent is null when: English selected, translation not yet complete, or translation failed
  const displayData: OverviewData | null = (
    translatedContent !== null &&
    typeof translatedContent === 'object' &&
    (translatedContent as OverviewData).project
  )
    ? (translatedContent as OverviewData)
    : data;

  useEffect(() => {
    fetchData();
  }, [projectId]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch report data
      const res = await fetch(`/api/report?projectId=${projectId}&level=overview`);
      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Failed to load data");
      }

      setData(result.data);

      // Fetch project files
      const { data: files } = await supabase
        .from("project_files")
        .select("*")
        .eq("project_id", projectId);

      setProjectFiles(files || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (error || !displayData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertCircle className="w-12 h-12 text-red-400" />
        <p className="text-slate-600">{error || "No data available"}</p>
        <Button onClick={fetchData}>Retry</Button>
      </div>
    );
  }

  const onboarding = displayData.project.onboarding_data;
  const isResearchComplete = displayData.counts.segments > 0 && displayData.counts.canvas > 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between"
      >
        <div className="flex items-start gap-4">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl text-white shadow-lg shadow-blue-500/20">
            <LayoutDashboard className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {onboarding?.brandName || displayData.project.name}
            </h1>
            <p className="mt-1 text-slate-500">
              Audience Research Dashboard
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <LanguageToggle
            currentLanguage={language}
            onLanguageChange={setLanguage}
            isLoading={isTranslating}
          />
          <Button
            variant="outline"
            onClick={() => router.push(`/projects/${projectId}/generate/segment-details`)}
            className="gap-2"
          >
            <Pencil className="w-4 h-4" />
            Edit Research
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push(`/projects/${projectId}/report`)}
            className="gap-2"
          >
            <FileText className="w-4 h-4" />
            Full Report
          </Button>
          <Button
            onClick={() => router.push(`/projects/${projectId}/explorer`)}
            className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600"
          >
            <Search className="w-4 h-4" />
            Explore Data
          </Button>
        </div>
      </motion.div>

      {/* Translation in progress banner */}
      {isTranslating && language !== 'en' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3"
        >
          <Loader2 className="w-5 h-5 text-amber-600 animate-spin" />
          <div>
            <p className="text-amber-800 font-medium">Translating content...</p>
            <p className="text-amber-600 text-sm">This may take 1-2 minutes</p>
          </div>
        </motion.div>
      )}

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-4 gap-4"
      >
        <StatCard
          icon={CheckCircle}
          label="Portrait"
          value={displayData.portrait ? "Complete" : "Pending"}
          sublabel={displayData.portrait ? "Audience defined" : "Not generated"}
          color={displayData.portrait ? "emerald" : "amber"}
        />
        <StatCard
          icon={Users}
          label="Segments"
          value={displayData.counts.segments}
          sublabel="Audience groups"
          color="blue"
        />
        <StatCard
          icon={Target}
          label="Pain Points"
          value={displayData.counts.pains}
          sublabel="Identified problems"
          color="rose"
        />
        <StatCard
          icon={Palette}
          label="Canvas"
          value={displayData.counts.canvas}
          sublabel="Deep analyses"
          color="purple"
        />
      </motion.div>

      {/* Audience Snapshot */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <AudienceSnapshot portrait={displayData.portrait} />
      </motion.div>

      {/* Top Lists */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-2 gap-6"
      >
        <TopList
          title="Top Segments"
          icon={Users}
          items={displayData.topSegments.map(seg => ({
            id: seg.id,
            name: seg.name,
            description: seg.description?.substring(0, 80) + (seg.description?.length > 80 ? "..." : ""),
          }))}
          emptyMessage="No segments generated yet"
          color="blue"
          onItemClick={(id) => router.push(`/projects/${projectId}/explorer?segment=${id}`)}
        />
        <TopList
          title="Top Pain Points"
          icon={Target}
          items={displayData.topPains.map(pain => ({
            id: pain.id,
            name: pain.name,
            value: `${pain.impact_score}/10`,
          }))}
          emptyMessage="No pain points ranked yet"
          color="amber"
          onItemClick={(id) => router.push(`/projects/${projectId}/explorer?pain=${id}`)}
        />
      </motion.div>

      {/* Your Input Section */}
      {onboarding && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50/50 to-transparent">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg">Your Input</CardTitle>
                </div>
                <Link href={`/projects/${projectId}/edit`}>
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
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-xs font-medium text-amber-600 uppercase tracking-wider mb-2">
                    Unique Selling Proposition
                  </p>
                  <p className="text-sm text-slate-900">{onboarding.usp}</p>
                </div>
              )}

              {/* Uploaded Files */}
              {projectFiles.length > 0 && (
                <div className="pt-4 border-t border-slate-200">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
                    Uploaded Files
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {projectFiles.map((file) => (
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
        </motion.div>
      )}

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex items-center justify-center gap-4 pt-6 border-t border-slate-200"
      >
        <Button
          variant="outline"
          onClick={() => router.push(`/projects/${projectId}/report`)}
          className="gap-2"
        >
          <FileText className="w-4 h-4" />
          View Full Report
        </Button>
        <Button
          variant="outline"
          onClick={() => router.push(`/projects/${projectId}/explorer`)}
          className="gap-2"
        >
          <Search className="w-4 h-4" />
          Explore Segments
        </Button>
        {isResearchComplete && (
          <Button
            variant="outline"
            onClick={() => {/* TODO: Export */}}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Export PDF
          </Button>
        )}
      </motion.div>
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
        <span className="text-slate-400">{icon}</span>
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
          {label}
        </p>
      </div>
      {badge ? (
        <Badge variant="secondary" className="text-sm">
          {value}
        </Badge>
      ) : (
        <p className="text-sm text-slate-900">{value}</p>
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
    default: "bg-blue-500",
    success: "bg-emerald-500",
    error: "bg-rose-500",
    secondary: "bg-slate-400",
  };

  return (
    <div>
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
        {label}
      </p>
      <ul className="space-y-1.5">
        {items.map((item, index) => (
          <li key={index} className="flex items-start gap-2 text-sm text-slate-900">
            <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]} mt-2 flex-shrink-0`} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
