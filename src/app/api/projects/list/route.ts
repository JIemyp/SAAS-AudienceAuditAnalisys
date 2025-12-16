import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// GET - List all projects accessible to the current user (owned + shared)
export async function GET() {
  try {
    const supabase = await createClient();

    // Check auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("Auth error:", authError);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[projects/list] User:", user.id, user.email);

    // 1. Get projects owned by user (uses RLS - user can see own projects)
    const { data: ownedProjects, error: ownedError } = await supabase
      .from("projects")
      .select("id, name, status, current_step, onboarding_data, created_at, updated_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (ownedError) {
      console.error("[projects/list] Owned projects error:", ownedError);
    }

    console.log("[projects/list] Owned projects:", ownedProjects?.length || 0);

    // 2. Get projects where user is a member (uses RLS - user can see own memberships)
    const { data: memberships, error: memberError } = await supabase
      .from("project_members")
      .select("project_id")
      .eq("user_id", user.id);

    if (memberError) {
      console.error("[projects/list] Memberships error:", memberError);
    }

    console.log("[projects/list] Memberships:", memberships?.length || 0, memberships);

    // 3. Fetch member projects using admin client (bypasses RLS to get shared projects)
    let memberProjects: typeof ownedProjects = [];
    if (memberships && memberships.length > 0) {
      const projectIds = memberships.map(m => m.project_id);
      console.log("[projects/list] Fetching shared projects:", projectIds);

      // Use admin client to bypass RLS for shared projects
      const adminSupabase = createAdminClient();
      const { data: sharedProjects, error: sharedError } = await adminSupabase
        .from("projects")
        .select("id, name, status, current_step, onboarding_data, created_at, updated_at")
        .in("id", projectIds)
        .order("created_at", { ascending: false });

      if (sharedError) {
        console.error("[projects/list] Shared projects error:", sharedError);
      }

      memberProjects = sharedProjects || [];
      console.log("[projects/list] Shared projects found:", memberProjects.length);
    }

    // 4. Combine and mark roles
    const ownedWithRole = (ownedProjects || []).map(p => ({
      ...p,
      role: "owner" as const,
    }));

    const memberWithRole = (memberProjects || []).map(p => ({
      ...p,
      role: "viewer" as const,
    }));

    const allProjects = [...ownedWithRole, ...memberWithRole];
    console.log("[projects/list] Total projects:", allProjects.length);

    return NextResponse.json({
      success: true,
      projects: allProjects,
    });
  } catch (error) {
    console.error("[projects/list] Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
