"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    // Hide sidebar on generation pages (they have their own sidebar)
    const isGeneratePage = pathname.includes("/generate/");

    if (isGeneratePage) {
        // Generation pages handle their own layout
        return <>{children}</>;
    }

    return (
        <div className="flex h-screen overflow-hidden bg-bg-secondary">
            <Sidebar />
            <main className="flex-1 overflow-y-auto p-8">
                <div className="mx-auto max-w-7xl">{children}</div>
            </main>
        </div>
    );
}
