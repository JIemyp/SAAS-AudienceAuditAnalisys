// =====================================================
// Audience Research Tool v4 - All 15 Prompts
// Reference: audience-research-tool-v4-complete.md
// =====================================================

import {
  OnboardingData,
  Validation,
  Portrait,
  PortraitReview,
  PortraitFinal,
  Jobs,
  Preferences,
  Difficulties,
  Triggers,
  SegmentBase,
  SegmentInitial,
  SegmentDetails,
  SegmentsReview,
  PainInitial,
  Canvas,
  Segment,
  OverlapItem,
  BreadthItem,
  MissingSegmentItem,
} from "@/types";

// Helper to format uploaded files content
export function formatFilesContext(filesContent: string[]): string {
  if (!filesContent.length) return "";

  return `
## Additional Context from Uploaded Documents

${filesContent.map((content, i) => `### Document ${i + 1}\n${content}`).join("\n\n")}
`;
}

// =====================================================
// BLOCK 1: PORTRAIT PROMPTS (4)
// =====================================================

// Prompt 1: Validation
export function buildValidationPrompt(
  onboarding: OnboardingData,
  filesContent: string[] = []
): string {
  return `You are an expert marketing strategist.
Always respond in English, regardless of input language.

## Task

Before analyzing the target audience, confirm you understand the product correctly.

## Brand Context

Brand: ${onboarding.brandName}
Product: ${onboarding.productService}
Format: ${onboarding.productFormat}

Problems Solved:
${onboarding.problems.map((p) => `- ${p}`).join("\n")}

Benefits:
${onboarding.benefits.map((b) => `- ${b}`).join("\n")}

USP: ${onboarding.usp}

Competitors:
${onboarding.competitors.map((c) => `- ${c}`).join("\n")}

Differentiation: ${onboarding.differentiation}

${formatFilesContext(filesContent)}

## Your Task

Summarize your understanding:
1. What does this brand sell? (in simple terms)
2. What core problem does it solve?
3. What is the key differentiator from competitors?
4. Is anything unclear that needs clarification?

## Output Format

Return ONLY valid JSON:

{
  "what_brand_sells": "Clear, simple description...",
  "problem_solved": "The core problem it addresses...",
  "key_differentiator": "What makes it unique...",
  "understanding_correct": true,
  "clarification_needed": null
}

If something is unclear, set understanding_correct to false and explain in clarification_needed.`;
}

// Prompt 2: Portrait
export function buildPortraitPrompt(
  onboarding: OnboardingData,
  validation: Validation
): string {
  return `You are an expert marketing strategist specializing in audience research.
Always respond in English, regardless of input language.

## Confirmed Product Understanding

What brand sells: ${validation.what_brand_sells}
Problem solved: ${validation.problem_solved}
Key differentiator: ${validation.key_differentiator}

## Brand Context

Brand: ${onboarding.brandName}
Product: ${onboarding.productService}
Geography: ${onboarding.geography}
Price Segment: ${onboarding.priceSegment}
${onboarding.idealCustomer ? `Known Ideal Customer: ${onboarding.idealCustomer}` : ""}
${onboarding.notAudience ? `NOT Target Audience: ${onboarding.notAudience}` : ""}

## Task

Create a comprehensive portrait of the target audience.

### Socio-demographics
Describe in detail:
- Age range and distribution
- Gender distribution
- Income level
- Education level
- Location (urban/suburban/rural, regions)
- Occupation types
- Family status

### Psychographics
Describe in detail:
- Core values and beliefs
- Lifestyle and daily habits
- Interests and hobbies
- Personality traits

## Output Format

Return ONLY valid JSON:

{
  "sociodemographics": "Comprehensive text description...",
  "psychographics": "Comprehensive text description...",
  "demographics_detailed": {
    "age_range": "32-55 years",
    "gender_distribution": "65% women, 35% men",
    "income_level": "$80,000+ annually",
    "education": "University educated",
    "location": "Urban areas in USA, UK, Germany...",
    "occupation": "Professionals, executives, entrepreneurs",
    "family_status": "Mixed - singles and families with children"
  },
  "psychographics_detailed": {
    "values_beliefs": ["Health-conscious", "Science-driven", "Quality over price"],
    "lifestyle_habits": ["Regular exercise", "Meal planning", "Supplement routines"],
    "interests_hobbies": ["Biohacking", "Nutrition research", "Wellness podcasts"],
    "personality_traits": ["Skeptical", "Research-oriented", "Early adopters"]
  }
}`;
}

// Prompt 3: Portrait Review
export function buildPortraitReviewPrompt(
  onboarding: OnboardingData,
  portrait: Portrait
): string {
  return `You are an expert marketing strategist reviewing audience research.
Always respond in English, regardless of input language.

## Current Portrait

Socio-demographics:
${portrait.sociodemographics}

Psychographics:
${portrait.psychographics}

## Brand Context

Brand: ${onboarding.brandName}
Product: ${onboarding.productService}
Price Segment: ${onboarding.priceSegment}
${onboarding.idealCustomer ? `Known Ideal Customer: ${onboarding.idealCustomer}` : ""}
${onboarding.notAudience ? `NOT Target Audience: ${onboarding.notAudience}` : ""}

## Task

Critically review this portrait. Ask yourself:
1. What would you CHANGE in this portrait? Why?
2. What is MISSING that should be added?
3. What should be REMOVED as irrelevant?
4. Is the portrait too broad or too narrow?

Be specific and provide reasoning.

## Output Format

Return ONLY valid JSON:

{
  "what_to_change": [
    {
      "current": "Current description...",
      "suggested": "Better description...",
      "reasoning": "Why this change improves accuracy..."
    }
  ],
  "what_to_add": [
    {
      "addition": "What to add...",
      "reasoning": "Why this is important..."
    }
  ],
  "what_to_remove": [
    {
      "removal": "What to remove...",
      "reasoning": "Why this is irrelevant..."
    }
  ],
  "overall_assessment": "Too broad / Too narrow / Well balanced",
  "confidence_score": 8
}`;
}

// Prompt 4: Portrait Final
export function buildPortraitFinalPrompt(
  portrait: Portrait,
  review: PortraitReview
): string {
  return `You are an expert marketing strategist.
Always respond in English, regardless of input language.

## Original Portrait

Socio-demographics:
${portrait.sociodemographics}

Psychographics:
${portrait.psychographics}

## Review Feedback

Changes to make:
${JSON.stringify(review.what_to_change, null, 2)}

Additions:
${JSON.stringify(review.what_to_add, null, 2)}

Removals:
${JSON.stringify(review.what_to_remove, null, 2)}

## Task

Create the FINAL improved portrait by:
1. Applying all suggested changes
2. Adding all recommended additions
3. Removing all identified irrelevant items
4. Ensuring the portrait is well-balanced

## Output Format

Return ONLY valid JSON with the same structure as the original portrait, but improved:

{
  "sociodemographics": "Improved comprehensive text description...",
  "psychographics": "Improved comprehensive text description...",
  "demographics_detailed": {
    "age_range": "...",
    "gender_distribution": "...",
    "income_level": "...",
    "education": "...",
    "location": "...",
    "occupation": "...",
    "family_status": "..."
  },
  "psychographics_detailed": {
    "values_beliefs": [...],
    "lifestyle_habits": [...],
    "interests_hobbies": [...],
    "personality_traits": [...]
  },
  "changes_applied": [
    "Applied change 1...",
    "Added X...",
    "Removed Y..."
  ]
}`;
}

// =====================================================
// BLOCK 2: DEEP ANALYSIS PROMPTS (4)
// =====================================================

// Prompt 5: Jobs to Be Done
export function buildJobsPrompt(
  onboarding: OnboardingData,
  portraitFinal: PortraitFinal,
  segment: Segment
): string {
  return `You are an expert in Jobs-to-Be-Done framework.
Always respond in English, regardless of input language.

## Target Audience Portrait

${portraitFinal.sociodemographics}

${portraitFinal.psychographics}

## Specific Segment to Analyze

Name: ${segment.name}
Description: ${segment.description}
Sociodemographics: ${segment.sociodemographics}

## Brand Context

Brand: ${onboarding.brandName}
Product: ${onboarding.productService}
Problems Solved:
${onboarding.problems.map((p) => `- ${p}`).join("\n")}

## Task

Identify the Jobs to Be Done for THIS SPECIFIC SEGMENT. What are they trying to accomplish?

### Functional Jobs
Practical tasks and outcomes they want to achieve.

### Emotional Jobs
How they want to feel. Emotional states they seek.

### Social Jobs
How they want to be perceived by others.

For each job, provide:
- Clear description
- Why it matters to them
- How the product helps accomplish this job

## Output Format

Return ONLY valid JSON:

{
  "functional_jobs": [
    {
      "job": "Improve gut health and digestion",
      "why_it_matters": "Daily discomfort affects work performance",
      "how_product_helps": "Provides bioactive nutrients that support gut barrier"
    }
  ],
  "emotional_jobs": [
    {
      "job": "Feel in control of their health",
      "why_it_matters": "Tired of uncertainty and trial-and-error",
      "how_product_helps": "Science-backed approach gives confidence"
    }
  ],
  "social_jobs": [
    {
      "job": "Be seen as health-conscious and informed",
      "why_it_matters": "Identity tied to being knowledgeable about health",
      "how_product_helps": "Premium, science-backed product signals sophistication"
    }
  ]
}`;
}

// Prompt 6: Product Preferences
export function buildPreferencesPrompt(
  onboarding: OnboardingData,
  portraitFinal: PortraitFinal,
  jobs: Jobs,
  segment: Segment
): string {
  return `You are an expert consumer psychologist.
Always respond in English, regardless of input language.

## Target Audience

${portraitFinal.sociodemographics}
${portraitFinal.psychographics}

## Specific Segment to Analyze

Name: ${segment.name}
Description: ${segment.description}
Sociodemographics: ${segment.sociodemographics}

## Their Jobs to Be Done (for this segment)

Functional: ${jobs.functional_jobs.map((j) => j.job).join(", ")}
Emotional: ${jobs.emotional_jobs.map((j) => j.job).join(", ")}
Social: ${jobs.social_jobs.map((j) => j.job).join(", ")}

## Product Context

Product: ${onboarding.productService}
Benefits:
${onboarding.benefits.map((b) => `- ${b}`).join("\n")}

## Task

Based on THIS SPECIFIC SEGMENT profile, what specific PREFERENCES do they have when choosing products like this?

Consider:
- What features are non-negotiable?
- What quality standards do they expect?
- What formats/packaging do they prefer?
- What certifications matter to them?
- What price sensitivity do they have?

## Output Format

Return ONLY valid JSON:

{
  "preferences": [
    {
      "name": "Clean ingredients",
      "description": "Must have transparent, simple ingredient list without additives",
      "importance": "critical",
      "reasoning": "Past negative experiences with complex supplements"
    },
    {
      "name": "Scientific backing",
      "description": "Want to see research and clinical studies",
      "importance": "high",
      "reasoning": "Skeptical of marketing claims without evidence"
    }
  ]
}

Use importance levels: "critical", "high", "medium", "low"`;
}

// Prompt 7: Difficulties
export function buildDifficultiesPrompt(
  onboarding: OnboardingData,
  portraitFinal: PortraitFinal,
  preferences: Preferences,
  segment: Segment
): string {
  return `You are an expert consumer psychologist.
Always respond in English, regardless of input language.

## Target Audience

${portraitFinal.sociodemographics}
${portraitFinal.psychographics}

## Specific Segment to Analyze

Name: ${segment.name}
Description: ${segment.description}
Sociodemographics: ${segment.sociodemographics}

## Their Preferences (for this segment)

${preferences.preferences.map((p) => `- ${p.name}: ${p.description}`).join("\n")}

## Product Context

Product: ${onboarding.productService}
Competitors: ${onboarding.competitors.join(", ")}

## Task

What DIFFICULTIES and FRUSTRATIONS does THIS SPECIFIC SEGMENT face when searching for solutions to their problems?

Consider:
- Information overload
- Conflicting advice
- Past disappointments
- Trust issues
- Decision paralysis
- Practical obstacles

## Output Format

Return ONLY valid JSON:

{
  "difficulties": [
    {
      "name": "Information overload",
      "description": "Too many products, conflicting claims, hard to evaluate",
      "frequency": "constant",
      "emotional_impact": "Frustration, decision fatigue"
    },
    {
      "name": "Supplement disappointment cycle",
      "description": "Have tried many products with high hopes, minimal results",
      "frequency": "repeated",
      "emotional_impact": "Skepticism, wasted money guilt"
    }
  ]
}

Use frequency levels: "constant", "frequent", "occasional", "rare"`;
}

// Prompt 8: Deep Triggers
export function buildTriggersPrompt(
  onboarding: OnboardingData,
  portraitFinal: PortraitFinal,
  segment: Segment,
  segmentDetails: SegmentDetails | null,
  jobs: Jobs,
  preferences: Preferences,
  difficulties: Difficulties
): string {
  // Build segment details section if available
  const segmentDetailsSection = segmentDetails ? `
## Segment Deep Profile

### Needs (intensity-ranked)
${segmentDetails.needs?.map((n) => `- [${n.intensity.toUpperCase()}] ${n.need}`).join("\n") || "N/A"}

### Core Values
${segmentDetails.core_values?.map((v) => `- ${v.value}: ${v.manifestation}`).join("\n") || "N/A"}

### Awareness Level: ${segmentDetails.awareness_level || "N/A"}

### Known Objections
${segmentDetails.objections?.map((o) => `- ${o.objection} (Root: ${o.root_cause})`).join("\n") || "N/A"}
` : "";

  return `You are an expert consumer psychologist specializing in purchase behavior and deep psychological triggers.
Always respond in English, regardless of input language.

## Brand Context

Brand: ${onboarding.brandName}
Product: ${onboarding.productService}
Format: ${onboarding.productFormat}
Price Segment: ${onboarding.priceSegment}

Problems Solved:
${onboarding.problems.map((p) => `- ${p}`).join("\n")}

USP: ${onboarding.usp}

## Target Audience Overview

${portraitFinal.sociodemographics}
${portraitFinal.psychographics}

## Specific Segment to Analyze

Name: ${segment.name}
Description: ${segment.description}
Sociodemographics: ${segment.sociodemographics}
${segmentDetailsSection}
## Their Jobs to Be Done

### Functional Jobs
${jobs.functional_jobs.map((j) => `- ${j.job}
  Why it matters: ${j.why_it_matters}
  How product helps: ${j.how_product_helps}`).join("\n\n")}

### Emotional Jobs
${jobs.emotional_jobs.map((j) => `- ${j.job}
  Why it matters: ${j.why_it_matters}`).join("\n\n")}

### Social Jobs
${jobs.social_jobs?.map((j) => `- ${j.job}`).join("\n") || "N/A"}

## Their Product Preferences

${preferences.preferences.map((p) => `- ${p.name}: [${p.importance.toUpperCase()}] ${p.description}
  Reasoning: ${p.reasoning}`).join("\n\n")}

## Their Difficulties & Frustrations

${difficulties.difficulties.map((d) => `- [${d.frequency.toUpperCase()}] ${d.name}: ${d.description}
  Emotional Impact: ${d.emotional_impact}`).join("\n\n")}

## Task

Based on ALL the accumulated knowledge about this segment, identify the DEEP PSYCHOLOGICAL TRIGGERS that drive purchase decisions.

These are NOT surface-level reasons, but underlying emotional and psychological motivations:
- Fear-based triggers (fear of missing out, judgment, failure, health decline)
- Aspiration-based triggers (desire for status, belonging, self-improvement, identity)
- Pain-avoidance triggers (avoiding discomfort, embarrassment, regret, wasted effort)
- Identity-based triggers (becoming who they want to be, proving themselves)
- Social triggers (what others think, fitting in, standing out)

Consider:
1. How their jobs-to-be-done reveal what they're really trying to achieve
2. How their preferences show what they value in solutions
3. How their difficulties create urgency and emotional charge
4. How their objections reveal hidden fears
5. What specific moments or events would trigger action

## Output Format

Return ONLY valid JSON with 6-10 deep triggers:

{
  "triggers": [
    {
      "name": "Fear of health decline",
      "description": "Worry that current trajectory leads to serious health issues",
      "psychological_basis": "Loss aversion, mortality salience",
      "trigger_moment": "After a health scare or seeing peers with health problems",
      "messaging_angle": "Prevention and proactive health investment"
    },
    {
      "name": "Desire for certainty",
      "description": "Want to stop guessing and know something actually works",
      "psychological_basis": "Need for control, cognitive closure",
      "trigger_moment": "After another failed product or conflicting information",
      "messaging_angle": "Science-backed, transparent, proven mechanism"
    }
  ]
}`;
}

// =====================================================
// BLOCK 3: SEGMENTATION PROMPTS (3)
// =====================================================

// Prompt 9: Segments
// Prompt 9: Segments - now works with just Portrait Final (no Jobs/Triggers required)
export function buildSegmentsPrompt(
  onboarding: OnboardingData,
  portraitFinal: PortraitFinal
): string {
  return `You are an expert marketing strategist specializing in audience segmentation.
Always respond in English, regardless of input language.

## Target Audience Overview

${portraitFinal.sociodemographics}
${portraitFinal.psychographics}

## Demographic Details

- Age Range: ${portraitFinal.age_range}
- Gender: ${portraitFinal.gender_distribution}
- Income: ${portraitFinal.income_level}
- Location: ${portraitFinal.location}
- Occupation: ${portraitFinal.occupation}
- Education: ${portraitFinal.education}
- Family Status: ${portraitFinal.family_status}

## Psychographic Profile

Values & Beliefs: ${portraitFinal.values_beliefs?.join(", ") || "N/A"}
Lifestyle: ${portraitFinal.lifestyle_habits?.join(", ") || "N/A"}
Interests: ${portraitFinal.interests_hobbies?.join(", ") || "N/A"}
Personality: ${portraitFinal.personality_traits?.join(", ") || "N/A"}

## Brand Context

Brand: ${onboarding.brandName}
Product: ${onboarding.productService}
Format: ${onboarding.productFormat}
Price Segment: ${onboarding.priceSegment}
Business Model: ${onboarding.businessModel}
Geography: ${onboarding.geography}

Problems Solved:
${onboarding.problems.map((p) => `- ${p}`).join("\n")}

USP: ${onboarding.usp}
Differentiation: ${onboarding.differentiation}

## Task

Based on the audience portrait above, create EXACTLY 10 distinct audience segments.

Each segment should be:
- Meaningfully different from others in motivations, needs, and behavior
- Large enough to be worth targeting separately
- Specific enough to create targeted messaging
- Based on different combinations of psychographic and demographic traits

For each segment provide:
1. Index - number from 1 to 10
2. Name - memorable, descriptive (e.g., "Career-Focused Achievers")
3. Description - who they are, their key motivations (2-3 sentences)
4. Sociodemographics - specific demographic profile for this segment

IMPORTANT: You MUST create exactly 10 segments. No more, no less.

## Output Format

Return ONLY valid JSON:

{
  "segments": [
    {
      "index": 1,
      "name": "Health-Conscious Professionals",
      "description": "High-achieving professionals who treat their body as a performance asset. They invest in premium solutions and research extensively before purchasing.",
      "sociodemographics": "35-50, 60% women, $100k+ income, urban, executives and entrepreneurs"
    },
    {
      "index": 2,
      "name": "Budget-Conscious Families",
      "description": "...",
      "sociodemographics": "..."
    }
  ],
  "total_segments": 10
}`;
}

// Prompt 10: Segments Review
export function buildSegmentsReviewPrompt(
  onboarding: OnboardingData,
  segments: SegmentInitial[]
): string {
  return `You are an expert marketing strategist reviewing audience segmentation.
Always respond in English, regardless of input language.

## Current Segments

${segments
  .map(
    (s) => `
${s.segment_index}. ${s.name}
   ${s.description}
   Demographics: ${s.sociodemographics}
`
  )
  .join("\n")}

## Brand Context

Brand: ${onboarding.brandName}
Product: ${onboarding.productService}
Price Segment: ${onboarding.priceSegment}

## Task

You MUST analyze ALL ${segments.length} segments. This is MANDATORY.

IMPORTANT: Go through EACH segment one by one (segments 1 through ${segments.length}) and evaluate:
- Does it overlap with any other segment?
- Is it too broad?
- Is it too narrow?
- Is it well-defined?

Reference each segment by its index AND name (e.g., "Segment #3: Biohacking Early Adopters").

Your analysis must cover:
1. OVERLAPS: Which segments have overlapping audiences? Be specific.
2. TOO BROAD: Which segments cover too many different types of people?
3. TOO NARROW: Which segments are too specific with small market potential?
4. MISSING: What important segments are not covered?
5. TOP RECOMMENDATIONS: At least 5 specific, actionable recommendations.

For EACH of the ${segments.length} segments, you must decide if it has issues or is well-defined.
Aim for at least 5-8 total findings across all categories combined.
If a segment is perfect, you can note it's well-defined, but most segmentations have room for improvement.

## Output Format

Return ONLY valid JSON:

{
  "overlaps": [
    {
      "segments": [2, 5],
      "overlap_description": "Both target health-focused professionals...",
      "recommendation": "Merge into one or differentiate by X"
    }
  ],
  "too_broad": [
    {
      "segment": 3,
      "issue": "Covers too wide age range and motivations",
      "recommendation": "Split into sub-segments by age or motivation"
    }
  ],
  "too_narrow": [
    {
      "segment": 7,
      "issue": "Too specific, small addressable market",
      "recommendation": "Broaden or merge with segment X"
    }
  ],
  "missing_segments": [
    {
      "suggested_name": "Post-Surgery Recovery",
      "description": "People recovering from gut-related surgeries",
      "reasoning": "Significant market with high motivation"
    }
  ],
  "segments_matching_real_customers": [1, 4, 6],
  "overall_quality": 7,
  "top_recommendations": [
    "Specific recommendation about segment X...",
    "Specific recommendation about segment Y...",
    "Specific recommendation about merging/splitting...",
    "Specific recommendation about missing audience...",
    "Specific recommendation about positioning..."
  ]
}

IMPORTANT: top_recommendations MUST contain at least 5 items. Each recommendation should reference specific segment numbers.`;
}

// Prompt 10.5: Segments Final (applies review decisions to segments)
export function buildSegmentsFinalPrompt(
  onboarding: OnboardingData,
  originalSegments: SegmentInitial[],
  filteredReview: {
    segment_overlaps: OverlapItem[];
    too_broad: BreadthItem[];
    too_narrow: BreadthItem[];
    missing_segments: MissingSegmentItem[];
  }
): string {
  const hasChanges =
    filteredReview.segment_overlaps.length > 0 ||
    filteredReview.too_broad.length > 0 ||
    filteredReview.too_narrow.length > 0 ||
    filteredReview.missing_segments.length > 0;

  return `You are an expert marketing strategist specializing in audience segmentation.
Always respond in English, regardless of input language.

## Product Context

Brand: ${onboarding.brandName}
Product: ${onboarding.productService}
Format: ${onboarding.productFormat}
Price Segment: ${onboarding.priceSegment}
Geography: ${onboarding.geography}

## Original Segments

${originalSegments
  .map(
    (s) => `### Segment ${s.segment_index}: ${s.name}
Description: ${s.description}
Sociodemographics: ${s.sociodemographics}
`
  )
  .join("\n")}

## Approved Changes to Apply

${
  hasChanges
    ? `
### Overlaps to Fix (merge or differentiate segments):
${
  filteredReview.segment_overlaps.length > 0
    ? filteredReview.segment_overlaps
        .map((o) => `- Segments ${o.segments.join(" & ")}: ${o.overlap_description}\n  Recommendation: ${o.recommendation}`)
        .join("\n")
    : "None"
}

### Too Broad Segments to Narrow:
${
  filteredReview.too_broad.length > 0
    ? filteredReview.too_broad
        .map((b) => `- Segment ${b.segment}: ${b.issue}\n  Recommendation: ${b.recommendation}`)
        .join("\n")
    : "None"
}

### Too Narrow Segments to Expand:
${
  filteredReview.too_narrow.length > 0
    ? filteredReview.too_narrow
        .map((n) => `- Segment ${n.segment}: ${n.issue}\n  Recommendation: ${n.recommendation}`)
        .join("\n")
    : "None"
}

### New Segments to Add:
${
  filteredReview.missing_segments.length > 0
    ? filteredReview.missing_segments
        .map((m) => `- ${m.suggested_name}: ${m.description}\n  Reasoning: ${m.reasoning}`)
        .join("\n")
    : "None"
}
`
    : "No changes were approved. Return the original segments as-is."
}

## Task

${
  hasChanges
    ? `Apply the approved changes to create the final set of segments:
1. Merge overlapping segments where recommended
2. Narrow down segments that are too broad
3. Expand segments that are too narrow
4. Add any new segments that were recommended

For each final segment, specify what changes were applied (if any).
Mark new segments with is_new: true.`
    : "No changes need to be applied. Return the original segments with empty changes_applied arrays."
}

## Output Format

Return ONLY valid JSON:

{
  "segments": [
    {
      "segment_index": 1,
      "name": "Segment Name",
      "description": "Detailed description of the segment...",
      "sociodemographics": "Age, gender, income, location, occupation details...",
      "changes_applied": ["Merged with segment X", "Narrowed focus to Y"],
      "is_new": false
    }
  ],
  "total_segments": 10,
  "summary": "Brief summary of changes made"
}`;
}

// Prompt 11: Segment Details (v4 - uses portraitFinal for context, NOT triggers)
export function buildSegmentDetailsPrompt(
  onboarding: OnboardingData,
  segment: SegmentInitial,
  portraitFinal: {
    sociodemographics: string;
    psychographics: string;
    values_beliefs: string[];
    lifestyle_habits: string[];
    interests_hobbies: string[];
    personality_traits: string[];
  }
): string {
  return `You are an expert consumer psychologist specializing in audience segmentation analysis.
Always respond in English, regardless of input language.

## Segment to Analyze

Name: ${segment.name}
Description: ${segment.description}
Sociodemographics: ${segment.sociodemographics}

## General Audience Portrait (for context)

Sociodemographics: ${portraitFinal.sociodemographics}
Psychographics: ${portraitFinal.psychographics}

Values & Beliefs:
${portraitFinal.values_beliefs.map((v) => `- ${v}`).join("\n")}

Lifestyle Habits:
${portraitFinal.lifestyle_habits.map((h) => `- ${h}`).join("\n")}

Interests & Hobbies:
${portraitFinal.interests_hobbies.map((i) => `- ${i}`).join("\n")}

Personality Traits:
${portraitFinal.personality_traits.map((t) => `- ${t}`).join("\n")}

## Product Context

Brand: ${onboarding.brandName}
Product: ${onboarding.productService}
Format: ${onboarding.productFormat}
Price Segment: ${onboarding.priceSegment}

Problems Solved:
${onboarding.problems.map((p) => `- ${p}`).join("\n")}

Benefits:
${onboarding.benefits.map((b) => `- ${b}`).join("\n")}

USP: ${onboarding.usp}
Differentiation: ${onboarding.differentiation}

## Task

Provide detailed psychological analysis for this SPECIFIC segment (not the general audience). Based on who they are and the product context, identify:

### Sociodemographics (SEGMENT-SPECIFIC)
A detailed paragraph (3-5 sentences) describing THIS segment's specific demographic characteristics:
- Age range, gender distribution, income level
- Education, occupation, location
- Family status, lifestyle context
Make it specific to THIS segment, not a copy of the general portrait.

### Psychographics (SEGMENT-SPECIFIC)
A detailed paragraph (3-5 sentences) describing THIS segment's psychological profile:
- Values, beliefs, attitudes specific to this segment
- Personality traits and decision-making style
- What motivates them and what they fear

### Online Behavior (SEGMENT-SPECIFIC)
A detailed paragraph (3-5 sentences) describing how THIS segment behaves online:
- Which social platforms they prefer and why
- How they research products (reviews, forums, influencers, etc.)
- Content consumption habits (video, articles, podcasts)
- When and how they engage online

### Buying Behavior (SEGMENT-SPECIFIC)
A detailed paragraph (3-5 sentences) describing THIS segment's purchasing patterns:
- How they make buying decisions (impulse vs. research)
- What influences their purchase (price, quality, brand, reviews)
- Where they prefer to buy (online, retail, direct)
- Typical purchase frequency and budget allocation

### Needs (3-5 items)
What specific needs does THIS segment have that the product addresses?
Consider their unique lifestyle, pain points, and what they're trying to achieve.

### Core Values (3-5 items)
What values are most important to THIS segment?
What do they prioritize in life and in purchase decisions?

### Awareness Level (CRITICAL: Must vary by segment!)
Determine the MOST LIKELY awareness level for THIS SPECIFIC segment based on their characteristics.

IMPORTANT: Different segments WILL have different awareness levels. Consider:
- Their profession and industry knowledge
- Their information-seeking behavior
- Their prior experience with similar products
- How actively they search for solutions
- Their exposure to marketing in this category

Levels (choose the ONE that best fits THIS segment):
- unaware: Doesn't recognize they have a problem worth solving. Typically: people who normalized their issues, haven't connected symptoms to causes
- problem_aware: Knows the problem exists but doesn't know solutions are available. Typically: recently realized something is wrong, early-stage researchers
- solution_aware: Knows solutions exist in the market but doesn't know YOUR specific brand. Typically: active researchers, comparison shoppers, category-aware consumers
- product_aware: Knows YOUR brand specifically but hasn't purchased yet. Typically: have seen your ads, visited your site, engaged with content
- most_aware: Ready to buy or has already purchased. Typically: returning customers, referrals, people who just need a final push

Think carefully: A "Biohacking Enthusiast" will have DIFFERENT awareness than a "Health-Skeptic Parent". An "Executive" has DIFFERENT information access than a "Budget-Conscious Student".

### Objections (3-5 items)
Why might THIS segment NOT buy? What holds them back?
Consider: price concerns, skepticism, past experiences, competing priorities, fear of change.

NOTE: Do NOT include triggers in this analysis. Triggers will be generated separately.

## Output Format

Return ONLY valid JSON:

{
  "segment_name": "${segment.name}",
  "sociodemographics": "Detailed paragraph about THIS segment's demographics...",
  "psychographics": "Detailed paragraph about THIS segment's psychological profile...",
  "online_behavior": "Detailed paragraph about THIS segment's online behavior...",
  "buying_behavior": "Detailed paragraph about THIS segment's purchasing patterns...",
  "needs": [
    {
      "need": "Need description",
      "intensity": "critical | high | medium"
    }
  ],
  "core_values": [
    {
      "value": "Value name",
      "manifestation": "How this value shows in behavior"
    }
  ],
  "awareness_level": "<unaware|problem_aware|solution_aware|product_aware|most_aware>",
  "awareness_reasoning": "Detailed explanation of why THIS segment is at this level based on their characteristics...",
  "objections": [
    {
      "objection": "Objection description",
      "root_cause": "Underlying reason for objection",
      "how_to_overcome": "Potential response"
    }
  ]
}`;
}

// =====================================================
// BLOCK 4: PAINS PROMPTS (4)
// =====================================================

// Prompt 12: Pains
export function buildPainsPrompt(
  onboarding: OnboardingData,
  portraitFinal: PortraitFinal,
  segment: SegmentBase,
  segmentDetails: SegmentDetails,
  jobs: Jobs,
  preferences: Preferences,
  difficulties: Difficulties,
  triggers: Triggers
): string {
  return `You are a consumer psychologist specializing in deep pain point analysis.
Always respond in English, regardless of input language.

## Brand Context

Brand: ${onboarding.brandName}
Product: ${onboarding.productService}
Format: ${onboarding.productFormat}
Price Segment: ${onboarding.priceSegment}

Problems Solved:
${onboarding.problems.map((p) => `- ${p}`).join("\n")}

USP: ${onboarding.usp}

## Target Audience Overview

${portraitFinal.sociodemographics}
${portraitFinal.psychographics}

## Specific Segment

Name: ${segment.name}
Description: ${segment.description}
Sociodemographics: ${segment.sociodemographics}

### Segment Deep Profile

Needs (intensity-ranked):
${segmentDetails.needs?.map((n) => `- [${n.intensity.toUpperCase()}] ${n.need}`).join("\n") || "N/A"}

Core Values:
${segmentDetails.core_values?.map((v) => `- ${v.value}: ${v.manifestation}`).join("\n") || "N/A"}

Awareness Level: ${segmentDetails.awareness_level || "N/A"}

Known Objections:
${segmentDetails.objections?.map((o) => `- ${o.objection} (Root: ${o.root_cause})`).join("\n") || "N/A"}

## Jobs to Be Done

Functional Jobs:
${jobs.functional_jobs.map((j) => `- ${j.job}: ${j.why_it_matters}`).join("\n")}

Emotional Jobs:
${jobs.emotional_jobs.map((j) => `- ${j.job}: ${j.why_it_matters}`).join("\n")}

## Product Preferences

${preferences.preferences.map((p) => `- ${p.name} [${p.importance}]: ${p.reasoning}`).join("\n")}

## Difficulties & Frustrations

${difficulties.difficulties.map((d) => `- [${d.frequency.toUpperCase()}] ${d.name}: ${d.description}
  Emotional impact: ${d.emotional_impact}`).join("\n\n")}

## Deep Purchase Triggers

${triggers.triggers.map((t) => `- ${t.name}: ${t.description}
  Psychological basis: ${t.psychological_basis}
  Trigger moment: ${t.trigger_moment}`).join("\n\n")}

## Task

Based on ALL the accumulated knowledge about this segment, identify 6-10 DEEP PSYCHOLOGICAL PAIN POINTS.

These are NOT surface-level problems, but underlying emotional and psychological pains that:
1. Connect to their jobs-to-be-done (what they're trying to achieve)
2. Relate to their preferences (what they value)
3. Amplify their difficulties (what frustrates them)
4. Activate their triggers (what pushes them to act)

Pain categories to consider:
- Fear-based pains (fear of missing out, judgment, failure, wasting money)
- Aspiration-based pains (gap between current and desired state)
- Pain-avoidance pains (discomfort, embarrassment, regret)
- Identity-based pains (not feeling like true self, imposter syndrome)
- Social pains (judgment, comparison, isolation)

For each pain provide:
1. Name - clear, descriptive
2. Description - detailed explanation (2-3 sentences)
3. Deep Triggers - root psychological causes connected to their profile (3-5 items)
4. Examples - specific real-world manifestations with quotes (2-3 items)

## Output Format

Return ONLY valid JSON:

{
  "segment_name": "${segment.name}",
  "pains": [
    {
      "index": 1,
      "name": "Fear of wasted investment",
      "description": "Deep anxiety about spending money on yet another product that won't work. Previous failures have created a pattern of hope followed by disappointment.",
      "deep_triggers": [
        "Past financial losses on ineffective supplements",
        "Guilt about 'wasting' family money",
        "Fear of being seen as gullible"
      ],
      "examples": [
        "'I've spent hundreds on supplements that just sit in my cabinet'",
        "'My partner rolls their eyes every time I try something new'",
        "'I feel stupid for falling for marketing again'"
      ]
    }
  ]
}`;
}

// Prompt 13: Pains Ranking
export function buildPainsRankingPrompt(
  segment: SegmentBase,
  pains: PainInitial[]
): string {
  return `You are an expert in consumer purchase behavior.
Always respond in English, regardless of input language.

## Segment

Name: ${segment.name}
Description: ${segment.description}

## Pains to Rank

${pains
  .map(
    (p) => `
${p.pain_index}. ${p.name}
   ${p.description}
`
  )
  .join("\n")}

## Task

Rank these pains by their IMPACT ON PURCHASE DECISION.

Consider:
- How strongly does this pain motivate action?
- How urgent is the need to resolve this pain?
- How directly does the product address this pain?
- How emotionally charged is this pain?

Assign each pain:
- Impact score (1-10, where 10 = highest purchase motivation)
- Mark top 3 as needing deep Canvas analysis

## Output Format

Return ONLY valid JSON:

{
  "segment_name": "${segment.name}",
  "rankings": [
    {
      "pain_index": 1,
      "pain_name": "Fear of wasted investment",
      "impact_score": 9,
      "is_top_pain": true,
      "reasoning": "This directly blocks purchase decisions and must be addressed..."
    }
  ],
  "top_3_for_canvas": [1, 3, 5],
  "ranking_methodology": "Explanation of how you ranked..."
}`;
}

// Prompt 14: Canvas
export function buildCanvasPrompt(
  onboarding: OnboardingData,
  portraitFinal: PortraitFinal,
  segment: SegmentBase,
  segmentDetails: SegmentDetails | null,
  jobs: Jobs | null,
  preferences: Preferences | null,
  difficulties: Difficulties | null,
  triggers: Triggers | null,
  pain: PainInitial
): string {
  // Build optional sections
  const segmentDetailsSection = segmentDetails ? `
### Segment Deep Profile
Needs: ${segmentDetails.needs?.map((n) => n.need).join(", ") || "N/A"}
Core Values: ${segmentDetails.core_values?.map((v) => v.value).join(", ") || "N/A"}
Awareness Level: ${segmentDetails.awareness_level || "N/A"}
` : "";

  const jobsSection = jobs ? `
### Jobs to Be Done
${jobs.functional_jobs.slice(0, 3).map((j) => `- ${j.job}`).join("\n")}
${jobs.emotional_jobs.slice(0, 3).map((j) => `- ${j.job}`).join("\n")}
` : "";

  const preferencesSection = preferences ? `
### Key Preferences
${preferences.preferences.slice(0, 5).map((p) => `- ${p.name}: ${p.importance}`).join("\n")}
` : "";

  const difficultiesSection = difficulties ? `
### Key Difficulties
${difficulties.difficulties.slice(0, 5).map((d) => `- ${d.name}`).join("\n")}
` : "";

  const triggersSection = triggers ? `
### Purchase Triggers
${triggers.triggers.slice(0, 5).map((t) => `- ${t.name}: ${t.trigger_moment}`).join("\n")}
` : "";

  return `You are a consumer psychologist specializing in deep behavioral analysis and buyer psychology.
Always respond in English, regardless of input language.

## Brand Context

Brand: ${onboarding.brandName}
Product: ${onboarding.productService}
Price Segment: ${onboarding.priceSegment}
USP: ${onboarding.usp}

## Target Audience

${portraitFinal.sociodemographics}

## Segment Profile

Name: ${segment.name}
Description: ${segment.description}
${segmentDetailsSection}${jobsSection}${preferencesSection}${difficultiesSection}${triggersSection}
## Pain Point to Analyze Deeply

Name: ${pain.name}
Description: ${pain.description}

Deep Triggers:
${pain.deep_triggers.map((t) => `- ${t}`).join("\n")}

Examples:
${pain.examples.map((e) => `- ${e}`).join("\n")}

## Task: Canvas Analysis

Using ALL the context about this segment, explore this pain from multiple angles:

### 1. Emotional Aspects
- What specific emotions does this pain trigger?
- How intense are these emotions?
- How does this affect their self-image?
- What fears are connected (consider their objections)?
- What hopes/desires are blocked (consider their jobs-to-be-done)?

### 2. Behavioral Patterns
- How do they currently cope with this pain?
- What workarounds have they tried (consider their difficulties)?
- What is their search behavior (consider their preferences)?
- How does this pain affect daily decisions?
- What avoidance behaviors exist?

### 3. Buying Signals
- What would make them ready to buy NOW (consider their triggers)?
- What words/phrases would resonate?
- What proof do they need to see (consider their awareness level)?
- What objections must be overcome?
- What trigger events push them to act?

## Output Format

Return ONLY valid JSON:

{
  "pain_name": "${pain.name}",
  "emotional_aspects": [
    {
      "emotion": "Frustration",
      "intensity": "high",
      "description": "Ongoing frustration from repeated failures...",
      "self_image_impact": "Feels like they can't figure out what works",
      "connected_fears": ["Fear of never finding a solution", "Fear of health decline"],
      "blocked_desires": ["Desire to feel confident in health choices"]
    }
  ],
  "behavioral_patterns": [
    {
      "pattern": "Extensive research before purchase",
      "description": "Spends hours reading reviews and studies...",
      "frequency": "Every purchase decision",
      "coping_mechanism": "Tries to minimize risk through information",
      "avoidance": "Avoids impulse purchases, delays decisions"
    }
  ],
  "buying_signals": [
    {
      "signal": "Asks about money-back guarantee",
      "readiness_level": "high",
      "messaging_angle": "Risk-free trial, satisfaction guaranteed",
      "proof_needed": "Clear refund policy, testimonials from skeptics"
    }
  ]
}`;
}

// Prompt 15: Canvas Extended (Legacy V1)
export function buildCanvasExtendedPrompt(
  segment: SegmentBase,
  pain: PainInitial,
  canvas: Canvas
): string {
  return `You are a consumer psychologist specializing in narrative psychology.
Always respond in English, regardless of input language.

## Segment

Name: ${segment.name}

## Pain Point

Name: ${pain.name}
Description: ${pain.description}

## Canvas Analysis

Emotional Aspects:
${canvas.emotional_aspects.map((e) => `- ${e.emotion}: ${e.description}`).join("\n")}

Behavioral Patterns:
${canvas.behavioral_patterns.map((b) => `- ${b.pattern}: ${b.description}`).join("\n")}

Buying Signals:
${canvas.buying_signals.map((s) => `- ${s.signal}: ${s.messaging_angle}`).join("\n")}

## Task: Extended Deep Dive

Write a comprehensive analysis of this pain, exploring it from multiple angles.

### 1. The Journey
Describe the journey from pain awareness to solution seeking:
- How did they first notice this pain?
- What was the trigger moment?
- What have they tried before?
- Where are they now in their journey?

### 2. Emotional Peaks and Valleys
Describe the emotional experience:
- When is the pain most intense?
- What brings temporary relief?
- What makes it worse?
- How does it affect relationships?

### 3. The Purchase Decision Moment
What happens at the moment of purchase decision:
- What tips them over the edge?
- What last-minute doubts arise?
- What confirmation do they seek?
- How do they justify the purchase?

### 4. Post-Purchase Reality
What happens after they buy:
- What relief do they feel?
- What validation do they seek?
- What would make them advocates?
- What could cause buyer's remorse?

## Output Format

Return ONLY valid JSON:

{
  "pain_name": "${pain.name}",
  "extended_analysis": "Multi-paragraph comprehensive narrative analysis...",
  "different_angles": [
    {
      "angle": "The Skeptic's Journey",
      "narrative": "How a skeptic experiences this pain..."
    },
    {
      "angle": "The Desperate Seeker",
      "narrative": "How someone at wit's end experiences this..."
    }
  ],
  "journey_description": "Detailed journey from awareness to action...",
  "emotional_peaks": "When pain is most intense...",
  "emotional_valleys": "When there's temporary relief...",
  "purchase_moment": "What happens at decision time...",
  "post_purchase": "What happens after buying..."
}`;
}

// =====================================================
// Prompt 15 V2: Canvas Extended (Refactored with 5 JSONB sections)
// =====================================================

export interface CanvasExtendedV2PromptInput {
  onboarding: OnboardingData;
  segment: SegmentBase;
  segmentDetails: SegmentDetails | null;
  jobs: Jobs | null;
  triggers: Triggers | null;
  pain: PainInitial;
  canvas: Canvas;
}

export function buildCanvasExtendedPromptV2(input: CanvasExtendedV2PromptInput): {
  systemPrompt: string;
  userPrompt: string;
} {
  const { onboarding, segment, segmentDetails, jobs, triggers, pain, canvas } = input;

  const systemPrompt = `You are a world-class consumer psychologist and conversion copywriter with 20+ years of experience studying buyer behavior for premium health products.

Your task: Create a comprehensive psychological profile and messaging framework for ONE specific pain point within ONE specific audience segment.

This analysis will be used to write high-converting landing pages, ads, and email sequences.

Be specific. Be psychological. Be practical.

IMPORTANT: Return ONLY valid JSON. No markdown, no explanations, just the JSON object.`;

  // Build segment details section
  const segmentDetailsSection = segmentDetails ? `
## Segment Psychology

Needs:
${segmentDetails.needs?.map((n) => `- ${n.need}: intensity ${n.intensity}`).join("\n") || "N/A"}

Core Values:
${segmentDetails.core_values?.map((v) => `- ${v.value}: ${v.manifestation}`).join("\n") || "N/A"}

Awareness Level: ${segmentDetails.awareness_level || "N/A"}

Key Objections:
${segmentDetails.objections?.map((o) => `- ${o.objection}: ${o.root_cause}`).join("\n") || "N/A"}` : "";

  // Build jobs section
  const jobsSection = jobs ? `
## Jobs to Be Done

Functional:
${jobs.functional_jobs.map((j) => `- ${j.job}: ${j.why_it_matters}`).join("\n")}

Emotional:
${jobs.emotional_jobs.map((j) => `- ${j.job}: ${j.why_it_matters}`).join("\n")}

Social:
${jobs.social_jobs.map((j) => `- ${j.job}: ${j.why_it_matters}`).join("\n")}` : "";

  // Build triggers section
  const triggersSection = triggers ? `
## Purchase Triggers

${triggers.triggers.map((t) => `
Trigger: ${t.name}
Description: ${t.description}
Psychological Basis: ${t.psychological_basis}
Trigger Moment: ${t.trigger_moment}
`).join("\n")}` : "";

  // Build canvas section
  const canvasSection = `
## Canvas Analysis (already completed)

Emotional Aspects:
${canvas.emotional_aspects.map((e) => `- ${e.emotion} (${e.intensity}): ${e.description}
  Self-image: ${e.self_image_impact}
  Fears: ${e.connected_fears.join(", ")}
  Blocked desires: ${e.blocked_desires.join(", ")}`).join("\n")}

Behavioral Patterns:
${canvas.behavioral_patterns.map((b) => `- ${b.pattern}: ${b.description}
  Coping: ${b.coping_mechanism}
  Avoidance: ${b.avoidance}`).join("\n")}

Buying Signals:
${canvas.buying_signals.map((s) => `- ${s.signal} (${s.readiness_level}): ${s.messaging_angle}
  Proof needed: ${s.proof_needed}`).join("\n")}`;

  // Build objections for handlers
  const objectionsForHandlers = segmentDetails?.objections?.map((o) => o.objection).join(", ") || "Price concerns, skepticism about effectiveness";

  const userPrompt = `# Product Context

Brand: ${onboarding.brandName}
Product: ${onboarding.productService}
Problem Solved: ${onboarding.problems.join("; ")}
Unique Mechanism: ${onboarding.usp}
Price Segment: ${onboarding.priceSegment}


# Target Segment

Name: ${segment.name}
Description: ${segment.description}
Demographics: ${segment.sociodemographics}
${segmentDetailsSection}
${jobsSection}
${triggersSection}

# Pain Point to Analyze

Name: ${pain.name}
Description: ${pain.description}

Deep Triggers:
${pain.deep_triggers.map((t) => `- ${t}`).join("\n")}

Real Examples (quotes/scenarios):
${pain.examples.map((e) => `- "${e}"`).join("\n")}

${canvasSection}


# Your Task

Create a DEEP psychological analysis with practical messaging applications.

## 1. CUSTOMER JOURNEY MAP

Describe the emotional journey from problem awareness to purchase decision.
Be specific to THIS segment and THIS pain.

Structure:
- UNAWARE STAGE: What is their life like before they recognize the problem?
- PROBLEM AWARE: What moment makes them realize something is wrong?
- SOLUTION SEEKING: Where do they look? What do they try first?
- EVALUATION: How do they compare options? What criteria matter most?
- DECISION TRIGGER: What specific moment/event pushes them to buy?
- POST-PURCHASE: First 7 days experience. What confirms or challenges their decision?

For each stage, include:
- Their internal dialogue (actual thoughts)
- Emotional state
- Actions they take
- What they need to hear


## 2. EMOTIONAL INTENSITY MAP

Map the emotional peaks and valleys of their journey.

Structure:
- PEAKS (moments of hope/excitement): What creates positive emotion?
- VALLEYS (moments of despair/frustration): What triggers negative emotion?
- TURNING POINTS: What shifts them from negative to positive?

For each, provide:
- The trigger (what causes this emotional state)
- The internal dialogue
- How long this state typically lasts
- Intensity (1-10)


## 3. NARRATIVE ANGLES

Create 3 distinct narrative angles for reaching this segment about this pain.
Each angle is a different "story" that resonates with a subset of this segment.

For each angle provide:
- ANGLE NAME: Memorable name like "The Exhausted Warrior" or "The Secret Struggler"
- WHO THIS IS: Specific sub-persona within the segment - be detailed about their situation
- THEIR STORY: 2-3 sentences describing their journey with this pain - written as narrative
- CORE BELIEF: The limiting belief they hold that keeps them stuck
- BREAKTHROUGH MOMENT: What would need to happen for them to try your product
- KEY MESSAGE: The one sentence that would stop them scrolling
- PROOF THEY NEED: Specific type of evidence that would convince them
- OBJECTION TO ADDRESS: Their main "yes, but..." and how to handle it


## 4. MESSAGING FRAMEWORK

Practical copy elements for this pain + segment combination.

HEADLINES (5 options):
Headlines that would grab attention on a landing page or ad
- Must speak directly to this pain
- Must resonate with this segment's psychology
- Range from direct to curiosity-based

OPENING HOOKS (3 options):
First paragraph of landing page or email
- Must create immediate recognition ("this is about me")
- Must not feel salesy

BRIDGE STATEMENTS (3 options):
How to transition from problem to solution
- Validates their experience
- Creates hope without hype

PROOF FRAMING:
How to present evidence in a way this segment trusts
- What type of proof (studies, testimonials, mechanism explanation)?
- How to format it?
- What language to use?

OBJECTION HANDLERS (for these objections: ${objectionsForHandlers}):
For each objection, provide a handler that addresses it without being defensive

CALL TO ACTION OPTIONS (3):
CTAs that match their awareness level and buying signals
- Must feel like the logical next step
- Must reduce perceived risk


## 5. VOICE & TONE GUIDELINES

How to speak to this segment about this pain.

DO:
5 specific things about language, tone, approach

DON'T:
5 specific things to avoid

WORDS THAT RESONATE:
10 words/phrases that feel right to this segment

WORDS TO AVOID:
10 words/phrases that trigger skepticism or feel off


## Output Format

Return ONLY valid JSON with this exact structure:

{
  "customer_journey": {
    "unaware_stage": {
      "life_context": "...",
      "internal_dialogue": "...",
      "emotional_state": "...",
      "duration": "..."
    },
    "problem_aware": {
      "trigger_moment": "...",
      "internal_dialogue": "...",
      "emotional_state": "...",
      "actions": ["..."]
    },
    "solution_seeking": {
      "where_they_look": ["..."],
      "what_they_try": ["..."],
      "internal_dialogue": "...",
      "frustrations": ["..."]
    },
    "evaluation": {
      "criteria": ["..."],
      "comparison_behavior": "...",
      "internal_dialogue": "...",
      "dealbreakers": ["..."]
    },
    "decision_trigger": {
      "trigger_moment": "...",
      "internal_dialogue": "...",
      "what_they_need_to_hear": "...",
      "final_hesitation": "..."
    },
    "post_purchase": {
      "first_week": "...",
      "confirmation_moments": ["..."],
      "doubt_moments": ["..."],
      "advocacy_trigger": "..."
    }
  },
  "emotional_map": {
    "peaks": [
      {
        "moment": "...",
        "trigger": "...",
        "internal_dialogue": "...",
        "intensity": 7,
        "duration": "..."
      }
    ],
    "valleys": [
      {
        "moment": "...",
        "trigger": "...",
        "internal_dialogue": "...",
        "intensity": 8,
        "duration": "..."
      }
    ],
    "turning_points": [
      {
        "from_state": "...",
        "to_state": "...",
        "catalyst": "...",
        "internal_shift": "..."
      }
    ]
  },
  "narrative_angles": [
    {
      "angle_name": "...",
      "who_this_is": "...",
      "their_story": "...",
      "core_belief": "...",
      "breakthrough_moment": "...",
      "key_message": "...",
      "proof_they_need": "...",
      "objection_to_address": "..."
    }
  ],
  "messaging_framework": {
    "headlines": ["...", "...", "...", "...", "..."],
    "opening_hooks": ["...", "...", "..."],
    "bridge_statements": ["...", "...", "..."],
    "proof_framing": {
      "type": "...",
      "format": "...",
      "language": "..."
    },
    "objection_handlers": [
      {
        "objection": "...",
        "handler": "..."
      }
    ],
    "cta_options": ["...", "...", "..."]
  },
  "voice_and_tone": {
    "do": ["...", "...", "...", "...", "..."],
    "dont": ["...", "...", "...", "...", "..."],
    "words_that_resonate": ["...", "...", "...", "...", "...", "...", "...", "...", "...", "..."],
    "words_to_avoid": ["...", "...", "...", "...", "...", "...", "...", "...", "...", "..."]
  }
}`;

  return { systemPrompt, userPrompt };
}

// =====================================================
// LEGACY PROMPTS (for backward compatibility)
// =====================================================

export function buildOverviewPrompt(
  data: OnboardingData,
  filesContent: string[] = []
): string {
  return buildValidationPrompt(data, filesContent);
}

// =====================================================
// RESPONSE TYPE DEFINITIONS
// =====================================================

export interface ValidationResponse {
  what_brand_sells: string;
  problem_solved: string;
  key_differentiator: string;
  understanding_correct: boolean;
  clarification_needed: string | null;
}

export interface PortraitResponse {
  sociodemographics: string;
  psychographics: string;
  demographics_detailed: {
    age_range: string;
    gender_distribution: string;
    income_level: string;
    education: string;
    location: string;
    occupation: string;
    family_status: string;
  };
  psychographics_detailed: {
    values_beliefs: string[];
    lifestyle_habits: string[];
    interests_hobbies: string[];
    personality_traits: string[];
  };
}

export interface PortraitReviewResponse {
  what_to_change: Array<{
    current: string;
    suggested: string;
    reasoning: string;
  }>;
  what_to_add: Array<{
    addition: string;
    reasoning: string;
  }>;
  what_to_remove: Array<{
    removal: string;
    reasoning: string;
  }>;
  overall_assessment: string;
  confidence_score: number;
}

export interface PortraitFinalResponse extends PortraitResponse {
  changes_applied: string[];
}

export interface JobsResponse {
  functional_jobs: Array<{
    job: string;
    why_it_matters: string;
    how_product_helps: string;
  }>;
  emotional_jobs: Array<{
    job: string;
    why_it_matters: string;
    how_product_helps: string;
  }>;
  social_jobs: Array<{
    job: string;
    why_it_matters: string;
    how_product_helps: string;
  }>;
}

export interface PreferencesResponse {
  preferences: Array<{
    name: string;
    description: string;
    importance: "critical" | "high" | "medium" | "low";
    reasoning: string;
  }>;
}

export interface DifficultiesResponse {
  difficulties: Array<{
    name: string;
    description: string;
    frequency: "constant" | "frequent" | "occasional" | "rare";
    emotional_impact: string;
  }>;
}

export interface TriggersResponse {
  triggers: Array<{
    name: string;
    description: string;
    psychological_basis: string;
    trigger_moment: string;
    messaging_angle: string;
  }>;
}

export interface SegmentsResponse {
  segments: Array<{
    index: number;
    name: string;
    description: string;
    sociodemographics: string;
  }>;
  total_segments: number;
}

export interface SegmentsReviewResponse {
  overlaps: Array<{
    segments: number[];
    overlap_description: string;
    recommendation: string;
  }>;
  too_broad: Array<{
    segment: number;
    issue: string;
    recommendation: string;
  }>;
  too_narrow: Array<{
    segment: number;
    issue: string;
    recommendation: string;
  }>;
  missing_segments: Array<{
    suggested_name: string;
    description: string;
    reasoning: string;
  }>;
  segments_matching_real_customers: number[];
  overall_quality: number;
  top_recommendations: string[];
}

export interface SegmentsFinalResponse {
  segments: Array<{
    segment_index: number;
    name: string;
    description: string;
    sociodemographics: string;
    changes_applied: string[];
    is_new: boolean;
  }>;
  total_segments: number;
  summary: string;
}

export interface SegmentDetailsResponse {
  segment_name: string;
  // New behavior fields
  sociodemographics: string;
  psychographics: string;
  online_behavior: string;
  buying_behavior: string;
  // Original fields
  needs: Array<{
    need: string;
    intensity: "critical" | "high" | "medium" | "low";
  }>;
  // Triggers are optional - generated in a separate step in v4 flow
  triggers?: Array<{
    trigger: string;
    trigger_moment: string;
  }>;
  core_values: Array<{
    value: string;
    manifestation: string;
  }>;
  awareness_level: "unaware" | "problem_aware" | "solution_aware" | "product_aware" | "most_aware";
  awareness_reasoning: string;
  objections: Array<{
    objection: string;
    root_cause: string;
    how_to_overcome: string;
  }>;
}

export interface PainsResponse {
  segment_name: string;
  pains: Array<{
    index: number;
    name: string;
    description: string;
    deep_triggers: string[];
    examples: string[];
  }>;
}

export interface PainsRankingResponse {
  segment_name: string;
  rankings: Array<{
    pain_index: number;
    pain_name: string;
    impact_score: number;
    is_top_pain: boolean;
    reasoning: string;
  }>;
  top_3_for_canvas: number[];
  ranking_methodology: string;
}

export interface CanvasResponse {
  pain_name: string;
  emotional_aspects: Array<{
    emotion: string;
    intensity: string;
    description: string;
    self_image_impact: string;
    connected_fears: string[];
    blocked_desires: string[];
  }>;
  behavioral_patterns: Array<{
    pattern: string;
    description: string;
    frequency: string;
    coping_mechanism: string;
    avoidance: string;
  }>;
  buying_signals: Array<{
    signal: string;
    readiness_level: string;
    messaging_angle: string;
    proof_needed: string;
  }>;
}

export interface CanvasExtendedResponse {
  pain_name: string;
  extended_analysis: string;
  different_angles: Array<{
    angle: string;
    narrative: string;
  }>;
  journey_description: string;
  emotional_peaks: string;
  emotional_valleys: string;
  purchase_moment: string;
  post_purchase: string;
}

// OverviewResponse - used by legacy overview generation endpoint
export interface OverviewResponse {
  final_portrait: {
    sociodemographics: string;
    psychographics: string;
    general_pains: string[];
    purchase_triggers: string[];
  };
}

// Legacy types for backward compatibility
export interface AudienceOverviewForPrompt {
  sociodemographics: string;
  psychographics: string;
  general_pains: string[];
  triggers: string[];
}

export interface SegmentForPrompt {
  id: string;
  name: string;
  description: string;
  sociodemographics: string;
  needs: string[];
  triggers: string[];
  core_values: string[];
}

// =====================================================
// Canvas Extended V2 Response Types
// =====================================================

export interface CanvasExtendedV2Response {
  customer_journey: {
    unaware_stage: {
      life_context: string;
      internal_dialogue: string;
      emotional_state: string;
      duration: string;
    };
    problem_aware: {
      trigger_moment: string;
      internal_dialogue: string;
      emotional_state: string;
      actions: string[];
    };
    solution_seeking: {
      where_they_look: string[];
      what_they_try: string[];
      internal_dialogue: string;
      frustrations: string[];
    };
    evaluation: {
      criteria: string[];
      comparison_behavior: string;
      internal_dialogue: string;
      dealbreakers: string[];
    };
    decision_trigger: {
      trigger_moment: string;
      internal_dialogue: string;
      what_they_need_to_hear: string;
      final_hesitation: string;
    };
    post_purchase: {
      first_week: string;
      confirmation_moments: string[];
      doubt_moments: string[];
      advocacy_trigger: string;
    };
  };
  emotional_map: {
    peaks: Array<{
      moment: string;
      trigger: string;
      internal_dialogue: string;
      intensity: number;
      duration: string;
    }>;
    valleys: Array<{
      moment: string;
      trigger: string;
      internal_dialogue: string;
      intensity: number;
      duration: string;
    }>;
    turning_points: Array<{
      from_state: string;
      to_state: string;
      catalyst: string;
      internal_shift: string;
    }>;
  };
  narrative_angles: Array<{
    angle_name: string;
    who_this_is: string;
    their_story: string;
    core_belief: string;
    breakthrough_moment: string;
    key_message: string;
    proof_they_need: string;
    objection_to_address: string;
  }>;
  messaging_framework: {
    headlines: string[];
    opening_hooks: string[];
    bridge_statements: string[];
    proof_framing: {
      type: string;
      format: string;
      language: string;
    };
    objection_handlers: Array<{
      objection: string;
      handler: string;
    }>;
    cta_options: string[];
  };
  voice_and_tone: {
    do: string[];
    dont: string[];
    words_that_resonate: string[];
    words_to_avoid: string[];
  };
}
