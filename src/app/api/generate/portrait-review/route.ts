// =====================================================
// Generate Portrait Review - Prompt 3
// =====================================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { generateWithAI, parseJSONResponse } from "@/lib/ai-client";
import { buildPortraitReviewPrompt, PortraitReviewResponse } from "@/lib/prompts";
import { handleApiError, ApiError, withRetry } from "@/lib/api-utils";
import { Project, Portrait } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const { projectId } = await request.json();

    if (!projectId) {
      throw new ApiError("Project ID is required", 400);
    }

    const supabase = await createServerClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new ApiError("Unauthorized", 401);
    }

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

    // Get approved portrait
    const { data: portrait, error: portraitError } = await supabase
      .from("portrait")
      .select("*")
      .eq("project_id", projectId)
      .order("approved_at", { ascending: false })
      .limit(1)
      .single();

    if (portraitError || !portrait) {
      throw new ApiError("Portrait not found. Complete portrait step first.", 400);
    }

    const prompt = buildPortraitReviewPrompt(typedProject.onboarding_data, portrait as Portrait);

    const response = await withRetry(async () => {
      const text = await generateWithAI({ prompt, maxTokens: 4096, userId: user.id });
      return parseJSONResponse<PortraitReviewResponse>(text);
    });

    const { data: draft, error: insertError } = await supabase
      .from("portrait_review_drafts")
      .insert({
        project_id: projectId,
        original_portrait_id: portrait.id,
        what_to_change: response.what_to_change,
        what_to_add: response.what_to_add,
        what_to_remove: response.what_to_remove,
        reasoning: response.overall_assessment,
        version: 1,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Portrait review draft insert error:", insertError);
      throw new ApiError(`Failed to save draft: ${insertError.message}`, 500);
    }

    await supabase
      .from("projects")
      .update({ current_step: "portrait_review_draft" })
      .eq("id", projectId);

    return NextResponse.json({ success: true, draft });
  } catch (error) {
    return handleApiError(error);
  }
}
