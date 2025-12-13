// =====================================================
// Step Dependencies Contract
// =====================================================
// This file defines the REQUIRED data dependencies for each generation step.
// Used by generate routes to validate prerequisites before AI generation.
// =====================================================

export type StepName =
  // Phase 1: Portrait & Segments
  | "portrait"
  | "portrait_review"
  | "portrait_final"
  | "segments"
  | "segments_review"
  | "segments_final"
  // Phase 2: Segment Details
  | "segment_details"
  // Phase 3: Jobs Flow (per segment)
  | "jobs"
  | "preferences"
  | "difficulties"
  | "triggers"
  // Phase 4: Pains Flow (per segment)
  | "pains"
  | "pains_ranking"
  // Phase 5: Canvas (per segment + pain)
  | "canvas"
  | "canvas_extended"
  // Phase 6: V5 Deep Analysis (per segment)
  | "channel_strategy"
  | "competitive_intelligence"
  | "pricing_psychology"
  | "trust_framework"
  | "jtbd_context";

export type TableName =
  | "portrait_initial"
  | "portrait_review"
  | "portrait_final"
  | "segments_initial"
  | "segments_review"
  | "segments_final"
  | "segments"
  | "segment_details"
  | "jobs"
  | "preferences"
  | "difficulties"
  | "triggers"
  | "pains_initial"
  | "pains_ranking"
  | "canvas"
  | "canvas_extended"
  | "channel_strategy"
  | "competitive_intelligence"
  | "pricing_psychology"
  | "trust_framework"
  | "jtbd_context";

export type ScopeType = "project" | "segment" | "pain";

export interface StepDependency {
  table: TableName;
  scope: ScopeType;
  description: string;
}

export interface StepConfig {
  step: StepName;
  scope: ScopeType;
  required: StepDependency[];
  description: string;
}

// =====================================================
// STEP DEPENDENCIES CONTRACT
// =====================================================
// Each step lists what data MUST exist before generation.
// "required" = generation will fail without this data
// =====================================================

