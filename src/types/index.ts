// =====================================================
// Audience Research Tool v4 - TypeScript Types
// Reference: audience-research-tool-v4-complete.md
// =====================================================

// =====================================================
// Enums and Constants
// =====================================================

export type BusinessModel = 'B2C' | 'B2B' | 'Both';
export type PriceSegment = 'Mass Market' | 'Mid-Range' | 'Premium';

export type AwarenessLevel = 'unaware' | 'problem_aware' | 'solution_aware' | 'product_aware' | 'most_aware';
export type ImportanceLevel = 'critical' | 'high' | 'medium' | 'low';
export type FrequencyLevel = 'constant' | 'frequent' | 'occasional' | 'rare';

// =====================================================
// Language / Translation
// =====================================================

export type ContentLanguage = 'en' | 'uk' | 'ru' | 'de' | 'es' | 'fr';

export const LANGUAGE_LABELS: Record<ContentLanguage, string> = {
  en: 'English',
  uk: 'Українська',
  ru: 'Русский',
  de: 'Deutsch',
  es: 'Español',
  fr: 'Français',
};

export interface UserPreferences {
  id: string;
  user_id: string;
  preferred_language: ContentLanguage;
  created_at: string;
  updated_at: string;
}

// Project Status (legacy)
export type ProjectStatus = 'draft' | 'processing' | 'completed' | 'failed';

// Project Step (v5 - 21 steps with Strategic Modules)
export type ProjectStep =
  | 'onboarding'
  // Block 1: Portrait
  | 'validation_draft' | 'validation_approved'
  | 'portrait_draft' | 'portrait_approved'
  | 'portrait_review_draft' | 'portrait_review_approved'
  | 'portrait_final_draft' | 'portrait_final_approved'
  // Block 2: Segmentation (MOVED BEFORE Deep Analysis)
  | 'segments_draft' | 'segments_approved'
  | 'segments_review_draft' | 'segments_review_approved'
  | 'segments_final_draft' | 'segments_final_approved'
  | 'segment_details_draft' | 'segment_details_approved'
  // Block 3: Deep Analysis PER SEGMENT
  | 'jobs_draft' | 'jobs_approved'
  | 'preferences_draft' | 'preferences_approved'
  | 'difficulties_draft' | 'difficulties_approved'
  | 'triggers_draft' | 'triggers_approved'
  // Block 4: Pains & Canvas PER SEGMENT
  | 'pains_draft' | 'pains_approved'
  | 'pains_ranking_draft' | 'pains_ranking_approved'
  | 'canvas_draft' | 'canvas_approved'
  | 'canvas_extended_draft' | 'canvas_extended_approved'
  // Block 5: Strategic Modules PER SEGMENT (v5)
  | 'channel_strategy_draft' | 'channel_strategy_approved'
  | 'competitive_intelligence_draft' | 'competitive_intelligence_approved'
  | 'pricing_psychology_draft' | 'pricing_psychology_approved'
  | 'trust_framework_draft' | 'trust_framework_approved'
  | 'jtbd_context_draft' | 'jtbd_context_approved'
  | 'completed';

// Step order for navigation
// NOTE: From jobs_draft onwards, each step is per-segment.
// The user stays on the same page with segment tabs until ALL segments are approved.
export const PROJECT_STEPS: ProjectStep[] = [
  'onboarding',
  // Portrait block
  'validation_draft', 'validation_approved',
  'portrait_draft', 'portrait_approved',
  'portrait_review_draft', 'portrait_review_approved',
  'portrait_final_draft', 'portrait_final_approved',
  // Segmentation block (now BEFORE deep analysis)
  'segments_draft', 'segments_approved',
  'segments_review_draft', 'segments_review_approved',
  'segments_final_draft', 'segments_final_approved',
  'segment_details_draft', 'segment_details_approved',
  // Deep analysis per segment
  'jobs_draft', 'jobs_approved',
  'preferences_draft', 'preferences_approved',
  'difficulties_draft', 'difficulties_approved',
  'triggers_draft', 'triggers_approved',
  // Pains & Canvas per segment
  'pains_draft', 'pains_approved',
  'pains_ranking_draft', 'pains_ranking_approved',
  'canvas_draft', 'canvas_approved',
  'canvas_extended_draft', 'canvas_extended_approved',
  // Strategic modules per segment (v5)
  'channel_strategy_draft', 'channel_strategy_approved',
  'competitive_intelligence_draft', 'competitive_intelligence_approved',
  'pricing_psychology_draft', 'pricing_psychology_approved',
  'trust_framework_draft', 'trust_framework_approved',
  'jtbd_context_draft', 'jtbd_context_approved',
  'completed',
];

