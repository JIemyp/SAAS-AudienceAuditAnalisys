"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { AISettings } from "@/components/settings/AISettings";
import {
    Settings,
    User,
    Globe,
    LogOut,
    Loader2,
    Mail,
    Calendar,
    UserPlus,
    Users,
    Send,
    Check,
    Copy,
    AlertCircle,
    ChevronDown,
    Crown,
    Eye,
    Trash2,
    X,
    Clock,
    Link as LinkIcon,
} from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { AnimatePresence, motion } from "framer-motion";

interface UserData {
    id: string;
    email: string;
    created_at: string;
}

interface Project {
    id: string;
    name: string;
}

interface ProjectMember {
    id: string;
    user_id: string;
    email?: string;
    role: "owner" | "viewer" | "editor";
    joined_at: string;
}

interface ProjectInvite {
    id: string;
    email: string;
    token: string;
    expires_at: string;
}

export default function SettingsPage() {
    const router = useRouter();
    const supabase = createClient();
    const [user, setUser] = useState<UserData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const { language, setLanguage } = useLanguage();

    // Project sharing state
    const [projects, setProjects] = useState<Project[]>([]);
    const [selectedProject, setSelectedProject] = useState<string>("");
    const [members, setMembers] = useState<ProjectMember[]>([]);
    const [invites, setInvites] = useState<ProjectInvite[]>([]);
    const [inviteEmail, setInviteEmail] = useState("");
    const [isInviting, setIsInviting] = useState(false);
    const [inviteError, setInviteError] = useState<string | null>(null);
    const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
    const [copiedLink, setCopiedLink] = useState<string | null>(null);
    const [loadingMembers, setLoadingMembers] = useState(false);
    const [deletingMember, setDeletingMember] = useState<string | null>(null);
    const [deletingInvite, setDeletingInvite] = useState<string | null>(null);

    useEffect(() => {
        async function fetchUser() {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUser({
                    id: user.id,
                    email: user.email || "",
                    created_at: user.created_at,
                });

                // Fetch owned projects for sharing
                const { data: ownedProjects } = await supabase
                    .from("projects")
                    .select("id, name")
                    .eq("user_id", user.id)
                    .order("created_at", { ascending: false });

                if (ownedProjects) {
                    setProjects(ownedProjects);
                }
            }
            setIsLoading(false);
        }
        fetchUser();
    }, [supabase.auth]);

    // Fetch members when project is selected
    useEffect(() => {
        if (!selectedProject) {
            setMembers([]);
            setInvites([]);
            return;
        }

        async function fetchProjectData() {
            setLoadingMembers(true);
            try {
                // Fetch members
                const membersRes = await fetch(`/api/projects/${selectedProject}/members`);
                const membersData = await membersRes.json();
                if (membersData.members) {
                    setMembers(membersData.members);
                }

                // Fetch invites
                const invitesRes = await fetch(`/api/projects/${selectedProject}/invites`);
                const invitesData = await invitesRes.json();
                if (invitesData.invites) {
                    setInvites(invitesData.invites);
                }
            } catch (err) {
                console.error("Failed to fetch project data:", err);
            } finally {
                setLoadingMembers(false);
            }
        }
        fetchProjectData();
    }, [selectedProject]);

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteEmail.trim() || !selectedProject) return;

        setIsInviting(true);
        setInviteError(null);
        setInviteSuccess(null);

        try {
            const res = await fetch(`/api/projects/${selectedProject}/members`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: inviteEmail.trim(), role: "viewer" }),
            });

            const result = await res.json();

            if (!res.ok) {
                throw new Error(result.error || "Failed to send invite");
            }

            setInviteSuccess(result.inviteLink);
            setInviteEmail("");

            // Refresh invites
            const invitesRes = await fetch(`/api/projects/${selectedProject}/invites`);
            const invitesData = await invitesRes.json();
            if (invitesData.invites) {
                setInvites(invitesData.invites);
            }
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

    const handleDeleteMember = async (memberId: string) => {
        setDeletingMember(memberId);
        try {
            await fetch(`/api/projects/${selectedProject}/members?memberId=${memberId}`, {
                method: "DELETE",
            });
            setMembers(members.filter(m => m.id !== memberId));
        } catch (err) {
            console.error("Failed to remove member:", err);
        } finally {
            setDeletingMember(null);
        }
    };

    const handleCancelInvite = async (inviteId: string) => {
        setDeletingInvite(inviteId);
        try {
            await fetch(`/api/projects/${selectedProject}/invites?inviteId=${inviteId}`, {
                method: "DELETE",
            });
            setInvites(invites.filter(i => i.id !== inviteId));
        } catch (err) {
            console.error("Failed to cancel invite:", err);
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

    const handleLogout = async () => {
        setIsLoggingOut(true);
        await supabase.auth.signOut();
        router.push("/login");
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start gap-4">
                <div className="p-3 bg-gradient-to-br from-slate-500 to-slate-600 rounded-xl text-white shadow-lg shadow-slate-500/20">
                    <Settings className="w-6 h-6" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                        Settings
                    </h1>
                    <p className="mt-1 text-slate-500">
                        Manage your account and preferences
                    </p>
                </div>
            </div>

            {/* Account Section */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                            <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <CardTitle>Account</CardTitle>
                            <CardDescription>Your account information</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {user && (
                        <>
                            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                                <Mail className="w-5 h-5 text-slate-400" />
                                <div>
                                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        Email
                                    </p>
                                    <p className="text-sm text-slate-900">{user.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg">
                                <Calendar className="w-5 h-5 text-slate-400" />
                                <div>
                                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                                        Member since
                                    </p>
                                    <p className="text-sm text-slate-900">
                                        {new Date(user.created_at).toLocaleDateString("en-US", {
                                            year: "numeric",
                                            month: "long",
                                            day: "numeric",
                                        })}
                                    </p>
                                </div>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Project Sharing Section */}
            {projects.length > 0 && (
                <Card className="border-l-4 border-l-blue-500">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500/10 rounded-lg">
                                <UserPlus className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <CardTitle>Project Sharing</CardTitle>
                                <CardDescription>Invite others to view your projects</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Project Selector */}
                        <div>
                            <label className="text-sm font-medium text-slate-700 mb-2 block">
                                Select Project
                            </label>
                            <div className="relative">
                                <select
                                    value={selectedProject}
                                    onChange={(e) => {
                                        setSelectedProject(e.target.value);
                                        setInviteSuccess(null);
                                        setInviteError(null);
                                    }}
                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm appearance-none cursor-pointer focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">Choose a project...</option>
                                    {projects.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.name}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* Invite Form (when project selected) */}
                        {selectedProject && (
                            <>
                                <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-lg">
                                    <p className="text-sm font-medium text-slate-700 mb-3">
                                        Invite by email
                                    </p>
                                    <form onSubmit={handleInvite} className="flex gap-2">
                                        <div className="flex-1 relative">
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
                                                className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg"
                                            >
                                                <div className="flex items-center gap-2 text-sm text-emerald-700 font-medium mb-2">
                                                    <Check className="w-4 h-4" />
                                                    Invite created! Share this link:
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
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Members List */}
                                {loadingMembers ? (
                                    <div className="flex items-center justify-center py-6">
                                        <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                                    </div>
                                ) : (
                                    <>
                                        {/* Current Members */}
                                        <div>
                                            <p className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                                                <Users className="w-4 h-4" />
                                                Members ({members.length})
                                            </p>
                                            <div className="space-y-2">
                                                {members.map((member) => (
                                                    <div
                                                        key={member.id}
                                                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                                                                {member.role === "owner" ? (
                                                                    <Crown className="w-4 h-4 text-amber-500" />
                                                                ) : (
                                                                    <Eye className="w-4 h-4 text-slate-400" />
                                                                )}
                                                            </div>
                                                            <div>
                                                                <span className="text-sm font-medium text-slate-900">
                                                                    {member.email || `User ${member.user_id.slice(0, 8)}...`}
                                                                </span>
                                                                <Badge
                                                                    variant="secondary"
                                                                    className={`ml-2 text-xs ${
                                                                        member.role === "owner"
                                                                            ? "bg-amber-100 text-amber-700"
                                                                            : "bg-slate-100 text-slate-600"
                                                                    }`}
                                                                >
                                                                    {member.role === "owner" ? "Owner" : "Viewer"}
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                        {member.role !== "owner" && (
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
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Pending Invites */}
                                        {invites.length > 0 && (
                                            <div>
                                                <p className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
                                                    <Clock className="w-4 h-4 text-amber-500" />
                                                    Pending Invites ({invites.length})
                                                </p>
                                                <div className="space-y-2">
                                                    {invites.map((invite) => (
                                                        <div
                                                            key={invite.id}
                                                            className="flex items-center justify-between p-3 bg-amber-50/50 border border-amber-100 rounded-lg"
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                                                                    <Mail className="w-4 h-4 text-amber-600" />
                                                                </div>
                                                                <div>
                                                                    <span className="text-sm font-medium text-slate-900">
                                                                        {invite.email}
                                                                    </span>
                                                                    <p className="text-xs text-slate-500">
                                                                        Expires {formatDate(invite.expires_at)}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        const link = `${window.location.origin}/invite/${invite.token}`;
                                                                        handleCopyLink(link);
                                                                    }}
                                                                    className="text-slate-500 hover:text-slate-700"
                                                                    title="Copy invite link"
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
                                                                    title="Cancel invite"
                                                                >
                                                                    {deletingInvite === invite.id ? (
                                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                                    ) : (
                                                                        <X className="w-4 h-4" />
                                                                    )}
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* AI Provider Section */}
            <AISettings />

            {/* Language Section */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-500/10 rounded-lg">
                            <Globe className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                            <CardTitle>Language</CardTitle>
                            <CardDescription>
                                Choose your preferred content language
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                        <div>
                            <p className="text-sm font-medium text-slate-900">
                                Content Language
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                                Translates generated content (FREE - no AI tokens used)
                            </p>
                        </div>
                        <LanguageToggle
                            currentLanguage={language}
                            onLanguageChange={setLanguage}
                        />
                    </div>
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800">
                            <strong>Note:</strong> Translation uses DeepL/Google Translate APIs
                            and is completely free. No AI tokens are consumed.
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-red-200">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-500/10 rounded-lg">
                            <LogOut className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                            <CardTitle className="text-red-900">Sign Out</CardTitle>
                            <CardDescription>
                                Sign out of your account
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Button
                        variant="destructive"
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="gap-2"
                    >
                        {isLoggingOut ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Signing out...
                            </>
                        ) : (
                            <>
                                <LogOut className="w-4 h-4" />
                                Sign Out
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
