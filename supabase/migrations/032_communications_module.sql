-- =============================================================
-- Migration 032: Communications Module
-- Tables: communications_funnel_drafts, communications_funnel
-- =============================================================

-- =============================================================
-- COMMUNICATIONS FUNNEL (per segment × top pain)
-- =============================================================

CREATE TABLE communications_funnel_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  segment_id UUID NOT NULL REFERENCES segments(id) ON DELETE CASCADE,
  pain_id UUID NOT NULL REFERENCES pains_initial(id) ON DELETE CASCADE,

  -- Organic content cadence
  organic_rhythm JSONB NOT NULL,
  -- {tof_content[], mof_content[], bof_content[], posting_cadence, channel_matrix}

  -- Conversation funnel
  conversation_funnel JSONB NOT NULL,
  -- {entry_points[], dm_flow, chat_flow, qualification_criteria, handoff_script}

  -- Chatbot scripts
  chatbot_scripts JSONB,
  -- {welcome_flow, need_discovery_flow, recommendation_flow, export_format}

  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE communications_funnel (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  segment_id UUID NOT NULL REFERENCES segments(id) ON DELETE CASCADE,
  pain_id UUID NOT NULL REFERENCES pains_initial(id) ON DELETE CASCADE,

  organic_rhythm JSONB NOT NULL,
  conversation_funnel JSONB NOT NULL,
  chatbot_scripts JSONB,

  approved_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT unique_communications_funnel UNIQUE (project_id, segment_id, pain_id)
);

-- =============================================================
-- INDEXES
-- =============================================================

CREATE INDEX idx_communications_funnel_drafts_project ON communications_funnel_drafts(project_id);
CREATE INDEX idx_communications_funnel_drafts_segment ON communications_funnel_drafts(segment_id);
CREATE INDEX idx_communications_funnel_drafts_pain ON communications_funnel_drafts(pain_id);
CREATE INDEX idx_communications_funnel_project ON communications_funnel(project_id);
CREATE INDEX idx_communications_funnel_segment ON communications_funnel(segment_id);
CREATE INDEX idx_communications_funnel_pain ON communications_funnel(pain_id);

-- =============================================================
-- RLS POLICIES
-- =============================================================

ALTER TABLE communications_funnel_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE communications_funnel ENABLE ROW LEVEL SECURITY;

-- User policies (owner + project members)
CREATE POLICY "Users can manage own communications_funnel_drafts" ON communications_funnel_drafts
  FOR ALL USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
    OR project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can manage own communications_funnel" ON communications_funnel
  FOR ALL USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
    OR project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid())
  );

-- Service role policies
CREATE POLICY "Service role full access communications_funnel_drafts" ON communications_funnel_drafts
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access communications_funnel" ON communications_funnel
  FOR ALL USING (auth.role() = 'service_role');
