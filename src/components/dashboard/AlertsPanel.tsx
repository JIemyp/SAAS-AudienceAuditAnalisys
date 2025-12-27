"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

export interface DashboardAlert {
  type: "missing_data" | "incomplete_segment" | "stale_data";
  message: string;
  action_url: string;
}

interface AlertsPanelProps {
  alerts: DashboardAlert[];
  title?: string;
  description?: string;
}

const TYPE_STYLES: Record<DashboardAlert["type"], string> = {
  missing_data: "bg-red-50 text-red-700 border-red-200",
  incomplete_segment: "bg-amber-50 text-amber-700 border-amber-200",
  stale_data: "bg-slate-50 text-slate-700 border-slate-200",
};

const TYPE_LABELS: Record<DashboardAlert["type"], string> = {
  missing_data: "Missing Data",
  incomplete_segment: "Pending",
  stale_data: "Stale",
};

export function AlertsPanel({
  alerts,
  title = "Alerts",
  description = "Missing or pending data that blocks downstream strategy work.",
}: AlertsPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.length === 0 ? (
          <div className="text-sm text-text-secondary">No alerts right now.</div>
        ) : (
          alerts.map((alert, index) => (
            <div
              key={`${alert.message}-${index}`}
              className={cn(
                "flex items-start justify-between gap-3 rounded-lg border p-3",
                TYPE_STYLES[alert.type]
              )}
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 mt-0.5" />
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{TYPE_LABELS[alert.type]}</Badge>
                  </div>
                  <p className="text-sm mt-1">{alert.message}</p>
                </div>
              </div>
              {alert.action_url && (
                <Link
                  href={alert.action_url}
                  className="text-xs font-medium text-slate-800 hover:text-slate-900 underline"
                >
                  Fix
                </Link>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
