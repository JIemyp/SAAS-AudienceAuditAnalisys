# Audience Research Tool — Complete Architecture v4

## Ключова концепція

**Кожен промпт = окремий крок аналізу**
**Кожен крок = 2 таблиці (drafts + approved)**
**3 фінальні таблиці для звітності**

---

## Повний список промптів (15)

### Block 1: Portrait (Загальний портрет)

| # | Промпт | Що робить |
|---|--------|-----------|
| 1 | Validation | Підтверджує розуміння продукту |
| 2 | Portrait | Соціо-демо + психографіка |
| 3 | Portrait Review | Самоперевірка: "що б ти змінив?" |
| 4 | Portrait Final | Об'єднує з виправленнями |

### Block 2: Deep Analysis (Поглиблений аналіз)

| # | Промпт | Що робить |
|---|--------|-----------|
| 5 | Jobs to Be Done | Functional / Emotional / Social jobs |
| 6 | Product Preferences | Предпочтения в товарах |
| 7 | Difficulties | Сложности при пошуку рішення |
| 8 | Deep Triggers | Глибинні тригери покупки |

### Block 3: Segmentation (Сегментація)

| # | Промпт | Що робить |
|---|--------|-----------|
| 9 | Segments | 10 сегментів ЦА |
| 10 | Segments Review | Самоперевірка сегментів |
| 11 | Segment Details | Потреби, тригери, цінності, awareness, objections |

### Block 4: Pains (Боли)

| # | Промпт | Що робить |
|---|--------|-----------|
| 12 | Pains | 6-10 болей на кожен сегмент |
| 13 | Pains Ranking | Ранжування по impact score |
| 14 | Canvas | Глибоке занурення в топ-3 болі |
| 15 | Canvas Extended | Розкриття болі з різних сторін |

---

## Database Schema

### Таблиці по промптах (30 таблиць)

