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

        // First get the project
        const { data: project, error } = await supabase
            .from("projects")
            .select("id, name, status, current_step, onboarding_data, created_at, updated_at, user_id")
            .eq("id", id)
            .single();

        if (error) {
            if (error.code === "PGRST116") {
                throw new ApiError("Project not found", 404);
            }
            throw error;
        }

        // Check if user is owner
        const isOwner = project.user_id === user.id;

        // If not owner, check if user is a member
        if (!isOwner) {
            const { data: membership } = await supabase
                .from("project_members")
                .select("id")
                .eq("project_id", id)
                .eq("user_id", user.id)
                .maybeSingle();

            if (!membership) {
                throw new ApiError("Project not found", 404);
            }
        }

        // Remove user_id from response for security
        const { user_id: _, ...projectWithoutUserId } = project;
        return NextResponse.json(projectWithoutUserId);
    } catch (error) {
        return handleApiError(error);
    }
}
