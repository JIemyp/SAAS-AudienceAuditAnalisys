-- =====================================================
-- Migration 007: Bind Deep Analysis to Segments
-- Add segment_id to jobs, preferences, difficulties, triggers, canvas tables
-- =====================================================

-- ================================================
-- STEP 1: Add segment_id to JOBS tables
-- ================================================

ALTER TABLE jobs_drafts
  ADD COLUMN IF NOT EXISTS segment_id UUID REFERENCES segments(id) ON DELETE CASCADE;

ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS segment_id UUID REFERENCES segments(id) ON DELETE CASCADE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_jobs_drafts_segment ON jobs_drafts(segment_id);
CREATE INDEX IF NOT EXISTS idx_jobs_segment ON jobs(segment_id);
CREATE INDEX IF NOT EXISTS idx_jobs_drafts_project_segment ON jobs_drafts(project_id, segment_id);
CREATE INDEX IF NOT EXISTS idx_jobs_project_segment ON jobs(project_id, segment_id);

-- ================================================
-- STEP 2: Add segment_id to PREFERENCES tables
-- ================================================

ALTER TABLE preferences_drafts
  ADD COLUMN IF NOT EXISTS segment_id UUID REFERENCES segments(id) ON DELETE CASCADE;

ALTER TABLE preferences
  ADD COLUMN IF NOT EXISTS segment_id UUID REFERENCES segments(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_preferences_drafts_segment ON preferences_drafts(segment_id);
CREATE INDEX IF NOT EXISTS idx_preferences_segment ON preferences(segment_id);
CREATE INDEX IF NOT EXISTS idx_preferences_drafts_project_segment ON preferences_drafts(project_id, segment_id);
CREATE INDEX IF NOT EXISTS idx_preferences_project_segment ON preferences(project_id, segment_id);

-- ================================================
-- STEP 3: Add segment_id to DIFFICULTIES tables
-- ================================================

ALTER TABLE difficulties_drafts
  ADD COLUMN IF NOT EXISTS segment_id UUID REFERENCES segments(id) ON DELETE CASCADE;

ALTER TABLE difficulties
  ADD COLUMN IF NOT EXISTS segment_id UUID REFERENCES segments(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_difficulties_drafts_segment ON difficulties_drafts(segment_id);
CREATE INDEX IF NOT EXISTS idx_difficulties_segment ON difficulties(segment_id);
CREATE INDEX IF NOT EXISTS idx_difficulties_drafts_project_segment ON difficulties_drafts(project_id, segment_id);
CREATE INDEX IF NOT EXISTS idx_difficulties_project_segment ON difficulties(project_id, segment_id);

-- ================================================
-- STEP 4: Add segment_id to TRIGGERS tables
-- ================================================

ALTER TABLE triggers_drafts
  ADD COLUMN IF NOT EXISTS segment_id UUID REFERENCES segments(id) ON DELETE CASCADE;

ALTER TABLE triggers
  ADD COLUMN IF NOT EXISTS segment_id UUID REFERENCES segments(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_triggers_drafts_segment ON triggers_drafts(segment_id);
CREATE INDEX IF NOT EXISTS idx_triggers_segment ON triggers(segment_id);
CREATE INDEX IF NOT EXISTS idx_triggers_drafts_project_segment ON triggers_drafts(project_id, segment_id);
CREATE INDEX IF NOT EXISTS idx_triggers_project_segment ON triggers(project_id, segment_id);

-- ================================================
-- STEP 5: Add segment_id to CANVAS tables
-- ================================================

ALTER TABLE canvas_drafts
  ADD COLUMN IF NOT EXISTS segment_id UUID REFERENCES segments(id) ON DELETE CASCADE;

ALTER TABLE canvas
  ADD COLUMN IF NOT EXISTS segment_id UUID REFERENCES segments(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_canvas_drafts_segment ON canvas_drafts(segment_id);
CREATE INDEX IF NOT EXISTS idx_canvas_segment ON canvas(segment_id);
CREATE INDEX IF NOT EXISTS idx_canvas_drafts_project_segment ON canvas_drafts(project_id, segment_id);
CREATE INDEX IF NOT EXISTS idx_canvas_project_segment ON canvas(project_id, segment_id);

-- ================================================
-- STEP 6: Add segment_id to CANVAS_EXTENDED tables
-- ================================================

ALTER TABLE canvas_extended_drafts
  ADD COLUMN IF NOT EXISTS segment_id UUID REFERENCES segments(id) ON DELETE CASCADE;

ALTER TABLE canvas_extended
  ADD COLUMN IF NOT EXISTS segment_id UUID REFERENCES segments(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_canvas_extended_drafts_segment ON canvas_extended_drafts(segment_id);
CREATE INDEX IF NOT EXISTS idx_canvas_extended_segment ON canvas_extended(segment_id);
CREATE INDEX IF NOT EXISTS idx_canvas_extended_drafts_project_segment ON canvas_extended_drafts(project_id, segment_id);
CREATE INDEX IF NOT EXISTS idx_canvas_extended_project_segment ON canvas_extended(project_id, segment_id);

-- ================================================
-- STEP 7: Add segment_id to PAINS_RANKING tables (if not exists)
-- ================================================

ALTER TABLE pains_ranking_drafts
  ADD COLUMN IF NOT EXISTS segment_id UUID REFERENCES segments(id) ON DELETE CASCADE;

ALTER TABLE pains_ranking
  ADD COLUMN IF NOT EXISTS segment_id UUID REFERENCES segments(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_pains_ranking_drafts_segment ON pains_ranking_drafts(segment_id);
CREATE INDEX IF NOT EXISTS idx_pains_ranking_segment ON pains_ranking(segment_id);
CREATE INDEX IF NOT EXISTS idx_pains_ranking_drafts_project_segment ON pains_ranking_drafts(project_id, segment_id);
CREATE INDEX IF NOT EXISTS idx_pains_ranking_project_segment ON pains_ranking(project_id, segment_id);

-- ================================================
-- STEP 8: Add indexes to existing pains tables
-- ================================================

CREATE INDEX IF NOT EXISTS idx_pains_drafts_segment ON pains_drafts(segment_id);
CREATE INDEX IF NOT EXISTS idx_pains_initial_segment ON pains_initial(segment_id);
CREATE INDEX IF NOT EXISTS idx_pains_drafts_project_segment ON pains_drafts(project_id, segment_id);
CREATE INDEX IF NOT EXISTS idx_pains_initial_project_segment ON pains_initial(project_id, segment_id);
