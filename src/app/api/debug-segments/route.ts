// Debug endpoint to check segment data
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");

  if (!projectId) {
    return NextResponse.json({ error: "projectId required" }, { status: 400 });
  }

  const supabase = await createServerClient();

  // Get all relevant data
  const [
    { data: segments },
    { data: segmentsFinal },
    { data: segmentDetails },
    { data: jobs },
    { data: preferences },
    { data: difficulties },
    { data: triggers },
  ] = await Promise.all([
    supabase.from("segments").select("id, name, order_index").eq("project_id", projectId),
    supabase.from("segments_final").select("id, name, segment_index").eq("project_id", projectId),
    supabase.from("segment_details").select("id, segment_id").eq("project_id", projectId),
    supabase.from("jobs").select("id, segment_id").eq("project_id", projectId),
    supabase.from("preferences").select("id, segment_id").eq("project_id", projectId),
    supabase.from("difficulties").select("id, segment_id").eq("project_id", projectId),
    supabase.from("triggers").select("id, segment_id").eq("project_id", projectId),
  ]);

  // Check which segment IDs exist
  const segmentIds = new Set(segments?.map(s => s.id) || []);
  const segmentFinalIds = new Set(segmentsFinal?.map(s => s.id) || []);

  // Check if segment_details segment_ids match segments table
  const detailsWithWrongIds = segmentDetails?.filter(d => !segmentIds.has(d.segment_id)) || [];
  const jobsWithWrongIds = jobs?.filter(j => !segmentIds.has(j.segment_id)) || [];

  return NextResponse.json({
    segments: segments?.map(s => ({ id: s.id, name: s.name })),
    segments_final: segmentsFinal?.map(s => ({ id: s.id, name: s.name })),
    segment_details: segmentDetails,
    segment_details_with_wrong_ids: detailsWithWrongIds,
    jobs,
    jobs_with_wrong_ids: jobsWithWrongIds,
    preferences,
    difficulties,
    triggers,
    summary: {
      segments_count: segments?.length || 0,
      segment_details_count: segmentDetails?.length || 0,
      details_with_wrong_segment_id: detailsWithWrongIds.length,
      jobs_count: jobs?.length || 0,
      jobs_with_wrong_segment_id: jobsWithWrongIds.length,
    }
  });
}
