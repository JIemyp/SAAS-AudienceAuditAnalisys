import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { generateWithAI, parseJSONResponse } from "@/lib/ai-client";
import { buildOverviewPrompt, OverviewResponse } from "@/lib/prompts";
import { getFileContent } from "@/lib/upload-files";

export async function POST(request: NextRequest) {
  let projectId: string | undefined;

  try {
    const body = await request.json();
    projectId = body.projectId;

    if (!projectId) {
      return NextResponse.json(
        { error: "projectId is required" },
        { status: 400 }
      );
    }

    const supabase = await createServerClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get project with onboarding data
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("*, project_files(*)")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // Update status
    await supabase
      .from("projects")
      .update({ status: "processing", updated_at: new Date().toISOString() })
      .eq("id", projectId);

    // Get file contents if any
    const filesContent: string[] = [];
    if (project.project_files?.length) {
      for (const file of project.project_files) {
        try {
          const content = await getFileContent(supabase, file.file_path);
          if (content) filesContent.push(content);
        } catch (e) {
          console.error(`Failed to read file ${file.file_name}:`, e);
        }
      }
    }

    // Build prompt and generate
    const prompt = buildOverviewPrompt(project.onboarding_data, filesContent);
    const response = await generateWithAI({ prompt, maxTokens: 4096, userId: user.id });
    const parsed = parseJSONResponse<OverviewResponse>(response);

    // Save to database
    const { data: overview, error: insertError } = await supabase
      .from("audience_overviews")
      .insert({
        project_id: projectId,
        sociodemographics: parsed.final_portrait.sociodemographics,
        psychographics: parsed.final_portrait.psychographics,
        general_pains: parsed.final_portrait.general_pains,
        triggers: parsed.final_portrait.purchase_triggers,
        full_content: JSON.stringify(parsed),
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    return NextResponse.json({
      success: true,
      step: "overview",
      data: overview,
    });
  } catch (error) {
    console.error("Overview generation error:", error);

    // Update project status to failed
    if (projectId) {
      try {
        const supabase = await createServerClient();
        await supabase
          .from("projects")
          .update({ status: "failed" })
          .eq("id", projectId);
      } catch (e) {
        console.error("Failed to update project status:", e);
      }
    }

    return NextResponse.json(
      { error: "Failed to generate overview", details: String(error) },
      { status: 500 }
    );
  }
}
