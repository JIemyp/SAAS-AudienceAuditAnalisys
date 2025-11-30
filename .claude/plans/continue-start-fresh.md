# Plan: Continue / Start Fresh Functionality

## Overview

Implement functionality for existing projects to either:
1. **Continue** — resume from the last step where user stopped
2. **Start Fresh** — reset all generated data and start from step 1 (Validation)

---

## Current Architecture

### Project States
- `current_step` — tracks where user is in 31-step process (e.g., `portrait_approved`, `segments_draft`)
- `status` — high-level status (`draft`, `processing`, `completed`, `failed`)

### Data Tables
15 draft tables + 15 approved tables + 3 final report tables = 33 tables total

---

## Implementation Plan

### 1. API Endpoint: Reset Project Data

**File:** `src/app/api/projects/[id]/reset/route.ts`

```typescript
POST /api/projects/[id]/reset

Response:
- Deletes all data from 33 tables for this project
- Resets project.current_step to 'validation_draft'
- Returns { success: true }
```

**Tables to clear:**
```typescript
const TABLES_TO_CLEAR = [
  // Block 1: Portrait
  'validation_drafts', 'validation',
  'portrait_drafts', 'portrait',
  'portrait_review_drafts', 'portrait_review',
  'portrait_final_drafts', 'portrait_final',

  // Block 2: Deep Analysis
  'jobs_drafts', 'jobs',
  'preferences_drafts', 'preferences',
  'difficulties_drafts', 'difficulties',
  'triggers_drafts', 'triggers',

  // Block 3: Segmentation
  'segments_drafts', 'segments_initial',
  'segments_review_drafts', 'segments_review',
  'segment_details_drafts', 'segment_details',

  // Block 4: Pains
  'pains_drafts', 'pains_initial',
  'pains_ranking_drafts', 'pains_ranking',
  'canvas_drafts', 'canvas',
  'canvas_extended_drafts', 'canvas_extended',

  // Final Report Tables
  'audience',
  'segments',
  'pains',

  // Legacy tables (if exist)
  'audience_overviews',
  'audience_segments',
];
```

---

### 2. UI Component: Project Action Banner

**Location:** `src/app/(dashboard)/projects/[id]/overview/page.tsx`

Add a banner at the top when project has existing data:

```
┌────────────────────────────────────────────────────────────────┐
│  🔄 Research Progress                                          │
│                                                                 │
│  You've completed: Portrait, Jobs, Preferences                 │
│  Current step: Difficulties (Step 7 of 15)                     │
│                                                                 │
│  [Continue →]  [Start Fresh]                                   │
└────────────────────────────────────────────────────────────────┘
```

---

### 3. Confirmation Modal for Start Fresh

Show warning before deleting:

```
┌────────────────────────────────────────────────────────────────┐
│  ⚠️  Start Fresh?                                              │
│                                                                 │
│  This will permanently delete:                                  │
│  • All generated content (validation, portraits, segments...)  │
│  • All approved data                                           │
│  • Final reports                                                │
│                                                                 │
│  Your original input data (brand info, files) will be kept.   │
│                                                                 │
│  Type "START FRESH" to confirm:                                │
│  [________________]                                             │
│                                                                 │
│  [Cancel]  [Delete & Start Fresh]                              │
└────────────────────────────────────────────────────────────────┘
```

---

### 4. Navigation Logic

**Continue button:**
- Read `project.current_step`
- Map to URL: `validation_draft` → `/generate/validation`
- Redirect to that page

**Start Fresh button:**
1. Show confirmation modal
2. Call `POST /api/projects/[id]/reset`
3. Redirect to `/projects/[id]/generate/validation`

---

### 5. Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/app/api/projects/[id]/reset/route.ts` | Create | API endpoint to reset project |
| `src/components/project/ResearchProgressBanner.tsx` | Create | Banner with Continue/Start Fresh |
| `src/components/project/StartFreshModal.tsx` | Create | Confirmation modal |
| `src/app/(dashboard)/projects/[id]/overview/page.tsx` | Modify | Add banner to overview |
| `src/lib/project-utils.ts` | Create | Helper functions for step mapping |

---

### 6. Step-to-URL Mapping

```typescript
const STEP_TO_URL: Record<ProjectStep, string> = {
  'onboarding': '/generate/validation',
  'validation_draft': '/generate/validation',
  'validation_approved': '/generate/portrait',
  'portrait_draft': '/generate/portrait',
  'portrait_approved': '/generate/portrait-review',
  // ... etc
  'canvas_extended_approved': '/overview', // completed
  'completed': '/overview',
};
```

---

## User Flow

### Flow 1: Continue
1. User opens project overview
2. Sees "Research Progress" banner
3. Clicks "Continue"
4. Redirects to current step page (e.g., `/generate/difficulties`)

### Flow 2: Start Fresh
1. User opens project overview
2. Sees "Research Progress" banner
3. Clicks "Start Fresh"
4. Modal appears with warning
5. User types "START FRESH"
6. API deletes all generated data
7. Redirects to `/generate/validation`

---

## Edge Cases

1. **No data yet** — Don't show banner, just show "Start Analysis" button
2. **Already completed** — Show "Re-analyze" option that triggers Start Fresh
3. **Failed status** — Show "Retry from X" or "Start Fresh" options
4. **In progress** — Disable actions, show processing indicator

---

## Estimated Changes

- 1 new API route
- 3 new components
- 1 modified page
- 1 new utility file

Total: ~5 files, ~400 lines of code
