-- =====================================================
-- Audience Research Tool v4 - RLS Policies
-- Run this in Supabase SQL Editor AFTER 003_v4_schema.sql
-- Reference: audience-research-tool-v4-complete.md
-- =====================================================

-- ================================================
-- ENABLE RLS ON ALL NEW TABLES
-- ================================================

-- Block 1: Portrait
ALTER TABLE validation_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE validation ENABLE ROW LEVEL SECURITY;
ALTER TABLE portrait_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE portrait ENABLE ROW LEVEL SECURITY;
ALTER TABLE portrait_review_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE portrait_review ENABLE ROW LEVEL SECURITY;
ALTER TABLE portrait_final_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE portrait_final ENABLE ROW LEVEL SECURITY;

-- Block 2: Deep Analysis
ALTER TABLE jobs_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE preferences_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE difficulties_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE difficulties ENABLE ROW LEVEL SECURITY;
ALTER TABLE triggers_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE triggers ENABLE ROW LEVEL SECURITY;

-- Block 3: Segmentation
ALTER TABLE segments_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE segments_initial ENABLE ROW LEVEL SECURITY;
ALTER TABLE segments_review_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE segments_review ENABLE ROW LEVEL SECURITY;
ALTER TABLE segment_details_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE segment_details ENABLE ROW LEVEL SECURITY;

-- Block 4: Pains
ALTER TABLE pains_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE pains_initial ENABLE ROW LEVEL SECURITY;
ALTER TABLE pains_ranking_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE pains_ranking ENABLE ROW LEVEL SECURITY;
ALTER TABLE canvas_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE canvas ENABLE ROW LEVEL SECURITY;
ALTER TABLE canvas_extended_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE canvas_extended ENABLE ROW LEVEL SECURITY;

-- Final Report
ALTER TABLE audience ENABLE ROW LEVEL SECURITY;

-- ================================================
-- CREATE RLS POLICIES
-- Pattern: project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
-- ================================================

-- Block 1: Portrait
CREATE POLICY "Users own validation_drafts" ON validation_drafts
  FOR ALL USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "Users own validation" ON validation
  FOR ALL USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "Users own portrait_drafts" ON portrait_drafts
  FOR ALL USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "Users own portrait" ON portrait
  FOR ALL USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "Users own portrait_review_drafts" ON portrait_review_drafts
  FOR ALL USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "Users own portrait_review" ON portrait_review
  FOR ALL USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "Users own portrait_final_drafts" ON portrait_final_drafts
  FOR ALL USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "Users own portrait_final" ON portrait_final
  FOR ALL USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

-- Block 2: Deep Analysis
CREATE POLICY "Users own jobs_drafts" ON jobs_drafts
  FOR ALL USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "Users own jobs" ON jobs
  FOR ALL USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "Users own preferences_drafts" ON preferences_drafts
  FOR ALL USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "Users own preferences" ON preferences
  FOR ALL USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "Users own difficulties_drafts" ON difficulties_drafts
  FOR ALL USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "Users own difficulties" ON difficulties
  FOR ALL USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "Users own triggers_drafts" ON triggers_drafts
  FOR ALL USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "Users own triggers" ON triggers
  FOR ALL USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

-- Block 3: Segmentation
CREATE POLICY "Users own segments_drafts" ON segments_drafts
  FOR ALL USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "Users own segments_initial" ON segments_initial
  FOR ALL USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "Users own segments_review_drafts" ON segments_review_drafts
  FOR ALL USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "Users own segments_review" ON segments_review
  FOR ALL USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "Users own segment_details_drafts" ON segment_details_drafts
  FOR ALL USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "Users own segment_details" ON segment_details
  FOR ALL USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

-- Block 4: Pains
CREATE POLICY "Users own pains_drafts" ON pains_drafts
  FOR ALL USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "Users own pains_initial" ON pains_initial
  FOR ALL USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "Users own pains_ranking_drafts" ON pains_ranking_drafts
  FOR ALL USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "Users own pains_ranking" ON pains_ranking
  FOR ALL USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "Users own canvas_drafts" ON canvas_drafts
  FOR ALL USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "Users own canvas" ON canvas
  FOR ALL USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "Users own canvas_extended_drafts" ON canvas_extended_drafts
  FOR ALL USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "Users own canvas_extended" ON canvas_extended
  FOR ALL USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

