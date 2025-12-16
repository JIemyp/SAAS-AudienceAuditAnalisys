-- =====================================================
-- Add email column to project_members
-- Stores email for display purposes (avoid auth.users queries)
-- =====================================================

-- Add email column
ALTER TABLE project_members
ADD COLUMN IF NOT EXISTS email TEXT;

-- Comment for clarity
COMMENT ON COLUMN project_members.email IS 'User email stored at invite acceptance for display purposes';
