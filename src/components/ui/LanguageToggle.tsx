"use client";

import { useState } from 'react';
import { Globe, ChevronDown, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ContentLanguage, LANGUAGE_LABELS } from '@/types';

interface LanguageToggleProps {
  currentLanguage: ContentLanguage;
  onLanguageChange: (language: ContentLanguage) => void;
  isLoading?: boolean;
  className?: string;
}

export function LanguageToggle({
  currentLanguage,
  onLanguageChange,
  isLoading,
  className,
}: LanguageToggleProps) {
  const [isOpen, setIsOpen] = useState(false);

  const languages = Object.entries(LANGUAGE_LABELS) as [ContentLanguage, string][];

  return (
    <div className={cn("relative", className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-xl",
          "bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50",
          "shadow-sm transition-all duration-200",
          "text-sm font-medium text-slate-700"
        )}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Globe className="w-4 h-4" />
        )}
        <span>{LANGUAGE_LABELS[currentLanguage]}</span>
        <ChevronDown className={cn(
          "w-4 h-4 transition-transform",
          isOpen && "rotate-180"
        )} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
            {languages.map(([code, label]) => (
              <button
                key={code}
                onClick={() => {
                  onLanguageChange(code);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-2.5 text-sm",
                  "hover:bg-blue-50 transition-colors",
                  currentLanguage === code
                    ? "text-blue-600 font-medium bg-blue-50"
                    : "text-slate-700"
                )}
              >
                <span className="flex items-center gap-2">
                  {label}
                </span>
                {currentLanguage === code && <Check className="w-4 h-4 text-blue-600" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
