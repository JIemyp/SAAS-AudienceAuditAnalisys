-- =====================================================
-- Migration 023: Idempotent Approve System
-- =====================================================
-- Adds UNIQUE constraints and data_history for audit/rollback
-- Part of Block A fix from FULL_SYSTEM_AUDIT.md
-- =====================================================

-- =====================================================
-- PART 1: Create data_history table for audit trail
-- =====================================================

CREATE TABLE IF NOT EXISTS data_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  segment_id UUID REFERENCES segments_final(id) ON DELETE SET NULL,
  operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE', 'UPSERT')),
  old_data JSONB,
  new_data JSONB,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_data_history_project ON data_history(project_id);
CREATE INDEX IF NOT EXISTS idx_data_history_table_record ON data_history(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_data_history_changed_at ON data_history(changed_at DESC);

-- Enable RLS
ALTER TABLE data_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own project history" ON data_history;
CREATE POLICY "Users can view own project history" ON data_history
  FOR SELECT USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Service can insert history" ON data_history;
CREATE POLICY "Service can insert history" ON data_history
  FOR INSERT WITH CHECK (true);

-- =====================================================
-- PART 2: Add approved_at columns where missing
-- =====================================================

-- Per-project tables
ALTER TABLE portrait_final ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ DEFAULT NOW();

-- Per-segment tables
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE preferences ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE difficulties ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE triggers ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE pains_initial ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE pains_ranking ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE canvas ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE canvas_extended ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ DEFAULT NOW();

-- V5 tables
ALTER TABLE channel_strategy ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE competitive_intelligence ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE pricing_psychology ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE trust_framework ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE jtbd_context ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ DEFAULT NOW();

-- =====================================================
-- PART 3: Clean duplicates before adding UNIQUE constraints
-- Keep only ONE record per unique key using DISTINCT ON
-- =====================================================

-- portrait_final: keep one per project
DELETE FROM portrait_final
WHERE id NOT IN (
  SELECT DISTINCT ON (project_id) id FROM portrait_final ORDER BY project_id, id DESC
);

-- jobs: keep one per project+segment
DELETE FROM jobs
WHERE id NOT IN (
  SELECT DISTINCT ON (project_id, segment_id) id FROM jobs ORDER BY project_id, segment_id, id DESC
);

-- preferences: keep one per project+segment
DELETE FROM preferences
WHERE id NOT IN (
  SELECT DISTINCT ON (project_id, segment_id) id FROM preferences ORDER BY project_id, segment_id, id DESC
);

-- difficulties: keep one per project+segment
DELETE FROM difficulties
WHERE id NOT IN (
  SELECT DISTINCT ON (project_id, segment_id) id FROM difficulties ORDER BY project_id, segment_id, id DESC
);

-- triggers: keep one per project+segment
DELETE FROM triggers
WHERE id NOT IN (
  SELECT DISTINCT ON (project_id, segment_id) id FROM triggers ORDER BY project_id, segment_id, id DESC
);

-- canvas: keep one per project+segment+pain
DELETE FROM canvas
WHERE id NOT IN (
  SELECT DISTINCT ON (project_id, segment_id, pain_id) id FROM canvas ORDER BY project_id, segment_id, pain_id, id DESC
);

-- V5 tables: keep one per project+segment
DELETE FROM channel_strategy
WHERE id NOT IN (
  SELECT DISTINCT ON (project_id, segment_id) id FROM channel_strategy ORDER BY project_id, segment_id, id DESC
);

DELETE FROM competitive_intelligence
WHERE id NOT IN (
  SELECT DISTINCT ON (project_id, segment_id) id FROM competitive_intelligence ORDER BY project_id, segment_id, id DESC
);

DELETE FROM pricing_psychology
WHERE id NOT IN (
  SELECT DISTINCT ON (project_id, segment_id) id FROM pricing_psychology ORDER BY project_id, segment_id, id DESC
);

DELETE FROM trust_framework
WHERE id NOT IN (
  SELECT DISTINCT ON (project_id, segment_id) id FROM trust_framework ORDER BY project_id, segment_id, id DESC
);

DELETE FROM jtbd_context
WHERE id NOT IN (
  SELECT DISTINCT ON (project_id, segment_id) id FROM jtbd_context ORDER BY project_id, segment_id, id DESC
);

-- =====================================================
-- PART 4: Add UNIQUE constraints (with IF NOT EXISTS via DO block)
-- =====================================================

-- Per-project tables (one record per project)
DO $$ BEGIN
  ALTER TABLE portrait_final ADD CONSTRAINT uq_portrait_final_project UNIQUE (project_id);
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

-- Per-segment tables (one record per project+segment)
DO $$ BEGIN
  ALTER TABLE jobs ADD CONSTRAINT uq_jobs_project_segment UNIQUE (project_id, segment_id);
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE preferences ADD CONSTRAINT uq_preferences_project_segment UNIQUE (project_id, segment_id);
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE difficulties ADD CONSTRAINT uq_difficulties_project_segment UNIQUE (project_id, segment_id);
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE triggers ADD CONSTRAINT uq_triggers_project_segment UNIQUE (project_id, segment_id);
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

-- Per-pain tables (one record per project+segment+pain)
DO $$ BEGIN
  ALTER TABLE canvas ADD CONSTRAINT uq_canvas_project_segment_pain UNIQUE (project_id, segment_id, pain_id);
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

-- V5 tables (one record per project+segment)
DO $$ BEGIN
  ALTER TABLE channel_strategy ADD CONSTRAINT uq_channel_strategy_project_segment UNIQUE (project_id, segment_id);
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE competitive_intelligence ADD CONSTRAINT uq_competitive_intelligence_project_segment UNIQUE (project_id, segment_id);
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE pricing_psychology ADD CONSTRAINT uq_pricing_psychology_project_segment UNIQUE (project_id, segment_id);
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE trust_framework ADD CONSTRAINT uq_trust_framework_project_segment UNIQUE (project_id, segment_id);
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE jtbd_context ADD CONSTRAINT uq_jtbd_context_project_segment UNIQUE (project_id, segment_id);
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

-- =====================================================
-- PART 5: Comments for documentation
-- =====================================================

COMMENT ON TABLE data_history IS 'Audit trail for approve operations. Tracks all changes with old/new data for rollback capability.';
COMMENT ON COLUMN data_history.operation IS 'Type of operation: INSERT (new), UPDATE (existing), DELETE (removed), UPSERT (batch replace)';
COMMENT ON COLUMN data_history.old_data IS 'Previous state of the record (null for INSERT)';
COMMENT ON COLUMN data_history.new_data IS 'New state of the record';
