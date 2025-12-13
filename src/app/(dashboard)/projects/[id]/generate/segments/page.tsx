"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { useTranslation } from "@/lib/hooks/useTranslation";
import {
  Users,
  ChevronDown,
  ChevronUp,
  User2,
  Pencil,
  Trash2,
  Check,
  X,
  Plus,
  Sparkles,
  RefreshCw,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SegmentDraft } from "@/types";

interface VersionGroup {
  version: number;
  segments: SegmentDraft[];
}

export default function SegmentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = use(params);
  const router = useRouter();

  const [versions, setVersions] = useState<VersionGroup[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  const [expandedSegments, setExpandedSegments] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editedSegments, setEditedSegments] = useState<Record<string, Partial<SegmentDraft>>>({});
  const [isDeletingVersion, setIsDeletingVersion] = useState(false);

  // Language translation
  const { language, setLanguage } = useLanguage();
  const currentVersionSegments = versions.find(v => v.version === selectedVersion)?.segments || [];
  const { translatedContent, isTranslating } = useTranslation({
    content: currentVersionSegments,
    language,
    enabled: currentVersionSegments.length > 0,
  });

  // Use translated content if available, otherwise fall back to original
  const displaySegments = (translatedContent as SegmentDraft[] | null) || currentVersionSegments;

  // Fetch segments grouped by version
  useEffect(() => {
    fetchSegments();
  }, [projectId]);

  const fetchSegments = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/drafts?projectId=${projectId}&table=segments_drafts`);
      const data = await res.json();

      if (data.success && data.drafts) {
        // Group by version
        const grouped = data.drafts.reduce((acc: Record<number, SegmentDraft[]>, segment: SegmentDraft) => {
          const v = segment.version || 1;
          if (!acc[v]) acc[v] = [];
          acc[v].push(segment);
          return acc;
        }, {});

        // Convert to array and sort by version descending
        const versionGroups: VersionGroup[] = Object.entries(grouped)
          .map(([v, segments]) => ({
            version: parseInt(v),
            segments: (segments as SegmentDraft[]).sort((a, b) => (a.segment_index || 0) - (b.segment_index || 0)),
          }))
          .sort((a, b) => b.version - a.version);

        setVersions(versionGroups);

        // Select latest version by default
        if (versionGroups.length > 0 && !selectedVersion) {
          setSelectedVersion(versionGroups[0].version);
        }
      }
    } catch (err) {
      console.error("Failed to fetch segments:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = async () => {
    try {
      setIsGenerating(true);
      setError(null);

      const res = await fetch("/api/generate/segments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Generation failed");
      }

      // Refresh segments list
      await fetchSegments();

      // Select the new version
      if (data.drafts && data.drafts.length > 0) {
        setSelectedVersion(data.drafts[0].version);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedVersion) return;

    try {
      setIsApproving(true);
      setError(null);

      // Save any pending edits first
      await saveAllEdits();

      const res = await fetch("/api/approve/segments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, version: selectedVersion }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Approval failed");
      }

      // Navigate to next step
      router.push(`/projects/${projectId}/generate/segments-review`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Approval failed");
    } finally {
      setIsApproving(false);
    }
  };

  const saveAllEdits = async () => {
    const editPromises = Object.entries(editedSegments).map(async ([id, updates]) => {
      await fetch("/api/drafts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          table: "segments_drafts",
          id,
          updates,
        }),
      });
    });
    await Promise.all(editPromises);
    setEditedSegments({});
  };

  const handleEditSegment = (segmentId: string, updates: Partial<SegmentDraft>) => {
    setEditedSegments(prev => ({
      ...prev,
      [segmentId]: { ...prev[segmentId], ...updates },
    }));

    // Also update local state for immediate UI feedback
    setVersions(prev =>
      prev.map(v => ({
        ...v,
        segments: v.segments.map(s =>
          s.id === segmentId ? { ...s, ...updates } : s
        ),
      }))
    );
  };

  const handleDeleteSegment = async (segmentId: string) => {
    try {
      const res = await fetch(`/api/drafts?table=segments_drafts&id=${segmentId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setVersions(prev =>
          prev.map(v => ({
            ...v,
            segments: v.segments.filter(s => s.id !== segmentId),
          }))
        );
      }
    } catch (err) {
      console.error("Failed to delete segment:", err);
    }
  };

  const handleAddSegment = async (segment: Omit<SegmentDraft, "id" | "created_at">) => {
    try {
      const currentVersionSegments = versions.find(v => v.version === selectedVersion)?.segments || [];
      const maxIndex = Math.max(...currentVersionSegments.map(s => s.segment_index || 0), 0);

      const res = await fetch("/api/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          table: "segments_drafts",
          data: {
            project_id: projectId,
            version: selectedVersion,
            segment_index: maxIndex + 1,
            name: segment.name,
            description: segment.description,
            sociodemographics: segment.sociodemographics,
          },
        }),
      });

      const data = await res.json();

      if (data.success && data.draft) {
        setVersions(prev =>
          prev.map(v =>
            v.version === selectedVersion
              ? { ...v, segments: [...v.segments, data.draft] }
              : v
          )
        );
      }
    } catch (err) {
      console.error("Failed to add segment:", err);
    }
  };

  const handleDeleteVersion = async (version: number) => {
    if (!confirm(`Delete version ${version} with all its segments? This cannot be undone.`)) {
      return;
    }

    try {
      setIsDeletingVersion(true);
      setError(null);

      const res = await fetch(`/api/drafts/version?projectId=${projectId}&version=${version}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete version");
      }

      // Remove version from local state
      setVersions(prev => prev.filter(v => v.version !== version));

      // If we deleted the selected version, select another one
      if (selectedVersion === version) {
        const remaining = versions.filter(v => v.version !== version);
        if (remaining.length > 0) {
          setSelectedVersion(remaining[0].version);
        } else {
          setSelectedVersion(null);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete version");
    } finally {
      setIsDeletingVersion(false);
    }
  };

  const toggleSegment = (segmentId: string) => {
    setExpandedSegments(prev =>
      prev.includes(segmentId)
        ? prev.filter(id => id !== segmentId)
        : [...prev, segmentId]
    );
  };

  const expandAll = () => {
    const currentSegments = versions.find(v => v.version === selectedVersion)?.segments || [];
    setExpandedSegments(currentSegments.map(s => s.id));
  };

  const collapseAll = () => {
    setExpandedSegments([]);
  };

  const currentVersionData = versions.find(v => v.version === selectedVersion);
  const segments = currentVersionData?.segments || [];
  const hasUnsavedChanges = Object.keys(editedSegments).length > 0;

  // Create a map from original segment id to translated segment for display
  const translatedSegmentMap = new Map<string, SegmentDraft>();
  if (displaySegments && displaySegments !== currentVersionSegments) {
    displaySegments.forEach((seg, idx) => {
      if (segments[idx]) {
        translatedSegmentMap.set(segments[idx].id, seg);
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Header - Title and Description */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start gap-4"
      >
        <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl text-white shadow-lg shadow-indigo-500/20">
          <Users className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Audience Segments
          </h1>
          <p className="mt-1 text-slate-500 max-w-xl">
            Generate 10 distinct audience segments based on the portrait. Each segment represents a unique subset of your target audience.
          </p>
        </div>
      </motion.div>

      {/* Action Buttons Row */}
      <div className="flex items-center justify-between">
        <LanguageToggle
          currentLanguage={language}
          onLanguageChange={setLanguage}
          isLoading={isTranslating}
        />

        <div className="flex items-center gap-3">
          {versions.length > 0 && (
            <Button
              variant="outline"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="gap-2"
            >
              <RefreshCw className={cn("w-4 h-4", isGenerating && "animate-spin")} />
              Regenerate
            </Button>
          )}
          <Button
            onClick={versions.length === 0 ? handleGenerate : handleApprove}
            disabled={isGenerating || isApproving || (versions.length > 0 && segments.length < 3)}
            isLoading={isGenerating || isApproving}
            className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
          >
            {versions.length === 0 ? (
              <>
                <Sparkles className="w-4 h-4" />
                Generate
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Approve & Continue
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="flex-1">{error}</span>
            <button onClick={() => setError(null)} className="p-1 hover:bg-red-100 rounded">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Version Tabs */}
      {versions.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-between p-3 bg-slate-100 rounded-xl"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500 font-medium">Versions:</span>
            <div className="flex gap-2">
              {versions.map((v) => (
                <button
                  key={v.version}
                  onClick={() => setSelectedVersion(v.version)}
                  className={cn(
                    "px-3 py-1.5 text-sm rounded-lg transition-all",
                    selectedVersion === v.version
                      ? "bg-white text-slate-900 shadow-sm font-medium"
                      : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
                  )}
                >
                  v{v.version} ({v.segments.length})
                </button>
              ))}
            </div>
          </div>
          {versions.length > 1 && selectedVersion && (
            <button
              onClick={() => handleDeleteVersion(selectedVersion)}
              disabled={isDeletingVersion}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              Delete v{selectedVersion}
            </button>
          )}
        </motion.div>
      )}

      {/* Main Content */}
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center py-24"
          >
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          </motion.div>
        ) : isGenerating ? (
          <GeneratingState key="generating" />
        ) : segments.length > 0 ? (
          <motion.div
            key="segments"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Summary Header */}
            <div className="p-6 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <Users className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-indigo-900">
                      {segments.length} Audience Segments
                    </h3>
                    <p className="text-sm text-indigo-600">
                      Click to expand and edit details • Min 3 required for approval
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={expandAll}
                    className="px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors"
                  >
                    Expand All
                  </button>
                  <button
                    onClick={collapseAll}
                    className="px-3 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors"
                  >
                    Collapse All
                  </button>
                </div>
              </div>
            </div>

            {/* Segments List */}
            <div className="space-y-4">
              {segments.map((segment, index) => {
                const translatedSegment = translatedSegmentMap.get(segment.id);
                return (
                  <SegmentCard
                    key={segment.id}
                    segment={segment}
                    translatedSegment={translatedSegment}
                    index={index}
                    isExpanded={expandedSegments.includes(segment.id)}
                    onToggle={() => toggleSegment(segment.id)}
                    onEdit={(updates) => handleEditSegment(segment.id, updates)}
                    onDelete={() => handleDeleteSegment(segment.id)}
                    canDelete={segments.length > 3}
                    projectId={projectId}
                  />
                );
              })}
              <AddSegmentForm onAdd={handleAddSegment} version={selectedVersion || 1} />
            </div>
          </motion.div>
        ) : (
          <EmptyState
            key="empty"
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
          />
        )}
      </AnimatePresence>

      {/* Unsaved Changes Banner */}
      <AnimatePresence>
        {hasUnsavedChanges && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 right-6 flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-xl shadow-xl"
          >
            <span className="text-sm text-slate-600">You have unsaved changes</span>
            <Button variant="outline" size="sm" onClick={() => setEditedSegments({})}>
              Discard
            </Button>
            <Button size="sm" onClick={saveAllEdits}>
              Save Changes
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// =====================================================
// Segment Card Component
// =====================================================

function SegmentCard({
  segment,
  translatedSegment,
  index,
  isExpanded,
  onToggle,
  onEdit,
  onDelete,
  canDelete,
  projectId,
}: {
  segment: SegmentDraft;
  translatedSegment?: SegmentDraft;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: (updates: Partial<SegmentDraft>) => void;
  onDelete: () => void;
  canDelete: boolean;
  projectId?: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [name, setName] = useState(segment.name);
  const [description, setDescription] = useState(segment.description);
  const [sociodemographics, setSociodemographics] = useState(segment.sociodemographics);

  // Use translated values for display, original for editing
  const displayName = translatedSegment?.name || segment.name;
  const displayDescription = translatedSegment?.description || segment.description;
  const displaySociodemographics = translatedSegment?.sociodemographics || segment.sociodemographics;

  const handleRegenerate = async () => {
    if (!projectId) return;

    try {
      setIsRegenerating(true);
      const res = await fetch("/api/generate/field", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          segmentId: segment.id,
          fieldName: "description",
          fieldType: "segment",
          currentValue: description,
          context: `Segment: ${name}. Sociodemographics: ${sociodemographics}`,
        }),
      });

      const data = await res.json();
      if (data.success && data.value) {
        setDescription(data.value);
        onEdit({ description: data.value });
      }
    } catch (err) {
      console.error("Failed to regenerate:", err);
    } finally {
      setIsRegenerating(false);
    }
  };

  const colors = [
    "from-blue-500 to-indigo-500",
    "from-purple-500 to-pink-500",
    "from-emerald-500 to-teal-500",
    "from-orange-500 to-amber-500",
    "from-rose-500 to-pink-500",
    "from-cyan-500 to-blue-500",
    "from-violet-500 to-purple-500",
    "from-lime-500 to-green-500",
    "from-fuchsia-500 to-pink-500",
    "from-sky-500 to-indigo-500",
  ];

  const gradientColor = colors[index % colors.length];

  const handleSave = () => {
    onEdit({ name, description, sociodemographics });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setName(segment.name);
    setDescription(segment.description);
    setSociodemographics(segment.sociodemographics);
    setIsEditing(false);
  };

  // Sync local state when segment changes
  useEffect(() => {
    setName(segment.name);
    setDescription(segment.description);
    setSociodemographics(segment.sociodemographics);
  }, [segment]);

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="w-full p-5 flex items-center justify-between hover:bg-slate-50 transition-colors">
        <div
          className="flex items-center gap-4 flex-1 cursor-pointer"
          onClick={onToggle}
        >
          <div
            className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg bg-gradient-to-br",
              gradientColor
            )}
          >
            {index + 1}
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-slate-900">{displayName}</h3>
            <p className="text-sm text-slate-500 line-clamp-1">
              {displayDescription?.substring(0, 100)}...
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Always visible action buttons */}
          <div className="flex gap-1">
            <button
              onClick={() => setIsEditing(true)}
              className="p-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-blue-100 hover:text-blue-600 border border-slate-200 transition-colors"
              title="Edit"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={handleRegenerate}
              disabled={isRegenerating}
              className="p-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-purple-100 hover:text-purple-600 border border-slate-200 transition-colors disabled:opacity-50"
              title="Regenerate with AI"
            >
              {isRegenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
            </button>
            {canDelete && (
              <button
                onClick={onDelete}
                className="p-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-red-100 hover:text-red-600 border border-slate-200 transition-colors"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
          <div
            onClick={onToggle}
            className={cn(
              "p-2 rounded-lg transition-colors cursor-pointer",
              isExpanded ? "bg-slate-100" : "hover:bg-slate-100"
            )}
          >
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-slate-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-500" />
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-5 pb-5 pt-0 border-t border-slate-100">
              {isEditing ? (
                <div className="pt-5 space-y-4">
                  <div>
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full mt-1 p-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Description</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full mt-1 p-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      rows={4}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Sociodemographics</label>
                    <textarea
                      value={sociodemographics}
                      onChange={(e) => setSociodemographics(e.target.value)}
                      className="w-full mt-1 p-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSave}
                      className="flex items-center gap-1 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 text-sm"
                    >
                      <Check className="w-4 h-4" /> Save
                    </button>
                    <button
                      onClick={handleCancel}
                      className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 text-sm"
                    >
                      <X className="w-4 h-4" /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="pt-5 space-y-4">
                  <div>
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Full Description
                    </span>
                    <p className="mt-2 text-slate-700 leading-relaxed">
                      {displayDescription}
                    </p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <User2 className="w-4 h-4 text-slate-500" />
                      <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Sociodemographics
                      </span>
                    </div>
                    <p className="text-sm text-slate-700">{displaySociodemographics}</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// =====================================================
// Add Segment Form
// =====================================================

function AddSegmentForm({
  onAdd,
  version
}: {
  onAdd: (segment: Omit<SegmentDraft, "id" | "created_at">) => void;
  version: number;
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [sociodemographics, setSociodemographics] = useState("");

  const handleAdd = () => {
    if (name.trim() && description.trim()) {
      onAdd({
        project_id: "",
        name: name.trim(),
        description: description.trim(),
        sociodemographics: sociodemographics.trim(),
        version,
        segment_index: 0,
      });
      setName("");
      setDescription("");
      setSociodemographics("");
      setIsAdding(false);
    }
  };

  if (isAdding) {
    return (
      <div className="p-5 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Segment Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Budget-Conscious Professionals"
              className="w-full mt-1 p-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe this segment..."
              className="w-full mt-1 p-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              rows={4}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Sociodemographics</label>
            <textarea
              value={sociodemographics}
              onChange={(e) => setSociodemographics(e.target.value)}
              placeholder="Age, income, location, etc."
              className="w-full mt-1 p-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              rows={3}
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 text-sm"
            >
              <Check className="w-4 h-4" /> Add Segment
            </button>
            <button
              onClick={() => {
                setIsAdding(false);
                setName("");
                setDescription("");
                setSociodemographics("");
              }}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 text-sm"
            >
              <X className="w-4 h-4" /> Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setIsAdding(true)}
      className="w-full p-4 rounded-xl border-2 border-dashed border-indigo-300 hover:border-indigo-400 text-indigo-600 hover:text-indigo-700 transition-colors flex items-center justify-center gap-2"
    >
      <Plus className="w-4 h-4" />
      Add Segment
    </button>
  );
}

// =====================================================
// Generating State
// =====================================================

function GeneratingState() {
  const steps = [
    "Sending request to AI...",
    "Analyzing portrait data...",
    "Identifying distinct segments...",
    "Building segment profiles...",
    "Generating 10 segments...",
  ];
  const [currentStep, setCurrentStep] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep(prev => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 4000);
    return () => clearInterval(interval);
  }, [steps.length]);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="flex flex-col items-center justify-center py-24"
    >
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full blur-xl opacity-30 animate-pulse" />
        <div className="relative w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-white animate-pulse" />
        </div>
      </div>

      <h3 className="mt-8 text-xl font-semibold text-slate-900">
        Generating 10 Segments
      </h3>

      <AnimatePresence mode="wait">
        <motion.p
          key={currentStep}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="mt-2 text-slate-500"
        >
          {steps[currentStep]}
        </motion.p>
      </AnimatePresence>

      <div className="mt-6 w-64">
        <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
            initial={{ width: "0%" }}
            animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-slate-400">
          <span>Step {currentStep + 1} of {steps.length}</span>
          <span>{formatTime(elapsedTime)}</span>
        </div>
      </div>

      <div className="mt-4 flex gap-1.5">
        {steps.map((_, index) => (
          <div
            key={index}
            className={cn(
              "w-2 h-2 rounded-full transition-colors duration-300",
              index < currentStep
                ? "bg-emerald-500"
                : index === currentStep
                ? "bg-indigo-500"
                : "bg-slate-200"
            )}
          />
        ))}
      </div>
    </motion.div>
  );
}

// =====================================================
// Empty State
// =====================================================

function EmptyState({
  onGenerate,
  isGenerating,
}: {
  onGenerate: () => void;
  isGenerating: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Card className="border-2 border-dashed border-slate-200 bg-slate-50/50">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-6">
            <Users className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            Ready to Generate Segments
          </h3>
          <p className="text-slate-500 text-center max-w-md mb-6">
            Generate 10 distinct audience segments to better understand the different types of customers within your target market.
          </p>
          <Button
            onClick={onGenerate}
            disabled={isGenerating}
            isLoading={isGenerating}
            className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
          >
            <Sparkles className="w-4 h-4" />
            Generate 10 Segments
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
