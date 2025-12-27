# Implementation Plan V6: Dashboard + Strategy + UGC + Communications

**Дата:** 2024-12-19
**Статус:** Готов к реализации
**Оценка:** ~21 рабочих дней (7 спринтов)

---

## Обзор проекта

**Цель:** Расширить AudienceAuditAnalisys с 6 новыми модулями:
1. Dashboard (расширение) — Research Health + Strategic Highlights + Alerts
2. Strategy (новый) — Summary + Персонализированная + Глобальная + Ads стратегии
3. UGC Creator Dock (новый) — Портреты креаторов + Tracking
4. Communications (доделка) — Wire данные + Воронки TOF→MOF→BOF
5. Data & Ops (новый) — Coverage matrix + Alerts + Batch actions
6. Access Control (новый) — Page-level доступы + UGC Specialist роль

**Scope:** Только top pains (is_top_pain = true)
**Язык output:** English + переводы через существующий hook
**Storage:** Draft/Approved pattern (как существующие модули)
**Access:** Каждый экран может быть открыт/закрыт при шаринге проекта

---

## Принципы качества (обязательные)

1) Качество выше скорости: не сокращать выводы ради тайминга.  
2) Глубина важнее объема: per-segment + per-pain генерации предпочтительнее.  
3) Только approved данные для генерации.  
4) Полная трассируемость: каждое решение должно ссылаться на Evidence Sources.  
5) Все подсказки/гайд-блоки должны объяснять “что это” и “что делать дальше”.

---

## Связь V6 и V7

- V6 = основной roadmap (Dashboard, Strategy, UGC, Communications, Data & Ops, Access Control).  
- V7 = детальный под‑план для Insights/Playbooks.  
- V7 выполняется внутри V6, когда доходим до этапа Insights/Playbooks.
- V7 содержит: dependency matrix per component, per‑tab missing‑data guides, QA JSON examples.

---

## Data Dependency Map (V6 modules)

Strategy Summary (project):
- portrait_final, segments, jobs, triggers, pains_ranking, channel_strategy, pricing_psychology, trust_framework, competitive_intelligence, jtbd_context

Strategy Personalized (segment x top pain):
- segment_details, pain, canvas_extended, channel_strategy, trust_framework, jtbd_context

Strategy Global (project):
- portrait_final, segments, top pains, channel_strategy, competitive_intelligence, pricing_psychology, jtbd_context

Strategy Ads (segment x top pain):
- channel_strategy, pricing_psychology, competitive_intelligence, pain, segment_details

Communications (segment x top pain):
- segment_details, jobs, preferences, triggers, canvas_extended, trust_framework, channel_strategy, jtbd_context

UGC Creators (segment):
- segment_details, portrait_final, top pains, canvas_extended, channel_strategy, trust_framework, jtbd_context

Data & Ops:
- steps status + drafts/approved coverage across all modules

---

## Field-Level Data Map (V6 modules)

Strategy Summary:
- portrait_final: positioning cues, key differentiators
- jobs: frequency, why_it_matters
- triggers: urgency, timing context
- pains_ranking: impact_score, is_top_pain
- channel_strategy: preferred channels, content formats
- pricing_psychology: price sensitivity, spending sweet spot
- trust_framework: trust signals, objections
- competitive_intelligence: weak points, switching barriers
- jtbd_context: job priorities and dependencies

Strategy Personalized:
- segment_details: psychographics, buying behavior
- canvas_extended: narrative angles, messaging framework
- jtbd_context: job context + hiring anxieties
- trust_framework: objections + proof angles
- channel_strategy: platform usage + content preference
- pricing_psychology: offer framing and price anchors

Strategy Global:
- portrait_final: brand voice cues
- segments: macro personas
- pains_ranking: top pains by project
- channel_strategy: platform mix
- competitive_intelligence: category beliefs
- pricing_psychology: price positioning

Strategy Ads:
- channel_strategy: platform-level behavior
- pricing_psychology: price sensitivity + anchors
- competitive_intelligence: competitor angles
- pains_ranking: pain framing
- segment_details: targeting nuances

Communications:
- triggers: timing + urgency
- preferences: content formats + attention span
- jobs: messaging intent
- canvas_extended: story/angle
- trust_framework: proof assets
- channel_strategy: channel-by-channel cadence

UGC Creators:
- portrait_final: persona traits
- segment_details: audience archetype
- pains_ranking: topic prioritization
- canvas_extended: story hooks
- trust_framework: proof elements to include

Data & Ops:
- steps: completion status per module
- drafts/approved: coverage and gaps

---

## Missing Data Handling (UX rules)

- If required tables are missing, show a clear empty-state with:
  - What is missing (table + step name)
  - Link to the correct generation step (plain link, no action button)
  - Short explanation of why it is needed
- Do not generate partial outputs without required inputs.
- Evidence Sources block must list only tables actually used.
- Per‑tab guidance and next steps are defined in V7 and must be mirrored in UI.

---

## PHASE 1: DATABASE MIGRATIONS

**Важно:** RLS policies должны учитывать `project_members` (owner/editor/viewer/ugc_specialist), а не только owner.
Пример:
`USING (project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid() AND accepted_at IS NOT NULL) OR project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()))`

