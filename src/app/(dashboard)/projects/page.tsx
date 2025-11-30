"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search, FileText, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Project } from "@/types";
import { formatDistanceToNow } from "date-fns";

export default function ProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const supabase = createClient();

    useEffect(() => {
        async function fetchProjects() {
            try {
                const { data, error } = await supabase
                    .from("projects")
                    .select("*")
                    .order("created_at", { ascending: false });

                if (error) throw error;
                setProjects(data || []);
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
                                <Card className="h-full transition-shadow hover:shadow-md">
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <CardTitle className="line-clamp-1 text-lg">
                                                {project.name}
                                            </CardTitle>
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
