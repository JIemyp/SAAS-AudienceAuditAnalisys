import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { handleApiError, ApiError } from "@/lib/api-utils";
import { requireWriteAccess } from "@/lib/permissions";
import { PAGE_KEYS } from "@/lib/page-access";

// GET - Fetch member overrides (owner/editor only)
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

    await requireWriteAccess(supabase, adminSupabase, projectId, user.id);

    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get("memberId");

    if (!memberId) {
      throw new ApiError("memberId is required", 400);
    }

    const { data: member } = await adminSupabase
      .from("project_members")
      .select("id")
      .eq("id", memberId)
      .eq("project_id", projectId)
      .maybeSingle();

    if (!member) {
      throw new ApiError("Member not found", 404);
    }

    const { data: overrides, error: overridesError } = await adminSupabase
      .from("project_member_page_access")
      .select("page_key, is_enabled")
      .eq("project_member_id", memberId)
      .order("page_key", { ascending: true });

    if (overridesError) {
      throw new ApiError(`Failed to load member overrides: ${overridesError.message}`, 500);
    }

    return NextResponse.json({
      success: true,
      memberId,
      overrides: overrides || [],
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST - Update member override (owner/editor only)
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
    const memberId = body.memberId as string | undefined;
    const pageKey = body.pageKey as string | undefined;
    const isEnabled = body.isEnabled as boolean | undefined;

    if (!memberId) throw new ApiError("memberId is required", 400);
    if (!pageKey || !PAGE_KEYS.includes(pageKey)) {
      throw new ApiError("Invalid page key", 400);
    }
    if (typeof isEnabled !== "boolean") {
      throw new ApiError("isEnabled must be boolean", 400);
    }

    const { data: member } = await adminSupabase
      .from("project_members")
      .select("id")
      .eq("id", memberId)
      .eq("project_id", projectId)
      .maybeSingle();

    if (!member) {
      throw new ApiError("Member not found", 404);
    }

    const { data, error: upsertError } = await adminSupabase
      .from("project_member_page_access")
      .upsert(
        { project_member_id: memberId, page_key: pageKey, is_enabled: isEnabled },
        { onConflict: "project_member_id,page_key" }
      )
      .select("page_key, is_enabled")
      .single();

    if (upsertError) {
      throw new ApiError(`Failed to update member access: ${upsertError.message}`, 500);
    }

    return NextResponse.json({
      success: true,
      memberId,
      page: data,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
