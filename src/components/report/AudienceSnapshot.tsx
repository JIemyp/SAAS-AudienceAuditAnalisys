"use client";

import { Users, MapPin, Briefcase, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface PortraitData {
  age_range?: string;
  gender_distribution?: string;
  income_level?: string;
  location?: string;
  occupation?: string;
  education?: string;
  family_status?: string;
  sociodemographics?: string;
  psychographics?: string;
}

interface AudienceSnapshotProps {
  portrait: PortraitData | null;
  className?: string;
}

export function AudienceSnapshot({ portrait, className }: AudienceSnapshotProps) {
  if (!portrait) {
    return (
      <div className={cn("p-6 bg-slate-50 rounded-2xl border border-slate-200", className)}>
        <p className="text-slate-500 text-center">No portrait data available</p>
      </div>
    );
  }

  // Extract key demographics
  const demographics = [
    { icon: Users, label: "Age", value: portrait.age_range },
    { icon: Users, label: "Gender", value: portrait.gender_distribution },
    { icon: Briefcase, label: "Income", value: portrait.income_level },
    { icon: MapPin, label: "Location", value: portrait.location },
    { icon: Briefcase, label: "Occupation", value: portrait.occupation },
    { icon: Heart, label: "Family", value: portrait.family_status },
  ].filter(d => d.value);

  return (
    <div className={cn("p-6 bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-2xl border border-slate-200", className)}>
      <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
        <Users className="w-5 h-5 text-blue-500" />
        Audience Snapshot
      </h3>

      {/* Key demographics in a row */}
      {demographics.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-4">
          {demographics.map((item, index) => (
            <div
              key={index}
              className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-slate-200 text-sm"
            >
              <item.icon className="w-4 h-4 text-slate-400" />
              <span className="text-slate-500">{item.label}:</span>
              <span className="font-medium text-slate-900">{item.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Sociodemographics summary */}
      {portrait.sociodemographics && (
        <div className="mt-4 pt-4 border-t border-slate-200">
          <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">
            {portrait.sociodemographics}
          </p>
        </div>
      )}
    </div>
  );
}
