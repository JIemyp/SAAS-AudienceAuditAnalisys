// User Preferences API - Language and other settings
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { handleApiError, ApiError } from "@/lib/api-utils";

// GET - Fetch user preferences
export async function GET() {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new ApiError("Unauthorized", 401);

    const { data: preferences } = await supabase
      .from("user_preferences")
      .select("*")
      .eq("user_id", user.id)
      .single();

    // Return defaults if no preferences exist
    return NextResponse.json({
      success: true,
      preferences: preferences || { preferred_language: 'en' }
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// PATCH - Update user preferences
export async function PATCH(request: NextRequest) {
  try {
    const updates = await request.json();

    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new ApiError("Unauthorized", 401);

    // First check if record exists
    const { data: existing } = await supabase
      .from("user_preferences")
      .select("id")
      .eq("user_id", user.id)
      .single();

    let data;
    let error;

    if (existing) {
      // Update existing record
      const result = await supabase
        .from("user_preferences")
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq("user_id", user.id)
        .select()
        .single();
      data = result.data;
      error = result.error;
    } else {
      // Insert new record
      const result = await supabase
        .from("user_preferences")
        .insert({
          user_id: user.id,
          ...updates,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      data = result.data;
      error = result.error;
    }

    if (error) throw new ApiError(error.message, 500);

    return NextResponse.json({ success: true, preferences: data });
  } catch (error) {
    return handleApiError(error);
  }
}
