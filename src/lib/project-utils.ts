// =====================================================
// Project Utils - Step Navigation & Progress
// =====================================================

import { ProjectStep } from "@/types";

// Generation steps configuration (15 steps)
export const GENERATION_STEPS = [
  { step: "validation", label: "Validation", block: 1 },
  { step: "portrait", label: "Portrait", block: 1 },
  { step: "portrait-review", label: "Portrait Review", block: 1 },
  { step: "portrait-final", label: "Portrait Final", block: 1 },
  { step: "jobs", label: "Jobs to Be Done", block: 2 },
  { step: "preferences", label: "Preferences", block: 2 },
  { step: "difficulties", label: "Difficulties", block: 2 },
  { step: "triggers", label: "Triggers", block: 2 },
  { step: "segments", label: "Segments", block: 3 },
  { step: "segments-review", label: "Segments Review", block: 3 },
  { step: "segment-details", label: "Segment Details", block: 3 },
  { step: "pains", label: "Pains", block: 4 },
  { step: "pains-ranking", label: "Pains Ranking", block: 4 },
  { step: "canvas", label: "Canvas", block: 4 },
  { step: "canvas-extended", label: "Canvas Extended", block: 4 },
] as const;

// Map ProjectStep to URL path
export const STEP_TO_URL: Record<ProjectStep, string> = {
  onboarding: "/generate/validation",
  validation_draft: "/generate/validation",
  validation_approved: "/generate/portrait",
  portrait_draft: "/generate/portrait",
  portrait_approved: "/generate/portrait-review",
  portrait_review_draft: "/generate/portrait-review",
  portrait_review_approved: "/generate/portrait-final",
  portrait_final_draft: "/generate/portrait-final",
  portrait_final_approved: "/generate/jobs",
  jobs_draft: "/generate/jobs",
  jobs_approved: "/generate/preferences",
  preferences_draft: "/generate/preferences",
  preferences_approved: "/generate/difficulties",
  difficulties_draft: "/generate/difficulties",
  difficulties_approved: "/generate/triggers",
  triggers_draft: "/generate/triggers",
  triggers_approved: "/generate/segments",
  segments_draft: "/generate/segments",
  segments_approved: "/generate/segments-review",
  segments_review_draft: "/generate/segments-review",
  segments_review_approved: "/generate/segment-details",
  segment_details_draft: "/generate/segment-details",
  segment_details_approved: "/generate/pains",
  pains_draft: "/generate/pains",
  pains_approved: "/generate/pains-ranking",
  pains_ranking_draft: "/generate/pains-ranking",
  pains_ranking_approved: "/generate/canvas",
  canvas_draft: "/generate/canvas",
  canvas_approved: "/generate/canvas-extended",
  canvas_extended_draft: "/generate/canvas-extended",
  canvas_extended_approved: "/overview",
  completed: "/overview",
};

// Map ProjectStep to step number (1-15)
export function getStepNumber(currentStep: ProjectStep): number {
  const stepMapping: Record<ProjectStep, number> = {
    onboarding: 0,
    validation_draft: 1,
    validation_approved: 1,
    portrait_draft: 2,
    portrait_approved: 2,
    portrait_review_draft: 3,
    portrait_review_approved: 3,
    portrait_final_draft: 4,
    portrait_final_approved: 4,
    jobs_draft: 5,
    jobs_approved: 5,
    preferences_draft: 6,
    preferences_approved: 6,
    difficulties_draft: 7,
    difficulties_approved: 7,
    triggers_draft: 8,
    triggers_approved: 8,
    segments_draft: 9,
    segments_approved: 9,
    segments_review_draft: 10,
    segments_review_approved: 10,
    segment_details_draft: 11,
    segment_details_approved: 11,
    pains_draft: 12,
    pains_approved: 12,
    pains_ranking_draft: 13,
    pains_ranking_approved: 13,
    canvas_draft: 14,
    canvas_approved: 14,
    canvas_extended_draft: 15,
    canvas_extended_approved: 15,
    completed: 15,
  };

  return stepMapping[currentStep] || 0;
}

// Get step label by number
export function getStepLabel(stepNumber: number): string {
  if (stepNumber === 0) return "Not started";
  if (stepNumber > 15) return "Completed";
  return GENERATION_STEPS[stepNumber - 1]?.label || "Unknown";
}

// Check if project has any progress
export function hasProgress(currentStep: ProjectStep): boolean {
  return currentStep !== "onboarding";
}

// Check if project is completed
export function isCompleted(currentStep: ProjectStep): boolean {
  return currentStep === "completed" || currentStep === "canvas_extended_approved";
}

// Calculate progress percentage
export function getProgressPercentage(currentStep: ProjectStep): number {
  const stepNumber = getStepNumber(currentStep);
  if (stepNumber === 0) return 0;
  if (isCompleted(currentStep)) return 100;
  return Math.round((stepNumber / 15) * 100);
}
