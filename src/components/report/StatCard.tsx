"use client";

import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  sublabel?: string;
  color?: "blue" | "emerald" | "amber" | "purple" | "rose";
  className?: string;
}

const colorStyles = {
  blue: {
    bg: "bg-blue-50",
    icon: "bg-blue-500/10 text-blue-600",
    value: "text-blue-600",
  },
  emerald: {
    bg: "bg-emerald-50",
    icon: "bg-emerald-500/10 text-emerald-600",
    value: "text-emerald-600",
  },
  amber: {
    bg: "bg-amber-50",
    icon: "bg-amber-500/10 text-amber-600",
    value: "text-amber-600",
  },
  purple: {
    bg: "bg-purple-50",
    icon: "bg-purple-500/10 text-purple-600",
    value: "text-purple-600",
  },
  rose: {
    bg: "bg-rose-50",
    icon: "bg-rose-500/10 text-rose-600",
    value: "text-rose-600",
  },
};

export function StatCard({
  icon: Icon,
  label,
  value,
  sublabel,
  color = "blue",
  className,
}: StatCardProps) {
  const styles = colorStyles[color];

  return (
    <div
      className={cn(
        "p-5 rounded-2xl border border-slate-200/50",
        styles.bg,
        className
      )}
    >
      <div className="flex items-start gap-4">
        <div className={cn("p-3 rounded-xl", styles.icon)}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-500 mb-1">{label}</p>
          <p className={cn("text-3xl font-bold", styles.value)}>{value}</p>
          {sublabel && (
            <p className="text-xs text-slate-400 mt-1">{sublabel}</p>
          )}
        </div>
      </div>
    </div>
  );
}
