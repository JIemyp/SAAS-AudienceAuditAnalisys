// =====================================================
// UGC Creator Tracking - CRUD API
// Manual tracking of real UGC creators per segment
// =====================================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireProjectAccess, requireUGCAccess } from "@/lib/permissions";
import { handleApiError, ApiError } from "@/lib/api-utils";

// GET - List all tracking records for a project/segment
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const segmentId = searchParams.get("segmentId");
    const status = searchParams.get("status");

    if (!projectId) {
      throw new ApiError("Project ID is required", 400);
    }

    const supabase = await createServerClient();
    const adminSupabase = createAdminClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new ApiError("Unauthorized", 401);
    }

    await requireProjectAccess(supabase, adminSupabase, projectId, user.id);

    let query = adminSupabase
      .from("ugc_creator_tracking")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    if (segmentId) {
      query = query.eq("segment_id", segmentId);
    }

    if (status) {
      query = query.eq("status", status);
    }

    const { data: tracking, error: trackingError } = await query;

    if (trackingError) {
      throw new ApiError("Failed to fetch tracking records", 500);
    }

    return NextResponse.json({ success: true, tracking });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST - Create new tracking record
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      projectId,
      segmentId,
      profileId,
      creatorName,
      creatorHandle,
      platform,
      contactInfo,
      status = "prospect",
      notes,
    } = body;

    if (!projectId) throw new ApiError("Project ID is required", 400);
    if (!segmentId) throw new ApiError("Segment ID is required", 400);
    if (!creatorName) throw new ApiError("Creator name is required", 400);
    if (!platform) throw new ApiError("Platform is required", 400);

    const supabase = await createServerClient();
    const adminSupabase = createAdminClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new ApiError("Unauthorized", 401);
    }

    await requireUGCAccess(supabase, adminSupabase, projectId, user.id);

    // Verify segment exists
    const { data: segment, error: segmentError } = await adminSupabase
      .from("segments")
      .select("id")
      .eq("id", segmentId)
      .eq("project_id", projectId)
      .single();

    if (segmentError || !segment) {
      throw new ApiError("Segment not found", 404);
    }

    // Verify profile exists if provided
    if (profileId) {
      const { data: profile, error: profileError } = await adminSupabase
        .from("ugc_creator_profiles")
        .select("id")
        .eq("id", profileId)
        .eq("project_id", projectId)
        .eq("segment_id", segmentId)
        .single();

      if (profileError || !profile) {
        throw new ApiError("UGC Creator Profile not found", 404);
      }
    }

    const { data: tracking, error: insertError } = await adminSupabase
      .from("ugc_creator_tracking")
      .insert({
        project_id: projectId,
        segment_id: segmentId,
        profile_id: profileId || null,
        creator_name: creatorName,
        creator_handle: creatorHandle || null,
        platform,
        contact_info: contactInfo || null,
        status,
        notes: notes || null,
        videos_ordered: 0,
        videos_delivered: 0,
        videos_published: 0,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      throw new ApiError("Failed to create tracking record", 500);
    }

    return NextResponse.json({ success: true, tracking });
  } catch (error) {
    return handleApiError(error);
  }
}

// PATCH - Update tracking record
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, projectId, ...updates } = body;

    if (!id) throw new ApiError("Tracking ID is required", 400);
    if (!projectId) throw new ApiError("Project ID is required", 400);

    const supabase = await createServerClient();
    const adminSupabase = createAdminClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new ApiError("Unauthorized", 401);
    }

    await requireUGCAccess(supabase, adminSupabase, projectId, user.id);

    // Build update object with allowed fields only
    const allowedFields = [
      "creator_name",
      "creator_handle",
      "platform",
      "contact_info",
      "status",
      "videos_ordered",
      "videos_delivered",
      "videos_published",
      "notes",
      "profile_id",
    ];

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    for (const field of allowedFields) {
      // Convert camelCase to snake_case for API
      const camelField = field.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      if (updates[camelField] !== undefined) {
        updateData[field] = updates[camelField];
      } else if (updates[field] !== undefined) {
        updateData[field] = updates[field];
      }
    }

    const { data: tracking, error: updateError } = await adminSupabase
      .from("ugc_creator_tracking")
      .update(updateData)
      .eq("id", id)
      .eq("project_id", projectId)
      .select()
      .single();

    if (updateError) {
      console.error("Update error:", updateError);
      throw new ApiError("Failed to update tracking record", 500);
    }

    if (!tracking) {
      throw new ApiError("Tracking record not found", 404);
    }

    return NextResponse.json({ success: true, tracking });
  } catch (error) {
    return handleApiError(error);
  }
}

// DELETE - Remove tracking record
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const projectId = searchParams.get("projectId");

    if (!id) throw new ApiError("Tracking ID is required", 400);
    if (!projectId) throw new ApiError("Project ID is required", 400);

    const supabase = await createServerClient();
    const adminSupabase = createAdminClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new ApiError("Unauthorized", 401);
    }

    await requireUGCAccess(supabase, adminSupabase, projectId, user.id);

    const { error: deleteError } = await adminSupabase
      .from("ugc_creator_tracking")
      .delete()
      .eq("id", id)
      .eq("project_id", projectId);

    if (deleteError) {
      console.error("Delete error:", deleteError);
      throw new ApiError("Failed to delete tracking record", 500);
    }

    return NextResponse.json({ success: true, deleted: id });
  } catch (error) {
    return handleApiError(error);
  }
}