### Migration 030: Strategy Module

**Файл:** `supabase/migrations/030_strategy_module.sql`

```sql
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
CREATE INDEX idx_strategy_global_drafts_project ON strategy_global_drafts(project_id);
CREATE INDEX idx_strategy_global_project ON strategy_global(project_id);
CREATE INDEX idx_strategy_ads_drafts_project ON strategy_ads_drafts(project_id);
CREATE INDEX idx_strategy_ads_drafts_segment ON strategy_ads_drafts(segment_id);
CREATE INDEX idx_strategy_ads_drafts_pain ON strategy_ads_drafts(pain_id);
CREATE INDEX idx_strategy_ads_project ON strategy_ads(project_id);
CREATE INDEX idx_strategy_ads_segment ON strategy_ads(segment_id);

-- =============================================================
-- RLS POLICIES (по шаблону channel_strategy)
-- =============================================================

ALTER TABLE strategy_summary_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategy_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategy_personalized_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategy_personalized ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategy_global_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategy_global ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategy_ads_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE strategy_ads ENABLE ROW LEVEL SECURITY;

-- User policies
CREATE POLICY "Users can manage own strategy_summary_drafts" ON strategy_summary_drafts
  FOR ALL USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));
CREATE POLICY "Users can manage own strategy_summary" ON strategy_summary
  FOR ALL USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));
CREATE POLICY "Users can manage own strategy_personalized_drafts" ON strategy_personalized_drafts
  FOR ALL USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));
CREATE POLICY "Users can manage own strategy_personalized" ON strategy_personalized
  FOR ALL USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));
CREATE POLICY "Users can manage own strategy_global_drafts" ON strategy_global_drafts
  FOR ALL USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));
CREATE POLICY "Users can manage own strategy_global" ON strategy_global
  FOR ALL USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));
CREATE POLICY "Users can manage own strategy_ads_drafts" ON strategy_ads_drafts
  FOR ALL USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));
CREATE POLICY "Users can manage own strategy_ads" ON strategy_ads
  FOR ALL USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

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

-- NOTE: Update user policies to include project_members (owner/editor/viewer/ugc_specialist),
-- not only project owner. Use the same pattern as existing member-aware policies.
```

---

### Migration 031: UGC Creators

**Файл:** `supabase/migrations/031_ugc_creators.sql`

```sql
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

-- Indexes
CREATE INDEX idx_ugc_creator_profiles_drafts_project ON ugc_creator_profiles_drafts(project_id);
CREATE INDEX idx_ugc_creator_profiles_project ON ugc_creator_profiles(project_id);
CREATE INDEX idx_ugc_creator_tracking_project ON ugc_creator_tracking(project_id);
CREATE INDEX idx_ugc_creator_tracking_segment ON ugc_creator_tracking(segment_id);
CREATE INDEX idx_ugc_creator_tracking_status ON ugc_creator_tracking(status);

-- RLS Policies
ALTER TABLE ugc_creator_profiles_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ugc_creator_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ugc_creator_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own ugc_creator_profiles_drafts" ON ugc_creator_profiles_drafts
  FOR ALL USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));
CREATE POLICY "Users can manage own ugc_creator_profiles" ON ugc_creator_profiles
  FOR ALL USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));
CREATE POLICY "Users can manage own ugc_creator_tracking" ON ugc_creator_tracking
  FOR ALL USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "Service role full access ugc_creator_profiles_drafts" ON ugc_creator_profiles_drafts
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access ugc_creator_profiles" ON ugc_creator_profiles
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access ugc_creator_tracking" ON ugc_creator_tracking
  FOR ALL USING (auth.role() = 'service_role');

-- NOTE: ugc_specialist role should have access to ugc_creator_profiles* + ugc_creator_tracking.
```

---

### Migration 032: Communications Module

**Файл:** `supabase/migrations/032_communications_module.sql`

```sql
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

-- Indexes
CREATE INDEX idx_communications_funnel_drafts_project ON communications_funnel_drafts(project_id);
CREATE INDEX idx_communications_funnel_drafts_segment ON communications_funnel_drafts(segment_id);
CREATE INDEX idx_communications_funnel_project ON communications_funnel(project_id);
CREATE INDEX idx_communications_funnel_segment ON communications_funnel(segment_id);

-- RLS Policies
ALTER TABLE communications_funnel_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE communications_funnel ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own communications_funnel_drafts" ON communications_funnel_drafts
  FOR ALL USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));
CREATE POLICY "Users can manage own communications_funnel" ON communications_funnel
  FOR ALL USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "Service role full access communications_funnel_drafts" ON communications_funnel_drafts
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access communications_funnel" ON communications_funnel
  FOR ALL USING (auth.role() = 'service_role');
```

---

### Migration 033: Page Access Control

**Файл:** `supabase/migrations/033_page_access_control.sql`

