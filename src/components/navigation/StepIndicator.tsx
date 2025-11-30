import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface StepIndicatorProps {
    steps: string[];
    currentStep: number;
    className?: string;
}

export function StepIndicator({
    steps,
    currentStep,
    className,
}: StepIndicatorProps) {
    return (
        <div className={cn("w-full", className)}>
            <div className="relative flex items-center justify-between">
                {/* Progress Bar Background */}
                <div className="absolute left-0 top-1/2 h-0.5 w-full -translate-y-1/2 bg-gray-200" />

                {/* Active Progress Bar */}
                <div
                    className="absolute left-0 top-1/2 h-0.5 -translate-y-1/2 bg-accent transition-all duration-300"
                    style={{
                        width: `${(currentStep / (steps.length - 1)) * 100}%`,
                    }}
                />

                {steps.map((step, index) => {
                    const isCompleted = index < currentStep;
                    const isCurrent = index === currentStep;

                    return (
                        <div
                            key={step}
                            className="relative z-10 flex flex-col items-center"
                        >
                            <div
                                className={cn(
                                    "flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors duration-300",
                                    isCompleted
                                        ? "border-accent bg-accent text-white"
                                        : isCurrent
                                            ? "border-accent bg-white text-accent"
                                            : "border-gray-200 bg-white text-gray-400"
                                )}
                            >
                                {isCompleted ? (
                                    <Check className="h-4 w-4" />
                                ) : (
                                    <span className="text-sm font-medium">{index + 1}</span>
                                )}
                            </div>
                            <span
                                className={cn(
                                    "absolute -bottom-6 w-32 text-center text-xs font-medium transition-colors duration-300",
                                    isCurrent ? "text-accent" : "text-gray-500"
                                )}
                            >
                                {step}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
