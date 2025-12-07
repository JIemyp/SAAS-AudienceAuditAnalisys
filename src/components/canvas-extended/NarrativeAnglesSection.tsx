"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, BookOpen, User, Quote, Lightbulb, Target, MessageCircle, Shield, AlertTriangle } from "lucide-react";
import { NarrativeAngle } from "@/types";

interface NarrativeAnglesSectionProps {
  angles: NarrativeAngle[];
  onUpdate?: (angles: NarrativeAngle[]) => void;
  readonly?: boolean;
}

const ANGLE_COLORS = [
  { bg: "bg-indigo-50", border: "border-indigo-200", header: "bg-indigo-100", text: "text-indigo-700", accent: "text-indigo-600" },
  { bg: "bg-emerald-50", border: "border-emerald-200", header: "bg-emerald-100", text: "text-emerald-700", accent: "text-emerald-600" },
  { bg: "bg-violet-50", border: "border-violet-200", header: "bg-violet-100", text: "text-violet-700", accent: "text-violet-600" },
];

export function NarrativeAnglesSection({ angles, onUpdate, readonly = true }: NarrativeAnglesSectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedAngles, setExpandedAngles] = useState<Set<number>>(new Set([0]));

  const toggleAngle = (index: number) => {
    const newExpanded = new Set(expandedAngles);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedAngles(newExpanded);
  };

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-indigo-50 to-white hover:from-indigo-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-100">
            <BookOpen className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-slate-900">Narrative Angles</h3>
            <p className="text-sm text-slate-500">{angles.length} distinct story approaches</p>
          </div>
        </div>
        {isCollapsed ? (
          <ChevronRight className="w-5 h-5 text-slate-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-400" />
        )}
      </button>

      {!isCollapsed && (
        <div className="p-4 space-y-4">
          {angles.map((angle, idx) => {
            const colors = ANGLE_COLORS[idx % ANGLE_COLORS.length];
            const isExpanded = expandedAngles.has(idx);

            return (
              <div
                key={idx}
                className={`border ${colors.border} rounded-lg overflow-hidden`}
              >
                <button
                  onClick={() => toggleAngle(idx)}
                  className={`w-full flex items-center justify-between p-4 ${colors.header}`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${colors.text} bg-white/50`}>
                      #{idx + 1}
                    </span>
                    <span className="font-semibold text-slate-900">{angle.angle_name}</span>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  )}
                </button>

                {isExpanded && (
                  <div className={`p-4 ${colors.bg} space-y-4`}>
                    {/* Who This Is */}
                    <div className="flex gap-3">
                      <div className="mt-1">
                        <User className={`w-4 h-4 ${colors.accent}`} />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Who This Is</label>
                        <p className="text-sm text-slate-700 mt-1">{angle.who_this_is}</p>
                      </div>
                    </div>

                    {/* Their Story */}
                    <div className="flex gap-3">
                      <div className="mt-1">
                        <Quote className={`w-4 h-4 ${colors.accent}`} />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Their Story</label>
                        <p className="text-sm text-slate-700 mt-1 italic border-l-2 border-slate-300 pl-3">
                          {angle.their_story}
                        </p>
                      </div>
                    </div>

                    {/* Core Belief */}
                    <div className="flex gap-3">
                      <div className="mt-1">
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Core Limiting Belief</label>
                        <p className="text-sm text-amber-700 mt-1 bg-amber-50 p-2 rounded">
                          "{angle.core_belief}"
                        </p>
                      </div>
                    </div>

                    {/* Breakthrough Moment */}
                    <div className="flex gap-3">
                      <div className="mt-1">
                        <Lightbulb className="w-4 h-4 text-yellow-500" />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Breakthrough Moment</label>
                        <p className="text-sm text-slate-700 mt-1">{angle.breakthrough_moment}</p>
                      </div>
                    </div>

                    {/* Key Message - Highlighted */}
                    <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className={`w-4 h-4 ${colors.accent}`} />
                        <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Key Message</label>
                      </div>
                      <p className="text-lg font-semibold text-slate-900">
                        "{angle.key_message}"
                      </p>
                    </div>

                    {/* Proof & Objection */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex gap-3">
                        <div className="mt-1">
                          <Shield className={`w-4 h-4 ${colors.accent}`} />
                        </div>
                        <div className="flex-1">
                          <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Proof They Need</label>
                          <p className="text-sm text-slate-700 mt-1">{angle.proof_they_need}</p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <div className="mt-1">
                          <MessageCircle className="w-4 h-4 text-orange-500" />
                        </div>
                        <div className="flex-1">
                          <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Objection to Address</label>
                          <p className="text-sm text-slate-700 mt-1">{angle.objection_to_address}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
