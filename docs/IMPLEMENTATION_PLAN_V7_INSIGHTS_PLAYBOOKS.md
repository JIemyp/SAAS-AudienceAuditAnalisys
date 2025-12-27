# Implementation Plan V7: Insights & Playbooks

Status: Draft for execution
Scope: Insights & Takeaways + Playbooks (segment x top pain)
Language: English output + UI translations via existing hook
Storage: Draft/Approved pattern

References:
- Prompts: docs/PROMPTS_V7_INSIGHTS_PLAYBOOKS.md
- Existing V6 prompts: docs/PROMPTS_V6.md

---

## 1) Current State (as of now)

Implemented:
- Strategy page + APIs + tables
- Communications page + APIs + tables
- UGC Creators page + APIs + tables

Missing:
- Insights & Takeaways (placeholder)
- Playbooks (placeholder)

---

## 2) Final Structure (confirmed)

### Insights & Takeaways
Components:
1) Executive Summary (project)
2) Segment Snapshots (segment)
3) Opportunity Radar (project)

Each component includes:
- Evidence Sources (tables + fields)
- Validation Metrics (what to test in the field)

### Playbooks
Components:
1) Canvas Summary (segment x top pain)
2) Funnel Assets (segment x top pain)
3) Segment View (UI aggregator only, no generation)

---

## 3) Data Contracts (what comes from where)

### 3.1 Executive Summary (project)
Required:
- portrait_final
- segments (canonical) or segments_final fallback
- jobs (per segment)
- triggers (per segment)
- pains_ranking (is_top_pain)
- channel_strategy
- pricing_psychology
- trust_framework
- competitive_intelligence
- jtbd_context
Outputs:
- growth_bets[]
- segment_priorities[]
- positioning_summary
- evidence_sources[]
- validation_metrics[]

Evidence Sources rules:
- List tables used + key fields (ex: pains_ranking.impact_score)
Validation Metrics rules:
- 3-5 concrete tests (CTR, CVR, time-to-first-purchase, objection drop rate)
Failure rules:
- If required tables are missing, generation returns a structured error.
- Evidence Sources must only list tables actually present in input.

### 3.2 Segment Snapshots (segment)
Required:
- segment_details
- jobs
- pains_initial + pains_ranking
- triggers
- difficulties
- preferences
- jtbd_context
Outputs:
- who, what, why, when
- top_pains[]
- adoption_barriers[]
- evidence_sources[]
- validation_metrics[]

### 3.3 Opportunity Radar (project)
Required:
- jobs
- preferences
- triggers
- competitive_intelligence
- pricing_psychology
- trust_framework
- pains_ranking
- onboarding_data (USP/benefits)
Outputs:
- jobs_vs_benefits_gap
- triggers_vs_timeline
- risk_alerts[]
- evidence_sources[]
- validation_metrics[]

### 3.4 Playbooks: Canvas Summary (segment x top pain)
Required:
- canvas
- canvas_extended
- pains_initial
- segment_details
- jobs
- trust_framework
- jtbd_context (optional for job context/priority)
Outputs:
- hero_section
- insight_section
- ritual_section
- proof_section
- cta_section

### 3.5 Playbooks: Funnel Assets (segment x top pain)
Required:
- strategy_personalized
- communications_funnel
- channel_strategy
- pricing_psychology
- trust_framework
- competitive_intelligence
- jtbd_context
Outputs:
- tof_assets[]
- mof_assets[]
- bof_assets[]

---

## 3A) Dependency Matrix (1-page view)

| Component | Scope | Required Tables | Optional Tables |
|----------|-------|------------------|-----------------|
| Executive Summary | project | portrait_final, segments, jobs, triggers, pains_ranking, channel_strategy, pricing_psychology, trust_framework, competitive_intelligence, jtbd_context | segment_details |
| Segment Snapshots | segment | segment_details, jobs, pains_initial, pains_ranking, triggers, difficulties, preferences, jtbd_context | portrait_final |
| Opportunity Radar | project | jobs, preferences, triggers, competitive_intelligence, pricing_psychology, trust_framework, pains_ranking, onboarding_data | channel_strategy |
| Canvas Summary | segment x pain | canvas, canvas_extended, pains_initial, segment_details, jobs, trust_framework | jtbd_context |
| Funnel Assets | segment x pain | strategy_personalized, communications_funnel, channel_strategy, pricing_psychology, trust_framework, competitive_intelligence, jtbd_context | strategy_global |