```sql
-- ================================================
-- BLOCK 1: PORTRAIT
-- ================================================

-- Prompt 1: Validation
CREATE TABLE validation_drafts (
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

CREATE TABLE validation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  
  what_brand_sells TEXT,
  problem_solved TEXT,
  key_differentiator TEXT,
  understanding_correct BOOLEAN,
  
  approved_at TIMESTAMPTZ DEFAULT now()
);

-- Prompt 2: Portrait
CREATE TABLE portrait_drafts (
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

CREATE TABLE portrait (
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
CREATE TABLE portrait_review_drafts (
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

CREATE TABLE portrait_review (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  
  what_to_change JSONB,
  what_to_add JSONB,
  what_to_remove JSONB,
  reasoning TEXT,
  
  approved_at TIMESTAMPTZ DEFAULT now()
);

-- Prompt 4: Portrait Final
CREATE TABLE portrait_final_drafts (
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

CREATE TABLE portrait_final (
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
-- BLOCK 2: DEEP ANALYSIS
-- ================================================

-- Prompt 5: Jobs to Be Done
CREATE TABLE jobs_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  
  functional_jobs JSONB,  -- ["job1", "job2", ...]
  emotional_jobs JSONB,
  social_jobs JSONB,
  
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  
  functional_jobs JSONB,
  emotional_jobs JSONB,
  social_jobs JSONB,
  
  approved_at TIMESTAMPTZ DEFAULT now()
);

-- Prompt 6: Product Preferences
CREATE TABLE preferences_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  
  preferences JSONB,  -- [{name, description, importance}, ...]
  
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  
  preferences JSONB,
  
  approved_at TIMESTAMPTZ DEFAULT now()
);

-- Prompt 7: Difficulties
CREATE TABLE difficulties_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  
  difficulties JSONB,  -- [{name, description, frequency}, ...]
  
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE difficulties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  
  difficulties JSONB,
  
  approved_at TIMESTAMPTZ DEFAULT now()
);

-- Prompt 8: Deep Triggers
CREATE TABLE triggers_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  
  triggers JSONB,  -- [{name, description, psychological_basis}, ...]
  
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE triggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  
  triggers JSONB,
  
  approved_at TIMESTAMPTZ DEFAULT now()
);

-- ================================================
-- BLOCK 3: SEGMENTATION
-- ================================================

-- Prompt 9: Segments
CREATE TABLE segments_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  
  segment_index INTEGER,
  name TEXT,
  description TEXT,
  sociodemographics TEXT,
  
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE segments_initial (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  
  segment_index INTEGER,
  name TEXT,
  description TEXT,
  sociodemographics TEXT,
  
  approved_at TIMESTAMPTZ DEFAULT now()
);

-- Prompt 10: Segments Review
CREATE TABLE segments_review_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  
  overlaps JSONB,
  too_broad JSONB,
  too_narrow JSONB,
  missing_segments JSONB,
  recommendations JSONB,
  
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE segments_review (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  
  overlaps JSONB,
  too_broad JSONB,
  too_narrow JSONB,
  missing_segments JSONB,
  recommendations JSONB,
  
  approved_at TIMESTAMPTZ DEFAULT now()
);

-- Prompt 11: Segment Details
CREATE TABLE segment_details_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  segment_id UUID,  -- references approved segment
  
  needs JSONB,
  triggers JSONB,
  core_values JSONB,
  awareness_level TEXT CHECK (awareness_level IN ('unaware', 'problem_aware', 'solution_aware', 'product_aware', 'most_aware')),
  objections JSONB,
  
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE segment_details (
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
-- BLOCK 4: PAINS
-- ================================================

-- Prompt 12: Pains
CREATE TABLE pains_drafts (
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

CREATE TABLE pains_initial (
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
CREATE TABLE pains_ranking_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  pain_id UUID,
  
  impact_score INTEGER CHECK (impact_score BETWEEN 1 AND 10),
  is_top_pain BOOLEAN DEFAULT false,
  ranking_reasoning TEXT,
  
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE pains_ranking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  pain_id UUID,
  
  impact_score INTEGER,
  is_top_pain BOOLEAN,
  ranking_reasoning TEXT,
  
  approved_at TIMESTAMPTZ DEFAULT now()
);

-- Prompt 14: Canvas
CREATE TABLE canvas_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  pain_id UUID,
  
  emotional_aspects JSONB,
  behavioral_patterns JSONB,
  buying_signals JSONB,
  
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE canvas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  pain_id UUID,
  
  emotional_aspects JSONB,
  behavioral_patterns JSONB,
  buying_signals JSONB,
  
  approved_at TIMESTAMPTZ DEFAULT now()
);

-- Prompt 15: Canvas Extended
CREATE TABLE canvas_extended_drafts (
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

CREATE TABLE canvas_extended (
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
-- FINAL REPORT TABLES (3)
-- ================================================

CREATE TABLE audience (
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

CREATE TABLE segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  
  segment_index INTEGER,
  name TEXT,
  description TEXT,
  sociodemographics TEXT,
  
  -- From segment_details
  needs JSONB,
  triggers JSONB,
  core_values JSONB,
  awareness_level TEXT,
  objections JSONB,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE pains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  segment_id UUID REFERENCES segments(id) ON DELETE CASCADE,
  
  pain_index INTEGER,
  name TEXT,
  description TEXT,
  deep_triggers JSONB,
  examples JSONB,
  
  -- From ranking
  impact_score INTEGER,
  is_top_pain BOOLEAN,
  
  -- From canvas
  canvas_emotional_aspects JSONB,
  canvas_behavioral_patterns JSONB,
  canvas_buying_signals JSONB,
  
  -- From canvas_extended
  canvas_extended_analysis TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ================================================
-- RLS POLICIES
-- ================================================

-- Enable RLS on all tables
ALTER TABLE validation_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE validation ENABLE ROW LEVEL SECURITY;
ALTER TABLE portrait_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE portrait ENABLE ROW LEVEL SECURITY;
ALTER TABLE portrait_review_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE portrait_review ENABLE ROW LEVEL SECURITY;
ALTER TABLE portrait_final_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE portrait_final ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE preferences_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE difficulties_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE difficulties ENABLE ROW LEVEL SECURITY;
ALTER TABLE triggers_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE segments_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE segments_initial ENABLE ROW LEVEL SECURITY;
ALTER TABLE segments_review_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE segments_review ENABLE ROW LEVEL SECURITY;
ALTER TABLE segment_details_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE segment_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE pains_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE pains_initial ENABLE ROW LEVEL SECURITY;
ALTER TABLE pains_ranking_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE pains_ranking ENABLE ROW LEVEL SECURITY;
ALTER TABLE canvas_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE canvas ENABLE ROW LEVEL SECURITY;
ALTER TABLE canvas_extended_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE canvas_extended ENABLE ROW LEVEL SECURITY;
ALTER TABLE audience ENABLE ROW LEVEL SECURITY;
ALTER TABLE segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE pains ENABLE ROW LEVEL SECURITY;

-- Create policies (example for one table, repeat for all)
CREATE POLICY "Users own data" ON validation_drafts
  FOR ALL USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

-- ... repeat for all 33 tables
```

---

## Project Status Flow

```sql
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_current_step_check;
ALTER TABLE projects ADD CONSTRAINT projects_current_step_check 
  CHECK (current_step IN (
    'onboarding',
    
    -- Block 1: Portrait
    'validation_draft', 'validation_approved',
    'portrait_draft', 'portrait_approved',
    'portrait_review_draft', 'portrait_review_approved',
    'portrait_final_draft', 'portrait_final_approved',
    
    -- Block 2: Deep Analysis
    'jobs_draft', 'jobs_approved',
    'preferences_draft', 'preferences_approved',
    'difficulties_draft', 'difficulties_approved',
    'triggers_draft', 'triggers_approved',
    
    -- Block 3: Segmentation
    'segments_draft', 'segments_approved',
    'segments_review_draft', 'segments_review_approved',
    'segment_details_draft', 'segment_details_approved',
    
    -- Block 4: Pains
    'pains_draft', 'pains_approved',
    'pains_ranking_draft', 'pains_ranking_approved',
    'canvas_draft', 'canvas_approved',
    'canvas_extended_draft', 'canvas_extended_approved',
    
    'completed'
  ));
```

---

## Prompts

### Prompt 1: Validation

```typescript
export function buildValidationPrompt(onboarding: OnboardingData): string {
  return `You are an expert marketing strategist.
Always respond in English, regardless of input language.

## Task

Before analyzing the target audience, confirm you understand the product correctly.

## Brand Context

Brand: ${onboarding.brandName}
Product: ${onboarding.productService}
Format: ${onboarding.productFormat}

Problems Solved:
${onboarding.problems.map(p => `- ${p}`).join('\n')}

