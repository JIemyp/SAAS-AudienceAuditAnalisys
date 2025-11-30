# Audience Research Tool — Backend API Specification

## Overview

This document describes the API endpoints for AI-powered audience generation. The system uses Claude API to analyze onboarding data and generate audience insights in sequential steps.

---

## Environment Setup

Add to `.env.local`:

```env
# Anthropic Claude API
ANTHROPIC_API_KEY=sk-ant-api03-xxxxx  # Get from https://console.anthropic.com/
ANTHROPIC_MODEL=claude-opus-4-20250514
```

Install dependency:

```bash
npm install @anthropic-ai/sdk
```

---

## Architecture

### Generation Flow

```
[Onboarding Submit]
       ↓
[Create Project with status="processing"]
       ↓
[Redirect to /projects/{id}/processing]
       ↓
[Processing Page starts generation sequence]
       ↓
┌──────────────────────────────────────────┐
│  Step 1: POST /api/generate/overview     │
│  → Generates audience overview           │
│  → Saves to audience_overviews table     │
│  → Updates project.status                │
└──────────────────────────────────────────┘
       ↓
┌──────────────────────────────────────────┐
│  Step 2: POST /api/generate/segments     │
│  → Generates 10 segments                 │
│  → Saves to segments table               │
│  → Updates project.status                │
└──────────────────────────────────────────┘
       ↓
┌──────────────────────────────────────────┐
│  Step 3: POST /api/generate/pains        │
│  → Generates pains for each segment      │
│  → Saves to pains table                  │
│  → Updates project.status="completed"    │
└──────────────────────────────────────────┘
       ↓
[Redirect to /projects/{id}/overview]
```

### Project Status Values

| Status | Description |
|--------|-------------|
| `draft` | Project created, onboarding not complete |
| `processing` | Generation in progress |
| `completed` | All generation steps finished |
| `failed` | Error occurred during generation |

---

## File Structure

```
app/
├── api/
│   └── generate/
│       ├── overview/
│       │   └── route.ts
│       ├── segments/
│       │   └── route.ts
│       └── pains/
│           └── route.ts
lib/
├── anthropic.ts          # Claude API client
├── prompts.ts            # All prompts
└── upload-files.ts       # Already exists
```

---

## 1. Claude API Client

### File: `lib/anthropic.ts`

```typescript
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-4-20250514";

export interface GenerateOptions {
  prompt: string;
  maxTokens?: number;
}

export async function generateWithClaude({
  prompt,
  maxTokens = 4096,
}: GenerateOptions): Promise<string> {
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from Claude");
  }

  return textBlock.text;
}

export function parseJSONResponse<T>(response: string): T {
  // Remove markdown code blocks if present
  let cleaned = response.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.slice(0, -3);
  }
  cleaned = cleaned.trim();

  return JSON.parse(cleaned) as T;
}
```

---

## 2. Prompts

### File: `lib/prompts.ts`

```typescript
import { OnboardingData } from "@/types";

// Helper to format uploaded files content
export function formatFilesContext(filesContent: string[]): string {
  if (!filesContent.length) return "";
  
  return `
## Additional Context from Uploaded Documents

${filesContent.map((content, i) => `### Document ${i + 1}\n${content}`).join("\n\n")}
`;
}

// ===========================================
// PROMPT 1: AUDIENCE OVERVIEW
// ===========================================
export function buildOverviewPrompt(
  data: OnboardingData,
  filesContent: string[] = []
): string {
  return `You are an experienced marketing strategist specializing in audience research.

Always respond in English, regardless of input language.

## Context

Brand: ${data.brandName}
Product/Service: ${data.productService}
Product Format: ${data.productFormat}

Problems the product solves:
${data.problems.map((p) => `- ${p}`).join("\n")}

Benefits for customers:
${data.benefits.map((b) => `- ${b}`).join("\n")}

Unique Selling Proposition (USP): ${data.usp}

