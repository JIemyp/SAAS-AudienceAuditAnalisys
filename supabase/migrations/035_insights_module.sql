
-- =============================================================
-- Migration 035: V7 Insights Module
-- Tables: insights_executive, insights_snapshots, insights_radar
-- =============================================================

-- =============================================================
-- INSIGHTS EXECUTIVE (per project)
-- Executive summary with growth bets, segment priorities, positioning
-- =============================================================

CREATE TABLE insights_executive_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- Growth opportunities ranked by impact
  growth_bets JSONB NOT NULL,
  -- [{title, rationale, score, key_jobs[], key_triggers[], key_pains[]}]

  -- Segment prioritization matrix
  segment_priorities JSONB NOT NULL,
  -- [{segment_id, segment_name, priority_score, market_size_estimate, urgency_level}]

  -- Positioning summary
  positioning_summary JSONB NOT NULL,
  -- {pillars[], value_proposition, differentiation}

  -- Validation questions for user
  validation_questions JSONB,
  -- [string, string, ...]

  -- Evidence trail
  evidence_sources JSONB,
  -- [{table_name, field_used, record_count}]

  -- Validation metrics
  validation_metrics JSONB,
  -- [{metric, how_to_test, expected_outcome}]

  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE insights_executive (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  growth_bets JSONB NOT NULL,
  segment_priorities JSONB NOT NULL,
  positioning_summary JSONB NOT NULL,
  validation_questions JSONB,
  evidence_sources JSONB,
  validation_metrics JSONB,

  approved_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT unique_insights_executive UNIQUE (project_id)
);

-- =============================================================
-- INSIGHTS SNAPSHOTS (per segment)
-- Quick reference cards: Who/What/Why/When + top pains/barriers
-- =============================================================

CREATE TABLE insights_snapshots_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  segment_id UUID NOT NULL REFERENCES segments(id) ON DELETE CASCADE,

  -- Core snapshot fields
  who TEXT NOT NULL,
  -- Target audience description (1-2 sentences)

  what TEXT NOT NULL,
  -- What they want (1-2 sentences)

  why TEXT NOT NULL,
  -- Underlying motivation (1-2 sentences)

  when_active TEXT NOT NULL,
  -- Timing/triggers when they're most engaged

  -- Top insights
  top_pains JSONB NOT NULL,
  -- [{pain_id: string, pain_name: string, severity: number}] - top 3-5 pains

  adoption_barriers JSONB,
  -- [{barrier: string, severity: string, mitigation: string}] - key blockers

  -- Evidence trail
  evidence_sources JSONB,
  -- [{table_name, field_used, record_count}]

  -- Validation metrics
  validation_metrics JSONB,
  -- [{metric, how_to_test, expected_outcome}]

  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE insights_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  segment_id UUID NOT NULL REFERENCES segments(id) ON DELETE CASCADE,

  who TEXT NOT NULL,
  what TEXT NOT NULL,
  why TEXT NOT NULL,
  when_active TEXT NOT NULL,
  top_pains JSONB NOT NULL,
  adoption_barriers JSONB,
  evidence_sources JSONB,
  validation_metrics JSONB,

  approved_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT unique_insights_snapshots UNIQUE (project_id, segment_id)
);

-- =============================================================
-- INSIGHTS RADAR (per project)
-- Gap analysis and risk alerts across all data
-- =============================================================

CREATE TABLE insights_radar_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  -- Jobs vs Benefits gap analysis
  jobs_vs_benefits_gap JSONB NOT NULL,
  -- {gaps[], coverage_score}
  -- gaps: [{job, missing_benefits[], severity}]

  -- Triggers vs Timeline alignment
  triggers_vs_timeline JSONB NOT NULL,
  -- {timeline_mapping[], urgency_distribution}
  -- timeline_mapping: [{trigger, expected_timeline, actual_timeline, alignment_score}]

  -- Risk alerts
  risk_alerts JSONB NOT NULL,
  -- [{risk, severity, impact, recommendation}]
  -- severity: "critical" | "warning" | "info"

  -- Evidence trail
  evidence_sources JSONB,
  -- [{table_name, field_used, record_count}]

  -- Validation metrics
  validation_metrics JSONB,
  -- [{metric, how_to_test, expected_outcome}]

  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE insights_radar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,

  jobs_vs_benefits_gap JSONB NOT NULL,
  triggers_vs_timeline JSONB NOT NULL,
  risk_alerts JSONB NOT NULL,
  evidence_sources JSONB,
  validation_metrics JSONB,

  approved_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT unique_insights_radar UNIQUE (project_id)
);