Benefits:
${onboarding.benefits.map(b => `- ${b}`).join('\n')}

USP: ${onboarding.usp}

Competitors:
${onboarding.competitors.map(c => `- ${c}`).join('\n')}

Differentiation: ${onboarding.differentiation}

## Your Task

Summarize your understanding:
1. What does this brand sell? (in simple terms)
2. What core problem does it solve?
3. What is the key differentiator from competitors?
4. Is anything unclear that needs clarification?

## Output Format

Return ONLY valid JSON:

{
  "what_brand_sells": "Clear, simple description...",
  "problem_solved": "The core problem it addresses...",
  "key_differentiator": "What makes it unique...",
  "understanding_correct": true,
  "clarification_needed": null
}

If something is unclear, set understanding_correct to false and explain in clarification_needed.`;
}
```

### Prompt 2: Portrait

```typescript
export function buildPortraitPrompt(
  onboarding: OnboardingData,
  validation: Validation
): string {
  return `You are an expert marketing strategist specializing in audience research.
Always respond in English, regardless of input language.

## Confirmed Product Understanding

What brand sells: ${validation.what_brand_sells}
Problem solved: ${validation.problem_solved}
Key differentiator: ${validation.key_differentiator}

## Brand Context

Brand: ${onboarding.brandName}
Product: ${onboarding.productService}
Geography: ${onboarding.geography}
Price Segment: ${onboarding.priceSegment}
${onboarding.idealCustomer ? `Known Ideal Customer: ${onboarding.idealCustomer}` : ''}
${onboarding.notAudience ? `NOT Target Audience: ${onboarding.notAudience}` : ''}

## Task

Create a comprehensive portrait of the target audience.

### Socio-demographics
Describe in detail:
- Age range and distribution
- Gender distribution
- Income level
- Education level
- Location (urban/suburban/rural, regions)
- Occupation types
- Family status

### Psychographics
Describe in detail:
- Core values and beliefs
- Lifestyle and daily habits
- Interests and hobbies
- Personality traits

## Output Format

Return ONLY valid JSON:

{
  "sociodemographics": "Comprehensive text description...",
  "psychographics": "Comprehensive text description...",
  "demographics_detailed": {
    "age_range": "32-55 years",
    "gender_distribution": "65% women, 35% men",
    "income_level": "$80,000+ annually",
    "education": "University educated",
    "location": "Urban areas in USA, UK, Germany...",
    "occupation": "Professionals, executives, entrepreneurs",
    "family_status": "Mixed - singles and families with children"
  },
  "psychographics_detailed": {
    "values_beliefs": ["Health-conscious", "Science-driven", "Quality over price"],
    "lifestyle_habits": ["Regular exercise", "Meal planning", "Supplement routines"],
    "interests_hobbies": ["Biohacking", "Nutrition research", "Wellness podcasts"],
    "personality_traits": ["Skeptical", "Research-oriented", "Early adopters"]
  }
}`;
}
```

### Prompt 3: Portrait Review

```typescript
export function buildPortraitReviewPrompt(
  onboarding: OnboardingData,
  portrait: Portrait
): string {
  return `You are an expert marketing strategist reviewing audience research.
Always respond in English, regardless of input language.

## Current Portrait

Socio-demographics:
${portrait.sociodemographics}

Psychographics:
${portrait.psychographics}

## Brand Context

Brand: ${onboarding.brandName}
Product: ${onboarding.productService}
Price Segment: ${onboarding.priceSegment}
${onboarding.idealCustomer ? `Known Ideal Customer: ${onboarding.idealCustomer}` : ''}
${onboarding.notAudience ? `NOT Target Audience: ${onboarding.notAudience}` : ''}

## Task

Critically review this portrait. Ask yourself:
1. What would you CHANGE in this portrait? Why?
2. What is MISSING that should be added?
3. What should be REMOVED as irrelevant?
4. Is the portrait too broad or too narrow?

Be specific and provide reasoning.

## Output Format

Return ONLY valid JSON:

{
  "what_to_change": [
    {
      "current": "Current description...",
      "suggested": "Better description...",
      "reasoning": "Why this change improves accuracy..."
    }
  ],
  "what_to_add": [
    {
      "addition": "What to add...",
      "reasoning": "Why this is important..."
    }
  ],
  "what_to_remove": [
    {
      "removal": "What to remove...",
      "reasoning": "Why this is irrelevant..."
    }
  ],
  "overall_assessment": "Too broad / Too narrow / Well balanced",
  "confidence_score": 8
}`;
}
```

### Prompt 4: Portrait Final

```typescript
export function buildPortraitFinalPrompt(
  portrait: Portrait,
  review: PortraitReview
): string {
  return `You are an expert marketing strategist.
Always respond in English, regardless of input language.

## Original Portrait

Socio-demographics:
${portrait.sociodemographics}

Psychographics:
${portrait.psychographics}

## Review Feedback

Changes to make:
${JSON.stringify(review.what_to_change, null, 2)}

Additions:
${JSON.stringify(review.what_to_add, null, 2)}

Removals:
${JSON.stringify(review.what_to_remove, null, 2)}

## Task

Create the FINAL improved portrait by:
1. Applying all suggested changes
2. Adding all recommended additions
3. Removing all identified irrelevant items
4. Ensuring the portrait is well-balanced

## Output Format

