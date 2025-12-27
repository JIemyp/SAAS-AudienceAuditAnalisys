// =====================================================
// Audience Research Tool v4 - Approve Utilities
// Idempotent approve with history tracking
// Reference: FULL_SYSTEM_AUDIT.md Block A
// =====================================================

import { SupabaseClient } from "@supabase/supabase-js";
import { ApiError } from "./api-utils";

// =====================================================
// Types
// =====================================================

/**
 * Scope determines the unique constraint columns:
 * - project: UNIQUE (project_id) - one record per project
 * - segment: UNIQUE (project_id, segment_id) - one record per segment
 * - pain: UNIQUE (project_id, segment_id, pain_id) - one record per pain
 */
export type ApproveScope = "project" | "segment" | "pain";

/**
 * Configuration for approve operation
 */
export interface ApproveConfig {
  // Table names
  draftTable: string;
  approvedTable: string;

  // Scope determines unique constraint columns
  scope: ApproveScope;

  // Fields to copy from draft to approved (excluding IDs)
  fields: string[];

  // Optional: clean up drafts after approve (default: true)
  cleanupDrafts?: boolean;

  // Optional: track history in data_history table (default: true)
  trackHistory?: boolean;
}

/**
 * Parameters for single record approve
 */
export interface ApproveParams {
  supabase: SupabaseClient;
  projectId: string;
  draftId: string;
  segmentId?: string;
  painId?: string;
  userId?: string;
}

/**
 * Parameters for batch approve (multiple records)
 */
export interface ApproveBatchParams {
  supabase: SupabaseClient;
  projectId: string;
  draftIds: string[];
  segmentId?: string;
  userId?: string;
}

/**
 * Result of single approve operation
 */
export interface ApproveResult {
  success: boolean;
  approved: Record<string, unknown>;
  updated: boolean; // true if existing record was updated, false if new inserted
  historyId?: string;
}

/**
 * Result of batch approve operation
 */
export interface ApproveBatchResult {
  success: boolean;
  approved: Record<string, unknown>[];
  updated: number; // count of previously existing records
  inserted: number; // count of newly inserted records
  errors: Array<{ draftId: string; error: string }>;
}

// =====================================================
// History Recording
// =====================================================

/**
 * Records operation in data_history table for audit trail and rollback
 */
async function recordHistory(
  supabase: SupabaseClient,
  tableName: string,
  recordId: string,
  projectId: string,
  segmentId: string | null,
  operation: "INSERT" | "UPDATE" | "DELETE" | "UPSERT",
  oldData: Record<string, unknown> | null,
  newData: Record<string, unknown>,
  userId?: string
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from("data_history")
      .insert({
        table_name: tableName,
        record_id: recordId,
        project_id: projectId,
        segment_id: segmentId,
        operation,
        old_data: oldData,
        new_data: newData,
        changed_by: userId || null,
        metadata: {
          timestamp: new Date().toISOString(),
          source: "approve-utils",
        },
      })
      .select("id")
      .single();

    if (error) {
      console.warn("[approve-utils] Failed to record history:", error.message);
      return null;
    }

    return data.id;
  } catch (e) {
    console.warn("[approve-utils] History recording exception:", e);
    return null;
  }
}

// =====================================================
// Single Record Approve (Upsert Pattern)
// Use for: jobs, preferences, difficulties, triggers, portrait_final, V5 tables
// =====================================================

/**
 * Approves a single draft record with upsert logic:
 * 1. Fetches draft by ID
 * 2. Checks if approved record already exists
 * 3. If exists: UPDATE with new data
 * 4. If not exists: INSERT new record
 * 5. Records history for audit
 * 6. Optionally cleans up draft
 */
