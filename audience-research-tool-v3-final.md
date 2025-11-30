# Audience Research Tool — Final Architecture v3

## Ключова концепція

**Draft → Review → Approve → Next Step**

Кожен етап генерації:
1. AI генерує результат → зберігає в `*_drafts` таблицю
2. Користувач переглядає, редагує, видаляє, додає
3. Натискає [Approve] → дані копіюються в основну таблицю
4. Наступний промпт використовує ТІЛЬКИ approved дані

---

## Database Schema

### Таблиці Drafts (тимчасові результати генерації)

```sql
-- Overview Draft
CREATE TABLE overview_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Validation
  product_understanding TEXT,
  
  -- Portrait
  sociodemographics TEXT,
  psychographics TEXT,
  
  -- Jobs to Be Done
  functional_jobs JSONB,  -- ["job1", "job2"]
  emotional_jobs JSONB,
  social_jobs JSONB,
  
  -- Problems & Triggers
  product_preferences JSONB,
  difficulties JSONB,
  general_pains JSONB,
  deep_triggers JSONB,
  
  -- Meta
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Segments Draft
CREATE TABLE segments_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  
  segment_index INTEGER,
  name TEXT,
  description TEXT,
  sociodemographics TEXT,
  
  -- Core
  needs JSONB,
  triggers JSONB,
  core_values JSONB,
  
  -- New fields
  awareness_level TEXT CHECK (awareness_level IN ('unaware', 'problem_aware', 'solution_aware', 'product_aware', 'most_aware')),
  objections JSONB,  -- ["objection1", "objection2"]
  
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Pains Draft
CREATE TABLE pains_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  segment_id UUID,  -- references approved segment
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  
  pain_index INTEGER,
  name TEXT,
  description TEXT,
  deep_triggers JSONB,
  examples JSONB,
  
  -- Ranking
  impact_score INTEGER CHECK (impact_score BETWEEN 1 AND 10),
  is_top_pain BOOLEAN DEFAULT false,
  
  -- Canvas (only for top pains)
  canvas_emotional_aspects JSONB,
  canvas_behavioral_patterns JSONB,
  canvas_buying_signals JSONB,
  canvas_extended_analysis TEXT,
  
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies
ALTER TABLE overview_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE segments_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE pains_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own drafts" ON overview_drafts
  FOR ALL USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));
  
CREATE POLICY "Users own drafts" ON segments_drafts
  FOR ALL USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));
  
CREATE POLICY "Users own drafts" ON pains_drafts
  FOR ALL USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));
```

### Таблиці Approved (фінальні дані для роботи)

```sql
-- Audience Overview (approved)
-- Вже існує, додаємо нові поля:
ALTER TABLE audience_overviews 
ADD COLUMN IF NOT EXISTS product_understanding TEXT,
ADD COLUMN IF NOT EXISTS functional_jobs JSONB,
ADD COLUMN IF NOT EXISTS emotional_jobs JSONB,
ADD COLUMN IF NOT EXISTS social_jobs JSONB,
ADD COLUMN IF NOT EXISTS product_preferences JSONB,
ADD COLUMN IF NOT EXISTS difficulties JSONB,
ADD COLUMN IF NOT EXISTS deep_triggers JSONB;

-- Segments (approved)
-- Вже існує, додаємо нові поля:
ALTER TABLE segments
ADD COLUMN IF NOT EXISTS awareness_level TEXT,
ADD COLUMN IF NOT EXISTS objections JSONB;

-- Pains (approved)
-- Вже існує, додаємо нові поля:
ALTER TABLE pains
ADD COLUMN IF NOT EXISTS impact_score INTEGER,
ADD COLUMN IF NOT EXISTS is_top_pain BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS canvas_emotional_aspects JSONB,
ADD COLUMN IF NOT EXISTS canvas_behavioral_patterns JSONB,
ADD COLUMN IF NOT EXISTS canvas_buying_signals JSONB,
ADD COLUMN IF NOT EXISTS canvas_extended_analysis TEXT;
```

---

## API Endpoints

### Generate Endpoints (створюють drafts)

```
POST /api/generate/overview
  → Генерує в overview_drafts
  → Response: { draft_id, data }

POST /api/generate/overview/regenerate
  → Видаляє старий draft, створює новий (version + 1)
  → Request: { project_id, feedback?: string }

POST /api/generate/segments
  → Генерує в segments_drafts (до 10 записів)
  → Використовує дані з audience_overviews (approved!)

POST /api/generate/pains
  → Генерує в pains_drafts
  → Використовує дані з segments (approved!)
  → Автоматично ранжує і позначає top-3 для Canvas

POST /api/generate/canvas
  → Генерує Canvas тільки для top pains
  → Request: { pain_draft_ids: string[] }
```

