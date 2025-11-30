# Implementation Plan: Audience Research Tool v4

## Overview

Complete architecture with **15 prompts**, **33 database tables**, **30 API endpoints**, and **15 frontend pages**.

**Architecture:**
- Each prompt = separate analysis step
- Each step = 2 tables (drafts + approved)
- 3 final report tables for aggregated data

**Reference Document:** `audience-research-tool-v4-complete.md`

---

## Agents Structure

| Agent | Responsibility |
|-------|----------------|
| **orchestrator** | Main coordinator, delegates tasks |
| **database-agent** | Create 33 tables, RLS policies, project status flow |
| **prompts-agent** | 15 prompts with TypeScript functions, types |
| **backend-agent** | 30 API endpoints (15 generate + 15 approve), error handling |
| **frontend-agent** | 15 generation pages, navigation, redirect logic |
| **qa-controller** | Quality checks after each task |

---

## Status Tracking

| Phase | Checkpoint | Status | Agent | Reference |
|-------|------------|--------|-------|-----------|
| 1 | 1.1 Block 1 Tables (8) | ✅ | database-agent | v4: "Database Schema" → BLOCK 1: PORTRAIT |
| 1 | 1.2 Block 2 Tables (8) | ✅ | database-agent | v4: "Database Schema" → BLOCK 2: DEEP ANALYSIS |
| 1 | 1.3 Block 3 Tables (6) | ✅ | database-agent | v4: "Database Schema" → BLOCK 3: SEGMENTATION |
| 1 | 1.4 Block 4 Tables (8) | ✅ | database-agent | v4: "Database Schema" → BLOCK 4: PAINS |
| 1 | 1.5 Final Report Tables (3) | ✅ | database-agent | v4: "Database Schema" → FINAL REPORT TABLES |
| 1 | 1.6 RLS Policies (33) | ✅ | database-agent | v4: "RLS POLICIES" section |
| 1 | 1.7 Project Status Flow | ✅ | database-agent | v4: "Project Status Flow" section |
| 2 | 2.1 Types Update | ✅ | prompts-agent | v4: JSON output structures in "Prompts" section |
| 3 | 3.1 Block 1 Prompts (4) | ✅ | prompts-agent | v4: Prompt 1-4 (Validation, Portrait, Portrait Review, Portrait Final) |
| 3 | 3.2 Block 2 Prompts (4) | ✅ | prompts-agent | v4: Prompt 5-8 (Jobs, Preferences, Difficulties, Triggers) |
| 3 | 3.3 Block 3 Prompts (3) | ✅ | prompts-agent | v4: Prompt 9-11 (Segments, Segments Review, Segment Details) |
| 3 | 3.4 Block 4 Prompts (4) | ✅ | prompts-agent | v4: Prompt 12-15 (Pains, Pains Ranking, Canvas, Canvas Extended) |
| 4 | 4.1 Error Handling | ✅ | backend-agent | — |
| 4 | 4.2 Generate Endpoints (15) | ✅ | backend-agent | v4: "API Endpoints" → Generate Endpoints |
| 4 | 4.3 Approve Endpoints (15) | ✅ | backend-agent | v4: "API Endpoints" → Approve Endpoints |
| 4 | 4.4 Draft CRUD APIs | ✅ | backend-agent | v4: "API Endpoints" → Draft CRUD Endpoints |
| 4 | 4.5 Regenerate APIs | ⏳ | backend-agent | — |
| 4 | 4.6 Final Report Compilation | ✅ | backend-agent | v4: "Data Flow" → FINAL: COMPILE REPORTS |
| 5 | 5.1 Navigation & Redirect | 🔄 | frontend-agent | v4: "Data Flow" section for transition logic |
| 5 | 5.2 Block 1 Pages (4) | ⏳ | frontend-agent | v4: "Frontend Pages" section |
| 5 | 5.3 Block 2 Pages (4) | ⏳ | frontend-agent | v4: "Frontend Pages" section |
| 5 | 5.4 Block 3 Pages (3) | ⏳ | frontend-agent | v4: "Frontend Pages" section |
| 5 | 5.5 Block 4 Pages (4) | ⏳ | frontend-agent | v4: "Frontend Pages" section |
| 5 | 5.6 View Approved Pages | ⏳ | frontend-agent | — |
| 5 | 5.7 Export | ⏳ | frontend-agent | — |

**Legend:** ⏳ Pending | 🔄 In Progress | ✅ Completed | ❌ Blocked

