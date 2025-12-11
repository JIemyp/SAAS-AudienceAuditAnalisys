-- =====================================================
-- Migration: Add awareness_reasoning column to segment_details tables
-- This provides context explaining WHY a segment has a specific awareness level
-- =====================================================

-- Add awareness_reasoning to segment_details_drafts
ALTER TABLE segment_details_drafts
  ADD COLUMN IF NOT EXISTS awareness_reasoning TEXT;

-- Add awareness_reasoning to segment_details (approved)
ALTER TABLE segment_details
  ADD COLUMN IF NOT EXISTS awareness_reasoning TEXT;

-- Comment for documentation
COMMENT ON COLUMN segment_details_drafts.awareness_reasoning IS 'Explanation of why this segment has the specified awareness level, with context about their journey and what they know about the product/solution';
COMMENT ON COLUMN segment_details.awareness_reasoning IS 'Explanation of why this segment has the specified awareness level, with context about their journey and what they know about the product/solution';
