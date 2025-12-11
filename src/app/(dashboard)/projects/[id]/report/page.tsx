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
  MessageCircle,
  Eye,
  Shield,
  Map,
  Swords,
  DollarSign,
  CheckCircle,
  Crosshair,
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
    needs?: Array<{ need: string; intensity: string }>;
    core_values?: Array<{ value: string; manifestation: string }>;
    objections?: Array<{ objection: string; root_cause: string; how_to_overcome: string }>;
    awareness_level?: string;
    triggers?: Array<{ trigger: string; context: string }>;
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
    deep_triggers?: string[];
    examples?: string[];
    is_top_pain: boolean;
    impact_score: number;
    ranking_reasoning?: string;
  }>;
  topPains?: Array<{
    id: string;
    name: string;
    description: string;
    deep_triggers?: string[];
    examples?: string[];
    is_top_pain: boolean;
    impact_score: number;
    ranking_reasoning?: string;
  }>;
  otherPains?: Array<{
    id: string;
    name: string;
    description: string;
    deep_triggers?: string[];
    examples?: string[];
    is_top_pain: boolean;
    impact_score: number;
    ranking_reasoning?: string;
  }>;
  canvas: Array<{
    id: string;
    pain_id: string;
    emotional_aspects?: unknown;
    behavioral_patterns?: unknown;
    buying_signals?: unknown;
  }>;
  canvasExtended?: Array<{
    id: string;
    pain_id: string;
    customer_journey?: unknown;
    emotional_map?: unknown;
    narrative_angles?: unknown;
    messaging_framework?: unknown;
    voice_and_tone?: unknown;
  }>;
  // V5 Modules - eslint-disable-next-line @typescript-eslint/no-explicit-any
  channelStrategy?: {
    id: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    primary_platforms?: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    content_preferences?: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    trusted_sources?: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    communities?: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    search_patterns?: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    advertising_response?: any;
  };
  competitiveIntelligence?: {
    id: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    alternatives_tried?: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    current_workarounds?: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vs_competitors?: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    switching_barriers?: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    evaluation_process?: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    category_beliefs?: any;
  };
  pricingPsychology?: {
    id: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    price_perception?: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    budget_context?: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    value_anchors?: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    willingness_to_pay_signals?: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payment_psychology?: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    roi_calculation?: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pricing_objections?: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    discount_sensitivity?: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    budget_triggers?: any;
  };
  trustFramework?: {
    id: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    proof_hierarchy?: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    baseline_trust?: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    trusted_authorities?: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    social_proof?: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    transparency_needs?: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    trust_killers?: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    credibility_markers?: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    risk_reduction?: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    trust_journey?: any;
  };
  jtbdContext?: {
    id: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    job_contexts?: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    job_priority_ranking?: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    job_dependencies?: any;
  };
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
    values_beliefs?: string[];
    lifestyle_habits?: string[];
    interests_hobbies?: string[];
    personality_traits?: string[];
  } | null;
  segments: SegmentWithData[];
}

