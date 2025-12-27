-- =============================================================
-- Migration 036: V7 Playbooks Module
-- Tables: playbooks_canvas_drafts, playbooks_canvas,
--         playbooks_funnel_drafts, playbooks_funnel
-- =============================================================
-- This module creates tactical playbooks for each segment × pain combination:
-- - Canvas: Hero, Insight, Ritual, Proof, CTA sections
-- - Funnel: ToF, MoF, BoF assets for content marketing
-- =============================================================

-- =============================================================
-- PLAYBOOKS CANVAS (per segment × pain)
-- =============================================================

CREATE TABLE playbooks_canvas_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  segment_id UUID NOT NULL REFERENCES segments(id) ON DELETE CASCADE,
  pain_id UUID NOT NULL REFERENCES pains_initial(id) ON DELETE CASCADE,

  -- Hero Section: Above-the-fold messaging
  hero_section JSONB NOT NULL,
  -- {
  --   headline: string,
  --   subheadline: string,
  --   hook: string
  -- }

  -- Insight Section: Pain evidence and empathy
  insight_section JSONB NOT NULL,
  -- {
  --   pain_story: string,
  --   root_cause: string,
  --   why_now: string
  -- }

  -- Ritual Section: Product fit and transformation
  ritual_section JSONB NOT NULL,
  -- {
  --   ritual_steps: string[],
  --   how_it_fits: string
  -- }

  -- Proof Section: Trust and competitive advantage
  proof_section JSONB NOT NULL,
  -- {
  --   proof_points: string[],
  --   trust_assets: string[]
  -- }

  -- CTA Section: Call-to-action messaging
  cta_section JSONB NOT NULL,
  -- {
  --   primary_cta: string,
  --   secondary_cta: string
  -- }

  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE playbooks_canvas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  segment_id UUID NOT NULL REFERENCES segments(id) ON DELETE CASCADE,
  pain_id UUID NOT NULL REFERENCES pains_initial(id) ON DELETE CASCADE,

  hero_section JSONB NOT NULL,
  insight_section JSONB NOT NULL,
  ritual_section JSONB NOT NULL,
  proof_section JSONB NOT NULL,
  cta_section JSONB NOT NULL,

  approved_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT unique_playbooks_canvas UNIQUE (project_id, segment_id, pain_id)
);

-- =============================================================
-- PLAYBOOKS FUNNEL (per segment × pain)
-- =============================================================

CREATE TABLE playbooks_funnel_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  segment_id UUID NOT NULL REFERENCES segments(id) ON DELETE CASCADE,
  pain_id UUID NOT NULL REFERENCES pains_initial(id) ON DELETE CASCADE,

  -- Top of Funnel: Awareness content
  tof_assets JSONB NOT NULL,
  -- [
  --   {
  --     asset_type: string,
  --     title: string,
  --     description: string,
  --     format: string,
  --     cta: string
  --   }
  -- ]

  -- Middle of Funnel: Consideration content
  mof_assets JSONB NOT NULL,
  -- [
  --   {
  --     asset_type: string,
  --     title: string,
  --     description: string,
  --     format: string,
  --     cta: string
  --   }
  -- ]

  -- Bottom of Funnel: Conversion content
  bof_assets JSONB NOT NULL,
  -- [
  --   {
  --     asset_type: string,
  --     title: string,
  --     description: string,
  --     format: string,
  --     cta: string
  --   }
  -- ]

  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE playbooks_funnel (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  segment_id UUID NOT NULL REFERENCES segments(id) ON DELETE CASCADE,
  pain_id UUID NOT NULL REFERENCES pains_initial(id) ON DELETE CASCADE,

  tof_assets JSONB NOT NULL,
  mof_assets JSONB NOT NULL,
  bof_assets JSONB NOT NULL,

  approved_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT unique_playbooks_funnel UNIQUE (project_id, segment_id, pain_id)
);

-- =============================================================
-- INDEXES
-- =============================================================

-- Playbooks Canvas Drafts Indexes
CREATE INDEX idx_playbooks_canvas_drafts_project ON playbooks_canvas_drafts(project_id);
CREATE INDEX idx_playbooks_canvas_drafts_segment ON playbooks_canvas_drafts(segment_id);
CREATE INDEX idx_playbooks_canvas_drafts_pain ON playbooks_canvas_drafts(pain_id);
CREATE INDEX idx_playbooks_canvas_drafts_project_segment ON playbooks_canvas_drafts(project_id, segment_id);
CREATE INDEX idx_playbooks_canvas_drafts_segment_pain ON playbooks_canvas_drafts(segment_id, pain_id);

-- Playbooks Canvas Indexes
CREATE INDEX idx_playbooks_canvas_project ON playbooks_canvas(project_id);
CREATE INDEX idx_playbooks_canvas_segment ON playbooks_canvas(segment_id);
CREATE INDEX idx_playbooks_canvas_pain ON playbooks_canvas(pain_id);
CREATE INDEX idx_playbooks_canvas_project_segment ON playbooks_canvas(project_id, segment_id);
CREATE INDEX idx_playbooks_canvas_segment_pain ON playbooks_canvas(segment_id, pain_id);

