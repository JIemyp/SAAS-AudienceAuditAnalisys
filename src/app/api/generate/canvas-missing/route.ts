// Generate Canvas ONLY for missing TOP pains (that don't have canvas_drafts yet)
// Increase timeout for AI generation
export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { generateWithAI, parseJSONResponse } from "@/lib/ai-client";
import { buildCanvasPrompt, CanvasResponse } from "@/lib/prompts";
import { handleApiError, ApiError, withRetry } from "@/lib/api-utils";
import { Project, PortraitFinal, Segment, SegmentDetails, Jobs, Preferences, Difficulties, Triggers, PainInitial } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const { projectId } = await request.json();

    if (!projectId) throw new ApiError("Project ID is required", 400);

    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new ApiError("Unauthorized", 401);

    // Get project
    const { data: project } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .eq("user_id", user.id)
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
      .eq("project_id", projectId);
    if (!segments || segments.length === 0) throw new ApiError("No segments found", 404);

    // Get all TOP pains from pains_ranking
    const { data: topPainsRanking } = await supabase
      .from("pains_ranking")
      .select("pain_id, segment_id")
      .eq("project_id", projectId)
      .eq("is_top_pain", true);

    if (!topPainsRanking || topPainsRanking.length === 0) {
      return NextResponse.json({
        success: false,
        error: "No TOP pains found in pains_ranking",
        stats: { topPainsCount: 0 }
      });
    }

    // Get existing canvas_drafts
    const { data: existingDrafts } = await supabase
      .from("canvas_drafts")
      .select("pain_id")
      .eq("project_id", projectId);

    const existingPainIds = new Set((existingDrafts || []).map(d => d.pain_id));

    // Find missing pain_ids
    const missingPainIds = topPainsRanking
      .filter(r => !existingPainIds.has(r.pain_id))
      .map(r => ({ pain_id: r.pain_id, segment_id: r.segment_id }));

    if (missingPainIds.length === 0) {
      return NextResponse.json({
        success: true,
        message: "All TOP pains already have canvas_drafts",
        stats: {
          topPainsCount: topPainsRanking.length,
          existingDrafts: existingDrafts?.length || 0,
          missingCount: 0,
          generated: 0
        }
      });
    }

    // Get full pain data for missing ones
    const { data: missingPains } = await supabase
      .from("pains_initial")
      .select("*")
      .in("id", missingPainIds.map(m => m.pain_id));

    if (!missingPains || missingPains.length === 0) {
      // These are orphan records in pains_ranking - pain_ids that don't exist in pains_initial
      return NextResponse.json({
        success: false,
        error: "Missing pain_ids not found in pains_initial - these are orphan records",
        orphanPainIds: missingPainIds.map(m => m.pain_id),
        stats: {
          topPainsCount: topPainsRanking.length,
          existingDrafts: existingDrafts?.length || 0,
          missingCount: missingPainIds.length,
          orphanCount: missingPainIds.length
        }
      });
    }

    const allDrafts = [];
    const errors = [];

    // Generate canvas for each missing pain
    for (const pain of missingPains as PainInitial[]) {
      try {
        const segment = segments.find(s => s.id === pain.segment_id);
        if (!segment) {
          errors.push({ painId: pain.id, error: "Segment not found" });
          continue;
        }

        // Get segment details (REQUIRED)
        const { data: segmentDetails } = await supabase
          .from("segment_details")
          .select("*")
          .eq("project_id", projectId)
          .eq("segment_id", segment.id)
          .order("approved_at", { ascending: false })
          .limit(1)
          .single();
        if (!segmentDetails) {
          errors.push({ painId: pain.id, error: "Segment details not found" });
          continue;
        }

        // Get jobs (REQUIRED)
        const { data: jobs } = await supabase
          .from("jobs")
          .select("*")
          .eq("project_id", projectId)
          .eq("segment_id", segment.id)
          .order("approved_at", { ascending: false })
          .limit(1)
          .single();
        if (!jobs) {
          errors.push({ painId: pain.id, error: "Jobs not found" });
          continue;
        }

        // Get preferences (REQUIRED)
        const { data: preferences } = await supabase
          .from("preferences")
          .select("*")
          .eq("project_id", projectId)
          .eq("segment_id", segment.id)
          .order("approved_at", { ascending: false })
          .limit(1)
          .single();
        if (!preferences) {
          errors.push({ painId: pain.id, error: "Preferences not found" });
          continue;
        }

        // Get difficulties (REQUIRED)
        const { data: difficulties } = await supabase
          .from("difficulties")
          .select("*")
          .eq("project_id", projectId)
          .eq("segment_id", segment.id)
          .order("approved_at", { ascending: false })
          .limit(1)
          .single();
        if (!difficulties) {
          errors.push({ painId: pain.id, error: "Difficulties not found" });
          continue;
        }

        // Get triggers (REQUIRED)
        const { data: triggers } = await supabase
          .from("triggers")
          .select("*")
          .eq("project_id", projectId)
          .eq("segment_id", segment.id)
          .order("approved_at", { ascending: false })
          .limit(1)
          .single();
        if (!triggers) {
          errors.push({ painId: pain.id, error: "Triggers not found" });
          continue;
        }

        const prompt = buildCanvasPrompt(
          (project as Project).onboarding_data,
          portraitFinal as PortraitFinal,
          segment as Segment,
          segmentDetails as SegmentDetails,
          jobs as Jobs,
          preferences as Preferences,
          difficulties as Difficulties,
          triggers as Triggers,
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

        if (error) {
          errors.push({ painId: pain.id, error: error.message });
        } else {
          allDrafts.push(draft);
          console.log(`[canvas-missing] Generated canvas for pain: ${pain.name} (${allDrafts.length}/${missingPains.length})`);
        }
      } catch (err) {
        errors.push({ painId: pain.id, error: String(err) });
      }
    }

    return NextResponse.json({
      success: true,
      stats: {
        topPainsCount: topPainsRanking.length,
        existingDrafts: existingDrafts?.length || 0,
        missingCount: missingPainIds.length,
        foundInPainsInitial: missingPains.length,
        generated: allDrafts.length,
        errors: errors.length
      },
      drafts: allDrafts,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// GET - just check what's missing without generating
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) throw new ApiError("Project ID is required", 400);

    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new ApiError("Unauthorized", 401);

    // Get all TOP pains from pains_ranking
    const { data: topPainsRanking } = await supabase
      .from("pains_ranking")
      .select("pain_id, segment_id")
      .eq("project_id", projectId)
      .eq("is_top_pain", true);

    // Get existing canvas_drafts
    const { data: existingDrafts } = await supabase
      .from("canvas_drafts")
      .select("pain_id")
      .eq("project_id", projectId);

    const existingPainIds = new Set((existingDrafts || []).map(d => d.pain_id));

    // Find missing pain_ids
    const missingPainIds = (topPainsRanking || [])
      .filter(r => !existingPainIds.has(r.pain_id))
      .map(r => r.pain_id);

    // Check which missing pain_ids exist in pains_initial
    let validMissingPains: { id: string; name: string; segment_id: string }[] = [];
    let orphanPainIds: string[] = [];

    if (missingPainIds.length > 0) {
      const { data: existingPains } = await supabase
        .from("pains_initial")
        .select("id, name, segment_id")
        .in("id", missingPainIds);

      const existingIds = new Set((existingPains || []).map(p => p.id));
      validMissingPains = (existingPains || []).map(p => ({ id: p.id, name: p.name, segment_id: p.segment_id }));
      orphanPainIds = missingPainIds.filter(id => !existingIds.has(id));
    }

    return NextResponse.json({
      success: true,
      stats: {
        topPainsCount: topPainsRanking?.length || 0,
        existingDraftsCount: existingDrafts?.length || 0,
        missingCount: missingPainIds.length,
        validMissingCount: validMissingPains.length,
        orphanCount: orphanPainIds.length
      },
      validMissingPains,
      orphanPainIds: orphanPainIds.length > 0 ? orphanPainIds : undefined
    });
  } catch (error) {
    return handleApiError(error);
  }
}
