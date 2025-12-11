// =====================================================
// Project Utils - Step Navigation & Progress
// =====================================================

import { ProjectStep } from "@/types";

// Generation steps configuration (21 steps - v5 with strategic modules)
export const GENERATION_STEPS = [
  { step: "validation", label: "Validation", block: 1 },
  { step: "portrait", label: "Portrait", block: 1 },
  { step: "portrait-review", label: "Portrait Review", block: 1 },
  { step: "portrait-final", label: "Portrait Final", block: 1 },
  { step: "segments", label: "Segments", block: 2 },
  { step: "segments-review", label: "Segments Review", block: 2 },
  { step: "segments-final", label: "Segments Final", block: 2 },
  { step: "segment-details", label: "Segment Details", block: 2 },
  { step: "jobs", label: "Jobs to Be Done", block: 3 },
  { step: "preferences", label: "Preferences", block: 3 },
  { step: "difficulties", label: "Difficulties", block: 3 },
  { step: "triggers", label: "Triggers", block: 3 },
  { step: "pains", label: "Pains", block: 4 },
  { step: "pains-ranking", label: "Pains Ranking", block: 4 },
  { step: "canvas", label: "Canvas", block: 4 },
  { step: "canvas-extended", label: "Canvas Extended", block: 4 },
  // Block 5: Strategic Modules (v5)
  { step: "channel-strategy", label: "Channel Strategy", block: 5 },
  { step: "competitive-intelligence", label: "Competitive Intel", block: 5 },
  { step: "pricing-psychology", label: "Pricing Psychology", block: 5 },
  { step: "trust-framework", label: "Trust Framework", block: 5 },
  { step: "jtbd-context", label: "JTBD Context", block: 5 },
] as const;

// Map ProjectStep to URL path (v4 flow: Portrait → Segments → Deep Analysis)
export const STEP_TO_URL: Record<ProjectStep, string> = {
  onboarding: "/generate/validation",
  // Portrait block
  validation_draft: "/generate/validation",
  validation_approved: "/generate/portrait",
  portrait_draft: "/generate/portrait",
  portrait_approved: "/generate/portrait-review",
  portrait_review_draft: "/generate/portrait-review",
  portrait_review_approved: "/generate/portrait-final",
  portrait_final_draft: "/generate/portrait-final",
  portrait_final_approved: "/generate/segments",
  // Segmentation block
  segments_draft: "/generate/segments",
  segments_approved: "/generate/segments-review",
  segments_review_draft: "/generate/segments-review",
  segments_review_approved: "/generate/segments-final",
  segments_final_draft: "/generate/segments-final",
  segments_final_approved: "/generate/segment-details",
  segment_details_draft: "/generate/segment-details",
  segment_details_approved: "/generate/jobs",
  // Deep analysis block
  jobs_draft: "/generate/jobs",
  jobs_approved: "/generate/preferences",
  preferences_draft: "/generate/preferences",
  preferences_approved: "/generate/difficulties",
  difficulties_draft: "/generate/difficulties",
  difficulties_approved: "/generate/triggers",
  triggers_draft: "/generate/triggers",
  triggers_approved: "/generate/pains",
  // Pains & Canvas block
  pains_draft: "/generate/pains",
  pains_approved: "/generate/pains-ranking",
  pains_ranking_draft: "/generate/pains-ranking",
  pains_ranking_approved: "/generate/canvas",
  canvas_draft: "/generate/canvas",
  canvas_approved: "/generate/canvas-extended",
  canvas_extended_draft: "/generate/canvas-extended",
  canvas_extended_approved: "/generate/channel-strategy",
  // Strategic modules (v5)
  channel_strategy_draft: "/generate/channel-strategy",
  channel_strategy_approved: "/generate/competitive-intelligence",
  competitive_intelligence_draft: "/generate/competitive-intelligence",
  competitive_intelligence_approved: "/generate/pricing-psychology",
  pricing_psychology_draft: "/generate/pricing-psychology",
  pricing_psychology_approved: "/generate/trust-framework",
  trust_framework_draft: "/generate/trust-framework",
  trust_framework_approved: "/generate/jtbd-context",
  jtbd_context_draft: "/generate/jtbd-context",
  jtbd_context_approved: "/overview",
  completed: "/overview",
};

// Map ProjectStep to step number (1-21)
export function getStepNumber(currentStep: ProjectStep): number {
  const stepMapping: Record<ProjectStep, number> = {
    onboarding: 0,
    // Portrait block
    validation_draft: 1,
    validation_approved: 1,
    portrait_draft: 2,
    portrait_approved: 2,
    portrait_review_draft: 3,
    portrait_review_approved: 3,
    portrait_final_draft: 4,
    portrait_final_approved: 4,
    // Segmentation block
    segments_draft: 5,
    segments_approved: 5,
    segments_review_draft: 6,
    segments_review_approved: 6,
    segments_final_draft: 7,
    segments_final_approved: 7,
    segment_details_draft: 8,
    segment_details_approved: 8,
    // Deep analysis block
    jobs_draft: 9,
    jobs_approved: 9,
    preferences_draft: 10,
    preferences_approved: 10,
    difficulties_draft: 11,
    difficulties_approved: 11,
    triggers_draft: 12,
    triggers_approved: 12,
    // Pains & Canvas block
    pains_draft: 13,
    pains_approved: 13,
    pains_ranking_draft: 14,
    pains_ranking_approved: 14,
    canvas_draft: 15,
    canvas_approved: 15,
    canvas_extended_draft: 16,
    canvas_extended_approved: 16,
    // Strategic modules (v5)
    channel_strategy_draft: 17,
    channel_strategy_approved: 17,
    competitive_intelligence_draft: 18,
    competitive_intelligence_approved: 18,
    pricing_psychology_draft: 19,
    pricing_psychology_approved: 19,
    trust_framework_draft: 20,
    trust_framework_approved: 20,
    jtbd_context_draft: 21,
    jtbd_context_approved: 21,
    completed: 21,
  };

  return stepMapping[currentStep] || 0;
}

// Get step label by number
export function getStepLabel(stepNumber: number): string {
  if (stepNumber === 0) return "Not started";
  if (stepNumber > 21) return "Completed";
  return GENERATION_STEPS[stepNumber - 1]?.label || "Unknown";
}

// Check if project has any progress
export function hasProgress(currentStep: ProjectStep): boolean {
  return currentStep !== "onboarding";
}

// Check if project is completed
export function isCompleted(currentStep: ProjectStep): boolean {
  return currentStep === "completed" || currentStep === "jtbd_context_approved";
}

// Calculate progress percentage
export function getProgressPercentage(currentStep: ProjectStep): number {
  const stepNumber = getStepNumber(currentStep);
  if (stepNumber === 0) return 0;
  if (isCompleted(currentStep)) return 100;
  return Math.round((stepNumber / 21) * 100);
}
