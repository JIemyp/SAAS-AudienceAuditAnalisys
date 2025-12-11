"use client";

import { use } from "react";
import {
  DraftCard,
  DraftSection,
} from "@/components/generation/GenerationPage";
import { SegmentGenerationPage } from "@/components/generation/SegmentGenerationPage";
import { PricingPsychologyDraft } from "@/types";
import { DollarSign, Wallet, Anchor, TrendingUp, CreditCard, Calculator, AlertCircle, Percent, Calendar } from "lucide-react";

export default function PricingPsychologyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = use(params);

  return (
    <SegmentGenerationPage<PricingPsychologyDraft>
      projectId={projectId}
      title="Pricing Psychology"
      description="Understand how your audience thinks about money, budgets, and value when considering your product or service."
      stepType="pricing-psychology"
      generateEndpoint="/api/generate/pricing-psychology"
      approveEndpoint="/api/approve/pricing-psychology"
      draftTable="pricing_psychology_drafts"
      approvedTable="pricing_psychology"
      nextStepUrl="/generate/trust-framework"
      icon={<DollarSign className="w-6 h-6" />}
      emptyStateMessage="Discover how your audience perceives price and value, what objections they have, and how to position your pricing effectively."
      renderDraft={(draft, onEdit) => (
        <PricingPsychologyDraftView draft={draft} onEdit={onEdit} />
      )}
    />
  );
}

