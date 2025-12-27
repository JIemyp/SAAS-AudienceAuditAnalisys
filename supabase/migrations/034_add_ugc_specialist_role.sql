-- =====================================================
-- Migration 034: Add ugc_specialist role to project roles
-- =====================================================

ALTER TABLE project_members
  DROP CONSTRAINT IF EXISTS project_members_role_check;

ALTER TABLE project_members
  ADD CONSTRAINT project_members_role_check
  CHECK (role IN ('viewer', 'editor', 'ugc_specialist'));

ALTER TABLE project_invites
  DROP CONSTRAINT IF EXISTS project_invites_role_check;

ALTER TABLE project_invites
  ADD CONSTRAINT project_invites_role_check
  CHECK (role IN ('viewer', 'editor', 'ugc_specialist'));
