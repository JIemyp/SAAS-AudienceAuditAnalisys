-- =====================================================
-- Fix: Portrait Review foreign key should reference portrait (approved)
-- not portrait_drafts
-- =====================================================

-- Drop the incorrect foreign key constraint
ALTER TABLE portrait_review_drafts
DROP CONSTRAINT IF EXISTS portrait_review_drafts_original_portrait_id_fkey;

-- Add the correct foreign key referencing approved portrait table
ALTER TABLE portrait_review_drafts
ADD CONSTRAINT portrait_review_drafts_original_portrait_id_fkey
FOREIGN KEY (original_portrait_id) REFERENCES portrait(id);