// Steps that are per-segment (require segment_id)
export const SEGMENT_BOUND_STEPS: ProjectStep[] = [
  'jobs_draft', 'jobs_approved',
  'preferences_draft', 'preferences_approved',
  'difficulties_draft', 'difficulties_approved',
  'triggers_draft', 'triggers_approved',
  'pains_draft', 'pains_approved',
  'pains_ranking_draft', 'pains_ranking_approved',
  'canvas_draft', 'canvas_approved',
  'canvas_extended_draft', 'canvas_extended_approved',
  // Strategic modules (v5)
  'channel_strategy_draft', 'channel_strategy_approved',
  'competitive_intelligence_draft', 'competitive_intelligence_approved',
  'pricing_psychology_draft', 'pricing_psychology_approved',
  'trust_framework_draft', 'trust_framework_approved',
  'jtbd_context_draft', 'jtbd_context_approved',
];

// =====================================================
// Projects
// =====================================================

export interface Project {
  id: string;
  user_id: string;
  name: string;
  status: ProjectStatus;
  current_step: ProjectStep;
  onboarding_data: OnboardingData;
  created_at: string;
  updated_at: string;
}

export interface OnboardingData {
  brandName: string;
  productService: string;
  productFormat: string;
  problems: string[];
  benefits: string[];
  usp: string;
  geography: string;
  businessModel: BusinessModel;
  priceSegment: PriceSegment;
  idealCustomer?: string | null;
  competitors: string[];
  differentiation: string;
  notAudience?: string | null;
  additionalContext?: string | null;
  files?: UploadedFile[];
}

// =====================================================
// Project Files
// =====================================================

export interface UploadedFile {
  id: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  expiresAt: string;
}

export interface ProjectFile {
  id: string;
  project_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  expires_at: string;
  created_at: string;
}

// =====================================================
// Block 1: Portrait Types
// =====================================================

// Prompt 1: Validation
export interface ValidationDraft {
  id: string;
  project_id: string;
  what_brand_sells: string;
  problem_solved: string;
  key_differentiator: string;
  understanding_correct: boolean;
  clarification_needed: string | null;
  version: number;
  created_at: string;
}

export interface Validation {
  id: string;
  project_id: string;
  what_brand_sells: string;
  problem_solved: string;
  key_differentiator: string;
  understanding_correct: boolean;
  approved_at: string;
}

// Prompt 2: Portrait
export interface DemographicsDetailed {
  age_range: string;
  gender_distribution: string;
  income_level: string;
  education: string;
  location: string;
  occupation: string;
  family_status: string;
}

export interface PsychographicsDetailed {
  values_beliefs: string[];
  lifestyle_habits: string[];
  interests_hobbies: string[];
  personality_traits: string[];
}

export interface PortraitDraft {
  id: string;
  project_id: string;
  sociodemographics: string;
  psychographics: string;
  age_range: string;
  gender_distribution: string;
  income_level: string;
  education: string;
  location: string;
  occupation: string;
  family_status: string;
  values_beliefs: string[];
  lifestyle_habits: string[];
  interests_hobbies: string[];
  personality_traits: string[];
  version: number;
  created_at: string;
}

export interface Portrait {
  id: string;
  project_id: string;
  sociodemographics: string;
  psychographics: string;
  age_range: string;
  gender_distribution: string;
  income_level: string;
  education: string;
  location: string;
  occupation: string;
  family_status: string;
  values_beliefs: string[];
  lifestyle_habits: string[];
  interests_hobbies: string[];
  personality_traits: string[];
  approved_at: string;
}

// Prompt 3: Portrait Review
export interface ChangeItem {
  current: string;
  suggested: string;
  reasoning: string;
}

export interface AdditionItem {
  addition: string;
  reasoning: string;
}

export interface RemovalItem {
  removal: string;
  reasoning: string;
}

export interface PortraitReviewDraft {
  id: string;
  project_id: string;
  original_portrait_id: string;
  what_to_change: ChangeItem[];
  what_to_add: AdditionItem[];
  what_to_remove: RemovalItem[];
  reasoning: string;
  version: number;
  created_at: string;
}

export interface PortraitReview {
  id: string;
  project_id: string;
  what_to_change: ChangeItem[];
  what_to_add: AdditionItem[];
  what_to_remove: RemovalItem[];
  reasoning: string;
  approved_at: string;
}

// Prompt 4: Portrait Final
export interface PortraitFinalDraft extends PortraitDraft {
  changes_applied: string[];
}

export interface PortraitFinal extends Portrait {
  changes_applied?: string[];
}

// =====================================================
// Block 2: Deep Analysis Types
// =====================================================

// Prompt 5: Jobs to Be Done
export interface JobItem {
  job: string;
  why_it_matters: string;
  how_product_helps: string;
}

export interface JobsDraft {
  id: string;
  project_id: string;
  segment_id?: string;
  functional_jobs: JobItem[];
  emotional_jobs: JobItem[];
  social_jobs: JobItem[];
  version: number;
  created_at: string;
}

export interface Jobs {
  id: string;
  project_id: string;
  functional_jobs: JobItem[];
  emotional_jobs: JobItem[];
  social_jobs: JobItem[];
  approved_at: string;
}

// Prompt 6: Preferences
export interface PreferenceItem {
  name: string;
  description: string;
  importance: ImportanceLevel;
  reasoning: string;
}

