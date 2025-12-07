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
    jobs?: Record<string, unknown>;
    preferences?: Record<string, unknown>;
    difficulties?: Record<string, unknown>;
    triggers?: Record<string, unknown>;
    pains: Array<{
      id: string;
      name: string;
      description: string;
      impact_score: number;
      is_top_pain: boolean;
    }>;
    canvas: Array<{
      id: string;
      pain_id: string;
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
  }>;
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

  const exportToCsv = (data: ExportData, fileName: string) => {
    // Create a comprehensive CSV with all segments and their pains
    const rows: string[][] = [
      [
        "Segment #",
        "Segment Name",
        "Description",
        "Pain Name",
        "Pain Description",
        "Impact Score",
        "Is Top Pain",
      ],
    ];

    data.segments?.forEach((seg) => {
      if (seg.pains?.length > 0) {
        seg.pains.forEach((pain, idx) => {
          rows.push([
            idx === 0 ? String(seg.order_index + 1) : "",
            idx === 0 ? seg.name : "",
            idx === 0 ? `"${seg.description.replace(/"/g, '""')}"` : "",
            pain.name,
            `"${pain.description.replace(/"/g, '""')}"`,
            String(pain.impact_score),
            pain.is_top_pain ? "Yes" : "No",
          ]);
        });
      } else {
        rows.push([
          String(seg.order_index + 1),
          seg.name,
          `"${seg.description.replace(/"/g, '""')}"`,
          "",
          "",
          "",
          "",
        ]);
      }
    });

    const csvContent = rows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
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
