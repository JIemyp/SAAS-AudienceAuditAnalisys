"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  AlertCircle,
  Target,
  Globe,
  Megaphone,
  TrendingUp,
  Lightbulb,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  ChevronRight,
  BarChart3,
  Mail,
  MessageSquare,
  Share2,
  Image,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  StrategySummary,
  StrategyPersonalized,
  StrategyGlobal,
  StrategyAds,
  Segment,
} from "@/types";

type TabId = "summary" | "personalized" | "global" | "ads";

interface StrategyData {
  segments: Array<{
    id: string;
    name: string;
    topPains: Array<{ id: string; name: string; impact_score: number }>;
  }>;
  summary: {
    draft: StrategySummary | null;
    approved: StrategySummary | null;
  };
  personalized: Record<string, Record<string, {
    draft: StrategyPersonalized | null;
    approved: StrategyPersonalized | null;
  }>>;
  global: {
    draft: StrategyGlobal | null;
    approved: StrategyGlobal | null;
  };
  ads: Record<string, Record<string, {
    draft: StrategyAds | null;
    approved: StrategyAds | null;
  }>>;
}

export default function StrategyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = use(params);
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<TabId>("summary");
  const [data, setData] = useState<StrategyData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState<string | null>(null);
  const [approving, setApproving] = useState<string | null>(null);

  // Selection state
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);
  const [selectedPainId, setSelectedPainId] = useState<string | null>(null);

  const tabs: Array<{ id: TabId; label: string; icon: typeof Target }> = [
    { id: "summary", label: "Strategy Summary", icon: TrendingUp },
    { id: "personalized", label: "Personalized Funnel", icon: Target },
    { id: "global", label: "Global Strategy", icon: Globe },
    { id: "ads", label: "Ads Strategy", icon: Megaphone },
  ];

  useEffect(() => {
    fetchData();
  }, [projectId]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch segments with top pains
      const segmentsRes = await fetch(`/api/segments?projectId=${projectId}`);
      const segmentsData = await segmentsRes.json();

      if (!segmentsRes.ok) throw new Error(segmentsData.error);

      // Fetch top pains for each segment
      const segments = await Promise.all(
        (segmentsData.segments || []).map(async (segment: Segment) => {
          const painsRes = await fetch(
            `/api/pains?projectId=${projectId}&segmentId=${segment.id}&topOnly=true`
          );
          const painsData = await painsRes.json();
          return {
            id: segment.id,
            name: segment.name,
            topPains: painsData.pains || [],
          };
        })
      );

      // Fetch strategy summary
      const [summaryDraftRes, summaryApprovedRes] = await Promise.all([
        fetch(`/api/drafts/strategy-summary?projectId=${projectId}`),
        fetch(`/api/approved/strategy-summary?projectId=${projectId}`),
      ]);

      const summaryDraft = summaryDraftRes.ok ? (await summaryDraftRes.json()).draft : null;
      const summaryApproved = summaryApprovedRes.ok ? (await summaryApprovedRes.json()).approved : null;

      // Fetch global strategy
      const [globalDraftRes, globalApprovedRes] = await Promise.all([
        fetch(`/api/drafts/strategy-global?projectId=${projectId}`),
        fetch(`/api/approved/strategy-global?projectId=${projectId}`),
      ]);

      const globalDraft = globalDraftRes.ok ? (await globalDraftRes.json()).draft : null;
      const globalApproved = globalApprovedRes.ok ? (await globalApprovedRes.json()).approved : null;

      // Fetch personalized and ads per segment × pain
      const personalized: StrategyData["personalized"] = {};
      const ads: StrategyData["ads"] = {};

      for (const segment of segments) {
        personalized[segment.id] = {};
        ads[segment.id] = {};

        for (const pain of segment.topPains) {
          // Personalized
          const [persoDraftRes, persoApprovedRes] = await Promise.all([
            fetch(`/api/drafts/strategy-personalized?projectId=${projectId}&segmentId=${segment.id}&painId=${pain.id}`),
            fetch(`/api/approved/strategy-personalized?projectId=${projectId}&segmentId=${segment.id}&painId=${pain.id}`),
          ]);

          personalized[segment.id][pain.id] = {
            draft: persoDraftRes.ok ? (await persoDraftRes.json()).draft : null,
            approved: persoApprovedRes.ok ? (await persoApprovedRes.json()).approved : null,
          };

          // Ads
          const [adsDraftRes, adsApprovedRes] = await Promise.all([
            fetch(`/api/drafts/strategy-ads?projectId=${projectId}&segmentId=${segment.id}&painId=${pain.id}`),
            fetch(`/api/approved/strategy-ads?projectId=${projectId}&segmentId=${segment.id}&painId=${pain.id}`),
          ]);

          ads[segment.id][pain.id] = {
            draft: adsDraftRes.ok ? (await adsDraftRes.json()).draft : null,
            approved: adsApprovedRes.ok ? (await adsApprovedRes.json()).approved : null,
          };
        }
      }

      setData({
        segments,
        summary: { draft: summaryDraft, approved: summaryApproved },
        personalized,
        global: { draft: globalDraft, approved: globalApproved },
        ads,
      });

      // Set default selections
      if (segments.length > 0) {
        setSelectedSegmentId(segments[0].id);
        if (segments[0].topPains.length > 0) {
          setSelectedPainId(segments[0].topPains[0].id);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = async (type: "summary" | "personalized" | "global" | "ads") => {
    try {
      setGenerating(type);

      let endpoint = "";
      let body: Record<string, string> = { projectId };

      switch (type) {
        case "summary":
          endpoint = "/api/generate/strategy-summary";
          break;
        case "personalized":
          endpoint = "/api/generate/strategy-personalized";
          body.segmentId = selectedSegmentId!;
          body.painId = selectedPainId!;
          break;
        case "global":
          endpoint = "/api/generate/strategy-global";
          break;
        case "ads":
          endpoint = "/api/generate/strategy-ads";
          body.segmentId = selectedSegmentId!;
          body.painId = selectedPainId!;
          break;
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Generation failed");
      }

      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setGenerating(null);
    }
  };

  const handleApprove = async (type: "summary" | "personalized" | "global" | "ads", draftId: string) => {
    try {
      setApproving(type);

      let endpoint = "";
      let body: Record<string, string> = { projectId, draftId };

      switch (type) {
        case "summary":
          endpoint = "/api/approve/strategy-summary";
          break;
        case "personalized":
          endpoint = "/api/approve/strategy-personalized";
          body.segmentId = selectedSegmentId!;
          body.painId = selectedPainId!;
          break;
        case "global":
          endpoint = "/api/approve/strategy-global";
          break;
        case "ads":
          endpoint = "/api/approve/strategy-ads";
          body.segmentId = selectedSegmentId!;
          body.painId = selectedPainId!;
          break;
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Approval failed");
      }

      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Approval failed");
    } finally {
      setApproving(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertCircle className="w-12 h-12 text-red-400" />
        <p className="text-slate-600">{error}</p>
        <Button onClick={fetchData}>Retry</Button>
      </div>
    );
  }

  const selectedSegment = data?.segments.find((s) => s.id === selectedSegmentId);
  const selectedPain = selectedSegment?.topPains.find((p) => p.id === selectedPainId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl text-white shadow-lg">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Strategy</h1>
            <p className="text-slate-500">
              AI-powered marketing strategy for your audience
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
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
                    ? "border-purple-600 text-purple-600"
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

      {/* Segment/Pain Selector for personalized and ads tabs */}
      {(activeTab === "personalized" || activeTab === "ads") && data?.segments && (
        <div className="flex gap-4 p-4 bg-slate-50 rounded-xl">
          <div className="flex-1">
            <label className="text-xs font-medium text-slate-500 uppercase mb-2 block">
              Segment
            </label>
            <div className="flex flex-wrap gap-2">
              {data.segments.map((segment) => (
                <button
                  key={segment.id}
                  onClick={() => {
                    setSelectedSegmentId(segment.id);
                    if (segment.topPains.length > 0) {
                      setSelectedPainId(segment.topPains[0].id);
                    } else {
                      setSelectedPainId(null);
                    }
                  }}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                    selectedSegmentId === segment.id
                      ? "bg-purple-600 text-white"
                      : "bg-white text-slate-700 hover:bg-slate-100 border"
                  )}
                >
                  {segment.name}
                </button>
              ))}
            </div>
          </div>

          {selectedSegment && selectedSegment.topPains.length > 0 && (
            <div className="flex-1">
              <label className="text-xs font-medium text-slate-500 uppercase mb-2 block">
                Top Pain
              </label>
              <div className="flex flex-wrap gap-2">
                {selectedSegment.topPains.map((pain) => (
                  <button
                    key={pain.id}
                    onClick={() => setSelectedPainId(pain.id)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1",
                      selectedPainId === pain.id
                        ? "bg-amber-500 text-white"
                        : "bg-white text-slate-700 hover:bg-slate-100 border"
                    )}
                  >
                    {pain.name}
                    <Badge
                      variant={selectedPainId === pain.id ? "secondary" : "outline"}
                      className="ml-1"
                    >
                      {pain.impact_score}/10
                    </Badge>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* No top pains warning */}
      {(activeTab === "personalized" || activeTab === "ads") &&
        selectedSegment &&
        selectedSegment.topPains.length === 0 && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <p className="text-amber-700">
              No top pains found for this segment. Generate and approve pains first.
            </p>
          </div>
        )}

      {/* Tab Content */}
      {activeTab === "summary" && (
        <SummaryTab
          data={data?.summary}
          onGenerate={() => handleGenerate("summary")}
          onApprove={(draftId) => handleApprove("summary", draftId)}
          isGenerating={generating === "summary"}
          isApproving={approving === "summary"}
        />
      )}

      {activeTab === "personalized" && selectedSegmentId && selectedPainId && (
        <PersonalizedTab
          data={data?.personalized[selectedSegmentId]?.[selectedPainId]}
          segment={selectedSegment}
          pain={selectedPain}
          onGenerate={() => handleGenerate("personalized")}
          onApprove={(draftId) => handleApprove("personalized", draftId)}
          isGenerating={generating === "personalized"}
          isApproving={approving === "personalized"}
        />
      )}

      {activeTab === "global" && (
        <GlobalTab
          data={data?.global}
          onGenerate={() => handleGenerate("global")}
          onApprove={(draftId) => handleApprove("global", draftId)}
          isGenerating={generating === "global"}
          isApproving={approving === "global"}
        />
      )}

      {activeTab === "ads" && selectedSegmentId && selectedPainId && (
        <AdsTab
          data={data?.ads[selectedSegmentId]?.[selectedPainId]}
          segment={selectedSegment}
          pain={selectedPain}
          onGenerate={() => handleGenerate("ads")}
          onApprove={(draftId) => handleApprove("ads", draftId)}
          isGenerating={generating === "ads"}
          isApproving={approving === "ads"}
        />
      )}
    </div>
  );
}

// Tab Components

function SummaryTab({
  data,
  onGenerate,
  onApprove,
  isGenerating,
  isApproving,
}: {
  data?: { draft: StrategySummary | null; approved: StrategySummary | null };
  onGenerate: () => void;
  onApprove: (draftId: string) => void;
  isGenerating: boolean;
  isApproving: boolean;
}) {
  const content = data?.approved || data?.draft;
  const isDraft = !data?.approved && !!data?.draft;

  if (!content) {
    return (
      <EmptyState
        title="Strategy Summary"
        description="Generate a high-level strategy summary with growth bets, positioning pillars, and risk flags."
        onGenerate={onGenerate}
        isGenerating={isGenerating}
      />
    );
  }

  return (
    <div className="space-y-6">
      <StatusBar
        isDraft={isDraft}
        onGenerate={onGenerate}
        onApprove={() => onApprove((data?.draft as any)?.id)}
        isGenerating={isGenerating}
        isApproving={isApproving}
      />

      {/* Growth Bets */}
      {content.growth_bets && content.growth_bets.length > 0 && (
        <Card>
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-emerald-600" />
              Growth Bets
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {content.growth_bets.map((bet: any, i: number) => (
              <div key={i} className="p-4 bg-emerald-50/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-emerald-900">{bet.title}</h4>
                  <Badge variant="default" className="bg-emerald-600">
                    Score: {bet.score}
                  </Badge>
                </div>
                <p className="text-sm text-slate-600 mb-3">{bet.rationale}</p>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="font-medium text-slate-500">Jobs:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {bet.key_jobs?.map((j: string, k: number) => (
                        <span key={k} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                          {j}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium text-slate-500">Triggers:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {bet.key_triggers?.map((t: string, k: number) => (
                        <span key={k} className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium text-slate-500">Pains:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {bet.key_pains?.map((p: string, k: number) => (
                        <span key={k} className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded">
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Positioning Pillars */}
      {content.positioning_pillars && content.positioning_pillars.length > 0 && (
        <Card>
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-600" />
              Positioning Pillars
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {content.positioning_pillars.map((pillar: any, i: number) => (
              <div key={i} className="p-4 bg-blue-50/50 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">{pillar.pillar}</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-emerald-700">Proof Points:</span>
                    <ul className="mt-1 space-y-1">
                      {pillar.proof_points?.map((p: string, k: number) => (
                        <li key={k} className="text-slate-600">• {p}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <span className="font-medium text-rose-700">Objections:</span>
                    <ul className="mt-1 space-y-1">
                      {pillar.objections?.map((o: string, k: number) => (
                        <li key={k} className="text-slate-600">• {o}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Channel Priorities & Risk Flags */}
      <div className="grid grid-cols-2 gap-6">
        {content.channel_priorities && content.channel_priorities.length > 0 && (
          <Card>
            <CardHeader className="bg-purple-50 border-b">
              <CardTitle className="text-sm font-semibold text-purple-700">
                Channel Priorities
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2">
              {content.channel_priorities.map((ch: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-2 bg-purple-50/50 rounded">
                  <div>
                    <span className="font-medium text-purple-900">{ch.channel}</span>
                    <p className="text-xs text-slate-500">{ch.why}</p>
                  </div>
                  <Badge variant="default" className="bg-purple-600">
                    Fit: {ch.fit_score}/10
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {content.risk_flags && content.risk_flags.length > 0 && (
          <Card>
            <CardHeader className="bg-rose-50 border-b">
              <CardTitle className="text-sm font-semibold text-rose-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Risk Flags
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2">
              {content.risk_flags.map((risk: any, i: number) => (
                <div key={i} className="p-3 bg-rose-50/50 rounded">
                  <p className="font-medium text-rose-900">{risk.risk}</p>
                  <p className="text-xs text-slate-600">Impact: {risk.impact}</p>
                  <p className="text-xs text-emerald-700">Mitigation: {risk.mitigation}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function PersonalizedTab({
  data,
  segment,
  pain,
  onGenerate,
  onApprove,
  isGenerating,
  isApproving,
}: {
  data?: { draft: StrategyPersonalized | null; approved: StrategyPersonalized | null };
  segment?: { id: string; name: string };
  pain?: { id: string; name: string; impact_score: number };
  onGenerate: () => void;
  onApprove: (draftId: string) => void;
  isGenerating: boolean;
  isApproving: boolean;
}) {
  const content = data?.approved || data?.draft;
  const isDraft = !data?.approved && !!data?.draft;

  if (!content) {
    return (
      <EmptyState
        title="Personalized Funnel Strategy"
        description={`Generate TOF → MOF → BOF strategy for ${segment?.name} × ${pain?.name}`}
        onGenerate={onGenerate}
        isGenerating={isGenerating}
      />
    );
  }

  return (
    <div className="space-y-6">
      <StatusBar
        isDraft={isDraft}
        onGenerate={onGenerate}
        onApprove={() => onApprove((data?.draft as any)?.id)}
        isGenerating={isGenerating}
        isApproving={isApproving}
      />

      {/* TOF UGC Hooks */}
      {content.tof_ugc_hooks && content.tof_ugc_hooks.length > 0 && (
        <Card>
          <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-600" />
              TOF: UGC Hooks
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 grid grid-cols-2 gap-4">
            {content.tof_ugc_hooks.map((hook: any, i: number) => (
              <div key={i} className="p-4 bg-amber-50/50 rounded-lg">
                <Badge variant="outline" className="mb-2 capitalize">
                  {hook.hook_type?.replace(/_/g, " ")}
                </Badge>
                <p className="text-sm text-slate-700 mb-2">{hook.script_outline}</p>
                <p className="text-xs text-slate-500">
                  <strong>Emotional:</strong> {hook.emotional_angle}
                </p>
                <p className="text-xs text-slate-500">
                  <strong>Visual:</strong> {hook.visual_direction}
                </p>
                <p className="text-xs text-amber-700">
                  <strong>CTA:</strong> {hook.cta}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* MOF Quiz Flow */}
      {content.mof_quiz_flow && (
        <Card>
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-600" />
              MOF: Quiz Flow
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <h4 className="font-semibold text-blue-900 mb-2">{content.mof_quiz_flow.quiz_title}</h4>
            <p className="text-sm text-slate-600 mb-3">
              Lead Magnet: {content.mof_quiz_flow.lead_magnet}
            </p>
            <div className="space-y-2">
              {content.mof_quiz_flow.questions?.map((q: any, i: number) => (
                <div key={i} className="p-3 bg-blue-50/50 rounded">
                  <p className="font-medium text-sm text-blue-900">Q{i + 1}: {q.question}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {q.options?.map((opt: string, k: number) => (
                      <span key={k} className="px-2 py-0.5 text-xs bg-white text-slate-600 rounded border">
                        {opt}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* BOF Creative Briefs */}
      {content.bof_creative_briefs && content.bof_creative_briefs.length > 0 && (
        <Card>
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Image className="w-4 h-4 text-emerald-600" />
              BOF: Creative Briefs
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 grid grid-cols-2 gap-4">
            {content.bof_creative_briefs.map((brief: any, i: number) => (
              <div key={i} className="p-4 bg-emerald-50/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="capitalize">{brief.format}</Badge>
                  <Badge variant="secondary" className="capitalize">{brief.target_placement}</Badge>
                </div>
                <h4 className="font-semibold text-emerald-900">{brief.headline}</h4>
                <p className="text-sm text-slate-600 mt-1">{brief.body}</p>
                <p className="text-xs text-slate-500 mt-2">
                  <strong>Visual:</strong> {brief.visual_concept}
                </p>
                <p className="text-xs text-emerald-700">
                  <strong>CTA:</strong> {brief.cta}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* BOF Landing Structure */}
      {content.bof_landing_structure && (
        <Card>
          <CardHeader className="bg-purple-50 border-b">
            <CardTitle className="text-sm font-semibold text-purple-700">
              BOF: Landing Page Structure
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3 text-sm">
            <div className="p-3 bg-purple-50/50 rounded">
              <p className="font-medium text-purple-900">{content.bof_landing_structure.hero_headline}</p>
              <p className="text-slate-600">{content.bof_landing_structure.hero_subheadline}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-2 bg-rose-50 rounded">
                <span className="text-xs font-medium text-rose-700">Pain Section</span>
                <p className="text-slate-700">{content.bof_landing_structure.pain_section}</p>
              </div>
              <div className="p-2 bg-emerald-50 rounded">
                <span className="text-xs font-medium text-emerald-700">Solution Section</span>
                <p className="text-slate-700">{content.bof_landing_structure.solution_section}</p>
              </div>
              <div className="p-2 bg-blue-50 rounded">
                <span className="text-xs font-medium text-blue-700">Proof Section</span>
                <p className="text-slate-700">{content.bof_landing_structure.proof_section}</p>
              </div>
              <div className="p-2 bg-amber-50 rounded">
                <span className="text-xs font-medium text-amber-700">CTA Section</span>
                <p className="text-slate-700">{content.bof_landing_structure.cta_section}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function GlobalTab({
  data,
  onGenerate,
  onApprove,
  isGenerating,
  isApproving,
}: {
  data?: { draft: StrategyGlobal | null; approved: StrategyGlobal | null };
  onGenerate: () => void;
  onApprove: (draftId: string) => void;
  isGenerating: boolean;
  isApproving: boolean;
}) {
  const content = data?.approved || data?.draft;
  const isDraft = !data?.approved && !!data?.draft;

  if (!content) {
    return (
      <EmptyState
        title="Global Strategy"
        description="Generate brand-wide communication strategy: email, SMS, messenger, social, banners, traffic."
        onGenerate={onGenerate}
        isGenerating={isGenerating}
      />
    );
  }

  return (
    <div className="space-y-6">
      <StatusBar
        isDraft={isDraft}
        onGenerate={onGenerate}
        onApprove={() => onApprove((data?.draft as any)?.id)}
        isGenerating={isGenerating}
        isApproving={isApproving}
      />

      <div className="grid grid-cols-2 gap-6">
        {/* Email Strategy */}
        {content.email_strategy && (
          <Card>
            <CardHeader className="bg-blue-50 border-b">
              <CardTitle className="text-sm font-semibold text-blue-700 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Strategy
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2 text-sm">
              <p><strong>Cadence:</strong> {content.email_strategy.cadence}</p>
              <p className="text-slate-600">{content.email_strategy.sequence_overview}</p>
              {content.email_strategy.key_emails?.slice(0, 3).map((email: any, i: number) => (
                <div key={i} className="p-2 bg-blue-50/50 rounded">
                  <p className="font-medium">{email.name}</p>
                  <p className="text-xs text-slate-500">Subject: {email.subject_line}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* SMS Strategy */}
        {content.sms_strategy && (
          <Card>
            <CardHeader className="bg-emerald-50 border-b">
              <CardTitle className="text-sm font-semibold text-emerald-700 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                SMS Strategy
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2 text-sm">
              <p><strong>Timing:</strong> {content.sms_strategy.timing}</p>
              <div className="flex flex-wrap gap-1">
                {content.sms_strategy.use_cases?.map((uc: string, i: number) => (
                  <span key={i} className="px-2 py-0.5 text-xs bg-emerald-100 text-emerald-700 rounded">
                    {uc}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Social Strategy */}
        {content.social_strategy && (
          <Card>
            <CardHeader className="bg-purple-50 border-b">
              <CardTitle className="text-sm font-semibold text-purple-700 flex items-center gap-2">
                <Share2 className="w-4 h-4" />
                Social Strategy
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2 text-sm">
              <div className="flex flex-wrap gap-1 mb-2">
                {content.social_strategy.platforms?.map((p: string, i: number) => (
                  <Badge key={i} variant="outline">{p}</Badge>
                ))}
              </div>
              <p className="font-medium text-slate-700">Content Pillars:</p>
              <ul className="space-y-1">
                {content.social_strategy.content_pillars?.map((pillar: string, i: number) => (
                  <li key={i} className="text-slate-600">• {pillar}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Traffic Channels */}
        {content.traffic_channels && (
          <Card>
            <CardHeader className="bg-amber-50 border-b">
              <CardTitle className="text-sm font-semibold text-amber-700 flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Traffic Channels
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 text-sm">
              <p className="font-medium text-slate-700 mb-2">Priority:</p>
              <ol className="space-y-1">
                {content.traffic_channels.recommended_priority?.map((ch: string, i: number) => (
                  <li key={i} className="text-slate-600">{i + 1}. {ch}</li>
                ))}
              </ol>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function AdsTab({
  data,
  segment,
  pain,
  onGenerate,
  onApprove,
  isGenerating,
  isApproving,
}: {
  data?: { draft: StrategyAds | null; approved: StrategyAds | null };
  segment?: { id: string; name: string };
  pain?: { id: string; name: string; impact_score: number };
  onGenerate: () => void;
  onApprove: (draftId: string) => void;
  isGenerating: boolean;
  isApproving: boolean;
}) {
  const content = data?.approved || data?.draft;
  const isDraft = !data?.approved && !!data?.draft;

  if (!content) {
    return (
      <EmptyState
        title="Ads Strategy"
        description={`Generate multi-channel ads strategy for ${segment?.name} × ${pain?.name}`}
        onGenerate={onGenerate}
        isGenerating={isGenerating}
      />
    );
  }

  const channels = content.channels || {};

  return (
    <div className="space-y-6">
      <StatusBar
        isDraft={isDraft}
        onGenerate={onGenerate}
        onApprove={() => onApprove((data?.draft as any)?.id)}
        isGenerating={isGenerating}
        isApproving={isApproving}
      />

      <div className="grid grid-cols-2 gap-6">
        {Object.entries(channels).map(([channelName, config]: [string, any]) => (
          <Card key={channelName}>
            <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 border-b">
              <CardTitle className="text-sm font-semibold capitalize flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-slate-600" />
                {channelName} Ads
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-sm">
              <p><strong>Objective:</strong> {config.objective}</p>
              <p><strong>Targeting:</strong> {config.audience_targeting}</p>
              <p><strong>Budget:</strong> {config.budget_allocation}</p>

              {config.keyword_themes?.length > 0 && (
                <div>
                  <span className="font-medium text-slate-500">Keywords:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {config.keyword_themes.slice(0, 5).map((kw: string, i: number) => (
                      <span key={i} className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {config.ad_copy_templates?.length > 0 && (
                <div className="pt-2 border-t">
                  <span className="font-medium text-slate-500">Ad Copy:</span>
                  {config.ad_copy_templates.slice(0, 2).map((ad: any, i: number) => (
                    <div key={i} className="mt-2 p-2 bg-slate-50 rounded">
                      <p className="font-medium text-slate-900">{ad.headline}</p>
                      <p className="text-xs text-slate-600">{ad.description}</p>
                      <p className="text-xs text-purple-700">CTA: {ad.cta}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Helper Components

function EmptyState({
  title,
  description,
  onGenerate,
  isGenerating,
}: {
  title: string;
  description: string;
  onGenerate: () => void;
  isGenerating: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="p-4 bg-slate-100 rounded-full mb-4">
        <TrendingUp className="w-8 h-8 text-slate-400" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-500 mb-6 max-w-md">{description}</p>
      <Button onClick={onGenerate} disabled={isGenerating}>
        {isGenerating ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Zap className="w-4 h-4 mr-2" />
            Generate
          </>
        )}
      </Button>
    </div>
  );
}

function StatusBar({
  isDraft,
  onGenerate,
  onApprove,
  isGenerating,
  isApproving,
}: {
  isDraft: boolean;
  onGenerate: () => void;
  onApprove: () => void;
  isGenerating: boolean;
  isApproving: boolean;
}) {
  return (
    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
      <div className="flex items-center gap-2">
        {isDraft ? (
          <>
            <div className="w-2 h-2 bg-amber-500 rounded-full" />
            <span className="text-sm text-amber-700 font-medium">Draft</span>
          </>
        ) : (
          <>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="text-sm text-emerald-700 font-medium">Approved</span>
          </>
        )}
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onGenerate} disabled={isGenerating}>
          {isGenerating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          <span className="ml-2">Regenerate</span>
        </Button>
        {isDraft && (
          <Button size="sm" onClick={onApprove} disabled={isApproving}>
            {isApproving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            <span className="ml-2">Approve</span>
          </Button>
        )}
      </div>
    </div>
  );
}
