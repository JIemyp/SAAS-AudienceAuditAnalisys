-- =====================================================
-- Migration 024: Fix Missing UNIQUE Constraints
-- =====================================================
-- Adds missing constraints for canvas_extended and pains_ranking
-- Part of Block A fix from FULL_SYSTEM_AUDIT.md
-- Reference: .codex/migration_023_audit.md
-- =====================================================

-- =====================================================
-- PART 1: canvas_extended - Add per-pain UNIQUE constraint
-- =====================================================

-- Clean duplicates first (keep most recent)
DELETE FROM canvas_extended
WHERE id NOT IN (
  SELECT DISTINCT ON (project_id, segment_id, pain_id) id
  FROM canvas_extended
  ORDER BY project_id, segment_id, pain_id, approved_at DESC, id DESC
);

-- Add UNIQUE constraint (project_id, segment_id, pain_id)
DO $$ BEGIN
  ALTER TABLE canvas_extended
    ADD CONSTRAINT uq_canvas_extended_project_segment_pain
    UNIQUE (project_id, segment_id, pain_id);
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

COMMENT ON CONSTRAINT uq_canvas_extended_project_segment_pain ON canvas_extended
  IS 'One canvas_extended record per pain - UNIQUE (project_id, segment_id, pain_id)';

-- =====================================================
-- PART 2: pains_ranking - Add per-pain UNIQUE constraint
-- =====================================================
-- Decision: pains_ranking is ONE ranking per PAIN (not per segment)
-- Table structure: (project_id, segment_id, pain_id)
-- Scope: "pain" - matches canvas, canvas_extended

-- Clean duplicates first (keep most recent)
DELETE FROM pains_ranking
WHERE id NOT IN (
  SELECT DISTINCT ON (project_id, segment_id, pain_id) id
  FROM pains_ranking
  ORDER BY project_id, segment_id, pain_id, approved_at DESC, id DESC
);

-- Add UNIQUE constraint (project_id, segment_id, pain_id)
DO $$ BEGIN
  ALTER TABLE pains_ranking
    ADD CONSTRAINT uq_pains_ranking_project_segment_pain
    UNIQUE (project_id, segment_id, pain_id);
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

COMMENT ON CONSTRAINT uq_pains_ranking_project_segment_pain ON pains_ranking
  IS 'One ranking record per pain - UNIQUE (project_id, segment_id, pain_id)';

-- =====================================================
-- PART 3: Update pains_ranking_drafts for consistency
-- =====================================================

-- Clean duplicates in drafts table
DELETE FROM pains_ranking_drafts
WHERE id NOT IN (
  SELECT DISTINCT ON (project_id, segment_id, pain_id) id
  FROM pains_ranking_drafts
  ORDER BY project_id, segment_id, pain_id, created_at DESC, id DESC
);

-- Note: We DON'T add UNIQUE to drafts table (allow multiple draft versions)
-- Only approved table has UNIQUE constraint

-- =====================================================
-- PART 4: Add missing indexes for pains_ranking
-- =====================================================

-- Add composite index for per-pain queries
CREATE INDEX IF NOT EXISTS idx_pains_ranking_project_segment_pain
  ON pains_ranking(project_id, segment_id, pain_id);

CREATE INDEX IF NOT EXISTS idx_pains_ranking_drafts_project_segment_pain
  ON pains_ranking_drafts(project_id, segment_id, pain_id);

-- =====================================================
-- PART 5: Verification Comments
-- =====================================================

COMMENT ON TABLE canvas_extended IS 'Canvas extended analysis - one record per pain. Uses approveWithUpsert with scope="pain"';
COMMENT ON TABLE pains_ranking IS 'Pain ranking data - one ranking per pain. Uses approveWithUpsert with scope="pain"';

-- =====================================================
-- Summary of UNIQUE constraints after this migration:
-- =====================================================
-- Per-project (project_id):
--   - portrait_final: uq_portrait_final_project
--
-- Per-segment (project_id, segment_id):
--   - jobs: uq_jobs_project_segment
--   - preferences: uq_preferences_project_segment
--   - difficulties: uq_difficulties_project_segment
--   - triggers: uq_triggers_project_segment
--   - channel_strategy: uq_channel_strategy_project_segment
--   - competitive_intelligence: uq_competitive_intelligence_project_segment
--   - pricing_psychology: uq_pricing_psychology_project_segment
--   - trust_framework: uq_trust_framework_project_segment
--   - jtbd_context: uq_jtbd_context_project_segment
--
-- Per-pain (project_id, segment_id, pain_id):
--   - canvas: uq_canvas_project_segment_pain
--   - canvas_extended: uq_canvas_extended_project_segment_pain (NEW)
--   - pains_ranking: uq_pains_ranking_project_segment_pain (NEW)
--
-- Multi-record (no UNIQUE - use batch approve):
--   - pains_initial (multiple pains per segment)
-- =====================================================
