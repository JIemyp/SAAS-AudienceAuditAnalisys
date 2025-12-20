-- =============================================================
-- Migration 030: Strategy Module
-- Tables: strategy_summary, strategy_personalized, strategy_global, strategy_ads
-- =============================================================

-- =============================================================
-- STRATEGY SUMMARY (per project)
-- Scoring: growth_bet_score = job_frequency × trigger_urgency × pain_impact
-- =============================================================

CREATE TABLE strategy_summary_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- Summary blocks
  growth_bets JSONB NOT NULL,
  -- [{title, rationale, score, key_jobs[], key_triggers[], key_pains[]}]
  positioning_pillars JSONB NOT NULL,
  -- [{pillar, proof_points[], objections[]}]
  channel_priorities JSONB NOT NULL,
  -- [{channel, why, fit_score, segments[]}]
  risk_flags JSONB,
  -- [{risk, impact, mitigation}]

  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE strategy_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  growth_bets JSONB NOT NULL,
  positioning_pillars JSONB NOT NULL,
  channel_priorities JSONB NOT NULL,
  risk_flags JSONB,

  approved_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT unique_strategy_summary UNIQUE (project_id)
);

-- =============================================================
-- STRATEGY PERSONALIZED (per segment × top pain)
-- Воронка: TOF (UGC) → MOF (Quiz/Chat) → BOF (Creatives/LP)
-- =============================================================

CREATE TABLE strategy_personalized_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  segment_id UUID NOT NULL REFERENCES segments(id) ON DELETE CASCADE,
  pain_id UUID NOT NULL REFERENCES pains_initial(id) ON DELETE CASCADE,

  -- TOF (Top of Funnel) - UGC hooks
  tof_ugc_hooks JSONB NOT NULL,
  -- [{hook_type, script_outline, emotional_angle, visual_direction, cta}]

  -- MOF (Middle of Funnel) - Quiz/Chat flows
  mof_quiz_flow JSONB NOT NULL,
  -- {quiz_title, questions[], branching_logic, lead_magnet}
  mof_chat_script JSONB,
  -- {opening_message, discovery_questions[], objection_handlers[], handoff_trigger}

  -- BOF (Bottom of Funnel) - Creatives & LP
  bof_creative_briefs JSONB NOT NULL,
  -- [{format, headline, body, visual_concept, cta, target_placement}]
  bof_landing_structure JSONB NOT NULL,
  -- {hero_headline, hero_subheadline, pain_section, solution_section, proof_section, cta_section}

  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE strategy_personalized (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  segment_id UUID NOT NULL REFERENCES segments(id) ON DELETE CASCADE,
  pain_id UUID NOT NULL REFERENCES pains_initial(id) ON DELETE CASCADE,

  tof_ugc_hooks JSONB NOT NULL,
  mof_quiz_flow JSONB NOT NULL,
  mof_chat_script JSONB,
  bof_creative_briefs JSONB NOT NULL,
  bof_landing_structure JSONB NOT NULL,

  approved_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT unique_strategy_personalized UNIQUE (project_id, segment_id, pain_id)
);

-- =============================================================
-- STRATEGY GLOBAL (per project)
-- Email, SMS, Messenger, Social, Banners, Traffic Channels
-- =============================================================

CREATE TABLE strategy_global_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- Channel strategies
  email_strategy JSONB NOT NULL,
  -- {sequence_overview, cadence, key_emails[], segmentation_logic}
  sms_strategy JSONB NOT NULL,
  -- {use_cases[], timing, message_templates[], compliance_notes}
  messenger_strategy JSONB NOT NULL,
  -- {platforms[], automation_flows[], response_templates[]}

  -- Social media strategy
  social_strategy JSONB NOT NULL,
  -- {platforms[], content_pillars[], posting_cadence, engagement_tactics[]}

  -- TOF banners strategy
  tof_banners JSONB NOT NULL,
  -- {formats[], themes[], targeting_approach, creative_guidelines[]}

  -- Traffic channels
  traffic_channels JSONB NOT NULL,
  -- {organic[], paid[], partnerships[], recommended_priority[]}

  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE strategy_global (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  email_strategy JSONB NOT NULL,
  sms_strategy JSONB NOT NULL,
  messenger_strategy JSONB NOT NULL,
  social_strategy JSONB NOT NULL,
  tof_banners JSONB NOT NULL,
  traffic_channels JSONB NOT NULL,

  approved_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT unique_strategy_global UNIQUE (project_id)
);