Return ONLY valid JSON with the same structure as the original portrait, but improved:

{
  "sociodemographics": "Improved comprehensive text description...",
  "psychographics": "Improved comprehensive text description...",
  "demographics_detailed": {
    "age_range": "...",
    "gender_distribution": "...",
    "income_level": "...",
    "education": "...",
    "location": "...",
    "occupation": "...",
    "family_status": "..."
  },
  "psychographics_detailed": {
    "values_beliefs": [...],
    "lifestyle_habits": [...],
    "interests_hobbies": [...],
    "personality_traits": [...]
  },
  "changes_applied": [
    "Applied change 1...",
    "Added X...",
    "Removed Y..."
  ]
}`;
}
```

### Prompt 5: Jobs to Be Done

```typescript
export function buildJobsPrompt(
  onboarding: OnboardingData,
  portraitFinal: PortraitFinal
): string {
  return `You are an expert in Jobs-to-Be-Done framework.
Always respond in English, regardless of input language.

## Target Audience Portrait

${portraitFinal.sociodemographics}

${portraitFinal.psychographics}

## Brand Context

Brand: ${onboarding.brandName}
Product: ${onboarding.productService}
Problems Solved:
${onboarding.problems.map(p => `- ${p}`).join('\n')}

## Task

Identify the Jobs to Be Done for this audience. What are they trying to accomplish?

### Functional Jobs
Practical tasks and outcomes they want to achieve.

### Emotional Jobs
How they want to feel. Emotional states they seek.

### Social Jobs
How they want to be perceived by others.

For each job, provide:
- Clear description
- Why it matters to them
- How the product helps accomplish this job

## Output Format

Return ONLY valid JSON:

{
  "functional_jobs": [
    {
      "job": "Improve gut health and digestion",
      "why_it_matters": "Daily discomfort affects work performance",
      "how_product_helps": "Provides bioactive nutrients that support gut barrier"
    },
    ...
  ],
  "emotional_jobs": [
    {
      "job": "Feel in control of their health",
      "why_it_matters": "Tired of uncertainty and trial-and-error",
      "how_product_helps": "Science-backed approach gives confidence"
    },
    ...
  ],
  "social_jobs": [
    {
      "job": "Be seen as health-conscious and informed",
      "why_it_matters": "Identity tied to being knowledgeable about health",
      "how_product_helps": "Premium, science-backed product signals sophistication"
    },
    ...
  ]
}`;
}
```

### Prompt 6: Product Preferences

```typescript
export function buildPreferencesPrompt(
  onboarding: OnboardingData,
  portraitFinal: PortraitFinal,
  jobs: Jobs
): string {
  return `You are an expert consumer psychologist.
Always respond in English, regardless of input language.

## Target Audience

${portraitFinal.sociodemographics}
${portraitFinal.psychographics}

## Their Jobs to Be Done

Functional: ${jobs.functional_jobs.map(j => j.job).join(', ')}
Emotional: ${jobs.emotional_jobs.map(j => j.job).join(', ')}
Social: ${jobs.social_jobs.map(j => j.job).join(', ')}

## Product Context

Product: ${onboarding.productService}
Benefits:
${onboarding.benefits.map(b => `- ${b}`).join('\n')}

## Task

Based on this audience profile, what specific PREFERENCES do they have when choosing products like this?

Consider:
- What features are non-negotiable?
- What quality standards do they expect?
- What formats/packaging do they prefer?
- What certifications matter to them?
- What price sensitivity do they have?

## Output Format

Return ONLY valid JSON:

{
  "preferences": [
    {
      "name": "Clean ingredients",
      "description": "Must have transparent, simple ingredient list without additives",
      "importance": "critical",
      "reasoning": "Past negative experiences with complex supplements"
    },
    {
      "name": "Scientific backing",
      "description": "Want to see research and clinical studies",
      "importance": "high",
      "reasoning": "Skeptical of marketing claims without evidence"
    },
    ...
  ]
}

Use importance levels: "critical", "high", "medium", "low"`;
}
```

### Prompt 7: Difficulties

```typescript
export function buildDifficultiesPrompt(
  onboarding: OnboardingData,
  portraitFinal: PortraitFinal,
  preferences: Preferences
): string {
  return `You are an expert consumer psychologist.
Always respond in English, regardless of input language.

## Target Audience

${portraitFinal.sociodemographics}
${portraitFinal.psychographics}

## Their Preferences

${preferences.preferences.map(p => `- ${p.name}: ${p.description}`).join('\n')}

## Product Context

Product: ${onboarding.productService}
Competitors: ${onboarding.competitors.join(', ')}

## Task

What DIFFICULTIES and FRUSTRATIONS does this audience face when searching for solutions to their problems?

Consider:
- Information overload
- Conflicting advice
- Past disappointments
- Trust issues
- Decision paralysis
- Practical obstacles

## Output Format

Return ONLY valid JSON:

{
  "difficulties": [
    {
      "name": "Information overload",
      "description": "Too many products, conflicting claims, hard to evaluate",
      "frequency": "constant",
      "emotional_impact": "Frustration, decision fatigue"
    },
    {
      "name": "Supplement disappointment cycle",
      "description": "Have tried many products with high hopes, minimal results",
      "frequency": "repeated",
      "emotional_impact": "Skepticism, wasted money guilt"
    },
    ...
  ]
}

Use frequency levels: "constant", "frequent", "occasional", "rare"`;
}
```

