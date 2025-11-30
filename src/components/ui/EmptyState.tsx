import * as React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
    icon?: LucideIcon;
    title: string;
    description: string;
    action?: React.ReactNode;
    className?: string;
}

export function EmptyState({
    icon: Icon,
    title,
    description,
    action,
    className,
}: EmptyStateProps) {
    return (
        <div
            className={cn(
                "flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed border-border bg-bg-secondary/50 p-8 text-center animate-in fade-in-50",
                className
            )}
        >
            {Icon && (
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-bg-secondary">
                    <Icon className="h-6 w-6 text-text-secondary" />
                </div>
            )}
            <h3 className="mb-2 text-lg font-semibold text-text-primary">{title}</h3>
            <p className="mb-6 max-w-sm text-sm text-text-secondary">{description}</p>
            {action}
        </div>
    );
}
