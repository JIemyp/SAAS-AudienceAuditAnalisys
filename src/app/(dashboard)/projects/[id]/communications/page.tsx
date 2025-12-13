"use client";

import { use } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { MessageCircle, Bot, Share2, CalendarClock, Database } from "lucide-react";

const DATA_SOURCES = [
    { label: "Segments Final", table: "segments" },
    { label: "Jobs", table: "jobs" },
    { label: "Preferences", table: "preferences" },
    { label: "Difficulties", table: "difficulties" },
    { label: "Triggers", table: "triggers" },
    { label: "Canvas Extended", table: "canvas_extended" },
];

export default function CommunicationsPage({
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
                <h1 className="text-3xl font-semibold text-text-primary">Communications Playbook</h1>
                <p className="mt-2 text-text-secondary max-w-3xl">
                    Unified orchestration for social, owned media, and conversational funnels.
                    Every block will reuse the <strong>approved</strong> persona stack:
                    segments → jobs → pains → canvas.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Data Inputs</CardTitle>
                    <CardDescription>
                        Quick reference showing which tables feed each comms artifact.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-3">
                    {DATA_SOURCES.map((source) => (
                        <Badge key={source.table} variant="outline" className="gap-1">
                            <Database className="h-3.5 w-3.5" />
                            {source.label} · {source.table}
                        </Badge>
                    ))}
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {[
                    {
                        title: "Organic Rhythm",
                        icon: Share2,
                        gradient: "from-sky-500/10 to-transparent",
                        description: "Weekly/daily cadence mixing insights, proof, and CTA posts.",
                        bullets: [
                            "TOF = insights (preferences + jobs).",
                            "MOF = segment-proof & success rituals.",
                            "BOF = canvas hooks + offer snippets.",
                        ],
                        extras: "Supports cross-posting matrix per channel.",
                    },
                    {
                        title: "Conversation Funnel",
                        icon: MessageCircle,
                        gradient: "from-emerald-500/10 to-transparent",
                        description: "Comment → DM → Chat-bot flows with progressive profiling.",
                        bullets: [
                            "Entry keywords linked to pains/triggers.",
                            "Branching logic uses difficulties & objections.",
                            "Handoff to sales with JTBD context + CTA.",
                        ],
                        extras: "Can plug into quiz or messenger widget.",
                    },
                    {
                        title: "Chat-bot Scripts",
                        icon: Bot,
                        gradient: "from-violet-500/10 to-transparent",
                        description: "Per segment bot blueprint (welcome → nurture → qualify).",
                        bullets: [
                            "Greeting adopts portrait tone.",
                            "Need discovery = jobs + pains ranking.",
                            "Recommendations sourced from canvas_extended actions.",
                        ],
                        extras: "Exports as JSON for Typeform/Botpress.",
                    },
                ].map((block) => (
                    <Card key={block.title} className="border border-border/70">
                        <CardHeader className="space-y-3">
                            <div className={`inline-flex items-center gap-2 rounded-full bg-gradient-to-r ${block.gradient} px-3 py-1 text-xs font-medium text-text-primary`}>
                                <block.icon className="h-4 w-4" />
                                {block.title}
                            </div>
                            <CardDescription>{block.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm text-text-secondary">
                            <ul className="space-y-1.5">
                                {block.bullets.map((item) => (
                                    <li key={item} className="flex gap-2">
                                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-text-primary" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                            <p className="text-xs uppercase tracking-wide text-text-primary/70">
                                {block.extras}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Campaign Calendar Scaffold</CardTitle>
                    <CardDescription>
                        TOF / MOF / BOF structure for always-on paid + organic mix.
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-text-secondary">
                    {[
                        {
                            title: "TOF — Insight Hooks",
                            items: [
                                "Stories sourced from portrait_final + jobs narratives.",
                                "Video-first (UGC, founders, expert POV).",
                                "CTA to quiz or high-value resource.",
                            ],
                        },
                        {
                            title: "MOF — Proof & Rituals",
                            items: [
                                "Segment-specific objections (difficulties) answered with clips/carousels.",
                                "UGC/testimonials filtered by matching pains.",
                                "Invite to webinar/live Q&A.",
                            ],
                        },
                        {
                            title: "BOF — Conversion Assets",
                            items: [
                                "Canvas hooks to landing sections (problem → solution → impact).",
                                "DM/Chat-bot push with limited offer or consult.",
                                "Retargeting using trust_framework insights.",
                            ],
                        },
                    ].map((column) => (
                        <div key={column.title} className="rounded-2xl border border-border/70 p-4">
                            <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">
                                {column.title}
                            </p>
                            <ul className="space-y-1.5">
                                {column.items.map((item) => (
                                    <li key={item} className="flex gap-2">
                                        <CalendarClock className="h-4 w-4 text-text-secondary shrink-0" />
                                        <span>{item}</span>
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
