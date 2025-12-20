// =====================================================
// Increase timeout for AI generation
export const maxDuration = 60;

// Generate Strategy Global - V6 MODULE (Per Project)
// Creates brand-wide comms strategy (email, SMS, messenger, social, banners, traffic)
// =====================================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireWriteAccess } from "@/lib/permissions";
import { generateWithAI, parseJSONResponse } from "@/lib/ai-client";
import { handleApiError, ApiError, withRetry } from "@/lib/api-utils";
import { Project, OnboardingData, StrategyGlobal } from "@/types";

// Response type matching PROMPTS_V6.md
interface StrategyGlobalResponse {
  email_strategy: {
    sequence_overview: string;
    cadence: string;
    key_emails: Array<{
      name: string;
      purpose: string;
      subject_line: string;
      key_content: string;
    }>;
    segmentation_logic: string;
  };
  sms_strategy: {
    use_cases: string[];
    timing: string;
    message_templates: string[];
    compliance_notes: string;
  };
  messenger_strategy: {
    platforms: string[];
    automation_flows: string[];
    response_templates: string[];
  };
  social_strategy: {
    platforms: string[];
    content_pillars: string[];
    posting_cadence: Record<string, string>;
    engagement_tactics: string[];
  };
  tof_banners: {
    formats: string[];
    themes: string[];
    targeting_approach: string;
    creative_guidelines: string[];
  };
  traffic_channels: {
    organic: string[];
    paid: string[];
    partnerships: string[];
    recommended_priority: string[];
  };
}

function buildStrategyGlobalPrompt(
  onboarding: OnboardingData,
  research: Record<string, unknown>,
  v5: Record<string, unknown>
): string {
  return `You are a senior brand strategist. Create a brand-wide comms strategy in strict JSON.

## Global Output Rules
1. Return ONLY JSON. No markdown, no comments, no prose outside JSON.
2. Use double quotes for all keys and string values.
3. Do NOT include unescaped line breaks inside strings. Use "\\n" if needed.
4. No trailing commas.
5. Prefer bullet-like sentences, avoid long paragraphs.
6. Output language: English.

## Business Context
- Brand: ${onboarding.brandName || "N/A"}
- Product/Service: ${onboarding.productService || "N/A"}
- Product Format: ${onboarding.productFormat || "N/A"}
- USP: ${onboarding.usp || "N/A"}
- Business Model: ${onboarding.businessModel || "N/A"}
- Price Segment: ${onboarding.priceSegment || "N/A"}
- Geography: ${onboarding.geography || "N/A"}

## Research (aggregated)
${JSON.stringify(research, null, 2)}

## V5 Modules (aggregated)
${JSON.stringify(v5, null, 2)}

## Your Task
Generate a brand-wide communication strategy covering:
1) Email strategy with 6 key emails
2) SMS strategy with 6 message templates
3) Messenger strategy with 4 automation flows
4) Social strategy with 5 content pillars
5) TOF banners with 5 themes
6) Traffic channels with 5 priority recommendations

## REQUIRED JSON OUTPUT:
{
  "email_strategy": {
    "sequence_overview": "string",
    "cadence": "string",
    "key_emails": [
      {
        "name": "string",
        "purpose": "string",
        "subject_line": "string",
        "key_content": "string"
      }
    ],
    "segmentation_logic": "string"
  },
  "sms_strategy": {
    "use_cases": ["string"],
    "timing": "string",
    "message_templates": ["string"],
    "compliance_notes": "string"
  },
  "messenger_strategy": {
    "platforms": ["string"],
    "automation_flows": ["string"],
    "response_templates": ["string"]
  },
  "social_strategy": {
    "platforms": ["string"],
    "content_pillars": ["string"],
    "posting_cadence": {
      "instagram": "2 posts/day",
      "tiktok": "1 post/day"
    },
    "engagement_tactics": ["string"]
  },
  "tof_banners": {
    "formats": ["string"],
    "themes": ["string"],
    "targeting_approach": "string",
    "creative_guidelines": ["string"]
  },
  "traffic_channels": {
    "organic": ["string"],
    "paid": ["string"],
    "partnerships": ["string"],
    "recommended_priority": ["string"]
  }
}

## MINIMUM REQUIREMENTS:
- key_emails: 6 items
- sms_strategy.message_templates: 6 items
- messenger_strategy.automation_flows: 4 items
- social_strategy.content_pillars: 5 items
- tof_banners.themes: 5 items
- traffic_channels.recommended_priority: 5 items

Return ONLY valid JSON. No markdown, no explanations.`;
}

