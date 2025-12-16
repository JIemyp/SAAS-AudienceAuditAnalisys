// =====================================================
// Increase timeout for AI generation
export const maxDuration = 60;

// Generate Portrait - Prompt 2
// =====================================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { generateWithAI, parseJSONResponse } from "@/lib/ai-client";
import { buildPortraitPrompt, PortraitResponse } from "@/lib/prompts";
import { handleApiError, ApiError, withRetry } from "@/lib/api-utils";
import { Project, Validation } from "@/types";

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

    // Get project
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

    // Get approved validation
    const { data: validation, error: validationError } = await supabase
      .from("validation")
      .select("*")
      .eq("project_id", projectId)
      .order("approved_at", { ascending: false })
      .limit(1)
      .single();

    if (validationError || !validation) {
      throw new ApiError("Validation not found. Complete validation step first.", 400);
    }

    // Build prompt and call Claude
    const prompt = buildPortraitPrompt(typedProject.onboarding_data, validation as Validation);

    const response = await withRetry(async () => {
      const text = await generateWithAI({ prompt, maxTokens: 4096, userId: user.id });
      return parseJSONResponse<PortraitResponse>(text);
    });

    // Save to portrait_drafts
    const { data: draft, error: insertError } = await supabase
      .from("portrait_drafts")
      .insert({
        project_id: projectId,
        sociodemographics: response.sociodemographics,
        psychographics: response.psychographics,
        age_range: response.demographics_detailed.age_range,
        gender_distribution: response.demographics_detailed.gender_distribution,
        income_level: response.demographics_detailed.income_level,
        education: response.demographics_detailed.education,
        location: response.demographics_detailed.location,
        occupation: response.demographics_detailed.occupation,
        family_status: response.demographics_detailed.family_status,
        values_beliefs: response.psychographics_detailed.values_beliefs,
        lifestyle_habits: response.psychographics_detailed.lifestyle_habits,
        interests_hobbies: response.psychographics_detailed.interests_hobbies,
        personality_traits: response.psychographics_detailed.personality_traits,
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
      .update({ current_step: "portrait_draft" })
      .eq("id", projectId);

    return NextResponse.json({
      success: true,
      draft,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