export interface PreferencesDraft {
  id: string;
  project_id: string;
  segment_id?: string;
  preferences: PreferenceItem[];
  version: number;
  created_at: string;
}

export interface Preferences {
  id: string;
  project_id: string;
  preferences: PreferenceItem[];
  approved_at: string;
}

// Prompt 7: Difficulties
export interface DifficultyItem {
  name: string;
  description: string;
  frequency: FrequencyLevel;
  emotional_impact: string;
}

export interface DifficultiesDraft {
  id: string;
  project_id: string;
  segment_id?: string;
  difficulties: DifficultyItem[];
  version: number;
  created_at: string;
}

export interface Difficulties {
  id: string;
  project_id: string;
  difficulties: DifficultyItem[];
  approved_at: string;
}

// Prompt 8: Deep Triggers
export interface TriggerItem {
  name: string;
  description: string;
  psychological_basis: string;
  trigger_moment: string;
  messaging_angle: string;
}

export interface TriggersDraft {
  id: string;
  project_id: string;
  segment_id?: string;
  triggers: TriggerItem[];
  version: number;
  created_at: string;
}

export interface Triggers {
  id: string;
  project_id: string;
  triggers: TriggerItem[];
  approved_at: string;
}

// =====================================================
// Block 3: Segmentation Types
// =====================================================

// Prompt 9: Segments

// Base segment type with common properties for prompts
export interface SegmentBase {
  id: string;
  name: string;
  description: string;
  sociodemographics: string;
}

export interface SegmentDraft extends SegmentBase {
  project_id: string;
  segment_index: number;
  version: number;
  created_at: string;
}

export interface SegmentInitial extends SegmentBase {
  project_id: string;
  segment_index: number;
  approved_at: string;
}

// Prompt 10: Segments Review
export interface OverlapItem {
  segments: number[];
  overlap_description: string;
  recommendation: string;
}

export interface BreadthItem {
  segment: number;
  issue: string;
  recommendation: string;
}

export interface MissingSegmentItem {
  suggested_name: string;
  description: string;
  reasoning: string;
}

export interface SegmentsReviewDraft {
  id: string;
  project_id: string;
  segment_overlaps: OverlapItem[];
  too_broad: BreadthItem[];
  too_narrow: BreadthItem[];
  missing_segments: MissingSegmentItem[];
  recommendations: string[];
  version: number;
  created_at: string;
}

export interface SegmentsReview {
  id: string;
  project_id: string;
  segment_overlaps: OverlapItem[];
  too_broad: BreadthItem[];
  too_narrow: BreadthItem[];
  missing_segments: MissingSegmentItem[];
  recommendations: string[];
  approved_at: string;
}

// Prompt 11: Segment Details
export interface NeedItem {
  need: string;
  intensity: ImportanceLevel;
}

export interface SegmentTriggerItem {
  trigger: string;
  trigger_moment: string;
}

export interface CoreValueItem {
  value: string;
  manifestation: string;
}

export interface ObjectionItem {
  objection: string;
  root_cause: string;
  how_to_overcome: string;
}

export interface SegmentDetailsDraft {
  id: string;
  project_id: string;
  segment_id: string;
  needs: NeedItem[];
  triggers: SegmentTriggerItem[];
  core_values: CoreValueItem[];
  awareness_level: AwarenessLevel;
  objections: ObjectionItem[];
  version: number;
  created_at: string;
}

export interface SegmentDetails {
  id: string;
  project_id: string;
  segment_id: string;
  needs: NeedItem[];
  triggers: SegmentTriggerItem[];
  core_values: CoreValueItem[];
  awareness_level: AwarenessLevel;
  objections: ObjectionItem[];
  approved_at: string;
}

// =====================================================
// Block 4: Pains Types
// =====================================================

// Prompt 12: Pains
export interface PainDraft {
  id: string;
  project_id: string;
  segment_id: string;
  pain_index: number;
  name: string;
  description: string;
  deep_triggers: string[];
  examples: string[];
  version: number;
  created_at: string;
}

export interface PainInitial {
  id: string;
  project_id: string;
  segment_id: string;
  pain_index: number;
  name: string;
  description: string;
  deep_triggers: string[];
  examples: string[];
  approved_at: string;
}

// Prompt 13: Pains Ranking
export interface PainRankingDraft {
  id: string;
  project_id: string;
  pain_id: string;
  impact_score: number;
  is_top_pain: boolean;
  ranking_reasoning: string;
  version: number;
  created_at: string;
}

export interface PainRanking {
  id: string;
  project_id: string;
  pain_id: string;
  impact_score: number;
  is_top_pain: boolean;
  ranking_reasoning: string;
  approved_at: string;
}

// Prompt 14: Canvas
export interface EmotionalAspect {
  emotion: string;
  intensity: string;
  description: string;
  self_image_impact: string;
  connected_fears: string[];
  blocked_desires: string[];
}