### Approve Endpoints (копіюють drafts → approved)

```
POST /api/approve/overview
  → Копіює з overview_drafts в audience_overviews
  → Видаляє draft
  → Оновлює project.current_step = 'segments'
  → Request: { 
      project_id,
      edits?: { ... }  // optional manual edits
    }

POST /api/approve/segments
  → Копіює вибрані з segments_drafts в segments
  → Request: { 
      project_id,
      approved_segment_ids: string[],  // які approve
      edits?: { [segment_id]: { ... } }  // optional edits
    }
  → Видаляє всі drafts
  → Оновлює project.current_step = 'pains'

POST /api/approve/pains
  → Копіює вибрані з pains_drafts в pains
  → Request: {
      project_id,
      approved_pain_ids: string[],
      edits?: { [pain_id]: { ... } }
    }
  → Оновлює project.current_step = 'completed'
```

### CRUD Endpoints (редагування drafts)

```
PATCH /api/drafts/overview/:id
DELETE /api/drafts/overview/:id

PATCH /api/drafts/segments/:id
DELETE /api/drafts/segments/:id

POST /api/drafts/segments  -- додати кастомний сегмент
  → Request: { project_id, name, description, ... }

PATCH /api/drafts/pains/:id
DELETE /api/drafts/pains/:id

POST /api/drafts/pains  -- додати кастомний pain
  → Request: { segment_id, name, description, ... }
```

---

## Prompts

### Prompt 1: Validation + Overview

```typescript
export function buildOverviewPrompt(
  onboarding: OnboardingData,
  filesContent: string[] = []
): string {
  return `You are an expert marketing strategist specializing in audience research.
Always respond in English, regardless of input language.

## STEP 1: Validate Understanding

First, confirm you understand the product correctly. Summarize:
- What the brand sells
- What problem it solves
- What makes it different from competitors

## STEP 2: Audience Portrait

Based on the brand context, create a comprehensive audience portrait:

### Socio-demographics
- Age range, gender distribution
- Income level, education
- Location, occupation
- Family status

### Psychographics
- Values and beliefs
- Lifestyle and habits
- Interests and hobbies
- Personality traits

## STEP 3: Jobs to Be Done

What does the customer want to achieve?

### Functional Jobs (practical outcomes)
- What task do they need to accomplish?

### Emotional Jobs (how they want to feel)
- What emotional state do they seek?

### Social Jobs (how they want to be perceived)
- How do they want others to see them?

## STEP 4: Product Analysis

### Product Preferences
What specific features/attributes does this audience look for?

### Difficulties
What frustrations do they face when searching for solutions?

### General Pain Points
What are the top-level problems they experience?

### Deep Triggers
What are the psychological motivations behind purchases?

## Context

Brand: ${onboarding.brandName}
Product: ${onboarding.productService}
Format: ${onboarding.productFormat}

Problems Solved:
${onboarding.problems.map(p => `- ${p}`).join('\n')}

Benefits:
${onboarding.benefits.map(b => `- ${b}`).join('\n')}

USP: ${onboarding.usp}
Geography: ${onboarding.geography}
Business Model: ${onboarding.businessModel}
Price Segment: ${onboarding.priceSegment}
${onboarding.idealCustomer ? `Known Ideal Customer: ${onboarding.idealCustomer}` : ''}

Competitors:
${onboarding.competitors.map(c => `- ${c}`).join('\n')}

Differentiation: ${onboarding.differentiation}
${onboarding.notAudience ? `NOT Target Audience: ${onboarding.notAudience}` : ''}
${onboarding.additionalContext ? `Additional Context: ${onboarding.additionalContext}` : ''}

