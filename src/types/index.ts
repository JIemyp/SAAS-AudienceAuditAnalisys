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

// Project Status (legacy)
export type ProjectStatus = 'draft' | 'processing' | 'completed' | 'failed';

// Project Step (v4 - Updated flow: Segments before Deep Analysis)
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
