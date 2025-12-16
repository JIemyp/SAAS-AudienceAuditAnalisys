// =====================================================
// Approve Segments - Prompt 9
// Approves all segments of a specific version (or by draftIds)
// Minimum 3 segments required for approval
// =====================================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireWriteAccess } from "@/lib/permissions";
import { handleApiError, ApiError, getNextStep } from "@/lib/api-utils";

const MIN_SEGMENTS_FOR_APPROVE = 3;

export async function POST(request: NextRequest) {
  try {
    const { projectId, draftIds, version } = await request.json();

    if (!projectId) {
      throw new ApiError("Project ID is required", 400);
    }

    // Either draftIds or version must be provided
    if (!draftIds && !version) {
      throw new ApiError("Either Draft IDs or version number is required", 400);
    }

    const supabase = await createServerClient();
    const adminSupabase = createAdminClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new ApiError("Unauthorized", 401);
    }

    // Check write access (owner or editor can approve)
    await requireWriteAccess(supabase, adminSupabase, projectId, user.id);

    // Get drafts - either by IDs or by version
    let drafts;
    if (draftIds && Array.isArray(draftIds)) {
      const { data, error } = await adminSupabase
        .from("segments_drafts")
        .select("*")
        .in("id", draftIds)
        .eq("project_id", projectId)
        .order("segment_index", { ascending: true });

      if (error) throw new ApiError("Failed to fetch drafts", 500);
      drafts = data;
    } else if (version) {
      const { data, error } = await adminSupabase
        .from("segments_drafts")
        .select("*")
        .eq("project_id", projectId)
        .eq("version", version)
        .order("segment_index", { ascending: true });

      if (error) throw new ApiError("Failed to fetch drafts", 500);
      drafts = data;
    }

    if (!drafts || drafts.length === 0) {
      throw new ApiError("Drafts not found", 404);
    }

    // Validate minimum segments
    if (drafts.length < MIN_SEGMENTS_FOR_APPROVE) {
      throw new ApiError(
        `Minimum ${MIN_SEGMENTS_FOR_APPROVE} segments required for approval. Found: ${drafts.length}`,
        400
      );
    }

    console.log(`[approve/segments] Approving ${drafts.length} segments`);

    // Delete existing approved segments for this project (fresh start)
    await adminSupabase
      .from("segments_initial")
      .delete()
      .eq("project_id", projectId);

    // Insert approved segments
    const approved = [];
    for (const draft of drafts) {
      const { data: segment, error: insertError } = await adminSupabase
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

    console.log(`[approve/segments] Approved ${approved.length} segments`);

    const nextStep = getNextStep("segments_draft");
    await adminSupabase
      .from("projects")
      .update({ current_step: nextStep })
      .eq("id", projectId);

    return NextResponse.json({
      success: true,
      approved,
      count: approved.length,
      next_step: nextStep
    });
  } catch (error) {
    return handleApiError(error);
  }
}
