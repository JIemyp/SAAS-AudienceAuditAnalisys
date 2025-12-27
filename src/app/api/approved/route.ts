// =====================================================
// Approved Data API - Read approved/final data
// =====================================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { handleApiError, ApiError } from "@/lib/api-utils";
import { requireProjectAccess } from "@/lib/permissions";

// Valid approved tables
const VALID_TABLES = [
  // Core tables
  "validation",
  "portrait",
  "portrait_review",
  "portrait_final",
  "segments_initial",
  "segments_review",
  "segments_final",
  "segment_details",
  // Per-segment analysis
  "jobs",
  "preferences",
  "difficulties",
  "triggers",
  "pains_initial",
  "pains_ranking",
  "canvas",
  "canvas_extended",
  // V5 Strategic Modules
  "channel_strategy",
  "competitive_intelligence",
  "pricing_psychology",
  "trust_framework",
  "jtbd_context",
  // V6 Strategy & UGC Modules
  "strategy_summary",
  "strategy_personalized",
  "strategy_global",
  "strategy_ads",
  "ugc_creator_profiles",
  "communications_funnel",
  // V7 Insights Modules
  "insights_executive",
  "insights_snapshots",
  "insights_radar",
  // V7 Playbooks Modules
  "playbooks_canvas",
  "playbooks_funnel",
];

// GET - Fetch approved data for a project
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const table = searchParams.get("table");
    const segmentId = searchParams.get("segmentId");
    const painId = searchParams.get("painId");

    if (!projectId) throw new ApiError("Project ID is required", 400);
    if (!table || !VALID_TABLES.includes(table)) {
      throw new ApiError(`Invalid table name: ${table}`, 400);
    }

    const supabase = await createServerClient();
    const adminSupabase = createAdminClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new ApiError("Unauthorized", 401);

    // Check project access (owner or member)
    await requireProjectAccess(supabase, adminSupabase, projectId, user.id);

    // Build query (use admin to bypass RLS)
    let query = adminSupabase
      .from(table)
      .select("*")
      .eq("project_id", projectId);

    // Filter by segment_id if provided
    if (segmentId) {
      query = query.eq("segment_id", segmentId);
    }

    // Filter by pain_id if provided (for canvas_extended)
    if (painId) {
      query = query.eq("pain_id", painId);
    }

    // Order by created_at or approved_at
    query = query.order("approved_at", { ascending: false, nullsFirst: false });

    const { data, error } = await query;

    if (error) {
      console.log(`Approved table ${table} error:`, error.message);
      return NextResponse.json({ success: true, data: [] });
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error) {
    return handleApiError(error);
  }
}
