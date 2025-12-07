// =====================================================
// Audience Research Tool v4 - API Utilities
// Reference: audience-research-tool-v4-complete.md
// =====================================================

import { NextResponse } from "next/server";
import { PROJECT_STEPS, ProjectStep } from "@/types";

// =====================================================
// Error Handling
// =====================================================

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function handleApiError(error: unknown): NextResponse {
  console.error("API Error:", error);

  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.statusCode }
    );
  }

  if (error instanceof Error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { error: "An unexpected error occurred" },
    { status: 500 }
  );
}

// =====================================================
// JSON Parsing with Retry
// =====================================================

export function parseJSONResponse<T>(text: string): T {
  // Remove markdown code blocks if present
  let cleanText = text.trim();

  // Remove ```json ... ``` wrapper
  if (cleanText.startsWith("```json")) {
    cleanText = cleanText.slice(7);
  } else if (cleanText.startsWith("```")) {
    cleanText = cleanText.slice(3);
  }

  if (cleanText.endsWith("```")) {
    cleanText = cleanText.slice(0, -3);
  }

  cleanText = cleanText.trim();

  try {
    return JSON.parse(cleanText) as T;
  } catch (e) {
    // Try to extract JSON from the text
    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]) as T;
      } catch {
        throw new ApiError("Failed to parse JSON response from AI", 500, "JSON_PARSE_ERROR");
      }
    }
    throw new ApiError("Failed to parse JSON response from AI", 500, "JSON_PARSE_ERROR");
  }
}

// =====================================================
// Retry Logic
// =====================================================

export async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(`Attempt ${attempt}/${maxAttempts} failed:`, lastError.message);

      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
      }
    }
  }

  throw lastError || new Error("All retry attempts failed");
}

// =====================================================
// Step Navigation
// =====================================================

export function getNextStep(currentStep: ProjectStep): ProjectStep {
  const currentIndex = PROJECT_STEPS.indexOf(currentStep);
  if (currentIndex === -1 || currentIndex >= PROJECT_STEPS.length - 1) {
    return "completed";
  }
  return PROJECT_STEPS[currentIndex + 1];
}

export function getPreviousStep(currentStep: ProjectStep): ProjectStep {
  const currentIndex = PROJECT_STEPS.indexOf(currentStep);
  if (currentIndex <= 0) {
    return "onboarding";
  }
  return PROJECT_STEPS[currentIndex - 1];
}

export function getStepIndex(step: ProjectStep): number {
  return PROJECT_STEPS.indexOf(step);
}

export function isStepCompleted(currentStep: ProjectStep, checkStep: ProjectStep): boolean {
  return getStepIndex(currentStep) > getStepIndex(checkStep);
}

// =====================================================
// Step to Page Mapping
// =====================================================

// Updated flow: Segments BEFORE deep analysis
export const STEP_TO_PAGE: Record<ProjectStep, string> = {
  onboarding: "/projects/new",
  // Portrait block
  validation_draft: "/generate/validation",
  validation_approved: "/generate/portrait",
  portrait_draft: "/generate/portrait",
  portrait_approved: "/generate/portrait-review",
  portrait_review_draft: "/generate/portrait-review",
  portrait_review_approved: "/generate/portrait-final",
  portrait_final_draft: "/generate/portrait-final",
  portrait_final_approved: "/generate/segments", // Now goes to segments
  // Segmentation block (before deep analysis)
  segments_draft: "/generate/segments",
  segments_approved: "/generate/segments-review",
  segments_review_draft: "/generate/segments-review",
  segments_review_approved: "/generate/segments-final", // Apply decisions to segments
  segments_final_draft: "/generate/segments-final",
  segments_final_approved: "/generate/segment-details",
  segment_details_draft: "/generate/segment-details",
  segment_details_approved: "/generate/jobs", // After segment details, start deep analysis
  // Deep analysis per segment
  jobs_draft: "/generate/jobs",
  jobs_approved: "/generate/preferences",
  preferences_draft: "/generate/preferences",
  preferences_approved: "/generate/difficulties",
  difficulties_draft: "/generate/difficulties",
  difficulties_approved: "/generate/triggers",
  triggers_draft: "/generate/triggers",
  triggers_approved: "/generate/pains", // After triggers, go to pains
  // Pains & Canvas per segment
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

export function getPageForStep(projectId: string, step: ProjectStep): string {
  const pagePath = STEP_TO_PAGE[step] || "/overview";
  return `/projects/${projectId}${pagePath}`;
}

// =====================================================
// Response Helpers
// =====================================================

export function successResponse<T>(data: T, status: number = 200): NextResponse {
  return NextResponse.json({ success: true, data }, { status });
}

export function errorResponse(message: string, status: number = 400): NextResponse {
  return NextResponse.json({ success: false, error: message }, { status });
}

// =====================================================
// Validation Helpers
// =====================================================

export function validateProjectId(projectId: string | undefined): string {
  if (!projectId) {
    throw new ApiError("Project ID is required", 400, "MISSING_PROJECT_ID");
  }

  // Basic UUID validation
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(projectId)) {
    throw new ApiError("Invalid Project ID format", 400, "INVALID_PROJECT_ID");
  }

  return projectId;
}

export function validateSegmentId(segmentId: string | undefined): string {
  if (!segmentId) {
    throw new ApiError("Segment ID is required", 400, "MISSING_SEGMENT_ID");
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(segmentId)) {
    throw new ApiError("Invalid Segment ID format", 400, "INVALID_SEGMENT_ID");
  }

  return segmentId;
}

export function validatePainId(painId: string | undefined): string {
  if (!painId) {
    throw new ApiError("Pain ID is required", 400, "MISSING_PAIN_ID");
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(painId)) {
    throw new ApiError("Invalid Pain ID format", 400, "INVALID_PAIN_ID");
  }

  return painId;
}
