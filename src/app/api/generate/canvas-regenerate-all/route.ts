// Regenerate ALL Canvas drafts for entire project
// Increase timeout for AI generation
export const maxDuration = 60;

// Cleans old canvas_drafts and canvas tables, then regenerates for all TOP pains
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireWriteAccess } from "@/lib/permissions";
import { generateWithAI, parseJSONResponse } from "@/lib/ai-client";
import { buildCanvasPrompt, CanvasResponse } from "@/lib/prompts";
import { handleApiError, ApiError, withRetry } from "@/lib/api-utils";
import { Project, PortraitFinal, Segment, SegmentDetails, Jobs, Preferences, Difficulties, Triggers, PainInitial } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const { projectId, clearExisting = true } = await request.json();

    if (!projectId) throw new ApiError("Project ID is required", 400);

    const supabase = await createServerClient();
    const adminSupabase = createAdminClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new ApiError("Unauthorized", 401);

    // Check write access (owner or editor)
    await requireWriteAccess(supabase, adminSupabase, projectId, user.id);

    // Get project
    const { data: project } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      
      .single();
    if (!project) throw new ApiError("Project not found", 404);

    // Get portrait final
    const { data: portraitFinal } = await supabase
      .from("portrait_final")
      .select("*")
      .eq("project_id", projectId)
      .order("approved_at", { ascending: false })
      .limit(1)
      .single();
    if (!portraitFinal) throw new ApiError("Portrait final not found", 400);

    // Get all segments
    const { data: segments } = await supabase
      .from("segments")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: true });
    if (!segments || segments.length === 0) throw new ApiError("No segments found", 404);

    // If clearExisting, delete all existing canvas data for this project
    if (clearExisting) {
      // Delete canvas_extended_drafts first (depends on canvas)
      await supabase
        .from("canvas_extended_drafts")
        .delete()
        .eq("project_id", projectId);

      // Delete canvas_extended
      await supabase
        .from("canvas_extended")
        .delete()
        .eq("project_id", projectId);

      // Delete canvas_drafts
      await supabase
        .from("canvas_drafts")
        .delete()
        .eq("project_id", projectId);

      // Delete canvas (approved)
      await supabase
        .from("canvas")
        .delete()
        .eq("project_id", projectId);
    }

    const allDrafts = [];
    let totalTopPains = 0;
    let processedPains = 0;

    // Process each segment
    for (const segment of segments) {
      // Get segment details
      const { data: segmentDetails } = await supabase
        .from("segment_details")
        .select("*")
        .eq("project_id", projectId)
        .eq("segment_id", segment.id)
        .order("approved_at", { ascending: false })
        .limit(1)
        .single();

      // Get jobs
      const { data: jobs } = await supabase
        .from("jobs")
        .select("*")
        .eq("project_id", projectId)
        .eq("segment_id", segment.id)
        .order("approved_at", { ascending: false })
        .limit(1)
        .single();

      // Get preferences
      const { data: preferences } = await supabase
        .from("preferences")
        .select("*")
        .eq("project_id", projectId)
        .eq("segment_id", segment.id)
        .order("approved_at", { ascending: false })
        .limit(1)
        .single();

      // Get difficulties
      const { data: difficulties } = await supabase
        .from("difficulties")
        .select("*")
        .eq("project_id", projectId)
        .eq("segment_id", segment.id)
        .order("approved_at", { ascending: false })
        .limit(1)
        .single();

      // Get triggers
      const { data: triggers } = await supabase
        .from("triggers")
        .select("*")
        .eq("project_id", projectId)
        .eq("segment_id", segment.id)
        .order("approved_at", { ascending: false })
        .limit(1)
        .single();

      // Get TOP pain IDs from pains_ranking for this segment
      const { data: rankings } = await supabase
        .from("pains_ranking")
        .select("pain_id")
        .eq("project_id", projectId)
        .eq("segment_id", segment.id)
        .eq("is_top_pain", true);

      if (!rankings || rankings.length === 0) {
        console.log(`[canvas-regenerate-all] No TOP pains for segment ${segment.name}, skipping`);
        continue;
      }

      // Get full pain data from pains_initial
      const painIds = rankings.map(r => r.pain_id).filter(Boolean);
      const { data: pains } = await supabase
        .from("pains_initial")
        .select("*")
        .in("id", painIds);

      const painsToProcess = (pains || []) as PainInitial[];
      totalTopPains += painsToProcess.length;

      // Generate canvas for each TOP pain
      for (const pain of painsToProcess) {
        try {
          const prompt = buildCanvasPrompt(
            (project as Project).onboarding_data,
            portraitFinal as PortraitFinal,
            segment as Segment,
            segmentDetails as SegmentDetails | null,
            jobs as Jobs | null,
            preferences as Preferences | null,
            difficulties as Difficulties | null,
            triggers as Triggers | null,
            pain
          );

          const response = await withRetry(async () => {
            const text = await generateWithAI({ prompt, maxTokens: 6144, userId: user.id });
            return parseJSONResponse<CanvasResponse>(text);
          });

          const { data: draft, error } = await supabase
            .from("canvas_drafts")
            .insert({
              project_id: projectId,
              segment_id: segment.id,
              pain_id: pain.id,
              emotional_aspects: response.emotional_aspects,
              behavioral_patterns: response.behavioral_patterns,
              buying_signals: response.buying_signals,
              version: 1,
            })
            .select()
            .single();

          if (!error && draft) {
            allDrafts.push(draft);
            processedPains++;
            console.log(`[canvas-regenerate-all] Generated canvas for pain: ${pain.name} (${processedPains}/${totalTopPains})`);
          }
        } catch (err) {
          console.error(`[canvas-regenerate-all] Error generating canvas for pain ${pain.id}:`, err);
          // Continue with other pains even if one fails
        }
      }
    }

    return NextResponse.json({
      success: true,
      drafts: allDrafts,
      stats: {
        totalSegments: segments.length,
        totalTopPains,
        processedPains,
        draftsCreated: allDrafts.length,
      }
    });
  } catch (error) {
    return handleApiError(error);
  }
}
