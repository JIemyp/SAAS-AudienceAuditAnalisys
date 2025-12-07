"use client";

import { cn } from "@/lib/utils";
import { LucideIcon, ChevronRight } from "lucide-react";

interface TopListItem {
  id: string;
  name: string;
  description?: string;
  value?: string | number;
}

interface TopListProps {
  title: string;
  icon: LucideIcon;
  items: TopListItem[];
  emptyMessage?: string;
  color?: "blue" | "amber" | "emerald" | "purple";
  onItemClick?: (id: string) => void;
  className?: string;
}

const colorStyles = {
  blue: {
    header: "text-blue-600",
    headerBg: "bg-blue-500/10",
    rank: "bg-blue-100 text-blue-700",
    hover: "hover:bg-blue-50",
  },
  amber: {
    header: "text-amber-600",
    headerBg: "bg-amber-500/10",
    rank: "bg-amber-100 text-amber-700",
    hover: "hover:bg-amber-50",
  },
  emerald: {
    header: "text-emerald-600",
    headerBg: "bg-emerald-500/10",
    rank: "bg-emerald-100 text-emerald-700",
    hover: "hover:bg-emerald-50",
  },
  purple: {
    header: "text-purple-600",
    headerBg: "bg-purple-500/10",
    rank: "bg-purple-100 text-purple-700",
    hover: "hover:bg-purple-50",
  },
};

export function TopList({
  title,
  icon: Icon,
  items,
  emptyMessage = "No items",
  color = "blue",
  onItemClick,
  className,
}: TopListProps) {
  const styles = colorStyles[color];

  return (
    <div className={cn("bg-white rounded-2xl border border-slate-200 overflow-hidden", className)}>
      {/* Header */}
      <div className={cn("px-5 py-4 border-b border-slate-100", styles.headerBg)}>
        <h3 className={cn("font-semibold flex items-center gap-2", styles.header)}>
          <Icon className="w-5 h-5" />
          {title}
        </h3>
      </div>

      {/* Content */}
      <div className="divide-y divide-slate-100">
        {items.length === 0 ? (
          <div className="px-5 py-8 text-center text-slate-400 text-sm">
            {emptyMessage}
          </div>
        ) : (
          items.map((item, index) => (
            <div
              key={item.id}
              onClick={() => onItemClick?.(item.id)}
              className={cn(
                "px-5 py-3 flex items-center gap-4 transition-colors",
                onItemClick && "cursor-pointer",
                onItemClick && styles.hover
              )}
            >
              {/* Rank */}
              <span
                className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold",
                  styles.rank
                )}
              >
                {index + 1}
              </span>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-900 truncate">{item.name}</p>
                {item.description && (
                  <p className="text-sm text-slate-500 truncate">{item.description}</p>
                )}
              </div>

              {/* Value or arrow */}
              {item.value !== undefined ? (
                <span className="text-sm font-medium text-slate-500">
                  {item.value}
                </span>
              ) : onItemClick ? (
                <ChevronRight className="w-4 h-4 text-slate-300" />
              ) : null}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
