import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
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

        // Check if user is a member of this project
        const { data: membership } = await supabase
            .from("project_members")
            .select("id")
            .eq("project_id", id)
            .eq("user_id", user.id)
            .maybeSingle();

        // Use admin client to bypass RLS and fetch project
        const adminSupabase = createAdminClient();
        const { data: project, error } = await adminSupabase
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

        // Check if user is owner or member
        const isOwner = project.user_id === user.id;
        const isMember = !!membership;

        if (!isOwner && !isMember) {
            throw new ApiError("Project not found", 404);
        }

        // Remove user_id from response
        const { user_id, ...projectData } = project;

        return NextResponse.json(projectData);
    } catch (error) {
        return handleApiError(error);
    }
}
