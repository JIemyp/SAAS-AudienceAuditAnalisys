"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/Button";
import { StepIndicator } from "@/components/navigation/StepIndicator";
import { onboardingSchema, OnboardingFormData } from "@/lib/schemas";
import { uploadProjectFiles } from "@/lib/upload-files";
import { ArrowLeft, ArrowRight, Save } from "lucide-react";
import { toast } from "sonner";

// Import steps
import { Step1Brand } from "./steps/Step1Brand";
import { Step2Problems } from "./steps/Step2Problems";
import { Step3Audience } from "./steps/Step3Audience";
import { Step4Competition } from "./steps/Step4Competition";
import { Step5Context } from "./steps/Step5Context";

const steps = [
    "Brand & Product",
    "Problems & Value",
    "Market & Audience",
    "Competition",
    "Context & Files",
];

const STORAGE_KEY = "audience-audit-wizard-data";

export function Wizard() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
    const supabase = createClient();

    // Callback for Step5Context to pass files
    const handleFilesChange = (files: File[]) => {
        setUploadedFiles(files);
    };

    // Load initial data from localStorage
    const getInitialData = () => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                try {
                    return JSON.parse(saved);
                } catch (e) {
                    console.error("Error parsing saved wizard data", e);
                }
            }
        }
        return {};
    };

    const methods = useForm<OnboardingFormData>({
        resolver: zodResolver(onboardingSchema),
        mode: "onChange",
        defaultValues: getInitialData(),
    });

    const { handleSubmit, trigger, watch, formState: { isValid } } = methods;
    const formData = watch();

    // Save to localStorage on change
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    }, [formData]);

    const nextStep = async () => {
        let stepValid = false;

        // Validate current step fields
        if (currentStep === 0) {
            stepValid = await trigger(["brandName", "productService", "productFormat"]);
        } else if (currentStep === 1) {
            stepValid = await trigger(["problems", "benefits", "usp"]);
        } else if (currentStep === 2) {
            stepValid = await trigger(["geography", "businessModel", "priceSegment"]);
        } else if (currentStep === 3) {
            stepValid = await trigger(["competitors", "differentiation"]);
        } else {
            stepValid = true;
        }

        if (stepValid) {
            setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
            window.scrollTo(0, 0);
        }
    };

    const prevStep = () => {
        setCurrentStep((prev) => Math.max(prev - 1, 0));
        window.scrollTo(0, 0);
    };

    // Helper to convert multiline string to array
    const parseMultilineToArray = (text: string): string[] => {
        return text
            .split("\n")
            .map((line) => line.trim())
            .filter((line) => line.length > 0);
    };

    const onSubmit = async (data: OnboardingFormData) => {
        try {
            setIsSubmitting(true);

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                toast.error("You must be logged in to save a project");
                return;
            }

            // Convert string fields to arrays for proper storage
            const onboardingData = {
                brandName: data.brandName,
                productService: data.productService,
                productFormat: data.productFormat,
                problems: parseMultilineToArray(data.problems),
                benefits: parseMultilineToArray(data.benefits),
                usp: data.usp,
                geography: data.geography,
                businessModel: data.businessModel,
                priceSegment: data.priceSegment,
                idealCustomer: data.idealCustomer || null,
                competitors: parseMultilineToArray(data.competitors),
                differentiation: data.differentiation,
                notAudience: data.notAudience || null,
                additionalContext: data.additionalContext || null,
                files: [] as { id: string; fileName: string; filePath: string; fileSize: number; expiresAt: string }[],
            };

            // Create project first
            const { data: project, error } = await supabase
                .from("projects")
                .insert({
                    user_id: user.id,
                    name: data.brandName,
                    status: "processing",
                    onboarding_data: onboardingData,
                })
                .select()
                .single();

            if (error) throw error;

            // Upload files if any
            if (uploadedFiles.length > 0) {
                try {
                    const uploadedFileResults = await uploadProjectFiles(
                        supabase,
                        user.id,
                        project.id,
                        uploadedFiles
                    );

                    // Update onboarding_data with file references
                    onboardingData.files = uploadedFileResults;
                    await supabase
                        .from("projects")
                        .update({ onboarding_data: onboardingData })
                        .eq("id", project.id);
                } catch (uploadError) {
                    console.error("File upload failed:", uploadError);
                    toast.error("Files could not be uploaded, but project was created.");
                }
            }

            // Clear local storage
            localStorage.removeItem(STORAGE_KEY);

            toast.success("Project created successfully!");
            router.push(`/projects/${project.id}/processing`);
        } catch (error) {
            console.error("Error creating project:", error);
            toast.error("Failed to create project. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="mx-auto max-w-3xl px-4 py-8">
            <div className="mb-8">
                <StepIndicator steps={steps} currentStep={currentStep} />
            </div>

            <FormProvider {...methods}>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                    <div className="min-h-[400px]">
                        {currentStep === 0 && <Step1Brand />}
                        {currentStep === 1 && <Step2Problems />}
                        {currentStep === 2 && <Step3Audience />}
                        {currentStep === 3 && <Step4Competition />}
                        {currentStep === 4 && <Step5Context onFilesChange={handleFilesChange} />}
                    </div>

                    <div className="flex items-center justify-between border-t border-border pt-6">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={prevStep}
                            disabled={currentStep === 0 || isSubmitting}
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back
                        </Button>

                        {currentStep < steps.length - 1 ? (
                            <Button type="button" onClick={nextStep}>
                                Next Step
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        ) : (
                            <Button type="submit" isLoading={isSubmitting}>
                                <Save className="mr-2 h-4 w-4" />
                                Generate Analysis
                            </Button>
                        )}
                    </div>
                </form>
            </FormProvider>
        </div>
    );
}
