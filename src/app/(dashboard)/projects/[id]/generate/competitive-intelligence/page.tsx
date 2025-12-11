"use client";

import { use } from "react";
import {
  DraftCard,
  DraftSection,
} from "@/components/generation/GenerationPage";
import { SegmentGenerationPage } from "@/components/generation/SegmentGenerationPage";
import { CompetitiveIntelligenceDraft } from "@/types";
import { Swords, AlertTriangle, Scale, Ban, ClipboardCheck, Brain } from "lucide-react";

export default function CompetitiveIntelligencePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = use(params);

  return (
    <SegmentGenerationPage<CompetitiveIntelligenceDraft>
      projectId={projectId}
      title="Competitive Intelligence"
      description="Analyze what alternatives your audience has tried, what competitors they consider, and what barriers prevent them from switching."
      stepType="competitive-intelligence"
      generateEndpoint="/api/generate/competitive-intelligence"
      approveEndpoint="/api/approve/competitive-intelligence"
      draftTable="competitive_intelligence_drafts"
      approvedTable="competitive_intelligence"
      nextStepUrl="/generate/pricing-psychology"
      icon={<Swords className="w-6 h-6" />}
      emptyStateMessage="Discover what alternatives your audience has tried, why they failed, and what would make them switch to your solution."
      renderDraft={(draft, onEdit) => (
        <CompetitiveIntelligenceDraftView draft={draft} onEdit={onEdit} />
      )}
    />
  );
}