```sql
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

-- Indexes
CREATE INDEX idx_project_page_access_project ON project_page_access(project_id);
CREATE INDEX idx_project_member_page_access_member ON project_member_page_access(project_member_id);

-- RLS
ALTER TABLE project_page_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_member_page_access ENABLE ROW LEVEL SECURITY;

-- Policies (owner/editor can manage; viewer read-only)
-- Implement using project_members + role checks.

-- Default seeding:
-- 1) On project creation: insert all page_key rows with is_enabled=true
-- 2) Backfill existing projects with default enabled pages
```

**Page keys (пример):**
`dashboard, overview, report, explorer, strategy, communications, playbooks, paid-ads, ugc-creators, data-ops, settings, export`

---

## PHASE 2: TYPESCRIPT TYPES

### Новые типы в `src/types/index.ts`

```typescript
// =============================================================
// STRATEGY TYPES
// =============================================================

export interface StrategyGrowthBet {
  title: string;
  rationale: string;
  score: number;
  key_jobs: string[];
  key_triggers: string[];
  key_pains: string[];
}

export interface StrategyPositioningPillar {
  pillar: string;
  proof_points: string[];
  objections: string[];
}

export interface StrategyChannelPriority {
  channel: string;
  why: string;
  fit_score: number;
  segments: string[];
}

export interface StrategyRiskFlag {
  risk: string;
  impact: string;
  mitigation: string;
}

export interface StrategySummary {
  id: string;
  project_id: string;
  growth_bets: StrategyGrowthBet[];
  positioning_pillars: StrategyPositioningPillar[];
  channel_priorities: StrategyChannelPriority[];
  risk_flags: StrategyRiskFlag[] | null;
  approved_at?: string;
}

export interface StrategySummaryDraft extends Omit<StrategySummary, 'approved_at'> {
  version: number;
  created_at: string;
}

// TOF - UGC Hooks
export interface TOFUGCHook {
  hook_type: 'problem_agitation' | 'curiosity' | 'transformation' | 'social_proof';
  script_outline: string;
  emotional_angle: string;
  visual_direction: string;
  cta: string;
}

// MOF - Quiz Flow
export interface MOFQuizFlow {
  quiz_title: string;
  questions: Array<{
    question: string;
    options: string[];
    segment_logic?: string;
  }>;
  branching_logic: string;
  lead_magnet: string;
}

// MOF - Chat Script
export interface MOFChatScript {
  opening_message: string;
  discovery_questions: string[];
  objection_handlers: Array<{
    objection: string;
    response: string;
  }>;
  handoff_trigger: string;
}

// BOF - Creative Brief
export interface BOFCreativeBrief {
  format: 'static' | 'video' | 'carousel';
  headline: string;
  body: string;
  visual_concept: string;
  cta: string;
  target_placement: 'feed' | 'stories' | 'reels';
}

// BOF - Landing Structure
export interface BOFLandingStructure {
  hero_headline: string;
  hero_subheadline: string;
  pain_section: string;
  solution_section: string;
  proof_section: string;
  cta_section: string;
}

// Strategy Personalized
export interface StrategyPersonalized {
  id: string;
  project_id: string;
  segment_id: string;
  pain_id: string;
  tof_ugc_hooks: TOFUGCHook[];
  mof_quiz_flow: MOFQuizFlow;
  mof_chat_script: MOFChatScript | null;
  bof_creative_briefs: BOFCreativeBrief[];
  bof_landing_structure: BOFLandingStructure;
  approved_at?: string;
}

export interface StrategyPersonalizedDraft extends Omit<StrategyPersonalized, 'approved_at'> {
  version: number;
  created_at: string;
}

// Strategy Global
export interface EmailStrategy {
  sequence_overview: string;
  cadence: string;
  key_emails: Array<{
    name: string;
    purpose: string;
    subject_line: string;
    key_content: string;
  }>;
  segmentation_logic: string;
}

export interface SMSStrategy {
  use_cases: string[];
  timing: string;
  message_templates: string[];
  compliance_notes: string;
}

export interface MessengerStrategy {
  platforms: string[];
  automation_flows: string[];
  response_templates: string[];
}

export interface SocialStrategy {
  platforms: string[];
  content_pillars: string[];
  posting_cadence: Record<string, string>;
  engagement_tactics: string[];
}

export interface TOFBanners {
  formats: string[];
  themes: string[];
  targeting_approach: string;
  creative_guidelines: string[];
}

export interface TrafficChannels {
  organic: string[];
  paid: string[];
  partnerships: string[];
  recommended_priority: string[];
}

export interface StrategyGlobal {
  id: string;
  project_id: string;
  email_strategy: EmailStrategy;
  sms_strategy: SMSStrategy;
  messenger_strategy: MessengerStrategy;
  social_strategy: SocialStrategy;
  tof_banners: TOFBanners;
  traffic_channels: TrafficChannels;
  approved_at?: string;
}

// Strategy Ads
export interface StrategyAds {
  id: string;
  project_id: string;
  segment_id: string;
  pain_id: string;
  channels: Record<string, AdsChannelStrategy>;
  approved_at?: string;
}

export interface AdsChannelStrategy {
  campaign_structure?: string;
  keyword_themes?: string[];
  ad_copy_templates?: Array<{
    headline: string;
    description: string;
    cta: string;
  }>;
  audience_targeting?: string;
  budget_allocation?: string;
  creative_specs?: string;
  pin_formats?: string[];
  campaign_types?: string[];
  placements?: string[];
  exclusions?: string[];
}

// =============================================================
// UGC CREATOR TYPES
// =============================================================

export interface UGCIdealPersona {
  name: string;
  age_range: string;
  gender: string;
  location_preference: string;
  platform_presence: string[];
  personality_traits: string[];
  visual_aesthetic: string;
  content_style: string;
}

export interface UGCContentTopic {
  topic: string;
  source_pain_id: string;
  hook_angle: string;
  emotional_tone: string;
  format_suggestion: string;
}

export interface UGCSourcingGuidance {
  where_to_find: string[];
  outreach_template: string;
  rate_range: string;
  red_flags: string[];
  green_flags: string[];
}

export interface UGCCreatorProfile {
  id: string;
  project_id: string;
  segment_id: string;
  ideal_persona: UGCIdealPersona;
  content_topics: UGCContentTopic[];
  sourcing_guidance: UGCSourcingGuidance | null;
  approved_at?: string;
}

export interface UGCCreatorTracking {
  id: string;
  project_id: string;
  segment_id: string;
  profile_id: string | null;
  creator_name: string;
  creator_handle: string | null;
  platform: string;
  contact_info: string | null;
  status: 'prospect' | 'contacted' | 'negotiating' | 'contracted' | 'delivered' | 'completed';
  videos_ordered: number;
  videos_delivered: number;
  videos_published: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// =============================================================
// COMMUNICATIONS TYPES
// =============================================================

export interface OrganicRhythm {
  tof_content: Array<{
    type: string;
    topic: string;
    format: string;
    frequency: string;
  }>;
  mof_content: Array<{
    type: string;
    topic: string;
    format: string;
    frequency: string;
  }>;
  bof_content: Array<{
    type: string;
    topic: string;
    format: string;
    frequency: string;
  }>;
  posting_cadence: {
    daily_posts: number;
    stories: number;
    live: string;
  };
  channel_matrix: Record<string, string>;
}

export interface ConversationFunnel {
  entry_points: string[];
  dm_flow: string[];
  chat_flow: string[];
  qualification_criteria: string[];
  handoff_script: string;
}

export interface ChatbotScripts {
  welcome_flow: {
    message: string;
    buttons: string[];
  };
  need_discovery_flow: {
    questions: string[];
    branching: string;
  };
  recommendation_flow: {
    logic: string;
    templates: string[];
  };
  export_format: string;
}

export interface CommunicationsFunnel {
  id: string;
  project_id: string;
  segment_id: string;
  pain_id: string;
  organic_rhythm: OrganicRhythm;
  conversation_funnel: ConversationFunnel;
  chatbot_scripts: ChatbotScripts | null;
  approved_at?: string;
}

// =============================================================
// ACCESS CONTROL TYPES
// =============================================================

export type ProjectRole = 'owner' | 'editor' | 'viewer' | 'ugc_specialist';

export interface ProjectPageAccess {
  id: string;
  project_id: string;
  page_key: string;
  is_enabled: boolean;
  created_at: string;
}

export interface ProjectMemberPageAccess {
  id: string;
  project_member_id: string;
  page_key: string;
  is_enabled: boolean;
  created_at: string;
}
```