-- =============================================================
-- STRATEGY ADS (multi-channel, per segment × top pain)
-- =============================================================

CREATE TABLE strategy_ads_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  segment_id UUID NOT NULL REFERENCES segments(id) ON DELETE CASCADE,
  pain_id UUID NOT NULL REFERENCES pains_initial(id) ON DELETE CASCADE,

  -- Ads strategy by channel (google, pinterest, reddit, meta, tiktok, youtube, etc.)
  channels JSONB NOT NULL,
  -- {google: {...}, pinterest: {...}, reddit: {...}, meta: {...}, tiktok: {...}, youtube: {...}}

  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE strategy_ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  segment_id UUID NOT NULL REFERENCES segments(id) ON DELETE CASCADE,
  pain_id UUID NOT NULL REFERENCES pains_initial(id) ON DELETE CASCADE,

  channels JSONB NOT NULL,

  approved_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT unique_strategy_ads UNIQUE (project_id, segment_id, pain_id)
);

-- =============================================================
-- INDEXES
-- =============================================================

CREATE INDEX idx_strategy_summary_drafts_project ON strategy_summary_drafts(project_id);
CREATE INDEX idx_strategy_summary_project ON strategy_summary(project_id);
CREATE INDEX idx_strategy_personalized_drafts_project ON strategy_personalized_drafts(project_id);
CREATE INDEX idx_strategy_personalized_drafts_segment ON strategy_personalized_drafts(segment_id);
CREATE INDEX idx_strategy_personalized_drafts_pain ON strategy_personalized_drafts(pain_id);
CREATE INDEX idx_strategy_personalized_project ON strategy_personalized(project_id);
CREATE INDEX idx_strategy_personalized_segment ON strategy_personalized(segment_id);
CREATE INDEX idx_strategy_personalized_pain ON strategy_personalized(pain_id);
CREATE INDEX idx_strategy_global_drafts_project ON strategy_global_drafts(project_id);
CREATE INDEX idx_strategy_global_project ON strategy_global(project_id);
CREATE INDEX idx_strategy_ads_drafts_project ON strategy_ads_drafts(project_id);
CREATE INDEX idx_strategy_ads_drafts_segment ON strategy_ads_drafts(segment_id);
CREATE INDEX idx_strategy_ads_drafts_pain ON strategy_ads_drafts(pain_id);
CREATE INDEX idx_strategy_ads_project ON strategy_ads(project_id);
CREATE INDEX idx_strategy_ads_segment ON strategy_ads(segment_id);
CREATE INDEX idx_strategy_ads_pain ON strategy_ads(pain_id);

-- =============================================================
-- RLS POLICIES
-- =============================================================

ALTER TABLE strategy_summary_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategy_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategy_personalized_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategy_personalized ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategy_global_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategy_global ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategy_ads_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategy_ads ENABLE ROW LEVEL SECURITY;

-- User policies (owner + project members)
CREATE POLICY "Users can manage own strategy_summary_drafts" ON strategy_summary_drafts
  FOR ALL USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
    OR project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can manage own strategy_summary" ON strategy_summary
  FOR ALL USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
    OR project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can manage own strategy_personalized_drafts" ON strategy_personalized_drafts
  FOR ALL USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
    OR project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can manage own strategy_personalized" ON strategy_personalized
  FOR ALL USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
    OR project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can manage own strategy_global_drafts" ON strategy_global_drafts
  FOR ALL USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
    OR project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can manage own strategy_global" ON strategy_global
  FOR ALL USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
    OR project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can manage own strategy_ads_drafts" ON strategy_ads_drafts
  FOR ALL USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
    OR project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can manage own strategy_ads" ON strategy_ads
  FOR ALL USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
    OR project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid())
  );

-- Service role policies
CREATE POLICY "Service role full access strategy_summary_drafts" ON strategy_summary_drafts
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access strategy_summary" ON strategy_summary
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access strategy_personalized_drafts" ON strategy_personalized_drafts
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access strategy_personalized" ON strategy_personalized
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access strategy_global_drafts" ON strategy_global_drafts
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access strategy_global" ON strategy_global
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access strategy_ads_drafts" ON strategy_ads_drafts
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access strategy_ads" ON strategy_ads
  FOR ALL USING (auth.role() = 'service_role');
