"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ContentLanguage } from '@/types';

interface LanguageContextType {
  language: ContentLanguage;
  setLanguage: (lang: ContentLanguage) => void;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<ContentLanguage>('en');
  const [isLoading, setIsLoading] = useState(true);

  // Load preference on mount
  useEffect(() => {
    async function loadPreference() {
      try {
        const res = await fetch('/api/user/preferences');
        if (res.ok) {
          const data = await res.json();
          if (data.preferences?.preferred_language) {
            setLanguageState(data.preferences.preferred_language);
          }
        }
      } catch (err) {
        console.error('Failed to load language preference:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadPreference();
  }, []);

  const setLanguage = async (lang: ContentLanguage) => {
    setLanguageState(lang);

    // Save to backend
    try {
      await fetch('/api/user/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferred_language: lang }),
      });
    } catch (err) {
      console.error('Failed to save language preference:', err);
    }
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, isLoading }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
