"use client";

import { useEffect, useState, use } from "react";
import { createClient } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Segment, Pain } from "@/types";
import {
    AlertCircle,
    ChevronDown,
    ChevronUp,
    Pencil,
    Trash2,
    Target,
    Zap,
    MessageSquareQuote,
    Brain,
    Filter,
    Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PainWithSegment extends Pain {
    segment: {
        id: string;
        name: string;
        order_index: number;
    };
}

export default function PainsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [pains, setPains] = useState<PainWithSegment[]>([]);
    const [segments, setSegments] = useState<Segment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedPains, setExpandedPains] = useState<Set<string>>(new Set());
    const [selectedSegment, setSelectedSegment] = useState<string | null>(null);

    // Edit modal state
    const [editingPain, setEditingPain] = useState<PainWithSegment | null>(null);
    const [editForm, setEditForm] = useState({ name: "", description: "" });
    const [isSaving, setIsSaving] = useState(false);

    // Delete modal state
    const [deletingPain, setDeletingPain] = useState<PainWithSegment | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const supabase = createClient();

    const fetchData = async () => {
        try {
            const { data: segmentsData, error: segmentsError } = await supabase
                .from("audience_segments")
                .select("*")
                .eq("project_id", id)
                .order("order_index", { ascending: true });

            if (segmentsError) throw segmentsError;
            setSegments(segmentsData || []);

            const segmentIds = segmentsData?.map((s) => s.id) || [];

            if (segmentIds.length > 0) {
                const { data: painsData, error: painsError } = await supabase
                    .from("pains")
                    .select("*")
                    .in("segment_id", segmentIds);

                if (painsError) throw painsError;

                const painsWithSegments: PainWithSegment[] = (painsData || []).map((pain) => {
                    const segment = segmentsData?.find((s) => s.id === pain.segment_id);
                    return {
                        ...pain,
                        segment: {
                            id: segment?.id || "",
                            name: segment?.name || "Unknown Segment",
                            order_index: segment?.order_index || 0,
                        },
                    };
                });

                painsWithSegments.sort((a, b) => {
                    if (a.segment.order_index !== b.segment.order_index) {
                        return a.segment.order_index - b.segment.order_index;
                    }
                    return a.name.localeCompare(b.name);
                });

                setPains(painsWithSegments);
            }
        } catch (error) {
            console.error("Error fetching pains:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [id, supabase]);

    const togglePain = (painId: string) => {
        setExpandedPains((prev) => {
            const next = new Set(prev);
            if (next.has(painId)) {
                next.delete(painId);
            } else {
                next.add(painId);
            }
            return next;
        });
    };

    const filteredPains = selectedSegment
        ? pains.filter((p) => p.segment.id === selectedSegment)
        : pains;

    const expandAll = () => setExpandedPains(new Set(filteredPains.map((p) => p.id)));
    const collapseAll = () => setExpandedPains(new Set());

    // Edit handlers
    const openEditModal = (pain: PainWithSegment) => {
        setEditingPain(pain);
        setEditForm({ name: pain.name, description: pain.description });
    };

    const handleSave = async () => {
        if (!editingPain) return;
        setIsSaving(true);
        try {
            const res = await fetch(`/api/pains/${editingPain.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editForm),
            });
            if (!res.ok) throw new Error("Failed to update pain");
            await fetchData();
            setEditingPain(null);
        } catch (error) {
            console.error("Error updating pain:", error);
        } finally {
            setIsSaving(false);
        }
    };

    // Delete handlers
    const handleDelete = async () => {
        if (!deletingPain) return;
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/pains/${deletingPain.id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete pain");
            await fetchData();
            setDeletingPain(null);
        } catch (error) {
            console.error("Error deleting pain:", error);
        } finally {
            setIsDeleting(false);
        }
    };

    const painsBySegment = filteredPains.reduce(
        (acc, pain) => {
            const segmentId = pain.segment.id;
            if (!acc[segmentId]) {
                acc[segmentId] = { segment: pain.segment, pains: [] };
            }
            acc[segmentId].pains.push(pain);
            return acc;
        },
        {} as Record<string, { segment: PainWithSegment["segment"]; pains: PainWithSegment[] }>
    );

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-12 w-64" />
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
                    <h1 className="text-3xl font-bold text-text-primary tracking-tight">Pain Points</h1>
                    <p className="mt-2 text-text-secondary">
                        {pains.length} pain points identified across {segments.length} segments
                    </p>
                </div>
                {pains.length > 0 && (
                    <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={expandAll}>Expand All</Button>
                        <Button variant="ghost" size="sm" onClick={collapseAll}>Collapse All</Button>
                    </div>
                )}
            </div>

            {/* Segment Filter */}
            {segments.length > 1 && (
                <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2 text-sm text-text-secondary">
                        <Filter className="w-4 h-4" />
                        <span>Filter by segment:</span>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        <Button
                            variant={selectedSegment === null ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedSegment(null)}
                        >
                            All ({pains.length})
                        </Button>
                        {segments.map((segment) => {
                            const count = pains.filter((p) => p.segment.id === segment.id).length;
                            return (
                                <Button
                                    key={segment.id}
                                    variant={selectedSegment === segment.id ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setSelectedSegment(segment.id)}
                                    className="gap-1"
                                >
                                    <span className="max-w-32 truncate">{segment.name}</span>
                                    <Badge variant="secondary" className="ml-1 text-xs">{count}</Badge>
                                </Button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* No Pains State */}
            {pains.length === 0 ? (
                <Card>
                    <CardContent className="p-12 text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-bg-secondary flex items-center justify-center">
                            <AlertCircle className="w-8 h-8 text-text-secondary" />
                        </div>
                        <p className="text-text-secondary text-lg">No pain points available yet.</p>
                        <p className="text-text-secondary text-sm mt-1">The analysis may still be processing.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-8">
                    {Object.values(painsBySegment).map(({ segment, pains: segmentPains }) => (
                        <div key={segment.id}>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-accent/10 rounded-lg">
                                    <Target className="w-5 h-5 text-accent" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-text-primary">{segment.name}</h2>
                                    <p className="text-sm text-text-secondary">
                                        {segmentPains.length} pain point{segmentPains.length !== 1 ? "s" : ""}
                                    </p>
                                </div>
                            </div>
                            <div className="space-y-3 ml-2 pl-6 border-l-2 border-accent/20">
                                {segmentPains.map((pain) => (
                                    <PainCard
                                        key={pain.id}
                                        pain={pain}
                                        isExpanded={expandedPains.has(pain.id)}
                                        onToggle={() => togglePain(pain.id)}
                                        onEdit={() => openEditModal(pain)}
                                        onDelete={() => setDeletingPain(pain)}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Edit Modal */}
            <Modal
                isOpen={!!editingPain}
                onClose={() => setEditingPain(null)}
                title="Edit Pain Point"
                description="Update the pain point details"
                footer={
                    <>
                        <Button variant="outline" onClick={() => setEditingPain(null)} disabled={isSaving}>Cancel</Button>
                        <Button onClick={handleSave} disabled={isSaving}>
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
                            rows={4}
                            className="w-full px-3 py-2 border border-border rounded-lg bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                        />
                    </div>
                </div>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={!!deletingPain}
                onClose={() => setDeletingPain(null)}
                title="Delete Pain Point"
                description="Are you sure you want to delete this pain point? This action cannot be undone."
                footer={
                    <>
                        <Button variant="outline" onClick={() => setDeletingPain(null)} disabled={isDeleting}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                            {isDeleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Delete Pain
                        </Button>
                    </>
                }
            >
                {deletingPain && (
                    <div className="bg-error/10 border border-error/20 rounded-lg p-4">
                        <p className="font-medium text-text-primary">{deletingPain.name}</p>
                        <p className="text-sm text-text-secondary mt-1">From segment: {deletingPain.segment.name}</p>
                    </div>
                )}
            </Modal>
        </div>
    );
}

function PainCard({
    pain,
    isExpanded,
    onToggle,
    onEdit,
    onDelete,
}: {
    pain: PainWithSegment;
    isExpanded: boolean;
    onToggle: () => void;
    onEdit: () => void;
    onDelete: () => void;
}) {
    return (
        <Card className="border-l-4 border-l-red-500">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1 cursor-pointer" onClick={onToggle}>
                        <div className="p-2 bg-red-500/10 rounded-lg">
                            <AlertCircle className="w-5 h-5 text-red-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <CardTitle className="text-base mb-1">{pain.name}</CardTitle>
                            {!isExpanded && (
                                <p className="text-sm text-text-secondary line-clamp-2">{pain.description}</p>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-1 ml-4">
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
                <CardContent className="pt-0">
                    <div className="border-t border-border pt-4 space-y-5">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Brain className="w-4 h-4 text-text-secondary" />
                                <p className="text-xs font-medium text-text-secondary uppercase tracking-wider">Description</p>
                            </div>
                            <p className="text-sm text-text-primary leading-relaxed">{pain.description}</p>
                        </div>

                        {pain.deep_triggers?.length > 0 && (
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <Zap className="w-4 h-4 text-amber-500" />
                                    <p className="text-xs font-medium text-text-secondary uppercase tracking-wider">Deep Triggers</p>
                                </div>
                                <ul className="space-y-1.5">
                                    {pain.deep_triggers.map((trigger, idx) => (
                                        <li key={idx} className="flex items-start gap-2 text-sm text-text-primary">
                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                                            {trigger}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {pain.examples?.length > 0 && (
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <MessageSquareQuote className="w-4 h-4 text-blue-500" />
                                    <p className="text-xs font-medium text-text-secondary uppercase tracking-wider">Customer Quotes</p>
                                </div>
                                <div className="space-y-2">
                                    {pain.examples.map((example, idx) => (
                                        <blockquote key={idx} className="text-sm text-text-secondary italic pl-4 border-l-2 border-blue-300 py-1">
                                            &quot;{example}&quot;
                                        </blockquote>
                                    ))}
                                </div>
                            </div>
                        )}

                        {pain.canvas_extended_analysis && (
                            <div className="bg-bg-secondary/50 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <Brain className="w-4 h-4 text-purple-500" />
                                    <p className="text-xs font-medium text-text-secondary uppercase tracking-wider">Extended Analysis</p>
                                </div>
                                <p className="text-sm text-text-primary whitespace-pre-wrap leading-relaxed">{pain.canvas_extended_analysis}</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            )}
        </Card>
    );
}
