import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ProjectMember, ProjectRole } from "@/types";

// GET - List all members of a project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const supabase = await createClient();

    // Check auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has access to this project (owner or member)
    const { data: project } = await supabase
      .from("projects")
      .select("id, user_id")
      .eq("id", projectId)
      .single();

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const isOwner = project.user_id === user.id;

    // Check if user is a member (use maybeSingle to handle empty results)
    const { data: membership, error: membershipError } = await supabase
      .from("project_members")
      .select("id")
      .eq("project_id", projectId)
      .eq("user_id", user.id)
      .maybeSingle();

    // Log for debugging
    if (membershipError) {
      console.error("Membership check error:", membershipError);
    }

    if (!isOwner && !membership) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Get all members (empty array is OK)
    const { data: members, error } = await supabase
      .from("project_members")
      .select("*")
      .eq("project_id", projectId)
      .order("joined_at", { ascending: true });

    if (error) {
      console.error("Error fetching members:", error);
      return NextResponse.json({ error: `Failed to fetch members: ${error.message}` }, { status: 500 });
    }

    // Get owner info
    const ownerMember: ProjectMember = {
      id: "owner",
      project_id: projectId,
      user_id: project.user_id,
      role: "owner" as ProjectRole,
      invited_by: null,
      joined_at: "",
      email: undefined,
    };

    // Get emails for members (including owner)
    const userIds = [project.user_id, ...members.map((m: { user_id: string }) => m.user_id)];

    // We need to get user emails from auth.users via a different approach
    // Since we can't directly query auth.users, we'll use a workaround
    // For now, just return members without emails (frontend can handle)

    const allMembers = [ownerMember, ...members];

    return NextResponse.json({
      success: true,
      members: allMembers,
      isOwner,
    });
  } catch (error) {
    console.error("Members GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Invite a new member by email
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const supabase = await createClient();

    // Check auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is the owner of this project
    const { data: project } = await supabase
      .from("projects")
      .select("id, user_id, name")
      .eq("id", projectId)
      .single();

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.user_id !== user.id) {
      return NextResponse.json({ error: "Only project owner can invite members" }, { status: 403 });
    }

    const body = await request.json();
    const { email, role = "viewer" } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    // Don't allow inviting yourself
    if (email.toLowerCase() === user.email?.toLowerCase()) {
      return NextResponse.json({ error: "You cannot invite yourself" }, { status: 400 });
    }

    // Check if invite already exists
    const { data: existingInvite } = await supabase
      .from("project_invites")
      .select("id, accepted_at")
      .eq("project_id", projectId)
      .eq("email", email.toLowerCase())
      .single();

    if (existingInvite) {
      if (existingInvite.accepted_at) {
        return NextResponse.json({ error: "This user is already a member" }, { status: 400 });
      }
      return NextResponse.json({ error: "An invite already exists for this email" }, { status: 400 });
    }

    // Create the invite
    const { data: invite, error } = await supabase
      .from("project_invites")
      .insert({
        project_id: projectId,
        email: email.toLowerCase(),
        role: role as ProjectRole,
        invited_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating invite:", error);
      return NextResponse.json({ error: "Failed to create invite" }, { status: 500 });
    }

    // Generate invite link
    const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invite/${invite.token}`;

    return NextResponse.json({
      success: true,
      invite,
      inviteLink,
      message: `Invite created for ${email}. Share this link: ${inviteLink}`,
    });
  } catch (error) {
    console.error("Members POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE - Remove a member from project
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const supabase = await createClient();

    // Check auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is the owner of this project
    const { data: project } = await supabase
      .from("projects")
      .select("id, user_id")
      .eq("id", projectId)
      .single();

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.user_id !== user.id) {
      return NextResponse.json({ error: "Only project owner can remove members" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const memberId = searchParams.get("memberId");

    if (!memberId) {
      return NextResponse.json({ error: "Member ID is required" }, { status: 400 });
    }

    // Delete the member
    const { error } = await supabase
      .from("project_members")
      .delete()
      .eq("id", memberId)
      .eq("project_id", projectId);

    if (error) {
      console.error("Error removing member:", error);
      return NextResponse.json({ error: "Failed to remove member" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Member removed successfully",
    });
  } catch (error) {
    console.error("Members DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
