"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Circle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Segment } from "@/types";

export interface SegmentStatus {
  segmentId: string;
  hasData: boolean;
  isApproved: boolean;
}

interface SegmentTabsProps {
  segments: Segment[];
  selectedSegmentId: string | null;
  onSelectSegment: (segmentId: string) => void;
  segmentStatuses: SegmentStatus[];
  isLoading?: boolean;
}

export function SegmentTabs({
  segments,
  selectedSegmentId,
  onSelectSegment,
  segmentStatuses,
  isLoading = false,
}: SegmentTabsProps) {
  if (segments.length === 0) {
    return null;
  }

  const getSegmentStatus = (segmentId: string) => {
    return segmentStatuses.find(s => s.segmentId === segmentId);
  };

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm font-medium text-slate-500">Segments:</span>
        <span className="text-xs text-slate-400">
          ({segmentStatuses.filter(s => s.isApproved).length}/{segments.length} completed)
        </span>
      </div>

      <div className="flex flex-wrap gap-2 p-2 bg-slate-100 rounded-xl">
        {segments.map((segment, index) => {
          const status = getSegmentStatus(segment.id);
          const isSelected = selectedSegmentId === segment.id;

          return (
            <button
              key={segment.id}
              onClick={() => onSelectSegment(segment.id)}
              disabled={isLoading}
              className={cn(
                "relative flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all",
                isSelected
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/50",
                isLoading && "opacity-50 cursor-not-allowed"
              )}
            >
              {/* Status indicator */}
              <span className="flex-shrink-0">
                {status?.isApproved ? (
                  <span className="flex items-center justify-center w-5 h-5 bg-emerald-500 rounded-full">
                    <Check className="w-3 h-3 text-white" />
                  </span>
                ) : status?.hasData ? (
                  <span className="flex items-center justify-center w-5 h-5 bg-blue-500 rounded-full">
                    <Circle className="w-3 h-3 text-white fill-white" />
                  </span>
                ) : (
                  <span className="flex items-center justify-center w-5 h-5 border-2 border-slate-300 rounded-full">
                    <span className="text-xs text-slate-400">{index + 1}</span>
                  </span>
                )}
              </span>

              {/* Segment name */}
              <span className="max-w-[150px] truncate">{segment.name}</span>

              {/* Selected indicator */}
              {isSelected && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-white rounded-lg shadow-sm -z-10"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Compact version for smaller spaces
export function SegmentTabsCompact({
  segments,
  selectedSegmentId,
  onSelectSegment,
  segmentStatuses,
  isLoading = false,
}: SegmentTabsProps) {
  if (segments.length === 0) {
    return null;
  }

  const getSegmentStatus = (segmentId: string) => {
    return segmentStatuses.find(s => s.segmentId === segmentId);
  };

  const completedCount = segmentStatuses.filter(s => s.isApproved).length;

  return (
    <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl border border-slate-200">
      <div className="flex items-center gap-1.5">
        {segments.map((segment, index) => {
          const status = getSegmentStatus(segment.id);
          const isSelected = selectedSegmentId === segment.id;

          return (
            <button
              key={segment.id}
              onClick={() => onSelectSegment(segment.id)}
              disabled={isLoading}
              className={cn(
                "relative w-8 h-8 rounded-full flex items-center justify-center transition-all",
                isSelected && "ring-2 ring-blue-500 ring-offset-2",
                status?.isApproved
                  ? "bg-emerald-500 text-white"
                  : status?.hasData
                  ? "bg-blue-500 text-white"
                  : "bg-white border border-slate-200 text-slate-500",
                isLoading && "opacity-50 cursor-not-allowed",
                !isLoading && "hover:scale-110"
              )}
              title={segment.name}
            >
              {status?.isApproved ? (
                <Check className="w-4 h-4" />
              ) : (
                <span className="text-xs font-medium">{index + 1}</span>
              )}
            </button>
          );
        })}
      </div>

      <div className="h-6 w-px bg-slate-200" />

      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-slate-900 truncate">
          {segments.find(s => s.id === selectedSegmentId)?.name || "Select segment"}
        </div>
        <div className="text-xs text-slate-500">
          {completedCount}/{segments.length} segments completed
        </div>
      </div>
    </div>
  );
}
