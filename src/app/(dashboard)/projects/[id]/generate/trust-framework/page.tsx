"use client";

import { use } from "react";
import {
  DraftCard,
  DraftSection,
} from "@/components/generation/GenerationPage";
import { SegmentGenerationPage } from "@/components/generation/SegmentGenerationPage";
import { TrustFrameworkDraft } from "@/types";
import { Shield, CheckCircle, Users, Eye, XCircle, Award, AlertTriangle, Route } from "lucide-react";

export default function TrustFrameworkPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = use(params);

  return (
    <SegmentGenerationPage<TrustFrameworkDraft>
      projectId={projectId}
      title="Trust Framework"
      description="Analyze what builds and destroys trust for this segment. Understand proof hierarchy, trusted authorities, and risk reduction mechanisms."
      stepType="trust-framework"
      generateEndpoint="/api/generate/trust-framework"
      approveEndpoint="/api/approve/trust-framework"
      draftTable="trust_framework_drafts"
      approvedTable="trust_framework"
      nextStepUrl="/generate/jtbd-context"
      icon={<Shield className="w-6 h-6" />}
      emptyStateMessage="Discover what builds trust with your audience, who they trust, and what proof they need to believe your claims."
      renderDraft={(draft, onEdit) => (
        <TrustFrameworkDraftView draft={draft} onEdit={onEdit} />
      )}
    />
  );
}