${filesContent.length > 0 ? `
## Uploaded Documents
${filesContent.map((content, i) => `### Document ${i + 1}\n${content}`).join('\n\n')}
` : ''}

## Output Format

Return ONLY valid JSON:

{
  "product_understanding": {
    "what_brand_sells": "...",
    "problem_solved": "...",
    "key_differentiator": "..."
  },
  "portrait": {
    "sociodemographics": "Detailed text description...",
    "psychographics": "Detailed text description..."
  },
  "jobs_to_be_done": {
    "functional": ["Job 1", "Job 2", "Job 3"],
    "emotional": ["Job 1", "Job 2", "Job 3"],
    "social": ["Job 1", "Job 2"]
  },
  "product_analysis": {
    "preferences": ["Preference 1", "Preference 2", ...],
    "difficulties": ["Difficulty 1", "Difficulty 2", ...],
    "general_pains": ["Pain 1", "Pain 2", ...],
    "deep_triggers": ["Trigger 1", "Trigger 2", ...]
  }
}`;
}
```

### Prompt 2: Segments

```typescript
export function buildSegmentsPrompt(
  onboarding: OnboardingData,
  approvedOverview: AudienceOverview  // FROM APPROVED TABLE!
): string {
  return `You are an expert marketing strategist specializing in audience segmentation.
Always respond in English, regardless of input language.

## Context

Brand: ${onboarding.brandName}
Product: ${onboarding.productService}
Price Segment: ${onboarding.priceSegment}

## Approved Audience Overview

${approvedOverview.sociodemographics}

${approvedOverview.psychographics}

Jobs to Be Done:
- Functional: ${approvedOverview.functional_jobs?.join(', ')}
- Emotional: ${approvedOverview.emotional_jobs?.join(', ')}
- Social: ${approvedOverview.social_jobs?.join(', ')}

General Pains:
${approvedOverview.general_pains.map(p => `- ${p}`).join('\n')}

Deep Triggers:
${approvedOverview.deep_triggers?.map(t => `- ${t}`).join('\n')}

## Task

Divide this audience into distinct segments. Recommend up to 10, but only include segments that are truly relevant.

For each segment provide:

1. **Name** - memorable, descriptive name
2. **Description** - who they are, their situation (2-3 sentences)
3. **Sociodemographics** - specific to this segment
4. **Needs** - what they're looking for (3-5 items)
5. **Triggers** - what drives their purchase decisions (3-5 items)
6. **Core Values** - what matters most to them (3-5 items)
7. **Awareness Level** - one of:
   - unaware: doesn't know they have a problem
   - problem_aware: knows problem, doesn't know solution exists
   - solution_aware: knows solutions exist, doesn't know your brand
   - product_aware: knows your brand, hasn't purchased
   - most_aware: has purchased or ready to buy
8. **Objections** - why they might NOT buy (3-5 items)

After creating segments, review critically:
- Are there overlaps?
- Is any segment too broad or too narrow?
- Are there missing segments?

Provide final improved list.

## Output Format

Return ONLY valid JSON:

{
  "initial_segments": [...],
  "self_review": {
    "overlaps": ["..."],
    "too_broad": ["..."],
    "too_narrow": ["..."],
    "missing": ["..."]
  },
  "final_segments": [
    {
      "index": 1,
      "name": "Segment Name",
      "description": "Who they are...",
      "sociodemographics": "Age, gender, income...",
      "needs": ["Need 1", "Need 2", "Need 3"],
      "triggers": ["Trigger 1", "Trigger 2", "Trigger 3"],
      "core_values": ["Value 1", "Value 2", "Value 3"],
      "awareness_level": "solution_aware",
      "objections": ["Objection 1", "Objection 2", "Objection 3"]
    },
    ...
  ],
  "recommended_count": 8  // how many AI recommends to keep
}`;
}
```

### Prompt 3: Pains per Segment

```typescript
export function buildPainsPrompt(
  onboarding: OnboardingData,
  approvedSegment: Segment  // FROM APPROVED TABLE!
): string {
  return `You are a consumer psychologist specializing in purchase behavior.
Always respond in English, regardless of input language.

## Context

Brand: ${onboarding.brandName}
Product: ${onboarding.productService}

## Target Segment (APPROVED)

Name: ${approvedSegment.name}
Description: ${approvedSegment.description}
Sociodemographics: ${approvedSegment.sociodemographics}

Needs:
${approvedSegment.needs.map(n => `- ${n}`).join('\n')}

Triggers:
${approvedSegment.triggers.map(t => `- ${t}`).join('\n')}

Core Values:
${approvedSegment.core_values.map(v => `- ${v}`).join('\n')}

Awareness Level: ${approvedSegment.awareness_level}

Objections:
${approvedSegment.objections?.map(o => `- ${o}`).join('\n')}

## Task

Identify 6-10 deep psychological pain points for this segment.

These are NOT surface-level problems, but underlying emotional and psychological motivations.

For each pain:
1. **Name** - clear, descriptive name
2. **Description** - detailed explanation (2-3 sentences)
3. **Deep Triggers** - root psychological causes (3-5 items)
4. **Examples** - specific real-world manifestations (2-3 quotes/scenarios)
5. **Impact Score** - rate 1-10 how strongly this drives purchase decisions

Focus on:
- Fear-based: fear of missing out, judgment, failure, wasting money
- Aspiration-based: desire for status, belonging, self-improvement
- Pain-avoidance: avoiding discomfort, embarrassment, regret
- Identity-based: not feeling like true self, imposter syndrome

Rank pains by impact_score and mark top 3 as requiring deep Canvas analysis.

## Output Format

Return ONLY valid JSON:

{
  "segment_name": "${approvedSegment.name}",
  "pains": [
    {
      "index": 1,
      "name": "Pain Name",
      "description": "Detailed description...",
      "deep_triggers": ["Trigger 1", "Trigger 2", "Trigger 3"],
      "examples": [
        "Example quote or scenario 1",
        "Example quote or scenario 2"
      ],
      "impact_score": 9,
      "is_top_pain": true
    },
    ...
  ],
  "top_3_for_canvas": [1, 3, 5]  // indices of pains needing Canvas
}`;
}
```

### Prompt 4: Canvas (Deep Dive)

```typescript
export function buildCanvasPrompt(
  onboarding: OnboardingData,
  segment: Segment,
  pain: Pain  // pain that was marked is_top_pain
): string {
  return `You are a consumer psychologist specializing in deep behavioral analysis.
Always respond in English, regardless of input language.

## Context

Brand: ${onboarding.brandName}
Product: ${onboarding.productService}

Segment: ${segment.name}
${segment.description}

## Pain Point to Analyze

Name: ${pain.name}
Description: ${pain.description}

Deep Triggers:
${pain.deep_triggers.map(t => `- ${t}`).join('\n')}

Examples:
${pain.examples.map(e => `- ${e}`).join('\n')}

## Task: Deep Canvas Analysis

Explore this pain from multiple angles:

### 1. Emotional Aspects
- What emotions does this pain trigger?
- How does it affect their self-image?
- What fears are connected to this pain?
- What hopes/desires are blocked by this pain?

### 2. Behavioral Patterns
- How do they currently cope with this pain?
- What workarounds have they tried?
- What does their search behavior look like?
- How does this pain affect daily decisions?

### 3. Buying Signals
- What would make them ready to buy?
- What words/phrases would resonate?
- What proof do they need?
- What would overcome their objections?

### 4. Extended Analysis
Write a comprehensive 3-4 paragraph analysis of this pain, exploring:
- The journey from pain awareness to solution seeking
- The emotional peaks and valleys
- The moment of purchase decision
- What happens after purchase (relief, validation, etc.)

## Output Format

Return ONLY valid JSON:

{
  "pain_name": "${pain.name}",
  "canvas": {
    "emotional_aspects": [
      {
        "emotion": "Frustration",
        "description": "How it manifests...",
        "intensity": "high/medium/low"
      },
      ...
    ],
    "behavioral_patterns": [
      {
        "pattern": "Pattern name",
        "description": "How they behave...",
        "frequency": "daily/weekly/monthly"
      },
      ...
    ],
    "buying_signals": [
      {
        "signal": "Signal name",
        "description": "What indicates readiness...",
        "messaging_angle": "How to address this..."
      },
      ...
    ],
    "extended_analysis": "Multi-paragraph deep analysis..."
  }
}`;
}
```

---

## User Flow & UI

### Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      ONBOARDING                             │
│  [Step 1] → [Step 2] → [Step 3] → [Step 4] → [Step 5]      │
│                           ↓                                 │
│                    [Start Analysis]                         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   OVERVIEW GENERATION                       │
│                                                             │
│  [Generating...] → [Review Draft] → [Edit] → [Approve]     │
│                                                             │
│  Draft saved to: overview_drafts                           │
│  On Approve → copies to: audience_overviews                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  SEGMENTS GENERATION                        │
│                                                             │
│  Uses: audience_overviews (approved!)                      │
│                                                             │
│  [Generating...] → [Review 10 Drafts]                      │
│                           ↓                                 │
│  [Select which to keep] [Edit] [Delete] [Add custom]       │
│                           ↓                                 │
│  [Approve Selected] → copies to: segments                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    PAINS GENERATION                         │
│                                                             │
│  Uses: segments (approved!)                                │
│  Generates for each approved segment                       │
│                                                             │
│  [Generating...] → [Review Pains by Segment]               │
│                           ↓                                 │
│  [Select which to keep] [Edit] [Delete] [Add custom]       │
│  [Top 3 auto-marked for Canvas]                            │
│                           ↓                                 │
│  [Approve Selected] → copies to: pains                     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   CANVAS GENERATION                         │
│                                                             │
│  Uses: pains where is_top_pain = true                      │
│  Auto-generates for top 3 per segment                      │
│                                                             │
│  [Generating...] → [Review Canvas]                         │
│  [Edit] → [Approve] → updates pains table                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                       COMPLETE                              │
│                                                             │
│  [View All] [Export] [Start Creatives →]                   │
└─────────────────────────────────────────────────────────────┘
```

