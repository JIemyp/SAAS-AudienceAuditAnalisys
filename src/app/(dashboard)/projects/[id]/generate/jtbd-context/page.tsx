"use client";

import { use } from "react";
import {
  DraftCard,
  DraftSection,
} from "@/components/generation/GenerationPage";
import { SegmentGenerationPage } from "@/components/generation/SegmentGenerationPage";
import { JTBDContextDraft } from "@/types";
import { Target, Zap, Scale, CheckSquare, AlertTriangle, Brain, ListOrdered, GitBranch } from "lucide-react";

export default function JTBDContextPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = use(params);

  return (
    <SegmentGenerationPage<JTBDContextDraft>
      projectId={projectId}
      title="JTBD Context"
      description="Enhance Jobs-to-be-Done analysis with situational triggers, competing solutions, success metrics, obstacles, and hiring anxieties."
      stepType="jtbd-context"
      generateEndpoint="/api/generate/jtbd-context"
      approveEndpoint="/api/approve/jtbd-context"
      draftTable="jtbd_context_drafts"
      approvedTable="jtbd_context"
      nextStepUrl="/report"
      icon={<Target className="w-6 h-6" />}
      emptyStateMessage="Discover WHEN your audience hires solutions, WHAT else they might hire, HOW they measure success, and WHAT blocks them."
      renderDraft={(draft, onEdit) => (
        <JTBDContextDraftView draft={draft} onEdit={onEdit} />
      )}
    />
  );
}

