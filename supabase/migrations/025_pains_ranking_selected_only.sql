-- =====================================================
-- Migration 025: Pains Ranking Selection Support
-- =====================================================
-- Adds segment_id to pains_ranking_drafts so each draft knows its segment.
-- Backfills existing rows and adds supporting indexes.
-- Part of Block C (Canvas only for selected pains).
-- =====================================================

-- 1) Add segment_id column to drafts (if missing)
ALTER TABLE pains_ranking_drafts
  ADD COLUMN IF NOT EXISTS segment_id UUID REFERENCES segments(id) ON DELETE CASCADE;

COMMENT ON COLUMN pains_ranking_drafts.segment_id IS 'Segment reference for this ranking draft (used for canvas selection)';

-- 2) Backfill segment_id for existing drafts using pains_initial
UPDATE pains_ranking_drafts d
SET segment_id = p.segment_id
FROM pains_initial p
WHERE d.segment_id IS NULL
  AND d.pain_id = p.id;

-- 3) Index for faster lookups by segment
CREATE INDEX IF NOT EXISTS idx_pains_ranking_drafts_segment
  ON pains_ranking_drafts(project_id, segment_id);

-- 4) Safety comment
COMMENT ON INDEX idx_pains_ranking_drafts_segment IS 'Helps approve-utils locate ranking drafts per segment';
