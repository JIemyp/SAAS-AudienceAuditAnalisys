# PROMPTS V7 (Insights + Playbooks)

This file defines the prompt contracts for all V7 generators.
All outputs MUST be valid JSON and MUST be in English.

---

## Global Output Rules

1. Return ONLY JSON. No markdown, no comments, no prose outside JSON.
2. Use double quotes for all keys and string values.
3. Do NOT include unescaped line breaks inside strings. Use "\\n" if needed.
4. No trailing commas.
5. If a field is optional, still include it (use null or empty array as specified).
6. Do NOT invent IDs unless explicitly required. Use IDs only when provided in input.
7. Do NOT include PII, medical claims, diagnosis, cure claims, or guarantees.
8. Output language: English.
9. Keep arrays concise (3-6 items unless minimums require more).

---

## Error Response Schema (missing prerequisites)

If required input data is missing, return ONLY this JSON:
```
{
  "error": {
    "code": "missing_prerequisites",
    "missing_tables": ["table_a", "table_b"],
    "message": "string"
  }
}
```

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

## Segment (when applicable)
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

## Research (aggregated or per segment)
- portrait_final:
- jobs:
- preferences:
- difficulties:
- triggers:
- pains_ranking:
- pains_initial:
- canvas:
- canvas_extended:

## V5 Modules (aggregated or per segment)
- channel_strategy:
- competitive_intelligence:
- pricing_psychology:
- trust_framework:
- jtbd_context:

## V6 Modules (per segment x pain when applicable)
- strategy_personalized:
- communications_funnel:
```

---

## Evidence Sources Rules

- evidence_sources must list ONLY the tables used in the input.
- Each entry includes table name, key fields used, and short reason.
- Do NOT add sources that were not provided in input.

## Validation Metrics Rules

- Include 3-5 concrete tests (CTR, CVR, time-to-first-purchase, objection drop rate).
- Each metric must include success and risk signals.
- Keep language practical and testable.

---

## Scoring Normalization (Executive Summary)

Use this mapping when scoring growth bets:

- job_frequency: daily=5, weekly=4, monthly=3, occasionally=2, rarely=1
- trigger_urgency: critical=5, high=4, medium=3, low=2
- pain_impact: use impact_score (1-5) or normalize 1-10 into 1-5

---

## Prompt: Insights Executive (project)

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
  "segment_priorities": [
    { "segment_name": "string", "priority_score": 0, "reason": "string" }
  ],
  "positioning_summary": {
    "core_claim": "string",
    "supporting_points": ["string"],
    "most_credible_proof": "string"
  },
  "validation_questions": ["string"],
  "evidence_sources": [
    { "table": "string", "fields": ["string"], "why_used": "string" }
  ],
  "validation_metrics": [
    { "metric": "string", "success_signal": "string", "risk_signal": "string" }
  ]
}
```

### Minimum Requirements
- growth_bets: 3 items
- segment_priorities: 3 items
- validation_questions: 4 items
- evidence_sources: 4 items
- validation_metrics: 4 items

### Scoring Rule
growth_bet_score = job_frequency × trigger_urgency × pain_impact

### System Prompt
You are a strategy lead. Summarize growth bets and priorities in strict JSON.

### User Prompt Template
```
Generate project-level executive summary.
Use the scoring rule for growth bets.
Return ONLY valid JSON matching the schema.
If required data is missing, return the error JSON schema.

## Business Context
{{business_context}}

## Research (aggregated)
{{research_pack}}

## V5 Modules (aggregated)
{{v5_pack}}
```

---

## Prompt: Insights Snapshots (segment)

### Output JSON Schema
```
{
  "who": "string",
  "what": "string",
  "why": "string",
  "when": "string",
  "top_pains": ["string"],
  "adoption_barriers": ["string"],
  "evidence_sources": [
    { "table": "string", "fields": ["string"], "why_used": "string" }
  ],
  "validation_metrics": [
    { "metric": "string", "success_signal": "string", "risk_signal": "string" }
  ]
}
```