### Prompt 8: Deep Triggers

```typescript
export function buildTriggersPrompt(
  onboarding: OnboardingData,
  portraitFinal: PortraitFinal,
  jobs: Jobs,
  difficulties: Difficulties
): string {
  return `You are an expert consumer psychologist specializing in purchase behavior.
Always respond in English, regardless of input language.

## Target Audience

${portraitFinal.sociodemographics}
${portraitFinal.psychographics}

## Their Jobs to Be Done

${jobs.functional_jobs.map(j => `- ${j.job}`).join('\n')}
${jobs.emotional_jobs.map(j => `- ${j.job}`).join('\n')}

## Their Difficulties

${difficulties.difficulties.map(d => `- ${d.name}: ${d.description}`).join('\n')}

## Task

What are the DEEP PSYCHOLOGICAL TRIGGERS that drive purchase decisions for this audience?

These are NOT surface-level reasons, but underlying emotional and psychological motivations:
- Fear-based triggers (fear of missing out, judgment, failure)
- Aspiration-based triggers (desire for status, belonging, self-improvement)
- Pain-avoidance triggers (avoiding discomfort, embarrassment, regret)
- Identity-based triggers (becoming who they want to be)

## Output Format

Return ONLY valid JSON:

{
  "triggers": [
    {
      "name": "Fear of health decline",
      "description": "Worry that current trajectory leads to serious health issues",
      "psychological_basis": "Loss aversion, mortality salience",
      "trigger_moment": "After a health scare or seeing peers with health problems",
      "messaging_angle": "Prevention and proactive health investment"
    },
    {
      "name": "Desire for certainty",
      "description": "Want to stop guessing and know something actually works",
      "psychological_basis": "Need for control, cognitive closure",
      "trigger_moment": "After another failed product or conflicting information",
      "messaging_angle": "Science-backed, transparent, proven mechanism"
    },
    ...
  ]
}`;
}
```

### Prompt 9: Segments

```typescript
export function buildSegmentsPrompt(
  onboarding: OnboardingData,
  portraitFinal: PortraitFinal,
  jobs: Jobs,
  triggers: Triggers
): string {
  return `You are an expert marketing strategist specializing in audience segmentation.
Always respond in English, regardless of input language.

## Target Audience Overview

${portraitFinal.sociodemographics}
${portraitFinal.psychographics}

## Jobs to Be Done

Functional: ${jobs.functional_jobs.map(j => j.job).join(', ')}
Emotional: ${jobs.emotional_jobs.map(j => j.job).join(', ')}
Social: ${jobs.social_jobs.map(j => j.job).join(', ')}

## Deep Triggers

${triggers.triggers.map(t => `- ${t.name}: ${t.description}`).join('\n')}

## Brand Context

Brand: ${onboarding.brandName}
Product: ${onboarding.productService}
Price Segment: ${onboarding.priceSegment}

## Task

Divide this broad audience into UP TO 10 distinct segments.

Each segment should be:
- Meaningfully different from others
- Large enough to be worth targeting
- Specific enough to create targeted messaging

For each segment provide:
1. Name - memorable, descriptive
2. Description - who they are (2-3 sentences)
3. Sociodemographics - specific to this segment

## Output Format

Return ONLY valid JSON:

{
  "segments": [
    {
      "index": 1,
      "name": "Health-Conscious Professionals",
      "description": "High-achieving professionals who treat their body as a performance asset. They invest in premium solutions and research extensively before purchasing.",
      "sociodemographics": "35-50, 60% women, $100k+ income, urban, executives and entrepreneurs"
    },
    ...
  ],
  "total_segments": 10
}`;
}
```

### Prompt 10: Segments Review

```typescript
export function buildSegmentsReviewPrompt(
  onboarding: OnboardingData,
  segments: Segment[]
): string {
  return `You are an expert marketing strategist reviewing audience segmentation.
Always respond in English, regardless of input language.

## Current Segments

${segments.map(s => `
${s.index}. ${s.name}
   ${s.description}
   Demographics: ${s.sociodemographics}
`).join('\n')}

## Brand Context

Brand: ${onboarding.brandName}
Product: ${onboarding.productService}
Price Segment: ${onboarding.priceSegment}

## Task

Critically review this segmentation:

1. Are there OVERLAPS between segments? Which ones?
2. Are any segments TOO BROAD? Which ones?
3. Are any segments TOO NARROW? Which ones?
4. Are there MISSING segments that should be added?
5. Should any segments be MERGED?
6. Should any segments be SPLIT?

Provide at least 3 minimum matching segments with your actual customers if you were the brand.

## Output Format

Return ONLY valid JSON:

{
  "overlaps": [
    {
      "segments": [2, 5],
      "overlap_description": "Both target health-focused professionals...",
      "recommendation": "Merge into one or differentiate by X"
    }
  ],
  "too_broad": [
    {
      "segment": 3,
      "issue": "Covers too wide age range and motivations",
      "recommendation": "Split into sub-segments by age or motivation"
    }
  ],
  "too_narrow": [
    {
      "segment": 7,
      "issue": "Too specific, small addressable market",
      "recommendation": "Broaden or merge with segment X"
    }
  ],
  "missing_segments": [
    {
      "suggested_name": "Post-Surgery Recovery",
      "description": "People recovering from gut-related surgeries",
      "reasoning": "Significant market with high motivation"
    }
  ],
  "segments_matching_real_customers": [1, 4, 6],
  "overall_quality": 7,
  "top_recommendations": [
    "Recommendation 1...",
    "Recommendation 2...",
    "Recommendation 3..."
  ]
}`;
}
```

