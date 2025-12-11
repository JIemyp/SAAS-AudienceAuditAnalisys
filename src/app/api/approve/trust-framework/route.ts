// =====================================================
// Approve Trust Framework - Per Segment
// =====================================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { handleApiError, ApiError } from "@/lib/api-utils";

export async function POST(request: NextRequest) {
  try {
    const { projectId, draftId, segmentId } = await request.json();

    if (!projectId || !draftId || !segmentId) {
      throw new ApiError("Project ID, Draft ID, and Segment ID are required", 400);
    }

    const supabase = await createServerClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new ApiError("Unauthorized", 401);
    }

    const { data: draft, error: draftError } = await supabase
      .from("trust_framework_drafts")
      .select("*")
      .eq("id", draftId)
      .eq("project_id", projectId)
      .eq("segment_id", segmentId)
      .single();

    if (draftError || !draft) {
      throw new ApiError("Draft not found", 404);
    }

    const { data: existingApproved } = await supabase
      .from("trust_framework")
      .select("id")
      .eq("project_id", projectId)
      .eq("segment_id", segmentId)
      .single();

    const approvedData = {
      project_id: projectId,
      segment_id: segmentId,
      baseline_trust: draft.baseline_trust,
      proof_hierarchy: draft.proof_hierarchy,
      trusted_authorities: draft.trusted_authorities,
      social_proof: draft.social_proof,
      transparency_needs: draft.transparency_needs,
      trust_killers: draft.trust_killers,
      credibility_markers: draft.credibility_markers,
      risk_reduction: draft.risk_reduction,
      trust_journey: draft.trust_journey,
      approved_at: new Date().toISOString(),
    };

    if (existingApproved) {
      const { data: approved, error: updateError } = await supabase
        .from("trust_framework")
        .update(approvedData)
        .eq("id", existingApproved.id)
        .select()
        .single();

      if (updateError) throw new ApiError("Failed to update approved record", 500);
      return NextResponse.json({ success: true, approved, segment_id: segmentId, updated: true });
    }

    const { data: approved, error: insertError } = await supabase
      .from("trust_framework")
      .insert(approvedData)
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      throw new ApiError("Failed to approve", 500);
    }

    return NextResponse.json({ success: true, approved, segment_id: segmentId });
  } catch (error) {
    return handleApiError(error);
  }
}