---

## PHASE 3: APPROVE CONFIGS

### Добавить в `src/lib/approve-utils.ts`

```typescript
// Add to APPROVE_CONFIGS object:

strategySummary: {
  draftTable: 'strategy_summary_drafts',
  approvedTable: 'strategy_summary',
  scope: 'project' as ApproveScope,
  fields: ['growth_bets', 'positioning_pillars', 'channel_priorities', 'risk_flags'],
},

strategyPersonalized: {
  draftTable: 'strategy_personalized_drafts',
  approvedTable: 'strategy_personalized',
  scope: 'pain' as ApproveScope,
  fields: [
    'tof_ugc_hooks',
    'mof_quiz_flow',
    'mof_chat_script',
    'bof_creative_briefs',
    'bof_landing_structure'
  ],
},

strategyGlobal: {
  draftTable: 'strategy_global_drafts',
  approvedTable: 'strategy_global',
  scope: 'project' as ApproveScope,
  fields: [
    'email_strategy',
    'sms_strategy',
    'messenger_strategy',
    'social_strategy',
    'tof_banners',
    'traffic_channels'
  ],
},

strategyAds: {
  draftTable: 'strategy_ads_drafts',
  approvedTable: 'strategy_ads',
  scope: 'pain' as ApproveScope,
  fields: ['channels'],
},

ugcCreatorProfiles: {
  draftTable: 'ugc_creator_profiles_drafts',
  approvedTable: 'ugc_creator_profiles',
  scope: 'segment' as ApproveScope,
  fields: ['ideal_persona', 'content_topics', 'sourcing_guidance'],
},

communicationsFunnel: {
  draftTable: 'communications_funnel_drafts',
  approvedTable: 'communications_funnel',
  scope: 'pain' as ApproveScope,
  fields: ['organic_rhythm', 'conversation_funnel', 'chatbot_scripts'],
},
```

