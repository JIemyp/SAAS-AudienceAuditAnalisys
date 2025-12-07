-- =====================================================
-- Migration: Segments Final tables
-- Purpose: Store final segments after applying review decisions
-- Similar to Portrait Final, which applies Portrait Review decisions
-- =====================================================

-- Drafts table
CREATE TABLE IF NOT EXISTS segments_final_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  segment_index INTEGER NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  sociodemographics TEXT NOT NULL,
  changes_applied TEXT[] DEFAULT '{}', -- What was changed from original
  is_new BOOLEAN DEFAULT FALSE, -- If this is a newly added segment
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Approved table
CREATE TABLE IF NOT EXISTS segments_final (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  segment_index INTEGER NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  sociodemographics TEXT NOT NULL,
  changes_applied TEXT[] DEFAULT '{}',
  is_new BOOLEAN DEFAULT FALSE,
  approved_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_segments_final_drafts_project ON segments_final_drafts(project_id);
CREATE INDEX IF NOT EXISTS idx_segments_final_project ON segments_final(project_id);
CREATE INDEX IF NOT EXISTS idx_segments_final_drafts_segment_index ON segments_final_drafts(project_id, segment_index);
CREATE INDEX IF NOT EXISTS idx_segments_final_segment_index ON segments_final(project_id, segment_index);

-- Enable Row Level Security
ALTER TABLE segments_final_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE segments_final ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own project data
CREATE POLICY "Users can manage own segments_final_drafts" ON segments_final_drafts
  FOR ALL USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can manage own segments_final" ON segments_final
  FOR ALL USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );
