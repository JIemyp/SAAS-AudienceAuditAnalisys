# Migration 023 - Database Readiness Audit

**Date**: 2025-12-13
**Migration**: `/supabase/migrations/023_idempotent_approve.sql`
**Purpose**: Idempotent approve with history tracking

---

## ✅ PART 1: data_history Table

### Structure
```sql
CREATE TABLE data_history (
  id UUID PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  segment_id UUID REFERENCES segments_final(id) ON DELETE SET NULL,
  operation TEXT CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE', 'UPSERT')),
  old_data JSONB,
  new_data JSONB,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
)
```

### Indexes
- ✅ `idx_data_history_project` ON (project_id)
- ✅ `idx_data_history_table_record` ON (table_name, record_id)
- ✅ `idx_data_history_changed_at` ON (changed_at DESC)

### RLS Policies
- ✅ "Users can view own project history" - SELECT
- ✅ "Service can insert history" - INSERT

**Status**: ✅ READY

---

## ✅ PART 2: approved_at Columns

All tables have `approved_at` column added:

### Per-project
- ✅ portrait_final

### Per-segment
- ✅ jobs
- ✅ preferences
- ✅ difficulties
- ✅ triggers
- ✅ pains_initial
- ✅ pains_ranking

### Per-pain
- ✅ canvas
- ✅ canvas_extended

### V5 tables
- ✅ channel_strategy
- ✅ competitive_intelligence
- ✅ pricing_psychology
- ✅ trust_framework
- ✅ jtbd_context

**Status**: ✅ READY

---

## ✅ PART 3: Duplicate Cleanup

Migration 023 includes DELETE queries to remove duplicates before adding UNIQUE constraints:

- ✅ portrait_final - DISTINCT ON (project_id)
- ✅ jobs - DISTINCT ON (project_id, segment_id)
- ✅ preferences - DISTINCT ON (project_id, segment_id)
- ✅ difficulties - DISTINCT ON (project_id, segment_id)
- ✅ triggers - DISTINCT ON (project_id, segment_id)
- ✅ canvas - DISTINCT ON (project_id, segment_id, pain_id)
- ✅ channel_strategy - DISTINCT ON (project_id, segment_id)
- ✅ competitive_intelligence - DISTINCT ON (project_id, segment_id)
- ✅ pricing_psychology - DISTINCT ON (project_id, segment_id)
- ✅ trust_framework - DISTINCT ON (project_id, segment_id)
- ✅ jtbd_context - DISTINCT ON (project_id, segment_id)

**Status**: ✅ READY

---

## ⚠️ PART 4: UNIQUE Constraints Analysis

### ✅ IMPLEMENTED CONSTRAINTS

| Table | Constraint Name | Columns | Scope | approve-utils |
|-------|----------------|---------|-------|---------------|
| portrait_final | uq_portrait_final_project | (project_id) | project | ✅ Correct |
| jobs | uq_jobs_project_segment | (project_id, segment_id) | segment | ✅ Correct |
| preferences | uq_preferences_project_segment | (project_id, segment_id) | segment | ✅ Correct |
| difficulties | uq_difficulties_project_segment | (project_id, segment_id) | segment | ✅ Correct |
| triggers | uq_triggers_project_segment | (project_id, segment_id) | segment | ✅ Correct |
| canvas | uq_canvas_project_segment_pain | (project_id, segment_id, pain_id) | pain | ✅ Correct |
| channel_strategy | uq_channel_strategy_project_segment | (project_id, segment_id) | segment | ✅ Correct |
| competitive_intelligence | uq_competitive_intelligence_project_segment | (project_id, segment_id) | segment | ✅ Correct |
| pricing_psychology | uq_pricing_psychology_project_segment | (project_id, segment_id) | segment | ✅ Correct |
| trust_framework | uq_trust_framework_project_segment | (project_id, segment_id) | segment | ✅ Correct |
| jtbd_context | uq_jtbd_context_project_segment | (project_id, segment_id) | segment | ✅ Correct |

### ❌ MISSING CONSTRAINTS

#### 1. canvas_extended
**Current state**:
- Table has: `project_id`, `segment_id`, `pain_id`
- Migration 012 created table WITHOUT UNIQUE constraint
- approve-utils.ts has `scope: "pain"` (expects UNIQUE on project_id, segment_id, pain_id)

**Problem**:
- approveWithUpsert() will check existing by (project_id, segment_id, pain_id)
- WITHOUT UNIQUE constraint, duplicate records possible!

**Solution needed**:
```sql
ALTER TABLE canvas_extended
  ADD CONSTRAINT uq_canvas_extended_project_segment_pain
  UNIQUE (project_id, segment_id, pain_id);
```

#### 2. pains_ranking
**Current state**:
- Table has: `project_id`, `segment_id`, `pain_id`
- Multiple rankings per segment allowed (one per pain)
- approve-utils.ts has `scope: "segment"` ⚠️ WRONG!

**Problem**:
- Table structure suggests one ranking PER PAIN (not per segment)
- approve-utils assumes one record per segment
- Batch approve will DELETE ALL rankings for segment, then insert ONE

**Solution options**:

A) **Change to per-pain scope** (recommended):
```typescript
// In approve-utils.ts APPROVE_CONFIGS
painsRanking: {
  scope: "pain" as ApproveScope,  // Changed from "segment"
  fields: ["pain_id", "importance", "frequency", ...],
}
```

B) **Add UNIQUE constraint** (if truly one per segment):
```sql
ALTER TABLE pains_ranking
  ADD CONSTRAINT uq_pains_ranking_project_segment
  UNIQUE (project_id, segment_id);
```

