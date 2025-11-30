"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { onboardingSchema, OnboardingFormData } from "@/lib/schemas";
import { uploadProjectFiles } from "@/lib/upload-files";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

// Import form components
import { FormField } from "@/components/wizard/FormField";
import { FileUpload } from "@/components/ui/FileUpload";

interface Project {
    id: string;
    name: string;
    status: string;
    onboarding_data: Record<string, unknown>;
}

export default function EditProjectPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = use(params);
    const router = useRouter();
    const [project, setProject] = useState<Project | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
    const supabase = createClient();

    // Convert arrays back to multiline strings for form
    const arrayToMultiline = (arr: string[] | undefined): string => {
        if (!arr || !Array.isArray(arr)) return "";
        return arr.join("\n");
    };

    const methods = useForm<OnboardingFormData>({
        resolver: zodResolver(onboardingSchema),
        mode: "onChange",
    });

    const { handleSubmit, reset } = methods;

    useEffect(() => {
        async function fetchProject() {
            const { data, error } = await supabase
                .from("projects")
                .select("*")
                .eq("id", id)
                .single();

            if (error || !data) {
                console.error("Error fetching project:", error);
                router.push("/projects");
                return;
            }

            setProject(data);

            // Convert stored data back to form format
            const formData = {
                brandName: data.onboarding_data?.brandName || "",
                productService: data.onboarding_data?.productService || "",
                productFormat: data.onboarding_data?.productFormat || "",
                problems: arrayToMultiline(data.onboarding_data?.problems as string[]),
                benefits: arrayToMultiline(data.onboarding_data?.benefits as string[]),
                usp: data.onboarding_data?.usp || "",
                geography: data.onboarding_data?.geography || "",
                businessModel: data.onboarding_data?.businessModel || "B2C",
                priceSegment: data.onboarding_data?.priceSegment || "Mid-Range",
                idealCustomer: data.onboarding_data?.idealCustomer || "",
                competitors: arrayToMultiline(data.onboarding_data?.competitors as string[]),
                differentiation: data.onboarding_data?.differentiation || "",
                notAudience: data.onboarding_data?.notAudience || "",
                additionalContext: data.onboarding_data?.additionalContext || "",
            };

            reset(formData as OnboardingFormData);
            setIsLoading(false);
        }

        fetchProject();
    }, [id, supabase, router, reset]);

    const handleFilesChange = (files: File[]) => {
        setUploadedFiles(files);
    };

    // Helper to convert multiline string to array
    const parseMultilineToArray = (text: string): string[] => {
        return text
            .split("\n")
            .map((line) => line.trim())
            .filter((line) => line.length > 0);
    };

    const onSubmit = async (data: OnboardingFormData) => {
        if (!project) return;

        try {
            setIsSaving(true);

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                toast.error("You must be logged in");
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
                files: (project.onboarding_data?.files as unknown[]) || [],
            };

            // Upload new files if any
            if (uploadedFiles.length > 0) {
                try {
                    const uploadedFileResults = await uploadProjectFiles(
                        supabase,
                        user.id,
                        project.id,
                        uploadedFiles
                    );
                    onboardingData.files = [
                        ...(onboardingData.files as unknown[]),
                        ...uploadedFileResults,
                    ];
                } catch (uploadError) {
                    console.error("File upload failed:", uploadError);
                    toast.error("Files could not be uploaded");
                }
            }

            // Update project
            const { error } = await supabase
                .from("projects")
                .update({
                    name: data.brandName,
                    onboarding_data: onboardingData,
                    status: "draft", // Reset to draft after edit
                    updated_at: new Date().toISOString(),
                })
                .eq("id", project.id);

            if (error) throw error;

            toast.success("Project updated successfully!");
            router.push(`/projects/${project.id}`);
        } catch (error) {
            console.error("Error updating project:", error);
            toast.error("Failed to update project");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-12 w-64" />
                <Skeleton className="h-96 w-full" />
            </div>
        );
    }

    if (!project) {
        return null;
    }

    return (
        <div className="mx-auto max-w-3xl space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href={`/projects/${id}`}>
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">Edit Project</h1>
                    <p className="text-sm text-text-secondary">Update your project details</p>
                </div>
            </div>

            <FormProvider {...methods}>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Step 1: Brand & Product */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Brand & Product</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <FormField
                                name="brandName"
                                label="Brand Name"
                                placeholder="Your brand name"
                            />
                            <FormField
                                name="productService"
                                label="Product/Service Description"
                                type="textarea"
                                placeholder="Describe what you sell..."
                            />
                            <FormField
                                name="productFormat"
                                label="Product Format"
                                placeholder="e.g., SaaS, Physical product, Course..."
                            />
                        </CardContent>
                    </Card>

                    {/* Step 2: Problems & Value */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Problems & Value</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <FormField
                                name="problems"
                                label="Problems You Solve"
                                type="textarea"
                                placeholder="One problem per line..."
                                helperText="List each problem on a new line"
                            />
                            <FormField
                                name="benefits"
                                label="Key Benefits"
                                type="textarea"
                                placeholder="One benefit per line..."
                                helperText="List each benefit on a new line"
                            />
                            <FormField
                                name="usp"
                                label="Unique Selling Proposition (USP)"
                                type="textarea"
                                placeholder="What makes you different..."
                            />
                        </CardContent>
                    </Card>

                    {/* Step 3: Market & Audience */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Market & Audience</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <FormField
                                name="geography"
                                label="Target Geography"
                                placeholder="e.g., USA, Europe, Global..."
                            />
                            <FormField
                                name="businessModel"
                                label="Business Model"
                                type="select"
                                options={[
                                    { value: "B2C", label: "B2C (Business to Consumer)" },
                                    { value: "B2B", label: "B2B (Business to Business)" },
                                    { value: "Both", label: "Both B2B and B2C" },
                                ]}
                            />
                            <FormField
                                name="priceSegment"
                                label="Price Segment"
                                type="select"
                                options={[
                                    { value: "Mass Market", label: "Mass Market" },
                                    { value: "Mid-Range", label: "Mid-Range" },
                                    { value: "Premium", label: "Premium" },
                                ]}
                            />
                            <FormField
                                name="idealCustomer"
                                label="Ideal Customer Description (Optional)"
                                type="textarea"
                                placeholder="Describe your ideal customer..."
                            />
                        </CardContent>
                    </Card>

                    {/* Step 4: Competition */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Competition</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <FormField
                                name="competitors"
                                label="Main Competitors"
                                type="textarea"
                                placeholder="One competitor per line..."
                                helperText="List each competitor on a new line"
                            />
                            <FormField
                                name="differentiation"
                                label="What Makes You Different"
                                type="textarea"
                                placeholder="How do you stand out from competitors..."
                            />
                        </CardContent>
                    </Card>

                    {/* Step 5: Context & Files */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Context & Files</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <FormField
                                name="notAudience"
                                label="Who is NOT Your Audience (Optional)"
                                type="textarea"
                                placeholder="Describe who you don't want to target..."
                                helperText="Help us exclude segments that are not relevant"
                            />
                            <FormField
                                name="additionalContext"
                                label="Additional Context (Optional)"
                                type="textarea"
                                placeholder="Any other relevant information..."
                                helperText="Customer feedback, market insights, etc."
                            />
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Upload Documents (Optional)</label>
                                <p className="text-xs text-text-secondary mb-4">
                                    Add more documents to help with the analysis
                                </p>
                                <FileUpload onFilesChange={handleFilesChange} />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    <div className="flex justify-end gap-4">
                        <Button type="button" variant="outline" asChild>
                            <Link href={`/projects/${id}`}>Cancel</Link>
                        </Button>
                        <Button type="submit" isLoading={isSaving}>
                            <Save className="w-4 h-4 mr-2" />
                            Save Changes
                        </Button>
                    </div>
                </form>
            </FormProvider>
        </div>
    );
}