function PricingPsychologyDraftView({
  draft,
  onEdit,
}: {
  draft: PricingPsychologyDraft;
  onEdit: (updates: Partial<PricingPsychologyDraft>) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <DollarSign className="w-5 h-5 text-green-600" />
          </div>
          <h3 className="font-semibold text-green-900">
            Pricing Psychology Analysis Complete
          </h3>
        </div>
        <p className="text-sm text-green-700">
          Deep understanding of how your audience perceives pricing, what value anchors resonate, and how to handle objections.
        </p>
      </div>

      {/* Budget Context */}
      {draft.budget_context && (
        <DraftCard>
          <DraftSection
            title="Budget Context"
            icon={<Wallet className="w-5 h-5" />}
            color="blue"
          >
            <div className="p-4 bg-gradient-to-br from-blue-50 to-white border border-blue-200 rounded-xl">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <span className="text-xs font-medium text-blue-700 uppercase">Spending Category</span>
                  <p className="text-sm text-blue-900 mt-1">{draft.budget_context.spending_category}</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-blue-700 uppercase">Budget Allocation</span>
                  <p className="text-sm text-blue-900 mt-1">{draft.budget_context.budget_allocation}</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-blue-700 uppercase">Decision Cycle</span>
                  <p className="text-sm text-blue-900 mt-1">{draft.budget_context.decision_cycle}</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-blue-700 uppercase">Who Controls Budget</span>
                  <p className="text-sm text-blue-900 mt-1">{draft.budget_context.who_controls_budget}</p>
                </div>
              </div>
            </div>
          </DraftSection>
        </DraftCard>
      )}

      {/* Price Perception */}
      {draft.price_perception && (
        <DraftCard>
          <DraftSection
            title="Price Perception"
            icon={<TrendingUp className="w-5 h-5" />}
            color="emerald"
          >
            <div className="p-4 bg-gradient-to-br from-emerald-50 to-white border border-emerald-200 rounded-xl">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-3 bg-white rounded-lg border border-emerald-100">
                  <span className="text-xs font-medium text-emerald-700 uppercase">Sensitivity Level</span>
                  <p className={`text-lg font-semibold mt-1 capitalize ${
                    draft.price_perception.price_sensitivity_level === 'high' ? 'text-red-600' :
                    draft.price_perception.price_sensitivity_level === 'medium' ? 'text-yellow-600' :
                    'text-green-600'
                  }`}>
                    {draft.price_perception.price_sensitivity_level}
                  </p>
                </div>
                <div className="p-3 bg-white rounded-lg border border-emerald-100">
                  <span className="text-xs font-medium text-emerald-700 uppercase">Current Spending</span>
                  <p className="text-sm text-emerald-900 mt-1">{draft.price_perception.current_spending_on_alternatives}</p>
                </div>
                <div className="p-3 bg-white rounded-lg border border-emerald-100">
                  <span className="text-xs font-medium text-emerald-700 uppercase">Spending Ceiling</span>
                  <p className="text-sm text-emerald-900 mt-1">{draft.price_perception.spending_ceiling}</p>
                </div>
                <div className="p-3 bg-white rounded-lg border border-emerald-100">
                  <span className="text-xs font-medium text-emerald-700 uppercase">Sweet Spot</span>
                  <p className="text-sm text-emerald-900 mt-1">{draft.price_perception.spending_sweet_spot}</p>
                </div>
                <div className="p-3 bg-white rounded-lg border border-emerald-100 md:col-span-2">
                  <span className="text-xs font-medium text-emerald-700 uppercase">Free Trial Importance</span>
                  <p className="text-sm text-emerald-900 mt-1">{draft.price_perception.free_trial_importance}</p>
                </div>
              </div>
            </div>
          </DraftSection>
        </DraftCard>
      )}

      {/* Value Anchors */}
      {draft.value_anchors && draft.value_anchors.length > 0 && (
        <DraftCard>
          <DraftSection
            title="Value Anchors"
            icon={<Anchor className="w-5 h-5" />}
            color="purple"
          >
            <div className="space-y-3">
              {draft.value_anchors.map((anchor, index) => (
                <div key={index} className="p-4 bg-gradient-to-br from-purple-50 to-white border border-purple-200 rounded-xl">
                  <h4 className="font-semibold text-purple-900">{anchor.comparison_point}</h4>
                  <p className="text-sm text-purple-700 mt-2">{anchor.why_this_works}</p>
                </div>
              ))}
            </div>
          </DraftSection>
        </DraftCard>
      )}

      {/* Willingness to Pay Signals */}
      {draft.willingness_to_pay_signals && draft.willingness_to_pay_signals.length > 0 && (
        <DraftCard>
          <DraftSection
            title="Willingness to Pay Signals"
            icon={<TrendingUp className="w-5 h-5" />}
            color="emerald"
          >
            <div className="space-y-3">
              {draft.willingness_to_pay_signals.map((signal, index) => (
                <div key={index} className="p-4 bg-gradient-to-br from-green-50 to-white border border-green-200 rounded-xl">
                  <h4 className="font-semibold text-green-900">{signal.signal}</h4>
                  <p className="text-sm text-slate-600 mt-1">Indicates: {signal.indicates}</p>
                  <p className="text-sm text-green-700 mt-2 p-2 bg-green-100 rounded-lg">
                    <strong>Response:</strong> {signal.how_to_respond}
                  </p>
                </div>
              ))}
            </div>
          </DraftSection>
        </DraftCard>
      )}

      {/* Payment Psychology */}
      {draft.payment_psychology && (
        <DraftCard>
          <DraftSection
            title="Payment Psychology"
            icon={<CreditCard className="w-5 h-5" />}
            color="purple"
          >
            <div className="p-4 bg-gradient-to-br from-indigo-50 to-white border border-indigo-200 rounded-xl space-y-4">
              {draft.payment_psychology.preferred_structure && (
                <div>
                  <span className="text-xs font-medium text-indigo-700 uppercase">Preferred Structure</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {draft.payment_psychology.preferred_structure.map((s, i) => (
                      <span key={i} className="px-2 py-1 text-xs bg-indigo-100 text-indigo-700 rounded-lg">{s}</span>
                    ))}
                  </div>
                </div>
              )}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <span className="text-xs font-medium text-indigo-700 uppercase">Payment Methods</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {draft.payment_psychology.payment_methods?.map((m, i) => (
                      <span key={i} className="px-2 py-1 text-xs bg-indigo-100 text-indigo-700 rounded-lg">{m}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-xs font-medium text-indigo-700 uppercase">Billing Frequency</span>
                  <p className="text-sm text-indigo-900 mt-1">{draft.payment_psychology.billing_frequency}</p>
                </div>
              </div>
              {draft.payment_psychology.payment_friction_points && (
                <div className="p-3 bg-red-50 rounded-lg">
                  <span className="text-xs font-medium text-red-700 uppercase">Friction Points</span>
                  <ul className="mt-2 space-y-1">
                    {draft.payment_psychology.payment_friction_points.map((p, i) => (
                      <li key={i} className="text-sm text-red-900">• {p}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </DraftSection>
        </DraftCard>
      )}

      {/* ROI Calculation */}
      {draft.roi_calculation && (
        <DraftCard>
          <DraftSection
            title="ROI Calculation"
            icon={<Calculator className="w-5 h-5" />}
            color="blue"
          >
            <div className="p-4 bg-gradient-to-br from-cyan-50 to-white border border-cyan-200 rounded-xl">
              <div className="space-y-3">
                <div>
                  <span className="text-xs font-medium text-cyan-700 uppercase">How They Measure Value</span>
                  <p className="text-sm text-cyan-900 mt-1">{draft.roi_calculation.how_they_measure_value}</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-cyan-700 uppercase">Payback Expectation</span>
                  <p className="text-sm text-cyan-900 mt-1">{draft.roi_calculation.payback_expectation}</p>
                </div>
                {draft.roi_calculation.metrics_they_track && (
                  <div>
                    <span className="text-xs font-medium text-cyan-700 uppercase">Metrics They Track</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {draft.roi_calculation.metrics_they_track.map((m, i) => (
                        <span key={i} className="px-2 py-1 text-xs bg-cyan-100 text-cyan-700 rounded-lg">{m}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </DraftSection>
        </DraftCard>
      )}

      {/* Pricing Objections */}
      {draft.pricing_objections && draft.pricing_objections.length > 0 && (
        <DraftCard>
          <DraftSection
            title="Pricing Objections"
            icon={<AlertCircle className="w-5 h-5" />}
            color="rose"
          >
            <div className="space-y-3">
              {draft.pricing_objections.map((obj, index) => (
                <div key={index} className="p-4 bg-gradient-to-br from-red-50 to-white border border-red-200 rounded-xl">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-red-900">{obj.objection}</h4>
                    <span className={`px-2 py-1 text-xs rounded-lg font-medium ${
                      obj.is_price_or_value === 'price' ? 'bg-red-200 text-red-800' : 'bg-blue-200 text-blue-800'
                    }`}>
                      {obj.is_price_or_value === 'price' ? 'Price Issue' : 'Value Issue'}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 mb-2">Underlying concern: {obj.underlying_concern}</p>
                  <div className="p-2 bg-emerald-50 rounded-lg">
                    <span className="text-xs font-medium text-emerald-700">Reframe Strategy:</span>
                    <p className="text-sm text-emerald-900 mt-1">{obj.reframe_strategy}</p>
                  </div>
                </div>
              ))}
            </div>
          </DraftSection>
        </DraftCard>
      )}

      {/* Discount Sensitivity */}
      {draft.discount_sensitivity && (
        <DraftCard>
          <DraftSection
            title="Discount Sensitivity"
            icon={<Percent className="w-5 h-5" />}
            color="orange"
          >
            <div className="p-4 bg-gradient-to-br from-amber-50 to-white border border-amber-200 rounded-xl space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-amber-900">Responds to Discounts:</span>
                <span className={`px-2 py-1 text-xs rounded-lg ${
                  draft.discount_sensitivity.responds_to_discounts ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                }`}>
                  {draft.discount_sensitivity.responds_to_discounts ? 'Yes' : 'No'}
                </span>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {draft.discount_sensitivity.types_that_work && (
                  <div className="p-3 bg-emerald-50 rounded-lg">
                    <span className="text-xs font-medium text-emerald-700 uppercase">What Works</span>
                    <ul className="mt-2 space-y-1">
                      {draft.discount_sensitivity.types_that_work.map((t, i) => (
                        <li key={i} className="text-sm text-emerald-900">• {t}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {draft.discount_sensitivity.types_that_backfire && (
                  <div className="p-3 bg-red-50 rounded-lg">
                    <span className="text-xs font-medium text-red-700 uppercase">What Backfires</span>
                    <ul className="mt-2 space-y-1">
                      {draft.discount_sensitivity.types_that_backfire.map((t, i) => (
                        <li key={i} className="text-sm text-red-900">• {t}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="p-3 bg-amber-100 rounded-lg">
                <span className="text-xs font-medium text-amber-800 uppercase">Optimal Strategy</span>
                <p className="text-sm text-amber-900 mt-1">{draft.discount_sensitivity.optimal_strategy}</p>
              </div>
            </div>
          </DraftSection>
        </DraftCard>
      )}

      {/* Budget Triggers */}
      {draft.budget_triggers && draft.budget_triggers.length > 0 && (
        <DraftCard>
          <DraftSection
            title="Budget Triggers"
            icon={<Calendar className="w-5 h-5" />}
            color="purple"
          >
            <div className="space-y-3">
              {draft.budget_triggers.map((trigger, index) => (
                <div key={index} className="p-4 bg-gradient-to-br from-violet-50 to-white border border-violet-200 rounded-xl">
                  <h4 className="font-semibold text-violet-900">{trigger.trigger_event}</h4>
                  <p className="text-sm text-violet-700 mt-1">Timing: {trigger.timing}</p>
                  <p className="text-sm text-emerald-700 mt-2 p-2 bg-emerald-50 rounded-lg">
                    <strong>How to Leverage:</strong> {trigger.how_to_leverage}
                  </p>
                </div>
              ))}
            </div>
          </DraftSection>
        </DraftCard>
      )}
    </div>
  );
}
