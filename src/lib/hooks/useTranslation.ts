"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { ContentLanguage } from '@/types';

// Cache key prefix
const CACHE_PREFIX = 'translation_cache_';
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

// Generate hash for content
function hashContent(content: unknown): string {
  const str = JSON.stringify(content);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

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
      setTranslatedContent(null); // null means "use original content"
      return;
    }

    const cacheKey = `${CACHE_PREFIX}${contentHash}_${language}`;

    // Check localStorage cache
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const { translated, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_TTL) {
          setTranslatedContent(translated);
          return;
        }
      }
    } catch {
      // localStorage might be unavailable
    }

    // Fetch translation from API
    setIsTranslating(true);
    setError(null);

    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: currentContent, targetLanguage: language }),
      });

      if (!res.ok) {
        throw new Error('Translation failed');
      }

      const data = await res.json();

      // Cache the result
      try {
        localStorage.setItem(cacheKey, JSON.stringify({
          translated: data.translated,
          timestamp: Date.now(),
        }));
      } catch {
        // localStorage might be full or unavailable
      }

      setTranslatedContent(data.translated);
    } catch (err) {
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
