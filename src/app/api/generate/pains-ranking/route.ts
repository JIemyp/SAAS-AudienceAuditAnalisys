// Generate Pains Ranking - Prompt 13
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { generateWithClaude, parseJSONResponse } from "@/lib/anthropic";
import { buildPainsRankingPrompt, PainsRankingResponse } from "@/lib/prompts";
import { handleApiError, ApiError, withRetry } from "@/lib/api-utils";
import { Segment, PainInitial } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const { projectId, segmentId } = await request.json();
    if (!projectId) throw new ApiError("Project ID is required", 400);

    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new ApiError("Unauthorized", 401);

    // Get segments from the correct table
    let segments: Segment[];
    if (segmentId) {
      const { data: segment } = await supabase.from("segments").select("*").eq("id", segmentId).single();
      if (!segment) throw new ApiError("Segment not found", 404);
      segments = [segment as Segment];
    } else {
      const { data: allSegments } = await supabase.from("segments").select("*").eq("project_id", projectId).order("order_index");
      if (!allSegments || allSegments.length === 0) throw new ApiError("Segments not found", 400);
      segments = allSegments as Segment[];
    }

    console.log(`[pains-ranking] Processing ${segments.length} segments for project ${projectId}`);

    // Clear existing ranking drafts for this project before generating new ones
    console.log(`[pains-ranking] Clearing existing ranking drafts for project ${projectId}`);
    const { error: deleteError } = await supabase
      .from("pains_ranking_drafts")
      .delete()
      .eq("project_id", projectId);

    if (deleteError) {
      console.error(`[pains-ranking] Error clearing old drafts:`, deleteError.message);
    }

    const drafts = [];
    const segmentsWithoutPains: string[] = [];

    for (const segment of segments) {
      // Get approved pains for this segment
      let { data: pains, error: painsError } = await supabase
        .from("pains_initial")
        .select("*")
        .eq("segment_id", segment.id)
        .order("pain_index");

      console.log(`[pains-ranking] Segment ${segment.name} (${segment.id}): found ${pains?.length || 0} approved pains`);

      // If no approved pains or very few, try to auto-approve from drafts
      if (!pains || pains.length < 3) {
        console.log(`[pains-ranking] Attempting to auto-approve pains from drafts for segment ${segment.name}`);

        const { data: drafts } = await supabase
          .from("pains_drafts")
          .select("*")
          .eq("project_id", projectId)
          .eq("segment_id", segment.id)
          .order("pain_index");

        if (drafts && drafts.length > 0) {
          console.log(`[pains-ranking] Found ${drafts.length} drafts, auto-approving...`);

          // Delete existing (incomplete) approved pains
          await supabase
            .from("pains_initial")
            .delete()
            .eq("project_id", projectId)
            .eq("segment_id", segment.id);

          // Insert all drafts as approved
          const painsToInsert = drafts.map(draft => ({
            project_id: projectId,
            segment_id: segment.id,
            pain_index: draft.pain_index,
            name: draft.name,
            description: draft.description,
            deep_triggers: draft.deep_triggers,
            examples: draft.examples,
          }));

          const { data: insertedPains, error: insertError } = await supabase
            .from("pains_initial")
            .insert(painsToInsert)
            .select();

          if (!insertError && insertedPains) {
            console.log(`[pains-ranking] Auto-approved ${insertedPains.length} pains for segment ${segment.name}`);
            pains = insertedPains;
          } else {
            console.error(`[pains-ranking] Auto-approve failed:`, insertError?.message);
          }
        }
      }

      console.log(`[pains-ranking] Final pains count for segment ${segment.name}: ${pains?.length || 0}`);

      if (!pains || pains.length === 0) {
        console.log(`[pains-ranking] No pains found for segment ${segment.id}, skipping`);
        segmentsWithoutPains.push(segment.name);
        continue;
      }

      console.log(`[pains-ranking] Generating rankings for ${pains.length} pains in segment ${segment.name}`);

      const prompt = buildPainsRankingPrompt(segment, pains as PainInitial[]);

      const response = await withRetry(async () => {
        const text = await generateWithClaude({ prompt, maxTokens: 4096 });
        return parseJSONResponse<PainsRankingResponse>(text);
      });

      console.log(`[pains-ranking] Response rankings:`, response.rankings?.length || 0);
      console.log(`[pains-ranking] Pains in segment:`, pains.map(p => ({ id: p.id, pain_index: p.pain_index, name: p.name })));

      for (const ranking of response.rankings) {
        console.log(`[pains-ranking] Looking for pain_index ${ranking.pain_index} in segment ${segment.name}`);
        const pain = pains.find(p => p.pain_index === ranking.pain_index);
        if (!pain) {
          console.log(`[pains-ranking] Pain with index ${ranking.pain_index} not found! Available indices:`, pains.map(p => p.pain_index));
          continue;
        }

        const { data: draft, error } = await supabase.from("pains_ranking_drafts").insert({
          project_id: projectId,
          pain_id: pain.id,
          impact_score: ranking.impact_score,
          is_top_pain: ranking.is_top_pain,
          ranking_reasoning: ranking.reasoning,
          version: 1,
        }).select().single();

        if (error) {
          console.error(`[pains-ranking] Error inserting draft:`, error.message);
        } else {
          console.log(`[pains-ranking] Draft inserted for pain ${pain.name}`);
          drafts.push(draft);
        }
      }
    }

    if (drafts.length === 0) {
      if (segmentsWithoutPains.length > 0) {
        throw new ApiError(
          `No approved pains found for segments: ${segmentsWithoutPains.join(", ")}. Please go to the Pain Points step and approve pains first.`,
          400
        );
      }
      throw new ApiError("No pains found to rank. Make sure you have approved pains first.", 400);
    }

    await supabase.from("projects").update({ current_step: "pains_ranking_draft" }).eq("id", projectId);
    return NextResponse.json({ success: true, drafts });
  } catch (error) { return handleApiError(error); }
}