---

## 4) Database Migrations

### Migration 035: Insights
Tables:
- insights_executive_drafts / insights_executive (project)
- insights_snapshots_drafts / insights_snapshots (segment)
- insights_radar_drafts / insights_radar (project)

Fields (summary):
- growth_bets[], segment_priorities[], positioning_summary, validation_questions[]
- who/what/why/when, top_pains[], adoption_barriers[]
- jobs_vs_benefits_gap, triggers_vs_timeline, risk_alerts[]
- evidence_sources[], validation_metrics[] (all three components)

### Migration 036: Playbooks
Tables:
- playbooks_canvas_drafts / playbooks_canvas (segment x pain)
- playbooks_funnel_drafts / playbooks_funnel (segment x pain)

---

## 5) API Endpoints

Generate:
- /api/generate/insights-executive
- /api/generate/insights-snapshots
- /api/generate/insights-radar
- /api/generate/playbooks-canvas
- /api/generate/playbooks-funnel

Approve:
- /api/approve/insights-executive
- /api/approve/insights-snapshots
- /api/approve/insights-radar
- /api/approve/playbooks-canvas
- /api/approve/playbooks-funnel

Rules:
- Only top pains allowed for playbooks (check pains_ranking.is_top_pain)
- Verify pain belongs to selected segment_id
- Use Edge runtime + streaming for heavy prompts
- Use approved tables only

Integrations:
- Update drafts/approved endpoints:
  - src/app/api/drafts/route.ts
  - src/app/api/approved/route.ts
- Add approve configs:
  - src/lib/approve-utils.ts

---

## 6) Frontend Pages

### Insights page
File: src/app/(dashboard)/projects/[id]/insights/page.tsx
Tabs:
- Executive Summary
- Segment Snapshots (segment selector)
- Opportunity Radar

Each tab:
- Generate button
- Draft display
- Approve workflow
- Evidence Sources block
- Validation Metrics block

### Playbooks page
File: src/app/(dashboard)/projects/[id]/playbooks/page.tsx
Sections:
- Canvas Summary (segment x pain selector)
- Funnel Assets (segment x pain selector)
- Segment View (aggregator only)

Segment View (aggregator):
- Lists all playbooks for the segment
- Shows 1-2 CTA/positioning snippets from strategy_summary or strategy_global

---

## 7) Export Integration

Update:
- src/app/api/report/route.ts (include Insights + Playbooks)
- src/app/(dashboard)/projects/[id]/export/page.tsx (XLSX/JSON/CSV sheets)
Required:
- src/app/(dashboard)/projects/[id]/report/page.tsx (show Insights/Playbooks sections)

---

## 8) Sprint Plan (8 sprints)

Stage 1: Insights (4 sprints)
1.1 Database + Types + Approve configs
1.2 Insights APIs
1.3 Insights UI
1.4 Insights Export

Stage 2: Playbooks (4 sprints)
2.1 Database + Types + Approve configs
2.2 Playbooks APIs
2.3 Playbooks UI
2.4 Playbooks Export + regression

QA after each sprint.

Quality guardrails:
- Quality over speed: do NOT compress or truncate outputs to meet time targets.
- Prefer per-segment / per-pain generation for depth.
- Batch fetch allowed for reads, but do not merge generations if it reduces quality.

---

## 9) QA Checklist (V7 specific)

Insights:
- Executive Summary builds with correct data
- Segment Snapshots uses correct segment_id
- Radar gaps map to real jobs/benefits
- Evidence Sources lists real tables
- Validation Metrics are actionable

Playbooks:
- Only top pains allowed
- Canvas Summary aligned to canvas + canvas_extended
- Funnel Assets aligned to strategy_personalized + communications
- Segment View aggregates without extra generation

Export:
- New sheets present in XLSX/JSON/CSV
- No regression in existing exports

---

## 9A) Mini JSON Examples (for QA validation)