### Prompt 11: Segment Details

```typescript
export function buildSegmentDetailsPrompt(
  onboarding: OnboardingData,
  segment: Segment,
  triggers: Triggers
): string {
  return `You are an expert consumer psychologist.
Always respond in English, regardless of input language.

## Segment to Analyze

Name: ${segment.name}
Description: ${segment.description}
Sociodemographics: ${segment.sociodemographics}

## Known Deep Triggers (from general audience)

${triggers.triggers.map(t => `- ${t.name}: ${t.description}`).join('\n')}

## Product Context

Product: ${onboarding.productService}
Benefits:
${onboarding.benefits.map(b => `- ${b}`).join('\n')}

## Task

Provide detailed analysis for this specific segment:

### Needs
What specific needs does THIS segment have? (3-5 items)

### Triggers
What specifically triggers THIS segment to purchase? (3-5 items)

### Core Values
What values are most important to THIS segment? (3-5 items)

### Awareness Level
What is their awareness level?
- unaware: doesn't know they have a problem
- problem_aware: knows problem, doesn't know solution exists
- solution_aware: knows solutions exist, doesn't know your brand
- product_aware: knows your brand, hasn't purchased
- most_aware: has purchased or ready to buy

### Objections
Why might THIS segment NOT buy? What holds them back? (3-5 items)

## Output Format

Return ONLY valid JSON:

{
  "segment_name": "${segment.name}",
  "needs": [
    {
      "need": "Need description",
      "intensity": "critical/high/medium/low"
    },
    ...
  ],
  "triggers": [
    {
      "trigger": "Trigger description",
      "trigger_moment": "When this trigger activates"
    },
    ...
  ],
  "core_values": [
    {
      "value": "Value name",
      "manifestation": "How this value shows in behavior"
    },
    ...
  ],
  "awareness_level": "solution_aware",
  "awareness_reasoning": "Why this level...",
  "objections": [
    {
      "objection": "Objection description",
      "root_cause": "Underlying reason for objection",
      "how_to_overcome": "Potential response"
    },
    ...
  ]
}`;
}
```

### Prompt 12: Pains

```typescript
export function buildPainsPrompt(
  onboarding: OnboardingData,
  segment: Segment,
  segmentDetails: SegmentDetails
): string {
  return `You are a consumer psychologist specializing in pain point analysis.
Always respond in English, regardless of input language.

## Segment

Name: ${segment.name}
Description: ${segment.description}
Sociodemographics: ${segment.sociodemographics}

Needs:
${segmentDetails.needs.map(n => `- ${n.need}`).join('\n')}

Triggers:
${segmentDetails.triggers.map(t => `- ${t.trigger}`).join('\n')}

Objections:
${segmentDetails.objections.map(o => `- ${o.objection}`).join('\n')}

## Product Context

Product: ${onboarding.productService}
Problems Solved:
${onboarding.problems.map(p => `- ${p}`).join('\n')}

## Task

Identify 6-10 DEEP PSYCHOLOGICAL PAIN POINTS for this segment.

These are NOT surface-level problems, but underlying emotional and psychological pains:
- Fear-based pains (fear of missing out, judgment, failure, wasting money)
- Aspiration-based pains (gap between current and desired state)
- Pain-avoidance pains (discomfort, embarrassment, regret)
- Identity-based pains (not feeling like true self, imposter syndrome)

For each pain provide:
1. Name - clear, descriptive
2. Description - detailed explanation (2-3 sentences)
3. Deep Triggers - root psychological causes (3-5 items)
4. Examples - specific real-world manifestations with quotes (2-3 items)

## Output Format

Return ONLY valid JSON:

{
  "segment_name": "${segment.name}",
  "pains": [
    {
      "index": 1,
      "name": "Fear of wasted investment",
      "description": "Deep anxiety about spending money on yet another product that won't work. Previous failures have created a pattern of hope followed by disappointment.",
      "deep_triggers": [
        "Past financial losses on ineffective supplements",
        "Guilt about 'wasting' family money",
        "Fear of being seen as gullible"
      ],
      "examples": [
        "'I've spent hundreds on supplements that just sit in my cabinet'",
        "'My partner rolls their eyes every time I try something new'",
        "'I feel stupid for falling for marketing again'"
      ]
    },
    ...
  ]
}`;
}
```

### Prompt 13: Pains Ranking

```typescript
export function buildPainsRankingPrompt(
  segment: Segment,
  pains: Pain[]
): string {
  return `You are an expert in consumer purchase behavior.
Always respond in English, regardless of input language.

## Segment

Name: ${segment.name}
Description: ${segment.description}

## Pains to Rank

${pains.map(p => `
${p.index}. ${p.name}
   ${p.description}
`).join('\n')}

## Task

Rank these pains by their IMPACT ON PURCHASE DECISION.

Consider:
- How strongly does this pain motivate action?
- How urgent is the need to resolve this pain?
- How directly does the product address this pain?
- How emotionally charged is this pain?

Assign each pain:
- Impact score (1-10, where 10 = highest purchase motivation)
- Mark top 3 as needing deep Canvas analysis

