-- =====================================================
-- Migration 016: Channel Strategy Module
-- Tracks WHERE to find audience, WHEN they're active, WHAT content they consume
-- =====================================================

-- Drop existing indexes if they exist (for clean migration)
DROP INDEX IF EXISTS idx_channel_strategy_drafts_project_segment;
DROP INDEX IF EXISTS idx_channel_strategy_drafts_project;
DROP INDEX IF EXISTS idx_channel_strategy_drafts_segment;
DROP INDEX IF EXISTS idx_channel_strategy_project_segment;
DROP INDEX IF EXISTS idx_channel_strategy_project;
DROP INDEX IF EXISTS idx_channel_strategy_segment;

-- Drop existing tables if they exist (for clean migration)
DROP TABLE IF EXISTS channel_strategy_drafts CASCADE;
DROP TABLE IF EXISTS channel_strategy CASCADE;

-- =====================================================
-- channel_strategy_drafts table
-- =====================================================

CREATE TABLE channel_strategy_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  segment_id UUID NOT NULL REFERENCES segments(id) ON DELETE CASCADE,

  -- WHERE and WHEN: Primary platforms where segment is active
  -- [{platform, usage_frequency, activity_type, peak_activity_times[], why_they_use_it}]
  primary_platforms JSONB NOT NULL,

  -- WHAT: Content formats and preferences
  -- [{format, context, attention_span, triggering_topics[]}]
  content_preferences JSONB NOT NULL,

  -- WHO: Trusted sources and influencers
  -- [{source_type, specific_examples[], why_trusted}]
  trusted_sources JSONB,

  -- WHERE (community): Communities and groups
  -- [{type, specific_names[], participation_level, influence_on_purchases}]
  communities JSONB,

  -- HOW: Search and discovery patterns
  -- {typical_queries[], search_depth, decision_timeline}
  search_patterns JSONB,

  -- RESPONSE: How they react to advertising
  -- {channels_they_notice[], ad_formats_that_work[], ad_formats_that_annoy[], retargeting_tolerance}
  advertising_response JSONB,

  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- channel_strategy table (approved)
-- =====================================================

CREATE TABLE channel_strategy (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  segment_id UUID NOT NULL REFERENCES segments(id) ON DELETE CASCADE,

  -- WHERE and WHEN: Primary platforms where segment is active
  -- [{platform, usage_frequency, activity_type, peak_activity_times[], why_they_use_it}]
  primary_platforms JSONB NOT NULL,

  -- WHAT: Content formats and preferences
  -- [{format, context, attention_span, triggering_topics[]}]
  content_preferences JSONB NOT NULL,

  -- WHO: Trusted sources and influencers
  -- [{source_type, specific_examples[], why_trusted}]
  trusted_sources JSONB,

  -- WHERE (community): Communities and groups
  -- [{type, specific_names[], participation_level, influence_on_purchases}]
  communities JSONB,

  -- HOW: Search and discovery patterns
  -- {typical_queries[], search_depth, decision_timeline}
  search_patterns JSONB,

  -- RESPONSE: How they react to advertising
  -- {channels_they_notice[], ad_formats_that_work[], ad_formats_that_annoy[], retargeting_tolerance}
  advertising_response JSONB,

  approved_at TIMESTAMPTZ DEFAULT now(),

  -- Ensure one approved record per project-segment pair
  CONSTRAINT unique_channel_strategy_project_segment UNIQUE (project_id, segment_id)
);

-- =====================================================
-- Indexes for performance
-- =====================================================

-- Drafts indexes
CREATE INDEX idx_channel_strategy_drafts_project ON channel_strategy_drafts(project_id);
CREATE INDEX idx_channel_strategy_drafts_segment ON channel_strategy_drafts(segment_id);
CREATE INDEX idx_channel_strategy_drafts_project_segment ON channel_strategy_drafts(project_id, segment_id);

-- Approved indexes
CREATE INDEX idx_channel_strategy_project ON channel_strategy(project_id);
CREATE INDEX idx_channel_strategy_segment ON channel_strategy(segment_id);
CREATE INDEX idx_channel_strategy_project_segment ON channel_strategy(project_id, segment_id);

-- =====================================================
-- RLS Policies for channel_strategy_drafts
-- =====================================================

ALTER TABLE channel_strategy_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own channel_strategy_drafts" ON channel_strategy_drafts
  FOR SELECT USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own channel_strategy_drafts" ON channel_strategy_drafts
  FOR INSERT WITH CHECK (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own channel_strategy_drafts" ON channel_strategy_drafts
  FOR UPDATE USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete own channel_strategy_drafts" ON channel_strategy_drafts
  FOR DELETE USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

-- =====================================================
-- RLS Policies for channel_strategy
-- =====================================================

ALTER TABLE channel_strategy ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own channel_strategy" ON channel_strategy
  FOR SELECT USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own channel_strategy" ON channel_strategy
  FOR INSERT WITH CHECK (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own channel_strategy" ON channel_strategy
  FOR UPDATE USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete own channel_strategy" ON channel_strategy
  FOR DELETE USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

-- =====================================================
-- Service role policies (for API routes)
-- =====================================================

CREATE POLICY "Service role full access to channel_strategy_drafts" ON channel_strategy_drafts
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to channel_strategy" ON channel_strategy
  FOR ALL USING (auth.role() = 'service_role');