export interface BehavioralPattern {
  pattern: string;
  description: string;
  frequency: string;
  coping_mechanism: string;
  avoidance: string;
}

export interface BuyingSignal {
  signal: string;
  readiness_level: string;
  messaging_angle: string;
  proof_needed: string;
}

export interface CanvasDraft {
  id: string;
  project_id: string;
  segment_id?: string;
  pain_id: string;
  emotional_aspects: EmotionalAspect[];
  behavioral_patterns: BehavioralPattern[];
  buying_signals: BuyingSignal[];
  version: number;
  created_at: string;
}

export interface Canvas {
  id: string;
  project_id: string;
  pain_id: string;
  emotional_aspects: EmotionalAspect[];
  behavioral_patterns: BehavioralPattern[];
  buying_signals: BuyingSignal[];
  approved_at: string;
}

// Prompt 15: Canvas Extended
export interface DifferentAngle {
  angle: string;
  narrative: string;
}

export interface CanvasExtendedDraft {
  id: string;
  project_id: string;
  canvas_id: string;
  extended_analysis: string;
  different_angles: DifferentAngle[];
  journey_description: string;
  emotional_peaks: string;
  purchase_moment: string;
  post_purchase: string;
  version: number;
  created_at: string;
}

export interface CanvasExtended {
  id: string;
  project_id: string;
  canvas_id: string;
  extended_analysis: string;
  different_angles: DifferentAngle[];
  journey_description: string;
  emotional_peaks: string;
  purchase_moment: string;
  post_purchase: string;
  approved_at: string;
}

// =====================================================
// Canvas Extended V2 Types (Refactored)
// =====================================================

// Customer Journey Stages
export interface CustomerJourneyUnawareStage {
  life_context: string;
  internal_dialogue: string;
  emotional_state: string;
  duration: string;
}

export interface CustomerJourneyProblemAware {
  trigger_moment: string;
  internal_dialogue: string;
  emotional_state: string;
  actions: string[];
}

export interface CustomerJourneySolutionSeeking {
  where_they_look: string[];
  what_they_try: string[];
  internal_dialogue: string;
  frustrations: string[];
}

export interface CustomerJourneyEvaluation {
  criteria: string[];
  comparison_behavior: string;
  internal_dialogue: string;
  dealbreakers: string[];
}

export interface CustomerJourneyDecisionTrigger {
  trigger_moment: string;
  internal_dialogue: string;
  what_they_need_to_hear: string;
  final_hesitation: string;
}

export interface CustomerJourneyPostPurchase {
  first_week: string;
  confirmation_moments: string[];
  doubt_moments: string[];
  advocacy_trigger: string;
}

export interface CustomerJourney {
  unaware_stage: CustomerJourneyUnawareStage;
  problem_aware: CustomerJourneyProblemAware;
  solution_seeking: CustomerJourneySolutionSeeking;
  evaluation: CustomerJourneyEvaluation;
  decision_trigger: CustomerJourneyDecisionTrigger;
  post_purchase: CustomerJourneyPostPurchase;
}

// Emotional Map Types
export interface EmotionalPeak {
  moment: string;
  trigger: string;
  internal_dialogue: string;
  intensity: number; // 1-10
  duration: string;
}

export interface EmotionalValley {
  moment: string;
  trigger: string;
  internal_dialogue: string;
  intensity: number; // 1-10
  duration: string;
}

export interface EmotionalTurningPoint {
  from_state: string;
  to_state: string;
  catalyst: string;
  internal_shift: string;
}

export interface EmotionalMap {
  peaks: EmotionalPeak[];
  valleys: EmotionalValley[];
  turning_points: EmotionalTurningPoint[];
}

// Narrative Angles
export interface NarrativeAngle {
  angle_name: string;
  who_this_is: string;
  their_story: string;
  core_belief: string;
  breakthrough_moment: string;
  key_message: string;
  proof_they_need: string;
  objection_to_address: string;
}

// Messaging Framework
export interface ProofFraming {
  type: string;
  format: string;
  language: string;
}

export interface ObjectionHandler {
  objection: string;
  handler: string;
}

export interface MessagingFramework {
  headlines: string[];
  opening_hooks: string[];
  bridge_statements: string[];
  proof_framing: ProofFraming;
  objection_handlers: ObjectionHandler[];
  cta_options: string[];
}

// Voice and Tone
export interface VoiceAndTone {
  do: string[];
  dont: string[];
  words_that_resonate: string[];
  words_to_avoid: string[];
}

// Main Canvas Extended V2 Types
export interface CanvasExtendedV2Draft {
  id: string;
  project_id: string;
  pain_id: string;
  segment_id: string;
  customer_journey: CustomerJourney;
  emotional_map: EmotionalMap;
  narrative_angles: NarrativeAngle[];
  messaging_framework: MessagingFramework;
  voice_and_tone: VoiceAndTone;
  version: number;
  created_at: string;
}

