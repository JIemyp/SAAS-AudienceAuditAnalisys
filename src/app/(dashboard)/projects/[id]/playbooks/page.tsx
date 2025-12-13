"use client";

import { use } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Target, Layers, Workflow, Database, ListTree } from "lucide-react";

const DATASETS = [
    { label: "Segments Final", table: "segments" },
    { label: "Segment Details", table: "segment_details" },
    { label: "Pains Ranking (selected)", table: "pains_ranking" },
    { label: "Canvas + Canvas Extended", table: "canvas / canvas_extended" },
    { label: "Strategic Modules", table: "channel_strategy · competitive_intelligence · pricing_psychology · trust_framework · jtbd_context" },
];

export default function PlaybooksPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);

    return (
        <div className="space-y-6" data-project-id={id}>
            <div>
                <p className="text-xs uppercase tracking-wider text-text-secondary mb-1">
                    Project
                </p>
                <h1 className="text-3xl font-semibold text-text-primary">Segment × Pain Playbooks</h1>
                <p className="mt-2 text-text-secondary max-w-3xl">
                    This toolkit will map every selected pain (<code>is_top_pain</code>) inside each approved segment to a TOF → MOF → BOF journey.
                    The sequence is deterministic: <strong>segments_final → pains_ranking → canvas → V5 tables</strong>.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Data Contracts</CardTitle>
                    <CardDescription>Only approved tables feed the automation.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-3">
                    {DATASETS.map((dataset) => (
                        <Badge key={dataset.table} variant="outline" className="gap-1">
                            <Database className="h-3.5 w-3.5" />
                            {dataset.label} · {dataset.table}
                        </Badge>
                    ))}
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="border border-border/70">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-rose-500/10">
                                <Target className="w-5 h-5 text-rose-600" />
                            </div>
                            <div>
                                <CardTitle>Segment Canvas Summary</CardTitle>
                                <CardDescription>
                                    Auto-build landing outline per segment → pain pair.
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm text-text-secondary">
                        <p className="text-text-primary font-medium">Structure:</p>
                        <ul className="space-y-1.5">
                            <li>• Hero: trigger phrase + desired state (jobs + portrait_final).</li>
                            <li>• Insight: pain evidence + root cause (pains + difficulties).</li>
                            <li>• Ritual: how product fits (canvas steps + preferences).</li>
                            <li>• Proof: trust_framework + competitive_intelligence snippets.</li>
                            <li>• CTA: BOF hook (pricing_psychology + offer stack).</li>
                        </ul>
                    </CardContent>
                </Card>

                <Card className="border border-border/70">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-indigo-500/10">
                                <Layers className="w-5 h-5 text-indigo-600" />
                            </div>
                            <div>
                                <CardTitle>Funnel Assets (TOF → BOF)</CardTitle>
                                <CardDescription>
                                    Per pain we keep three artifacts ready for deployment.
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-text-secondary">
                        {[
                            {
                                stage: "TOF",
                                bullets: [
                                    "Insight explainer video",
                                    "Carousel with triggers",
                                    "Quiz / poll CTA",
                                ],
                            },
                            {
                                stage: "MOF",
                                bullets: [
                                    "Landing section wireframe",
                                    "Email nurture snippet",
                                    "Chat-bot question set",
                                ],
                            },
                            {
                                stage: "BOF",
                                bullets: [
                                    "Offer breakdown & objection killer",
                                    "DM/Call script cues",
                                    "Retargeting creative brief",
                                ],
                            },
                        ].map((stage) => (
                            <div key={stage.stage} className="rounded-2xl border border-border/60 p-4">
                                <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">
                                    {stage.stage}
                                </p>
                                <ul className="space-y-1">
                                    {stage.bullets.map((item) => (
                                        <li key={item} className="flex gap-2">
                                            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-text-primary" />
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-emerald-500/10">
                            <Workflow className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                            <CardTitle>Automation Blueprint</CardTitle>
                            <CardDescription>How the system will decide what to ship.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-text-secondary">
                    <div className="rounded-2xl border border-border/60 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">
                            Rule Set
                        </p>
                        <ol className="space-y-1.5 list-decimal list-inside">
                            <li>Fetch segments where <code>status = approved</code>.</li>
                            <li>Join pains_ranking → keep rows with <code>is_top_pain = true</code>.</li>
                            <li>Pull canvas + canvas_extended for each (project_id, segment_id, pain_id).</li>
                            <li>Attach V5 data (channel_strategy … jtbd_context) for enrichment.</li>
                            <li>Emit assets grouped by stage (landing, ads, chat, email).</li>
                        </ol>
                    </div>
                    <div className="rounded-2xl border border-border/60 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">
                            Deliverables
                        </p>
                        <ul className="space-y-1.5">
                            <li>• CSV/JSON export keyed by segment_id + pain_id.</li>
                            <li>• Notion / Slides outline per combination.</li>
                            <li>• API endpoint for ads creative generator.</li>
                        </ul>
                    </div>
                    <p className="text-text-primary font-medium">
                        Every change in approved data triggers a regeneration so playbooks never drift from the source of truth.
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Future Enhancements</CardTitle>
                    <CardDescription>Low-effort ideas once data contracts are stable.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-text-secondary">
                    {[
                        {
                            title: "AI Drafted Ad Sets",
                            points: [
                                "Use jobs + triggers to generate headlines/body.",
                                "Autofill TOF/MOF/BOF asset metadata.",
                            ],
                        },
                        {
                            title: "Site Builder Sync",
                            points: [
                                "Export landing outline to Webflow/Framer blocks.",
                                "Mirror updates whenever canvas_extended changes.",
                            ],
                        },
                        {
                            title: "Chat-bot Kit",
                            points: [
                                "Provide JSON intents/responses keyed by pain.",
                                "Map CTA to MOF vs BOF offers.",
                            ],
                        },
                        {
                            title: "Sales Room",
                            points: [
                                "Bundle trust_framework proof + pricing objections.",
                                "Track acceptance via JTBD context fields.",
                            ],
                        },
                    ].map((item) => (
                        <div key={item.title} className="rounded-2xl border border-border/60 p-4">
                            <div className="flex items-center gap-2 mb-2 text-text-primary">
                                <ListTree className="h-4 w-4" />
                                <p className="font-semibold">{item.title}</p>
                            </div>
                            <ul className="space-y-1">
                                {item.points.map((point) => (
                                    <li key={point} className="flex gap-2">
                                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-text-primary" />
                                        <span>{point}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
}
