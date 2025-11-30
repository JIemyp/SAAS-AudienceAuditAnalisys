import { z } from "zod";

export const step1Schema = z.object({
    brandName: z.string().min(1, "Brand name is required"),
    productService: z.string().min(10, "Please describe your product in at least 10 characters"),
    productFormat: z.string().min(1, "Product format is required"),
});

export const step2Schema = z.object({
    problems: z.string().min(1, "Please list at least one problem"),
    benefits: z.string().min(1, "Please list at least one benefit"),
    usp: z.string().min(1, "USP is required"),
});

export const step3Schema = z.object({
    geography: z.string().min(1, "Target geography is required"),
    businessModel: z.enum(["B2C", "B2B", "Both"], {
        message: "Please select a business model",
    }),
    priceSegment: z.enum(["Mass Market", "Mid-Range", "Premium"], {
        message: "Please select a price segment",
    }),
    idealCustomer: z.string().optional(),
});

export const step4Schema = z.object({
    competitors: z.string().min(1, "Please list at least one competitor"),
    differentiation: z.string().min(1, "Please explain what makes you different"),
});

export const step5Schema = z.object({
    notAudience: z.string().optional(),
    additionalContext: z.string().optional(),
    // Files are handled separately or as a custom field
});

export const onboardingSchema = step1Schema
    .merge(step2Schema)
    .merge(step3Schema)
    .merge(step4Schema)
    .merge(step5Schema);

export type OnboardingFormData = z.infer<typeof onboardingSchema>;
