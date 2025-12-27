"use client";

import { use, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings,
  Users,
  UserPlus,
  Mail,
  Clock,
  Crown,
  Eye,
  Trash2,
  Copy,
  Check,
  Loader2,
  AlertCircle,
  Link as LinkIcon,
  X,
  Send,
  ArrowLeft,
  Pencil,
  Video,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";
import { createClient } from "@/lib/supabase";
import { ProjectMember, ProjectInvite, ProjectRole } from "@/types";
import Link from "next/link";
import { PAGE_KEYS, PAGE_LABELS } from "@/lib/page-access";
import { ResearchHealthMatrix } from "@/components/dashboard/ResearchHealthMatrix";
import { AlertsPanel, DashboardAlert } from "@/components/dashboard/AlertsPanel";
import { BatchActionsPanel } from "@/components/data-ops/BatchActionsPanel";
import { cn } from "@/lib/utils";

interface MembersData {
  members: ProjectMember[];
  isOwner: boolean;
}

interface PageAccessRow {
  page_key: string;
  is_enabled: boolean;
}

interface PageAccessData {
  pages: PageAccessRow[];
  memberOverrides: PageAccessRow[];
  pageKeys: string[];
  role?: ProjectRole;
}

interface DataOpsState {
  research_health: {
    segments: Array<{
      id: string;
      name: string;
      steps: Record<string, "complete" | "pending" | "missing">;
    }>;
  };
  alerts: DashboardAlert[];
}

export default function ProjectSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = use(params);
  const supabase = createClient();

  const [isLoading, setIsLoading] = useState(true);
  const [membersData, setMembersData] = useState<MembersData | null>(null);
  const [invites, setInvites] = useState<ProjectInvite[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [projectName, setProjectName] = useState<string>("");

  // Invite form
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<ProjectRole>("viewer");
  const [isInviting, setIsInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  // Delete states
  const [deletingMember, setDeletingMember] = useState<string | null>(null);
  const [deletingInvite, setDeletingInvite] = useState<string | null>(null);

  // Page access + Data & Ops
  const [pageAccess, setPageAccess] = useState<PageAccessData | null>(null);
  const [pageAccessLoading, setPageAccessLoading] = useState(false);
  const [pageAccessError, setPageAccessError] = useState<string | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [memberOverrides, setMemberOverrides] = useState<PageAccessRow[]>([]);
  const [memberOverridesLoading, setMemberOverridesLoading] = useState(false);
  const [dataOps, setDataOps] = useState<DataOpsState | null>(null);
  const [dataOpsLoading, setDataOpsLoading] = useState(false);
  const [dataOpsError, setDataOpsError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [projectId]);

  useEffect(() => {
    if (selectedMemberId) {
      loadMemberOverrides(selectedMemberId);
    }
  }, [selectedMemberId]);

  useEffect(() => {
    if (!selectedMemberId && membersData?.members?.length) {
      const firstMember = membersData.members.find((member) => member.role !== "owner");
      if (firstMember) {
        setSelectedMemberId(firstMember.id);
      }
    }
  }, [membersData, selectedMemberId]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setPageAccessError(null);
      setDataOpsError(null);

      // Fetch project info
      const { data: project } = await supabase
        .from("projects")
        .select("name")
        .eq("id", projectId)
        .single();

      if (project) {
        setProjectName(project.name);
      }

      // Fetch members
      const membersRes = await fetch(`/api/projects/${projectId}/members`);
      const membersResult = await membersRes.json();

      if (!membersRes.ok) {
        throw new Error(membersResult.error || "Failed to load members");
      }

      setMembersData(membersResult);

      // Fetch invites (only if owner)
      if (membersResult.isOwner) {
        const invitesRes = await fetch(`/api/projects/${projectId}/invites`);
        const invitesResult = await invitesRes.json();

        if (invitesRes.ok && invitesResult.invites) {
          setInvites(invitesResult.invites);
        }
      }

      // Fetch page access config
      setPageAccessLoading(true);
      const pageAccessRes = await fetch(`/api/projects/${projectId}/page-access`);
      const pageAccessResult = await pageAccessRes.json();
      if (pageAccessRes.ok) {
        setPageAccess(pageAccessResult as PageAccessData);
      } else {
        setPageAccessError(pageAccessResult.error || "Failed to load page access");
      }
      setPageAccessLoading(false);

      // Fetch Data & Ops info from dashboard API
      setDataOpsLoading(true);
      const dataOpsRes = await fetch(`/api/projects/${projectId}/dashboard`);
      const dataOpsResult = await dataOpsRes.json();
      if (dataOpsRes.ok) {
        setDataOps(dataOpsResult as DataOpsState);
      } else {
        setDataOpsError(dataOpsResult.error || "Failed to load data ops");
      }
      setDataOpsLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setIsInviting(true);
    setInviteError(null);
    setInviteSuccess(null);

    try {
      const res = await fetch(`/api/projects/${projectId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Failed to send invite");
      }

      setInviteSuccess(result.inviteLink);
      setInviteEmail("");
      setInviteRole("viewer");
      fetchData(); // Refresh invites list
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : "Failed to send invite");
    } finally {
      setIsInviting(false);
    }
  };

  const handleCopyLink = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link);
      setCopiedLink(link);
      setTimeout(() => setCopiedLink(null), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = link;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopiedLink(link);
      setTimeout(() => setCopiedLink(null), 2000);
    }
  };

  const getPageEnabled = (pageKey: string) => {
    const entry = pageAccess?.pages?.find((page) => page.page_key === pageKey);
    return entry ? entry.is_enabled : true;
  };

  const getMemberOverrideEnabled = (pageKey: string) => {
    const entry = memberOverrides.find((page) => page.page_key === pageKey);
    return entry ? entry.is_enabled : getPageEnabled(pageKey);
  };

  const handleTogglePageAccess = async (pageKey: string, isEnabled: boolean) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/page-access`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageKey, isEnabled }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Failed to update page access");
      }

      setPageAccess((prev) => {
        if (!prev) return prev;
        const updated = prev.pages.filter((page) => page.page_key !== pageKey);
        updated.push({ page_key: pageKey, is_enabled: isEnabled });
        return { ...prev, pages: updated };
      });
    } catch (err) {
      setPageAccessError(err instanceof Error ? err.message : "Failed to update page access");
    }
  };

  const loadMemberOverrides = async (memberId: string) => {
    try {
      setMemberOverridesLoading(true);
      const res = await fetch(`/api/projects/${projectId}/member-page-access?memberId=${memberId}`);
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Failed to load member overrides");
      }
      setMemberOverrides(result.overrides || []);
    } catch (err) {
      setPageAccessError(err instanceof Error ? err.message : "Failed to load member overrides");
    } finally {
      setMemberOverridesLoading(false);
    }
  };

  const handleToggleMemberAccess = async (pageKey: string, isEnabled: boolean) => {
    if (!selectedMemberId) return;
    try {
      const res = await fetch(`/api/projects/${projectId}/member-page-access`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId: selectedMemberId, pageKey, isEnabled }),
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || "Failed to update member access");
      }
      setMemberOverrides((prev) => {
        const updated = prev.filter((page) => page.page_key !== pageKey);
        updated.push({ page_key: pageKey, is_enabled: isEnabled });
        return updated;
      });
    } catch (err) {
      setPageAccessError(err instanceof Error ? err.message : "Failed to update member access");
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    setDeletingMember(memberId);
    try {
      const res = await fetch(`/api/projects/${projectId}/members?memberId=${memberId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.error || "Failed to remove member");
      }

      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove member");
    } finally {
      setDeletingMember(null);
    }
  };

  const handleCancelInvite = async (inviteId: string) => {
    setDeletingInvite(inviteId);
    try {
      const res = await fetch(`/api/projects/${projectId}/invites?inviteId=${inviteId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.error || "Failed to cancel invite");
      }

      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel invite");
    } finally {
      setDeletingInvite(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getRoleIcon = (role: ProjectRole) => {
    if (role === "owner") {
      return <Crown className="w-4 h-4 text-amber-500" />;
    }
    if (role === "editor") {
      return <Pencil className="w-4 h-4 text-blue-500" />;
    }
    if (role === "ugc_specialist") {
      return <Video className="w-4 h-4 text-pink-500" />;
    }
    return <Eye className="w-4 h-4 text-slate-400" />;
  };

  const getRoleBadge = (role: ProjectRole) => {
    if (role === "owner") {
      return (
        <Badge className="bg-amber-100 text-amber-700 border-amber-200">
          <Crown className="w-3 h-3 mr-1" />
          Owner
        </Badge>
      );
    }
    if (role === "editor") {
      return (
        <Badge className="bg-blue-100 text-blue-700 border-blue-200">
          <Pencil className="w-3 h-3 mr-1" />
          Editor
        </Badge>
      );
    }
    if (role === "ugc_specialist") {
      return (
        <Badge className="bg-pink-100 text-pink-700 border-pink-200">
          <Video className="w-3 h-3 mr-1" />
          UGC Specialist
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="bg-slate-100 text-slate-600">
        <Eye className="w-3 h-3 mr-1" />
        Viewer
      </Badge>
    );
  };

  const renderToggle = (
    enabled: boolean,
    onToggle: () => void,
    disabled?: boolean
  ) => (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={cn(
        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
        enabled ? "bg-emerald-500" : "bg-slate-300",
        disabled && "opacity-60 cursor-not-allowed"
      )}
      aria-pressed={enabled}
    >
      <span
        className={cn(
          "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
          enabled ? "translate-x-6" : "translate-x-1"
        )}
      />
    </button>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertCircle className="w-12 h-12 text-red-400" />
        <p className="text-slate-600">{error}</p>
        <Button onClick={fetchData}>Retry</Button>
      </div>
    );
  }

  const isOwner = membersData?.isOwner || false;
  const canManageAccess = pageAccess?.role === "owner" || pageAccess?.role === "editor";
  const canRunOps = canManageAccess;

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between"
      >
        <div className="flex items-start gap-4">
          <div className="p-3 bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl text-white shadow-lg shadow-slate-500/20">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Project Settings
            </h1>
            <p className="mt-1 text-slate-500">
              {projectName || "Manage access and members"}
            </p>
          </div>
        </div>
        <Link href={`/projects/${projectId}/overview`}>
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </Link>
      </motion.div>

      {/* Invite Section (only for owner) */}
      {isOwner && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50/50 to-transparent">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <UserPlus className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Invite Member</CardTitle>
                  <CardDescription>
                    Send an email invitation for collaboration
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleInvite} className="flex gap-3 flex-wrap">
                <div className="flex-1 min-w-[220px] relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    type="email"
                    placeholder="email@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="pl-10"
                    disabled={isInviting}
                  />
                </div>
                <div className="w-44">
                  <Select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as ProjectRole)}
                    disabled={isInviting}
                  >
                    <option value="viewer">Viewer</option>
                    <option value="editor">Editor</option>
                    <option value="ugc_specialist">UGC Specialist</option>
                  </Select>
                </div>
                <Button type="submit" disabled={isInviting || !inviteEmail.trim()} className="gap-2">
                  {isInviting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Invite
                </Button>
              </form>

              <AnimatePresence>
                {inviteError && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700"
                  >
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {inviteError}
                  </motion.div>
                )}

                {inviteSuccess && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 p-4 bg-emerald-50 border border-emerald-200 rounded-lg"
                  >
                    <div className="flex items-center gap-2 text-sm text-emerald-700 font-medium mb-2">
                      <Check className="w-4 h-4" />
                      Invite created!
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={inviteSuccess}
                        readOnly
                        className="text-xs bg-white font-mono"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopyLink(inviteSuccess)}
                        className="flex-shrink-0 gap-1"
                      >
                        {copiedLink === inviteSuccess ? (
                          <>
                            <Check className="w-3 h-3" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            Copy
                          </>
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-emerald-600 mt-2">
                      Share this link with the user. The invite is valid for 7 days.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Members List */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-500/10 rounded-lg">
                <Users className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Project Members</CardTitle>
                <CardDescription>
                  {membersData?.members.length || 0} member(s)
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {membersData?.members.map((member, index) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * index }}
                className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
                    {getRoleIcon(member.role)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-900">
                        {member.email || `User ${member.user_id.slice(0, 8)}...`}
                      </span>
                      {getRoleBadge(member.role)}
                    </div>
                    {member.joined_at && (
                      <p className="text-xs text-slate-500 mt-0.5">
                        Joined {formatDate(member.joined_at)}
                      </p>
                    )}
                  </div>
                </div>

                {isOwner && member.role !== "owner" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteMember(member.id)}
                    disabled={deletingMember === member.id}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    {deletingMember === member.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                )}
              </motion.div>
            ))}

            {(!membersData?.members || membersData.members.length === 0) && (
              <div className="text-center py-8 text-slate-500">
                <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p>No members</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Page Access Controls */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-500/10 rounded-lg">
                <Shield className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Page Access Controls</CardTitle>
                <CardDescription>
                  Control which pages are visible for shared members.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {!pageAccessLoading && !canManageAccess && (
              <p className="text-sm text-text-secondary">
                Only owners and editors can update page access settings.
              </p>
            )}

            {pageAccessError && (
              <p className="text-sm text-red-600">{pageAccessError}</p>
            )}

            {pageAccessLoading && (
              <div className="text-sm text-text-secondary">Loading access rules…</div>
            )}

            {!pageAccessLoading && (
              <div className="space-y-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-3">
                    Project Defaults
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {PAGE_KEYS.filter((key) => key !== "data-ops").map((pageKey) => (
                      <div
                        key={pageKey}
                        className="flex items-center justify-between rounded-lg border border-border bg-white px-3 py-2"
                      >
                        <span className="text-sm text-text-primary">
                          {PAGE_LABELS[pageKey] || pageKey}
                        </span>
                        {renderToggle(
                          getPageEnabled(pageKey),
                          () => handleTogglePageAccess(pageKey, !getPageEnabled(pageKey)),
                          !canManageAccess
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-border pt-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-3">
                    Member Overrides
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="w-64">
                      <Select
                        value={selectedMemberId || ""}
                        onChange={(e) => setSelectedMemberId(e.target.value || null)}
                        disabled={!canManageAccess || (membersData?.members.length || 0) <= 1}
                      >
                        <option value="">Select member</option>
                        {membersData?.members
                          .filter((member) => member.role !== "owner")
                          .map((member) => (
                            <option key={member.id} value={member.id}>
                              {member.email || member.user_id.slice(0, 8)}
                            </option>
                          ))}
                      </Select>
                    </div>
                    {memberOverridesLoading && (
                      <span className="text-xs text-text-secondary">Loading overrides…</span>
                    )}
                  </div>

                  {selectedMemberId && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                      {PAGE_KEYS.filter((key) => key !== "data-ops").map((pageKey) => (
                        <div
                          key={pageKey}
                          className="flex items-center justify-between rounded-lg border border-border bg-white px-3 py-2"
                        >
                          <span className="text-sm text-text-primary">
                            {PAGE_LABELS[pageKey] || pageKey}
                          </span>
                          {renderToggle(
                            getMemberOverrideEnabled(pageKey),
                            () => handleToggleMemberAccess(pageKey, !getMemberOverrideEnabled(pageKey)),
                            !canManageAccess
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Data & Ops */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-emerald-500/10 rounded-lg">
            <Shield className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-text-primary">Data & Ops</h2>
            <p className="text-sm text-text-secondary">
              Coverage matrix, missing alerts, and batch operations.
            </p>
          </div>
        </div>

        {dataOpsLoading && (
          <Card>
            <CardHeader>
              <CardTitle>Loading coverage…</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-text-secondary">
              Pulling latest research coverage.
            </CardContent>
          </Card>
        )}

        {!dataOpsLoading && dataOpsError && (
          <Card>
            <CardHeader>
              <CardTitle>Data & Ops</CardTitle>
              <CardDescription className="text-red-500">{dataOpsError}</CardDescription>
            </CardHeader>
          </Card>
        )}

        {!dataOpsLoading && dataOps && (
          <div className="space-y-6">
            <ResearchHealthMatrix
              segments={dataOps.research_health?.segments || []}
              title="Coverage Matrix"
              description="Approved vs pending vs missing per segment."
            />
            <AlertsPanel
              alerts={dataOps.alerts || []}
              title="Missing Alerts"
              description="Resolve missing data before running activation modules."
            />
            {canRunOps ? (
              <BatchActionsPanel projectId={projectId} />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Batch Actions</CardTitle>
                  <CardDescription>
                    Only owners and editors can run bulk operations.
                  </CardDescription>
                </CardHeader>
              </Card>
            )}
          </div>
        )}
      </motion.div>

      {/* Pending Invites (only for owner) */}
      {isOwner && invites.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-dashed border-amber-300">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 rounded-lg">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Pending Invites</CardTitle>
                  <CardDescription>
                    {invites.length} invite(s) awaiting response
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {invites.map((invite, index) => (
                <motion.div
                  key={invite.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * index }}
                  className="flex items-center justify-between p-4 bg-amber-50/50 border border-amber-100 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                      <Mail className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-900">{invite.email}</span>
                        <Badge variant="secondary" className="bg-amber-100 text-amber-700 text-xs">
                          Pending
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Expires {formatDate(invite.expires_at)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const link = `${window.location.origin}/invite/${invite.token}`;
                        handleCopyLink(link);
                      }}
                      className="text-slate-500 hover:text-slate-700"
                    >
                      {copiedLink?.includes(invite.token) ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <LinkIcon className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCancelInvite(invite.id)}
                      disabled={deletingInvite === invite.id}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      {deletingInvite === invite.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <X className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Info for non-owners */}
      {!isOwner && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-slate-50 border-slate-200">
            <CardContent className="py-6">
              <div className="flex items-center gap-3 text-slate-600">
                <Eye className="w-5 h-5" />
                <p className="text-sm">
                  You have view-only access to this project.
                  Only the owner can invite new members.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