## Output Format

Return ONLY valid JSON:

{
  "segment_name": "${segment.name}",
  "rankings": [
    {
      "pain_index": 1,
      "pain_name": "Fear of wasted investment",
      "impact_score": 9,
      "is_top_pain": true,
      "reasoning": "This directly blocks purchase decisions and must be addressed..."
    },
    ...
  ],
  "top_3_for_canvas": [1, 3, 5],
  "ranking_methodology": "Explanation of how you ranked..."
}`;
}
```

### Prompt 14: Canvas

```typescript
export function buildCanvasPrompt(
  segment: Segment,
  pain: Pain
): string {
  return `You are a consumer psychologist specializing in deep behavioral analysis.
Always respond in English, regardless of input language.

## Segment

Name: ${segment.name}
Description: ${segment.description}

## Pain Point to Analyze

Name: ${pain.name}
Description: ${pain.description}

Deep Triggers:
${pain.deep_triggers.map(t => `- ${t}`).join('\n')}

Examples:
${pain.examples.map(e => `- ${e}`).join('\n')}

## Task: Canvas Analysis

Explore this pain from multiple angles:

### 1. Emotional Aspects
- What specific emotions does this pain trigger?
- How intense are these emotions?
- How does this affect their self-image?
- What fears are connected?
- What hopes/desires are blocked?

### 2. Behavioral Patterns
- How do they currently cope with this pain?
- What workarounds have they tried?
- What is their search behavior?
- How does this pain affect daily decisions?
- What avoidance behaviors exist?

### 3. Buying Signals
- What would make them ready to buy NOW?
- What words/phrases would resonate?
- What proof do they need to see?
- What objections must be overcome?
- What trigger events push them to act?

## Output Format

Return ONLY valid JSON:

{
  "pain_name": "${pain.name}",
  "emotional_aspects": [
    {
      "emotion": "Frustration",
      "intensity": "high",
      "description": "Ongoing frustration from repeated failures...",
      "self_image_impact": "Feels like they can't figure out what works",
      "connected_fears": ["Fear of never finding a solution", "Fear of health decline"],
      "blocked_desires": ["Desire to feel confident in health choices"]
    },
    ...
  ],
  "behavioral_patterns": [
    {
      "pattern": "Extensive research before purchase",
      "description": "Spends hours reading reviews and studies...",
      "frequency": "Every purchase decision",
      "coping_mechanism": "Tries to minimize risk through information",
      "avoidance": "Avoids impulse purchases, delays decisions"
    },
    ...
  ],
  "buying_signals": [
    {
      "signal": "Asks about money-back guarantee",
      "readiness_level": "high",
      "messaging_angle": "Risk-free trial, satisfaction guaranteed",
      "proof_needed": "Clear refund policy, testimonials from skeptics"
    },
    ...
  ]
}`;
}
```

### Prompt 15: Canvas Extended

```typescript
export function buildCanvasExtendedPrompt(
  segment: Segment,
  pain: Pain,
  canvas: Canvas
): string {
  return `You are a consumer psychologist specializing in narrative psychology.
Always respond in English, regardless of input language.

## Segment

Name: ${segment.name}

## Pain Point

Name: ${pain.name}
Description: ${pain.description}

## Canvas Analysis

Emotional Aspects:
${canvas.emotional_aspects.map(e => `- ${e.emotion}: ${e.description}`).join('\n')}

Behavioral Patterns:
${canvas.behavioral_patterns.map(b => `- ${b.pattern}: ${b.description}`).join('\n')}

Buying Signals:
${canvas.buying_signals.map(s => `- ${s.signal}: ${s.messaging_angle}`).join('\n')}

## Task: Extended Deep Dive

Write a comprehensive analysis of this pain, exploring it from multiple angles.

### 1. The Journey
Describe the journey from pain awareness to solution seeking:
- How did they first notice this pain?
- What was the trigger moment?
- What have they tried before?
- Where are they now in their journey?

### 2. Emotional Peaks and Valleys
Describe the emotional experience:
- When is the pain most intense?
- What brings temporary relief?
- What makes it worse?
- How does it affect relationships?

### 3. The Purchase Decision Moment
What happens at the moment of purchase decision:
- What tips them over the edge?
- What last-minute doubts arise?
- What confirmation do they seek?
- How do they justify the purchase?

### 4. Post-Purchase Reality
What happens after they buy:
- What relief do they feel?
- What validation do they seek?
- What would make them advocates?
- What could cause buyer's remorse?

## Output Format

Return ONLY valid JSON:

{
  "pain_name": "${pain.name}",
  "extended_analysis": "Multi-paragraph comprehensive narrative analysis...",
  "different_angles": [
    {
      "angle": "The Skeptic's Journey",
      "narrative": "How a skeptic experiences this pain..."
    },
    {
      "angle": "The Desperate Seeker",
      "narrative": "How someone at wit's end experiences this..."
    }
  ],
  "journey_description": "Detailed journey from awareness to action...",
  "emotional_peaks": "When pain is most intense...",
  "emotional_valleys": "When there's temporary relief...",
  "purchase_moment": "What happens at decision time...",
  "post_purchase": "What happens after buying..."
}`;
}
```

---

## API Endpoints

### Generate Endpoints (15)