**Recommended**: Option A - change to `scope: "pain"` since table has pain_id

#### 3. pains_initial
**Current state**:
- Multiple pains per segment (correct design)
- approve-utils uses `approveBatch()` (delete-then-insert)
- NO UNIQUE constraint (correct - multiple allowed)

**Status**: ✅ CORRECT - uses batch approve, no constraint needed

---

## 📋 approve-utils.ts Scope Mapping

### Correct Mappings

```typescript
export const APPROVE_CONFIGS = {
  // ✅ Per-project (one record per project)
  portraitFinal: { scope: "project" },  // UNIQUE (project_id)

  // ✅ Per-segment (one record per segment)
  jobs: { scope: "segment" },           // UNIQUE (project_id, segment_id)
  preferences: { scope: "segment" },
  difficulties: { scope: "segment" },
  triggers: { scope: "segment" },
  channelStrategy: { scope: "segment" },
  competitiveIntelligence: { scope: "segment" },
  pricingPsychology: { scope: "segment" },
  trustFramework: { scope: "segment" },
  jtbdContext: { scope: "segment" },

  // ✅ Per-pain (one record per pain)
  canvas: { scope: "pain" },            // UNIQUE (project_id, segment_id, pain_id)

  // ❌ Missing constraint!
  canvasExtended: { scope: "pain" },    // NO UNIQUE CONSTRAINT!

  // ⚠️ Wrong scope (should be "pain" not "segment")
  painsRanking: { scope: "segment" },   // Has pain_id but scope is segment?

  // ✅ Batch approve (multiple per segment)
  pains: { scope: "segment" },          // Uses approveBatch, no constraint
}
```

---

## 🔧 Required Fixes

### Fix 1: Add canvas_extended UNIQUE constraint

Create migration `/supabase/migrations/024_fix_canvas_extended_constraint.sql`:

```sql
-- =====================================================
-- Migration 024: Fix canvas_extended UNIQUE constraint
-- =====================================================

-- Clean duplicates first
DELETE FROM canvas_extended
WHERE id NOT IN (
  SELECT DISTINCT ON (project_id, segment_id, pain_id) id
  FROM canvas_extended
  ORDER BY project_id, segment_id, pain_id, id DESC
);

-- Add UNIQUE constraint
DO $$ BEGIN
  ALTER TABLE canvas_extended
    ADD CONSTRAINT uq_canvas_extended_project_segment_pain
    UNIQUE (project_id, segment_id, pain_id);
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

COMMENT ON CONSTRAINT uq_canvas_extended_project_segment_pain ON canvas_extended
  IS 'One canvas_extended record per pain (per project+segment+pain)';
```

### Fix 2: Update pains_ranking scope

Option A: Change approve-utils.ts (recommended):

```typescript
painsRanking: {
  draftTable: "pains_ranking_drafts",
  approvedTable: "pains_ranking",
  scope: "pain" as ApproveScope,  // Changed from "segment"
  fields: ["pain_id", "importance", "frequency", "emotional_intensity", "ranking_score", "ranking_rationale"],
  cleanupDrafts: true,
  trackHistory: true,
},
```

Option B: Add UNIQUE constraint in migration 024:

```sql
-- If keeping scope: "segment", add constraint:
DELETE FROM pains_ranking
WHERE id NOT IN (
  SELECT DISTINCT ON (project_id, segment_id) id
  FROM pains_ranking
  ORDER BY project_id, segment_id, id DESC
);

DO $$ BEGIN
  ALTER TABLE pains_ranking
    ADD CONSTRAINT uq_pains_ranking_project_segment
    UNIQUE (project_id, segment_id);
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;
```

---

## ✅ Final Checklist

### Database Migration 023
- [x] data_history table created
- [x] Indexes on data_history
- [x] RLS policies on data_history
- [x] approved_at columns added to all tables
- [x] Duplicate cleanup queries included
- [x] UNIQUE constraints added (except canvas_extended, pains_ranking)

### Issues to Fix
- [ ] **CRITICAL**: Add UNIQUE constraint to canvas_extended
- [ ] **DECISION NEEDED**: pains_ranking scope (pain vs segment)
- [ ] Create migration 024 with fixes
- [ ] Update approve-utils.ts if needed

### Routes Readiness
- [ ] ⚠️ **NOT READY** until canvas_extended constraint added
- [ ] ⚠️ **RISK** of duplicate canvas_extended records without constraint
- [ ] ⚠️ **RISK** of incorrect pains_ranking behavior with wrong scope

---

## Recommendation

**DO NOT update routes until:**

1. Create migration 024 with canvas_extended UNIQUE constraint
2. Decide on pains_ranking scope (recommend changing to "pain")
3. Apply migration 024 to Supabase
4. Verify constraints in database
5. Update approve-utils.ts if changing pains_ranking scope

**Risk level**: 🔴 HIGH - Missing UNIQUE constraints can cause data integrity issues

---

## Database Schema Summary

```
CASCADE FLOW:
projects → portrait_final (1:1)
        → segments_final (1:N)
              → jobs (1:1 per segment)
              → preferences (1:1 per segment)
              → difficulties (1:1 per segment)
              → triggers (1:1 per segment)
              → pains_initial (1:N per segment)
                    → pains_ranking (1:1 per pain)
                    → canvas (1:1 per pain)
                    → canvas_extended (1:1 per pain)
              → V5 tables (1:1 per segment)
```

**UNIQUE Constraints Pattern**:
- **Per-project**: UNIQUE (project_id)
- **Per-segment**: UNIQUE (project_id, segment_id)
- **Per-pain**: UNIQUE (project_id, segment_id, pain_id)
- **Multi-record**: No UNIQUE (use batch approve)
