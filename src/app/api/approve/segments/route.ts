// =====================================================
// Approve Segments - Prompt 9
// =====================================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { handleApiError, ApiError, getNextStep } from "@/lib/api-utils";

export async function POST(request: NextRequest) {
  try {
    const { projectId, draftIds } = await request.json();

    if (!projectId || !draftIds || !Array.isArray(draftIds)) {
      throw new ApiError("Project ID and Draft IDs array are required", 400);
    }

    const supabase = await createServerClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new ApiError("Unauthorized", 401);
    }

    // Get all drafts
    const { data: drafts, error: draftsError } = await supabase
      .from("segments_drafts")
      .select("*")
      .in("id", draftIds)
      .eq("project_id", projectId);

    if (draftsError || !drafts || drafts.length === 0) {
      throw new ApiError("Drafts not found", 404);
    }

    // Insert approved segments
    const approved = [];
    for (const draft of drafts) {
      const { data: segment, error: insertError } = await supabase
        .from("segments_initial")
        .insert({
          project_id: projectId,
          segment_index: draft.segment_index,
          name: draft.name,
          description: draft.description,
          sociodemographics: draft.sociodemographics,
        })
        .select()
        .single();

      if (insertError) {
        console.error("Failed to approve segment:", insertError);
        continue;
      }
      approved.push(segment);
    }

    const nextStep = getNextStep("segments_draft");
    await supabase
      .from("projects")
      .update({ current_step: nextStep })
      .eq("id", projectId);

    return NextResponse.json({ success: true, approved, next_step: nextStep });
  } catch (error) {
    return handleApiError(error);
  }
}
