// =====================================================
// Generate Channel Strategy - NEW MODULE (Per Segment)
// Analyzes WHERE to find the audience and HOW to reach them
// =====================================================

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { generateWithClaude, parseJSONResponse } from "@/lib/anthropic";
import { handleApiError, ApiError, withRetry } from "@/lib/api-utils";
import {
  Project,
  PortraitFinal,
  Segment,
  SegmentDetails,
  Triggers,
  OnboardingData,
} from "@/types";

// Response type for Channel Strategy generation
interface ChannelStrategyResponse {
  primary_platforms: Array<{
    platform: string;
    usage_frequency: "daily" | "weekly" | "monthly";
    activity_type: "lurking" | "commenting" | "posting";
    peak_activity_times: string[];
    why_they_use_it: string;
  }>;
  content_preferences: Array<{
    format: string;
    context: string;
    attention_span: "skimmers" | "deep_readers" | "binge_watchers";
    triggering_topics: string[];
  }>;
  trusted_sources: Array<{
    source_type: "industry_blogs" | "podcasts" | "youtube_channels" | "communities";
    specific_examples: string[];
    why_trusted: string;
  }>;
  communities: Array<{
    type: "facebook_groups" | "subreddits" | "slack_communities" | "forums";
    specific_names: string[];
    participation_level: "observer" | "occasional" | "active" | "influencer";
    influence_on_purchases: "none" | "low" | "medium" | "high" | "critical";
  }>;
  search_patterns: {
    typical_queries: string[];
    search_depth: "first_page_only" | "deep_research" | "comparison_shopping";
    decision_timeline: "impulse" | "days" | "weeks" | "months";
  };
  advertising_response: {
    channels_they_notice: string[];
    ad_formats_that_work: string[];
    ad_formats_that_annoy: string[];
    retargeting_tolerance: "low" | "medium" | "high";
  };
}

function buildChannelStrategyPrompt(
  onboarding: OnboardingData,
  segment: Segment,
  segmentDetails: SegmentDetails | null,
  portraitFinal: PortraitFinal | null,
  triggers: Triggers | null
): string {
  const segmentDetailsSection = segmentDetails ? `
## Segment Psychology
- Awareness Level: ${segmentDetails.awareness_level || "N/A"}
- Online Behavior: ${segmentDetails.online_behavior || "N/A"}
- Buying Behavior: ${segmentDetails.buying_behavior || "N/A"}
- Core Values: ${JSON.stringify(segmentDetails.core_values || [])}
- Needs: ${JSON.stringify(segmentDetails.needs || [])}
` : "";

  const portraitSection = portraitFinal ? `
## Audience Interests & Lifestyle
- Interests/Hobbies: ${JSON.stringify(portraitFinal.interests_hobbies || [])}
- Lifestyle Habits: ${JSON.stringify(portraitFinal.lifestyle_habits || [])}
- Personality Traits: ${JSON.stringify(portraitFinal.personality_traits || [])}
` : "";

  const triggersSection = triggers ? `
## Purchase Triggers
${JSON.stringify(triggers.triggers?.slice(0, 5) || [], null, 2)}
` : "";

  return `You are a senior media planner and audience research expert with 15+ years experience in digital marketing for health/wellness brands.

## CRITICAL: JSON STRUCTURE REQUIREMENTS
Your response MUST match the EXACT JSON structure below. Every field is REQUIRED.
- All enum fields must use ONLY the specified values
- All arrays must have the minimum specified items
- No extra fields, no missing fields

## Business Context
- Brand: ${onboarding.brandName || "N/A"}
- Product/Service: ${onboarding.productService || "N/A"}
- Product Format: ${onboarding.productFormat || "N/A"}
- Unique Selling Point: ${onboarding.usp || "N/A"}
- Business Model: ${onboarding.businessModel || "N/A"}
- Geography: ${onboarding.geography || "N/A"}
- Price Segment: ${onboarding.priceSegment || "N/A"}

## Segment Profile
- Name: ${segment.name}
- Description: ${segment.description || "N/A"}
- Sociodemographics: ${segment.sociodemographics || "N/A"}
${segmentDetailsSection}
${portraitSection}
${triggersSection}

## Your Task

Create a channel strategy for "${segment.name}". Be ULTRA-SPECIFIC:
- Name REAL platforms (not "social media" but "Instagram Reels", "r/biohacking")
- Name REAL podcasts/blogs (not "health podcasts" but "Huberman Lab", "The Model Health Show")
- Name REAL communities (not "online forums" but "r/Supplements", "Biohackers Facebook Group")
- Write ACTUAL search queries they would type

## REQUIRED JSON OUTPUT (copy this structure exactly):

{
  "primary_platforms": [
    {
      "platform": "SPECIFIC platform name - e.g., 'Instagram Reels', 'LinkedIn', 'YouTube Shorts', 'r/biohacking'",
      "usage_frequency": "daily",
      "activity_type": "lurking",
      "peak_activity_times": ["morning_6_8am", "lunch_12_1pm", "evening_8_10pm"],
      "why_they_use_it": "2-3 sentence explanation of WHY this segment uses this platform"
    }
  ],
  "content_preferences": [
    {
      "format": "SPECIFIC format - e.g., '15-min YouTube deep-dives', 'Instagram carousel infographics', 'Twitter/X threads'",
      "context": "WHERE/WHEN consumed - e.g., 'during morning routine', 'commute on train', 'weekend research sessions'",
      "attention_span": "deep_readers",
      "triggering_topics": ["topic 1", "topic 2", "topic 3"]
    }
  ],
  "trusted_sources": [
    {
      "source_type": "podcasts",
      "specific_examples": ["Huberman Lab", "The Model Health Show", "Found My Fitness"],
      "why_trusted": "2-3 sentence explanation of why they trust this source type"
    }
  ],
  "communities": [
    {
      "type": "subreddits",
      "specific_names": ["r/Supplements", "r/Biohackers", "r/nutrition"],
      "participation_level": "occasional",
      "influence_on_purchases": "high"
    }
  ],
  "search_patterns": {
    "typical_queries": ["best microalgae supplements 2024", "chlorella vs spirulina benefits", "functional nutrition for gut health"],
    "search_depth": "deep_research",
    "decision_timeline": "weeks"
  },
  "advertising_response": {
    "channels_they_notice": ["YouTube pre-roll", "Instagram sponsored posts", "podcast sponsorships"],
    "ad_formats_that_work": ["educational content ads", "testimonial videos", "expert endorsements"],
    "ad_formats_that_annoy": ["pop-ups", "clickbait", "aggressive retargeting"],
    "retargeting_tolerance": "medium"
  }
}

## VALIDATION RULES:
- usage_frequency: ONLY "daily" | "weekly" | "monthly"
- activity_type: ONLY "lurking" | "commenting" | "posting"
- attention_span: ONLY "skimmers" | "deep_readers" | "binge_watchers"
- source_type: ONLY "industry_blogs" | "podcasts" | "youtube_channels" | "communities"
- type (communities): ONLY "facebook_groups" | "subreddits" | "slack_communities" | "forums"
- participation_level: ONLY "observer" | "occasional" | "active" | "influencer"
- influence_on_purchases: ONLY "none" | "low" | "medium" | "high" | "critical"
- search_depth: ONLY "first_page_only" | "deep_research" | "comparison_shopping"
- decision_timeline: ONLY "impulse" | "days" | "weeks" | "months"
- retargeting_tolerance: ONLY "low" | "medium" | "high"

## MINIMUM REQUIREMENTS:
- primary_platforms: 4+ items
- content_preferences: 3+ items
- trusted_sources: 4+ items (mix of types)
- communities: 3+ items
- typical_queries: 6+ queries
- All arrays within objects: 3+ items

Return ONLY valid JSON. No markdown, no explanations.`;
}

