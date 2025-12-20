"use client";

import { use, useState, useEffect } from "react";
import {
  Loader2,
  AlertCircle,
  MessageCircle,
  RefreshCw,
  CheckCircle2,
  Zap,
  Users,
  Bot,
  ArrowRight,
  AlertTriangle,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { CommunicationsFunnel, Segment } from "@/types";

interface CommunicationsData {
  segments: Array<{
    id: string;
    name: string;
    topPains: Array<{ id: string; name: string; impact_score: number }>;
  }>;
  funnels: Record<string, Record<string, {
    draft: CommunicationsFunnel | null;
    approved: CommunicationsFunnel | null;
  }>>;
}

export default function CommunicationsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = use(params);

  const [data, setData] = useState<CommunicationsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState<string | null>(null);
  const [approving, setApproving] = useState<string | null>(null);

  // Selection state
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);
  const [selectedPainId, setSelectedPainId] = useState<string | null>(null);

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

      // Fetch funnels per segment × pain
      const funnels: CommunicationsData["funnels"] = {};

      for (const segment of segments) {
        funnels[segment.id] = {};

        for (const pain of segment.topPains) {
          const [draftRes, approvedRes] = await Promise.all([
            fetch(`/api/drafts?table=communications_funnel_drafts&projectId=${projectId}&segmentId=${segment.id}&painId=${pain.id}`),
            fetch(`/api/approved?table=communications_funnel&projectId=${projectId}&segmentId=${segment.id}&painId=${pain.id}`),
          ]);

          const draftData = draftRes.ok ? await draftRes.json() : { drafts: [] };
          const approvedData = approvedRes.ok ? await approvedRes.json() : { data: [] };

          funnels[segment.id][pain.id] = {
            draft: draftData.drafts?.[0] || null,
            approved: approvedData.data?.[0] || null,
          };
        }
      }

      setData({ segments, funnels });

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

  const handleGenerate = async () => {
    if (!selectedSegmentId || !selectedPainId) return;

    try {
      setGenerating(`${selectedSegmentId}-${selectedPainId}`);

      const res = await fetch("/api/generate/communications-funnel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, segmentId: selectedSegmentId, painId: selectedPainId }),
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

  const handleApprove = async (draftId: string) => {
    if (!selectedSegmentId || !selectedPainId) return;

    try {
      setApproving(`${selectedSegmentId}-${selectedPainId}`);

      const res = await fetch("/api/approve/communications-funnel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          draftId,
          segmentId: selectedSegmentId,
          painId: selectedPainId,
        }),
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
  const currentData = selectedSegmentId && selectedPainId
    ? data?.funnels[selectedSegmentId]?.[selectedPainId]
    : null;
  const content = currentData?.approved || currentData?.draft;
  const isDraft = !currentData?.approved && !!currentData?.draft;
  const isGeneratingCurrent = generating === `${selectedSegmentId}-${selectedPainId}`;
  const isApprovingCurrent = approving === `${selectedSegmentId}-${selectedPainId}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl text-white shadow-lg">
            <MessageCircle className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Communications</h1>
            <p className="text-slate-500">
              Organic rhythm, conversation funnels & chatbot scripts
            </p>
          </div>
        </div>
      </div>

      {/* Segment/Pain Selector */}
      {data?.segments && (
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
                      ? "bg-blue-600 text-white"
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
      {selectedSegment && selectedSegment.topPains.length === 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
          <p className="text-amber-700">
            No top pains found for this segment. Generate and approve pains first.
          </p>
        </div>
      )}

      {/* Content */}
      {selectedSegmentId && selectedPainId && (
        <>
          {!content ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="p-4 bg-slate-100 rounded-full mb-4">
                <MessageCircle className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Communications Funnel
              </h3>
              <p className="text-slate-500 mb-6 max-w-md">
                Generate organic rhythm, conversation funnel, and chatbot scripts for {selectedSegment?.name} × {selectedPain?.name}
              </p>
              <Button onClick={handleGenerate} disabled={isGeneratingCurrent}>
                {isGeneratingCurrent ? (
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
                  <Button variant="outline" size="sm" onClick={handleGenerate} disabled={isGeneratingCurrent}>
                    {isGeneratingCurrent ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                    <span className="ml-2">Regenerate</span>
                  </Button>
                  {isDraft && (
                    <Button size="sm" onClick={() => handleApprove((currentData?.draft as any)?.id)} disabled={isApprovingCurrent}>
                      {isApprovingCurrent ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                      <span className="ml-2">Approve</span>
                    </Button>
                  )}
                </div>
              </div>

              {/* Organic Rhythm */}
              {content.organic_rhythm && (
                <Card>
                  <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-emerald-600" />
                      Organic Rhythm
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    {/* Posting Cadence & Channel Matrix */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-emerald-50/50 rounded-lg">
                        <p className="text-xs font-medium text-emerald-700 mb-1">Posting Cadence</p>
                        <div className="text-sm text-slate-900 space-y-0.5">
                          {content.organic_rhythm.posting_cadence?.daily_posts !== undefined && (
                            <p>Posts: {content.organic_rhythm.posting_cadence.daily_posts}/day</p>
                          )}
                          {content.organic_rhythm.posting_cadence?.stories !== undefined && (
                            <p>Stories: {content.organic_rhythm.posting_cadence.stories}/day</p>
                          )}
                          {content.organic_rhythm.posting_cadence?.live && (
                            <p>Live: {content.organic_rhythm.posting_cadence.live}</p>
                          )}
                        </div>
                      </div>
                      {content.organic_rhythm.channel_matrix && (
                        <div className="p-3 bg-emerald-50/50 rounded-lg">
                          <p className="text-xs font-medium text-emerald-700 mb-1">Channel Matrix</p>
                          <div className="space-y-1">
                            {Object.entries(content.organic_rhythm.channel_matrix).map(([channel, role]) => (
                              <div key={channel} className="flex justify-between text-sm">
                                <span className="text-slate-600">{channel}</span>
                                <span className="text-slate-900 font-medium">{String(role)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Content by Funnel Stage */}
                    <div className="space-y-3">
                      {/* TOF Content */}
                      {content.organic_rhythm.tof_content?.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-amber-700 mb-2">TOF Content</p>
                          <div className="grid grid-cols-2 gap-2">
                            {content.organic_rhythm.tof_content.map((item, i) => (
                              <div key={i} className="p-2 bg-amber-50/50 rounded border border-amber-100">
                                <p className="font-medium text-sm text-slate-900">{item.topic}</p>
                                <div className="flex gap-2 mt-1">
                                  <Badge variant="outline" className="text-xs">{item.format}</Badge>
                                  <span className="text-xs text-slate-500">{item.frequency}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {/* MOF Content */}
                      {content.organic_rhythm.mof_content?.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-blue-700 mb-2">MOF Content</p>
                          <div className="grid grid-cols-2 gap-2">
                            {content.organic_rhythm.mof_content.map((item, i) => (
                              <div key={i} className="p-2 bg-blue-50/50 rounded border border-blue-100">
                                <p className="font-medium text-sm text-slate-900">{item.topic}</p>
                                <div className="flex gap-2 mt-1">
                                  <Badge variant="outline" className="text-xs">{item.format}</Badge>
                                  <span className="text-xs text-slate-500">{item.frequency}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {/* BOF Content */}
                      {content.organic_rhythm.bof_content?.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-emerald-700 mb-2">BOF Content</p>
                          <div className="grid grid-cols-2 gap-2">
                            {content.organic_rhythm.bof_content.map((item, i) => (
                              <div key={i} className="p-2 bg-emerald-50/50 rounded border border-emerald-100">
                                <p className="font-medium text-sm text-slate-900">{item.topic}</p>
                                <div className="flex gap-2 mt-1">
                                  <Badge variant="outline" className="text-xs">{item.format}</Badge>
                                  <span className="text-xs text-slate-500">{item.frequency}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Conversation Funnel */}
              {content.conversation_funnel && (
                <Card>
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-600" />
                      Conversation Funnel
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    {/* Entry Points */}
                    {content.conversation_funnel.entry_points?.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-blue-700 mb-2">Entry Points</p>
                        <div className="flex flex-wrap gap-2">
                          {content.conversation_funnel.entry_points.map((point: string, i: number) => (
                            <Badge key={i} variant="outline" className="text-blue-600">
                              {point}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* DM Flow & Chat Flow */}
                    <div className="grid grid-cols-2 gap-4">
                      {content.conversation_funnel.dm_flow?.length > 0 && (
                        <div className="p-3 bg-blue-50/50 rounded-lg">
                          <p className="text-xs font-medium text-blue-700 mb-2">DM Flow</p>
                          <ol className="space-y-1">
                            {content.conversation_funnel.dm_flow.map((step: string, i: number) => (
                              <li key={i} className="text-sm text-slate-600 flex gap-2">
                                <span className="text-blue-500 font-medium">{i + 1}.</span>
                                {step}
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}
                      {content.conversation_funnel.chat_flow?.length > 0 && (
                        <div className="p-3 bg-indigo-50/50 rounded-lg">
                          <p className="text-xs font-medium text-indigo-700 mb-2">Chat Flow</p>
                          <ol className="space-y-1">
                            {content.conversation_funnel.chat_flow.map((step: string, i: number) => (
                              <li key={i} className="text-sm text-slate-600 flex gap-2">
                                <span className="text-indigo-500 font-medium">{i + 1}.</span>
                                {step}
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}
                    </div>

                    {/* Qualification Criteria */}
                    {content.conversation_funnel.qualification_criteria?.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-slate-500 mb-2">Qualification Criteria</p>
                        <div className="flex flex-wrap gap-2">
                          {content.conversation_funnel.qualification_criteria.map((criteria: string, i: number) => (
                            <span key={i} className="px-2 py-1 text-xs bg-emerald-50 text-emerald-700 rounded border border-emerald-200">
                              ✓ {criteria}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Handoff Script */}
                    {content.conversation_funnel.handoff_script && (
                      <div className="p-4 bg-purple-50/50 rounded-lg">
                        <p className="text-xs font-medium text-purple-700 mb-2">Handoff Script</p>
                        <p className="text-sm text-slate-700">
                          {content.conversation_funnel.handoff_script}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Chatbot Scripts */}
              {content.chatbot_scripts && (
                <Card>
                  <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Bot className="w-4 h-4 text-purple-600" />
                      Chatbot Scripts
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    {/* Welcome Flow */}
                    {content.chatbot_scripts.welcome_flow && (
                      <div>
                        <p className="text-xs font-medium text-purple-700 mb-2">Welcome Flow</p>
                        <div className="p-3 bg-purple-50/50 rounded-lg">
                          <p className="text-sm text-slate-700">{content.chatbot_scripts.welcome_flow.message}</p>
                          {content.chatbot_scripts.welcome_flow.buttons?.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {content.chatbot_scripts.welcome_flow.buttons.map((button: string, i: number) => (
                                <span key={i} className="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded-full">
                                  {button}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Need Discovery Flow */}
                    {content.chatbot_scripts.need_discovery_flow && (
                      <div>
                        <p className="text-xs font-medium text-blue-700 mb-2">Need Discovery Flow</p>
                        <div className="p-3 bg-blue-50/50 rounded-lg space-y-2">
                          {content.chatbot_scripts.need_discovery_flow.questions?.length > 0 && (
                            <div>
                              <p className="text-xs text-slate-500 mb-1">Discovery Questions:</p>
                              <ol className="space-y-1">
                                {content.chatbot_scripts.need_discovery_flow.questions.map((q: string, i: number) => (
                                  <li key={i} className="text-sm text-slate-600 flex gap-2">
                                    <span className="text-blue-500 font-medium">{i + 1}.</span>
                                    {q}
                                  </li>
                                ))}
                              </ol>
                            </div>
                          )}
                          {content.chatbot_scripts.need_discovery_flow.branching && (
                            <p className="text-xs text-slate-500 mt-2">
                              <strong>Branching Logic:</strong> {content.chatbot_scripts.need_discovery_flow.branching}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Recommendation Flow */}
                    {content.chatbot_scripts.recommendation_flow && (
                      <div>
                        <p className="text-xs font-medium text-emerald-700 mb-2">Recommendation Flow</p>
                        <div className="p-3 bg-emerald-50/50 rounded-lg space-y-2">
                          {content.chatbot_scripts.recommendation_flow.logic && (
                            <p className="text-sm text-slate-700">
                              <strong>Logic:</strong> {content.chatbot_scripts.recommendation_flow.logic}
                            </p>
                          )}
                          {content.chatbot_scripts.recommendation_flow.templates?.length > 0 && (
                            <div>
                              <p className="text-xs text-slate-500 mb-1">Response Templates:</p>
                              <div className="space-y-1">
                                {content.chatbot_scripts.recommendation_flow.templates.map((tpl: string, i: number) => (
                                  <div key={i} className="p-2 bg-white rounded border text-sm text-slate-600">
                                    {tpl}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Export Format */}
                    {content.chatbot_scripts.export_format && (
                      <div className="p-3 bg-amber-50/50 rounded-lg">
                        <p className="text-xs font-medium text-amber-700 mb-1">Export Format</p>
                        <Badge variant="outline">{content.chatbot_scripts.export_format}</Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
