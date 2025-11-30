"use client";

import { useState, use } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Download, FileSpreadsheet } from "lucide-react";
import { createClient } from "@/lib/supabase";
import * as XLSX from "xlsx";
import { toast } from "sonner";

export default function ExportPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [isExporting, setIsExporting] = useState(false);
    const supabase = createClient();

    const handleExport = async () => {
        try {
            setIsExporting(true);

            // Fetch all data
            const [overviewRes, segmentsRes, painsRes] = await Promise.all([
                supabase
                    .from("audience_overviews")
                    .select("*")
                    .eq("project_id", id)
                    .single(),
                supabase
                    .from("segments")
                    .select("*")
                    .eq("project_id", id)
                    .order("order_index", { ascending: true }),
                supabase.from("pains").select("*, segments(name)"),
            ]);

            const overview = overviewRes.data;
            const segments = segmentsRes.data || [];
            const allPains = painsRes.data || [];

            // Create workbook
            const wb = XLSX.utils.book_new();

            // Sheet 1: Overview
            if (overview) {
                const overviewData = [
                    ["Section", "Content"],
                    ["Socio-demographics", JSON.stringify(overview.sociodemographics, null, 2)],
                    ["Lifestyle", JSON.stringify(overview.lifestyle, null, 2)],
                    ["General Pains", JSON.stringify(overview.general_pains, null, 2)],
                    ["Triggers", JSON.stringify(overview.triggers, null, 2)],
                ];
                const ws1 = XLSX.utils.aoa_to_sheet(overviewData);
                XLSX.utils.book_append_sheet(wb, ws1, "Overview");
            }

            // Sheet 2: Segments
            if (segments.length > 0) {
                const segmentsData = [
                    ["#", "Name", "Description", "Socio-demographics", "Needs", "Triggers", "Core Values"],
                    ...segments.map((seg) => [
                        seg.order_index + 1,
                        seg.name,
                        seg.description,
                        seg.sociodemographics,
                        seg.needs?.join("; ") || "",
                        seg.triggers?.join("; ") || "",
                        seg.core_values?.join("; ") || "",
                    ]),
                ];
                const ws2 = XLSX.utils.aoa_to_sheet(segmentsData);
                XLSX.utils.book_append_sheet(wb, ws2, "Segments");
            }

            // Sheet 3: Pains
            if (allPains.length > 0) {
                const painsData = [
                    ["Segment", "Pain Name", "Description", "Deep Triggers", "Examples"],
                    ...allPains.map((pain: any) => [
                        pain.segments?.name || "Unknown",
                        pain.name,
                        pain.description,
                        pain.deep_triggers?.join("; ") || "",
                        pain.examples?.join("; ") || "",
                    ]),
                ];
                const ws3 = XLSX.utils.aoa_to_sheet(painsData);
                XLSX.utils.book_append_sheet(wb, ws3, "Pains");
            }

            // Generate and download file
            const fileName = `audience-research-${id}.xlsx`;
            XLSX.writeFile(wb, fileName);

            toast.success("Export successful!");
        } catch (error) {
            console.error("Error exporting:", error);
            toast.error("Failed to export. Please try again.");
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-text-primary">Export</h1>
                <p className="mt-2 text-text-secondary">
                    Download your audience research data
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileSpreadsheet className="h-5 w-5" />
                        Export to Excel
                    </CardTitle>
                    <CardDescription>
                        Download all your audience research data in a structured Excel file
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="rounded-lg border border-border bg-bg-secondary p-4">
                        <h3 className="font-medium text-text-primary mb-2">What's included:</h3>
                        <ul className="list-disc list-inside space-y-1 text-sm text-text-secondary">
                            <li>Overview sheet with audience portrait and demographics</li>
                            <li>Segments sheet with all 10 segments and their details</li>
                            <li>Pains sheet with all identified pain points and triggers</li>
                        </ul>
                    </div>

                    <Button
                        onClick={handleExport}
                        isLoading={isExporting}
                        size="lg"
                        className="w-full sm:w-auto"
                    >
                        <Download className="mr-2 h-4 w-4" />
                        Download Excel File
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