-- Final Report
CREATE POLICY "Users own audience" ON audience
  FOR ALL USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

-- ================================================
-- INDEXES FOR PERFORMANCE
-- ================================================

-- Block 1
CREATE INDEX IF NOT EXISTS idx_validation_drafts_project_id ON validation_drafts(project_id);
CREATE INDEX IF NOT EXISTS idx_validation_project_id ON validation(project_id);
CREATE INDEX IF NOT EXISTS idx_portrait_drafts_project_id ON portrait_drafts(project_id);
CREATE INDEX IF NOT EXISTS idx_portrait_project_id ON portrait(project_id);
CREATE INDEX IF NOT EXISTS idx_portrait_review_drafts_project_id ON portrait_review_drafts(project_id);
CREATE INDEX IF NOT EXISTS idx_portrait_review_project_id ON portrait_review(project_id);
CREATE INDEX IF NOT EXISTS idx_portrait_final_drafts_project_id ON portrait_final_drafts(project_id);
CREATE INDEX IF NOT EXISTS idx_portrait_final_project_id ON portrait_final(project_id);

-- Block 2
CREATE INDEX IF NOT EXISTS idx_jobs_drafts_project_id ON jobs_drafts(project_id);
CREATE INDEX IF NOT EXISTS idx_jobs_project_id ON jobs(project_id);
CREATE INDEX IF NOT EXISTS idx_preferences_drafts_project_id ON preferences_drafts(project_id);
CREATE INDEX IF NOT EXISTS idx_preferences_project_id ON preferences(project_id);
CREATE INDEX IF NOT EXISTS idx_difficulties_drafts_project_id ON difficulties_drafts(project_id);
CREATE INDEX IF NOT EXISTS idx_difficulties_project_id ON difficulties(project_id);
CREATE INDEX IF NOT EXISTS idx_triggers_drafts_project_id ON triggers_drafts(project_id);
CREATE INDEX IF NOT EXISTS idx_triggers_project_id ON triggers(project_id);

-- Block 3
CREATE INDEX IF NOT EXISTS idx_segments_drafts_project_id ON segments_drafts(project_id);
CREATE INDEX IF NOT EXISTS idx_segments_initial_project_id ON segments_initial(project_id);
CREATE INDEX IF NOT EXISTS idx_segments_review_drafts_project_id ON segments_review_drafts(project_id);
CREATE INDEX IF NOT EXISTS idx_segments_review_project_id ON segments_review(project_id);
CREATE INDEX IF NOT EXISTS idx_segment_details_drafts_project_id ON segment_details_drafts(project_id);
CREATE INDEX IF NOT EXISTS idx_segment_details_project_id ON segment_details(project_id);
CREATE INDEX IF NOT EXISTS idx_segment_details_segment_id ON segment_details(segment_id);

-- Block 4
CREATE INDEX IF NOT EXISTS idx_pains_drafts_project_id ON pains_drafts(project_id);
CREATE INDEX IF NOT EXISTS idx_pains_drafts_segment_id ON pains_drafts(segment_id);
CREATE INDEX IF NOT EXISTS idx_pains_initial_project_id ON pains_initial(project_id);
CREATE INDEX IF NOT EXISTS idx_pains_initial_segment_id ON pains_initial(segment_id);
CREATE INDEX IF NOT EXISTS idx_pains_ranking_drafts_project_id ON pains_ranking_drafts(project_id);
CREATE INDEX IF NOT EXISTS idx_pains_ranking_project_id ON pains_ranking(project_id);
CREATE INDEX IF NOT EXISTS idx_canvas_drafts_project_id ON canvas_drafts(project_id);
CREATE INDEX IF NOT EXISTS idx_canvas_project_id ON canvas(project_id);
CREATE INDEX IF NOT EXISTS idx_canvas_extended_drafts_project_id ON canvas_extended_drafts(project_id);
CREATE INDEX IF NOT EXISTS idx_canvas_extended_project_id ON canvas_extended(project_id);

-- Final Report
CREATE INDEX IF NOT EXISTS idx_audience_project_id ON audience(project_id);
