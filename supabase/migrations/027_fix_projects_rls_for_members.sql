-- =====================================================
-- Fix Projects RLS Policy for Members
-- Ensures members can view shared projects
-- =====================================================

-- Drop existing policy if exists
DROP POLICY IF EXISTS "Users can view own projects" ON projects;
DROP POLICY IF EXISTS "Users can view accessible projects" ON projects;

-- Create policy that allows both owners and members to view projects
CREATE POLICY "Users can view accessible projects"
  ON projects FOR SELECT
  USING (
    -- User is the owner
    user_id = auth.uid()
    -- OR user is a member of this project
    OR EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = projects.id
      AND project_members.user_id = auth.uid()
    )
  );

-- Ensure RLS is enabled on projects table
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Also ensure members can read project data in related tables
-- These policies need to allow members to read data for projects they have access to

-- Function to check if user has access to a project (owner or member)
CREATE OR REPLACE FUNCTION user_has_project_access(p_project_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM projects
    WHERE id = p_project_id
    AND user_id = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM project_members
    WHERE project_id = p_project_id
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
