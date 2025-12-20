"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  AlertCircle,
  Users,
  UserPlus,
  ListChecks,
  Target,
  RefreshCw,
  CheckCircle2,
  Zap,
  Pencil,
  Trash2,
  X,
  Plus,
  Video,
  ExternalLink,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { UGCCreatorProfile, Segment } from "@/types";

type TabId = "profiles" | "tracking";

interface UGCData {
  segments: Array<{
    id: string;
    name: string;
  }>;
  profiles: Record<string, {
    draft: UGCCreatorProfile | null;
    approved: UGCCreatorProfile | null;
  }>;
  tracking: UGCTracking[];
}

interface UGCTracking {
  id: string;
  project_id: string;
  segment_id: string;
  profile_id?: string;
  creator_name: string;
  creator_handle?: string;
  platform: string;
  contact_info?: string;
  status: string;
  videos_ordered: number;
  videos_delivered: number;
  videos_published: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export default function UGCCreatorsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = use(params);
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<TabId>("profiles");
  const [data, setData] = useState<UGCData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState<string | null>(null);
  const [approving, setApproving] = useState<string | null>(null);

  // Selection state
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);

  // Modal state for tracking
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTracker, setEditingTracker] = useState<UGCTracking | null>(null);
  const [savingTracker, setSavingTracker] = useState(false);

  const tabs: Array<{ id: TabId; label: string; icon: typeof Users }> = [
    { id: "profiles", label: "Creator Profiles", icon: Users },
    { id: "tracking", label: "Creator Tracking", icon: ListChecks },
  ];

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

      // Fetch profiles per segment
      const profiles: UGCData["profiles"] = {};

      for (const segment of segments) {
        const [draftRes, approvedRes] = await Promise.all([
          fetch(`/api/drafts?table=ugc_creator_profiles_drafts&projectId=${projectId}&segmentId=${segment.id}`),
          fetch(`/api/approved?table=ugc_creator_profiles&projectId=${projectId}&segmentId=${segment.id}`),
        ]);

        const draftData = draftRes.ok ? await draftRes.json() : { drafts: [] };
        const approvedData = approvedRes.ok ? await approvedRes.json() : { data: [] };

        profiles[segment.id] = {
          draft: draftData.drafts?.[0] || null,
          approved: approvedData.data?.[0] || null,
        };
      }

      // Fetch tracking records
      const trackingRes = await fetch(`/api/ugc-creators/tracking?projectId=${projectId}`);
      const trackingData = trackingRes.ok ? await trackingRes.json() : { records: [] };

      setData({
        segments,
        profiles,
        tracking: trackingData.records || [],
      });

      // Set default selection
      if (segments.length > 0) {
        setSelectedSegmentId(segments[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = async (segmentId: string) => {
    try {
      setGenerating(segmentId);

      const res = await fetch("/api/generate/ugc-creator-profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, segmentId }),
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

  const handleApprove = async (segmentId: string, draftId: string) => {
    try {
      setApproving(segmentId);

      const res = await fetch("/api/approve/ugc-creator-profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, draftId, segmentId }),
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

  const handleSaveTracker = async (trackerData: Partial<UGCTracking>) => {
    try {
      setSavingTracker(true);

      const isEdit = !!editingTracker?.id;
      const method = isEdit ? "PATCH" : "POST";
      const body = isEdit
        ? { id: editingTracker.id, ...trackerData }
        : { projectId, ...trackerData };

      const res = await fetch("/api/ugc-creators/tracking", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Save failed");
      }

      setIsModalOpen(false);
      setEditingTracker(null);
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSavingTracker(false);
    }
  };

  const handleDeleteTracker = async (id: string) => {
    if (!confirm("Are you sure you want to delete this tracking record?")) return;

    try {
      const res = await fetch(`/api/ugc-creators/tracking?id=${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Delete failed");
      }

      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl text-white shadow-lg">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">UGC Creator Dock</h1>
            <p className="text-slate-500">
              AI-generated creator profiles and tracking
            </p>
          </div>
        </div>
        {activeTab === "tracking" && (
          <Button onClick={() => { setEditingTracker(null); setIsModalOpen(true); }}>
            <UserPlus className="w-4 h-4 mr-2" />
            Add Creator
          </Button>
        )}
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
                    ? "border-pink-600 text-pink-600"
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

      {/* Segment Selector for profiles tab */}
      {activeTab === "profiles" && data?.segments && (
        <div className="flex gap-4 p-4 bg-slate-50 rounded-xl">
          <div className="flex-1">
            <label className="text-xs font-medium text-slate-500 uppercase mb-2 block">
              Segment
            </label>
            <div className="flex flex-wrap gap-2">
              {data.segments.map((segment) => (
                <button
                  key={segment.id}
                  onClick={() => setSelectedSegmentId(segment.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                    selectedSegmentId === segment.id
                      ? "bg-pink-600 text-white"
                      : "bg-white text-slate-700 hover:bg-slate-100 border"
                  )}
                >
                  {segment.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab Content */}
      {activeTab === "profiles" && selectedSegmentId && (
        <ProfilesTab
          data={data?.profiles[selectedSegmentId]}
          segment={selectedSegment}
          onGenerate={() => handleGenerate(selectedSegmentId)}
          onApprove={(draftId) => handleApprove(selectedSegmentId, draftId)}
          isGenerating={generating === selectedSegmentId}
          isApproving={approving === selectedSegmentId}
        />
      )}

      {activeTab === "tracking" && (
        <TrackingTab
          data={data?.tracking || []}
          segments={data?.segments || []}
          onEdit={(tracker) => { setEditingTracker(tracker); setIsModalOpen(true); }}
          onDelete={handleDeleteTracker}
        />
      )}

      {/* Tracking Modal */}
      {isModalOpen && (
        <TrackerModal
          tracker={editingTracker}
          segments={data?.segments || []}
          profiles={data?.profiles || {}}
          onSave={handleSaveTracker}
          onClose={() => { setIsModalOpen(false); setEditingTracker(null); }}
          isSaving={savingTracker}
        />
      )}
    </div>
  );
}

// Tab Components

function ProfilesTab({
  data,
  segment,
  onGenerate,
  onApprove,
  isGenerating,
  isApproving,
}: {
  data?: { draft: UGCCreatorProfile | null; approved: UGCCreatorProfile | null };
  segment?: { id: string; name: string };
  onGenerate: () => void;
  onApprove: (draftId: string) => void;
  isGenerating: boolean;
  isApproving: boolean;
}) {
  const content = data?.approved || data?.draft;
  const isDraft = !data?.approved && !!data?.draft;

  if (!content) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="p-4 bg-slate-100 rounded-full mb-4">
          <Users className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">
          Creator Profile for {segment?.name}
        </h3>
        <p className="text-slate-500 mb-6 max-w-md">
          Generate an ideal UGC creator persona, content topics, and sourcing guidance for this segment.
        </p>
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

  return (
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
          <Button variant="outline" size="sm" onClick={onGenerate} disabled={isGenerating}>
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            <span className="ml-2">Regenerate</span>
          </Button>
          {isDraft && (
            <Button size="sm" onClick={() => onApprove((data?.draft as any)?.id)} disabled={isApproving}>
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

      {/* Ideal Persona */}
      {content.ideal_persona && (
        <Card>
          <CardHeader className="bg-gradient-to-r from-pink-50 to-rose-50 border-b">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Target className="w-4 h-4 text-pink-600" />
              Ideal Creator Persona
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-pink-50/50 rounded-lg">
                <p className="text-xs font-medium text-pink-700 mb-1">Age Range</p>
                <p className="text-slate-900">{content.ideal_persona.age_range}</p>
              </div>
              <div className="p-3 bg-pink-50/50 rounded-lg">
                <p className="text-xs font-medium text-pink-700 mb-1">Gender</p>
                <p className="text-slate-900">{content.ideal_persona.gender}</p>
              </div>
              <div className="p-3 bg-pink-50/50 rounded-lg">
                <p className="text-xs font-medium text-pink-700 mb-1">Visual Aesthetic</p>
                <p className="text-slate-900">{content.ideal_persona.visual_aesthetic}</p>
              </div>
              <div className="p-3 bg-pink-50/50 rounded-lg">
                <p className="text-xs font-medium text-pink-700 mb-1">Content Style</p>
                <p className="text-slate-900">{content.ideal_persona.content_style}</p>
              </div>
            </div>
            {content.ideal_persona.location_preference && (
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-xs font-medium text-slate-500 mb-1">Location Preference</p>
                <p className="text-slate-700">{content.ideal_persona.location_preference}</p>
              </div>
            )}
            {content.ideal_persona.personality_traits?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <p className="text-xs font-medium text-slate-500 w-full mb-1">Personality Traits</p>
                {content.ideal_persona.personality_traits.map((trait: string, i: number) => (
                  <Badge key={i} variant="outline">{trait}</Badge>
                ))}
              </div>
            )}
            {content.ideal_persona.platform_presence?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <p className="text-xs font-medium text-slate-500 w-full mb-1">Platform Presence</p>
                {content.ideal_persona.platform_presence.map((platform: string, i: number) => (
                  <Badge key={i} variant="secondary">{platform}</Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Content Topics */}
      {content.content_topics && content.content_topics.length > 0 && (
        <Card>
          <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Video className="w-4 h-4 text-purple-600" />
              Content Topics
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 grid grid-cols-2 gap-4">
            {content.content_topics.map((topic, i) => (
              <div key={i} className="p-4 bg-purple-50/50 rounded-lg">
                <h4 className="font-semibold text-purple-900 mb-2">{topic.topic}</h4>
                <p className="text-sm text-slate-600 mb-2">{topic.hook_angle}</p>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="capitalize">{topic.format_suggestion}</Badge>
                  <span className="text-xs text-slate-500">{topic.emotional_tone}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Sourcing Guidance */}
      {content.sourcing_guidance && (
        <Card>
          <CardHeader className="bg-emerald-50 border-b">
            <CardTitle className="text-sm font-semibold text-emerald-700">
              Sourcing Guidance
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {content.sourcing_guidance.where_to_find?.length > 0 && (
              <div>
                <p className="text-xs font-medium text-slate-500 mb-2">Where to Find</p>
                <div className="flex flex-wrap gap-2">
                  {content.sourcing_guidance.where_to_find.map((place, i) => (
                    <span key={i} className="px-2 py-1 text-sm bg-emerald-100 text-emerald-700 rounded">
                      {place}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {content.sourcing_guidance.outreach_template && (
              <div>
                <p className="text-xs font-medium text-slate-500 mb-2">Outreach Template</p>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-700 whitespace-pre-line">
                    {content.sourcing_guidance.outreach_template}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function TrackingTab({
  data,
  segments,
  onEdit,
  onDelete,
}: {
  data: UGCTracking[];
  segments: Array<{ id: string; name: string }>;
  onEdit: (tracker: UGCTracking) => void;
  onDelete: (id: string) => void;
}) {
  const [filterSegmentId, setFilterSegmentId] = useState<string | "all">("all");
  const [filterStatus, setFilterStatus] = useState<string | "all">("all");

  const filteredData = data.filter((item) => {
    if (filterSegmentId !== "all" && item.segment_id !== filterSegmentId) return false;
    if (filterStatus !== "all" && item.status !== filterStatus) return false;
    return true;
  });

  const statuses = ["prospect", "contacted", "negotiating", "contracted", "active", "completed", "rejected"];
  const statusColors: Record<string, string> = {
    prospect: "bg-slate-100 text-slate-700",
    contacted: "bg-blue-100 text-blue-700",
    negotiating: "bg-amber-100 text-amber-700",
    contracted: "bg-purple-100 text-purple-700",
    active: "bg-emerald-100 text-emerald-700",
    completed: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
  };

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="p-4 bg-slate-100 rounded-full mb-4">
          <ListChecks className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">No Creators Tracked</h3>
        <p className="text-slate-500 max-w-md">
          Start tracking UGC creators by clicking "Add Creator" button above.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4 p-4 bg-slate-50 rounded-xl">
        <div>
          <label className="text-xs font-medium text-slate-500 uppercase mb-2 block">Segment</label>
          <select
            value={filterSegmentId}
            onChange={(e) => setFilterSegmentId(e.target.value)}
            className="px-3 py-1.5 rounded-lg border bg-white text-sm"
          >
            <option value="all">All Segments</option>
            {segments.map((seg) => (
              <option key={seg.id} value={seg.id}>{seg.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-slate-500 uppercase mb-2 block">Status</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 rounded-lg border bg-white text-sm capitalize"
          >
            <option value="all">All Statuses</option>
            {statuses.map((status) => (
              <option key={status} value={status} className="capitalize">{status}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-xs text-slate-500 mb-1">Total Creators</p>
          <p className="text-2xl font-bold text-slate-900">{data.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate-500 mb-1">Videos Ordered</p>
          <p className="text-2xl font-bold text-blue-600">
            {data.reduce((sum, d) => sum + (d.videos_ordered || 0), 0)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate-500 mb-1">Videos Delivered</p>
          <p className="text-2xl font-bold text-purple-600">
            {data.reduce((sum, d) => sum + (d.videos_delivered || 0), 0)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-slate-500 mb-1">Videos Published</p>
          <p className="text-2xl font-bold text-emerald-600">
            {data.reduce((sum, d) => sum + (d.videos_published || 0), 0)}
          </p>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Creator</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Segment</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Platform</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Status</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-slate-500">Ordered</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-slate-500">Delivered</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-slate-500">Published</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.map((tracker) => {
                const segment = segments.find((s) => s.id === tracker.segment_id);
                return (
                  <tr key={tracker.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-slate-900">{tracker.creator_name}</p>
                        {tracker.creator_handle && (
                          <p className="text-xs text-slate-500">@{tracker.creator_handle}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {segment?.name || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="capitalize">{tracker.platform}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("px-2 py-1 rounded text-xs font-medium capitalize", statusColors[tracker.status] || "bg-slate-100 text-slate-700")}>
                        {tracker.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-slate-600">{tracker.videos_ordered}</td>
                    <td className="px-4 py-3 text-center text-sm text-slate-600">{tracker.videos_delivered}</td>
                    <td className="px-4 py-3 text-center text-sm text-slate-600">{tracker.videos_published}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => onEdit(tracker)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDelete(tracker.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function TrackerModal({
  tracker,
  segments,
  profiles,
  onSave,
  onClose,
  isSaving,
}: {
  tracker: UGCTracking | null;
  segments: Array<{ id: string; name: string }>;
  profiles: Record<string, { draft: UGCCreatorProfile | null; approved: UGCCreatorProfile | null }>;
  onSave: (data: Partial<UGCTracking>) => void;
  onClose: () => void;
  isSaving: boolean;
}) {
  const [formData, setFormData] = useState({
    segment_id: tracker?.segment_id || (segments[0]?.id || ""),
    creator_name: tracker?.creator_name || "",
    creator_handle: tracker?.creator_handle || "",
    platform: tracker?.platform || "tiktok",
    contact_info: tracker?.contact_info || "",
    status: tracker?.status || "prospect",
    videos_ordered: tracker?.videos_ordered || 0,
    videos_delivered: tracker?.videos_delivered || 0,
    videos_published: tracker?.videos_published || 0,
    notes: tracker?.notes || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const statuses = ["prospect", "contacted", "negotiating", "contracted", "active", "completed", "rejected"];
  const platforms = ["tiktok", "instagram", "youtube", "twitter", "other"];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-slate-900">
            {tracker ? "Edit Creator" : "Add Creator"}
          </h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Segment</label>
              <select
                value={formData.segment_id}
                onChange={(e) => setFormData({ ...formData, segment_id: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border bg-white text-sm"
                required
              >
                {segments.map((seg) => (
                  <option key={seg.id} value={seg.id}>{seg.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Platform</label>
              <select
                value={formData.platform}
                onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border bg-white text-sm capitalize"
                required
              >
                {platforms.map((p) => (
                  <option key={p} value={p} className="capitalize">{p}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Creator Name</label>
              <input
                type="text"
                value={formData.creator_name}
                onChange={(e) => setFormData({ ...formData, creator_name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border text-sm"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Handle</label>
              <input
                type="text"
                value={formData.creator_handle}
                onChange={(e) => setFormData({ ...formData, creator_handle: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border text-sm"
                placeholder="@username"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">Contact Info</label>
            <input
              type="text"
              value={formData.contact_info}
              onChange={(e) => setFormData({ ...formData, contact_info: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border text-sm"
              placeholder="Email, DM, etc."
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border bg-white text-sm capitalize"
            >
              {statuses.map((s) => (
                <option key={s} value={s} className="capitalize">{s}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Videos Ordered</label>
              <input
                type="number"
                value={formData.videos_ordered}
                onChange={(e) => setFormData({ ...formData, videos_ordered: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-lg border text-sm"
                min="0"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Videos Delivered</label>
              <input
                type="number"
                value={formData.videos_delivered}
                onChange={(e) => setFormData({ ...formData, videos_delivered: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-lg border text-sm"
                min="0"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1">Videos Published</label>
              <input
                type="number"
                value={formData.videos_published}
                onChange={(e) => setFormData({ ...formData, videos_published: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-lg border text-sm"
                min="0"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 block mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border text-sm"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Save
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
