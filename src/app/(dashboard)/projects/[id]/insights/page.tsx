"use client";

import { use, useState, useEffect } from "react";
import {
  Loader2,
  AlertCircle,
  Sparkles,
  Target,
  Lightbulb,
  CheckCircle2,
  RefreshCw,
  Database,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  InsightsExecutive,
  InsightsSnapshot,
  InsightsRadar,
  Segment,
} from "@/types";

type TabId = "executive" | "snapshots" | "radar";

interface InsightsData {
  segments: Array<{
    id: string;
    name: string;
  }>;
  executive: {
    draft: InsightsExecutive | null;
    approved: InsightsExecutive | null;
  };
  snapshots: Record<string, {
    draft: InsightsSnapshot | null;
    approved: InsightsSnapshot | null;
  }>;
  radar: {
    draft: InsightsRadar | null;
    approved: InsightsRadar | null;
  };
}

const tabs: Array<{ id: TabId; label: string; icon: typeof Sparkles }> = [
  { id: "executive", label: "Executive Summary", icon: Sparkles },
  { id: "snapshots", label: "Segment Snapshots", icon: Target },
  { id: "radar", label: "Opportunity Radar", icon: Lightbulb },
];

export default function InsightsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = use(params);

  const [activeTab, setActiveTab] = useState<TabId>("executive");
  const [data, setData] = useState<InsightsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState<string | null>(null);
  const [approving, setApproving] = useState<string | null>(null);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [projectId]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch segments
      const segmentsRes = await fetch(`/api/segments?projectId=${projectId}`);
      const segmentsData = await segmentsRes.json();
      if (!segmentsRes.ok) throw new Error(segmentsData.error);

      const segments = (segmentsData.segments || []).map((s: Segment) => ({
        id: s.id,
        name: s.name,
      }));

      // Set first segment as selected for snapshots tab
      if (segments.length > 0 && !selectedSegmentId) {
        setSelectedSegmentId(segments[0].id);
      }

      // Fetch executive summary
      const [executiveDraftRes, executiveApprovedRes] = await Promise.all([
        fetch(`/api/drafts/insights-executive?projectId=${projectId}`),
        fetch(`/api/approved/insights-executive?projectId=${projectId}`),
      ]);

      const executiveDraft = executiveDraftRes.ok ? (await executiveDraftRes.json()).draft : null;
      const executiveApproved = executiveApprovedRes.ok ? (await executiveApprovedRes.json()).approved : null;

      // Fetch snapshots per segment
      const snapshots: InsightsData["snapshots"] = {};
      for (const segment of segments) {
        const [snapshotDraftRes, snapshotApprovedRes] = await Promise.all([
          fetch(`/api/drafts/insights-snapshots?projectId=${projectId}&segmentId=${segment.id}`),
          fetch(`/api/approved/insights-snapshots?projectId=${projectId}&segmentId=${segment.id}`),
        ]);

        snapshots[segment.id] = {
          draft: snapshotDraftRes.ok ? (await snapshotDraftRes.json()).draft : null,
          approved: snapshotApprovedRes.ok ? (await snapshotApprovedRes.json()).approved : null,
        };
      }

      // Fetch radar
      const [radarDraftRes, radarApprovedRes] = await Promise.all([
        fetch(`/api/drafts/insights-radar?projectId=${projectId}`),
        fetch(`/api/approved/insights-radar?projectId=${projectId}`),
      ]);

      const radarDraft = radarDraftRes.ok ? (await radarDraftRes.json()).draft : null;
      const radarApproved = radarApprovedRes.ok ? (await radarApprovedRes.json()).approved : null;

      setData({
        segments,
        executive: { draft: executiveDraft, approved: executiveApproved },
        snapshots,
        radar: { draft: radarDraft, approved: radarApproved },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = async (type: TabId) => {
    try {
      setGenerating(type);
      setError(null);

      let endpoint = "";
      let body: Record<string, string> = { projectId };

      switch (type) {
        case "executive":
          endpoint = "/api/generate/insights-executive";
          break;
        case "snapshots":
          if (!selectedSegmentId) throw new Error("Please select a segment");
          endpoint = "/api/generate/insights-snapshots";
          body.segmentId = selectedSegmentId;
          break;
        case "radar":
          endpoint = "/api/generate/insights-radar";
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

  const handleApprove = async (type: TabId, draftId: string) => {
    try {
      setApproving(type);
      setError(null);

      let endpoint = "";
      let body: Record<string, string> = { projectId, draftId };

      switch (type) {
        case "executive":
          endpoint = "/api/approve/insights-executive";
          break;
        case "snapshots":
          if (!selectedSegmentId) throw new Error("Please select a segment");
          endpoint = "/api/approve/insights-snapshots";
          body.segmentId = selectedSegmentId;
          break;
        case "radar":
          endpoint = "/api/approve/insights-radar";
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

  if (error && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertCircle className="w-12 h-12 text-red-400" />
        <p className="text-slate-600">{error}</p>
        <Button onClick={fetchData}>Retry</Button>
      </div>
    );
  }

  const hasNoSegments = !data?.segments || data.segments.length === 0;

  const getCurrentData = () => {
    switch (activeTab) {
      case "executive":
        return data?.executive;
      case "snapshots":
        return selectedSegmentId ? data?.snapshots[selectedSegmentId] : null;
      case "radar":
        return data?.radar;
    }
  };

  const currentData = getCurrentData();
  const isDraft = !!currentData?.draft && !currentData?.approved;
  const displayData = currentData?.approved || currentData?.draft;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs uppercase tracking-wider text-text-secondary mb-1">Project</p>
        <h1 className="text-3xl font-semibold text-text-primary">Insights & Takeaways</h1>
        <p className="mt-2 text-text-secondary max-w-3xl">
          Strategic insights derived from approved research data. Each insight includes evidence sources and validation metrics.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

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

      {/* Segment Selector for Snapshots */}
      {activeTab === "snapshots" && data?.segments && data.segments.length > 0 && (
        <div className="p-4 bg-slate-50 rounded-xl">
          <label className="text-xs font-medium text-slate-500 uppercase mb-2 block">Segment</label>
          <div className="flex flex-wrap gap-2">
            {data.segments.map((segment) => (
              <button
                key={segment.id}
                onClick={() => setSelectedSegmentId(segment.id)}
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
      )}

      {/* Content */}
      {hasNoSegments ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <AlertTriangle className="w-12 h-12 text-amber-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Segments Found</h3>
            <p className="text-slate-500 text-center max-w-md mb-6">
              You need to generate and approve segments before creating insights.
            </p>
            <Button onClick={() => window.location.href = `/projects/${projectId}/generate/segments`}>
              Go to Segments
            </Button>
          </CardContent>
        </Card>
      ) : !displayData ? (
        <EmptyState
          title={activeTab === "executive" ? "Executive Summary" : activeTab === "snapshots" ? "Segment Snapshot" : "Opportunity Radar"}
          description={
            activeTab === "executive"
              ? "Generate strategic growth bets and segment priorities"
              : activeTab === "snapshots"
              ? "Create a concise snapshot for this segment"
              : "Identify gaps and risks across your research"
          }
          onGenerate={() => handleGenerate(activeTab)}
          isGenerating={generating === activeTab}
        />
      ) : (
        <div className="space-y-6">
          {/* Status Bar */}
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
              <Button variant="outline" size="sm" onClick={() => handleGenerate(activeTab)} disabled={generating === activeTab}>
                {generating === activeTab ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                <span className="ml-2">Regenerate</span>
              </Button>
              {isDraft && currentData?.draft?.id && (
                <Button size="sm" onClick={() => handleApprove(activeTab, currentData.draft!.id)} disabled={approving === activeTab}>
                  {approving === activeTab ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span className="ml-2">Approve</span>
                </Button>
              )}
            </div>
          </div>

          {/* Content Display */}
          {activeTab === "executive" && displayData && (
            <ExecutiveSummaryView data={displayData as InsightsExecutive} />
          )}

          {activeTab === "snapshots" && displayData && (
            <SegmentSnapshotView data={displayData as InsightsSnapshot} />
          )}

          {activeTab === "radar" && displayData && (
            <OpportunityRadarView data={displayData as InsightsRadar} />
          )}
        </div>
      )}
    </div>
  );
}

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
    <Card className="border-2 border-dashed border-purple-200 bg-purple-50/50">
      <CardContent className="flex flex-col items-center justify-center py-16">
        <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mb-6">
          <Sparkles className="w-8 h-8 text-purple-500" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Generate {title}</h3>
        <p className="text-slate-500 text-center max-w-md mb-6">{description}</p>
        <Button onClick={onGenerate} disabled={isGenerating} isLoading={isGenerating} className="gap-2">
          <Sparkles className="w-4 h-4" />
          Generate
        </Button>
      </CardContent>
    </Card>
  );
}

function ExecutiveSummaryView({ data }: { data: InsightsExecutive }) {
  return (
    <div className="space-y-6">
      {/* Growth Bets */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            Growth Bets
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.growth_bets?.map((bet, idx) => (
            <div key={idx} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-semibold text-slate-900">{bet.title}</h4>
                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                  Score: {bet.score}
                </Badge>
              </div>
              <p className="text-sm text-slate-600 mb-3">{bet.rationale}</p>
              <div className="grid grid-cols-3 gap-4 text-xs">
                <div>
                  <p className="font-medium text-slate-500 mb-1">Key Jobs</p>
                  <ul className="space-y-1">
                    {bet.key_jobs?.slice(0, 3).map((job, i) => (
                      <li key={i} className="text-slate-600">• {job}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="font-medium text-slate-500 mb-1">Key Triggers</p>
                  <ul className="space-y-1">
                    {bet.key_triggers?.slice(0, 3).map((trigger, i) => (
                      <li key={i} className="text-slate-600">• {trigger}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="font-medium text-slate-500 mb-1">Key Pains</p>
                  <ul className="space-y-1">
                    {bet.key_pains?.slice(0, 3).map((pain, i) => (
                      <li key={i} className="text-slate-600">• {pain}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Segment Priorities */}
      <Card>
        <CardHeader>
          <CardTitle>Segment Priorities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.segment_priorities?.map((priority, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-medium text-slate-900">{priority.segment_name}</p>
                  <p className="text-xs text-slate-500 mt-1">{priority.market_size_estimate}</p>
                </div>
                <div className="text-right">
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    {priority.priority_score}
                  </Badge>
                  <p className="text-xs text-slate-500 mt-1 capitalize">{priority.urgency_level}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Positioning Summary */}
      {data.positioning_summary && (
        <Card>
          <CardHeader>
            <CardTitle>Positioning Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-2">Value Proposition</p>
              <p className="text-slate-700">{data.positioning_summary.value_proposition}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 mb-2">Differentiation</p>
              <p className="text-slate-700">{data.positioning_summary.differentiation}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 mb-2">Pillars</p>
              <ul className="space-y-1">
                {data.positioning_summary.pillars?.map((pillar, i) => (
                  <li key={i} className="text-slate-700">• {pillar}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Evidence Sources & Validation Metrics */}
      <EvidenceAndValidation data={data} />
    </div>
  );
}

function SegmentSnapshotView({ data }: { data: InsightsSnapshot }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Segment Snapshot</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase mb-1">Who</p>
              <p className="text-slate-700">{data.who}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase mb-1">What</p>
              <p className="text-slate-700">{data.what}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase mb-1">Why</p>
              <p className="text-slate-700">{data.why}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase mb-1">When</p>
              <p className="text-slate-700">{data.when_active}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {data.top_pains && data.top_pains.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Pains</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {data.top_pains.map((pain, idx) => (
                <li key={idx} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                  <span className="text-slate-700">{typeof pain === 'string' ? pain : pain.pain_name}</span>
                  {typeof pain !== 'string' && (
                    <Badge variant="outline">Severity: {pain.severity}</Badge>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {data.adoption_barriers && data.adoption_barriers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Adoption Barriers</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {data.adoption_barriers.map((barrier, idx) => (
                <li key={idx} className="p-2 bg-slate-50 rounded">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-slate-700 font-medium">
                      {typeof barrier === 'string' ? barrier : barrier.barrier}
                    </span>
                    {typeof barrier !== 'string' && (
                      <Badge variant="outline" className="capitalize">{barrier.severity}</Badge>
                    )}
                  </div>
                  {typeof barrier !== 'string' && barrier.mitigation && (
                    <p className="text-xs text-slate-500 mt-1">Mitigation: {barrier.mitigation}</p>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <EvidenceAndValidation data={data} />
    </div>
  );
}

function OpportunityRadarView({ data }: { data: InsightsRadar }) {
  return (
    <div className="space-y-6">
      {/* Jobs vs Benefits Gap */}
      {data.jobs_vs_benefits_gap && (
        <Card>
          <CardHeader>
            <CardTitle>Jobs vs Benefits Gap</CardTitle>
            {data.jobs_vs_benefits_gap.coverage_score !== undefined && (
              <CardDescription>
                Coverage Score: {data.jobs_vs_benefits_gap.coverage_score}%
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.jobs_vs_benefits_gap.gaps?.map((gap, idx) => (
                <div key={idx} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-start justify-between mb-2">
                    <p className="font-medium text-slate-900">{gap.job}</p>
                    {(gap as any).severity && (
                      <Badge variant="outline" className="capitalize">{(gap as any).severity}</Badge>
                    )}
                  </div>
                  <p className="text-sm text-slate-600">
                    {gap.gap_description || ((gap as any).missing_benefits && `Missing: ${(gap as any).missing_benefits.join(", ")}`)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Triggers vs Timeline */}
      {data.triggers_vs_timeline && (
        <Card>
          <CardHeader>
            <CardTitle>Triggers vs Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.triggers_vs_timeline.timeline_mapping?.map((mapping, idx) => (
                <div key={idx} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="font-medium text-slate-900 mb-2">{mapping.trigger}</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-500 mb-1">Best Window</p>
                      <p className="text-slate-700">{(mapping as any).best_window || mapping.typical_timing}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 mb-1">Risk Window</p>
                      <p className="text-slate-700">{(mapping as any).risk_window || mapping.urgency}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Risk Alerts */}
      {data.risk_alerts && data.risk_alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Risk Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.risk_alerts.map((alert, idx) => (
                <div key={idx} className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="flex items-start justify-between mb-2">
                    <p className="font-medium text-amber-900">{alert.risk}</p>
                    <Badge variant="outline" className="capitalize bg-amber-100 text-amber-700 border-amber-300">
                      {alert.severity}
                    </Badge>
                  </div>
                  <p className="text-sm text-amber-700 mb-2">{alert.impact}</p>
                  <p className="text-sm text-amber-600">
                    <strong>Recommendation:</strong> {alert.recommendation}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <EvidenceAndValidation data={data} />
    </div>
  );
}

function EvidenceAndValidation({ data }: { data: InsightsExecutive | InsightsSnapshot | InsightsRadar }) {
  return (
    <>
      {/* Evidence Sources */}
      {data.evidence_sources && data.evidence_sources.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5 text-slate-500" />
              Evidence Sources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.evidence_sources.map((source, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 rounded text-sm">
                  <div>
                    <span className="font-medium text-slate-700">{source.table_name}</span>
                    <span className="text-slate-500 ml-2">({source.field_used})</span>
                  </div>
                  <Badge variant="outline">{source.record_count} records</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Validation Metrics */}
      {data.validation_metrics && data.validation_metrics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Validation Metrics</CardTitle>
            <CardDescription>How to test these insights in the field</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.validation_metrics.map((metric, idx) => (
                <div key={idx} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-slate-900">{metric.metric}</p>
                    {(metric as any).success_signal && (
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                        Success: {(metric as any).success_signal}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 mb-1">
                    <strong>How to test:</strong> {metric.how_to_test}
                  </p>
                  <p className="text-sm text-slate-600">
                    <strong>Expected outcome:</strong> {metric.expected_outcome}
                  </p>
                  {(metric as any).risk_signal && (
                    <p className="text-xs text-amber-600 mt-2">
                      ⚠️ Risk signal: {(metric as any).risk_signal}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
