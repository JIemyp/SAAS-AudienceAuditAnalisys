-- =====================================================
-- Audience Research Tool v4 - Project Status Flow
-- Run this in Supabase SQL Editor AFTER 004_v4_rls_policies.sql
-- Reference: audience-research-tool-v4-complete.md
-- =====================================================

-- ================================================
-- PROJECT STATUS CONSTRAINT
-- 31 states from 'onboarding' to 'completed'
-- ================================================

-- First, update existing projects to have current_step
UPDATE projects SET current_step = 'onboarding' WHERE current_step IS NULL;

-- Add constraint for current_step
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_current_step_check;
ALTER TABLE projects ADD CONSTRAINT projects_current_step_check
  CHECK (current_step IN (
    'onboarding',

    -- Block 1: Portrait
    'validation_draft', 'validation_approved',
    'portrait_draft', 'portrait_approved',
    'portrait_review_draft', 'portrait_review_approved',
    'portrait_final_draft', 'portrait_final_approved',

    -- Block 2: Deep Analysis
    'jobs_draft', 'jobs_approved',
    'preferences_draft', 'preferences_approved',
    'difficulties_draft', 'difficulties_approved',
    'triggers_draft', 'triggers_approved',

    -- Block 3: Segmentation
    'segments_draft', 'segments_approved',
    'segments_review_draft', 'segments_review_approved',
    'segment_details_draft', 'segment_details_approved',

    -- Block 4: Pains
    'pains_draft', 'pains_approved',
    'pains_ranking_draft', 'pains_ranking_approved',
    'canvas_draft', 'canvas_approved',
    'canvas_extended_draft', 'canvas_extended_approved',

    'completed'
  ));

-- ================================================
-- HELPER FUNCTION: Get next step
-- ================================================

CREATE OR REPLACE FUNCTION get_next_step(current TEXT)
RETURNS TEXT AS $$
DECLARE
  steps TEXT[] := ARRAY[
    'onboarding',
    'validation_draft', 'validation_approved',
    'portrait_draft', 'portrait_approved',
    'portrait_review_draft', 'portrait_review_approved',
    'portrait_final_draft', 'portrait_final_approved',
    'jobs_draft', 'jobs_approved',
    'preferences_draft', 'preferences_approved',
    'difficulties_draft', 'difficulties_approved',
    'triggers_draft', 'triggers_approved',
    'segments_draft', 'segments_approved',
    'segments_review_draft', 'segments_review_approved',
    'segment_details_draft', 'segment_details_approved',
    'pains_draft', 'pains_approved',
    'pains_ranking_draft', 'pains_ranking_approved',
    'canvas_draft', 'canvas_approved',
    'canvas_extended_draft', 'canvas_extended_approved',
    'completed'
  ];
  idx INTEGER;
BEGIN
  idx := array_position(steps, current);
  IF idx IS NULL OR idx >= array_length(steps, 1) THEN
    RETURN 'completed';
  END IF;
  RETURN steps[idx + 1];
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ================================================
-- HELPER FUNCTION: Get previous step
-- ================================================

CREATE OR REPLACE FUNCTION get_previous_step(current TEXT)
RETURNS TEXT AS $$
DECLARE
  steps TEXT[] := ARRAY[
    'onboarding',
    'validation_draft', 'validation_approved',
    'portrait_draft', 'portrait_approved',
    'portrait_review_draft', 'portrait_review_approved',
    'portrait_final_draft', 'portrait_final_approved',
    'jobs_draft', 'jobs_approved',
    'preferences_draft', 'preferences_approved',
    'difficulties_draft', 'difficulties_approved',
    'triggers_draft', 'triggers_approved',
    'segments_draft', 'segments_approved',
    'segments_review_draft', 'segments_review_approved',
    'segment_details_draft', 'segment_details_approved',
    'pains_draft', 'pains_approved',
    'pains_ranking_draft', 'pains_ranking_approved',
    'canvas_draft', 'canvas_approved',
    'canvas_extended_draft', 'canvas_extended_approved',
    'completed'
  ];
  idx INTEGER;
BEGIN
  idx := array_position(steps, current);
  IF idx IS NULL OR idx <= 1 THEN
    RETURN 'onboarding';
  END IF;
  RETURN steps[idx - 1];
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ================================================
-- HELPER FUNCTION: Get step index
-- ================================================

CREATE OR REPLACE FUNCTION get_step_index(step TEXT)
RETURNS INTEGER AS $$
DECLARE
  steps TEXT[] := ARRAY[
    'onboarding',
    'validation_draft', 'validation_approved',
    'portrait_draft', 'portrait_approved',
    'portrait_review_draft', 'portrait_review_approved',
    'portrait_final_draft', 'portrait_final_approved',
    'jobs_draft', 'jobs_approved',
    'preferences_draft', 'preferences_approved',
    'difficulties_draft', 'difficulties_approved',
    'triggers_draft', 'triggers_approved',
    'segments_draft', 'segments_approved',
    'segments_review_draft', 'segments_review_approved',
    'segment_details_draft', 'segment_details_approved',
    'pains_draft', 'pains_approved',
    'pains_ranking_draft', 'pains_ranking_approved',
    'canvas_draft', 'canvas_approved',
    'canvas_extended_draft', 'canvas_extended_approved',
    'completed'
  ];
BEGIN
  RETURN COALESCE(array_position(steps, step), 0);
END;
$$ LANGUAGE plpgsql IMMUTABLE;
