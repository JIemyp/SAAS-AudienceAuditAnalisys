import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET - Fetch segment by ID
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supabase = await createClient();

        const { data, error } = await supabase
            .from("audience_segments")
            .select("*")
            .eq("id", id)
            .single();

        if (error) {
            if (error.code === "PGRST116") {
                return NextResponse.json({ error: "Segment not found" }, { status: 404 });
            }
            throw error;
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error("Error fetching segment:", error);
        return NextResponse.json(
            { error: "Failed to fetch segment" },
            { status: 500 }
        );
    }
}

// PATCH - Update segment
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supabase = await createClient();
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
            .from("audience_segments")
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
        const supabase = await createClient();

        // First delete associated pains
        const { error: painsError } = await supabase
            .from("pains")
            .delete()
            .eq("segment_id", id);

        if (painsError) throw painsError;

        // Then delete the segment
        const { error } = await supabase
            .from("audience_segments")
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
