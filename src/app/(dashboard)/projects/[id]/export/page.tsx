"use client";

import { useState, use, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  Download,
  FileSpreadsheet,
  FileJson,
  FileText,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";

interface ExportData {
  project: {
    id: string;
    name: string;
    onboarding_data: {
      brandName?: string;
      productService?: string;
      geography?: string;
      businessModel?: string;
    };
  };
  portrait: Record<string, unknown> | null;
  segments: Array<{
    id: string;
    name: string;
    description: string;
    order_index: number;
    sociodemographics?: string;
    details?: Record<string, unknown>;
    // Jobs array
    jobs?: Array<{
      id: string;
      name: string;
      description: string;
      category?: string;
      frequency?: string;
    }>;
    preferences?: Record<string, unknown>;
    difficulties?: Record<string, unknown>;
    // Triggers array
    triggers?: Array<{
      id: string;
      name: string;
      description: string;
      category?: string;
      urgency?: string;
    }>;
    // Pains array
    pains: Array<{
      id: string;
      name: string;
      description: string;
      impact_score: number;
      is_top_pain: boolean;
    }>;
    // Objections array
    objections?: Array<{
      id: string;
      name: string;
      pain_name?: string;
      category?: string;
      strength?: string;
      response_strategy?: string;
    }>;
    // Desires array
    desires?: Array<{
      id: string;
      name: string;
      description: string;
      pain_name?: string;
      intensity?: string;
    }>;
    // Features array
    features?: Array<{
      id: string;
      name: string;
      description: string;
      pain_name?: string;
      priority?: string;
    }>;
    // Canvas array
    canvas: Array<{
      id: string;
      pain_id: string;
      pain_name?: string;
      elevator_pitch?: string;
      unique_value_proposition?: string;
      high_level_concept?: string;
      solution?: string;
      emotional_aspects?: unknown;
      behavioral_patterns?: unknown;
      buying_signals?: unknown;
    }>;
    canvasExtended?: Array<{
      id: string;
      pain_id: string;
      segment_id: string;
      customer_journey?: unknown;
      emotional_map?: unknown;
      narrative_angles?: unknown;
      messaging_framework?: unknown;
      voice_and_tone?: unknown;
    }>;
    // V5 Modules
    channelStrategy?: Record<string, unknown>;
    competitiveIntelligence?: Record<string, unknown>;
    pricingPsychology?: Record<string, unknown>;
    trustFramework?: Record<string, unknown>;
    jtbdContext?: Record<string, unknown>;
    // V6 Modules (per segment)
    ugcCreatorProfile?: Record<string, unknown>;
    strategyPersonalized?: Array<Record<string, unknown>>;
    strategyAds?: Array<Record<string, unknown>>;
    communicationsFunnels?: Array<Record<string, unknown>>;
  }>;
  // V6 Project-level
  strategySummary?: Record<string, unknown>;
  strategyGlobal?: Record<string, unknown>;
}

type ExportFormat = "xlsx" | "json" | "csv";

// Helper to convert JSONB arrays/objects to readable string
function jsonToString(value: unknown): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    return value.map((item, i) => {
      if (typeof item === "string") return `${i + 1}. ${item}`;
      if (typeof item === "object" && item !== null) {
        const obj = item as Record<string, unknown>;
        const name = obj.name || obj.job || obj.emotion || obj.pattern || obj.signal || obj.title;
        const desc = obj.description || obj.text || obj.value;
        if (name && desc) return `${i + 1}. ${name}: ${desc}`;
        if (name) return `${i + 1}. ${name}`;
        if (desc) return `${i + 1}. ${desc}`;
        return `${i + 1}. ${JSON.stringify(obj)}`;
      }
      return `${i + 1}. ${String(item)}`;
    }).join("\n");
  }
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    return Object.entries(obj)
      .filter(([, v]) => v != null)
      .map(([k, v]) => `${k.replace(/_/g, " ")}: ${typeof v === "string" ? v : JSON.stringify(v)}`)
      .join("\n");
  }
  return String(value);
}