### UI Pages

```
/projects/[id]/generate/overview     -- Generate + Review Overview
/projects/[id]/generate/segments     -- Generate + Review Segments
/projects/[id]/generate/pains        -- Generate + Review Pains
/projects/[id]/generate/canvas       -- Generate + Review Canvas

/projects/[id]/overview              -- View approved overview
/projects/[id]/segments              -- View approved segments
/projects/[id]/pains                 -- View approved pains
/projects/[id]/export                -- Export all data
```

### Review Page Components

```
┌─────────────────────────────────────────────────────────────┐
│  Review: Audience Overview                      [Regenerate]│
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ✓ Product Understanding                                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Brand sells: Frozen functional food for gut health  │   │
│  │ Problem solved: Digestive issues, low energy        │   │
│  │ Differentiator: Frozen (not powder) = living        │   │
│  └─────────────────────────────────────────────────────┘   │
│  [Looks correct ✓] [Edit]                                  │
│                                                             │
│  Socio-demographics                              [Edit ✏️] │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Adults 32-55, 65% women, income $80k+...            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Psychographics                                   [Edit ✏️] │
│  ...                                                        │
│                                                             │
│  Jobs to Be Done                                  [Edit ✏️] │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Functional:                                         │   │
│  │ • Improve gut health                                │   │
│  │ • Get more stable energy                            │   │
│  │                                                     │   │
│  │ Emotional:                                          │   │
│  │ • Feel in control of health                         │   │
│  │ • Stop worrying about digestion                     │   │
│  │                                                     │   │
│  │ Social:                                             │   │
│  │ • Be seen as health-conscious                       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ... more sections ...                                      │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [← Back]                    [Approve & Continue →]         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Project Status Flow

```sql
-- project.current_step values:

