# Database Readiness Checklist - Migration 023 + 024

**Status**: READY FOR MIGRATION 024
**Date**: 2025-12-13
**Agent**: Database Architecture Specialist

---

## EXECUTIVE SUMMARY

Migration 023 successfully added:
- data_history table for audit trail
- approved_at columns to all tables
- UNIQUE constraints for 11/14 tables

**Missing**: 2 UNIQUE constraints (canvas_extended, pains_ranking)

**Solution**: Migration 024 created to fix missing constraints

---

## PART 1: Migration 023 Status

### data_history Table
- [x] Table created with correct structure
- [x] Columns: id, table_name, record_id, project_id, segment_id, operation, old_data, new_data, changed_by, changed_at, metadata
- [x] FK to projects(id) ON DELETE CASCADE
- [x] FK to segments_final(id) ON DELETE SET NULL
- [x] FK to auth.users(id) for changed_by
- [x] CHECK constraint on operation (INSERT, UPDATE, DELETE, UPSERT)
- [x] Indexes: project_id, (table_name, record_id), changed_at DESC
- [x] RLS enabled with policies:
  - [x] SELECT: Users can view own project history
  - [x] INSERT: Service can insert history (no auth check)

**Result**: READY for approve-utils history tracking

---

### approved_at Columns

All tables have `approved_at TIMESTAMPTZ DEFAULT NOW()`:

#### Per-project
- [x] portrait_final

#### Per-segment
- [x] jobs
- [x] preferences
- [x] difficulties
- [x] triggers
- [x] pains_initial
- [x] pains_ranking

#### Per-pain
- [x] canvas
- [x] canvas_extended

#### V5 Strategic
- [x] channel_strategy
- [x] competitive_intelligence
- [x] pricing_psychology
- [x] trust_framework
- [x] jtbd_context

**Result**: ALL READY

---

### Duplicate Cleanup Queries

Migration 023 includes DELETE queries using DISTINCT ON:

- [x] portrait_final: DISTINCT ON (project_id)
- [x] jobs: DISTINCT ON (project_id, segment_id)
- [x] preferences: DISTINCT ON (project_id, segment_id)
- [x] difficulties: DISTINCT ON (project_id, segment_id)
- [x] triggers: DISTINCT ON (project_id, segment_id)
- [x] canvas: DISTINCT ON (project_id, segment_id, pain_id)
- [x] channel_strategy: DISTINCT ON (project_id, segment_id)
- [x] competitive_intelligence: DISTINCT ON (project_id, segment_id)
- [x] pricing_psychology: DISTINCT ON (project_id, segment_id)
- [x] trust_framework: DISTINCT ON (project_id, segment_id)
- [x] jtbd_context: DISTINCT ON (project_id, segment_id)

**Result**: Database will be clean before UNIQUE constraints applied

---

### UNIQUE Constraints - Migration 023

| Status | Table | Constraint Name | Columns | Scope |
|--------|-------|----------------|---------|-------|
| OK | portrait_final | uq_portrait_final_project | (project_id) | project |
| OK | jobs | uq_jobs_project_segment | (project_id, segment_id) | segment |
| OK | preferences | uq_preferences_project_segment | (project_id, segment_id) | segment |
| OK | difficulties | uq_difficulties_project_segment | (project_id, segment_id) | segment |
| OK | triggers | uq_triggers_project_segment | (project_id, segment_id) | segment |
| OK | canvas | uq_canvas_project_segment_pain | (project_id, segment_id, pain_id) | pain |
| OK | channel_strategy | uq_channel_strategy_project_segment | (project_id, segment_id) | segment |
| OK | competitive_intelligence | uq_competitive_intelligence_project_segment | (project_id, segment_id) | segment |
| OK | pricing_psychology | uq_pricing_psychology_project_segment | (project_id, segment_id) | segment |
| OK | trust_framework | uq_trust_framework_project_segment | (project_id, segment_id) | segment |
| OK | jtbd_context | uq_jtbd_context_project_segment | (project_id, segment_id) | segment |

