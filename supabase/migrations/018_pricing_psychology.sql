-- =====================================================
-- Migration 018: Pricing Psychology Module
-- Tracks budget context, price sensitivity, value anchors, payment preferences
-- =====================================================

-- Drop existing indexes if they exist (for clean migration)
DROP INDEX IF EXISTS idx_pricing_psychology_drafts_project_segment;
DROP INDEX IF EXISTS idx_pricing_psychology_drafts_project;
DROP INDEX IF EXISTS idx_pricing_psychology_drafts_segment;
DROP INDEX IF EXISTS idx_pricing_psychology_project_segment;
DROP INDEX IF EXISTS idx_pricing_psychology_project;
DROP INDEX IF EXISTS idx_pricing_psychology_segment;

-- Drop existing tables if they exist (for clean migration)
DROP TABLE IF EXISTS pricing_psychology_drafts CASCADE;
DROP TABLE IF EXISTS pricing_psychology CASCADE;

-- =====================================================
-- pricing_psychology_drafts table
-- =====================================================

CREATE TABLE pricing_psychology_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  segment_id UUID NOT NULL REFERENCES segments(id) ON DELETE CASCADE,

  -- Budget context and decision cycles
  -- {spending_category, budget_allocation, decision_cycle, who_controls_budget}
  budget_context JSONB,

  -- Price sensitivity and perception
  -- {price_sensitivity_level, current_spending_on_alternatives, spending_ceiling, spending_sweet_spot, free_trial_importance}
  price_perception JSONB NOT NULL,

  -- Value anchors for justification
  -- [{comparison_point, why_this_works}]
  value_anchors JSONB,

  -- Willingness to pay signals
  -- [{signal, indicates, how_to_respond}]
  willingness_to_pay_signals JSONB,

  -- Payment preferences and psychology
  -- {preferred_structure[], payment_methods[], billing_frequency, payment_friction_points[]}
  payment_psychology JSONB,

  -- ROI calculation methods
  -- {how_they_measure_value, payback_expectation, metrics_they_track[]}
  roi_calculation JSONB,

  -- Pricing objections and responses
  -- [{objection, underlying_concern, is_price_or_value, reframe_strategy}]
  pricing_objections JSONB,

  -- Discount sensitivity
  -- {responds_to_discounts, types_that_work[], types_that_backfire[], optimal_strategy}
  discount_sensitivity JSONB,

  -- Budget triggers and timing
  -- [{trigger_event, timing, how_to_leverage}]
  budget_triggers JSONB,

  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- pricing_psychology table (approved)
-- =====================================================

CREATE TABLE pricing_psychology (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  segment_id UUID NOT NULL REFERENCES segments(id) ON DELETE CASCADE,

  -- Budget context and decision cycles
  -- {spending_category, budget_allocation, decision_cycle, who_controls_budget}
  budget_context JSONB,

  -- Price sensitivity and perception
  -- {price_sensitivity_level, current_spending_on_alternatives, spending_ceiling, spending_sweet_spot, free_trial_importance}
  price_perception JSONB NOT NULL,

  -- Value anchors for justification
  -- [{comparison_point, why_this_works}]
  value_anchors JSONB,

  -- Willingness to pay signals
  -- [{signal, indicates, how_to_respond}]
  willingness_to_pay_signals JSONB,

  -- Payment preferences and psychology
  -- {preferred_structure[], payment_methods[], billing_frequency, payment_friction_points[]}
  payment_psychology JSONB,

  -- ROI calculation methods
  -- {how_they_measure_value, payback_expectation, metrics_they_track[]}
  roi_calculation JSONB,

  -- Pricing objections and responses
  -- [{objection, underlying_concern, is_price_or_value, reframe_strategy}]
  pricing_objections JSONB,

  -- Discount sensitivity
  -- {responds_to_discounts, types_that_work[], types_that_backfire[], optimal_strategy}
  discount_sensitivity JSONB,

  -- Budget triggers and timing
  -- [{trigger_event, timing, how_to_leverage}]
  budget_triggers JSONB,

  approved_at TIMESTAMPTZ DEFAULT now(),

  -- Ensure one approved record per project-segment pair
  CONSTRAINT unique_pricing_psychology_project_segment UNIQUE (project_id, segment_id)
);

-- =====================================================
-- Indexes for performance
-- =====================================================

-- Drafts indexes
CREATE INDEX idx_pricing_psychology_drafts_project ON pricing_psychology_drafts(project_id);
CREATE INDEX idx_pricing_psychology_drafts_segment ON pricing_psychology_drafts(segment_id);
CREATE INDEX idx_pricing_psychology_drafts_project_segment ON pricing_psychology_drafts(project_id, segment_id);

-- Approved indexes
CREATE INDEX idx_pricing_psychology_project ON pricing_psychology(project_id);
CREATE INDEX idx_pricing_psychology_segment ON pricing_psychology(segment_id);
CREATE INDEX idx_pricing_psychology_project_segment ON pricing_psychology(project_id, segment_id);

-- =====================================================
-- RLS Policies for pricing_psychology_drafts
-- =====================================================

ALTER TABLE pricing_psychology_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own pricing_psychology_drafts" ON pricing_psychology_drafts
  FOR SELECT USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own pricing_psychology_drafts" ON pricing_psychology_drafts
  FOR INSERT WITH CHECK (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own pricing_psychology_drafts" ON pricing_psychology_drafts
  FOR UPDATE USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete own pricing_psychology_drafts" ON pricing_psychology_drafts
  FOR DELETE USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

-- =====================================================
-- RLS Policies for pricing_psychology
-- =====================================================

ALTER TABLE pricing_psychology ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own pricing_psychology" ON pricing_psychology
  FOR SELECT USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own pricing_psychology" ON pricing_psychology
  FOR INSERT WITH CHECK (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own pricing_psychology" ON pricing_psychology
  FOR UPDATE USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete own pricing_psychology" ON pricing_psychology
  FOR DELETE USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

-- =====================================================
-- Service role policies (for API routes)
-- =====================================================

CREATE POLICY "Service role full access to pricing_psychology_drafts" ON pricing_psychology_drafts
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to pricing_psychology" ON pricing_psychology
  FOR ALL USING (auth.role() = 'service_role');
