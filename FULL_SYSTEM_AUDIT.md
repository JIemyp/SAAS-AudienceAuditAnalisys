# Полный Аудит Системы Audience Audit Analysis

> Документ создан: 2025-12-12
> Цель: Полная детализация структуры данных, воркфлоу и промптов для аудита и улучшения системы

---

## Содержание

1. [Обзор Системы](#1-обзор-системы)
2. [Архитектура Воркфлоу (21 шаг)](#2-архитектура-воркфлоу)
3. [Структура Базы Данных](#3-структура-базы-данных)
4. [Детализация Промптов](#4-детализация-промптов)
5. [Каскадная Структура Зависимостей](#5-каскадная-структура-зависимостей)
6. [Проблемы и Рекомендации](#6-проблемы-и-рекомендации)

---

## 1. Обзор Системы

### Что это?

**Audience Audit Analysis** — SaaS-платформа для глубокого анализа целевой аудитории с использованием AI. Система проводит пользователя через 21-шаговый процесс создания детального портрета аудитории, сегментации, анализа болей и формирования маркетинговой стратегии.

### Технологический стек

| Компонент | Технология |
|-----------|------------|
| Frontend | Next.js 14 (App Router), React, Tailwind CSS |
| Backend | Next.js API Routes |
| Database | Supabase (PostgreSQL) |
| AI | Multi-provider (Anthropic Claude, OpenAI GPT-5.x, Google Gemini 3) |
| Auth | Supabase Auth |
| Translations | DeepL API + Google Translate fallback |

### Ключевые концепции

1. **Draft-Approve Pattern**: Каждый шаг имеет черновик (`*_drafts`) и утверждённую версию
2. **Per-Segment Processing**: С шага 9 (Jobs) все операции выполняются для каждого сегмента отдельно
3. **Per-Pain Processing**: Canvas анализ создаётся для каждой боли отдельно
4. **Cumulative Context**: Каждый следующий шаг получает данные из всех предыдущих

---

## 2. Архитектура Воркфлоу

### Визуальная схема (21 шаг, 5 блоков)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        BLOCK 1: PORTRAIT (Шаги 1-4)                          │
│                         Создание портрета аудитории                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  [1] Validation ──► [2] Portrait ──► [3] Portrait Review ──► [4] Portrait Final
│       │                  │                    │                      │       │
│       ▼                  ▼                    ▼                      ▼       │
│  validation_drafts  portrait_drafts  portrait_review_drafts  portrait_final │
│                                                                              │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      BLOCK 2: SEGMENTATION (Шаги 5-8)                        │
│                        Разделение на сегменты                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  [5] Segments ──► [6] Segments Review ──► [7] Segments Final ──► [8] Segment Details
│       │                   │                       │                    │     │
│       ▼                   ▼                       ▼                    ▼     │
│  segments_drafts  segments_review_drafts  segments_final    segment_details │
│  (3-10 сегментов)                          (утверждённые)   (PER SEGMENT)   │
│                                                                              │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    BLOCK 3: DEEP ANALYSIS (Шаги 9-12)                        │
│                    *** PER SEGMENT - Для каждого сегмента ***                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  [9] Jobs ──────► [10] Preferences ──► [11] Difficulties ──► [12] Triggers  │
│       │                   │                    │                   │         │
│       ▼                   ▼                    ▼                   ▼         │
│    jobs_drafts    preferences_drafts   difficulties_drafts   triggers_drafts│
│                                                                              │
│  Накопительный контекст: каждый шаг включает данные предыдущих              │
│                                                                              │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    BLOCK 4: PAINS & CANVAS (Шаги 13-16)                      │
│                    *** PER SEGMENT + PER PAIN ***                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  [13] Pains ──► [14] Pains Ranking ──► [15] Canvas ──► [16] Canvas Extended │
│       │                 │                   │                  │             │
│       ▼                 ▼                   ▼                  ▼             │
│  pains_drafts    pains_ranking_drafts  canvas_drafts   canvas_extended_drafts
│  (6-10 болей)    (рейтинг + TOP 3)    (PER PAIN!)      (PER PAIN!)          │
│                                                                              │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                   BLOCK 5: STRATEGIC V5 (Шаги 17-21)                         │
│                   *** PER SEGMENT - Стратегические модули ***                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  [17] Channel Strategy ──► [18] Competitive Intelligence ──►                │
│           │                            │                                     │
│           ▼                            ▼                                     │
│  channel_strategy_drafts    competitive_intelligence_drafts                  │
│                                                                              │
│  ──► [19] Pricing Psychology ──► [20] Trust Framework ──► [21] JTBD Context │
│              │                           │                        │          │
│              ▼                           ▼                        ▼          │
│  pricing_psychology_drafts      trust_framework_drafts    jtbd_context_drafts│
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Порядок шагов (из project-utils.ts)

| # | Step ID | Label | Block | Per-Segment? | Per-Pain? |
|---|---------|-------|-------|--------------|-----------|
| 1 | validation | Validation | 1 | ❌ | - |
| 2 | portrait | Portrait | 1 | ❌ | - |
| 3 | portrait-review | Portrait Review | 1 | ❌ | - |
| 4 | portrait-final | Portrait Final | 1 | ❌ | - |
| 5 | segments | Segments | 2 | ❌ | - |
| 6 | segments-review | Segments Review | 2 | ❌ | - |
| 7 | segments-final | Segments Final | 2 | ❌ | - |
| 8 | segment-details | Segment Details | 2 | ✅ | - |
| 9 | jobs | Jobs to Be Done | 3 | ✅ | - |
| 10 | preferences | Preferences | 3 | ✅ | - |
| 11 | difficulties | Difficulties | 3 | ✅ | - |
| 12 | triggers | Triggers | 3 | ✅ | - |
| 13 | pains | Pains | 4 | ✅ | ✅ (creates) |
| 14 | pains-ranking | Pains Ranking | 4 | ✅ | ✅ |
| 15 | canvas | Canvas | 4 | ✅ | ✅ |
| 16 | canvas-extended | Canvas Extended | 4 | ✅ | ✅ |
| 17 | channel-strategy | Channel Strategy | 5 | ✅ | - |
| 18 | competitive-intelligence | Competitive Intel | 5 | ✅ | - |
| 19 | pricing-psychology | Pricing Psychology | 5 | ✅ | - |
| 20 | trust-framework | Trust Framework | 5 | ✅ | - |
| 21 | jtbd-context | JTBD Context | 5 | ✅ | - |

---

## 3. Структура Базы Данных

### 3.1 Общая статистика

- **Всего таблиц**: ~47 (24 draft + 23 approved)
- **Архитектура**: Draft-Approve паттерн с версионированием
- **Связи**: CASCADE DELETE через project_id и segment_id
- **Безопасность**: Row Level Security (RLS) на всех таблицах

### 3.2 BLOCK 1: Portrait Tables

#### validation_drafts / validation
```sql
CREATE TABLE validation_drafts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  what_brand_sells TEXT,           -- Что продаёт бренд
  problem_solved TEXT,             -- Какую проблему решает
  key_differentiator TEXT,         -- Ключевое отличие
  understanding_correct BOOLEAN,   -- Понимание корректно?
  clarification_needed TEXT,       -- Что нужно уточнить
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### portrait_drafts / portrait
```sql
CREATE TABLE portrait_drafts (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),

  -- Текстовые описания
  sociodemographics TEXT,
  psychographics TEXT,

  -- Детальная демография
  age_range TEXT,
  gender_distribution TEXT,
  income_level TEXT,
  education TEXT,
  location TEXT,
  occupation TEXT,
  family_status TEXT,

  -- Психографика (JSONB массивы)
  values_beliefs JSONB,      -- ["Sustainability", "Innovation", ...]
  lifestyle_habits JSONB,    -- ["Early riser", "Remote worker", ...]
  interests_hobbies JSONB,   -- ["Tech gadgets", "Fitness", ...]
  personality_traits JSONB,  -- ["Analytical", "Risk-averse", ...]

  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### portrait_review_drafts / portrait_review
```sql
CREATE TABLE portrait_review_drafts (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  original_portrait_id UUID REFERENCES portrait_drafts(id),

  what_to_change JSONB,   -- [{current, suggested, reasoning}]
  what_to_add JSONB,      -- [{addition, reasoning}]
  what_to_remove JSONB,   -- [{removal, reasoning}]
  reasoning TEXT,

  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### portrait_final_drafts / portrait_final
```sql
CREATE TABLE portrait_final (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),

  -- Все поля из portrait
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

  -- Дополнительно
  changes_applied JSONB,  -- ["Change 1", "Change 2", ...]

  approved_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.3 BLOCK 2: Segmentation Tables

#### segments_drafts / segments_initial
```sql
CREATE TABLE segments_drafts (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  segment_index INTEGER,           -- 0, 1, 2, 3... (порядок)
  name TEXT,                       -- "Budget-conscious millennials"
  description TEXT,                -- 2-3 предложения
  sociodemographics TEXT,          -- Краткое описание
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индексы
CREATE INDEX idx_segments_drafts_project ON segments_drafts(project_id);
CREATE INDEX idx_segments_drafts_index ON segments_drafts(project_id, segment_index);
```

#### segments_review_drafts / segments_review
```sql
CREATE TABLE segments_review (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),

  segment_overlaps JSONB,    -- [{segments: [0,1], overlap_description, recommendation}]
  too_broad JSONB,           -- [{segment: 0, issue, recommendation}]
  too_narrow JSONB,          -- [{segment: 1, issue, recommendation}]
  missing_segments JSONB,    -- [{suggested_name, description, reasoning}]
  recommendations JSONB,     -- ["Recommendation 1", ...]

  approved_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### segment_details_drafts / segment_details
```sql
CREATE TABLE segment_details (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  segment_id UUID REFERENCES segments(id),  -- Связь с конкретным сегментом

  needs JSONB,          -- [{need: "Save time", intensity: "high"}]
  triggers JSONB,       -- [{trigger: "Deadline", trigger_moment: "End of quarter"}]
  core_values JSONB,    -- [{value: "Efficiency", manifestation: "..."}]

  awareness_level TEXT CHECK (awareness_level IN (
    'unaware',           -- Не знают о проблеме
    'problem_aware',     -- Знают о проблеме
    'solution_aware',    -- Знают о решениях
    'product_aware',     -- Знают о продукте
    'most_aware'         -- Полностью осведомлены
  )),

  objections JSONB,     -- [{objection, root_cause, how_to_overcome}]

  approved_at TIMESTAMPTZ DEFAULT NOW()
);

-- UNIQUE constraint: один segment_details на сегмент
CREATE UNIQUE INDEX idx_segment_details_unique ON segment_details(project_id, segment_id);
```

### 3.4 BLOCK 3: Deep Analysis Tables (Per-Segment)

#### jobs_drafts / jobs
```sql
CREATE TABLE jobs (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  segment_id UUID REFERENCES segments(id),

  functional_jobs JSONB,  -- [{
                          --   job: "Find reliable supplier",
                          --   why_it_matters: "...",
                          --   how_product_helps: "..."
                          -- }]

  emotional_jobs JSONB,   -- Как хотят себя чувствовать
  social_jobs JSONB,      -- Как хотят выглядеть в глазах других

  approved_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### preferences_drafts / preferences
```sql
CREATE TABLE preferences (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  segment_id UUID REFERENCES segments(id),

  preferences JSONB,      -- [{
                          --   name: "Fast delivery",
                          --   description: "...",
                          --   importance: "critical" | "high" | "medium" | "low",
                          --   reasoning: "..."
                          -- }]

  approved_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### difficulties_drafts / difficulties
```sql
CREATE TABLE difficulties (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  segment_id UUID REFERENCES segments(id),

  difficulties JSONB,     -- [{
                          --   name: "Information overload",
                          --   description: "...",
                          --   frequency: "constant" | "frequent" | "occasional" | "rare",
                          --   emotional_impact: "..."
                          -- }]

  approved_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### triggers_drafts / triggers
```sql
CREATE TABLE triggers (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  segment_id UUID REFERENCES segments(id),

  triggers JSONB,         -- [{
                          --   name: "Deadline pressure",
                          --   description: "...",
                          --   psychological_basis: "Fear of failure",
                          --   trigger_moment: "End of quarter",
                          --   messaging_angle: "..."
                          -- }]

  approved_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.5 BLOCK 4: Pains & Canvas Tables (Per-Segment, Per-Pain)

#### pains_drafts / pains_initial
```sql
CREATE TABLE pains_initial (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  segment_id UUID REFERENCES segments(id),

  pain_index INTEGER,      -- 0, 1, 2... (порядок внутри сегмента)
  name TEXT,               -- "Fear of making wrong choice"
  description TEXT,        -- Подробное описание

  deep_triggers JSONB,     -- ["Past bad experiences", "High stakes", ...]
  examples JSONB,          -- ["Bought wrong software", ...]

  approved_at TIMESTAMPTZ DEFAULT NOW()
);

-- Каждая боль = отдельная запись!
CREATE INDEX idx_pains_segment ON pains_initial(project_id, segment_id);
```

#### pains_ranking_drafts / pains_ranking
```sql
CREATE TABLE pains_ranking (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  segment_id UUID REFERENCES segments(id),
  pain_id UUID REFERENCES pains_initial(id),

  impact_score INTEGER CHECK (impact_score BETWEEN 1 AND 10),
  is_top_pain BOOLEAN DEFAULT FALSE,
  ranking_reasoning TEXT,

  approved_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### canvas_drafts / canvas
```sql
CREATE TABLE canvas (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  segment_id UUID REFERENCES segments(id),
  pain_id UUID REFERENCES pains_initial(id),  -- Каждый canvas для ОДНОЙ боли!

  emotional_aspects JSONB,    -- [{
                              --   emotion: "Anxiety",
                              --   intensity: "high",
                              --   description: "...",
                              --   self_image_impact: "...",
                              --   connected_fears: ["..."],
                              --   blocked_desires: ["..."]
                              -- }]

  behavioral_patterns JSONB,  -- [{
                              --   pattern: "Procrastination",
                              --   description: "...",
                              --   frequency: "daily",
                              --   coping_mechanism: "...",
                              --   avoidance: "..."
                              -- }]

  buying_signals JSONB,       -- [{
                              --   signal: "Asking for recommendations",
                              --   readiness_level: "high",
                              --   messaging_angle: "...",
                              --   proof_needed: "..."
                              -- }]

  approved_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### canvas_extended_drafts / canvas_extended (V2)
```sql
CREATE TABLE canvas_extended (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  segment_id UUID REFERENCES segments(id),
  pain_id UUID REFERENCES pains_initial(id),

  -- Customer Journey (5 стадий)
  customer_journey JSONB,     -- {
                              --   unaware_stage: {life_context, internal_dialogue, emotional_state, duration},
                              --   problem_aware: {moment, dialogue, actions},
                              --   solution_seeking: {where_they_look, what_they_try, frustrations},
                              --   evaluation: {criteria, behavior, dealbreakers},
                              --   decision_trigger: {moment, dialogue, what_to_hear},
                              --   post_purchase: {week_1, confirmation_moments, doubt_moments}
                              -- }

  -- Emotional Map
  emotional_map JSONB,        -- {
                              --   peaks: [{moment, trigger, dialogue, intensity}],
                              --   valleys: [{moment, trigger, dialogue, intensity}],
                              --   turning_points: [{from, to, catalyst, shift}]
                              -- }

  -- Narrative Angles (3-4 истории)
  narrative_angles JSONB,     -- [{
                              --   angle_name, who_this_is, their_story,
                              --   core_belief, breakthrough_moment,
                              --   key_message, proof_they_need, objection_to_address
                              -- }]

  -- Messaging Framework
  messaging_framework JSONB,  -- {
                              --   headlines: [],
                              --   opening_hooks: [],
                              --   bridge_statements: [],
                              --   proof_framing: {type, format, language},
                              --   objection_handlers: [{objection, handler}],
                              --   cta_options: []
                              -- }

  -- Voice & Tone
  voice_and_tone JSONB,       -- {
                              --   do: [],
                              --   dont: [],
                              --   words_that_resonate: [],
                              --   words_to_avoid: []
                              -- }

  approved_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.6 BLOCK 5: Strategic V5 Tables (Per-Segment)

#### channel_strategy_drafts / channel_strategy
```sql
CREATE TABLE channel_strategy (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  segment_id UUID REFERENCES segments(id),

  primary_platforms JSONB,     -- [{
                               --   platform: "LinkedIn",
                               --   usage_frequency: "daily",
                               --   activity_type: "lurking" | "commenting" | "posting",
                               --   peak_activity_times: ["weekday_mornings"],
                               --   why_they_use_it: "..."
                               -- }]

  content_preferences JSONB,   -- [{format, context, attention_span, triggering_topics[]}]
  trusted_sources JSONB,       -- [{source_type, specific_examples[], why_trusted}]
  communities JSONB,           -- [{type, specific_names[], participation_level, influence}]
  search_patterns JSONB,       -- {typical_queries[], search_depth, decision_timeline}
  advertising_response JSONB,  -- {channels_they_notice[], ad_formats_that_work[], ...}

  approved_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_channel_strategy_unique ON channel_strategy(project_id, segment_id);
```

#### competitive_intelligence_drafts / competitive_intelligence
```sql
CREATE TABLE competitive_intelligence (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  segment_id UUID REFERENCES segments(id),

  alternatives_tried JSONB,    -- [{solution_type, specific_examples[], adoption_rate,
                               --   why_they_tried_it, initial_expectations, actual_experience,
                               --   why_it_failed, emotional_residue}]

  current_workarounds JSONB,   -- [{workaround, effectiveness, effort_required, cost, why_stick}]
  vs_competitors JSONB,        -- [{competitor_name, segment_perception, strengths[], weaknesses[], switching_triggers[]}]
  switching_barriers JSONB,    -- [{barrier_type, description, severity, how_to_overcome}]
  evaluation_process JSONB,    -- {criteria[], dealbreakers[], nice_to_haves[], how_compare, decision_authority}
  category_beliefs JSONB,      -- {what_they_believe[], misconceptions_to_address[]}

  approved_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### pricing_psychology_drafts / pricing_psychology
```sql
CREATE TABLE pricing_psychology (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  segment_id UUID REFERENCES segments(id),

  budget_context JSONB,            -- {spending_category, budget_allocation, decision_cycle, who_controls_budget}
  price_perception JSONB,          -- {price_sensitivity_level, current_spending, ceiling, sweet_spot, free_trial_importance}
  value_anchors JSONB,             -- [{comparison_point, why_this_works}]
  willingness_to_pay_signals JSONB,-- [{signal, indicates, how_to_respond}]
  payment_psychology JSONB,        -- {preferred_structure[], payment_methods[], billing_frequency, friction_points[]}
  roi_calculation JSONB,           -- {how_they_measure, payback_expectation, metrics_they_track[]}
  pricing_objections JSONB,        -- [{objection, underlying_concern, is_price_or_value, reframe_strategy}]
  discount_sensitivity JSONB,      -- {responds_to_discounts, types_that_work[], types_that_backfire[], optimal_strategy}
  budget_triggers JSONB,           -- [{trigger_event, timing, how_to_leverage}]

  approved_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### trust_framework_drafts / trust_framework
```sql
CREATE TABLE trust_framework (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  segment_id UUID REFERENCES segments(id),

  baseline_trust JSONB,        -- {trust_in_category, trust_in_brand, reasons_for_skepticism[], past_betrayals[]}
  proof_hierarchy JSONB,       -- [{proof_type, effectiveness, why_it_works, how_to_present, examples[]}]
  trusted_authorities JSONB,   -- [{authority_type, specific_names[], why_trusted, how_to_leverage}]
  social_proof JSONB,          -- {testimonial_profile, before_after_importance, numbers_that_matter[], case_study_angle}
  transparency_needs JSONB,    -- {information_needed[], disclosure_expectations[], transparency_level}
  trust_killers JSONB,         -- [{red_flag, why_triggers_skepticism, how_to_avoid}]
  credibility_markers JSONB,   -- [{signal, importance, current_status}]
  risk_reduction JSONB,        -- {biggest_risks[], reversal_mechanisms[]}
  trust_journey JSONB,         -- {first_touchpoint_goal, mid_journey_reassurance[], pre_purchase_push, post_purchase_confirmation}

  approved_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### jtbd_context_drafts / jtbd_context
```sql
CREATE TABLE jtbd_context (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  segment_id UUID REFERENCES segments(id),

  job_contexts JSONB,          -- [{
                               --   job_reference_id,
                               --   job_name,
                               --   hire_triggers: [{situation, frequency, urgency, emotional_state}],
                               --   competing_solutions: [{alternative, why_chosen, when_chosen, job_completion_rate, your_advantage}],
                               --   success_metrics: {how_measured[], immediate_progress[], short_term, long_term, acceptable_tradeoffs[]},
                               --   obstacles: [{obstacle, blocks_progress, how_you_remove_it}],
                               --   hiring_anxieties: [{anxiety, rooted_in, how_to_address}]
                               -- }]

  job_priority_ranking JSONB,  -- [{job_name, priority, reasoning}]
  job_dependencies JSONB,      -- [{primary_job, enables_job, relationship}]

  approved_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.7 Служебные таблицы

#### projects (Корневая таблица)
```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  status TEXT CHECK (status IN ('draft', 'processing', 'completed', 'failed')),
  current_step TEXT,  -- Текущий шаг воркфлоу

  onboarding_data JSONB,  -- {
                          --   brandName, productService, productFormat,
                          --   problems[], benefits[], usp,
                          --   geography, businessModel, priceSegment,
                          --   idealCustomer, competitors[], differentiation,
                          --   notAudience, additionalContext, files[]
                          -- }

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### segments (Основная таблица сегментов)
```sql
CREATE TABLE segments (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  order_index INTEGER,
  name TEXT,
  description TEXT,
  sociodemographics TEXT,

  -- Данные из segment_details (денормализация для удобства)
  needs JSONB,
  triggers JSONB,
  core_values JSONB,
  awareness_level TEXT,
  objections JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 4. Детализация Промптов

### 4.1 Обзор всех промптов

| # | Функция | Файл | Входные данные | Выходные данные |
|---|---------|------|----------------|-----------------|
| 1 | buildValidationPrompt | prompts.ts:44-97 | onboarding, files | ValidationResponse |
| 2 | buildPortraitPrompt | prompts.ts:100-188 | onboarding, validation | PortraitResponse |
| 3 | buildPortraitReviewPrompt | prompts.ts:191-251 | onboarding, portrait | PortraitReviewResponse |
| 4 | buildPortraitFinalPrompt | prompts.ts:254-316 | portrait, review | PortraitFinalResponse |
| 5 | buildJobsPrompt | prompts.ts:323-440 | onboarding, portraitFinal, segment, [segmentDetails], [v5 tables] | JobsResponse |
| 6 | buildPreferencesPrompt | prompts.ts:443-568 | onboarding, portraitFinal, jobs, segment, [segmentDetails], [v5 tables] | PreferencesResponse |
| 7 | buildDifficultiesPrompt | prompts.ts:571-701 | onboarding, portraitFinal, preferences, segment, [segmentDetails], [v5 tables], [jobs] | DifficultiesResponse |
| 8 | buildTriggersPrompt | prompts.ts:704-867 | onboarding, portraitFinal, segment, segmentDetails, jobs, preferences, difficulties, [v5 tables] | TriggersResponse |
| 9 | buildSegmentsPrompt | prompts.ts:875-958 | onboarding, portraitFinal | SegmentsResponse |
| 10 | buildSegmentsReviewPrompt | prompts.ts:961-1054 | onboarding, segments | SegmentsReviewResponse |
| 10.5 | buildSegmentsFinalPrompt | prompts.ts:1057-1172 | onboarding, segments, review | SegmentsFinalResponse |
| 11 | buildSegmentDetailsPrompt | prompts.ts:1371-1521 | onboarding, segment, portraitFinal | SegmentDetailsResponse |
| 11a | buildSingleFieldPrompt | prompts.ts:1197-1368 | fieldName, onboarding, segment, portraitFinal, currentDraft | SingleFieldResponse |
| 12 | buildPainsPrompt | prompts.ts:1528-1695 | onboarding, portraitFinal, segment, segmentDetails, jobs, preferences, difficulties, triggers, [v5 tables] | PainsResponse |
| 13 | buildPainsRankingPrompt | prompts.ts:1698-1753 | segment, pains | PainsRankingResponse |
| 14 | buildCanvasPrompt | prompts.ts:1756-1934 | onboarding, portraitFinal, segment, segmentDetails, jobs, preferences, difficulties, triggers, pain, [v5 tables] | CanvasResponse |
| 15 | buildCanvasExtendedPromptV2 | prompts.ts:1936-2402 | onboarding, segment, segmentDetails, jobs, triggers, preferences, difficulties, portraitFinal, pain, canvas | CanvasExtendedV2Response |

### 4.2 Детальное описание ключевых промптов

#### Prompt #5: buildJobsPrompt (Jobs to Be Done)

**Входные параметры:**
```typescript
function buildJobsPrompt(
  onboarding: OnboardingData,
  portraitFinal: PortraitFinal,
  segment: Segment,
  segmentDetails?: SegmentDetails | null,
  channelStrategy?: ChannelStrategy | null,
  competitiveIntel?: CompetitiveIntelligence | null,
  pricingPsych?: PricingPsychology | null,
  trustFramework?: TrustFramework | null,
  jtbdContext?: JTBDContext | null
): string
```

**Секции промпта:**
1. **Target Audience Portrait** - общий портрет из portrait_final
2. **Specific Segment to Analyze** - данные конкретного сегмента
3. **Segment Deep Profile** (если есть segmentDetails):
   - Needs with intensity
   - Core values with manifestation
   - Awareness level
   - Objections with root causes
4. **Strategic Context** (если есть v5 данные):
   - Channel preferences
   - Competitive landscape
   - Pricing sensitivity
   - Trust requirements
5. **Brand Context** - проблемы, решения, USP
6. **Task Instructions**:
   - Functional Jobs (практические задачи)
   - Emotional Jobs (эмоциональные цели)
   - Social Jobs (социальные цели)

**Выходной формат:**
```json
{
  "functional_jobs": [
    {
      "job": "Find reliable supplier quickly",
      "why_it_matters": "Time is money, delays cost revenue",
      "how_product_helps": "Instant matching algorithm"
    }
  ],
  "emotional_jobs": [...],
  "social_jobs": [...]
}
```

#### Prompt #12: buildPainsPrompt (Pain Points)

**Входные параметры:**
```typescript
function buildPainsPrompt(
  onboarding: OnboardingData,
  portraitFinal: PortraitFinal,
  segment: SegmentBase,
  segmentDetails: SegmentDetails,  // ОБЯЗАТЕЛЬНО
  jobs: Jobs,                      // ОБЯЗАТЕЛЬНО
  preferences: Preferences,        // ОБЯЗАТЕЛЬНО
  difficulties: Difficulties,      // ОБЯЗАТЕЛЬНО
  triggers: Triggers,              // ОБЯЗАТЕЛЬНО
  // V5 опционально
  channelStrategy?: ChannelStrategy | null,
  competitiveIntel?: CompetitiveIntelligence | null,
  pricingPsych?: PricingPsychology | null,
  trustFramework?: TrustFramework | null,
  jtbdContext?: JTBDContext | null
): string
```

**Секции промпта:**
1. **Brand Context** - что продаём, какие проблемы решаем
2. **Target Audience Overview** - общий портрет
3. **Specific Segment** - детали сегмента
4. **Deep Profile** - needs, values, awareness, objections
5. **Jobs to Be Done** - из шага 9
6. **Product Preferences** - из шага 10
7. **Difficulties & Frustrations** - из шага 11
8. **Deep Purchase Triggers** - из шага 12
9. **Task Instructions**:
   - Generate 6-10 pain points
   - Categories: fear-based, aspiration-based, pain-avoidance, identity-based, social

**Выходной формат:**
```json
{
  "segment_name": "Budget-conscious millennials",
  "pains": [
    {
      "index": 1,
      "name": "Fear of making wrong choice",
      "description": "Detailed description of the pain...",
      "deep_triggers": ["Past bad experiences", "High stakes"],
      "examples": ["Bought wrong software once", "Friend's horror story"]
    }
  ]
}
```

#### Prompt #14: buildCanvasPrompt (Value Proposition Canvas)

**Особенность:** Создаётся для КАЖДОЙ боли отдельно!

**Секции промпта:**
1. **Brand Context**
2. **Target Audience** (portrait_final)
3. **Segment Profile** с опциональными данными:
   - Deep profile (needs, values, awareness, objections)
   - Jobs to Be Done
   - Preferences
   - Difficulties
   - Triggers
4. **Pain Point to Analyze Deeply** - конкретная боль
5. **Canvas Analysis Angles**:
   - **Emotional Aspects**: эмоции, интенсивность, влияние на самооценку, связанные страхи, заблокированные желания
   - **Behavioral Patterns**: как справляются, workarounds, частота, избегание
   - **Buying Signals**: готовность к покупке, резонирующие слова, нужные доказательства

**Выходной формат:**
```json
{
  "pain_name": "Fear of making wrong choice",
  "emotional_aspects": [
    {
      "emotion": "Anxiety",
      "intensity": "high",
      "description": "...",
      "self_image_impact": "Makes them feel incompetent",
      "connected_fears": ["Wasting money", "Looking foolish"],
      "blocked_desires": ["Confidence", "Peace of mind"]
    }
  ],
  "behavioral_patterns": [...],
  "buying_signals": [...]
}
```

---

## 5. Каскадная Структура Зависимостей

### 5.1 Диаграмма потока данных

```
                                    ┌─────────────────┐
                                    │   ONBOARDING    │
                                    │  (исходные данные)
                                    └────────┬────────┘
                                             │
                                             ▼
                              ┌──────────────────────────┐
                              │      VALIDATION          │
                              │  what_brand_sells        │
                              │  problem_solved          │
                              │  key_differentiator      │
                              └────────────┬─────────────┘
                                           │
                                           ▼
                              ┌──────────────────────────┐
                              │       PORTRAIT           │
                              │  sociodemographics       │
                              │  psychographics          │
                              │  demographics_detailed   │
                              └────────────┬─────────────┘
                                           │
                                           ▼
                              ┌──────────────────────────┐
                              │    PORTRAIT REVIEW       │
                              │  what_to_change          │
                              │  what_to_add             │
                              │  what_to_remove          │
                              └────────────┬─────────────┘
                                           │
                                           ▼
                              ┌──────────────────────────┐
                              │    PORTRAIT FINAL        │◄─────────────────────┐
                              │  (финальный портрет)     │                      │
                              └────────────┬─────────────┘                      │
                                           │                                    │
              ┌────────────────────────────┴────────────────────────────┐       │
              │                                                         │       │
              ▼                                                         │       │
┌──────────────────────────┐                                            │       │
│       SEGMENTS           │                                            │       │
│  3-10 сегментов          │                                            │       │
│  name, description       │                                            │       │
│  sociodemographics       │                                            │       │
└────────────┬─────────────┘                                            │       │
             │                                                          │       │
             ▼                                                          │       │
┌──────────────────────────┐                                            │       │
│    SEGMENTS REVIEW       │                                            │       │
│  overlaps, too_broad     │                                            │       │
│  too_narrow, missing     │                                            │       │
└────────────┬─────────────┘                                            │       │
             │                                                          │       │
             ▼                                                          │       │
┌──────────────────────────┐                                            │       │
│    SEGMENTS FINAL        │◄───────────────────────────────────────────┤       │
│  (утверждённые сегменты) │                                            │       │
└────────────┬─────────────┘                                            │       │
             │                                                          │       │
             ▼                                                          │       │
┌──────────────────────────────────────────────────────────────────────────────┐
│                         PER SEGMENT PROCESSING                               │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────┐                                                │
│  │    SEGMENT DETAILS       │◄───────────────────────────────────────────────┤
│  │  needs, triggers         │                                                │
│  │  core_values             │                                                │
│  │  awareness_level         │                                                │
│  │  objections              │                                                │
│  └────────────┬─────────────┘                                                │
│               │                                                              │
│               ▼                                                              │
│  ┌──────────────────────────┐                                                │
│  │         JOBS             │◄───── portrait_final + segment_details         │
│  │  functional_jobs         │                                                │
│  │  emotional_jobs          │                                                │
│  │  social_jobs             │                                                │
│  └────────────┬─────────────┘                                                │
│               │                                                              │
│               ▼                                                              │
│  ┌──────────────────────────┐                                                │
│  │      PREFERENCES         │◄───── jobs                                     │
│  │  preferences[]           │                                                │
│  │  importance levels       │                                                │
│  └────────────┬─────────────┘                                                │
│               │                                                              │
│               ▼                                                              │
│  ┌──────────────────────────┐                                                │
│  │      DIFFICULTIES        │◄───── jobs + preferences                       │
│  │  difficulties[]          │                                                │
│  │  frequency, impact       │                                                │
│  └────────────┬─────────────┘                                                │
│               │                                                              │
│               ▼                                                              │
│  ┌──────────────────────────┐                                                │
│  │        TRIGGERS          │◄───── jobs + preferences + difficulties        │
│  │  triggers[]              │                                                │
│  │  psychological_basis     │                                                │
│  │  trigger_moment          │                                                │
│  └────────────┬─────────────┘                                                │
│               │                                                              │
└───────────────┼──────────────────────────────────────────────────────────────┘
                │
                ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                     PER SEGMENT + PER PAIN PROCESSING                        │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────┐                                                │
│  │          PAINS           │◄───── ВСЁ ВЫШЕ (full cumulative context)       │
│  │  6-10 pains per segment  │       segment_details + jobs + preferences +   │
│  │  name, description       │       difficulties + triggers                  │
│  │  deep_triggers, examples │                                                │
│  └────────────┬─────────────┘                                                │
│               │                                                              │
│               ▼                                                              │
│  ┌──────────────────────────┐                                                │
│  │     PAINS RANKING        │◄───── pains                                    │
│  │  impact_score (1-10)     │                                                │
│  │  is_top_pain             │                                                │
│  │  TOP 3 для Canvas        │                                                │
│  └────────────┬─────────────┘                                                │
│               │                                                              │
│               ▼                                                              │
│  ┌──────────────────────────┐                                                │
│  │    CANVAS (per pain!)    │◄───── pains + ВСЁ ВЫШЕ                         │
│  │  emotional_aspects       │       Создаётся для КАЖДОЙ боли!               │
│  │  behavioral_patterns     │                                                │
│  │  buying_signals          │                                                │
│  └────────────┬─────────────┘                                                │
│               │                                                              │
│               ▼                                                              │
│  ┌──────────────────────────┐                                                │
│  │  CANVAS EXTENDED (V2)    │◄───── canvas + ВСЁ ВЫШЕ                        │
│  │  customer_journey        │       Для каждой боли!                         │
│  │  emotional_map           │                                                │
│  │  narrative_angles        │                                                │
│  │  messaging_framework     │                                                │
│  │  voice_and_tone          │                                                │
│  └────────────┬─────────────┘                                                │
│               │                                                              │
└───────────────┼──────────────────────────────────────────────────────────────┘
                │
                ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                      STRATEGIC V5 (PER SEGMENT)                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────┐                                                │
│  │    CHANNEL STRATEGY      │◄───── canvas_extended + segment                │
│  │  primary_platforms       │                                                │
│  │  content_preferences     │                                                │
│  │  trusted_sources         │                                                │
│  │  communities             │                                                │
│  └────────────┬─────────────┘                                                │
│               │                                                              │
│               ▼                                                              │
│  ┌──────────────────────────┐                                                │
│  │ COMPETITIVE INTELLIGENCE │◄───── channel_strategy + segment               │
│  │  alternatives_tried      │                                                │
│  │  current_workarounds     │                                                │
│  │  vs_competitors          │                                                │
│  │  switching_barriers      │                                                │
│  └────────────┬─────────────┘                                                │
│               │                                                              │
│               ▼                                                              │
│  ┌──────────────────────────┐                                                │
│  │   PRICING PSYCHOLOGY     │◄───── competitive_intel + segment              │
│  │  budget_context          │                                                │
│  │  price_perception        │                                                │
│  │  value_anchors           │                                                │
│  │  payment_psychology      │                                                │
│  └────────────┬─────────────┘                                                │
│               │                                                              │
│               ▼                                                              │
│  ┌──────────────────────────┐                                                │
│  │    TRUST FRAMEWORK       │◄───── pricing_psychology + segment             │
│  │  baseline_trust          │                                                │
│  │  proof_hierarchy         │                                                │
│  │  trusted_authorities     │                                                │
│  │  trust_killers           │                                                │
│  └────────────┬─────────────┘                                                │
│               │                                                              │
│               ▼                                                              │
│  ┌──────────────────────────┐                                                │
│  │      JTBD CONTEXT        │◄───── trust_framework + jobs + canvas_extended │
│  │  job_contexts            │                                                │
│  │  job_priority_ranking    │                                                │
│  │  job_dependencies        │                                                │
│  └───────────────────────────┘                                               │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Таблица зависимостей

| Шаг | Читает из таблиц | Обязательные | Опциональные |
|-----|------------------|--------------|--------------|
| 1. Validation | projects (onboarding_data) | onboarding | files |
| 2. Portrait | validation | validation | - |
| 3. Portrait Review | portrait | portrait | - |
| 4. Portrait Final | portrait, portrait_review | оба | - |
| 5. Segments | portrait_final | portrait_final | - |
| 6. Segments Review | segments_initial | segments | - |
| 7. Segments Final | segments_initial, segments_review | оба | - |
| 8. Segment Details | segments_final, portrait_final | оба | - |
| 9. Jobs | portrait_final, segment | segment | segment_details, v5 tables |
| 10. Preferences | portrait_final, segment, jobs | все | segment_details, v5 tables |
| 11. Difficulties | portrait_final, segment, preferences | все | jobs, segment_details, v5 tables |
| 12. Triggers | portrait_final, segment, segment_details, jobs, preferences, difficulties | все | v5 tables |
| 13. Pains | portrait_final, segment, segment_details, jobs, preferences, difficulties, triggers | все | v5 tables |
| 14. Pains Ranking | pains_initial | pains | - |
| 15. Canvas | portrait_final, segment, pain | все | segment_details, jobs, preferences, difficulties, triggers, v5 tables |
| 16. Canvas Extended | canvas, segment, pain | все | segment_details, jobs, triggers, preferences, difficulties, portrait_final |
| 17. Channel Strategy | segment, canvas_extended | segment | canvas_extended |
| 18. Competitive Intel | segment | segment | channel_strategy |
| 19. Pricing Psychology | segment | segment | competitive_intel |
| 20. Trust Framework | segment | segment | pricing_psychology, competitive_intel |
| 21. JTBD Context | segment, jobs | оба | canvas_extended, trust_framework |

### 5.3 Проблема с V5 таблицами

**ВАЖНОЕ ОТКРЫТИЕ:**

V5 таблицы (channel_strategy, competitive_intelligence, pricing_psychology, trust_framework, jtbd_context) генерируются в **Block 5 (шаги 17-21)**, который идёт **ПОСЛЕ** Canvas!

```
Текущий порядок:
Block 3: Jobs → Preferences → Difficulties → Triggers
Block 4: Pains → Pains Ranking → Canvas → Canvas Extended
Block 5: Channel Strategy → Competitive Intel → Pricing → Trust → JTBD  ← V5 ЗДЕСЬ!
```

**Проблема:** В текущей реализации API роуты для Jobs, Preferences и других шагов пытаются читать V5 данные, которых ещё НЕ СУЩЕСТВУЕТ на момент выполнения этих шагов.

**Решение:** V5 данные должны быть опциональными и использоваться ТОЛЬКО если:
1. Пользователь вернулся к шагу Jobs после прохождения Block 5
2. Или V5 данные были созданы в отдельном воркфлоу

---

## 6. Проблемы и Рекомендации

### 6.1 Критические проблемы

#### 🔴 P1: V5 данные недоступны на ранних шагах
- **Проблема:** Код пытается использовать V5 таблицы в Jobs/Preferences/etc, но они создаются позже
- **Влияние:** Запросы возвращают null, код работает, но контекст неполный
- **Решение:** Убрать V5 fetch из ранних шагов ИЛИ изменить порядок воркфлоу

#### 🔴 P2: Per-Pain Data Explosion
- **Проблема:** Canvas создаётся для КАЖДОЙ боли (6-10 болей × 5 сегментов = 30-50 записей)
- **Влияние:** Большой объём данных, медленные запросы, сложный UI
- **Решение:** Ограничить до TOP 3 болей через pains_ranking

#### 🔴 P3: Project step не обновляется для per-segment шагов
- **Проблема:** Jobs/Preferences/etc не обновляют current_step проекта
- **Влияние:** Непонятно, когда пользователь закончил все сегменты
- **Решение:** Добавить tracking завершения всех сегментов

### 6.2 Средние проблемы

#### 🟡 P4: Дублирование данных
- **Проблема:** Данные в segments_initial, segments_final, segments
- **Влияние:** Риск рассинхронизации
- **Решение:** Использовать единую таблицу segments с версионированием

#### 🟡 P5: Нет rollback механизма
- **Проблема:** Approve удаляет старые данные безвозвратно
- **Влияние:** Случайный approve = потеря данных
- **Решение:** Добавить soft delete или audit trail

#### 🟡 P6: Переводы не работают на всех страницах
- **Проблема:** Translations работают на Jobs, но не на Preferences
- **Влияние:** Непоследовательный UX
- **Решение:** Debug useTranslation hook, проверить console logs

### 6.3 Рекомендации по улучшению

1. **Изменить порядок воркфлоу:**
   ```
   Вариант A: Убрать V5 из ранних шагов
   Вариант B: Переместить V5 между Segment Details и Jobs
   ```

2. **Оптимизировать Canvas:**
   - Генерировать только для TOP 3 болей (из pains_ranking)
   - Добавить ограничение в UI

3. **Добавить progress tracking:**
   ```typescript
   // Новое поле в projects
   segment_progress: {
     [segmentId]: {
       jobs: 'approved',
       preferences: 'draft',
       // ...
     }
   }
   ```

4. **Добавить audit trail:**
   ```sql
   CREATE TABLE data_audit (
     id UUID PRIMARY KEY,
     table_name TEXT,
     record_id UUID,
     action TEXT,  -- 'insert', 'update', 'delete'
     old_data JSONB,
     new_data JSONB,
     created_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```

---

## Файлы для изучения

### Основные файлы

| Файл | Описание |
|------|----------|
| [src/lib/prompts.ts](../src/lib/prompts.ts) | Все prompt builders |
| [src/lib/project-utils.ts](../src/lib/project-utils.ts) | GENERATION_STEPS, навигация |
| [src/types/index.ts](../src/types/index.ts) | TypeScript типы для всех таблиц |

### API Routes

| Файл | Шаг |
|------|-----|
| [src/app/api/generate/validation/route.ts](../src/app/api/generate/validation/route.ts) | 1. Validation |
| [src/app/api/generate/portrait/route.ts](../src/app/api/generate/portrait/route.ts) | 2. Portrait |
| [src/app/api/generate/segments/route.ts](../src/app/api/generate/segments/route.ts) | 5. Segments |
| [src/app/api/generate/segment-details/route.ts](../src/app/api/generate/segment-details/route.ts) | 8. Segment Details |
| [src/app/api/generate/jobs/route.ts](../src/app/api/generate/jobs/route.ts) | 9. Jobs |
| [src/app/api/generate/preferences/route.ts](../src/app/api/generate/preferences/route.ts) | 10. Preferences |
| [src/app/api/generate/difficulties/route.ts](../src/app/api/generate/difficulties/route.ts) | 11. Difficulties |
| [src/app/api/generate/triggers/route.ts](../src/app/api/generate/triggers/route.ts) | 12. Triggers |
| [src/app/api/generate/pains/route.ts](../src/app/api/generate/pains/route.ts) | 13. Pains |
| [src/app/api/generate/canvas/route.ts](../src/app/api/generate/canvas/route.ts) | 15. Canvas |

### UI Components

| Файл | Описание |
|------|----------|
| [src/components/generation/SegmentGenerationPage.tsx](../src/components/generation/SegmentGenerationPage.tsx) | Универсальный компонент для per-segment страниц |
| [src/app/(dashboard)/projects/[id]/layout.tsx](../src/app/(dashboard)/projects/%5Bid%5D/layout.tsx) | Sidebar с навигацией по шагам |

---

> **Следующие шаги:**
> 1. Принять решение по V5 таблицам (убрать или переместить)
> 2. Ограничить Canvas до TOP 3 болей
> 3. Добавить progress tracking для per-segment шагов
> 4. Исправить переводы на всех страницах
