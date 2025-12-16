import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { handleApiError, ApiError } from "@/lib/api-utils";
import { requireProjectAccess, requireWriteAccess } from "@/lib/permissions";

// GET - Fetch pain by ID
export async function GET(
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

        // Get pain to find project_id (use admin to bypass RLS)
        const { data, error } = await adminSupabase
            .from("pains_initial")
            .select("*")
            .eq("id", id)
            .single();

        if (error) {
            if (error.code === "PGRST116") {
                throw new ApiError("Pain not found", 404);
            }
            throw error;
        }

        // Check project access (owner or member)
        await requireProjectAccess(supabase, adminSupabase, data.project_id, user.id);

        return NextResponse.json(data);
    } catch (error) {
        return handleApiError(error);
    }
}

// PATCH - Update pain
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

        // Get pain to find project_id (use admin to bypass RLS)
        const { data: pain } = await adminSupabase
            .from("pains_initial")
            .select("project_id")
            .eq("id", id)
            .single();

        if (!pain) {
            throw new ApiError("Pain not found", 404);
        }

        // Check write access (owner or editor only)
        await requireWriteAccess(supabase, adminSupabase, pain.project_id, user.id);

        // Validate allowed fields
        const allowedFields = [
            "name",
            "description",
            "deep_triggers",
            "examples",
            "extended_analysis",
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
            .from("pains_initial")
            .update(updateData)
            .eq("id", id)
            .select()
            .single();

        if (error) {
            if (error.code === "PGRST116") {
                throw new ApiError("Pain not found", 404);
            }
            throw error;
        }

        return NextResponse.json(data);
    } catch (error) {
        return handleApiError(error);
    }
}

// DELETE - Delete pain
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

        // Get pain to find project_id (use admin to bypass RLS)
        const { data: pain } = await adminSupabase
            .from("pains_initial")
            .select("project_id")
            .eq("id", id)
            .single();

        if (!pain) {
            throw new ApiError("Pain not found", 404);
        }

        // Check write access (owner or editor only)
        await requireWriteAccess(supabase, adminSupabase, pain.project_id, user.id);

        // Use admin to bypass RLS
        const { error } = await adminSupabase
            .from("pains_initial")
            .delete()
            .eq("id", id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        return handleApiError(error);
    }
}