### Executive Summary (example)
```json
{
  "growth_bets": [
    {
      "title": "Gut reset starter bundle",
      "rationale": "High trigger urgency + top pain impact",
      "score": 18,
      "key_jobs": ["Reduce bloating fast"],
      "key_triggers": ["Symptoms flare after meals"],
      "key_pains": ["Daily bloating fatigue"]
    }
  ],
  "segment_priorities": [
    { "segment_name": "Biohacker Optimizers", "priority_score": 9, "reason": "High spend + urgency" }
  ],
  "positioning_summary": {
    "core_claim": "Frozen whole‑food algae for measurable gut reset",
    "supporting_points": ["Bioactive preservation", "Multi‑system impact"],
    "most_credible_proof": "Tracked biomarkers + user results"
  },
  "validation_questions": ["Does the gut-reset framing increase quiz completion?"],
  "evidence_sources": [
    { "table": "pains_ranking", "fields": ["impact_score"], "why_used": "Pain severity ranking" }
  ],
  "validation_metrics": [
    { "metric": "CTR", "success_signal": ">2.5%", "risk_signal": "<1%" }
  ]
}
```

### Segment Snapshot (example)
```json
{
  "who": "High‑performing health optimizers, data‑driven",
  "what": "Want reliable gut and energy improvements",
  "why": "Past supplements failed; seeking measurable results",
  "when": "Triggered after plateau in biomarker trends",
  "top_pains": ["Bloating", "Energy crashes", "Supplement fatigue"],
  "adoption_barriers": ["Skepticism", "Budget discipline", "Complex stacks"],
  "evidence_sources": [
    { "table": "segment_details", "fields": ["psychographics"], "why_used": "Motivation context" }
  ],
  "validation_metrics": [
    { "metric": "Quiz completion", "success_signal": ">40%", "risk_signal": "<20%" }
  ]
}
```

### Opportunity Radar (example)
```json
{
  "jobs_vs_benefits_gap": [
    { "job": "Reduce bloating fast", "missing_benefit": "Timing proof", "impact": "High" }
  ],
  "triggers_vs_timeline": [
    { "trigger": "Post‑meal discomfort", "best_window": "0‑2 hours", "risk_window": "24+ hours" }
  ],
  "risk_alerts": [
    { "risk": "Over‑promising speed", "why": "Skeptical segment", "mitigation": "Use measurable milestones" }
  ],
  "evidence_sources": [
    { "table": "triggers", "fields": ["timing"], "why_used": "Window mapping" }
  ],
  "validation_metrics": [
    { "metric": "CVR", "success_signal": ">3%", "risk_signal": "<1%" }
  ]
}
```

### Playbooks Canvas Summary (example)
```json
{
  "hero_section": {
    "headline": "Reset your gut without another supplement stack",
    "subheadline": "Frozen whole‑food algae for measurable relief",
    "hook": "Feel lighter within your first week"
  },
  "insight_section": {
    "pain_story": "Bloating persists despite premium protocols",
    "root_cause": "Missing bioactive compounds",
    "why_now": "Plateau + rising symptom tracking"
  },
  "ritual_section": {
    "ritual_steps": ["Add to morning smoothie", "Track weekly biomarkers"],
    "how_it_fits": "Replaces 3–4 separate supplements"
  },
  "proof_section": {
    "proof_points": ["Bioactivity preserved by freezing", "Observed energy lift"],
    "trust_assets": ["Lab tests", "Customer journals"]
  },
  "cta_section": {
    "primary_cta": "Start 3‑month reset",
    "secondary_cta": "Take the gut‑reset quiz"
  }
}
```

### Playbooks Funnel Assets (example)
```json
{
  "tof_assets": [
    { "format": "UGC video", "message": "My gut reset in 7 days", "cta": "Take the quiz" }
  ],
  "mof_assets": [
    { "format": "Quiz result", "message": "Your reset path", "cta": "See plan" }
  ],
  "bof_assets": [
    { "format": "Landing section", "message": "Proof + offer", "cta": "Start now" }
  ]
}
```

## 10) Help/Guidance Blocks

Each new tab must include:
- What this is
- How to use
- What to do next
- What data it depends on

Per-tab "Missing data → next steps":
- Executive Summary: missing portrait_final / jobs / pains_ranking → link to generation steps.
- Segment Snapshots: missing segment_details / pains_ranking → link to segment details + pains ranking.
- Opportunity Radar: missing jobs / preferences / triggers → link to deep analysis steps.
- Canvas Summary: missing canvas / canvas_extended → link to canvas + canvas extended steps.
- Funnel Assets: missing strategy_personalized / communications_funnel → link to Strategy + Communications steps.

Link format: plain link (no action buttons).
