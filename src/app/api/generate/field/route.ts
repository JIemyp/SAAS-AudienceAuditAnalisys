import { NextRequest, NextResponse } from "next/server";
// Increase timeout for AI generation
export const maxDuration = 60;

import { generateWithClaude } from "@/lib/anthropic";
import { createClient } from "@/lib/supabase/server";

// API endpoint for regenerating individual fields with AI
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      projectId,
      segmentId,
      fieldName,
      fieldType, // e.g., "pain", "trigger", "job", "preference"
      currentValue,
      context, // Additional context for regeneration
    } = body;

    if (!projectId || !fieldName || !fieldType) {
      return NextResponse.json(
        { error: "Missing required fields: projectId, fieldName, fieldType" },
        { status: 400 }
      );
    }

    // Get project info for context
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("name, description, product_description")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Get segment info if provided
    let segmentInfo = "";
    if (segmentId) {
      const { data: segment } = await supabase
        .from("segments_final")
        .select("name, description")
        .eq("id", segmentId)
        .single();

      if (segment) {
        segmentInfo = `
Segment: ${segment.name}
Segment Description: ${segment.description}
`;
      }
    }

    // Build prompt based on field type
    const prompts: Record<string, string> = {
      pain_name: `Generate a concise, compelling name for a customer pain point. The name should be 3-6 words and clearly communicate the problem.`,
      pain_description: `Write a detailed description of this customer pain point. Include the emotional impact, frequency of occurrence, and why current solutions fall short. 2-3 sentences.`,
      pain_trigger: `Describe a specific trigger that causes this pain point to become acute. What situation or event makes the customer feel this pain most intensely? 1-2 sentences.`,
      pain_example: `Provide a realistic, specific example of a customer experiencing this pain point. Use concrete details and make it relatable. 1-2 sentences.`,

      trigger_name: `Generate a compelling name for a purchase trigger. The name should be 3-5 words and communicate what drives the decision to buy.`,
      trigger_description: `Describe this purchase trigger in detail. What specific situation, emotion, or realization leads the customer to take action? 2-3 sentences.`,
      trigger_psychological_basis: `Explain the psychological principle behind this trigger. What cognitive bias, emotional driver, or behavioral pattern is at play? 1-2 sentences.`,
      trigger_moment: `Describe the specific moment when this trigger activates. What happens that makes the customer ready to buy right now? 1-2 sentences.`,
      trigger_messaging: `Suggest a messaging angle that leverages this trigger. How should marketing speak to this moment? 1-2 sentences.`,

      job_description: `Describe this Job to Be Done in detail. What is the customer trying to accomplish and why? 2-3 sentences.`,
      job_why_matters: `Explain why this job matters to the customer. What are the stakes? What happens if they fail? 1-2 sentences.`,
      job_how_helps: `Describe how the product helps accomplish this job. Be specific about the solution. 1-2 sentences.`,

      preference_description: `Describe this customer preference in detail. What do they prefer and why? 2-3 sentences.`,

      segment_name: `Generate a memorable, descriptive name for this audience segment. Should be 2-4 words and capture the essence of who they are.`,
      segment_description: `Write a comprehensive description of this audience segment. Include their key characteristics, motivations, and behaviors. 3-4 sentences.`,
      segment_sociodemographics: `Describe the sociodemographic profile of this segment. Include age range, income level, location, education, and other relevant demographics. 2-3 sentences.`,

      default: `Improve and regenerate this content while maintaining its core meaning. Make it more compelling, specific, and actionable.`,
    };

    const fieldPromptKey = `${fieldType}_${fieldName}`.toLowerCase().replace(/\s+/g, "_");
    const basePrompt = prompts[fieldPromptKey] || prompts[fieldType] || prompts.default;

    const systemPrompt = `You are an expert marketing strategist and copywriter specializing in audience research and customer psychology.

Project: ${project.name}
Product: ${project.product_description || project.description}
${segmentInfo}

Your task is to generate high-quality content for a specific field in an audience research tool.

Rules:
- Be specific and avoid generic language
- Use concrete examples and details
- Write in a professional but accessible tone
- Keep the response focused on exactly what's asked
- Do not include labels or field names in your response
- Respond with ONLY the content, no explanations or meta-text`;

    const userPrompt = `${basePrompt}

${context ? `Additional context: ${context}` : ""}
${currentValue ? `Current content to improve: "${currentValue}"` : "Generate fresh content."}

Respond with only the regenerated content, nothing else.`;

    const response = await generateWithClaude({
      prompt: userPrompt,
      systemPrompt,
      maxTokens: 500,
    });

    // Clean up the response
    const cleanedValue = response
      .trim()
      .replace(/^["']|["']$/g, "") // Remove surrounding quotes
      .replace(/^\*\*|\*\*$/g, "") // Remove bold markers
      .trim();

    return NextResponse.json({
      success: true,
      value: cleanedValue,
      fieldName,
      fieldType,
    });
  } catch (error) {
    console.error("[API] Field regeneration error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Generation failed" },
      { status: 500 }
    );
  }
}
