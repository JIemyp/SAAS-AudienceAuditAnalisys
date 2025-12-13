"use client";

import { use } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Sparkles, Target, Lightbulb, Database } from "lucide-react";

export default function InsightsPage({
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
                <h1 className="text-3xl font-semibold text-text-primary">Insights & Takeaways</h1>
                <p className="mt-2 text-text-secondary max-w-3xl">
                    Everything in this section is calculated from{" "}
                    <strong>segments_final + segment_details</strong> (for context) and{" "}
                    <strong>jobs, preferences, difficulties, triggers</strong> (for motivations and blockers).
                    No draft tables participate here, so the summaries always reflect approved data.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {[
                    {
                        title: "Executive Summary",
                        icon: Sparkles,
                        description: "Top 3 growth bets derived from JTBD + triggers overlap.",
                        bullets: [
                            "Segment priorities scored by market size × urgency.",
                            "Recommended positioning pillars (final portrait).",
                            "Next best question to validate in research.",
                        ],
                        sources: ["portrait_final", "segments_final", "triggers"],
                    },
                    {
                        title: "Segment Snapshots",
                        icon: Target,
                        description: "Mini-briefs (who/what/why/when) for each approved segment.",
                        bullets: [
                            "Behaviors & motivations pulled from segment_details.",
                            "Top pains per segment (pains + pains_ranking).",
                            "Adoption barriers sourced from difficulties.",
                        ],
                        sources: ["segment_details", "pains_ranking"],
                    },
                    {
                        title: "Opportunity Radar",
                        icon: Lightbulb,
                        description: "Matrix of unmet needs vs. current messaging coverage.",
                        bullets: [
                            "Jobs vs. benefits gap heatmap.",
                            "Triggers vs. purchase window timeline.",
                            "Risk alerts when signals contradict.",
                        ],
                        sources: ["jobs", "preferences", "triggers"],
                    },
                ].map((card) => (
                    <Card key={card.title} className="border border-border/70">
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-bg-secondary">
                                    <card.icon className="w-5 h-5 text-text-primary" />
                                </div>
                                <div>
                                    <CardTitle>{card.title}</CardTitle>
                                    <CardDescription>{card.description}</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <ul className="space-y-2 text-sm text-text-secondary">
                                {card.bullets.map((item) => (
                                    <li key={item} className="flex gap-2">
                                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-accent" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                            <div className="flex flex-wrap gap-2">
                                {card.sources.map((source) => (
                                    <Badge key={source} variant="outline" className="gap-1">
                                        <Database className="h-3.5 w-3.5" />
                                        {source}
                                    </Badge>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>What&apos;s next?</CardTitle>
                    <CardDescription>
                        These summaries feed the activation modules: Communications and Playbooks.
                        Once the pipelines are wired, each card will export to PDF/Notion in one click.
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-text-secondary space-y-2">
                    <p>
                        • <strong>Communications</strong> consumes the qualitative fields (jobs narratives, triggers copy, trust framework)
                        to design evergreen content calendars and conversational scripts.
                    </p>
                    <p>
                        • <strong>Playbooks</strong> pairs each segment with its shortlisted pains (<code>is_top_pain</code>) to offer TOF→MOF→BOF funnels,
                        landing structures, and chat-bot prompts.
                    </p>
                    <p className="text-text-primary font-medium">
                        ✅ No manual uploads needed — once you approve a step, the toolkit stays in sync.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
