# PROMPTS V6 (Strategy + Communications + UGC + Ads)

This file defines the prompt contracts for all V6 generators.
All outputs MUST be valid JSON and MUST be in English.

---

## Global Output Rules (applies to every prompt)

1. Return ONLY JSON. No markdown, no comments, no prose outside JSON.
2. Use double quotes for all keys and string values.
3. Do NOT include unescaped line breaks inside strings. Use "\\n" if needed.
4. No trailing commas.
5. If a field is optional, still include it (use null or empty array as specified).
6. Do NOT invent IDs unless explicitly required. Use IDs only when provided in input.
7. Do NOT include PII, medical claims, diagnosis, cure claims, or guaranteed outcomes.
8. Output language: English.
9. Keep arrays concise (3-6 items unless minimums require more).

---

## Shared Input Pack (template)

Every generator receives a pack with the following sections (some optional).
Use the same naming in your prompt builder.

```
## Business Context
- Brand:
- Product/Service:
- Product Format:
- USP:
- Business Model:
- Price Segment:
- Competitors:
- Differentiation:
- Geography:

## Segment
- segment_id:
- name:
- description:
- sociodemographics:
- segment_details:

## Pain (top pain only)
- pain_id:
- name:
- description:
- impact_score:
- is_top_pain: true

## Research
- portrait_final:
- jobs:
- preferences:
- difficulties:
- triggers:
- pains_ranking:
- canvas:
- canvas_extended:

## V5 Modules
- channel_strategy:
- competitive_intelligence:
- pricing_psychology:
- trust_framework:
- jtbd_context:
```

---

## Scoring Normalization (for Strategy Summary)

Use this mapping when scoring growth bets:

- job_frequency: daily=5, weekly=4, monthly=3, occasionally=2, rarely=1
- trigger_urgency: critical=5, high=4, medium=3, low=2
- pain_impact: use impact_score (1-5) or normalize 1-10 into 1-5

---

## Prompt: Strategy Summary (per project)

### Purpose
Create a project-level strategic summary. This is NOT per segment.
It must include scored growth bets and positioning pillars.

### Output JSON Schema
```
{
  "growth_bets": [
    {
      "title": "string",
      "rationale": "string",
      "score": 0,
      "key_jobs": ["string"],
      "key_triggers": ["string"],
      "key_pains": ["string"]
    }
  ],
  "positioning_pillars": [
    {
      "pillar": "string",
      "proof_points": ["string"],
      "objections": ["string"]
    }
  ],
  "channel_priorities": [
    {
      "channel": "string",
      "why": "string",
      "fit_score": 0,
      "segments": ["string"]
    }
  ],
  "risk_flags": [
    {
      "risk": "string",
      "impact": "string",
      "mitigation": "string"
    }
  ]
}
```

### Minimum Requirements
- growth_bets: 3 items
- positioning_pillars: 3 items
- channel_priorities: 5 items
- risk_flags: 3 items
### Output Constraints
- Keep each string under 240 characters.

### Scoring Rule
growth_bet_score = job_frequency × trigger_urgency × pain_impact

### System Prompt
You are a senior growth strategist. Produce a concise, structured strategy summary in strict JSON.

### User Prompt Template
```
You will generate a project-level strategy summary.

Use the provided research data to produce:
1) 3 scored growth bets
2) 3 positioning pillars
3) 5 channel priorities
4) 3 risk flags with mitigations

Use the scoring rule: growth_bet_score = job_frequency × trigger_urgency × pain_impact.
Return ONLY valid JSON matching the schema.

## Business Context
{{business_context}}

## Research
{{research_pack}}

## V5 Modules
{{v5_pack}}
```

---

## Prompt: Strategy Personalized (per segment x top pain)

### Purpose
Generate TOF/MOF/BOF strategy for a specific segment and top pain.

### Output JSON Schema
```
{
  "tof_ugc_hooks": [
    {
      "hook_type": "problem_agitation",
      "script_outline": "string",
      "emotional_angle": "string",
      "visual_direction": "string",
      "cta": "string"
    }
  ],
  "mof_quiz_flow": {
    "quiz_title": "string",
    "questions": [
      {
        "question": "string",
        "options": ["string"],
        "segment_logic": "string"
      }
    ],
    "branching_logic": "string",
    "lead_magnet": "string"
  },
  "mof_chat_script": {
    "opening_message": "string",
    "discovery_questions": ["string"],
    "objection_handlers": [
      {
        "objection": "string",
        "response": "string"
      }
    ],
    "handoff_trigger": "string"
  },
  "bof_creative_briefs": [
    {
      "format": "static",
      "headline": "string",
      "body": "string",
      "visual_concept": "string",
      "cta": "string",
      "target_placement": "feed"
    }
  ],
  "bof_landing_structure": {
    "hero_headline": "string",
    "hero_subheadline": "string",
    "pain_section": "string",
    "solution_section": "string",
    "proof_section": "string",
    "cta_section": "string"
  }
}
```

