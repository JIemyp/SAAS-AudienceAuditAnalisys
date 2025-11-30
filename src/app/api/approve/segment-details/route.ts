// Approve Segment Details - Prompt 11
// This endpoint also creates final segments in 'segments' table for deep analysis
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { handleApiError, ApiError, getNextStep } from "@/lib/api-utils";

export async function POST(request: NextRequest) {
  try {
    const { projectId, draftIds } = await request.json();
    if (!projectId || !draftIds) throw new ApiError("Project ID and Draft IDs required", 400);

    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new ApiError("Unauthorized", 401);

    const ids = Array.isArray(draftIds) ? draftIds : [draftIds];
    const { data: drafts } = await supabase.from("segment_details_drafts").select("*").in("id", ids);
    if (!drafts || drafts.length === 0) throw new ApiError("Drafts not found", 404);

    // Get initial segments to combine with details
    const { data: initialSegments } = await supabase
      .from("segments_initial")
      .select("*")
      .eq("project_id", projectId);

    const approved = [];
    const finalSegments = [];

    for (const draft of drafts) {
      // 1. Save to segment_details
      const { data: detail, error } = await supabase.from("segment_details").insert({
        project_id: projectId,
        segment_id: draft.segment_id,
        needs: draft.needs,
        triggers: draft.triggers,
        core_values: draft.core_values,
        awareness_level: draft.awareness_level,
        objections: draft.objections,
      }).select().single();

      if (!error) approved.push(detail);

      // 2. Find matching initial segment and create final segment
      const initialSegment = initialSegments?.find(s => s.id === draft.segment_id);
      if (initialSegment) {
        const { data: finalSegment, error: segError } = await supabase.from("segments").insert({
          project_id: projectId,
          order_index: initialSegment.segment_index,
          name: initialSegment.name,
          description: initialSegment.description,
          sociodemographics: initialSegment.sociodemographics,
          needs: draft.needs,
          triggers: draft.triggers,
          core_values: draft.core_values,
        }).select().single();

        if (!segError && finalSegment) {
          finalSegments.push(finalSegment);
          console.log(`[approve/segment-details] Created final segment: ${finalSegment.id} for initial: ${initialSegment.id}`);
        } else if (segError) {
          console.error(`[approve/segment-details] Failed to create final segment:`, segError);
        }
      }
    }

    const nextStep = getNextStep("segment_details_draft");
    await supabase.from("projects").update({ current_step: nextStep }).eq("id", projectId);

    return NextResponse.json({
      success: true,
      approved,
      segments: finalSegments,
      next_step: nextStep
    });
  } catch (error) { return handleApiError(error); }
}