export async function POST(request: NextRequest) {
  try {
    const { projectId } = await request.json();

    if (!projectId) {
      throw new ApiError("Project ID is required", 400);
    }

    const supabase = await createServerClient();
    const adminSupabase = createAdminClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new ApiError("Unauthorized", 401);
    }

    await requireWriteAccess(supabase, adminSupabase, projectId, user.id);

    // Get project
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      throw new ApiError("Project not found", 404);
    }

    const typedProject = project as Project;

    // Gather aggregated research and V5 data
    const [
      { data: segments },
      { data: channelStrategy },
      { data: competitiveIntelligence },
      { data: trustFramework },
      { data: portrait },
    ] = await Promise.all([
      supabase.from("segments").select("id, name, description").eq("project_id", projectId),
      supabase.from("channel_strategy").select("*").eq("project_id", projectId).limit(5),
      supabase.from("competitive_intelligence").select("*").eq("project_id", projectId).order("approved_at", { ascending: false }).limit(1).single(),
      supabase.from("trust_framework").select("*").eq("project_id", projectId).order("approved_at", { ascending: false }).limit(1).single(),
      supabase.from("portrait_final").select("*").eq("project_id", projectId).order("approved_at", { ascending: false }).limit(1).single(),
    ]);

    const research = {
      segments: segments || [],
      portrait: portrait || null,
    };

    const v5 = {
      channel_strategy: channelStrategy || [],
      competitive_intelligence: competitiveIntelligence || null,
      trust_framework: trustFramework || null,
    };

    const prompt = buildStrategyGlobalPrompt(
      typedProject.onboarding_data,
      research,
      v5
    );

    const response = await withRetry(async () => {
      const text = await generateWithAI({ prompt, maxTokens: 5000, userId: user.id });
      return parseJSONResponse<StrategyGlobalResponse>(text);
    });

    // Check existing draft
    const { data: existingDraft } = await supabase
      .from("strategy_global_drafts")
      .select("id")
      .eq("project_id", projectId)
      .single();

    if (existingDraft) {
      const { data: draft, error: updateError } = await supabase
        .from("strategy_global_drafts")
        .update({
          email_strategy: response.email_strategy,
          sms_strategy: response.sms_strategy,
          messenger_strategy: response.messenger_strategy,
          social_strategy: response.social_strategy,
          tof_banners: response.tof_banners,
          traffic_channels: response.traffic_channels,
          version: 1,
        })
        .eq("id", existingDraft.id)
        .select()
        .single();

      if (updateError) {
        throw new ApiError("Failed to update draft", 500);
      }

      return NextResponse.json({ success: true, draft, updated: true });
    }

    const { data: draft, error: insertError } = await supabase
      .from("strategy_global_drafts")
      .insert({
        project_id: projectId,
        email_strategy: response.email_strategy,
        sms_strategy: response.sms_strategy,
        messenger_strategy: response.messenger_strategy,
        social_strategy: response.social_strategy,
        tof_banners: response.tof_banners,
        traffic_channels: response.traffic_channels,
        version: 1,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      throw new ApiError("Failed to save draft", 500);
    }

    return NextResponse.json({ success: true, draft });
  } catch (error) {
    return handleApiError(error);
  }
}