Target Geography: ${data.geography}
Business Model: ${data.businessModel}
Price Segment: ${data.priceSegment}
${data.idealCustomer ? `Ideal Customer (if known): ${data.idealCustomer}` : ""}

Competitors:
${data.competitors.map((c) => `- ${c}`).join("\n")}

What makes this brand different: ${data.differentiation}
${data.notAudience ? `NOT target audience: ${data.notAudience}` : ""}
${data.additionalContext ? `Additional context: ${data.additionalContext}` : ""}

${formatFilesContext(filesContent)}

## Task

Create a comprehensive target audience portrait for this brand. Follow these steps:

1. Write an initial audience portrait including:
   - Socio-demographic characteristics (age, gender, income, education, location, occupation)
   - Psychographics (lifestyle, values, interests, daily habits)
   - General pain points related to this product category
   - Purchase triggers and motivations

2. Critically analyze your portrait - what would you change or add? Consider edge cases, missing demographics, or oversimplifications.

3. Create the final improved portrait incorporating your improvements.

## Output Format

Return ONLY valid JSON (no markdown, no explanation):

{
  "initial_portrait": {
    "sociodemographics": "Detailed description...",
    "psychographics": "Detailed description...",
    "general_pains": ["Pain 1", "Pain 2", "Pain 3"],
    "purchase_triggers": ["Trigger 1", "Trigger 2", "Trigger 3"]
  },
  "self_review": {
    "what_to_change": ["Change 1", "Change 2"],
    "reasoning": ["Reason 1", "Reason 2"]
  },
  "final_portrait": {
    "sociodemographics": "Improved detailed description...",
    "psychographics": "Improved detailed description...",
    "general_pains": ["Pain 1", "Pain 2", "Pain 3", "Pain 4", "Pain 5"],
    "purchase_triggers": ["Trigger 1", "Trigger 2", "Trigger 3", "Trigger 4"],
    "summary": "2-3 sentence summary of the ideal customer"
  }
}`;
}

// ===========================================
// PROMPT 2: SEGMENTS
// ===========================================
export function buildSegmentsPrompt(
  data: OnboardingData,
  overview: AudienceOverview
): string {
  return `You are an experienced marketing strategist specializing in audience segmentation.

Always respond in English, regardless of input language.

## Context

Brand: ${data.brandName}
Product/Service: ${data.productService}
Price Segment: ${data.priceSegment}
Business Model: ${data.businessModel}

## Audience Overview

Sociodemographics: ${overview.sociodemographics}

Psychographics: ${overview.psychographics}

General Pains:
${overview.general_pains.map((p) => `- ${p}`).join("\n")}

Purchase Triggers:
${overview.triggers.map((t) => `- ${t}`).join("\n")}

## Task

Divide this target audience into 10 distinct segments. For each segment:

