// Approve Segments Review - Prompt 10
// Saves user decisions (Apply/Edit/Dismiss) along with the review
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireWriteAccess } from "@/lib/permissions";
import { handleApiError, ApiError, getNextStep } from "@/lib/api-utils";

export async function POST(request: NextRequest) {
  try {
    const { projectId, draftId, decisions } = await request.json();
    if (!projectId || !draftId) throw new ApiError("Project ID and Draft ID required", 400);

    const supabase = await createServerClient();
    const adminSupabase = createAdminClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new ApiError("Unauthorized", 401);

    // Check write access (owner or editor can approve)
    await requireWriteAccess(supabase, adminSupabase, projectId, user.id);

    const { data: draft } = await adminSupabase.from("segments_review_drafts").select("*").eq("id", draftId).single();
    if (!draft) throw new ApiError("Draft not found", 404);

    // Save decisions to draft as well for historical reference
    if (decisions && Object.keys(decisions).length > 0) {
      await adminSupabase
        .from("segments_review_drafts")
        .update({ decisions })
        .eq("id", draftId);
    }

    const { data: approved, error } = await adminSupabase.from("segments_review").insert({
      project_id: projectId,
      segment_overlaps: draft.segment_overlaps,
      too_broad: draft.too_broad,
      too_narrow: draft.too_narrow,
      missing_segments: draft.missing_segments,
      recommendations: draft.recommendations,
      decisions: decisions || {},
    }).select().single();

    if (error) {
      console.error("[segments-review approve] Insert error:", error);
      throw new ApiError("Failed to approve", 500);
    }

    const nextStep = getNextStep("segments_review_approved");
    await adminSupabase.from("projects").update({ current_step: nextStep }).eq("id", projectId);

    console.log(`[segments-review approve] Approved with ${Object.keys(decisions || {}).length} decisions`);
    return NextResponse.json({ success: true, approved, next_step: nextStep });
  } catch (error) { return handleApiError(error); }
}
