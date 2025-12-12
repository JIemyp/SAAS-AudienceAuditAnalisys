// Approve Segment Details - Prompt 11
// Uses segments_final as the source (after review decisions applied)
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

    // Get segments_final (NOT segments_initial)
    const { data: finalSegments } = await supabase
      .from("segments_final")
      .select("*")
      .eq("project_id", projectId);

    const approved = [];
    const segments = [];

    for (const draft of drafts) {
      // 1. Find matching final segment and create combined segment in 'segments' table FIRST
      const segment = finalSegments?.find(s => s.id === draft.segment_id);
      if (!segment) {
        console.error(`[approve/segment-details] No matching segment_final for draft.segment_id: ${draft.segment_id}`);
        throw new ApiError(`Segment not found for draft`, 404);
      }

      // IMPORTANT: Use UPSERT to prevent duplicates when approve is run multiple times!
      // Use the SAME ID as segments_final to maintain consistency across tables
      const { data: combinedSegment, error: segError } = await supabase.from("segments").upsert({
        id: segment.id, // Use the same ID from segments_final!
        project_id: projectId,
        order_index: segment.segment_index,
        name: segment.name,
        description: segment.description,
        sociodemographics: segment.sociodemographics,
        needs: draft.needs,
        triggers: draft.triggers,
        core_values: draft.core_values,
      }, { onConflict: 'id' }).select().single();

      if (segError || !combinedSegment) {
        console.error(`[approve/segment-details] Failed to upsert segment:`, segError);
        throw new ApiError(`Failed to create segment: ${segError?.message}`, 500);
      }

      segments.push(combinedSegment);
      console.log(`[approve/segment-details] Upserted segment: ${combinedSegment.id}`);

      // 2. Save to segment_details - delete existing first, then insert
      // (No unique constraint on segment_id, so can't use upsert with onConflict)
      await supabase
        .from("segment_details")
        .delete()
        .eq("segment_id", combinedSegment.id);

      const { data: detail, error } = await supabase.from("segment_details").insert({
        project_id: projectId,
        segment_id: combinedSegment.id,
        // New behavior fields
        sociodemographics: draft.sociodemographics,
        psychographics: draft.psychographics,
        online_behavior: draft.online_behavior,
        buying_behavior: draft.buying_behavior,
        // Original fields
        needs: draft.needs,
        triggers: draft.triggers,
        core_values: draft.core_values,
        awareness_level: draft.awareness_level,
        awareness_reasoning: draft.awareness_reasoning,
        objections: draft.objections,
      }).select().single();

      if (error) {
        console.error(`[approve/segment-details] Failed to upsert detail:`, error);
        throw new ApiError(`Failed to approve segment details: ${error.message}`, 500);
      }

      approved.push(detail);
    }

    const nextStep = getNextStep("segment_details_approved");
    await supabase.from("projects").update({ current_step: nextStep }).eq("id", projectId);

    console.log(`[approve/segment-details] Approved ${approved.length} details, next step: ${nextStep}`);

    return NextResponse.json({
      success: true,
      approved,
      segments,
      next_step: nextStep
    });
  } catch (error) { return handleApiError(error); }
}
