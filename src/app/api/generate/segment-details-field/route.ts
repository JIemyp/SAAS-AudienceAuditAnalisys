// Generate Single Field for Segment Details
// Regenerates ONE field with full context awareness
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { generateWithAI, parseJSONResponse } from "@/lib/ai-client";
import { buildSingleFieldPrompt, SegmentDetailsFieldName } from "@/lib/prompts";
import { handleApiError, ApiError, withRetry } from "@/lib/api-utils";
import { Project, SegmentFinal, PortraitFinal } from "@/types";

const VALID_FIELDS: SegmentDetailsFieldName[] = [
  "sociodemographics",
  "psychographics",
  "online_behavior",
  "buying_behavior",
  "awareness_level",
  "needs",
  "core_values",
  "objections",
];

export async function POST(request: NextRequest) {
  try {
    const { projectId, draftId, fieldName } = await request.json();

    // Validate inputs
    if (!projectId) throw new ApiError("Project ID is required", 400);
    if (!draftId) throw new ApiError("Draft ID is required", 400);
    if (!fieldName) throw new ApiError("Field name is required", 400);
    if (!VALID_FIELDS.includes(fieldName)) {
      throw new ApiError(`Invalid field name: ${fieldName}. Valid fields: ${VALID_FIELDS.join(", ")}`, 400);
    }

    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new ApiError("Unauthorized", 401);

    // 1. Get the project
    const { data: project } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .single();

    if (!project) throw new ApiError("Project not found", 404);

    // 2. Get the current draft
    const { data: draft } = await supabase
      .from("segment_details_drafts")
      .select("*")
      .eq("id", draftId)
      .single();

    if (!draft) throw new ApiError("Draft not found", 404);

    // 3. Get the segment from segments_final
    const { data: segment } = await supabase
      .from("segments_final")
      .select("*")
      .eq("id", draft.segment_id)
      .single();

    if (!segment) throw new ApiError("Segment not found", 404);

    // 4. Get portrait_final for context
    const { data: portraitFinal } = await supabase
      .from("portrait_final")
      .select("*")
      .eq("project_id", projectId)
      .order("approved_at", { ascending: false })
      .limit(1)
      .single();

    if (!portraitFinal) throw new ApiError("Portrait Final not found", 400);

    console.log(`[segment-details-field] Regenerating "${fieldName}" for segment "${segment.name}"`);

    // 5. Build the prompt with full context
    const prompt = buildSingleFieldPrompt(
      fieldName as SegmentDetailsFieldName,
      (project as Project).onboarding_data,
      segment as SegmentFinal,
      {
        sociodemographics: (portraitFinal as PortraitFinal).sociodemographics || "",
        psychographics: (portraitFinal as PortraitFinal).psychographics || "",
        values_beliefs: (portraitFinal as PortraitFinal).values_beliefs || [],
        lifestyle_habits: (portraitFinal as PortraitFinal).lifestyle_habits || [],
        interests_hobbies: (portraitFinal as PortraitFinal).interests_hobbies || [],
        personality_traits: (portraitFinal as PortraitFinal).personality_traits || [],
      },
      {
        sociodemographics: draft.sociodemographics,
        psychographics: draft.psychographics,
        online_behavior: draft.online_behavior,
        buying_behavior: draft.buying_behavior,
        awareness_level: draft.awareness_level,
        needs: draft.needs,
        core_values: draft.core_values,
        objections: draft.objections,
      }
    );

    // 6. Call Claude to generate the field
    const response = await withRetry(async () => {
      const text = await generateWithAI({ prompt, maxTokens: 2048, userId: user.id });
      return parseJSONResponse<Record<string, unknown>>(text);
    });

    console.log(`[segment-details-field] Claude response for "${fieldName}":`, JSON.stringify(response).slice(0, 200));

    // 7. Extract the field value from response
    let updateData: Record<string, unknown> = {};

    if (fieldName === "awareness_level") {
      // awareness_level comes with awareness_reasoning explaining WHY
      updateData.awareness_level = response.awareness_level;
      // Store reasoning to provide context about why this awareness level
      if (response.awareness_reasoning) {
        updateData.awareness_reasoning = response.awareness_reasoning;
      }
    } else {
      // For other fields, just take the value directly
      updateData[fieldName] = response[fieldName];
    }

    // Increment version
    updateData.version = (draft.version || 1) + 1;

    // 8. Update the draft with just this field
    const { data: updatedDraft, error: updateError } = await supabase
      .from("segment_details_drafts")
      .update(updateData)
      .eq("id", draftId)
      .select()
      .single();

    if (updateError) {
      console.error(`[segment-details-field] Failed to update draft:`, updateError);
      throw new ApiError(`Failed to update draft: ${updateError.message}`, 500);
    }

    console.log(`[segment-details-field] Successfully regenerated "${fieldName}" for segment "${segment.name}"`);

    return NextResponse.json({
      success: true,
      draft: updatedDraft,
      field: fieldName,
      newValue: updateData[fieldName] || updateData.awareness_level,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
