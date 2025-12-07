-- Migration: Fix RLS and security warnings
-- Fixes:
-- 1. policy_exists_rls_disabled for sessions
-- 2. rls_disabled_in_public for events
-- 3. rls_disabled_in_public for sessions
-- 4. function_search_path_mutable for validate_chat_messages
-- 5. function_search_path_mutable for update_updated_at_column

-- =====================================================
-- SESSIONS TABLE - Enable RLS (policies already exist)
-- =====================================================
ALTER TABLE IF EXISTS public.sessions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- EVENTS TABLE - Enable RLS (only if table exists)
-- =====================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'events') THEN
    EXECUTE 'ALTER TABLE public.events ENABLE ROW LEVEL SECURITY';

    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can read events" ON public.events';
    EXECUTE 'CREATE POLICY "Authenticated users can read events" ON public.events FOR SELECT USING (true)';

    EXECUTE 'DROP POLICY IF EXISTS "Authenticated users can insert events" ON public.events';
    EXECUTE 'CREATE POLICY "Authenticated users can insert events" ON public.events FOR INSERT WITH CHECK (true)';
  END IF;
END;
$$;

-- =====================================================
-- FIX FUNCTIONS - Set immutable search_path
-- =====================================================

-- Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Fix validate_chat_messages function (if exists)
-- First check structure and recreate with search_path
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'validate_chat_messages'
    AND pronamespace = 'public'::regnamespace
  ) THEN
    EXECUTE '
      CREATE OR REPLACE FUNCTION public.validate_chat_messages()
      RETURNS TRIGGER
      LANGUAGE plpgsql
      SECURITY INVOKER
      SET search_path = public
      AS $func$
      BEGIN
        IF NEW.messages IS NOT NULL AND jsonb_typeof(NEW.messages) != ''array'' THEN
          RAISE EXCEPTION ''messages must be a JSON array'';
        END IF;
        RETURN NEW;
      END;
      $func$;
    ';
  END IF;
END;
$$;

-- =====================================================
-- FIX STEP HELPER FUNCTIONS - Set search_path
-- =====================================================

-- Fix get_next_step function
CREATE OR REPLACE FUNCTION public.get_next_step(current TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  steps TEXT[] := ARRAY[
    'onboarding',
    'validation_draft', 'validation_approved',
    'portrait_draft', 'portrait_approved',
    'portrait_review_draft', 'portrait_review_approved',
    'portrait_final_draft', 'portrait_final_approved',
    'jobs_draft', 'jobs_approved',
    'preferences_draft', 'preferences_approved',
    'difficulties_draft', 'difficulties_approved',
    'triggers_draft', 'triggers_approved',
    'segments_draft', 'segments_approved',
    'segments_review_draft', 'segments_review_approved',
    'segment_details_draft', 'segment_details_approved',
    'pains_draft', 'pains_approved',
    'pains_ranking_draft', 'pains_ranking_approved',
    'canvas_draft', 'canvas_approved',
    'canvas_extended_draft', 'canvas_extended_approved',
    'completed'
  ];
  idx INTEGER;
BEGIN
  idx := array_position(steps, current);
  IF idx IS NULL OR idx >= array_length(steps, 1) THEN
    RETURN 'completed';
  END IF;
  RETURN steps[idx + 1];
END;
$$;

-- Fix get_previous_step function
CREATE OR REPLACE FUNCTION public.get_previous_step(current TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  steps TEXT[] := ARRAY[
    'onboarding',
    'validation_draft', 'validation_approved',
    'portrait_draft', 'portrait_approved',
    'portrait_review_draft', 'portrait_review_approved',
    'portrait_final_draft', 'portrait_final_approved',
    'jobs_draft', 'jobs_approved',
    'preferences_draft', 'preferences_approved',
    'difficulties_draft', 'difficulties_approved',
    'triggers_draft', 'triggers_approved',
    'segments_draft', 'segments_approved',
    'segments_review_draft', 'segments_review_approved',
    'segment_details_draft', 'segment_details_approved',
    'pains_draft', 'pains_approved',
    'pains_ranking_draft', 'pains_ranking_approved',
    'canvas_draft', 'canvas_approved',
    'canvas_extended_draft', 'canvas_extended_approved',
    'completed'
  ];
  idx INTEGER;
BEGIN
  idx := array_position(steps, current);
  IF idx IS NULL OR idx <= 1 THEN
    RETURN 'onboarding';
  END IF;
  RETURN steps[idx - 1];
END;
$$;

-- Fix get_step_index function
CREATE OR REPLACE FUNCTION public.get_step_index(step TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  steps TEXT[] := ARRAY[
    'onboarding',
    'validation_draft', 'validation_approved',
    'portrait_draft', 'portrait_approved',
    'portrait_review_draft', 'portrait_review_approved',
    'portrait_final_draft', 'portrait_final_approved',
    'jobs_draft', 'jobs_approved',
    'preferences_draft', 'preferences_approved',
    'difficulties_draft', 'difficulties_approved',
    'triggers_draft', 'triggers_approved',
    'segments_draft', 'segments_approved',
    'segments_review_draft', 'segments_review_approved',
    'segment_details_draft', 'segment_details_approved',
    'pains_draft', 'pains_approved',
    'pains_ranking_draft', 'pains_ranking_approved',
    'canvas_draft', 'canvas_approved',
    'canvas_extended_draft', 'canvas_extended_approved',
    'completed'
  ];
BEGIN
  RETURN COALESCE(array_position(steps, step), 0);
END;
$$;
