"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    LayoutDashboard,
    Plus,
    Settings,
    LogOut,
    ChevronDown,
    Copy,
    FilePlus,
    Home,
    FileText,
    Compass,
    Sparkles,
    MessageCircle,
    Target,
    Users,
    AlertCircle,
    Download,
    TrendingUp,
    Video,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { useEffect, useMemo, useState } from "react";
import { usePageAccess } from "@/lib/hooks/usePageAccess";
import { getPageKeyFromSlug } from "@/lib/page-access";

const baseNavigation = [
    { name: "Projects", href: "/projects", icon: LayoutDashboard },
    { name: "Settings", href: "/settings", icon: Settings },
];

const buildProjectSections = () => [
    {
        label: "Project Hub",
        items: [
            { name: "Dashboard", href: "", icon: Home },
            { name: "Overview", href: "/overview", icon: LayoutDashboard },
            { name: "Full Report", href: "/report", icon: FileText },
            { name: "Explorer", href: "/explorer", icon: Compass },
        ],
    },
    {
        label: "Strategy Toolkit",
        items: [
            { name: "Insights", href: "/insights", icon: Sparkles },
            { name: "Communications", href: "/communications", icon: MessageCircle },
            { name: "Playbooks", href: "/playbooks", icon: Target },
            { name: "Strategy", href: "/strategy", icon: TrendingUp },
            { name: "UGC Creators", href: "/ugc-creators", icon: Video },
        ],
    },
    {
        label: "Data & Ops",
        items: [
            { name: "Segments", href: "/segments", icon: Users },
            { name: "Pains", href: "/pains", icon: AlertCircle },
            { name: "Export", href: "/export", icon: Download },
            { name: "Settings", href: "/settings", icon: Settings },
        ],
    },
];

export function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const supabase = createClient();
    const [projectName, setProjectName] = useState<string>("");

    const projectMatch = pathname.match(/\/projects\/([a-f0-9-]+)(?:\/|$)/);
    const currentProjectId = projectMatch ? projectMatch[1] : null;
    const isInProject = currentProjectId && currentProjectId !== "new";
    const projectBaseHref = isInProject ? `/projects/${currentProjectId}` : null;
    const { accessMap, isLoading: accessLoading } = usePageAccess(
        isInProject ? currentProjectId : null
    );

    useEffect(() => {
        if (!projectBaseHref) {
            setProjectName("");
            return;
        }

        let cancelled = false;
        const fetchProject = async () => {
            try {
                const res = await fetch(`/api/projects/${currentProjectId}`);
                const data = await res.json();
                if (!cancelled) {
                    if (data.name) {
                        setProjectName(data.name);
                    } else if (data.project?.name) {
                        setProjectName(data.project.name);
                    } else {
                        setProjectName("Project");
                    }
                }
            } catch (err) {
                console.error("Failed to load project name", err);
                if (!cancelled) {
                    setProjectName("Project");
                }
            }
        };
        fetchProject();
        return () => {
            cancelled = true;
        };
    }, [projectBaseHref, currentProjectId]);

    const projectSections = useMemo(() => {
        if (!projectBaseHref) return [];
        return buildProjectSections();
    }, [projectBaseHref]);

    const filteredProjectSections = useMemo(() => {
        if (!projectSections.length || accessLoading) return projectSections;

        return projectSections
            .map((section) => {
                const items = section.items.filter((item) => {
                    const slug = item.href.replace("/", "");
                    const key = getPageKeyFromSlug(slug);
                    if (!key) return true;
                    return accessMap[key] !== false;
                });
                return { ...section, items };
            })
            .filter((section) => section.items.length > 0);
    }, [projectSections, accessMap, accessLoading]);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push("/login");
    };

    const renderNavigation = () => {
        if (!isInProject || !projectBaseHref) {
            return (
                <nav className="flex flex-1 flex-col gap-y-1">
                    {baseNavigation.map((item) => {
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
                                />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>
            );
        }

        return (
            <div className="flex flex-1 flex-col gap-6 overflow-y-auto">
                <div>
                    <p className="text-xs uppercase tracking-wider text-text-secondary">Current project</p>
                    <p className="mt-1 text-sm font-semibold text-text-primary truncate">
                        {projectName || "Project"}
                    </p>
                </div>
                {filteredProjectSections.map((section) => (
                    <div key={section.label}>
                        <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">
                            {section.label}
                        </p>
                        <div className="space-y-1">
                            {section.items.map((item) => {
                                const href = item.href ? `${projectBaseHref}${item.href}` : projectBaseHref;
                                const isActive =
                                    pathname === href ||
                                    (!!item.href && pathname.startsWith(`${href}/`));

                                return (
                                    <Link
                                        key={item.name}
                                        href={href}
                                        className={cn(
                                            "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                                            isActive
                                                ? "bg-slate-900 text-white"
                                                : "text-text-secondary hover:bg-bg-secondary hover:text-text-primary"
                                        )}
                                    >
                                        <item.icon
                                            className={cn(
                                                "h-4 w-4",
                                                isActive ? "text-white" : "text-text-secondary"
                                            )}
                                        />
                                        <span className="truncate">{item.name}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="flex h-full w-64 flex-col border-r border-border bg-white">
            <div className="flex h-16 items-center border-b border-border px-6">
                <Link href="/projects" className="flex items-center gap-2 font-bold text-xl text-text-primary">
                    <Image
                        src="/images/logo.png"
                        alt="AAA Logo"
                        width={32}
                        height={32}
                        className="h-8 w-8"
                    />
                    AudienceAudit
                </Link>
            </div>

            <div className="flex flex-1 flex-col gap-y-4 p-4">
                {isInProject ? (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button className="w-full justify-between" size="lg">
                                <span className="flex items-center">
                                    <Plus className="mr-2 h-4 w-4" />
                                    New Project
                                </span>
                                <ChevronDown className="h-4 w-4 opacity-70" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-56">
                            <DropdownMenuItem onClick={() => router.push("/projects/new")}>
                                <FilePlus className="mr-2 h-4 w-4" />
                                Start Fresh
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/projects/new?clone=${currentProjectId}`)}>
                                <Copy className="mr-2 h-4 w-4" />
                                Clone This Project
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                ) : (
                    <Button asChild className="w-full justify-start" size="lg">
                        <Link href="/projects/new">
                            <Plus className="mr-2 h-4 w-4" />
                            New Project
                        </Link>
                    </Button>
                )}

                {renderNavigation()}

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