### Enumerations
- hook_type: problem_agitation | curiosity | transformation | social_proof
- format: static | video | carousel
- target_placement: feed | stories | reels

### Minimum Requirements
- tof_ugc_hooks: 4 items (cover all hook_type values)
- mof_quiz_flow.questions: 6 items
- mof_chat_script.discovery_questions: 5 items
- mof_chat_script.objection_handlers: 4 items
- bof_creative_briefs: 4 items
### Flow Requirement
- Each TOF hook must explicitly lead into MOF (quiz/chat) and BOF (landing/offer).

### System Prompt
You are a senior performance marketer. Build a full-funnel strategy for one segment and one top pain.

### User Prompt Template
```
Generate TOF -> MOF -> BOF strategy for:
- Segment: {{segment.name}}
- Pain: {{pain.name}} (top pain)

Return ONLY valid JSON matching the schema.

## Business Context
{{business_context}}

## Segment
{{segment_pack}}

## Pain
{{pain_pack}}

## Research
{{research_pack}}

## V5 Modules
{{v5_pack}}
```

---

## Prompt: Strategy Global (brand-wide comms)

### Purpose
Create brand-wide communication strategy across channels (email/SMS/messenger/social/banners).

### Output JSON Schema
```
{
  "email_strategy": {
    "sequence_overview": "string",
    "cadence": "string",
    "key_emails": [
      {
        "name": "string",
        "purpose": "string",
        "subject_line": "string",
        "key_content": "string"
      }
    ],
    "segmentation_logic": "string"
  },
  "sms_strategy": {
    "use_cases": ["string"],
    "timing": "string",
    "message_templates": ["string"],
    "compliance_notes": "string"
  },
  "messenger_strategy": {
    "platforms": ["string"],
    "automation_flows": ["string"],
    "response_templates": ["string"]
  },
  "social_strategy": {
    "platforms": ["string"],
    "content_pillars": ["string"],
    "posting_cadence": {
      "daily_posts": 0,
      "stories": 0,
      "live": "string"
    },
    "engagement_tactics": ["string"]
  },
  "tof_banners": {
    "formats": ["string"],
    "themes": ["string"],
    "targeting_approach": "string",
    "creative_guidelines": ["string"]
  },
  "traffic_channels": {
    "organic": ["string"],
    "paid": ["string"],
    "partnerships": ["string"],
    "recommended_priority": ["string"]
  }
}
```

### Minimum Requirements
- key_emails: 6 items
- sms_strategy.message_templates: 6 items
- messenger_strategy.automation_flows: 4 items
- social_strategy.content_pillars: 5 items
- tof_banners.themes: 5 items
- traffic_channels.recommended_priority: 5 items
### Output Constraints
- Prefer bullet-like sentences, avoid long paragraphs.

### System Prompt
You are a senior brand strategist. Create a brand-wide comms strategy in strict JSON.

### User Prompt Template
```
Generate a brand-wide communication strategy.
Return ONLY valid JSON matching the schema.

## Business Context
{{business_context}}

## Research (aggregated)
{{research_pack}}

## V5 Modules (aggregated)
{{v5_pack}}
```

---

## Prompt: Strategy Ads (per segment x top pain, multi-channel)

### Purpose
Create paid ads strategy across all channels for a specific segment and top pain.

### Output JSON Schema
```
{
  "channels": {
    "google": { ... },
    "pinterest": { ... },
    "reddit": { ... },
    "meta": { ... },
    "tiktok": { ... },
    "youtube": { ... }
  }
}
```

### Channel Object Schema
```
{
  "objective": "string",
  "campaign_structure": "string",
  "keyword_themes": ["string"],
  "ad_copy_templates": [
    { "headline": "string", "description": "string", "cta": "string" }
  ],
  "audience_targeting": "string",
  "budget_allocation": "string",
  "creative_specs": "string",
  "placements": ["string"],
  "exclusions": ["string"],
  "landing_angle": "string"
}
```

### Minimum Requirements
- Each channel must include all fields in Channel Object Schema
- keyword_themes: 6 items
- ad_copy_templates: 3 items
- placements: 2 items
- exclusions: 3 items
### Platform Constraints
- Google: headline <= 30 chars, description <= 90 chars
- Pinterest: headline <= 100 chars, description <= 500 chars
- TikTok: hook <= 70 chars
- Reddit: headline <= 150 chars
### Priority Channels
- Always fully populate google, meta, and one of (pinterest/tiktok) based on channel_strategy.

