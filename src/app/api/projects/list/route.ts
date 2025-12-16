import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET - List all projects accessible to the current user (owned + shared)
export async function GET() {
  try {
    const supabase = await createClient();

    // Check auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Get projects owned by user
    const { data: ownedProjects, error: ownedError } = await supabase
      .from("projects")
      .select("id, name, status, current_step, onboarding_data, created_at, updated_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (ownedError) {
      console.error("Error fetching owned projects:", ownedError);
      throw ownedError;
    }

    // 2. Get projects where user is a member
    const { data: memberships, error: memberError } = await supabase
      .from("project_members")
      .select("project_id")
      .eq("user_id", user.id);

    if (memberError) {
      console.error("Error fetching memberships:", memberError);
      throw memberError;
    }

    // 3. Fetch member projects if any
    let memberProjects: typeof ownedProjects = [];
    if (memberships && memberships.length > 0) {
      const projectIds = memberships.map(m => m.project_id);
      const { data: sharedProjects, error: sharedError } = await supabase
        .from("projects")
        .select("id, name, status, current_step, onboarding_data, created_at, updated_at")
        .in("id", projectIds)
        .order("created_at", { ascending: false });

      if (sharedError) {
        console.error("Error fetching shared projects:", sharedError);
        throw sharedError;
      }
      memberProjects = sharedProjects || [];
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

    // Combine, owned first, then shared
    return NextResponse.json({
      success: true,
      projects: [...ownedWithRole, ...memberWithRole],
    });
  } catch (error) {
    console.error("Projects list error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
