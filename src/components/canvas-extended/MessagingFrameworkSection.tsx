"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Megaphone, Type, MessageSquare, ArrowRight, CheckCircle, ShieldQuestion, MousePointer } from "lucide-react";
import { MessagingFramework } from "@/types";

interface MessagingFrameworkSectionProps {
  framework: MessagingFramework;
  onUpdate?: (framework: MessagingFramework) => void;
  readonly?: boolean;
}

export function MessagingFrameworkSection({ framework, onUpdate, readonly = true }: MessagingFrameworkSectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("headlines");

  const sections = [
    { key: "headlines", label: "Headlines", icon: Type, count: framework.headlines.length },
    { key: "hooks", label: "Opening Hooks", icon: MessageSquare, count: framework.opening_hooks.length },
    { key: "bridges", label: "Bridge Statements", icon: ArrowRight, count: framework.bridge_statements.length },
    { key: "proof", label: "Proof Framing", icon: CheckCircle, count: 1 },
    { key: "objections", label: "Objection Handlers", icon: ShieldQuestion, count: framework.objection_handlers.length },
    { key: "ctas", label: "CTAs", icon: MousePointer, count: framework.cta_options.length },
  ];

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-white hover:from-blue-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-100">
            <Megaphone className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-slate-900">Messaging Framework</h3>
            <p className="text-sm text-slate-500">Headlines, hooks, CTAs, and objection handlers</p>
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
          {/* Section Tabs */}
          <div className="flex flex-wrap gap-2 mb-4">
            {sections.map(({ key, label, icon: Icon, count }) => (
              <button
                key={key}
                onClick={() => setActiveSection(key)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  activeSection === key
                    ? "bg-blue-100 text-blue-700 border-blue-300"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
                <span className={`px-1.5 py-0.5 rounded text-xs ${activeSection === key ? "bg-blue-200" : "bg-slate-100"}`}>
                  {count}
                </span>
              </button>
            ))}
          </div>

          {/* Section Content */}
          <div className="space-y-3">
            {activeSection === "headlines" && (
              <div className="space-y-3">
                <p className="text-sm text-slate-500 mb-4">Headlines that grab attention and speak directly to the pain:</p>
                {framework.headlines.map((headline, idx) => (
                  <HeadlineCard key={idx} headline={headline} index={idx} />
                ))}
              </div>
            )}

            {activeSection === "hooks" && (
              <div className="space-y-3">
                <p className="text-sm text-slate-500 mb-4">Opening paragraphs that create immediate recognition:</p>
                {framework.opening_hooks.map((hook, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                        Hook #{idx + 1}
                      </span>
                    </div>
                    <p className="text-slate-700 leading-relaxed">{hook}</p>
                  </div>
                ))}
              </div>
            )}

            {activeSection === "bridges" && (
              <div className="space-y-3">
                <p className="text-sm text-slate-500 mb-4">Transitions from problem to solution that validate and create hope:</p>
                {framework.bridge_statements.map((bridge, idx) => (
                  <div key={idx} className="p-4 bg-gradient-to-r from-slate-50 to-blue-50 border border-slate-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <ArrowRight className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                      <p className="text-slate-700">{bridge}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeSection === "proof" && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-semibold text-green-800 mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Proof Framing Guidelines
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-green-600 uppercase tracking-wide">Type of Proof</label>
                    <p className="text-slate-700 mt-1">{framework.proof_framing.type}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-green-600 uppercase tracking-wide">Format</label>
                    <p className="text-slate-700 mt-1">{framework.proof_framing.format}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-green-600 uppercase tracking-wide">Language Style</label>
                    <p className="text-slate-700 mt-1">{framework.proof_framing.language}</p>
                  </div>
                </div>
              </div>
            )}

            {activeSection === "objections" && (
              <div className="space-y-3">
                <p className="text-sm text-slate-500 mb-4">How to address key objections without being defensive:</p>
                {framework.objection_handlers.map((handler, idx) => (
                  <div key={idx} className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="mb-3">
                      <label className="text-xs font-medium text-orange-600 uppercase tracking-wide">Objection</label>
                      <p className="text-slate-800 font-medium mt-1">"{handler.objection}"</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-green-600 uppercase tracking-wide">Handler</label>
                      <p className="text-slate-700 mt-1 bg-white p-3 rounded border border-orange-100">{handler.handler}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeSection === "ctas" && (
              <div className="space-y-3">
                <p className="text-sm text-slate-500 mb-4">CTAs that feel like the logical next step:</p>
                {framework.cta_options.map((cta, idx) => (
                  <div key={idx} className="p-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg text-white">
                    <div className="flex items-center gap-3">
                      <MousePointer className="w-5 h-5" />
                      <span className="font-semibold">{cta}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function HeadlineCard({ headline, index }: { headline: string; index: number }) {
  const styles = [
    "bg-gradient-to-r from-blue-600 to-blue-700",
    "bg-gradient-to-r from-slate-700 to-slate-800",
    "bg-gradient-to-r from-indigo-600 to-indigo-700",
    "bg-gradient-to-r from-purple-600 to-purple-700",
    "bg-gradient-to-r from-slate-600 to-blue-600",
  ];

  return (
    <div className={`p-4 rounded-lg text-white ${styles[index % styles.length]}`}>
      <div className="flex items-start gap-3">
        <span className="px-2 py-1 bg-white/20 rounded text-xs font-bold flex-shrink-0">
          H{index + 1}
        </span>
        <p className="text-lg font-semibold leading-tight">{headline}</p>
      </div>
    </div>
  );
}
