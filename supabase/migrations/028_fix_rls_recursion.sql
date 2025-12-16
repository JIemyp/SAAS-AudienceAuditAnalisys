-- =====================================================
-- Fix RLS Infinite Recursion
-- The previous policy caused recursion between projects and project_members
-- =====================================================

-- Drop problematic policies
DROP POLICY IF EXISTS "Users can view accessible projects" ON projects;
DROP POLICY IF EXISTS "Users can view own projects" ON projects;

-- Simple policy for projects - owner only (no subquery to project_members)
CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  USING (user_id = auth.uid());

-- For project_members - users can see their own memberships
DROP POLICY IF EXISTS "Users can view own memberships" ON project_members;
CREATE POLICY "Users can view own memberships"
  ON project_members FOR SELECT
  USING (user_id = auth.uid());

-- Ensure RLS is enabled
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