**Result**: 11/14 tables have UNIQUE constraints

---

## PART 2: Missing Constraints (Fixed in Migration 024)

### 1. canvas_extended - MISSING CONSTRAINT

**Issue**:
- Table has: (project_id, segment_id, pain_id)
- approve-utils.ts expects: scope="pain"
- Migration 023: NO UNIQUE constraint added
- Risk: Duplicate records possible

**Fix in 024**:
```sql
DELETE FROM canvas_extended WHERE id NOT IN (
  SELECT DISTINCT ON (project_id, segment_id, pain_id) id
  FROM canvas_extended
  ORDER BY project_id, segment_id, pain_id, approved_at DESC, id DESC
);

ALTER TABLE canvas_extended
  ADD CONSTRAINT uq_canvas_extended_project_segment_pain
  UNIQUE (project_id, segment_id, pain_id);
```

Status: FIXED IN MIGRATION 024

---

### 2. pains_ranking - WRONG SCOPE

**Issue**:
- Table has: (project_id, segment_id, pain_id)
- approve-utils.ts v1 had: scope="segment" (WRONG!)
- Risk: Would delete all rankings for segment, insert ONE record

**Analysis**:
- Table structure suggests: ONE ranking PER PAIN
- Correct scope: "pain" (not "segment")

**Fix in 024**:
```sql
-- Add UNIQUE constraint
DELETE FROM pains_ranking WHERE id NOT IN (
  SELECT DISTINCT ON (project_id, segment_id, pain_id) id
  FROM pains_ranking
  ORDER BY project_id, segment_id, pain_id, approved_at DESC, id DESC
);

ALTER TABLE pains_ranking
  ADD CONSTRAINT uq_pains_ranking_project_segment_pain
  UNIQUE (project_id, segment_id, pain_id);

-- Add indexes
CREATE INDEX idx_pains_ranking_project_segment_pain
  ON pains_ranking(project_id, segment_id, pain_id);
```

**Fix in approve-utils.ts**:
```typescript
painsRanking: {
  scope: "pain" as ApproveScope, // CHANGED from "segment"
  fields: ["pain_id", "importance", "frequency", ...],
}
```

Status: FIXED IN MIGRATION 024 + approve-utils.ts UPDATED

---

## PART 3: approve-utils.ts Scope Mapping

### Updated APPROVE_CONFIGS

```typescript
export const APPROVE_CONFIGS = {
  // Per-project (UNIQUE on project_id)
  portraitFinal: { scope: "project" },

  // Per-segment (UNIQUE on project_id, segment_id)
  jobs: { scope: "segment" },
  preferences: { scope: "segment" },
  difficulties: { scope: "segment" },
  triggers: { scope: "segment" },
  channelStrategy: { scope: "segment" },
  competitiveIntelligence: { scope: "segment" },
  pricingPsychology: { scope: "segment" },
  trustFramework: { scope: "segment" },
  jtbdContext: { scope: "segment" },

  // Per-pain (UNIQUE on project_id, segment_id, pain_id)
  painsRanking: { scope: "pain" }, // UPDATED
  canvas: { scope: "pain" },
  canvasExtended: { scope: "pain" },

  // Multi-record (NO UNIQUE - uses batch approve)
  pains: { scope: "segment" }, // Multiple pains per segment allowed
};
```

### Scope Validation

