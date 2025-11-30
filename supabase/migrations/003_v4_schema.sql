-- =====================================================
-- Audience Research Tool v4 - Complete Schema Migration
-- Run this in Supabase SQL Editor
-- Reference: audience-research-tool-v4-complete.md
-- =====================================================

-- ================================================
-- STEP 1: ALTER PROJECTS TABLE - Add current_step
-- ================================================

ALTER TABLE projects ADD COLUMN IF NOT EXISTS current_step TEXT DEFAULT 'onboarding';

-- ================================================
-- BLOCK 1: PORTRAIT (8 tables)
-- ================================================

-- Prompt 1: Validation
CREATE TABLE IF NOT EXISTS validation_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,

  what_brand_sells TEXT,
  problem_solved TEXT,
  key_differentiator TEXT,
  understanding_correct BOOLEAN,
  clarification_needed TEXT,

  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS validation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,

  what_brand_sells TEXT,
  problem_solved TEXT,
  key_differentiator TEXT,
  understanding_correct BOOLEAN,

  approved_at TIMESTAMPTZ DEFAULT now()
);

-- Prompt 2: Portrait
CREATE TABLE IF NOT EXISTS portrait_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,

  sociodemographics TEXT,
  psychographics TEXT,

  age_range TEXT,
  gender_distribution TEXT,
  income_level TEXT,
  education TEXT,
  location TEXT,
  occupation TEXT,
  family_status TEXT,

  values_beliefs JSONB,
  lifestyle_habits JSONB,
  interests_hobbies JSONB,
  personality_traits JSONB,

  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS portrait (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,

  sociodemographics TEXT,
  psychographics TEXT,

  age_range TEXT,
  gender_distribution TEXT,
  income_level TEXT,
  education TEXT,
  location TEXT,
  occupation TEXT,
  family_status TEXT,

  values_beliefs JSONB,
  lifestyle_habits JSONB,
  interests_hobbies JSONB,
  personality_traits JSONB,

  approved_at TIMESTAMPTZ DEFAULT now()
);

-- Prompt 3: Portrait Review
CREATE TABLE IF NOT EXISTS portrait_review_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,

  original_portrait_id UUID REFERENCES portrait_drafts(id),

  what_to_change JSONB,
  what_to_add JSONB,
  what_to_remove JSONB,
  reasoning TEXT,

  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS portrait_review (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,

  what_to_change JSONB,
  what_to_add JSONB,
  what_to_remove JSONB,
  reasoning TEXT,

  approved_at TIMESTAMPTZ DEFAULT now()
);

-- Prompt 4: Portrait Final
CREATE TABLE IF NOT EXISTS portrait_final_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,

  sociodemographics TEXT,
  psychographics TEXT,

  age_range TEXT,
  gender_distribution TEXT,
  income_level TEXT,
  education TEXT,
  location TEXT,
  occupation TEXT,
  family_status TEXT,

  values_beliefs JSONB,
  lifestyle_habits JSONB,
  interests_hobbies JSONB,
  personality_traits JSONB,

  changes_applied JSONB,

  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS portrait_final (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,

  sociodemographics TEXT,
  psychographics TEXT,

  age_range TEXT,
  gender_distribution TEXT,
  income_level TEXT,
  education TEXT,
  location TEXT,
  occupation TEXT,
  family_status TEXT,

  values_beliefs JSONB,
  lifestyle_habits JSONB,
  interests_hobbies JSONB,
  personality_traits JSONB,

  approved_at TIMESTAMPTZ DEFAULT now()
);

-- ================================================
-- BLOCK 2: DEEP ANALYSIS (8 tables)
-- ================================================

-- Prompt 5: Jobs to Be Done
CREATE TABLE IF NOT EXISTS jobs_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,

  functional_jobs JSONB,
  emotional_jobs JSONB,
  social_jobs JSONB,

  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,

  functional_jobs JSONB,
  emotional_jobs JSONB,
  social_jobs JSONB,

  approved_at TIMESTAMPTZ DEFAULT now()
);

-- Prompt 6: Product Preferences
CREATE TABLE IF NOT EXISTS preferences_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,

  preferences JSONB,

  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,

  preferences JSONB,

  approved_at TIMESTAMPTZ DEFAULT now()
);

-- Prompt 7: Difficulties
CREATE TABLE IF NOT EXISTS difficulties_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,

  difficulties JSONB,

  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS difficulties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,

  difficulties JSONB,

  approved_at TIMESTAMPTZ DEFAULT now()
);

-- Prompt 8: Deep Triggers
CREATE TABLE IF NOT EXISTS triggers_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,

  triggers JSONB,

  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS triggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,

  triggers JSONB,

  approved_at TIMESTAMPTZ DEFAULT now()
);

-- ================================================
-- BLOCK 3: SEGMENTATION (6 tables)
-- ================================================