export async function approveWithUpsert(
  config: ApproveConfig,
  params: ApproveParams
): Promise<ApproveResult> {
  const { supabase, projectId, draftId, segmentId, painId, userId } = params;
  const {
    draftTable,
    approvedTable,
    scope,
    fields,
    cleanupDrafts = true,
    trackHistory = true,
  } = config;

  console.log(`[approve-utils] Starting upsert approve for ${approvedTable}`);
  console.log(`[approve-utils] Project: ${projectId}, Segment: ${segmentId}, Draft: ${draftId}`);

  // =========================================
  // Step 1: Fetch draft
  // =========================================
  let draftQuery = supabase
    .from(draftTable)
    .select("*")
    .eq("id", draftId)
    .eq("project_id", projectId);

  if (segmentId) {
    draftQuery = draftQuery.eq("segment_id", segmentId);
  }

  const { data: draft, error: draftError } = await draftQuery.single();

  if (draftError || !draft) {
    console.error(`[approve-utils] Draft not found:`, draftError?.message);
    throw new ApiError("Draft not found", 404);
  }

  console.log(`[approve-utils] Found draft with ${Object.keys(draft).length} fields`);

  // =========================================
  // Step 2: Build approved data object
  // =========================================
  const approvedData: Record<string, unknown> = {
    project_id: projectId,
    approved_at: new Date().toISOString(),
  };

  if (segmentId) {
    approvedData.segment_id = segmentId;
  }

  if (painId) {
    approvedData.pain_id = painId;
  }

  // Copy specified fields from draft
  for (const field of fields) {
    if (draft[field] !== undefined) {
      approvedData[field] = draft[field];
    }
  }

  console.log(`[approve-utils] Prepared approved data with fields:`, Object.keys(approvedData));

  // =========================================
  // Step 3: Check if record already exists
  // =========================================
  let existingQuery = supabase
    .from(approvedTable)
    .select("*")
    .eq("project_id", projectId);

  if (scope === "segment" || scope === "pain") {
    if (!segmentId) {
      throw new ApiError("Segment ID required for this scope", 400);
    }
    existingQuery = existingQuery.eq("segment_id", segmentId);
  }

  if (scope === "pain") {
    if (!painId) {
      throw new ApiError("Pain ID required for this scope", 400);
    }
    existingQuery = existingQuery.eq("pain_id", painId);
  }

  const { data: existing, error: existingError } = await existingQuery.maybeSingle();

  if (existingError) {
    console.warn(`[approve-utils] Error checking existing:`, existingError.message);
  }

  let approved: Record<string, unknown>;
  let updated = false;
  let historyId: string | null = null;

  // =========================================
  // Step 4a: UPDATE if exists
  // =========================================
  if (existing) {
    console.log(`[approve-utils] Found existing record ${existing.id}, updating...`);

    const { data: updatedRecord, error: updateError } = await supabase
      .from(approvedTable)
      .update(approvedData)
      .eq("id", existing.id)
      .select()
      .single();

    if (updateError) {
      console.error(`[approve-utils] Update error:`, updateError);
      throw new ApiError("Failed to update approved record", 500);
    }

    approved = updatedRecord;
    updated = true;

    // Record history
    if (trackHistory) {
      historyId = await recordHistory(
        supabase,
        approvedTable,
        existing.id,
        projectId,
        segmentId || null,
        "UPDATE",
        existing,
        approvedData,
        userId
      );
      console.log(`[approve-utils] Recorded UPDATE history: ${historyId}`);
    }
  }
  // =========================================
  // Step 4b: INSERT if not exists
  // =========================================
  else {
    console.log(`[approve-utils] No existing record, inserting new...`);

    const { data: insertedRecord, error: insertError } = await supabase
      .from(approvedTable)
      .insert(approvedData)
      .select()
      .single();

    if (insertError) {
      console.error(`[approve-utils] Insert error:`, insertError);
      throw new ApiError("Failed to insert approved record", 500);
    }

    approved = insertedRecord;

    // Record history
    if (trackHistory) {
      historyId = await recordHistory(
        supabase,
        approvedTable,
        insertedRecord.id,
        projectId,
        segmentId || null,
        "INSERT",
        null,
        approvedData,
        userId
      );
      console.log(`[approve-utils] Recorded INSERT history: ${historyId}`);
    }
  }

  // =========================================
  // Step 5: Cleanup draft (optional)
  // =========================================
  if (cleanupDrafts) {
    console.log(`[approve-utils] Cleaning up draft ${draftId}`);
    const { error: deleteError } = await supabase
      .from(draftTable)
      .delete()
      .eq("id", draftId);

    if (deleteError) {
      console.warn(`[approve-utils] Failed to cleanup draft:`, deleteError.message);
    }
  }

  console.log(`[approve-utils] Approve complete. Updated: ${updated}, Record ID: ${approved.id}`);

  return {
    success: true,
    approved,
    updated,
    historyId: historyId || undefined,
  };
}

// =====================================================
// Batch Approve (Delete-then-Insert Pattern)
// Use for: pains (multiple pains per segment), canvas (multiple per segment)
// =====================================================

