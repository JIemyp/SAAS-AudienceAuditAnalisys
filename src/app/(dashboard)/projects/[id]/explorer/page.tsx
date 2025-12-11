"use client";

import { use, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Compass,
  Users,
  Briefcase,
  Heart,
  AlertTriangle,
  Zap,
  Target,
  Palette,
  ChevronRight,
  Loader2,
  AlertCircle,
  Star,
  Activity,
  ShoppingCart,
  CheckCircle2,
  // V5 icons
  Radio,
  Swords,
  DollarSign,
  Shield,
  Lightbulb,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { useTranslation } from "@/lib/hooks/useTranslation";
// Canvas Extended V2 components
import { CustomerJourneySection } from "@/components/canvas-extended/CustomerJourneySection";
import { EmotionalMapSection } from "@/components/canvas-extended/EmotionalMapSection";
import { NarrativeAnglesSection } from "@/components/canvas-extended/NarrativeAnglesSection";
import { MessagingFrameworkSection } from "@/components/canvas-extended/MessagingFrameworkSection";
import { VoiceAndToneSection } from "@/components/canvas-extended/VoiceAndToneSection";
import type {
  CustomerJourney,
  EmotionalMap,
  NarrativeAngle,
  MessagingFramework,
  VoiceAndTone,
  // V5 Types
  ChannelStrategy,
  CompetitiveIntelligence,
  PricingPsychology,
  TrustFramework,
  JTBDContext,
} from "@/types";

interface SegmentSummary {
  id: string;
  name: string;
  description: string;
  sociodemographics?: string;
  order_index: number;
  is_selected?: boolean;
  display_index: number;
}

interface ExplorerData {
  segments: SegmentSummary[];
  selectedSegment: {
    id: string;
    name: string;
    description: string;
    sociodemographics?: string;
    details?: {
      sociodemographics?: string;
      psychographics?: string;
      online_behavior?: string;
      buying_behavior?: string;
      // Additional fields from segment_details schema
      needs?: unknown[];
      triggers?: unknown[];
      core_values?: unknown[];
      awareness_level?: string;
      awareness_reasoning?: string;
      objections?: unknown[];
    };
    jobs?: {
      functional_jobs?: unknown[];
      emotional_jobs?: unknown[];
      social_jobs?: unknown[];
    };
    preferences?: {
      preferences?: unknown[];
      decision_criteria?: unknown[];
      preferred_channels?: unknown[];
      content_preferences?: unknown[];
      communication_style?: string;
    };
    difficulties?: {
      difficulties?: unknown[];
      external_difficulties?: unknown[];
      internal_difficulties?: unknown[];
      knowledge_gaps?: unknown[];
    };
    triggers?: {
      triggers?: unknown[];
      situation_triggers?: unknown[];
      emotional_triggers?: unknown[];
      social_triggers?: unknown[];
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
      segment_id?: string;
      emotional_aspects?: unknown; // JSONB array from database
      behavioral_patterns?: unknown; // JSONB array from database
      buying_signals?: unknown; // JSONB array from database
    }>;
    canvasExtended: Array<{
      id: string;
      pain_id: string;
      segment_id: string;
      customer_journey?: CustomerJourney;
      emotional_map?: EmotionalMap;
      narrative_angles?: NarrativeAngle[];
      messaging_framework?: MessagingFramework;
      voice_and_tone?: VoiceAndTone;
    }>;
    // V5 Strategic Modules
    channelStrategy?: ChannelStrategy | null;
    competitiveIntelligence?: CompetitiveIntelligence | null;
    pricingPsychology?: PricingPsychology | null;
    trustFramework?: TrustFramework | null;
    jtbdContext?: JTBDContext | null;
  } | null;
}

type TabId = "overview" | "jobs" | "preferences" | "difficulties" | "triggers" | "pains" | "canvas" | "channels" | "competitive" | "pricing" | "trust" | "jtbd";

const tabs: Array<{ id: TabId; label: string; icon: typeof Users }> = [
  { id: "overview", label: "Overview", icon: Users },
  { id: "jobs", label: "Jobs", icon: Briefcase },
  { id: "preferences", label: "Preferences", icon: Heart },
  { id: "difficulties", label: "Difficulties", icon: AlertTriangle },
  { id: "triggers", label: "Triggers", icon: Zap },
  { id: "pains", label: "Pains", icon: Target },
  { id: "canvas", label: "Canvas", icon: Palette },
  // V5 Strategic Modules
  { id: "channels", label: "Channels", icon: Radio },
  { id: "competitive", label: "Competitive", icon: Swords },
  { id: "pricing", label: "Pricing", icon: DollarSign },
  { id: "trust", label: "Trust", icon: Shield },
  { id: "jtbd", label: "JTBD Context", icon: Lightbulb },
];

export default function ExplorerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();

  const [data, setData] = useState<ExplorerData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  // Get segment from URL or default to first
  const segmentIdFromUrl = searchParams.get("segment");

  // Language - translate only current tab content for speed
  const { language, setLanguage } = useLanguage();

  // Get content for current tab only (much smaller, faster to translate)
  const getTabContent = () => {
    const segment = data?.selectedSegment;
    if (!segment) return null;

    switch (activeTab) {
      case "overview":
        return {
          id: segment.id,
          name: segment.name,
          description: segment.description,
          sociodemographics: segment.sociodemographics,
          details: segment.details,
        };
      case "jobs":
        return { jobs: segment.jobs };
      case "preferences":
        return { preferences: segment.preferences };
      case "difficulties":
        return { difficulties: segment.difficulties };
      case "triggers":
        return { triggers: segment.triggers };
      case "pains":
        return { pains: segment.pains };
      case "canvas":
        return { canvas: segment.canvas, canvasExtended: segment.canvasExtended, pains: segment.pains };
      // V5 Strategic Modules
      case "channels":
        return { channelStrategy: segment.channelStrategy };
      case "competitive":
        return { competitiveIntelligence: segment.competitiveIntelligence };
      case "pricing":
        return { pricingPsychology: segment.pricingPsychology };
      case "trust":
        return { trustFramework: segment.trustFramework };
      case "jtbd":
        return { jtbdContext: segment.jtbdContext };
      default:
        return null;
    }
  };

  const tabContent = getTabContent();
  const { translatedContent, isTranslating } = useTranslation({
    content: tabContent,
    language,
    enabled: !!tabContent && language !== 'en',
  });

  // Merge translated tab content with original segment
  const displaySegment = data?.selectedSegment ? (() => {
    const original = data.selectedSegment;
    if (!translatedContent || language === 'en') return original;

    const translated = translatedContent as Record<string, unknown>;

    // Merge based on active tab
    switch (activeTab) {
      case "overview":
        return {
          ...original,
          name: (translated.name as string) || original.name,
          description: (translated.description as string) || original.description,
          sociodemographics: (translated.sociodemographics as string) || original.sociodemographics,
          details: (translated.details as typeof original.details) || original.details,
        };
      case "jobs":
        return { ...original, jobs: (translated.jobs as typeof original.jobs) || original.jobs };
      case "preferences":
        return { ...original, preferences: (translated.preferences as typeof original.preferences) || original.preferences };
      case "difficulties":
        return { ...original, difficulties: (translated.difficulties as typeof original.difficulties) || original.difficulties };
      case "triggers":
        return { ...original, triggers: (translated.triggers as typeof original.triggers) || original.triggers };
      case "pains":
        return { ...original, pains: (translated.pains as typeof original.pains) || original.pains };
      case "canvas":
        return {
          ...original,
          canvas: (translated.canvas as typeof original.canvas) || original.canvas,
          canvasExtended: (translated.canvasExtended as typeof original.canvasExtended) || original.canvasExtended,
          pains: (translated.pains as typeof original.pains) || original.pains,
        };
      // V5 Strategic Modules
      case "channels":
        return { ...original, channelStrategy: (translated.channelStrategy as typeof original.channelStrategy) || original.channelStrategy };
      case "competitive":
        return { ...original, competitiveIntelligence: (translated.competitiveIntelligence as typeof original.competitiveIntelligence) || original.competitiveIntelligence };
      case "pricing":
        return { ...original, pricingPsychology: (translated.pricingPsychology as typeof original.pricingPsychology) || original.pricingPsychology };
      case "trust":
        return { ...original, trustFramework: (translated.trustFramework as typeof original.trustFramework) || original.trustFramework };
      case "jtbd":
        return { ...original, jtbdContext: (translated.jtbdContext as typeof original.jtbdContext) || original.jtbdContext };
      default:
        return original;
    }
  })() : null;

  useEffect(() => {
    fetchData(segmentIdFromUrl);
  }, [projectId, segmentIdFromUrl]);

  const fetchData = async (segmentId: string | null) => {
    try {
      setIsLoading(true);
      setError(null);

      const url = segmentId
        ? `/api/report?projectId=${projectId}&level=explorer&segmentId=${segmentId}`
        : `/api/report?projectId=${projectId}&level=explorer`;

      const res = await fetch(url);
      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Failed to load data");
      }

      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSegmentChange = (segmentId: string) => {
    router.push(`/projects/${projectId}/explorer?segment=${segmentId}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertCircle className="w-12 h-12 text-red-400" />
        <p className="text-slate-600">{error || "No data available"}</p>
        <Button onClick={() => fetchData(segmentIdFromUrl)}>Retry</Button>
      </div>
    );
  }

  if (data.segments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Users className="w-12 h-12 text-slate-300" />
        <p className="text-slate-600">No segments generated yet</p>
        <Button onClick={() => router.push(`/projects/${projectId}/generate/segments`)}>
          Generate Segments
        </Button>
      </div>
    );
  }

  return (
    <div className="flex gap-6 -mx-8 -mt-6 min-h-[calc(100vh-200px)]">
      {/* Segment Sidebar */}
      <aside className="w-72 bg-slate-50 border-r border-slate-200 p-4 shrink-0 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            Segments
          </h3>
          <Badge variant="secondary">{data.segments.length}</Badge>
        </div>

        {/* Selected Segments (from segments_final) */}
        {data.segments.some(s => s.is_selected) && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2 px-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">
                Selected Segments
              </span>
            </div>
            <nav className="space-y-1">
              {data.segments.filter(s => s.is_selected).map((segment) => {
                const isActive = segment.id === displaySegment?.id;
                return (
                  <button
                    key={segment.id}
                    onClick={() => handleSegmentChange(segment.id)}
                    className={cn(
                      "w-full text-left px-3 py-2.5 rounded-lg transition-all duration-200",
                      "flex items-center gap-3 group",
                      isActive
                        ? "bg-emerald-600 text-white shadow-md"
                        : "text-slate-700 hover:bg-emerald-50 hover:shadow-sm border border-transparent hover:border-emerald-200"
                    )}
                  >
                    <span
                      className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold shrink-0",
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-emerald-100 text-emerald-700"
                      )}
                    >
                      {segment.display_index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "font-medium truncate text-sm",
                        isActive ? "text-white" : "text-slate-900"
                      )}>
                        {segment.name}
                      </p>
                    </div>
                    <ChevronRight
                      className={cn(
                        "w-4 h-4 shrink-0 transition-transform",
                        isActive ? "text-white/70" : "text-emerald-300 group-hover:text-emerald-500"
                      )}
                    />
                  </button>
                );
              })}
            </nav>
          </div>
        )}

        {/* Other Segments (not in segments_final) */}
        {data.segments.some(s => !s.is_selected) && (
          <div>
            {data.segments.some(s => s.is_selected) && (
              <div className="flex items-center gap-2 mb-2 px-1 pt-2 border-t border-slate-200">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Other Segments
                </span>
              </div>
            )}
            <nav className="space-y-1">
              {data.segments.filter(s => !s.is_selected).map((segment) => {
                const isActive = segment.id === displaySegment?.id;
                return (
                  <button
                    key={segment.id}
                    onClick={() => handleSegmentChange(segment.id)}
                    className={cn(
                      "w-full text-left px-3 py-2.5 rounded-lg transition-all duration-200",
                      "flex items-center gap-3 group",
                      isActive
                        ? "bg-slate-600 text-white shadow-md"
                        : "text-slate-500 hover:bg-white hover:text-slate-700 hover:shadow-sm"
                    )}
                  >
                    <span
                      className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold shrink-0",
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-slate-200 text-slate-600"
                      )}
                    >
                      {segment.display_index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "font-medium truncate text-sm",
                        isActive ? "text-white" : "text-slate-600"
                      )}>
                        {segment.name}
                      </p>
                    </div>
                    <ChevronRight
                      className={cn(
                        "w-4 h-4 shrink-0 transition-transform",
                        isActive ? "text-white/70" : "text-slate-300 group-hover:text-slate-400"
                      )}
                    />
                  </button>
                );
              })}
            </nav>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <div className="flex-1 pr-8 py-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl text-white shadow-lg">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                {displaySegment?.name || "Select a Segment"}
              </h1>
              <p className="text-slate-500 mt-1 max-w-xl line-clamp-2">
                {displaySegment?.description || "Choose a segment from the sidebar to explore"}
              </p>
            </div>
          </div>

          <LanguageToggle
            currentLanguage={language}
            onLanguageChange={setLanguage}
            isLoading={isTranslating}
          />
        </div>

        {/* Translation in progress banner */}
        {isTranslating && language !== 'en' && (
          <div className="mb-6 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3">
            <Loader2 className="w-4 h-4 text-amber-600 animate-spin" />
            <p className="text-amber-700 text-sm">Translating current tab...</p>
          </div>
        )}

        {displaySegment && (
          <>
            {/* Tabs */}
            <div className="border-b border-slate-200 mb-6">
              <nav className="flex gap-1">
                {tabs.map((tab) => {
                  const isActive = activeTab === tab.id;
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        "px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2",
                        isActive
                          ? "border-blue-600 text-blue-600"
                          : "border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === "overview" && <OverviewTab segment={displaySegment} />}
                {activeTab === "jobs" && <JobsTab jobs={displaySegment.jobs} />}
                {activeTab === "preferences" && <PreferencesTab preferences={displaySegment.preferences} />}
                {activeTab === "difficulties" && <DifficultiesTab difficulties={displaySegment.difficulties} />}
                {activeTab === "triggers" && <TriggersTab triggers={displaySegment.triggers} />}
                {activeTab === "pains" && <PainsTab pains={displaySegment.pains} />}
                {activeTab === "canvas" && <CanvasTab canvas={displaySegment.canvas} canvasExtended={displaySegment.canvasExtended} pains={displaySegment.pains} />}
                {/* V5 Strategic Modules */}
                {activeTab === "channels" && <ChannelStrategyTab data={displaySegment.channelStrategy} />}
                {activeTab === "competitive" && <CompetitiveIntelligenceTab data={displaySegment.competitiveIntelligence} />}
                {activeTab === "pricing" && <PricingPsychologyTab data={displaySegment.pricingPsychology} />}
                {activeTab === "trust" && <TrustFrameworkTab data={displaySegment.trustFramework} />}
                {activeTab === "jtbd" && <JTBDContextTab data={displaySegment.jtbdContext} />}
              </motion.div>
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  );
}

// Tab Components
function OverviewTab({ segment }: { segment: NonNullable<ExplorerData["selectedSegment"]> }) {
  const details = segment.details;

  return (
    <div className="space-y-6">
      {/* Main behavior cards */}
      <div className="grid grid-cols-2 gap-6">
        <InfoCard
          title="Sociodemographics"
          content={details?.sociodemographics || segment.sociodemographics}
          icon={Users}
          color="blue"
        />
        <InfoCard
          title="Psychographics"
          content={details?.psychographics}
          icon={Heart}
          color="purple"
        />
        <InfoCard
          title="Online Behavior"
          content={details?.online_behavior}
          icon={Compass}
          color="indigo"
        />
        <InfoCard
          title="Buying Behavior"
          content={details?.buying_behavior}
          icon={Target}
          color="emerald"
        />
      </div>

      {/* Additional segment details if available */}
      {(details?.awareness_level || details?.needs || details?.core_values || details?.objections) && (
        <>
          <div className="border-t border-slate-200 pt-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Segment Analysis</h3>
          </div>
          <div className="grid grid-cols-2 gap-6">
            {details?.awareness_level && (
              <AwarenessCard
                level={details.awareness_level}
                reasoning={details.awareness_reasoning}
              />
            )}
            {details?.needs && details.needs.length > 0 && (
              <ListCard
                title="Key Needs"
                items={details.needs}
                color="blue"
                icon={Heart}
                fieldName="name"
              />
            )}
            {details?.core_values && details.core_values.length > 0 && (
              <ListCard
                title="Core Values"
                items={details.core_values}
                color="purple"
                icon={Star}
                fieldName="name"
              />
            )}
            {details?.objections && details.objections.length > 0 && (
              <ListCard
                title="Common Objections"
                items={details.objections}
                color="rose"
                icon={AlertTriangle}
                fieldName="name"
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}

interface JobsData {
  functional_jobs?: unknown[];
  emotional_jobs?: unknown[];
  social_jobs?: unknown[];
}

function JobsTab({ jobs }: { jobs?: JobsData }) {
  if (!jobs) {
    return <EmptyState message="Jobs not generated yet" />;
  }

  return (
    <div className="grid grid-cols-3 gap-6">
      <ListCard
        title="Functional Jobs"
        items={jobs.functional_jobs}
        color="blue"
        icon={Briefcase}
        fieldName="job"
      />
      <ListCard
        title="Emotional Jobs"
        items={jobs.emotional_jobs}
        color="rose"
        icon={Heart}
        fieldName="job"
      />
      <ListCard
        title="Social Jobs"
        items={jobs.social_jobs}
        color="amber"
        icon={Users}
        fieldName="job"
      />
    </div>
  );
}

interface PreferencesData {
  preferences?: unknown[];
  decision_criteria?: unknown[];
  preferred_channels?: unknown[];
  content_preferences?: unknown[];
  communication_style?: string;
}

function PreferencesTab({ preferences }: { preferences?: PreferencesData }) {
  if (!preferences) {
    return <EmptyState message="Preferences not generated yet" />;
  }

  // If we have the new preferences array format, show it
  if (preferences.preferences && preferences.preferences.length > 0) {
    return (
      <div className="space-y-6">
        <ListCard
          title="All Preferences"
          items={preferences.preferences}
          color="rose"
          icon={Heart}
          fieldName="name"
        />
        {preferences.communication_style && (
          <InfoCard
            title="Communication Style"
            content={preferences.communication_style}
            icon={Users}
            color="indigo"
          />
        )}
      </div>
    );
  }

  // Legacy format with separate arrays
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-6">
        <ListCard
          title="Decision Criteria"
          items={preferences.decision_criteria}
          color="blue"
          icon={Target}
        />
        <ListCard
          title="Preferred Channels"
          items={preferences.preferred_channels}
          color="emerald"
          icon={Compass}
        />
        <ListCard
          title="Content Preferences"
          items={preferences.content_preferences}
          color="purple"
          icon={Heart}
        />
      </div>
      {preferences.communication_style && (
        <InfoCard
          title="Communication Style"
          content={preferences.communication_style}
          icon={Users}
          color="indigo"
        />
      )}
    </div>
  );
}

interface DifficultiesData {
  difficulties?: unknown[];
  external_difficulties?: unknown[];
  internal_difficulties?: unknown[];
  knowledge_gaps?: unknown[];
}

function DifficultiesTab({ difficulties }: { difficulties?: DifficultiesData }) {
  if (!difficulties) {
    return <EmptyState message="Difficulties not generated yet" />;
  }

  // If we have the new difficulties array format, show it
  if (difficulties.difficulties && difficulties.difficulties.length > 0) {
    return (
      <ListCard
        title="All Difficulties"
        items={difficulties.difficulties}
        color="amber"
        icon={AlertTriangle}
        fieldName="name"
      />
    );
  }

  // Legacy format with separate arrays
  return (
    <div className="grid grid-cols-3 gap-6">
      <ListCard
        title="External Difficulties"
        items={difficulties.external_difficulties}
        color="rose"
        icon={AlertTriangle}
      />
      <ListCard
        title="Internal Difficulties"
        items={difficulties.internal_difficulties}
        color="amber"
        icon={AlertCircle}
      />
      <ListCard
        title="Knowledge Gaps"
        items={difficulties.knowledge_gaps}
        color="slate"
        icon={Compass}
      />
    </div>
  );
}

interface TriggersData {
  triggers?: unknown[];
  situation_triggers?: unknown[];
  emotional_triggers?: unknown[];
  social_triggers?: unknown[];
}

function TriggersTab({ triggers }: { triggers?: TriggersData }) {
  if (!triggers) {
    return <EmptyState message="Triggers not generated yet" />;
  }

  // If we have the new triggers array format, show it
  if (triggers.triggers && triggers.triggers.length > 0) {
    return (
      <ListCard
        title="All Triggers"
        items={triggers.triggers}
        color="purple"
        icon={Zap}
        fieldName="name"
      />
    );
  }

  // Legacy format with separate arrays
  return (
    <div className="grid grid-cols-3 gap-6">
      <ListCard
        title="Situation Triggers"
        items={triggers.situation_triggers}
        color="blue"
        icon={Zap}
      />
      <ListCard
        title="Emotional Triggers"
        items={triggers.emotional_triggers}
        color="rose"
        icon={Heart}
      />
      <ListCard
        title="Social Triggers"
        items={triggers.social_triggers}
        color="purple"
        icon={Users}
      />
    </div>
  );
}

function PainsTab({ pains }: { pains: NonNullable<ExplorerData["selectedSegment"]>["pains"] }) {
  if (!pains || pains.length === 0) {
    return <EmptyState message="Pains not generated yet" />;
  }

  const topPains = pains.filter(p => p.is_top_pain).sort((a, b) => b.impact_score - a.impact_score);
  const otherPains = pains.filter(p => !p.is_top_pain);

  return (
    <div className="space-y-6">
      {topPains.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-500" />
            Top Pain Points
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {topPains.map((pain) => (
              <PainCard key={pain.id} pain={pain} isTop />
            ))}
          </div>
        </div>
      )}

      {otherPains.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-500 mb-3">Other Pain Points</h3>
          <div className="grid grid-cols-2 gap-4">
            {otherPains.map((pain) => (
              <PainCard key={pain.id} pain={pain} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Helper to safely render content that might be string, object, or array
function renderContent(value: unknown): string {
  if (!value) return "—";
  if (typeof value === "string") return value;

  // Handle arrays (JSONB data from Supabase)
  if (Array.isArray(value)) {
    if (value.length === 0) return "—";

    // Format each item in the array
    const formattedItems = value.map((item, index) => {
      if (typeof item === "string") return `• ${item}`;
      if (typeof item === "object" && item !== null) {
        const obj = item as Record<string, unknown>;
        // For canvas emotional_aspects: { emotion, intensity, description, ... }
        if (obj.emotion) {
          const parts = [`${obj.emotion}`];
          if (obj.intensity) parts[0] += ` (${obj.intensity})`;
          if (obj.description) parts.push(obj.description as string);
          if (obj.self_image_impact) parts.push(`Self-image: ${obj.self_image_impact}`);
          return `• ${parts.join("\n  ")}`;
        }
        // For canvas behavioral_patterns: { pattern, description, frequency, ... }
        if (obj.pattern) {
          const parts = [`${obj.pattern}`];
          if (obj.frequency) parts[0] += ` (${obj.frequency})`;
          if (obj.description) parts.push(obj.description as string);
          return `• ${parts.join("\n  ")}`;
        }
        // For canvas buying_signals: { signal, readiness_level, messaging_angle, ... }
        if (obj.signal) {
          const parts = [`${obj.signal}`];
          if (obj.readiness_level) parts[0] += ` (${obj.readiness_level})`;
          if (obj.messaging_angle) parts.push(`Messaging: ${obj.messaging_angle}`);
          return `• ${parts.join("\n  ")}`;
        }
        // Generic object handling
        const name = obj.name || obj.title || obj.label;
        const desc = obj.description || obj.text || obj.value;
        if (name && desc) return `• ${name}: ${desc}`;
        if (name) return `• ${name}`;
        if (desc) return `• ${desc}`;
        // Last resort: stringify first meaningful value
        for (const val of Object.values(obj)) {
          if (typeof val === "string" && val.trim()) return `• ${val}`;
        }
      }
      return `• Item ${index + 1}`;
    });

    return formattedItems.join("\n\n");
  }

  // Handle single object
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    // Try to get description or name first
    if (obj.description && typeof obj.description === "string") return obj.description;
    if (obj.name && typeof obj.name === "string") return obj.name;
    // Otherwise, format all string values
    const parts: string[] = [];
    for (const [key, val] of Object.entries(obj)) {
      if (typeof val === "string" && val.trim()) {
        const label = key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
        parts.push(`${label}: ${val}`);
      }
    }
    return parts.join("\n") || "—";
  }
  return String(value);
}

function CanvasTab({
  canvas,
  canvasExtended,
  pains,
}: {
  canvas: NonNullable<ExplorerData["selectedSegment"]>["canvas"];
  canvasExtended: NonNullable<ExplorerData["selectedSegment"]>["canvasExtended"];
  pains: NonNullable<ExplorerData["selectedSegment"]>["pains"];
}) {
  // Get top pains sorted by impact score
  const topPains = pains.filter(p => p.is_top_pain).sort((a, b) => b.impact_score - a.impact_score);

  // All pains that have canvas data (not just top pains)
  const allPainsWithCanvas = pains.filter(p => canvas.some(c => c.pain_id === p.id));

  // Prioritize top pains, but include any pain that has canvas
  const painsToShow = topPains.length > 0
    ? topPains.filter(p => canvas.some(c => c.pain_id === p.id))
    : allPainsWithCanvas;

  // Default to first canvas pain_id or first top pain
  const [selectedPainId, setSelectedPainId] = useState<string | null>(
    canvas?.[0]?.pain_id || painsToShow[0]?.id || null
  );

  if (!canvas || canvas.length === 0) {
    return <EmptyState message="Canvas not generated yet" />;
  }

  // Find selected canvas
  const selectedCanvas = canvas.find(c => c.pain_id === selectedPainId);
  const selectedPain = pains.find(p => p.id === selectedPainId);
  // Canvas Extended V2 links by pain_id, not canvas_id
  const extended = canvasExtended?.find(e => e.pain_id === selectedPainId) || null;

  // Debug info (можно убрать после отладки)
  console.log("[CanvasTab] Debug:", {
    canvasCount: canvas.length,
    canvasPainIds: canvas.map(c => c.pain_id),
    painsCount: pains.length,
    painIds: pains.map(p => p.id),
    topPainsCount: topPains.length,
    painsToShowCount: painsToShow.length,
    selectedPainId,
    hasSelectedCanvas: !!selectedCanvas,
  });

  return (
    <div className="space-y-6">
      {/* Pain Selector - Always show if there are pains with canvas */}
      {painsToShow.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-slate-500 font-medium">Select Pain Point:</p>
          <div className="flex flex-wrap gap-2">
            {painsToShow.map((pain) => {
              const isSelected = pain.id === selectedPainId;
              return (
                <button
                  key={pain.id}
                  onClick={() => setSelectedPainId(pain.id)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                    isSelected
                      ? "bg-purple-600 text-white shadow-md"
                      : "bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200"
                  )}
                >
                  <Star className={cn("w-4 h-4", isSelected ? "fill-white" : "fill-purple-300")} />
                  {pain.name}
                  <Badge variant={isSelected ? "secondary" : "outline"} className={cn(
                    "ml-1",
                    isSelected ? "bg-white/20 text-white border-0" : ""
                  )}>
                    {pain.impact_score}/10
                  </Badge>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Show message if no pains match canvas */}
      {painsToShow.length === 0 && canvas.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm">
          Canvas data exists but no matching pains found. Canvas pain IDs: {canvas.map(c => c.pain_id).join(", ")}
        </div>
      )}

      {/* Selected Canvas Content */}
      {selectedCanvas && selectedPain ? (
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-purple-100">
            <CardTitle className="text-lg flex items-center gap-2">
              <Palette className="w-5 h-5 text-purple-600" />
              {selectedPain.name}
              <Badge className="ml-2 bg-purple-100 text-purple-700">
                Impact: {selectedPain.impact_score}/10
              </Badge>
            </CardTitle>
            {selectedPain.description && (
              <p className="text-sm text-slate-600 mt-2">{selectedPain.description}</p>
            )}
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                  <Heart className="w-4 h-4 text-rose-500" />
                  Emotional Aspects
                </h4>
                <p className="text-sm text-slate-600 whitespace-pre-wrap">{renderContent(selectedCanvas.emotional_aspects)}</p>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-purple-500" />
                  Behavioral Patterns
                </h4>
                <p className="text-sm text-slate-600 whitespace-pre-wrap">{renderContent(selectedCanvas.behavioral_patterns)}</p>
              </div>
              <div className="col-span-2">
                <h4 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-emerald-500" />
                  Buying Signals
                </h4>
                <p className="text-sm text-slate-600 whitespace-pre-wrap">{renderContent(selectedCanvas.buying_signals)}</p>
              </div>
              {extended && (
                <div className="col-span-2 border-t border-slate-200 pt-6 mt-4 space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <Palette className="w-5 h-5 text-indigo-600" />
                    Deep Psychological Analysis (Canvas Extended V2)
                  </h3>

                  {/* Customer Journey */}
                  {extended.customer_journey && (
                    <CustomerJourneySection
                      journey={extended.customer_journey}
                      readonly
                    />
                  )}

                  {/* Emotional Map */}
                  {extended.emotional_map && (
                    <EmotionalMapSection
                      emotionalMap={extended.emotional_map}
                      readonly
                    />
                  )}

                  {/* Narrative Angles */}
                  {extended.narrative_angles && extended.narrative_angles.length > 0 && (
                    <NarrativeAnglesSection
                      angles={extended.narrative_angles}
                      readonly
                    />
                  )}

                  {/* Messaging Framework */}
                  {extended.messaging_framework && (
                    <MessagingFrameworkSection
                      framework={extended.messaging_framework}
                      readonly
                    />
                  )}

                  {/* Voice & Tone */}
                  {extended.voice_and_tone && (
                    <VoiceAndToneSection
                      voiceAndTone={extended.voice_and_tone}
                      readonly
                    />
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <EmptyState message="Select a pain point to view its canvas" />
      )}
    </div>
  );
}

// =====================================================
// V5 Strategic Module Tabs
// =====================================================

function ChannelStrategyTab({ data }: { data?: ChannelStrategy | null }) {
  if (!data) {
    return <EmptyState message="Channel Strategy not generated yet" />;
  }

  return (
    <div className="space-y-6">
      {/* Primary Platforms */}
      {data.primary_platforms && data.primary_platforms.length > 0 && (
        <Card>
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Radio className="w-4 h-4 text-blue-600" />
              Primary Platforms
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {data.primary_platforms.map((platform, i) => (
              <div key={i} className="p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-slate-900">{platform.platform}</h4>
                  <div className="flex gap-2">
                    <Badge variant="outline">{platform.usage_frequency}</Badge>
                    <Badge variant="secondary">{platform.activity_type}</Badge>
                  </div>
                </div>
                <p className="text-sm text-slate-600 mb-2">{platform.why_they_use_it}</p>
                {platform.peak_activity_times && platform.peak_activity_times.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {platform.peak_activity_times.map((time, j) => (
                      <span key={j} className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">{time}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Content Preferences */}
      {data.content_preferences && data.content_preferences.length > 0 && (
        <Card>
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Heart className="w-4 h-4 text-purple-600" />
              Content Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {data.content_preferences.map((pref, i) => (
              <div key={i} className="p-3 bg-purple-50/50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-purple-900">{pref.format}</span>
                  <Badge variant="outline" className="text-xs">{pref.attention_span}</Badge>
                </div>
                <p className="text-sm text-slate-600">{pref.context}</p>
                {pref.triggering_topics && pref.triggering_topics.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {pref.triggering_topics.map((topic, j) => (
                      <span key={j} className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded">{topic}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Trusted Sources & Communities */}
      <div className="grid grid-cols-2 gap-6">
        {data.trusted_sources && data.trusted_sources.length > 0 && (
          <Card>
            <CardHeader className="bg-emerald-50 border-b">
              <CardTitle className="text-sm font-semibold text-emerald-700">Trusted Sources</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {data.trusted_sources.map((source, i) => (
                <div key={i} className="text-sm">
                  <p className="font-medium text-slate-900 capitalize">{source.source_type.replace(/_/g, ' ')}</p>
                  <p className="text-slate-600 text-xs">{source.why_trusted}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {source.specific_examples.map((ex, j) => (
                      <span key={j} className="px-2 py-0.5 text-xs bg-emerald-100 text-emerald-700 rounded">{ex}</span>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {data.communities && data.communities.length > 0 && (
          <Card>
            <CardHeader className="bg-amber-50 border-b">
              <CardTitle className="text-sm font-semibold text-amber-700">Communities</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {data.communities.map((comm, i) => (
                <div key={i} className="text-sm">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-slate-900 capitalize">{comm.type.replace(/_/g, ' ')}</p>
                    <Badge variant="outline" className="text-xs">{comm.participation_level}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {comm.specific_names.map((name, j) => (
                      <span key={j} className="px-2 py-0.5 text-xs bg-amber-100 text-amber-700 rounded">{name}</span>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Search Patterns & Advertising */}
      <div className="grid grid-cols-2 gap-6">
        {data.search_patterns && (
          <Card>
            <CardHeader className="bg-blue-50 border-b">
              <CardTitle className="text-sm font-semibold text-blue-700">Search Patterns</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2 text-sm">
              <p><strong>Search Depth:</strong> {data.search_patterns.search_depth?.replace(/_/g, ' ')}</p>
              <p><strong>Decision Timeline:</strong> {data.search_patterns.decision_timeline}</p>
              {data.search_patterns.typical_queries && (
                <div>
                  <p className="font-medium text-slate-700 mb-1">Typical Queries:</p>
                  <ul className="space-y-1">
                    {data.search_patterns.typical_queries.map((q, i) => (
                      <li key={i} className="text-slate-600">• {q}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {data.advertising_response && (
          <Card>
            <CardHeader className="bg-rose-50 border-b">
              <CardTitle className="text-sm font-semibold text-rose-700">Advertising Response</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2 text-sm">
              <p><strong>Retargeting Tolerance:</strong> {data.advertising_response.retargeting_tolerance}</p>
              {data.advertising_response.channels_they_notice && (
                <div>
                  <p className="font-medium text-slate-700">Channels They Notice:</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {data.advertising_response.channels_they_notice.map((ch, i) => (
                      <span key={i} className="px-2 py-0.5 text-xs bg-emerald-100 text-emerald-700 rounded">{ch}</span>
                    ))}
                  </div>
                </div>
              )}
              {data.advertising_response.ad_formats_that_annoy && (
                <div>
                  <p className="font-medium text-slate-700">Ad Formats That Annoy:</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {data.advertising_response.ad_formats_that_annoy.map((f, i) => (
                      <span key={i} className="px-2 py-0.5 text-xs bg-rose-100 text-rose-700 rounded">{f}</span>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function CompetitiveIntelligenceTab({ data }: { data?: CompetitiveIntelligence | null }) {
  if (!data) {
    return <EmptyState message="Competitive Intelligence not generated yet" />;
  }

  return (
    <div className="space-y-6">
      {/* Alternatives Tried */}
      {data.alternatives_tried && data.alternatives_tried.length > 0 && (
        <Card>
          <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 border-b">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-600" />
              Alternatives They've Tried
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {data.alternatives_tried.map((alt, i) => (
              <div key={i} className="p-4 bg-orange-50/50 rounded-lg">
                <h4 className="font-semibold text-orange-900 mb-2">{alt.solution_type}</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase">Why They Tried It</p>
                    <p className="text-slate-700">{alt.why_they_tried_it}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase">Why It Failed</p>
                    <p className="text-slate-700">{alt.why_it_failed}</p>
                  </div>
                </div>
                {alt.emotional_residue && (
                  <div className="mt-2 p-2 bg-red-50 rounded text-sm">
                    <p className="text-xs font-medium text-red-700">Emotional Residue:</p>
                    <p className="text-red-900">{alt.emotional_residue}</p>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Competitors */}
      {data.vs_competitors && data.vs_competitors.length > 0 && (
        <Card>
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Swords className="w-4 h-4 text-blue-600" />
              Competitor Perception
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {data.vs_competitors.map((comp, i) => (
              <div key={i} className="p-4 bg-blue-50/50 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">{comp.competitor_name}</h4>
                <p className="text-sm text-slate-600 mb-3">{comp.segment_perception}</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-2 bg-emerald-50 rounded">
                    <p className="text-xs font-medium text-emerald-700 uppercase mb-1">Strengths</p>
                    <ul className="text-sm space-y-1">
                      {comp.competitor_strengths?.map((s, j) => (
                        <li key={j} className="text-emerald-900">• {s}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-2 bg-red-50 rounded">
                    <p className="text-xs font-medium text-red-700 uppercase mb-1">Weaknesses</p>
                    <ul className="text-sm space-y-1">
                      {comp.competitor_weaknesses?.map((w, j) => (
                        <li key={j} className="text-red-900">• {w}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Switching Barriers */}
      {data.switching_barriers && data.switching_barriers.length > 0 && (
        <Card>
          <CardHeader className="bg-rose-50 border-b">
            <CardTitle className="text-sm font-semibold text-rose-700">Switching Barriers</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {data.switching_barriers.map((barrier, i) => (
              <div key={i} className="p-3 bg-rose-50/50 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-rose-900">{barrier.barrier_type}</span>
                  <Badge variant={barrier.severity === 'critical' ? 'destructive' : 'secondary'}>
                    {barrier.severity}
                  </Badge>
                </div>
                <p className="text-sm text-slate-600">{barrier.description}</p>
                <p className="text-sm text-emerald-700 mt-1">
                  <strong>How to overcome:</strong> {barrier.how_to_overcome}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Category Beliefs */}
      {data.category_beliefs && (
        <Card>
          <CardHeader className="bg-purple-50 border-b">
            <CardTitle className="text-sm font-semibold text-purple-700">Category Beliefs</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {data.category_beliefs.what_they_believe && (
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase mb-2">What They Believe</p>
                <ul className="space-y-1 text-sm">
                  {data.category_beliefs.what_they_believe.map((b, i) => (
                    <li key={i} className="text-slate-700">• {b}</li>
                  ))}
                </ul>
              </div>
            )}
            {data.category_beliefs.misconceptions_to_address && data.category_beliefs.misconceptions_to_address.length > 0 && (
              <div className="pt-3 border-t">
                <p className="text-xs font-medium text-slate-500 uppercase mb-2">Misconceptions to Address</p>
                {data.category_beliefs.misconceptions_to_address.map((m, i) => (
                  <div key={i} className="p-2 bg-indigo-50 rounded mb-2">
                    <p className="text-sm font-medium text-indigo-900">{m.misconception}</p>
                    <p className="text-xs text-slate-600">Root: {m.root_cause}</p>
                    <p className="text-xs text-emerald-700">Reframe: {m.how_to_reframe}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function PricingPsychologyTab({ data }: { data?: PricingPsychology | null }) {
  if (!data) {
    return <EmptyState message="Pricing Psychology not generated yet" />;
  }

  return (
    <div className="space-y-6">
      {/* Price Perception */}
      {data.price_perception && (
        <Card>
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              Price Perception
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-slate-50 rounded">
                <p className="text-xs font-medium text-slate-500 uppercase">Sensitivity Level</p>
                <p className="text-lg font-semibold text-slate-900 capitalize">{data.price_perception.price_sensitivity_level}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded">
                <p className="text-xs font-medium text-slate-500 uppercase">Sweet Spot</p>
                <p className="text-lg font-semibold text-emerald-700">{data.price_perception.spending_sweet_spot}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded">
                <p className="text-xs font-medium text-slate-500 uppercase">Current Spending</p>
                <p className="text-slate-700">{data.price_perception.current_spending_on_alternatives}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded">
                <p className="text-xs font-medium text-slate-500 uppercase">Spending Ceiling</p>
                <p className="text-slate-700">{data.price_perception.spending_ceiling}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Budget Context */}
      {data.budget_context && (
        <Card>
          <CardHeader className="bg-blue-50 border-b">
            <CardTitle className="text-sm font-semibold text-blue-700">Budget Context</CardTitle>
          </CardHeader>
          <CardContent className="p-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase">Spending Category</p>
              <p className="text-slate-700">{data.budget_context.spending_category}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase">Decision Cycle</p>
              <p className="text-slate-700">{data.budget_context.decision_cycle}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase">Budget Allocation</p>
              <p className="text-slate-700">{data.budget_context.budget_allocation}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase">Who Controls Budget</p>
              <p className="text-slate-700">{data.budget_context.who_controls_budget}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Value Anchors */}
      {data.value_anchors && data.value_anchors.length > 0 && (
        <Card>
          <CardHeader className="bg-amber-50 border-b">
            <CardTitle className="text-sm font-semibold text-amber-700">Value Anchors</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-2">
            {data.value_anchors.map((anchor, i) => (
              <div key={i} className="p-3 bg-amber-50/50 rounded">
                <p className="font-medium text-amber-900">{anchor.comparison_point}</p>
                <p className="text-sm text-slate-600">{anchor.why_this_works}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Pricing Objections */}
      {data.pricing_objections && data.pricing_objections.length > 0 && (
        <Card>
          <CardHeader className="bg-rose-50 border-b">
            <CardTitle className="text-sm font-semibold text-rose-700">Pricing Objections</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {data.pricing_objections.map((obj, i) => (
              <div key={i} className="p-3 bg-rose-50/50 rounded">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-rose-900">{obj.objection}</span>
                  <Badge variant="outline">{obj.is_price_or_value}</Badge>
                </div>
                <p className="text-sm text-slate-600">Concern: {obj.underlying_concern}</p>
                <p className="text-sm text-emerald-700">Reframe: {obj.reframe_strategy}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Discount Sensitivity */}
      {data.discount_sensitivity && (
        <Card>
          <CardHeader className="bg-purple-50 border-b">
            <CardTitle className="text-sm font-semibold text-purple-700">Discount Sensitivity</CardTitle>
          </CardHeader>
          <CardContent className="p-4 text-sm">
            <div className="mb-2 flex items-center gap-2">
              <strong>Responds to Discounts:</strong>
              <Badge variant={data.discount_sensitivity.responds_to_discounts ? 'default' : 'secondary'}>
                {data.discount_sensitivity.responds_to_discounts ? 'Yes' : 'No'}
              </Badge>
            </div>
            {data.discount_sensitivity.types_that_work && (
              <div className="mb-2">
                <p className="font-medium text-emerald-700">Types That Work:</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {data.discount_sensitivity.types_that_work.map((t, i) => (
                    <span key={i} className="px-2 py-0.5 text-xs bg-emerald-100 text-emerald-700 rounded">{t}</span>
                  ))}
                </div>
              </div>
            )}
            {data.discount_sensitivity.types_that_backfire && (
              <div>
                <p className="font-medium text-rose-700">Types That Backfire:</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {data.discount_sensitivity.types_that_backfire.map((t, i) => (
                    <span key={i} className="px-2 py-0.5 text-xs bg-rose-100 text-rose-700 rounded">{t}</span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function TrustFrameworkTab({ data }: { data?: TrustFramework | null }) {
  if (!data) {
    return <EmptyState message="Trust Framework not generated yet" />;
  }

  return (
    <div className="space-y-6">
      {/* Baseline Trust */}
      {data.baseline_trust && (
        <Card>
          <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 border-b">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Shield className="w-4 h-4 text-slate-600" />
              Baseline Trust
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 grid grid-cols-2 gap-4 text-sm">
            <div className="p-3 bg-slate-50 rounded">
              <p className="text-xs font-medium text-slate-500 uppercase">Trust in Category</p>
              <p className="text-slate-700">{data.baseline_trust.trust_in_category}</p>
            </div>
            <div className="p-3 bg-slate-50 rounded">
              <p className="text-xs font-medium text-slate-500 uppercase">Trust in Brand</p>
              <p className="text-slate-700">{data.baseline_trust.trust_in_brand}</p>
            </div>
            {data.baseline_trust.reasons_for_skepticism && data.baseline_trust.reasons_for_skepticism.length > 0 && (
              <div className="col-span-2 p-3 bg-rose-50 rounded">
                <p className="text-xs font-medium text-rose-700 uppercase mb-1">Reasons for Skepticism</p>
                <ul className="space-y-1">
                  {data.baseline_trust.reasons_for_skepticism.map((r, i) => (
                    <li key={i} className="text-rose-900">• {r}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Proof Hierarchy */}
      {data.proof_hierarchy && data.proof_hierarchy.length > 0 && (
        <Card>
          <CardHeader className="bg-emerald-50 border-b">
            <CardTitle className="text-sm font-semibold text-emerald-700">Proof Hierarchy</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {data.proof_hierarchy.map((proof, i) => (
              <div key={i} className="p-3 bg-emerald-50/50 rounded">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-emerald-900">{proof.proof_type}</span>
                  <Badge variant={proof.effectiveness === 'very_high' ? 'default' : 'secondary'}>
                    {proof.effectiveness?.replace(/_/g, ' ')}
                  </Badge>
                </div>
                <p className="text-sm text-slate-600">{proof.why_it_works}</p>
                <p className="text-sm text-slate-500 mt-1">How to present: {proof.how_to_present}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Trust Killers */}
      {data.trust_killers && data.trust_killers.length > 0 && (
        <Card>
          <CardHeader className="bg-rose-50 border-b">
            <CardTitle className="text-sm font-semibold text-rose-700">Trust Killers</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {data.trust_killers.map((killer, i) => (
              <div key={i} className="p-3 bg-rose-50/50 rounded">
                <p className="font-medium text-rose-900">{killer.red_flag}</p>
                <p className="text-sm text-slate-600">Why it triggers skepticism: {killer.why_triggers_skepticism}</p>
                <p className="text-sm text-emerald-700">How to avoid: {killer.how_to_avoid}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Credibility Markers */}
      {data.credibility_markers && data.credibility_markers.length > 0 && (
        <Card>
          <CardHeader className="bg-blue-50 border-b">
            <CardTitle className="text-sm font-semibold text-blue-700">Credibility Markers</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-2">
            {data.credibility_markers.map((marker, i) => (
              <div key={i} className="flex items-center justify-between p-2 bg-blue-50/50 rounded">
                <span className="text-sm text-slate-700">{marker.signal}</span>
                <div className="flex items-center gap-2">
                  <Badge variant={marker.importance === 'critical' ? 'destructive' : 'outline'}>
                    {marker.importance}
                  </Badge>
                  <span className="text-xs text-slate-500">{marker.current_status}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Trust Journey */}
      {data.trust_journey && (
        <Card>
          <CardHeader className="bg-purple-50 border-b">
            <CardTitle className="text-sm font-semibold text-purple-700">Trust Journey</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3 text-sm">
            <div className="p-3 bg-purple-50/50 rounded">
              <p className="text-xs font-medium text-purple-700 uppercase">First Touchpoint Goal</p>
              <p className="text-slate-700">{data.trust_journey.first_touchpoint_goal}</p>
            </div>
            {data.trust_journey.mid_journey_reassurance && (
              <div className="p-3 bg-purple-50/50 rounded">
                <p className="text-xs font-medium text-purple-700 uppercase">Mid-Journey Reassurance</p>
                <ul className="space-y-1">
                  {data.trust_journey.mid_journey_reassurance.map((r, i) => (
                    <li key={i} className="text-slate-700">• {r}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="p-3 bg-purple-50/50 rounded">
              <p className="text-xs font-medium text-purple-700 uppercase">Pre-Purchase Push</p>
              <p className="text-slate-700">{data.trust_journey.pre_purchase_push}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function JTBDContextTab({ data }: { data?: JTBDContext | null }) {
  if (!data) {
    return <EmptyState message="JTBD Context not generated yet" />;
  }

  return (
    <div className="space-y-6">
      {/* Job Contexts */}
      {data.job_contexts && data.job_contexts.length > 0 && (
        <div className="space-y-4">
          {data.job_contexts.map((job, i) => (
            <Card key={i}>
              <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-600" />
                  {job.job_name}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                {/* Hire Triggers */}
                {job.hire_triggers && job.hire_triggers.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase mb-2">Hire Triggers</p>
                    <div className="space-y-2">
                      {job.hire_triggers.map((trigger, j) => (
                        <div key={j} className="p-2 bg-amber-50 rounded text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-amber-900">{trigger.situation}</span>
                            <Badge variant="outline">{trigger.urgency}</Badge>
                          </div>
                          <p className="text-slate-600 text-xs">{trigger.emotional_state} • {trigger.frequency}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Competing Solutions */}
                {job.competing_solutions && job.competing_solutions.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase mb-2">Competing Solutions</p>
                    <div className="space-y-2">
                      {job.competing_solutions.map((sol, j) => (
                        <div key={j} className="p-2 bg-blue-50 rounded text-sm">
                          <p className="font-medium text-blue-900">{sol.alternative}</p>
                          <p className="text-slate-600 text-xs">Why chosen: {sol.why_chosen}</p>
                          <p className="text-emerald-700 text-xs">Your advantage: {sol.your_advantage}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Success Metrics */}
                {job.success_metrics && (
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase mb-2">Success Metrics</p>
                    <div className="p-3 bg-emerald-50 rounded text-sm">
                      {job.success_metrics.how_measured && (
                        <div className="mb-2">
                          <p className="text-xs font-medium text-emerald-700">How Measured:</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {job.success_metrics.how_measured.map((m, k) => (
                              <span key={k} className="px-2 py-0.5 text-xs bg-emerald-100 text-emerald-700 rounded">{m}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      <p className="text-slate-700"><strong>Short-term:</strong> {job.success_metrics.short_term_success}</p>
                      <p className="text-slate-700"><strong>Long-term:</strong> {job.success_metrics.long_term_success}</p>
                    </div>
                  </div>
                )}

                {/* Hiring Anxieties */}
                {job.hiring_anxieties && job.hiring_anxieties.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase mb-2">Hiring Anxieties</p>
                    <div className="space-y-2">
                      {job.hiring_anxieties.map((anxiety, j) => (
                        <div key={j} className="p-2 bg-rose-50 rounded text-sm">
                          <p className="font-medium text-rose-900">{anxiety.anxiety}</p>
                          <p className="text-slate-600 text-xs">Rooted in: {anxiety.rooted_in}</p>
                          <p className="text-emerald-700 text-xs">Address by: {anxiety.how_to_address}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Job Priority Ranking */}
      {data.job_priority_ranking && data.job_priority_ranking.length > 0 && (
        <Card>
          <CardHeader className="bg-purple-50 border-b">
            <CardTitle className="text-sm font-semibold text-purple-700">Job Priority Ranking</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-2">
            {data.job_priority_ranking.map((rank, i) => (
              <div key={i} className="flex items-center justify-between p-2 bg-purple-50/50 rounded">
                <span className="text-sm text-slate-700">{rank.job_name}</span>
                <div className="flex items-center gap-2">
                  <Badge variant="default">#{rank.priority}</Badge>
                  <span className="text-xs text-slate-500">{rank.reasoning}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Job Dependencies */}
      {data.job_dependencies && data.job_dependencies.length > 0 && (
        <Card>
          <CardHeader className="bg-indigo-50 border-b">
            <CardTitle className="text-sm font-semibold text-indigo-700">Job Dependencies</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-2">
            {data.job_dependencies.map((dep, i) => (
              <div key={i} className="p-2 bg-indigo-50/50 rounded text-sm">
                <p className="text-indigo-900">
                  <strong>{dep.primary_job}</strong> → {dep.enables_job}
                </p>
                <p className="text-slate-600 text-xs">{dep.relationship}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Helper Components

// Awareness Level Card with explanation
function AwarenessCard({
  level,
  reasoning,
}: {
  level: string;
  reasoning?: string;
}) {
  // Define awareness level metadata
  const levelMeta: Record<string, { label: string; description: string; color: string; progress: number }> = {
    unaware: {
      label: "Unaware",
      description: "Doesn't recognize they have a problem that needs solving",
      color: "slate",
      progress: 10,
    },
    problem_aware: {
      label: "Problem Aware",
      description: "Recognizes the problem but doesn't know solutions exist",
      color: "rose",
      progress: 25,
    },
    solution_aware: {
      label: "Solution Aware",
      description: "Knows solutions exist but doesn't know about your brand",
      color: "amber",
      progress: 50,
    },
    product_aware: {
      label: "Product Aware",
      description: "Knows your brand but hasn't made a purchase decision",
      color: "blue",
      progress: 75,
    },
    most_aware: {
      label: "Most Aware",
      description: "Ready to buy or a returning customer",
      color: "emerald",
      progress: 95,
    },
  };

  const meta = levelMeta[level] || {
    label: level.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
    description: "",
    color: "slate",
    progress: 50,
  };

  const colorStyles: Record<string, string> = {
    slate: "border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100/50",
    rose: "border-rose-200 bg-gradient-to-br from-rose-50 to-rose-100/50",
    amber: "border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100/50",
    blue: "border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100/50",
    emerald: "border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100/50",
  };

  const progressColors: Record<string, string> = {
    slate: "bg-slate-400",
    rose: "bg-rose-500",
    amber: "bg-amber-500",
    blue: "bg-blue-500",
    emerald: "bg-emerald-500",
  };

  const badgeColors: Record<string, string> = {
    slate: "bg-slate-100 text-slate-700",
    rose: "bg-rose-100 text-rose-700",
    amber: "bg-amber-100 text-amber-700",
    blue: "bg-blue-100 text-blue-700",
    emerald: "bg-emerald-100 text-emerald-700",
  };

  return (
    <Card className={cn("border col-span-2", colorStyles[meta.color])}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Target className="w-4 h-4" />
            Awareness Level
          </CardTitle>
          <Badge className={badgeColors[meta.color]}>
            {meta.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Progress bar */}
        <div className="space-y-1">
          <div className="h-2 bg-white/60 rounded-full overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all", progressColors[meta.color])}
              style={{ width: `${meta.progress}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-500 px-0.5">
            <span>Unaware</span>
            <span>Problem</span>
            <span>Solution</span>
            <span>Product</span>
            <span>Most</span>
          </div>
        </div>

        {/* Generic description */}
        <p className="text-xs text-slate-600">{meta.description}</p>

        {/* Specific reasoning from AI */}
        {reasoning && (
          <div className="pt-2 border-t border-slate-200/50">
            <p className="text-xs font-medium text-slate-500 uppercase mb-1">Why This Level?</p>
            <p className="text-sm text-slate-700">{reasoning}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function InfoCard({
  title,
  content,
  icon: Icon,
  color,
}: {
  title: string;
  content?: string;
  icon: typeof Users;
  color: "blue" | "purple" | "indigo" | "emerald" | "rose" | "amber" | "slate";
}) {
  const colorStyles = {
    blue: "from-blue-50 to-blue-100/50 border-blue-200 text-blue-700",
    purple: "from-purple-50 to-purple-100/50 border-purple-200 text-purple-700",
    indigo: "from-indigo-50 to-indigo-100/50 border-indigo-200 text-indigo-700",
    emerald: "from-emerald-50 to-emerald-100/50 border-emerald-200 text-emerald-700",
    rose: "from-rose-50 to-rose-100/50 border-rose-200 text-rose-700",
    amber: "from-amber-50 to-amber-100/50 border-amber-200 text-amber-700",
    slate: "from-slate-50 to-slate-100/50 border-slate-200 text-slate-700",
  };

  if (!content) {
    return (
      <Card className="border-dashed border-slate-300 bg-slate-50/50">
        <CardContent className="p-6 text-center text-slate-400">
          <Icon className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">{title} not available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("border bg-gradient-to-br", colorStyles[color])}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Icon className="w-4 h-4" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-slate-700 whitespace-pre-wrap">{content}</p>
      </CardContent>
    </Card>
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

function ListCard({
  title,
  items,
  color,
  icon: Icon,
  fieldName = "name",
}: {
  title: string;
  items?: unknown[];
  color: "blue" | "purple" | "emerald" | "rose" | "amber" | "slate";
  icon: typeof Users;
  fieldName?: string;
}) {
  const dotColors = {
    blue: "bg-blue-500",
    purple: "bg-purple-500",
    emerald: "bg-emerald-500",
    rose: "bg-rose-500",
    amber: "bg-amber-500",
    slate: "bg-slate-500",
  };

  const headerColors = {
    blue: "text-blue-700 bg-blue-50",
    purple: "text-purple-700 bg-purple-50",
    emerald: "text-emerald-700 bg-emerald-50",
    rose: "text-rose-700 bg-rose-50",
    amber: "text-amber-700 bg-amber-50",
    slate: "text-slate-700 bg-slate-50",
  };

  if (!items || items.length === 0) {
    return (
      <Card className="border-dashed border-slate-300 bg-slate-50/50">
        <CardContent className="p-6 text-center text-slate-400">
          <Icon className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">{title} not available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className={cn("py-3 px-4", headerColors[color])}>
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Icon className="w-4 h-4" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <ul className="space-y-2">
          {items.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
              <span className={cn("w-1.5 h-1.5 rounded-full mt-2 shrink-0", dotColors[color])} />
              {getItemText(item, fieldName)}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function PainCard({
  pain,
  isTop = false,
}: {
  pain: NonNullable<ExplorerData["selectedSegment"]>["pains"][0];
  isTop?: boolean;
}) {
  return (
    <Card className={cn(
      "transition-all",
      isTop ? "border-amber-200 bg-amber-50/30" : ""
    )}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              {isTop && <Star className="w-4 h-4 text-amber-500 fill-amber-500" />}
              <h4 className="font-semibold text-slate-900">{pain.name}</h4>
            </div>
            <p className="text-sm text-slate-600 line-clamp-3">{pain.description}</p>
          </div>
          <Badge variant={isTop ? "default" : "secondary"} className={cn(
            "shrink-0",
            isTop ? "bg-amber-500" : ""
          )}>
            {pain.impact_score}/10
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-slate-400">
      <AlertCircle className="w-12 h-12 mb-3 opacity-50" />
      <p>{message}</p>
    </div>
  );
}
