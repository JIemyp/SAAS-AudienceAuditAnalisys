// =====================================================
// Drafts CRUD API
// =====================================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { handleApiError, ApiError } from "@/lib/api-utils";
import { requireProjectAccess, requireWriteAccess } from "@/lib/permissions";

const VALID_TABLES = [
  "validation_drafts",
  "portrait_drafts",
  "portrait_review_drafts",
  "portrait_final_drafts",
  "jobs_drafts",
  "preferences_drafts",
  "difficulties_drafts",
  "triggers_drafts",
  "segments_drafts",
  "segments_review_drafts",
  "segments_final_drafts",
  "segment_details_drafts",
  "pains_drafts",
  "pains_ranking_drafts",
  "canvas_drafts",
  "canvas_extended_drafts",
  // V5 Strategic Modules
  "channel_strategy_drafts",
  "competitive_intelligence_drafts",
  "pricing_psychology_drafts",
  "trust_framework_drafts",
  "jtbd_context_drafts",
  // V6 Strategy & UGC Modules
  "strategy_summary_drafts",
  "strategy_personalized_drafts",
  "strategy_global_drafts",
  "strategy_ads_drafts",
  "ugc_creator_profiles_drafts",
  "communications_funnel_drafts",
];

// Approved tables corresponding to draft tables
const APPROVED_TABLES: Record<string, string> = {
  jobs_drafts: "jobs",
  preferences_drafts: "preferences",
  difficulties_drafts: "difficulties",
  triggers_drafts: "triggers",
  pains_drafts: "pains_initial",
  canvas_drafts: "canvas",
  canvas_extended_drafts: "canvas_extended",
  // Non-segment tables
  validation_drafts: "validation",
  portrait_drafts: "portrait",
  portrait_review_drafts: "portrait_review",
  portrait_final_drafts: "portrait_final",
  segments_drafts: "segments_initial",
  segments_review_drafts: "segments_review",
  segments_final_drafts: "segments_final",
  segment_details_drafts: "segment_details",
  pains_ranking_drafts: "pains_ranking",
  // V5 Strategic Modules
  channel_strategy_drafts: "channel_strategy",
  competitive_intelligence_drafts: "competitive_intelligence",
  pricing_psychology_drafts: "pricing_psychology",
  trust_framework_drafts: "trust_framework",
  jtbd_context_drafts: "jtbd_context",
  // V6 Strategy & UGC Modules
  strategy_summary_drafts: "strategy_summary",
  strategy_personalized_drafts: "strategy_personalized",
  strategy_global_drafts: "strategy_global",
  strategy_ads_drafts: "strategy_ads",
  ugc_creator_profiles_drafts: "ugc_creator_profiles",
  communications_funnel_drafts: "communications_funnel",
};

// GET - Fetch drafts for a project
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const table = searchParams.get("table");
    const segmentId = searchParams.get("segmentId");
    const painId = searchParams.get("painId");
    const checkApproved = searchParams.get("checkApproved") === "true";

    if (!projectId) throw new ApiError("Project ID is required", 400);
    if (!table || !VALID_TABLES.includes(table)) throw new ApiError("Invalid table name", 400);

    const supabase = await createServerClient();
    const adminSupabase = createAdminClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new ApiError("Unauthorized", 401);

    // Check project access (owner or member)
    await requireProjectAccess(supabase, adminSupabase, projectId, user.id);

    // If checkApproved is true, check the approved table instead
    if (checkApproved) {
      const approvedTable = APPROVED_TABLES[table] || table.replace("_drafts", "");
      let query = adminSupabase
        .from(approvedTable)
        .select("id")
        .eq("project_id", projectId);

      if (segmentId) {
        query = query.eq("segment_id", segmentId);
      }

      if (painId) {
        query = query.eq("pain_id", painId);
      }

      const { data: approvedData, error: approvedError } = await query.limit(1);

      if (approvedError) {
        return NextResponse.json({ success: true, hasApproved: false });
      }

      return NextResponse.json({
        success: true,
        hasApproved: approvedData && approvedData.length > 0,
      });
    }

    // Standard draft fetch (use admin to bypass RLS)
    let query = adminSupabase
      .from(table)
      .select("*")
      .eq("project_id", projectId);

    // Filter by segment_id if provided
    if (segmentId) {
      query = query.eq("segment_id", segmentId);
    }

    // Filter by pain_id if provided (for canvas_extended V2)
    if (painId) {
      query = query.eq("pain_id", painId);
    }

    query = query.order("created_at", { ascending: false });

    const { data: drafts, error } = await query;

    // Handle case where table doesn't exist yet
    if (error) {
      console.log(`Drafts table ${table} error:`, error.message);
      // Return empty array if table doesn't exist
      return NextResponse.json({ success: true, drafts: [] });
    }

    return NextResponse.json({ success: true, drafts: drafts || [] });
  } catch (error) {
    return handleApiError(error);
  }
}

