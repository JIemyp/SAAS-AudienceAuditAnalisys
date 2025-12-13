import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { handleApiError, ApiError } from "@/lib/api-utils";

// GET - Fetch project by ID
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supabase = await createServerClient();

        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            throw new ApiError("Unauthorized", 401);
        }

        const { data: project, error } = await supabase
            .from("projects")
            .select("id, name, description, status, current_step, product_name, product_url, product_description, target_audience, created_at, updated_at")
            .eq("id", id)
            .single();

        if (error) {
            if (error.code === "PGRST116") {
                throw new ApiError("Project not found", 404);
            }
            throw error;
        }

        return NextResponse.json(project);
    } catch (error) {
        return handleApiError(error);
    }
}
