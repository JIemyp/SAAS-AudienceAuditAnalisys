import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { handleApiError, ApiError } from "@/lib/api-utils";

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
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            throw new ApiError("Unauthorized", 401);
        }

        // Choose table based on source parameter
        const table = source === "final" ? "segments_final" : "segments";
        const orderColumn = source === "final" ? "segment_index" : "order_index";

        const { data: segments, error } = await supabase
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
        const body = await request.json();

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

        const { data, error } = await supabase
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
        console.error("Error updating segment:", error);
        return NextResponse.json(
            { error: "Failed to update segment" },
            { status: 500 }
        );
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

        // First delete associated pains
        const { error: painsError } = await supabase
            .from("pains")
            .delete()
            .eq("segment_id", id);

        if (painsError) throw painsError;

        // Then delete the segment
        const { error } = await supabase
            .from("segments")
            .delete()
            .eq("id", id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting segment:", error);
        return NextResponse.json(
            { error: "Failed to delete segment" },
            { status: 500 }
        );
    }
}
