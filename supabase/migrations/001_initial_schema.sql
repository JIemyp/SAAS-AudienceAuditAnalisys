-- =====================================================
-- Audience Audit Analysis - Initial Database Schema
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. TABLES
-- =====================================================

-- Projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'completed', 'failed')),
  onboarding_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Audience overviews table
CREATE TABLE audience_overviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  sociodemographics JSONB,
  psychographics JSONB,
  general_pains JSONB,
  triggers JSONB,
  full_content TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Segments table
CREATE TABLE segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  order_index INTEGER,
  name TEXT,
  description TEXT,
  sociodemographics TEXT,
  needs JSONB,
  triggers JSONB,
  core_values JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Pains table
CREATE TABLE pains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  segment_id UUID REFERENCES segments(id) ON DELETE CASCADE,
  name TEXT,
  description TEXT,
  deep_triggers JSONB,
  examples JSONB,
  extended_analysis TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Project files table
CREATE TABLE project_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE audience_overviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE pains ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;

-- 3. RLS POLICIES
-- =====================================================

-- Projects: Users can only access their own projects
CREATE POLICY "Users can CRUD own projects" ON projects
  FOR ALL USING (auth.uid() = user_id);

-- Audience overviews: Access through project ownership
CREATE POLICY "Users can CRUD own overviews" ON audience_overviews
  FOR ALL USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

-- Segments: Access through project ownership
CREATE POLICY "Users can CRUD own segments" ON segments
  FOR ALL USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

-- Pains: Access through segment → project ownership
CREATE POLICY "Users can CRUD own pains" ON pains
  FOR ALL USING (segment_id IN (
    SELECT id FROM segments WHERE project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()
    )
  ));

-- Project files: Access through project ownership
CREATE POLICY "Users can CRUD own files" ON project_files
  FOR ALL USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

-- 4. INDEXES (for performance)
-- =====================================================

CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_audience_overviews_project_id ON audience_overviews(project_id);
CREATE INDEX idx_segments_project_id ON segments(project_id);
CREATE INDEX idx_segments_order ON segments(project_id, order_index);
CREATE INDEX idx_pains_segment_id ON pains(segment_id);
CREATE INDEX idx_project_files_project_id ON project_files(project_id);
CREATE INDEX idx_project_files_expires_at ON project_files(expires_at);

-- 5. UPDATED_AT TRIGGER
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