-- Playbooks Funnel Drafts Indexes
CREATE INDEX idx_playbooks_funnel_drafts_project ON playbooks_funnel_drafts(project_id);
CREATE INDEX idx_playbooks_funnel_drafts_segment ON playbooks_funnel_drafts(segment_id);
CREATE INDEX idx_playbooks_funnel_drafts_pain ON playbooks_funnel_drafts(pain_id);
CREATE INDEX idx_playbooks_funnel_drafts_project_segment ON playbooks_funnel_drafts(project_id, segment_id);
CREATE INDEX idx_playbooks_funnel_drafts_segment_pain ON playbooks_funnel_drafts(segment_id, pain_id);

-- Playbooks Funnel Indexes
CREATE INDEX idx_playbooks_funnel_project ON playbooks_funnel(project_id);
CREATE INDEX idx_playbooks_funnel_segment ON playbooks_funnel(segment_id);
CREATE INDEX idx_playbooks_funnel_pain ON playbooks_funnel(pain_id);
CREATE INDEX idx_playbooks_funnel_project_segment ON playbooks_funnel(project_id, segment_id);
CREATE INDEX idx_playbooks_funnel_segment_pain ON playbooks_funnel(segment_id, pain_id);

-- =============================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================

ALTER TABLE playbooks_canvas_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE playbooks_canvas ENABLE ROW LEVEL SECURITY;
ALTER TABLE playbooks_funnel_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE playbooks_funnel ENABLE ROW LEVEL SECURITY;

-- =============================================================
-- RLS POLICIES: Playbooks Canvas Drafts
-- =============================================================

-- User policies (owner + project members)
CREATE POLICY "Users can manage own playbooks_canvas_drafts" ON playbooks_canvas_drafts
  FOR ALL USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
    OR project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid())
  );

-- Service role policies
CREATE POLICY "Service role full access playbooks_canvas_drafts" ON playbooks_canvas_drafts
  FOR ALL USING (auth.role() = 'service_role');

-- =============================================================
-- RLS POLICIES: Playbooks Canvas
-- =============================================================

-- User policies (owner + project members)
CREATE POLICY "Users can manage own playbooks_canvas" ON playbooks_canvas
  FOR ALL USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
    OR project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid())
  );

-- Service role policies
CREATE POLICY "Service role full access playbooks_canvas" ON playbooks_canvas
  FOR ALL USING (auth.role() = 'service_role');

-- =============================================================
-- RLS POLICIES: Playbooks Funnel Drafts
-- =============================================================

-- User policies (owner + project members)
CREATE POLICY "Users can manage own playbooks_funnel_drafts" ON playbooks_funnel_drafts
  FOR ALL USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
    OR project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid())
  );

-- Service role policies
CREATE POLICY "Service role full access playbooks_funnel_drafts" ON playbooks_funnel_drafts
  FOR ALL USING (auth.role() = 'service_role');

-- =============================================================
-- RLS POLICIES: Playbooks Funnel
-- =============================================================

-- User policies (owner + project members)
CREATE POLICY "Users can manage own playbooks_funnel" ON playbooks_funnel
  FOR ALL USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
    OR project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid())
  );

-- Service role policies
CREATE POLICY "Service role full access playbooks_funnel" ON playbooks_funnel
  FOR ALL USING (auth.role() = 'service_role');

-- =============================================================
-- COMMENTS
-- =============================================================

COMMENT ON TABLE playbooks_canvas_drafts IS 'V7 Playbooks: Draft canvas sections (Hero, Insight, Ritual, Proof, CTA) per segment × pain';
COMMENT ON TABLE playbooks_canvas IS 'V7 Playbooks: Approved canvas sections (Hero, Insight, Ritual, Proof, CTA) per segment × pain';
COMMENT ON TABLE playbooks_funnel_drafts IS 'V7 Playbooks: Draft funnel assets (ToF, MoF, BoF) per segment × pain';
COMMENT ON TABLE playbooks_funnel IS 'V7 Playbooks: Approved funnel assets (ToF, MoF, BoF) per segment × pain';

COMMENT ON COLUMN playbooks_canvas.hero_section IS 'Above-the-fold messaging: headline, subheadline, hook';
COMMENT ON COLUMN playbooks_canvas.insight_section IS 'Pain evidence and empathy: pain_story, root_cause, why_now';
COMMENT ON COLUMN playbooks_canvas.ritual_section IS 'Product fit and transformation: ritual_steps[], how_it_fits';
COMMENT ON COLUMN playbooks_canvas.proof_section IS 'Trust and competitive advantage: proof_points[], trust_assets[]';
COMMENT ON COLUMN playbooks_canvas.cta_section IS 'Call-to-action: primary_cta, secondary_cta';

COMMENT ON COLUMN playbooks_funnel.tof_assets IS 'Top of Funnel: Awareness content assets';
COMMENT ON COLUMN playbooks_funnel.mof_assets IS 'Middle of Funnel: Consideration content assets';
COMMENT ON COLUMN playbooks_funnel.bof_assets IS 'Bottom of Funnel: Conversion content assets';