---

## PHASE 4: API ENDPOINTS

**Runtime:** использовать Edge + streaming (SSE) для тяжелых генераций (strategy_personalized, communications, ugc, ads).

### Dashboard API

**Файл:** `src/app/api/projects/[id]/dashboard/route.ts`

```typescript
// GET /api/projects/[id]/dashboard
// Returns: research_health, strategic_highlights, alerts

interface DashboardResponse {
  research_health: {
    segments: Array<{
      id: string;
      name: string;
      steps: Record<string, 'complete' | 'pending' | 'missing'>;
    }>;
  };
  strategic_highlights: {
    top_segments: Array<{ id: string; name: string; priority_score: number }>;
    top_pains: Array<{ id: string; name: string; segment_name: string; impact_score: number }>;
    key_triggers: string[];
    strategy_summary?: {
      growth_bets: Array<{ title: string; score: number }>;
      positioning_pillars: Array<{ pillar: string }>;
    };
  };
  alerts: Array<{
    type: 'missing_data' | 'incomplete_segment' | 'stale_data';
    message: string;
    segment_id?: string;
    action_url: string;
  }>;
}
```

### Strategy APIs

| Endpoint | Method | Input | Output |
|----------|--------|-------|--------|
| `/api/generate/strategy-summary` | POST | projectId | draft |
| `/api/generate/strategy-personalized` | POST | projectId, segmentId, painId | draft |
| `/api/generate/strategy-global` | POST | projectId | draft |
| `/api/generate/strategy-ads` | POST | projectId, segmentId, painId | draft |
| `/api/approve/strategy-summary` | POST | projectId | approved |
| `/api/approve/strategy-personalized` | POST | projectId, segmentId, painId | approved |
| `/api/approve/strategy-global` | POST | projectId | approved |
| `/api/approve/strategy-ads` | POST | projectId, segmentId, painId | approved |

### UGC APIs

| Endpoint | Method | Input | Output |
|----------|--------|-------|--------|
| `/api/generate/ugc-creator-profiles` | POST | projectId, segmentId | draft |
| `/api/approve/ugc-creator-profiles` | POST | projectId, segmentId | approved |
| `/api/ugc-creators/tracking` | GET | projectId, ?segmentId, ?status | list |
| `/api/ugc-creators/tracking` | POST | projectId, segmentId, creator data | created |
| `/api/ugc-creators/tracking` | PATCH | id, updates | updated |
| `/api/ugc-creators/tracking` | DELETE | id | deleted |

### Communications APIs

| Endpoint | Method | Input | Output |
|----------|--------|-------|--------|
| `/api/generate/communications-funnel` | POST | projectId, segmentId, painId | draft |
| `/api/approve/communications-funnel` | POST | projectId, segmentId, painId | approved |

### Drafts API Update

Add new tables to:
- `src/app/api/drafts/route.ts`
- `src/lib/project-utils.ts` (steps mapping if needed)

### Access Control APIs

| Endpoint | Method | Input | Output |
|----------|--------|-------|--------|
| `/api/projects/[id]/page-access` | GET | projectId | page access config |
| `/api/projects/[id]/page-access` | POST | projectId, page_key, is_enabled | updated |
| `/api/projects/[id]/member-page-access` | POST | projectId, memberId, page_key, is_enabled | updated |

**Validation rule:** Strategy/Ads/Communications APIs must verify `pains_ranking.is_top_pain = true` before generating.

---

## PHASE 5: FRONTEND PAGES

### Dashboard Extension

**Файл:** `src/app/(dashboard)/projects/[id]/page.tsx`

Новые секции после существующего контента:
- `ResearchHealthMatrix` — сетка segment × step
- `StrategicHighlights` — top segments, pains, triggers
- `AlertsPanel` — missing data warnings

**Компоненты:**
- `src/components/dashboard/ResearchHealthMatrix.tsx`
- `src/components/dashboard/StrategicHighlights.tsx`
- `src/components/dashboard/AlertsPanel.tsx`

### Strategy Page (NEW)

**Файл:** `src/app/(dashboard)/projects/[id]/strategy/page.tsx`

```
/strategy
  ├── Tab: Summary
  │   ├── Growth bets (scored)
  │   ├── Positioning pillars
  │   ├── Channel priorities
  │   └── Risks + mitigations
  │
  ├── Tab: Personalized
  │   ├── Segment selector
  │   ├── Pain selector (only top_pains)
  │   ├── TOF Section (UGC hooks)
  │   ├── MOF Section (Quiz/Chat)
  │   └── BOF Section (Creatives/LP)
  │
  ├── Tab: Global
  │   ├── Email Strategy
  │   ├── SMS Strategy
  │   ├── Messenger Strategy
  │   ├── Social Strategy
  │   ├── TOF Banners
  │   └── Traffic Channels
  │
  └── Tab: Ads
      ├── Segment selector
      ├── Pain selector (only top_pains)
      └── Channel strategies (Google/Pinterest/Reddit/Meta/TikTok/YouTube)
```