export async function POST(request: NextRequest) {
  try {
    const { projectId, segmentId } = await request.json();

    if (!projectId) {
      throw new ApiError("Project ID is required", 400);
    }

    if (!segmentId) {
      throw new ApiError("Segment ID is required", 400);
    }

    const supabase = await createServerClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new ApiError("Unauthorized", 401);
    }

    // Get project with onboarding data
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .single();

    if (projectError || !project) {
      throw new ApiError("Project not found", 404);
    }

    const typedProject = project as Project;

    // Get segment data
    const { data: segment, error: segmentError } = await supabase
      .from("segments")
      .select("*")
      .eq("id", segmentId)
      .eq("project_id", projectId)
      .single();

    if (segmentError || !segment) {
      throw new ApiError("Segment not found", 404);
    }

    // Get segment details (optional but enriches prompt)
    const { data: segmentDetails } = await supabase
      .from("segment_details")
      .select("*")
      .eq("project_id", projectId)
      .eq("segment_id", segmentId)
      .order("approved_at", { ascending: false })
      .limit(1)
      .single();

    // Get portrait_final (optional)
    const { data: portraitFinal } = await supabase
      .from("portrait_final")
      .select("*")
      .eq("project_id", projectId)
      .order("approved_at", { ascending: false })
      .limit(1)
      .single();

    // Get triggers (optional but useful for channel strategy)
    const { data: triggers } = await supabase
      .from("triggers")
      .select("*")
      .eq("project_id", projectId)
      .eq("segment_id", segmentId)
      .order("approved_at", { ascending: false })
      .limit(1)
      .single();

    // Build prompt
    const prompt = buildChannelStrategyPrompt(
      typedProject.onboarding_data,
      segment as Segment,
      segmentDetails as SegmentDetails | null,
      portraitFinal as PortraitFinal | null,
      triggers as Triggers | null
    );

    // Generate with Claude
    const response = await withRetry(async () => {
      const text = await generateWithClaude({ prompt, maxTokens: 6000 });
      return parseJSONResponse<ChannelStrategyResponse>(text);
    });

    // Check if draft already exists for this segment
    const { data: existingDraft } = await supabase
      .from("channel_strategy_drafts")
      .select("id")
      .eq("project_id", projectId)
      .eq("segment_id", segmentId)
      .single();

    if (existingDraft) {
      // Update existing draft
      const { data: draft, error: updateError } = await supabase
        .from("channel_strategy_drafts")
        .update({
          primary_platforms: response.primary_platforms,
          content_preferences: response.content_preferences,
          trusted_sources: response.trusted_sources,
          communities: response.communities,
          search_patterns: response.search_patterns,
          advertising_response: response.advertising_response,
          version: 1,
        })
        .eq("id", existingDraft.id)
        .select()
        .single();

      if (updateError) {
        throw new ApiError("Failed to update draft", 500);
      }

      return NextResponse.json({ success: true, draft, updated: true });
    }

    // Insert new draft
    const { data: draft, error: insertError } = await supabase
      .from("channel_strategy_drafts")
      .insert({
        project_id: projectId,
        segment_id: segmentId,
        primary_platforms: response.primary_platforms,
        content_preferences: response.content_preferences,
        trusted_sources: response.trusted_sources,
        communities: response.communities,
        search_patterns: response.search_patterns,
        advertising_response: response.advertising_response,
        version: 1,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      throw new ApiError("Failed to save draft", 500);
    }

    return NextResponse.json({ success: true, draft });
  } catch (error) {
    return handleApiError(error);
  }
}
