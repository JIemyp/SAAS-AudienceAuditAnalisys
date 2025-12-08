"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import {
    Settings,
    User,
    Globe,
    LogOut,
    Loader2,
    Mail,
    Calendar,
} from "lucide-react";

interface UserData {
    id: string;
    email: string;
    created_at: string;
}

export default function SettingsPage() {
    const router = useRouter();
    const supabase = createClient();
    const [user, setUser] = useState<UserData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const { language, setLanguage } = useLanguage();

    useEffect(() => {
        async function fetchUser() {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUser({
                    id: user.id,
                    email: user.email || "",
                    created_at: user.created_at,
                });
            }
            setIsLoading(false);
        }
        fetchUser();
    }, [supabase.auth]);

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