export interface CanvasExtendedV2 {
  id: string;
  project_id: string;
  pain_id: string;
  segment_id: string;
  customer_journey: CustomerJourney;
  emotional_map: EmotionalMap;
  narrative_angles: NarrativeAngle[];
  messaging_framework: MessagingFramework;
  voice_and_tone: VoiceAndTone;
  approved_at: string;
}

// API Response type for Canvas Extended V2 generation
export interface CanvasExtendedV2Response {
  customer_journey: CustomerJourney;
  emotional_map: EmotionalMap;
  narrative_angles: NarrativeAngle[];
  messaging_framework: MessagingFramework;
  voice_and_tone: VoiceAndTone;
}

// =====================================================
// Channel Strategy Types
// =====================================================

// Prompt 16: Channel Strategy - Where to find the audience

export interface PlatformUsage {
  platform: string; // LinkedIn, Instagram, r/biohacking, YouTube
  usage_frequency: "daily" | "weekly" | "monthly";
  activity_type: "lurking" | "commenting" | "posting";
  peak_activity_times: string[]; // ["weekday_mornings", "lunch_break"]
  why_they_use_it: string;
}

export interface ContentPreference {
  format: string; // "long-form articles", "short videos", "podcasts"
  context: string; // "during commute", "at work", "before bed"
  attention_span: "skimmers" | "deep_readers" | "binge_watchers";
  triggering_topics: string[];
}

export interface TrustedSource {
  source_type: "industry_blogs" | "podcasts" | "youtube_channels" | "communities";
  specific_examples: string[]; // ACTUAL NAMES
  why_trusted: string;
}

export interface Community {
  type: "facebook_groups" | "subreddits" | "slack_communities" | "forums";
  specific_names: string[]; // ACTUAL NAMES
  participation_level: "observer" | "occasional" | "active" | "influencer";
  influence_on_purchases: "none" | "low" | "medium" | "high" | "critical";
}

export interface SearchPatterns {
  typical_queries: string[];
  search_depth: "first_page_only" | "deep_research" | "comparison_shopping";
  decision_timeline: "impulse" | "days" | "weeks" | "months";
}

export interface AdvertisingResponse {
  channels_they_notice: string[];
  ad_formats_that_work: string[];
  ad_formats_that_annoy: string[];
  retargeting_tolerance: "low" | "medium" | "high";
}

// API Response type for Channel Strategy generation
export interface ChannelStrategyResponse {
  primary_platforms: PlatformUsage[];
  content_preferences: ContentPreference[];
  trusted_sources: TrustedSource[];
  communities: Community[];
  search_patterns: SearchPatterns;
  advertising_response: AdvertisingResponse;
}

// Database row types (snake_case)
export interface ChannelStrategyDraft {
  id: string;
  project_id: string;
  segment_id: string;
  primary_platforms: PlatformUsage[];
  content_preferences: ContentPreference[];
  trusted_sources: TrustedSource[] | null;
  communities: Community[] | null;
  search_patterns: SearchPatterns | null;
  advertising_response: AdvertisingResponse | null;
  version: number;
  created_at: string;
}

export interface ChannelStrategy {
  id: string;
  project_id: string;
  segment_id: string;
  primary_platforms: PlatformUsage[];
  content_preferences: ContentPreference[];
  trusted_sources: TrustedSource[] | null;
  communities: Community[] | null;
  search_patterns: SearchPatterns | null;
  advertising_response: AdvertisingResponse | null;
  approved_at: string;
}

// =====================================================
// Competitive Intelligence Types (Phase 2)
// =====================================================

export interface AlternativeTried {
  solution_type: string;
  specific_examples: string[];
  adoption_rate: string;
  why_they_tried_it: string;
  initial_expectations: string;
  actual_experience: string;
  why_it_failed: string;
  emotional_residue: string;
}

export interface CurrentWorkaround {
  workaround: string;
  effectiveness: string;
  effort_required: string;
  cost: string;
  why_they_stick_with_it: string;
}

export interface CompetitorComparison {
  competitor_name: string;
  segment_perception: string;
  competitor_strengths: string[];
  competitor_weaknesses: string[];
  switching_triggers: string[];
}

export interface SwitchingBarrier {
  barrier_type: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  how_to_overcome: string;
}

export interface EvaluationProcess {
  criteria_for_comparison: string[];
  dealbreakers: string[];
  nice_to_haves: string[];
  how_they_compare: string;
  decision_authority: string;
}

export interface CategoryBeliefs {
  what_they_believe: string[];
  misconceptions_to_address: Array<{
    misconception: string;
    root_cause: string;
    how_to_reframe: string;
  }>;
}

export interface CompetitiveIntelligenceResponse {
  alternatives_tried: AlternativeTried[];
  current_workarounds: CurrentWorkaround[];
  vs_competitors: CompetitorComparison[];
  switching_barriers: SwitchingBarrier[];
  evaluation_process: EvaluationProcess;
  category_beliefs: CategoryBeliefs;
}

