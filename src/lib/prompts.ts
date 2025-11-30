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
  PainInitial,
  Canvas,
  Segment,
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
  jobs: Jobs,
  difficulties: Difficulties,
  segment: Segment
): string {
  return `You are an expert consumer psychologist specializing in purchase behavior.
Always respond in English, regardless of input language.

## Target Audience

${portraitFinal.sociodemographics}
${portraitFinal.psychographics}

## Specific Segment to Analyze

Name: ${segment.name}
Description: ${segment.description}
Sociodemographics: ${segment.sociodemographics}

## Their Jobs to Be Done (for this segment)

${jobs.functional_jobs.map((j) => `- ${j.job}`).join("\n")}
${jobs.emotional_jobs.map((j) => `- ${j.job}`).join("\n")}

## Their Difficulties (for this segment)

${difficulties.difficulties.map((d) => `- ${d.name}: ${d.description}`).join("\n")}

## Task

What are the DEEP PSYCHOLOGICAL TRIGGERS that drive purchase decisions for THIS SPECIFIC SEGMENT?

These are NOT surface-level reasons, but underlying emotional and psychological motivations:
- Fear-based triggers (fear of missing out, judgment, failure)
- Aspiration-based triggers (desire for status, belonging, self-improvement)
- Pain-avoidance triggers (avoiding discomfort, embarrassment, regret)
- Identity-based triggers (becoming who they want to be)

## Output Format

Return ONLY valid JSON:

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
export function buildSegmentsPrompt(
  onboarding: OnboardingData,
  portraitFinal: PortraitFinal,
  jobs: Jobs,
  triggers: Triggers
): string {
  return `You are an expert marketing strategist specializing in audience segmentation.
Always respond in English, regardless of input language.

## Target Audience Overview

${portraitFinal.sociodemographics}
${portraitFinal.psychographics}

## Jobs to Be Done

Functional: ${jobs.functional_jobs.map((j) => j.job).join(", ")}
Emotional: ${jobs.emotional_jobs.map((j) => j.job).join(", ")}
Social: ${jobs.social_jobs.map((j) => j.job).join(", ")}

## Deep Triggers

${triggers.triggers.map((t) => `- ${t.name}: ${t.description}`).join("\n")}

## Brand Context

Brand: ${onboarding.brandName}
Product: ${onboarding.productService}
Price Segment: ${onboarding.priceSegment}

## Task

Divide this broad audience into UP TO 10 distinct segments.

Each segment should be:
- Meaningfully different from others
- Large enough to be worth targeting
- Specific enough to create targeted messaging

For each segment provide:
1. Name - memorable, descriptive
2. Description - who they are (2-3 sentences)
3. Sociodemographics - specific to this segment

## Output Format

Return ONLY valid JSON:

{
  "segments": [
    {
      "index": 1,
      "name": "Health-Conscious Professionals",
      "description": "High-achieving professionals who treat their body as a performance asset. They invest in premium solutions and research extensively before purchasing.",
      "sociodemographics": "35-50, 60% women, $100k+ income, urban, executives and entrepreneurs"
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

Critically review this segmentation:

1. Are there OVERLAPS between segments? Which ones?
2. Are any segments TOO BROAD? Which ones?
3. Are any segments TOO NARROW? Which ones?
4. Are there MISSING segments that should be added?
5. Should any segments be MERGED?
6. Should any segments be SPLIT?

Provide at least 3 minimum matching segments with your actual customers if you were the brand.

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
    "Recommendation 1...",
    "Recommendation 2...",
    "Recommendation 3..."
  ]
}`;
}

// Prompt 11: Segment Details
export function buildSegmentDetailsPrompt(
  onboarding: OnboardingData,
  segment: SegmentInitial,
  triggers: Triggers
): string {
  return `You are an expert consumer psychologist.
Always respond in English, regardless of input language.

## Segment to Analyze

Name: ${segment.name}
Description: ${segment.description}
Sociodemographics: ${segment.sociodemographics}

## Known Deep Triggers (from general audience)

${triggers.triggers.map((t) => `- ${t.name}: ${t.description}`).join("\n")}

## Product Context

Product: ${onboarding.productService}
Benefits:
${onboarding.benefits.map((b) => `- ${b}`).join("\n")}

## Task

Provide detailed analysis for this specific segment:

### Needs
What specific needs does THIS segment have? (3-5 items)

### Triggers
What specifically triggers THIS segment to purchase? (3-5 items)

### Core Values
What values are most important to THIS segment? (3-5 items)

### Awareness Level
What is their awareness level?
- unaware: doesn't know they have a problem
- problem_aware: knows problem, doesn't know solution exists
- solution_aware: knows solutions exist, doesn't know your brand
- product_aware: knows your brand, hasn't purchased
- most_aware: has purchased or ready to buy

### Objections
Why might THIS segment NOT buy? What holds them back? (3-5 items)

## Output Format

Return ONLY valid JSON:

{
  "segment_name": "${segment.name}",
  "needs": [
    {
      "need": "Need description",
      "intensity": "critical"
    }
  ],
  "triggers": [
    {
      "trigger": "Trigger description",
      "trigger_moment": "When this trigger activates"
    }
  ],
  "core_values": [
    {
      "value": "Value name",
      "manifestation": "How this value shows in behavior"
    }
  ],
  "awareness_level": "solution_aware",
  "awareness_reasoning": "Why this level...",
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
  segment: SegmentBase,
  segmentDetails: SegmentDetails
): string {
  return `You are a consumer psychologist specializing in pain point analysis.
Always respond in English, regardless of input language.

## Segment

Name: ${segment.name}
Description: ${segment.description}
Sociodemographics: ${segment.sociodemographics}

Needs:
${segmentDetails.needs.map((n) => `- ${n.need}`).join("\n")}

Triggers:
${segmentDetails.triggers.map((t) => `- ${t.trigger}`).join("\n")}

Objections:
${segmentDetails.objections.map((o) => `- ${o.objection}`).join("\n")}

## Product Context

Product: ${onboarding.productService}
Problems Solved:
${onboarding.problems.map((p) => `- ${p}`).join("\n")}

## Task

Identify 6-10 DEEP PSYCHOLOGICAL PAIN POINTS for this segment.

These are NOT surface-level problems, but underlying emotional and psychological pains:
- Fear-based pains (fear of missing out, judgment, failure, wasting money)
- Aspiration-based pains (gap between current and desired state)
- Pain-avoidance pains (discomfort, embarrassment, regret)
- Identity-based pains (not feeling like true self, imposter syndrome)

For each pain provide:
1. Name - clear, descriptive
2. Description - detailed explanation (2-3 sentences)
3. Deep Triggers - root psychological causes (3-5 items)
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
  segment: SegmentBase,
  pain: PainInitial
): string {
  return `You are a consumer psychologist specializing in deep behavioral analysis.
Always respond in English, regardless of input language.

## Segment

Name: ${segment.name}
Description: ${segment.description}

## Pain Point to Analyze

Name: ${pain.name}
Description: ${pain.description}

Deep Triggers:
${pain.deep_triggers.map((t) => `- ${t}`).join("\n")}

Examples:
${pain.examples.map((e) => `- ${e}`).join("\n")}

## Task: Canvas Analysis

Explore this pain from multiple angles:

### 1. Emotional Aspects
- What specific emotions does this pain trigger?
- How intense are these emotions?
- How does this affect their self-image?
- What fears are connected?
- What hopes/desires are blocked?

### 2. Behavioral Patterns
- How do they currently cope with this pain?
- What workarounds have they tried?
- What is their search behavior?
- How does this pain affect daily decisions?
- What avoidance behaviors exist?

### 3. Buying Signals
- What would make them ready to buy NOW?
- What words/phrases would resonate?
- What proof do they need to see?
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

// Prompt 15: Canvas Extended
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

export interface SegmentDetailsResponse {
  segment_name: string;
  needs: Array<{
    need: string;
    intensity: "critical" | "high" | "medium" | "low";
  }>;
  triggers: Array<{
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
