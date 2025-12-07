"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Volume2, Check, X, Sparkles, Ban } from "lucide-react";
import { VoiceAndTone } from "@/types";

interface VoiceAndToneSectionProps {
  voiceAndTone: VoiceAndTone;
  onUpdate?: (voiceAndTone: VoiceAndTone) => void;
  readonly?: boolean;
}

export function VoiceAndToneSection({ voiceAndTone, onUpdate, readonly = true }: VoiceAndToneSectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-white hover:from-purple-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-100">
            <Volume2 className="w-5 h-5 text-purple-600" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-slate-900">Voice & Tone Guidelines</h3>
            <p className="text-sm text-slate-500">How to speak to this segment about this pain</p>
          </div>
        </div>
        {isCollapsed ? (
          <ChevronRight className="w-5 h-5 text-slate-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-400" />
        )}
      </button>

      {!isCollapsed && (
        <div className="p-4 space-y-6">
          {/* Do and Don't side by side */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* DO */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 rounded-full bg-green-100">
                  <Check className="w-4 h-4 text-green-600" />
                </div>
                <h4 className="font-semibold text-green-800">DO</h4>
              </div>
              <ul className="space-y-2">
                {voiceAndTone.do.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* DON'T */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 rounded-full bg-red-100">
                  <X className="w-4 h-4 text-red-600" />
                </div>
                <h4 className="font-semibold text-red-800">DON'T</h4>
              </div>
              <ul className="space-y-2">
                {voiceAndTone.dont.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <X className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Word Libraries */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Words That Resonate */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 rounded-full bg-emerald-100">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                </div>
                <h4 className="font-semibold text-emerald-800">Words That Resonate</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {voiceAndTone.words_that_resonate.map((word, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium"
                  >
                    {word}
                  </span>
                ))}
              </div>
            </div>

            {/* Words to Avoid */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 rounded-full bg-slate-200">
                  <Ban className="w-4 h-4 text-slate-600" />
                </div>
                <h4 className="font-semibold text-slate-700">Words to Avoid</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {voiceAndTone.words_to_avoid.map((word, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 bg-slate-200 text-slate-600 rounded-full text-sm font-medium line-through decoration-red-400"
                  >
                    {word}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
