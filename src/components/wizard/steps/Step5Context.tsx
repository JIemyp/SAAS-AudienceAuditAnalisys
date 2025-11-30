"use client";

import { FormField } from "../FormField";
import { FileUpload } from "@/components/ui/FileUpload";

interface Step5ContextProps {
    onFilesChange: (files: File[]) => void;
}

export function Step5Context({ onFilesChange }: Step5ContextProps) {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-text-primary">Context & Files</h2>
                <p className="mt-2 text-sm text-text-secondary">
                    Add any additional context that might help us understand your audience better.
                </p>
            </div>

            <FormField
                name="notAudience"
                label="Who is NOT Your Audience"
                type="textarea"
                placeholder="Not targeting: bodybuilders, budget-conscious shoppers, people who prefer pills over food, children"
                helperText="Help us exclude segments that are not relevant to your business."
            />

            <FormField
                name="additionalContext"
                label="Additional Context"
                type="textarea"
                placeholder="We've done 50 customer interviews. Main feedback: love the taste, wish shipping was faster. Most customers found us through TikTok."
                helperText="Any other information that might be relevant for audience analysis."
            />

            <div className="space-y-2">
                <label className="text-sm font-medium">Upload Documents (Optional)</label>
                <p className="text-xs text-text-secondary mb-4">
                    Upload any relevant documents that might help with the analysis (customer feedback, surveys, market research).
                </p>
                <FileUpload onFilesChange={onFilesChange} />
            </div>
        </div>
    );
}