'onboarding'        -- Filling onboarding form
'overview_draft'    -- Reviewing overview draft
'overview_approved' -- Overview approved, ready for segments
'segments_draft'    -- Reviewing segments draft  
'segments_approved' -- Segments approved, ready for pains
'pains_draft'       -- Reviewing pains draft
'pains_approved'    -- Pains approved, ready for canvas
'canvas_draft'      -- Reviewing canvas draft
'completed'         -- All done

-- Update CHECK constraint:
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_current_step_check;
ALTER TABLE projects ADD CONSTRAINT projects_current_step_check 
  CHECK (current_step IN (
    'onboarding', 
    'overview_draft', 'overview_approved',
    'segments_draft', 'segments_approved', 
    'pains_draft', 'pains_approved',
    'canvas_draft', 'completed'
  ));
```

---

## Implementation Order

### Phase 1: Database
1. Create draft tables
2. Add new columns to approved tables
3. Update current_step constraint

### Phase 2: Overview Flow
1. Update overview prompt
2. Create /api/generate/overview (saves to draft)
3. Create /api/approve/overview (draft → approved)
4. Create /generate/overview page with review UI

### Phase 3: Segments Flow
1. Create segments prompt
2. Create /api/generate/segments
3. Create /api/approve/segments
4. Create /generate/segments page

### Phase 4: Pains Flow
1. Create pains prompt
2. Create /api/generate/pains
3. Create /api/approve/pains
4. Create /generate/pains page

### Phase 5: Canvas Flow
1. Create canvas prompt
2. Create /api/generate/canvas
3. Create /generate/canvas page

### Phase 6: Polish
1. Regenerate buttons
2. Add custom segment/pain
3. Export functionality
4. Error handling

---

## Summary

| Aspect | Before | After |
|--------|--------|-------|
| Data flow | Generate → Save immediately | Generate → Draft → Review → Approve |
| Tables | 1 per entity | 2 per entity (draft + approved) |
| Prompts | 3 basic | 4 detailed with JTBD, Objections, Canvas |
| User control | None | Full edit/delete/add/approve |
| Segments | Always 10 | Up to 10, user chooses |
| Pains | All equal | Ranked, top 3 get Canvas |
| Canvas | None | Deep analysis for top pains |

---

*Document Version: 3.0*
*Status: Ready for Implementation*