-- =============================================================
-- INDEXES
-- =============================================================

-- insights_executive
CREATE INDEX idx_insights_executive_drafts_project ON insights_executive_drafts(project_id);
CREATE INDEX idx_insights_executive_project ON insights_executive(project_id);

-- insights_snapshots
CREATE INDEX idx_insights_snapshots_drafts_project ON insights_snapshots_drafts(project_id);
CREATE INDEX idx_insights_snapshots_drafts_segment ON insights_snapshots_drafts(segment_id);
CREATE INDEX idx_insights_snapshots_project ON insights_snapshots(project_id);
CREATE INDEX idx_insights_snapshots_segment ON insights_snapshots(segment_id);

-- insights_radar
CREATE INDEX idx_insights_radar_drafts_project ON insights_radar_drafts(project_id);
CREATE INDEX idx_insights_radar_project ON insights_radar(project_id);

-- =============================================================
-- RLS POLICIES
-- =============================================================

-- Enable RLS
ALTER TABLE insights_executive_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE insights_executive ENABLE ROW LEVEL SECURITY;
ALTER TABLE insights_snapshots_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE insights_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE insights_radar_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE insights_radar ENABLE ROW LEVEL SECURITY;

-- User policies (owner + project members)
CREATE POLICY "Users can manage own insights_executive_drafts" ON insights_executive_drafts
  FOR ALL USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
    OR project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can manage own insights_executive" ON insights_executive
  FOR ALL USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
    OR project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can manage own insights_snapshots_drafts" ON insights_snapshots_drafts
  FOR ALL USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
    OR project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can manage own insights_snapshots" ON insights_snapshots
  FOR ALL USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
    OR project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can manage own insights_radar_drafts" ON insights_radar_drafts
  FOR ALL USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
    OR project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can manage own insights_radar" ON insights_radar
  FOR ALL USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
    OR project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid())
  );

-- Service role policies
CREATE POLICY "Service role full access insights_executive_drafts" ON insights_executive_drafts
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access insights_executive" ON insights_executive
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access insights_snapshots_drafts" ON insights_snapshots_drafts
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access insights_snapshots" ON insights_snapshots
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access insights_radar_drafts" ON insights_radar_drafts
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access insights_radar" ON insights_radar
  FOR ALL USING (auth.role() = 'service_role');

-- =============================================================
-- TRIGGERS: auto-update updated_at
-- =============================================================

CREATE OR REPLACE FUNCTION update_insights_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- insights_executive
CREATE TRIGGER trigger_insights_executive_drafts_updated_at
  BEFORE UPDATE ON insights_executive_drafts
  FOR EACH ROW
  EXECUTE FUNCTION update_insights_updated_at();

CREATE TRIGGER trigger_insights_executive_updated_at
  BEFORE UPDATE ON insights_executive
  FOR EACH ROW
  EXECUTE FUNCTION update_insights_updated_at();

-- insights_snapshots
CREATE TRIGGER trigger_insights_snapshots_drafts_updated_at
  BEFORE UPDATE ON insights_snapshots_drafts
  FOR EACH ROW
  EXECUTE FUNCTION update_insights_updated_at();

CREATE TRIGGER trigger_insights_snapshots_updated_at
  BEFORE UPDATE ON insights_snapshots
  FOR EACH ROW
  EXECUTE FUNCTION update_insights_updated_at();

-- insights_radar
CREATE TRIGGER trigger_insights_radar_drafts_updated_at
  BEFORE UPDATE ON insights_radar_drafts
  FOR EACH ROW
  EXECUTE FUNCTION update_insights_updated_at();

CREATE TRIGGER trigger_insights_radar_updated_at
  BEFORE UPDATE ON insights_radar
  FOR EACH ROW
  EXECUTE FUNCTION update_insights_updated_at();
