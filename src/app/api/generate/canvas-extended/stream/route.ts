// Generate Canvas Extended V2 - Streaming Edge Version
// Uses Edge Runtime to bypass Vercel Free 10s limit
import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

// Use Edge Runtime - no timeout limits
export const runtime = "edge";

// Types for the response
interface CanvasExtendedV2Response {
  customer_journey: Record<string, unknown>;
  emotional_map: Record<string, unknown>;
  narrative_angles: Record<string, unknown>;
  messaging_framework: Record<string, unknown>;
  voice_and_tone: Record<string, unknown>;
}

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();

  try {
    const { projectId, segmentId, painId, userId, settings } = await request.json();

    if (!projectId) {
      return new Response(JSON.stringify({ error: "Project ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (!segmentId) {
      return new Response(JSON.stringify({ error: "Segment ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (!userId) {
      return new Response(JSON.stringify({ error: "User ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Create Supabase client with service role for edge
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Verify user owns the project
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("*, onboarding_data")
      .eq("id", projectId)
      .eq("user_id", userId)
      .single();

    if (projectError || !project) {
      return new Response(JSON.stringify({ error: "Project not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Fetch all required data in parallel
    const [
      { data: segment },
      { data: segmentDetails },
      { data: jobs },
      { data: triggers },
      { data: preferences },
      { data: difficulties },
      { data: portraitFinal },
    ] = await Promise.all([
      supabase.from("segments").select("*").eq("id", segmentId).eq("project_id", projectId).single(),
      supabase.from("segment_details").select("*").eq("segment_id", segmentId).single(),
      supabase.from("jobs").select("*").eq("segment_id", segmentId).single(),
      supabase.from("triggers").select("*").eq("segment_id", segmentId).single(),
      supabase.from("preferences").select("*").eq("segment_id", segmentId).single(),
      supabase.from("difficulties").select("*").eq("segment_id", segmentId).single(),
      supabase.from("portrait_final").select("*").eq("project_id", projectId).order("approved_at", { ascending: false }).limit(1).single(),
    ]);

    if (!segment) {
      return new Response(JSON.stringify({ error: "Segment not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get pain
    const { data: pain } = await supabase
      .from("pains_initial")
      .select("*")
      .eq("id", painId)
      .eq("segment_id", segmentId)
      .single();

    if (!pain) {
      return new Response(JSON.stringify({ error: "Pain not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if this is a TOP pain
    const { data: rankingCheck } = await supabase
      .from("pains_ranking")
      .select("is_top_pain")
      .eq("project_id", projectId)
      .eq("segment_id", segmentId)
      .eq("pain_id", painId)
      .single();

    if (!rankingCheck || rankingCheck.is_top_pain !== true) {
      return new Response(JSON.stringify({ error: "This pain is not marked as TOP. Mark it as TOP first." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get canvas for this pain (try approved first, fallback to draft)
    let canvas = null;
    const { data: approvedCanvas } = await supabase
      .from("canvas")
      .select("*")
      .eq("pain_id", painId)
      .eq("project_id", projectId)
      .single();

    if (approvedCanvas) {
      canvas = approvedCanvas;
    } else {
      const { data: draftCanvas } = await supabase
        .from("canvas_drafts")
        .select("*")
        .eq("pain_id", painId)
        .eq("project_id", projectId)
        .single();
      if (draftCanvas) {
        canvas = draftCanvas;
      }
    }

    if (!canvas) {
      return new Response(JSON.stringify({ error: "Canvas not found for this pain. Complete canvas analysis first." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if draft already exists
    const { data: existingDraft } = await supabase
      .from("canvas_extended_drafts")
      .select("id")
      .eq("project_id", projectId)
      .eq("pain_id", painId)
      .single();

    if (existingDraft) {
      return new Response(JSON.stringify({ error: "Draft already exists", existingDraftId: existingDraft.id }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const onboarding = project.onboarding_data;

    // Build compact prompt (minimal but sufficient)
    const systemPrompt = `You are an expert consumer psychologist. Create a psychological analysis and messaging framework for a pain point.
Return ONLY valid JSON, no markdown.`;

    const userPrompt = buildCompactPrompt({
      onboarding,
      segment,
      segmentDetails,
      jobs,
      triggers,
      preferences,
      difficulties,
      portraitFinal,
      pain,
      canvas,
    });

    // Get API key
    const apiKey = settings?.apiKey || process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "No API key configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Create streaming response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const anthropic = new Anthropic({ apiKey });

          // Use streaming API
          const streamResponse = await anthropic.messages.create({
            model: settings?.model || "claude-sonnet-4-5-20250929",
            max_tokens: 4096,
            system: systemPrompt,
            messages: [{ role: "user", content: userPrompt }],
            stream: true,
          });

          let fullText = "";

          for await (const event of streamResponse) {
            if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
              const text = event.delta.text;
              fullText += text;
              // Send chunk to client
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk: text })}\n\n`));
            }
          }

          // Parse the complete response
          let parsed: CanvasExtendedV2Response;
          try {
            let cleaned = fullText.trim();
            if (cleaned.startsWith("```json")) cleaned = cleaned.slice(7);
            else if (cleaned.startsWith("```")) cleaned = cleaned.slice(3);
            if (cleaned.endsWith("```")) cleaned = cleaned.slice(0, -3);
            cleaned = cleaned.trim();
            parsed = JSON.parse(cleaned);
          } catch {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: "Failed to parse AI response" })}\n\n`));
            controller.close();
            return;
          }

          // Save to database
          const { data: draft, error: insertError } = await supabase
            .from("canvas_extended_drafts")
            .insert({
              project_id: projectId,
              segment_id: segmentId,
              pain_id: painId,
              customer_journey: parsed.customer_journey,
              emotional_map: parsed.emotional_map,
              narrative_angles: parsed.narrative_angles,
              messaging_framework: parsed.messaging_framework,
              voice_and_tone: parsed.voice_and_tone,
              version: 1,
            })
            .select()
            .single();

          if (insertError) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: `Failed to save: ${insertError.message}` })}\n\n`));
          } else {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, draft })}\n\n`));
          }

          controller.close();
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : "Unknown error";
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: errorMessage })}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// Compact prompt builder - simplified for faster generation
function buildCompactPrompt(input: {
  onboarding: { brandName: string; productService: string; problems: string[]; usp: string; priceSegment: string };
  segment: { name: string; description: string; sociodemographics: string };
  segmentDetails: { needs?: { need: string; intensity: number }[]; core_values?: { value: string; manifestation: string }[]; awareness_level?: string; objections?: { objection: string; root_cause: string }[] } | null;
  jobs: { functional_jobs: { job: string; why_it_matters: string }[]; emotional_jobs: { job: string; why_it_matters: string }[]; social_jobs: { job: string; why_it_matters: string }[] } | null;
  triggers: { triggers: { name: string; description: string; psychological_basis: string; trigger_moment: string }[] } | null;
  preferences: { preferences?: { name: string; description: string; importance: string; reasoning: string }[] } | null;
  difficulties: { difficulties?: { name: string; description: string; frequency: string; emotional_impact: string }[] } | null;
  portraitFinal: { sociodemographics?: string; psychographics?: string } | null;
  pain: { name: string; description: string; deep_triggers: string[]; examples: string[] };
  canvas: { emotional_aspects: { emotion: string; intensity: string; description: string; self_image_impact: string; connected_fears: string[]; blocked_desires: string[] }[]; behavioral_patterns: { pattern: string; description: string; coping_mechanism: string; avoidance: string }[]; buying_signals: { signal: string; readiness_level: string; messaging_angle: string; proof_needed: string }[] };
}): string {
  const { onboarding, segment, pain, canvas } = input;

  return `# Product
Brand: ${onboarding.brandName}
Product: ${onboarding.productService}
USP: ${onboarding.usp}

# Segment: ${segment.name}
${segment.description}

# Pain Point: ${pain.name}
${pain.description}

Triggers: ${pain.deep_triggers.slice(0, 3).join("; ")}

# Canvas Analysis
Emotions: ${canvas.emotional_aspects.slice(0, 2).map(e => `${e.emotion} (${e.intensity})`).join(", ")}
Patterns: ${canvas.behavioral_patterns.slice(0, 2).map(b => b.pattern).join(", ")}
Signals: ${canvas.buying_signals.slice(0, 2).map(s => s.signal).join(", ")}

# Generate JSON with:
{
  "customer_journey": {
    "stages": [
      {"stage": "unaware", "thoughts": "...", "emotions": "...", "actions": "...", "needs": "..."},
      {"stage": "problem_aware", "thoughts": "...", "emotions": "...", "actions": "...", "needs": "..."},
      {"stage": "solution_seeking", "thoughts": "...", "emotions": "...", "actions": "...", "needs": "..."},
      {"stage": "evaluation", "thoughts": "...", "emotions": "...", "actions": "...", "needs": "..."},
      {"stage": "decision", "thoughts": "...", "emotions": "...", "actions": "...", "needs": "..."}
    ]
  },
  "emotional_map": {
    "peaks": [{"moment": "...", "trigger": "...", "emotion": "..."}],
    "valleys": [{"moment": "...", "trigger": "...", "emotion": "..."}],
    "turning_points": [{"from": "...", "to": "...", "catalyst": "..."}]
  },
  "narrative_angles": {
    "transformation": {"before": "...", "after": "...", "key_message": "..."},
    "enemy": {"what": "...", "why_resonates": "..."},
    "secret": {"insight": "...", "why_powerful": "..."}
  },
  "messaging_framework": {
    "headlines": ["...", "...", "..."],
    "hooks": ["...", "...", "..."],
    "proof_points": ["...", "...", "..."],
    "objection_handlers": [{"objection": "...", "response": "..."}]
  },
  "voice_and_tone": {
    "primary_tone": "...",
    "words_to_use": ["...", "..."],
    "words_to_avoid": ["...", "..."],
    "communication_style": "..."
  }
}`;
}