| Config | Table Has | Scope | UNIQUE Constraint | Status |
|--------|-----------|-------|-------------------|--------|
| portraitFinal | project_id | project | uq_portrait_final_project | OK |
| jobs | project_id, segment_id | segment | uq_jobs_project_segment | OK |
| preferences | project_id, segment_id | segment | uq_preferences_project_segment | OK |
| difficulties | project_id, segment_id | segment | uq_difficulties_project_segment | OK |
| triggers | project_id, segment_id | segment | uq_triggers_project_segment | OK |
| pains | project_id, segment_id | segment | NONE (batch) | OK |
| painsRanking | project_id, segment_id, pain_id | pain | uq_pains_ranking_project_segment_pain | FIXED |
| canvas | project_id, segment_id, pain_id | pain | uq_canvas_project_segment_pain | OK |
| canvasExtended | project_id, segment_id, pain_id | pain | uq_canvas_extended_project_segment_pain | FIXED |
| channelStrategy | project_id, segment_id | segment | uq_channel_strategy_project_segment | OK |
| competitiveIntelligence | project_id, segment_id | segment | uq_competitive_intelligence_project_segment | OK |
| pricingPsychology | project_id, segment_id | segment | uq_pricing_psychology_project_segment | OK |
| trustFramework | project_id, segment_id | segment | uq_trust_framework_project_segment | OK |
| jtbdContext | project_id, segment_id | segment | uq_jtbd_context_project_segment | OK |

**Result**: ALL SCOPES MATCH CONSTRAINTS AFTER MIGRATION 024

---

## PART 4: Database Schema Summary

### Cascade Flow
```
projects (user_id)
  └── portrait_final (1:1 per project)
  └── segments_final (1:N per project)
        └── jobs (1:1 per segment)
        └── preferences (1:1 per segment)
        └── difficulties (1:1 per segment)
        └── triggers (1:1 per segment)
        └── pains_initial (1:N per segment) - multiple pains allowed
              └── pains_ranking (1:1 per pain)
              └── canvas (1:1 per pain)
              └── canvas_extended (1:1 per pain)
        └── V5 tables (1:1 per segment)
              - channel_strategy
              - competitive_intelligence
              - pricing_psychology
              - trust_framework
              - jtbd_context
```

### UNIQUE Constraint Patterns (After Migration 024)

**Per-project** (1 record per project):
- portrait_final: UNIQUE (project_id)

**Per-segment** (1 record per segment):
- jobs, preferences, difficulties, triggers: UNIQUE (project_id, segment_id)
- V5 tables: UNIQUE (project_id, segment_id)

**Per-pain** (1 record per pain):
- pains_ranking: UNIQUE (project_id, segment_id, pain_id)
- canvas: UNIQUE (project_id, segment_id, pain_id)
- canvas_extended: UNIQUE (project_id, segment_id, pain_id)

**Multi-record** (no UNIQUE):
- pains_initial (multiple pains per segment)

---

## PART 5: Files Changed

### Migrations Created
1. `/supabase/migrations/023_idempotent_approve.sql`
   - data_history table
   - approved_at columns
   - Duplicate cleanup
   - UNIQUE constraints (11/14)

2. `/supabase/migrations/024_fix_missing_constraints.sql`
   - canvas_extended UNIQUE constraint
   - pains_ranking UNIQUE constraint
   - Additional indexes

### Code Updated
1. `/src/lib/approve-utils.ts`
   - Changed painsRanking scope: "segment" -> "pain"
   - Updated fields list (includes pain_id)
   - All APPROVE_CONFIGS match database constraints

### Documentation Created
1. `/.codex/migration_023_audit.md`
   - Full analysis of migration 023
   - Issues found (canvas_extended, pains_ranking)
   - Recommendations

2. `/.codex/DATABASE_READY_CHECKLIST.md` (this file)
   - Complete readiness checklist
   - All validations and fixes

---

## PART 6: Next Steps

### Before Updating Routes

1. [ ] Apply migration 024 to Supabase
   ```bash
   npx supabase db push
   # OR via Supabase Dashboard SQL Editor
   ```

2. [ ] Verify constraints in database
   ```sql
   -- Check UNIQUE constraints
   SELECT conname, conrelid::regclass, contype
   FROM pg_constraint
   WHERE conname LIKE 'uq_%'
   ORDER BY conrelid::regclass::text;
   ```

3. [ ] Test approve-utils with new scope
   ```typescript
   // Test painsRanking approve with scope="pain"
   await approveWithUpsert(APPROVE_CONFIGS.painsRanking, {
     projectId,
     segmentId,
     painId,  // Now required!
     draftId,
   });
   ```