function JTBDContextDraftView({
  draft,
  onEdit,
}: {
  draft: JTBDContextDraft;
  onEdit: (updates: Partial<JTBDContextDraft>) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="p-6 bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200 rounded-2xl">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-violet-100 rounded-lg">
            <Target className="w-5 h-5 text-violet-600" />
          </div>
          <h3 className="font-semibold text-violet-900">
            JTBD Context Analysis Complete
          </h3>
        </div>
        <p className="text-sm text-violet-700">
          Deep contextual analysis of Jobs-to-be-Done with triggers, competing solutions, success metrics, obstacles, and anxieties.
        </p>
      </div>

      {/* Job Priority Ranking */}
      {draft.job_priority_ranking && draft.job_priority_ranking.length > 0 && (
        <DraftCard>
          <DraftSection
            title="Job Priority Ranking"
            icon={<ListOrdered className="w-5 h-5" />}
            color="purple"
          >
            <div className="space-y-2">
              {draft.job_priority_ranking.map((job, index) => (
                <div key={index} className="p-4 bg-gradient-to-br from-violet-50 to-white border border-violet-200 rounded-xl flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-violet-100 text-violet-700 font-bold rounded-full">
                    #{job.priority}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-violet-900">{job.job_name}</h4>
                    <p className="text-sm text-slate-600 mt-1">{job.reasoning}</p>
                  </div>
                </div>
              ))}
            </div>
          </DraftSection>
        </DraftCard>
      )}

      {/* Job Dependencies */}
      {draft.job_dependencies && draft.job_dependencies.length > 0 && (
        <DraftCard>
          <DraftSection
            title="Job Dependencies"
            icon={<GitBranch className="w-5 h-5" />}
            color="purple"
          >
            <div className="space-y-3">
              {draft.job_dependencies.map((dep, index) => (
                <div key={index} className="p-4 bg-gradient-to-br from-indigo-50 to-white border border-indigo-200 rounded-xl">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-2 py-1 text-xs bg-indigo-100 text-indigo-700 rounded-lg font-medium">{dep.primary_job}</span>
                    <span className="text-indigo-400">→</span>
                    <span className="px-2 py-1 text-xs bg-emerald-100 text-emerald-700 rounded-lg font-medium">{dep.enables_job}</span>
                  </div>
                  <p className="text-sm text-slate-600">{dep.relationship}</p>
                </div>
              ))}
            </div>
          </DraftSection>
        </DraftCard>
      )}

      {/* Job Contexts */}
      {draft.job_contexts && draft.job_contexts.length > 0 && (
        <>
          {draft.job_contexts.map((jobCtx, jobIndex) => (
            <div key={jobIndex} className="space-y-4">
              {/* Job Header */}
              <div className="p-4 bg-gradient-to-r from-slate-100 to-slate-50 border border-slate-200 rounded-xl">
                <h3 className="font-semibold text-slate-900 text-lg">
                  {jobCtx.job_name}
                </h3>
                {jobCtx.job_reference_id && (
                  <span className="text-xs text-slate-500">Ref: {jobCtx.job_reference_id}</span>
                )}
              </div>

              {/* Hire Triggers */}
              {jobCtx.hire_triggers && jobCtx.hire_triggers.length > 0 && (
                <DraftCard>
                  <DraftSection
                    title="Hire Triggers (WHEN)"
                    icon={<Zap className="w-5 h-5" />}
                    color="orange"
                  >
                    <div className="space-y-3">
                      {jobCtx.hire_triggers.map((trigger, index) => (
                        <div key={index} className="p-4 bg-gradient-to-br from-amber-50 to-white border border-amber-200 rounded-xl">
                          <h4 className="font-semibold text-amber-900 mb-2">{trigger.situation}</h4>
                          <div className="grid md:grid-cols-3 gap-3 text-sm">
                            <div>
                              <span className="text-xs font-medium text-amber-700 uppercase">Frequency</span>
                              <p className="text-amber-900 mt-1">{trigger.frequency}</p>
                            </div>
                            <div>
                              <span className="text-xs font-medium text-amber-700 uppercase">Urgency</span>
                              <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-lg font-medium ${
                                trigger.urgency === 'critical' ? 'bg-red-200 text-red-800' :
                                trigger.urgency === 'high' ? 'bg-orange-200 text-orange-800' :
                                trigger.urgency === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                                'bg-green-200 text-green-800'
                              }`}>
                                {trigger.urgency}
                              </span>
                            </div>
                            <div>
                              <span className="text-xs font-medium text-amber-700 uppercase">Emotional State</span>
                              <p className="text-amber-900 mt-1">{trigger.emotional_state}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </DraftSection>
                </DraftCard>
              )}

              {/* Competing Solutions */}
              {jobCtx.competing_solutions && jobCtx.competing_solutions.length > 0 && (
                <DraftCard>
                  <DraftSection
                    title="Competing Solutions"
                    icon={<Scale className="w-5 h-5" />}
                    color="blue"
                  >
                    <div className="space-y-3">
                      {jobCtx.competing_solutions.map((comp, index) => (
                        <div key={index} className="p-4 bg-gradient-to-br from-blue-50 to-white border border-blue-200 rounded-xl">
                          <h4 className="font-semibold text-blue-900 mb-2">{comp.alternative}</h4>
                          <div className="grid md:grid-cols-2 gap-3 text-sm mb-3">
                            <div>
                              <span className="text-xs font-medium text-blue-700 uppercase">Why Chosen</span>
                              <p className="text-slate-700 mt-1">{comp.why_chosen}</p>
                            </div>
                            <div>
                              <span className="text-xs font-medium text-blue-700 uppercase">When Chosen</span>
                              <p className="text-slate-700 mt-1">{comp.when_chosen}</p>
                            </div>
                          </div>
                          <div className="grid md:grid-cols-2 gap-3">
                            <div className="p-2 bg-slate-50 rounded-lg">
                              <span className="text-xs font-medium text-slate-600 uppercase">Job Completion Rate</span>
                              <p className="text-sm text-slate-800 mt-1">{comp.job_completion_rate}</p>
                            </div>
                            <div className="p-2 bg-emerald-50 rounded-lg">
                              <span className="text-xs font-medium text-emerald-600 uppercase">Your Advantage</span>
                              <p className="text-sm text-emerald-800 mt-1">{comp.your_advantage}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </DraftSection>
                </DraftCard>
              )}

              {/* Success Metrics */}
              {jobCtx.success_metrics && (
                <DraftCard>
                  <DraftSection
                    title="Success Metrics"
                    icon={<CheckSquare className="w-5 h-5" />}
                    color="emerald"
                  >
                    <div className="p-4 bg-gradient-to-br from-emerald-50 to-white border border-emerald-200 rounded-xl space-y-4">
                      {jobCtx.success_metrics.how_measured && jobCtx.success_metrics.how_measured.length > 0 && (
                        <div>
                          <span className="text-xs font-medium text-emerald-700 uppercase">How They Know Job Is Done</span>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {jobCtx.success_metrics.how_measured.map((m, i) => (
                              <span key={i} className="px-2 py-1 text-xs bg-emerald-100 text-emerald-700 rounded-lg">{m}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {jobCtx.success_metrics.immediate_progress && jobCtx.success_metrics.immediate_progress.length > 0 && (
                        <div>
                          <span className="text-xs font-medium text-emerald-700 uppercase">Immediate Progress Signs</span>
                          <ul className="mt-1 space-y-1">
                            {jobCtx.success_metrics.immediate_progress.map((p, i) => (
                              <li key={i} className="text-sm text-emerald-900">• {p}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-3 bg-emerald-100 rounded-lg">
                          <span className="text-xs font-medium text-emerald-700 uppercase">Short-Term Success</span>
                          <p className="text-emerald-900 mt-1">{jobCtx.success_metrics.short_term_success}</p>
                        </div>
                        <div className="p-3 bg-emerald-100 rounded-lg">
                          <span className="text-xs font-medium text-emerald-700 uppercase">Long-Term Success</span>
                          <p className="text-emerald-900 mt-1">{jobCtx.success_metrics.long_term_success}</p>
                        </div>
                      </div>

                      {jobCtx.success_metrics.acceptable_tradeoffs && jobCtx.success_metrics.acceptable_tradeoffs.length > 0 && (
                        <div>
                          <span className="text-xs font-medium text-amber-700 uppercase">Acceptable Tradeoffs</span>
                          <ul className="mt-1 space-y-1">
                            {jobCtx.success_metrics.acceptable_tradeoffs.map((t, i) => (
                              <li key={i} className="text-sm text-amber-900">• {t}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </DraftSection>
                </DraftCard>
              )}

              {/* Obstacles */}
              {jobCtx.obstacles && jobCtx.obstacles.length > 0 && (
                <DraftCard>
                  <DraftSection
                    title="Obstacles"
                    icon={<AlertTriangle className="w-5 h-5" />}
                    color="rose"
                  >
                    <div className="space-y-3">
                      {jobCtx.obstacles.map((obs, index) => (
                        <div key={index} className="p-4 bg-gradient-to-br from-red-50 to-white border border-red-200 rounded-xl">
                          <h4 className="font-semibold text-red-900 mb-2">{obs.obstacle}</h4>
                          <p className="text-sm text-slate-700 mb-2">{obs.blocks_progress}</p>
                          <div className="p-2 bg-emerald-50 rounded-lg">
                            <span className="text-xs font-medium text-emerald-700">How You Remove It:</span>
                            <p className="text-sm text-emerald-900 mt-1">{obs.how_you_remove_it}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </DraftSection>
                </DraftCard>
              )}

              {/* Hiring Anxieties */}
              {jobCtx.hiring_anxieties && jobCtx.hiring_anxieties.length > 0 && (
                <DraftCard>
                  <DraftSection
                    title="Hiring Anxieties"
                    icon={<Brain className="w-5 h-5" />}
                    color="purple"
                  >
                    <div className="space-y-3">
                      {jobCtx.hiring_anxieties.map((anx, index) => (
                        <div key={index} className="p-4 bg-gradient-to-br from-purple-50 to-white border border-purple-200 rounded-xl">
                          <h4 className="font-semibold text-purple-900 mb-2">{anx.anxiety}</h4>
                          <div className="grid md:grid-cols-2 gap-3 text-sm">
                            <div>
                              <span className="text-xs font-medium text-purple-700 uppercase">Rooted In</span>
                              <p className="text-slate-700 mt-1">{anx.rooted_in}</p>
                            </div>
                            <div className="p-2 bg-emerald-50 rounded-lg">
                              <span className="text-xs font-medium text-emerald-700 uppercase">How to Address</span>
                              <p className="text-emerald-900 mt-1">{anx.how_to_address}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </DraftSection>
                </DraftCard>
              )}

              {/* Divider between jobs */}
              {jobIndex < draft.job_contexts.length - 1 && (
                <div className="border-t-2 border-dashed border-slate-200 my-8" />
              )}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
