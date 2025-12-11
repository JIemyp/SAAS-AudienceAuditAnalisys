-- =====================================================
-- Migration 017: Competitive Intelligence Module
-- Tracks alternatives tried, workarounds, competitor comparison, switching barriers
-- =====================================================

-- Drop existing indexes if they exist (for clean migration)
DROP INDEX IF EXISTS idx_competitive_intelligence_drafts_project_segment;
DROP INDEX IF EXISTS idx_competitive_intelligence_drafts_project;
DROP INDEX IF EXISTS idx_competitive_intelligence_drafts_segment;
DROP INDEX IF EXISTS idx_competitive_intelligence_project_segment;
DROP INDEX IF EXISTS idx_competitive_intelligence_project;
DROP INDEX IF EXISTS idx_competitive_intelligence_segment;

-- Drop existing tables if they exist (for clean migration)
DROP TABLE IF EXISTS competitive_intelligence_drafts CASCADE;
DROP TABLE IF EXISTS competitive_intelligence CASCADE;

-- =====================================================
-- competitive_intelligence_drafts table
-- =====================================================

CREATE TABLE competitive_intelligence_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  segment_id UUID NOT NULL REFERENCES segments(id) ON DELETE CASCADE,

  -- What alternatives the segment has TRIED before and why they failed
  -- [{solution_type, specific_examples[], adoption_rate, why_they_tried_it, initial_expectations, actual_experience, why_it_failed, emotional_residue}]
  alternatives_tried JSONB NOT NULL,

  -- Current workarounds they use
  -- [{workaround, effectiveness, effort_required, cost, why_they_stick_with_it}]
  current_workarounds JSONB,

  -- Comparison vs specific competitors
  -- [{competitor_name, segment_perception, competitor_strengths[], competitor_weaknesses[], switching_triggers[]}]
  vs_competitors JSONB,

  -- Switching barriers
  -- [{barrier_type, description, severity, how_to_overcome}]
  switching_barriers JSONB,

  -- Evaluation process
  -- {criteria_for_comparison[], dealbreakers[], nice_to_haves[], how_they_compare, decision_authority}
  evaluation_process JSONB,

  -- Category beliefs and misconceptions
  -- {what_they_believe[], misconceptions_to_address[{misconception, root_cause, how_to_reframe}]}
  category_beliefs JSONB,

  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- competitive_intelligence table (approved)
-- =====================================================

CREATE TABLE competitive_intelligence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  segment_id UUID NOT NULL REFERENCES segments(id) ON DELETE CASCADE,

  -- What alternatives the segment has TRIED before and why they failed
  -- [{solution_type, specific_examples[], adoption_rate, why_they_tried_it, initial_expectations, actual_experience, why_it_failed, emotional_residue}]
  alternatives_tried JSONB NOT NULL,

  -- Current workarounds they use
  -- [{workaround, effectiveness, effort_required, cost, why_they_stick_with_it}]
  current_workarounds JSONB,

  -- Comparison vs specific competitors
  -- [{competitor_name, segment_perception, competitor_strengths[], competitor_weaknesses[], switching_triggers[]}]
  vs_competitors JSONB,

  -- Switching barriers
  -- [{barrier_type, description, severity, how_to_overcome}]
  switching_barriers JSONB,

  -- Evaluation process
  -- {criteria_for_comparison[], dealbreakers[], nice_to_haves[], how_they_compare, decision_authority}
  evaluation_process JSONB,

  -- Category beliefs and misconceptions
  -- {what_they_believe[], misconceptions_to_address[{misconception, root_cause, how_to_reframe}]}
  category_beliefs JSONB,

  approved_at TIMESTAMPTZ DEFAULT now(),

  -- Ensure one approved record per project-segment pair
  CONSTRAINT unique_competitive_intelligence_project_segment UNIQUE (project_id, segment_id)
);

-- =====================================================
-- Indexes for performance
-- =====================================================

-- Drafts indexes
CREATE INDEX idx_competitive_intelligence_drafts_project ON competitive_intelligence_drafts(project_id);
CREATE INDEX idx_competitive_intelligence_drafts_segment ON competitive_intelligence_drafts(segment_id);
CREATE INDEX idx_competitive_intelligence_drafts_project_segment ON competitive_intelligence_drafts(project_id, segment_id);

-- Approved indexes
CREATE INDEX idx_competitive_intelligence_project ON competitive_intelligence(project_id);
CREATE INDEX idx_competitive_intelligence_segment ON competitive_intelligence(segment_id);
CREATE INDEX idx_competitive_intelligence_project_segment ON competitive_intelligence(project_id, segment_id);

-- =====================================================
-- RLS Policies for competitive_intelligence_drafts
-- =====================================================

ALTER TABLE competitive_intelligence_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own competitive_intelligence_drafts" ON competitive_intelligence_drafts
  FOR SELECT USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own competitive_intelligence_drafts" ON competitive_intelligence_drafts
  FOR INSERT WITH CHECK (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own competitive_intelligence_drafts" ON competitive_intelligence_drafts
  FOR UPDATE USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete own competitive_intelligence_drafts" ON competitive_intelligence_drafts
  FOR DELETE USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

-- =====================================================
-- RLS Policies for competitive_intelligence
-- =====================================================

ALTER TABLE competitive_intelligence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own competitive_intelligence" ON competitive_intelligence
  FOR SELECT USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own competitive_intelligence" ON competitive_intelligence
  FOR INSERT WITH CHECK (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own competitive_intelligence" ON competitive_intelligence
  FOR UPDATE USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete own competitive_intelligence" ON competitive_intelligence
  FOR DELETE USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

-- =====================================================
-- Service role policies (for API routes)
-- =====================================================

CREATE POLICY "Service role full access to competitive_intelligence_drafts" ON competitive_intelligence_drafts
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to competitive_intelligence" ON competitive_intelligence
  FOR ALL USING (auth.role() = 'service_role');
