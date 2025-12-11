// Generate Segment Details - Prompt 11 (v4 - uses portraitFinal, NOT triggers)
// ALWAYS uses segments_final as the source (after review decisions applied)
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { generateWithAI, parseJSONResponse } from "@/lib/ai-client";
import { buildSegmentDetailsPrompt, SegmentDetailsResponse } from "@/lib/prompts";
import { handleApiError, ApiError, withRetry } from "@/lib/api-utils";
import { Project, SegmentFinal, PortraitFinal } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const { projectId, segmentId } = await request.json();
    if (!projectId) throw new ApiError("Project ID is required", 400);

    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new ApiError("Unauthorized", 401);

    const { data: project } = await supabase.from("projects").select("*").eq("id", projectId).eq("user_id", user.id).single();
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

    console.log(`[segment-details] Generating details for ${segments.length} segments using portraitFinal`);

    const drafts = [];
    for (const segment of segments) {
      // v4: buildSegmentDetailsPrompt uses portraitFinal for context (NOT triggers)
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

      console.log(`\n========================================`);
      console.log(`[segment-details] Processing segment ${drafts.length + 1}/${segments.length}: "${segment.name}"`);
      console.log(`[segment-details] Segment description: ${segment.description?.substring(0, 100)}...`);
      console.log(`[segment-details] Segment sociodemographics: ${segment.sociodemographics?.substring(0, 100)}...`);

      const response = await withRetry(async () => {
        const text = await generateWithAI({ prompt, maxTokens: 4096, userId: user.id });
        return parseJSONResponse<SegmentDetailsResponse>(text);
      });

      // Log detailed response for awareness level debugging
      console.log(`[segment-details] ✅ Response for "${segment.name}":`);
      console.log(`[segment-details]   → Awareness Level: ${response.awareness_level}`);
      console.log(`[segment-details]   → Needs count: ${response.needs?.length || 0}`);
      console.log(`[segment-details]   → Core values count: ${response.core_values?.length || 0}`);
      console.log(`[segment-details]   → Objections count: ${response.objections?.length || 0}`);
      console.log(`[segment-details]   → Has sociodemographics: ${!!response.sociodemographics}`);
      console.log(`[segment-details]   → Has psychographics: ${!!response.psychographics}`);
      console.log(`[segment-details]   → Has online_behavior: ${!!response.online_behavior}`);
      console.log(`[segment-details]   → Has buying_behavior: ${!!response.buying_behavior}`);
      console.log(`========================================\n`);

      // Note: triggers field will be null/empty - triggers generated in separate step
      const { data: draft, error } = await supabase.from("segment_details_drafts").insert({
        project_id: projectId,
        segment_id: segment.id,
        // New behavior fields
        sociodemographics: response.sociodemographics || null,
        psychographics: response.psychographics || null,
        online_behavior: response.online_behavior || null,
        buying_behavior: response.buying_behavior || null,
        // Original fields
        needs: response.needs,
        triggers: null, // Triggers will be generated separately
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

      drafts.push(draft);
    }

    // Log summary of all awareness levels
    console.log(`\n╔════════════════════════════════════════════════════════════╗`);
    console.log(`║           SEGMENT DETAILS GENERATION SUMMARY               ║`);
    console.log(`╠════════════════════════════════════════════════════════════╣`);
    drafts.forEach((d, i) => {
      const seg = segments[i];
      console.log(`║ ${(i + 1).toString().padStart(2, '0')}. ${seg.name.padEnd(35)} → ${d.awareness_level.padEnd(15)}║`);
    });
    console.log(`╚════════════════════════════════════════════════════════════╝\n`);

    await supabase.from("projects").update({ current_step: "segment_details_draft" }).eq("id", projectId);
    return NextResponse.json({ success: true, drafts });
  } catch (error) { return handleApiError(error); }
}