```
POST /api/generate/validation
POST /api/generate/portrait
POST /api/generate/portrait-review
POST /api/generate/portrait-final
POST /api/generate/jobs
POST /api/generate/preferences
POST /api/generate/difficulties
POST /api/generate/triggers
POST /api/generate/segments
POST /api/generate/segments-review
POST /api/generate/segment-details
POST /api/generate/pains
POST /api/generate/pains-ranking
POST /api/generate/canvas
POST /api/generate/canvas-extended
```

### Approve Endpoints (15)

```
POST /api/approve/validation
POST /api/approve/portrait
POST /api/approve/portrait-review
POST /api/approve/portrait-final
POST /api/approve/jobs
POST /api/approve/preferences
POST /api/approve/difficulties
POST /api/approve/triggers
POST /api/approve/segments
POST /api/approve/segments-review
POST /api/approve/segment-details
POST /api/approve/pains
POST /api/approve/pains-ranking
POST /api/approve/canvas
POST /api/approve/canvas-extended
```

### Draft CRUD Endpoints

```
PATCH /api/drafts/:table/:id
DELETE /api/drafts/:table/:id
POST /api/drafts/:table (add custom)
```

---

## Frontend Pages (15)

```
/projects/[id]/generate/validation
/projects/[id]/generate/portrait
/projects/[id]/generate/portrait-review
/projects/[id]/generate/portrait-final
/projects/[id]/generate/jobs
/projects/[id]/generate/preferences
/projects/[id]/generate/difficulties
/projects/[id]/generate/triggers
/projects/[id]/generate/segments
/projects/[id]/generate/segments-review
/projects/[id]/generate/segment-details
/projects/[id]/generate/pains
/projects/[id]/generate/pains-ranking
/projects/[id]/generate/canvas
/projects/[id]/generate/canvas-extended
```

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                      ONBOARDING                             │
│                         ↓                                   │
│              projects.onboarding_data                       │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  BLOCK 1: PORTRAIT                                          │
│                                                             │
│  [1] Validation                                             │
│      validation_drafts → [Approve] → validation             │
│                                  ↓                          │
│  [2] Portrait                                               │
│      Uses: validation                                       │
│      portrait_drafts → [Approve] → portrait                 │
│                                  ↓                          │
│  [3] Portrait Review                                        │
│      Uses: portrait                                         │
│      portrait_review_drafts → [Approve] → portrait_review   │
│                                  ↓                          │
│  [4] Portrait Final                                         │
│      Uses: portrait + portrait_review                       │
│      portrait_final_drafts → [Approve] → portrait_final     │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  BLOCK 2: DEEP ANALYSIS                                     │
│                                                             │
│  [5] Jobs to Be Done                                        │
│      Uses: portrait_final                                   │
│      jobs_drafts → [Approve] → jobs                         │
│                                  ↓                          │
│  [6] Preferences                                            │
│      Uses: portrait_final + jobs                            │
│      preferences_drafts → [Approve] → preferences           │
│                                  ↓                          │
│  [7] Difficulties                                           │
│      Uses: portrait_final + preferences                     │
│      difficulties_drafts → [Approve] → difficulties         │
│                                  ↓                          │
│  [8] Triggers                                               │
│      Uses: portrait_final + jobs + difficulties             │
│      triggers_drafts → [Approve] → triggers                 │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  BLOCK 3: SEGMENTATION                                      │
│                                                             │
│  [9] Segments                                               │
│      Uses: portrait_final + jobs + triggers                 │
│      segments_drafts → [Approve] → segments_initial         │
│                                  ↓                          │
│  [10] Segments Review                                       │
│       Uses: segments_initial                                │
│       segments_review_drafts → [Approve] → segments_review  │
│                                  ↓                          │
│  [11] Segment Details (per segment)                         │
│       Uses: segments_initial + triggers                     │
│       segment_details_drafts → [Approve] → segment_details  │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  BLOCK 4: PAINS                                             │
│                                                             │
│  [12] Pains (per segment)                                   │
│       Uses: segment + segment_details                       │
│       pains_drafts → [Approve] → pains_initial              │
│                                  ↓                          │
│  [13] Pains Ranking (per segment)                           │
│       Uses: pains_initial                                   │
│       pains_ranking_drafts → [Approve] → pains_ranking      │
│                                  ↓                          │
│  [14] Canvas (per top pain)                                 │
│       Uses: pain where is_top_pain = true                   │
│       canvas_drafts → [Approve] → canvas                    │
│                                  ↓                          │
│  [15] Canvas Extended (per canvas)                          │
│       Uses: canvas                                          │
│       canvas_extended_drafts → [Approve] → canvas_extended  │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  FINAL: COMPILE REPORTS                                     │
│                                                             │
│  Aggregate all approved data into final tables:             │
│                                                             │
│  audience ← validation + portrait_final + jobs +            │
│             preferences + difficulties + triggers           │
│                                                             │
│  segments ← segments_initial + segment_details              │
│                                                             │
│  pains ← pains_initial + pains_ranking +                    │
│          canvas + canvas_extended                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Summary

| Component | Count |
|-----------|-------|
| Промпти | 15 |
| Draft таблиці | 15 |
| Approved таблиці | 15 |
| Фінальні таблиці | 3 |
| **Всього таблиць** | **33** |
| API Generate endpoints | 15 |
| API Approve endpoints | 15 |
| Frontend pages | 15 |

---

*Document Version: 4.0*
*Status: Ready for Implementation*