type SectionId = "portrait" | "segments" | "pains" | "otherPains" | "canvas" | "canvasExtended" | "channelStrategy" | "competitiveIntelligence" | "pricingPsychology" | "trustFramework" | "jtbdContext";

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
    setExpandedSections(new Set(["portrait", "segments", "pains", "otherPains", "canvas", "canvasExtended", "channelStrategy", "competitiveIntelligence", "pricingPsychology", "trustFramework", "jtbdContext"]));
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
            <div className="space-y-6">
              {/* Demographics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <PortraitField label="Age Range" value={displayData.portrait.age_range} />
                <PortraitField label="Gender Distribution" value={displayData.portrait.gender_distribution} />
                <PortraitField label="Income Level" value={displayData.portrait.income_level} />
                <PortraitField label="Location" value={displayData.portrait.location} />
                <PortraitField label="Occupation" value={displayData.portrait.occupation} />
                <PortraitField label="Education" value={displayData.portrait.education} />
                <PortraitField label="Family Status" value={displayData.portrait.family_status} />
              </div>

              {/* Socio & Psychographics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                <PortraitField label="Sociodemographics" value={displayData.portrait.sociodemographics} />
                <PortraitField label="Psychographics" value={displayData.portrait.psychographics} />
              </div>

              {/* Lists: Values, Lifestyle, Interests, Personality */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
                <PortraitListField label="Values & Beliefs" items={displayData.portrait.values_beliefs} color="emerald" />
                <PortraitListField label="Lifestyle Habits" items={displayData.portrait.lifestyle_habits} color="blue" />
                <PortraitListField label="Interests & Hobbies" items={displayData.portrait.interests_hobbies} color="purple" />
                <PortraitListField label="Personality Traits" items={displayData.portrait.personality_traits} color="amber" />
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

        {/* TOP Pains Overview */}
        <CollapsibleSection
          id="pains"
          title="TOP Pain Points (Deep Analysis)"
          icon={Target}
          color="rose"
          isExpanded={expandedSections.has("pains")}
          onToggle={() => toggleSection("pains")}
        >
          {displayData.segments?.some((s) => (s.topPains?.length || 0) > 0 || s.pains?.some(p => p.is_top_pain)) ? (
            <div className="space-y-6">
              {displayData.segments.map((segment) => {
                // Use topPains if available, otherwise filter from pains for backward compatibility
                const topPains = segment.topPains?.length
                  ? segment.topPains
                  : segment.pains?.filter((p) => p.is_top_pain) || [];
                if (topPains.length === 0) return null;

                return (
                  <div key={segment.id}>
                    <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                      <Badge variant="secondary">{segment.order_index + 1}</Badge>
                      {segment.name}
                    </h4>
                    <div className="space-y-3">
                      {topPains.sort((a, b) => b.impact_score - a.impact_score).map((pain) => (
                        <div
                          key={pain.id}
                          className="p-4 bg-gradient-to-r from-rose-50 to-amber-50 border border-rose-100 rounded-lg"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-slate-900 flex items-center gap-2">
                              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                              {pain.name}
                            </span>
                            <Badge className="bg-rose-100 text-rose-700 border-rose-200">
                              Impact: {pain.impact_score}/10
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-700 mb-3">{pain.description}</p>

                          {/* Deep Triggers */}
                          {pain.deep_triggers && pain.deep_triggers.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-rose-100">
                              <p className="text-xs font-medium text-slate-500 uppercase mb-2">Deep Triggers</p>
                              <div className="flex flex-wrap gap-2">
                                {pain.deep_triggers.map((trigger, i) => (
                                  <Badge key={i} variant="outline" className="text-xs bg-white">
                                    {trigger}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Ranking Reasoning */}
                          {pain.ranking_reasoning && (
                            <div className="mt-3 pt-3 border-t border-rose-100">
                              <p className="text-xs font-medium text-slate-500 uppercase mb-1">Why This Pain Matters</p>
                              <p className="text-sm text-slate-600 italic">{pain.ranking_reasoning}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState message="No TOP pain points identified yet" />
          )}
        </CollapsibleSection>

        {/* Other Discovered Pains */}
        <CollapsibleSection
          id="otherPains"
          title="Other Discovered Pains"
          icon={Eye}
          color="slate"
          isExpanded={expandedSections.has("otherPains")}
          onToggle={() => toggleSection("otherPains" as SectionId)}
        >
          {displayData.segments?.some((s) => (s.otherPains?.length || 0) > 0 || s.pains?.some(p => !p.is_top_pain)) ? (
            <div className="space-y-6">
              <p className="text-sm text-slate-500 mb-4">
                These pain points were discovered during research but were not selected for deep analysis.
                They may still be valuable for understanding your audience.
              </p>
              {displayData.segments.map((segment) => {
                // Use otherPains if available, otherwise filter from pains
                const otherPains = segment.otherPains?.length
                  ? segment.otherPains
                  : segment.pains?.filter((p) => !p.is_top_pain) || [];
                if (otherPains.length === 0) return null;

                return (
                  <div key={segment.id}>
                    <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                      <Badge variant="secondary">{segment.order_index + 1}</Badge>
                      {segment.name}
                      <Badge variant="outline" className="text-xs">
                        {otherPains.length} pains
                      </Badge>
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {otherPains.map((pain) => (
                        <div
                          key={pain.id}
                          className="p-3 bg-slate-50 border border-slate-200 rounded-lg"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-slate-800 text-sm">
                              {pain.name}
                            </span>
                            <span className="text-xs text-slate-400">
                              {pain.impact_score}/10
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 line-clamp-2">{pain.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState message="No other pain points discovered" />
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

        {/* Canvas Extended V2 Section */}
        <CollapsibleSection
          id="canvasExtended"
          title="Extended Analysis (Messaging & Journey)"
          icon={MessageCircle}
          color="indigo"
          isExpanded={expandedSections.has("canvasExtended")}
          onToggle={() => toggleSection("canvasExtended")}
        >
          {displayData.segments?.some((s) => s.canvasExtended?.length) ? (
            <div className="space-y-8">
              {displayData.segments.map((segment) => {
                if (!segment.canvasExtended?.length) return null;

                return (
                  <div key={segment.id} className="space-y-4">
                    <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                      <Badge variant="secondary">{segment.order_index + 1}</Badge>
                      {segment.name}
                    </h4>
                    {segment.canvasExtended.map((ext) => {
                      const pain = segment.pains.find((p) => p.id === ext.pain_id);
                      return (
                        <Card key={ext.id} className="border-l-4 border-l-indigo-400">
                          <CardHeader className="py-3 bg-gradient-to-r from-indigo-50 to-purple-50 border-b">
                            <CardTitle className="text-sm flex items-center gap-2">
                              <Target className="w-4 h-4 text-indigo-600" />
                              {pain?.name || "Pain Analysis"}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-4 space-y-4">
                            {/* Customer Journey */}
                            {ext.customer_journey ? (
                              <CanvasExtendedSection
                                title="Customer Journey"
                                iconType="users"
                                data={ext.customer_journey}
                                color="blue"
                              />
                            ) : null}

                            {/* Emotional Map */}
                            {ext.emotional_map ? (
                              <CanvasExtendedSection
                                title="Emotional Map"
                                iconType="heart"
                                data={ext.emotional_map}
                                color="rose"
                              />
                            ) : null}

                            {/* Narrative Angles */}
                            {ext.narrative_angles ? (
                              <CanvasExtendedSection
                                title="Narrative Angles"
                                iconType="message"
                                data={ext.narrative_angles}
                                color="purple"
                              />
                            ) : null}

                            {/* Messaging Framework */}
                            {ext.messaging_framework ? (
                              <CanvasExtendedSection
                                title="Messaging Framework"
                                iconType="file"
                                data={ext.messaging_framework}
                                color="emerald"
                              />
                            ) : null}

                            {/* Voice & Tone */}
                            {ext.voice_and_tone ? (
                              <CanvasExtendedSection
                                title="Voice & Tone Guidelines"
                                iconType="palette"
                                data={ext.voice_and_tone}
                                color="amber"
                              />
                            ) : null}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState message="No extended analysis generated yet" />
          )}
        </CollapsibleSection>

        {/* V5: Channel Strategy */}
        <CollapsibleSection
          id="channelStrategy"
          title="Channel Strategy"
          icon={Map}
          color="cyan"
          isExpanded={expandedSections.has("channelStrategy")}
          onToggle={() => toggleSection("channelStrategy")}
        >
          {displayData.segments?.some((s) => s.channelStrategy) ? (
            <div className="space-y-6">
              {displayData.segments.map((segment) => {
                if (!segment.channelStrategy) return null;
                const cs = segment.channelStrategy;
                return (
                  <div key={segment.id} className="space-y-4">
                    <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                      <Badge variant="secondary">{segment.order_index + 1}</Badge>
                      {segment.name}
                    </h4>
                    <div className="grid gap-4">
                      {/* Primary Platforms */}
                      {cs.primary_platforms && (
                        <V5Section title="Primary Platforms" icon={<Map className="w-4 h-4" />} color="cyan">
                          {renderV5Array(cs.primary_platforms as unknown[], ["platform", "usage_frequency", "activity_type", "why_they_use_it"])}
                        </V5Section>
                      )}
                      {/* Content Preferences */}
                      {cs.content_preferences && (
                        <V5Section title="Content Preferences" icon={<FileText className="w-4 h-4" />} color="cyan">
                          {renderV5Array(cs.content_preferences as unknown[], ["format", "context", "attention_span", "triggering_topics"])}
                        </V5Section>
                      )}
                      {/* Trusted Sources */}
                      {cs.trusted_sources && (
                        <V5Section title="Trusted Sources" icon={<Users className="w-4 h-4" />} color="cyan">
                          {renderV5Array(cs.trusted_sources as unknown[], ["source_type", "specific_examples", "why_trusted"])}
                        </V5Section>
                      )}
                      {/* Communities */}
                      {cs.communities && (
                        <V5Section title="Communities" icon={<Users className="w-4 h-4" />} color="cyan">
                          {renderV5Array(cs.communities as unknown[], ["type", "specific_names", "participation_level", "influence_on_purchases"])}
                        </V5Section>
                      )}
                      {/* Search Patterns */}
                      {cs.search_patterns && (
                        <V5Section title="Search Patterns" icon={<Target className="w-4 h-4" />} color="cyan">
                          {renderV5Object(cs.search_patterns as Record<string, unknown>)}
                        </V5Section>
                      )}
                      {/* Advertising Response */}
                      {cs.advertising_response && (
                        <V5Section title="Advertising Response" icon={<Eye className="w-4 h-4" />} color="cyan">
                          {renderV5Object(cs.advertising_response as Record<string, unknown>)}
                        </V5Section>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState message="No channel strategy data generated yet" />
          )}
        </CollapsibleSection>

        {/* V5: Competitive Intelligence */}
        <CollapsibleSection
          id="competitiveIntelligence"
          title="Competitive Intelligence"
          icon={Swords}
          color="orange"
          isExpanded={expandedSections.has("competitiveIntelligence")}
          onToggle={() => toggleSection("competitiveIntelligence")}
        >
          {displayData.segments?.some((s) => s.competitiveIntelligence) ? (
            <div className="space-y-6">
              {displayData.segments.map((segment) => {
                if (!segment.competitiveIntelligence) return null;
                const ci = segment.competitiveIntelligence;
                return (
                  <div key={segment.id} className="space-y-4">
                    <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                      <Badge variant="secondary">{segment.order_index + 1}</Badge>
                      {segment.name}
                    </h4>
                    <div className="grid gap-4">
                      {/* Alternatives Tried */}
                      {ci.alternatives_tried && (
                        <V5Section title="Alternatives Tried" icon={<AlertTriangle className="w-4 h-4" />} color="orange">
                          {renderV5Array(ci.alternatives_tried as unknown[], ["solution_type", "specific_examples", "why_it_failed", "emotional_residue"])}
                        </V5Section>
                      )}
                      {/* Current Workarounds */}
                      {ci.current_workarounds && (
                        <V5Section title="Current Workarounds" icon={<Zap className="w-4 h-4" />} color="orange">
                          {renderV5Array(ci.current_workarounds as unknown[], ["workaround", "effectiveness", "why_they_stick_with_it"])}
                        </V5Section>
                      )}
                      {/* vs Competitors */}
                      {ci.vs_competitors && (
                        <V5Section title="vs Competitors" icon={<Swords className="w-4 h-4" />} color="orange">
                          {renderV5Array(ci.vs_competitors as unknown[], ["competitor_name", "segment_perception", "strengths", "weaknesses"])}
                        </V5Section>
                      )}
                      {/* Switching Barriers */}
                      {ci.switching_barriers && (
                        <V5Section title="Switching Barriers" icon={<Shield className="w-4 h-4" />} color="orange">
                          {renderV5Array(ci.switching_barriers as unknown[], ["barrier_type", "description", "severity", "how_to_overcome"])}
                        </V5Section>
                      )}
                      {/* Evaluation Process */}
                      {ci.evaluation_process && (
                        <V5Section title="Evaluation Process" icon={<Target className="w-4 h-4" />} color="orange">
                          {renderV5Object(ci.evaluation_process as Record<string, unknown>)}
                        </V5Section>
                      )}
                      {/* Category Beliefs */}
                      {ci.category_beliefs && (
                        <V5Section title="Category Beliefs" icon={<MessageCircle className="w-4 h-4" />} color="orange">
                          {renderV5Object(ci.category_beliefs as Record<string, unknown>)}
                        </V5Section>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState message="No competitive intelligence data generated yet" />
          )}
        </CollapsibleSection>

        {/* V5: Pricing Psychology */}
        <CollapsibleSection
          id="pricingPsychology"
          title="Pricing Psychology"
          icon={DollarSign}
          color="green"
          isExpanded={expandedSections.has("pricingPsychology")}
          onToggle={() => toggleSection("pricingPsychology")}
        >
          {displayData.segments?.some((s) => s.pricingPsychology) ? (
            <div className="space-y-6">
              {displayData.segments.map((segment) => {
                if (!segment.pricingPsychology) return null;
                const pp = segment.pricingPsychology;
                return (
                  <div key={segment.id} className="space-y-4">
                    <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                      <Badge variant="secondary">{segment.order_index + 1}</Badge>
                      {segment.name}
                    </h4>
                    <div className="grid gap-4">
                      {/* Price Perception */}
                      {pp.price_perception && (
                        <V5Section title="Price Perception" icon={<DollarSign className="w-4 h-4" />} color="green">
                          {renderV5Object(pp.price_perception as Record<string, unknown>)}
                        </V5Section>
                      )}
                      {/* Budget Context */}
                      {pp.budget_context && (
                        <V5Section title="Budget Context" icon={<Briefcase className="w-4 h-4" />} color="green">
                          {renderV5Object(pp.budget_context as Record<string, unknown>)}
                        </V5Section>
                      )}
                      {/* Value Anchors */}
                      {pp.value_anchors && (
                        <V5Section title="Value Anchors" icon={<Target className="w-4 h-4" />} color="green">
                          {renderV5Array(pp.value_anchors as unknown[], ["anchor_type", "comparison", "resonance_level"])}
                        </V5Section>
                      )}
                      {/* Willingness to Pay Signals */}
                      {pp.willingness_to_pay_signals && (
                        <V5Section title="Willingness to Pay Signals" icon={<Zap className="w-4 h-4" />} color="green">
                          {renderV5Array(pp.willingness_to_pay_signals as unknown[], ["signal", "indicates", "pricing_implication"])}
                        </V5Section>
                      )}
                      {/* Payment Psychology */}
                      {pp.payment_psychology && (
                        <V5Section title="Payment Psychology" icon={<Heart className="w-4 h-4" />} color="green">
                          {renderV5Object(pp.payment_psychology as Record<string, unknown>)}
                        </V5Section>
                      )}
                      {/* Pricing Objections */}
                      {pp.pricing_objections && (
                        <V5Section title="Pricing Objections" icon={<AlertTriangle className="w-4 h-4" />} color="green">
                          {renderV5Array(pp.pricing_objections as unknown[], ["objection", "underlying_concern", "reframe"])}
                        </V5Section>
                      )}
                      {/* Budget Triggers */}
                      {pp.budget_triggers && (
                        <V5Section title="Budget Triggers" icon={<Zap className="w-4 h-4" />} color="green">
                          {renderV5Array(pp.budget_triggers as unknown[], ["trigger", "timing", "opportunity"])}
                        </V5Section>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState message="No pricing psychology data generated yet" />
          )}
        </CollapsibleSection>

        {/* V5: Trust Framework */}
        <CollapsibleSection
          id="trustFramework"
          title="Trust Framework"
          icon={Shield}
          color="teal"
          isExpanded={expandedSections.has("trustFramework")}
          onToggle={() => toggleSection("trustFramework")}
        >
          {displayData.segments?.some((s) => s.trustFramework) ? (
            <div className="space-y-6">
              {displayData.segments.map((segment) => {
                if (!segment.trustFramework) return null;
                const tf = segment.trustFramework;
                return (
                  <div key={segment.id} className="space-y-4">
                    <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                      <Badge variant="secondary">{segment.order_index + 1}</Badge>
                      {segment.name}
                    </h4>
                    <div className="grid gap-4">
                      {/* Baseline Trust */}
                      {tf.baseline_trust && (
                        <V5Section title="Baseline Trust" icon={<Heart className="w-4 h-4" />} color="teal">
                          {renderV5Object(tf.baseline_trust as Record<string, unknown>)}
                        </V5Section>
                      )}
                      {/* Proof Hierarchy */}
                      {tf.proof_hierarchy && (
                        <V5Section title="Proof Hierarchy" icon={<CheckCircle className="w-4 h-4" />} color="teal">
                          {renderV5Array(tf.proof_hierarchy as unknown[], ["proof_type", "effectiveness", "why_it_works", "how_to_present"])}
                        </V5Section>
                      )}
                      {/* Trusted Authorities */}
                      {tf.trusted_authorities && (
                        <V5Section title="Trusted Authorities" icon={<Users className="w-4 h-4" />} color="teal">
                          {renderV5Array(tf.trusted_authorities as unknown[], ["authority_type", "specific_names", "why_trusted", "how_to_leverage"])}
                        </V5Section>
                      )}
                      {/* Social Proof */}
                      {tf.social_proof && (
                        <V5Section title="Social Proof" icon={<Users className="w-4 h-4" />} color="teal">
                          {renderV5Object(tf.social_proof as Record<string, unknown>)}
                        </V5Section>
                      )}
                      {/* Trust Killers */}
                      {tf.trust_killers && (
                        <V5Section title="Trust Killers" icon={<AlertTriangle className="w-4 h-4" />} color="teal">
                          {renderV5Array(tf.trust_killers as unknown[], ["red_flag", "why_triggers_skepticism", "how_to_avoid"])}
                        </V5Section>
                      )}
                      {/* Credibility Markers */}
                      {tf.credibility_markers && (
                        <V5Section title="Credibility Markers" icon={<Star className="w-4 h-4" />} color="teal">
                          {renderV5Array(tf.credibility_markers as unknown[], ["signal", "importance", "current_status"])}
                        </V5Section>
                      )}
                      {/* Risk Reduction */}
                      {tf.risk_reduction && (
                        <V5Section title="Risk Reduction" icon={<Shield className="w-4 h-4" />} color="teal">
                          {renderV5Object(tf.risk_reduction as Record<string, unknown>)}
                        </V5Section>
                      )}
                      {/* Trust Journey */}
                      {tf.trust_journey && (
                        <V5Section title="Trust Journey" icon={<Map className="w-4 h-4" />} color="teal">
                          {renderV5Object(tf.trust_journey as Record<string, unknown>)}
                        </V5Section>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState message="No trust framework data generated yet" />
          )}
        </CollapsibleSection>

        {/* V5: JTBD Context */}
        <CollapsibleSection
          id="jtbdContext"
          title="Jobs To Be Done Context"
          icon={Crosshair}
          color="violet"
          isExpanded={expandedSections.has("jtbdContext")}
          onToggle={() => toggleSection("jtbdContext")}
        >
          {displayData.segments?.some((s) => s.jtbdContext) ? (
            <div className="space-y-6">
              {displayData.segments.map((segment) => {
                if (!segment.jtbdContext) return null;
                const jc = segment.jtbdContext;
                return (
                  <div key={segment.id} className="space-y-4">
                    <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                      <Badge variant="secondary">{segment.order_index + 1}</Badge>
                      {segment.name}
                    </h4>
                    <div className="grid gap-4">
                      {/* Job Contexts */}
                      {jc.job_contexts && Array.isArray(jc.job_contexts) && (
                        <div className="space-y-4">
                          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                          {(jc.job_contexts as Array<Record<string, any>>).map((job, idx) => (
                            <V5Section key={idx} title={String(job.job_name || `Job ${idx + 1}`)} icon={<Crosshair className="w-4 h-4" />} color="violet">
                              <div className="space-y-3">
                                {/* Hire Triggers */}
                                {job.hire_triggers && (
                                  <div>
                                    <p className="text-xs font-semibold text-violet-600 uppercase mb-2">Hire Triggers</p>
                                    {renderV5Array(job.hire_triggers as unknown[], ["situation", "frequency", "urgency", "emotional_state"])}
                                  </div>
                                )}
                                {/* Competing Solutions */}
                                {job.competing_solutions && (
                                  <div>
                                    <p className="text-xs font-semibold text-violet-600 uppercase mb-2">Competing Solutions</p>
                                    {renderV5Array(job.competing_solutions as unknown[], ["alternative", "why_chosen", "your_advantage"])}
                                  </div>
                                )}
                                {/* Success Metrics */}
                                {job.success_metrics && (
                                  <div>
                                    <p className="text-xs font-semibold text-violet-600 uppercase mb-2">Success Metrics</p>
                                    {renderV5Object(job.success_metrics as Record<string, unknown>)}
                                  </div>
                                )}
                                {/* Obstacles */}
                                {job.obstacles && (
                                  <div>
                                    <p className="text-xs font-semibold text-violet-600 uppercase mb-2">Obstacles</p>
                                    {renderV5Array(job.obstacles as unknown[], ["obstacle", "blocks_progress", "how_you_remove_it"])}
                                  </div>
                                )}
                                {/* Hiring Anxieties */}
                                {job.hiring_anxieties && (
                                  <div>
                                    <p className="text-xs font-semibold text-violet-600 uppercase mb-2">Hiring Anxieties</p>
                                    {renderV5Array(job.hiring_anxieties as unknown[], ["anxiety", "rooted_in", "how_to_address"])}
                                  </div>
                                )}
                              </div>
                            </V5Section>
                          ))}
                        </div>
                      )}
                      {/* Job Priority Ranking */}
                      {jc.job_priority_ranking && (
                        <V5Section title="Job Priority Ranking" icon={<Star className="w-4 h-4" />} color="violet">
                          {renderV5Array(jc.job_priority_ranking as unknown[], ["job_name", "priority", "reasoning"])}
                        </V5Section>
                      )}
                      {/* Job Dependencies */}
                      {jc.job_dependencies && (
                        <V5Section title="Job Dependencies" icon={<Target className="w-4 h-4" />} color="violet">
                          {renderV5Array(jc.job_dependencies as unknown[], ["primary_job", "enables_job", "relationship"])}
                        </V5Section>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState message="No JTBD context data generated yet" />
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
  color: "blue" | "emerald" | "rose" | "purple" | "indigo" | "slate" | "cyan" | "orange" | "green" | "teal" | "violet";
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
    indigo: "border-l-indigo-500 text-indigo-600",
    slate: "border-l-slate-400 text-slate-600",
    cyan: "border-l-cyan-500 text-cyan-600",
    orange: "border-l-orange-500 text-orange-600",
    green: "border-l-green-500 text-green-600",
    teal: "border-l-teal-500 text-teal-600",
    violet: "border-l-violet-500 text-violet-600",
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

// Portrait List Field for arrays (values, lifestyle, etc.)
function PortraitListField({
  label,
  items,
  color,
}: {
  label: string;
  items?: string[];
  color: "emerald" | "blue" | "purple" | "amber";
}) {
  const dotColors = {
    emerald: "bg-emerald-500",
    blue: "bg-blue-500",
    purple: "bg-purple-500",
    amber: "bg-amber-500",
  };

  if (!items || items.length === 0) return null;

  return (
    <div>
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">{label}</p>
      <ul className="space-y-1">
        {items.slice(0, 6).map((item, i) => (
          <li key={i} className="flex items-start gap-1.5 text-sm text-slate-700">
            <span className={cn("w-1.5 h-1.5 rounded-full mt-1.5 shrink-0", dotColors[color])} />
            <span>{item}</span>
          </li>
        ))}
        {items.length > 6 && (
          <li className="text-xs text-slate-400 ml-3">+{items.length - 6} more</li>
        )}
      </ul>
    </div>
  );
}

// Canvas Extended Section - renders structured JSONB data for V2 format
function CanvasExtendedSection({
  title,
  iconType,
  data,
  color,
}: {
  title: string;
  iconType: "users" | "heart" | "message" | "file" | "palette";
  data: unknown;
  color: "blue" | "rose" | "purple" | "emerald" | "amber";
}) {
  const bgColors = {
    blue: "bg-blue-50 border-blue-200",
    rose: "bg-rose-50 border-rose-200",
    purple: "bg-purple-50 border-purple-200",
    emerald: "bg-emerald-50 border-emerald-200",
    amber: "bg-amber-50 border-amber-200",
  };

  const textColors = {
    blue: "text-blue-700",
    rose: "text-rose-700",
    purple: "text-purple-700",
    emerald: "text-emerald-700",
    amber: "text-amber-700",
  };

  const icons = {
    users: <Users className="w-4 h-4" />,
    heart: <Heart className="w-4 h-4" />,
    message: <MessageCircle className="w-4 h-4" />,
    file: <FileText className="w-4 h-4" />,
    palette: <Palette className="w-4 h-4" />,
  };

  // Specialized renderers for Canvas Extended V2 sections
  const renderCustomerJourney = (journey: Record<string, unknown>) => {
    const stages = [
      { key: "unaware_stage", label: "Unaware Stage", icon: "🔍" },
      { key: "problem_aware", label: "Problem Aware", icon: "💡" },
      { key: "solution_seeking", label: "Solution Seeking", icon: "🔎" },
      { key: "evaluation", label: "Evaluation", icon: "⚖️" },
      { key: "decision_trigger", label: "Decision Trigger", icon: "⚡" },
      { key: "post_purchase", label: "Post-Purchase", icon: "✅" },
    ];

    return (
      <div className="space-y-4">
        {stages.map(({ key, label, icon }) => {
          const stage = journey[key] as Record<string, unknown> | undefined;
          if (!stage) return null;
          return (
            <div key={key} className="p-3 bg-white/60 rounded-lg border border-blue-100">
              <h5 className="font-semibold text-sm text-blue-800 mb-2 flex items-center gap-2">
                <span>{icon}</span> {label}
              </h5>
              <div className="space-y-2 text-sm">
                {stage.life_context ? <p className="text-slate-700"><span className="font-medium">Context:</span> {String(stage.life_context)}</p> : null}
                {stage.trigger_moment ? <p className="text-slate-700"><span className="font-medium">Trigger:</span> {String(stage.trigger_moment)}</p> : null}
                {stage.internal_dialogue ? <p className="text-slate-600 italic">&quot;{String(stage.internal_dialogue)}&quot;</p> : null}
                {stage.emotional_state ? <p className="text-slate-700"><span className="font-medium">Emotional State:</span> {String(stage.emotional_state)}</p> : null}
                {stage.what_they_need_to_hear ? <p className="text-emerald-700"><span className="font-medium">Need to Hear:</span> {String(stage.what_they_need_to_hear)}</p> : null}
                {Array.isArray(stage.actions) && stage.actions.length > 0 ? (
                  <div><span className="font-medium">Actions:</span> {(stage.actions as string[]).join(", ")}</div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderEmotionalMap = (map: Record<string, unknown>) => {
    return (
      <div className="space-y-4">
        {/* Peaks */}
        {Array.isArray(map.peaks) && map.peaks.length > 0 && (
          <div>
            <h5 className="font-semibold text-sm text-emerald-700 mb-2 flex items-center gap-2">
              <span>📈</span> Emotional Peaks
            </h5>
            <div className="space-y-2">
              {(map.peaks as Array<Record<string, unknown>>).map((peak, i) => (
                <div key={i} className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                  <p className="font-medium text-emerald-800">{String(peak.moment)}</p>
                  {peak.trigger ? <p className="text-sm text-slate-600">Trigger: {String(peak.trigger)}</p> : null}
                  {peak.internal_dialogue ? <p className="text-sm text-slate-600 italic">&quot;{String(peak.internal_dialogue)}&quot;</p> : null}
                  {peak.intensity ? <Badge className="bg-emerald-100 text-emerald-700 text-xs mt-1">Intensity: {String(peak.intensity)}/10</Badge> : null}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Valleys */}
        {Array.isArray(map.valleys) && map.valleys.length > 0 && (
          <div>
            <h5 className="font-semibold text-sm text-rose-700 mb-2 flex items-center gap-2">
              <span>📉</span> Emotional Valleys
            </h5>
            <div className="space-y-2">
              {(map.valleys as Array<Record<string, unknown>>).map((valley, i) => (
                <div key={i} className="p-3 bg-rose-50 rounded-lg border border-rose-100">
                  <p className="font-medium text-rose-800">{String(valley.moment)}</p>
                  {valley.trigger ? <p className="text-sm text-slate-600">Trigger: {String(valley.trigger)}</p> : null}
                  {valley.internal_dialogue ? <p className="text-sm text-slate-600 italic">&quot;{String(valley.internal_dialogue)}&quot;</p> : null}
                  {valley.intensity ? <Badge className="bg-rose-100 text-rose-700 text-xs mt-1">Intensity: {String(valley.intensity)}/10</Badge> : null}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Turning Points */}
        {Array.isArray(map.turning_points) && map.turning_points.length > 0 && (
          <div>
            <h5 className="font-semibold text-sm text-amber-700 mb-2 flex items-center gap-2">
              <span>🔄</span> Turning Points
            </h5>
            <div className="space-y-2">
              {(map.turning_points as Array<Record<string, unknown>>).map((tp, i) => (
                <div key={i} className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                  <p className="text-sm"><span className="text-rose-600">{String(tp.from_state)}</span> → <span className="text-emerald-600">{String(tp.to_state)}</span></p>
                  {tp.catalyst ? <p className="text-sm text-slate-600"><span className="font-medium">Catalyst:</span> {String(tp.catalyst)}</p> : null}
                  {tp.internal_shift ? <p className="text-sm text-slate-600 italic">&quot;{String(tp.internal_shift)}&quot;</p> : null}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderNarrativeAngles = (angles: Array<Record<string, unknown>>) => {
    return (
      <div className="space-y-4">
        {angles.map((angle, i) => (
          <div key={i} className="p-4 bg-white/60 rounded-lg border border-purple-100">
            <h5 className="font-bold text-purple-800 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-sm">{i + 1}</span>
              {String(angle.angle_name)}
            </h5>
            <div className="space-y-3 text-sm">
              {angle.who_this_is ? (
                <div>
                  <p className="font-medium text-slate-500 uppercase text-xs mb-1">Who This Is</p>
                  <p className="text-slate-700">{String(angle.who_this_is)}</p>
                </div>
              ) : null}
              {angle.their_story ? (
                <div>
                  <p className="font-medium text-slate-500 uppercase text-xs mb-1">Their Story</p>
                  <p className="text-slate-600 italic">&quot;{String(angle.their_story)}&quot;</p>
                </div>
              ) : null}
              {angle.core_belief ? (
                <div className="p-2 bg-rose-50 rounded border border-rose-100">
                  <p className="font-medium text-rose-700 text-xs mb-1">Core Limiting Belief</p>
                  <p className="text-slate-700">&quot;{String(angle.core_belief)}&quot;</p>
                </div>
              ) : null}
              {angle.key_message ? (
                <div className="p-2 bg-emerald-50 rounded border border-emerald-100">
                  <p className="font-medium text-emerald-700 text-xs mb-1">Key Message</p>
                  <p className="text-slate-800 font-medium">{String(angle.key_message)}</p>
                </div>
              ) : null}
              {angle.proof_they_need ? (
                <div>
                  <p className="font-medium text-slate-500 uppercase text-xs mb-1">Proof They Need</p>
                  <p className="text-slate-700">{String(angle.proof_they_need)}</p>
                </div>
              ) : null}
              {angle.objection_to_address ? (
                <div>
                  <p className="font-medium text-slate-500 uppercase text-xs mb-1">Objection to Address</p>
                  <p className="text-slate-700">{String(angle.objection_to_address)}</p>
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderMessagingFramework = (framework: Record<string, unknown>) => {
    return (
      <div className="space-y-4">
        {/* Headlines */}
        {Array.isArray(framework.headlines) && framework.headlines.length > 0 ? (
          <div>
            <h5 className="font-semibold text-sm text-emerald-700 mb-2 flex items-center gap-2">
              <span>📰</span> Headlines
            </h5>
            <ul className="space-y-2">
              {(framework.headlines as string[]).map((headline, i) => (
                <li key={i} className="p-2 bg-white/60 rounded border border-emerald-100 text-sm font-medium text-slate-800">
                  {String(headline)}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {/* Opening Hooks */}
        {Array.isArray(framework.opening_hooks) && framework.opening_hooks.length > 0 ? (
          <div>
            <h5 className="font-semibold text-sm text-blue-700 mb-2 flex items-center gap-2">
              <span>🎣</span> Opening Hooks
            </h5>
            <ul className="space-y-2">
              {(framework.opening_hooks as string[]).map((hook, i) => (
                <li key={i} className="p-3 bg-blue-50/50 rounded border border-blue-100 text-sm text-slate-700 italic">
                  &quot;{String(hook)}&quot;
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {/* Bridge Statements */}
        {Array.isArray(framework.bridge_statements) && framework.bridge_statements.length > 0 ? (
          <div>
            <h5 className="font-semibold text-sm text-purple-700 mb-2 flex items-center gap-2">
              <span>🌉</span> Bridge Statements
            </h5>
            <ul className="space-y-2">
              {(framework.bridge_statements as string[]).map((bridge, i) => (
                <li key={i} className="p-2 bg-purple-50/50 rounded border border-purple-100 text-sm text-slate-700">
                  {String(bridge)}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {/* Proof Framing */}
        {framework.proof_framing && typeof framework.proof_framing === "object" ? (
          <div>
            <h5 className="font-semibold text-sm text-amber-700 mb-2 flex items-center gap-2">
              <span>📊</span> Proof Framing
            </h5>
            <div className="p-3 bg-amber-50/50 rounded border border-amber-100 text-sm space-y-1">
              {Object.entries(framework.proof_framing as Record<string, unknown>).map(([k, v]) => (
                <p key={k}><span className="font-medium capitalize">{k.replace(/_/g, " ")}:</span> {String(v)}</p>
              ))}
            </div>
          </div>
        ) : null}

        {/* Objection Handlers */}
        {Array.isArray(framework.objection_handlers) && framework.objection_handlers.length > 0 ? (
          <div>
            <h5 className="font-semibold text-sm text-rose-700 mb-2 flex items-center gap-2">
              <span>🛡️</span> Objection Handlers
            </h5>
            <div className="space-y-2">
              {(framework.objection_handlers as Array<Record<string, unknown>>).map((oh, i) => (
                <div key={i} className="p-3 bg-white/60 rounded border border-rose-100">
                  <p className="text-sm text-rose-700 font-medium mb-1">&quot;{String(oh.objection)}&quot;</p>
                  <p className="text-sm text-slate-700">→ {String(oh.handler)}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* CTA Options */}
        {Array.isArray(framework.cta_options) && framework.cta_options.length > 0 ? (
          <div>
            <h5 className="font-semibold text-sm text-indigo-700 mb-2 flex items-center gap-2">
              <span>🎯</span> Call to Action Options
            </h5>
            <div className="flex flex-wrap gap-2">
              {(framework.cta_options as string[]).map((cta, i) => (
                <Badge key={i} className="bg-indigo-100 text-indigo-700 border-indigo-200">
                  {String(cta)}
                </Badge>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    );
  };

  const renderVoiceAndTone = (vt: Record<string, unknown>) => {
    return (
      <div className="grid grid-cols-2 gap-4">
        {/* Do */}
        {Array.isArray(vt.do) && vt.do.length > 0 ? (
          <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-100">
            <h5 className="font-semibold text-sm text-emerald-700 mb-2 flex items-center gap-2">
              <span>✅</span> Do
            </h5>
            <ul className="space-y-1">
              {(vt.do as string[]).map((item, i) => (
                <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                  <span className="text-emerald-500 mt-0.5">•</span>
                  {String(item)}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {/* Don't */}
        {Array.isArray(vt.dont) && vt.dont.length > 0 ? (
          <div className="p-3 bg-rose-50/50 rounded-lg border border-rose-100">
            <h5 className="font-semibold text-sm text-rose-700 mb-2 flex items-center gap-2">
              <span>❌</span> Don&apos;t
            </h5>
            <ul className="space-y-1">
              {(vt.dont as string[]).map((item, i) => (
                <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                  <span className="text-rose-500 mt-0.5">•</span>
                  {String(item)}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {/* Words That Resonate */}
        {Array.isArray(vt.words_that_resonate) && vt.words_that_resonate.length > 0 ? (
          <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100">
            <h5 className="font-semibold text-sm text-blue-700 mb-2 flex items-center gap-2">
              <span>💬</span> Words That Resonate
            </h5>
            <div className="flex flex-wrap gap-1.5">
              {(vt.words_that_resonate as string[]).map((word, i) => (
                <Badge key={i} variant="outline" className="text-xs bg-white text-blue-700 border-blue-200">
                  {String(word)}
                </Badge>
              ))}
            </div>
          </div>
        ) : null}

        {/* Words to Avoid */}
        {Array.isArray(vt.words_to_avoid) && vt.words_to_avoid.length > 0 ? (
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <h5 className="font-semibold text-sm text-slate-700 mb-2 flex items-center gap-2">
              <span>🚫</span> Words to Avoid
            </h5>
            <div className="flex flex-wrap gap-1.5">
              {(vt.words_to_avoid as string[]).map((word, i) => (
                <Badge key={i} variant="outline" className="text-xs bg-white text-slate-500 border-slate-300 line-through">
                  {String(word)}
                </Badge>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    );
  };

  // Generic renderer for unknown structures
  const renderGenericData = (value: unknown, depth: number = 0): React.ReactNode => {
    if (!value) return <span className="text-slate-400">—</span>;

    if (typeof value === "string") {
      return <p className="text-sm text-slate-700">{value}</p>;
    }

    if (Array.isArray(value)) {
      return (
        <ul className="space-y-2">
          {value.slice(0, 5).map((item, i) => (
            <li key={i} className="text-sm">
              {typeof item === "string" ? (
                <span className="text-slate-700">{item}</span>
              ) : typeof item === "object" && item !== null ? (
                <div className="p-2 bg-white/50 rounded-lg border border-slate-100">
                  {Object.entries(item as Record<string, unknown>).map(([k, v]) => (
                    <div key={k} className="mb-1 last:mb-0">
                      <span className="text-xs font-medium text-slate-500 uppercase">{k.replace(/_/g, " ")}: </span>
                      <span className="text-sm text-slate-700">{typeof v === "string" ? v : JSON.stringify(v)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-slate-700">{String(item)}</span>
              )}
            </li>
          ))}
          {value.length > 5 && (
            <li className="text-xs text-slate-400">+{value.length - 5} more items</li>
          )}
        </ul>
      );
    }

    if (typeof value === "object" && value !== null) {
      const obj = value as Record<string, unknown>;
      return (
        <div className={cn("space-y-2", depth > 0 && "pl-3 border-l-2 border-slate-200")}>
          {Object.entries(obj).map(([key, val]) => (
            <div key={key}>
              <p className="text-xs font-medium text-slate-500 uppercase mb-1">{key.replace(/_/g, " ")}</p>
              {renderGenericData(val, depth + 1)}
            </div>
          ))}
        </div>
      );
    }

    return <span className="text-slate-700">{String(value)}</span>;
  };

  // Choose the right renderer based on title/iconType
  const renderContent = () => {
    if (!data || typeof data !== "object") {
      return renderGenericData(data);
    }

    const dataObj = data as Record<string, unknown>;

    // Customer Journey detection
    if (title.toLowerCase().includes("journey") || iconType === "users") {
      if (dataObj.unaware_stage || dataObj.problem_aware || dataObj.solution_seeking) {
        return renderCustomerJourney(dataObj);
      }
    }

    // Emotional Map detection
    if (title.toLowerCase().includes("emotional") || iconType === "heart") {
      if (dataObj.peaks || dataObj.valleys || dataObj.turning_points) {
        return renderEmotionalMap(dataObj);
      }
    }

    // Narrative Angles detection
    if (title.toLowerCase().includes("narrative") || iconType === "message") {
      if (Array.isArray(data) && data.length > 0 && (data[0] as Record<string, unknown>).angle_name) {
        return renderNarrativeAngles(data as Array<Record<string, unknown>>);
      }
    }

    // Messaging Framework detection
    if (title.toLowerCase().includes("messaging") || iconType === "file") {
      if (dataObj.headlines || dataObj.opening_hooks || dataObj.cta_options) {
        return renderMessagingFramework(dataObj);
      }
    }

    // Voice & Tone detection
    if (title.toLowerCase().includes("voice") || iconType === "palette") {
      if (dataObj.do || dataObj.dont || dataObj.words_that_resonate) {
        return renderVoiceAndTone(dataObj);
      }
    }

    // Fallback to generic renderer
    return renderGenericData(data);
  };

  return (
    <div className={cn("p-4 rounded-lg border", bgColors[color])}>
      <div className={cn("flex items-center gap-2 mb-3", textColors[color])}>
        {icons[iconType]}
        <h4 className="font-semibold text-sm">{title}</h4>
      </div>
      <div className="text-sm">
        {renderContent()}
      </div>
    </div>
  );
}

// V5 Section Component - for displaying V5 module data
function V5Section({
  title,
  icon,
  color,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  color: "cyan" | "orange" | "green" | "teal" | "violet";
  children: React.ReactNode;
}) {
  const bgColors = {
    cyan: "bg-cyan-50/70 border-cyan-200",
    orange: "bg-orange-50/70 border-orange-200",
    green: "bg-green-50/70 border-green-200",
    teal: "bg-teal-50/70 border-teal-200",
    violet: "bg-violet-50/70 border-violet-200",
  };

  const textColors = {
    cyan: "text-cyan-700",
    orange: "text-orange-700",
    green: "text-green-700",
    teal: "text-teal-700",
    violet: "text-violet-700",
  };

  return (
    <div className={cn("p-4 rounded-xl border", bgColors[color])}>
      <div className={cn("flex items-center gap-2 mb-3 font-semibold text-sm", textColors[color])}>
        {icon}
        {title}
      </div>
      <div className="text-sm text-slate-700">
        {children}
      </div>
    </div>
  );
}

// Helper to render V5 array data
function renderV5Array(items: unknown[] | undefined | null, fields: string[]): React.ReactElement {
  if (!items || !Array.isArray(items) || items.length === 0) {
    return <span className="text-slate-400">No data</span>;
  }

  return (
    <div className="space-y-3">
      {items.map((item, idx) => {
        if (typeof item !== "object" || item === null) {
          return <div key={idx} className="text-sm">{String(item)}</div>;
        }
        const obj = item as Record<string, unknown>;
        return (
          <div key={idx} className="p-3 bg-white/60 rounded-lg border border-slate-100">
            {fields.map((field) => {
              const value = obj[field];
              if (value === undefined || value === null) return null;
              return (
                <div key={field} className="mb-1.5 last:mb-0">
                  <span className="text-xs font-medium text-slate-500 uppercase">
                    {field.replace(/_/g, " ")}:
                  </span>{" "}
                  <span className="text-slate-700">
                    {Array.isArray(value)
                      ? value.join(", ")
                      : typeof value === "object"
                      ? JSON.stringify(value)
                      : String(value)}
                  </span>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

// Helper to render V5 object data
function renderV5Object(obj: Record<string, unknown> | undefined | null): React.ReactElement {
  if (!obj || typeof obj !== "object") {
    return <span className="text-slate-400">No data</span>;
  }

  return (
    <div className="space-y-2">
      {Object.entries(obj).map(([key, value]) => {
        if (value === undefined || value === null) return null;
        return (
          <div key={key} className="flex flex-col">
            <span className="text-xs font-medium text-slate-500 uppercase mb-0.5">
              {key.replace(/_/g, " ")}
            </span>
            <span className="text-slate-700">
              {Array.isArray(value)
                ? value.map((v, i) => (
                    typeof v === "object" ? (
                      <div key={i} className="ml-2 p-2 bg-white/60 rounded border border-slate-100 mt-1 text-xs">
                        {Object.entries(v as Record<string, unknown>).map(([k, val]) => (
                          <div key={k}>
                            <span className="font-medium">{k.replace(/_/g, " ")}:</span> {String(val)}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <Badge key={i} variant="outline" className="mr-1 mb-1 text-xs">
                        {String(v)}
                      </Badge>
                    )
                  ))
                : typeof value === "object"
                ? JSON.stringify(value, null, 2)
                : String(value)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
