-- =============================================================
-- Migration 031: UGC Creators Module
-- Tables: ugc_creator_profiles_drafts, ugc_creator_profiles, ugc_creator_tracking
-- =============================================================

-- =============================================================
-- UGC CREATOR PROFILES (AI-generated per segment)
-- =============================================================

CREATE TABLE ugc_creator_profiles_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  segment_id UUID NOT NULL REFERENCES segments(id) ON DELETE CASCADE,

  -- Ideal creator profile based on segment
  ideal_persona JSONB NOT NULL,
  -- {name, age_range, gender, location_preference, platform_presence[], personality_traits[], visual_aesthetic, content_style}

  -- Content topics derived from pains/jobs
  content_topics JSONB NOT NULL,
  -- [{topic, source_pain_id, hook_angle, emotional_tone, format_suggestion}]

  -- Sourcing guidance
  sourcing_guidance JSONB,
  -- {where_to_find[], outreach_template, rate_range, red_flags[], green_flags[]}

  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE ugc_creator_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  segment_id UUID NOT NULL REFERENCES segments(id) ON DELETE CASCADE,

  ideal_persona JSONB NOT NULL,
  content_topics JSONB NOT NULL,
  sourcing_guidance JSONB,

  approved_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT unique_ugc_creator_profiles UNIQUE (project_id, segment_id)
);

-- =============================================================
-- UGC CREATOR TRACKING (manual CRUD - no drafts needed)
-- =============================================================

CREATE TABLE ugc_creator_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  segment_id UUID NOT NULL REFERENCES segments(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES ugc_creator_profiles(id) ON DELETE SET NULL,

  -- Creator info
  creator_name TEXT NOT NULL,
  creator_handle TEXT,
  platform TEXT NOT NULL, -- instagram, tiktok, youtube
  contact_info TEXT,

  -- Status tracking
  status TEXT DEFAULT 'prospect', -- prospect, contacted, negotiating, contracted, delivered, completed

  -- Content tracking
  videos_ordered INTEGER DEFAULT 0,
  videos_delivered INTEGER DEFAULT 0,
  videos_published INTEGER DEFAULT 0,

  -- Notes
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================================
-- INDEXES
-- =============================================================

CREATE INDEX idx_ugc_creator_profiles_drafts_project ON ugc_creator_profiles_drafts(project_id);
CREATE INDEX idx_ugc_creator_profiles_drafts_segment ON ugc_creator_profiles_drafts(segment_id);
CREATE INDEX idx_ugc_creator_profiles_project ON ugc_creator_profiles(project_id);
CREATE INDEX idx_ugc_creator_profiles_segment ON ugc_creator_profiles(segment_id);
CREATE INDEX idx_ugc_creator_tracking_project ON ugc_creator_tracking(project_id);
CREATE INDEX idx_ugc_creator_tracking_segment ON ugc_creator_tracking(segment_id);
CREATE INDEX idx_ugc_creator_tracking_status ON ugc_creator_tracking(status);
CREATE INDEX idx_ugc_creator_tracking_profile ON ugc_creator_tracking(profile_id);

-- =============================================================
-- RLS POLICIES
-- =============================================================

ALTER TABLE ugc_creator_profiles_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ugc_creator_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ugc_creator_tracking ENABLE ROW LEVEL SECURITY;

-- User policies (owner + project members including ugc_specialist)
CREATE POLICY "Users can manage own ugc_creator_profiles_drafts" ON ugc_creator_profiles_drafts
  FOR ALL USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
    OR project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can manage own ugc_creator_profiles" ON ugc_creator_profiles
  FOR ALL USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
    OR project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can manage own ugc_creator_tracking" ON ugc_creator_tracking
  FOR ALL USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
    OR project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid())
  );

-- Service role policies
CREATE POLICY "Service role full access ugc_creator_profiles_drafts" ON ugc_creator_profiles_drafts
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access ugc_creator_profiles" ON ugc_creator_profiles
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access ugc_creator_tracking" ON ugc_creator_tracking
  FOR ALL USING (auth.role() = 'service_role');

-- =============================================================
-- TRIGGER: auto-update updated_at on ugc_creator_tracking
-- =============================================================

CREATE OR REPLACE FUNCTION update_ugc_creator_tracking_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ugc_creator_tracking_updated_at
  BEFORE UPDATE ON ugc_creator_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_ugc_creator_tracking_updated_at();
