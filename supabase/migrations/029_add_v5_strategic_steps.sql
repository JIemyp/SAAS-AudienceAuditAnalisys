-- =====================================================
-- Add V5 Strategic Module Steps to projects constraint
-- and fix projects incorrectly marked as completed
-- =====================================================

-- ================================================
-- STEP 1: Update the constraint to include V5 steps
-- ================================================

ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_current_step_check;

ALTER TABLE projects ADD CONSTRAINT projects_current_step_check
  CHECK (current_step IN (
    'onboarding',

    -- Block 1: Portrait
    'validation_draft', 'validation_approved',
    'portrait_draft', 'portrait_approved',
    'portrait_review_draft', 'portrait_review_approved',
    'portrait_final_draft', 'portrait_final_approved',

    -- Block 2: Segmentation
    'segments_draft', 'segments_approved',
    'segments_review_draft', 'segments_review_approved',
    'segments_final_draft', 'segments_final_approved',
    'segment_details_draft', 'segment_details_approved',

    -- Block 3: Deep Analysis (per segment)
    'jobs_draft', 'jobs_approved',
    'preferences_draft', 'preferences_approved',
    'difficulties_draft', 'difficulties_approved',
    'triggers_draft', 'triggers_approved',

    -- Block 4: Pains & Canvas (per segment)
    'pains_draft', 'pains_approved',
    'pains_ranking_draft', 'pains_ranking_approved',
    'canvas_draft', 'canvas_approved',
    'canvas_extended_draft', 'canvas_extended_approved',

    -- Block 5: V5 Strategic Modules (per segment) - NEW!
    'channel_strategy_draft', 'channel_strategy_approved',
    'competitive_intelligence_draft', 'competitive_intelligence_approved',
    'pricing_psychology_draft', 'pricing_psychology_approved',
    'trust_framework_draft', 'trust_framework_approved',
    'jtbd_context_draft', 'jtbd_context_approved',

    'completed'
  ));

-- ================================================
-- STEP 2: Fix projects incorrectly marked as completed
-- These are projects that have canvas_extended data
-- but no channel_strategy data (they stopped at canvas-extended)
-- ================================================

UPDATE projects
SET
  current_step = 'channel_strategy_draft',
  status = 'processing',
  updated_at = now()
WHERE
  -- Project is marked as completed
  current_step = 'completed'
  AND status = 'completed'
  -- Has canvas_extended data
  AND EXISTS (
    SELECT 1 FROM canvas_extended
    WHERE canvas_extended.project_id = projects.id
  )
  -- Does NOT have channel_strategy data (never progressed past canvas-extended)
  AND NOT EXISTS (
    SELECT 1 FROM channel_strategy
    WHERE channel_strategy.project_id = projects.id
  );

-- ================================================
-- STEP 3: Update helper functions with V5 steps
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
    'segments_draft', 'segments_approved',
    'segments_review_draft', 'segments_review_approved',
    'segments_final_draft', 'segments_final_approved',
    'segment_details_draft', 'segment_details_approved',
    'jobs_draft', 'jobs_approved',
    'preferences_draft', 'preferences_approved',
    'difficulties_draft', 'difficulties_approved',
    'triggers_draft', 'triggers_approved',
    'pains_draft', 'pains_approved',
    'pains_ranking_draft', 'pains_ranking_approved',
    'canvas_draft', 'canvas_approved',
    'canvas_extended_draft', 'canvas_extended_approved',
    -- V5 Strategic Modules
    'channel_strategy_draft', 'channel_strategy_approved',
    'competitive_intelligence_draft', 'competitive_intelligence_approved',
    'pricing_psychology_draft', 'pricing_psychology_approved',
    'trust_framework_draft', 'trust_framework_approved',
    'jtbd_context_draft', 'jtbd_context_approved',
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

CREATE OR REPLACE FUNCTION get_previous_step(current TEXT)
RETURNS TEXT AS $$
DECLARE
  steps TEXT[] := ARRAY[
    'onboarding',
    'validation_draft', 'validation_approved',
    'portrait_draft', 'portrait_approved',
    'portrait_review_draft', 'portrait_review_approved',
    'portrait_final_draft', 'portrait_final_approved',
    'segments_draft', 'segments_approved',
    'segments_review_draft', 'segments_review_approved',
    'segments_final_draft', 'segments_final_approved',
    'segment_details_draft', 'segment_details_approved',
    'jobs_draft', 'jobs_approved',
    'preferences_draft', 'preferences_approved',
    'difficulties_draft', 'difficulties_approved',
    'triggers_draft', 'triggers_approved',
    'pains_draft', 'pains_approved',
    'pains_ranking_draft', 'pains_ranking_approved',
    'canvas_draft', 'canvas_approved',
    'canvas_extended_draft', 'canvas_extended_approved',
    -- V5 Strategic Modules
    'channel_strategy_draft', 'channel_strategy_approved',
    'competitive_intelligence_draft', 'competitive_intelligence_approved',
    'pricing_psychology_draft', 'pricing_psychology_approved',
    'trust_framework_draft', 'trust_framework_approved',
    'jtbd_context_draft', 'jtbd_context_approved',
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

CREATE OR REPLACE FUNCTION get_step_index(step TEXT)
RETURNS INTEGER AS $$
DECLARE
  steps TEXT[] := ARRAY[
    'onboarding',
    'validation_draft', 'validation_approved',
    'portrait_draft', 'portrait_approved',
    'portrait_review_draft', 'portrait_review_approved',
    'portrait_final_draft', 'portrait_final_approved',
    'segments_draft', 'segments_approved',
    'segments_review_draft', 'segments_review_approved',
    'segments_final_draft', 'segments_final_approved',
    'segment_details_draft', 'segment_details_approved',
    'jobs_draft', 'jobs_approved',
    'preferences_draft', 'preferences_approved',
    'difficulties_draft', 'difficulties_approved',
    'triggers_draft', 'triggers_approved',
    'pains_draft', 'pains_approved',
    'pains_ranking_draft', 'pains_ranking_approved',
    'canvas_draft', 'canvas_approved',
    'canvas_extended_draft', 'canvas_extended_approved',
    -- V5 Strategic Modules
    'channel_strategy_draft', 'channel_strategy_approved',
    'competitive_intelligence_draft', 'competitive_intelligence_approved',
    'pricing_psychology_draft', 'pricing_psychology_approved',
    'trust_framework_draft', 'trust_framework_approved',
    'jtbd_context_draft', 'jtbd_context_approved',
    'completed'
  ];
BEGIN
  RETURN COALESCE(array_position(steps, step), 0);
END;
$$ LANGUAGE plpgsql IMMUTABLE;
