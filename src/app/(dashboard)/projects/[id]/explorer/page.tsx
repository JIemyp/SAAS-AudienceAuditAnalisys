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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { useTranslation } from "@/lib/hooks/useTranslation";

interface SegmentSummary {
  id: string;
  name: string;
  description: string;
  sociodemographics?: string;
  order_index: number;
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
      customer_journey?: unknown;
      emotional_map?: unknown;
      narrative_angles?: unknown;
      messaging_framework?: unknown;
      voice_and_tone?: unknown;
    }>;
  } | null;
}

type TabId = "overview" | "jobs" | "preferences" | "difficulties" | "triggers" | "pains" | "canvas";

const tabs: Array<{ id: TabId; label: string; icon: typeof Users }> = [
  { id: "overview", label: "Overview", icon: Users },
  { id: "jobs", label: "Jobs", icon: Briefcase },
  { id: "preferences", label: "Preferences", icon: Heart },
  { id: "difficulties", label: "Difficulties", icon: AlertTriangle },
  { id: "triggers", label: "Triggers", icon: Zap },
  { id: "pains", label: "Pains", icon: Target },
  { id: "canvas", label: "Canvas", icon: Palette },
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
      <aside className="w-72 bg-slate-50 border-r border-slate-200 p-4 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            Segments
          </h3>
          <Badge variant="secondary">{data.segments.length}</Badge>
        </div>

        <nav className="space-y-1">
          {data.segments.map((segment) => {
            const isActive = segment.id === displaySegment?.id;
            return (
              <button
                key={segment.id}
                onClick={() => handleSegmentChange(segment.id)}
                className={cn(
                  "w-full text-left px-3 py-2.5 rounded-lg transition-all duration-200",
                  "flex items-center gap-3 group",
                  isActive
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-slate-700 hover:bg-white hover:shadow-sm"
                )}
              >
                <span
                  className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold shrink-0",
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-blue-100 text-blue-700"
                  )}
                >
                  {segment.order_index + 1}
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
                    isActive ? "text-white/70" : "text-slate-300 group-hover:text-slate-500"
                  )}
                />
              </button>
            );
          })}
        </nav>
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
              <InfoCard
                title="Awareness Level"
                content={details.awareness_level.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                icon={Target}
                color="amber"
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
                <>
                  <div className="col-span-2 border-t border-slate-200 pt-4 mt-2">
                    <h3 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
                      <Palette className="w-5 h-5 text-indigo-600" />
                      Deep Psychological Analysis
                    </h3>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 mb-2">Customer Journey</h4>
                    <p className="text-sm text-slate-600 whitespace-pre-wrap">{renderContent(extended.customer_journey)}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 mb-2">Emotional Map</h4>
                    <p className="text-sm text-slate-600 whitespace-pre-wrap">{renderContent(extended.emotional_map)}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 mb-2">Narrative Angles</h4>
                    <p className="text-sm text-slate-600 whitespace-pre-wrap">{renderContent(extended.narrative_angles)}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 mb-2">Messaging Framework</h4>
                    <p className="text-sm text-slate-600 whitespace-pre-wrap">{renderContent(extended.messaging_framework)}</p>
                  </div>
                  <div className="col-span-2">
                    <h4 className="text-sm font-semibold text-slate-900 mb-2">Voice & Tone</h4>
                    <p className="text-sm text-slate-600 whitespace-pre-wrap">{renderContent(extended.voice_and_tone)}</p>
                  </div>
                </>
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

// Helper Components
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