function CompetitiveIntelligenceDraftView({
  draft,
  onEdit,
}: {
  draft: CompetitiveIntelligenceDraft;
  onEdit: (updates: Partial<CompetitiveIntelligenceDraft>) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="p-6 bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-2xl">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-red-100 rounded-lg">
            <Swords className="w-5 h-5 text-red-600" />
          </div>
          <h3 className="font-semibold text-red-900">
            Competitive Intelligence Complete
          </h3>
        </div>
        <p className="text-sm text-red-700">
          Analysis of what your audience has tried before, current workarounds, competitor perceptions, and barriers to switching.
        </p>
      </div>

      {/* Alternatives Tried */}
      {draft.alternatives_tried && draft.alternatives_tried.length > 0 && (
        <DraftCard>
          <DraftSection
            title="Alternatives They've Tried"
            icon={<AlertTriangle className="w-5 h-5" />}
            color="orange"
          >
            <div className="space-y-4">
              {draft.alternatives_tried.map((alt, index) => (
                <div key={index} className="p-4 bg-gradient-to-br from-orange-50 to-white border border-orange-200 rounded-xl">
                  <h4 className="font-semibold text-orange-900 mb-3">{alt.solution_type}</h4>

                  {alt.specific_examples && alt.specific_examples.length > 0 && (
                    <div className="mb-3">
                      <span className="text-xs font-medium text-orange-700 uppercase">Examples</span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {alt.specific_examples.map((ex, i) => (
                          <span key={i} className="px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded-lg">{ex}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-xs font-medium text-slate-500 uppercase">Why They Tried It</span>
                      <p className="text-slate-700 mt-1">{alt.why_they_tried_it}</p>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-slate-500 uppercase">Why It Failed</span>
                      <p className="text-slate-700 mt-1">{alt.why_it_failed}</p>
                    </div>
                  </div>

                  {alt.emotional_residue && (
                    <div className="mt-3 p-3 bg-red-50 rounded-lg">
                      <span className="text-xs font-medium text-red-700 uppercase">Emotional Residue</span>
                      <p className="text-sm text-red-900 mt-1">{alt.emotional_residue}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </DraftSection>
        </DraftCard>
      )}

      {/* Current Workarounds */}
      {draft.current_workarounds && draft.current_workarounds.length > 0 && (
        <DraftCard>
          <DraftSection
            title="Current Workarounds"
            icon={<Ban className="w-5 h-5" />}
            color="orange"
          >
            <div className="space-y-3">
              {draft.current_workarounds.map((wa, index) => (
                <div key={index} className="p-4 bg-gradient-to-br from-amber-50 to-white border border-amber-200 rounded-xl">
                  <h4 className="font-semibold text-amber-900 mb-2">{wa.workaround}</h4>
                  <div className="grid md:grid-cols-3 gap-3 text-sm">
                    <div>
                      <span className="text-xs font-medium text-amber-700 uppercase">Effectiveness</span>
                      <p className="text-amber-900 mt-1">{wa.effectiveness}</p>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-amber-700 uppercase">Effort</span>
                      <p className="text-amber-900 mt-1">{wa.effort_required}</p>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-amber-700 uppercase">Cost</span>
                      <p className="text-amber-900 mt-1">{wa.cost}</p>
                    </div>
                  </div>
                  {wa.why_they_stick_with_it && (
                    <p className="mt-3 text-sm text-slate-600 italic">"{wa.why_they_stick_with_it}"</p>
                  )}
                </div>
              ))}
            </div>
          </DraftSection>
        </DraftCard>
      )}

      {/* vs Competitors */}
      {draft.vs_competitors && draft.vs_competitors.length > 0 && (
        <DraftCard>
          <DraftSection
            title="Competitor Comparison"
            icon={<Scale className="w-5 h-5" />}
            color="blue"
          >
            <div className="space-y-4">
              {draft.vs_competitors.map((comp, index) => (
                <div key={index} className="p-4 bg-gradient-to-br from-blue-50 to-white border border-blue-200 rounded-xl">
                  <h4 className="font-semibold text-blue-900 mb-2">{comp.competitor_name}</h4>
                  <p className="text-sm text-blue-700 mb-3">{comp.segment_perception}</p>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-3 bg-emerald-50 rounded-lg">
                      <span className="text-xs font-medium text-emerald-700 uppercase">Perceived Strengths</span>
                      <ul className="mt-2 space-y-1">
                        {comp.competitor_strengths?.map((s, i) => (
                          <li key={i} className="text-sm text-emerald-900 flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5" />
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="p-3 bg-red-50 rounded-lg">
                      <span className="text-xs font-medium text-red-700 uppercase">Perceived Weaknesses</span>
                      <ul className="mt-2 space-y-1">
                        {comp.competitor_weaknesses?.map((w, i) => (
                          <li key={i} className="text-sm text-red-900 flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5" />
                            {w}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {comp.switching_triggers && comp.switching_triggers.length > 0 && (
                    <div className="mt-3">
                      <span className="text-xs font-medium text-blue-700 uppercase">Switching Triggers</span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {comp.switching_triggers.map((t, i) => (
                          <span key={i} className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-lg">{t}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </DraftSection>
        </DraftCard>
      )}

      {/* Switching Barriers */}
      {draft.switching_barriers && draft.switching_barriers.length > 0 && (
        <DraftCard>
          <DraftSection
            title="Switching Barriers"
            icon={<Ban className="w-5 h-5" />}
            color="rose"
          >
            <div className="space-y-3">
              {draft.switching_barriers.map((barrier, index) => (
                <div key={index} className="p-4 bg-gradient-to-br from-red-50 to-white border border-red-200 rounded-xl">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-red-900">{barrier.barrier_type}</h4>
                    <span className={`px-2 py-1 text-xs rounded-lg font-medium ${
                      barrier.severity === 'critical' ? 'bg-red-200 text-red-800' :
                      barrier.severity === 'high' ? 'bg-orange-200 text-orange-800' :
                      barrier.severity === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                      'bg-green-200 text-green-800'
                    }`}>
                      {barrier.severity}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 mb-2">{barrier.description}</p>
                  <div className="p-2 bg-emerald-50 rounded-lg">
                    <span className="text-xs font-medium text-emerald-700">How to Overcome:</span>
                    <p className="text-sm text-emerald-900 mt-1">{barrier.how_to_overcome}</p>
                  </div>
                </div>
              ))}
            </div>
          </DraftSection>
        </DraftCard>
      )}

      {/* Evaluation Process */}
      {draft.evaluation_process && (
        <DraftCard>
          <DraftSection
            title="Evaluation Process"
            icon={<ClipboardCheck className="w-5 h-5" />}
            color="purple"
          >
            <div className="p-4 bg-gradient-to-br from-purple-50 to-white border border-purple-200 rounded-xl space-y-4">
              {draft.evaluation_process.criteria_for_comparison && (
                <div>
                  <span className="text-xs font-medium text-purple-700 uppercase">Comparison Criteria</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {draft.evaluation_process.criteria_for_comparison.map((c, i) => (
                      <span key={i} className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-lg">{c}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                {draft.evaluation_process.dealbreakers && (
                  <div className="p-3 bg-red-50 rounded-lg">
                    <span className="text-xs font-medium text-red-700 uppercase">Dealbreakers</span>
                    <ul className="mt-2 space-y-1">
                      {draft.evaluation_process.dealbreakers.map((d, i) => (
                        <li key={i} className="text-sm text-red-900">• {d}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {draft.evaluation_process.nice_to_haves && (
                  <div className="p-3 bg-emerald-50 rounded-lg">
                    <span className="text-xs font-medium text-emerald-700 uppercase">Nice to Haves</span>
                    <ul className="mt-2 space-y-1">
                      {draft.evaluation_process.nice_to_haves.map((n, i) => (
                        <li key={i} className="text-sm text-emerald-900">• {n}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="text-sm text-slate-700">
                <p><strong>How They Compare:</strong> {draft.evaluation_process.how_they_compare}</p>
                <p className="mt-2"><strong>Decision Authority:</strong> {draft.evaluation_process.decision_authority}</p>
              </div>
            </div>
          </DraftSection>
        </DraftCard>
      )}

      {/* Category Beliefs */}
      {draft.category_beliefs && (
        <DraftCard>
          <DraftSection
            title="Category Beliefs & Misconceptions"
            icon={<Brain className="w-5 h-5" />}
            color="purple"
          >
            <div className="p-4 bg-gradient-to-br from-indigo-50 to-white border border-indigo-200 rounded-xl space-y-4">
              {draft.category_beliefs.what_they_believe && (
                <div>
                  <span className="text-xs font-medium text-indigo-700 uppercase">What They Believe</span>
                  <ul className="mt-2 space-y-1">
                    {draft.category_beliefs.what_they_believe.map((b, i) => (
                      <li key={i} className="text-sm text-indigo-900">• {b}</li>
                    ))}
                  </ul>
                </div>
              )}

              {draft.category_beliefs.misconceptions_to_address && draft.category_beliefs.misconceptions_to_address.length > 0 && (
                <div>
                  <span className="text-xs font-medium text-indigo-700 uppercase">Misconceptions to Address</span>
                  <div className="mt-2 space-y-3">
                    {draft.category_beliefs.misconceptions_to_address.map((m, i) => (
                      <div key={i} className="p-3 bg-white rounded-lg border border-indigo-100">
                        <p className="text-sm font-medium text-indigo-900">{m.misconception}</p>
                        <p className="text-xs text-slate-600 mt-1">Root cause: {m.root_cause}</p>
                        <p className="text-xs text-emerald-700 mt-1">Reframe: {m.how_to_reframe}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </DraftSection>
        </DraftCard>
      )}
    </div>
  );
}
