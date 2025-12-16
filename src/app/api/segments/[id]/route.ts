import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { handleApiError, ApiError } from "@/lib/api-utils";
import { requireProjectAccess, requireWriteAccess } from "@/lib/permissions";

// GET - Fetch segments for a project by project ID
// Supports ?source=final to get from segments_final table
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: projectId } = await params;
        const { searchParams } = new URL(request.url);
        const source = searchParams.get("source"); // "final" for segments_final table

        const supabase = await createServerClient();
        const adminSupabase = createAdminClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            throw new ApiError("Unauthorized", 401);
        }

        // Check project access (owner or member)
        await requireProjectAccess(supabase, adminSupabase, projectId, user.id);

        // Choose table based on source parameter
        const table = source === "final" ? "segments_final" : "segments";
        const orderColumn = source === "final" ? "segment_index" : "order_index";

        // Use admin to bypass RLS
        const { data: segments, error } = await adminSupabase
            .from(table)
            .select("*")
            .eq("project_id", projectId)
            .order(orderColumn, { ascending: true });

        if (error) {
            console.error(`Error fetching segments from ${table}:`, error);
            return NextResponse.json({ success: true, segments: [] });
        }

        return NextResponse.json({ success: true, segments: segments || [] });
    } catch (error) {
        return handleApiError(error);
    }
}

// PATCH - Update segment
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supabase = await createServerClient();
        const adminSupabase = createAdminClient();
        const body = await request.json();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            throw new ApiError("Unauthorized", 401);
        }

        // Get segment to find project_id
        const { data: segment } = await adminSupabase
            .from("segments")
            .select("project_id")
            .eq("id", id)
            .single();

        if (!segment) {
            throw new ApiError("Segment not found", 404);
        }

        // Check write access (owner or editor only)
        await requireWriteAccess(supabase, adminSupabase, segment.project_id, user.id);

        // Validate allowed fields
        const allowedFields = [
            "name",
            "description",
            "sociodemographics",
            "needs",
            "triggers",
            "core_values",
            "order_index",
        ];
        const updateData: Record<string, unknown> = {};

        for (const field of allowedFields) {
            if (body[field] !== undefined) {
                updateData[field] = body[field];
            }
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json(
                { error: "No valid fields to update" },
                { status: 400 }
            );
        }

        // Use admin to bypass RLS
        const { data, error } = await adminSupabase
            .from("segments")
            .update(updateData)
            .eq("id", id)
            .select()
            .single();

        if (error) {
            if (error.code === "PGRST116") {
                return NextResponse.json({ error: "Segment not found" }, { status: 404 });
            }
            throw error;
        }

        return NextResponse.json(data);
    } catch (error) {
        return handleApiError(error);
    }
}

// DELETE - Delete segment and its pains
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supabase = await createServerClient();
        const adminSupabase = createAdminClient();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            throw new ApiError("Unauthorized", 401);
        }

        // Get segment to find project_id
        const { data: segment } = await adminSupabase
            .from("segments")
            .select("project_id")
            .eq("id", id)
            .single();

        if (!segment) {
            throw new ApiError("Segment not found", 404);
        }

        // Check write access (owner or editor only)
        await requireWriteAccess(supabase, adminSupabase, segment.project_id, user.id);

        // First delete associated pains from pains_initial (use admin to bypass RLS)
        const { error: painsError } = await adminSupabase
            .from("pains_initial")
            .delete()
            .eq("segment_id", id);

        if (painsError) throw painsError;

        // Then delete the segment (use admin to bypass RLS)
        const { error } = await adminSupabase
            .from("segments")
            .delete()
            .eq("id", id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        return handleApiError(error);
    }
}
