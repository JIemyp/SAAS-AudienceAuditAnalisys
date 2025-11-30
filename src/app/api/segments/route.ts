// =====================================================
// Segments List API
// =====================================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { handleApiError, ApiError } from "@/lib/api-utils";

// GET - Fetch all approved segments for a project
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      throw new ApiError("Project ID is required", 400);
    }

    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new ApiError("Unauthorized", 401);
    }

    // Fetch approved segments from segments table
    const { data: segments, error } = await supabase
      .from("segments")
      .select("*")
      .eq("project_id", projectId)
      .order("order_index", { ascending: true });

    if (error) {
      console.log("Segments fetch error:", error.message);
      return NextResponse.json({ success: true, segments: [] });
    }

    return NextResponse.json({ success: true, segments: segments || [] });
  } catch (error) {
    return handleApiError(error);
  }
}
