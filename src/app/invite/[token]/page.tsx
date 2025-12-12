"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  UserPlus,
  Check,
  X,
  Loader2,
  AlertCircle,
  LogIn,
  Clock,
  Eye,
  FolderOpen,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { createClient } from "@/lib/supabase";
import Link from "next/link";

interface InviteInfo {
  email: string;
  role: string;
  projectName: string;
  projectId: string;
  isExpired: boolean;
  isAccepted: boolean;
}

export default function InviteAcceptPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const router = useRouter();
  const supabase = createClient();

  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [user, setUser] = useState<{ email: string } | null>(null);

  useEffect(() => {
    checkAuthAndFetchInvite();
  }, [token]);

  const checkAuthAndFetchInvite = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Check auth
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        setUser({ email: authUser.email || "" });
      }

      // Get invite info
      const res = await fetch(`/api/invites/accept?token=${token}`);
      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Invite not found");
      }

      setInvite(result.invite);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async () => {
    try {
      setIsAccepting(true);
      setError(null);

      const res = await fetch("/api/invites/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Failed to accept invite");
      }

      setSuccess(true);

      // Redirect to project after 2 seconds
      setTimeout(() => {
        router.push(`/projects/${result.projectId}/overview`);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setIsAccepting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading invite...</p>
        </motion.div>
      </div>
    );
  }

  // Error state
  if (error && !invite) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="max-w-md w-full border-red-200">
            <CardContent className="pt-8 text-center">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900 mb-2">
                Error
              </h2>
              <p className="text-slate-600 mb-6">{error}</p>
              <Link href="/projects">
                <Button variant="outline">Go to Projects</Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Expired invite
  if (invite?.isExpired) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="max-w-md w-full border-amber-200">
            <CardContent className="pt-8 text-center">
              <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-amber-500" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900 mb-2">
                Invite Expired
              </h2>
              <p className="text-slate-600 mb-6">
                This invite has expired. Please ask the project owner to send a new one.
              </p>
              <Link href="/projects">
                <Button variant="outline">Go to Projects</Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Already accepted
  if (invite?.isAccepted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="max-w-md w-full border-emerald-200">
            <CardContent className="pt-8 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-emerald-500" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900 mb-2">
                Already Accepted
              </h2>
              <p className="text-slate-600 mb-6">
                This invite has already been used.
              </p>
              <Link href={`/projects/${invite.projectId}/overview`}>
                <Button className="gap-2">
                  <FolderOpen className="w-4 h-4" />
                  Open Project
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", damping: 20 }}
        >
          <Card className="max-w-md w-full border-emerald-200 shadow-lg shadow-emerald-100">
            <CardContent className="pt-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", damping: 15 }}
                className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-200"
              >
                <Check className="w-10 h-10 text-white" />
              </motion.div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                Welcome!
              </h2>
              <p className="text-slate-600 mb-2">
                You have joined the project
              </p>
              <p className="text-lg font-semibold text-emerald-700 mb-6">
                {invite?.projectName}
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                Redirecting...
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="max-w-md w-full shadow-xl shadow-blue-100/50">
            <CardHeader className="text-center pb-2">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-200">
                <UserPlus className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl">Project Invite</CardTitle>
              <CardDescription className="text-base">
                You have been invited to collaborate
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-slate-50 rounded-xl space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Project</span>
                  <span className="font-semibold text-slate-900">
                    {invite?.projectName}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Email</span>
                  <span className="font-medium text-slate-700">
                    {invite?.email}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Role</span>
                  <Badge variant="secondary" className="gap-1">
                    <Eye className="w-3 h-3" />
                    Viewer
                  </Badge>
                </div>
              </div>

              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="text-sm text-amber-800">
                  <strong>To accept this invite</strong>, sign in or register with email: <strong>{invite?.email}</strong>
                </p>
              </div>

              <Link href={`/login?redirect=/invite/${token}`} className="block">
                <Button className="w-full gap-2" size="lg">
                  <LogIn className="w-4 h-4" />
                  Sign In to Continue
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Main invite accept view
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="max-w-md w-full shadow-xl shadow-blue-100/50">
          <CardHeader className="text-center pb-2">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: "spring", damping: 15 }}
              className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-200"
            >
              <UserPlus className="w-8 h-8 text-white" />
            </motion.div>
            <CardTitle className="text-2xl">Project Invite</CardTitle>
            <CardDescription className="text-base">
              You have been invited to collaborate
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="p-4 bg-slate-50 rounded-xl space-y-3"
            >
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">Project</span>
                <span className="font-semibold text-slate-900">
                  {invite?.projectName}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">Your email</span>
                <span className="font-medium text-slate-700">
                  {user.email}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">Role</span>
                <Badge variant="secondary" className="gap-1">
                  <Eye className="w-3 h-3" />
                  Viewer
                </Badge>
              </div>
            </motion.div>

            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </motion.div>
            )}

            {user.email?.toLowerCase() !== invite?.email.toLowerCase() && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="text-sm text-amber-800">
                  <strong>Note:</strong> This invite was sent to{" "}
                  <strong>{invite?.email}</strong>, but you are signed in as{" "}
                  <strong>{user.email}</strong>. Please sign in with the correct account.
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <Link href="/projects" className="flex-1">
                <Button variant="outline" className="w-full gap-2">
                  <X className="w-4 h-4" />
                  Decline
                </Button>
              </Link>
              <Button
                onClick={handleAccept}
                disabled={isAccepting || user.email?.toLowerCase() !== invite?.email.toLowerCase()}
                className="flex-1 gap-2"
              >
                {isAccepting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                Accept
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