### After Migration 024 Applied

- [x] Migration 023 applied
- [ ] Migration 024 applied
- [x] approve-utils.ts updated
- [ ] Routes updated to use new approve logic
- [ ] Testing complete

---

## RISK ASSESSMENT

### Before Migration 024
- Risk Level: HIGH
- Issue: Missing UNIQUE constraints
- Impact: Duplicate records possible
- Recommendation: DO NOT update routes yet

### After Migration 024
- Risk Level: LOW
- All constraints in place
- approve-utils.ts matches database schema
- Safe to update routes

---

## VALIDATION QUERIES

Run these after applying migration 024:

```sql
-- 1. Check all UNIQUE constraints exist
SELECT
  conname AS constraint_name,
  conrelid::regclass AS table_name,
  pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conname LIKE 'uq_%'
ORDER BY conrelid::regclass::text;

-- Expected 14 constraints:
-- uq_portrait_final_project
-- uq_jobs_project_segment
-- uq_preferences_project_segment
-- uq_difficulties_project_segment
-- uq_triggers_project_segment
-- uq_canvas_project_segment_pain
-- uq_canvas_extended_project_segment_pain (NEW)
-- uq_pains_ranking_project_segment_pain (NEW)
-- uq_channel_strategy_project_segment
-- uq_competitive_intelligence_project_segment
-- uq_pricing_psychology_project_segment
-- uq_trust_framework_project_segment
-- uq_jtbd_context_project_segment

-- 2. Check data_history table
SELECT COUNT(*) FROM data_history;
-- Should return 0 (empty table, ready for use)

-- 3. Check approved_at columns exist
SELECT
  table_name,
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE column_name = 'approved_at'
  AND table_schema = 'public'
ORDER BY table_name;

-- Expected 14 rows (all approved tables)

-- 4. Check for duplicate records (should be 0)
SELECT 'portrait_final' as tbl, COUNT(*) - COUNT(DISTINCT project_id) as dupes
  FROM portrait_final
UNION ALL
SELECT 'jobs', COUNT(*) - COUNT(DISTINCT (project_id, segment_id))
  FROM jobs
UNION ALL
SELECT 'canvas_extended', COUNT(*) - COUNT(DISTINCT (project_id, segment_id, pain_id))
  FROM canvas_extended
UNION ALL
SELECT 'pains_ranking', COUNT(*) - COUNT(DISTINCT (project_id, segment_id, pain_id))
  FROM pains_ranking;

-- All rows should show dupes = 0
```

---

## FINAL CHECKLIST

### Migration 023
- [x] data_history table created
- [x] approved_at columns added
- [x] Duplicate cleanup included
- [x] 11 UNIQUE constraints added
- [x] RLS policies configured

### Migration 024
- [x] File created: `024_fix_missing_constraints.sql`
- [ ] Applied to Supabase
- [x] canvas_extended constraint included
- [x] pains_ranking constraint included
- [x] Additional indexes included

### Code Updates
- [x] approve-utils.ts updated
- [x] painsRanking scope changed to "pain"
- [x] All APPROVE_CONFIGS validated

### Documentation
- [x] migration_023_audit.md created
- [x] DATABASE_READY_CHECKLIST.md created
- [x] All issues documented

### Testing
- [ ] Migration 024 applied to Supabase
- [ ] UNIQUE constraints verified
- [ ] approve-utils tested with new scope
- [ ] Routes updated
- [ ] End-to-end testing complete

---

## CONCLUSION

Database is READY for new approve logic after Migration 024 is applied.

**Current Status**:
- Migration 023: APPLIED (assumed)
- Migration 024: READY TO APPLY
- approve-utils.ts: UPDATED
- Routes: WAITING for migration 024

**Action Required**:
1. Apply migration 024 to Supabase
2. Run validation queries
3. Update routes to use approve-utils
4. Test end-to-end approve flow

**Database Agent**: All systems GO after migration 024 applied.
