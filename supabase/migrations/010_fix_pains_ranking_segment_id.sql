-- ================================================
-- Migration 010: Fix pains_ranking_drafts and pains_ranking tables
-- Add missing segment_id column if not exists
-- ================================================

-- Add segment_id to pains_ranking_drafts
ALTER TABLE pains_ranking_drafts
  ADD COLUMN IF NOT EXISTS segment_id UUID REFERENCES segments(id) ON DELETE CASCADE;

-- Add segment_id to pains_ranking
ALTER TABLE pains_ranking
  ADD COLUMN IF NOT EXISTS segment_id UUID REFERENCES segments(id) ON DELETE CASCADE;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_pains_ranking_drafts_segment ON pains_ranking_drafts(segment_id);
CREATE INDEX IF NOT EXISTS idx_pains_ranking_segment ON pains_ranking(segment_id);
CREATE INDEX IF NOT EXISTS idx_pains_ranking_drafts_project_segment ON pains_ranking_drafts(project_id, segment_id);
CREATE INDEX IF NOT EXISTS idx_pains_ranking_project_segment ON pains_ranking(project_id, segment_id);
