import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST - Accept invite by token
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authorization
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "You must be logged in" }, { status: 401 });
    }

    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ error: "Invite token is required" }, { status: 400 });
    }

    // Find invite by token
    const { data: invite, error: inviteError } = await supabase
      .from("project_invites")
      .select("*, projects(id, name)")
      .eq("token", token)
      .single();

    if (inviteError || !invite) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    }

    // Check if invite has expired
    if (new Date(invite.expires_at) < new Date()) {
      return NextResponse.json({ error: "Invite has expired" }, { status: 400 });
    }

    // Check if already accepted
    if (invite.accepted_at) {
      return NextResponse.json({ error: "Invite has already been accepted" }, { status: 400 });
    }

    // Check email match
    if (user.email?.toLowerCase() !== invite.email.toLowerCase()) {
      return NextResponse.json({
        error: `This invite is for ${invite.email}. Please sign in with the correct account.`
      }, { status: 403 });
    }

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from("project_members")
      .select("id")
      .eq("project_id", invite.project_id)
      .eq("user_id", user.id)
      .single();

    if (existingMember) {
      return NextResponse.json({ error: "You are already a member of this project" }, { status: 400 });
    }

    // Check if user is the owner
    const { data: project } = await supabase
      .from("projects")
      .select("user_id")
      .eq("id", invite.project_id)
      .single();

    if (project?.user_id === user.id) {
      return NextResponse.json({ error: "You are the owner of this project" }, { status: 400 });
    }

    // Create member record with email for display
    const { error: memberError } = await supabase
      .from("project_members")
      .insert({
        project_id: invite.project_id,
        user_id: user.id,
        role: invite.role,
        invited_by: invite.invited_by,
        email: user.email, // Store email for display in settings
      });

    if (memberError) {
      console.error("Error creating member:", memberError);
      return NextResponse.json({ error: "Failed to accept invite" }, { status: 500 });
    }

    // Mark invite as accepted
    const { error: updateError } = await supabase
      .from("project_invites")
      .update({ accepted_at: new Date().toISOString() })
      .eq("id", invite.id);

    if (updateError) {
      console.error("Error updating invite:", updateError);
    }

    // projects can be an array or single object depending on Supabase config
    const projectsRaw = invite.projects as unknown;
    const projectObj = Array.isArray(projectsRaw) ? projectsRaw[0] : projectsRaw;
    const projectInfo = projectObj as { id: string; name: string } | undefined;

    return NextResponse.json({
      success: true,
      message: "Invite accepted",
      projectId: invite.project_id,
      projectName: projectInfo?.name || "Project",
    });
  } catch (error) {
    console.error("Accept invite error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET - Get invite info by token (for accept page)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    const supabase = await createClient();

    // Find invite
    const { data: invite, error } = await supabase
      .from("project_invites")
      .select("id, email, role, expires_at, accepted_at, projects(id, name)")
      .eq("token", token)
      .single();

    if (error || !invite) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    }

    // Check status
    const isExpired = new Date(invite.expires_at) < new Date();
    const isAccepted = !!invite.accepted_at;

    // projects can be an array or single object depending on Supabase config
    const projectsData = invite.projects as unknown;
    const projectData = Array.isArray(projectsData) ? projectsData[0] : projectsData;
    const projectInfo = projectData as { id: string; name: string } | undefined;

    return NextResponse.json({
      success: true,
      invite: {
        email: invite.email,
        role: invite.role,
        projectName: projectInfo?.name || "Project",
        projectId: projectInfo?.id,
        isExpired,
        isAccepted,
      },
    });
  } catch (error) {
    console.error("Get invite error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
