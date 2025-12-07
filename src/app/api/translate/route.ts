// Translate content using DeepL Free API with Google Translate fallback
// DeepL: 500,000 chars/month free, better quality
// Google: unlimited free fallback via @vitalets/google-translate-api
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { handleApiError, ApiError } from "@/lib/api-utils";
import { ContentLanguage } from "@/types";
import * as deepl from "deepl-node";
import { translate as googleTranslate } from "@vitalets/google-translate-api";

// Language codes mapping
const DEEPL_LANG_CODES: Record<ContentLanguage, deepl.TargetLanguageCode> = {
  en: "en-US",
  ru: "ru",
  uk: "uk",
  de: "de",
  es: "es",
  fr: "fr",
};

const GOOGLE_LANG_CODES: Record<ContentLanguage, string> = {
  en: "en",
  ru: "ru",
  uk: "uk",
  de: "de",
  es: "es",
  fr: "fr",
};

// DeepL client (lazy init)
let deeplClient: deepl.Translator | null = null;
function getDeeplClient(): deepl.Translator | null {
  if (!process.env.DEEPL_API_KEY) return null;
  if (!deeplClient) {
    deeplClient = new deepl.Translator(process.env.DEEPL_API_KEY);
  }
  return deeplClient;
}

// Batch translate with DeepL (much faster - single API call)
async function batchTranslateDeepL(
  texts: string[],
  targetLang: deepl.TargetLanguageCode
): Promise<string[] | null> {
  const client = getDeeplClient();
  if (!client || texts.length === 0) return null;

  try {
    const results = await client.translateText(texts, null, targetLang) as deepl.TextResult | deepl.TextResult[];
    if (Array.isArray(results)) {
      return results.map((r: deepl.TextResult) => r.text);
    }
    return [(results as deepl.TextResult).text];
  } catch (err: unknown) {
    const error = err as Error & { code?: string };
    if (error.message?.includes("456") || error.message?.includes("quota")) {
      console.log("[Translate] DeepL quota exceeded, will use Google fallback");
      return null;
    }
    console.error("[Translate] DeepL batch error:", error.message);
    return null;
  }
}

// Batch translate with Google (parallel requests, limited concurrency)
async function batchTranslateGoogle(
  texts: string[],
  targetLang: string
): Promise<string[]> {
  const BATCH_SIZE = 10; // Translate 10 strings in parallel
  const results: string[] = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map(async (text) => {
        if (!text.trim()) return text;
        try {
          const result = await googleTranslate(text, { to: targetLang });
          return result.text;
        } catch {
          return text; // Return original on error
        }
      })
    );
    results.push(...batchResults);
  }

  return results;
}

// Extract all strings from object with their paths
function extractStrings(obj: unknown, path: string[] = []): Array<{ path: string[]; value: string }> {
  const strings: Array<{ path: string[]; value: string }> = [];

  if (typeof obj === "string" && obj.trim()) {
    strings.push({ path, value: obj });
  } else if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      strings.push(...extractStrings(item, [...path, String(index)]));
    });
  } else if (obj !== null && typeof obj === "object") {
    for (const [key, value] of Object.entries(obj)) {
      // Skip translating IDs, timestamps, and other non-translatable fields
      if (['id', 'project_id', 'segment_id', 'pain_id', 'canvas_id', 'user_id',
           'created_at', 'updated_at', 'approved_at', 'version', 'order_index',
           'impact_score', 'is_top_pain', 'pain_index', 'segment_index'].includes(key)) {
        continue;
      }
      strings.push(...extractStrings(value, [...path, key]));
    }
  }

  return strings;
}

// Set value at path in object
function setAtPath(obj: unknown, path: string[], value: string): unknown {
  if (path.length === 0) return value;

  const result = Array.isArray(obj) ? [...obj] : { ...(obj as object) };
  const [key, ...rest] = path;

  if (Array.isArray(result)) {
    const index = parseInt(key, 10);
    result[index] = setAtPath(result[index], rest, value);
  } else {
    (result as Record<string, unknown>)[key] = setAtPath(
      (result as Record<string, unknown>)[key],
      rest,
      value
    );
  }

  return result;
}

// Fast batch translation - extracts all strings, translates in one call, rebuilds object
async function translateObjectFast(
  obj: unknown,
  deeplLang: deepl.TargetLanguageCode,
  googleLang: string
): Promise<unknown> {
  // Extract all translatable strings
  const strings = extractStrings(obj);
  if (strings.length === 0) return obj;

  console.log(`[Translate] Found ${strings.length} strings to translate`);

  const textsToTranslate = strings.map(s => s.value);

  // Try DeepL batch first (single API call for all strings!)
  let translated = await batchTranslateDeepL(textsToTranslate, deeplLang);

  // Fallback to Google if DeepL fails
  if (!translated) {
    console.log("[Translate] Using Google batch fallback");
    translated = await batchTranslateGoogle(textsToTranslate, googleLang);
  }

  // Rebuild object with translated strings
  let result = obj;
  for (let i = 0; i < strings.length; i++) {
    result = setAtPath(result, strings[i].path, translated[i]);
  }

  return result;
}

export async function POST(request: NextRequest) {
  try {
    const { content, targetLanguage } = (await request.json()) as {
      content: string | object;
      targetLanguage: ContentLanguage;
    };

    if (!content || !targetLanguage) {
      throw new ApiError("Content and target language required", 400);
    }

    const supabase = await createServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) throw new ApiError("Unauthorized", 401);

    // Skip translation if already English
    if (targetLanguage === "en") {
      return NextResponse.json({ success: true, translated: content });
    }

    const deeplLang = DEEPL_LANG_CODES[targetLanguage];
    const googleLang = GOOGLE_LANG_CODES[targetLanguage];

    if (!deeplLang || !googleLang) {
      throw new ApiError(`Unsupported language: ${targetLanguage}`, 400);
    }

    const hasDeepL = !!process.env.DEEPL_API_KEY;
    console.log(
      `[Translate] Starting translation to ${targetLanguage} (DeepL: ${hasDeepL ? "enabled" : "disabled"})`
    );

    const startTime = Date.now();
    const translated = await translateObjectFast(content, deeplLang, googleLang);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log(`[Translate] Completed in ${elapsed}s (FREE - no Claude tokens used)`);

    return NextResponse.json({ success: true, translated });
  } catch (error) {
    return handleApiError(error);
  }
}
