"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search, FileText, Loader2, Crown, Eye } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Project } from "@/types";
import { formatDistanceToNow } from "date-fns";

interface ProjectWithRole extends Project {
    role: "owner" | "viewer";
}

export default function ProjectsPage() {
    const [projects, setProjects] = useState<ProjectWithRole[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const supabase = createClient();

    useEffect(() => {
        async function fetchProjects() {
            try {
                // Get current user
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    setProjects([]);
                    setIsLoading(false);
                    return;
                }

                // 1. Get projects owned by user
                const { data: ownedProjects, error: ownedError } = await supabase
                    .from("projects")
                    .select("*")
                    .eq("user_id", user.id)
                    .order("created_at", { ascending: false });

                if (ownedError) throw ownedError;

                // 2. Get projects where user is a member
                const { data: memberships, error: memberError } = await supabase
                    .from("project_members")
                    .select("project_id")
                    .eq("user_id", user.id);

                if (memberError) throw memberError;

                // 3. Fetch member projects if any
                let memberProjects: Project[] = [];
                if (memberships && memberships.length > 0) {
                    const projectIds = memberships.map(m => m.project_id);
                    const { data: sharedProjects, error: sharedError } = await supabase
                        .from("projects")
                        .select("*")
                        .in("id", projectIds)
                        .order("created_at", { ascending: false });

                    if (sharedError) throw sharedError;
                    memberProjects = sharedProjects || [];
                }

                // 4. Combine and mark roles
                const ownedWithRole: ProjectWithRole[] = (ownedProjects || []).map(p => ({
                    ...p,
                    role: "owner" as const,
                }));

                const memberWithRole: ProjectWithRole[] = memberProjects.map(p => ({
                    ...p,
                    role: "viewer" as const,
                }));

                // Combine, owned first, then shared
                setProjects([...ownedWithRole, ...memberWithRole]);
            } catch (error) {
                console.error("Error fetching projects:", error);
            } finally {
                setIsLoading(false);
            }
        }

        fetchProjects();
    }, [supabase]);

    const filteredProjects = projects.filter((project) =>
        project.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (isLoading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-accent" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-text-primary">Projects</h1>
                    <p className="text-text-secondary">Manage your audience research projects</p>
                </div>
                <Button asChild>
                    <Link href="/projects/new">
                        <Plus className="mr-2 h-4 w-4" />
                        New Project
                    </Link>
                </Button>
            </div>

            {projects.length === 0 ? (
                <EmptyState
                    icon={FileText}
                    title="No projects yet"
                    description="Create your first project to start analyzing your target audience."
                    action={
                        <Button asChild>
                            <Link href="/projects/new">
                                <Plus className="mr-2 h-4 w-4" />
                                Create Project
                            </Link>
                        </Button>
                    }
                />
            ) : (
                <div className="space-y-4">
                    <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
                        <Input
                            placeholder="Search projects..."
                            className="pl-9"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {filteredProjects.map((project) => (
                            <Link key={project.id} href={`/projects/${project.id}`}>
                                <Card className={`h-full transition-shadow hover:shadow-md ${project.role === "viewer" ? "border-l-4 border-l-blue-400" : ""}`}>
                                    <CardHeader>
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-center gap-2 min-w-0">
                                                {project.role === "owner" ? (
                                                    <Crown className="h-4 w-4 text-amber-500 flex-shrink-0" />
                                                ) : (
                                                    <Eye className="h-4 w-4 text-blue-500 flex-shrink-0" />
                                                )}
                                                <CardTitle className="line-clamp-1 text-lg">
                                                    {project.name}
                                                </CardTitle>
                                            </div>
                                            <div className="flex gap-1 flex-shrink-0">
                                                {project.role === "viewer" && (
                                                    <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs">
                                                        Shared
                                                    </Badge>
                                                )}
                                                <Badge
                                                    variant={
                                                        project.status === "completed"
                                                            ? "success"
                                                            : project.status === "processing"
                                                                ? "warning"
                                                                : "secondary"
                                                    }
                                                >
                                                    {project.status}
                                                </Badge>
                                            </div>
                                        </div>
                                        <CardDescription>
                                            Created {formatDistanceToNow(new Date(project.created_at), { addSuffix: true })}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="line-clamp-2 text-sm text-text-secondary">
                                            {project.onboarding_data.productService}
                                        </p>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
