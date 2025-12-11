import Anthropic from "@anthropic-ai/sdk";

// Use alias for stability (claude-sonnet-4-0 points to latest claude-sonnet-4)
// Fallback to Sonnet 4.5 which is the recommended model
export const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5-20250929";

export interface GenerateOptions {
  prompt: string;
  maxTokens?: number;
  systemPrompt?: string;
}

/**
 * Generate with Claude using SYSTEM API key (default)
 * For user-specific settings, use generateWithAI from @/lib/ai-client
 *
 * @deprecated Use generateWithAI from @/lib/ai-client for new code
 */
export async function generateWithClaude({
  prompt,
  maxTokens = 4096,
  systemPrompt,
}: GenerateOptions): Promise<string> {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    ...(systemPrompt && { system: systemPrompt }),
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
