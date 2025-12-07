"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { LanguageProvider } from "@/lib/contexts/LanguageContext";
import { createClient } from "@/lib/supabase";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

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
                    <div className="mx-auto max-w-7xl">{children}</div>
                </main>
            </div>
        </LanguageProvider>
    );
}
