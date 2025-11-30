"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Plus, Settings, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

const navigation = [
    { name: "Projects", href: "/projects", icon: LayoutDashboard },
    { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const supabase = createClient();

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push("/login");
    };

    return (
        <div className="flex h-full w-64 flex-col border-r border-border bg-white">
            <div className="flex h-16 items-center border-b border-border px-6">
                <Link href="/projects" className="flex items-center gap-2 font-bold text-xl text-text-primary">
                    <div className="h-8 w-8 rounded-lg bg-accent" />
                    AudienceAudit
                </Link>
            </div>

            <div className="flex flex-1 flex-col gap-y-4 p-4">
                <Button asChild className="w-full justify-start" size="lg">
                    <Link href="/projects/new">
                        <Plus className="mr-2 h-4 w-4" />
                        New Project
                    </Link>
                </Button>

                <nav className="flex flex-1 flex-col gap-y-1">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                    "group flex items-center gap-x-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-bg-secondary text-accent"
                                        : "text-text-secondary hover:bg-bg-secondary hover:text-text-primary"
                                )}
                            >
                                <item.icon
                                    className={cn(
                                        "h-5 w-5 shrink-0",
                                        isActive ? "text-accent" : "text-text-secondary group-hover:text-text-primary"
                                    )}
                                    aria-hidden="true"
                                />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                <div className="border-t border-border pt-4">
                    <Button
                        variant="ghost"
                        className="w-full justify-start text-text-secondary hover:text-error"
                        onClick={handleSignOut}
                    >
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign Out
                    </Button>
                </div>
            </div>
        </div>
    );
}