export const STEP_DEPENDENCIES: Record<StepName, StepConfig> = {
  // ─────────────────────────────────────────────────
  // Phase 1: Portrait & Segments (project scope)
  // ─────────────────────────────────────────────────
  portrait: {
    step: "portrait",
    scope: "project",
    required: [],
    description: "Initial portrait generation from onboarding data",
  },

  portrait_review: {
    step: "portrait_review",
    scope: "project",
    required: [
      { table: "portrait_initial", scope: "project", description: "Approved initial portrait" },
    ],
    description: "Portrait review with user feedback",
  },

  portrait_final: {
    step: "portrait_final",
    scope: "project",
    required: [
      { table: "portrait_review", scope: "project", description: "Approved portrait review" },
    ],
    description: "Final portrait after all revisions",
  },

  segments: {
    step: "segments",
    scope: "project",
    required: [
      { table: "portrait_final", scope: "project", description: "Approved final portrait" },
    ],
    description: "Initial segments generation",
  },

  segments_review: {
    step: "segments_review",
    scope: "project",
    required: [
      { table: "segments_initial", scope: "project", description: "Approved initial segments" },
    ],
    description: "Segments review with merge/split/delete decisions",
  },

  segments_final: {
    step: "segments_final",
    scope: "project",
    required: [
      { table: "segments_review", scope: "project", description: "Approved segments review" },
    ],
    description: "Final segments after all revisions",
  },

  // ─────────────────────────────────────────────────
  // Phase 2: Segment Details (per segment)
  // ─────────────────────────────────────────────────
  segment_details: {
    step: "segment_details",
    scope: "segment",
    required: [
      { table: "portrait_final", scope: "project", description: "Final portrait for context" },
      { table: "segments_final", scope: "project", description: "Final segments list" },
    ],
    description: "Detailed segment analysis (psychographics, behavior)",
  },

  // ─────────────────────────────────────────────────
  // Phase 3: Jobs Flow (per segment, sequential)
  // ─────────────────────────────────────────────────
  jobs: {
    step: "jobs",
    scope: "segment",
    required: [
      { table: "portrait_final", scope: "project", description: "Final portrait for context" },
      { table: "segments", scope: "segment", description: "Working segment (from segment_details approve)" },
    ],
    description: "Jobs to be done analysis",
  },

  preferences: {
    step: "preferences",
    scope: "segment",
    required: [
      { table: "portrait_final", scope: "project", description: "Final portrait for context" },
      { table: "segments", scope: "segment", description: "Working segment" },
      { table: "segment_details", scope: "segment", description: "Segment details" },
      { table: "jobs", scope: "segment", description: "Approved jobs" },
    ],
    description: "User preferences and expectations",
  },

  difficulties: {
    step: "difficulties",
    scope: "segment",
    required: [
      { table: "portrait_final", scope: "project", description: "Final portrait for context" },
      { table: "segments", scope: "segment", description: "Working segment" },
      { table: "segment_details", scope: "segment", description: "Segment details" },
      { table: "jobs", scope: "segment", description: "Approved jobs" },
      { table: "preferences", scope: "segment", description: "Approved preferences" },
    ],
    description: "User difficulties and obstacles",
  },

  triggers: {
    step: "triggers",
    scope: "segment",
    required: [
      { table: "portrait_final", scope: "project", description: "Final portrait for context" },
      { table: "segments", scope: "segment", description: "Working segment" },
      { table: "segment_details", scope: "segment", description: "Segment details" },
      { table: "jobs", scope: "segment", description: "Approved jobs" },
      { table: "preferences", scope: "segment", description: "Approved preferences" },
      { table: "difficulties", scope: "segment", description: "Approved difficulties" },
    ],
    description: "Purchase triggers and motivations",
  },

  // ─────────────────────────────────────────────────
  // Phase 4: Pains Flow (per segment)
  // ─────────────────────────────────────────────────
  pains: {
    step: "pains",
    scope: "segment",
    required: [
      { table: "portrait_final", scope: "project", description: "Final portrait for context" },
      { table: "segments", scope: "segment", description: "Working segment" },
      { table: "segment_details", scope: "segment", description: "Segment details" },
      { table: "jobs", scope: "segment", description: "Approved jobs" },
      { table: "preferences", scope: "segment", description: "Approved preferences" },
      { table: "difficulties", scope: "segment", description: "Approved difficulties" },
      { table: "triggers", scope: "segment", description: "Approved triggers" },
    ],
    description: "Pain points analysis",
  },

  pains_ranking: {
    step: "pains_ranking",
    scope: "segment",
    required: [
      { table: "pains_initial", scope: "segment", description: "Approved pains list" },
    ],
    description: "Pains prioritization and TOP selection",
  },

  // ─────────────────────────────────────────────────
  // Phase 5: Canvas (per segment + pain)
  // ─────────────────────────────────────────────────
  canvas: {
    step: "canvas",
    scope: "pain",
    required: [
      { table: "portrait_final", scope: "project", description: "Final portrait for context" },
      { table: "segments", scope: "segment", description: "Working segment" },
      { table: "segment_details", scope: "segment", description: "Segment details" },
      { table: "jobs", scope: "segment", description: "Approved jobs" },
      { table: "preferences", scope: "segment", description: "Approved preferences" },
      { table: "difficulties", scope: "segment", description: "Approved difficulties" },
      { table: "triggers", scope: "segment", description: "Approved triggers" },
      { table: "pains_ranking", scope: "segment", description: "Pains ranking with is_top_pain=true" },
    ],
    description: "Value proposition canvas per TOP pain",
  },

  canvas_extended: {
    step: "canvas_extended",
    scope: "pain",
    required: [
      { table: "canvas", scope: "pain", description: "Approved canvas for this pain" },
    ],
    description: "Extended canvas with messaging angles",
  },

  // ─────────────────────────────────────────────────
  // Phase 6: V5 Deep Analysis (per segment)
  // Sequential chain: 17 → 18 → 19 → 20 → 21
  // ─────────────────────────────────────────────────
  channel_strategy: {
    step: "channel_strategy",
    scope: "segment",
    required: [
      { table: "segments", scope: "segment", description: "Working segment" },
      { table: "segment_details", scope: "segment", description: "Segment details" },
      { table: "portrait_final", scope: "project", description: "Final portrait for context" },
      { table: "triggers", scope: "segment", description: "Approved triggers" },
    ],
    description: "Channel strategy (platforms, content, communities)",
  },

  competitive_intelligence: {
    step: "competitive_intelligence",
    scope: "segment",
    required: [
      { table: "segments", scope: "segment", description: "Working segment" },
      { table: "pains_initial", scope: "segment", description: "Approved pains" },
      { table: "jobs", scope: "segment", description: "Approved jobs" },
    ],
    description: "Competitive analysis (alternatives, workarounds, barriers)",
  },

  pricing_psychology: {
    step: "pricing_psychology",
    scope: "segment",
    required: [
      { table: "segments", scope: "segment", description: "Working segment" },
      { table: "pains_initial", scope: "segment", description: "Approved pains" },
      { table: "competitive_intelligence", scope: "segment", description: "Competitive intelligence" },
    ],
    description: "Pricing psychology (budget, perception, triggers)",
  },

  trust_framework: {
    step: "trust_framework",
    scope: "segment",
    required: [
      { table: "segments", scope: "segment", description: "Working segment" },
      { table: "pains_initial", scope: "segment", description: "Approved pains" },
      { table: "competitive_intelligence", scope: "segment", description: "Competitive intelligence" },
      { table: "pricing_psychology", scope: "segment", description: "Pricing psychology" },
    ],
    description: "Trust framework (proof, authorities, credibility)",
  },

  jtbd_context: {
    step: "jtbd_context",
    scope: "segment",
    required: [
      { table: "segments", scope: "segment", description: "Working segment" },
      { table: "jobs", scope: "segment", description: "Approved jobs" },
      { table: "competitive_intelligence", scope: "segment", description: "Competitive intelligence" },
    ],
    description: "JTBD context enhancement (triggers, alternatives, metrics)",
  },
};