export default function ExportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<ExportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [exportingFormat, setExportingFormat] = useState<ExportFormat | null>(null);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/report?projectId=${id}&level=full`);
      const result = await res.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async (format: ExportFormat) => {
    if (!data) return;

    try {
      setExportingFormat(format);
      const brandName = data.project.onboarding_data?.brandName || data.project.name;
      const fileName = `${brandName.toLowerCase().replace(/\s+/g, "-")}-audience-research`;

      switch (format) {
        case "xlsx":
          exportToExcel(data, fileName);
          break;
        case "json":
          exportToJson(data, fileName);
          break;
        case "csv":
          exportToCsv(data, fileName);
          break;
      }

      toast.success(`Exported to ${format.toUpperCase()} successfully!`);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Export failed. Please try again.");
    } finally {
      setExportingFormat(null);
    }
  };

  const exportToExcel = (data: ExportData, fileName: string) => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Summary
    const summaryData = [
      ["Audience Research Report"],
      [""],
      ["Brand", data.project.onboarding_data?.brandName || ""],
      ["Product/Service", data.project.onboarding_data?.productService || ""],
      ["Geography", data.project.onboarding_data?.geography || ""],
      ["Business Model", data.project.onboarding_data?.businessModel || ""],
      [""],
      ["Total Segments", data.segments?.length || 0],
      ["Total Pain Points", data.segments?.reduce((acc, s) => acc + (s.pains?.length || 0), 0) || 0],
      ["Canvas Analyses", data.segments?.reduce((acc, s) => acc + (s.canvas?.length || 0), 0) || 0],
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

    // Sheet 2: Portrait
    if (data.portrait) {
      const portraitData = [
        ["Field", "Value"],
        ...Object.entries(data.portrait)
          .filter(([key]) => !["id", "project_id", "approved_at", "created_at"].includes(key))
          .map(([key, value]) => [
            key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
            typeof value === "string" ? value : JSON.stringify(value),
          ]),
      ];
      const wsPortrait = XLSX.utils.aoa_to_sheet(portraitData);
      XLSX.utils.book_append_sheet(wb, wsPortrait, "Portrait");
    }

    // Sheet 3: Segments
    if (data.segments?.length > 0) {
      const segmentsData = [
        ["#", "Name", "Description", "Sociodemographics", "Psychographics", "Online Behavior", "Buying Behavior"],
        ...data.segments.map((seg) => [
          seg.order_index + 1,
          seg.name,
          seg.description,
          seg.details?.sociodemographics || seg.sociodemographics || "",
          seg.details?.psychographics || "",
          seg.details?.online_behavior || "",
          seg.details?.buying_behavior || "",
        ]),
      ];
      const wsSegments = XLSX.utils.aoa_to_sheet(segmentsData);
      XLSX.utils.book_append_sheet(wb, wsSegments, "Segments");
    }

    // Sheet 4: Jobs
    const jobsData: (string | number)[][] = [
      ["Segment", "Functional Jobs", "Emotional Jobs", "Social Jobs"],
    ];
    data.segments?.forEach((seg) => {
      if (seg.jobs) {
        const jobs = seg.jobs as { functional_jobs?: unknown[]; emotional_jobs?: unknown[]; social_jobs?: unknown[] };
        jobsData.push([
          seg.name,
          jsonToString(jobs.functional_jobs),
          jsonToString(jobs.emotional_jobs),
          jsonToString(jobs.social_jobs),
        ]);
      }
    });
    if (jobsData.length > 1) {
      const wsJobs = XLSX.utils.aoa_to_sheet(jobsData);
      XLSX.utils.book_append_sheet(wb, wsJobs, "Jobs");
    }

    // Sheet 4b: Preferences
    const prefsData: (string | number)[][] = [
      ["Segment", "Preferences"],
    ];
    data.segments?.forEach((seg) => {
      if (seg.preferences) {
        const prefs = seg.preferences as { preferences?: unknown[] };
        prefsData.push([
          seg.name,
          jsonToString(prefs.preferences),
        ]);
      }
    });
    if (prefsData.length > 1) {
      const wsPrefs = XLSX.utils.aoa_to_sheet(prefsData);
      XLSX.utils.book_append_sheet(wb, wsPrefs, "Preferences");
    }

    // Sheet 4c: Difficulties
    const diffsData: (string | number)[][] = [
      ["Segment", "Difficulties"],
    ];
    data.segments?.forEach((seg) => {
      if (seg.difficulties) {
        const diffs = seg.difficulties as { difficulties?: unknown[] };
        diffsData.push([
          seg.name,
          jsonToString(diffs.difficulties),
        ]);
      }
    });
    if (diffsData.length > 1) {
      const wsDiffs = XLSX.utils.aoa_to_sheet(diffsData);
      XLSX.utils.book_append_sheet(wb, wsDiffs, "Difficulties");
    }

    // Sheet 4d: Triggers
    const triggersData: (string | number)[][] = [
      ["Segment", "Triggers"],
    ];
    data.segments?.forEach((seg) => {
      if (seg.triggers) {
        const trigs = seg.triggers as { triggers?: unknown[] };
        triggersData.push([
          seg.name,
          jsonToString(trigs.triggers),
        ]);
      }
    });
    if (triggersData.length > 1) {
      const wsTriggers = XLSX.utils.aoa_to_sheet(triggersData);
      XLSX.utils.book_append_sheet(wb, wsTriggers, "Triggers");
    }

    // Sheet 5: Pains
    const painsData: (string | number)[][] = [
      ["Segment", "Pain Name", "Description", "Impact Score", "Is Top Pain"],
    ];
    data.segments?.forEach((seg) => {
      seg.pains?.forEach((pain) => {
        painsData.push([
          seg.name,
          pain.name,
          pain.description,
          pain.impact_score,
          pain.is_top_pain ? "Yes" : "No",
        ]);
      });
    });
    if (painsData.length > 1) {
      const wsPains = XLSX.utils.aoa_to_sheet(painsData);
      XLSX.utils.book_append_sheet(wb, wsPains, "Pains");
    }

    // Sheet 6: Canvas
    const canvasData: (string | number)[][] = [
      ["Segment", "Pain", "Emotional Aspects", "Behavioral Patterns", "Buying Signals"],
    ];
    data.segments?.forEach((seg) => {
      seg.canvas?.forEach((canvas) => {
        const pain = seg.pains?.find((p) => p.id === canvas.pain_id);
        canvasData.push([
          seg.name,
          pain?.name || "Unknown",
          jsonToString(canvas.emotional_aspects),
          jsonToString(canvas.behavioral_patterns),
          jsonToString(canvas.buying_signals),
        ]);
      });
    });
    if (canvasData.length > 1) {
      const wsCanvas = XLSX.utils.aoa_to_sheet(canvasData);
      XLSX.utils.book_append_sheet(wb, wsCanvas, "Canvas");
    }

    // Sheet 7: Canvas Extended (Deep Analysis)
    const canvasExtData: (string | number)[][] = [
      ["Segment", "Pain", "Customer Journey", "Emotional Map", "Narrative Angles", "Messaging Framework", "Voice & Tone"],
    ];
    data.segments?.forEach((seg) => {
      seg.canvasExtended?.forEach((ext) => {
        const pain = seg.pains?.find((p) => p.id === ext.pain_id);
        canvasExtData.push([
          seg.name,
          pain?.name || "Unknown",
          jsonToString(ext.customer_journey),
          jsonToString(ext.emotional_map),
          jsonToString(ext.narrative_angles),
          jsonToString(ext.messaging_framework),
          jsonToString(ext.voice_and_tone),
        ]);
      });
    });
    if (canvasExtData.length > 1) {
      const wsCanvasExt = XLSX.utils.aoa_to_sheet(canvasExtData);
      XLSX.utils.book_append_sheet(wb, wsCanvasExt, "Canvas Extended");
    }

    // Sheet 8: Channel Strategy (V5)
    const channelStratData: (string | number)[][] = [
      ["Segment", "Primary Channels", "Acquisition", "Engagement", "Retention"],
    ];
    data.segments?.forEach((seg) => {
      if (seg.channelStrategy) {
        const cs = seg.channelStrategy as Record<string, unknown>;
        channelStratData.push([
          seg.name,
          jsonToString(cs.primary_channels),
          jsonToString(cs.acquisition),
          jsonToString(cs.engagement),
          jsonToString(cs.retention),
        ]);
      }
    });
    if (channelStratData.length > 1) {
      const wsChannelStrat = XLSX.utils.aoa_to_sheet(channelStratData);
      XLSX.utils.book_append_sheet(wb, wsChannelStrat, "Channel Strategy");
    }

    // Sheet 9: Competitive Intelligence (V5)
    const compIntelData: (string | number)[][] = [
      ["Segment", "Direct Competitors", "Indirect Competitors", "Market Gaps", "Differentiation"],
    ];
    data.segments?.forEach((seg) => {
      if (seg.competitiveIntelligence) {
        const ci = seg.competitiveIntelligence as Record<string, unknown>;
        compIntelData.push([
          seg.name,
          jsonToString(ci.direct_competitors),
          jsonToString(ci.indirect_competitors),
          jsonToString(ci.market_gaps),
          jsonToString(ci.differentiation),
        ]);
      }
    });
    if (compIntelData.length > 1) {
      const wsCompIntel = XLSX.utils.aoa_to_sheet(compIntelData);
      XLSX.utils.book_append_sheet(wb, wsCompIntel, "Competitive Intel");
    }

    // Sheet 10: Pricing Psychology (V5)
    const pricingData: (string | number)[][] = [
      ["Segment", "Price Perception", "Value Drivers", "Price Sensitivity", "Pricing Recommendations"],
    ];
    data.segments?.forEach((seg) => {
      if (seg.pricingPsychology) {
        const pp = seg.pricingPsychology as Record<string, unknown>;
        pricingData.push([
          seg.name,
          jsonToString(pp.price_perception),
          jsonToString(pp.value_drivers),
          jsonToString(pp.price_sensitivity),
          jsonToString(pp.pricing_recommendations),
        ]);
      }
    });
    if (pricingData.length > 1) {
      const wsPricing = XLSX.utils.aoa_to_sheet(pricingData);
      XLSX.utils.book_append_sheet(wb, wsPricing, "Pricing Psychology");
    }

    // Sheet 11: Trust Framework (V5)
    const trustData: (string | number)[][] = [
      ["Segment", "Trust Signals", "Risk Reducers", "Social Proof", "Guarantees"],
    ];
    data.segments?.forEach((seg) => {
      if (seg.trustFramework) {
        const tf = seg.trustFramework as Record<string, unknown>;
        trustData.push([
          seg.name,
          jsonToString(tf.trust_signals),
          jsonToString(tf.risk_reducers),
          jsonToString(tf.social_proof),
          jsonToString(tf.guarantees),
        ]);
      }
    });
    if (trustData.length > 1) {
      const wsTrust = XLSX.utils.aoa_to_sheet(trustData);
      XLSX.utils.book_append_sheet(wb, wsTrust, "Trust Framework");
    }

    // Sheet 12: JTBD Context (V5)
    const jtbdData: (string | number)[][] = [
      ["Segment", "Main Jobs", "Progress Definition", "Forces Analysis", "Outcome Expectations"],
    ];
    data.segments?.forEach((seg) => {
      if (seg.jtbdContext) {
        const jc = seg.jtbdContext as Record<string, unknown>;
        jtbdData.push([
          seg.name,
          jsonToString(jc.main_jobs),
          jsonToString(jc.progress_definition),
          jsonToString(jc.forces_analysis),
          jsonToString(jc.outcome_expectations),
        ]);
      }
    });
    if (jtbdData.length > 1) {
      const wsJtbd = XLSX.utils.aoa_to_sheet(jtbdData);
      XLSX.utils.book_append_sheet(wb, wsJtbd, "JTBD Context");
    }

    // Sheet 13: Strategy Summary (V6 - Project level)
    if (data.strategySummary) {
      const ss = data.strategySummary as Record<string, unknown>;
      const strategySummaryData = [
        ["Strategy Summary"],
        [""],
        ["Growth Bets"],
        [jsonToString(ss.growth_bets)],
        [""],
        ["Positioning Pillars"],
        [jsonToString(ss.positioning_pillars)],
        [""],
        ["Channel Priorities"],
        [jsonToString(ss.channel_priorities)],
        [""],
        ["Risk Flags"],
        [jsonToString(ss.risk_flags)],
      ];
      const wsStrategySummary = XLSX.utils.aoa_to_sheet(strategySummaryData);
      XLSX.utils.book_append_sheet(wb, wsStrategySummary, "Strategy Summary");
    }

    // Sheet 14: Strategy Global (V6 - Project level)
    if (data.strategyGlobal) {
      const sg = data.strategyGlobal as Record<string, unknown>;
      const strategyGlobalData = [
        ["Global Strategy"],
        [""],
        ["Email Strategy"],
        [jsonToString(sg.email_strategy)],
        [""],
        ["SMS Strategy"],
        [jsonToString(sg.sms_strategy)],
        [""],
        ["Messenger Strategy"],
        [jsonToString(sg.messenger_strategy)],
        [""],
        ["Social Strategy"],
        [jsonToString(sg.social_strategy)],
        [""],
        ["TOF Banners"],
        [jsonToString(sg.tof_banners)],
        [""],
        ["Traffic Channels"],
        [jsonToString(sg.traffic_channels)],
      ];
      const wsStrategyGlobal = XLSX.utils.aoa_to_sheet(strategyGlobalData);
      XLSX.utils.book_append_sheet(wb, wsStrategyGlobal, "Strategy Global");
    }

    // Sheet 15: Strategy Personalized (V6 - per segment × pain)
    const stratPersonalizedData: (string | number)[][] = [
      ["Segment", "Pain", "TOF UGC Hooks", "MOF Quiz Flow", "MOF Chat Script", "BOF Creative Briefs", "BOF Landing Structure"],
    ];
    data.segments?.forEach((seg) => {
      seg.strategyPersonalized?.forEach((sp) => {
        const rec = sp as Record<string, unknown>;
        stratPersonalizedData.push([
          seg.name,
          String(rec.pain_name || ""),
          jsonToString(rec.tof_ugc_hooks),
          jsonToString(rec.mof_quiz_flow),
          jsonToString(rec.mof_chat_script),
          jsonToString(rec.bof_creative_briefs),
          jsonToString(rec.bof_landing_structure),
        ]);
      });
    });
    if (stratPersonalizedData.length > 1) {
      const wsStratPersonalized = XLSX.utils.aoa_to_sheet(stratPersonalizedData);
      XLSX.utils.book_append_sheet(wb, wsStratPersonalized, "Strategy Personal");
    }

    // Sheet 16: Strategy Ads (V6 - per segment × pain)
    const stratAdsData: (string | number)[][] = [
      ["Segment", "Pain", "Channels (Google, Meta, TikTok, etc.)"],
    ];
    data.segments?.forEach((seg) => {
      seg.strategyAds?.forEach((sa) => {
        const rec = sa as Record<string, unknown>;
        stratAdsData.push([
          seg.name,
          String(rec.pain_name || ""),
          jsonToString(rec.channels),
        ]);
      });
    });
    if (stratAdsData.length > 1) {
      const wsStratAds = XLSX.utils.aoa_to_sheet(stratAdsData);
      XLSX.utils.book_append_sheet(wb, wsStratAds, "Strategy Ads");
    }

    // Sheet 17: UGC Creator Profiles (V6 - per segment)
    const ugcData: (string | number)[][] = [
      ["Segment", "Ideal Persona", "Content Topics", "Sourcing Guidance"],
    ];
    data.segments?.forEach((seg) => {
      if (seg.ugcCreatorProfile) {
        const ugc = seg.ugcCreatorProfile as Record<string, unknown>;
        ugcData.push([
          seg.name,
          jsonToString(ugc.ideal_persona),
          jsonToString(ugc.content_topics),
          jsonToString(ugc.sourcing_guidance),
        ]);
      }
    });
    if (ugcData.length > 1) {
      const wsUgc = XLSX.utils.aoa_to_sheet(ugcData);
      XLSX.utils.book_append_sheet(wb, wsUgc, "UGC Creators");
    }

    // Sheet 18: Communications Funnel (V6 - per segment × pain)
    const commsFunnelData: (string | number)[][] = [
      ["Segment", "Pain", "Organic Rhythm", "Conversation Funnel", "Chatbot Scripts"],
    ];
    data.segments?.forEach((seg) => {
      seg.communicationsFunnels?.forEach((cf) => {
        const rec = cf as Record<string, unknown>;
        commsFunnelData.push([
          seg.name,
          String(rec.pain_name || ""),
          jsonToString(rec.organic_rhythm),
          jsonToString(rec.conversation_funnel),
          jsonToString(rec.chatbot_scripts),
        ]);
      });
    });
    if (commsFunnelData.length > 1) {
      const wsCommsFunnel = XLSX.utils.aoa_to_sheet(commsFunnelData);
      XLSX.utils.book_append_sheet(wb, wsCommsFunnel, "Communications");
    }

    XLSX.writeFile(wb, `${fileName}.xlsx`);
  };

  const exportToJson = (data: ExportData, fileName: string) => {
    const exportData = {
      exportedAt: new Date().toISOString(),
      project: {
        name: data.project.name,
        ...data.project.onboarding_data,
      },
      portrait: data.portrait,
      // V6 Project-level
      strategySummary: data.strategySummary,
      strategyGlobal: data.strategyGlobal,
      segments: data.segments?.map((seg) => ({
        name: seg.name,
        description: seg.description,
        details: seg.details,
        jobs: seg.jobs,
        preferences: seg.preferences,
        difficulties: seg.difficulties,
        triggers: seg.triggers,
        pains: seg.pains?.map((p) => ({
          name: p.name,
          description: p.description,
          impactScore: p.impact_score,
          isTopPain: p.is_top_pain,
        })),
        canvas: seg.canvas?.map((c) => ({
          painId: c.pain_id,
          emotionalAspects: c.emotional_aspects,
          behavioralPatterns: c.behavioral_patterns,
          buyingSignals: c.buying_signals,
        })),
        canvasExtended: seg.canvasExtended?.map((ext) => ({
          painId: ext.pain_id,
          customerJourney: ext.customer_journey,
          emotionalMap: ext.emotional_map,
          narrativeAngles: ext.narrative_angles,
          messagingFramework: ext.messaging_framework,
          voiceAndTone: ext.voice_and_tone,
        })),
        // V5 Modules
        channelStrategy: seg.channelStrategy,
        competitiveIntelligence: seg.competitiveIntelligence,
        pricingPsychology: seg.pricingPsychology,
        trustFramework: seg.trustFramework,
        jtbdContext: seg.jtbdContext,
        // V6 Modules
        ugcCreatorProfile: seg.ugcCreatorProfile,
        strategyPersonalized: seg.strategyPersonalized,
        strategyAds: seg.strategyAds,
        communicationsFunnels: seg.communicationsFunnels,
      })),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileName}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Helper to escape CSV value
  const csvEscape = (val: unknown): string => {
    if (val === null || val === undefined) return "";
    const str = typeof val === "object" ? JSON.stringify(val) : String(val);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const exportToCsv = (data: ExportData, fileName: string) => {
    // Create multiple CSV sections separated by blank lines
    const allRows: string[] = [];

    // === Section 1: Segments ===
    allRows.push("=== SEGMENTS ===");
    allRows.push(["#", "Name", "Description", "Details"].map(csvEscape).join(","));
    data.segments?.forEach((seg) => {
      allRows.push([
        seg.order_index + 1,
        seg.name,
        seg.description,
        jsonToString(seg.details),
      ].map(csvEscape).join(","));
    });
    allRows.push("");

    // === Section 2: Jobs ===
    allRows.push("=== JOBS ===");
    allRows.push(["Segment", "Job Name", "Category", "Frequency", "Description"].map(csvEscape).join(","));
    data.segments?.forEach((seg) => {
      seg.jobs?.forEach((job) => {
        allRows.push([
          seg.name,
          job.name,
          job.category,
          job.frequency,
          job.description,
        ].map(csvEscape).join(","));
      });
    });
    allRows.push("");

    // === Section 3: Triggers ===
    allRows.push("=== TRIGGERS ===");
    allRows.push(["Segment", "Trigger Name", "Category", "Urgency", "Description"].map(csvEscape).join(","));
    data.segments?.forEach((seg) => {
      seg.triggers?.forEach((trigger) => {
        allRows.push([
          seg.name,
          trigger.name,
          trigger.category,
          trigger.urgency,
          trigger.description,
        ].map(csvEscape).join(","));
      });
    });
    allRows.push("");

    // === Section 4: Pains ===
    allRows.push("=== PAINS ===");
    allRows.push(["Segment", "Pain Name", "Impact Score", "Is Top Pain", "Description"].map(csvEscape).join(","));
    data.segments?.forEach((seg) => {
      seg.pains?.forEach((pain) => {
        allRows.push([
          seg.name,
          pain.name,
          pain.impact_score,
          pain.is_top_pain ? "Yes" : "No",
          pain.description,
        ].map(csvEscape).join(","));
      });
    });
    allRows.push("");

    // === Section 5: Objections ===
    allRows.push("=== OBJECTIONS ===");
    allRows.push(["Segment", "Pain", "Objection", "Category", "Strength", "Response Strategy"].map(csvEscape).join(","));
    data.segments?.forEach((seg) => {
      seg.objections?.forEach((obj) => {
        allRows.push([
          seg.name,
          obj.pain_name || "",
          obj.name,
          obj.category,
          obj.strength,
          obj.response_strategy,
        ].map(csvEscape).join(","));
      });
    });
    allRows.push("");

    // === Section 6: Desires ===
    allRows.push("=== DESIRES ===");
    allRows.push(["Segment", "Pain", "Desire", "Intensity", "Description"].map(csvEscape).join(","));
    data.segments?.forEach((seg) => {
      seg.desires?.forEach((des) => {
        allRows.push([
          seg.name,
          des.pain_name || "",
          des.name,
          des.intensity,
          des.description,
        ].map(csvEscape).join(","));
      });
    });
    allRows.push("");

    // === Section 7: Features ===
    allRows.push("=== FEATURES ===");
    allRows.push(["Segment", "Pain", "Feature", "Priority", "Description"].map(csvEscape).join(","));
    data.segments?.forEach((seg) => {
      seg.features?.forEach((feat) => {
        allRows.push([
          seg.name,
          feat.pain_name || "",
          feat.name,
          feat.priority,
          feat.description,
        ].map(csvEscape).join(","));
      });
    });
    allRows.push("");

    // === Section 8: Canvas ===
    allRows.push("=== CANVAS ===");
    allRows.push(["Segment", "Pain", "Elevator Pitch", "Unique Value Prop", "High Level Concept", "Solution"].map(csvEscape).join(","));
    data.segments?.forEach((seg) => {
      seg.canvas?.forEach((can) => {
        allRows.push([
          seg.name,
          can.pain_name || "",
          can.elevator_pitch,
          can.unique_value_proposition,
          can.high_level_concept,
          can.solution,
        ].map(csvEscape).join(","));
      });
    });
    allRows.push("");

    // === Section 9: Canvas Extended ===
    allRows.push("=== CANVAS EXTENDED ===");
    allRows.push(["Segment", "Pain ID", "Customer Journey", "Emotional Map", "Narrative Angles", "Messaging Framework", "Voice And Tone"].map(csvEscape).join(","));
    data.segments?.forEach((seg) => {
      seg.canvasExtended?.forEach((ext) => {
        allRows.push([
          seg.name,
          ext.pain_id,
          jsonToString(ext.customer_journey),
          jsonToString(ext.emotional_map),
          jsonToString(ext.narrative_angles),
          jsonToString(ext.messaging_framework),
          jsonToString(ext.voice_and_tone),
        ].map(csvEscape).join(","));
      });
    });
    allRows.push("");

    // === Section 10: Channel Strategy (V5) ===
    allRows.push("=== CHANNEL STRATEGY (V5) ===");
    allRows.push(["Segment", "Primary Channels", "Acquisition", "Engagement", "Retention"].map(csvEscape).join(","));
    data.segments?.forEach((seg) => {
      if (seg.channelStrategy) {
        const cs = seg.channelStrategy as Record<string, unknown>;
        allRows.push([
          seg.name,
          jsonToString(cs.primary_channels),
          jsonToString(cs.acquisition),
          jsonToString(cs.engagement),
          jsonToString(cs.retention),
        ].map(csvEscape).join(","));
      }
    });
    allRows.push("");

    // === Section 11: Competitive Intelligence (V5) ===
    allRows.push("=== COMPETITIVE INTELLIGENCE (V5) ===");
    allRows.push(["Segment", "Direct Competitors", "Indirect Competitors", "Market Gaps", "Differentiation"].map(csvEscape).join(","));
    data.segments?.forEach((seg) => {
      if (seg.competitiveIntelligence) {
        const ci = seg.competitiveIntelligence as Record<string, unknown>;
        allRows.push([
          seg.name,
          jsonToString(ci.direct_competitors),
          jsonToString(ci.indirect_competitors),
          jsonToString(ci.market_gaps),
          jsonToString(ci.differentiation),
        ].map(csvEscape).join(","));
      }
    });
    allRows.push("");

    // === Section 12: Pricing Psychology (V5) ===
    allRows.push("=== PRICING PSYCHOLOGY (V5) ===");
    allRows.push(["Segment", "Price Perception", "Value Drivers", "Price Sensitivity", "Pricing Recommendations"].map(csvEscape).join(","));
    data.segments?.forEach((seg) => {
      if (seg.pricingPsychology) {
        const pp = seg.pricingPsychology as Record<string, unknown>;
        allRows.push([
          seg.name,
          jsonToString(pp.price_perception),
          jsonToString(pp.value_drivers),
          jsonToString(pp.price_sensitivity),
          jsonToString(pp.pricing_recommendations),
        ].map(csvEscape).join(","));
      }
    });
    allRows.push("");

    // === Section 13: Trust Framework (V5) ===
    allRows.push("=== TRUST FRAMEWORK (V5) ===");
    allRows.push(["Segment", "Trust Signals", "Risk Reducers", "Social Proof", "Guarantees"].map(csvEscape).join(","));
    data.segments?.forEach((seg) => {
      if (seg.trustFramework) {
        const tf = seg.trustFramework as Record<string, unknown>;
        allRows.push([
          seg.name,
          jsonToString(tf.trust_signals),
          jsonToString(tf.risk_reducers),
          jsonToString(tf.social_proof),
          jsonToString(tf.guarantees),
        ].map(csvEscape).join(","));
      }
    });
    allRows.push("");

    // === Section 14: JTBD Context (V5) ===
    allRows.push("=== JTBD CONTEXT (V5) ===");
    allRows.push(["Segment", "Main Jobs", "Progress Definition", "Forces Analysis", "Outcome Expectations"].map(csvEscape).join(","));
    data.segments?.forEach((seg) => {
      if (seg.jtbdContext) {
        const jc = seg.jtbdContext as Record<string, unknown>;
        allRows.push([
          seg.name,
          jsonToString(jc.main_jobs),
          jsonToString(jc.progress_definition),
          jsonToString(jc.forces_analysis),
          jsonToString(jc.outcome_expectations),
        ].map(csvEscape).join(","));
      }
    });
    allRows.push("");

    // === Section 15: Strategy Summary (V6) ===
    if (data.strategySummary) {
      allRows.push("=== STRATEGY SUMMARY (V6) ===");
      const ss = data.strategySummary as Record<string, unknown>;
      allRows.push(["Field", "Value"].map(csvEscape).join(","));
      allRows.push(["Growth Bets", jsonToString(ss.growth_bets)].map(csvEscape).join(","));
      allRows.push(["Positioning Pillars", jsonToString(ss.positioning_pillars)].map(csvEscape).join(","));
      allRows.push(["Channel Priorities", jsonToString(ss.channel_priorities)].map(csvEscape).join(","));
      allRows.push(["Risk Flags", jsonToString(ss.risk_flags)].map(csvEscape).join(","));
      allRows.push("");
    }

    // === Section 16: Strategy Global (V6) ===
    if (data.strategyGlobal) {
      allRows.push("=== STRATEGY GLOBAL (V6) ===");
      const sg = data.strategyGlobal as Record<string, unknown>;
      allRows.push(["Field", "Value"].map(csvEscape).join(","));
      allRows.push(["Email Strategy", jsonToString(sg.email_strategy)].map(csvEscape).join(","));
      allRows.push(["SMS Strategy", jsonToString(sg.sms_strategy)].map(csvEscape).join(","));
      allRows.push(["Messenger Strategy", jsonToString(sg.messenger_strategy)].map(csvEscape).join(","));
      allRows.push(["Social Strategy", jsonToString(sg.social_strategy)].map(csvEscape).join(","));
      allRows.push(["TOF Banners", jsonToString(sg.tof_banners)].map(csvEscape).join(","));
      allRows.push(["Traffic Channels", jsonToString(sg.traffic_channels)].map(csvEscape).join(","));
      allRows.push("");
    }

    // === Section 17: Strategy Personalized (V6) ===
    allRows.push("=== STRATEGY PERSONALIZED (V6) ===");
    allRows.push(["Segment", "Pain", "TOF UGC Hooks", "MOF Quiz Flow", "MOF Chat Script", "BOF Creative Briefs", "BOF Landing Structure"].map(csvEscape).join(","));
    data.segments?.forEach((seg) => {
      seg.strategyPersonalized?.forEach((sp) => {
        const rec = sp as Record<string, unknown>;
        allRows.push([
          seg.name,
          rec.pain_name || "",
          jsonToString(rec.tof_ugc_hooks),
          jsonToString(rec.mof_quiz_flow),
          jsonToString(rec.mof_chat_script),
          jsonToString(rec.bof_creative_briefs),
          jsonToString(rec.bof_landing_structure),
        ].map(csvEscape).join(","));
      });
    });
    allRows.push("");

    // === Section 18: Strategy Ads (V6) ===
    allRows.push("=== STRATEGY ADS (V6) ===");
    allRows.push(["Segment", "Pain", "Channels"].map(csvEscape).join(","));
    data.segments?.forEach((seg) => {
      seg.strategyAds?.forEach((sa) => {
        const rec = sa as Record<string, unknown>;
        allRows.push([
          seg.name,
          rec.pain_name || "",
          jsonToString(rec.channels),
        ].map(csvEscape).join(","));
      });
    });
    allRows.push("");

    // === Section 19: UGC Creator Profiles (V6) ===
    allRows.push("=== UGC CREATOR PROFILES (V6) ===");
    allRows.push(["Segment", "Ideal Persona", "Content Topics", "Sourcing Guidance"].map(csvEscape).join(","));
    data.segments?.forEach((seg) => {
      if (seg.ugcCreatorProfile) {
        const ugc = seg.ugcCreatorProfile as Record<string, unknown>;
        allRows.push([
          seg.name,
          jsonToString(ugc.ideal_persona),
          jsonToString(ugc.content_topics),
          jsonToString(ugc.sourcing_guidance),
        ].map(csvEscape).join(","));
      }
    });
    allRows.push("");

    // === Section 20: Communications Funnel (V6) ===
    allRows.push("=== COMMUNICATIONS FUNNEL (V6) ===");
    allRows.push(["Segment", "Pain", "Organic Rhythm", "Conversation Funnel", "Chatbot Scripts"].map(csvEscape).join(","));
    data.segments?.forEach((seg) => {
      seg.communicationsFunnels?.forEach((cf) => {
        const rec = cf as Record<string, unknown>;
        allRows.push([
          seg.name,
          rec.pain_name || "",
          jsonToString(rec.organic_rhythm),
          jsonToString(rec.conversation_funnel),
          jsonToString(rec.chatbot_scripts),
        ].map(csvEscape).join(","));
      });
    });

    const csvContent = allRows.join("\n");
    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" }); // BOM for Excel UTF-8
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileName}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  const hasData = data && data.segments?.length > 0;
  const totalPains = data?.segments?.reduce((acc, s) => acc + (s.pains?.length || 0), 0) || 0;
  const totalCanvas = data?.segments?.reduce((acc, s) => acc + (s.canvas?.length || 0), 0) || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start gap-4"
      >
        <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl text-white shadow-lg shadow-green-500/20">
          <Download className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Export Research</h1>
          <p className="text-slate-500 mt-1">Download your audience research data in various formats</p>
        </div>
      </motion.div>

      {/* Data Summary */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50/50 to-transparent">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              {hasData ? (
                <CheckCircle className="w-5 h-5 text-emerald-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-500" />
              )}
              Data Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-sm px-3 py-1">
                  {data?.segments?.length || 0} Segments
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-sm px-3 py-1">
                  {totalPains} Pain Points
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-sm px-3 py-1">
                  {totalCanvas} Canvas Analyses
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={data?.portrait ? "default" : "secondary"} className="text-sm px-3 py-1">
                  Portrait: {data?.portrait ? "Complete" : "Pending"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Export Options */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {/* Excel Export */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
              </div>
              Excel (.xlsx)
            </CardTitle>
            <CardDescription>
              Multi-sheet workbook with organized tabs for each data category
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="text-sm text-slate-600 space-y-1">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                Summary sheet
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                Portrait details
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                Segments, Jobs, Pains
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                Canvas analyses
              </li>
            </ul>

            <Button
              onClick={() => handleExport("xlsx")}
              disabled={!hasData || exportingFormat !== null}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              {exportingFormat === "xlsx" ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Download Excel
            </Button>
          </CardContent>
        </Card>

        {/* JSON Export */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="p-2 bg-amber-100 rounded-lg">
                <FileJson className="h-5 w-5 text-amber-600" />
              </div>
              JSON
            </CardTitle>
            <CardDescription>
              Structured data format for developers and integrations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="text-sm text-slate-600 space-y-1">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                Complete data export
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                Nested structure
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                API compatible
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                Easy to process
              </li>
            </ul>

            <Button
              onClick={() => handleExport("json")}
              disabled={!hasData || exportingFormat !== null}
              variant="outline"
              className="w-full border-amber-300 text-amber-700 hover:bg-amber-50"
            >
              {exportingFormat === "json" ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Download JSON
            </Button>
          </CardContent>
        </Card>

        {/* CSV Export */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              CSV
            </CardTitle>
            <CardDescription>
              Simple tabular format for spreadsheets and data analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="text-sm text-slate-600 space-y-1">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                Universal format
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                Segments & pains
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                Import to any tool
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                Lightweight file
              </li>
            </ul>

            <Button
              onClick={() => handleExport("csv")}
              disabled={!hasData || exportingFormat !== null}
              variant="outline"
              className="w-full border-blue-300 text-blue-700 hover:bg-blue-50"
            >
              {exportingFormat === "csv" ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Download CSV
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* No Data Message */}
      {!hasData && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-dashed border-2 border-slate-300 bg-slate-50/50">
            <CardContent className="py-12 text-center">
              <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-700 mb-2">No Data to Export</h3>
              <p className="text-slate-500 max-w-md mx-auto">
                Complete the research generation process to export your audience analysis data.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