export interface CompetitiveIntelligenceDraft {
  id: string;
  project_id: string;
  segment_id: string;
  alternatives_tried: AlternativeTried[];
  current_workarounds: CurrentWorkaround[] | null;
  vs_competitors: CompetitorComparison[] | null;
  switching_barriers: SwitchingBarrier[] | null;
  evaluation_process: EvaluationProcess | null;
  category_beliefs: CategoryBeliefs | null;
  version: number;
  created_at: string;
}

export interface CompetitiveIntelligence {
  id: string;
  project_id: string;
  segment_id: string;
  alternatives_tried: AlternativeTried[];
  current_workarounds: CurrentWorkaround[] | null;
  vs_competitors: CompetitorComparison[] | null;
  switching_barriers: SwitchingBarrier[] | null;
  evaluation_process: EvaluationProcess | null;
  category_beliefs: CategoryBeliefs | null;
  approved_at: string;
}

// =====================================================
// Pricing Psychology Types (Phase 3)
// =====================================================

export interface BudgetContext {
  spending_category: string;
  budget_allocation: string;
  decision_cycle: string;
  who_controls_budget: string;
}

export interface PricePerception {
  price_sensitivity_level: 'low' | 'medium' | 'high';
  current_spending_on_alternatives: string;
  spending_ceiling: string;
  spending_sweet_spot: string;
  free_trial_importance: string;
}

export interface ValueAnchor {
  comparison_point: string;
  why_this_works: string;
}

export interface WillingnessToPaySignal {
  signal: string;
  indicates: string;
  how_to_respond: string;
}

export interface PaymentPsychology {
  preferred_structure: string[];
  payment_methods: string[];
  billing_frequency: string;
  payment_friction_points: string[];
}

export interface ROICalculation {
  how_they_measure_value: string;
  payback_expectation: string;
  metrics_they_track: string[];
}

export interface PricingObjection {
  objection: string;
  underlying_concern: string;
  is_price_or_value: 'price' | 'value';
  reframe_strategy: string;
}

export interface DiscountSensitivity {
  responds_to_discounts: boolean;
  types_that_work: string[];
  types_that_backfire: string[];
  optimal_strategy: string;
}

export interface BudgetTrigger {
  trigger_event: string;
  timing: string;
  how_to_leverage: string;
}

export interface PricingPsychologyResponse {
  budget_context: BudgetContext;
  price_perception: PricePerception;
  value_anchors: ValueAnchor[];
  willingness_to_pay_signals: WillingnessToPaySignal[];
  payment_psychology: PaymentPsychology;
  roi_calculation: ROICalculation;
  pricing_objections: PricingObjection[];
  discount_sensitivity: DiscountSensitivity;
  budget_triggers: BudgetTrigger[];
}

export interface PricingPsychologyDraft {
  id: string;
  project_id: string;
  segment_id: string;
  budget_context: BudgetContext | null;
  price_perception: PricePerception;
  value_anchors: ValueAnchor[] | null;
  willingness_to_pay_signals: WillingnessToPaySignal[] | null;
  payment_psychology: PaymentPsychology | null;
  roi_calculation: ROICalculation | null;
  pricing_objections: PricingObjection[] | null;
  discount_sensitivity: DiscountSensitivity | null;
  budget_triggers: BudgetTrigger[] | null;
  version: number;
  created_at: string;
}

export interface PricingPsychology {
  id: string;
  project_id: string;
  segment_id: string;
  budget_context: BudgetContext | null;
  price_perception: PricePerception;
  value_anchors: ValueAnchor[] | null;
  willingness_to_pay_signals: WillingnessToPaySignal[] | null;
  payment_psychology: PaymentPsychology | null;
  roi_calculation: ROICalculation | null;
  pricing_objections: PricingObjection[] | null;
  discount_sensitivity: DiscountSensitivity | null;
  budget_triggers: BudgetTrigger[] | null;
  approved_at: string;
}

// =====================================================
// Trust Framework Types (Phase 4)
// =====================================================

export interface BaselineTrust {
  trust_in_category: string;
  trust_in_brand: string;
  reasons_for_skepticism: string[];
  past_betrayals: string[];
}

export interface ProofType {
  proof_type: string;
  effectiveness: 'low' | 'medium' | 'high' | 'very_high';
  why_it_works: string;
  how_to_present: string;
  examples: string[];
}

export interface TrustedAuthority {
  authority_type: string;
  specific_names: string[];
  why_trusted: string;
  how_to_leverage: string;
}

export interface SocialProofRequirements {
  testimonial_profile: string;
  before_after_importance: string;
  numbers_that_matter: string[];
  case_study_angle: string;
}

export interface TransparencyNeeds {
  information_needed: string[];
  disclosure_expectations: string[];
  transparency_level: 'minimal' | 'moderate' | 'high' | 'full';
}

export interface TrustKiller {
  red_flag: string;
  why_triggers_skepticism: string;
  how_to_avoid: string;
}

export interface CredibilityMarker {
  signal: string;
  importance: 'low' | 'medium' | 'high' | 'critical';
  current_status: string;
}