/**
 * Approves multiple draft records with batch logic:
 * 1. Fetches all drafts by IDs
 * 2. Gets existing records for history
 * 3. Deletes all existing records for segment
 * 4. Inserts all new records in batch
 * 5. Records history for audit
 * 6. Cleans up drafts
 */
export async function approveBatch(
  config: ApproveConfig,
  params: ApproveBatchParams
): Promise<ApproveBatchResult> {
  const { supabase, projectId, draftIds, segmentId, userId } = params;
  const {
    draftTable,
    approvedTable,
    scope,
    fields,
    trackHistory = true,
  } = config;

  console.log(`[approve-utils] Starting batch approve for ${approvedTable}`);
  console.log(`[approve-utils] Project: ${projectId}, Segment: ${segmentId}, Drafts: ${draftIds.length}`);

  if (!segmentId && (scope === "segment" || scope === "pain")) {
    throw new ApiError("Segment ID required for batch approve", 400);
  }

  // =========================================
  // Step 1: Fetch all drafts
  // =========================================
  let draftsQuery = supabase
    .from(draftTable)
    .select("*")
    .in("id", draftIds)
    .eq("project_id", projectId);

  if (segmentId) {
    draftsQuery = draftsQuery.eq("segment_id", segmentId);
  }

  const { data: drafts, error: draftsError } = await draftsQuery;

  if (draftsError || !drafts || drafts.length === 0) {
    console.error(`[approve-utils] Drafts not found:`, draftsError?.message);
    throw new ApiError("Drafts not found", 404);
  }

  console.log(`[approve-utils] Found ${drafts.length} drafts to approve`);

  // =========================================
  // Step 2: Get existing records for history
  // =========================================
  let existingQuery = supabase
    .from(approvedTable)
    .select("*")
    .eq("project_id", projectId);

  if (segmentId) {
    existingQuery = existingQuery.eq("segment_id", segmentId);
  }

  const { data: existingRecords } = await existingQuery;
  const existingCount = existingRecords?.length || 0;

  console.log(`[approve-utils] Found ${existingCount} existing records`);

  // =========================================
  // Step 3: Delete existing records
  // =========================================
  let deleteQuery = supabase
    .from(approvedTable)
    .delete()
    .eq("project_id", projectId);

  if (segmentId) {
    deleteQuery = deleteQuery.eq("segment_id", segmentId);
  }

  const { error: deleteError } = await deleteQuery;

  if (deleteError) {
    console.warn(`[approve-utils] Delete warning:`, deleteError.message);
    // Continue anyway - UNIQUE constraint will catch any issues
  }

  // =========================================
  // Step 4: Prepare batch insert data
  // =========================================
  const recordsToInsert = drafts.map((draft) => {
    const record: Record<string, unknown> = {
      project_id: projectId,
      approved_at: new Date().toISOString(),
    };

    if (segmentId) {
      record.segment_id = segmentId;
    }

    // Copy specified fields from draft
    for (const field of fields) {
      if (draft[field] !== undefined) {
        record[field] = draft[field];
      }
    }

    return record;
  });

  console.log(`[approve-utils] Prepared ${recordsToInsert.length} records for insert`);

  // =========================================
  // Step 5: Batch insert
  // =========================================
  const { data: inserted, error: insertError } = await supabase
    .from(approvedTable)
    .insert(recordsToInsert)
    .select();

  const errors: Array<{ draftId: string; error: string }> = [];

  if (insertError) {
    console.error(`[approve-utils] Batch insert error:`, insertError);
    errors.push({ draftId: "batch", error: insertError.message });
  }

  const approved = inserted || [];

  console.log(`[approve-utils] Inserted ${approved.length} records`);

  // =========================================
  // Step 6: Record history for batch operation
  // =========================================
  if (trackHistory && approved.length > 0) {
    const historyId = await recordHistory(
      supabase,
      approvedTable,
      approved[0]?.id || "batch",
      projectId,
      segmentId || null,
      "UPSERT",
      existingRecords ? { records: existingRecords, count: existingCount } : null,
      { records: approved, count: approved.length },
      userId
    );
    console.log(`[approve-utils] Recorded UPSERT history: ${historyId}`);
  }

  // =========================================
  // Step 7: Cleanup drafts
  // =========================================
  console.log(`[approve-utils] Cleaning up ${draftIds.length} drafts`);
  const { error: cleanupError } = await supabase
    .from(draftTable)
    .delete()
    .in("id", draftIds);

  if (cleanupError) {
    console.warn(`[approve-utils] Cleanup warning:`, cleanupError.message);
  }

  console.log(`[approve-utils] Batch approve complete. Inserted: ${approved.length}, Errors: ${errors.length}`);

  return {
    success: errors.length === 0,
    approved,
    updated: existingCount,
    inserted: approved.length,
    errors,
  };
}

