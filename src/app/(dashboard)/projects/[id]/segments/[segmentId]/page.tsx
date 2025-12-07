"use client";

import { useEffect, useState, use } from "react";
import { createClient } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Accordion } from "@/components/ui/Accordion";
import { Skeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { Segment, Pain } from "@/types";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export default function SegmentDetailPage({
    params,
}: {
    params: Promise<{ id: string; segmentId: string }>;
}) {
    const { id, segmentId } = use(params);
    const [segment, setSegment] = useState<Segment | null>(null);
    const [pains, setPains] = useState<Pain[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        async function fetchData() {
            try {
                // Fetch segment
                const { data: segmentData, error: segmentError } = await supabase
                    .from("segments")
                    .select("*")
                    .eq("id", segmentId)
                    .single();

                if (segmentError) throw segmentError;
                setSegment(segmentData);

                // Fetch pains
                const { data: painsData, error: painsError } = await supabase
                    .from("pains")
                    .select("*")
                    .eq("segment_id", segmentId);

                if (painsError) throw painsError;
                setPains(painsData || []);
            } catch (error) {
                console.error("Error fetching segment data:", error);
            } finally {
                setIsLoading(false);
            }
        }

        fetchData();
    }, [segmentId, supabase]);

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-12 w-64" />
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-96 w-full" />
            </div>
        );
    }

    if (!segment) {
        return (
            <Card>
                <CardContent className="p-8 text-center">
                    <p className="text-text-secondary">Segment not found</p>
                </CardContent>
            </Card>
        );
    }

    const painItems = pains.map((pain) => ({
        id: pain.id,
        title: (
            <div className="flex items-center gap-2">
                <span>{pain.name}</span>
            </div>
        ),
        content: (
            <div className="space-y-4 text-sm text-text-secondary">
                <div>
                    <h4 className="font-medium text-text-primary mb-2">Description:</h4>
                    <p>{pain.description}</p>
                </div>

                {pain.deep_triggers && pain.deep_triggers.length > 0 && (
                    <div>
                        <h4 className="font-medium text-text-primary mb-2">Deep Triggers:</h4>
                        <ul className="list-disc list-inside space-y-1">
                            {pain.deep_triggers.map((trigger, idx) => (
                                <li key={idx}>{trigger}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {pain.examples && pain.examples.length > 0 && (
                    <div>
                        <h4 className="font-medium text-text-primary mb-2">Examples:</h4>
                        <ul className="list-disc list-inside space-y-1">
                            {pain.examples.map((example, idx) => (
                                <li key={idx} className="italic">&quot;{example}&quot;</li>
                            ))}
                        </ul>
                    </div>
                )}

                {pain.canvas_extended_analysis && (
                    <div>
                        <h4 className="font-medium text-text-primary mb-2">Extended Analysis:</h4>
                        <p className="whitespace-pre-wrap">{pain.canvas_extended_analysis}</p>
                    </div>
                )}
            </div>
        ),
    }));

    return (
        <div className="space-y-6">
            <div>
                <Button variant="ghost" asChild className="mb-4">
                    <Link href={`/projects/${id}/segments`}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Segments
                    </Link>
                </Button>

                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-text-primary">{segment.name}</h1>
                        <p className="mt-2 text-text-secondary">{segment.description}</p>
                    </div>
                    <Badge variant="secondary">#{(segment.segment_index ?? 0) + 1}</Badge>
                </div>
            </div>

            {/* Segment Profile */}
            <Card>
                <CardHeader>
                    <CardTitle>Segment Profile</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <h3 className="font-medium text-text-primary mb-2">Socio-demographics</h3>
                        <p className="text-sm text-text-secondary">{segment.sociodemographics}</p>
                    </div>

                    {segment.needs && segment.needs.length > 0 && (
                        <div>
                            <h3 className="font-medium text-text-primary mb-2">Needs</h3>
                            <ul className="list-disc list-inside space-y-1 text-sm text-text-secondary">
                                {segment.needs.map((need, idx) => (
                                    <li key={idx}>{typeof need === 'string' ? need : need.need}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {segment.triggers && segment.triggers.length > 0 && (
                        <div>
                            <h3 className="font-medium text-text-primary mb-2">Deep Triggers</h3>
                            <ul className="list-disc list-inside space-y-1 text-sm text-text-secondary">
                                {segment.triggers.map((trigger, idx) => (
                                    <li key={idx}>{typeof trigger === 'string' ? trigger : trigger.trigger}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {segment.core_values && segment.core_values.length > 0 && (
                        <div>
                            <h3 className="font-medium text-text-primary mb-2">Core Values</h3>
                            <ul className="list-disc list-inside space-y-1 text-sm text-text-secondary">
                                {segment.core_values.map((value, idx) => (
                                    <li key={idx}>{typeof value === 'string' ? value : value.value}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Pain Points */}
            <Card>
                <CardHeader>
                    <CardTitle>Pain Points</CardTitle>
                    <CardDescription>
                        {pains.length} pain points identified for this segment
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {pains.length > 0 ? (
                        <Accordion items={painItems} />
                    ) : (
                        <p className="text-sm text-text-secondary">
                            No pain points available yet.
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
