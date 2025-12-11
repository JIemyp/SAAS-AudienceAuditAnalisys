-- =====================================================
-- Migration 019: Trust Framework Module
-- Tracks baseline trust levels, proof hierarchy, authorities, social proof, trust killers
-- =====================================================

-- Drop existing indexes if they exist (for clean migration)
DROP INDEX IF EXISTS idx_trust_framework_drafts_project_segment;
DROP INDEX IF EXISTS idx_trust_framework_drafts_project;
DROP INDEX IF EXISTS idx_trust_framework_drafts_segment;
DROP INDEX IF EXISTS idx_trust_framework_project_segment;
DROP INDEX IF EXISTS idx_trust_framework_project;
DROP INDEX IF EXISTS idx_trust_framework_segment;

-- Drop existing tables if they exist (for clean migration)
DROP TABLE IF EXISTS trust_framework_drafts CASCADE;
DROP TABLE IF EXISTS trust_framework CASCADE;

-- =====================================================
-- trust_framework_drafts table
-- =====================================================

CREATE TABLE trust_framework_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  segment_id UUID NOT NULL REFERENCES segments(id) ON DELETE CASCADE,

  -- Baseline trust levels and skepticism
  -- {trust_in_category, trust_in_brand, reasons_for_skepticism[], past_betrayals[]}
  baseline_trust JSONB,

  -- Ranked proof types by effectiveness
  -- [{proof_type, effectiveness, why_it_works, how_to_present, examples[]}]
  proof_hierarchy JSONB NOT NULL,

  -- Specific trusted authorities
  -- [{authority_type, specific_names[], why_trusted, how_to_leverage}]
  trusted_authorities JSONB,

  -- Social proof requirements
  -- {testimonial_profile, before_after_importance, numbers_that_matter[], case_study_angle}
  social_proof JSONB,

  -- Transparency requirements
  -- {information_needed[], disclosure_expectations[], transparency_level}
  transparency_needs JSONB,

  -- Red flags and trust killers
  -- [{red_flag, why_triggers_skepticism, how_to_avoid}]
  trust_killers JSONB,

  -- Credibility markers and signals
  -- [{signal, importance, current_status}]
  credibility_markers JSONB,

  -- Risk reduction and guarantees
  -- {biggest_risks[], reversal_mechanisms[{mechanism, effectiveness, implementation}]}
  risk_reduction JSONB,

  -- Trust-building journey stages
  -- {first_touchpoint_goal, mid_journey_reassurance[], pre_purchase_push, post_purchase_confirmation}
  trust_journey JSONB,

  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- trust_framework table (approved)
-- =====================================================

CREATE TABLE trust_framework (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  segment_id UUID NOT NULL REFERENCES segments(id) ON DELETE CASCADE,

  -- Baseline trust levels and skepticism
  -- {trust_in_category, trust_in_brand, reasons_for_skepticism[], past_betrayals[]}
  baseline_trust JSONB,

  -- Ranked proof types by effectiveness
  -- [{proof_type, effectiveness, why_it_works, how_to_present, examples[]}]
  proof_hierarchy JSONB NOT NULL,

  -- Specific trusted authorities
  -- [{authority_type, specific_names[], why_trusted, how_to_leverage}]
  trusted_authorities JSONB,

  -- Social proof requirements
  -- {testimonial_profile, before_after_importance, numbers_that_matter[], case_study_angle}
  social_proof JSONB,

  -- Transparency requirements
  -- {information_needed[], disclosure_expectations[], transparency_level}
  transparency_needs JSONB,

  -- Red flags and trust killers
  -- [{red_flag, why_triggers_skepticism, how_to_avoid}]
  trust_killers JSONB,

  -- Credibility markers and signals
  -- [{signal, importance, current_status}]
  credibility_markers JSONB,

  -- Risk reduction and guarantees
  -- {biggest_risks[], reversal_mechanisms[{mechanism, effectiveness, implementation}]}
  risk_reduction JSONB,

  -- Trust-building journey stages
  -- {first_touchpoint_goal, mid_journey_reassurance[], pre_purchase_push, post_purchase_confirmation}
  trust_journey JSONB,

  approved_at TIMESTAMPTZ DEFAULT now(),

  -- Ensure one approved record per project-segment pair
  CONSTRAINT unique_trust_framework_project_segment UNIQUE (project_id, segment_id)
);

-- =====================================================
-- Indexes for performance
-- =====================================================

-- Drafts indexes
CREATE INDEX idx_trust_framework_drafts_project ON trust_framework_drafts(project_id);
CREATE INDEX idx_trust_framework_drafts_segment ON trust_framework_drafts(segment_id);
CREATE INDEX idx_trust_framework_drafts_project_segment ON trust_framework_drafts(project_id, segment_id);

-- Approved indexes
CREATE INDEX idx_trust_framework_project ON trust_framework(project_id);
CREATE INDEX idx_trust_framework_segment ON trust_framework(segment_id);
CREATE INDEX idx_trust_framework_project_segment ON trust_framework(project_id, segment_id);

-- =====================================================
-- RLS Policies for trust_framework_drafts
-- =====================================================

ALTER TABLE trust_framework_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own trust_framework_drafts" ON trust_framework_drafts
  FOR SELECT USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own trust_framework_drafts" ON trust_framework_drafts
  FOR INSERT WITH CHECK (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own trust_framework_drafts" ON trust_framework_drafts
  FOR UPDATE USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete own trust_framework_drafts" ON trust_framework_drafts
  FOR DELETE USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

-- =====================================================
-- RLS Policies for trust_framework
-- =====================================================

ALTER TABLE trust_framework ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own trust_framework" ON trust_framework
  FOR SELECT USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own trust_framework" ON trust_framework
  FOR INSERT WITH CHECK (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own trust_framework" ON trust_framework
  FOR UPDATE USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete own trust_framework" ON trust_framework
  FOR DELETE USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

-- =====================================================
-- Service role policies (for API routes)
-- =====================================================

CREATE POLICY "Service role full access to trust_framework_drafts" ON trust_framework_drafts
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to trust_framework" ON trust_framework
  FOR ALL USING (auth.role() = 'service_role');