### Minimum Requirements
- top_pains: 3 items
- adoption_barriers: 3 items
- evidence_sources: 3 items
- validation_metrics: 3 items

### System Prompt
You are a segmentation analyst. Produce a concise Who/What/Why/When snapshot.

### User Prompt Template
```
Generate a segment snapshot for:
- Segment: {{segment.name}}

Return ONLY valid JSON matching the schema.
If required data is missing, return the error JSON schema.

## Segment
{{segment_pack}}

## Research
{{research_pack}}
```

---

## Prompt: Opportunity Radar (project)

### Output JSON Schema
```
{
  "jobs_vs_benefits_gap": [
    { "job": "string", "missing_benefit": "string", "impact": "string" }
  ],
  "triggers_vs_timeline": [
    { "trigger": "string", "best_window": "string", "risk_window": "string" }
  ],
  "risk_alerts": [
    { "risk": "string", "why": "string", "mitigation": "string" }
  ],
  "evidence_sources": [
    { "table": "string", "fields": ["string"], "why_used": "string" }
  ],
  "validation_metrics": [
    { "metric": "string", "success_signal": "string", "risk_signal": "string" }
  ]
}
```

### Minimum Requirements
- jobs_vs_benefits_gap: 4 items
- triggers_vs_timeline: 4 items
- risk_alerts: 3 items
- evidence_sources: 3 items
- validation_metrics: 3 items

### System Prompt
You are a market strategist. Identify gaps and risks in strict JSON.

### User Prompt Template
```
Generate opportunity radar at the project level.
Return ONLY valid JSON matching the schema.
If required data is missing, return the error JSON schema.

## Research (aggregated)
{{research_pack}}

## V5 Modules (aggregated)
{{v5_pack}}
```

---

## Prompt: Playbooks Canvas Summary (segment x top pain)

### Output JSON Schema
```
{
  "hero_section": {
    "headline": "string",
    "subheadline": "string",
    "hook": "string"
  },
  "insight_section": {
    "pain_story": "string",
    "root_cause": "string",
    "why_now": "string"
  },
  "ritual_section": {
    "ritual_steps": ["string"],
    "how_it_fits": "string"
  },
  "proof_section": {
    "proof_points": ["string"],
    "trust_assets": ["string"]
  },
  "cta_section": {
    "primary_cta": "string",
    "secondary_cta": "string"
  }
}
```

### Minimum Requirements
- ritual_steps: 4 items
- proof_points: 4 items
- trust_assets: 3 items

### System Prompt
You are a conversion strategist. Build a landing outline in strict JSON.

### User Prompt Template
```
Generate a playbook canvas summary for:
- Segment: {{segment.name}}
- Pain: {{pain.name}} (top pain)

Return ONLY valid JSON matching the schema.
If required data is missing, return the error JSON schema.

## Segment
{{segment_pack}}

## Pain
{{pain_pack}}

## Research
{{research_pack}}
```

---

## Prompt: Playbooks Funnel Assets (segment x top pain)

### Output JSON Schema
```
{
  "tof_assets": [
    { "format": "string", "message": "string", "cta": "string" }
  ],
  "mof_assets": [
    { "format": "string", "message": "string", "cta": "string" }
  ],
  "bof_assets": [
    { "format": "string", "message": "string", "cta": "string" }
  ]
}
```

### Minimum Requirements
- tof_assets: 4 items
- mof_assets: 4 items
- bof_assets: 4 items

### System Prompt
You are a funnel copywriter. Produce TOF/MOF/BOF assets in strict JSON.

### User Prompt Template
```
Generate funnel assets for:
- Segment: {{segment.name}}
- Pain: {{pain.name}} (top pain)

Return ONLY valid JSON matching the schema.
If required data is missing, return the error JSON schema.

## Research
{{research_pack}}

## V6 Modules
{{v6_pack}}
```

---

## Implementation Notes

- Use Edge runtime + streaming for heavy prompts.
- Validate top pain before generation.
- Store only approved tables in report/export.
