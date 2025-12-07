// Approve Pains - Prompt 12 (Per Segment)
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { handleApiError, ApiError } from "@/lib/api-utils";

export async function POST(request: NextRequest) {
  try {
    const { projectId, draftIds, segmentId } = await request.json();

    console.log(`[approve-pains] Starting approval for project ${projectId}, segment ${segmentId}, draftIds:`, draftIds);

    if (!projectId || !draftIds) throw new ApiError("Project ID and Draft IDs required", 400);
    if (!segmentId) throw new ApiError("Segment ID is required", 400);

    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new ApiError("Unauthorized", 401);

    const ids = Array.isArray(draftIds) ? draftIds : [draftIds];
    console.log(`[approve-pains] Fetching ${ids.length} drafts from pains_drafts`);

    const { data: drafts, error: draftsError } = await supabase
      .from("pains_drafts")
      .select("*")
      .in("id", ids)
      .eq("segment_id", segmentId);

    console.log(`[approve-pains] Found ${drafts?.length || 0} drafts, error:`, draftsError?.message || 'none');

    if (!drafts || drafts.length === 0) throw new ApiError("Drafts not found", 404);

    const approved = [];
    const errors = [];

    // Clear existing pains for this segment first to avoid duplicates
    console.log(`[approve-pains] Deleting existing pains for segment ${segmentId}`);
    const { error: deleteError } = await supabase
      .from("pains_initial")
      .delete()
      .eq("project_id", projectId)
      .eq("segment_id", segmentId);

    if (deleteError) {
      console.error(`[approve-pains] Error deleting existing pains:`, deleteError.message);
    }

    // Insert all pains in a single batch operation
    const painsToInsert = drafts.map(draft => ({
      project_id: projectId,
      segment_id: segmentId,
      pain_index: draft.pain_index,
      name: draft.name,
      description: draft.description,
      deep_triggers: draft.deep_triggers,
      examples: draft.examples,
    }));

    console.log(`[approve-pains] Inserting ${painsToInsert.length} pains in batch:`, painsToInsert.map(p => p.name));

    const { data: insertedPains, error: insertError } = await supabase
      .from("pains_initial")
      .insert(painsToInsert)
      .select();

    if (insertError) {
      console.error(`[approve-pains] Batch insert error:`, insertError.message);
      errors.push({ pain: "batch", error: insertError.message });
    } else {
      console.log(`[approve-pains] Successfully inserted ${insertedPains?.length || 0} pains`);
      if (insertedPains) {
        approved.push(...insertedPains);
      }
    }

    console.log(`[approve-pains] Completed: ${approved.length} approved, ${errors.length} errors`);

    if (approved.length === 0 && errors.length > 0) {
      throw new ApiError(`Failed to approve pains: ${errors.map(e => e.error).join(", ")}`, 500);
    }

    return NextResponse.json({ success: true, approved, segment_id: segmentId, errors });
  } catch (error) {
    return handleApiError(error);
  }
}