export interface RiskReduction {
  biggest_risks: string[];
  reversal_mechanisms: Array<{
    mechanism: string;
    effectiveness: string;
    implementation: string;
  }>;
}

export interface TrustJourney {
  first_touchpoint_goal: string;
  mid_journey_reassurance: string[];
  pre_purchase_push: string;
  post_purchase_confirmation: string;
}

export interface TrustFrameworkResponse {
  baseline_trust: BaselineTrust;
  proof_hierarchy: ProofType[];
  trusted_authorities: TrustedAuthority[];
  social_proof: SocialProofRequirements;
  transparency_needs: TransparencyNeeds;
  trust_killers: TrustKiller[];
  credibility_markers: CredibilityMarker[];
  risk_reduction: RiskReduction;
  trust_journey: TrustJourney;
}

export interface TrustFrameworkDraft {
  id: string;
  project_id: string;
  segment_id: string;
  baseline_trust: BaselineTrust | null;
  proof_hierarchy: ProofType[];
  trusted_authorities: TrustedAuthority[] | null;
  social_proof: SocialProofRequirements | null;
  transparency_needs: TransparencyNeeds | null;
  trust_killers: TrustKiller[] | null;
  credibility_markers: CredibilityMarker[] | null;
  risk_reduction: RiskReduction | null;
  trust_journey: TrustJourney | null;
  version: number;
  created_at: string;
}

export interface TrustFramework {
  id: string;
  project_id: string;
  segment_id: string;
  baseline_trust: BaselineTrust | null;
  proof_hierarchy: ProofType[];
  trusted_authorities: TrustedAuthority[] | null;
  social_proof: SocialProofRequirements | null;
  transparency_needs: TransparencyNeeds | null;
  trust_killers: TrustKiller[] | null;
  credibility_markers: CredibilityMarker[] | null;
  risk_reduction: RiskReduction | null;
  trust_journey: TrustJourney | null;
  approved_at: string;
}

// =====================================================
// JTBD Context Types (Phase 5)
// =====================================================

export interface HireTrigger {
  situation: string;
  frequency: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  emotional_state: string;
}

export interface CompetingSolution {
  alternative: string;
  why_chosen: string;
  when_chosen: string;
  job_completion_rate: string;
  your_advantage: string;
}

export interface SuccessMetrics {
  how_measured: string[];
  immediate_progress: string[];
  short_term_success: string;
  long_term_success: string;
  acceptable_tradeoffs: string[];
}

export interface JobObstacle {
  obstacle: string;
  blocks_progress: string;
  how_you_remove_it: string;
}

export interface HiringAnxiety {
  anxiety: string;
  rooted_in: string;
  how_to_address: string;
}

export interface JobContext {
  job_reference_id: string;
  job_name: string;
  hire_triggers: HireTrigger[];
  competing_solutions: CompetingSolution[];
  success_metrics: SuccessMetrics;
  obstacles: JobObstacle[];
  hiring_anxieties: HiringAnxiety[];
}

export interface JobPriorityRanking {
  job_name: string;
  priority: number;
  reasoning: string;
}

export interface JobDependency {
  primary_job: string;
  enables_job: string;
  relationship: string;
}

export interface JTBDContextResponse {
  job_contexts: JobContext[];
  job_priority_ranking: JobPriorityRanking[];
  job_dependencies: JobDependency[];
}

export interface JTBDContextDraft {
  id: string;
  project_id: string;
  segment_id: string;
  job_contexts: JobContext[];
  job_priority_ranking: JobPriorityRanking[] | null;
  job_dependencies: JobDependency[] | null;
  version: number;
  created_at: string;
}

export interface JTBDContext {
  id: string;
  project_id: string;
  segment_id: string;
  job_contexts: JobContext[];
  job_priority_ranking: JobPriorityRanking[] | null;
  job_dependencies: JobDependency[] | null;
  approved_at: string;
}

// =====================================================
// Final Report Tables
// =====================================================

export interface Audience {
  id: string;
  project_id: string;
  product_understanding: {
    what_brand_sells: string;
    problem_solved: string;
    key_differentiator: string;
  };
  sociodemographics: string;
  psychographics: string;
  demographics_detailed: DemographicsDetailed;
  jobs_to_be_done: {
    functional: JobItem[];
    emotional: JobItem[];
    social: JobItem[];
  };
  product_preferences: PreferenceItem[];
  difficulties: DifficultyItem[];
  deep_triggers: TriggerItem[];
  created_at: string;
  updated_at: string;
}

export interface Segment extends SegmentBase {
  project_id: string;
  segment_index?: number;
  order_index?: number;
  needs: NeedItem[];
  triggers: SegmentTriggerItem[];
  core_values: CoreValueItem[];
  awareness_level: AwarenessLevel;
  objections: ObjectionItem[];
  created_at: string;
}

export interface Pain {
  id: string;
  project_id: string;
  segment_id: string;
  pain_index: number;
  name: string;
  description: string;
  deep_triggers: string[];
  examples: string[];
  impact_score: number;
  is_top_pain: boolean;
  canvas_emotional_aspects: EmotionalAspect[] | null;
  canvas_behavioral_patterns: BehavioralPattern[] | null;
  canvas_buying_signals: BuyingSignal[] | null;
  canvas_extended_analysis: string | null;
  created_at: string;
}

