-- =====================================================
-- Migration 020: JTBD Context Enhancement Module
-- Enhances Jobs-to-be-Done with situational triggers, competing solutions, success metrics, obstacles, and anxieties
-- =====================================================

-- Drop existing indexes if they exist (for clean migration)
DROP INDEX IF EXISTS idx_jtbd_context_drafts_project_segment;
DROP INDEX IF EXISTS idx_jtbd_context_drafts_project;
DROP INDEX IF EXISTS idx_jtbd_context_drafts_segment;
DROP INDEX IF EXISTS idx_jtbd_context_project_segment;
DROP INDEX IF EXISTS idx_jtbd_context_project;
DROP INDEX IF EXISTS idx_jtbd_context_segment;

-- Drop existing tables if they exist (for clean migration)
DROP TABLE IF EXISTS jtbd_context_drafts CASCADE;
DROP TABLE IF EXISTS jtbd_context CASCADE;

-- =====================================================
-- jtbd_context_drafts table
-- =====================================================

CREATE TABLE jtbd_context_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  segment_id UUID NOT NULL REFERENCES segments(id) ON DELETE CASCADE,

  -- WHEN: Situational triggers for job hiring
  -- [{job_reference_id, job_name, hire_triggers: [{situation, frequency, urgency, emotional_state}], competing_solutions: [{alternative, why_chosen, when_chosen, job_completion_rate, your_advantage}], success_metrics: {how_measured[], immediate_progress[], short_term_success, long_term_success, acceptable_tradeoffs[]}, obstacles: [{obstacle, blocks_progress, how_you_remove_it}], hiring_anxieties: [{anxiety, rooted_in, how_to_address}]}]
  job_contexts JSONB NOT NULL,

  -- Job priority ranking for this segment
  -- [{job_name, priority, reasoning}]
  job_priority_ranking JSONB,

  -- Job dependencies and relationships
  -- [{primary_job, enables_job, relationship}]
  job_dependencies JSONB,

  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- jtbd_context table (approved)
-- =====================================================

CREATE TABLE jtbd_context (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  segment_id UUID NOT NULL REFERENCES segments(id) ON DELETE CASCADE,

  -- WHEN: Situational triggers for job hiring
  -- [{job_reference_id, job_name, hire_triggers: [{situation, frequency, urgency, emotional_state}], competing_solutions: [{alternative, why_chosen, when_chosen, job_completion_rate, your_advantage}], success_metrics: {how_measured[], immediate_progress[], short_term_success, long_term_success, acceptable_tradeoffs[]}, obstacles: [{obstacle, blocks_progress, how_you_remove_it}], hiring_anxieties: [{anxiety, rooted_in, how_to_address}]}]
  job_contexts JSONB NOT NULL,

  -- Job priority ranking for this segment
  -- [{job_name, priority, reasoning}]
  job_priority_ranking JSONB,

  -- Job dependencies and relationships
  -- [{primary_job, enables_job, relationship}]
  job_dependencies JSONB,

  approved_at TIMESTAMPTZ DEFAULT now(),

  -- Ensure one approved record per project-segment pair
  CONSTRAINT unique_jtbd_context_project_segment UNIQUE (project_id, segment_id)
);

-- =====================================================
-- Indexes for performance
-- =====================================================

-- Drafts indexes
CREATE INDEX idx_jtbd_context_drafts_project ON jtbd_context_drafts(project_id);
CREATE INDEX idx_jtbd_context_drafts_segment ON jtbd_context_drafts(segment_id);
CREATE INDEX idx_jtbd_context_drafts_project_segment ON jtbd_context_drafts(project_id, segment_id);

-- Approved indexes
CREATE INDEX idx_jtbd_context_project ON jtbd_context(project_id);
CREATE INDEX idx_jtbd_context_segment ON jtbd_context(segment_id);
CREATE INDEX idx_jtbd_context_project_segment ON jtbd_context(project_id, segment_id);

-- =====================================================
-- RLS Policies for jtbd_context_drafts
-- =====================================================

ALTER TABLE jtbd_context_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own jtbd_context_drafts" ON jtbd_context_drafts
  FOR SELECT USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own jtbd_context_drafts" ON jtbd_context_drafts
  FOR INSERT WITH CHECK (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own jtbd_context_drafts" ON jtbd_context_drafts
  FOR UPDATE USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete own jtbd_context_drafts" ON jtbd_context_drafts
  FOR DELETE USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

-- =====================================================
-- RLS Policies for jtbd_context
-- =====================================================

ALTER TABLE jtbd_context ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own jtbd_context" ON jtbd_context
  FOR SELECT USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own jtbd_context" ON jtbd_context
  FOR INSERT WITH CHECK (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own jtbd_context" ON jtbd_context
  FOR UPDATE USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete own jtbd_context" ON jtbd_context
  FOR DELETE USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

-- =====================================================
-- Service role policies (for API routes)
-- =====================================================

CREATE POLICY "Service role full access to jtbd_context_drafts" ON jtbd_context_drafts
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to jtbd_context" ON jtbd_context
  FOR ALL USING (auth.role() = 'service_role');
