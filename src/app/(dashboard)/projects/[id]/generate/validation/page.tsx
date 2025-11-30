"use client";

import { use } from "react";
import {
  GenerationPage,
  DraftCard,
  DraftSection,
  DraftField,
} from "@/components/generation/GenerationPage";
import { ValidationDraft } from "@/types";
import { ClipboardCheck, CheckCircle2, HelpCircle, Lightbulb } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

export default function ValidationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = use(params);

  return (
    <GenerationPage<ValidationDraft>
      projectId={projectId}
      title="Product Validation"
      description="Let AI confirm its understanding of your product before generating the audience portrait. This ensures accuracy in all subsequent analysis."
      generateEndpoint="/api/generate/validation"
      approveEndpoint="/api/approve/validation"
      draftTable="validation_drafts"
      nextStepUrl="/generate/portrait"
      icon={<ClipboardCheck className="w-6 h-6" />}
      emptyStateMessage="Click Generate to have AI validate its understanding of your product and target audience."
      renderDraft={(draft, onEdit) => (
        <ValidationDraftView draft={draft} onEdit={onEdit} />
      )}
    />
  );
}

function ValidationDraftView({
  draft,
  onEdit,
}: {
  draft: ValidationDraft;
  onEdit: (updates: Partial<ValidationDraft>) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Understanding Status Card */}
      <Card className={cn(
        "border-2",
        draft.understanding_correct
          ? "border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100/50"
          : "border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100/50"
      )}>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-14 h-14 rounded-2xl flex items-center justify-center",
              draft.understanding_correct
                ? "bg-emerald-500 text-white"
                : "bg-amber-500 text-white"
            )}>
              {draft.understanding_correct ? (
                <CheckCircle2 className="w-7 h-7" />
              ) : (
                <HelpCircle className="w-7 h-7" />
              )}
            </div>
            <div>
              <h3 className={cn(
                "text-lg font-semibold",
                draft.understanding_correct ? "text-emerald-800" : "text-amber-800"
              )}>
                {draft.understanding_correct
                  ? "AI Understanding Confirmed"
                  : "Clarification May Be Needed"}
              </h3>
              <p className={cn(
                "text-sm mt-0.5",
                draft.understanding_correct ? "text-emerald-600" : "text-amber-600"
              )}>
                {draft.understanding_correct
                  ? "The AI has correctly understood your product and target audience"
                  : "Review the analysis below and provide additional context if needed"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Analysis Cards */}
      <div className="grid gap-6">
        <DraftCard>
          <DraftSection
            title="What Your Brand Sells"
            icon={<Lightbulb className="w-5 h-5" />}
            color="blue"
          >
            <DraftField
              label="Product/Service Description"
              value={draft.what_brand_sells}
              editable
              type="textarea"
              onEdit={(value) => onEdit({ what_brand_sells: value })}
            />
          </DraftSection>
        </DraftCard>

        <DraftCard>
          <DraftSection
            title="Problem Solved"
            icon={<CheckCircle2 className="w-5 h-5" />}
            color="emerald"
          >
            <DraftField
              label="Core Problem Your Product Addresses"
              value={draft.problem_solved}
              editable
              type="textarea"
              onEdit={(value) => onEdit({ problem_solved: value })}
            />
          </DraftSection>
        </DraftCard>

        <DraftCard>
          <DraftSection
            title="Key Differentiator"
            icon={<Lightbulb className="w-5 h-5" />}
            color="purple"
          >
            <DraftField
              label="What Sets You Apart"
              value={draft.key_differentiator}
              editable
              type="textarea"
              onEdit={(value) => onEdit({ key_differentiator: value })}
            />
          </DraftSection>
        </DraftCard>

        {draft.clarification_needed && (
          <DraftCard>
            <DraftSection
              title="Clarification Needed"
              icon={<HelpCircle className="w-5 h-5" />}
              color="orange"
            >
              <DraftField
                label="AI Requests More Information On"
                value={draft.clarification_needed}
                type="textarea"
              />
            </DraftSection>
          </DraftCard>
        )}
      </div>
    </div>
  );
}
