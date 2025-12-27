"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Loader2 } from "lucide-react";

interface BatchActionsPanelProps {
  projectId: string;
}

export function BatchActionsPanel({ projectId }: BatchActionsPanelProps) {
  const [runningAction, setRunningAction] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runAction = async (actionId: string, endpoint: string, body: Record<string, unknown>) => {
    try {
      setRunningAction(actionId);
      setError(null);
      setMessage(null);
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || data?.success === false) {
        throw new Error(data.error || "Action failed");
      }
      setMessage(data.message || "Action completed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setRunningAction(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Batch Actions</CardTitle>
        <CardDescription>Quality-first bulk operations for common gaps.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            disabled={!!runningAction}
            onClick={() =>
              runAction("approve-canvas", "/api/approve/canvas-approve-all", { projectId })
            }
            className="gap-2"
          >
            {runningAction === "approve-canvas" && <Loader2 className="w-4 h-4 animate-spin" />}
            Approve all canvas drafts
          </Button>
          <Button
            variant="outline"
            disabled={!!runningAction}
            onClick={() =>
              runAction("generate-canvas-missing", "/api/generate/canvas-missing", { projectId })
            }
            className="gap-2"
          >
            {runningAction === "generate-canvas-missing" && <Loader2 className="w-4 h-4 animate-spin" />}
            Generate missing canvas
          </Button>
          <Button
            variant="outline"
            disabled={!!runningAction}
            onClick={() =>
              runAction("regenerate-canvas", "/api/generate/canvas-regenerate-all", { projectId })
            }
            className="gap-2"
          >
            {runningAction === "regenerate-canvas" && <Loader2 className="w-4 h-4 animate-spin" />}
            Regenerate all canvas
          </Button>
        </div>
        {message && <p className="text-sm text-emerald-600">{message}</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </CardContent>
    </Card>
  );
}
