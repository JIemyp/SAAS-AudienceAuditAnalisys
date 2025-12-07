// Debug endpoint to check pains data
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { handleApiError, ApiError } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) throw new ApiError("Project ID is required", 400);

    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new ApiError("Unauthorized", 401);

    // Get segments
    const { data: segments } = await supabase
      .from("segments")
      .select("id, order_index, name")
      .eq("project_id", projectId)
      .order("order_index");

    // Get pains_initial
    const { data: painsInitial } = await supabase
      .from("pains_initial")
      .select("id, segment_id, pain_index, name")
      .eq("project_id", projectId)
      .order("pain_index");

    // Get pains_drafts
    const { data: painsDrafts } = await supabase
      .from("pains_drafts")
      .select("id, segment_id, pain_index, name")
      .eq("project_id", projectId)
      .order("pain_index");

    return NextResponse.json({
      success: true,
      segments: segments || [],
      pains_initial: painsInitial || [],
      pains_drafts: painsDrafts || [],
      analysis: {
        segmentIds: segments?.map(s => s.id) || [],
        painsInitialSegmentIds: [...new Set(painsInitial?.map(p => p.segment_id) || [])],
        painsDraftsSegmentIds: [...new Set(painsDrafts?.map(p => p.segment_id) || [])],
        painsInitialCount: painsInitial?.length || 0,
        painsDraftsCount: painsDrafts?.length || 0,
      }
    });
  } catch (error) {
    return handleApiError(error);
  }
}
