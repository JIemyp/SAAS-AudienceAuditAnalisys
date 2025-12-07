-- =====================================================
-- Migration: Add decisions JSONB to review draft tables
-- Purpose: Track Apply/Edit/Dismiss decisions for each recommendation
-- =====================================================

-- Add decisions column to portrait_review_drafts
ALTER TABLE portrait_review_drafts
  ADD COLUMN IF NOT EXISTS decisions JSONB DEFAULT '{}';

-- Add decisions column to segments_review_drafts
ALTER TABLE segments_review_drafts
  ADD COLUMN IF NOT EXISTS decisions JSONB DEFAULT '{}';

-- COMMENT: decisions structure example:
-- {
--   "change-0": {"status": "applied", "originalText": "...", "editedText": null},
--   "change-1": {"status": "edited", "originalText": "...", "editedText": "modified text"},
--   "addition-0": {"status": "dismissed", "originalText": "..."},
--   ...
-- }

-- Also add to approved versions for historical tracking
ALTER TABLE portrait_review
  ADD COLUMN IF NOT EXISTS decisions JSONB DEFAULT '{}';

ALTER TABLE segments_review
  ADD COLUMN IF NOT EXISTS decisions JSONB DEFAULT '{}';