1. Give a clear, memorable name
2. Write a detailed description (who they are, their situation)
3. Specify socio-demographics for this segment
4. List their specific needs (what they're looking for)
5. Identify their deep triggers (psychological motivations)
6. Define their core values (what matters most to them)

After creating 10 segments, review them critically:
- Are there overlaps?
- Are any segments too narrow or too broad?
- Are there missing segments?

Then provide the final improved list.

## Output Format

Return ONLY valid JSON:

{
  "initial_segments": [
    {
      "name": "Segment Name",
      "description": "Detailed description...",
      "sociodemographics": "Age, gender, income, etc.",
      "needs": ["Need 1", "Need 2", "Need 3"],
      "triggers": ["Trigger 1", "Trigger 2"],
      "core_values": ["Value 1", "Value 2"]
    }
  ],
  "self_review": {
    "issues_found": ["Issue 1", "Issue 2"],
    "improvements": ["Improvement 1", "Improvement 2"]
  },
  "final_segments": [
    {
      "name": "Segment Name",
      "description": "Detailed description...",
      "sociodemographics": "Age, gender, income, etc.",
      "needs": ["Need 1", "Need 2", "Need 3"],
      "triggers": ["Trigger 1", "Trigger 2"],
      "core_values": ["Value 1", "Value 2"]
    }
  ]
}`;
}

// ===========================================
// PROMPT 3: PAINS FOR SEGMENT
// ===========================================
export function buildPainsPrompt(
  data: OnboardingData,
  segment: Segment
): string {
  return `You are a consumer psychologist specializing in purchase behavior analysis.

Always respond in English, regardless of input language.

## Context

Brand: ${data.brandName}
Product/Service: ${data.productService}

## Target Segment

Name: ${segment.name}
Description: ${segment.description}
Sociodemographics: ${segment.sociodemographics}

Needs:
${segment.needs.map((n) => `- ${n}`).join("\n")}

Deep Triggers:
${segment.triggers.map((t) => `- ${t}`).join("\n")}

Core Values:
${segment.core_values.map((v) => `- ${v}`).join("\n")}

## Task

Identify 6-10 deep psychological pains for this specific segment. These are NOT surface-level problems, but underlying emotional and psychological pain points that drive purchase decisions.

For each pain:
1. Give it a clear name
2. Write a detailed description of the pain
3. Identify the deep triggers (root psychological causes)
4. Provide 2-3 specific real-world examples of how this pain manifests
5. Write an extended analysis exploring different aspects of this pain

Focus on:
- Fear-based pains (fear of missing out, judgment, failure, wasting money)
- Aspiration-based pains (desire for status, belonging, self-improvement, recognition)
- Pain-avoidance (avoiding discomfort, embarrassment, regret, shame)
- Identity-based pains (not feeling like their true self, imposter syndrome)

Be specific and use concrete examples relevant to this segment and product.

## Output Format

Return ONLY valid JSON:

{
  "segment_name": "${segment.name}",
  "pains": [
    {
      "name": "Pain Name",
      "description": "Detailed description of the pain...",
      "deep_triggers": [
        "Root psychological trigger 1",
        "Root psychological trigger 2",
        "Root psychological trigger 3"
      ],
      "examples": [
        "Specific example 1: situation and feeling",
        "Specific example 2: situation and feeling",
        "Specific example 3: situation and feeling"
      ],
      "extended_analysis": "Multi-paragraph deep dive into this pain, exploring emotional aspects, behavioral manifestations, and how it connects to purchase decisions..."
    }
  ]
}`;
}

// Type definitions for prompt responses
export interface OverviewResponse {
  initial_portrait: {
    sociodemographics: string;
    psychographics: string;
    general_pains: string[];
    purchase_triggers: string[];
  };
  self_review: {
    what_to_change: string[];
    reasoning: string[];
  };
  final_portrait: {
    sociodemographics: string;
    psychographics: string;
    general_pains: string[];
    purchase_triggers: string[];
    summary: string;
  };
}

export interface SegmentsResponse {
  initial_segments: SegmentData[];
  self_review: {
    issues_found: string[];
    improvements: string[];
  };
  final_segments: SegmentData[];
}

export interface SegmentData {
  name: string;
  description: string;
  sociodemographics: string;
  needs: string[];
  triggers: string[];
  core_values: string[];
}

export interface PainsResponse {
  segment_name: string;
  pains: PainData[];
}

export interface PainData {
  name: string;
  description: string;
  deep_triggers: string[];
  examples: string[];
  extended_analysis: string;
}

export interface AudienceOverview {
  sociodemographics: string;
  psychographics: string;
  general_pains: string[];
  triggers: string[];
}

export interface Segment {
  id: string;
  name: string;
  description: string;
  sociodemographics: string;
  needs: string[];
  triggers: string[];
  core_values: string[];
}
```

---

## 3. API Endpoints

### 3.1 Generate Overview

#### File: `app/api/generate/overview/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateWithClaude, parseJSONResponse } from "@/lib/anthropic";
import { buildOverviewPrompt, OverviewResponse } from "@/lib/prompts";
import { getFileContent } from "@/lib/upload-files";

export async function POST(request: NextRequest) {
  try {
    const { projectId } = await request.json();

    if (!projectId) {
      return NextResponse.json(
        { error: "projectId is required" },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Get project with onboarding data
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("*, project_files(*)")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Update status
    await supabase
      .from("projects")
      .update({ status: "processing", updated_at: new Date().toISOString() })
      .eq("id", projectId);

    // Get file contents if any
    const filesContent: string[] = [];
    if (project.project_files?.length) {
      for (const file of project.project_files) {
        try {
          const content = await getFileContent(file.file_path);
          if (content) filesContent.push(content);
        } catch (e) {
          console.error(`Failed to read file ${file.file_name}:`, e);
        }
      }
    }

    // Build prompt and generate
    const prompt = buildOverviewPrompt(project.onboarding_data, filesContent);
    const response = await generateWithClaude({ prompt, maxTokens: 4096 });
    const parsed = parseJSONResponse<OverviewResponse>(response);

    // Save to database
    const { data: overview, error: insertError } = await supabase
      .from("audience_overviews")
      .insert({
        project_id: projectId,
        sociodemographics: parsed.final_portrait.sociodemographics,
        psychographics: parsed.final_portrait.psychographics,
        general_pains: parsed.final_portrait.general_pains,
        triggers: parsed.final_portrait.purchase_triggers,
        full_content: JSON.stringify(parsed),
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    return NextResponse.json({
      success: true,
      step: "overview",
      data: overview,
    });

  } catch (error) {
    console.error("Overview generation error:", error);
    
    // Update project status to failed
    const supabase = createClient();
    const { projectId } = await request.json().catch(() => ({}));
    if (projectId) {
      await supabase
        .from("projects")
        .update({ status: "failed" })
        .eq("id", projectId);
    }

    return NextResponse.json(
      { error: "Failed to generate overview", details: String(error) },
      { status: 500 }
    );
  }
}
```

### 3.2 Generate Segments

#### File: `app/api/generate/segments/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateWithClaude, parseJSONResponse } from "@/lib/anthropic";
import { buildSegmentsPrompt, SegmentsResponse } from "@/lib/prompts";

export async function POST(request: NextRequest) {
  try {
    const { projectId } = await request.json();

    if (!projectId) {
      return NextResponse.json(
        { error: "projectId is required" },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Get project and overview
    const { data: project } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();

    const { data: overview } = await supabase
      .from("audience_overviews")
      .select("*")
      .eq("project_id", projectId)
      .single();

    if (!project || !overview) {
      return NextResponse.json(
        { error: "Project or overview not found" },
        { status: 404 }
      );
    }

    // Build prompt and generate
    const prompt = buildSegmentsPrompt(project.onboarding_data, {
      sociodemographics: overview.sociodemographics,
      psychographics: overview.psychographics,
      general_pains: overview.general_pains,
      triggers: overview.triggers,
    });

    const response = await generateWithClaude({ prompt, maxTokens: 8192 });
    const parsed = parseJSONResponse<SegmentsResponse>(response);

    // Save segments to database
    const segmentsToInsert = parsed.final_segments.map((segment, index) => ({
      project_id: projectId,
      order_index: index + 1,
      name: segment.name,
      description: segment.description,
      sociodemographics: segment.sociodemographics,
      needs: segment.needs,
      triggers: segment.triggers,
      core_values: segment.core_values,
    }));

    const { data: segments, error: insertError } = await supabase
      .from("segments")
      .insert(segmentsToInsert)
      .select();

    if (insertError) {
      throw insertError;
    }

    return NextResponse.json({
      success: true,
      step: "segments",
      data: segments,
    });

  } catch (error) {
    console.error("Segments generation error:", error);

    const supabase = createClient();
    const { projectId } = await request.json().catch(() => ({}));
    if (projectId) {
      await supabase
        .from("projects")
        .update({ status: "failed" })
        .eq("id", projectId);
    }

    return NextResponse.json(
      { error: "Failed to generate segments", details: String(error) },
      { status: 500 }
    );
  }
}
```

### 3.3 Generate Pains

#### File: `app/api/generate/pains/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateWithClaude, parseJSONResponse } from "@/lib/anthropic";
import { buildPainsPrompt, PainsResponse } from "@/lib/prompts";

export async function POST(request: NextRequest) {
  try {
    const { projectId } = await request.json();

    if (!projectId) {
      return NextResponse.json(
        { error: "projectId is required" },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Get project and segments
    const { data: project } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();

    const { data: segments } = await supabase
      .from("segments")
      .select("*")
      .eq("project_id", projectId)
      .order("order_index");

    if (!project || !segments?.length) {
      return NextResponse.json(
        { error: "Project or segments not found" },
        { status: 404 }
      );
    }

    // Generate pains for each segment
    const allPains = [];

    for (const segment of segments) {
      const prompt = buildPainsPrompt(project.onboarding_data, {
        id: segment.id,
        name: segment.name,
        description: segment.description,
        sociodemographics: segment.sociodemographics,
        needs: segment.needs,
        triggers: segment.triggers,
        core_values: segment.core_values,
      });

      const response = await generateWithClaude({ prompt, maxTokens: 6144 });
      const parsed = parseJSONResponse<PainsResponse>(response);

      // Prepare pains for insertion
      const painsToInsert = parsed.pains.map((pain) => ({
        segment_id: segment.id,
        name: pain.name,
        description: pain.description,
        deep_triggers: pain.deep_triggers,
        examples: pain.examples,
        extended_analysis: pain.extended_analysis,
      }));

      const { data: insertedPains, error: insertError } = await supabase
        .from("pains")
        .insert(painsToInsert)
        .select();

      if (insertError) {
        throw insertError;
      }

      allPains.push(...(insertedPains || []));
    }

    // Update project status to completed
    await supabase
      .from("projects")
      .update({ status: "completed", updated_at: new Date().toISOString() })
      .eq("id", projectId);

    return NextResponse.json({
      success: true,
      step: "pains",
      data: allPains,
    });

  } catch (error) {
    console.error("Pains generation error:", error);

    const supabase = createClient();
    const { projectId } = await request.json().catch(() => ({}));
    if (projectId) {
      await supabase
        .from("projects")
        .update({ status: "failed" })
        .eq("id", projectId);
    }

    return NextResponse.json(
      { error: "Failed to generate pains", details: String(error) },
      { status: 500 }
    );
  }
}
```

---

## 4. Processing Page Logic

### File: `app/projects/[id]/processing/page.tsx`

```typescript
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type GenerationStep = "overview" | "segments" | "pains" | "completed" | "failed";

interface StepStatus {
  step: GenerationStep;
  label: string;
  status: "pending" | "processing" | "completed" | "failed";
}

export default function ProcessingPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [steps, setSteps] = useState<StepStatus[]>([
    { step: "overview", label: "Generating audience overview", status: "pending" },
    { step: "segments", label: "Creating audience segments", status: "pending" },
    { step: "pains", label: "Analyzing pain points", status: "pending" },
  ]);
  const [currentStep, setCurrentStep] = useState<GenerationStep>("overview");
  const [error, setError] = useState<string | null>(null);

  const updateStepStatus = (
    step: GenerationStep,
    status: "pending" | "processing" | "completed" | "failed"
  ) => {
    setSteps((prev) =>
      prev.map((s) => (s.step === step ? { ...s, status } : s))
    );
  };

  const runGeneration = async () => {
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
    }
  };

  useEffect(() => {
    runGeneration();
  }, [projectId]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full mx-auto p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Analyzing Your Audience
          </h1>
          <p className="text-gray-500">
            This usually takes 2-3 minutes
          </p>
        </div>

        <div className="space-y-4">
          {steps.map((step, index) => (
            <div
              key={step.step}
              className={`flex items-center gap-4 p-4 rounded-lg border ${
                step.status === "processing"
                  ? "border-blue-200 bg-blue-50"
                  : step.status === "completed"
                  ? "border-green-200 bg-green-50"
                  : step.status === "failed"
                  ? "border-red-200 bg-red-50"
                  : "border-gray-200 bg-white"
              }`}
            >
              <div className="flex-shrink-0">
                {step.status === "processing" && (
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                )}
                {step.status === "completed" && (
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
                {step.status === "failed" && (
                  <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                )}
                {step.status === "pending" && (
                  <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-gray-500 text-sm">{index + 1}</span>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className={`font-medium ${
                  step.status === "processing" ? "text-blue-700" :
                  step.status === "completed" ? "text-green-700" :
                  step.status === "failed" ? "text-red-700" :
                  "text-gray-500"
                }`}>
                  {step.label}
                </p>
              </div>
            </div>
          ))}
        </div>

        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
            <button
              onClick={() => router.push("/projects")}
              className="mt-3 text-sm text-red-600 hover:text-red-800 underline"
            >
              Back to Projects
            </button>
          </div>
        )}

        {currentStep === "completed" && (
          <div className="mt-6 text-center">
            <p className="text-green-600 font-medium">Analysis complete!</p>
            <p className="text-gray-500 text-sm">Redirecting to results...</p>
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## 5. API Response Types

### Expected Responses

#### POST /api/generate/overview
```json
{
  "success": true,
  "step": "overview",
  "data": {
    "id": "uuid",
    "project_id": "uuid",
    "sociodemographics": "...",
    "psychographics": "...",
    "general_pains": ["...", "..."],
    "triggers": ["...", "..."],
    "full_content": "{...}",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

#### POST /api/generate/segments
```json
{
  "success": true,
  "step": "segments",
  "data": [
    {
      "id": "uuid",
      "project_id": "uuid",
      "order_index": 1,
      "name": "Segment Name",
      "description": "...",
      "sociodemographics": "...",
      "needs": ["...", "..."],
      "triggers": ["...", "..."],
      "core_values": ["...", "..."],
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### POST /api/generate/pains
```json
{
  "success": true,
  "step": "pains",
  "data": [
    {
      "id": "uuid",
      "segment_id": "uuid",
      "name": "Pain Name",
      "description": "...",
      "deep_triggers": ["...", "..."],
      "examples": ["...", "..."],
      "extended_analysis": "...",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### Error Response
```json
{
  "error": "Error message",
  "details": "Additional details..."
}
```

---

## 6. Testing Checklist

- [ ] Add `ANTHROPIC_API_KEY` to `.env.local`
- [ ] Create all API route files
- [ ] Create `lib/anthropic.ts`
- [ ] Create `lib/prompts.ts`
- [ ] Update processing page
- [ ] Test full flow:
  - [ ] Create new project
  - [ ] Complete onboarding
  - [ ] Watch processing progress
  - [ ] Verify data in Supabase tables
  - [ ] View results on overview page

---

## 7. Important Notes

### Rate Limits
Claude API has rate limits. For production, consider:
- Adding retry logic with exponential backoff
- Queuing requests for multiple simultaneous users

### Timeout Handling
Vercel has 60s timeout for API routes. Current implementation should fit, but monitor:
- Overview: ~30-45s
- Segments: ~45-60s  
- Pains: ~60-90s (loops through 10 segments)

If pains generation times out, consider splitting into separate calls per segment.

### Error Recovery
Currently if generation fails, project status = "failed". Consider adding:
- Retry button on processing page
- Ability to resume from last successful step

---

*Document Version: 1.0*
*Created: November 2024*