### System Prompt
You are a paid media strategist. Build a multi-channel ads plan in strict JSON.

### User Prompt Template
```
Generate paid ads strategy for:
- Segment: {{segment.name}}
- Pain: {{pain.name}} (top pain)

Return ONLY valid JSON matching the schema.

## Business Context
{{business_context}}

## Segment
{{segment_pack}}

## Pain
{{pain_pack}}

## Research
{{research_pack}}

## V5 Modules
{{v5_pack}}
```

---

## Prompt: Communications Funnel (per segment x top pain)

### Purpose
Wire real communications data into TOF/MOF/BOF funnels.

### Output JSON Schema
```
{
  "organic_rhythm": {
    "tof_content": [
      { "type": "string", "topic": "string", "format": "string", "frequency": "string" }
    ],
    "mof_content": [
      { "type": "string", "topic": "string", "format": "string", "frequency": "string" }
    ],
    "bof_content": [
      { "type": "string", "topic": "string", "format": "string", "frequency": "string" }
    ],
    "posting_cadence": {
      "daily_posts": 0,
      "stories": 0,
      "live": "string"
    },
    "channel_matrix": { "channel": "string" }
  },
  "conversation_funnel": {
    "entry_points": ["string"],
    "dm_flow": ["string"],
    "chat_flow": ["string"],
    "qualification_criteria": ["string"],
    "handoff_script": "string"
  },
  "chatbot_scripts": {
    "welcome_flow": { "message": "string", "buttons": ["string"] },
    "need_discovery_flow": { "questions": ["string"], "branching": "string" },
    "recommendation_flow": { "logic": "string", "templates": ["string"] },
    "export_format": "string"
  }
}
```

### Minimum Requirements
- tof_content: 4 items
- mof_content: 4 items
- bof_content: 4 items
- entry_points: 4 items
- dm_flow: 6 items
- chat_flow: 6 items
- qualification_criteria: 4 items
- chatbot_scripts.templates: 4 items
### Flow Requirement
- Explicitly show transitions: comment/quiz -> DM/chat -> landing/offer.

### System Prompt
You are a communications strategist. Build a TOF/MOF/BOF comms funnel in strict JSON.

### User Prompt Template
```
Generate communications funnel for:
- Segment: {{segment.name}}
- Pain: {{pain.name}} (top pain)

Return ONLY valid JSON matching the schema.

## Business Context
{{business_context}}

## Segment
{{segment_pack}}

## Pain
{{pain_pack}}

## Research
{{research_pack}}

## V5 Modules
{{v5_pack}}
```

---

## Prompt: UGC Creator Profiles (per segment)

### Purpose
Define ideal UGC creator personas and content topics per segment.

### Output JSON Schema
```
{
  "ideal_persona": {
    "name": "string",
    "age_range": "string",
    "gender": "string",
    "location_preference": "string",
    "platform_presence": ["string"],
    "personality_traits": ["string"],
    "visual_aesthetic": "string",
    "content_style": "string"
  },
  "content_topics": [
    {
      "topic": "string",
      "source_pain_id": "string",
      "hook_angle": "string",
      "emotional_tone": "string",
      "format_suggestion": "string"
    }
  ],
  "sourcing_guidance": {
    "where_to_find": ["string"],
    "outreach_template": "string",
    "rate_range": "string",
    "red_flags": ["string"],
    "green_flags": ["string"]
  }
}
```

### Minimum Requirements
- content_topics: 6 items (must reference provided pain IDs)
- At least 1 topic per top pain ID
- sourcing_guidance.where_to_find: 4 items
- sourcing_guidance.red_flags: 3 items
- sourcing_guidance.green_flags: 3 items

### System Prompt
You are a UGC strategist. Build creator profiles and content topics in strict JSON.

### User Prompt Template
```
Generate UGC creator profiles for:
- Segment: {{segment.name}}

Return ONLY valid JSON matching the schema.
Use ONLY pain IDs provided in the input for source_pain_id.

## Business Context
{{business_context}}

## Segment
{{segment_pack}}

## Top Pains (with IDs)
{{top_pains_pack}}

## Research
{{research_pack}}

## V5 Modules
{{v5_pack}}
```

---

## Prompt Implementation Notes (Engineering)

- Use Edge runtime + streaming (SSE) for heavy prompts.
- Enforce top pain check before generation:
  - verify `pains_ranking.is_top_pain = true` for given pain_id.
- Validate JSON strictly after generation; repair only if safe.
- Log provider/model and response time.
