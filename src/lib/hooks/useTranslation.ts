"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { ContentLanguage } from '@/types';

// Cache key prefix - increment version to invalidate old cached translations
const CACHE_VERSION = 'v2'; // v2: fixed enum field translation (importance, frequency)
const CACHE_PREFIX = `translation_cache_${CACHE_VERSION}_`;
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

interface UseTranslationOptions {
  content: unknown;
  language: ContentLanguage;
  enabled?: boolean;
}

export function useTranslation({ content, language, enabled = true }: UseTranslationOptions) {
  // Use null to indicate "not yet translated" - original content will be used as fallback
  const [translatedContent, setTranslatedContent] = useState<unknown>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use content hash as stable dependency instead of content object
  // JSON.stringify to get stable comparison - string is primitive so safe to use in deps
  const contentStr = JSON.stringify(content);
  const contentHash = useMemo(() => {
    if (!contentStr || contentStr === 'null' || contentStr === 'undefined') return '';
    let hash = 0;
    for (let i = 0; i < contentStr.length; i++) {
      const char = contentStr.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }, [contentStr]);

  // Keep current content in ref to avoid stale closure
  const contentRef = useRef(content);
  contentRef.current = content;

  const translate = useCallback(async () => {
    const currentContent = contentRef.current;

    // Skip if disabled or English or no content
    if (!enabled || language === 'en' || !currentContent || !contentHash) {
      console.log('[useTranslation] Skipping translation:', { enabled, language, hasContent: !!currentContent, contentHash });
      setTranslatedContent(null); // null means "use original content"
      return;
    }

    const cacheKey = `${CACHE_PREFIX}${contentHash}_${language}`;
    console.log('[useTranslation] Starting translation:', { language, cacheKey, contentLength: JSON.stringify(currentContent).length });

    // Check localStorage cache
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const { translated, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_TTL) {
          console.log('[useTranslation] Using cached translation:', {
            cacheAge: Math.round((Date.now() - timestamp) / 1000 / 60) + ' minutes',
            sample: Array.isArray(translated) && translated[0]
              ? JSON.stringify(translated[0]).substring(0, 200)
              : 'not array',
          });
          setTranslatedContent(translated);
          return;
        }
        console.log('[useTranslation] Cache expired, fetching new translation');
      }
    } catch (e) {
      console.warn('[useTranslation] localStorage error:', e);
    }

    // Fetch translation from API
    setIsTranslating(true);
    setError(null);

    try {
      console.log('[useTranslation] Calling /api/translate...');
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: currentContent, targetLanguage: language }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error('[useTranslation] API error:', res.status, errorText);
        throw new Error(`Translation failed: ${res.status}`);
      }

      const data = await res.json();
      console.log('[useTranslation] Translation API response:', {
        hasTranslated: !!data.translated,
        translatedType: data.translated ? typeof data.translated : 'null',
        isArray: Array.isArray(data.translated),
        // Show sample of first item if array
        sample: Array.isArray(data.translated) && data.translated[0]
          ? JSON.stringify(data.translated[0]).substring(0, 300)
          : 'not array or empty',
      });

      // Cache the result
      try {
        localStorage.setItem(cacheKey, JSON.stringify({
          translated: data.translated,
          timestamp: Date.now(),
        }));
      } catch (e) {
        console.warn('[useTranslation] Failed to cache:', e);
      }

      setTranslatedContent(data.translated);
    } catch (err) {
      console.error('[useTranslation] Translation error:', err);
      setError(err instanceof Error ? err.message : 'Translation failed');
      setTranslatedContent(null); // null means "use original content" as fallback
    } finally {
      setIsTranslating(false);
    }
  }, [contentHash, language, enabled]); // Use contentHash instead of content

  useEffect(() => {
    translate();
  }, [translate]);

  // Reset when language changes to English
  useEffect(() => {
    if (language === 'en') {
      setTranslatedContent(null);
    }
  }, [language]);

  return {
    translatedContent,
    isTranslating,
    error,
    refetch: translate,
  };
}
