// Approve Segments Final
// Approves all segment drafts and moves to next step
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { handleApiError, ApiError, getNextStep } from "@/lib/api-utils";

export async function POST(request: NextRequest) {
  try {
    const { projectId } = await request.json();

    if (!projectId) {
      throw new ApiError("Project ID is required", 400);
    }

    const supabase = await createServerClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new ApiError("Unauthorized", 401);
    }

    // Get all drafts for this project
    const { data: drafts, error: draftsError } = await supabase
      .from("segments_final_drafts")
      .select("*")
      .eq("project_id", projectId)
      .order("segment_index");

    if (draftsError || !drafts || drafts.length === 0) {
      throw new ApiError("No drafts found to approve", 400);
    }

    // Delete previous approved segments for this project
    await supabase.from("segments_final").delete().eq("project_id", projectId);

    // Insert approved segments
    const approved = [];
    for (const draft of drafts) {
      const { data: approvedSegment, error: insertError } = await supabase
        .from("segments_final")
        .insert({
          project_id: projectId,
          segment_index: draft.segment_index,
          name: draft.name,
          description: draft.description,
          sociodemographics: draft.sociodemographics,
          changes_applied: draft.changes_applied || [],
          is_new: draft.is_new || false,
        })
        .select()
        .single();

      if (insertError) {
        console.error("[segments-final approve] Insert error:", insertError);
        throw new ApiError(`Failed to approve segment: ${insertError.message}`, 500);
      }

      approved.push(approvedSegment);
    }

    // Update project step
    const nextStep = getNextStep("segments_final_approved");
    await supabase.from("projects").update({ current_step: nextStep }).eq("id", projectId);

    console.log(`[segments-final approve] Approved ${approved.length} segments, next step: ${nextStep}`);

    return NextResponse.json({
      success: true,
      approved,
      count: approved.length,
      next_step: nextStep,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
