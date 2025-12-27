"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { LanguageProvider } from "@/lib/contexts/LanguageContext";
import { createClient } from "@/lib/supabase";
import { usePageAccess } from "@/lib/hooks/usePageAccess";
import { getPageKeyFromPath } from "@/lib/page-access";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Extract projectId BEFORE any conditional returns to maintain hook order
    const projectMatch = pathname.match(/\/projects\/([a-f0-9-]+)(?:\/|$)/);
    const currentProjectId = projectMatch ? projectMatch[1] : null;
    const { accessMap, isLoading: accessLoading } = usePageAccess(currentProjectId);

    useEffect(() => {
        const checkAuth = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                router.replace("/login");
                return;
            }

            setIsAuthenticated(true);
            setIsLoading(false);
        };

        checkAuth();
    }, [router]);

    if (isLoading || !isAuthenticated) {
        return (
            <div className="flex h-screen items-center justify-center bg-bg-secondary">
                <div className="animate-pulse text-text-secondary">Loading...</div>
            </div>
        );
    }
    const currentPageKey = getPageKeyFromPath(pathname);
    const isRestricted =
        !!currentProjectId &&
        !!currentPageKey &&
        !accessLoading &&
        accessMap[currentPageKey] === false;

    // Hide sidebar on generation pages (they have their own sidebar)
    const isGeneratePage = pathname.includes("/generate/");

    if (isGeneratePage) {
        // Generation pages handle their own layout
        return <LanguageProvider>{children}</LanguageProvider>;
    }

    return (
        <LanguageProvider>
            <div className="flex h-screen overflow-hidden bg-bg-secondary">
                <Sidebar />
                <main className="flex-1 overflow-y-auto p-8">
                    <div className="mx-auto max-w-7xl">
                        {isRestricted ? (
                            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
                                <div className="p-3 rounded-full bg-amber-100 text-amber-600">
                                    <AlertTriangle className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold text-text-primary">Access restricted</h2>
                                    <p className="mt-2 text-text-secondary">
                                        This page is not shared with your role. Ask the project owner to enable it.
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Link href="/projects">
                                        <button className="px-4 py-2 rounded-lg bg-white border border-border text-text-primary hover:bg-bg-secondary">
                                            Back to Projects
                                        </button>
                                    </Link>
                                    {accessMap["ugc-creators"] && currentProjectId && (
                                        <Link href={`/projects/${currentProjectId}/ugc-creators`}>
                                            <button className="px-4 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800">
                                                Go to UGC Creators
                                            </button>
                                        </Link>
                                    )}
                                </div>
                            </div>
                        ) : (
                            children
                        )}
                    </div>
                </main>
            </div>
        </LanguageProvider>
    );
}