// =====================================================
// Pre-configured Approve Configs
// =====================================================

export const APPROVE_CONFIGS = {
  // =========================================
  // Per-project tables (one record per project)
  // =========================================

  portraitFinal: {
    draftTable: "portrait_final_drafts",
    approvedTable: "portrait_final",
    scope: "project" as ApproveScope,
    fields: [
      "sociodemographics",
      "psychographics",
      "age_range",
      "gender_distribution",
      "income_level",
      "education",
      "location",
      "occupation",
      "family_status",
      "values_beliefs",
      "lifestyle_habits",
      "interests_hobbies",
      "personality_traits",
    ],
    cleanupDrafts: true,
    trackHistory: true,
  },

  // =========================================
  // Per-segment tables (one record per segment)
  // =========================================

  jobs: {
    draftTable: "jobs_drafts",
    approvedTable: "jobs",
    scope: "segment" as ApproveScope,
    fields: ["functional_jobs", "emotional_jobs", "social_jobs"],
    cleanupDrafts: true,
    trackHistory: true,
  },

  preferences: {
    draftTable: "preferences_drafts",
    approvedTable: "preferences",
    scope: "segment" as ApproveScope,
    fields: ["preferences"],
    cleanupDrafts: true,
    trackHistory: true,
  },

  difficulties: {
    draftTable: "difficulties_drafts",
    approvedTable: "difficulties",
    scope: "segment" as ApproveScope,
    fields: ["difficulties"],
    cleanupDrafts: true,
    trackHistory: true,
  },

  triggers: {
    draftTable: "triggers_drafts",
    approvedTable: "triggers",
    scope: "segment" as ApproveScope,
    fields: ["triggers"],
    cleanupDrafts: true,
    trackHistory: true,
  },

  // =========================================
  // Per-segment tables (multiple records - use batch)
  // =========================================

  pains: {
    draftTable: "pains_drafts",
    approvedTable: "pains_initial",
    scope: "segment" as ApproveScope,
    fields: ["pain_index", "name", "description", "deep_triggers", "examples"],
    cleanupDrafts: true,
    trackHistory: true,
  },

  // =========================================
  // Per-pain tables (one record per pain)
  // UPDATED: painsRanking changed from "segment" to "pain" scope
  // =========================================

  painsRanking: {
    draftTable: "pains_ranking_drafts",
    approvedTable: "pains_ranking",
    scope: "pain" as ApproveScope, // CHANGED: was "segment", now "pain"
    fields: ["pain_id", "impact_score", "is_top_pain", "ranking_reasoning"],
    cleanupDrafts: true,
    trackHistory: true,
  },

  canvas: {
    draftTable: "canvas_drafts",
    approvedTable: "canvas",
    scope: "pain" as ApproveScope,
    fields: ["pain_id", "emotional_aspects", "behavioral_patterns", "buying_signals"],
    cleanupDrafts: true,
    trackHistory: true,
  },

  canvasExtended: {
    draftTable: "canvas_extended_drafts",
    approvedTable: "canvas_extended",
    scope: "pain" as ApproveScope,
    fields: [
      "pain_id",
      "customer_journey",
      "emotional_map",
      "narrative_angles",
      "messaging_framework",
      "voice_and_tone",
    ],
    cleanupDrafts: true,
    trackHistory: true,
  },

  // =========================================
  // V5 Strategic Tables (one record per segment)
  // =========================================

  channelStrategy: {
    draftTable: "channel_strategy_drafts",
    approvedTable: "channel_strategy",
    scope: "segment" as ApproveScope,
    fields: [
      "primary_platforms",
      "content_preferences",
      "trusted_sources",
      "communities",
      "search_patterns",
      "advertising_response",
    ],
    cleanupDrafts: true,
    trackHistory: true,
  },

  competitiveIntelligence: {
    draftTable: "competitive_intelligence_drafts",
    approvedTable: "competitive_intelligence",
    scope: "segment" as ApproveScope,
    fields: [
      "alternatives_tried",
      "current_workarounds",
      "vs_competitors",
      "switching_barriers",
      "evaluation_process",
      "category_beliefs",
    ],
    cleanupDrafts: true,
    trackHistory: true,
  },

  pricingPsychology: {
    draftTable: "pricing_psychology_drafts",
    approvedTable: "pricing_psychology",
    scope: "segment" as ApproveScope,
    fields: [
      "budget_context",
      "price_perception",
      "value_anchors",
      "willingness_to_pay_signals",
      "payment_psychology",
      "roi_calculation",
      "pricing_objections",
      "discount_sensitivity",
      "budget_triggers",
    ],
    cleanupDrafts: true,
    trackHistory: true,
  },

  trustFramework: {
    draftTable: "trust_framework_drafts",
    approvedTable: "trust_framework",
    scope: "segment" as ApproveScope,
    fields: [
      "baseline_trust",
      "proof_hierarchy",
      "trusted_authorities",
      "social_proof",
      "transparency_needs",
      "trust_killers",
      "credibility_markers",
      "risk_reduction",
      "trust_journey",
    ],
    cleanupDrafts: true,
    trackHistory: true,
  },

  jtbdContext: {
    draftTable: "jtbd_context_drafts",
    approvedTable: "jtbd_context",
    scope: "segment" as ApproveScope,
    fields: [
      "job_contexts",
      "job_priority_ranking",
      "job_dependencies",
    ],
    cleanupDrafts: true,
    trackHistory: true,
  },

  // =========================================
  // V6 Strategy Tables
  // =========================================

  strategySummary: {
    draftTable: "strategy_summary_drafts",
    approvedTable: "strategy_summary",
    scope: "project" as ApproveScope,
    fields: [
      "growth_bets",
      "positioning_pillars",
      "channel_priorities",
      "risk_flags",
    ],
    cleanupDrafts: true,
    trackHistory: true,
  },

  strategyPersonalized: {
    draftTable: "strategy_personalized_drafts",
    approvedTable: "strategy_personalized",
    scope: "pain" as ApproveScope,
    fields: [
      "tof_ugc_hooks",
      "mof_quiz_flow",
      "mof_chat_script",
      "bof_creative_briefs",
      "bof_landing_structure",
    ],
    cleanupDrafts: true,
    trackHistory: true,
  },

  strategyGlobal: {
    draftTable: "strategy_global_drafts",
    approvedTable: "strategy_global",
    scope: "project" as ApproveScope,
    fields: [
      "email_strategy",
      "sms_strategy",
      "messenger_strategy",
      "social_strategy",
      "tof_banners",
      "traffic_channels",
    ],
    cleanupDrafts: true,
    trackHistory: true,
  },

  strategyAds: {
    draftTable: "strategy_ads_drafts",
    approvedTable: "strategy_ads",
    scope: "pain" as ApproveScope,
    fields: ["channels"],
    cleanupDrafts: true,
    trackHistory: true,
  },

  // =========================================
  // V6 UGC Creator Tables
  // =========================================

  ugcCreatorProfiles: {
    draftTable: "ugc_creator_profiles_drafts",
    approvedTable: "ugc_creator_profiles",
    scope: "segment" as ApproveScope,
    fields: [
      "ideal_persona",
      "content_topics",
      "sourcing_guidance",
    ],
    cleanupDrafts: true,
    trackHistory: true,
  },

  // =========================================
  // V6 Communications Tables
  // =========================================

  communicationsFunnel: {
    draftTable: "communications_funnel_drafts",
    approvedTable: "communications_funnel",
    scope: "pain" as ApproveScope,
    fields: [
      "organic_rhythm",
      "conversation_funnel",
      "chatbot_scripts",
    ],
    cleanupDrafts: true,
    trackHistory: true,
  },

  // =========================================
  // V7 Insights Tables
  // =========================================

  insightsExecutive: {
    draftTable: "insights_executive_drafts",
    approvedTable: "insights_executive",
    scope: "project" as ApproveScope,
    fields: [
      "growth_bets",
      "segment_priorities",
      "positioning_summary",
      "validation_questions",
      "evidence_sources",
      "validation_metrics",
    ],
    cleanupDrafts: true,
    trackHistory: true,
  },

  insightsSnapshots: {
    draftTable: "insights_snapshots_drafts",
    approvedTable: "insights_snapshots",
    scope: "segment" as ApproveScope,
    fields: [
      "who",
      "what",
      "why",
      "when_active",
      "top_pains",
      "adoption_barriers",
      "evidence_sources",
      "validation_metrics",
    ],
    cleanupDrafts: true,
    trackHistory: true,
  },

  insightsRadar: {
    draftTable: "insights_radar_drafts",
    approvedTable: "insights_radar",
    scope: "project" as ApproveScope,
    fields: [
      "jobs_vs_benefits_gap",
      "triggers_vs_timeline",
      "risk_alerts",
      "evidence_sources",
      "validation_metrics",
    ],
    cleanupDrafts: true,
    trackHistory: true,
  },

  // =========================================
  // V7 Playbooks Tables
  // =========================================

  playbooksCanvas: {
    draftTable: "playbooks_canvas_drafts",
    approvedTable: "playbooks_canvas",
    scope: "pain" as ApproveScope,
    fields: [
      "hero_section",
      "insight_section",
      "ritual_section",
      "proof_section",
      "cta_section",
    ],
    cleanupDrafts: true,
    trackHistory: true,
  },

  playbooksFunnel: {
    draftTable: "playbooks_funnel_drafts",
    approvedTable: "playbooks_funnel",
    scope: "pain" as ApproveScope,
    fields: [
      "tof_assets",
      "mof_assets",
      "bof_assets",
    ],
    cleanupDrafts: true,
    trackHistory: true,
  },
};

