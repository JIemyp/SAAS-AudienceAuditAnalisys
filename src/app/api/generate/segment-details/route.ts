// Generate Segment Details - Prompt 11 (v4 - uses portraitFinal, NOT triggers)
// Increase timeout for AI generation
export const maxDuration = 60;

// ALWAYS uses segments_final as the source (after review decisions applied)
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireWriteAccess } from "@/lib/permissions";
import { generateWithAI, parseJSONResponse } from "@/lib/ai-client";
import { buildSegmentDetailsPrompt, SegmentDetailsResponse } from "@/lib/prompts";
import { handleApiError, ApiError, withRetry } from "@/lib/api-utils";
import { Project, SegmentFinal, PortraitFinal } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const { projectId, segmentId } = await request.json();
    if (!projectId) throw new ApiError("Project ID is required", 400);

    const supabase = await createServerClient();
    const adminSupabase = createAdminClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new ApiError("Unauthorized", 401);

    // Check write access (owner or editor)
    await requireWriteAccess(supabase, adminSupabase, projectId, user.id);

    const { data: project } = await adminSupabase.from("projects").select("*").eq("id", projectId).single();
    if (!project) throw new ApiError("Project not found", 404);

    // Fetch portrait_final for context
    const { data: portraitFinal } = await supabase
      .from("portrait_final")
      .select("*")
      .eq("project_id", projectId)
      .order("approved_at", { ascending: false })
      .limit(1)
      .single();

    if (!portraitFinal) throw new ApiError("Portrait Final not found. Complete portrait steps first.", 400);

    // ALWAYS use segments_final as the source (no fallback)
    const { data: finalSegments, error: segmentsError } = await supabase
      .from("segments_final")
      .select("*")
      .eq("project_id", projectId)
      .order("segment_index");

    if (segmentsError || !finalSegments || finalSegments.length === 0) {
      throw new ApiError("Segments Final not found. Complete segments steps first.", 400);
    }

    // Filter by segmentId if provided
    let segments: SegmentFinal[];
    if (segmentId) {
      const segment = finalSegments.find(s => s.id === segmentId);
      if (!segment) throw new ApiError("Segment not found", 404);
      segments = [segment as SegmentFinal];
    } else {
      segments = finalSegments as SegmentFinal[];
    }

    console.log(`[segment-details] Using ${segments.length} segments from segments_final`);

    // Delete existing drafts before regenerating
    if (segmentId) {
      // Delete only for specific segment
      const { error: deleteError } = await supabase
        .from("segment_details_drafts")
        .delete()
        .eq("project_id", projectId)
        .eq("segment_id", segmentId);

      if (deleteError) {
        console.error(`[segment-details] Failed to delete existing draft for segment ${segmentId}:`, deleteError);
      } else {
        console.log(`[segment-details] Deleted existing draft for segment ${segmentId}`);
      }
    } else {
      // Delete all drafts for the project
      const { error: deleteError } = await supabase
        .from("segment_details_drafts")
        .delete()
        .eq("project_id", projectId);

      if (deleteError) {
        console.error(`[segment-details] Failed to delete existing drafts:`, deleteError);
      } else {
        console.log(`[segment-details] Deleted all existing drafts for project ${projectId}`);
      }
    }

    console.log(`[segment-details] Generating details for ${segments.length} segments using portraitFinal (parallel processing)`);

    // Process segments in parallel (max 3 concurrent to avoid rate limits)
    const CONCURRENCY = 3;
    const drafts: Array<{ id: string; awareness_level: string; [key: string]: unknown }> = [];

    // Helper to process a single segment
    const processSegment = async (segment: SegmentFinal, index: number) => {
      const prompt = buildSegmentDetailsPrompt(
        (project as Project).onboarding_data,
        segment,
        {
          sociodemographics: (portraitFinal as PortraitFinal).sociodemographics || "",
          psychographics: (portraitFinal as PortraitFinal).psychographics || "",
          values_beliefs: (portraitFinal as PortraitFinal).values_beliefs || [],
          lifestyle_habits: (portraitFinal as PortraitFinal).lifestyle_habits || [],
          interests_hobbies: (portraitFinal as PortraitFinal).interests_hobbies || [],
          personality_traits: (portraitFinal as PortraitFinal).personality_traits || [],
        }
      );

      console.log(`[segment-details] Starting segment ${index + 1}/${segments.length}: "${segment.name}"`);

      const response = await withRetry(async () => {
        const text = await generateWithAI({ prompt, maxTokens: 4096, userId: user.id });
        return parseJSONResponse<SegmentDetailsResponse>(text);
      });

      console.log(`[segment-details] ✅ Completed "${segment.name}" (awareness: ${response.awareness_level})`);

      const { data: draft, error } = await adminSupabase.from("segment_details_drafts").insert({
        project_id: projectId,
        segment_id: segment.id,
        sociodemographics: response.sociodemographics || null,
        psychographics: response.psychographics || null,
        online_behavior: response.online_behavior || null,
        buying_behavior: response.buying_behavior || null,
        needs: response.needs,
        triggers: null,
        core_values: response.core_values,
        awareness_level: response.awareness_level,
        awareness_reasoning: response.awareness_reasoning || null,
        objections: response.objections,
        version: 1,
      }).select().single();

      if (error) {
        console.error(`[segment-details] Failed to insert draft for segment ${segment.name}:`, error);
        throw new ApiError(`Failed to save draft for segment "${segment.name}": ${error.message}`, 500);
      }

      return { draft, index };
    };

    // Process in batches with concurrency limit
    for (let i = 0; i < segments.length; i += CONCURRENCY) {
      const batch = segments.slice(i, i + CONCURRENCY);
      const batchPromises = batch.map((segment, batchIndex) =>
        processSegment(segment, i + batchIndex)
      );

      const results = await Promise.all(batchPromises);
      results.forEach(({ draft }) => drafts.push(draft));

      console.log(`[segment-details] Batch ${Math.floor(i / CONCURRENCY) + 1} complete (${drafts.length}/${segments.length} done)`);
    }

    // Sort drafts by original order
    drafts.sort((a, b) => {
      const indexA = segments.findIndex(s => s.id === a.segment_id);
      const indexB = segments.findIndex(s => s.id === b.segment_id);
      return indexA - indexB;
    });

    // Log summary of all awareness levels
    console.log(`\n╔════════════════════════════════════════════════════════════╗`);
    console.log(`║           SEGMENT DETAILS GENERATION SUMMARY               ║`);
    console.log(`╠════════════════════════════════════════════════════════════╣`);
    drafts.forEach((d, i) => {
      const seg = segments[i];
      console.log(`║ ${(i + 1).toString().padStart(2, '0')}. ${seg.name.padEnd(35)} → ${d.awareness_level.padEnd(15)}║`);
    });
    console.log(`╚════════════════════════════════════════════════════════════╝\n`);

    await adminSupabase.from("projects").update({ current_step: "segment_details_draft" }).eq("id", projectId);
    return NextResponse.json({ success: true, drafts });
  } catch (error) { return handleApiError(error); }
}
