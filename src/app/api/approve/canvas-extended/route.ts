// Approve Canvas Extended - Prompt 15 (Per Segment)
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { handleApiError, ApiError } from "@/lib/api-utils";

export async function POST(request: NextRequest) {
  try {
    const { projectId, draftIds, segmentId } = await request.json();

    if (!projectId || !draftIds) throw new ApiError("Project ID and Draft IDs required", 400);
    if (!segmentId) throw new ApiError("Segment ID is required", 400);

    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new ApiError("Unauthorized", 401);

    const ids = Array.isArray(draftIds) ? draftIds : [draftIds];
    const { data: drafts } = await supabase
      .from("canvas_extended_drafts")
      .select("*")
      .in("id", ids)
      .eq("segment_id", segmentId);

    if (!drafts || drafts.length === 0) throw new ApiError("Drafts not found", 404);

    const approved = [];
    for (const draft of drafts) {
      const { data: canvasExt, error } = await supabase
        .from("canvas_extended")
        .insert({
          project_id: projectId,
          segment_id: segmentId,
          canvas_id: draft.canvas_id,
          extended_analysis: draft.extended_analysis,
          different_angles: draft.different_angles,
          journey_description: draft.journey_description,
          emotional_peaks: draft.emotional_peaks,
          purchase_moment: draft.purchase_moment,
          post_purchase: draft.post_purchase,
        })
        .select()
        .single();

      if (!error) approved.push(canvasExt);
    }

    // Note: Final compilation happens when ALL segments are approved
    // This is handled at the frontend level

    return NextResponse.json({ success: true, approved, segment_id: segmentId });
  } catch (error) {
    return handleApiError(error);
  }
}

async function compileFinalReports(supabase: any, projectId: string) {
  // Get all approved data
  const { data: validation } = await supabase.from("validation").select("*").eq("project_id", projectId).single();
  const { data: portraitFinal } = await supabase.from("portrait_final").select("*").eq("project_id", projectId).single();
  const { data: jobs } = await supabase.from("jobs").select("*").eq("project_id", projectId).single();
  const { data: preferences } = await supabase.from("preferences").select("*").eq("project_id", projectId).single();
  const { data: difficulties } = await supabase.from("difficulties").select("*").eq("project_id", projectId).single();
  const { data: triggers } = await supabase.from("triggers").select("*").eq("project_id", projectId).single();

  // Create audience record
  if (validation && portraitFinal) {
    await supabase.from("audience").upsert({
      project_id: projectId,
      product_understanding: {
        what_brand_sells: validation.what_brand_sells,
        problem_solved: validation.problem_solved,
        key_differentiator: validation.key_differentiator,
      },
      sociodemographics: portraitFinal.sociodemographics,
      psychographics: portraitFinal.psychographics,
      demographics_detailed: {
        age_range: portraitFinal.age_range,
        gender_distribution: portraitFinal.gender_distribution,
        income_level: portraitFinal.income_level,
        education: portraitFinal.education,
        location: portraitFinal.location,
        occupation: portraitFinal.occupation,
        family_status: portraitFinal.family_status,
      },
      jobs_to_be_done: jobs ? {
        functional: jobs.functional_jobs,
        emotional: jobs.emotional_jobs,
        social: jobs.social_jobs,
      } : null,
      product_preferences: preferences?.preferences,
      difficulties: difficulties?.difficulties,
      deep_triggers: triggers?.triggers,
    }, { onConflict: "project_id" });
  }

  // Compile segments with details
  const { data: segmentsInitial } = await supabase.from("segments_initial").select("*").eq("project_id", projectId).order("segment_index");
  if (segmentsInitial) {
    for (const seg of segmentsInitial) {
      const { data: details } = await supabase.from("segment_details").select("*").eq("segment_id", seg.id).single();

      await supabase.from("segments").upsert({
        id: seg.id,
        project_id: projectId,
        order_index: seg.segment_index,
        name: seg.name,
        description: seg.description,
        sociodemographics: seg.sociodemographics,
        needs: details?.needs,
        triggers: details?.triggers,
        core_values: details?.core_values,
        awareness_level: details?.awareness_level,
        objections: details?.objections,
      }, { onConflict: "id" });
    }
  }

  // Compile pains with canvas data
  const { data: painsInitial } = await supabase.from("pains_initial").select("*").eq("project_id", projectId);
  if (painsInitial) {
    for (const pain of painsInitial) {
      const { data: ranking } = await supabase.from("pains_ranking").select("*").eq("pain_id", pain.id).single();
      const { data: canvas } = await supabase.from("canvas").select("*").eq("pain_id", pain.id).single();
      const { data: canvasExt } = canvas ? await supabase.from("canvas_extended").select("*").eq("canvas_id", canvas.id).single() : { data: null };

      await supabase.from("pains").upsert({
        id: pain.id,
        project_id: projectId,
        segment_id: pain.segment_id,
        name: pain.name,
        description: pain.description,
        deep_triggers: pain.deep_triggers,
        examples: pain.examples,
        impact_score: ranking?.impact_score,
        is_top_pain: ranking?.is_top_pain,
        canvas_emotional_aspects: canvas?.emotional_aspects,
        canvas_behavioral_patterns: canvas?.behavioral_patterns,
        canvas_buying_signals: canvas?.buying_signals,
        canvas_extended_analysis: canvasExt?.extended_analysis,
      }, { onConflict: "id" });
    }
  }
}
