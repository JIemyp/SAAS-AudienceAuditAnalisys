-- =====================================================
-- Project Sharing - Members & Invites
-- =====================================================

-- Project members table (for shared access)
CREATE TABLE IF NOT EXISTS project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('viewer', 'editor')),
  invited_by UUID,
  joined_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(project_id, user_id)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_project_members_user ON project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_project_members_project ON project_members(project_id);

-- Project invites table
CREATE TABLE IF NOT EXISTS project_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('viewer', 'editor')),
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  invited_by UUID NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for token lookups
CREATE INDEX IF NOT EXISTS idx_project_invites_token ON project_invites(token);
CREATE INDEX IF NOT EXISTS idx_project_invites_project ON project_invites(project_id);
CREATE INDEX IF NOT EXISTS idx_project_invites_email ON project_invites(email);

-- RLS Policies for project_members
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

-- Users can see members of projects they own or are members of
CREATE POLICY "Users can view members of accessible projects"
  ON project_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_members.project_id
      AND projects.user_id = auth.uid()
    )
    OR user_id = auth.uid()
  );

-- Only project owners can add members
CREATE POLICY "Project owners can add members"
  ON project_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_members.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Only project owners can remove members
CREATE POLICY "Project owners can remove members"
  ON project_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_members.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- RLS Policies for project_invites
ALTER TABLE project_invites ENABLE ROW LEVEL SECURITY;

-- Anyone can view invite by token (for accept page)
CREATE POLICY "Anyone can view invites by token"
  ON project_invites FOR SELECT
  USING (true);

-- Only project owners can create invites
CREATE POLICY "Project owners can create invites"
  ON project_invites FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_invites.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Anyone can update invite (for marking accepted)
CREATE POLICY "Anyone can accept invites"
  ON project_invites FOR UPDATE
  USING (true);

-- Only project owners can delete invites
CREATE POLICY "Project owners can delete invites"
  ON project_invites FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_invites.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Update projects RLS to allow members to view
DROP POLICY IF EXISTS "Users can view own projects" ON projects;
CREATE POLICY "Users can view accessible projects"
  ON projects FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = projects.id
      AND project_members.user_id = auth.uid()
    )
  );