// =====================================================
// Batch Approve by Pain ID (Upsert Pattern)
// Use for: canvas, canvas_extended (multiple records per segment, unique by pain_id)
// =====================================================

/**
 * Approves multiple draft records with upsert by pain_id logic:
 * 1. Fetches all drafts by IDs
 * 2. For each draft, check if approved record exists by pain_id
 * 3. If exists: UPDATE with new data
 * 4. If not exists: INSERT new record
 * 5. Records history for audit
 * 6. Cleans up drafts
 */
export async function approveBatchByPain(
  config: ApproveConfig,
  params: ApproveBatchParams
): Promise<ApproveBatchResult> {
  const { supabase, projectId, draftIds, segmentId, userId } = params;
  const {
    draftTable,
    approvedTable,
    fields,
    trackHistory = true,
  } = config;

  console.log(`[approve-utils] Starting batch-by-pain approve for ${approvedTable}`);
  console.log(`[approve-utils] Project: ${projectId}, Segment: ${segmentId}, Drafts: ${draftIds.length}`);

  if (!segmentId) {
    throw new ApiError("Segment ID required for batch-by-pain approve", 400);
  }

  // =========================================
  // Step 1: Fetch all drafts
  // =========================================
  const { data: drafts, error: draftsError } = await supabase
    .from(draftTable)
    .select("*")
    .in("id", draftIds)
    .eq("segment_id", segmentId);

  if (draftsError || !drafts || drafts.length === 0) {
    console.error(`[approve-utils] Drafts not found:`, draftsError?.message);
    throw new ApiError("Drafts not found", 404);
  }

  console.log(`[approve-utils] Found ${drafts.length} drafts to approve`);

  // =========================================
  // Step 2: Get existing records by pain_id
  // =========================================
  const painIds = drafts.map(d => d.pain_id).filter(Boolean);

  const { data: existingRecords } = await supabase
    .from(approvedTable)
    .select("*")
    .eq("project_id", projectId)
    .eq("segment_id", segmentId)
    .in("pain_id", painIds);

  const existingByPainId = new Map(
    (existingRecords || []).map(r => [r.pain_id, r])
  );

  console.log(`[approve-utils] Found ${existingByPainId.size} existing records`);

  // =========================================
  // Step 3: Process each draft (upsert by pain_id)
  // =========================================
  const approved: Record<string, unknown>[] = [];
  const errors: Array<{ draftId: string; error: string }> = [];
  let updatedCount = 0;
  let insertedCount = 0;

  for (const draft of drafts) {
    try {
      const painId = draft.pain_id;
      if (!painId) {
        errors.push({ draftId: draft.id, error: "Missing pain_id in draft" });
        continue;
      }

      // Build record data
      const recordData: Record<string, unknown> = {
        project_id: projectId,
        segment_id: segmentId,
        pain_id: painId,
        approved_at: new Date().toISOString(),
      };

      // Copy specified fields from draft
      for (const field of fields) {
        if (draft[field] !== undefined && field !== "pain_id") {
          recordData[field] = draft[field];
        }
      }

      const existing = existingByPainId.get(painId);

      if (existing) {
        // UPDATE existing record
        const { data: updated, error: updateError } = await supabase
          .from(approvedTable)
          .update(recordData)
          .eq("id", existing.id)
          .select()
          .single();

        if (updateError) {
          errors.push({ draftId: draft.id, error: updateError.message });
        } else {
          approved.push(updated);
          updatedCount++;

          // Record history
          if (trackHistory) {
            await recordHistory(
              supabase,
              approvedTable,
              existing.id,
              projectId,
              segmentId,
              "UPDATE",
              existing,
              recordData,
              userId
            );
          }
        }
      } else {
        // INSERT new record
        const { data: inserted, error: insertError } = await supabase
          .from(approvedTable)
          .insert(recordData)
          .select()
          .single();

        if (insertError) {
          errors.push({ draftId: draft.id, error: insertError.message });
        } else {
          approved.push(inserted);
          insertedCount++;

          // Record history
          if (trackHistory) {
            await recordHistory(
              supabase,
              approvedTable,
              inserted.id,
              projectId,
              segmentId,
              "INSERT",
              null,
              recordData,
              userId
            );
          }
        }
      }
    } catch (e) {
      errors.push({ draftId: draft.id, error: String(e) });
    }
  }

  // =========================================
  // Step 4: Cleanup processed drafts
  // =========================================
  const approvedDraftIds = drafts
    .filter(d => !errors.some(e => e.draftId === d.id))
    .map(d => d.id);

  if (approvedDraftIds.length > 0) {
    console.log(`[approve-utils] Cleaning up ${approvedDraftIds.length} drafts`);
    await supabase
      .from(draftTable)
      .delete()
      .in("id", approvedDraftIds);
  }

  console.log(`[approve-utils] Batch-by-pain complete. Updated: ${updatedCount}, Inserted: ${insertedCount}, Errors: ${errors.length}`);

  return {
    success: errors.length === 0,
    approved,
    updated: updatedCount,
    inserted: insertedCount,
    errors,
  };
}

