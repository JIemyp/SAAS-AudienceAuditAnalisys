"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Heart, TrendingUp, TrendingDown, RefreshCw } from "lucide-react";
import { EmotionalMap, EmotionalPeak, EmotionalValley, EmotionalTurningPoint } from "@/types";

interface EmotionalMapSectionProps {
  emotionalMap: EmotionalMap;
  onUpdate?: (map: EmotionalMap) => void;
  readonly?: boolean;
}

export function EmotionalMapSection({ emotionalMap, onUpdate, readonly = true }: EmotionalMapSectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<"peaks" | "valleys" | "turning_points">("peaks");

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-rose-50 to-white hover:from-rose-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-rose-100">
            <Heart className="w-5 h-5 text-rose-600" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-slate-900">Emotional Intensity Map</h3>
            <p className="text-sm text-slate-500">
              {emotionalMap.peaks.length} peaks, {emotionalMap.valleys.length} valleys, {emotionalMap.turning_points.length} turning points
            </p>
          </div>
        </div>
        {isCollapsed ? (
          <ChevronRight className="w-5 h-5 text-slate-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-400" />
        )}
      </button>

      {!isCollapsed && (
        <div className="p-4">
          {/* Tabs */}
          <div className="flex gap-2 mb-4">
            <TabButton
              active={activeTab === "peaks"}
              onClick={() => setActiveTab("peaks")}
              icon={TrendingUp}
              label="Peaks"
              color="rose"
              count={emotionalMap.peaks.length}
            />
            <TabButton
              active={activeTab === "valleys"}
              onClick={() => setActiveTab("valleys")}
              icon={TrendingDown}
              label="Valleys"
              color="slate"
              count={emotionalMap.valleys.length}
            />
            <TabButton
              active={activeTab === "turning_points"}
              onClick={() => setActiveTab("turning_points")}
              icon={RefreshCw}
              label="Turning Points"
              color="amber"
              count={emotionalMap.turning_points.length}
            />
          </div>

          {/* Content */}
          <div className="space-y-3">
            {activeTab === "peaks" &&
              emotionalMap.peaks.map((peak, idx) => (
                <PeakCard key={idx} peak={peak} index={idx} />
              ))}

            {activeTab === "valleys" &&
              emotionalMap.valleys.map((valley, idx) => (
                <ValleyCard key={idx} valley={valley} index={idx} />
              ))}

            {activeTab === "turning_points" &&
              emotionalMap.turning_points.map((tp, idx) => (
                <TurningPointCard key={idx} turningPoint={tp} index={idx} />
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
  color,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
  label: string;
  color: string;
  count: number;
}) {
  const colorStyles = {
    rose: active ? "bg-rose-100 text-rose-700 border-rose-300" : "hover:bg-rose-50",
    slate: active ? "bg-slate-200 text-slate-700 border-slate-300" : "hover:bg-slate-50",
    amber: active ? "bg-amber-100 text-amber-700 border-amber-300" : "hover:bg-amber-50",
  };

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
        active ? colorStyles[color as keyof typeof colorStyles] : `border-slate-200 text-slate-600 ${colorStyles[color as keyof typeof colorStyles]}`
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
      <span className={`px-1.5 py-0.5 rounded text-xs ${active ? "bg-white/50" : "bg-slate-100"}`}>
        {count}
      </span>
    </button>
  );
}

function PeakCard({ peak, index }: { peak: EmotionalPeak; index: number }) {
  return (
    <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-rose-500" />
          <span className="font-medium text-rose-900">Peak #{index + 1}</span>
        </div>
        <IntensityBadge intensity={peak.intensity} />
      </div>

      <h4 className="font-semibold text-slate-900 mb-2">{peak.moment}</h4>

      <div className="space-y-2 text-sm">
        <div>
          <span className="text-rose-600 font-medium">Trigger:</span>
          <span className="text-slate-700 ml-2">{peak.trigger}</span>
        </div>
        <div className="italic text-slate-600 border-l-2 border-rose-300 pl-3">
          "{peak.internal_dialogue}"
        </div>
        <div className="text-slate-500">
          Duration: {peak.duration}
        </div>
      </div>
    </div>
  );
}

function ValleyCard({ valley, index }: { valley: EmotionalValley; index: number }) {
  return (
    <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <TrendingDown className="w-4 h-4 text-slate-500" />
          <span className="font-medium text-slate-700">Valley #{index + 1}</span>
        </div>
        <IntensityBadge intensity={valley.intensity} variant="dark" />
      </div>

      <h4 className="font-semibold text-slate-900 mb-2">{valley.moment}</h4>

      <div className="space-y-2 text-sm">
        <div>
          <span className="text-slate-600 font-medium">Trigger:</span>
          <span className="text-slate-700 ml-2">{valley.trigger}</span>
        </div>
        <div className="italic text-slate-600 border-l-2 border-slate-300 pl-3">
          "{valley.internal_dialogue}"
        </div>
        <div className="text-slate-500">
          Duration: {valley.duration}
        </div>
      </div>
    </div>
  );
}

function TurningPointCard({ turningPoint, index }: { turningPoint: EmotionalTurningPoint; index: number }) {
  return (
    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
      <div className="flex items-center gap-2 mb-3">
        <RefreshCw className="w-4 h-4 text-amber-500" />
        <span className="font-medium text-amber-900">Turning Point #{index + 1}</span>
      </div>

      <div className="flex items-center gap-3 mb-3">
        <span className="px-2 py-1 bg-slate-200 rounded text-sm text-slate-700">
          {turningPoint.from_state}
        </span>
        <span className="text-amber-500">→</span>
        <span className="px-2 py-1 bg-amber-200 rounded text-sm text-amber-800">
          {turningPoint.to_state}
        </span>
      </div>

      <div className="space-y-2 text-sm">
        <div>
          <span className="text-amber-600 font-medium">Catalyst:</span>
          <span className="text-slate-700 ml-2">{turningPoint.catalyst}</span>
        </div>
        <div className="italic text-slate-600 border-l-2 border-amber-300 pl-3">
          "{turningPoint.internal_shift}"
        </div>
      </div>
    </div>
  );
}

function IntensityBadge({ intensity, variant = "light" }: { intensity: number; variant?: "light" | "dark" }) {
  const getColor = () => {
    if (intensity >= 8) return variant === "light" ? "bg-rose-200 text-rose-800" : "bg-slate-700 text-slate-100";
    if (intensity >= 6) return variant === "light" ? "bg-rose-100 text-rose-700" : "bg-slate-600 text-slate-200";
    if (intensity >= 4) return variant === "light" ? "bg-amber-100 text-amber-700" : "bg-slate-500 text-slate-200";
    return variant === "light" ? "bg-slate-100 text-slate-600" : "bg-slate-400 text-slate-100";
  };

  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${getColor()}`}>
      Intensity: {intensity}/10
    </span>
  );
}
