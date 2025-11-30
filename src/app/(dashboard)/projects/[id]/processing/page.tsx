"use client";

import { useEffect, useState, use, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Button } from "@/components/ui/Button";
import { Check, Loader2, X, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

type GenerationStep = "overview" | "segments" | "pains";

interface StepStatus {
  step: GenerationStep;
  label: string;
  status: "pending" | "processing" | "completed" | "failed";
}

export default function ProcessingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = use(params);
  const router = useRouter();

  // Use ref to prevent double execution in Strict Mode
  const hasStarted = useRef(false);

  const [steps, setSteps] = useState<StepStatus[]>([
    { step: "overview", label: "Generating audience overview", status: "pending" },
    { step: "segments", label: "Creating audience segments", status: "pending" },
    { step: "pains", label: "Analyzing pain points", status: "pending" },
  ]);
  const [currentStep, setCurrentStep] = useState<GenerationStep | "completed" | "failed">("overview");
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  const updateStepStatus = (
    step: GenerationStep,
    status: "pending" | "processing" | "completed" | "failed"
  ) => {
    setSteps((prev) =>
      prev.map((s) => (s.step === step ? { ...s, status } : s))
    );
  };

  const runGeneration = async () => {
    setIsRunning(true);
    setError(null);

    // Reset steps
    setSteps([
      { step: "overview", label: "Generating audience overview", status: "pending" },
      { step: "segments", label: "Creating audience segments", status: "pending" },
      { step: "pains", label: "Analyzing pain points", status: "pending" },
    ]);

    try {
      // Step 1: Overview
      setCurrentStep("overview");
      updateStepStatus("overview", "processing");

      const overviewRes = await fetch("/api/generate/overview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });

      if (!overviewRes.ok) {
        const err = await overviewRes.json();
        throw new Error(err.error || "Failed to generate overview");
      }

      updateStepStatus("overview", "completed");

      // Step 2: Segments
      setCurrentStep("segments");
      updateStepStatus("segments", "processing");

      const segmentsRes = await fetch("/api/generate/segments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });

      if (!segmentsRes.ok) {
        const err = await segmentsRes.json();
        throw new Error(err.error || "Failed to generate segments");
      }

      updateStepStatus("segments", "completed");

      // Step 3: Pains
      setCurrentStep("pains");
      updateStepStatus("pains", "processing");

      const painsRes = await fetch("/api/generate/pains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });

      if (!painsRes.ok) {
        const err = await painsRes.json();
        throw new Error(err.error || "Failed to generate pains");
      }

      updateStepStatus("pains", "completed");

      // All done - redirect
      setCurrentStep("completed");
      setTimeout(() => {
        router.push(`/projects/${projectId}/overview`);
      }, 1500);
    } catch (err) {
      console.error("Generation error:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
      setCurrentStep("failed");

      // Mark current step as failed
      setSteps((prev) =>
        prev.map((s) =>
          s.status === "processing" ? { ...s, status: "failed" } : s
        )
      );
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    // Use ref to prevent double execution in React Strict Mode
    if (hasStarted.current) return;
    hasStarted.current = true;

    // Check project status before starting generation
    const checkAndRun = async () => {
      setIsChecking(true);
      try {
        const supabase = createClient();
        const { data: project } = await supabase
          .from("projects")
          .select("status")
          .eq("id", projectId)
          .single();

        if (project?.status === "completed") {
          // Already completed - redirect to results
          router.push(`/projects/${projectId}/overview`);
          return;
        }

        if (project?.status === "processing") {
          // Already processing - show message and don't start new generation
          setError("Generation is already in progress. Please wait or check the results page.");
          setIsChecking(false);
          return;
        }

        // Status is 'draft' or 'failed' - safe to start generation
        setIsChecking(false);
        runGeneration();
      } catch (err) {
        console.error("Failed to check project status:", err);
        setIsChecking(false);
        runGeneration(); // Fallback to running anyway
      }
    };

    checkAndRun();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const completedSteps = steps.filter((s) => s.status === "completed").length;
  const progress = (completedSteps / steps.length) * 100;

  // Show loading while checking status
  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-secondary p-4">
        <Card className="w-full max-w-lg">
          <CardContent className="p-8">
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-accent animate-spin mx-auto mb-4" />
              <p className="text-text-secondary">Checking project status...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-secondary p-4">
      <Card className="w-full max-w-lg">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-text-primary">
              Analyzing Your Audience
            </h1>
            <p className="mt-2 text-sm text-text-secondary">
              This usually takes 2-3 minutes
            </p>
          </div>

          <div className="space-y-4 mb-6">
            {steps.map((step, index) => (
              <div
                key={step.step}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-lg border transition-colors",
                  step.status === "processing"
                    ? "border-accent/30 bg-accent/5"
                    : step.status === "completed"
                    ? "border-success/30 bg-success/5"
                    : step.status === "failed"
                    ? "border-error/30 bg-error/5"
                    : "border-border bg-white"
                )}
              >
                <div className="flex-shrink-0">
                  {step.status === "processing" && (
                    <div className="w-6 h-6 flex items-center justify-center">
                      <Loader2 className="w-5 h-5 text-accent animate-spin" />
                    </div>
                  )}
                  {step.status === "completed" && (
                    <div className="w-6 h-6 bg-success rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                  {step.status === "failed" && (
                    <div className="w-6 h-6 bg-error rounded-full flex items-center justify-center">
                      <X className="w-4 h-4 text-white" />
                    </div>
                  )}
                  {step.status === "pending" && (
                    <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-gray-500 text-xs font-medium">
                        {index + 1}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p
                    className={cn(
                      "font-medium text-sm",
                      step.status === "processing"
                        ? "text-accent"
                        : step.status === "completed"
                        ? "text-success"
                        : step.status === "failed"
                        ? "text-error"
                        : "text-text-secondary"
                    )}
                  >
                    {step.label}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2 mb-6">
            <ProgressBar value={progress} className="h-2" />
            <p className="text-center text-sm text-text-secondary">
              {Math.round(progress)}% complete
            </p>
          </div>

          {error && (
            <div className="p-4 bg-error/10 border border-error/20 rounded-lg mb-4">
              <p className="text-error text-sm font-medium mb-3">{error}</p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={runGeneration}
                  disabled={isRunning}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push("/projects")}
                >
                  Back to Projects
                </Button>
              </div>
            </div>
          )}

          {currentStep === "completed" && (
            <div className="text-center p-4 bg-success/10 border border-success/20 rounded-lg">
              <p className="text-success font-medium">Analysis complete!</p>
              <p className="text-text-secondary text-sm mt-1">
                Redirecting to results...
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