**Компоненты:**
- `src/components/strategy/StrategyTabs.tsx`
- `src/components/strategy/SummaryStrategySection.tsx`
- `src/components/strategy/PersonalizedStrategySection.tsx`
- `src/components/strategy/GlobalStrategySection.tsx`
- `src/components/strategy/AdsStrategySection.tsx`

### UGC Creator Dock (NEW)

**Файл:** `src/app/(dashboard)/projects/[id]/ugc-creators/page.tsx`
**Access:** доступен для роли `ugc_specialist` + owner/editor

```
/ugc-creators
  ├── Tab: Creator Profiles
  │   ├── Segment selector
  │   ├── Ideal Persona card
  │   ├── Content Topics list
  │   └── Sourcing Guidance
  │
  └── Tab: Tracking
      ├── Stats: Total / Contacted / Contracted / Delivered
      ├── Creator table (sortable, filterable)
      └── Add/Edit creator modal
```

**Компоненты:**
- `src/components/ugc/CreatorProfileCard.tsx`
- `src/components/ugc/ContentTopicsSection.tsx`
- `src/components/ugc/CreatorTrackingTable.tsx`
- `src/components/ugc/CreatorFormModal.tsx`

### Communications Page (WIRE)

**Файл:** `src/app/(dashboard)/projects/[id]/communications/page.tsx`

Wire existing page with real data:
- Add segment/pain selectors
- Wire Organic Rhythm section
- Wire Conversation Funnel section
- Wire Chatbot Scripts section
- Add Generate/Approve flow

### Data & Ops (Settings extension)

**Файл:** `src/app/(dashboard)/projects/[id]/settings/page.tsx`

Добавить блоки:
- `CoverageMatrix` (segment × step)
- `MissingAlertsPanel`
- `BatchActionsPanel` (approve/regenerate)

**Coverage rules (пример):**
- Segment without top pains
- Segment without canvas_extended
- Segment without V5 modules (channel/trust/jtbd)
- Segment without strategy_personalized / communications

### Access Control UI (Settings extension)

**Файл:** `src/app/(dashboard)/projects/[id]/settings/page.tsx`

Добавить блок:
- `PageAccessControls` (toggle доступов per page + per member)

---

## PHASE 6: AI PROMPTS (отдельный файл)

**Файл:** `docs/PROMPTS_V6.md`
**Содержание:** JSON schemas + системные инструкции + примеры ответов для каждого генератора.
**Требование:** output = English, строго валидный JSON, streaming/edge для тяжелых ответов.

### Strategy Personalized Prompt

**Input Data:**
- portrait_final
- segment_details
- pain (single top pain)
- canvas_extended
- channel_strategy
- trust_framework
- jtbd_context

**Prompt Structure:**
```
You are a senior digital marketing strategist. Create a complete funnel strategy
for segment "${segment.name}" addressing pain "${pain.name}".

## Business Context
[onboarding data]

## Segment Profile
[segment_details]

## Pain Point
[pain details with canvas_extended]

## Channel Preferences
[channel_strategy data]

## Trust Requirements
[trust_framework data]

Generate a complete TOF → MOF → BOF funnel:

1. TOF (Top of Funnel) - 3+ UGC hooks
2. MOF (Middle of Funnel) - Quiz flow + Chat script
3. BOF (Bottom of Funnel) - 3+ creative briefs + Landing structure

Return ONLY valid JSON matching the specified structure.
```

### Strategy Global Prompt

**Input Data:**
- portrait_final
- all segments + segment_details
- all top_pains aggregated
- channel_strategy (aggregated)
- competitive_intelligence
- pricing_psychology
- jtbd_context

**Output:** email/sms/messenger/social/banners/traffic channels (brand-wide)

### UGC Creator Profile Prompt

**Input Data:**
- segment_details
- portrait_final
- top pains for segment
- canvas_extended
- channel_strategy
- jtbd_context
- trust_framework

### Communications Funnel Prompt

### Strategy Summary Prompt

**Input Data:**
- portrait_final
- segments_final
- jobs
- triggers
- pains_ranking
- channel_strategy
- trust_framework
- pricing_psychology
- competitive_intelligence
- jtbd_context

**Output:**
- growth_bets (scored)
- positioning_pillars
- channel_priorities
- risk_flags
**Scoring rule:** use `growth_bet_score = job_frequency × trigger_urgency × pain_impact`

### Strategy Ads Prompt

**Input Data:**
- channel_strategy
- pricing_psychology
- competitive_intelligence
- pains_ranking
- segment_details
- pain (single top pain)

**Output:**
- channels JSON (google, pinterest, reddit, meta, tiktok, youtube, etc.)

**Input Data:**
- segment_details
- jobs
- preferences
- triggers
- canvas_extended
- trust_framework
- channel_strategy
- jtbd_context

---

## PHASE 7: IMPLEMENTATION ORDER

### Sprint 1: Foundation (Days 1-3)

