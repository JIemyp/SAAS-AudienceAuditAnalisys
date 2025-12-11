// Debug: Compare segments vs segments_final for matching
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { handleApiError, ApiError } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      throw new ApiError("Project ID is required", 400);
    }

    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new ApiError("Unauthorized", 401);
    }

    // Get all segments
    const { data: segments } = await supabase
      .from("segments")
      .select("id, name, order_index")
      .eq("project_id", projectId)
      .order("order_index");

    // Get all segments_final
    const { data: segmentsFinal } = await supabase
      .from("segments_final")
      .select("id, name, segment_index")
      .eq("project_id", projectId)
      .order("segment_index");

    // Normalize function
    const normalizeName = (name: string) => name.toLowerCase().replace(/\s+/g, ' ').trim();

    // Build final name set
    const finalIdSet = new Set((segmentsFinal || []).map(s => s.id));
    const finalNameSet = new Set((segmentsFinal || []).map(s => normalizeName(s.name)));

    // Match results
    const matchResults = (segments || []).map(seg => {
      const normalizedName = normalizeName(seg.name);
      const matchById = finalIdSet.has(seg.id);
      const matchByName = finalNameSet.has(normalizedName);

      return {
        id: seg.id,
        name: seg.name,
        normalizedName,
        order_index: seg.order_index,
        matchById,
        matchByName,
        matched: matchById || matchByName,
      };
    });

    // Unmatched from segments_final
    const segmentsNameSet = new Set((segments || []).map(s => normalizeName(s.name)));
    const unmatchedFinal = (segmentsFinal || []).filter(sf => {
      const normalizedName = normalizeName(sf.name);
      // Check if any segment matches by ID or name
      const hasIdMatch = (segments || []).some(s => s.id === sf.id);
      const hasNameMatch = segmentsNameSet.has(normalizedName);
      return !hasIdMatch && !hasNameMatch;
    }).map(sf => ({
      id: sf.id,
      name: sf.name,
      normalizedName: normalizeName(sf.name),
      segment_index: sf.segment_index,
    }));

    return NextResponse.json({
      success: true,
      segments: {
        total: segments?.length || 0,
        data: segments,
      },
      segmentsFinal: {
        total: segmentsFinal?.length || 0,
        data: segmentsFinal,
      },
      matchResults,
      matchedCount: matchResults.filter(r => r.matched).length,
      unmatchedFromSegments: matchResults.filter(r => !r.matched),
      unmatchedFromFinal: unmatchedFinal,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
