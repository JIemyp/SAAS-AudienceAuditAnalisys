import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { handleApiError, ApiError } from "@/lib/api-utils";
import { requireProjectAccess, requireWriteAccess } from "@/lib/permissions";
import { PAGE_KEYS } from "@/lib/page-access";

// GET - Fetch project page access + current member overrides
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const supabase = await createServerClient();
    const adminSupabase = createAdminClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new ApiError("Unauthorized", 401);

    await requireProjectAccess(supabase, adminSupabase, projectId, user.id);

    const { data: pages, error: pagesError } = await adminSupabase
      .from("project_page_access")
      .select("page_key, is_enabled")
      .eq("project_id", projectId)
      .order("page_key", { ascending: true });

    if (pagesError) {
      throw new ApiError(`Failed to load page access: ${pagesError.message}`, 500);
    }

    const { data: membership } = await supabase
      .from("project_members")
      .select("id, role")
      .eq("project_id", projectId)
      .eq("user_id", user.id)
      .maybeSingle();

    const { data: project } = await adminSupabase
      .from("projects")
      .select("user_id")
      .eq("id", projectId)
      .single();

    let memberOverrides: Array<{ page_key: string; is_enabled: boolean }> = [];
    const isOwner = project?.user_id === user.id;
    const role = isOwner ? "owner" : membership?.role || "viewer";

    if (membership?.id) {
      const { data: overrides, error: overridesError } = await adminSupabase
        .from("project_member_page_access")
        .select("page_key, is_enabled")
        .eq("project_member_id", membership.id)
        .order("page_key", { ascending: true });

      if (overridesError) {
        throw new ApiError(`Failed to load member overrides: ${overridesError.message}`, 500);
      }

      memberOverrides = overrides || [];
    }

    return NextResponse.json({
      success: true,
      pages: pages || [],
      memberOverrides,
      memberId: membership?.id || null,
      pageKeys: PAGE_KEYS,
      role,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST - Update project-level page access
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const supabase = await createServerClient();
    const adminSupabase = createAdminClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new ApiError("Unauthorized", 401);

    await requireWriteAccess(supabase, adminSupabase, projectId, user.id);

    const body = await request.json();
    const pageKey = body.pageKey as string | undefined;
    const isEnabled = body.isEnabled as boolean | undefined;

    if (!pageKey || !PAGE_KEYS.includes(pageKey)) {
      throw new ApiError("Invalid page key", 400);
    }

    if (typeof isEnabled !== "boolean") {
      throw new ApiError("isEnabled must be boolean", 400);
    }

    const { data, error: upsertError } = await adminSupabase
      .from("project_page_access")
      .upsert(
        { project_id: projectId, page_key: pageKey, is_enabled: isEnabled },
        { onConflict: "project_id,page_key" }
      )
      .select("page_key, is_enabled")
      .single();

    if (upsertError) {
      throw new ApiError(`Failed to update page access: ${upsertError.message}`, 500);
    }

    return NextResponse.json({
      success: true,
      page: data,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