function TrustFrameworkDraftView({
  draft,
  onEdit,
}: {
  draft: TrustFrameworkDraft;
  onEdit: (updates: Partial<TrustFrameworkDraft>) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="p-6 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-emerald-100 rounded-lg">
            <Shield className="w-5 h-5 text-emerald-600" />
          </div>
          <h3 className="font-semibold text-emerald-900">
            Trust Framework Complete
          </h3>
        </div>
        <p className="text-sm text-emerald-700">
          Comprehensive analysis of trust factors, proof requirements, credibility markers, and risk reduction strategies.
        </p>
      </div>

      {/* Baseline Trust */}
      {draft.baseline_trust && (
        <DraftCard>
          <DraftSection
            title="Baseline Trust Level"
            icon={<Shield className="w-5 h-5" />}
            color="emerald"
          >
            <div className="p-4 bg-gradient-to-br from-emerald-50 to-white border border-emerald-200 rounded-xl space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <span className="text-xs font-medium text-emerald-700 uppercase">Trust in Category</span>
                  <p className="text-emerald-900 mt-1">{draft.baseline_trust.trust_in_category}</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-emerald-700 uppercase">Trust in Brand</span>
                  <p className="text-emerald-900 mt-1">{draft.baseline_trust.trust_in_brand}</p>
                </div>
              </div>

              {draft.baseline_trust.reasons_for_skepticism && draft.baseline_trust.reasons_for_skepticism.length > 0 && (
                <div className="p-3 bg-amber-50 rounded-lg">
                  <span className="text-xs font-medium text-amber-700 uppercase">Reasons for Skepticism</span>
                  <ul className="mt-2 space-y-1">
                    {draft.baseline_trust.reasons_for_skepticism.map((r, i) => (
                      <li key={i} className="text-sm text-amber-900">• {r}</li>
                    ))}
                  </ul>
                </div>
              )}

              {draft.baseline_trust.past_betrayals && draft.baseline_trust.past_betrayals.length > 0 && (
                <div className="p-3 bg-red-50 rounded-lg">
                  <span className="text-xs font-medium text-red-700 uppercase">Past Betrayals</span>
                  <ul className="mt-2 space-y-1">
                    {draft.baseline_trust.past_betrayals.map((b, i) => (
                      <li key={i} className="text-sm text-red-900">• {b}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </DraftSection>
        </DraftCard>
      )}

      {/* Proof Hierarchy */}
      {draft.proof_hierarchy && draft.proof_hierarchy.length > 0 && (
        <DraftCard>
          <DraftSection
            title="Proof Hierarchy"
            icon={<CheckCircle className="w-5 h-5" />}
            color="blue"
          >
            <div className="space-y-3">
              {draft.proof_hierarchy.map((proof, index) => (
                <div key={index} className="p-4 bg-gradient-to-br from-blue-50 to-white border border-blue-200 rounded-xl">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-blue-900">{proof.proof_type}</h4>
                    <span className={`px-2 py-1 text-xs rounded-lg font-medium ${
                      proof.effectiveness === 'very_high' ? 'bg-emerald-200 text-emerald-800' :
                      proof.effectiveness === 'high' ? 'bg-green-200 text-green-800' :
                      proof.effectiveness === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                      'bg-slate-200 text-slate-800'
                    }`}>
                      {proof.effectiveness}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 mb-2">{proof.why_it_works}</p>
                  <p className="text-sm text-blue-700 mb-2"><strong>How to Present:</strong> {proof.how_to_present}</p>

                  {proof.examples && proof.examples.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {proof.examples.map((ex, i) => (
                        <span key={i} className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-lg">{ex}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </DraftSection>
        </DraftCard>
      )}

      {/* Trusted Authorities */}
      {draft.trusted_authorities && draft.trusted_authorities.length > 0 && (
        <DraftCard>
          <DraftSection
            title="Trusted Authorities"
            icon={<Users className="w-5 h-5" />}
            color="purple"
          >
            <div className="space-y-3">
              {draft.trusted_authorities.map((auth, index) => (
                <div key={index} className="p-4 bg-gradient-to-br from-purple-50 to-white border border-purple-200 rounded-xl">
                  <h4 className="font-semibold text-purple-900 mb-2">{auth.authority_type}</h4>

                  {auth.specific_names && auth.specific_names.length > 0 && (
                    <div className="mb-3">
                      <span className="text-xs font-medium text-purple-700 uppercase">Specific Names</span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {auth.specific_names.map((name, i) => (
                          <span key={i} className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-lg">{name}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-xs font-medium text-slate-500 uppercase">Why Trusted</span>
                      <p className="text-slate-700 mt-1">{auth.why_trusted}</p>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-slate-500 uppercase">How to Leverage</span>
                      <p className="text-slate-700 mt-1">{auth.how_to_leverage}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </DraftSection>
        </DraftCard>
      )}

      {/* Social Proof */}
      {draft.social_proof && (
        <DraftCard>
          <DraftSection
            title="Social Proof Requirements"
            icon={<Users className="w-5 h-5" />}
            color="purple"
          >
            <div className="p-4 bg-gradient-to-br from-indigo-50 to-white border border-indigo-200 rounded-xl space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <span className="text-xs font-medium text-indigo-700 uppercase">Testimonial Profile</span>
                  <p className="text-indigo-900 mt-1">{draft.social_proof.testimonial_profile}</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-indigo-700 uppercase">Before/After Importance</span>
                  <p className="text-indigo-900 mt-1">{draft.social_proof.before_after_importance}</p>
                </div>
              </div>

              {draft.social_proof.numbers_that_matter && draft.social_proof.numbers_that_matter.length > 0 && (
                <div>
                  <span className="text-xs font-medium text-indigo-700 uppercase">Numbers That Matter</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {draft.social_proof.numbers_that_matter.map((n, i) => (
                      <span key={i} className="px-2 py-1 text-xs bg-indigo-100 text-indigo-700 rounded-lg">{n}</span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <span className="text-xs font-medium text-indigo-700 uppercase">Case Study Angle</span>
                <p className="text-indigo-900 mt-1">{draft.social_proof.case_study_angle}</p>
              </div>
            </div>
          </DraftSection>
        </DraftCard>
      )}

      {/* Transparency Needs */}
      {draft.transparency_needs && (
        <DraftCard>
          <DraftSection
            title="Transparency Needs"
            icon={<Eye className="w-5 h-5" />}
            color="blue"
          >
            <div className="p-4 bg-gradient-to-br from-cyan-50 to-white border border-cyan-200 rounded-xl space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-medium text-cyan-700 uppercase">Transparency Level:</span>
                <span className={`px-2 py-1 text-xs rounded-lg font-medium ${
                  draft.transparency_needs.transparency_level === 'full' ? 'bg-cyan-200 text-cyan-800' :
                  draft.transparency_needs.transparency_level === 'high' ? 'bg-cyan-200 text-cyan-800' :
                  draft.transparency_needs.transparency_level === 'moderate' ? 'bg-amber-200 text-amber-800' :
                  'bg-slate-200 text-slate-800'
                }`}>
                  {draft.transparency_needs.transparency_level}
                </span>
              </div>

              {draft.transparency_needs.information_needed && draft.transparency_needs.information_needed.length > 0 && (
                <div>
                  <span className="text-xs font-medium text-cyan-700 uppercase">Information Needed</span>
                  <ul className="mt-2 space-y-1">
                    {draft.transparency_needs.information_needed.map((info, i) => (
                      <li key={i} className="text-sm text-cyan-900">• {info}</li>
                    ))}
                  </ul>
                </div>
              )}

              {draft.transparency_needs.disclosure_expectations && draft.transparency_needs.disclosure_expectations.length > 0 && (
                <div>
                  <span className="text-xs font-medium text-cyan-700 uppercase">Disclosure Expectations</span>
                  <ul className="mt-2 space-y-1">
                    {draft.transparency_needs.disclosure_expectations.map((exp, i) => (
                      <li key={i} className="text-sm text-cyan-900">• {exp}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </DraftSection>
        </DraftCard>
      )}

      {/* Trust Killers */}
      {draft.trust_killers && draft.trust_killers.length > 0 && (
        <DraftCard>
          <DraftSection
            title="Trust Killers"
            icon={<XCircle className="w-5 h-5" />}
            color="rose"
          >
            <div className="space-y-3">
              {draft.trust_killers.map((killer, index) => (
                <div key={index} className="p-4 bg-gradient-to-br from-red-50 to-white border border-red-200 rounded-xl">
                  <h4 className="font-semibold text-red-900 mb-2">{killer.red_flag}</h4>
                  <p className="text-sm text-slate-700 mb-2">{killer.why_triggers_skepticism}</p>
                  <div className="p-2 bg-emerald-50 rounded-lg">
                    <span className="text-xs font-medium text-emerald-700">How to Avoid:</span>
                    <p className="text-sm text-emerald-900 mt-1">{killer.how_to_avoid}</p>
                  </div>
                </div>
              ))}
            </div>
          </DraftSection>
        </DraftCard>
      )}

      {/* Credibility Markers */}
      {draft.credibility_markers && draft.credibility_markers.length > 0 && (
        <DraftCard>
          <DraftSection
            title="Credibility Markers"
            icon={<Award className="w-5 h-5" />}
            color="orange"
          >
            <div className="space-y-3">
              {draft.credibility_markers.map((marker, index) => (
                <div key={index} className="p-4 bg-gradient-to-br from-amber-50 to-white border border-amber-200 rounded-xl flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-amber-900">{marker.signal}</h4>
                    <p className="text-sm text-slate-600 mt-1">Status: {marker.current_status}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-lg font-medium ${
                    marker.importance === 'critical' ? 'bg-red-200 text-red-800' :
                    marker.importance === 'high' ? 'bg-orange-200 text-orange-800' :
                    marker.importance === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                    'bg-slate-200 text-slate-800'
                  }`}>
                    {marker.importance}
                  </span>
                </div>
              ))}
            </div>
          </DraftSection>
        </DraftCard>
      )}

      {/* Risk Reduction */}
      {draft.risk_reduction && (
        <DraftCard>
          <DraftSection
            title="Risk Reduction"
            icon={<AlertTriangle className="w-5 h-5" />}
            color="orange"
          >
            <div className="p-4 bg-gradient-to-br from-orange-50 to-white border border-orange-200 rounded-xl space-y-4">
              {draft.risk_reduction.biggest_risks && draft.risk_reduction.biggest_risks.length > 0 && (
                <div className="p-3 bg-red-50 rounded-lg">
                  <span className="text-xs font-medium text-red-700 uppercase">Biggest Perceived Risks</span>
                  <ul className="mt-2 space-y-1">
                    {draft.risk_reduction.biggest_risks.map((risk, i) => (
                      <li key={i} className="text-sm text-red-900">• {risk}</li>
                    ))}
                  </ul>
                </div>
              )}

              {draft.risk_reduction.reversal_mechanisms && draft.risk_reduction.reversal_mechanisms.length > 0 && (
                <div>
                  <span className="text-xs font-medium text-orange-700 uppercase mb-2 block">Risk Reversal Mechanisms</span>
                  <div className="space-y-3">
                    {draft.risk_reduction.reversal_mechanisms.map((mech, i) => (
                      <div key={i} className="p-3 bg-emerald-50 rounded-lg">
                        <h5 className="font-medium text-emerald-900">{mech.mechanism}</h5>
                        <p className="text-sm text-emerald-700 mt-1">Effectiveness: {mech.effectiveness}</p>
                        <p className="text-sm text-slate-600 mt-1">{mech.implementation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </DraftSection>
        </DraftCard>
      )}

      {/* Trust Journey */}
      {draft.trust_journey && (
        <DraftCard>
          <DraftSection
            title="Trust Journey"
            icon={<Route className="w-5 h-5" />}
            color="purple"
          >
            <div className="p-4 bg-gradient-to-br from-violet-50 to-white border border-violet-200 rounded-xl">
              <div className="space-y-4">
                <div className="p-3 bg-violet-100 rounded-lg">
                  <span className="text-xs font-medium text-violet-700 uppercase">First Touchpoint Goal</span>
                  <p className="text-violet-900 mt-1">{draft.trust_journey.first_touchpoint_goal}</p>
                </div>

                {draft.trust_journey.mid_journey_reassurance && draft.trust_journey.mid_journey_reassurance.length > 0 && (
                  <div>
                    <span className="text-xs font-medium text-violet-700 uppercase">Mid-Journey Reassurance</span>
                    <ul className="mt-2 space-y-1">
                      {draft.trust_journey.mid_journey_reassurance.map((r, i) => (
                        <li key={i} className="text-sm text-violet-900">• {r}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-3 bg-emerald-50 rounded-lg">
                    <span className="text-xs font-medium text-emerald-700 uppercase">Pre-Purchase Push</span>
                    <p className="text-emerald-900 mt-1">{draft.trust_journey.pre_purchase_push}</p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <span className="text-xs font-medium text-blue-700 uppercase">Post-Purchase Confirmation</span>
                    <p className="text-blue-900 mt-1">{draft.trust_journey.post_purchase_confirmation}</p>
                  </div>
                </div>
              </div>
            </div>
          </DraftSection>
        </DraftCard>
      )}
    </div>
  );
}