-- Prompt 9: Segments
CREATE TABLE IF NOT EXISTS segments_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,

  segment_index INTEGER,
  name TEXT,
  description TEXT,
  sociodemographics TEXT,

  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS segments_initial (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,

  segment_index INTEGER,
  name TEXT,
  description TEXT,
  sociodemographics TEXT,

  approved_at TIMESTAMPTZ DEFAULT now()
);

-- Prompt 10: Segments Review
CREATE TABLE IF NOT EXISTS segments_review_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,

  segment_overlaps JSONB,
  too_broad JSONB,
  too_narrow JSONB,
  missing_segments JSONB,
  recommendations JSONB,

  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS segments_review (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,

  segment_overlaps JSONB,
  too_broad JSONB,
  too_narrow JSONB,
  missing_segments JSONB,
  recommendations JSONB,

  approved_at TIMESTAMPTZ DEFAULT now()
);

-- Prompt 11: Segment Details
CREATE TABLE IF NOT EXISTS segment_details_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  segment_id UUID,

  needs JSONB,
  triggers JSONB,
  core_values JSONB,
  awareness_level TEXT CHECK (awareness_level IN ('unaware', 'problem_aware', 'solution_aware', 'product_aware', 'most_aware')),
  objections JSONB,

  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS segment_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  segment_id UUID,

  needs JSONB,
  triggers JSONB,
  core_values JSONB,
  awareness_level TEXT,
  objections JSONB,

  approved_at TIMESTAMPTZ DEFAULT now()
);

-- ================================================
-- BLOCK 4: PAINS (8 tables)
-- ================================================

-- Prompt 12: Pains
CREATE TABLE IF NOT EXISTS pains_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  segment_id UUID,

  pain_index INTEGER,
  name TEXT,
  description TEXT,
  deep_triggers JSONB,
  examples JSONB,

  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pains_initial (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  segment_id UUID,

  pain_index INTEGER,
  name TEXT,
  description TEXT,
  deep_triggers JSONB,
  examples JSONB,

  approved_at TIMESTAMPTZ DEFAULT now()
);

-- Prompt 13: Pains Ranking
CREATE TABLE IF NOT EXISTS pains_ranking_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  pain_id UUID,

  impact_score INTEGER CHECK (impact_score BETWEEN 1 AND 10),
  is_top_pain BOOLEAN DEFAULT false,
  ranking_reasoning TEXT,

  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pains_ranking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  pain_id UUID,

  impact_score INTEGER,
  is_top_pain BOOLEAN,
  ranking_reasoning TEXT,

  approved_at TIMESTAMPTZ DEFAULT now()
);

-- Prompt 14: Canvas
CREATE TABLE IF NOT EXISTS canvas_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  pain_id UUID,

  emotional_aspects JSONB,
  behavioral_patterns JSONB,
  buying_signals JSONB,

  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS canvas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  pain_id UUID,

  emotional_aspects JSONB,
  behavioral_patterns JSONB,
  buying_signals JSONB,

  approved_at TIMESTAMPTZ DEFAULT now()
);

-- Prompt 15: Canvas Extended
CREATE TABLE IF NOT EXISTS canvas_extended_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  canvas_id UUID,

  extended_analysis TEXT,
  different_angles JSONB,
  journey_description TEXT,
  emotional_peaks TEXT,
  purchase_moment TEXT,
  post_purchase TEXT,

  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS canvas_extended (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  canvas_id UUID,

  extended_analysis TEXT,
  different_angles JSONB,
  journey_description TEXT,
  emotional_peaks TEXT,
  purchase_moment TEXT,
  post_purchase TEXT,

  approved_at TIMESTAMPTZ DEFAULT now()
);

-- ================================================
-- FINAL REPORT TABLES (3 tables)
-- Note: segments and pains tables already exist, we'll modify them
-- ================================================

-- Audience final table (new)
CREATE TABLE IF NOT EXISTS audience (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,

  -- From validation
  product_understanding JSONB,

  -- From portrait_final
  sociodemographics TEXT,
  psychographics TEXT,
  demographics_detailed JSONB,

  -- From jobs
  jobs_to_be_done JSONB,

  -- From preferences
  product_preferences JSONB,

  -- From difficulties
  difficulties JSONB,

  -- From triggers
  deep_triggers JSONB,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add updated_at trigger for audience table
CREATE TRIGGER update_audience_updated_at
  BEFORE UPDATE ON audience
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Modify existing segments table to add v4 columns
ALTER TABLE segments
  ADD COLUMN IF NOT EXISTS awareness_level TEXT,
  ADD COLUMN IF NOT EXISTS objections JSONB;

-- Modify existing pains table to add v4 columns
ALTER TABLE pains
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS impact_score INTEGER,
  ADD COLUMN IF NOT EXISTS is_top_pain BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS canvas_emotional_aspects JSONB,
  ADD COLUMN IF NOT EXISTS canvas_behavioral_patterns JSONB,
  ADD COLUMN IF NOT EXISTS canvas_buying_signals JSONB,
  ADD COLUMN IF NOT EXISTS canvas_extended_analysis TEXT;
