"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Segment, Pain } from "@/types";
import {
    Target,
    ChevronDown,
    ChevronUp,
    Pencil,
    Trash2,
    Users,
    Heart,
    Zap,
    Star,
    AlertCircle,
    Brain,
    Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SegmentWithPains extends Segment {
    pains: Pain[];
}

export default function SegmentsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [segments, setSegments] = useState<SegmentWithPains[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedSegments, setExpandedSegments] = useState<Set<string>>(new Set());

    // Edit modal state
    const [editingSegment, setEditingSegment] = useState<SegmentWithPains | null>(null);
    const [editForm, setEditForm] = useState({ name: "", description: "", sociodemographics: "" });
    const [isSaving, setIsSaving] = useState(false);

    // Delete modal state
    const [deletingSegment, setDeletingSegment] = useState<SegmentWithPains | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Pain edit/delete state
    const [editingPain, setEditingPain] = useState<Pain | null>(null);
    const [editPainForm, setEditPainForm] = useState({ name: "", description: "" });
    const [deletingPain, setDeletingPain] = useState<Pain | null>(null);

    const supabase = createClient();

    const fetchSegments = async () => {
        try {
            const { data: segmentsData, error: segmentsError } = await supabase
                .from("audience_segments")
                .select("*")
                .eq("project_id", id)
                .order("order_index", { ascending: true });

            if (segmentsError) throw segmentsError;

            const segmentIds = segmentsData?.map((s) => s.id) || [];

            let painsData: Pain[] = [];
            if (segmentIds.length > 0) {
                const { data, error: painsError } = await supabase
                    .from("pains")
                    .select("*")
                    .in("segment_id", segmentIds);

                if (painsError) throw painsError;
                painsData = data || [];
            }

            const segmentsWithPains: SegmentWithPains[] = (segmentsData || []).map((segment) => ({
                ...segment,
                pains: painsData.filter((pain) => pain.segment_id === segment.id),
            }));

            setSegments(segmentsWithPains);
        } catch (error) {
            console.error("Error fetching segments:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSegments();
    }, [id, supabase]);

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

    const expandAll = () => setExpandedSegments(new Set(segments.map((s) => s.id)));
    const collapseAll = () => setExpandedSegments(new Set());

    // Edit segment handlers
    const openEditModal = (segment: SegmentWithPains) => {
        setEditingSegment(segment);
        setEditForm({
            name: segment.name,
            description: segment.description,
            sociodemographics: segment.sociodemographics,
        });
    };

    const handleSaveSegment = async () => {
        if (!editingSegment) return;
        setIsSaving(true);
        try {
            const res = await fetch(`/api/segments/${editingSegment.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editForm),
            });
            if (!res.ok) throw new Error("Failed to update segment");
            await fetchSegments();
            setEditingSegment(null);
        } catch (error) {
            console.error("Error updating segment:", error);
        } finally {
            setIsSaving(false);
        }
    };

    // Delete segment handlers
    const handleDeleteSegment = async () => {
        if (!deletingSegment) return;
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/segments/${deletingSegment.id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete segment");
            await fetchSegments();
            setDeletingSegment(null);
        } catch (error) {
            console.error("Error deleting segment:", error);
        } finally {
            setIsDeleting(false);
        }
    };

    // Pain edit handlers
    const openPainEditModal = (pain: Pain) => {
        setEditingPain(pain);
        setEditPainForm({ name: pain.name, description: pain.description });
    };

    const handleSavePain = async () => {
        if (!editingPain) return;
        setIsSaving(true);
        try {
            const res = await fetch(`/api/pains/${editingPain.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editPainForm),
            });
            if (!res.ok) throw new Error("Failed to update pain");
            await fetchSegments();
            setEditingPain(null);
        } catch (error) {
            console.error("Error updating pain:", error);
        } finally {
            setIsSaving(false);
        }
    };

    // Pain delete handlers
    const handleDeletePain = async () => {
        if (!deletingPain) return;
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/pains/${deletingPain.id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete pain");
            await fetchSegments();
            setDeletingPain(null);
        } catch (error) {
            console.error("Error deleting pain:", error);
        } finally {
            setIsDeleting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-12 w-64" />
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-48 w-full" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-text-primary tracking-tight">
                        Audience Segments
                    </h1>
                    <p className="mt-2 text-text-secondary">
                        {segments.length} unique segments identified based on your product data
                    </p>
                </div>
                {segments.length > 0 && (
                    <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={expandAll}>
                            Expand All
                        </Button>
                        <Button variant="ghost" size="sm" onClick={collapseAll}>
                            Collapse All
                        </Button>
                    </div>
                )}
            </div>

            {/* No Segments State */}
            {segments.length === 0 ? (
                <Card>
                    <CardContent className="p-12 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-bg-secondary flex items-center justify-center">
                            <Target className="w-8 h-8 text-text-secondary" />
                        </div>
                        <p className="text-text-secondary text-lg">No segments available yet.</p>
                        <p className="text-text-secondary text-sm mt-1">The analysis may still be processing.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {segments.map((segment, index) => (
                        <SegmentCard
                            key={segment.id}
                            segment={segment}
                            index={index}
                            isExpanded={expandedSegments.has(segment.id)}
                            onToggle={() => toggleSegment(segment.id)}
                            onEdit={() => openEditModal(segment)}
                            onDelete={() => setDeletingSegment(segment)}
                            onEditPain={openPainEditModal}
                            onDeletePain={setDeletingPain}
                        />
                    ))}
                </div>
            )}

            {/* Edit Segment Modal */}
            <Modal
                isOpen={!!editingSegment}
                onClose={() => setEditingSegment(null)}
                title="Edit Segment"
                description="Update the segment details"
                className="max-w-2xl"
                footer={
                    <>
                        <Button variant="outline" onClick={() => setEditingSegment(null)} disabled={isSaving}>
                            Cancel
                        </Button>
                        <Button onClick={handleSaveSegment} disabled={isSaving}>
                            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Save Changes
                        </Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-text-primary mb-1.5">Name</label>
                        <input
                            type="text"
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            className="w-full px-3 py-2 border border-border rounded-lg bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-primary mb-1.5">Description</label>
                        <textarea
                            value={editForm.description}
                            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                            rows={3}
                            className="w-full px-3 py-2 border border-border rounded-lg bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-primary mb-1.5">Socio-demographics</label>
                        <textarea
                            value={editForm.sociodemographics}
                            onChange={(e) => setEditForm({ ...editForm, sociodemographics: e.target.value })}
                            rows={3}
                            className="w-full px-3 py-2 border border-border rounded-lg bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                        />
                    </div>
                </div>
            </Modal>

            {/* Delete Segment Confirmation Modal */}
            <Modal
                isOpen={!!deletingSegment}
                onClose={() => setDeletingSegment(null)}
                title="Delete Segment"
                description="Are you sure you want to delete this segment? This action cannot be undone."
                footer={
                    <>
                        <Button variant="outline" onClick={() => setDeletingSegment(null)} disabled={isDeleting}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteSegment} disabled={isDeleting}>
                            {isDeleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Delete Segment
                        </Button>
                    </>
                }
            >
                {deletingSegment && (
                    <div className="bg-error/10 border border-error/20 rounded-lg p-4">
                        <p className="font-medium text-text-primary">{deletingSegment.name}</p>
                        <p className="text-sm text-text-secondary mt-1">
                            This will also delete {deletingSegment.pains.length} associated pain point{deletingSegment.pains.length !== 1 ? "s" : ""}.
                        </p>
                    </div>
                )}
            </Modal>

            {/* Edit Pain Modal */}
            <Modal
                isOpen={!!editingPain}
                onClose={() => setEditingPain(null)}
                title="Edit Pain Point"
                description="Update the pain point details"
                footer={
                    <>
                        <Button variant="outline" onClick={() => setEditingPain(null)} disabled={isSaving}>
                            Cancel
                        </Button>
                        <Button onClick={handleSavePain} disabled={isSaving}>
                            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Save Changes
                        </Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-text-primary mb-1.5">Name</label>
                        <input
                            type="text"
                            value={editPainForm.name}
                            onChange={(e) => setEditPainForm({ ...editPainForm, name: e.target.value })}
                            className="w-full px-3 py-2 border border-border rounded-lg bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-primary mb-1.5">Description</label>
                        <textarea
                            value={editPainForm.description}
                            onChange={(e) => setEditPainForm({ ...editPainForm, description: e.target.value })}
                            rows={4}
                            className="w-full px-3 py-2 border border-border rounded-lg bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                        />
                    </div>
                </div>
            </Modal>

            {/* Delete Pain Confirmation Modal */}
            <Modal
                isOpen={!!deletingPain}
                onClose={() => setDeletingPain(null)}
                title="Delete Pain Point"
                description="Are you sure you want to delete this pain point?"
                footer={
                    <>
                        <Button variant="outline" onClick={() => setDeletingPain(null)} disabled={isDeleting}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDeletePain} disabled={isDeleting}>
                            {isDeleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Delete Pain
                        </Button>
                    </>
                }
            >
                {deletingPain && (
                    <div className="bg-error/10 border border-error/20 rounded-lg p-4">
                        <p className="font-medium text-text-primary">{deletingPain.name}</p>
                    </div>
                )}
            </Modal>
        </div>
    );
}

// Segment Card Component
function SegmentCard({
    segment,
    index,
    isExpanded,
    onToggle,
    onEdit,
    onDelete,
    onEditPain,
    onDeletePain,
}: {
    segment: SegmentWithPains;
    index: number;
    isExpanded: boolean;
    onToggle: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onEditPain: (pain: Pain) => void;
    onDeletePain: (pain: Pain) => void;
}) {
    const colorSchemes = [
        { border: "border-l-blue-500", bg: "bg-blue-500/10", text: "text-blue-600" },
        { border: "border-l-purple-500", bg: "bg-purple-500/10", text: "text-purple-600" },
        { border: "border-l-emerald-500", bg: "bg-emerald-500/10", text: "text-emerald-600" },
        { border: "border-l-amber-500", bg: "bg-amber-500/10", text: "text-amber-600" },
        { border: "border-l-rose-500", bg: "bg-rose-500/10", text: "text-rose-600" },
        { border: "border-l-cyan-500", bg: "bg-cyan-500/10", text: "text-cyan-600" },
    ];

    const colors = colorSchemes[index % colorSchemes.length];

    return (
        <Card className={cn("border-l-4 transition-all duration-200", colors.border)}>
            <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1 cursor-pointer" onClick={onToggle}>
                        <div className={cn("p-3 rounded-xl", colors.bg)}>
                            <Target className={cn("w-6 h-6", colors.text)} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-1">
                                <Badge variant="secondary" className="text-xs">Segment {index + 1}</Badge>
                                {segment.pains.length > 0 && (
                                    <Badge variant="outline" className="text-xs gap-1">
                                        <AlertCircle className="w-3 h-3" />
                                        {segment.pains.length} pain{segment.pains.length !== 1 ? "s" : ""}
                                    </Badge>
                                )}
                            </div>
                            <CardTitle className="text-xl mb-2">{segment.name}</CardTitle>
                            <p className="text-sm text-text-secondary line-clamp-2">{segment.description}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onEdit}>
                            <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-error hover:text-error hover:bg-error/10" onClick={onDelete}>
                            <Trash2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onToggle}>
                            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </Button>
                    </div>
                </div>
            </CardHeader>

            {isExpanded && (
                <CardContent className="pt-0 space-y-6">
                    <div className="border-t border-border pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <ProfileSection icon={<Users className="w-4 h-4" />} title="Socio-demographics" content={segment.sociodemographics} />
                            {segment.needs?.length > 0 && <ListSection icon={<Heart className="w-4 h-4" />} title="Needs" items={segment.needs} variant="rose" />}
                            {segment.triggers?.length > 0 && <ListSection icon={<Zap className="w-4 h-4" />} title="Deep Triggers" items={segment.triggers} variant="amber" />}
                            {segment.core_values?.length > 0 && <ListSection icon={<Star className="w-4 h-4" />} title="Core Values" items={segment.core_values} variant="emerald" />}
                        </div>

                        {segment.pains.length > 0 && (
                            <div className="mt-8">
                                <div className="flex items-center gap-2 mb-4">
                                    <Brain className="w-5 h-5 text-red-500" />
                                    <h3 className="text-lg font-semibold text-text-primary">Pain Points</h3>
                                    <Badge variant="secondary" className="ml-2">{segment.pains.length}</Badge>
                                </div>
                                <div className="grid grid-cols-1 gap-3">
                                    {segment.pains.map((pain) => (
                                        <PainCard key={pain.id} pain={pain} onEdit={() => onEditPain(pain)} onDelete={() => onDeletePain(pain)} />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            )}
        </Card>
    );
}

function ProfileSection({ icon, title, content }: { icon: React.ReactNode; title: string; content: string }) {
    if (!content) return null;
    return (
        <div>
            <div className="flex items-center gap-2 mb-2">
                <span className="text-text-secondary">{icon}</span>
                <p className="text-xs font-medium text-text-secondary uppercase tracking-wider">{title}</p>
            </div>
            <p className="text-sm text-text-primary leading-relaxed">{content}</p>
        </div>
    );
}

type ListItem = string | { need?: string; trigger?: string; value?: string };

function getItemText(item: ListItem): string {
    if (typeof item === "string") return item;
    return item.need || item.trigger || item.value || "";
}

function ListSection({ icon, title, items, variant = "default" }: { icon: React.ReactNode; title: string; items: ListItem[]; variant?: "default" | "rose" | "amber" | "emerald" }) {
    if (!items?.length) return null;
    const dotColors = { default: "bg-accent", rose: "bg-rose-500", amber: "bg-amber-500", emerald: "bg-emerald-500" };
    return (
        <div>
            <div className="flex items-center gap-2 mb-2">
                <span className="text-text-secondary">{icon}</span>
                <p className="text-xs font-medium text-text-secondary uppercase tracking-wider">{title}</p>
            </div>
            <ul className="space-y-1.5">
                {items.map((item, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-text-primary">
                        <span className={cn("w-1.5 h-1.5 rounded-full mt-2 shrink-0", dotColors[variant])} />
                        {getItemText(item)}
                    </li>
                ))}
            </ul>
        </div>
    );
}

function PainCard({ pain, onEdit, onDelete }: { pain: Pain; onEdit: () => void; onDelete: () => void }) {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-lg p-4">
            <div className="flex items-start justify-between cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                <div className="flex-1">
                    <h4 className="font-medium text-text-primary">{pain.name}</h4>
                    {!isExpanded && <p className="text-sm text-text-secondary mt-1 line-clamp-2">{pain.description}</p>}
                </div>
                <div className="flex items-center gap-2 ml-4">
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); onEdit(); }}>
                        <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-error hover:text-error hover:bg-error/10" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
                        <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
                </div>
            </div>

            {isExpanded && (
                <div className="mt-4 space-y-4 text-sm">
                    <div>
                        <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-1">Description</p>
                        <p className="text-text-primary">{pain.description}</p>
                    </div>
                    {pain.deep_triggers?.length > 0 && (
                        <div>
                            <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">Deep Triggers</p>
                            <ul className="space-y-1">
                                {pain.deep_triggers.map((trigger, idx) => (
                                    <li key={idx} className="flex items-start gap-2 text-text-primary">
                                        <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2 shrink-0" />
                                        {trigger}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {pain.examples?.length > 0 && (
                        <div>
                            <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-2">Examples</p>
                            <ul className="space-y-2">
                                {pain.examples.map((example, idx) => (
                                    <li key={idx} className="text-text-secondary italic pl-3 border-l-2 border-red-300">&quot;{example}&quot;</li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {pain.canvas_extended_analysis && (
                        <div>
                            <p className="text-xs font-medium text-text-secondary uppercase tracking-wider mb-1">Extended Analysis</p>
                            <p className="text-text-primary whitespace-pre-wrap">{pain.canvas_extended_analysis}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