// PATCH - Update a draft
export async function PATCH(request: NextRequest) {
  try {
    const { table, id, updates, projectId } = await request.json();

    if (!table || !VALID_TABLES.includes(table)) throw new ApiError("Invalid table name", 400);
    if (!id) throw new ApiError("Draft ID is required", 400);
    if (!updates || typeof updates !== "object") throw new ApiError("Updates are required", 400);

    const supabase = await createServerClient();
    const adminSupabase = createAdminClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new ApiError("Unauthorized", 401);

    // Get draft to find project_id if not provided
    let targetProjectId = projectId;
    if (!targetProjectId) {
      const { data: draft } = await adminSupabase
        .from(table)
        .select("project_id")
        .eq("id", id)
        .single();
      targetProjectId = draft?.project_id;
    }

    if (!targetProjectId) throw new ApiError("Project ID not found", 400);

    // Check write access (owner or editor only)
    await requireWriteAccess(supabase, adminSupabase, targetProjectId, user.id);

    // Remove protected fields
    const { id: _id, project_id: _projectId, created_at, ...safeUpdates } = updates;

    // Increment version
    safeUpdates.version = (updates.version || 1) + 1;

    const { data: draft, error } = await adminSupabase
      .from(table)
      .update(safeUpdates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new ApiError("Failed to update draft", 500);

    return NextResponse.json({ success: true, draft });
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE - Delete a draft
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const table = searchParams.get("table");
    const id = searchParams.get("id");

    if (!table || !VALID_TABLES.includes(table)) throw new ApiError("Invalid table name", 400);
    if (!id) throw new ApiError("Draft ID is required", 400);

    const supabase = await createServerClient();
    const adminSupabase = createAdminClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new ApiError("Unauthorized", 401);

    // Get draft to find project_id
    const { data: draft } = await adminSupabase
      .from(table)
      .select("project_id")
      .eq("id", id)
      .single();

    if (!draft) throw new ApiError("Draft not found", 404);

    // Check write access (owner or editor only)
    await requireWriteAccess(supabase, adminSupabase, draft.project_id, user.id);

    const { error } = await adminSupabase
      .from(table)
      .delete()
      .eq("id", id);

    if (error) throw new ApiError("Failed to delete draft", 500);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST - Add custom draft
export async function POST(request: NextRequest) {
  try {
    const { table, projectId, data } = await request.json();

    if (!table || !VALID_TABLES.includes(table)) throw new ApiError("Invalid table name", 400);
    if (!projectId) throw new ApiError("Project ID is required", 400);
    if (!data || typeof data !== "object") throw new ApiError("Data is required", 400);

    const supabase = await createServerClient();
    const adminSupabase = createAdminClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new ApiError("Unauthorized", 401);

    // Check write access (owner or editor only)
    await requireWriteAccess(supabase, adminSupabase, projectId, user.id);

    const { data: draft, error } = await adminSupabase
      .from(table)
      .insert({
        ...data,
        project_id: projectId,
        version: 1,
      })
      .select()
      .single();

    if (error) throw new ApiError("Failed to create draft", 500);

    return NextResponse.json({ success: true, draft });
  } catch (error) {
    return handleApiError(error);
  }
}
