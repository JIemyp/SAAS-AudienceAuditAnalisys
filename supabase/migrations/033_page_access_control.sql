-- =============================================================
-- Migration 033: Page-Level Access Control
-- Tables: project_page_access, project_member_page_access
-- =============================================================

-- =============================================================
-- PAGE-LEVEL ACCESS CONTROL (per project + per member override)
-- =============================================================

CREATE TABLE project_page_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  page_key TEXT NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (project_id, page_key)
);

CREATE TABLE project_member_page_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_member_id UUID NOT NULL REFERENCES project_members(id) ON DELETE CASCADE,
  page_key TEXT NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (project_member_id, page_key)
);

-- =============================================================
-- INDEXES
-- =============================================================

CREATE INDEX idx_project_page_access_project ON project_page_access(project_id);
CREATE INDEX idx_project_page_access_page_key ON project_page_access(page_key);
CREATE INDEX idx_project_member_page_access_member ON project_member_page_access(project_member_id);
CREATE INDEX idx_project_member_page_access_page_key ON project_member_page_access(page_key);

-- =============================================================
-- RLS POLICIES
-- =============================================================

ALTER TABLE project_page_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_member_page_access ENABLE ROW LEVEL SECURITY;

-- Project page access: owner/editor can manage, viewer can read
CREATE POLICY "Owner can manage project_page_access" ON project_page_access
  FOR ALL USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
    OR project_id IN (
      SELECT project_id FROM project_members
      WHERE user_id = auth.uid()
            AND role IN ('editor', 'owner')
    )
  );

CREATE POLICY "Viewers can read project_page_access" ON project_page_access
  FOR SELECT USING (
    project_id IN (
      SELECT project_id FROM project_members
      WHERE user_id = auth.uid()
          )
  );

-- Member page access: owner/editor can manage, member can read own
CREATE POLICY "Owner can manage project_member_page_access" ON project_member_page_access
  FOR ALL USING (
    project_member_id IN (
      SELECT pm.id FROM project_members pm
      JOIN projects p ON pm.project_id = p.id
      WHERE p.user_id = auth.uid()
    )
    OR project_member_id IN (
      SELECT pm2.id FROM project_members pm2
      JOIN project_members pm_editor ON pm2.project_id = pm_editor.project_id
      WHERE pm_editor.user_id = auth.uid()
      AND pm_editor.role IN ('editor', 'owner')
    )
  );

CREATE POLICY "Member can read own project_member_page_access" ON project_member_page_access
  FOR SELECT USING (
    project_member_id IN (
      SELECT id FROM project_members
      WHERE user_id = auth.uid()
          )
  );

-- Service role policies
CREATE POLICY "Service role full access project_page_access" ON project_page_access
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access project_member_page_access" ON project_member_page_access
  FOR ALL USING (auth.role() = 'service_role');

-- =============================================================
-- DEFAULT PAGE KEYS
-- Page keys: dashboard, overview, report, explorer, strategy,
--            communications, playbooks, paid-ads, ugc-creators,
--            data-ops, settings, export
-- =============================================================

-- Function to seed default page access for a project
CREATE OR REPLACE FUNCTION seed_project_page_access(p_project_id UUID)
RETURNS void AS $$
DECLARE
  v_page_keys TEXT[] := ARRAY[
    'dashboard', 'overview', 'report', 'explorer', 'strategy',
    'communications', 'playbooks', 'paid-ads', 'ugc-creators',
    'data-ops', 'settings', 'export'
  ];
  v_page_key TEXT;
BEGIN
  FOREACH v_page_key IN ARRAY v_page_keys
  LOOP
    INSERT INTO project_page_access (project_id, page_key, is_enabled)
    VALUES (p_project_id, v_page_key, true)
    ON CONFLICT (project_id, page_key) DO NOTHING;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-seed page access on project creation
CREATE OR REPLACE FUNCTION trigger_seed_page_access()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM seed_project_page_access(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_project_page_access_seed
  AFTER INSERT ON projects
  FOR EACH ROW
  EXECUTE FUNCTION trigger_seed_page_access();

-- =============================================================
-- BACKFILL: Add default page access for existing projects
-- =============================================================

DO $$
DECLARE
  proj RECORD;
BEGIN
  FOR proj IN SELECT id FROM projects LOOP
    PERFORM seed_project_page_access(proj.id);
  END LOOP;
END $$;