// =====================================================
// Helper Functions
// =====================================================

/**
 * Get required dependencies for a step
 */
export function getStepDependencies(step: StepName): StepConfig {
  return STEP_DEPENDENCIES[step];
}

/**
 * Get all steps that depend on a specific table
 */
export function getStepsDependingOn(table: TableName): StepName[] {
  return Object.entries(STEP_DEPENDENCIES)
    .filter(([_, config]) => config.required.some(dep => dep.table === table))
    .map(([step]) => step as StepName);
}

/**
 * Get the V5 generation order (must be sequential)
 */
export function getV5GenerationOrder(): StepName[] {
  return [
    "channel_strategy",      // 17 - needs triggers
    "competitive_intelligence", // 18 - needs pains, jobs
    "pricing_psychology",    // 19 - needs pains, competitive_intel
    "trust_framework",       // 20 - needs pains, competitive_intel, pricing
    "jtbd_context",          // 21 - needs jobs, competitive_intel
  ];
}

/**
 * Check if step B depends on step A (directly or indirectly)
 */
export function stepDependsOn(stepB: StepName, stepA: StepName): boolean {
  const configB = STEP_DEPENDENCIES[stepB];
  const configA = STEP_DEPENDENCIES[stepA];

  // Get the output table of step A
  const stepAOutput = getStepOutputTable(stepA);
  if (!stepAOutput) return false;

  // Check if step B requires that table
  return configB.required.some(dep => dep.table === stepAOutput);
}

/**
 * Get the output table for a step
 */
export function getStepOutputTable(step: StepName): TableName | null {
  const mapping: Partial<Record<StepName, TableName>> = {
    portrait: "portrait_initial",
    portrait_review: "portrait_review",
    portrait_final: "portrait_final",
    segments: "segments_initial",
    segments_review: "segments_review",
    segments_final: "segments_final",
    segment_details: "segment_details",
    jobs: "jobs",
    preferences: "preferences",
    difficulties: "difficulties",
    triggers: "triggers",
    pains: "pains_initial",
    pains_ranking: "pains_ranking",
    canvas: "canvas",
    canvas_extended: "canvas_extended",
    channel_strategy: "channel_strategy",
    competitive_intelligence: "competitive_intelligence",
    pricing_psychology: "pricing_psychology",
    trust_framework: "trust_framework",
    jtbd_context: "jtbd_context",
  };
  return mapping[step] || null;
}