// =====================================================
// Helper: Get config by table name
// =====================================================

export function getApproveConfig(tableName: string): ApproveConfig | undefined {
  const configMap: Record<string, ApproveConfig> = {
    portrait_final: APPROVE_CONFIGS.portraitFinal,
    jobs: APPROVE_CONFIGS.jobs,
    preferences: APPROVE_CONFIGS.preferences,
    difficulties: APPROVE_CONFIGS.difficulties,
    triggers: APPROVE_CONFIGS.triggers,
    pains_initial: APPROVE_CONFIGS.pains,
    pains_ranking: APPROVE_CONFIGS.painsRanking,
    canvas: APPROVE_CONFIGS.canvas,
    canvas_extended: APPROVE_CONFIGS.canvasExtended,
    channel_strategy: APPROVE_CONFIGS.channelStrategy,
    competitive_intelligence: APPROVE_CONFIGS.competitiveIntelligence,
    pricing_psychology: APPROVE_CONFIGS.pricingPsychology,
    trust_framework: APPROVE_CONFIGS.trustFramework,
    jtbd_context: APPROVE_CONFIGS.jtbdContext,
    // V6 Strategy tables
    strategy_summary: APPROVE_CONFIGS.strategySummary,
    strategy_personalized: APPROVE_CONFIGS.strategyPersonalized,
    strategy_global: APPROVE_CONFIGS.strategyGlobal,
    strategy_ads: APPROVE_CONFIGS.strategyAds,
    // V6 UGC Creator tables
    ugc_creator_profiles: APPROVE_CONFIGS.ugcCreatorProfiles,
    // V6 Communications tables
    communications_funnel: APPROVE_CONFIGS.communicationsFunnel,
    // V7 Insights tables
    insights_executive: APPROVE_CONFIGS.insightsExecutive,
    insights_snapshots: APPROVE_CONFIGS.insightsSnapshots,
    insights_radar: APPROVE_CONFIGS.insightsRadar,
    // V7 Playbooks tables
    playbooks_canvas: APPROVE_CONFIGS.playbooksCanvas,
    playbooks_funnel: APPROVE_CONFIGS.playbooksFunnel,
  };

  return configMap[tableName];
}
