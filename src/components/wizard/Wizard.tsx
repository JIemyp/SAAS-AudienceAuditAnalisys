"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/Button";
import { StepIndicator } from "@/components/navigation/StepIndicator";
import { onboardingSchema, OnboardingFormData } from "@/lib/schemas";
import { uploadProjectFiles } from "@/lib/upload-files";
import { ArrowLeft, ArrowRight, Save } from "lucide-react";
import { toast } from "sonner";
import { OnboardingData } from "@/types";

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
    const searchParams = useSearchParams();
    const cloneFromId = searchParams.get('clone');
    const [currentStep, setCurrentStep] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
    const [isLoadingClone, setIsLoadingClone] = useState(false);
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

    const { handleSubmit, trigger, watch, formState: { isValid }, reset } = methods;
    const formData = watch();

    // Load data from cloned project
    const loadProjectToClone = useCallback(async (projectId: string) => {
        setIsLoadingClone(true);
        try {
            const { data: project, error } = await supabase
                .from('projects')
                .select('onboarding_data, name')
                .eq('id', projectId)
                .single();

            if (error || !project?.onboarding_data) {
                toast.error('Failed to load project for cloning');
                return;
            }

            const data = project.onboarding_data as OnboardingData;
            reset({
                brandName: data.brandName + ' (Copy)',
                productService: data.productService || '',
                productFormat: data.productFormat || '',
                problems: Array.isArray(data.problems) ? data.problems.join('\n') : (data.problems || ''),
                benefits: Array.isArray(data.benefits) ? data.benefits.join('\n') : (data.benefits || ''),
                usp: data.usp || '',
                geography: data.geography || '',
                businessModel: data.businessModel || 'B2C',
                priceSegment: data.priceSegment || 'Mid-Range',
                idealCustomer: data.idealCustomer || '',
                competitors: Array.isArray(data.competitors) ? data.competitors.join('\n') : (data.competitors || ''),
                differentiation: data.differentiation || '',
                notAudience: data.notAudience || '',
                additionalContext: data.additionalContext || '',
            });
            toast.success(`Loaded settings from "${project.name}"`);
        } catch (err) {
            console.error('Error loading project to clone:', err);
            toast.error('Failed to load project');
        } finally {
            setIsLoadingClone(false);
        }
    }, [supabase, reset]);

    // Clone project data if clone param is present
    useEffect(() => {
        if (cloneFromId) {
            // Clear localStorage to prevent mixing with saved data
            localStorage.removeItem(STORAGE_KEY);
            loadProjectToClone(cloneFromId);
        }
    }, [cloneFromId, loadProjectToClone]);

    // Save to localStorage on change (only if not cloning)
    useEffect(() => {
        if (!cloneFromId) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
        }
    }, [formData, cloneFromId]);

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
            {cloneFromId && (
                <div className="mb-4 rounded-md bg-accent/10 border border-accent/30 px-4 py-3 text-sm text-accent">
                    Cloning project settings...
                </div>
            )}
            <div className="mb-8">
                <StepIndicator steps={steps} currentStep={currentStep} />
            </div>

            <FormProvider {...methods}>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                    <div className="min-h-[400px]">
                        {isLoadingClone ? (
                            <div className="flex items-center justify-center h-[400px]">
                                <div className="text-center">
                                    <div className="animate-spin h-8 w-8 border-2 border-accent border-t-transparent rounded-full mx-auto mb-4" />
                                    <p className="text-text-secondary">Loading project data...</p>
                                </div>
                            </div>
                        ) : (
                            <>
                                {currentStep === 0 && <Step1Brand />}
                                {currentStep === 1 && <Step2Problems />}
                                {currentStep === 2 && <Step3Audience />}
                                {currentStep === 3 && <Step4Competition />}
                                {currentStep === 4 && <Step5Context onFilesChange={handleFilesChange} />}
                            </>
                        )}
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
