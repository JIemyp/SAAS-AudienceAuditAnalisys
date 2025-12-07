-- =====================================================
-- Migration 012: Canvas Extended V2
-- Complete refactor from text fields to structured JSONB
-- =====================================================

-- Drop existing indexes if they exist (from failed migrations)
DROP INDEX IF EXISTS idx_canvas_extended_drafts_project;
DROP INDEX IF EXISTS idx_canvas_extended_drafts_pain;
DROP INDEX IF EXISTS idx_canvas_extended_drafts_segment;
DROP INDEX IF EXISTS idx_canvas_extended_drafts_project_pain;
DROP INDEX IF EXISTS idx_canvas_extended_project;
DROP INDEX IF EXISTS idx_canvas_extended_pain;
DROP INDEX IF EXISTS idx_canvas_extended_segment;
DROP INDEX IF EXISTS idx_canvas_extended_project_pain;

-- Drop existing V2 tables if they exist (from failed migrations)
DROP TABLE IF EXISTS canvas_extended_drafts CASCADE;
DROP TABLE IF EXISTS canvas_extended CASCADE;

-- =====================================================
-- New canvas_extended_drafts table (V2)
-- =====================================================

CREATE TABLE canvas_extended_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  pain_id UUID NOT NULL,           -- Link to pains_initial (NOT canvas_id!)
  segment_id UUID NOT NULL REFERENCES segments(id) ON DELETE CASCADE,

  -- 5 main JSONB sections
  customer_journey JSONB NOT NULL,
  emotional_map JSONB NOT NULL,
  narrative_angles JSONB NOT NULL,
  messaging_framework JSONB NOT NULL,
  voice_and_tone JSONB NOT NULL,

  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- New canvas_extended table (approved, V2)
-- =====================================================

CREATE TABLE canvas_extended (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  pain_id UUID NOT NULL,
  segment_id UUID NOT NULL REFERENCES segments(id) ON DELETE CASCADE,

  -- 5 main JSONB sections
  customer_journey JSONB NOT NULL,
  emotional_map JSONB NOT NULL,
  narrative_angles JSONB NOT NULL,
  messaging_framework JSONB NOT NULL,
  voice_and_tone JSONB NOT NULL,

  approved_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- Indexes
-- =====================================================

CREATE INDEX idx_canvas_extended_drafts_project ON canvas_extended_drafts(project_id);
CREATE INDEX idx_canvas_extended_drafts_pain ON canvas_extended_drafts(pain_id);
CREATE INDEX idx_canvas_extended_drafts_segment ON canvas_extended_drafts(segment_id);
CREATE INDEX idx_canvas_extended_drafts_project_pain ON canvas_extended_drafts(project_id, pain_id);

CREATE INDEX idx_canvas_extended_project ON canvas_extended(project_id);
CREATE INDEX idx_canvas_extended_pain ON canvas_extended(pain_id);
CREATE INDEX idx_canvas_extended_segment ON canvas_extended(segment_id);
CREATE INDEX idx_canvas_extended_project_pain ON canvas_extended(project_id, pain_id);

-- =====================================================
-- RLS Policies for canvas_extended_drafts
-- =====================================================

ALTER TABLE canvas_extended_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own canvas_extended_drafts" ON canvas_extended_drafts
  FOR SELECT USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own canvas_extended_drafts" ON canvas_extended_drafts
  FOR INSERT WITH CHECK (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own canvas_extended_drafts" ON canvas_extended_drafts
  FOR UPDATE USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete own canvas_extended_drafts" ON canvas_extended_drafts
  FOR DELETE USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

-- =====================================================
-- RLS Policies for canvas_extended
-- =====================================================

ALTER TABLE canvas_extended ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own canvas_extended" ON canvas_extended
  FOR SELECT USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own canvas_extended" ON canvas_extended
  FOR INSERT WITH CHECK (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own canvas_extended" ON canvas_extended
  FOR UPDATE USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete own canvas_extended" ON canvas_extended
  FOR DELETE USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

-- =====================================================
-- Service role policies (for API routes)
-- =====================================================

CREATE POLICY "Service role full access to canvas_extended_drafts" ON canvas_extended_drafts
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to canvas_extended" ON canvas_extended
  FOR ALL USING (auth.role() = 'service_role');