**Tasks:**
1. [ ] Create migration 030_strategy_module.sql
2. [ ] Create migration 031_ugc_creators.sql
3. [ ] Create migration 032_communications_module.sql
4. [ ] Run migrations in Supabase
5. [ ] Verify tables and RLS policies
6. [ ] Add TypeScript types to `src/types/index.ts`
7. [ ] Add approve configs to `src/lib/approve-utils.ts`

**QA Checkpoint 1:**
- [ ] All 12 tables exist in database
- [ ] RLS policies work for project owner
- [ ] Types compile without errors
- [ ] Existing functionality not broken

### Sprint 2: Dashboard (Days 4-5)

**Tasks:**
1. [ ] Create `/api/projects/[id]/dashboard/route.ts`
2. [ ] Implement research health matrix query
3. [ ] Implement strategic highlights aggregation
4. [ ] If strategy_summary exists, surface it in highlights
5. [ ] Implement alerts detection logic
6. [ ] Create `ResearchHealthMatrix.tsx` component
7. [ ] Create `StrategicHighlights.tsx` component
8. [ ] Create `AlertsPanel.tsx` component
9. [ ] Extend existing dashboard page

**QA Checkpoint 2:**
- [ ] Dashboard page loads without errors
- [ ] Matrix shows correct status per segment × step
- [ ] Highlights show top 3 segments and pains
- [ ] Alerts appear for missing data
- [ ] Existing dashboard sections still work

### Sprint 3: Access Control + Data & Ops (Days 6-8)

**Tasks:**
1. [ ] Create migration 033_page_access_control.sql
2. [ ] Add ugc_specialist to roles (types + permissions + invites)
3. [ ] Implement page access APIs
4. [ ] Add page-level guards (layout + sidebar visibility)
5. [ ] Add PageAccessControls in Settings
6. [ ] Add CoverageMatrix + MissingAlerts + BatchActions in Settings
7. [ ] Add useDataCoverage hook
8. [ ] Add EmptyStateV5 component
9. [ ] Backfill page access defaults for existing projects

**QA Checkpoint 3:**
- [ ] Page access toggles work (project-level + member override)
- [ ] UGC specialist role restricted to UGC page
- [ ] Sidebar hides pages without access
- [ ] Coverage matrix shows correct statuses
- [ ] Missing alerts are accurate
- [ ] No regressions in Settings

### Sprint 4: Strategy (Days 9-13)

**Tasks:**
1. [ ] Create `/api/generate/strategy-summary/route.ts`
2. [ ] Create `/api/generate/strategy-personalized/route.ts`
3. [ ] Create `/api/generate/strategy-global/route.ts`
4. [ ] Create `/api/generate/strategy-ads/route.ts`
5. [ ] Create `/api/approve/strategy-summary/route.ts`
6. [ ] Create `/api/approve/strategy-personalized/route.ts`
7. [ ] Create `/api/approve/strategy-global/route.ts`
8. [ ] Create `/api/approve/strategy-ads/route.ts`
9. [ ] Create `/projects/[id]/strategy/page.tsx`
10. [ ] Create StrategyTabs component
11. [ ] Create SummaryStrategySection
12. [ ] Create PersonalizedStrategySection
13. [ ] Create GlobalStrategySection
14. [ ] Create AdsStrategySection (segment/pain selectors + channel list)
15. [ ] Add navigation link to dashboard

**QA Checkpoint 4:**
- [ ] Strategy page loads correctly
- [ ] Can select segment and top pain
- [ ] Personalized strategy generates successfully
- [ ] Global strategy generates successfully
- [ ] Ads strategy generates successfully
- [ ] Summary strategy generates successfully
- [ ] All approve flows work
- [ ] Data saves to correct tables
- [ ] Regeneration works after approve

### Sprint 5: UGC (Days 14-16)

**Tasks:**
1. [ ] Create `/api/generate/ugc-creator-profiles/route.ts`
2. [ ] Create `/api/approve/ugc-creator-profiles/route.ts`
3. [ ] Create `/api/ugc-creators/tracking/route.ts` (CRUD)
4. [ ] Create `/projects/[id]/ugc-creators/page.tsx`
5. [ ] Create CreatorProfileCard component
6. [ ] Create ContentTopicsSection component
7. [ ] Create CreatorTrackingTable component
8. [ ] Create CreatorFormModal component
9. [ ] Add navigation link

**QA Checkpoint 5:**
- [ ] UGC page loads correctly
- [ ] Can generate profiles per segment
- [ ] Can add/edit/delete creators in tracking
- [ ] Stats update correctly
- [ ] Filter and sort work
- [ ] Empty states display correctly

### Sprint 6: Communications (Days 17-19)

**Tasks:**
1. [ ] Create `/api/generate/communications-funnel/route.ts`
2. [ ] Create `/api/approve/communications-funnel/route.ts`
3. [ ] Wire existing communications page with data
4. [ ] Add segment/pain selectors
5. [ ] Display organic rhythm section
6. [ ] Display conversation funnel section
7. [ ] Display chatbot scripts section
8. [ ] Add generate/approve flow
9. [ ] Add JSON export for chatbot scripts

**QA Checkpoint 6:**
- [ ] Communications page shows real data
- [ ] Can filter by segment and top pain only
- [ ] Can generate new funnels
- [ ] Approve flow works
- [ ] Export produces valid JSON

