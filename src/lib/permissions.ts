// =====================================================
// Role-Based Access Control (RBAC) System
// =====================================================

import { SupabaseClient } from "@supabase/supabase-js";
import { ApiError } from "@/lib/api-utils";

// Permission levels
export type ProjectRole = "owner" | "editor" | "viewer";

// Available permissions
export enum Permission {
  // Read permissions
  VIEW_PROJECT = "view_project",
  VIEW_REPORTS = "view_reports",
  VIEW_MEMBERS = "view_members",

  // Write permissions
  EDIT_PROJECT = "edit_project",
  GENERATE_CONTENT = "generate_content",
  APPROVE_CONTENT = "approve_content",

  // Admin permissions
  MANAGE_MEMBERS = "manage_members",
  DELETE_PROJECT = "delete_project",
  RESET_PROJECT = "reset_project",
}

// Permission matrix - which roles have which permissions
const ROLE_PERMISSIONS: Record<ProjectRole, Permission[]> = {
  owner: [
    Permission.VIEW_PROJECT,
    Permission.VIEW_REPORTS,
    Permission.VIEW_MEMBERS,
    Permission.EDIT_PROJECT,
    Permission.GENERATE_CONTENT,
    Permission.APPROVE_CONTENT,
    Permission.MANAGE_MEMBERS,
    Permission.DELETE_PROJECT,
    Permission.RESET_PROJECT,
  ],
  editor: [
    Permission.VIEW_PROJECT,
    Permission.VIEW_REPORTS,
    Permission.VIEW_MEMBERS,
    Permission.EDIT_PROJECT,
    Permission.GENERATE_CONTENT,
    Permission.APPROVE_CONTENT,
  ],
  viewer: [
    Permission.VIEW_PROJECT,
    Permission.VIEW_REPORTS,
    Permission.VIEW_MEMBERS,
  ],
};

// User permission context
export interface PermissionContext {
  userId: string;
  projectId: string;
  role: ProjectRole;
  isOwner: boolean;
  permissions: Permission[];
}

/**
 * Check if a role has a specific permission
 */
export function roleHasPermission(role: ProjectRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: ProjectRole): Permission[] {
  return ROLE_PERMISSIONS[role];
}

/**
 * Get user's role and permissions for a project
 * Returns null if user has no access to the project
 */
export async function getUserPermissionContext(
  supabase: SupabaseClient,
  adminSupabase: SupabaseClient,
  projectId: string,
  userId: string
): Promise<PermissionContext | null> {
  // Check if user is project owner
  const { data: project } = await adminSupabase
    .from("projects")
    .select("id, user_id")
    .eq("id", projectId)
    .single();

  if (!project) {
    return null;
  }

  const isOwner = project.user_id === userId;

  if (isOwner) {
    return {
      userId,
      projectId,
      role: "owner",
      isOwner: true,
      permissions: ROLE_PERMISSIONS.owner,
    };
  }

  // Check if user is a member
  const { data: membership } = await supabase
    .from("project_members")
    .select("role")
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .not("accepted_at", "is", null)
    .maybeSingle();

  if (!membership) {
    return null;
  }

  const role = membership.role as ProjectRole;

  return {
    userId,
    projectId,
    role,
    isOwner: false,
    permissions: ROLE_PERMISSIONS[role],
  };
}

/**
 * Check if user has permission - throws ApiError if not
 * Use this in API routes for authorization
 */
export async function requirePermission(
  supabase: SupabaseClient,
  adminSupabase: SupabaseClient,
  projectId: string,
  userId: string,
  permission: Permission
): Promise<PermissionContext> {
  const context = await getUserPermissionContext(supabase, adminSupabase, projectId, userId);

  if (!context) {
    throw new ApiError("Project not found", 404);
  }

  if (!context.permissions.includes(permission)) {
    throw new ApiError("You don't have permission to perform this action", 403);
  }

  return context;
}

/**
 * Check if user has any access to project (owner or member)
 * Simpler check for read-only operations
 */
export async function requireProjectAccess(
  supabase: SupabaseClient,
  adminSupabase: SupabaseClient,
  projectId: string,
  userId: string
): Promise<PermissionContext> {
  return requirePermission(supabase, adminSupabase, projectId, userId, Permission.VIEW_PROJECT);
}

/**
 * Check if user can write to project (owner or editor)
 */
export async function requireWriteAccess(
  supabase: SupabaseClient,
  adminSupabase: SupabaseClient,
  projectId: string,
  userId: string
): Promise<PermissionContext> {
  return requirePermission(supabase, adminSupabase, projectId, userId, Permission.EDIT_PROJECT);
}

/**
 * Check if user is project owner
 */
export async function requireOwnerAccess(
  supabase: SupabaseClient,
  adminSupabase: SupabaseClient,
  projectId: string,
  userId: string
): Promise<PermissionContext> {
  const context = await getUserPermissionContext(supabase, adminSupabase, projectId, userId);

  if (!context) {
    throw new ApiError("Project not found", 404);
  }

  if (!context.isOwner) {
    throw new ApiError("Only project owner can perform this action", 403);
  }

  return context;
}

/**
 * Simple helper to check access without throwing
 * Useful for conditional logic
 */
export async function canAccessProject(
  supabase: SupabaseClient,
  adminSupabase: SupabaseClient,
  projectId: string,
  userId: string
): Promise<boolean> {
  const context = await getUserPermissionContext(supabase, adminSupabase, projectId, userId);
  return context !== null;
}

/**
 * Check if user can perform action without throwing
 */
export async function canPerformAction(
  supabase: SupabaseClient,
  adminSupabase: SupabaseClient,
  projectId: string,
  userId: string,
  permission: Permission
): Promise<boolean> {
  const context = await getUserPermissionContext(supabase, adminSupabase, projectId, userId);
  return context !== null && context.permissions.includes(permission);
}
