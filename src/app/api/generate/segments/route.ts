// =====================================================
// Generate Segments - Prompt 9
// Now works with just Portrait Final (Segments come BEFORE Jobs/Triggers in v4)
// =====================================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { generateWithClaude, parseJSONResponse } from "@/lib/anthropic";
import { buildSegmentsPrompt, SegmentsResponse } from "@/lib/prompts";
import { handleApiError, ApiError, withRetry } from "@/lib/api-utils";
import { Project, PortraitFinal } from "@/types";

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

    // Get approved Portrait Final
    const { data: portraitFinal } = await supabase
      .from("portrait_final")
      .select("*")
      .eq("project_id", projectId)
      .order("approved_at", { ascending: false })
      .limit(1)
      .single();

    if (!portraitFinal) {
      throw new ApiError("Portrait Final not found. Complete Portrait Final step first.", 400);
    }

    // Build prompt with just onboarding and portrait final (no Jobs/Triggers needed)
    const prompt = buildSegmentsPrompt(
      typedProject.onboarding_data,
      portraitFinal as PortraitFinal
    );

    const response = await withRetry(async () => {
      const text = await generateWithClaude({ prompt, maxTokens: 8192 });
      return parseJSONResponse<SegmentsResponse>(text);
    });

    // Get max version for this project to determine next version number
    const { data: existingDrafts } = await supabase
      .from("segments_drafts")
      .select("version")
      .eq("project_id", projectId)
      .order("version", { ascending: false })
      .limit(1);

    const nextVersion = existingDrafts && existingDrafts.length > 0
      ? existingDrafts[0].version + 1
      : 1;

    console.log(`[generate/segments] Creating ${response.segments.length} segments with version ${nextVersion}`);

    // Insert all 10 segments with same version
    const drafts = [];
    for (const segment of response.segments) {
      const { data: draft, error: insertError } = await supabase
        .from("segments_drafts")
        .insert({
          project_id: projectId,
          segment_index: segment.index,
          name: segment.name,
          description: segment.description,
          sociodemographics: segment.sociodemographics,
          version: nextVersion,
        })
        .select()
        .single();

      if (insertError) {
        console.error("Failed to save segment draft:", insertError);
        continue;
      }
      drafts.push(draft);
    }

    console.log(`[generate/segments] Created ${drafts.length} segment drafts`);

    await supabase
      .from("projects")
      .update({ current_step: "segments_draft" })
      .eq("id", projectId);

    return NextResponse.json({ success: true, drafts, total: response.total_segments });
  } catch (error) {
    return handleApiError(error);
  }
}
