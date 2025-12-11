-- =====================================================
-- Migration 015: Fix FK Constraints and Add Missing Indexes
--
-- This migration adds missing foreign key constraints and
-- performance indexes to the pains & canvas tables.
-- =====================================================

-- =====================================================
-- PART 1: ADD MISSING FOREIGN KEY CONSTRAINTS
-- =====================================================

-- Note: We use IF NOT EXISTS pattern via DO blocks since
-- ALTER TABLE ADD CONSTRAINT doesn't support IF NOT EXISTS

-- 1.1 pains_initial.segment_id -> segments(id)
-- (Already has segment_id but no FK constraint)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'pains_initial_segment_id_fkey'
    AND table_name = 'pains_initial'
  ) THEN
    ALTER TABLE pains_initial
    ADD CONSTRAINT pains_initial_segment_id_fkey
    FOREIGN KEY (segment_id) REFERENCES segments(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 1.2 pains_drafts.segment_id -> segments(id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'pains_drafts_segment_id_fkey'
    AND table_name = 'pains_drafts'
  ) THEN
    ALTER TABLE pains_drafts
    ADD CONSTRAINT pains_drafts_segment_id_fkey
    FOREIGN KEY (segment_id) REFERENCES segments(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 1.3 pains_ranking_drafts.pain_id -> pains_initial(id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'pains_ranking_drafts_pain_id_fkey'
    AND table_name = 'pains_ranking_drafts'
  ) THEN
    ALTER TABLE pains_ranking_drafts
    ADD CONSTRAINT pains_ranking_drafts_pain_id_fkey
    FOREIGN KEY (pain_id) REFERENCES pains_initial(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 1.4 pains_ranking.pain_id -> pains_initial(id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'pains_ranking_pain_id_fkey'
    AND table_name = 'pains_ranking'
  ) THEN
    ALTER TABLE pains_ranking
    ADD CONSTRAINT pains_ranking_pain_id_fkey
    FOREIGN KEY (pain_id) REFERENCES pains_initial(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 1.5 canvas_drafts.pain_id -> pains_initial(id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'canvas_drafts_pain_id_fkey'
    AND table_name = 'canvas_drafts'
  ) THEN
    ALTER TABLE canvas_drafts
    ADD CONSTRAINT canvas_drafts_pain_id_fkey
    FOREIGN KEY (pain_id) REFERENCES pains_initial(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 1.6 canvas.pain_id -> pains_initial(id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'canvas_pain_id_fkey'
    AND table_name = 'canvas'
  ) THEN
    ALTER TABLE canvas
    ADD CONSTRAINT canvas_pain_id_fkey
    FOREIGN KEY (pain_id) REFERENCES pains_initial(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 1.7 canvas_extended_drafts.pain_id -> pains_initial(id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'canvas_extended_drafts_pain_id_fkey'
    AND table_name = 'canvas_extended_drafts'
  ) THEN
    ALTER TABLE canvas_extended_drafts
    ADD CONSTRAINT canvas_extended_drafts_pain_id_fkey
    FOREIGN KEY (pain_id) REFERENCES pains_initial(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 1.8 canvas_extended.pain_id -> pains_initial(id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'canvas_extended_pain_id_fkey'
    AND table_name = 'canvas_extended'
  ) THEN
    ALTER TABLE canvas_extended
    ADD CONSTRAINT canvas_extended_pain_id_fkey
    FOREIGN KEY (pain_id) REFERENCES pains_initial(id) ON DELETE CASCADE;
  END IF;
END $$;

-- =====================================================
-- PART 2: ADD MISSING PERFORMANCE INDEXES
-- =====================================================

-- Pains lookups
CREATE INDEX IF NOT EXISTS idx_pains_initial_segment ON pains_initial(segment_id);
CREATE INDEX IF NOT EXISTS idx_pains_initial_project_segment ON pains_initial(project_id, segment_id);
CREATE INDEX IF NOT EXISTS idx_pains_drafts_segment ON pains_drafts(segment_id);
CREATE INDEX IF NOT EXISTS idx_pains_drafts_project_segment ON pains_drafts(project_id, segment_id);

-- Pains ranking lookups
CREATE INDEX IF NOT EXISTS idx_pains_ranking_pain ON pains_ranking(pain_id);
CREATE INDEX IF NOT EXISTS idx_pains_ranking_pain_top ON pains_ranking(pain_id, is_top_pain);
CREATE INDEX IF NOT EXISTS idx_pains_ranking_project_segment ON pains_ranking(project_id, segment_id);
CREATE INDEX IF NOT EXISTS idx_pains_ranking_drafts_pain ON pains_ranking_drafts(pain_id);
CREATE INDEX IF NOT EXISTS idx_pains_ranking_drafts_project_segment ON pains_ranking_drafts(project_id, segment_id);

-- Canvas lookups
CREATE INDEX IF NOT EXISTS idx_canvas_pain ON canvas(pain_id);
CREATE INDEX IF NOT EXISTS idx_canvas_project_segment ON canvas(project_id, segment_id);
CREATE INDEX IF NOT EXISTS idx_canvas_drafts_pain ON canvas_drafts(pain_id);
CREATE INDEX IF NOT EXISTS idx_canvas_drafts_project_segment ON canvas_drafts(project_id, segment_id);

-- Canvas Extended lookups
CREATE INDEX IF NOT EXISTS idx_canvas_extended_pain ON canvas_extended(pain_id);
CREATE INDEX IF NOT EXISTS idx_canvas_extended_project_segment ON canvas_extended(project_id, segment_id);
CREATE INDEX IF NOT EXISTS idx_canvas_extended_drafts_pain ON canvas_extended_drafts(pain_id);
CREATE INDEX IF NOT EXISTS idx_canvas_extended_drafts_project_segment ON canvas_extended_drafts(project_id, segment_id);

-- =====================================================
-- DONE
-- =====================================================
