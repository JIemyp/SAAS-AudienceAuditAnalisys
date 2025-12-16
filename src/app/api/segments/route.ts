// =====================================================
// Segments List API
// =====================================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { handleApiError, ApiError } from "@/lib/api-utils";
import { requireProjectAccess, Permission } from "@/lib/permissions";

// GET - Fetch all approved segments for a project with optional status info
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const stepType = searchParams.get("stepType"); // Optional: get status for specific step

    if (!projectId) {
      throw new ApiError("Project ID is required", 400);
    }

    const supabase = await createServerClient();
    const adminSupabase = createAdminClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new ApiError("Unauthorized", 401);
    }

    // Check project access (owner or member)
    await requireProjectAccess(supabase, adminSupabase, projectId, user.id);

    // Fetch approved segments from segments table (use admin to bypass RLS)
    const { data: segments, error } = await adminSupabase
      .from("segments")
      .select("*")
      .eq("project_id", projectId)
      .order("order_index", { ascending: true });

    if (error) {
      console.log("Segments fetch error:", error.message);
      return NextResponse.json({ success: true, segments: [], statuses: [] });
    }

    // If stepType provided, get status for each segment
    let statuses: { segmentId: string; hasData: boolean; isApproved: boolean }[] = [];

    if (stepType && segments && segments.length > 0) {
      const draftTable = `${stepType}_drafts`;
      const approvedTable = stepType === "pains" ? "pains_initial" : stepType;

      console.log(`[segments] Checking status for stepType: ${stepType}, draftTable: ${draftTable}, approvedTable: ${approvedTable}`);

      for (const seg of segments) {
        // Check drafts (use admin to bypass RLS)
        const { data: drafts, error: draftsError } = await adminSupabase
          .from(draftTable)
          .select("id")
          .eq("project_id", projectId)
          .eq("segment_id", seg.id)
          .limit(1);

        // Check approved (use admin to bypass RLS)
        const { data: approved, error: approvedError } = await adminSupabase
          .from(approvedTable)
          .select("id")
          .eq("project_id", projectId)
          .eq("segment_id", seg.id)
          .limit(1);

        console.log(`[segments] Segment ${seg.name}: drafts=${drafts?.length || 0} (err: ${draftsError?.message || 'none'}), approved=${approved?.length || 0} (err: ${approvedError?.message || 'none'})`);

        statuses.push({
          segmentId: seg.id,
          hasData: (drafts?.length || 0) > 0,
          isApproved: (approved?.length || 0) > 0,
        });
      }
    }

    return NextResponse.json({
      success: true,
      segments: segments || [],
      statuses,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
