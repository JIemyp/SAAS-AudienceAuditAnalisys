"use client";

import { use, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Users,
  Target,
  Palette,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle,
  Download,
  Printer,
  Star,
  Briefcase,
  Heart,
  AlertTriangle,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { useTranslation } from "@/lib/hooks/useTranslation";
import { OnboardingData, JobItem, PreferenceItem, DifficultyItem, TriggerItem } from "@/types";

interface SegmentWithData {
  id: string;
  name: string;
  description: string;
  sociodemographics?: string;
  order_index: number;
  details?: {
    sociodemographics?: string;
    psychographics?: string;
    online_behavior?: string;
    buying_behavior?: string;
  };
  jobs?: {
    functional_jobs?: JobItem[];
    emotional_jobs?: JobItem[];
    social_jobs?: JobItem[];
  };
  preferences?: {
    preferences?: PreferenceItem[];
    decision_criteria?: string[];
    preferred_channels?: string[];
    content_preferences?: string[];
    communication_style?: string;
  };
  difficulties?: {
    difficulties?: DifficultyItem[];
    external_difficulties?: string[];
    internal_difficulties?: string[];
    knowledge_gaps?: string[];
  };
  triggers?: {
    triggers?: TriggerItem[];
    situation_triggers?: string[];
    emotional_triggers?: string[];
    social_triggers?: string[];
  };
  pains: Array<{
    id: string;
    name: string;
    description: string;
    is_top_pain: boolean;
    impact_score: number;
  }>;
  canvas: Array<{
    id: string;
    pain_id: string;
    emotional_aspects?: string;
    behavioral_patterns?: string;
    buying_signals?: string;
  }>;
}

interface FullReportData {
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
  segments: SegmentWithData[];
}

type SectionId = "portrait" | "segments" | "pains" | "canvas";

export default function FullReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = use(params);
  const router = useRouter();
  const reportRef = useRef<HTMLDivElement>(null);

  const [data, setData] = useState<FullReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["portrait", "segments"]));
  const [expandedSegments, setExpandedSegments] = useState<Set<string>>(new Set());

  // Language
  const { language, setLanguage } = useLanguage();
  const { translatedContent, isTranslating } = useTranslation({
    content: data,
    language,
    enabled: !!data,
  });

  // Debug: log translation state
  useEffect(() => {
    console.log("Translation state:", {
      language,
      isTranslating,
      hasData: !!data,
      translatedContent: translatedContent === null ? 'null' : typeof translatedContent,
      translatedContentKeys: typeof translatedContent === 'object' && translatedContent
        ? Object.keys(translatedContent)
        : 'N/A',
      hasProject: !!(translatedContent as FullReportData)?.project
    });
  }, [language, isTranslating, data, translatedContent]);

  // Use translated content if available and has valid structure, otherwise use original data
  // translatedContent is null when: English selected, translation not yet complete, or translation failed
  const displayData: FullReportData | null = (
    translatedContent !== null &&
    typeof translatedContent === 'object' &&
    (translatedContent as FullReportData).project
  )
    ? (translatedContent as FullReportData)
    : data;

  useEffect(() => {
    fetchData();
  }, [projectId]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const res = await fetch(`/api/report?projectId=${projectId}&level=full`);
      const result = await res.json();

      console.log("Report API response:", { status: res.status, result });

      if (!res.ok) {
        throw new Error(result.error || "Failed to load report");
      }

      // Validate response data
      if (!result.data) {
        console.error("API returned no data:", result);
        throw new Error("No data returned from API");
      }

      if (!result.data.project) {
        console.error("API returned data without project:", result.data);
        throw new Error("Project data not found. Please ensure the project exists and you have access to it.");
      }

      setData(result.data);

      // Auto-expand first segment
      if (result.data.segments?.length > 0) {
        setExpandedSegments(new Set([result.data.segments[0].id]));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load report");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSection = (sectionId: SectionId) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  const toggleSegment = (segmentId: string) => {
    setExpandedSegments((prev) => {
      const next = new Set(prev);
      if (next.has(segmentId)) {
        next.delete(segmentId);
      } else {
        next.add(segmentId);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedSections(new Set(["portrait", "segments", "pains", "canvas"]));
    if (data?.segments) {
      setExpandedSegments(new Set(data.segments.map((s) => s.id)));
    }
  };

  const collapseAll = () => {
    setExpandedSections(new Set());
    setExpandedSegments(new Set());
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (error || !displayData || !displayData.project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertCircle className="w-12 h-12 text-red-400" />
        <p className="text-slate-600">{error || "No report data available"}</p>
        <Button onClick={fetchData}>Retry</Button>
      </div>
    );
  }

  const onboarding = displayData.project?.onboarding_data;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 print:mb-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl text-white shadow-lg print:hidden">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {onboarding?.brandName || displayData.project.name}
            </h1>
            <p className="text-slate-500">Audience Research Report</p>
          </div>
        </div>

        <div className="flex items-center gap-3 print:hidden">
          <LanguageToggle
            currentLanguage={language}
            onLanguageChange={setLanguage}
            isLoading={isTranslating}
          />
          <Button variant="outline" size="sm" onClick={expandAll}>
            Expand All
          </Button>
          <Button variant="outline" size="sm" onClick={collapseAll}>
            Collapse All
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2">
            <Printer className="w-4 h-4" />
            Print
          </Button>
          <Button
            onClick={() => router.push(`/projects/${projectId}/export`)}
            className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600"
          >
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Translation in progress banner */}
      {isTranslating && language !== 'en' && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3 print:hidden">
          <Loader2 className="w-5 h-5 text-amber-600 animate-spin" />
          <div>
            <p className="text-amber-800 font-medium">Translating report...</p>
            <p className="text-amber-600 text-sm">This may take 2-3 minutes for large reports</p>
          </div>
        </div>
      )}

      {/* Report Content */}
      <div ref={reportRef} className="space-y-6">
        {/* Executive Summary */}
        <Card className="border-l-4 border-l-blue-500 print:border-l-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Executive Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-500">Brand:</span>{" "}
                <span className="font-medium">{onboarding?.brandName}</span>
              </div>
              <div>
                <span className="text-slate-500">Product:</span>{" "}
                <span className="font-medium">{onboarding?.productService}</span>
              </div>
              <div>
                <span className="text-slate-500">Geography:</span>{" "}
                <span className="font-medium">{onboarding?.geography}</span>
              </div>
              <div>
                <span className="text-slate-500">Business Model:</span>{" "}
                <span className="font-medium">{onboarding?.businessModel}</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-slate-600">
                This report contains detailed audience research including {displayData.segments?.length || 0} segments,
                pain point analysis, and deep behavioral insights for {onboarding?.brandName || "your brand"}.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Portrait Section */}
        <CollapsibleSection
          id="portrait"
          title="Audience Portrait"
          icon={Users}
          color="emerald"
          isExpanded={expandedSections.has("portrait")}
          onToggle={() => toggleSection("portrait")}
        >
          {displayData.portrait ? (
            <div className="grid grid-cols-2 gap-6">
              <PortraitField label="Age Range" value={displayData.portrait.age_range} />
              <PortraitField label="Gender Distribution" value={displayData.portrait.gender_distribution} />
              <PortraitField label="Income Level" value={displayData.portrait.income_level} />
              <PortraitField label="Location" value={displayData.portrait.location} />
              <PortraitField label="Occupation" value={displayData.portrait.occupation} />
              <PortraitField label="Education" value={displayData.portrait.education} />
              <PortraitField label="Family Status" value={displayData.portrait.family_status} />
              <div className="col-span-2">
                <PortraitField label="Sociodemographics" value={displayData.portrait.sociodemographics} />
              </div>
              <div className="col-span-2">
                <PortraitField label="Psychographics" value={displayData.portrait.psychographics} />
              </div>
            </div>
          ) : (
            <EmptyState message="Portrait not generated yet" />
          )}
        </CollapsibleSection>

        {/* Segments Section */}
        <CollapsibleSection
          id="segments"
          title="Audience Segments"
          icon={Users}
          color="blue"
          badge={displayData.segments?.length}
          isExpanded={expandedSections.has("segments")}
          onToggle={() => toggleSection("segments")}
        >
          {displayData.segments?.length > 0 ? (
            <div className="space-y-4">
              {displayData.segments.map((segment) => (
                <SegmentCard
                  key={segment.id}
                  segment={segment}
                  isExpanded={expandedSegments.has(segment.id)}
                  onToggle={() => toggleSegment(segment.id)}
                />
              ))}
            </div>
          ) : (
            <EmptyState message="No segments generated yet" />
          )}
        </CollapsibleSection>

        {/* Pains Overview */}
        <CollapsibleSection
          id="pains"
          title="Pain Points Overview"
          icon={Target}
          color="rose"
          isExpanded={expandedSections.has("pains")}
          onToggle={() => toggleSection("pains")}
        >
          {displayData.segments?.some((s) => s.pains?.length > 0) ? (
            <div className="space-y-6">
              {displayData.segments.map((segment) => {
                const topPains = segment.pains?.filter((p) => p.is_top_pain) || [];
                if (topPains.length === 0) return null;

                return (
                  <div key={segment.id}>
                    <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                      <Badge variant="secondary">{segment.order_index + 1}</Badge>
                      {segment.name}
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      {topPains.sort((a, b) => b.impact_score - a.impact_score).map((pain) => (
                        <div
                          key={pain.id}
                          className="p-3 bg-rose-50 border border-rose-100 rounded-lg"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-slate-900 flex items-center gap-1.5">
                              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                              {pain.name}
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              {pain.impact_score}/10
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-600 line-clamp-2">{pain.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState message="No pain points ranked yet" />
          )}
        </CollapsibleSection>

        {/* Canvas Overview */}
        <CollapsibleSection
          id="canvas"
          title="Deep Dive Canvas"
          icon={Palette}
          color="purple"
          isExpanded={expandedSections.has("canvas")}
          onToggle={() => toggleSection("canvas")}
        >
          {displayData.segments?.some((s) => s.canvas?.length > 0) ? (
            <div className="space-y-6">
              {displayData.segments.map((segment) => {
                if (!segment.canvas?.length) return null;

                return (
                  <div key={segment.id}>
                    <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                      <Badge variant="secondary">{segment.order_index + 1}</Badge>
                      {segment.name}
                    </h4>
                    {segment.canvas.map((canvas) => {
                      const pain = segment.pains.find((p) => p.id === canvas.pain_id);
                      return (
                        <Card key={canvas.id} className="mb-3">
                          <CardHeader className="py-3 bg-purple-50 border-b border-purple-100">
                            <CardTitle className="text-sm flex items-center gap-2">
                              <Palette className="w-4 h-4 text-purple-600" />
                              {pain?.name || "Canvas"}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-4 grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-xs font-medium text-slate-500 uppercase mb-1">Emotional Aspects</p>
                              <p className="text-slate-700">{renderJsonField(canvas.emotional_aspects)}</p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-slate-500 uppercase mb-1">Behavioral Patterns</p>
                              <p className="text-slate-700">{renderJsonField(canvas.behavioral_patterns)}</p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-slate-500 uppercase mb-1">Buying Signals</p>
                              <p className="text-slate-700">{renderJsonField(canvas.buying_signals)}</p>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState message="No canvas data generated yet" />
          )}
        </CollapsibleSection>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body {
            font-size: 12px;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:border-l-2 {
            border-left-width: 2px;
          }
          .print\\:mb-4 {
            margin-bottom: 1rem;
          }
        }
      `}</style>
    </div>
  );
}

// Collapsible Section Component
function CollapsibleSection({
  title,
  icon: Icon,
  color,
  badge,
  isExpanded,
  onToggle,
  children,
}: {
  id?: string;
  title: string;
  icon: typeof Users;
  color: "blue" | "emerald" | "rose" | "purple";
  badge?: number;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const colorStyles = {
    blue: "border-l-blue-500 text-blue-600",
    emerald: "border-l-emerald-500 text-emerald-600",
    rose: "border-l-rose-500 text-rose-600",
    purple: "border-l-purple-500 text-purple-600",
  };

  return (
    <Card className={cn("border-l-4 overflow-hidden print:break-inside-avoid", colorStyles[color].split(" ")[0])}>
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors print:pointer-events-none"
      >
        <div className="flex items-center gap-3">
          <Icon className={cn("w-5 h-5", colorStyles[color].split(" ")[1])} />
          <span className="font-semibold text-slate-900">{title}</span>
          {badge !== undefined && (
            <Badge variant="secondary" className="ml-2">
              {badge}
            </Badge>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-slate-400 print:hidden" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-400 print:hidden" />
        )}
      </button>
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 border-t border-slate-100">
              <div className="pt-4">{children}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

// Segment Card Component
function SegmentCard({
  segment,
  isExpanded,
  onToggle,
}: {
  segment: SegmentWithData;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden print:break-inside-avoid">
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors print:pointer-events-none"
      >
        <div className="flex items-center gap-3">
          <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-semibold">
            {segment.order_index + 1}
          </span>
          <span className="font-medium text-slate-900">{segment.name}</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-slate-400 print:hidden" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400 print:hidden" />
        )}
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-slate-100 space-y-4">
              {/* Description */}
              <div className="pt-3">
                <p className="text-sm text-slate-600">{segment.description}</p>
              </div>

              {/* Details Grid */}
              {segment.details && (
                <div className="grid grid-cols-2 gap-4">
                  <DetailField label="Sociodemographics" value={segment.details.sociodemographics || segment.sociodemographics} />
                  <DetailField label="Psychographics" value={segment.details.psychographics} />
                  <DetailField label="Online Behavior" value={segment.details.online_behavior} />
                  <DetailField label="Buying Behavior" value={segment.details.buying_behavior} />
                </div>
              )}

              {/* Jobs */}
              {segment.jobs && (
                <div className="pt-2 border-t border-slate-100">
                  <h5 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-blue-500" />
                    Jobs to Be Done
                  </h5>
                  <div className="grid grid-cols-3 gap-3">
                    <ListField label="Functional" items={segment.jobs.functional_jobs} color="blue" fieldName="job" />
                    <ListField label="Emotional" items={segment.jobs.emotional_jobs} color="rose" fieldName="job" />
                    <ListField label="Social" items={segment.jobs.social_jobs} color="amber" fieldName="job" />
                  </div>
                </div>
              )}

              {/* Preferences */}
              {segment.preferences && (
                <div className="pt-2 border-t border-slate-100">
                  <h5 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                    <Heart className="w-4 h-4 text-rose-500" />
                    Preferences
                  </h5>
                  {/* Show preferences array if available, otherwise show legacy fields */}
                  {segment.preferences.preferences && segment.preferences.preferences.length > 0 ? (
                    <ListField label="All Preferences" items={segment.preferences.preferences} color="rose" fieldName="name" />
                  ) : (
                    <div className="grid grid-cols-3 gap-3">
                      <ListField label="Decision Criteria" items={segment.preferences.decision_criteria} color="blue" />
                      <ListField label="Channels" items={segment.preferences.preferred_channels} color="emerald" />
                      <ListField label="Content" items={segment.preferences.content_preferences} color="purple" />
                    </div>
                  )}
                </div>
              )}

              {/* Difficulties */}
              {segment.difficulties && (
                <div className="pt-2 border-t border-slate-100">
                  <h5 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    Difficulties
                  </h5>
                  {/* Show difficulties array if available, otherwise show legacy fields */}
                  {segment.difficulties.difficulties && segment.difficulties.difficulties.length > 0 ? (
                    <ListField label="All Difficulties" items={segment.difficulties.difficulties} color="amber" fieldName="name" />
                  ) : (
                    <div className="grid grid-cols-3 gap-3">
                      <ListField label="External" items={segment.difficulties.external_difficulties} color="rose" />
                      <ListField label="Internal" items={segment.difficulties.internal_difficulties} color="amber" />
                      <ListField label="Knowledge Gaps" items={segment.difficulties.knowledge_gaps} color="slate" />
                    </div>
                  )}
                </div>
              )}

              {/* Triggers */}
              {segment.triggers && (
                <div className="pt-2 border-t border-slate-100">
                  <h5 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-purple-500" />
                    Triggers
                  </h5>
                  {/* Show triggers array if available, otherwise show legacy fields */}
                  {segment.triggers.triggers && segment.triggers.triggers.length > 0 ? (
                    <ListField label="All Triggers" items={segment.triggers.triggers} color="purple" fieldName="name" />
                  ) : (
                    <div className="grid grid-cols-3 gap-3">
                      <ListField label="Situational" items={segment.triggers.situation_triggers} color="blue" />
                      <ListField label="Emotional" items={segment.triggers.emotional_triggers} color="rose" />
                      <ListField label="Social" items={segment.triggers.social_triggers} color="purple" />
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Helper Components
function PortraitField({ label, value }: { label: string; value?: string }) {
  if (!value) return null;

  return (
    <div>
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-sm text-slate-900">{value}</p>
    </div>
  );
}

function DetailField({ label, value }: { label: string; value?: string }) {
  if (!value) return null;

  return (
    <div>
      <p className="text-xs font-medium text-slate-500 uppercase mb-1">{label}</p>
      <p className="text-sm text-slate-700">{value}</p>
    </div>
  );
}

// Helper to extract display text from items (handles both strings and objects)
function getItemText(item: unknown, fieldName: string = "name"): string {
  if (typeof item === "string") return item;
  if (item && typeof item === "object") {
    const obj = item as Record<string, unknown>;
    // Try common field names in order
    if (obj[fieldName] && typeof obj[fieldName] === "string") return obj[fieldName] as string;
    if (obj.job && typeof obj.job === "string") return obj.job as string;
    if (obj.name && typeof obj.name === "string") return obj.name as string;
    if (obj.description && typeof obj.description === "string") return obj.description as string;
    // Return first string value found
    for (const val of Object.values(obj)) {
      if (typeof val === "string") return val;
    }
  }
  return String(item);
}

// Helper to safely render JSONB fields (can be string, array, or object)
function renderJsonField(value: unknown): string {
  if (!value) return "—";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    return value.map(item => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object") {
        // Try to extract meaningful text from object
        const obj = item as Record<string, unknown>;
        return obj.description || obj.name || obj.text || obj.emotion || JSON.stringify(item);
      }
      return String(item);
    }).join(", ");
  }
  if (typeof value === "object") {
    // For objects like emotional_map, extract key info
    const obj = value as Record<string, unknown>;
    if (obj.emotion) return `${obj.emotion}${obj.description ? `: ${obj.description}` : ""}`;
    if (obj.description) return String(obj.description);
    if (obj.name) return String(obj.name);
    // Last resort: stringify but make it readable
    return Object.entries(obj)
      .filter(([, v]) => typeof v === "string")
      .map(([k, v]) => `${k}: ${v}`)
      .join("; ") || "—";
  }
  return String(value);
}

function ListField({
  label,
  items,
  color,
  fieldName = "name",
}: {
  label: string;
  items?: unknown[];
  color: "blue" | "rose" | "amber" | "emerald" | "purple" | "slate";
  fieldName?: string;
}) {
  const dotColors = {
    blue: "bg-blue-500",
    rose: "bg-rose-500",
    amber: "bg-amber-500",
    emerald: "bg-emerald-500",
    purple: "bg-purple-500",
    slate: "bg-slate-500",
  };

  if (!items || items.length === 0) return null;

  return (
    <div>
      <p className="text-xs font-medium text-slate-500 mb-1.5">{label}</p>
      <ul className="space-y-1">
        {items.slice(0, 5).map((item, i) => (
          <li key={i} className="flex items-start gap-1.5 text-xs text-slate-600">
            <span className={cn("w-1 h-1 rounded-full mt-1.5 shrink-0", dotColors[color])} />
            <span className="line-clamp-2">{getItemText(item, fieldName)}</span>
          </li>
        ))}
        {items.length > 5 && (
          <li className="text-xs text-slate-400">+{items.length - 5} more</li>
        )}
      </ul>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-8 text-center text-slate-400">
      <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
      <p className="text-sm">{message}</p>
    </div>
  );
}