---

## Phase 1: Database Migration

### Checkpoint 1.1: Block 1 Tables (Portrait) - 8 tables
- validation_drafts, validation
- portrait_drafts, portrait
- portrait_review_drafts, portrait_review
- portrait_final_drafts, portrait_final

### Checkpoint 1.2: Block 2 Tables (Deep Analysis) - 8 tables
- jobs_drafts, jobs
- preferences_drafts, preferences
- difficulties_drafts, difficulties
- triggers_drafts, triggers

### Checkpoint 1.3: Block 3 Tables (Segmentation) - 6 tables
- segments_drafts, segments_initial
- segments_review_drafts, segments_review
- segment_details_drafts, segment_details

### Checkpoint 1.4: Block 4 Tables (Pains) - 8 tables
- pains_drafts, pains_initial
- pains_ranking_drafts, pains_ranking
- canvas_drafts, canvas
- canvas_extended_drafts, canvas_extended

### Checkpoint 1.5: Final Report Tables - 3 tables
- audience
- segments
- pains

### Checkpoint 1.6: RLS Policies - 33 policies
All tables with: `project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())`

### Checkpoint 1.7: Project Status Flow - 31 states
From 'onboarding' to 'completed'

---

## Phase 2-3: Types & Prompts

### Checkpoint 2.1: TypeScript Types
File: `src/types/index.ts`
- AwarenessLevel, ImportanceLevel, FrequencyLevel
- ProjectStep (31 states)
- All entity interfaces

### Checkpoint 3.1-3.4: 15 Prompts
File: `src/lib/prompts.ts`
- Block 1: 4 prompts (Validation → Portrait Final)
- Block 2: 4 prompts (Jobs → Triggers)
- Block 3: 3 prompts (Segments → Segment Details)
- Block 4: 4 prompts (Pains → Canvas Extended)

---

## Phase 4: Backend API

### Checkpoint 4.1: Error Handling & Utils
File: `src/lib/api-utils.ts`
- Retry logic (3 attempts)
- JSON parsing
- Error messages

### Checkpoint 4.2: Generate Endpoints (15)
Path: `src/app/api/generate/*/route.ts`

### Checkpoint 4.3: Approve Endpoints (15)
Path: `src/app/api/approve/*/route.ts`

### Checkpoint 4.4: Draft CRUD APIs
Path: `src/app/api/drafts/route.ts`

### Checkpoint 4.5: Regenerate APIs
Path: `src/app/api/generate/*/regenerate/route.ts`

### Checkpoint 4.6: Final Report Compilation
Compile audience, segments, pains tables from approved data

---

## Phase 5: Frontend

### Checkpoint 5.1: Navigation & Redirect Logic
File: `src/app/(dashboard)/projects/[id]/layout.tsx`
- redirectMap for 31 states

### Checkpoint 5.2-5.5: 15 Generation Pages
Path: `src/app/(dashboard)/projects/[id]/generate/*/page.tsx`

### Checkpoint 5.6: View Approved Pages
- `/overview` - audience report
- `/segments` - segments with details
- `/pains` - pains with canvas

### Checkpoint 5.7: Export
- JSON export
- PDF export

---

## Summary

| Component | Count |
|-----------|-------|
| Prompts | 15 |
| Draft tables | 15 |
| Approved tables | 15 |
| Final tables | 3 |
| **Total tables** | **33** |
| Generate endpoints | 15 |
| Approve endpoints | 15 |
| **Total API endpoints** | **30+** |
| Frontend pages | 15 |
| Project status states | 31 |

---

## Critical Files

**Database:**
- SQL migrations (run in Supabase Dashboard)

**Types:**
- `src/types/index.ts`

**Prompts:**
- `src/lib/prompts.ts`

**Backend:**
- `src/app/api/generate/*/route.ts` (15 files)
- `src/app/api/approve/*/route.ts` (15 files)
- `src/app/api/drafts/route.ts`
- `src/lib/api-utils.ts`

**Frontend:**
- `src/app/(dashboard)/projects/[id]/generate/*/page.tsx` (15 files)
- `src/app/(dashboard)/projects/[id]/layout.tsx`

---

## Reference Documents

- `audience-research-tool-v4-complete.md` - Full specification with prompts
- `.claude/agents/` - Agent specifications
- `.claude/plans/` - System plan file

---

*Version: 4.0*
*Last Updated: 2025-11-30*
