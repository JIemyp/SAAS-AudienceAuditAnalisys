// =====================================================
// Increase timeout for AI generation
export const maxDuration = 60;

// Generate Validation - Prompt 1
// =====================================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { generateWithAI, parseJSONResponse } from "@/lib/ai-client";
import { buildValidationPrompt, ValidationResponse } from "@/lib/prompts";
import { handleApiError, ApiError, withRetry } from "@/lib/api-utils";
import { Project } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const { projectId } = await request.json();

    if (!projectId) {
      throw new ApiError("Project ID is required", 400);
    }

    const supabase = await createServerClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new ApiError("Unauthorized", 401);
    }

    // Get project with onboarding data
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .single();

    if (projectError || !project) {
      throw new ApiError("Project not found", 404);
    }

    const typedProject = project as Project;

    if (!typedProject.onboarding_data) {
      throw new ApiError("Onboarding data not found", 400);
    }

    // Build prompt and call AI (uses user's provider settings)
    const prompt = buildValidationPrompt(typedProject.onboarding_data);

    const response = await withRetry(async () => {
      const text = await generateWithAI({ prompt, maxTokens: 2048, userId: user.id });
      return parseJSONResponse<ValidationResponse>(text);
    });

    // Save to validation_drafts
    const { data: draft, error: insertError } = await supabase
      .from("validation_drafts")
      .insert({
        project_id: projectId,
        what_brand_sells: response.what_brand_sells,
        problem_solved: response.problem_solved,
        key_differentiator: response.key_differentiator,
        understanding_correct: response.understanding_correct,
        clarification_needed: response.clarification_needed,
        version: 1,
      })
      .select()
      .single();

    if (insertError) {
      throw new ApiError("Failed to save draft", 500);
    }

    // Update project step
    await supabase
      .from("projects")
      .update({ current_step: "validation_draft", status: "processing" })
      .eq("id", projectId);

    return NextResponse.json({
      success: true,
      draft,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
