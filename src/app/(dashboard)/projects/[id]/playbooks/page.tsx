"use client";

import { use, useState, useEffect } from "react";
import {
  Loader2,
  AlertCircle,
  Target,
  Layers,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { NoSegmentsAlert, NoTopPainsAlert } from "@/components/ui/MissingDataAlert";
import {
  PlaybooksCanvas,
  PlaybooksFunnel,
  Segment,
} from "@/types";

type TabId = "canvas" | "funnel";

interface PlaybooksData {
  segments: Array<{
    id: string;
    name: string;
    topPains: Array<{ id: string; name: string; impact_score: number }>;
  }>;
  canvas: {
    draft: PlaybooksCanvas | null;
    approved: PlaybooksCanvas | null;
  };
  funnel: {
    draft: PlaybooksFunnel | null;
    approved: PlaybooksFunnel | null;
  };
}

const tabs: Array<{ id: TabId; label: string; icon: typeof Target }> = [
  { id: "canvas", label: "Canvas Summary", icon: Target },
  { id: "funnel", label: "Funnel Assets", icon: Layers },
];

export default function PlaybooksPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = use(params);

  const [activeTab, setActiveTab] = useState<TabId>("canvas");
  const [data, setData] = useState<PlaybooksData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState<string | null>(null);
  const [approving, setApproving] = useState<string | null>(null);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);
  const [selectedPainId, setSelectedPainId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [projectId]);

  useEffect(() => {
    if (selectedSegmentId && selectedPainId) {
      fetchPlaybookData();
    }
  }, [selectedSegmentId, selectedPainId, activeTab]);

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

      // Set first segment and pain as selected
      if (segments.length > 0 && !selectedSegmentId) {
        const firstSegment = segments[0];
        setSelectedSegmentId(firstSegment.id);
        if (firstSegment.topPains.length > 0) {
          setSelectedPainId(firstSegment.topPains[0].id);
        }
      }

      setData({
        segments,
        canvas: { draft: null, approved: null },
        funnel: { draft: null, approved: null },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPlaybookData = async () => {
    if (!selectedSegmentId || !selectedPainId) return;

    try {
      // Fetch canvas
      const [canvasDraftRes, canvasApprovedRes] = await Promise.all([
        fetch(`/api/drafts/playbooks-canvas?projectId=${projectId}&segmentId=${selectedSegmentId}&painId=${selectedPainId}`),
        fetch(`/api/approved/playbooks-canvas?projectId=${projectId}&segmentId=${selectedSegmentId}&painId=${selectedPainId}`),
      ]);

      const canvasDraft = canvasDraftRes.ok ? (await canvasDraftRes.json()).draft : null;
      const canvasApproved = canvasApprovedRes.ok ? (await canvasApprovedRes.json()).approved : null;

      // Fetch funnel
      const [funnelDraftRes, funnelApprovedRes] = await Promise.all([
        fetch(`/api/drafts/playbooks-funnel?projectId=${projectId}&segmentId=${selectedSegmentId}&painId=${selectedPainId}`),
        fetch(`/api/approved/playbooks-funnel?projectId=${projectId}&segmentId=${selectedSegmentId}&painId=${selectedPainId}`),
      ]);

      const funnelDraft = funnelDraftRes.ok ? (await funnelDraftRes.json()).draft : null;
      const funnelApproved = funnelApprovedRes.ok ? (await funnelApprovedRes.json()).approved : null;

      if (data) {
        setData({
          ...data,
          canvas: { draft: canvasDraft, approved: canvasApproved },
          funnel: { draft: funnelDraft, approved: funnelApproved },
        });
      }
    } catch (err) {
      console.error("Failed to fetch playbook data:", err);
    }
  };

  const handleGenerate = async (type: TabId) => {
    if (!selectedSegmentId || !selectedPainId) {
      setError("Please select a segment and pain");
      return;
    }

    try {
      setGenerating(type);
      setError(null);

      const endpoint = type === "canvas" ? "/api/generate/playbooks-canvas" : "/api/generate/playbooks-funnel";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, segmentId: selectedSegmentId, painId: selectedPainId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Generation failed");
      }

      await fetchPlaybookData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setGenerating(null);
    }
  };

  const handleApprove = async (type: TabId, draftId: string) => {
    if (!selectedSegmentId || !selectedPainId) {
      setError("Please select a segment and pain");
      return;
    }

    try {
      setApproving(type);
      setError(null);

      const endpoint = type === "canvas" ? "/api/approve/playbooks-canvas" : "/api/approve/playbooks-funnel";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, draftId, segmentId: selectedSegmentId, painId: selectedPainId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Approval failed");
      }

      await fetchPlaybookData();
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
  const selectedSegment = data?.segments.find((s) => s.id === selectedSegmentId);
  const selectedPain = selectedSegment?.topPains.find((p) => p.id === selectedPainId);

  const getCurrentData = () => {
    switch (activeTab) {
      case "canvas":
        return data?.canvas;
      case "funnel":
        return data?.funnel;
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
        <h1 className="text-3xl font-semibold text-text-primary">Segment × Pain Playbooks</h1>
        <p className="mt-2 text-text-secondary max-w-3xl">
          Generate landing page outlines and funnel assets for each segment × top pain combination.
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

      {/* Segment/Pain Selector */}
      {data?.segments && data.segments.length > 0 && (
        <div className="flex gap-4 p-4 bg-slate-50 rounded-xl">
          <div className="flex-1">
            <label className="text-xs font-medium text-slate-500 uppercase mb-2 block">Segment</label>
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
              <label className="text-xs font-medium text-slate-500 uppercase mb-2 block">Top Pain</label>
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
                    <Badge variant={selectedPainId === pain.id ? "secondary" : "outline"} className="ml-1">
                      {pain.impact_score}/10
                    </Badge>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      {hasNoSegments ? (
        <NoSegmentsAlert projectId={projectId} />
      ) : selectedSegment && selectedSegment.topPains.length === 0 ? (
        <NoTopPainsAlert projectId={projectId} segmentName={selectedSegment.name} />
      ) : !selectedSegmentId || !selectedPainId ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <AlertTriangle className="w-12 h-12 text-amber-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Select Segment and Pain</h3>
            <p className="text-slate-500 text-center max-w-md">
              Please select a segment and top pain to generate playbooks.
            </p>
          </CardContent>
        </Card>
      ) : !displayData ? (
        <EmptyState
          title={activeTab === "canvas" ? "Canvas Summary" : "Funnel Assets"}
          description={
            activeTab === "canvas"
              ? "Generate a landing page outline with hero, insight, ritual, proof, and CTA sections"
              : "Generate TOF/MOF/BOF funnel assets for content marketing"
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
          {activeTab === "canvas" && displayData && (
            <CanvasView data={displayData as PlaybooksCanvas} />
          )}

          {activeTab === "funnel" && displayData && (
            <FunnelView data={displayData as PlaybooksFunnel} />
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

function CanvasView({ data }: { data: PlaybooksCanvas }) {
  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <Card>
        <CardHeader>
          <CardTitle>Hero Section</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Headline</p>
            <p className="text-lg font-semibold text-slate-900">{data.hero_section.headline}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Subheadline</p>
            <p className="text-slate-700">{data.hero_section.subheadline}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Hook</p>
            <p className="text-slate-700">{data.hero_section.hook}</p>
          </div>
        </CardContent>
      </Card>

      {/* Insight Section */}
      <Card>
        <CardHeader>
          <CardTitle>Insight Section</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Pain Story</p>
            <p className="text-slate-700">{data.insight_section.pain_story}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Root Cause</p>
            <p className="text-slate-700">{data.insight_section.root_cause}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Why Now</p>
            <p className="text-slate-700">{data.insight_section.why_now}</p>
          </div>
        </CardContent>
      </Card>

      {/* Ritual Section */}
      <Card>
        <CardHeader>
          <CardTitle>Ritual Section</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-slate-500 mb-2">Ritual Steps</p>
            <ul className="space-y-2">
              {data.ritual_section.ritual_steps.map((step, idx) => (
                <li key={idx} className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-purple-500" />
                  <span className="text-slate-700">{step}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">How It Fits</p>
            <p className="text-slate-700">{data.ritual_section.how_it_fits}</p>
          </div>
        </CardContent>
      </Card>

      {/* Proof Section */}
      <Card>
        <CardHeader>
          <CardTitle>Proof Section</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-slate-500 mb-2">Proof Points</p>
            <ul className="space-y-2">
              {data.proof_section.proof_points.map((point, idx) => (
                <li key={idx} className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span className="text-slate-700">{point}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 mb-2">Trust Assets</p>
            <ul className="space-y-2">
              {data.proof_section.trust_assets.map((asset, idx) => (
                <li key={idx} className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-500" />
                  <span className="text-slate-700">{asset}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* CTA Section */}
      <Card>
        <CardHeader>
          <CardTitle>CTA Section</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Primary CTA</p>
            <p className="text-slate-700">{data.cta_section.primary_cta}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Secondary CTA</p>
            <p className="text-slate-700">{data.cta_section.secondary_cta}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function FunnelView({ data }: { data: PlaybooksFunnel }) {
  return (
    <div className="space-y-6">
      {/* TOF Assets */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
          <CardTitle className="text-sm font-semibold">TOF Assets (Top of Funnel)</CardTitle>
          <CardDescription>Awareness stage content</CardDescription>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          {data.tof_assets.map((asset, idx) => (
            <div key={idx} className="p-4 bg-blue-50/50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">
                  {asset.format}
                </Badge>
              </div>
              <p className="text-sm text-slate-700 mb-2">{asset.message}</p>
              <p className="text-xs text-slate-500">
                <strong>CTA:</strong> {asset.cta}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* MOF Assets */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
          <CardTitle className="text-sm font-semibold">MOF Assets (Middle of Funnel)</CardTitle>
          <CardDescription>Consideration stage content</CardDescription>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          {data.mof_assets.map((asset, idx) => (
            <div key={idx} className="p-4 bg-purple-50/50 rounded-lg border border-purple-200">
              <div className="flex items-center justify-between mb-2">
                <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-300">
                  {asset.format}
                </Badge>
              </div>
              <p className="text-sm text-slate-700 mb-2">{asset.message}</p>
              <p className="text-xs text-slate-500">
                <strong>CTA:</strong> {asset.cta}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* BOF Assets */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b">
          <CardTitle className="text-sm font-semibold">BOF Assets (Bottom of Funnel)</CardTitle>
          <CardDescription>Conversion stage content</CardDescription>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          {data.bof_assets.map((asset, idx) => (
            <div key={idx} className="p-4 bg-emerald-50/50 rounded-lg border border-emerald-200">
              <div className="flex items-center justify-between mb-2">
                <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-emerald-300">
                  {asset.format}
                </Badge>
              </div>
              <p className="text-sm text-slate-700 mb-2">{asset.message}</p>
              <p className="text-xs text-slate-500">
                <strong>CTA:</strong> {asset.cta}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