### Sprint 7: Polish (Days 20-21)

**Tasks:**
1. [ ] Update navigation in dashboard
2. [ ] Update Activation Toolkit section
3. [ ] Add empty states for all new pages
4. [ ] Add loading skeletons
5. [ ] Add help/tooltips blocks on each new page (what it is, how to use)
6. [ ] Test translation support
7. [ ] Performance optimization
8. [ ] Final regression testing

**QA Checkpoint 7:**
- [ ] All navigation links work
- [ ] Empty states are helpful
- [ ] Loading states appear
- [ ] Translations work
- [ ] No regressions in existing features

---

## PHASE 8: QA CHECKLIST

### Regression Tests (НЕ ЛОМАТЬ)

- [ ] 21-step generation flow works
- [ ] Validation → Portrait → Segments → Deep Analysis flow
- [ ] Pains → Canvas → Canvas Extended flow
- [ ] V5 modules (Channel, Competitive, Pricing, Trust, JTBD)
- [ ] Report page loads all data
- [ ] Explorer works with segment selection
- [ ] Approve flow works for all existing modules
- [ ] Translation toggle works
- [ ] Project sharing works (owner/editor/viewer)
- [ ] Project reset/delete works
- [ ] Export (XLSX/JSON/CSV) works
- [ ] Page access rules do not block existing pages for owners/editors

### New Feature Tests

- [ ] Dashboard health matrix correct per segment
- [ ] Dashboard highlights show correct priorities
- [ ] Dashboard alerts accurate
- [ ] Data & Ops coverage matrix accurate
- [ ] Data & Ops missing alerts accurate
- [ ] Data & Ops batch actions (approve/regenerate) work
- [ ] Insights/Playbooks outputs validated against V7 JSON examples
- [ ] Strategy personalized generates for top pains only
- [ ] Strategy global generates per project
- [ ] Strategy ads generates channels (Google/Pinterest/Reddit/Meta/TikTok/YouTube)
- [ ] UGC profiles generate per segment
- [ ] UGC tracking CRUD all operations
- [ ] Communications funnels per segment × pain
- [ ] All English output
- [ ] All translations work
- [ ] Page-level access toggles hide/show pages per member

### Data Integrity Tests

- [ ] segment_id references are valid
- [ ] pain_id references only top pains (is_top_pain = true)
- [ ] No orphan records
- [ ] RLS correct for owner/editor/viewer
- [ ] RLS correct for ugc_specialist role
- [ ] Service role has full access
- [ ] FK constraints work (CASCADE delete)

### Performance Tests

- [ ] Dashboard loads < 2s
- [ ] Strategy generation completes without truncation (Edge + streaming)
- [ ] UGC generation completes without truncation
- [ ] Communications generation completes without truncation
- [ ] No quality loss due to performance optimizations

---

## CRITICAL FILES REFERENCE

| Purpose | File Path |
|---------|-----------|
| TypeScript Types | `src/types/index.ts` |
| Approve Utils | `src/lib/approve-utils.ts` |
| Generate Pattern | `src/app/api/generate/channel-strategy/route.ts` |
| Approve Pattern | `src/app/api/approve/channel-strategy/route.ts` |
| Report API | `src/app/api/report/route.ts` |
| Dashboard Page | `src/app/(dashboard)/projects/[id]/page.tsx` |
| Communications Page | `src/app/(dashboard)/projects/[id]/communications/page.tsx` |
| Settings (Data & Ops + Access) | `src/app/(dashboard)/projects/[id]/settings/page.tsx` |
| UGC Page | `src/app/(dashboard)/projects/[id]/ugc-creators/page.tsx` |
| Strategy Page | `src/app/(dashboard)/projects/[id]/strategy/page.tsx` |
| AI Client | `src/lib/ai-client.ts` |
| Permissions | `src/lib/permissions.ts` |

---

## RISK MITIGATION

| Risk | Mitigation |
|------|------------|
| Large scope | Strict sprint boundaries + QA checkpoints after each |
| Breaking existing | Regression tests before each deploy |
| AI timeouts | Edge runtime + streaming for heavy generations |
| Data inconsistency | Validate segment_id/pain_id at API level |
| Performance | Do not sacrifice quality for speed; use streaming if slow |
| Missing data | Empty states + helpful guidance |
| Access control | Default open for owner/editor + explicit per-page toggles |

---

## NOTES

1. **Scope:** Только top pains (is_top_pain = true) для Strategy и Communications
2. **Language:** English output + translation hook для UI
3. **Storage:** Draft/Approved pattern для всех новых модулей
4. **UGC Tracking:** Manual CRUD без draft (прямое сохранение)
5. **Permissions:** UGC Creator Dock может быть доступен отдельно для UGC специалиста
6. **Page Access:** Пер-page access контролируется через Settings
7. **Prompts:** Все промпты вынесены в `docs/PROMPTS_V6.md`
8. **V7:** Insights/Playbooks реализуются по `docs/IMPLEMENTATION_PLAN_V7_INSIGHTS_PLAYBOOKS.md` и добавляются в report/export.