// =====================================================
// Legacy Types (for backward compatibility)
// =====================================================

export interface AudienceOverview {
  id: string;
  project_id: string;
  sociodemographics: SocioDemographics;
  psychographics: Psychographics;
  general_pains: GeneralPains;
  triggers: LegacyTriggers;
  full_content: string;
  created_at: string;
}

export interface SocioDemographics {
  age_range?: string;
  gender?: string;
  income_level?: string;
  education?: string;
  location?: string;
  occupation?: string;
  family_status?: string;
  [key: string]: string | undefined;
}

export interface Psychographics {
  values?: string[];
  interests?: string[];
  lifestyle?: string[];
  personality_traits?: string[];
  attitudes?: string[];
  [key: string]: string[] | undefined;
}

export interface GeneralPains {
  primary_pains?: string[];
  secondary_pains?: string[];
  frustrations?: string[];
  fears?: string[];
  [key: string]: string[] | undefined;
}

export interface LegacyTriggers {
  purchase_triggers?: string[];
  emotional_triggers?: string[];
  rational_triggers?: string[];
  timing_triggers?: string[];
  [key: string]: string[] | undefined;
}

// =====================================================
// Database Row Types (snake_case for Supabase)
// =====================================================

export interface ProjectRow {
  id: string;
  user_id: string;
  name: string;
  status: ProjectStatus;
  current_step: ProjectStep;
  onboarding_data: OnboardingData;
  created_at: string;
  updated_at: string;
}

export interface AudienceOverviewRow {
  id: string;
  project_id: string;
  sociodemographics: SocioDemographics;
  psychographics: Psychographics;
  general_pains: GeneralPains;
  triggers: LegacyTriggers;
  full_content: string;
  created_at: string;
}

export interface SegmentRow {
  id: string;
  project_id: string;
  order_index: number;
  name: string;
  description: string;
  sociodemographics: string;
  needs: string[] | NeedItem[];
  triggers: string[] | SegmentTriggerItem[];
  core_values: string[] | CoreValueItem[];
  awareness_level?: AwarenessLevel;
  objections?: ObjectionItem[];
  created_at: string;
}

export interface PainRow {
  id: string;
  segment_id: string;
  project_id?: string;
  name: string;
  description: string;
  deep_triggers: string[];
  examples: string[];
  extended_analysis: string | null;
  impact_score?: number;
  is_top_pain?: boolean;
  canvas_emotional_aspects?: EmotionalAspect[];
  canvas_behavioral_patterns?: BehavioralPattern[];
  canvas_buying_signals?: BuyingSignal[];
  canvas_extended_analysis?: string;
  created_at: string;
}

export interface ProjectFileRow {
  id: string;
  project_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  expires_at: string;
  created_at: string;
}

// =====================================================
// API Response Types
// =====================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface GenerateResponse<T> {
  success: boolean;
  draft?: T;
  error?: string;
}

export interface ApproveResponse<T> {
  success: boolean;
  approved?: T;
  next_step: ProjectStep;
  error?: string;
}

// =====================================================
// Recommendation Decision Types (Apply/Edit/Dismiss)
// =====================================================

export type RecommendationStatus = "pending" | "applied" | "edited" | "dismissed";

export interface RecommendationDecision {
  id: string;
  status: RecommendationStatus;
  originalText: string;
  editedText?: string;
}

// =====================================================
// Segments Final Types (applies Segments Review decisions)
// =====================================================

export interface SegmentFinalDraft {
  id: string;
  project_id: string;
  segment_index: number;
  name: string;
  description: string;
  sociodemographics: string;
  changes_applied: string[];
  is_new: boolean;
  version: number;
  created_at: string;
}

export interface SegmentFinal {
  id: string;
  project_id: string;
  segment_index: number;
  name: string;
  description: string;
  sociodemographics: string;
  changes_applied: string[];
  is_new: boolean;
  approved_at: string;
}

// =====================================================
// Project Collaboration Types
// =====================================================

export type ProjectRole = 'owner' | 'viewer';

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role: ProjectRole;
  invited_by: string | null;
  joined_at: string;
  // Joined from auth.users
  email?: string;
}

export interface ProjectInvite {
  id: string;
  project_id: string;
  email: string;
  role: ProjectRole;
  token: string;
  invited_by: string | null;
  created_at: string;
  expires_at: string;
  accepted_at: string | null;
}

export interface ProjectMemberRow {
  id: string;
  project_id: string;
  user_id: string;
  role: ProjectRole;
  invited_by: string | null;
  joined_at: string;
}

export interface ProjectInviteRow {
  id: string;
  project_id: string;
  email: string;
  role: ProjectRole;
  token: string;
  invited_by: string | null;
  created_at: string;
  expires_at: string;
  accepted_at: string | null;
}
