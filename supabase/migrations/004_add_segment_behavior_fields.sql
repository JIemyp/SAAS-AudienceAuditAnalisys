-- =====================================================
-- Migration: Add psychographics, online_behavior, buying_behavior to segment_details
-- Also add segment_id to canvas tables for better querying
-- Run this in Supabase SQL Editor
-- =====================================================

-- ================================================
-- STEP 1: Add behavior fields to segment_details_drafts
-- ================================================

ALTER TABLE segment_details_drafts
  ADD COLUMN IF NOT EXISTS sociodemographics TEXT,
  ADD COLUMN IF NOT EXISTS psychographics TEXT,
  ADD COLUMN IF NOT EXISTS online_behavior TEXT,
  ADD COLUMN IF NOT EXISTS buying_behavior TEXT;

-- ================================================
-- STEP 2: Add behavior fields to segment_details
-- ================================================

ALTER TABLE segment_details
  ADD COLUMN IF NOT EXISTS sociodemographics TEXT,
  ADD COLUMN IF NOT EXISTS psychographics TEXT,
  ADD COLUMN IF NOT EXISTS online_behavior TEXT,
  ADD COLUMN IF NOT EXISTS buying_behavior TEXT;

-- ================================================
-- STEP 3: Add segment_id to canvas tables
-- ================================================

ALTER TABLE canvas_drafts
  ADD COLUMN IF NOT EXISTS segment_id UUID;

ALTER TABLE canvas
  ADD COLUMN IF NOT EXISTS segment_id UUID;

-- ================================================
-- STEP 4: Add segment_id to canvas_extended tables
-- ================================================

ALTER TABLE canvas_extended_drafts
  ADD COLUMN IF NOT EXISTS segment_id UUID;

ALTER TABLE canvas_extended
  ADD COLUMN IF NOT EXISTS segment_id UUID;

-- ================================================
-- STEP 5: Create indexes for better query performance
-- ================================================

CREATE INDEX IF NOT EXISTS idx_canvas_segment_id ON canvas(segment_id);
CREATE INDEX IF NOT EXISTS idx_canvas_drafts_segment_id ON canvas_drafts(segment_id);
CREATE INDEX IF NOT EXISTS idx_canvas_extended_segment_id ON canvas_extended(segment_id);
CREATE INDEX IF NOT EXISTS idx_canvas_extended_drafts_segment_id ON canvas_extended_drafts(segment_id);
